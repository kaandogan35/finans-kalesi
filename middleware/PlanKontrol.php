<?php
/**
 * ParamGo — Plan Kontrol Middleware
 *
 * Hangi planın hangi özelliğe erişebileceğini belirler.
 * Deneme süresi dolmuşsa yazma işlemlerini engeller.
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
     * 'deneme' planı aktifken tüm özelliklere erişim var (standart seviyesi)
     */
    private static array $izinler = [
        'pdf_rapor'     => ['deneme', 'standart', 'kurumsal'],
        'excel_rapor'   => ['deneme', 'standart', 'kurumsal'],
        'veri_aktarma'  => ['deneme', 'standart', 'kurumsal'],
        'cok_kullanici' => ['deneme', 'standart', 'kurumsal'],
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
        $plan = $payload['plan'] ?? 'deneme';

        // Deneme süresi dolmuşsa erişim engelle
        if ($plan === 'deneme') {
            self::denemeSuresiKontrol($payload);
        }

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
     * @param string $plan    Plan adı: deneme | standart | kurumsal
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
     * Deneme süresi dolmuşsa yazma işlemlerini engelle
     * Okuma (GET) isteklerine izin verir — kullanıcı verilerini görebilsin
     */
    public static function denemeSuresiKontrol(array $payload): void {
        $plan = $payload['plan'] ?? 'deneme';
        if ($plan !== 'deneme') {
            return;
        }

        $sirket_id = (int) ($payload['sirket_id'] ?? 0);
        if ($sirket_id === 0) {
            return;
        }

        $db = Database::baglan();
        $abonelik = new Abonelik($db);

        if ($abonelik->denemeSuresiDolduMu($sirket_id)) {
            // GET isteklerine izin ver (okuma)
            $metod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
            if ($metod !== 'GET') {
                $kalan = 0;
                Response::json([
                    'basarili'     => false,
                    'hata'         => '30 günlük ücretsiz deneme süreniz doldu. Devam etmek için bir plan satın alın.',
                    'kod'          => 'DENEME_SURESI_DOLDU',
                    'kalan_gun'    => $kalan,
                    'plan_sayfasi' => true,
                ], 403);
                exit;
            }
        }
    }

    /**
     * Yazma işlemleri için deneme süresi kontrolü
     * Controller'larda POST/PUT/DELETE öncesi çağrılır
     */
    public static function yazmaKontrol(array $payload): void {
        $plan = $payload['plan'] ?? 'deneme';
        if ($plan !== 'deneme') {
            return;
        }
        self::denemeSuresiKontrol($payload);
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
