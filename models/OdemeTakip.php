<?php
// =============================================================
// OdemeTakip.php — Ödeme ve Tahsilat Takip Veritabanı İşlemleri
// Finans Kalesi SaaS — Aşama 1.9 (Global PII Şifreleme + Soft Delete)
//
// Şifrelenen PII alanlar: firma_adi, ilgili_kisi, telefon, gorusme_notu
// Plaintext kalan alanlar: tutar (SQL SUM/filtre için gerekli)
//
// KRİTİK KURALLAR:
//   - SELECT sorgularında HER ZAMAN silindi_mi = 0 şartı
//   - DELETE FROM YASAK — sadece silindi_mi = 1 güncelleme
//   - Her sorguda sirket_id filtresi zorunlu (multi-tenant)
// =============================================================

class OdemeTakip {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ─── Yardımcı: PII alanları çöz ───
    private function pii_coz(array $row): array {
        $pii = [
            'firma_adi'    => 'firma_adi_sifreli',
            'ilgili_kisi'  => 'ilgili_kisi_sifreli',
            'telefon'      => 'telefon_sifreli',
            'gorusme_notu' => 'gorusme_notu_sifreli',
        ];

        foreach ($pii as $duz => $sifreli_sutun) {
            if (!empty($row[$sifreli_sutun])) {
                $cozulmus = SistemKripto::coz($row[$sifreli_sutun]);
                if ($cozulmus !== null) {
                    $row[$duz] = $cozulmus;
                }
            }
            unset($row[$sifreli_sutun]);
        }

        return $row;
    }

    // Tüm kayıtları listele (sayfalama + filtre)
    public function listele($sirket_id, $filtreler = []) {
        $where  = ["ot.sirket_id = ?", "ot.silindi_mi = 0"];
        $params = [$sirket_id];

        if (!empty($filtreler['yon'])) {
            $where[] = "ot.yon = ?";
            $params[] = $filtreler['yon'];
        }

        if (!empty($filtreler['durum'])) {
            $where[] = "ot.durum = ?";
            $params[] = $filtreler['durum'];
        }

        if (!empty($filtreler['oncelik'])) {
            $where[] = "ot.oncelik = ?";
            $params[] = $filtreler['oncelik'];
        }

        if (!empty($filtreler['cari_id'])) {
            $where[] = "ot.cari_id = ?";
            $params[] = (int)$filtreler['cari_id'];
        }

        if (!empty($filtreler['baslangic_tarihi'])) {
            $where[] = "ot.soz_tarihi >= ?";
            $params[] = $filtreler['baslangic_tarihi'];
        }
        if (!empty($filtreler['bitis_tarihi'])) {
            $where[] = "ot.soz_tarihi <= ?";
            $params[] = $filtreler['bitis_tarihi'];
        }

        if (!empty($filtreler['bugunun_hatirlatmalari'])) {
            $where[] = "ot.hatirlatma_tarihi <= CURDATE()";
            $where[] = "ot.durum = 'bekliyor'";
        }

        if (!empty($filtreler['sadece_gecmis'])) {
            $where[] = "ot.soz_tarihi < CURDATE()";
            $where[] = "ot.durum = 'bekliyor'";
        }

        $where_sql = implode(" AND ", $where);

        $siralamalar = [
            'soz_tarihi_asc'  => 'ot.soz_tarihi ASC',
            'soz_tarihi_desc' => 'ot.soz_tarihi DESC',
            'oncelik_desc'    => "FIELD(ot.oncelik,'kritik','yuksek','normal','dusuk')",
            'tutar_asc'       => 'ot.tutar ASC',
            'tutar_desc'      => 'ot.tutar DESC',
            'olusturma_desc'  => 'ot.olusturma_tarihi DESC',
        ];
        $secilen  = $filtreler['siralama'] ?? 'oncelik_desc';
        $siralama = $siralamalar[$secilen] ?? "FIELD(ot.oncelik,'kritik','yuksek','normal','dusuk')";

        $sayfa  = max(1, (int)($filtreler['sayfa'] ?? 1));
        $adet   = min(100, max(1, (int)($filtreler['adet'] ?? 50)));
        $offset = ($sayfa - 1) * $adet;

        // Arama terimi varsa PHP tarafında çözerek filtrele
        $arama = !empty($filtreler['arama']) ? mb_strtolower($filtreler['arama']) : null;

        if ($arama !== null) {
            $sql  = "SELECT ot.*,
                         ck.cari_adi_sifreli as ck_cari_adi_sifreli,
                         k.ad_soyad as ekleyen_adi,
                         kt.ad_soyad as tamamlayan_adi
                     FROM odeme_takip ot
                     LEFT JOIN cari_kartlar ck ON ot.cari_id = ck.id
                     LEFT JOIN kullanicilar k ON ot.ekleyen_id = k.id
                     LEFT JOIN kullanicilar kt ON ot.tamamlayan_id = kt.id
                     WHERE $where_sql ORDER BY $siralama";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $tumKayitlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $filtrelenmis = [];
            foreach ($tumKayitlar as $satir) {
                $satir = $this->pii_coz($satir);
                if (!empty($satir['ck_cari_adi_sifreli'])) {
                    $satir['cari_adi'] = SistemKripto::coz($satir['ck_cari_adi_sifreli']) ?? null;
                }
                unset($satir['ck_cari_adi_sifreli']);

                $aramaMetni = mb_strtolower(
                    ($satir['firma_adi']   ?? '') . ' ' .
                    ($satir['ilgili_kisi'] ?? '') . ' ' .
                    ($satir['telefon']     ?? '')
                );
                if (strpos($aramaMetni, $arama) !== false) {
                    $filtrelenmis[] = $satir;
                }
            }

            $toplam  = count($filtrelenmis);
            $offset  = ($sayfa - 1) * $adet;
            $kayitlar = array_slice($filtrelenmis, $offset, $adet);

            return [
                'kayitlar'     => array_values($kayitlar),
                'toplam'       => $toplam,
                'sayfa'        => $sayfa,
                'adet'         => $adet,
                'toplam_sayfa' => (int)ceil($toplam / $adet),
            ];
        }

        $sayac_stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM odeme_takip ot WHERE $where_sql"
        );
        $sayac_stmt->execute($params);
        $toplam = (int)$sayac_stmt->fetchColumn();

