<?php
// =============================================================
// Veresiye.php — Veresiye Defteri Veritabanı İşlemleri (Model)
// ParamGo SaaS
//
// Şifrelenen PII alanlar: aciklama (veresiye notları)
// Plaintext kalan alanlar: tutar, tarih, tur
//                          (SQL SUM/filtre için gerekli)
//
// KRİTİK KURALLAR:
//   - SELECT sorgularında HER ZAMAN silindi_mi = 0 şartı
//   - DELETE FROM YASAK — sadece silindi_mi = 1 güncelleme
//   - Her sorguda sirket_id filtresi zorunlu (multi-tenant)
//
// CARİ ENTEGRASYON:
//   - islem_ekle → cari_hareketler'e otomatik kayıt + bakiye_guncelle
//   - islem_sil  → cari_hareketler kaydını sil  + bakiye_guncelle
//   - Bağlantı anahtarı: cari_hareketler.belge_no = 'VRY-{veresiye_id}'
// =============================================================

class Veresiye {
    private $db;
    private $cariKart;
    private $cariHareket;

    public function __construct($db) {
        $this->db          = $db;
        $this->cariKart    = new CariKart($db);
        $this->cariHareket = new CariHareket($db);
    }

    // ─── Tüm cariler için veresiye bakiyesi listesi ───
    // List page için: cari adları + bakiyeler
    public function cari_listesi($sirket_id, $filtreler = []) {
        $sql = "SELECT
                    ck.id AS cari_id,
                    ck.cari_adi_sifreli,
                    ck.cari_turu,
                    COALESCE(SUM(CASE WHEN vi.tur = 'satis'  AND vi.silindi_mi = 0 THEN vi.tutar ELSE 0 END), 0) AS toplam_satis,
                    COALESCE(SUM(CASE WHEN vi.tur = 'odeme'  AND vi.silindi_mi = 0 THEN vi.tutar ELSE 0 END), 0) AS toplam_odeme,
                    COALESCE(SUM(CASE WHEN vi.tur = 'satis'  AND vi.silindi_mi = 0 THEN vi.tutar ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN vi.tur = 'odeme'  AND vi.silindi_mi = 0 THEN vi.tutar ELSE 0 END), 0) AS bakiye,
                    MAX(CASE WHEN vi.silindi_mi = 0 THEN vi.tarih END) AS son_islem_tarihi,
                    COUNT(CASE WHEN vi.silindi_mi = 0 THEN 1 END) AS islem_sayisi
                FROM cari_kartlar ck
                LEFT JOIN veresiye_islemler vi
                    ON ck.id = vi.cari_id AND vi.sirket_id = ck.sirket_id
                WHERE ck.sirket_id = ? AND ck.silindi_mi = 0 AND ck.aktif_mi = 1
                GROUP BY ck.id, ck.cari_adi_sifreli, ck.cari_turu";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $cariler = [];
        $arama           = isset($filtreler['arama']) ? mb_strtolower(trim($filtreler['arama'])) : null;
        $sadece_borclular = !empty($filtreler['sadece_borclular']);

        foreach ($rows as $row) {
            $cari_adi = SistemKripto::coz($row['cari_adi_sifreli'] ?? '') ?? '';
            if ($arama !== null && $arama !== '' && mb_stripos($cari_adi, $arama) === false) continue;
            if ($sadece_borclular && (float)$row['bakiye'] <= 0) continue;

            $cariler[] = [
                'cari_id'          => (int)$row['cari_id'],
                'cari_adi'         => $cari_adi,
                'cari_turu'        => $row['cari_turu'],
                'toplam_satis'     => (float)$row['toplam_satis'],
                'toplam_odeme'     => (float)$row['toplam_odeme'],
                'bakiye'           => (float)$row['bakiye'],
                'son_islem_tarihi' => $row['son_islem_tarihi'],
                'islem_sayisi'     => (int)$row['islem_sayisi'],
            ];
        }

        // Bakiyeye göre azalan sıralama
        usort($cariler, function($a, $b) {
            return $b['bakiye'] <=> $a['bakiye'];
        });

        return $cariler;
    }

