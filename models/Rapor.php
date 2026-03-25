<?php
/**
 * Finans Kalesi — Rapor Modeli
 *
 * Raporlama modülü veritabanı sorguları:
 * - Cari Yaşlandırma
 * - Nakit Akış
 * - Çek/Senet Portföy
 * - Ödeme Özet
 * - Genel Özet
 * - Rapor geçmişi
 */

class Rapor {

    private $db;

    public function __construct() {
        $this->db = Database::baglan();
    }

    // ─── 1. CARİ YAŞLANDIRMA ──────────────────────────────────────

    /**
     * Cari yaşlandırma raporu: Her carinin vade grubuna göre bakiyesi
     * Gruplar: 0-30, 31-60, 61-90, 90+ gün
     */
    public function cari_yaslandirma(int $sirket_id, array $filtreler = []): array {
        $where = "WHERE ch.sirket_id = :sirket_id AND ch.silindi_mi = 0";
        $params = [':sirket_id' => $sirket_id];

        if (!empty($filtreler['cari_id'])) {
            $where .= " AND ch.cari_id = :cari_id";
            $params[':cari_id'] = (int)$filtreler['cari_id'];
        }

        if (!empty($filtreler['cari_turu'])) {
            $where .= " AND ck.cari_turu = :cari_turu";
            $params[':cari_turu'] = $filtreler['cari_turu'];
        }

        // Vade tarihi boş olanları hariç tut
        $where .= " AND ch.vade_tarihi IS NOT NULL";

        $sql = "SELECT
                    ck.id as cari_id,
                    ck.cari_adi_sifreli,
                    ck.cari_turu,
                    ch.islem_tipi,
                    ch.tutar,
                    ch.vade_tarihi,
                    DATEDIFF(CURDATE(), ch.vade_tarihi) as gecen_gun
                FROM cari_hareketler ch
                INNER JOIN cari_kartlar ck ON ck.id = ch.cari_id AND ck.sirket_id = ch.sirket_id AND ck.silindi_mi = 0
                $where
                ORDER BY ck.cari_adi_sifreli, ch.vade_tarihi";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $satirlar = $stmt->fetchAll();

        // PHP'de cariye göre grupla
        $cariler = [];
        foreach ($satirlar as $s) {
            $cid = $s['cari_id'];
            if (!isset($cariler[$cid])) {
                $cariler[$cid] = [
                    'cari_id'   => $cid,
                    'unvan'     => SistemKripto::coz($s['cari_adi_sifreli']),
                    'cari_turu' => $s['cari_turu'],
                    'guncel'    => 0,  // 0-30 gün
                    'otuz_altmis' => 0, // 31-60 gün
                    'altmis_doksan' => 0, // 61-90 gün
                    'doksan_ustu' => 0,  // 90+ gün
                    'toplam'    => 0,
                ];
            }

            // Borçlandırma + tutar, tahsilat - tutar
            $miktar = (float)$s['tutar'];
            if ($s['islem_tipi'] === 'tahsilat') {
                $miktar = -$miktar;
            }

            $gun = (int)$s['gecen_gun'];
            if ($gun <= 30) {
                $cariler[$cid]['guncel'] += $miktar;
            } elseif ($gun <= 60) {
                $cariler[$cid]['otuz_altmis'] += $miktar;
            } elseif ($gun <= 90) {
                $cariler[$cid]['altmis_doksan'] += $miktar;
            } else {
                $cariler[$cid]['doksan_ustu'] += $miktar;
            }
            $cariler[$cid]['toplam'] += $miktar;
        }

        // Sıfır bakiyeli carileri çıkar
        $sonuc = array_values(array_filter($cariler, fn($c) => abs($c['toplam']) > 0.01));

        // Toplama göre sırala (en yüksek borç en üstte)
        usort($sonuc, fn($a, $b) => $b['toplam'] <=> $a['toplam']);

        // Özet istatistikler
        $ozet = [
            'guncel' => 0, 'otuz_altmis' => 0, 'altmis_doksan' => 0, 'doksan_ustu' => 0, 'toplam' => 0,
        ];
        foreach ($sonuc as $c) {
            $ozet['guncel'] += $c['guncel'];
            $ozet['otuz_altmis'] += $c['otuz_altmis'];
            $ozet['altmis_doksan'] += $c['altmis_doksan'];
            $ozet['doksan_ustu'] += $c['doksan_ustu'];
            $ozet['toplam'] += $c['toplam'];
        }

        return ['cariler' => $sonuc, 'ozet' => $ozet];
    }

