<?php
/**
 * Finans Kalesi — Abonelik Controller
 *
 * GET  /api/abonelik/planlar   → Tüm planları fiyatlarıyla döndür
 * GET  /api/abonelik/durum     → Kullanıcının mevcut planı
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
            'planlar'          => $planlar,
            'kampanya_aktif'   => $this->abonelik_model->kampanyaAktifMi(),
            'kampanya_fiyat'   => Abonelik::KAMPANYA_FIYAT,
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
            // Abonelik kaydı yoksa ücretsiz plan döndür
            Response::basarili([
                'plan'              => 'ucretsiz',
                'plan_adi'          => 'Ücretsiz',
                'bitis_tarihi'      => null,
                'odeme_kanali'      => null,
                'odeme_donemi'      => null,
                'kampanya_kullanici'=> false,
                'kampanya_fiyat'    => null,
            ]);
            return;
        }

        Response::basarili([
            'plan'               => $abonelik['plan_adi'],
            'plan_adi'           => $this->plan_gorsel_adi($abonelik['plan_adi']),
            'bitis_tarihi'       => $abonelik['bitis_tarihi'],
            'odeme_kanali'       => $abonelik['odeme_kanali'],
            'odeme_donemi'       => $abonelik['odeme_donemi'],
            'kampanya_kullanici' => (bool) $abonelik['kampanya_kullanici'],
            'kampanya_fiyat'     => $abonelik['kampanya_fiyat'] ? (float) $abonelik['kampanya_fiyat'] : null,
            'baslangic_tarihi'   => $abonelik['baslangic_tarihi'],
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

        // Sadece şirket sahibi veya admin plan değiştirebilir
        if (!in_array($payload['rol'], ['sahip', 'admin'], true)) {
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
        // Şimdilik sadece talep bilgilerini döndür
        $kampanya = $this->abonelik_model->kampanyaAktifMi();
        $fiyat = $kampanya && $plan_adi === 'standart' && $odeme_donemi === 'aylik'
            ? Abonelik::KAMPANYA_FIYAT
            : Abonelik::FIYATLAR[$plan_adi][$odeme_donemi];

        Response::basarili([
            'mesaj'        => 'Ödeme sistemi yakında entegre edilecek.',
            'plan_adi'     => $plan_adi,
            'odeme_donemi' => $odeme_donemi,
            'tutar'        => $fiyat,
            'kampanya'     => $kampanya && $plan_adi === 'standart',
            'durum'        => 'bekliyor_entegrasyon',
        ], 'Plan yükseltme talebi alındı');
    }

    // ─────────────────────────────────────────
    // YARDIMCI
    // ─────────────────────────────────────────

    private function plan_gorsel_adi(string $plan): string {
        return match ($plan) {
            'ucretsiz' => 'Ücretsiz',
            'standart' => 'Standart',
            'kurumsal' => 'Kurumsal',
            default    => ucfirst($plan),
        };
    }
}