    // ─── Tüm şirket için genel özet (list page KPI) ───
    public function genel_ozet($sirket_id) {
        $sql = "SELECT
                    COALESCE(SUM(CASE WHEN tur = 'satis' THEN tutar ELSE 0 END), 0) AS toplam_satis,
                    COALESCE(SUM(CASE WHEN tur = 'odeme' THEN tutar ELSE 0 END), 0) AS toplam_odeme,
                    COUNT(DISTINCT cari_id) AS toplam_musteri,
                    COALESCE(SUM(CASE WHEN DATE(tarih) = CURDATE() AND tur = 'satis' THEN tutar ELSE 0 END), 0) AS bugun_satis,
                    COUNT(CASE WHEN DATE(tarih) = CURDATE() AND tur = 'satis' THEN 1 END) AS bugun_islem_sayisi
                FROM veresiye_islemler
                WHERE sirket_id = ? AND silindi_mi = 0";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // Borçlu müşteri sayısı (bakiye > 0 olanlar)
        $sql2 = "SELECT COUNT(*) AS borclu_sayisi FROM (
                    SELECT cari_id,
                        SUM(CASE WHEN tur='satis' THEN tutar ELSE 0 END) -
                        SUM(CASE WHEN tur='odeme' THEN tutar ELSE 0 END) AS bakiye
                    FROM veresiye_islemler
                    WHERE sirket_id = ? AND silindi_mi = 0
                    GROUP BY cari_id
                    HAVING bakiye > 0
                 ) t";
        $stmt2 = $this->db->prepare($sql2);
        $stmt2->execute([$sirket_id]);
        $row2 = $stmt2->fetch(PDO::FETCH_ASSOC);

        $toplam_satis = (float)$row['toplam_satis'];
        $toplam_odeme = (float)$row['toplam_odeme'];

