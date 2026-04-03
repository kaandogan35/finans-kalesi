<?php
// =============================================================
// OdemeTakip.php — Ödeme ve Tahsilat Takip Veritabanı İşlemleri
// ParamGo SaaS — Aşama 2.0 (Yeni Tab Sistemi + Döngüsel Hatırlatma)
//
// Durum akışı:
//   bekliyor → (arama yapıldı) → cevap_vermedi | soz_verildi | tamamlandi
//   cevap_vermedi (hatirlatma_tarihi gelince) → bekliyor gibi davranır
//   soz_verildi (soz_tarihi geçince) → bekliyor gibi davranır
//   tamamlandi + hatirlatma_gun_araligi → X gün sonra yeni bekliyor kaydı
//
// Tab filtreleri:
//   aranmasi_gerekenler: durum=bekliyor VEYA (cevap_vermedi + hat<=bugün) VEYA (soz_verildi + soz<bugün)
//   arandi: cevap_vermedi + hatirlatma_tarihi > bugün
//   soz_alinanlar: soz_verildi + soz_tarihi >= bugün
//   tamamlandi: tamamlandi
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

    // ─── Tüm kayıtları listele (tab + filtreler + sayfalama) ───
    public function listele($sirket_id, $filtreler = []) {
        $where  = ["ot.sirket_id = ?", "ot.silindi_mi = 0"];
        $params = [$sirket_id];

        // Tab bazlı filtreleme (yeni sistem)
        $tab = $filtreler['tab'] ?? null;
        if ($tab === 'aranmasi_gerekenler') {
            $where[] = "(
                (ot.durum = 'bekliyor' AND (ot.hatirlatma_tarihi IS NULL OR ot.hatirlatma_tarihi <= CURDATE()))
                OR (ot.durum = 'cevap_vermedi' AND ot.hatirlatma_tarihi <= CURDATE())
                OR (ot.durum = 'soz_verildi' AND ot.soz_tarihi < CURDATE())
            )";
        } elseif ($tab === 'arandi') {
            $where[] = "(
                (ot.durum = 'cevap_vermedi' AND ot.hatirlatma_tarihi > CURDATE())
                OR (ot.durum = 'bekliyor' AND ot.hatirlatma_tarihi > CURDATE())
            )";
        } elseif ($tab === 'soz_alinanlar') {
            $where[] = "ot.durum = 'soz_verildi'";
            $where[] = "ot.soz_tarihi >= CURDATE()";
        } elseif ($tab === 'tamamlandi') {
            $where[] = "ot.durum = 'tamamlandi'";
        } else {
            // Tab belirtilmemişse eski uyumluluk filtreleri
            if (!empty($filtreler['durum'])) {
                $where[] = "ot.durum = ?";
                $params[] = $filtreler['durum'];
            }
            if (!empty($filtreler['bugunun_hatirlatmalari'])) {
                $where[] = "ot.hatirlatma_tarihi <= CURDATE()";
                $where[] = "ot.durum = 'bekliyor'";
            }
            if (!empty($filtreler['sadece_gecmis'])) {
                $where[] = "ot.soz_tarihi < CURDATE()";
                $where[] = "ot.durum = 'bekliyor'";
            }
        }

        if (!empty($filtreler['yon'])) {
            $where[] = "ot.yon = ?";
            $params[] = $filtreler['yon'];
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
            $where[] = "ot.olusturma_tarihi >= ?";
            $params[] = $filtreler['baslangic_tarihi'];
        }
        if (!empty($filtreler['bitis_tarihi'])) {
            $where[] = "ot.olusturma_tarihi <= ?";
            $params[] = $filtreler['bitis_tarihi'];
        }

        $where_sql = implode(" AND ", $where);

        $siralamalar = [
            'soz_tarihi_asc'   => 'ot.soz_tarihi ASC',
            'soz_tarihi_desc'  => 'ot.soz_tarihi DESC',
            'hatirlatma_asc'   => 'ot.hatirlatma_tarihi ASC',
            'oncelik_desc'     => "FIELD(ot.oncelik,'kritik','yuksek','normal','dusuk')",
            'tutar_desc'       => 'ot.tutar DESC',
            'olusturma_desc'   => 'ot.olusturma_tarihi DESC',
        ];
        $secilen  = $filtreler['siralama'] ?? 'oncelik_desc';
        $siralama = $siralamalar[$secilen] ?? "FIELD(ot.oncelik,'kritik','yuksek','normal','dusuk')";

        $sayfa  = max(1, (int)($filtreler['sayfa'] ?? 1));
        $adet   = min(100, max(1, (int)($filtreler['adet'] ?? 50)));
        $offset = ($sayfa - 1) * $adet;

        $arama = !empty($filtreler['arama']) ? mb_strtolower($filtreler['arama']) : null;

        if ($arama !== null) {
            $sql  = "SELECT ot.*,
                         ck.cari_adi_sifreli AS ck_cari_adi_sifreli,
                         ck.telefon_sifreli  AS ck_telefon_sifreli,
                         ck.bakiye           AS cari_bakiye,
                         k.ad_soyad          AS ekleyen_adi,
                         kt.ad_soyad         AS tamamlayan_adi
                     FROM odeme_takip ot
                     LEFT JOIN cari_kartlar ck ON ot.cari_id = ck.id AND ck.silindi_mi = 0
                     LEFT JOIN kullanicilar k  ON ot.ekleyen_id = k.id
                     LEFT JOIN kullanicilar kt ON ot.tamamlayan_id = kt.id
                     WHERE $where_sql ORDER BY $siralama";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $tumKayitlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $filtrelenmis = [];
            foreach ($tumKayitlar as $satir) {
                $satir = $this->pii_coz($satir);
                $satir = $this->cari_bilgi_coz($satir);
                $aramaMetni = mb_strtolower(
                    ($satir['firma_adi']   ?? '') . ' ' .
                    ($satir['cari_adi']    ?? '') . ' ' .
                    ($satir['ilgili_kisi'] ?? '') . ' ' .
                    ($satir['telefon']     ?? '') . ' ' .
                    ($satir['cari_telefon'] ?? '')
                );
                if (strpos($aramaMetni, $arama) !== false) {
                    $filtrelenmis[] = $satir;
                }
            }

            $toplam   = count($filtrelenmis);
            $kayitlar = array_slice($filtrelenmis, $offset, $adet);

            return [
                'kayitlar'     => array_values($kayitlar),
                'toplam'       => $toplam,
                'sayfa'        => $sayfa,
                'adet'         => $adet,
                'toplam_sayfa' => (int)ceil($toplam / $adet),
            ];
        }

        $sayac_stmt = $this->db->prepare("SELECT COUNT(*) FROM odeme_takip ot WHERE $where_sql");
        $sayac_stmt->execute($params);
        $toplam = (int)$sayac_stmt->fetchColumn();

        $sql  = "SELECT ot.*,
                     ck.cari_adi_sifreli AS ck_cari_adi_sifreli,
                     ck.telefon_sifreli  AS ck_telefon_sifreli,
                     ck.bakiye           AS cari_bakiye,
                     k.ad_soyad          AS ekleyen_adi,
                     kt.ad_soyad         AS tamamlayan_adi
                 FROM odeme_takip ot
                 LEFT JOIN cari_kartlar ck ON ot.cari_id = ck.id AND ck.silindi_mi = 0
                 LEFT JOIN kullanicilar k  ON ot.ekleyen_id = k.id
                 LEFT JOIN kullanicilar kt ON ot.tamamlayan_id = kt.id
                 WHERE $where_sql ORDER BY $siralama
                 LIMIT " . (int)$adet . " OFFSET " . (int)$offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $kayitlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($kayitlar as &$satir) {
            $satir = $this->pii_coz($satir);
            $satir = $this->cari_bilgi_coz($satir);
        }

        return [
            'kayitlar'     => $kayitlar,
            'toplam'       => $toplam,
            'sayfa'        => $sayfa,
            'adet'         => $adet,
            'toplam_sayfa' => (int)ceil($toplam / $adet),
        ];
    }

    // ─── Cari JOIN alanlarını çöz ───
    private function cari_bilgi_coz(array $satir): array {
        if (!empty($satir['ck_cari_adi_sifreli'])) {
            $satir['cari_adi'] = SistemKripto::coz($satir['ck_cari_adi_sifreli']) ?? null;
        }
        if (!empty($satir['ck_telefon_sifreli'])) {
            $satir['cari_telefon'] = SistemKripto::coz($satir['ck_telefon_sifreli']) ?? null;
        }
        unset($satir['ck_cari_adi_sifreli'], $satir['ck_telefon_sifreli']);
        return $satir;
    }

    // ─── Tek kayıt detayı ───
    public function getir($sirket_id, $kayit_id) {
        $sql  = "SELECT ot.*,
                     ck.cari_adi_sifreli AS ck_cari_adi_sifreli,
                     ck.telefon_sifreli  AS ck_telefon_sifreli,
                     ck.bakiye           AS cari_bakiye,
                     k.ad_soyad          AS ekleyen_adi,
                     kt.ad_soyad         AS tamamlayan_adi
                 FROM odeme_takip ot
                 LEFT JOIN cari_kartlar ck ON ot.cari_id = ck.id AND ck.silindi_mi = 0
                 LEFT JOIN kullanicilar k  ON ot.ekleyen_id = k.id
                 LEFT JOIN kullanicilar kt ON ot.tamamlayan_id = kt.id
                 WHERE ot.id = ? AND ot.sirket_id = ? AND ot.silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$kayit_id, $sirket_id]);
        $row  = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return false;

        $row = $this->pii_coz($row);
        $row = $this->cari_bilgi_coz($row);
        return $row;
    }

    // ─── Aktif kayıt var mı? (duplicate kontrol) ───
    // durum tamamlandi veya iptal değilse "aktif" sayılır
    public function aktif_kayit_var_mi($sirket_id, $cari_id) {
        $stmt = $this->db->prepare("
            SELECT id FROM odeme_takip
            WHERE sirket_id = :sirket_id
              AND cari_id   = :cari_id
              AND durum     NOT IN ('tamamlandi', 'iptal')
              AND silindi_mi = 0
            LIMIT 1
        ");
        $stmt->execute([':sirket_id' => $sirket_id, ':cari_id' => $cari_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }

    // ─── Yeni kayıt oluştur ───
    public function olustur($sirket_id, $veri, $ekleyen_id) {
        $firma_adi_sifreli = !empty($veri['firma_adi'])
            ? SistemKripto::sifrele($veri['firma_adi'])
            : null;

        $sql = "INSERT INTO odeme_takip
                (sirket_id, cari_id,
                 firma_adi_sifreli, ilgili_kisi_sifreli, telefon_sifreli,
                 tutar, doviz_kodu, yon, soz_tarihi, durum, oncelik,
                 gorusme_notu_sifreli, hatirlatma_tarihi, hatirlatma_gun_araligi, ekleyen_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $sirket_id,
            isset($veri['cari_id']) ? (int)$veri['cari_id'] : null,
            $firma_adi_sifreli,
            SistemKripto::sifrele($veri['ilgili_kisi']          ?? null),
            SistemKripto::sifrele($veri['telefon']              ?? null),
            isset($veri['tutar']) ? (float)$veri['tutar']       : null,
            isset($veri['doviz_kodu']) ? strtoupper($veri['doviz_kodu']) : 'TRY',
            $veri['yon']                                         ?? 'tahsilat',
            $veri['soz_tarihi']                                  ?? null,
            $veri['durum']                                       ?? 'bekliyor',
            $veri['oncelik']                                     ?? 'normal',
            SistemKripto::sifrele($veri['gorusme_notu']         ?? null),
            $veri['hatirlatma_tarihi']                           ?? null,
            isset($veri['hatirlatma_gun_araligi']) ? (int)$veri['hatirlatma_gun_araligi'] : null,
            $ekleyen_id,
        ]);

        $yeni_id = $this->db->lastInsertId();
        return $this->getir($sirket_id, $yeni_id);
    }

    // ─── Arama kaydı işle: cevap_vermedi | soz_verildi | tamamlandi ───
    public function aramaKaydi($sirket_id, $kayit_id, $veri, $yapan_id) {
        $mevcut = $this->getir($sirket_id, $kayit_id);
        if (!$mevcut) return false;

        $aksiyon = $veri['aksiyon'] ?? '';
        $not     = $veri['not']     ?? null;

        if ($aksiyon === 'cevap_vermedi') {
            $hatirlatma = $veri['hatirlatma_tarihi'] ?? null;
            $sql = "UPDATE odeme_takip
                    SET durum = 'cevap_vermedi',
                        hatirlatma_tarihi = ?,
                        son_arama_tarihi = CURDATE()"
                 . ($not !== null ? ", gorusme_notu_sifreli = ?" : "")
                 . " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
            $params = [$hatirlatma];
            if ($not !== null) $params[] = SistemKripto::sifrele($not);
            $params[] = $kayit_id;
            $params[] = $sirket_id;
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

        } elseif ($aksiyon === 'soz_verildi') {
            $soz_tarihi = $veri['soz_tarihi'] ?? null;
            $sql = "UPDATE odeme_takip
                    SET durum = 'soz_verildi',
                        soz_tarihi = ?,
                        son_arama_tarihi = CURDATE()"
                 . ($not !== null ? ", gorusme_notu_sifreli = ?" : "")
                 . " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
            $params = [$soz_tarihi];
            if ($not !== null) $params[] = SistemKripto::sifrele($not);
            $params[] = $kayit_id;
            $params[] = $sirket_id;
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

        } elseif ($aksiyon === 'tamamlandi') {
            $gun_araligi = isset($veri['hatirlatma_gun']) ? (int)$veri['hatirlatma_gun'] : null;

            // Mevcut kaydı tamamla
            $sql = "UPDATE odeme_takip
                    SET durum = 'tamamlandi',
                        tamamlayan_id = ?,
                        tamamlanma_tarihi = NOW(),
                        hatirlatma_gun_araligi = ?,
                        son_arama_tarihi = CURDATE()"
                 . ($not !== null ? ", gorusme_notu_sifreli = ?" : "")
                 . " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
            $params = [$yapan_id, $gun_araligi];
            if ($not !== null) $params[] = SistemKripto::sifrele($not);
            $params[] = $kayit_id;
            $params[] = $sirket_id;
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            // Döngüsel hatırlatma: X gün sonra yeni kayıt oluştur
            if ($gun_araligi !== null && $gun_araligi > 0) {
                $hat_tarihi = date('Y-m-d', strtotime("+{$gun_araligi} days"));
                $yeni_veri  = [
                    'cari_id'              => $mevcut['cari_id'],
                    'yon'                  => $mevcut['yon'],
                    'durum'                => 'bekliyor',
                    'oncelik'              => $mevcut['oncelik'],
                    'hatirlatma_tarihi'    => $hat_tarihi,
                    'hatirlatma_gun_araligi' => $gun_araligi,
                ];
                // Cari bağlı değilse firma_adi/telefon taşı
                if (empty($mevcut['cari_id'])) {
                    $yeni_veri['firma_adi']  = $mevcut['firma_adi']  ?? null;
                    $yeni_veri['telefon']    = $mevcut['telefon']    ?? null;
                    $yeni_veri['ilgili_kisi'] = $mevcut['ilgili_kisi'] ?? null;
                }
                $this->olustur($sirket_id, $yeni_veri, $yapan_id);
            }
        } else {
            return false;
        }

        return $this->getir($sirket_id, $kayit_id);
    }

    // ─── Kayıt güncelle (sadece gönderilen alanlar) ───
    public function guncelle($sirket_id, $kayit_id, $veri) {
        $mevcut = $this->getir($sirket_id, $kayit_id);
        if (!$mevcut) return false;

        $duz_alanlar = ['cari_id', 'tutar', 'doviz_kodu', 'yon', 'soz_tarihi', 'durum', 'oncelik', 'hatirlatma_tarihi', 'son_arama_tarihi', 'hatirlatma_gun_araligi'];
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

        if (empty($setler)) return false;

        $params[] = $kayit_id;
        $params[] = $sirket_id;

        $sql  = "UPDATE odeme_takip SET " . implode(', ', $setler) .
                " WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getir($sirket_id, $kayit_id);
    }

    // ─── Kayıt sil — SOFT DELETE ───
    public function sil($sirket_id, $kayit_id) {
        $mevcut = $this->getir($sirket_id, $kayit_id);
        if (!$mevcut) return false;

        $sql  = "UPDATE odeme_takip
                 SET silindi_mi = 1, silinme_tarihi = NOW()
                 WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$kayit_id, $sirket_id]);
        return $stmt->rowCount() > 0;
    }

    // ─── Tab sayıları (badge için) ───
    public function tab_sayilari($sirket_id) {
        $sql = "SELECT
                    SUM(CASE WHEN
                        (durum = 'bekliyor' AND (hatirlatma_tarihi IS NULL OR hatirlatma_tarihi <= CURDATE()))
                        OR (durum = 'cevap_vermedi' AND hatirlatma_tarihi <= CURDATE())
                        OR (durum = 'soz_verildi' AND soz_tarihi < CURDATE())
                    THEN 1 ELSE 0 END) AS aranmasi_gerekenler,

                    SUM(CASE WHEN (durum = 'cevap_vermedi' OR durum = 'bekliyor') AND hatirlatma_tarihi > CURDATE()
                    THEN 1 ELSE 0 END) AS arandi,

                    SUM(CASE WHEN durum = 'soz_verildi' AND soz_tarihi >= CURDATE()
                    THEN 1 ELSE 0 END) AS soz_alinanlar,

                    SUM(CASE WHEN durum = 'tamamlandi'
                    THEN 1 ELSE 0 END) AS tamamlandi

                FROM odeme_takip
                WHERE sirket_id = ? AND silindi_mi = 0";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ─── Dashboard özet istatistikleri ───
    public function ozet_istatistikler($sirket_id) {
        $sql = "SELECT
                    -- Bugün aranması gerekenler (bekliyor + hat.tarihi gelen cevap_vermedi)
                    SUM(CASE WHEN
                        (durum = 'bekliyor' AND (hatirlatma_tarihi IS NULL OR hatirlatma_tarihi <= CURDATE()))
                        OR (durum = 'cevap_vermedi' AND hatirlatma_tarihi <= CURDATE())
                    THEN 1 ELSE 0 END) AS bugun_aranmasi_gereken,

                    -- Söz tarihi geçmiş ama ödeme yapılmamış
                    SUM(CASE WHEN durum = 'soz_verildi' AND soz_tarihi < CURDATE()
                    THEN 1 ELSE 0 END) AS soz_tarihi_gecmis,

                    -- Aktif söz (tarihi henüz gelmemiş)
                    SUM(CASE WHEN durum = 'soz_verildi' AND soz_tarihi >= CURDATE()
                    THEN 1 ELSE 0 END) AS bekleyen_soz,

                    -- Bu ay tamamlanan
                    SUM(CASE WHEN durum = 'tamamlandi'
                        AND MONTH(tamamlanma_tarihi) = MONTH(NOW())
                        AND YEAR(tamamlanma_tarihi)  = YEAR(NOW())
                    THEN 1 ELSE 0 END) AS bu_ay_tamamlanan,

                    -- Eski uyumluluk alanları
                    SUM(CASE WHEN durum = 'bekliyor' THEN 1 ELSE 0 END) AS bekleyen_tahsilat_adet,
                    COALESCE(SUM(CASE WHEN durum IN ('bekliyor','cevap_vermedi','soz_verildi') THEN COALESCE(tutar,0) ELSE 0 END), 0) AS bekleyen_tahsilat_tutar,
                    SUM(CASE WHEN durum = 'tamamlandi' THEN 1 ELSE 0 END) AS bu_ay_tamamlanan_adet

                FROM odeme_takip
                WHERE sirket_id = ? AND silindi_mi = 0";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        $sonuc = $stmt->fetch(PDO::FETCH_ASSOC);

        // Tab sayılarını da ekle
        $sonuc['tab_sayilari'] = $this->tab_sayilari($sirket_id);

        return $sonuc;
    }
}
