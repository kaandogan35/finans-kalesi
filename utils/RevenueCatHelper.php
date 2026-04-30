<?php
/**
 * ParamGo — RevenueCat Helper
 *
 * RevenueCat REST API ile kullanıcı abonelik durumunu kontrol eder
 * ve DB ile senkronize eder.
 *
 * Kullanıldığı yerler:
 *  - AbonelikController::iapDogrula()  → 404 geldiğinde DB temizleme
 *  - AbonelikController::durum()       → Dashboard açılırken sessiz sync
 *  - WebhookController                 → TRANSFER event'i işleme (opsiyonel)
 *
 * Revenue Leak Koruması:
 *   Bir kişi aynı Apple ID ile farklı hesaplarda "Satın Alımları Geri Yükle"
 *   yaptığında RevenueCat Transfer Behavior (default TRANSFER) ile aboneliği
 *   yeni hesaba aktarır, eski hesaptan alır. Bu helper eski hesabın DB kaydını
 *   senkronize eder (plan = deneme'ye düşürür).
 */

class RevenueCatHelper {

    /**
     * RevenueCat REST API'den subscriber bilgisi al
     *
     * @return array|null ['plan' => 'kurumsal'|'standart', 'donem' => 'aylik'|'yillik', 'bitis' => 'Y-m-d H:i:s']
     *                    null = abone yok veya API hatası
     */
    public static function aktifAbonelikAl(int $sirket_id): ?array {
        $rc_secret = getenv('REVENUECAT_SECRET_KEY');
        if (!$rc_secret) {
            return null;
        }

        $musteri_id = "sirket_{$sirket_id}";
        $url = "https://api.revenuecat.com/v1/subscribers/" . urlencode($musteri_id);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,   // Kısa timeout — login/durum akışını yavaşlatmasın
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER     => [
                "Authorization: Bearer {$rc_secret}",
                "Content-Type: application/json",
            ],
        ]);

        $yanit    = curl_exec($ch);
        $http_kod = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // 404 → abone kaydı yok
        if ($http_kod === 404) {
            return null;
        }
        // Diğer hatalar → bilinmiyor (null dön, sessiz)
        if ($http_kod !== 200 || !$yanit) {
            error_log("RevenueCatHelper: HTTP={$http_kod} sirket={$sirket_id}");
            return null;
        }

        $rc    = json_decode($yanit, true);
        $abone = $rc['subscriber'] ?? null;
        if (!$abone) {
            return null;
        }

        // Plan önceliği: kurumsal > standart
        $plan_onceligi = ['kurumsal' => 2, 'standart' => 1];
        $aktif = null;

        // subscriptions alanından aktif aboneliği bul
        foreach (($abone['subscriptions'] ?? []) as $urun_id => $urun) {
            $bitis_ts = isset($urun['expires_date']) ? strtotime($urun['expires_date']) : 0;
            if ($bitis_ts <= time()) continue;

            $plan_adayi = null;
            if (str_contains($urun_id, 'kurumsal'))    $plan_adayi = 'kurumsal';
            elseif (str_contains($urun_id, 'standart')) $plan_adayi = 'standart';
            if (!$plan_adayi) continue;

            $mevcut_onc = $aktif ? ($plan_onceligi[$aktif['plan']] ?? 0) : 0;
            $yeni_onc   = $plan_onceligi[$plan_adayi];
            if ($yeni_onc > $mevcut_onc) {
                $aktif = [
                    'plan'  => $plan_adayi,
                    'donem' => str_contains($urun_id, 'yillik') ? 'yillik' : 'aylik',
                    'bitis' => date('Y-m-d H:i:s', $bitis_ts),
                ];
            }
        }

        // Fallback: entitlements alanına bak
        if (!$aktif) {
            foreach (($abone['entitlements'] ?? []) as $ent) {
                $bitis_ts = isset($ent['expires_date']) ? strtotime($ent['expires_date']) : 0;
                if ($bitis_ts <= time()) continue;

                $pid = $ent['product_identifier'] ?? '';
                $plan_adayi = null;
                if (str_contains($pid, 'kurumsal'))    $plan_adayi = 'kurumsal';
                elseif (str_contains($pid, 'standart')) $plan_adayi = 'standart';
                if (!$plan_adayi) continue;

                $mevcut_onc = $aktif ? ($plan_onceligi[$aktif['plan']] ?? 0) : 0;
                if ($plan_onceligi[$plan_adayi] > $mevcut_onc) {
                    $aktif = [
                        'plan'  => $plan_adayi,
                        'donem' => str_contains($pid, 'yillik') ? 'yillik' : 'aylik',
                        'bitis' => date('Y-m-d H:i:s', $bitis_ts),
                    ];
                }
            }
        }

        return $aktif;
    }

    /**
     * DB planını RevenueCat ile senkronize et
     * Sadece ücretli plan kullanıcıları için çalışır (deneme'deki kullanıcılar es geçilir).
     * Hata olursa sessizce false döner — login/durum akışını bloklamaz.
     *
     * @return bool true = plan değişti, false = değişiklik yok
     */
    public static function planSenkronizeEt(int $sirket_id, PDO $db): bool {
        try {
            $abonelik_model = new Abonelik($db);
            $mevcut = $abonelik_model->guncelPlan($sirket_id);
            $mevcut_plan = $mevcut['plan_adi'] ?? 'deneme';
            $mevcut_kanal = $mevcut['odeme_kanali'] ?? null;

            // Sadece ücretli plan → RC ile doğrulama gerekli
            if (!in_array($mevcut_plan, ['standart', 'kurumsal'], true)) {
                return false;
            }

            // RC senkronizasyonu YALNIZCA Apple/Google IAP için geçerlidir
            // Diğer kanallar (iyzico, web, davet, NULL vb.) atlanır
            if (!in_array($mevcut_kanal, ['apple', 'google'], true)) {
                return false;
            }

            $rc_durum = self::aktifAbonelikAl($sirket_id);

            if ($rc_durum === null) {
                // RC'de abone yok ama DB'de ücretli plan var
                // → transfer, expiration veya iptal olmuş → deneme'ye düşür
                $abonelik_model->planGuncelle($sirket_id, 'deneme', null, null, null);
                error_log("RC Sync: sirket={$sirket_id} plan temizlendi ({$mevcut_plan} → deneme)");
                return true;
            }

            // RC'de var — farklı ise güncelle (upgrade/downgrade olmuş olabilir)
            if ($rc_durum['plan'] !== $mevcut_plan) {
                $abonelik_model->planGuncelle(
                    $sirket_id,
                    $rc_durum['plan'],
                    $rc_durum['donem'],
                    'apple',
                    $rc_durum['bitis']
                );
                error_log("RC Sync: sirket={$sirket_id} plan değişti ({$mevcut_plan} → {$rc_durum['plan']})");
                return true;
            }

            return false;
        } catch (\Throwable $e) {
            // Sessiz hata — login/durum akışını bloklama
            error_log("RC Sync hata: sirket={$sirket_id} " . $e->getMessage());
            return false;
        }
    }
}
