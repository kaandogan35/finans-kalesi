<?php
// =============================================================
// CariHareket.php — Cari Hareket Veritabanı İşlemleri (Model)
// Finans Kalesi SaaS — Aşama 1.9 (Global PII Şifreleme + Soft Delete)
//
// Şifrelenen PII alanlar: aciklama
// Plaintext kalan alanlar: tutar, tutar_tl, belge_no
//                          (SQL SUM/filtre/sıralama için gerekli)
//
// KRİTİK KURALLAR:
//   - SELECT sorgularında HER ZAMAN silindi_mi = 0 şartı
//   - DELETE FROM YASAK — sadece silindi_mi = 1 güncelleme
//   - Her sorguda sirket_id filtresi zorunlu (multi-tenant)
// =============================================================

class CariHareket {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Bir carinin tüm hareketlerini listele
    public function listele($sirket_id, $cari_id, $filtreler = []) {
        $where  = ["ch.sirket_id = ?", "ch.cari_id = ?", "ch.silindi_mi = 0"];
        $params = [$sirket_id, $cari_id];

        if (!empty($filtreler['islem_tipi'])) {
            $where[] = "ch.islem_tipi = ?";
            $params[] = $filtreler['islem_tipi'];
        }

        if (!empty($filtreler['baslangic_tarihi'])) {
            $where[] = "ch.islem_tarihi >= ?";
            $params[] = $filtreler['baslangic_tarihi'];
        }
        if (!empty($filtreler['bitis_tarihi'])) {
            $where[] = "ch.islem_tarihi <= ?";
            $params[] = $filtreler['bitis_tarihi'] . ' 23:59:59';
        }

        if (!empty($filtreler['belge_no'])) {
            $where[] = "ch.belge_no LIKE ?";
            $params[] = '%' . $filtreler['belge_no'] . '%';
        }

        $where_sql = implode(" AND ", $where);

        $sayfa  = max(1, (int)($filtreler['sayfa'] ?? 1));
        $adet   = min(100, max(1, (int)($filtreler['adet'] ?? 50)));
        $offset = ($sayfa - 1) * $adet;

        $sayac_stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM cari_hareketler ch WHERE $where_sql"
        );
        $sayac_stmt->execute($params);
        $toplam = (int)$sayac_stmt->fetchColumn();

        $sql  = "SELECT ch.*, k.ad_soyad as ekleyen_adi
                 FROM cari_hareketler ch
                 LEFT JOIN kullanicilar k ON ch.ekleyen_id = k.id
                 WHERE $where_sql
                 ORDER BY ch.islem_tarihi DESC, ch.id DESC
                 LIMIT " . (int)$adet . " OFFSET " . (int)$offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $hareketler = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($hareketler as &$satir) {
            $satir = $this->pii_coz($satir);
        }

        return [
            'hareketler'   => $hareketler,
            'toplam'       => $toplam,
            'sayfa'        => $sayfa,
            'adet'         => $adet,
            'toplam_sayfa' => (int)ceil($toplam / $adet),
        ];
    }

    // Tek hareket detayı
    public function getir($sirket_id, $hareket_id) {
        $sql  = "SELECT ch.*, k.ad_soyad as ekleyen_adi
                 FROM cari_hareketler ch
                 LEFT JOIN kullanicilar k ON ch.ekleyen_id = k.id
                 WHERE ch.id = ? AND ch.sirket_id = ? AND ch.silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$hareket_id, $sirket_id]);
        $row  = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->pii_coz($row) : false;
    }

    // Yeni hareket ekle
    public function ekle($sirket_id, $cari_id, $veri, $ekleyen_id) {
        $tutar      = (float)$veri['tutar'];
        $doviz_kodu = $veri['doviz_kodu'] ?? 'TRY';
        $kur        = (float)($veri['kur'] ?? 1.0);
        $tutar_tl   = ($doviz_kodu === 'TRY') ? $tutar : $tutar * $kur;

        $sql = "INSERT INTO cari_hareketler
                (sirket_id, cari_id, islem_tipi, tutar, doviz_kodu, kur, tutar_tl,
                 aciklama_sifreli, belge_no, vade_tarihi, islem_tarihi, ekleyen_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $sirket_id,
            $cari_id,
            $veri['islem_tipi'],
            $tutar,
            $doviz_kodu,
            $kur,
            $tutar_tl,
            SistemKripto::sifrele($veri['aciklama'] ?? null),
            $veri['belge_no']      ?? null,
            $veri['vade_tarihi']   ?? null,
            $veri['islem_tarihi']  ?? date('Y-m-d H:i:s'),
            $ekleyen_id,
        ]);

        return $this->db->lastInsertId();
    }

    // Hareket güncelle
    public function guncelle($sirket_id, $hareket_id, $veri) {
        $mevcut = $this->getir($sirket_id, $hareket_id);
        if (!$mevcut) {
            return false;
        }

        // Plaintext güncellenebilir alanlar
        $duz_alanlar = ['islem_tipi', 'tutar', 'doviz_kodu', 'kur', 'belge_no', 'vade_tarihi', 'islem_tarihi'];
        $setler  = [];
        $params  = [];

        foreach ($duz_alanlar as $alan) {
            if (array_key_exists($alan, $veri)) {
                $setler[] = "$alan = ?";
                $params[] = $veri[$alan];
            }
        }

        // PII alan: aciklama → şifreli sütuna yaz
        if (array_key_exists('aciklama', $veri)) {
            $setler[] = "aciklama_sifreli = ?";
            $params[] = SistemKripto::sifrele($veri['aciklama']);
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

        $params[] = $hareket_id;
        $params[] = $sirket_id;

        $sql  = "UPDATE cari_hareketler SET " . implode(', ', $setler) .
                " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $mevcut['cari_id'];
    }

    // Hareket sil — SOFT DELETE (silindi_mi = 1)
    public function sil($sirket_id, $hareket_id) {
        $mevcut = $this->getir($sirket_id, $hareket_id);
        if (!$mevcut) {
            return false;
        }

        $sql  = "UPDATE cari_hareketler
                 SET silindi_mi = 1, silinme_tarihi = NOW()
                 WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$hareket_id, $sirket_id]);

        if ($stmt->rowCount() > 0) {
            return $mevcut['cari_id'];
        }
        return false;
    }

    // ─── Yardımcı: PII alanları çöz ───
    private function pii_coz(array $row): array {
        if (!empty($row['aciklama_sifreli'])) {
            $cozulmus = SistemKripto::coz($row['aciklama_sifreli']);
            if ($cozulmus !== null) {
                $row['aciklama'] = $cozulmus;
            }
        }
        unset($row['aciklama_sifreli']);
        return $row;
    }
}
