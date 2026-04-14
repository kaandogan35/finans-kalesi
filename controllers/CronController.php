<?php
/**
 * ParamGo — CronController
 *
 * Zamanlı mail gönderimleri. CRON_SECRET key ile korunur.
 *
 * cPanel cron tanımları (APP_URL ve CRON_SECRET değerlerinizle doldurun):
 *
 *   Günlük özet (her gece 00:00):
 *   0 0 * * * wget -q -O /dev/null "https://app.finanskalesi.com/api/cron/gunluk-ozet?key=CRON_SECRET_DEGERI"
 *
 *   Haftalık vadeler (her Pazartesi 08:00):
 *   0 8 * * 1 wget -q -O /dev/null "https://app.finanskalesi.com/api/cron/haftalik-vadeler?key=CRON_SECRET_DEGERI"
 *
 *   Aylık bilanço (her ayın 1'i 09:00):
 *   0 9 1 * * wget -q -O /dev/null "https://app.finanskalesi.com/api/cron/aylik-bilanco?key=CRON_SECRET_DEGERI"
 *
 *   Bildirim kontrolü (saatlik):
 *   0 * * * * wget -q -O /dev/null "https://app.finanskalesi.com/api/cron/bildirim-kontrol?key=CRON_SECRET_DEGERI"
 */

class CronController {

    private $db;

    public function __construct() {
        $this->db = Database::baglan();
    }

