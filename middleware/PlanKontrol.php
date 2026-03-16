<?php
/**
 * Finans Kalesi — Plan Kontrol Middleware
 *
 * Hangi planın hangi özelliğe erişebileceğini belirler.
 *
 * Kullanım (controller içinde):
 *   PlanKontrol::kontrol($payload, 'pdf_rapor');  // İzin yoksa otomatik 403 döner
 *
 *   if (PlanKontrol::izinVarMi($payload['plan'], 'pdf_rapor')) {
 *       // Özelliği göster
 *   }
 */

class PlanKontrol {

    /**
     * Hangi özellik hangi planlara açık
     * Listede olmayan plan → erişim yok
     */
    private static array $izinler = [
        'pdf_rapor'     => ['standart', 'kurumsal'],
        'excel_rapor'   => ['standart', 'kurumsal'],
        'veri_aktarma'  => ['standart', 'kurumsal'],
        'cok_kullanici' => ['standart', 'kurumsal'],
        'yapay_zeka'    => ['kurumsal'],
        'api_erisim'    => ['kurumsal'],
    ];

    /**
     * Plan kontrolü yap — izin yoksa 403 döndür ve dur
     *
     * @param array  $payload  JWT payload (içinde 'plan' alanı olmalı)
     * @param string $ozellik  Kontrol edilecek özellik adı
     */
    public static function kontrol(array $payload, string $ozellik): void {
        $plan = $payload['plan'] ?? 'ucretsiz';

        if (!self::izinVarMi($plan, $ozellik)) {
            $plan_etiket = self::plan_etiketi($ozellik);
            Response::hata(
                "Bu özellik $plan_etiket planına sahip kullanıcılara açıktır. Planınızı yükseltin.",
                403
            );
            exit;
        }
    }

    /**
     * Belirli bir planın belirli bir özelliğe erişimi var mı?
     *
     * @param string $plan    Plan adı: ucretsiz | standart | kurumsal
     * @param string $ozellik Özellik adı
     * @return bool
     */
    public static function izinVarMi(string $plan, string $ozellik): bool {
        // Tanımlı bir özellik değilse herkese açık kabul et
        if (!isset(self::$izinler[$ozellik])) {
            return true;
        }
        return in_array($plan, self::$izinler[$ozellik], true);
    }

    /**
     * Özellik için gerekli minimum plan etiketini döndür (hata mesajı için)
     */
    private static function plan_etiketi(string $ozellik): string {
        $planlar = self::$izinler[$ozellik] ?? [];
        if (in_array('standart', $planlar)) {
            return 'Standart veya Kurumsal';
        }
        return 'Kurumsal';
    }
}
