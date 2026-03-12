<?php
// =============================================================
// CariKart.php — Cari Kart Veritabanı İşlemleri (Model)
// Finans Kalesi SaaS — Aşama 1.9 (Global PII Şifreleme + Soft Delete)
//
// Şifrelenen PII alanlar: cari_adi, vergi_no, telefon, email,
//                         adres, yetkili_kisi
// Plaintext kalan alanlar: bakiye, toplam_borc, toplam_alacak
//                          (SQL SUM/ORDER BY için gerekli)
//
// KRİTİK KURALLAR:
//   - SELECT sorgularında HER ZAMAN silindi_mi = 0 şartı
//   - DELETE FROM YASAK — sadece silindi_mi = 1 güncelleme
//   - Her sorguda sirket_id filtresi zorunlu (multi-tenant)
// =============================================================

class CariKart {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ─── Yardımcı: Satırdaki PII alanları çöz ───
    private function pii_coz(array $row): array {
        // Şifreli sütun varsa ve doluysa öncelikle onu kullan;
        // yoksa eski plaintext sütun değerini koru (geçiş dönemi uyumluluğu)
        $pii = [
            'cari_adi'     => 'cari_adi_sifreli',
            'vergi_no'     => 'vergi_no_sifreli',
            'telefon'      => 'telefon_sifreli',
            'email'        => 'email_sifreli',
            'adres'        => 'adres_sifreli',
            'yetkili_kisi' => 'yetkili_kisi_sifreli',
        ];

        foreach ($pii as $duz => $sifreli_sutun) {
            if (!empty($row[$sifreli_sutun])) {
                $cozulmus = SistemKripto::coz($row[$sifreli_sutun]);
                if ($cozulmus !== null) {
                    $row[$duz] = $cozulmus;
                }
            }
            // Şifreli sütunu response'tan çıkar (ham veriyi istemciye gönderme)
            unset($row[$sifreli_sutun]);
        }

        return $row;
    }

    // Tüm cari kartları listele (sayfalama + filtre)
    // Arama terimi varsa PHP tarafında şifresi çözülmüş veri üzerinde çalışır
    public function listele($sirket_id, $filtreler = []) {
        $where  = ["ck.sirket_id = ?", "ck.silindi_mi = 0"];
        $params = [$sirket_id];

        if (!empty($filtreler['cari_turu'])) {
            $where[] = "ck.cari_turu = ?";
            $params[] = $filtreler['cari_turu'];
        }

        if (isset($filtreler['aktif_mi']) && $filtreler['aktif_mi'] !== null) {
            $where[] = "ck.aktif_mi = ?";
            $params[] = (int)$filtreler['aktif_mi'];
        } else {
            $where[] = "ck.aktif_mi = 1";
        }

        if (!empty($filtreler['sadece_borclular'])) {
            $where[] = "ck.bakiye > 0";
        }

        $where_sql = implode(" AND ", $where);

        // Sıralama — cari_adi artık şifreli, ad_* sıralamalar olusturma_tarihi'ne yönlenir
        $siralamalar = [
            'ad_asc'      => 'ck.olusturma_tarihi ASC',
            'ad_desc'     => 'ck.olusturma_tarihi DESC',
            'bakiye_asc'  => 'ck.bakiye ASC',
            'bakiye_desc' => 'ck.bakiye DESC',
            'son_islem'   => 'ck.son_islem_tarihi DESC',
        ];
        $secilen  = $filtreler['siralama'] ?? 'son_islem';
        $siralama = $siralamalar[$secilen] ?? 'ck.son_islem_tarihi DESC';

        $sayfa  = max(1, (int)($filtreler['sayfa'] ?? 1));
        $adet   = min(100, max(1, (int)($filtreler['adet'] ?? 50)));
        $arama  = !empty($filtreler['arama']) ? mb_strtolower($filtreler['arama']) : null;

        // Arama varsa: tüm kayıtları çek, PHP tarafında filtrele
        if ($arama !== null) {
            $sql  = "SELECT ck.* FROM cari_kartlar ck WHERE $where_sql ORDER BY $siralama";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $tumKayitlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $filtrelenmis = [];
            foreach ($tumKayitlar as $satir) {
                $satir     = $this->pii_coz($satir);
                $aramaMetni = mb_strtolower(
                    ($satir['cari_adi']     ?? '') . ' ' .
                    ($satir['yetkili_kisi'] ?? '') . ' ' .
                    ($satir['telefon']      ?? '') . ' ' .
                    ($satir['vergi_no']     ?? '')
                );
                if (strpos($aramaMetni, $arama) !== false) {
                    $filtrelenmis[] = $satir;
                }
            }

            $toplam        = count($filtrelenmis);
            $offset        = ($sayfa - 1) * $adet;
            $cariler       = array_slice($filtrelenmis, $offset, $adet);

            return [
                'cariler'      => array_values($cariler),
                'toplam'       => $toplam,
                'sayfa'        => $sayfa,
                'adet'         => $adet,
                'toplam_sayfa' => (int)ceil($toplam / $adet),
            ];
        }

        // Arama yok: normal SQL sayfalama
        $offset = ($sayfa - 1) * $adet;

        $sayac_stmt = $this->db->prepare("SELECT COUNT(*) FROM cari_kartlar ck WHERE $where_sql");
        $sayac_stmt->execute($params);
        $toplam = (int)$sayac_stmt->fetchColumn();

        $sql  = "SELECT ck.* FROM cari_kartlar ck
                 WHERE $where_sql ORDER BY $siralama
                 LIMIT " . (int)$adet . " OFFSET " . (int)$offset;
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $cariler = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($cariler as &$satir) {
            $satir = $this->pii_coz($satir);
        }

        return [
            'cariler'      => $cariler,
            'toplam'       => $toplam,
            'sayfa'        => $sayfa,
            'adet'         => $adet,
            'toplam_sayfa' => (int)ceil($toplam / $adet),
        ];
    }