    // ─── 2. NAKİT AKIŞ ────────────────────────────────────────────

    /**
     * Nakit akış raporu: Aylık bazda giriş/çıkış
     * Kaynak: kasa_hareketler (tutar şifreli, PHP'de çözülür)
     */
    public function nakit_akis(int $sirket_id, array $filtreler = []): array {
        $baslangic = $filtreler['baslangic_tarihi'] ?? date('Y-01-01');
        $bitis = $filtreler['bitis_tarihi'] ?? date('Y-12-31');

        $sql = "SELECT id, islem_tipi, tutar_sifreli, tarih
                FROM kasa_hareketler
                WHERE sirket_id = :sirket_id AND silindi_mi = 0
                  AND tarih >= :baslangic AND tarih <= :bitis
                ORDER BY tarih";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':sirket_id'  => $sirket_id,
            ':baslangic'  => $baslangic,
            ':bitis'      => $bitis,
        ]);
        $satirlar = $stmt->fetchAll();

        // Aylık gruplama — şifreli tutarları çöz
        $aylar = [];
        $toplamGiris = 0;
        $toplamCikis = 0;

        foreach ($satirlar as $s) {
            $ay = date('Y-m', strtotime($s['tarih']));
            if (!isset($aylar[$ay])) {
                $aylar[$ay] = ['ay' => $ay, 'giris' => 0, 'cikis' => 0, 'net' => 0];
            }

            $tutar = (float)(SistemKripto::coz($s['tutar_sifreli']) ?? 0);

            if ($s['islem_tipi'] === 'giris') {
                $aylar[$ay]['giris'] += $tutar;
                $toplamGiris += $tutar;
            } else {
                $aylar[$ay]['cikis'] += $tutar;
                $toplamCikis += $tutar;
            }
            $aylar[$ay]['net'] = $aylar[$ay]['giris'] - $aylar[$ay]['cikis'];
        }

        // Boş ayları doldur
        $baslangicAy = date('Y-m', strtotime($baslangic));
        $bitisAy = date('Y-m', strtotime($bitis));
        $donem = $baslangicAy;
        $tumAylar = [];
        while ($donem <= $bitisAy) {
            $tumAylar[] = $aylar[$donem] ?? ['ay' => $donem, 'giris' => 0, 'cikis' => 0, 'net' => 0];
            $donem = date('Y-m', strtotime($donem . '-01 +1 month'));
        }

        return [
            'aylar' => $tumAylar,
            'ozet'  => [
                'toplam_giris' => $toplamGiris,
                'toplam_cikis' => $toplamCikis,
                'net'          => $toplamGiris - $toplamCikis,
            ],
        ];
    }

    // ─── 3. ÇEK/SENET PORTFÖY ─────────────────────────────────────

    /**
     * Çek/senet portföy raporu: Duruma göre dağılım + vade takvimi
     */
    public function cek_portfoy(int $sirket_id, array $filtreler = []): array {
        $where = "WHERE cs.sirket_id = :sirket_id AND cs.silindi_mi = 0";
        $params = [':sirket_id' => $sirket_id];

        if (!empty($filtreler['tur'])) {
            $where .= " AND cs.tur = :tur";
            $params[':tur'] = $filtreler['tur'];
        }

        if (!empty($filtreler['durum'])) {
            $where .= " AND cs.durum = :durum";
            $params[':durum'] = $filtreler['durum'];
        }

        if (!empty($filtreler['baslangic_tarihi'])) {
            $where .= " AND cs.vade_tarihi >= :baslangic";
            $params[':baslangic'] = $filtreler['baslangic_tarihi'];
        }

        if (!empty($filtreler['bitis_tarihi'])) {
            $where .= " AND cs.vade_tarihi <= :bitis";
            $params[':bitis'] = $filtreler['bitis_tarihi'];
        }

        // Duruma göre dağılım
        $sql_durum = "SELECT cs.durum, cs.tur, COUNT(*) as adet, SUM(cs.tutar) as toplam_tutar
                      FROM cek_senetler cs $where
                      GROUP BY cs.durum, cs.tur
                      ORDER BY cs.durum, cs.tur";
        $stmt = $this->db->prepare($sql_durum);
        $stmt->execute($params);
        $durum_dagilim = $stmt->fetchAll();

        // Vade takvimi (aylık)
        $sql_vade = "SELECT
                        DATE_FORMAT(cs.vade_tarihi, '%Y-%m') as ay,
                        cs.tur,
                        COUNT(*) as adet,
                        SUM(cs.tutar) as toplam_tutar
                     FROM cek_senetler cs $where
                       AND cs.durum IN ('portfoyde', 'tahsile_verildi')
                     GROUP BY ay, cs.tur
                     ORDER BY ay";
        $stmt = $this->db->prepare($sql_vade);
        $stmt->execute($params);
        $vade_takvimi = $stmt->fetchAll();

        // Genel özet
        $sql_ozet = "SELECT
                        COUNT(*) as toplam_adet,
                        SUM(cs.tutar) as toplam_tutar,
                        SUM(CASE WHEN cs.tur IN ('alacak_ceki','alacak_senedi') THEN cs.tutar ELSE 0 END) as alacak_toplam,
                        SUM(CASE WHEN cs.tur IN ('borc_ceki','borc_senedi') THEN cs.tutar ELSE 0 END) as borc_toplam,
                        SUM(CASE WHEN cs.durum = 'portfoyde' THEN cs.tutar ELSE 0 END) as portfoy_toplam,
                        SUM(CASE WHEN cs.durum = 'karsiliksiz' THEN cs.tutar ELSE 0 END) as karsiliksiz_toplam
                     FROM cek_senetler cs $where";
        $stmt = $this->db->prepare($sql_ozet);
        $stmt->execute($params);
        $ozet = $stmt->fetch();

        return [
            'durum_dagilim' => $durum_dagilim,
            'vade_takvimi'  => $vade_takvimi,
            'ozet'          => $ozet,
        ];
    }

    // ─── 4. ÖDEME ÖZET ────────────────────────────────────────────

    /**
     * Ödeme takip özeti: Tahsilat vs ödeme + durum dağılımı
     */
    public function odeme_ozet(int $sirket_id, array $filtreler = []): array {
        $where = "WHERE ot.sirket_id = :sirket_id AND ot.silindi_mi = 0";
        $params = [':sirket_id' => $sirket_id];

        if (!empty($filtreler['baslangic_tarihi'])) {
            $where .= " AND ot.olusturma_tarihi >= :baslangic";
            $params[':baslangic'] = $filtreler['baslangic_tarihi'] . ' 00:00:00';
        }

        if (!empty($filtreler['bitis_tarihi'])) {
            $where .= " AND ot.olusturma_tarihi <= :bitis";
            $params[':bitis'] = $filtreler['bitis_tarihi'] . ' 23:59:59';
        }

        if (!empty($filtreler['durum'])) {
            $where .= " AND ot.durum = :durum";
            $params[':durum'] = $filtreler['durum'];
        }

        // Yön bazlı özet (tahsilat vs ödeme)
        $sql_yon = "SELECT
                        ot.yon,
                        COUNT(*) as adet,
                        SUM(ot.tutar) as toplam_tutar,
                        SUM(CASE WHEN ot.durum = 'tamamlandi' THEN ot.tutar ELSE 0 END) as tamamlanan_tutar,
                        SUM(CASE WHEN ot.durum != 'tamamlandi' AND ot.durum != 'iptal' THEN ot.tutar ELSE 0 END) as bekleyen_tutar
                    FROM odeme_takip ot $where
                    GROUP BY ot.yon";
        $stmt = $this->db->prepare($sql_yon);
        $stmt->execute($params);
        $yon_ozet = $stmt->fetchAll();

        // Durum dağılımı
        $sql_durum = "SELECT
                          ot.durum,
                          ot.yon,
                          COUNT(*) as adet,
                          SUM(ot.tutar) as toplam_tutar
                      FROM odeme_takip ot $where
                      GROUP BY ot.durum, ot.yon
                      ORDER BY ot.durum";
        $stmt = $this->db->prepare($sql_durum);
        $stmt->execute($params);
        $durum_dagilim = $stmt->fetchAll();

        // Aylık trend
        $sql_aylik = "SELECT
                          DATE_FORMAT(ot.olusturma_tarihi, '%Y-%m') as ay,
                          ot.yon,
                          SUM(ot.tutar) as toplam_tutar,
                          COUNT(*) as adet
                      FROM odeme_takip ot $where
                      GROUP BY ay, ot.yon
                      ORDER BY ay";
        $stmt = $this->db->prepare($sql_aylik);
        $stmt->execute($params);
        $aylik_trend = $stmt->fetchAll();

        // Geciken ödemeler
        $sql_geciken = "SELECT
                            COUNT(*) as adet,
                            SUM(ot.tutar) as toplam_tutar
                        FROM odeme_takip ot $where
                          AND ot.durum NOT IN ('tamamlandi', 'iptal')
                          AND ot.soz_tarihi < CURDATE()";
        $stmt = $this->db->prepare($sql_geciken);
        $stmt->execute($params);
        $geciken = $stmt->fetch();

        return [
            'yon_ozet'      => $yon_ozet,
            'durum_dagilim' => $durum_dagilim,
            'aylik_trend'   => $aylik_trend,
            'geciken'       => $geciken,
        ];
    }

    // ─── 5. GENEL ÖZET ────────────────────────────────────────────

    /**
     * Genel finansal özet: Tüm modüllerden KPI verileri
     */
    public function genel_ozet(int $sirket_id): array {
        // Cari bakiye toplamları
        $sql_cari = "SELECT
                         SUM(CASE WHEN ch.islem_tipi = 'borclandirma' THEN ch.tutar ELSE 0 END) as toplam_borc,
                         SUM(CASE WHEN ch.islem_tipi = 'tahsilat' THEN ch.tutar ELSE 0 END) as toplam_alacak
                     FROM cari_hareketler ch
                     WHERE ch.sirket_id = :sirket_id AND ch.silindi_mi = 0";
        $stmt = $this->db->prepare($sql_cari);
        $stmt->execute([':sirket_id' => $sirket_id]);
        $cari = $stmt->fetch();

        // Çek/senet portföy
        $sql_cek = "SELECT
                        SUM(CASE WHEN tur IN ('alacak_ceki','alacak_senedi') AND durum = 'portfoyde' THEN tutar ELSE 0 END) as alacak_portfoy,
                        SUM(CASE WHEN tur IN ('borc_ceki','borc_senedi') AND durum = 'portfoyde' THEN tutar ELSE 0 END) as borc_portfoy,
                        SUM(CASE WHEN durum = 'karsiliksiz' THEN tutar ELSE 0 END) as karsiliksiz
                    FROM cek_senetler
                    WHERE sirket_id = :sirket_id AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql_cek);
        $stmt->execute([':sirket_id' => $sirket_id]);
        $cek = $stmt->fetch();

        // Ödeme takip
        $sql_odeme = "SELECT
                          SUM(CASE WHEN yon = 'tahsilat' AND durum != 'iptal' THEN tutar ELSE 0 END) as tahsilat_toplam,
                          SUM(CASE WHEN yon = 'odeme' AND durum != 'iptal' THEN tutar ELSE 0 END) as odeme_toplam,
                          SUM(CASE WHEN durum NOT IN ('tamamlandi','iptal') AND soz_tarihi < CURDATE() THEN tutar ELSE 0 END) as geciken_toplam,
                          COUNT(CASE WHEN durum NOT IN ('tamamlandi','iptal') AND soz_tarihi < CURDATE() THEN 1 END) as geciken_adet
                      FROM odeme_takip
                      WHERE sirket_id = :sirket_id AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql_odeme);
        $stmt->execute([':sirket_id' => $sirket_id]);
        $odeme = $stmt->fetch();

        // Kasa bakiyesi (şifreli tutar — PHP'de çöz)
        $sql_kasa = "SELECT islem_tipi, tutar_sifreli FROM kasa_hareketler
                     WHERE sirket_id = :sirket_id AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql_kasa);
        $stmt->execute([':sirket_id' => $sirket_id]);
        $kasa_hareketleri = $stmt->fetchAll();

        $kasa_giris = 0;
        $kasa_cikis = 0;
        foreach ($kasa_hareketleri as $kh) {
            $tutar = (float)(SistemKripto::coz($kh['tutar_sifreli']) ?? 0);
            if ($kh['islem_tipi'] === 'giris') {
                $kasa_giris += $tutar;
            } else {
                $kasa_cikis += $tutar;
            }
        }

        // Aktif cari sayısı
        $sql_cari_sayi = "SELECT COUNT(*) as sayi FROM cari_kartlar
                          WHERE sirket_id = :sirket_id AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql_cari_sayi);
        $stmt->execute([':sirket_id' => $sirket_id]);
        $cari_sayi = (int)$stmt->fetch()['sayi'];

        return [
            'cari' => [
                'toplam_borc'   => (float)($cari['toplam_borc'] ?? 0),
                'toplam_alacak' => (float)($cari['toplam_alacak'] ?? 0),
                'net_bakiye'    => (float)($cari['toplam_borc'] ?? 0) - (float)($cari['toplam_alacak'] ?? 0),
                'aktif_cari'    => $cari_sayi,
            ],
            'cek_senet' => [
                'alacak_portfoy'  => (float)($cek['alacak_portfoy'] ?? 0),
                'borc_portfoy'    => (float)($cek['borc_portfoy'] ?? 0),
                'karsiliksiz'     => (float)($cek['karsiliksiz'] ?? 0),
            ],
            'odeme' => [
                'tahsilat_toplam' => (float)($odeme['tahsilat_toplam'] ?? 0),
                'odeme_toplam'    => (float)($odeme['odeme_toplam'] ?? 0),
                'geciken_toplam'  => (float)($odeme['geciken_toplam'] ?? 0),
                'geciken_adet'    => (int)($odeme['geciken_adet'] ?? 0),
            ],
            'kasa' => [
                'toplam_giris' => $kasa_giris,
                'toplam_cikis' => $kasa_cikis,
                'bakiye'       => $kasa_giris - $kasa_cikis,
            ],
        ];
    }

    // ─── RAPOR GEÇMİŞİ ────────────────────────────────────────────

    /**
     * Rapor geçmişi kaydet
     */
    public function gecmis_kaydet(int $sirket_id, int $kullanici_id, string $rapor_turu, string $rapor_adi, string $format, ?array $filtreler = null): int {
        $sql = "INSERT INTO rapor_gecmisi (sirket_id, kullanici_id, rapor_turu, rapor_adi, format, filtreler)
                VALUES (:sirket_id, :kullanici_id, :rapor_turu, :rapor_adi, :format, :filtreler)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':sirket_id'     => $sirket_id,
            ':kullanici_id'  => $kullanici_id,
            ':rapor_turu'    => $rapor_turu,
            ':rapor_adi'     => $rapor_adi,
            ':format'        => $format,
            ':filtreler'     => $filtreler ? json_encode($filtreler, JSON_UNESCAPED_UNICODE) : null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Rapor geçmişi listele
     */
    public function gecmis_listele(int $sirket_id, int $kullanici_id, int $limit = 20): array {
        $sql = "SELECT * FROM rapor_gecmisi
                WHERE sirket_id = :sirket_id AND kullanici_id = :kullanici_id
                ORDER BY olusturma_tarihi DESC
                LIMIT $limit";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':sirket_id' => $sirket_id, ':kullanici_id' => $kullanici_id]);
        return $stmt->fetchAll();
    }
}
