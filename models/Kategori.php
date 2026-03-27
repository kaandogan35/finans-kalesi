<?php
// =============================================================
// Kategori.php — Gelir/Gider Kategorileri Model
// Finans Kalesi SaaS
//
// Varsayılan kategoriler (sirket_id = NULL) + şirkete özel
// =============================================================

class Kategori {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ─── LİSTELE — Varsayılan + şirkete özel birleştirilir ───
    public function listele($sirket_id, $islem_tipi = null) {
        $kosullar = ['k.silindi_mi = 0', 'k.aktif_mi = 1', '(k.sirket_id IS NULL OR k.sirket_id = ?)'];
        $params = [$sirket_id];

        if ($islem_tipi) {
            $kosullar[] = 'k.islem_tipi = ?';
            $params[] = $islem_tipi;
        }

        $where = implode(' AND ', $kosullar);
        $sql = "SELECT k.* FROM kategoriler k WHERE {$where} ORDER BY k.islem_tipi, k.sira ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ─── EKLE — Sadece şirkete özel kategori ───
    public function ekle($sirket_id, $veri) {
        $sql = "INSERT INTO kategoriler (sirket_id, islem_tipi, ad, ikon, sira)
                VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);

        // Sıra: mevcut en büyük sıra + 1
        $sira_sql = "SELECT COALESCE(MAX(sira), 0) + 1 as sonraki
                     FROM kategoriler
                     WHERE (sirket_id IS NULL OR sirket_id = ?) AND islem_tipi = ? AND silindi_mi = 0";
        $sira_stmt = $this->db->prepare($sira_sql);
        $sira_stmt->execute([$sirket_id, $veri['islem_tipi']]);
        $sonraki_sira = (int)$sira_stmt->fetch(PDO::FETCH_ASSOC)['sonraki'];

        $stmt->execute([
            $sirket_id,
            $veri['islem_tipi'],
            $veri['ad'],
            isset($veri['ikon']) ? $veri['ikon'] : 'bi-tag',
            $sonraki_sira,
        ]);

        return (int)$this->db->lastInsertId();
    }

    // ─── GÜNCELLE — Sadece şirkete özel ───
    public function guncelle($sirket_id, $id, $veri) {
        // Varsayılan kategoriler (sirket_id = NULL) değiştirilemez
        $sql = "SELECT * FROM kategoriler WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id, $sirket_id]);
        $mevcut = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$mevcut) {
            return false;
        }

        $alanlar = [];
        $params = [];

        if (isset($veri['ad'])) {
            $alanlar[] = 'ad = ?';
            $params[] = $veri['ad'];
        }
        if (isset($veri['ikon'])) {
            $alanlar[] = 'ikon = ?';
            $params[] = $veri['ikon'];
        }
        if (isset($veri['sira'])) {
            $alanlar[] = 'sira = ?';
            $params[] = (int)$veri['sira'];
        }

        if (empty($alanlar)) return true;

        $params[] = $id;
        $params[] = $sirket_id;

        $sql = "UPDATE kategoriler SET " . implode(', ', $alanlar) .
               " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount() > 0;
    }

    // ─── SİL — Sadece şirkete özel, soft delete ───
    public function sil($sirket_id, $id) {
        $sql = "UPDATE kategoriler SET silindi_mi = 1
                WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id, $sirket_id]);
        return $stmt->rowCount() > 0;
    }
}