    // Tek cari kart detayı
    public function getir($sirket_id, $cari_id) {
        $sql  = "SELECT * FROM cari_kartlar WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$cari_id, $sirket_id]);
        $row  = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->pii_coz($row) : false;
    }

    // Yeni cari kart oluştur
    public function olustur($sirket_id, $veri) {
        $sql = "INSERT INTO cari_kartlar
                (sirket_id, cari_turu,
                 cari_adi_sifreli, vergi_no_sifreli, telefon_sifreli,
                 email_sifreli, adres_sifreli, yetkili_kisi_sifreli,
                 il, ilce, kredi_limiti)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $sirket_id,
            $veri['cari_turu'] ?? 'musteri',
            SistemKripto::sifrele($veri['cari_adi']),
            SistemKripto::sifrele($veri['vergi_no']     ?? null),
            SistemKripto::sifrele($veri['telefon']      ?? null),
            SistemKripto::sifrele($veri['email']        ?? null),
            SistemKripto::sifrele($veri['adres']        ?? null),
            SistemKripto::sifrele($veri['yetkili_kisi'] ?? null),
            $veri['il']           ?? null,
            $veri['ilce']         ?? null,
            $veri['kredi_limiti'] ?? null,
        ]);

        $yeni_id = $this->db->lastInsertId();
        return $this->getir($sirket_id, $yeni_id);
    }

    // Cari kart güncelle (sadece gönderilen alanlar)
    public function guncelle($sirket_id, $cari_id, $veri) {
        // PII alanlar → şifreli sütuna yazar
        $pii_alanlar  = ['cari_adi', 'vergi_no', 'telefon', 'email', 'adres', 'yetkili_kisi'];
        // Plaintext alanlar → doğrudan yazar
        $duz_alanlar  = ['cari_turu', 'il', 'ilce', 'kredi_limiti', 'aktif_mi'];

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

        $params[] = $cari_id;
        $params[] = $sirket_id;

        $sql  = "UPDATE cari_kartlar SET " . implode(', ', $setler) .
                " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getir($sirket_id, $cari_id);
    }

    // Cari kart sil — SOFT DELETE (silindi_mi = 1)
    public function sil($sirket_id, $cari_id) {
        $sql  = "UPDATE cari_kartlar
                 SET silindi_mi = 1, silinme_tarihi = NOW(), aktif_mi = 0
                 WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$cari_id, $sirket_id]);
        return $stmt->rowCount() > 0;
    }

    // Bakiye güncelle (hareketlerden hesapla)
    public function bakiye_guncelle($sirket_id, $cari_id) {
        $sql = "SELECT
                    COALESCE(SUM(CASE WHEN islem_tipi = 'borclandirma' THEN tutar_tl ELSE 0 END), 0) as toplam_borc,
                    COALESCE(SUM(CASE WHEN islem_tipi = 'tahsilat' THEN tutar_tl ELSE 0 END), 0) as toplam_alacak,
                    MAX(islem_tarihi) as son_islem
                FROM cari_hareketler
                WHERE cari_id = ? AND sirket_id = ? AND silindi_mi = 0";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$cari_id, $sirket_id]);
        $sonuc = $stmt->fetch(PDO::FETCH_ASSOC);

        $toplam_borc    = (float)$sonuc['toplam_borc'];
        $toplam_alacak  = (float)$sonuc['toplam_alacak'];
        $bakiye         = $toplam_borc - $toplam_alacak;
        $son_islem      = $sonuc['son_islem'];

        $guncelle_sql = "UPDATE cari_kartlar
                         SET toplam_borc = ?, toplam_alacak = ?, bakiye = ?, son_islem_tarihi = ?
                         WHERE id = ? AND sirket_id = ?";
        $guncelle_stmt = $this->db->prepare($guncelle_sql);
        $guncelle_stmt->execute([$toplam_borc, $toplam_alacak, $bakiye, $son_islem, $cari_id, $sirket_id]);

        return [
            'toplam_borc'   => $toplam_borc,
            'toplam_alacak' => $toplam_alacak,
            'bakiye'        => $bakiye,
        ];
    }

    // Cari kart var mı kontrolü
    public function var_mi($sirket_id, $cari_id) {
        $sql  = "SELECT id FROM cari_kartlar
                 WHERE id = ? AND sirket_id = ? AND aktif_mi = 1 AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$cari_id, $sirket_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    // Dashboard özet istatistikleri
    public function ozet_istatistikler($sirket_id) {
        $sql = "SELECT
                    COUNT(*) as toplam_cari,
                    COALESCE(SUM(CASE WHEN bakiye > 0 THEN 1 ELSE 0 END), 0) as borclu_cari_sayisi,
                    COALESCE(SUM(CASE WHEN bakiye > 0 THEN bakiye ELSE 0 END), 0) as toplam_alacaklar,
                    COALESCE(SUM(CASE WHEN bakiye < 0 THEN ABS(bakiye) ELSE 0 END), 0) as toplam_borclar,
                    COALESCE(SUM(bakiye), 0) as net_bakiye
                FROM cari_kartlar
                WHERE sirket_id = ? AND aktif_mi = 1 AND silindi_mi = 0";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
