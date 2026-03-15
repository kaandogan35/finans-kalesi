<?php
/**
 * Finans Kalesi — Auth Controller
 * 
 * POST /api/auth/kayit   → Yeni sirket + kullanici olustur
 * POST /api/auth/giris   → E-posta + sifre ile giris, token al
 * POST /api/auth/yenile  → Refresh token ile yeni access token al
 * POST /api/auth/cikis   → Refresh token'i sil
 * GET  /api/auth/ben     → Giris yapmis kullanicinin bilgileri
 */

class AuthController {
    
    private $kullanici_model;
    private $sirket_model;
    
    public function __construct() {
        $this->kullanici_model = new Kullanici();
        $this->sirket_model = new Sirket();
    }
    
    /**
     * KAYIT
     */
    public function kayit($girdi) {
        // 0. Rate limit — aynı IP'den kısa sürede çok fazla kayıt denemesi
        $ip = SistemLog::ip_al();
        if (!RateLimiter::kayit_izinli_mi($ip)) {
            SistemLog::kaydet(SistemLog::YETKISIZ_ERISIM, 'kayit_rate_limit: ' . ($girdi['email'] ?? ''));
            Response::cok_fazla_istek(3600); // 1 saat bekle
            return;
        }

        // 1. Zorunlu alanlari kontrol et
        $gerekli = ['firma_adi', 'ad_soyad', 'email', 'sifre'];
        $eksik = [];
        
        foreach ($gerekli as $alan) {
            if (empty($girdi[$alan])) {
                $eksik[$alan] = "$alan alani zorunludur";
            }
        }
        
        if (!empty($eksik)) {
            Response::dogrulama_hatasi($eksik);
            return;
        }
        
        // 2. E-posta formati kontrol
        if (!filter_var($girdi['email'], FILTER_VALIDATE_EMAIL)) {
            Response::dogrulama_hatasi(['email' => 'Gecerli bir e-posta adresi girin']);
            return;
        }
        
        // 3. Sifre uzunlugu (en az 8 karakter)
        if (strlen($girdi['sifre']) < 8) {
            Response::dogrulama_hatasi(['sifre' => 'Sifre en az 8 karakter olmalidir']);
            return;
        }
        
        // 4. E-posta daha once kayitli mi?
        if ($this->kullanici_model->eposta_var_mi($girdi['email'])) {
            Response::hata('Bu e-posta adresi zaten kayitli', 409);
            return;
        }
        
        try {
            // 5. Sirket olustur
            $sirket_id = $this->sirket_model->olustur([
                'firma_adi' => $girdi['firma_adi'],
                'vergi_no'  => $girdi['vergi_no'] ?? null,
                'telefon'   => $girdi['telefon'] ?? null,
                'email'     => $girdi['email'],
                'adres'     => $girdi['adres'] ?? null,
                'sektor'    => $girdi['sektor'] ?? null,
            ]);
            
            // 6. Admin kullanici olustur
            $kullanici_id = $this->kullanici_model->olustur([
                'sirket_id' => $sirket_id,
                'ad_soyad'  => $girdi['ad_soyad'],
                'email'     => $girdi['email'],
                'sifre'     => $girdi['sifre'],
                'rol'       => 'sahip'  // Ilk kullanici = sirket sahibi
            ]);
            
            // 7. Tokenlar olustur
            $kullanici_bilgi = [
                'id'        => $kullanici_id,
                'sirket_id' => $sirket_id,
                'rol'       => 'sahip'
            ];
            
            $access_token = JWTHelper::access_token_olustur($kullanici_bilgi);
            $refresh = JWTHelper::refresh_token_olustur($kullanici_bilgi);
            
            // 8. Refresh token'i veritabanina kaydet
            $this->kullanici_model->refresh_token_kaydet(
                $kullanici_id,
                $refresh['token'],
                $refresh['son_kullanim']
            );
            
            // 9. Yeni kaydı logla
            SistemLog::kaydet(
                SistemLog::KAYIT,
                'firma: ' . $girdi['firma_adi'] . ', email: ' . $girdi['email'],
                (int)$sirket_id,
                (int)$kullanici_id
            );

            // 10. Basarili yanit
            Response::basarili([
                'kullanici' => [
                    'id'        => $kullanici_id,
                    'sirket_id' => $sirket_id,
                    'ad_soyad'  => $girdi['ad_soyad'],
                    'email'     => $girdi['email'],
                    'rol'       => 'sahip'
                ],
                'tokenlar' => [
                    'access_token'  => $access_token,
                    'refresh_token' => $refresh['token'],
                    'token_tipi'    => 'Bearer',
                    'suresi'        => 900
                ]
            ], 'Kayit basarili', 201);
            
        } catch (Exception $e) {
            Response::sunucu_hatasi('Kayit hatasi: ' . $e->getMessage());
        }
    }
    
