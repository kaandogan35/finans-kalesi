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
    private $abonelik_model;

    public function __construct() {
        $this->kullanici_model = new Kullanici();
        $this->sirket_model = new Sirket();
        $db = Database::baglan();
        $this->abonelik_model = new Abonelik($db);
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
            Response::dogrulama_hatasi(['email' => 'Geçerli bir e-posta adresi girin']);
            return;
        }
        
        // 3. Sifre uzunlugu (en az 8 karakter)
        if (strlen($girdi['sifre']) < 8) {
            Response::dogrulama_hatasi(['sifre' => 'Şifre en az 8 karakter olmalıdır']);
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
            
            // 7. Abonelik oluştur (ücretsiz plan + kampanya kontrolü)
            $kampanya = $this->abonelik_model->kampanyaAktifMi();
            $this->abonelik_model->planGuncelle(
                (int) $sirket_id,
                'ucretsiz',
                null,
                null,
                null,
                false
            );

            // Kampanya aktifse şirketi işaretle
            if ($kampanya) {
                $db = Database::baglan();
                $stmt = $db->prepare("UPDATE sirketler SET kampanya_kullanici = 1 WHERE id = :id");
                $stmt->execute([':id' => $sirket_id]);
            }

            // 8. Tokenlar olustur
            $kullanici_bilgi = [
                'id'        => $kullanici_id,
                'sirket_id' => $sirket_id,
                'rol'       => 'sahip',
                'tema_adi'  => 'banking',
                'plan'      => 'ucretsiz',
            ];

            $access_token = JWTHelper::access_token_olustur($kullanici_bilgi);
            $refresh = JWTHelper::refresh_token_olustur($kullanici_bilgi);

            // 9. Refresh token'i veritabanina kaydet
            $this->kullanici_model->refresh_token_kaydet(
                $kullanici_id,
                $refresh['token'],
                $refresh['son_kullanim']
            );
            
            // 9. Yeni kaydı logla (PII maskeleme: e-posta hash'li)
            SistemLog::kaydet(
                SistemLog::KAYIT,
                'yeni_kayit, email_hash: ' . substr(hash('sha256', $girdi['email']), 0, 12),
                (int)$sirket_id,
                (int)$kullanici_id
            );

            // 10. Hoş geldin maili gönder (hata olsa da kayıt başarılı sayılır)
            try {
                $html = MailSablonlar::hosgeldin($girdi['ad_soyad'], $girdi['firma_adi']);
                MailHelper::gonder(
                    $girdi['email'],
                    'Finans Kalesi\'ne Hoş Geldiniz',
                    $html,
                    (int)$sirket_id,
                    (int)$kullanici_id,
                    'hosgeldin'
                );
            } catch (Exception $e) {
                error_log('Hoş geldin maili gönderilemedi: ' . $e->getMessage());
            }

            // 12. Basarili yanit
            Response::basarili([
                'kullanici' => [
                    'id'        => $kullanici_id,
                    'sirket_id' => $sirket_id,
                    'ad_soyad'  => $girdi['ad_soyad'],
                    'email'     => $girdi['email'],
                    'rol'       => 'sahip',
                    'tema_adi'  => 'banking',
                    'plan'      => 'ucretsiz',
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
                'sifre' => empty($girdi['sifre']) ? 'Şifre zorunludur' : null,
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
            SistemLog::kaydet(SistemLog::GIRIS_BASARISIZ, 'email_bulunamadi, hash: ' . substr(hash('sha256', $girdi['email']), 0, 12));
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
                'yanlis_sifre, hash: ' . substr(hash('sha256', $girdi['email']), 0, 12),
                (int)$kullanici['sirket_id'],
                (int)$kullanici['id']
            );
            Response::hata('E-posta veya sifre hatali', 401);
            return;
        }

        try {
            // 6. Sirket temasini al
            $sirket = $this->sirket_model->id_ile_bul($kullanici['sirket_id']);

            // 7. Tokenlar olustur (plan bilgisi de JWT'ye ekleniyor)
            $kullanici_bilgi = [
                'id'        => $kullanici['id'],
                'sirket_id' => $kullanici['sirket_id'],
                'rol'       => $kullanici['rol'],
                'tema_adi'  => $sirket['tema_adi'] ?? 'banking',
                'plan'      => $sirket['abonelik_plani'] ?? 'ucretsiz',
            ];

            $access_token = JWTHelper::access_token_olustur($kullanici_bilgi);
            $refresh = JWTHelper::refresh_token_olustur($kullanici_bilgi);

            // 8. Refresh token kaydet
            $this->kullanici_model->refresh_token_kaydet(
                $kullanici['id'],
                $refresh['token'],
                $refresh['son_kullanim']
            );

            // 9. Son giris zamanini guncelle
            // (numara kayması: eski 9→11, şimdi 10→12)
            $this->kullanici_model->son_giris_guncelle($kullanici['id']);

            // 10. Basarili girisi logla (PII maskeleme)
            SistemLog::kaydet(
                SistemLog::GIRIS_BASARILI,
                'giris_basarili, hash: ' . substr(hash('sha256', $kullanici['email']), 0, 12),
                (int)$kullanici['sirket_id'],
                (int)$kullanici['id']
            );

            // 11. Farklı IP kontrolü — yeni cihazdan giriş uyarısı
            try {
                $mevcut_ip = SistemLog::ip_al();
                $db_check  = Database::baglan();
                $stmt_ip   = $db_check->prepare(
                    "SELECT ip_adresi FROM refresh_tokens
                     WHERE kullanici_id = :kid AND silindi_mi = 0
                     ORDER BY olusturma_tarihi DESC LIMIT 1"
                );
                $stmt_ip->execute([':kid' => (int)$kullanici['id']]);
                $son_token = $stmt_ip->fetch();

                if ($son_token && $son_token['ip_adresi'] && $son_token['ip_adresi'] !== $mevcut_ip) {
                    $app_url    = env('APP_URL', 'https://app.finanskalesi.com');
                    $sifirla_link = $app_url . '/sifre-sifirla';
                    $cihaz      = substr($_SERVER['HTTP_USER_AGENT'] ?? 'Bilinmiyor', 0, 80);
                    $tarih_saat = date('d.m.Y H:i');

                    $html = MailSablonlar::guvenlikUyarisi($tarih_saat, $mevcut_ip, $cihaz, $sifirla_link);
                    MailHelper::gonder(
                        $kullanici['email'],
                        'Güvenlik Uyarısı: Yeni Cihazdan Giriş',
                        $html,
                        (int)$kullanici['sirket_id'],
                        (int)$kullanici['id'],
                        'guvenlik_uyarisi'
                    );
                }
            } catch (Exception $e) {
                error_log('Güvenlik uyarı maili gönderilemedi: ' . $e->getMessage());
            }

            // 12. Basarili yanit
            Response::basarili([
                'kullanici' => [
                    'id'        => (int) $kullanici['id'],
                    'sirket_id' => (int) $kullanici['sirket_id'],
                    'ad_soyad'  => $kullanici['ad_soyad'],
                    'email'     => $kullanici['email'],
                    'rol'       => $kullanici['rol'],
                    'tema_adi'  => $sirket['tema_adi'] ?? 'banking',
                    'plan'      => $sirket['abonelik_plani'] ?? 'ucretsiz',
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
            $sirket = $this->sirket_model->id_ile_bul($token_kayit['sirket_id']);
            $kullanici_bilgi = [
                'id'        => (int) $token_kayit['kullanici_id'],
                'sirket_id' => (int) $token_kayit['sirket_id'],
                'rol'       => $token_kayit['rol'],
                'tema_adi'  => $sirket['tema_adi'] ?? 'banking',
                'plan'      => $sirket['abonelik_plani'] ?? 'ucretsiz',
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
     * ŞİFRE SIFIRLAMA TALEBİ
     * POST /api/auth/sifre-sifirla-iste
     */
    public function sifreSifirlaIste($girdi) {
        if (empty($girdi['email'])) {
            Response::dogrulama_hatasi(['email' => 'E-posta zorunludur']);
            return;
        }

        // Rate limit — aynı IP'den çok fazla şifre sıfırlama talebi
        $ip = SistemLog::ip_al();
        if (!RateLimiter::sifre_sifirlama_izinli_mi($ip)) {
            Response::cok_fazla_istek(1800); // 30 dakika bekle
            return;
        }

        // Güvenlik: kullanıcı bulunamasa da aynı yanıtı döndür (enumeration koruması)
        $kullanici = $this->kullanici_model->eposta_ile_bul($girdi['email']);

        if ($kullanici && $kullanici['aktif_mi']) {
            try {
                $token  = bin2hex(random_bytes(32)); // 64 karakter güvenli token
                $bitis  = date('Y-m-d H:i:s', time() + 1800); // 30 dakika

                $db = Database::baglan();
                $stmt = $db->prepare(
                    "UPDATE kullanicilar
                     SET sifre_sifirlama_token = :token, sifre_sifirlama_bitis = :bitis
                     WHERE id = :id"
                );
                $stmt->execute([
                    ':token' => $token,
                    ':bitis' => $bitis,
                    ':id'    => (int)$kullanici['id'],
                ]);

                $app_url = env('APP_URL', 'https://app.finanskalesi.com');
                $link    = $app_url . '/sifre-sifirla?token=' . $token;
                $html    = MailSablonlar::sifreSifirla($link, 30);

                MailHelper::gonder(
                    $kullanici['email'],
                    'Şifre Sıfırlama — Finans Kalesi',
                    $html,
                    (int)$kullanici['sirket_id'],
                    (int)$kullanici['id'],
                    'sifre_sifirlama'
                );

                SistemLog::kaydet(
                    SistemLog::GIRIS_BASARISIZ,
                    'sifre_sifirlama_talebi: hash_' . substr(hash('sha256', $girdi['email']), 0, 12),
                    (int)$kullanici['sirket_id'],
                    (int)$kullanici['id']
                );

            } catch (Exception $e) {
                error_log('Şifre sıfırlama işlemi hatası: ' . $e->getMessage());
            }
        }

        // Her durumda aynı yanıt
        Response::basarili(null, 'E-posta adresinize sıfırlama bağlantısı gönderildi');
    }

    /**
     * ŞİFRE SIFIRLAMA (TOKEN İLE)
     * POST /api/auth/sifre-sifirla
     */
    public function sifreSifirla($girdi) {
        if (empty($girdi['token'])) {
            Response::dogrulama_hatasi(['token' => 'Token zorunludur']);
            return;
        }
        if (empty($girdi['yeni_sifre'])) {
            Response::dogrulama_hatasi(['yeni_sifre' => 'Yeni şifre zorunludur']);
            return;
        }
        if (strlen($girdi['yeni_sifre']) < 8) {
            Response::dogrulama_hatasi(['yeni_sifre' => 'Şifre en az 8 karakter olmalıdır']);
            return;
        }

        try {
            $db   = Database::baglan();
            $stmt = $db->prepare(
                "SELECT id, sirket_id, email
                 FROM kullanicilar
                 WHERE sifre_sifirlama_token = :token
                   AND sifre_sifirlama_bitis > NOW()
                   AND aktif_mi = 1"
            );
            $stmt->execute([':token' => $girdi['token']]);
            $kullanici = $stmt->fetch();

            if (!$kullanici) {
                Response::hata('Sıfırlama bağlantısı geçersiz veya süresi dolmuş', 400);
                return;
            }

            // Şifreyi güncelle, token'ı temizle
            $hash  = password_hash($girdi['yeni_sifre'], PASSWORD_BCRYPT);
            $stmt2 = $db->prepare(
                "UPDATE kullanicilar
                 SET sifre_hash = :hash,
                     sifre_sifirlama_token = NULL,
                     sifre_sifirlama_bitis = NULL
                 WHERE id = :id"
            );
            $stmt2->execute([':hash' => $hash, ':id' => (int)$kullanici['id']]);

            // Tüm refresh token'ları geçersiz kıl (güvenlik)
            $stmt3 = $db->prepare(
                "UPDATE refresh_tokens SET silindi_mi = 1 WHERE kullanici_id = :kid"
            );
            $stmt3->execute([':kid' => (int)$kullanici['id']]);

            SistemLog::kaydet(
                SistemLog::GIRIS_BASARILI,
                'sifre_sifirlandi, hash: ' . substr(hash('sha256', $kullanici['email']), 0, 12),
                (int)$kullanici['sirket_id'],
                (int)$kullanici['id']
            );

            Response::basarili(null, 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.');

        } catch (Exception $e) {
            error_log('Şifre sıfırlama hatası: ' . $e->getMessage());
            Response::sunucu_hatasi('Şifre sıfırlanamadı');
        }
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

        // Sirket tema ve plan bilgisini ekle
        $sirket = $this->sirket_model->id_ile_bul($kullanici['sirket_id']);
        $kullanici['tema_adi'] = $sirket['tema_adi'] ?? 'banking';
        $kullanici['plan']     = $sirket['abonelik_plani'] ?? 'ucretsiz';

        Response::basarili(['kullanici' => $kullanici]);
    }
}