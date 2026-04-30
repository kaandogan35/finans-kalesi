<?php
/**
 * ParamGo — FCM Push Notification Helper
 *
 * Firebase Cloud Messaging (FCM) HTTP v1 API üzerinden Android cihazlara
 * push bildirimi gönderir. Service Account JWT tabanlı OAuth2 kimlik doğrulama.
 *
 * Gerekli .env değişkeni:
 *   FCM_SERVICE_ACCOUNT_JSON — Firebase service account JSON'un base64 içeriği
 *                              (Firebase Console → Project Settings → Service Accounts
 *                               → Generate new private key → JSON indir → base64 encode)
 */

class FcmHelper {

    private const PROJECT_ID = 'paramgo-25046';
    private const FCM_URL    = 'https://fcm.googleapis.com/v1/projects/paramgo-25046/messages:send';
    private const TOKEN_URL  = 'https://oauth2.googleapis.com/token';
    private const SCOPE      = 'https://www.googleapis.com/auth/firebase.messaging';

    // OAuth2 access token 55 dakika önbellekte tutulur (Google max 60 dk)
    private static ?string $access_token     = null;
    private static int     $access_token_iat = 0;

    /**
     * Android cihaza push bildirimi gönder
     *
     * @param string $token   FCM device token
     * @param string $baslik  Bildirim başlığı
     * @param string $mesaj   Bildirim içeriği
     * @param array  $extra   Ek veri (opsiyonel, tüm değerler string olmalı)
     * @return bool
     */
    public static function gonder(string $token, string $baslik, string $mesaj, array $extra = []): bool {
        try {
            $access_token = self::access_token_al();
            if (!$access_token) return false;

            $payload = json_encode([
                'message' => [
                    'token'        => $token,
                    'notification' => [
                        'title' => $baslik,
                        'body'  => $mesaj,
                    ],
                    'android' => [
                        'priority'     => 'high',
                        'notification' => [
                            'sound'         => 'default',
                            'channel_id'    => 'paramgo_vade',
                        ],
                    ],
                    'data' => array_map('strval', $extra),
                ],
            ]);

            $ch = curl_init(self::FCM_URL);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 10,
                CURLOPT_HTTPHEADER     => [
                    'Authorization: Bearer ' . $access_token,
                    'Content-Type: application/json',
                ],
            ]);

            $response  = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($http_code === 200) {
                return true;
            }

            // 404 = token geçersiz (cihaz uygulamayı silmiş) → token pasife çek
            if ($http_code === 404) {
                self::token_pasife_cek($token);
            }

            // 401 = token süresi dolmuş → önbelleği temizle, bir sonraki çağrıda yenilenir
            if ($http_code === 401) {
                self::$access_token = null;
            }

            error_log("FCM push hatası HTTP {$http_code}: " . substr($response, 0, 200));
            return false;

        } catch (\Exception $e) {
            error_log("FcmHelper::gonder hata: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Belirli kullanıcının aktif Android token'larına push gönder
     *
     * @return int Başarıyla gönderilen push sayısı
     */
    public static function kullanici_push(int $kullanici_id, string $baslik, string $mesaj, array $extra = []): int {
        try {
            $db = Database::baglan();
            $stmt = $db->prepare("
                SELECT token FROM push_tokens
                WHERE kullanici_id = :kid AND platform = 'android' AND aktif = 1
            ");
            $stmt->execute([':kid' => $kullanici_id]);
            $tokenlar = $stmt->fetchAll(PDO::FETCH_COLUMN);

            $basarili = 0;
            foreach ($tokenlar as $token) {
                if (self::gonder($token, $baslik, $mesaj, $extra)) {
                    $basarili++;
                }
            }
            return $basarili;

        } catch (\Exception $e) {
            error_log("FcmHelper::kullanici_push hata: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Şirketin aktif Android token'larına toplu push gönder
     *
     * @return int Başarıyla gönderilen push sayısı
     */
    public static function sirket_push(int $sirket_id, string $baslik, string $mesaj, array $extra = []): int {
        try {
            $db = Database::baglan();
            $stmt = $db->prepare("
                SELECT token FROM push_tokens
                WHERE sirket_id = :sid AND platform = 'android' AND aktif = 1
            ");
            $stmt->execute([':sid' => $sirket_id]);
            $tokenlar = $stmt->fetchAll(PDO::FETCH_COLUMN);

            $basarili = 0;
            foreach ($tokenlar as $token) {
                if (self::gonder($token, $baslik, $mesaj, $extra)) {
                    $basarili++;
                }
            }
            return $basarili;

        } catch (\Exception $e) {
            error_log("FcmHelper::sirket_push hata: " . $e->getMessage());
            return 0;
        }
    }

    // ─── Private ─────────────────────────────────────────────────────────────

    /**
     * OAuth2 Access Token al (55 dakika önbelleğe alınır)
     *
     * Service account JSON'dan JWT oluşturur, Google'dan access token alır.
     */
    private static function access_token_al(): ?string {
        if (self::$access_token && (time() - self::$access_token_iat) < 3300) {
            return self::$access_token;
        }

        $sa_b64 = env('FCM_SERVICE_ACCOUNT_JSON');
        if (!$sa_b64) {
            error_log("FcmHelper: .env'de FCM_SERVICE_ACCOUNT_JSON eksik");
            return null;
        }

        $sa_json = base64_decode($sa_b64);
        if (!$sa_json) {
            error_log("FcmHelper: FCM_SERVICE_ACCOUNT_JSON base64 decode hatası");
            return null;
        }

        $sa = json_decode($sa_json, true);
        if (!$sa || empty($sa['private_key']) || empty($sa['client_email'])) {
            error_log("FcmHelper: Service account JSON geçersiz veya eksik alan var");
            return null;
        }

        // Service account JWT oluştur (RS256)
        $iat = time();
        $exp = $iat + 3600;

        $header  = self::b64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = self::b64url(json_encode([
            'iss'   => $sa['client_email'],
            'scope' => self::SCOPE,
            'aud'   => self::TOKEN_URL,
            'iat'   => $iat,
            'exp'   => $exp,
        ]));

        $input = $header . '.' . $payload;

        $private_key = openssl_pkey_get_private($sa['private_key']);
        if (!$private_key) {
            error_log("FcmHelper: Service account private key yüklenemedi");
            return null;
        }

        openssl_sign($input, $sig, $private_key, OPENSSL_ALGO_SHA256);
        $jwt = $input . '.' . self::b64url($sig);

        // Google OAuth2 token endpoint'ine JWT gönder
        $ch = curl_init(self::TOKEN_URL);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query([
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        ]);

        $response  = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code !== 200) {
            error_log("FcmHelper: OAuth2 token alınamadı HTTP {$http_code}: " . substr($response, 0, 200));
            return null;
        }

        $data = json_decode($response, true);
        if (empty($data['access_token'])) {
            error_log("FcmHelper: OAuth2 yanıtında access_token yok");
            return null;
        }

        self::$access_token     = $data['access_token'];
        self::$access_token_iat = $iat;

        return self::$access_token;
    }

    /**
     * FCM 404 döndürdüğünde token'ı pasife çek
     */
    private static function token_pasife_cek(string $token): void {
        try {
            $db = Database::baglan();
            $db->prepare("UPDATE push_tokens SET aktif = 0 WHERE token = :t")
               ->execute([':t' => $token]);
        } catch (\Exception $e) {
            error_log("FcmHelper: token pasife çekme hatası: " . $e->getMessage());
        }
    }

    /**
     * Base64 URL-safe encode (padding yok)
     */
    private static function b64url(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