    /**
     * GIRIS
     */
    public function giris($girdi) {
        // 1. Zorunlu alanlar
        if (empty($girdi['email']) || empty($girdi['sifre'])) {
            Response::dogrulama_hatasi([
                'email' => empty($girdi['email']) ? 'E-posta zorunludur' : null,
                'sifre' => empty($girdi['sifre']) ? 'Sifre zorunludur' : null,
            ]);
            return;
        }

        // 2. Rate limit kontrolü — çok fazla başarısız deneme var mı?
        $ip = SistemLog::ip_al();
        if (!RateLimiter::login_izinli_mi($ip)) {
            $bekleme = RateLimiter::bekleme_suresi($ip);
            SistemLog::kaydet(SistemLog::YETKISIZ_ERISIM, 'rate_limit: ' . $girdi['email']);
            Response::cok_fazla_istek($bekleme);
            return;
        }

        // 3. Kullaniciyi bul
        $kullanici = $this->kullanici_model->eposta_ile_bul($girdi['email']);

        if (!$kullanici) {
            // Başarısız denemeyi logla (rate limiter bunu sayar)
            SistemLog::kaydet(SistemLog::GIRIS_BASARISIZ, 'email_bulunamadi: ' . $girdi['email']);
            Response::hata('E-posta veya sifre hatali', 401);
            return;
        }

        // 4. Hesap aktif mi?
        if (!$kullanici['aktif_mi']) {
            SistemLog::kaydet(
                SistemLog::GIRIS_BASARISIZ,
                'hesap_askida: ' . $girdi['email'],
                (int)$kullanici['sirket_id'],
                (int)$kullanici['id']
            );
            Response::hata('Hesabiniz askiya alinmis. Yoneticiyle iletisime gecin.', 403);
            return;
        }

        // 5. Sifreyi dogrula
        if (!$this->kullanici_model->sifre_dogrula($girdi['sifre'], $kullanici['sifre_hash'])) {
            // Başarısız denemeyi logla (rate limiter bunu sayar)
            SistemLog::kaydet(
                SistemLog::GIRIS_BASARISIZ,
                'yanlis_sifre: ' . $girdi['email'],
                (int)$kullanici['sirket_id'],
                (int)$kullanici['id']
            );
            Response::hata('E-posta veya sifre hatali', 401);
            return;
        }

        try {
            // 6. Tokenlar olustur
            $kullanici_bilgi = [
                'id'        => $kullanici['id'],
                'sirket_id' => $kullanici['sirket_id'],
                'rol'       => $kullanici['rol']
            ];

            $access_token = JWTHelper::access_token_olustur($kullanici_bilgi);
            $refresh = JWTHelper::refresh_token_olustur($kullanici_bilgi);

            // 7. Refresh token kaydet
            $this->kullanici_model->refresh_token_kaydet(
                $kullanici['id'],
                $refresh['token'],
                $refresh['son_kullanim']
            );

            // 8. Son giris zamanini guncelle
            $this->kullanici_model->son_giris_guncelle($kullanici['id']);

            // 9. Basarili girisi logla
            SistemLog::kaydet(
                SistemLog::GIRIS_BASARILI,
                'email: ' . $kullanici['email'],
                (int)$kullanici['sirket_id'],
                (int)$kullanici['id']
            );

            // 10. Basarili yanit
            Response::basarili([
                'kullanici' => [
                    'id'        => (int) $kullanici['id'],
                    'sirket_id' => (int) $kullanici['sirket_id'],
                    'ad_soyad'  => $kullanici['ad_soyad'],
                    'email'     => $kullanici['email'],
                    'rol'       => $kullanici['rol']
                ],
                'tokenlar' => [
                    'access_token'  => $access_token,
                    'refresh_token' => $refresh['token'],
                    'token_tipi'    => 'Bearer',
                    'suresi'        => 900
                ]
            ], 'Giris basarili');

        } catch (Exception $e) {
            Response::sunucu_hatasi('Giris hatasi: ' . $e->getMessage());
        }
    }
    
