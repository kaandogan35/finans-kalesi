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
     * Platform bilgisini request header'dan oku
     * Frontend her istekte X-Platform: ios | web header'ı gönderir.
     * Native Capacitor istekleri "ios", tarayıcı istekleri "web" etiketlenir.
     *
     * @return string 'ios' | 'web'
     */
    public static function platformAl(): string {
        $header = $_SERVER['HTTP_X_PLATFORM'] ?? '';
        $header = strtolower(trim($header));
        if ($header === 'ios' || $header === 'android') {
            return 'ios';  // mobil platform (android şu an ios ile aynı davranış)
        }
        return 'web';
    }

    /**
     * Yeni abonelik sisteminin devreye girdiği tarih.
     * Bu tarihten ÖNCE kayıt olmuş kullanıcılar eski mantıkla devam eder (7 gün tam erişim).
     * Bu tarihten SONRA kayıt olanlar iOS'ta Apple trial zorunluluğuyla karşılaşır.
     */
    const YENI_SISTEM_TARIHI = '2026-04-13 00:00:00';

    /**
     * Kullanıcı yeni sistem kullanıcısı mı kontrol et
     * (Kayıt tarihi YENI_SISTEM_TARIHI'nden sonra ise true)
     *
     * Güvenli: Eğer 'olusturma_tarihi' kolonu yoksa veya DB hatası olursa
     * false döner (eski kullanıcı varsayılır, uygulama çökmez).
     */
    public static function yeniSistemKullanicisiMi(int $sirket_id): bool {
        static $cache = [];
        if (isset($cache[$sirket_id])) return $cache[$sirket_id];

        try {
            $db = Database::baglan();
            $stmt = $db->prepare("SELECT olusturma_tarihi FROM sirketler WHERE id = :sid LIMIT 1");
            $stmt->execute([':sid' => $sirket_id]);
            $row = $stmt->fetch();

            if (!$row || empty($row['olusturma_tarihi'])) {
                return $cache[$sirket_id] = false;  // Emin değilsek eski kullanıcı say
            }

            $kayit = strtotime($row['olusturma_tarihi']);
            $esik  = strtotime(self::YENI_SISTEM_TARIHI);
            return $cache[$sirket_id] = ($kayit >= $esik);
        } catch (\Throwable $e) {
            // Kolon eksik veya DB hatası — güvenli taraf: eski kullanıcı say
            error_log('PlanKontrol yeniSistemKullanicisiMi hata: ' . $e->getMessage());
            return $cache[$sirket_id] = false;
        }
    }

    /**
     * Deneme planı yazma kontrolü
     *
     * YENİ MODEL (2026-04-30 sonrası):
     *  - Yeni kullanıcılar artık kayıt anında trial almaz, deneme_bitis=NULL olarak başlar.
     *  - Trial yalnızca iyzico/Apple aboneliği başladığında (sağlayıcının kendi 7 günü) aktiftir.
     *  - Deneme planında olan = abonelik almamış demektir → tüm yazma işlemleri engellenir.
     *
     * Mantık:
     *  - Ücretli plan (standart/kurumsal) → kontrol yok
     *  - GET istekler → kontrol yok (okuma her zaman serbest)
     *  - YENİ kullanıcı + deneme plan (iOS veya Web) → 403 PLAN_GEREKLI (paywall)
     *  - ESKİ kullanıcı + deneme plan → mevcut deneme süresi kontrolü (geçiş süresi)
     */
    public static function denemeSuresiKontrol(array $payload): void {
        $plan = $payload['plan'] ?? 'deneme';
        if ($plan !== 'deneme') {
            return;  // ücretli planlardaki kullanıcıya dokunma
        }

        $metod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if ($metod === 'GET') {
            return;  // okuma her zaman serbest
        }

        $sirket_id = (int) ($payload['sirket_id'] ?? 0);
        if ($sirket_id === 0) {
            return;
        }

        $yeni_kullanici = self::yeniSistemKullanicisiMi($sirket_id);

        if ($yeni_kullanici) {
            // Yeni sistem kullanıcısı — kayıt anında trial almıyor.
            // Deneme planında olması = abonelik almadığı anlamına gelir, yazma engellenir.
            // Hem iOS hem Web hem Android için aynı davranış.
            Response::json([
                'basarili'     => false,
                'hata'         => 'Bu işlemi yapabilmek için aboneliği başlatmanız gerekir. İlk 7 gün ücretsiz.',
                'kod'          => 'PLAN_GEREKLI',
                'kalan_gun'    => 0,
                'plan_sayfasi' => true,
            ], 403);
            exit;
        }

        // Eski kullanıcılar (geçiş): deneme süresi dolmuşsa engelle
        $db = Database::baglan();
        $abonelik = new Abonelik($db);

        if ($abonelik->denemeSuresiDolduMu($sirket_id)) {
            Response::json([
                'basarili'     => false,
                'hata'         => 'Ücretsiz deneme süreniz doldu. Devam etmek için bir plan satın alın.',
                'kod'          => 'DENEME_SURESI_DOLDU',
                'kalan_gun'    => 0,
                'plan_sayfasi' => true,
            ], 403);
            exit;
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
