<?php
/**
 * ParamGo — Abonelik Controller
 *
 * GET  /api/abonelik/planlar   → Tüm planları fiyatlarıyla döndür
 * GET  /api/abonelik/durum     → Kullanıcının mevcut planı + deneme bilgisi
 * GET  /api/abonelik/gecmis    → Ödeme geçmişi
 * POST /api/abonelik/yukselt   → Plan yükseltme talebi (şimdilik placeholder)
 */

class AbonelikController {

    private Abonelik $abonelik_model;
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->abonelik_model = new Abonelik($db);
    }

    /**
     * Tüm planları listele
     * JWT gerektirmez — kayıt sayfasında da gösterilebilsin
     */
    public function planlar(): void {
        $planlar = $this->abonelik_model->planListesi();
        Response::basarili([
            'planlar' => $planlar,
        ]);
    }

    /**
     * iyzico aboneliğini iyzico API'den senkronize et.
     * Eğer iyzico'da CANCELED ise DB'de durum='iptal_planlandi' yap.
     * Eğer iyzico'da EXPIRED ise durum='pasif' yap.
     * Hatalar bloklamaz — sadece log atılır.
     */
    private function iyzicoSenkronizeEt(int $sirket_id): void {
        try {
            $abonelik = $this->abonelik_model->guncelPlan($sirket_id);
            if (!$abonelik || ($abonelik['odeme_kanali'] ?? '') !== 'iyzico') return;
            if (($abonelik['durum'] ?? '') !== 'aktif') return; // sadece aktif olanları kontrol et

            $iyzico_ref = $abonelik['iyzico_abonelik_kodu'] ?? null;
            if (!$iyzico_ref) return;

            $iyzico_durum = IyzicoHelper::abonelikDurumCek($iyzico_ref);
            if (!$iyzico_durum) return;

            if ($iyzico_durum === 'CANCELED') {
                $stmt = $this->db->prepare("UPDATE abonelikler SET durum='iptal_planlandi' WHERE sirket_id=:sid AND durum='aktif'");
                $stmt->execute([':sid' => $sirket_id]);
                error_log("iyzico sync: sirket={$sirket_id} CANCELED -> iptal_planlandi");
            } elseif ($iyzico_durum === 'EXPIRED') {
                // Plan tamamen kapandı — abonelikler pasife, sirketler.abonelik_plani='deneme'
                // deneme_bitis=NULL → modüllerde paywall açılır
                // trial_kullanildi bayrağı KORUNUR (planSifirla dokunmuyor)
                $this->abonelik_model->planSifirla($sirket_id);
                error_log("iyzico sync: sirket={$sirket_id} EXPIRED -> plan sifirlandi (deneme/null)");
            }
        } catch (\Throwable $e) {
            error_log("iyzico sync exception sirket={$sirket_id}: " . $e->getMessage());
        }
    }

    /**
     * Kullanıcının aktif plan durumunu döndür
     *
     * RevenueCat Senkronizasyonu:
     * Çağrıldığında DB planı ücretliyse RevenueCat ile sessiz senkronizasyon yapar.
     * Böylece aynı Apple ID ile farklı hesaplar arasında transfer olmuş
     * abonelikler backend'de otomatik temizlenir (Revenue Leak koruması).
     */
    public function durum(): void {
        $payload = AuthMiddleware::dogrula();
        $sirket_id = (int) $payload['sirket_id'];

        // Sessiz RC senkronizasyonu — sadece ücretli planda olanlar için çalışır
        // Hata olursa bloklamaz, sadece log atar (RevenueCatHelper içinde try/catch)
        RevenueCatHelper::planSenkronizeEt($sirket_id, $this->db);

        // Sessiz iyzico senkronizasyonu — iyzico'da iptal/expired olduysa DB'yi güncelle
        $this->iyzicoSenkronizeEt($sirket_id);

        $abonelik = $this->abonelik_model->guncelPlan($sirket_id);

        if (!$abonelik) {
            // Aktif abonelik kaydı yok — sirketler tablosundan gerçek planı oku
            $sirketPlan = $this->abonelik_model->sirketPlanBilgisi($sirket_id);
            $gercekPlan = $sirketPlan['abonelik_plani'] ?? 'deneme';
            $abonelikBitis = $sirketPlan['abonelik_bitis'] ?? null;

            // Ücretli plan görünüyor ama abonelikler tablosunda aktif kayıt yok
            // → İki ihtimal: (1) iptal edildi dönem sonu bekleniyor, (2) süre geçti senkron olmadı
            if ($gercekPlan && $gercekPlan !== 'deneme') {
                $bitisGecti = $abonelikBitis && strtotime($abonelikBitis) < time();
                if ($bitisGecti) {
                    // Süre dolmuş + senkron olmamış → planı sıfırla, paywall göster
                    $this->abonelik_model->planSifirla($sirket_id);
                    error_log("durum(): sirket={$sirket_id} plan suresi dolmus, sifirlandi");
                    Response::basarili([
                        'plan'              => 'deneme',
                        'plan_adi'          => '7 Gün Deneme',
                        'bitis_tarihi'      => null,
                        'odeme_kanali'      => null,
                        'odeme_donemi'      => null,
                        'deneme'            => true,
                        'deneme_bitis'      => null,
                        'deneme_kalan_gun'  => 0,
                        'deneme_doldu'      => true,
                    ]);
                    return;
                }

                // Süre devam ediyor → iptal planlandı, dönem sonuna kadar erişim
                Response::basarili([
                    'plan'             => $gercekPlan,
                    'plan_adi'         => $this->plan_gorsel_adi($gercekPlan),
                    'bitis_tarihi'     => $abonelikBitis,
                    'odeme_kanali'     => 'iyzico',
                    'odeme_donemi'     => null,
                    'deneme'           => false,
                    'deneme_bitis'     => null,
                    'deneme_kalan_gun' => null,
                    'deneme_doldu'     => false,
                    'iptal_planlandi'  => true,
                ]);
                return;
            }

            // Gerçekten deneme planı — yeni sistemde deneme_bitis NULL olur, deneme_doldu=true
            Response::basarili([
                'plan'              => 'deneme',
                'plan_adi'          => '7 Gün Deneme',
                'bitis_tarihi'      => null,
                'odeme_kanali'      => null,
                'odeme_donemi'      => null,
                'deneme'            => true,
                'deneme_bitis'      => $sirketPlan['deneme_bitis'] ?? null,
                'deneme_kalan_gun'  => 0,
                'deneme_doldu'      => true,
            ]);
            return;
        }

        // Deneme bilgilerini hesapla
        $plan = $abonelik['abonelik_plani'] ?? $abonelik['plan_adi'];
        $deneme = $plan === 'deneme';
        $deneme_bitis = $abonelik['deneme_bitis'] ?? null;
        $deneme_kalan_gun = $deneme ? $this->abonelik_model->denemeKalanGun($sirket_id) : null;
        $deneme_doldu = $deneme ? $this->abonelik_model->denemeSuresiDolduMu($sirket_id) : false;

        Response::basarili([
            'plan'              => $plan,
            'plan_adi'          => $this->plan_gorsel_adi($plan),
            'bitis_tarihi'      => $abonelik['bitis_tarihi'],
            'odeme_kanali'      => $abonelik['odeme_kanali'],
            'odeme_donemi'      => $abonelik['odeme_donemi'],
            'baslangic_tarihi'  => $abonelik['baslangic_tarihi'],
            'deneme'            => $deneme,
            'deneme_bitis'      => $deneme_bitis,
            'deneme_kalan_gun'  => $deneme_kalan_gun,
            'deneme_doldu'      => $deneme_doldu,
            'iptal_planlandi'   => ($abonelik['durum'] ?? '') === 'iptal_planlandi',
        ]);
    }

    /**
     * Ödeme geçmişini döndür
     */
    public function gecmis(): void {
        $payload = AuthMiddleware::dogrula();
        $sirket_id = (int) $payload['sirket_id'];

        $gecmis = $this->abonelik_model->gecmis($sirket_id);
        Response::basarili(['gecmis' => $gecmis]);
    }

    /**
     * Plan yükseltme — iyzico Checkout Form başlat (Web)
     * POST /api/abonelik/yukselt
     * Header: X-Platform: web
     */
    public function yukselt(array $girdi): void {
        $payload = AuthMiddleware::dogrula();

        // iOS cihazdan gelirse Apple IAP'a yönlendir
        $platform = $_SERVER['HTTP_X_PLATFORM'] ?? 'web';
        if ($platform === 'ios') {
            Response::hata('iOS ödemeleri uygulama üzerinden yapılır', 400);
            return;
        }

        if ($payload['rol'] !== 'sahip') {
            Response::hata('Plan değiştirme yetkiniz yok', 403);
            return;
        }

        $sirket_id    = (int) $payload['sirket_id'];
        $plan_adi     = $girdi['plan_adi'] ?? null;
        $odeme_donemi = $girdi['odeme_donemi'] ?? null;

        // Duplicate koruma — gerçek anlamda aktif (iptal planlanmamış) bir plan varsa engelle
        $mevcut_plan = $this->abonelik_model->sirketPlanBilgisi($sirket_id);
        $aktif_plan = $mevcut_plan['abonelik_plani'] ?? 'deneme';
        if ($aktif_plan && $aktif_plan !== 'deneme') {
            // abonelikler tablosundaki güncel durumu kontrol et
            $guncel = $this->abonelik_model->guncelPlan($sirket_id);
            $mevcut_durum = is_array($guncel) ? ($guncel['durum'] ?? null) : null;
            // Sadece gerçekten aktif ise engelle; iptal_planlandi veya kayıt yok ise yeniden aboneliğe izin ver
            if ($mevcut_durum === 'aktif') {
                error_log("yukselt: zaten aktif plan var sirket={$sirket_id} plan={$aktif_plan}");
                Response::hata(
                    'Zaten aktif bir aboneliğiniz var (' . $aktif_plan . '). Plan değiştirmek için önce mevcut aboneliği iptal edin.',
                    400
                );
                return;
            }
            error_log("yukselt: iptal_planlandi veya eski iptal, yeniden abone olunuyor sirket={$sirket_id} durum=" . ($mevcut_durum ?? 'yok'));
        }

        if (!in_array($plan_adi, ['standart', 'kurumsal'], true)) {
            Response::dogrulama_hatasi(['plan_adi' => 'Geçerli plan: standart veya kurumsal']);
            return;
        }

        if (!in_array($odeme_donemi, ['aylik', 'yillik'], true)) {
            Response::dogrulama_hatasi(['odeme_donemi' => 'Geçerli dönem: aylik veya yillik']);
            return;
        }

        // Kullanıcı + şirket bilgilerini DB'den al
        $stmt = $this->db->prepare("
            SELECT k.ad_soyad, k.email, k.telefon,
                   s.firma_adi, s.adres AS sirket_adres
            FROM kullanicilar k
            JOIN sirketler s ON s.id = k.sirket_id
            WHERE k.id = :kullanici_id AND k.sirket_id = :sirket_id
            LIMIT 1
        ");
        $stmt->execute([':kullanici_id' => (int)$payload['sub'], ':sirket_id' => $sirket_id]);
        $kullanici = $stmt->fetch();

        if (!$kullanici) {
            Response::hata('Kullanıcı bulunamadı', 404);
            return;
        }

        // ad_soyad'ı ad + soyad'a böl
        $ad_soyad = trim($kullanici['ad_soyad'] ?? '');
        $parcalar = preg_split('/\s+/', $ad_soyad, 2);
        $ad    = $parcalar[0] ?? 'Ad';
        $soyad = $parcalar[1] ?? 'Soyad';

        // Telefon: yoksa iyzico'ya boş gönder, kullanıcıyı engelleme
        $telefon_ham = trim($kullanici['telefon'] ?? '');
        $telefon_rakam = preg_replace('/\D/', '', $telefon_ham);
        $telefon_iyzico = strlen($telefon_rakam) >= 10 ? $kullanici['telefon'] : '';

        // Adres: gerçek adres yoksa firma adıyla unique bir adres üret
        $sirket_adres = trim($kullanici['sirket_adres'] ?? '');
        $firma_adi    = trim($kullanici['firma_adi'] ?? 'ParamGo Müşterisi');
        $adres = $sirket_adres ?: ($firma_adi . ' (Adres bilgisi profilden eklenmemiştir)');

        $musteri = [
            'sirket_id' => $sirket_id,
            'ad'        => $ad,
            'soyad'     => $soyad,
            'email'     => $kullanici['email'],
            'telefon'   => $telefon_iyzico,
            'tc_kimlik' => '11111111111',
            'firma_adi' => $firma_adi,
            'adres'     => $adres,
        ];

        $callback_url = 'https://paramgo.com/odeme-tamamlandi.php?plan=' . $plan_adi . '&donem=' . $odeme_donemi;

        // Trial bayrağı: bu şirket daha önce trial kullandı mı?
        // Kullandıysa iyzico'ya trial'sız UUID gönderilir → kart girer girmez ödeme alınır.
        $trial_kullanildi = $this->abonelik_model->trialKullanildiMi($sirket_id);

        try {
            $sonuc = IyzicoHelper::checkoutBaslat($plan_adi, $odeme_donemi, $musteri, $callback_url, $trial_kullanildi);
        } catch (\Throwable $e) {
            error_log('iyzico yukselt hatasi: ' . $e->getMessage() . ' sirket=' . $sirket_id . ' | ' . $e->getFile() . ':' . $e->getLine());
            Response::hata('Ödeme sistemi şu an yanıt vermiyor, lütfen tekrar deneyin', 503);
            return;
        }

        Response::basarili([
            'token'        => $sonuc['token'],
            'form_content' => $sonuc['form_content'],
        ], 'Ödeme sayfası hazırlandı');
    }

    /**
     * iyzico Manuel Doğrulama — Webhook beklemeden plan aktif et
     * POST /api/abonelik/iyzico-dogrula
     *
     * Frontend ödeme bittikten sonra bu endpointi çağırır.
     * Eğer iyzico'da abonelik aktifse, plan'ı backend'de aktive eder.
     */
    public function iyzicoDogrula(array $girdi): void {
        $payload = AuthMiddleware::dogrula();
        if ($payload['rol'] !== 'sahip') {
            Response::hata('Yetkiniz yok', 403);
            return;
        }

        $sirket_id = (int) $payload['sirket_id'];
        $token     = $girdi['token'] ?? '';

        if (!$token) {
            Response::dogrulama_hatasi(['token' => 'Ödeme tokenı gerekli']);
            return;
        }

        try {
            $sonuc = IyzicoHelper::checkoutSonucSorgula($token);
        } catch (\Throwable $e) {
            error_log('iyzico dogrula hatasi: ' . $e->getMessage());
            Response::hata('iyzico bağlantı hatası: ' . $e->getMessage(), 500);
            return;
        }

        if (!($sonuc['basarili'] ?? false)) {
            Response::hata($sonuc['hata'] ?? 'Doğrulama başarısız', 400);
            return;
        }

        $abonelik_ref = $sonuc['abonelik_ref'] ?? '';
        $musteri_ref  = $sonuc['musteri_ref']  ?? '';
        $plan_kodu    = $sonuc['plan_kodu']    ?? '';

        if (!$abonelik_ref) {
            Response::hata('Abonelik henüz oluşturulmadı, biraz bekleyip tekrar deneyin', 404);
            return;
        }

        // Plan kodunu plan_adi + odeme_donemi'ne çevir
        $plan_adi = '';
        $odeme_donemi = '';
        foreach (IyzicoHelper::PLAN_KODLARI as $p => $donemler) {
            foreach ($donemler as $d => $kod) {
                if ($kod === $plan_kodu) {
                    $plan_adi = $p;
                    $odeme_donemi = $d;
                    break 2;
                }
            }
        }

        if (!$plan_adi) {
            error_log('iyzico dogrula: plan_kodu eslesmedi=' . $plan_kodu);
            Response::hata('Plan tanınamadı', 500);
            return;
        }

        // Bitiş tarihi — dogrula anında henüz para çekilmedi, 7 günlük deneme başladı.
        // Gerçek ödeme yapılınca webhook subscription.order.success gelir ve bitis güncellenir.
        $bitis = date('Y-m-d H:i:s', strtotime('+7 days'));

        $abonelik_id = $this->abonelik_model->planGuncelle(
            $sirket_id, $plan_adi, $odeme_donemi, 'iyzico', $bitis
        );

        $this->abonelik_model->iyzicoReferansKaydet($sirket_id, $musteri_ref, $abonelik_ref);

        // KRİTİK: Trial bayrağını işaretle — "1 kişi 1 kez trial" kuralı
        // Bu kullanıcı bir daha abone olursa iyzico'ya trial'sız plan gönderilecek
        $this->abonelik_model->trialKullanildiIsaretle($sirket_id);

        // Yeni JWT
        $kullanici_bilgi = [
            'id'        => (int) $payload['sub'],
            'sirket_id' => $sirket_id,
            'rol'       => $payload['rol'],
            'tema_adi'  => $payload['tema_adi'] ?? 'paramgo',
            'plan'      => $plan_adi,
            'yetkiler'  => $payload['yetkiler'] ?? null,
        ];

        $access_token = JWTHelper::access_token_olustur($kullanici_bilgi);
        $refresh_data = JWTHelper::refresh_token_olustur($kullanici_bilgi);

        Response::basarili([
            'plan'     => $plan_adi,
            'tokenlar' => [
                'access_token'  => $access_token,
                'refresh_token' => $refresh_data['token'],
            ],
        ], 'Aboneliğiniz aktifleştirildi');
    }

    /**
     * iyzico — Abonelik referans kodu ile manuel aktivasyon
     * POST /api/abonelik/iyzico-aktive { abonelik_ref }
     *
     * Kullanıcı iyzico panelinden abonelik referans kodunu kopyalayıp girer.
     * Backend bu kodu iyzico'da sorgular, aktifse plan'ı bizim sistemde aktive eder.
     */
    public function iyzicoAktive(array $girdi): void {
        $payload = AuthMiddleware::dogrula();
        if ($payload['rol'] !== 'sahip') {
            Response::hata('Yetkiniz yok', 403);
            return;
        }

        $sirket_id    = (int) $payload['sirket_id'];
        $abonelik_ref = trim($girdi['abonelik_ref'] ?? '');

        if (!$abonelik_ref) {
            Response::dogrulama_hatasi(['abonelik_ref' => 'Abonelik referans kodu gerekli']);
            return;
        }

        try {
            $detay = IyzicoHelper::abonelikDetay($abonelik_ref);
        } catch (\Throwable $e) {
            error_log('iyzico aktive hatasi: ' . $e->getMessage());
            Response::hata('iyzico bağlantı hatası: ' . $e->getMessage(), 500);
            return;
        }

        if (!($detay['basarili'] ?? false)) {
            Response::hata($detay['hata'] ?? 'Abonelik bulunamadı', 404);
            return;
        }

        if (($detay['durum'] ?? '') !== 'ACTIVE') {
            Response::hata('Abonelik aktif değil. Durum: ' . ($detay['durum'] ?? 'bilinmiyor'), 400);
            return;
        }

        $plan_kodu = $detay['plan_kodu'] ?? '';
        $musteri_ref = $detay['musteri_ref'] ?? '';

        // Plan kodunu plan_adi + odeme_donemi'ne çevir
        $plan_adi = '';
        $odeme_donemi = '';
        foreach (IyzicoHelper::PLAN_KODLARI as $p => $donemler) {
            foreach ($donemler as $d => $kod) {
                if ($kod === $plan_kodu) {
                    $plan_adi = $p;
                    $odeme_donemi = $d;
                    break 2;
                }
            }
        }

        if (!$plan_adi) {
            error_log('iyzico aktive: plan_kodu eslesmedi=' . $plan_kodu);
            Response::hata('Plan kodu tanınamadı: ' . $plan_kodu, 500);
            return;
        }

        $bitis = $odeme_donemi === 'yillik'
            ? date('Y-m-d H:i:s', strtotime('+1 year'))
            : date('Y-m-d H:i:s', strtotime('+1 month'));

        $abonelik_id = $this->abonelik_model->planGuncelle(
            $sirket_id, $plan_adi, $odeme_donemi, 'iyzico', $bitis
        );

        if ($musteri_ref) {
            $this->abonelik_model->iyzicoReferansKaydet($sirket_id, $musteri_ref, $abonelik_ref);
        }

        // KRİTİK: Trial bayrağını işaretle — "1 kişi 1 kez trial" kuralı
        $this->abonelik_model->trialKullanildiIsaretle($sirket_id);

        $kullanici_bilgi = [
            'id'        => (int) $payload['sub'],
            'sirket_id' => $sirket_id,
            'rol'       => $payload['rol'],
            'tema_adi'  => $payload['tema_adi'] ?? 'paramgo',
            'plan'      => $plan_adi,
            'yetkiler'  => $payload['yetkiler'] ?? null,
        ];

        $access_token = JWTHelper::access_token_olustur($kullanici_bilgi);
        $refresh_data = JWTHelper::refresh_token_olustur($kullanici_bilgi);

        Response::basarili([
            'plan'     => $plan_adi,
            'tokenlar' => [
                'access_token'  => $access_token,
                'refresh_token' => $refresh_data['token'],
            ],
        ], 'Aboneliğiniz başarıyla aktifleştirildi');
    }

    /**
     * iyzico abonelik iptal
     * POST /api/abonelik/iyzico-iptal
     */
    public function iyzicoIptal(): void {
        $payload = AuthMiddleware::dogrula();

        if ($payload['rol'] !== 'sahip') {
            Response::hata('Abonelik iptal yetkiniz yok', 403);
            return;
        }

        $sirket_id = (int) $payload['sirket_id'];
        $abonelik  = $this->abonelik_model->guncelPlan($sirket_id);

        if (!$abonelik || ($abonelik['odeme_kanali'] ?? '') !== 'iyzico') {
            Response::hata('Aktif iyzico aboneliği bulunamadı', 404);
            return;
        }

        $iyzico_ref     = $abonelik['iyzico_abonelik_kodu'] ?? null;
        $iyzico_musteri = $abonelik['iyzico_musteri_id']    ?? null;

        // Fallback: DB'de abonelik kodu yoksa müşteri kodu ile iyzico'dan listele ve bul
        if (!$iyzico_ref && $iyzico_musteri) {
            error_log("iyzico iptal fallback: sirket={$sirket_id} musteri={$iyzico_musteri} — iyzico'dan listeleniyor");
            $iyzico_ref = IyzicoHelper::aktifAbonelikRefBul($iyzico_musteri);
            if ($iyzico_ref) {
                // Bulduğumuz kodu DB'ye yaz, bir daha aramayalım
                $stmt = $this->db->prepare("UPDATE sirketler SET iyzico_abonelik_kodu = :ref WHERE id = :sid");
                $stmt->execute([':ref' => $iyzico_ref, ':sid' => $sirket_id]);
            }
        }

        if (!$iyzico_ref) {
            Response::hata('iyzico abonelik kodu bulunamadı. Lütfen destek ile iletişime geçin.', 500);
            return;
        }

        $basarili = IyzicoHelper::abonelikIptal($iyzico_ref);
        if (!$basarili) {
            Response::hata('Abonelik iptal edilemedi, lütfen destek ile iletişime geçin', 500);
            return;
        }

        // Aboneliği iptal_planlandi olarak işaretle (mevcut dönem sonuna kadar aktif kalmaya devam eder)
        $stmt = $this->db->prepare("
            UPDATE abonelikler
            SET durum = 'iptal_planlandi'
            WHERE sirket_id = :sid AND durum = 'aktif'
        ");
        $stmt->execute([':sid' => $sirket_id]);

        error_log("iyzico iptal: sirket={$sirket_id} ref={$iyzico_ref}");
        Response::basarili([], 'Aboneliğiniz dönem sonunda iptal edilecek');
    }

    /**
     * Apple IAP satın alma doğrula ve planı aktifleştir
     * POST /api/abonelik/iap-dogrula
     *
     * Akış:
     *   1. Mobil uygulama IAP satın alımı tamamlar (RevenueCat SDK)
     *   2. Bu endpoint'i çağırır
     *   3. RevenueCat REST API'ye doğrulama yapılır
     *   4. Aktif abonelik bulunursa DB güncellenir ve yeni JWT döndürülür
     */
    public function iapDogrula(): void {
        $payload = AuthMiddleware::dogrula();
        $sirket_id = (int) $payload['sirket_id'];

        // Yalnızca hesap sahibi plan değiştirebilir
        if ($payload['rol'] !== 'sahip') {
            Response::hata('Yalnızca hesap sahibi abonelik değiştirebilir', 403);
            return;
        }

        // RevenueCat müşteri ID
        $musteri_id = "sirket_{$sirket_id}";

        // RevenueCat REST API'ye abone bilgisi sor
        $rc_secret = getenv('REVENUECAT_SECRET_KEY');
        if (!$rc_secret) {
            error_log('IAP: REVENUECAT_SECRET_KEY env degiskeni tanimli degil');
            Response::sunucu_hatasi('Ödeme sistemi yapılandırılmamış');
            return;
        }

        $rc_url = "https://api.revenuecat.com/v1/subscribers/" . urlencode($musteri_id);
        $ch = curl_init($rc_url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER     => [
                "Authorization: Bearer {$rc_secret}",
                "Content-Type: application/json",
            ],
        ]);
        $yanit    = curl_exec($ch);
        $http_kod = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_err = curl_error($ch);
        $curl_no  = curl_errno($ch);
        curl_close($ch);

        if ($curl_no || !$yanit) {
            error_log("IAP: curl hatasi #{$curl_no}: {$curl_err} musteri={$musteri_id}");
            Response::hata('Ödeme sunucusuna bağlanılamadı, lütfen tekrar deneyin', 503);
            return;
        }

        if ($http_kod === 401) {
            error_log("IAP: RevenueCat API 401 Unauthorized — secret key hatalı olabilir musteri={$musteri_id}");
            Response::sunucu_hatasi('Ödeme sistemi yetkilendirme hatası');
            return;
        }

        if ($http_kod === 404) {
            error_log("IAP: RevenueCat 404 — abone bulunamadı musteri={$musteri_id} yanit=" . substr($yanit, 0, 200));

            // Revenue Leak Koruması:
            // DB'de ücretli plan varsa ve RevenueCat 404 diyorsa, abonelik artık
            // bu sirket'e bağlı değil (transfer, iptal, expiration). Plan'ı 'deneme'ye
            // düşürerek DB'yi senkronize et.
            $mevcut = $this->abonelik_model->guncelPlan($sirket_id);
            $mevcut_plan = $mevcut['plan_adi'] ?? 'deneme';
            if (in_array($mevcut_plan, ['standart', 'kurumsal'], true)) {
                $this->abonelik_model->planGuncelle($sirket_id, 'deneme', null, null, null);
                error_log("IAP 404 sync: sirket={$sirket_id} plan temizlendi ({$mevcut_plan} → deneme)");
                Response::hata('Aboneliğiniz artık bu hesaba bağlı değil. Başka bir Apple ID veya hesap üzerinden aktifleştirilmiş olabilir.', 404);
                return;
            }

            Response::hata('Abonelik kaydı henüz oluşmadı, birkaç saniye sonra tekrar deneyin', 404);
            return;
        }

        if ($http_kod !== 200) {
            error_log("IAP: RevenueCat API hatasi HTTP={$http_kod} musteri={$musteri_id} yanit=" . substr($yanit, 0, 200));
            Response::hata('Abonelik doğrulaması şu an yapılamıyor, lütfen tekrar deneyin', 502);
            return;
        }

        $rc = json_decode($yanit, true);
        $abone = $rc['subscriber'] ?? null;

        if (!$abone) {
            Response::hata('Abone kaydı bulunamadı', 404);
            return;
        }

        // Aktif aboneliği bul (subscriptions veya entitlements)
        $aktif_plan  = null;
        $aktif_donem = null;
        $bitis_str   = null;
        $deneme_mi   = false;

        // Plan öncelik sırası: kurumsal > standart
        $plan_onceligi = ['kurumsal' => 2, 'standart' => 1];

        // Tüm aktif abonelikleri tara — en yüksek planı seç (break YOK)
        foreach (($abone['subscriptions'] ?? []) as $urun_id => $urun) {
            $bitis_ts = isset($urun['expires_date'])
                ? strtotime($urun['expires_date'])
                : 0;
            if ($bitis_ts <= time()) continue;

            $plan_adayi = null;
            if (str_contains($urun_id, 'kurumsal'))    $plan_adayi = 'kurumsal';
            elseif (str_contains($urun_id, 'standart')) $plan_adayi = 'standart';
            if (!$plan_adayi) continue;

            // Mevcut bulgudan daha yüksek öncelikli mi?
            $mevcut_onc = $plan_onceligi[$aktif_plan] ?? 0;
            $yeni_onc   = $plan_onceligi[$plan_adayi];
            if ($yeni_onc > $mevcut_onc) {
                $aktif_plan  = $plan_adayi;
                $aktif_donem = str_contains($urun_id, 'yillik') ? 'yillik' : 'aylik';
                $bitis_str   = date('Y-m-d H:i:s', $bitis_ts);
                $deneme_mi   = ($urun['period_type'] ?? '') === 'trial';
            }
        }

        // Subscription bulunamadıysa entitlements'a bak (fallback)
        if (!$aktif_plan) {
            foreach (($abone['entitlements'] ?? []) as $ent) {
                $bitis_ts = isset($ent['expires_date'])
                    ? strtotime($ent['expires_date'])
                    : 0;
                if ($bitis_ts <= time()) continue;

                $pid = $ent['product_identifier'] ?? '';
                $plan_adayi = null;
                if (str_contains($pid, 'kurumsal'))    $plan_adayi = 'kurumsal';
                elseif (str_contains($pid, 'standart')) $plan_adayi = 'standart';
                if (!$plan_adayi) continue;

                $mevcut_onc = $plan_onceligi[$aktif_plan] ?? 0;
                $yeni_onc   = $plan_onceligi[$plan_adayi];
                if ($yeni_onc > $mevcut_onc) {
                    $aktif_plan  = $plan_adayi;
                    $aktif_donem = str_contains($pid, 'yillik') ? 'yillik' : 'aylik';
                    $bitis_str   = date('Y-m-d H:i:s', $bitis_ts);
                    $deneme_mi   = ($ent['period_type'] ?? '') === 'trial';
                }
            }
        }

        if (!$aktif_plan) {
            Response::hata('Aktif abonelik bulunamadı. Satın alım doğrulanamadı.', 404);
            return;
        }

        // DB güncelle
        $this->abonelik_model->revenueCatMusteriIdKaydet($sirket_id, $musteri_id);

        $abonelik_id = $this->abonelik_model->planGuncelle(
            $sirket_id, $aktif_plan, $aktif_donem, 'apple', $bitis_str
        );

        // KRİTİK: Trial bayrağını işaretle — Apple IAP üzerinden trial kullanıldı,
        // bu kullanıcı sonradan iyzico'ya geçerse trial'sız plan ile ödeme alınır
        $this->abonelik_model->trialKullanildiIsaretle($sirket_id);

        // Deneme dışında ödeme kaydı oluştur (aynı gün aynı plan+dönem için tekrar kayıt açma)
        if (!$deneme_mi && !$this->abonelik_model->bugunOdemeVarMi($sirket_id, $aktif_plan, $aktif_donem)) {
            $tutar = Abonelik::FIYATLAR[$aktif_plan][$aktif_donem] ?? 0;
            $this->abonelik_model->odemeKaydet($sirket_id, $abonelik_id, [
                'plan_adi'     => $aktif_plan,
                'odeme_donemi' => $aktif_donem,
                'odeme_kanali' => 'apple',
                'tutar'        => $tutar,
                'para_birimi'  => 'TRY',
                'referans_no'  => $musteri_id,
                'durum'        => 'tamamlandi',
                'odeme_tarihi' => date('Y-m-d H:i:s'),
            ]);
        }

        // Yeni JWT oluştur (güncel plan ile)
        $kullanici_bilgi = [
            'id'        => (int) $payload['sub'],
            'sirket_id' => $sirket_id,
            'rol'       => $payload['rol'],
            'tema_adi'  => $payload['tema_adi'] ?? 'paramgo',
            'plan'      => $aktif_plan,
            'yetkiler'  => $payload['yetkiler'] ?? null,
        ];

        $access_token = JWTHelper::access_token_olustur($kullanici_bilgi);
        $refresh_data = JWTHelper::refresh_token_olustur($kullanici_bilgi);

        Response::basarili([
            'plan'    => $aktif_plan,
            'tokenlar' => [
                'access_token'  => $access_token,
                'refresh_token' => $refresh_data['token'],
            ],
        ], 'Abonelik başarıyla aktifleştirildi');
    }

    // ─────────────────────────────────────────
    // YARDIMCI
    // ─────────────────────────────────────────

    private function plan_gorsel_adi(string $plan): string {
        return match ($plan) {
            'deneme'   => '7 Gün Deneme',
            'standart' => 'Standart',
            'kurumsal' => 'Kurumsal',
            default    => ucfirst($plan),
        };
    }
}
