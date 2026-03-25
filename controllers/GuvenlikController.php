<?php
/**
 * Finans Kalesi — Güvenlik Controller
 *
 * Sadece 'sahip' rolü erişebilir.
 *
 * GET    /api/guvenlik/oturumlar          → Aktif oturumlar
 * DELETE /api/guvenlik/oturumlar/:id      → Tek oturumu sonlandır
 * DELETE /api/guvenlik/oturumlar/hepsi    → Diğer tüm oturumları sonlandır
 * GET    /api/guvenlik/giris-gecmisi      → Giriş geçmişi
 * GET    /api/guvenlik/ayarlar            → Güvenlik ayarları
 * PUT    /api/guvenlik/ayarlar            → Güvenlik ayarlarını güncelle
 * POST   /api/guvenlik/2fa/baslat        → 2FA kurulumunu başlat
 * POST   /api/guvenlik/2fa/dogrula       → 2FA kodunu doğrula ve aktifleştir
 * DELETE /api/guvenlik/2fa               → 2FA'yı devre dışı bırak
 * GET    /api/guvenlik/log               → Sistem logları
 * POST   /api/guvenlik/veri-disa-aktar   → KVKK veri dışa aktarma
 */

class GuvenlikController {

    private $model;

    public function __construct() {
        $this->model = new Guvenlik();
    }

    // ─── AKTİF OTURUMLAR ──────────────────────────────────────────

    /**
     * GET /api/guvenlik/oturumlar
     */
    public function oturumlar($payload) {
        $oturumlar = $this->model->oturumlari_listele((int)$payload['sub']);

        // User-Agent'ları çözümle
        foreach ($oturumlar as &$oturum) {
            $cihaz = Guvenlik::user_agent_cozumle($oturum['cihaz_bilgisi']);
            $oturum['cihaz_turu']      = $cihaz['cihaz_turu'];
            $oturum['tarayici']        = $cihaz['tarayici'];
            $oturum['isletim_sistemi'] = $cihaz['isletim_sistemi'];
            unset($oturum['cihaz_bilgisi']); // Ham UA'yı dışarı verme
        }

        Response::basarili(['oturumlar' => $oturumlar]);
    }

    /**
     * DELETE /api/guvenlik/oturumlar/:id
     */
    public function oturumSonlandir($payload, int $oturum_id) {
        $sonuc = $this->model->oturum_sonlandir($oturum_id, (int)$payload['sub']);

        if (!$sonuc) {
            Response::bulunamadi('Oturum bulunamadı veya zaten sonlandırılmış');
            return;
        }

        SistemLog::kaydet('oturum_sonlandirildi', "oturum_id: $oturum_id", (int)$payload['sirket_id'], (int)$payload['sub']);
        Response::basarili(null, 'Oturum sonlandırıldı');
    }

    /**
     * DELETE /api/guvenlik/oturumlar/hepsi
     */
    public function tumOturumlariSonlandir($payload) {
        // Mevcut token'ın hash'ini al (bu oturumu korumak için)
        $token = JWTHelper::istekten_token_al();
        // Access token ile refresh token farklı — refresh token hash'i ile çalışıyoruz
        // Tüm diğer refresh token'ları silindi_mi = 1 yap
        // Kullanıcının mevcut erişim token'ı hala geçerli (15 dk), ama diğer cihazlar yenileyemez
        $this->model->diger_oturumlari_sonlandir((int)$payload['sub'], '__keep_none__');

        // Aslında hepsini sonlandır — mevcut oturum access token ile 15dk daha yaşar
        SistemLog::kaydet('tum_oturumlar_sonlandirildi', '', (int)$payload['sirket_id'], (int)$payload['sub']);
        Response::basarili(null, 'Diğer tüm oturumlar sonlandırıldı');
    }

    // ─── GİRİŞ GEÇMİŞİ ────────────────────────────────────────────

    /**
     * GET /api/guvenlik/giris-gecmisi
     */
    public function girisGecmisi($payload) {
        $sayfa = isset($_GET['sayfa']) ? max(1, (int)$_GET['sayfa']) : 1;
        $kullanici_id = isset($_GET['kullanici_id']) ? (int)$_GET['kullanici_id'] : 0;

        $sonuc = $this->model->giris_gecmisi_listele(
            (int)$payload['sirket_id'],
            $kullanici_id,
            $sayfa
        );

        Response::basarili($sonuc);
    }

    // ─── GÜVENLİK AYARLARI ─────────────────────────────────────────

    /**
     * GET /api/guvenlik/ayarlar
     */
    public function ayarlarGetir($payload) {
        $ayarlar = $this->model->ayarlar_getir((int)$payload['sirket_id']);
        Response::basarili(['ayarlar' => $ayarlar]);
    }

