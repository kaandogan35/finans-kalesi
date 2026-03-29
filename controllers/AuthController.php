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
    private $guvenlik_model;

    public function __construct() {
        $this->kullanici_model = new Kullanici();
        $this->sirket_model = new Sirket();
        $db = Database::baglan();
        $this->abonelik_model = new Abonelik($db);
        $this->guvenlik_model = new Guvenlik();
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
            
            // 7. 30 gün ücretsiz deneme başlat
            $this->abonelik_model->denemeBaslat((int) $sirket_id);

            // 8. Tokenlar olustur
            $kullanici_bilgi = [
                'id'        => $kullanici_id,
                'sirket_id' => $sirket_id,
                'rol'       => 'sahip',
                'tema_adi'  => 'paramgo',
                'plan'      => 'deneme',
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
                    'tema_adi'  => 'paramgo',
                    'plan'      => 'deneme',
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

        // User-Agent bilgilerini çözümle (giriş geçmişi için)
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
        $cihaz_bilgi = Guvenlik::user_agent_cozumle($ua);

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
            // Giriş geçmişi kaydet (başarısız)
            $this->girisGecmisiKaydet($kullanici, $ip, $ua, $cihaz_bilgi, false, 'hesap_askida');

            SistemLog::kaydet(
                SistemLog::GIRIS_BASARISIZ,
                'hesap_askida: ' . $girdi['email'],
                (int)$kullanici['sirket_id'],
                (int)$kullanici['id']
            );
            Response::hata('Hesabiniz askiya alinmis. Yoneticiyle iletisime gecin.', 403);
            return;
        }

        // 4b. Hesap kilitli mi kontrol et
        $kilitli_kadar = $this->guvenlik_model->hesap_kilitli_mi((int)$kullanici['id']);
        if ($kilitli_kadar) {
            $this->girisGecmisiKaydet($kullanici, $ip, $ua, $cihaz_bilgi, false, 'hesap_kilitli');
            Response::hata('Hesabınız çok fazla başarısız deneme nedeniyle kilitlendi. ' . date('H:i', strtotime($kilitli_kadar)) . ' tarihine kadar bekleyin.', 423);
            return;
        }

        // 5. Sifreyi dogrula
        if (!$this->kullanici_model->sifre_dogrula($girdi['sifre'], $kullanici['sifre_hash'])) {
            // Başarısız giriş sayısını artır
            $this->guvenlik_model->basarisiz_giris_artir((int)$kullanici['id']);

            // Hesap kilitleme kontrolü
            $basarisiz = $this->guvenlik_model->basarisiz_giris_sayisi((int)$kullanici['id']);
            $ayarlar = $this->guvenlik_model->ayarlar_getir((int)$kullanici['sirket_id']);
            if ($basarisiz >= $ayarlar['hesap_kilitleme_deneme']) {
                $this->guvenlik_model->hesap_kilitle((int)$kullanici['id'], (int)$ayarlar['hesap_kilitleme_sure_dk']);
            }

            // Giriş geçmişi kaydet (başarısız)
            $this->girisGecmisiKaydet($kullanici, $ip, $ua, $cihaz_bilgi, false, 'yanlis_sifre');

            SistemLog::kaydet(
                SistemLog::GIRIS_BASARISIZ,
                'yanlis_sifre, hash: ' . substr(hash('sha256', $girdi['email']), 0, 12),
                (int)$kullanici['sirket_id'],
                (int)$kullanici['id']
            );
            Response::hata('E-posta veya sifre hatali', 401);
            return;
        }

        // 5b. 2FA kontrolü — aktifse kod zorunlu
        if (!empty($kullanici['iki_faktor_aktif']) && $kullanici['iki_faktor_aktif']) {
            if (empty($girdi['totp_kodu'])) {
                // Şifre doğru ama 2FA kodu gerekli — özel yanıt dön
                Response::hata('İki faktörlü doğrulama kodu gerekli', 428, ['iki_faktor_gerekli' => true]);
                return;
            }

            // TOTP kodunu doğrula
            $secret = SistemKripto::coz($kullanici['iki_faktor_gizli_sifreli'] ?? '');
            if (!$secret || !TOTPHelper::dogrula($secret, $girdi['totp_kodu'])) {
                // Yedek kod kontrolü
                $yedek_json = SistemKripto::coz($kullanici['iki_faktor_yedek_kodlar_sifreli'] ?? '');
                $yedek_kodlar = $yedek_json ? json_decode($yedek_json, true) : [];
                $kod_index = array_search(strtoupper(trim($girdi['totp_kodu'])), $yedek_kodlar);

                if ($kod_index === false) {
                    $this->girisGecmisiKaydet($kullanici, $ip, $ua, $cihaz_bilgi, false, 'hatali_2fa_kodu');
                    Response::hata('Doğrulama kodu hatalı', 401);
                    return;
                }

                // Yedek kod kullanıldı — listeden çıkar
                unset($yedek_kodlar[$kod_index]);
                $yedek_kodlar = array_values($yedek_kodlar);
                $yedek_sifreli = SistemKripto::sifrele(json_encode($yedek_kodlar));
                $db = Database::baglan();
                $stmt = $db->prepare("UPDATE kullanicilar SET iki_faktor_yedek_kodlar_sifreli = :yedek WHERE id = :id");
                $stmt->execute([':yedek' => $yedek_sifreli, ':id' => (int)$kullanici['id']]);
            }
        }

        try {
            // 6. Başarısız giriş sayısını sıfırla
            $this->guvenlik_model->basarisiz_giris_sifirla((int)$kullanici['id']);

            // 7. Sirket temasini al
            $sirket = $this->sirket_model->id_ile_bul($kullanici['sirket_id']);

            // 8. Tokenlar olustur (plan bilgisi de JWT'ye ekleniyor)
            $kullanici_bilgi = [
                'id'        => $kullanici['id'],
                'sirket_id' => $kullanici['sirket_id'],
                'rol'       => $kullanici['rol'],
                'tema_adi'  => $sirket['tema_adi'] ?? 'paramgo',
                'plan'      => $sirket['abonelik_plani'] ?? 'deneme',
                'yetkiler'  => $kullanici['yetkiler'] ?? null,
            ];

            $access_token = JWTHelper::access_token_olustur($kullanici_bilgi);
            $refresh = JWTHelper::refresh_token_olustur($kullanici_bilgi);

            // 9. Refresh token kaydet
            $this->kullanici_model->refresh_token_kaydet(
                $kullanici['id'],
                $refresh['token'],
                $refresh['son_kullanim']
            );

            // 10. Son giris zamanini guncelle
            $this->kullanici_model->son_giris_guncelle($kullanici['id']);

            // 11. Giriş geçmişi kaydet (başarılı)
            $this->girisGecmisiKaydet($kullanici, $ip, $ua, $cihaz_bilgi, true);

            // 12. Basarili girisi logla (PII maskeleme)
            SistemLog::kaydet(
                SistemLog::GIRIS_BASARILI,
                'giris_basarili, hash: ' . substr(hash('sha256', $kullanici['email']), 0, 12),
                (int)$kullanici['sirket_id'],
                (int)$kullanici['id']
            );

            // 13. Farklı IP kontrolü — yeni cihazdan giriş uyarısı
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

            // 14. Basarili yanit
            Response::basarili([
                'kullanici' => [
                    'id'                     => (int) $kullanici['id'],
                    'sirket_id'              => (int) $kullanici['sirket_id'],
                    'ad_soyad'               => $kullanici['ad_soyad'],
                    'email'                  => $kullanici['email'],
                    'rol'                    => $kullanici['rol'],
                    'tema_adi'               => $sirket['tema_adi'] ?? 'paramgo',
                    'plan'                   => $sirket['abonelik_plani'] ?? 'deneme',
                    'yetkiler'               => $kullanici['yetkiler'] ?? null,
                    'onboarding_tamamlandi'  => (int)($sirket['onboarding_tamamlandi'] ?? 0),
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
     * Giriş geçmişi kaydı oluştur (başarılı veya başarısız)
     */
    private function girisGecmisiKaydet($kullanici, $ip, $ua, $cihaz_bilgi, $basarili, $neden = null) {
        try {
            $this->guvenlik_model->giris_kaydet([
                'sirket_id'           => (int)$kullanici['sirket_id'],
                'kullanici_id'        => (int)$kullanici['id'],
                'ip_adresi'           => $ip,
                'cihaz_bilgisi'       => $ua ? substr($ua, 0, 500) : null,
                'cihaz_turu'          => $cihaz_bilgi['cihaz_turu'],
                'tarayici'            => $cihaz_bilgi['tarayici'],
                'isletim_sistemi'     => $cihaz_bilgi['isletim_sistemi'],
                'basarili_mi'         => $basarili ? 1 : 0,
                'basarisizlik_nedeni' => $neden,
            ]);
        } catch (Exception $e) {
            error_log('Giriş geçmişi kaydedilemedi: ' . $e->getMessage());
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
            // Güncel yetkiler için kullanıcıyı DB'den al
            $k_bilgi = $this->kullanici_model->id_ile_bul((int)$token_kayit['kullanici_id']);
            $kullanici_bilgi = [
                'id'        => (int) $token_kayit['kullanici_id'],
                'sirket_id' => (int) $token_kayit['sirket_id'],
                'rol'       => $token_kayit['rol'],
                'tema_adi'  => $sirket['tema_adi'] ?? 'paramgo',
                'plan'      => $sirket['abonelik_plani'] ?? 'deneme',
                'yetkiler'  => $k_bilgi['yetkiler'] ?? null,
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

        // Sirket tema, plan ve onboarding bilgisini ekle
        $sirket = $this->sirket_model->id_ile_bul($kullanici['sirket_id']);
        $kullanici['tema_adi']              = $sirket['tema_adi'] ?? 'paramgo';
        $kullanici['plan']                  = $sirket['abonelik_plani'] ?? 'deneme';
        $kullanici['onboarding_tamamlandi'] = (int)($sirket['onboarding_tamamlandi'] ?? 0);
        // yetkiler zaten id_ile_bul() sorgusuyla geliyor

        unset($kullanici['sifre_hash']);
        Response::basarili(['kullanici' => $kullanici]);
    }

    /**
     * HESAP SİL
     * DELETE /api/auth/hesap-sil
     *
     * App Store Guideline 5.1.1 — Hesap oluşturan uygulamalar hesap silme sunmak zorunda.
     * Şifre doğrulaması zorunlu (yanlışlıkla silmeyi engeller).
     *
     * - Kullanıcı "sahip" ise: şirket + tüm kullanıcılar deaktive edilir
     * - Diğer roller: yalnızca kendi hesabı deaktive edilir
     */
    public function hesapSil($girdi) {
        // 1. JWT doğrula
        $payload = AuthMiddleware::dogrula();
        $kullanici_id = (int) $payload['sub'];
        $sirket_id    = (int) $payload['sirket_id'];

        // 2. Şifre zorunlu
        if (empty($girdi['sifre'])) {
            Response::dogrulama_hatasi(['sifre' => 'Hesabı silmek için şifrenizi girin']);
            return;
        }

        // 3. Kullanıcıyı DB'den al (sifre_hash dahil)
        $db = Database::baglan();
        $stmt = $db->prepare(
            "SELECT id, sirket_id, email, rol, sifre_hash
             FROM kullanicilar
             WHERE id = :id AND aktif_mi = 1
             LIMIT 1"
        );
        $stmt->execute([':id' => $kullanici_id]);
        $kullanici = $stmt->fetch();

        if (!$kullanici) {
            Response::bulunamadi('Kullanıcı bulunamadı');
            return;
        }

        // 4. Şifre doğrula
        if (!password_verify($girdi['sifre'], $kullanici['sifre_hash'])) {
            Response::hata('Şifre hatalı', 401);
            return;
        }

        try {
            $db->beginTransaction();

            // 5. Tüm refresh token'larını geçersiz kıl (tüm cihazlardan çıkış)
            $stmt2 = $db->prepare(
                "UPDATE refresh_tokens SET silindi_mi = 1 WHERE kullanici_id = :kid"
            );
            $stmt2->execute([':kid' => $kullanici_id]);

            // 6. Kullanıcıyı deaktive et, e-posta adresini serbest bırak
            // (UNIQUE constraint nedeniyle aynı e-posta ile yeniden kayıt yapılabilmesi için)
            $stmt3 = $db->prepare(
                "UPDATE kullanicilar
                 SET aktif_mi = 0,
                     email    = CONCAT('_silindi_', id, '_', :ts, '@paramgo.com')
                 WHERE id = :id"
            );
            $stmt3->execute([':ts' => time(), ':id' => $kullanici_id]);

            // 7. Sahip ise şirketi ve diğer kullanıcıları da deaktive et
            if ($kullanici['rol'] === 'sahip') {
                $stmt4 = $db->prepare(
                    "UPDATE sirketler SET aktif_mi = 0 WHERE id = :sid"
                );
                $stmt4->execute([':sid' => $sirket_id]);

                $stmt5 = $db->prepare(
                    "UPDATE kullanicilar SET aktif_mi = 0
                     WHERE sirket_id = :sid AND id != :id"
                );
                $stmt5->execute([':sid' => $sirket_id, ':id' => $kullanici_id]);
            }

            $db->commit();

            SistemLog::kaydet(
                SistemLog::CIKIS,
                'hesap_silindi, hash: ' . substr(hash('sha256', $kullanici['email']), 0, 12),
                $sirket_id,
                $kullanici_id
            );

            Response::basarili(null, 'Hesabınız başarıyla silindi');

        } catch (Exception $e) {
            $db->rollBack();
            error_log('Hesap silme hatası: ' . $e->getMessage());
            Response::sunucu_hatasi('Hesap silinemedi');
        }
    }
}