    /** Cron secret key kontrolü — başarısızsa 401 döndürür ve çıkar */
    private function cronDogrula(): void {
        $gizli = env('CRON_SECRET', '');
        $gelen = $_GET['key'] ?? '';

        if (empty($gizli) || !hash_equals($gizli, $gelen)) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['basarili' => false, 'hata' => 'Yetkisiz erişim']);
            exit;
        }
    }

    /**
     * Tüm aktif şirketlerin sahip kullanıcısını döndür.
     * @return array [[sirket_id, firma_adi, email, ad_soyad], ...]
     */
    private function aktifSirketleriGetir(): array {
        $stmt = $this->db->prepare(
            "SELECT s.id AS sirket_id, s.firma_adi, k.email, k.ad_soyad
             FROM sirketler s
             JOIN kullanicilar k ON k.sirket_id = s.id AND k.rol = 'sahip' AND k.aktif_mi = 1
             WHERE s.aktif_mi = 1
             ORDER BY s.id ASC"
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    // ──────────────────────────────────────────────────────────
    // GÜNLÜK NAKİT AKIŞ ÖZETİ
    // Her gece 00:00 — o günün kasa hareketleri
    // ──────────────────────────────────────────────────────────
    public function gunlukOzet(): void {
        $this->cronDogrula();

        $sirketler = $this->aktifSirketleriGetir();
        $gonderilen = 0;
        $basarisiz  = 0;

        foreach ($sirketler as $sirket) {
            try {
                $sid = (int)$sirket['sirket_id'];

                // Bugünkü kasa hareketleri
                $stmt = $this->db->prepare(
                    "SELECT
                        TIME_FORMAT(islem_tarihi, '%H:%i') AS saat,
                        aciklama,
                        tutar,
                        hareket_turu AS tur
                     FROM kasa_hareketler
                     WHERE sirket_id = :sid
                       AND DATE(islem_tarihi) = CURDATE()
                       AND silindi_mi = 0
                     ORDER BY islem_tarihi ASC
                     LIMIT 20"
                );
                $stmt->execute([':sid' => $sid]);
                $hareketler = $stmt->fetchAll();

                // Özet istatistikler
                $stmt2 = $this->db->prepare(
                    "SELECT
                        COALESCE(SUM(CASE WHEN hareket_turu = 'giris' THEN tutar ELSE 0 END), 0) AS tahsilat,
                        COALESCE(SUM(CASE WHEN hareket_turu = 'cikis' THEN tutar ELSE 0 END), 0) AS odeme
                     FROM kasa_hareketler
                     WHERE sirket_id = :sid
                       AND DATE(islem_tarihi) = CURDATE()
                       AND silindi_mi = 0"
                );
                $stmt2->execute([':sid' => $sid]);
                $ist = $stmt2->fetch();

                // Kasa bakiyesi
                $stmt3 = $this->db->prepare(
                    "SELECT COALESCE(SUM(CASE WHEN hareket_turu='giris' THEN tutar ELSE -tutar END), 0) AS bakiye
                     FROM kasa_hareketler
                     WHERE sirket_id = :sid AND silindi_mi = 0"
                );
                $stmt3->execute([':sid' => $sid]);
                $bakiye_row = $stmt3->fetch();

                $istatistikler = [
                    'tahsilat' => (float)$ist['tahsilat'],
                    'odeme'    => (float)$ist['odeme'],
                    'bakiye'   => (float)$bakiye_row['bakiye'],
                ];

                $html = MailSablonlar::gunlukNakitOzeti(
                    $sirket['firma_adi'],
                    $istatistikler,
                    $hareketler
                );

                $konu = 'Günlük Nakit Akış Özeti — ' . date('d.m.Y');
                $ok   = MailHelper::gonder($sirket['email'], $konu, $html, $sid, null, 'cron_gunluk');

                $ok ? $gonderilen++ : $basarisiz++;

            } catch (Exception $e) {
                error_log("CronController::gunlukOzet sirket {$sirket['sirket_id']}: " . $e->getMessage());
                $basarisiz++;
            }
        }

        header('Content-Type: application/json');
        echo json_encode([
            'basarili'  => true,
            'gonderilen'=> $gonderilen,
            'basarisiz' => $basarisiz,
            'toplam'    => count($sirketler),
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // HAFTALIK VADE ÖZETİ
    // Her Pazartesi 08:00 — bu haftaki + gecikmiş ödemeler
    // ──────────────────────────────────────────────────────────
    public function haftalikVadeler(): void {
        $this->cronDogrula();

        $sirketler  = $this->aktifSirketleriGetir();
        $gonderilen = 0;
        $basarisiz  = 0;

        foreach ($sirketler as $sirket) {
            try {
                $sid = (int)$sirket['sirket_id'];

                // Bu hafta vadesi dolacak ödemeler (bugün + 7 gün)
                $stmt = $this->db->prepare(
                    "SELECT
                        firma_adi AS cari_adi,
                        aciklama,
                        soz_tarihi AS vade_tarihi,
                        tutar,
                        DATEDIFF(soz_tarihi, CURDATE()) AS gun_kaldi
                     FROM odeme_takip
                     WHERE sirket_id = :sid
                       AND silindi_mi = 0
                       AND durum = 'bekliyor'
                       AND soz_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                     ORDER BY soz_tarihi ASC
                     LIMIT 30"
                );
                $stmt->execute([':sid' => $sid]);
                $yaklasanlar = $stmt->fetchAll();

                // Gecikmiş ödemeler
                $stmt2 = $this->db->prepare(
                    "SELECT
                        firma_adi AS cari_adi,
                        aciklama,
                        soz_tarihi AS vade_tarihi,
                        tutar,
                        DATEDIFF(CURDATE(), soz_tarihi) AS gun_gecmis
                     FROM odeme_takip
                     WHERE sirket_id = :sid
                       AND silindi_mi = 0
                       AND durum = 'bekliyor'
                       AND soz_tarihi < CURDATE()
                     ORDER BY soz_tarihi ASC
                     LIMIT 20"
                );
                $stmt2->execute([':sid' => $sid]);
                $gecmisler = $stmt2->fetchAll();

                // Hiç kayıt yoksa mail gönderme
                if (empty($yaklasanlar) && empty($gecmisler)) continue;

                $html = MailSablonlar::haftalikVadeler(
                    $sirket['firma_adi'],
                    $yaklasanlar,
                    $gecmisler
                );

                $konu = 'Haftalık Ödeme Özeti — ' . date('d.m.Y');
                $ok   = MailHelper::gonder($sirket['email'], $konu, $html, $sid, null, 'cron_haftalik');

                $ok ? $gonderilen++ : $basarisiz++;

            } catch (Exception $e) {
                error_log("CronController::haftalikVadeler sirket {$sirket['sirket_id']}: " . $e->getMessage());
                $basarisiz++;
            }
        }

        header('Content-Type: application/json');
        echo json_encode([
            'basarili'  => true,
            'gonderilen'=> $gonderilen,
            'basarisiz' => $basarisiz,
            'toplam'    => count($sirketler),
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // AYLIK BİLANÇO RAPORU
    // Her ayın 1'i 09:00 — önceki ayın kapanış özeti
    // ──────────────────────────────────────────────────────────
    public function aylikBilanco(): void {
        $this->cronDogrula();

        $sirketler  = $this->aktifSirketleriGetir();
        $gonderilen = 0;
        $basarisiz  = 0;

        // Önceki ay hesapla (strtotime güvenli kullanım)
        $onceki_ay_ts = strtotime('first day of last month');
        if ($onceki_ay_ts === false) {
            $onceki_ay_ts = strtotime('-1 month');
        }
        $onceki_ay_bitis   = date('Y-m-t', $onceki_ay_ts);
        $onceki_ay_baslang = date('Y-m-01', $onceki_ay_ts);
        $ay_adi = [
            1=>'Ocak',2=>'Şubat',3=>'Mart',4=>'Nisan',5=>'Mayıs',6=>'Haziran',
            7=>'Temmuz',8=>'Ağustos',9=>'Eylül',10=>'Ekim',11=>'Kasım',12=>'Aralık'
        ][(int)date('n', $onceki_ay_ts)];
        $ay_yil = $ay_adi . ' ' . date('Y', $onceki_ay_ts);

        foreach ($sirketler as $sirket) {
            try {
                $sid = (int)$sirket['sirket_id'];

                // Gelir / Gider / Net
                $stmt = $this->db->prepare(
                    "SELECT
                        COALESCE(SUM(CASE WHEN hareket_turu='giris' THEN tutar ELSE 0 END),0) AS toplam_gelir,
                        COALESCE(SUM(CASE WHEN hareket_turu='cikis' THEN tutar ELSE 0 END),0) AS toplam_gider
                     FROM kasa_hareketler
                     WHERE sirket_id = :sid
                       AND silindi_mi = 0
                       AND DATE(islem_tarihi) BETWEEN :bas AND :bit"
                );
                $stmt->execute([':sid' => $sid, ':bas' => $onceki_ay_baslang, ':bit' => $onceki_ay_bitis]);
                $ist = $stmt->fetch();

                // Kapanış bakiyesi
                $stmt2 = $this->db->prepare(
                    "SELECT COALESCE(SUM(CASE WHEN hareket_turu='giris' THEN tutar ELSE -tutar END),0) AS bakiye
                     FROM kasa_hareketler
                     WHERE sirket_id = :sid AND silindi_mi = 0
                       AND DATE(islem_tarihi) <= :bit"
                );
                $stmt2->execute([':sid' => $sid, ':bit' => $onceki_ay_bitis]);
                $bakiye_row = $stmt2->fetch();

                // Açık alacak / borç (cari bakiyelerinden)
                $stmt3 = $this->db->prepare(
                    "SELECT
                        COALESCE(SUM(CASE WHEN bakiye > 0 THEN bakiye ELSE 0 END),0) AS acik_alacak,
                        COALESCE(SUM(CASE WHEN bakiye < 0 THEN ABS(bakiye) ELSE 0 END),0) AS acik_borc
                     FROM cari_kartlar
                     WHERE sirket_id = :sid AND silindi_mi = 0"
                );
                $stmt3->execute([':sid' => $sid]);
                $cari = $stmt3->fetch();

                $gelir   = (float)$ist['toplam_gelir'];
                $gider   = (float)$ist['toplam_gider'];
                $istatistikler = [
                    'toplam_gelir'     => $gelir,
                    'toplam_gider'     => $gider,
                    'net'              => $gelir - $gider,
                    'acik_alacak'      => (float)$cari['acik_alacak'],
                    'acik_borc'        => (float)$cari['acik_borc'],
                    'kapanis_bakiyesi' => (float)$bakiye_row['bakiye'],
                ];

                // En büyük tahsilatlar
                $stmt4 = $this->db->prepare(
                    "SELECT aciklama, tutar, DATE(islem_tarihi) AS tarih
                     FROM kasa_hareketler
                     WHERE sirket_id = :sid AND silindi_mi = 0
                       AND hareket_turu = 'giris'
                       AND DATE(islem_tarihi) BETWEEN :bas AND :bit
                     ORDER BY tutar DESC LIMIT 5"
                );
                $stmt4->execute([':sid' => $sid, ':bas' => $onceki_ay_baslang, ':bit' => $onceki_ay_bitis]);
                $tahsilatlar = $stmt4->fetchAll();

                // En büyük ödemeler
                $stmt5 = $this->db->prepare(
                    "SELECT aciklama, tutar, DATE(islem_tarihi) AS tarih
                     FROM kasa_hareketler
                     WHERE sirket_id = :sid AND silindi_mi = 0
                       AND hareket_turu = 'cikis'
                       AND DATE(islem_tarihi) BETWEEN :bas AND :bit
                     ORDER BY tutar DESC LIMIT 5"
                );
                $stmt5->execute([':sid' => $sid, ':bas' => $onceki_ay_baslang, ':bit' => $onceki_ay_bitis]);
                $odemeler = $stmt5->fetchAll();

                $html = MailSablonlar::aylikBilanco(
                    $sirket['firma_adi'],
                    $ay_yil,
                    $istatistikler,
                    $tahsilatlar,
                    $odemeler
                );

                $konu = $ay_yil . ' Aylık Bilanço Raporu — ParamGo';
                $ok   = MailHelper::gonder($sirket['email'], $konu, $html, $sid, null, 'cron_aylik');

                $ok ? $gonderilen++ : $basarisiz++;

            } catch (Exception $e) {
                error_log("CronController::aylikBilanco sirket {$sirket['sirket_id']}: " . $e->getMessage());
                $basarisiz++;
            }
        }

        header('Content-Type: application/json');
        echo json_encode([
            'basarili'  => true,
            'gonderilen'=> $gonderilen,
            'basarisiz' => $basarisiz,
            'toplam'    => count($sirketler),
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // BİLDİRİM KONTROLÜ
    // Saatlik — vadesi yaklaşan ödemeler ve çek/senetler için
    // uygulama içi bildirim + email oluşturur
    // ──────────────────────────────────────────────────────────
    public function bildirimKontrol(): void {
        $this->cronDogrula();

        $sirketler    = $this->aktifSirketleriGetir();
        $olusturulan  = 0;

        foreach ($sirketler as $sirket) {
            try {
                $sid = (int)$sirket['sirket_id'];

                // Sahip kullanıcı ID (bildirim gönderilecek kişi)
                $bildirim_model = new Bildirim();
                $sahipler = $bildirim_model->sirket_sahipleri($sid);
                if (empty($sahipler)) continue;

                // ── 1. Yaklaşan ödeme vadeleri (3 gün, 1 gün, bugün) ──
                $stmt = $this->db->prepare(
                    "SELECT id, firma_adi, aciklama, tutar, soz_tarihi,
                            DATEDIFF(soz_tarihi, CURDATE()) AS gun_kaldi
                     FROM odeme_takip
                     WHERE sirket_id = :sid
                       AND silindi_mi = 0
                       AND durum = 'bekliyor'
                       AND soz_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                     ORDER BY soz_tarihi ASC
                     LIMIT 50"
                );
                $stmt->execute([':sid' => $sid]);
                $yaklasan_odemeler = $stmt->fetchAll();

                foreach ($yaklasan_odemeler as $odeme) {
                    $gun = (int)$odeme['gun_kaldi'];
                    $oncelik = $gun === 0 ? 'kritik' : ($gun === 1 ? 'yuksek' : 'normal');
                    $gun_metin = $gun === 0 ? 'BUGÜN' : "$gun gün sonra";

                    foreach ($sahipler as $sahip) {
                        $sonuc = BildirimOlusturucu::gonder([
                            'sirket_id'    => $sid,
                            'kullanici_id' => $sahip['id'],
                            'tip'          => 'odeme_vade',
                            'baslik'       => "{$odeme['firma_adi']} — ödeme vadesi {$gun_metin}",
                            'mesaj'        => number_format((float)$odeme['tutar'], 2, ',', '.') . " TL tutarındaki ödeme {$gun_metin} vadeli. " . ($odeme['aciklama'] ?? ''),
                            'oncelik'      => $oncelik,
                            'kaynak_turu'  => 'odeme_takip',
                            'kaynak_id'    => (int)$odeme['id'],
                            'aksiyon_url'  => '/odemeler',
                        ]);
                        if ($sonuc !== false) $olusturulan++;
                    }
                }

                // ── 2. Geciken ödemeler ──
                $stmt2 = $this->db->prepare(
                    "SELECT id, firma_adi, aciklama, tutar, soz_tarihi,
                            DATEDIFF(CURDATE(), soz_tarihi) AS gun_gecmis
                     FROM odeme_takip
                     WHERE sirket_id = :sid
                       AND silindi_mi = 0
                       AND durum = 'bekliyor'
                       AND soz_tarihi < CURDATE()
                       AND soz_tarihi >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                     ORDER BY soz_tarihi ASC
                     LIMIT 30"
                );
                $stmt2->execute([':sid' => $sid]);
                $geciken_odemeler = $stmt2->fetchAll();

                foreach ($geciken_odemeler as $odeme) {
                    $gun = (int)$odeme['gun_gecmis'];

                    foreach ($sahipler as $sahip) {
                        $sonuc = BildirimOlusturucu::gonder([
                            'sirket_id'    => $sid,
                            'kullanici_id' => $sahip['id'],
                            'tip'          => 'geciken_odeme',
                            'baslik'       => "{$odeme['firma_adi']} — ödeme {$gun} gün gecikti",
                            'mesaj'        => number_format((float)$odeme['tutar'], 2, ',', '.') . " TL tutarındaki ödeme {$gun} gündür gecikiyor.",
                            'oncelik'      => $gun > 7 ? 'kritik' : 'yuksek',
                            'kaynak_turu'  => 'odeme_takip',
                            'kaynak_id'    => (int)$odeme['id'],
                            'aksiyon_url'  => '/odemeler',
                        ]);
                        if ($sonuc !== false) $olusturulan++;
                    }
                }

                // ── 3. Yaklaşan alacak çek vadeleri (portföyde veya tahsile verildi) ──
                $stmt3 = $this->db->prepare(
                    "SELECT cs.id, COALESCE(c.ad, 'Bilinmeyen Cari') AS cari_adi,
                            cs.tutar, cs.tutar_tl, cs.doviz_kodu, cs.vade_tarihi, cs.tur,
                            DATEDIFF(cs.vade_tarihi, CURDATE()) AS gun_kaldi
                     FROM cek_senetler cs
                     LEFT JOIN cariler c ON c.id = cs.cari_id
                     WHERE cs.sirket_id = :sid
                       AND cs.silindi_mi = 0
                       AND cs.tur IN ('alacak_ceki', 'alacak_senedi')
                       AND cs.durum IN ('portfoyde', 'tahsile_verildi')
                       AND cs.vade_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                     ORDER BY cs.vade_tarihi ASC
                     LIMIT 50"
                );
                $stmt3->execute([':sid' => $sid]);
                $alacak_cekler = $stmt3->fetchAll();

                foreach ($alacak_cekler as $cek) {
                    $gun      = (int)$cek['gun_kaldi'];
                    $oncelik  = $gun === 0 ? 'kritik' : 'yuksek';
                    $tutar    = number_format((float)($cek['tutar_tl'] ?? $cek['tutar']), 2, ',', '.');
                    $doviz    = $cek['doviz_kodu'] ?? 'TRY';
                    $sembol   = $doviz === 'TRY' ? '₺' : ($doviz === 'USD' ? '$' : ($doviz === 'EUR' ? '€' : $doviz));
                    $gun_metin = $gun === 0 ? 'Bugün' : ($gun === 1 ? 'Yarın' : "$gun gün sonra");

                    foreach ($sahipler as $sahip) {
                        $sonuc = BildirimOlusturucu::gonder([
                            'sirket_id'    => $sid,
                            'kullanici_id' => $sahip['id'],
                            'tip'          => 'cek_vade',
                            'baslik'       => $gun === 0 ? 'Bugün Vadesi Dolan Çekin Var!' : ($gun === 1 ? 'Yarın Vadesi Dolan Çekin Var' : 'Çek Vadesi Yaklaşıyor · ' . $gun . ' Gün Kaldı'),
                            'mesaj'        => "{$tutar} {$sembol} · {$cek['cari_adi']} alacak çekin {$gun_metin} tahsil edilmeli",
                            'oncelik'      => $oncelik,
                            'kaynak_turu'  => 'cek_senet',
                            'kaynak_id'    => (int)$cek['id'],
                            'aksiyon_url'  => '/cek-senet',
                        ]);
                        if ($sonuc !== false) $olusturulan++;
                    }
                }

                // ── 4. Yaklaşan borç çek vadeleri (portföyde) ──
                $stmt4 = $this->db->prepare(
                    "SELECT cs.id, COALESCE(c.ad, 'Bilinmeyen Cari') AS cari_adi,
                            cs.tutar, cs.tutar_tl, cs.doviz_kodu, cs.vade_tarihi, cs.tur,
                            DATEDIFF(cs.vade_tarihi, CURDATE()) AS gun_kaldi
                     FROM cek_senetler cs
                     LEFT JOIN cariler c ON c.id = cs.cari_id
                     WHERE cs.sirket_id = :sid
                       AND cs.silindi_mi = 0
                       AND cs.tur IN ('borc_ceki', 'borc_senedi')
                       AND cs.durum = 'portfoyde'
                       AND cs.vade_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                     ORDER BY cs.vade_tarihi ASC
                     LIMIT 50"
                );
                $stmt4->execute([':sid' => $sid]);
                $borc_cekler = $stmt4->fetchAll();

                foreach ($borc_cekler as $cek) {
                    $gun      = (int)$cek['gun_kaldi'];
                    $oncelik  = $gun === 0 ? 'kritik' : 'yuksek';
                    $tutar    = number_format((float)($cek['tutar_tl'] ?? $cek['tutar']), 2, ',', '.');
                    $doviz    = $cek['doviz_kodu'] ?? 'TRY';
                    $sembol   = $doviz === 'TRY' ? '₺' : ($doviz === 'USD' ? '$' : ($doviz === 'EUR' ? '€' : $doviz));
                    $gun_metin = $gun === 0 ? 'Bugün' : ($gun === 1 ? 'Yarın' : "$gun gün sonra");

                    foreach ($sahipler as $sahip) {
                        $sonuc = BildirimOlusturucu::gonder([
                            'sirket_id'    => $sid,
                            'kullanici_id' => $sahip['id'],
                            'tip'          => 'cek_vade',
                            'baslik'       => $gun === 0 ? 'Bugün Ödenmesi Gereken Çekin Var!' : ($gun === 1 ? 'Yarın Ödenmesi Gereken Çekin Var' : 'Ödeme Vadesi Yaklaşıyor · ' . $gun . ' Gün Kaldı'),
                            'mesaj'        => "{$tutar} {$sembol} · {$cek['cari_adi']} borcunuzun vadesi {$gun_metin}",
                            'oncelik'      => $oncelik,
                            'kaynak_turu'  => 'cek_senet',
                            'kaynak_id'    => (int)$cek['id'],
                            'aksiyon_url'  => '/cek-senet',
                        ]);
                        if ($sonuc !== false) $olusturulan++;
                    }
                }

            } catch (Exception $e) {
                error_log("CronController::bildirimKontrol sirket {$sirket['sirket_id']}: " . $e->getMessage());
            }
        }

        header('Content-Type: application/json');
        echo json_encode([
            'basarili'    => true,
            'olusturulan' => $olusturulan,
            'toplam'      => count($sirketler),
        ]);
    }
}
