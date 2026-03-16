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
        // TODO: İmza doğrulama
        // $this->web_imza_dogrula();

        error_log('Webhook/web alındı: ' . json_encode($girdi));

        // Placeholder yanıt — ödeme sağlayıcısı 200 bekliyor
        http_response_code(200);
        echo json_encode(['received' => true]);
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
        // TODO: Apple receipt doğrulama
        // $receipt = $girdi['unified_receipt'] ?? null;
        // Apple sunucusuna doğrulama isteği gönderilecek

        error_log('Webhook/apple alındı: ' . json_encode($girdi));

        http_response_code(200);
        echo json_encode(['received' => true]);
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
        // TODO: Google Pub/Sub mesajı çözme ve doğrulama
        // $mesaj = base64_decode($girdi['message']['data'] ?? '');

        error_log('Webhook/google alındı: ' . json_encode($girdi));

        http_response_code(200);
        echo json_encode(['received' => true]);
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