    /**
     * TOKEN YENILE
     */
    public function yenile($girdi) {
        if (empty($girdi['refresh_token'])) {
            Response::dogrulama_hatasi(['refresh_token' => 'Refresh token zorunludur']);
            return;
        }
        
        // 1. JWT dogrula
        $jwt_payload = JWTHelper::token_dogrula($girdi['refresh_token']);
        
        if (!$jwt_payload || $jwt_payload['tip'] !== 'refresh') {
            Response::yetkisiz('Refresh token gecersiz veya suresi dolmus');
            return;
        }
        
        // 2. Veritabaninda kontrol
        $token_kayit = $this->kullanici_model->refresh_token_dogrula($girdi['refresh_token']);
        
        if (!$token_kayit) {
            Response::yetkisiz('Refresh token gecersiz');
            return;
        }
        
        // 3. Kullanici aktif mi?
        if (!$token_kayit['aktif_mi']) {
            Response::hata('Hesabiniz askiya alinmis', 403);
            return;
        }
        
        try {
            // 4. Eski token sil
            $this->kullanici_model->refresh_token_sil($girdi['refresh_token']);
            
            // 5. Yeni tokenlar olustur
            $kullanici_bilgi = [
                'id'        => (int) $token_kayit['kullanici_id'],
                'sirket_id' => (int) $token_kayit['sirket_id'],
                'rol'       => $token_kayit['rol']
            ];
            
            $yeni_access = JWTHelper::access_token_olustur($kullanici_bilgi);
            $yeni_refresh = JWTHelper::refresh_token_olustur($kullanici_bilgi);
            
            // 6. Yeni refresh token kaydet
            $this->kullanici_model->refresh_token_kaydet(
                $token_kayit['kullanici_id'],
                $yeni_refresh['token'],
                $yeni_refresh['son_kullanim']
            );
            
            Response::basarili([
                'tokenlar' => [
                    'access_token'  => $yeni_access,
                    'refresh_token' => $yeni_refresh['token'],
                    'token_tipi'    => 'Bearer',
                    'suresi'        => 900
                ]
            ], 'Token yenilendi');
            
        } catch (Exception $e) {
            Response::sunucu_hatasi('Token yenileme hatasi: ' . $e->getMessage());
        }
    }
    
    /**
     * CIKIS
     */
    public function cikis($girdi) {
        // Çıkış yapan kullanıcıyı token'dan al (varsa)
        $token = JWTHelper::istekten_token_al();
        if ($token) {
            $payload = JWTHelper::token_dogrula($token);
            if ($payload && isset($payload['sirket_id'])) {
                SistemLog::kaydet(
                    SistemLog::CIKIS,
                    '',
                    (int)$payload['sirket_id'],
                    (int)$payload['sub']
                );
            }
        }

        if (!empty($girdi['refresh_token'])) {
            $this->kullanici_model->refresh_token_sil($girdi['refresh_token']);
        }
        Response::basarili(null, 'Cikis basarili');
    }
    
    /**
     * BEN KIMIM
     */
    public function ben() {
        $payload = AuthMiddleware::dogrula();
        
        $kullanici = $this->kullanici_model->id_ile_bul($payload['sub']);
        
        if (!$kullanici) {
            Response::bulunamadi('Kullanici bulunamadi');
            return;
        }
        
        Response::basarili(['kullanici' => $kullanici]);
    }
}