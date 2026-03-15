<?php
// =============================================================
// CekSenet.php — Çek/Senet Veritabanı İşlemleri (Model)
// Finans Kalesi SaaS — Aşama 1.9 (Global PII Şifreleme + Soft Delete)
//
// Şifrelenen PII alanlar: banka_adi, sube, hesap_no, aciklama
// Plaintext kalan alanlar: seri_no (benzersizlik kontrolü için),
//                          tutar, tutar_tl, doviz_kodu, kur
//
// KRİTİK KURALLAR:
//   - SELECT sorgularında HER ZAMAN silindi_mi = 0 şartı
//   - DELETE FROM YASAK — sadece silindi_mi = 1 güncelleme
//   - Her sorguda sirket_id filtresi zorunlu (multi-tenant)
// =============================================================

class CekSenet {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ─── Yardımcı: PII alanları çöz ───
    private function pii_coz(array $row): array {
        $pii = [
            'banka_adi' => 'banka_adi_sifreli',
            'sube'      => 'sube_sifreli',
            'hesap_no'  => 'hesap_no_sifreli',
            'aciklama'  => 'aciklama_sifreli',
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

    // Tüm çek/senetleri listele (sayfalama + filtre)
    public function listele($sirket_id, $filtreler = []) {
        $where  = ["cs.sirket_id = ?", "cs.silindi_mi = 0"];
        $params = [$sirket_id];

        if (!empty($filtreler['tur'])) {
            $where[] = "cs.tur = ?";
            $params[] = $filtreler['tur'];
        }

        if (!empty($filtreler['durum'])) {
            $where[] = "cs.durum = ?";
            $params[] = $filtreler['durum'];
        }

        if (!empty($filtreler['cari_id'])) {
            $where[] = "cs.cari_id = ?";
            $params[] = (int)$filtreler['cari_id'];
        }

        // Seri no araması (plaintext, SQL'de çalışır)
        if (!empty($filtreler['arama'])) {
            $where[] = "cs.seri_no LIKE ?";
            $params[] = '%' . $filtreler['arama'] . '%';
        }

        if (!empty($filtreler['vade_baslangic'])) {
            $where[] = "cs.vade_tarihi >= ?";
            $params[] = $filtreler['vade_baslangic'];
        }
        if (!empty($filtreler['vade_bitis'])) {
            $where[] = "cs.vade_tarihi <= ?";
            $params[] = $filtreler['vade_bitis'];
        }

        if (!empty($filtreler['sadece_vadesi_gecmis'])) {
            $where[] = "cs.vade_tarihi < CURDATE()";
            $where[] = "cs.durum IN ('portfoyde', 'tahsile_verildi')";
        }

        $where_sql = implode(" AND ", $where);

        $siralamalar = [
            'vade_asc'       => 'cs.vade_tarihi ASC',
            'vade_desc'      => 'cs.vade_tarihi DESC',
            'tutar_asc'      => 'cs.tutar_tl ASC',
            'tutar_desc'     => 'cs.tutar_tl DESC',
            'olusturma_desc' => 'cs.olusturma_tarihi DESC',
        ];
        $secilen  = $filtreler['siralama'] ?? 'vade_asc';
        $siralama = $siralamalar[$secilen] ?? 'cs.vade_tarihi ASC';

        $sayfa  = max(1, (int)($filtreler['sayfa'] ?? 1));
        $adet   = min(100, max(1, (int)($filtreler['adet'] ?? 50)));
        $offset = ($sayfa - 1) * $adet;

        $sayac_stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM cek_senetler cs WHERE $where_sql"
        );
        $sayac_stmt->execute($params);
        $toplam = (int)$sayac_stmt->fetchColumn();

        $sql  = "SELECT cs.*,
                     ck.cari_adi_sifreli as ck_cari_adi_sifreli,
                     k.ad_soyad as ekleyen_adi,
                     cc.cari_adi_sifreli as cc_cari_adi_sifreli
                 FROM cek_senetler cs
                 LEFT JOIN cari_kartlar ck ON cs.cari_id = ck.id
                 LEFT JOIN kullanicilar k ON cs.ekleyen_id = k.id
                 LEFT JOIN cari_kartlar cc ON cs.ciro_edilen_cari_id = cc.id
                 WHERE $where_sql
                 ORDER BY $siralama
                 LIMIT " . (int)$adet . " OFFSET " . (int)$offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $cek_senetler = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($cek_senetler as &$satir) {
            $satir = $this->pii_coz($satir);
            // JOIN'den gelen cari adlarını da çöz
            if (!empty($satir['ck_cari_adi_sifreli'])) {
                $satir['cari_adi'] = SistemKripto::coz($satir['ck_cari_adi_sifreli']) ?? null;
            }
            if (!empty($satir['cc_cari_adi_sifreli'])) {
                $satir['ciro_edilen_cari_adi'] = SistemKripto::coz($satir['cc_cari_adi_sifreli']) ?? null;
            }
            unset($satir['ck_cari_adi_sifreli'], $satir['cc_cari_adi_sifreli']);
        }

        return [
            'cek_senetler' => $cek_senetler,
            'toplam'       => $toplam,
            'sayfa'        => $sayfa,
            'adet'         => $adet,
            'toplam_sayfa' => (int)ceil($toplam / $adet),
        ];
    }

