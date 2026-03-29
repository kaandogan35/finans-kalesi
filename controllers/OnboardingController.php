<?php
/**
 * OnboardingController — Yeni Kullanici Sihirbazi
 *
 * POST /api/onboarding/sirket   → Adım 1: İşletme bilgilerini güncelle
 * POST /api/onboarding/cari     → Adım 2: İlk müşteri ekle (opsiyonel)
 * POST /api/onboarding/tamamla  → Adım 3: Tamamla (+ opsiyonel çek)
 */

class OnboardingController {

    private $sirket_model;
    private $cari_model;
    private $cek_model;
    private $db;

    public function __construct() {
        $this->db           = Database::baglan();
        $this->sirket_model = new Sirket();
        $this->cari_model   = new CariKart($this->db);
        $this->cek_model    = new CekSenet($this->db);
    }

    /**
     * Adım 1 — İşletme bilgileri
     * Sektor ve calisan_sayisi sirketler tablosuna kaydedilir.
     */
    public function sirket($girdi) {
        $payload   = AuthMiddleware::dogrula();
        $sirket_id = (int)$payload['sirket_id'];

        $sektor          = $girdi['sektor'] ?? null;
        $calisan_sayisi  = isset($girdi['calisan_sayisi']) ? (int)$girdi['calisan_sayisi'] : null;

        $this->sirket_model->onboarding_guncelle($sirket_id, $sektor, $calisan_sayisi);

        Response::basarili(null, 'İşletme bilgileri kaydedildi');
    }

    /**
     * Adım 2 — İlk müşteri ekle (opsiyonel)
     * Sadece cari_adi zorunlu, geri kalanı opsiyonel.
     */
    public function cari($girdi) {
        $payload   = AuthMiddleware::dogrula();
        $sirket_id = (int)$payload['sirket_id'];

        if (empty($girdi['cari_adi'])) {
            Response::dogrulama_hatasi(['cari_adi' => 'Müşteri adı zorunludur']);
            return;
        }

        // Plan siniri kontrolu
        SinirKontrol::kontrol($payload, 'cari');

        $cari = $this->cari_model->olustur($sirket_id, [
            'cari_adi'  => $girdi['cari_adi'],
            'cari_turu' => $girdi['cari_turu'] ?? 'musteri',
            'telefon'   => $girdi['telefon']   ?? null,
        ]);

        Response::basarili(['cari' => $cari], 'Müşteri eklendi', 201);
    }

    /**
     * Adım 3 — Tamamla (+ opsiyonel çek)
     * tutar + vade_tarihi + tur gönderilirse çek de eklenir.
     * Her durumda onboarding_tamamlandi = 1 yapılır.
     */
    public function tamamla($girdi) {
        $payload      = AuthMiddleware::dogrula();
        $sirket_id    = (int)$payload['sirket_id'];
        $kullanici_id = (int)$payload['sub'];

        // Opsiyonel çek ekleme
        if (!empty($girdi['tutar']) && !empty($girdi['vade_tarihi']) && !empty($girdi['tur'])) {
            try {
                $this->cek_model->olustur($sirket_id, [
                    'tur'            => $girdi['tur'],
                    'tutar'          => (float)$girdi['tutar'],
                    'vade_tarihi'    => $girdi['vade_tarihi'],
                    'seri_no'        => $girdi['seri_no']   ?? null,
                    'banka_adi'      => $girdi['banka_adi'] ?? null,
                    'aciklama'       => $girdi['aciklama']  ?? null,
                    'durum'          => 'portfoyde',
                ], $kullanici_id);
            } catch (Exception $e) {
                // Çek ekleme başarısız olsa da onboarding tamamlanır
                error_log('[Onboarding] Çek ekleme hatası — sirket_id:' . $sirket_id . ' hata:' . $e->getMessage() . ' tur:' . ($girdi['tur'] ?? '?'));
            }
        }

        $this->sirket_model->onboarding_tamamla($sirket_id);

        Response::basarili(null, 'Kurulum tamamlandı! Hoş geldiniz.');
    }
}
