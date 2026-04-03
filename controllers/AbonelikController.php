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

    public function __construct(PDO $db) {
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
     * Kullanıcının aktif plan durumunu döndür
     */
    public function durum(): void {
        $payload = AuthMiddleware::dogrula();
        $sirket_id = (int) $payload['sirket_id'];

        $abonelik = $this->abonelik_model->guncelPlan($sirket_id);

        if (!$abonelik) {
            // Aktif abonelik kaydı yok — sirketler tablosundan gerçek planı oku
            $sirketPlan = $this->abonelik_model->sirketPlanBilgisi($sirket_id);
            $gercekPlan = $sirketPlan['abonelik_plani'] ?? 'deneme';
            if ($gercekPlan && $gercekPlan !== 'deneme') {
                // Geçerli ücretli plan var ama abonelikler tablosunda aktif kayıt yok
                // (veri tutarsızlığı — planı düzgün göster)
                Response::basarili([
                    'plan'             => $gercekPlan,
                    'plan_adi'         => $this->plan_gorsel_adi($gercekPlan),
                    'bitis_tarihi'     => $sirketPlan['abonelik_bitis'] ?? null,
                    'odeme_kanali'     => null,
                    'odeme_donemi'     => null,
                    'deneme'           => false,
                    'deneme_bitis'     => null,
                    'deneme_kalan_gun' => null,
                    'deneme_doldu'     => false,
                ]);
            } else {
                // Gerçekten deneme planı — doldu olarak işaretle
                Response::basarili([
                    'plan'              => 'deneme',
                    'plan_adi'          => '30 Gün Deneme',
                    'bitis_tarihi'      => null,
                    'odeme_kanali'      => null,
                    'odeme_donemi'      => null,
                    'deneme'            => true,
                    'deneme_bitis'      => $sirketPlan['deneme_bitis'] ?? null,
                    'deneme_kalan_gun'  => 0,
                    'deneme_doldu'      => true,
                ]);
            }
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
     * Plan yükseltme talebi
     * Şimdilik placeholder — gerçek ödeme entegrasyonu sonraki aşamada
     */
    public function yukselt(array $girdi): void {
        $payload = AuthMiddleware::dogrula();

        // Yalnızca şirket sahibi plan değiştirebilir
        if ($payload['rol'] !== 'sahip') {
            Response::hata('Plan değiştirme yetkiniz yok', 403);
            return;
        }

        // Zorunlu alanlar
        $plan_adi = $girdi['plan_adi'] ?? null;
        $odeme_donemi = $girdi['odeme_donemi'] ?? null;

        if (!in_array($plan_adi, ['standart', 'kurumsal'], true)) {
            Response::dogrulama_hatasi(['plan_adi' => 'Geçerli plan: standart veya kurumsal']);
            return;
        }

        if (!in_array($odeme_donemi, ['aylik', 'yillik'], true)) {
            Response::dogrulama_hatasi(['odeme_donemi' => 'Geçerli dönem: aylik veya yillik']);
            return;
        }

        // TODO: Ödeme sağlayıcısına yönlendirme buraya eklenecek
        $fiyat = Abonelik::FIYATLAR[$plan_adi][$odeme_donemi];

        Response::basarili([
            'mesaj'        => 'Ödeme sistemi yakında entegre edilecek.',
            'plan_adi'     => $plan_adi,
            'odeme_donemi' => $odeme_donemi,
            'tutar'        => $fiyat,
            'durum'        => 'bekliyor_entegrasyon',
        ], 'Plan yükseltme talebi alındı');
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

        $ch = curl_init("https://api.revenuecat.com/v1/subscribers/" . urlencode($musteri_id));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_HTTPHEADER     => [
                "Authorization: Bearer {$rc_secret}",
                "Content-Type: application/json",
                "X-Platform: ios",
            ],
        ]);
        $yanit    = curl_exec($ch);
        $http_kod = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_err = curl_error($ch);
        curl_close($ch);

        if ($http_kod !== 200 || !$yanit) {
            error_log("IAP: RevenueCat API hatasi HTTP={$http_kod} musteri={$musteri_id} curl_err={$curl_err}");
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

        // Deneme dışında ödeme kaydı oluştur
        if (!$deneme_mi) {
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
            'deneme'   => '30 Gün Deneme',
            'standart' => 'Standart',
            'kurumsal' => 'Kurumsal',
            default    => ucfirst($plan),
        };
    }
}
