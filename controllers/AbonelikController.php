<?php
/**
 * Finans Kalesi — Abonelik Controller
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
