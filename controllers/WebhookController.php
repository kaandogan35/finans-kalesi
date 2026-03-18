<?php
/**
 * Finans Kalesi — Webhook Controller
 *
 * Ödeme sağlayıcılarından gelen otomatik bildirimler (webhook) burada işlenir.
 * Üç kanal destekleniyor: web (Stripe/İyzico), Apple IAP, Google Play.
 *
 * ŞUAN: Tüm webhook'lar placeholder — altyapı hazır, entegrasyon sonraki aşamada.
 *
 * POST /api/webhook/web    → Web ödeme tamamlandı bildirimi
 * POST /api/webhook/apple  → Apple IAP satın alma bildirimi
 * POST /api/webhook/google → Google Play satın alma bildirimi
 */

class WebhookController {

    private Abonelik $abonelik_model;

    public function __construct(PDO $db) {
        $this->abonelik_model = new Abonelik($db);
    }

    /**
     * Web ödeme webhook'u (Stripe veya İyzico)
     *
     * TODO: Entegrasyon adımları
     *   1. $this->web_imza_dogrula() — HMAC signature kontrolü
     *   2. Event tipini belirle (payment_intent.succeeded vb.)
     *   3. Metadata'dan sirket_id al
     *   4. planı aktive et: $this->abonelik_model->planGuncelle(...)
     *   5. Ödemeyi kaydet: $this->abonelik_model->odemeKaydet(...)
     */
    public function webOdeme(array $girdi): void {
        // GÜVENLİK: İmza doğrulaması olmadan webhook işlenmez
        // Ödeme entegrasyonu yapılana kadar tüm istekleri reddet
        error_log('Webhook/web REDDEDILDI — imza dogrulama henuz aktif degil: ' . substr(json_encode($girdi), 0, 200));
        http_response_code(403);
        echo json_encode(['basarili' => false, 'hata' => 'Webhook dogrulama aktif degil']);
    }

    /**
     * Apple IAP (In-App Purchase) webhook'u
     *
     * TODO: Entegrasyon adımları
     *   1. $receipt_data al (App Store'dan gelen)
     *   2. Apple'ın doğrulama sunucusuna gönder:
     *      POST https://buy.itunes.apple.com/verifyReceipt
     *   3. status === 0 ise geçerli
     *   4. product_id'den plan belirle
     *   5. original_transaction_id ile sirket_id eşleştir
     *   6. planı aktive et
     */
    public function appleIap(array $girdi): void {
        // GÜVENLİK: Apple receipt doğrulaması olmadan işlenmez
        error_log('Webhook/apple REDDEDILDI — dogrulama henuz aktif degil: ' . substr(json_encode($girdi), 0, 200));
        http_response_code(403);
        echo json_encode(['basarili' => false, 'hata' => 'Webhook dogrulama aktif degil']);
    }

    /**
     * Google Play webhook'u
     *
     * TODO: Entegrasyon adımları
     *   1. pubsub mesajını çöz (base64 decode)
     *   2. Google Play Developer API ile doğrula:
     *      GET purchases/subscriptions/{subscriptionId}/tokens/{token}
     *   3. paymentState === 1 ise geçerli
     *   4. obfuscatedExternalAccountId ile sirket_id eşleştir
     *   5. planı aktive et
     */
    public function googlePlay(array $girdi): void {
        // GÜVENLİK: Google Play doğrulaması olmadan işlenmez
        error_log('Webhook/google REDDEDILDI — dogrulama henuz aktif degil: ' . substr(json_encode($girdi), 0, 200));
        http_response_code(403);
        echo json_encode(['basarili' => false, 'hata' => 'Webhook dogrulama aktif degil']);
    }

    // ─────────────────────────────────────────
    // GELECEKTE KULLANILACAK YARDIMCILAR
    // ─────────────────────────────────────────

    /**
     * Bitis tarihini hesapla (aylık veya yıllık)
     */
    private function bitis_tarihi_hesapla(string $donem): string {
        $simdi = new DateTime();
        if ($donem === 'yillik') {
            $simdi->modify('+1 year');
        } else {
            $simdi->modify('+1 month');
        }
        return $simdi->format('Y-m-d H:i:s');
    }

    /**
     * Web webhook imza doğrulaması (Stripe örneği)
     * TODO: Gerçek implementasyon
     */
    private function web_imza_dogrula(): void {
        // $signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        // $secret    = env('STRIPE_WEBHOOK_SECRET');
        // Stripe imza kontrolü burada yapılacak
        // Geçersizse: Response::hata('Geçersiz imza', 401); exit;
    }
}
