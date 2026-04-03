<?php
/**
 * ParamGo — Webhook Controller
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
     * RevenueCat Webhook — Abonelik olaylarını işle
     * POST /api/webhook/revenuecat
     *
     * RevenueCat, abonelik değişikliklerini bu endpoint'e gönderir:
     *   INITIAL_PURCHASE → İlk satın alma (deneme dahil)
     *   RENEWAL          → Abonelik yenilendi
     *   CANCELLATION     → Kullanıcı iptal etti (dönem sonuna kadar devam eder)
     *   EXPIRATION       → Abonelik süresi doldu
     *   BILLING_ISSUE    → Ödeme başarısız
     */
    public function revenueCat(array $girdi): void {
        // GÜVENLİK: Authorization header doğrula
        $webhook_secret = getenv('REVENUECAT_WEBHOOK_SECRET');
        if ($webhook_secret) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            if ($auth_header !== "Bearer {$webhook_secret}") {
                error_log('RevenueCat webhook: gecersiz imza');
                http_response_code(401);
                echo json_encode(['basarili' => false, 'hata' => 'Yetkisiz']);
                return;
            }
        }

        $event = $girdi['event'] ?? null;
        if (!$event) {
            http_response_code(400);
            echo json_encode(['basarili' => false, 'hata' => 'Event bulunamadi']);
            return;
        }

        $event_tipi  = $event['type']        ?? '';
        $musteri_id  = $event['app_user_id'] ?? '';
        $urun_id     = $event['product_id']  ?? '';
        $bitis_ms    = $event['expiration_at_ms'] ?? null;
        $donem_tipi  = $event['period_type'] ?? 'NORMAL'; // TRIAL, INTRO, NORMAL

        // Müşteri ID'sinden sirket_id çıkar
        $sirket_id = $this->abonelik_model->sirketIdRevenueCatMusteriden($musteri_id);
        if (!$sirket_id) {
            error_log("RevenueCat webhook: gecersiz musteri_id={$musteri_id}");
            http_response_code(200); // 200 döndür — RevenueCat tekrar göndermez
            echo json_encode(['basarili' => true]);
            return;
        }

        // Ürün ID'sinden plan ve dönem belirle
        $plan  = null;
        $donem = null;
        if (str_contains($urun_id, 'standart'))   $plan  = 'standart';
        elseif (str_contains($urun_id, 'kurumsal')) $plan = 'kurumsal';
        $donem = str_contains($urun_id, 'yillik') ? 'yillik' : 'aylik';

        // Bitiş tarihi (ms → datetime)
        $bitis_str = $bitis_ms
            ? date('Y-m-d H:i:s', (int)($bitis_ms / 1000))
            : null;

        switch ($event_tipi) {

            case 'INITIAL_PURCHASE':
            case 'RENEWAL':
            case 'UNCANCELLATION': // Kullanıcı iptali geri aldı
                if (!$plan) {
                    error_log("RevenueCat webhook: plan belirlenemedi urun={$urun_id}");
                    break;
                }
                $abonelik_id = $this->abonelik_model->planGuncelle(
                    $sirket_id, $plan, $donem, 'apple', $bitis_str
                );
                // Deneme dışı satın alımda ödeme kaydı
                if ($event_tipi !== 'INITIAL_PURCHASE' || $donem_tipi === 'NORMAL') {
                    $tutar = Abonelik::FIYATLAR[$plan][$donem] ?? 0;
                    $this->abonelik_model->odemeKaydet($sirket_id, $abonelik_id, [
                        'plan_adi'     => $plan,
                        'odeme_donemi' => $donem,
                        'odeme_kanali' => 'apple',
                        'tutar'        => $tutar,
                        'para_birimi'  => 'TRY',
                        'referans_no'  => $musteri_id,
                        'durum'        => 'tamamlandi',
                        'odeme_tarihi' => date('Y-m-d H:i:s'),
                    ]);
                }
                error_log("RevenueCat webhook: {$event_tipi} sirket={$sirket_id} plan={$plan}/{$donem}");
                break;

            case 'EXPIRATION':
                // Abonelik bitti — deneme planına düşür
                $this->abonelik_model->planGuncelle($sirket_id, 'deneme', null, null, null);
                error_log("RevenueCat webhook: EXPIRATION sirket={$sirket_id}");
                break;

            case 'CANCELLATION':
                // Kullanıcı iptal etti ama dönem sonuna kadar erişim devam eder
                // Sadece logla, planı değiştirme
                error_log("RevenueCat webhook: CANCELLATION sirket={$sirket_id} bitis={$bitis_str}");
                break;

            case 'BILLING_ISSUE':
                error_log("RevenueCat webhook: BILLING_ISSUE sirket={$sirket_id} urun={$urun_id}");
                break;

            default:
                error_log("RevenueCat webhook: bilinmeyen event={$event_tipi}");
                break;
        }

        http_response_code(200);
        echo json_encode(['basarili' => true]);
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