        $sql  = "SELECT ot.*,
                     ck.cari_adi_sifreli as ck_cari_adi_sifreli,
                     k.ad_soyad as ekleyen_adi,
                     kt.ad_soyad as tamamlayan_adi
                 FROM odeme_takip ot
                 LEFT JOIN cari_kartlar ck ON ot.cari_id = ck.id
                 LEFT JOIN kullanicilar k ON ot.ekleyen_id = k.id
                 LEFT JOIN kullanicilar kt ON ot.tamamlayan_id = kt.id
                 WHERE $where_sql ORDER BY $siralama
                 LIMIT " . (int)$adet . " OFFSET " . (int)$offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $kayitlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($kayitlar as &$satir) {
            $satir = $this->pii_coz($satir);
            if (!empty($satir['ck_cari_adi_sifreli'])) {
                $satir['cari_adi'] = SistemKripto::coz($satir['ck_cari_adi_sifreli']) ?? null;
            }
            unset($satir['ck_cari_adi_sifreli']);
        }

        return [
            'kayitlar'     => $kayitlar,
            'toplam'       => $toplam,
            'sayfa'        => $sayfa,
            'adet'         => $adet,
            'toplam_sayfa' => (int)ceil($toplam / $adet),
        ];
    }

    // Tek kayıt detayı
    public function getir($sirket_id, $kayit_id) {
        $sql  = "SELECT ot.*,
                     ck.cari_adi_sifreli as ck_cari_adi_sifreli,
                     k.ad_soyad as ekleyen_adi,
                     kt.ad_soyad as tamamlayan_adi
                 FROM odeme_takip ot
                 LEFT JOIN cari_kartlar ck ON ot.cari_id = ck.id
                 LEFT JOIN kullanicilar k ON ot.ekleyen_id = k.id
                 LEFT JOIN kullanicilar kt ON ot.tamamlayan_id = kt.id
                 WHERE ot.id = ? AND ot.sirket_id = ? AND ot.silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$kayit_id, $sirket_id]);
        $row  = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return false;

        $row = $this->pii_coz($row);
        if (!empty($row['ck_cari_adi_sifreli'])) {
            $row['cari_adi'] = SistemKripto::coz($row['ck_cari_adi_sifreli']) ?? null;
        }
        unset($row['ck_cari_adi_sifreli']);

        return $row;
    }

    // Yeni kayıt oluştur
    public function olustur($sirket_id, $veri, $ekleyen_id) {
        $sql = "INSERT INTO odeme_takip
                (sirket_id, cari_id,
                 firma_adi_sifreli, ilgili_kisi_sifreli, telefon_sifreli,
                 tutar, doviz_kodu, yon, soz_tarihi, durum, oncelik,
                 gorusme_notu_sifreli, hatirlatma_tarihi, ekleyen_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $sirket_id,
            isset($veri['cari_id']) ? (int)$veri['cari_id'] : null,
            SistemKripto::sifrele($veri['firma_adi']),
            SistemKripto::sifrele($veri['ilgili_kisi']  ?? null),
            SistemKripto::sifrele($veri['telefon']      ?? null),
            isset($veri['tutar'])      ? (float)$veri['tutar'] : 0,
            isset($veri['doviz_kodu']) ? strtoupper($veri['doviz_kodu']) : 'TRY',
            $veri['yon'],
            $veri['soz_tarihi'],
            $veri['durum']              ?? 'bekliyor',
            $veri['oncelik']            ?? 'normal',
            SistemKripto::sifrele($veri['gorusme_notu'] ?? null),
            $veri['hatirlatma_tarihi']  ?? null,
            $ekleyen_id,
        ]);

        $yeni_id = $this->db->lastInsertId();
        return $this->getir($sirket_id, $yeni_id);
    }

    // Kayıt güncelle (sadece gönderilen alanlar)
    public function guncelle($sirket_id, $kayit_id, $veri) {
        $mevcut = $this->getir($sirket_id, $kayit_id);
        if (!$mevcut) {
            return false;
        }

        $duz_alanlar = ['cari_id', 'tutar', 'doviz_kodu', 'yon', 'soz_tarihi', 'durum', 'oncelik', 'hatirlatma_tarihi'];
        $pii_alanlar = ['firma_adi', 'ilgili_kisi', 'telefon', 'gorusme_notu'];

        $setler  = [];
        $params  = [];

        foreach ($duz_alanlar as $alan) {
            if (array_key_exists($alan, $veri)) {
                $setler[] = "$alan = ?";
                $params[] = $veri[$alan];
            }
        }

        foreach ($pii_alanlar as $alan) {
            if (array_key_exists($alan, $veri)) {
                $setler[] = "{$alan}_sifreli = ?";
                $params[] = SistemKripto::sifrele($veri[$alan]);
            }
        }

        if (empty($setler)) {
            return false;
        }

        $params[] = $kayit_id;
        $params[] = $sirket_id;

        $sql  = "UPDATE odeme_takip SET " . implode(', ', $setler) .
                " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getir($sirket_id, $kayit_id);
    }

    // Tamamlandı olarak işaretle
    public function tamamla($sirket_id, $kayit_id, $tamamlayan_id, $gorusme_notu = null) {
        $mevcut = $this->getir($sirket_id, $kayit_id);
        if (!$mevcut) {
            return false;
        }

        $sql = "UPDATE odeme_takip
                SET durum = 'tamamlandi',
                    tamamlayan_id = ?,
                    tamamlanma_tarihi = NOW()"
             . ($gorusme_notu !== null ? ", gorusme_notu_sifreli = ?" : "")
             . " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";

        $params = [$tamamlayan_id];
        if ($gorusme_notu !== null) {
            $params[] = SistemKripto::sifrele($gorusme_notu);
        }
        $params[] = $kayit_id;
        $params[] = $sirket_id;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            return false;
        }

        return $this->getir($sirket_id, $kayit_id);
    }

    // Kayıt sil — SOFT DELETE (silindi_mi = 1)
    public function sil($sirket_id, $kayit_id) {
        $mevcut = $this->getir($sirket_id, $kayit_id);
        if (!$mevcut) {
            return false;
        }

        $sql  = "UPDATE odeme_takip
                 SET silindi_mi = 1, silinme_tarihi = NOW()
                 WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$kayit_id, $sirket_id]);

        return $stmt->rowCount() > 0;
    }

    // Dashboard özet istatistikleri
    public function ozet_istatistikler($sirket_id) {
        $sql = "SELECT
                    COUNT(CASE WHEN yon = 'tahsilat' AND durum = 'bekliyor' THEN 1 END) as bekleyen_tahsilat_adet,
                    COALESCE(SUM(CASE WHEN yon = 'tahsilat' AND durum = 'bekliyor' THEN tutar ELSE 0 END), 0) as bekleyen_tahsilat_tutar,

                    COUNT(CASE WHEN yon = 'odeme' AND durum = 'bekliyor' THEN 1 END) as bekleyen_odeme_adet,
                    COALESCE(SUM(CASE WHEN yon = 'odeme' AND durum = 'bekliyor' THEN tutar ELSE 0 END), 0) as bekleyen_odeme_tutar,

                    COUNT(CASE WHEN durum = 'bekliyor' AND soz_tarihi < CURDATE() THEN 1 END) as vadesi_gecmis_adet,
                    COALESCE(SUM(CASE WHEN durum = 'bekliyor' AND soz_tarihi < CURDATE() THEN tutar ELSE 0 END), 0) as vadesi_gecmis_tutar,

                    COUNT(CASE WHEN durum = 'bekliyor' AND hatirlatma_tarihi <= CURDATE() THEN 1 END) as bugun_hatirlatma_adet,
                    COUNT(CASE WHEN durum = 'bekliyor' AND oncelik = 'kritik' THEN 1 END) as kritik_adet,

                    COUNT(CASE WHEN durum = 'tamamlandi'
                        AND MONTH(tamamlanma_tarihi) = MONTH(NOW())
                        AND YEAR(tamamlanma_tarihi) = YEAR(NOW()) THEN 1 END) as bu_ay_tamamlanan_adet

                FROM odeme_takip
                WHERE sirket_id = ? AND silindi_mi = 0";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