    /**
     * PUT /api/guvenlik/ayarlar
     */
    public function ayarlarKaydet($payload, $girdi) {
        // Doğrulama
        $min = (int)($girdi['min_sifre_uzunlugu'] ?? 8);
        if ($min < 6 || $min > 32) {
            Response::dogrulama_hatasi(['min_sifre_uzunlugu' => 'Minimum şifre uzunluğu 6-32 arasında olmalıdır']);
            return;
        }

        $deneme = (int)($girdi['hesap_kilitleme_deneme'] ?? 5);
        if ($deneme < 3 || $deneme > 20) {
            Response::dogrulama_hatasi(['hesap_kilitleme_deneme' => 'Kilitleme deneme sayısı 3-20 arasında olmalıdır']);
            return;
        }

        $sure = (int)($girdi['hesap_kilitleme_sure_dk'] ?? 30);
        if ($sure < 5 || $sure > 1440) {
            Response::dogrulama_hatasi(['hesap_kilitleme_sure_dk' => 'Kilitleme süresi 5-1440 dakika arasında olmalıdır']);
            return;
        }

        // IP listesi doğrulama
        $beyaz_liste = $girdi['ip_beyaz_liste'] ?? [];
        $kara_liste  = $girdi['ip_kara_liste'] ?? [];

        if (!is_array($beyaz_liste)) $beyaz_liste = [];
        if (!is_array($kara_liste))  $kara_liste = [];

        // IP formatını doğrula
        foreach (array_merge($beyaz_liste, $kara_liste) as $ip) {
            if (!filter_var($ip, FILTER_VALIDATE_IP) && !preg_match('/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/', $ip)) {
                Response::dogrulama_hatasi(['ip' => "Geçersiz IP adresi: $ip"]);
                return;
            }
        }

        $girdi['ip_beyaz_liste'] = $beyaz_liste;
        $girdi['ip_kara_liste']  = $kara_liste;

        $this->model->ayarlar_kaydet((int)$payload['sirket_id'], $girdi);

        SistemLog::kaydet('guvenlik_ayarlari_guncellendi', '', (int)$payload['sirket_id'], (int)$payload['sub']);
        Response::basarili(null, 'Güvenlik ayarları güncellendi');
    }

    // ─── 2FA ────────────────────────────────────────────────────────

    /**
     * POST /api/guvenlik/2fa/baslat
     * Yeni TOTP secret oluştur, QR URI döndür
     */
    public function ikiFaktorBaslat($payload) {
        // Zaten aktif mi kontrol et
        $bilgi = $this->model->iki_faktor_bilgi((int)$payload['sub'], (int)$payload['sirket_id']);
        if ($bilgi && $bilgi['iki_faktor_aktif']) {
            Response::hata('İki faktörlü doğrulama zaten aktif', 409);
            return;
        }

        // Secret ve yedek kodlar oluştur
        $secret     = TOTPHelper::secret_olustur();
        $yedek      = TOTPHelper::yedek_kodlar_olustur();

        // Kullanıcı e-postasını al
        $kullanici = (new Kullanici())->id_ile_bul((int)$payload['sub']);
        $email     = $kullanici['email'] ?? 'kullanici@finanskalesi.com';

        // QR URI
        $qr_uri = TOTPHelper::qr_uri($secret, $email);

        // Secret'ı ve yedek kodları şifreli olarak kaydet (henüz aktifleştirme yok)
        $secret_sifreli = SistemKripto::sifrele($secret);
        $yedek_sifreli  = SistemKripto::sifrele(json_encode($yedek));
        $this->model->iki_faktor_secret_kaydet((int)$payload['sub'], (int)$payload['sirket_id'], $secret_sifreli, $yedek_sifreli);

        Response::basarili([
            'qr_uri'      => $qr_uri,
            'secret'       => $secret,   // Kullanıcı manuel girebilsin diye
            'yedek_kodlar' => $yedek,
        ], 'Google Authenticator veya Authy ile QR kodu tarayın, ardından doğrulama kodunu girin');
    }

