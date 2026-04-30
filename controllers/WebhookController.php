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
     * iyzico Webhook — Abonelik ödeme bildirimlerini işle
     * POST /api/webhook/web
     *
     * iyzico şu event'leri gönderir:
     *   subscription.order.success → Ödeme başarılı (ilk veya yenileme)
     *   subscription.order.failure → Ödeme başarısız
     */
    public function webOdeme(array $girdi): void {
        $ham_body  = file_get_contents('php://input');
        $sigV3     = $_SERVER['HTTP_X_IYZ_SIGNATURE_V3'] ?? null;
        $rnd       = $_SERVER['HTTP_X_IYZ_RND']          ?? null;
        $sigV1     = $_SERVER['HTTP_X_IYZ_SIGNATURE']    ?? null;

        // V3 öncelikli, V1 geriye uyumlu doğrulama
        $imza = IyzicoHelper::webhookImzaDogrula($ham_body, $sigV3, $rnd, $sigV1);

        if (!$imza['gecerli']) {
            error_log(
                'iyzico webhook: gecersiz imza ['
                . $imza['versiyon'] . '] — '
                . 'V3=' . substr($sigV3 ?? '', 0, 24)
                . ' RND=' . substr($rnd ?? '', 0, 24)
                . ' V1=' . substr($sigV1 ?? '', 0, 24)
                . ' body=' . substr($ham_body, 0, 200)
            );
            http_response_code(401);
            echo json_encode(['basarili' => false, 'hata' => 'Geçersiz imza']);
            return;
        }

        error_log('iyzico webhook: gecerli imza [' . $imza['versiyon'] . '] event=' . ($girdi['iyziEventType'] ?? 'bilinmiyor'));

        $event_tipi    = $girdi['iyziEventType']           ?? '';
        $abonelik_ref  = $girdi['subscriptionReferenceCode'] ?? '';
        $musteri_ref   = $girdi['customerReferenceCode']    ?? '';
        $odeme_ref     = $girdi['paymentReferenceCode']     ?? '';
        $plan_ref      = $girdi['pricingPlanReferenceCode'] ?? '';

        error_log("iyzico webhook: event={$event_tipi} abonelik={$abonelik_ref}");

        switch ($event_tipi) {

            case 'subscription.order.success':
                // Hangi plan? conversationId'den çekiyoruz: "pg-{sirket_id}-{timestamp}"
                $conv_id   = $girdi['conversationId'] ?? '';
                $sirket_id = $this->sirketIdCikar($conv_id);

                if (!$sirket_id) {
                    // conversationId ile bulunamadı — iyzico_musteri_id ile bul
                    $sirket_id = $this->abonelik_model->sirketIdIyzicoDan($musteri_ref);
                }

                if (!$sirket_id) {
                    error_log("iyzico webhook: sirket bulunamadi abonelik={$abonelik_ref} musteri={$musteri_ref}");
                    http_response_code(200);
                    echo json_encode(['basarili' => true]);
                    return;
                }

                // Aynı ödeme referansı daha önce işlendi mi? (duplicate koruması)
                if ($this->abonelik_model->iyzicoOdemeIslendiMi($odeme_ref)) {
                    error_log("iyzico webhook: duplicate odeme ref={$odeme_ref}");
                    http_response_code(200);
                    echo json_encode(['basarili' => true]);
                    return;
                }

                // Plan ve dönem bilgisi — pricingPlanReferenceCode'dan eşleştir
                [$plan_adi, $odeme_donemi] = $this->abonelik_model->planBilgisiIyzicoDan($sirket_id, $plan_ref);

                if (!$plan_adi) {
                    error_log("iyzico webhook: plan belirlenemedi abonelik={$abonelik_ref}");
                    http_response_code(200);
                    echo json_encode(['basarili' => true]);
                    return;
                }

                // Bitiş tarihi hesapla
                $bitis = $odeme_donemi === 'yillik'
                    ? date('Y-m-d H:i:s', strtotime('+1 year'))
                    : date('Y-m-d H:i:s', strtotime('+1 month'));

                $abonelik_id = $this->abonelik_model->planGuncelle(
                    $sirket_id, $plan_adi, $odeme_donemi, 'iyzico', $bitis
                );

                // iyzico referanslarını kaydet
                $this->abonelik_model->iyzicoReferansKaydet($sirket_id, $musteri_ref, $abonelik_ref);

                // Yedek: trial_kullanildi=1 (iyzicoDogrula çağrılmadan webhook gelirse)
                $this->abonelik_model->trialKullanildiIsaretle($sirket_id);

                $tutar = IyzicoHelper::WEB_FIYATLAR[$plan_adi][$odeme_donemi] ?? 0;
                $this->abonelik_model->odemeKaydet($sirket_id, $abonelik_id, [
                    'plan_adi'     => $plan_adi,
                    'odeme_donemi' => $odeme_donemi,
                    'odeme_kanali' => 'iyzico',
                    'tutar'        => $tutar,
                    'para_birimi'  => 'TRY',
                    'referans_no'  => $odeme_ref,
                    'durum'        => 'tamamlandi',
                    'odeme_tarihi' => date('Y-m-d H:i:s'),
                ]);

                error_log("iyzico webhook: plan aktif sirket={$sirket_id} plan={$plan_adi}/{$odeme_donemi}");
                break;

            case 'subscription.order.failure':
                error_log("iyzico webhook: odeme basarisiz abonelik={$abonelik_ref} musteri={$musteri_ref}");
                break;

            default:
                error_log("iyzico webhook: bilinmeyen event={$event_tipi}");
                break;
        }

        http_response_code(200);
        echo json_encode(['basarili' => true]);
    }

    private function sirketIdCikar(string $conv_id): int {
        // Format: pg-{sirket_id}-{timestamp}
        if (preg_match('/^pg-(\d+)-\d+$/', $conv_id, $m)) {
            return (int) $m[1];
        }
        return 0;
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
        if (!$webhook_secret) {
            error_log('RevenueCat webhook: REVENUECAT_WEBHOOK_SECRET tanimli degil — tum istekler reddedildi');
            http_response_code(500);
            echo json_encode(['basarili' => false]);
            return;
        }
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if ($auth_header !== "Bearer {$webhook_secret}") {
            error_log('RevenueCat webhook: gecersiz imza');
            http_response_code(401);
            echo json_encode(['basarili' => false, 'hata' => 'Yetkisiz']);
            return;
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
        // Önce app_user_id dene, başarısızsa original_app_user_id
        $sirket_id = $this->abonelik_model->sirketIdRevenueCatMusteriden($musteri_id);
        if (!$sirket_id) {
            $original_id = $event['original_app_user_id'] ?? '';
            $sirket_id = $this->abonelik_model->sirketIdRevenueCatMusteriden($original_id);
        }
        if (!$sirket_id) {
            error_log("RevenueCat webhook: gecersiz musteri_id={$musteri_id} original=" . ($event['original_app_user_id'] ?? ''));
            http_response_code(200);
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
            case 'PRODUCT_CHANGE': // Plan değişikliği (upgrade/downgrade)
                if (!$plan) {
                    error_log("RevenueCat webhook: plan belirlenemedi urun={$urun_id}");
                    break;
                }
                $abonelik_id = $this->abonelik_model->planGuncelle(
                    $sirket_id, $plan, $donem, 'apple', $bitis_str
                );
                // Yedek: trial_kullanildi=1 (Apple IAP üzerinden trial kullanıldı)
                $this->abonelik_model->trialKullanildiIsaretle($sirket_id);
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
                // Abonelik bitti — plan kapansın, modüllerde paywall açılsın
                // trial_kullanildi bayrağı KORUNUR (planSifirla dokunmuyor)
                $this->abonelik_model->planSifirla($sirket_id);
                error_log("RevenueCat webhook: EXPIRATION sirket={$sirket_id} -> plan sifirlandi");
                break;

            case 'TRANSFER':
                // KRİTİK: Aynı Apple ID ile farklı app user arasında transfer
                // Senaryo: User A abone oldu, User B (aynı Apple ID) "Geri Yükle" dedi
                //          → RevenueCat abonelik'i User B'ye transfer etti
                //          → User A'nın aboneliği artık geçersiz
                //
                // $event['transferred_from']: eski app user ID listesi (aboneliği kaybeden)
                // $event['transferred_to']:   yeni app user ID listesi (aboneliği alan)
                //
                // Burada sadece transferred_from'u 'deneme'ye düşürüyoruz.
                // transferred_to zaten frontend tarafında iapDogrula çağırarak planını aktifleştirecek.
                $transferred_from = $event['transferred_from'] ?? [];
                if (is_array($transferred_from)) {
                    foreach ($transferred_from as $eski_musteri_id) {
                        $eski_sirket = $this->abonelik_model->sirketIdRevenueCatMusteriden($eski_musteri_id);
                        if ($eski_sirket) {
                            $this->abonelik_model->planGuncelle($eski_sirket, 'deneme', null, null, null);
                            error_log("RevenueCat webhook: TRANSFER from sirket={$eski_sirket} (plan sifirlandi)");
                        }
                    }
                }
                // transferred_to için: yeni user zaten kendi cihazından iapDogrula çağıracak
                // Ama yine de burada da güncellemek istersek:
                $transferred_to = $event['transferred_to'] ?? [];
                if (is_array($transferred_to) && $plan) {
                    foreach ($transferred_to as $yeni_musteri_id) {
                        $yeni_sirket = $this->abonelik_model->sirketIdRevenueCatMusteriden($yeni_musteri_id);
                        if ($yeni_sirket) {
                            $this->abonelik_model->planGuncelle($yeni_sirket, $plan, $donem, 'apple', $bitis_str);
                            error_log("RevenueCat webhook: TRANSFER to sirket={$yeni_sirket} plan={$plan}/{$donem}");
                        }
                    }
                }
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