        return [
            'toplam_acik_bakiye' => $toplam_satis - $toplam_odeme,
            'toplam_musteri'     => (int)$row['toplam_musteri'],
            'borclu_musteri'     => (int)$row2['borclu_sayisi'],
            'bugun_satis'        => (float)$row['bugun_satis'],
            'bugun_islem_sayisi' => (int)$row['bugun_islem_sayisi'],
        ];
    }

    // ─── Tek cari için bilgi + özet ───
    public function cari_bilgi($sirket_id, $cari_id) {
        $stmt = $this->db->prepare(
            "SELECT id, cari_adi_sifreli, cari_turu
             FROM cari_kartlar
             WHERE id = ? AND sirket_id = ? AND silindi_mi = 0"
        );
        $stmt->execute([$cari_id, $sirket_id]);
        $cari = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$cari) return false;

        $ozet = $this->cari_ozet($sirket_id, $cari_id);

        return [
            'cari_id'   => (int)$cari['id'],
            'cari_adi'  => SistemKripto::coz($cari['cari_adi_sifreli'] ?? '') ?? '',
            'cari_turu' => $cari['cari_turu'],
            'ozet'      => $ozet,
        ];
    }

    // ─── Bir carinin veresiye işlem geçmişi (kümülatif bakiyeli) ───
    public function islemler($sirket_id, $cari_id) {
        $sql = "SELECT vi.*, k.ad_soyad AS olusturan_adi
                FROM veresiye_islemler vi
                LEFT JOIN kullanicilar k ON vi.olusturan_id = k.id
                WHERE vi.sirket_id = ? AND vi.cari_id = ? AND vi.silindi_mi = 0
                ORDER BY vi.tarih ASC, vi.id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id, $cari_id]);
        $islemler = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Kümülatif bakiye hesapla (eskiden yeniye)
        $kumulatif = 0;
        foreach ($islemler as &$islem) {
            $islem = $this->pii_coz($islem);
            $tutar = (float)$islem['tutar'];
            if ($islem['tur'] === 'satis') {
                $kumulatif += $tutar;
            } else {
                $kumulatif -= $tutar;
            }
            $islem['kumulatif_bakiye'] = round($kumulatif, 2);
        }
        unset($islem);

        // Görüntüleme için ters çevir (yeniden eskiye)
        return array_reverse($islemler);
    }

    // ─── Bir carinin veresiye özeti ───
    public function cari_ozet($sirket_id, $cari_id) {
        $sql = "SELECT
                    COALESCE(SUM(CASE WHEN tur = 'satis' THEN tutar ELSE 0 END), 0) AS toplam_satis,
                    COALESCE(SUM(CASE WHEN tur = 'odeme' THEN tutar ELSE 0 END), 0) AS toplam_odeme,
                    COUNT(*) AS toplam_islem
                FROM veresiye_islemler
                WHERE sirket_id = ? AND cari_id = ? AND silindi_mi = 0";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id, $cari_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $toplam_satis = (float)$row['toplam_satis'];
        $toplam_odeme = (float)$row['toplam_odeme'];

        return [
            'toplam_satis'  => $toplam_satis,
            'toplam_odeme'  => $toplam_odeme,
            'bakiye'        => round($toplam_satis - $toplam_odeme, 2),
            'toplam_islem'  => (int)$row['toplam_islem'],
        ];
    }

    // ─── Yeni işlem ekle ───
    // Veresiye kaydı + cari_hareketler entegrasyonu (bakiye otomatik güncellenir)
    public function islem_ekle($sirket_id, $cari_id, $veri, $olusturan_id) {
        $tarih = $veri['tarih'] ?? date('Y-m-d');
        $tutar = (float)$veri['tutar'];

        // 1. Veresiye kaydı oluştur
        $sql = "INSERT INTO veresiye_islemler
                    (sirket_id, cari_id, tur, tutar, aciklama_sifreli, tarih, olusturan_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $sirket_id,
            $cari_id,
            $veri['tur'],
            $tutar,
            SistemKripto::sifrele($veri['aciklama'] ?? null),
            $tarih,
            $olusturan_id,
        ]);
        $veresiye_id = (int)$this->db->lastInsertId();

        // 2. Cari hareketlere otomatik kayıt ekle
        // satis → borclandirma (müşteri borçlanır)
        // odeme → tahsilat (müşteri ödedi)
        $islem_tipi = ($veri['tur'] === 'satis') ? 'borclandirma' : 'tahsilat';
        $aciklama   = trim(($veri['aciklama'] ?? ''));
        $on_ek      = ($veri['tur'] === 'satis') ? 'Veresiye Satış' : 'Veresiye Ödeme';
        $hareket_aciklama = $aciklama ? $on_ek . ': ' . $aciklama : $on_ek;

        $this->cariHareket->ekle($sirket_id, $cari_id, [
            'islem_tipi'   => $islem_tipi,
            'tutar'        => $tutar,
            'doviz_kodu'   => 'TRY',
            'kur'          => 1.0,
            'aciklama'     => $hareket_aciklama,
            'belge_no'     => 'VRY-' . $veresiye_id,
            'islem_tarihi' => $tarih . ' 00:00:00',
        ], $olusturan_id);

        // 3. Cari bakiyeyi güncelle
        $this->cariKart->bakiye_guncelle($sirket_id, $cari_id);

        return $veresiye_id;
    }

    // ─── İşlem sil — SOFT DELETE ───
    // Veresiye kaydı + bağlı cari_hareketler kaydı silinir, bakiye güncellenir
    public function islem_sil($sirket_id, $islem_id) {
        // 1. Veresiye kaydını bul (cari_id lazım)
        $kontrol = $this->db->prepare(
            "SELECT cari_id FROM veresiye_islemler
             WHERE id = ? AND sirket_id = ? AND silindi_mi = 0"
        );
        $kontrol->execute([$islem_id, $sirket_id]);
        $kayit = $kontrol->fetch(PDO::FETCH_ASSOC);

        if (!$kayit) return false;

        $cari_id = (int)$kayit['cari_id'];

        // 2. Veresiye kaydını soft-delete et
        $sql = "UPDATE veresiye_islemler
                SET silindi_mi = 1, silinme_tarihi = NOW()
                WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$islem_id, $sirket_id]);

        if ($stmt->rowCount() === 0) return false;

        // 3. Bağlı cari hareket kaydını soft-delete et (belge_no = 'VRY-{id}')
        $hareket_sil = $this->db->prepare(
            "UPDATE cari_hareketler
             SET silindi_mi = 1, silinme_tarihi = NOW()
             WHERE belge_no = ? AND sirket_id = ? AND silindi_mi = 0"
        );
        $hareket_sil->execute(['VRY-' . $islem_id, $sirket_id]);

        // 4. Cari bakiyeyi güncelle
        $this->cariKart->bakiye_guncelle($sirket_id, $cari_id);

        return true;
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