    // Tek çek/senet detayı
    public function getir($sirket_id, $cek_id) {
        $sql  = "SELECT cs.*,
                     ck.cari_adi_sifreli as ck_cari_adi_sifreli,
                     k.ad_soyad as ekleyen_adi,
                     cc.cari_adi_sifreli as cc_cari_adi_sifreli
                 FROM cek_senetler cs
                 LEFT JOIN cari_kartlar ck ON cs.cari_id = ck.id
                 LEFT JOIN kullanicilar k ON cs.ekleyen_id = k.id
                 LEFT JOIN cari_kartlar cc ON cs.ciro_edilen_cari_id = cc.id
                 WHERE cs.id = ? AND cs.sirket_id = ? AND cs.silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$cek_id, $sirket_id]);
        $row  = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return false;

        $row = $this->pii_coz($row);
        if (!empty($row['ck_cari_adi_sifreli'])) {
            $row['cari_adi'] = SistemKripto::coz($row['ck_cari_adi_sifreli']) ?? null;
        }
        if (!empty($row['cc_cari_adi_sifreli'])) {
            $row['ciro_edilen_cari_adi'] = SistemKripto::coz($row['cc_cari_adi_sifreli']) ?? null;
        }
        unset($row['ck_cari_adi_sifreli'], $row['cc_cari_adi_sifreli']);

        return $row;
    }

    // Yeni çek/senet oluştur
    public function olustur($sirket_id, $veri, $ekleyen_id) {
        $tutar      = (float)$veri['tutar'];
        $doviz_kodu = $veri['doviz_kodu'] ?? 'TRY';
        $kur        = (float)($veri['kur'] ?? 1.0);
        $tutar_tl   = ($doviz_kodu === 'TRY') ? $tutar : $tutar * $kur;

        $sql = "INSERT INTO cek_senetler
                (sirket_id, cari_id, tur, durum, seri_no,
                 banka_adi_sifreli, sube_sifreli, hesap_no_sifreli,
                 kesilme_tarihi, vade_tarihi, tutar, doviz_kodu, kur, tutar_tl,
                 aciklama_sifreli, ekleyen_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $sirket_id,
            isset($veri['cari_id']) ? (int)$veri['cari_id'] : null,
            $veri['tur'],
            $veri['durum']         ?? 'portfoyde',
            $veri['seri_no']       ?? null,
            SistemKripto::sifrele($veri['banka_adi'] ?? null),
            SistemKripto::sifrele($veri['sube']      ?? null),
            SistemKripto::sifrele($veri['hesap_no']  ?? null),
            $veri['kesilme_tarihi'] ?? null,
            $veri['vade_tarihi'],
            $tutar,
            $doviz_kodu,
            $kur,
            $tutar_tl,
            SistemKripto::sifrele($veri['aciklama'] ?? null),
            $ekleyen_id,
        ]);

        $yeni_id = $this->db->lastInsertId();
        return $this->getir($sirket_id, $yeni_id);
    }

    // Çek/senet güncelle (sadece gönderilen alanlar)
    public function guncelle($sirket_id, $cek_id, $veri) {
        $mevcut = $this->getir($sirket_id, $cek_id);
        if (!$mevcut) {
            return false;
        }

        $duz_alanlar = ['cari_id', 'seri_no', 'kesilme_tarihi', 'vade_tarihi', 'tutar', 'doviz_kodu', 'kur'];
        $pii_alanlar = ['banka_adi', 'sube', 'hesap_no', 'aciklama'];

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

        // tutar_tl yeniden hesapla
        $tutar      = $veri['tutar']      ?? $mevcut['tutar'];
        $doviz_kodu = $veri['doviz_kodu'] ?? $mevcut['doviz_kodu'];
        $kur        = $veri['kur']        ?? $mevcut['kur'];
        $tutar_tl   = ($doviz_kodu === 'TRY') ? (float)$tutar : (float)$tutar * (float)$kur;
        $setler[]   = "tutar_tl = ?";
        $params[]   = $tutar_tl;

        if (empty($setler)) {
            return false;
        }

        $params[] = $cek_id;
        $params[] = $sirket_id;

        $sql  = "UPDATE cek_senetler SET " . implode(', ', $setler) .
                " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getir($sirket_id, $cek_id);
    }

    // Durum değiştir
    public function durum_degistir($sirket_id, $cek_id, $yeni_durum, $ekstra = []) {
        $mevcut = $this->getir($sirket_id, $cek_id);
        if (!$mevcut) {
            return false;
        }

        $setler  = ["durum = ?"];
        $params  = [$yeni_durum];

        if ($yeni_durum === 'tahsil_edildi' || $yeni_durum === 'odendi') {
            $setler[] = "tahsil_tarihi = ?";
            $params[] = $ekstra['tahsil_tarihi'] ?? date('Y-m-d');
        }

        if ($yeni_durum === 'cirolandi') {
            $setler[] = "ciro_edilen_cari_id = ?";
            $setler[] = "ciro_tarihi = ?";
            $params[] = isset($ekstra['ciro_edilen_cari_id']) ? (int)$ekstra['ciro_edilen_cari_id'] : null;
            $params[] = $ekstra['ciro_tarihi'] ?? date('Y-m-d');
        }

        $params[] = $cek_id;
        $params[] = $sirket_id;

        $sql  = "UPDATE cek_senetler SET " . implode(', ', $setler) .
                " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            return false;
        }

        return $this->getir($sirket_id, $cek_id);
    }

    // Çek/senet sil — SOFT DELETE (silindi_mi = 1)
    public function sil($sirket_id, $cek_id) {
        $mevcut = $this->getir($sirket_id, $cek_id);
        if (!$mevcut) {
            return false;
        }

        $sql  = "UPDATE cek_senetler
                 SET silindi_mi = 1, silinme_tarihi = NOW()
                 WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$cek_id, $sirket_id]);

        return $stmt->rowCount() > 0;
    }

    // Dashboard özet istatistikleri
    public function ozet_istatistikler($sirket_id) {
        $sql = "SELECT
                    COUNT(*) as toplam_adet,
                    COALESCE(SUM(tutar_tl), 0) as toplam_tutar,

                    COALESCE(SUM(CASE WHEN tur IN ('alacak_ceki','alacak_senedi')
                        AND durum IN ('portfoyde','tahsile_verildi') THEN tutar_tl ELSE 0 END), 0) as aktif_alacak_tutari,
                    COUNT(CASE WHEN tur IN ('alacak_ceki','alacak_senedi')
                        AND durum IN ('portfoyde','tahsile_verildi') THEN 1 END) as aktif_alacak_adet,

                    COALESCE(SUM(CASE WHEN tur IN ('borc_ceki','borc_senedi')
                        AND durum = 'portfoyde' THEN tutar_tl ELSE 0 END), 0) as aktif_borc_tutari,
                    COUNT(CASE WHEN tur IN ('borc_ceki','borc_senedi')
                        AND durum = 'portfoyde' THEN 1 END) as aktif_borc_adet,

                    COUNT(CASE WHEN vade_tarihi < CURDATE()
                        AND durum IN ('portfoyde','tahsile_verildi') THEN 1 END) as vadesi_gecmis_adet,
                    COALESCE(SUM(CASE WHEN vade_tarihi < CURDATE()
                        AND durum IN ('portfoyde','tahsile_verildi') THEN tutar_tl ELSE 0 END), 0) as vadesi_gecmis_tutar,

                    COUNT(CASE WHEN durum IN ('karsiliksiz','protestolu') THEN 1 END) as sorunlu_adet,
                    COALESCE(SUM(CASE WHEN durum IN ('karsiliksiz','protestolu') THEN tutar_tl ELSE 0 END), 0) as sorunlu_tutar,

                    COALESCE(SUM(CASE WHEN durum = 'portfoyde' THEN tutar_tl ELSE 0 END), 0) as portfoyde_tutar,
                    COUNT(CASE WHEN durum = 'portfoyde' THEN 1 END) as portfoyde_adet,
                    COALESCE(SUM(CASE WHEN durum = 'tahsile_verildi' THEN tutar_tl ELSE 0 END), 0) as tahsile_tutar,
                    COALESCE(SUM(CASE WHEN durum IN ('tahsil_edildi','odendi') THEN tutar_tl ELSE 0 END), 0) as odendi_tutar

                FROM cek_senetler
                WHERE sirket_id = ? AND silindi_mi = 0";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Seri no benzersizlik kontrolü
    public function seri_no_var_mi($sirket_id, $seri_no, $haric_id = null) {
        if (empty($seri_no)) {
            return false;
        }

        $sql    = "SELECT id FROM cek_senetler
                   WHERE sirket_id = ? AND seri_no = ? AND silindi_mi = 0";
        $params = [$sirket_id, $seri_no];

        if ($haric_id !== null) {
            $sql    .= " AND id != ?";
            $params[] = (int)$haric_id;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }
}
