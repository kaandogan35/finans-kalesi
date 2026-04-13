<?php
/**
 * ParamGo — APNs Push Notification Helper
 *
 * Apple Push Notification service (APNs) üzerinden iOS cihazlara
 * push bildirimi gönderir. JWT tabanlı kimlik doğrulama kullanır (.p8 anahtarı).
 *
 * Gerekli .env değişkenleri:
 *   APNS_AUTH_KEY  — AuthKey_XXXXXXXX.p8 dosyasının base64 içeriği
 *   APNS_KEY_ID    — Anahtar ID (örn: 5AWC2VPFS7)
 *   APNS_TEAM_ID   — Apple Team ID (örn: CM3BW9X6Z2)
 */

class PushHelper {

    private const BUNDLE_ID    = 'com.paramgo.app';
    private const APNS_HOST    = 'https://api.push.apple.com';
    private const APNS_SANDBOX = 'https://api.sandbox.push.apple.com';

    // JWT 55 dakika önbellekte tutulur (APNs max 60 dk)
    private static ?string $jwt     = null;
    private static int     $jwt_iat = 0;

    /**
     * iOS cihaza push bildirimi gönder
     *
     * @param string $token   APNs device token
     * @param string $baslik  Bildirim başlığı
     * @param string $mesaj   Bildirim içeriği
     * @param array  $extra   Ek veri (opsiyonel)
     * @return bool
     */
    public static function gonder(string $token, string $baslik, string $mesaj, array $extra = []): bool {
        try {
            $jwt = self::jwt_olustur();
            if (!$jwt) return false;

            $payload = json_encode([
                'aps' => [
                    'alert' => [
                        'title' => $baslik,
                        'body'  => $mesaj,
                    ],
                    'sound' => 'default',
                    'badge' => 1,
                ],
                'data' => $extra,
            ]);

            $host = (env('APP_ENV') === 'production')
                ? self::APNS_HOST
                : self::APNS_SANDBOX;

            $url = "{$host}/3/device/{$token}";

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_2_0,
                CURLOPT_TIMEOUT        => 10,
                CURLOPT_HTTPHEADER     => [
                    'Authorization: bearer ' . $jwt,
                    'apns-topic: '           . self::BUNDLE_ID,
                    'apns-push-type: alert',
                    'apns-priority: 10',
                    'Content-Type: application/json',
                ],
            ]);

            $response  = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($http_code === 200) {
                return true;
            }

            // 410 = token geçersiz (cihaz uygulama silmiş) → token pasife çek
            if ($http_code === 410) {
                self::token_pasife_cek($token);
            }

            error_log("APNs push hatası HTTP {$http_code}: " . substr($response, 0, 200));
            return false;

        } catch (\Exception $e) {
            error_log("PushHelper::gonder hata: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Şirketin aktif iOS token'larına toplu push gönder
     *
     * @return int Başarıyla gönderilen push sayısı
     */
    public static function sirket_push(int $sirket_id, string $baslik, string $mesaj, array $extra = []): int {
        try {
            $db = Database::baglan();
            $stmt = $db->prepare("
                SELECT token FROM push_tokens
                WHERE sirket_id = :sid AND platform = 'ios' AND aktif = 1
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
            error_log("PushHelper::sirket_push hata: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Belirli kullanıcının iOS token'larına push gönder
     *
     * @return int Başarıyla gönderilen push sayısı
     */
    public static function kullanici_push(int $kullanici_id, string $baslik, string $mesaj, array $extra = []): int {
        try {
            $db = Database::baglan();
            $stmt = $db->prepare("
                SELECT token FROM push_tokens
                WHERE kullanici_id = :kid AND platform = 'ios' AND aktif = 1
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
            error_log("PushHelper::kullanici_push hata: " . $e->getMessage());
            return 0;
        }
    }

    // ─── Private ─────────────────────────────────────────────────────────────

    /**
     * JWT token oluştur (APNs kimlik doğrulama)
     * 55 dakika önbelleğe alır
     */
    private static function jwt_olustur(): ?string {
        if (self::$jwt && (time() - self::$jwt_iat) < 3300) {
            return self::$jwt;
        }

        $key_id  = env('APNS_KEY_ID');
        $team_id = env('APNS_TEAM_ID');
        $key_b64 = env('APNS_AUTH_KEY');

        if (!$key_id || !$team_id || !$key_b64) {
            error_log("PushHelper: .env'de APNS_KEY_ID, APNS_TEAM_ID veya APNS_AUTH_KEY eksik");
            return null;
        }

        $key_content = base64_decode($key_b64);
        if (!$key_content) {
            error_log("PushHelper: APNS_AUTH_KEY base64 decode hatası");
            return null;
        }

        $private_key = openssl_pkey_get_private($key_content);
        if (!$private_key) {
            error_log("PushHelper: APNs özel anahtar yüklenemedi");
            return null;
        }

        $iat     = time();
        $header  = self::b64url(json_encode(['alg' => 'ES256', 'kid' => $key_id]));
        $payload = self::b64url(json_encode(['iss' => $team_id, 'iat' => $iat]));
        $input   = $header . '.' . $payload;

        openssl_sign($input, $der_sig, $private_key, OPENSSL_ALGO_SHA256);

        self::$jwt     = $input . '.' . self::b64url(self::der_to_raw($der_sig));
        self::$jwt_iat = $iat;

        return self::$jwt;
    }

    /**
     * APNs 410 döndürdüğünde token'ı pasife çek
     */
    private static function token_pasife_cek(string $token): void {
        try {
            $db = Database::baglan();
            $db->prepare("UPDATE push_tokens SET aktif = 0 WHERE token = :t")
               ->execute([':t' => $token]);
        } catch (\Exception $e) {
            error_log("PushHelper: token pasife çekme hatası: " . $e->getMessage());
        }
    }

    /**
     * DER imzasını JWT için R+S ham formatına çevirir (ES256 gerekli)
     */
    private static function der_to_raw(string $der): string {
        $offset = 2; // SEQUENCE tag + length

        // R
        $offset++; // INTEGER tag
        $r_len = ord($der[$offset++]);
        $r = substr($der, $offset, $r_len);
        $offset += $r_len;

        // S
        $offset++; // INTEGER tag
        $s_len = ord($der[$offset++]);
        $s = substr($der, $offset, $s_len);

        // Her biri 32 byte (leading zero kaldır, pad ekle)
        $r = str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT);
        $s = str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);

        return $r . $s;
    }

    /**
     * Base64 URL-safe encode (padding yok)
     */
    private static function b64url(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