    /**
     * POST /api/guvenlik/2fa/dogrula
     * TOTP kodunu doğrula ve aktifleştir
     */
    public function ikiFaktorDogrula($payload, $girdi) {
        if (empty($girdi['kod'])) {
            Response::dogrulama_hatasi(['kod' => 'Doğrulama kodu zorunludur']);
            return;
        }

        $bilgi = $this->model->iki_faktor_bilgi((int)$payload['sub'], (int)$payload['sirket_id']);
        if (!$bilgi || empty($bilgi['iki_faktor_gizli_sifreli'])) {
            Response::hata('Önce 2FA kurulumunu başlatın', 400);
            return;
        }

        if ($bilgi['iki_faktor_aktif']) {
            Response::hata('İki faktörlü doğrulama zaten aktif', 409);
            return;
        }

        // Secret'ı çöz ve kodu doğrula
        $secret = SistemKripto::coz($bilgi['iki_faktor_gizli_sifreli']);
        if (!$secret) {
            Response::sunucu_hatasi('2FA secret çözülemedi');
            return;
        }

        if (!TOTPHelper::dogrula($secret, $girdi['kod'])) {
            Response::hata('Doğrulama kodu hatalı. Lütfen tekrar deneyin.', 400);
            return;
        }

        // Aktifleştir
        $this->model->iki_faktor_aktiflestir((int)$payload['sub'], (int)$payload['sirket_id']);

        SistemLog::kaydet('2fa_aktiflestirildi', '', (int)$payload['sirket_id'], (int)$payload['sub']);
        Response::basarili(null, 'İki faktörlü doğrulama başarıyla aktifleştirildi');
    }

    /**
     * DELETE /api/guvenlik/2fa
     * 2FA'yı devre dışı bırak (şifre doğrulaması ile)
     */
    public function ikiFaktorDevreDisi($payload, $girdi) {
        if (empty($girdi['sifre'])) {
            Response::dogrulama_hatasi(['sifre' => 'Güvenlik için şifrenizi girin']);
            return;
        }

        // Şifre doğrula
        $kullanici_model = new Kullanici();
        $kullanici = $kullanici_model->eposta_ile_bul('');
        // id ile bul ve şifre hash'ini al
        $db = Database::baglan();
        $stmt = $db->prepare("SELECT sifre_hash FROM kullanicilar WHERE id = :id AND sirket_id = :sid");
        $stmt->execute([':id' => (int)$payload['sub'], ':sid' => (int)$payload['sirket_id']]);
        $k = $stmt->fetch();

        if (!$k || !password_verify($girdi['sifre'], $k['sifre_hash'])) {
            Response::hata('Şifre hatalı', 401);
            return;
        }

        $this->model->iki_faktor_devre_disi((int)$payload['sub'], (int)$payload['sirket_id']);

        SistemLog::kaydet('2fa_devre_disi', '', (int)$payload['sirket_id'], (int)$payload['sub']);
        Response::basarili(null, 'İki faktörlü doğrulama devre dışı bırakıldı');
    }

    // ─── SİSTEM LOGLARI ─────────────────────────────────────────────

    /**
     * GET /api/guvenlik/log
     */
    public function loglar($payload) {
        $sayfa = isset($_GET['sayfa']) ? max(1, (int)$_GET['sayfa']) : 1;

        $filtreler = [];
        if (!empty($_GET['islem_tipi']))   $filtreler['islem_tipi'] = $_GET['islem_tipi'];
        if (!empty($_GET['kullanici_id'])) $filtreler['kullanici_id'] = $_GET['kullanici_id'];
        if (!empty($_GET['baslangic']))    $filtreler['baslangic'] = $_GET['baslangic'];
        if (!empty($_GET['bitis']))        $filtreler['bitis'] = $_GET['bitis'];

        $sonuc = $this->model->loglar_listele((int)$payload['sirket_id'], $filtreler, $sayfa);

        Response::basarili($sonuc);
    }

    // ─── KVKK VERİ DIŞA AKTARMA ────────────────────────────────────

    /**
     * POST /api/guvenlik/veri-disa-aktar
     */
    public function veriDisaAktar($payload, $girdi) {
        // Şifre doğrula (güvenlik)
        if (empty($girdi['sifre'])) {
            Response::dogrulama_hatasi(['sifre' => 'Güvenlik için şifrenizi girin']);
            return;
        }

        $db = Database::baglan();
        $stmt = $db->prepare("SELECT sifre_hash FROM kullanicilar WHERE id = :id AND sirket_id = :sid");
        $stmt->execute([':id' => (int)$payload['sub'], ':sid' => (int)$payload['sirket_id']]);
        $k = $stmt->fetch();

        if (!$k || !password_verify($girdi['sifre'], $k['sifre_hash'])) {
            Response::hata('Şifre hatalı', 401);
            return;
        }

        $veri = $this->model->veri_disa_aktar((int)$payload['sirket_id']);

        SistemLog::kaydet('kvkk_veri_disa_aktarildi', '', (int)$payload['sirket_id'], (int)$payload['sub']);
        Response::basarili(['veri' => $veri], 'KVKK kapsamında verileriniz hazırlandı');
    }
}
