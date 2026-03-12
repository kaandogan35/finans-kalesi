<?php
// =============================================================
// Kasa.php — Varlık & Kasa Veritabanı İşlemleri (Model)
// Finans Kalesi SaaS — Aşama 1.9 (Soft Delete + VIP Şifreleme)
//
// Tüm hassas veriler kullanıcının kasa şifresiyle AES-256-GCM
// ile şifreli saklanır. KriptoHelper ile şifreleme/çözme yapılır.
// UYARI: Bu modelde hiçbir plaintext değer loglanmamalı!
//
// Kapsam: kasa_hareketler, fiziki_kasa, yatirim_kasasi, ortak_carisi
// =============================================================

class Kasa {
    private $db;
    private $kripto; // KriptoHelper instance

    public function __construct($db, $kripto) {
        $this->db     = $db;
        $this->kripto = $kripto;
    }

    // ─────────────────────────────────────────────────
    // ŞIFRE KURULUMU
    // ─────────────────────────────────────────────────

    // Şirketin kasa şifresi kurulu mu?
    public function sifre_kurulu_mu($sirket_id) {
        $sql = "SELECT kasa_sifre_hash FROM sirketler WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row && !empty($row['kasa_sifre_hash']);
    }

    // İlk kez şifre kur
    public function sifre_kur($sirket_id, $sifre) {
        $sonuc = KriptoHelper::sifre_hash_olustur($sifre);

        $sql = "UPDATE sirketler SET kasa_sifre_hash = ?, kasa_salt = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sonuc['hash'], $sonuc['salt'], $sirket_id]);

        // Doğru salt ile kripto oluştur — fiziki kasa başlatmak için
        $this->kripto = new KriptoHelper($sifre, $sonuc['salt']);

        // Fiziki kasa başlangıç kaydı oluştur (bakiye = 0)
        $this->fiziki_kasa_baslat($sirket_id);

        return $stmt->rowCount() > 0;
    }

    // Kasa şifresini al (doğrulama için)
    public function sifre_bilgileri_al($sirket_id) {
        $sql = "SELECT kasa_sifre_hash, kasa_salt FROM sirketler WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ─────────────────────────────────────────────────
    // FİZİKİ KASA BAKİYESİ
    // ─────────────────────────────────────────────────

    // Fiziki kasa başlangıç kaydı (ilk kurulumda)
    private function fiziki_kasa_baslat($sirket_id) {
        $mevcut_sql = "SELECT id FROM fiziki_kasa WHERE sirket_id = ?";
        $mevcut_stmt = $this->db->prepare($mevcut_sql);
        $mevcut_stmt->execute([$sirket_id]);
        if ($mevcut_stmt->fetch()) {
            return; // Zaten var
        }

        $sifrelenmis_sifir = $this->kripto->sifrele('0');
        $sql = "INSERT INTO fiziki_kasa (sirket_id, bakiye_sifreli) VALUES (?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id, $sifrelenmis_sifir]);
    }

    // Fiziki kasa bakiyesini getir (çözülmüş)
    public function fiziki_bakiye_getir($sirket_id) {
        $sql = "SELECT bakiye_sifreli FROM fiziki_kasa WHERE sirket_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return 0;

        $cozulmus = $this->kripto->coz($row['bakiye_sifreli']);
        return ($cozulmus !== null) ? (float)$cozulmus : 0;
    }

    // Fiziki kasa bakiyesini güncelle
    private function fiziki_bakiye_guncelle($sirket_id, $yeni_bakiye) {
        $sifrelenmis = $this->kripto->sifrele((string)$yeni_bakiye);
        $sql = "UPDATE fiziki_kasa SET bakiye_sifreli = ?, guncelleme_tarihi = NOW() WHERE sirket_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sifrelenmis, $sirket_id]);
    }

    // ─────────────────────────────────────────────────
    // KASA HAREKETLERİ
    // ─────────────────────────────────────────────────

    // Kasa hareketlerini listele (çözülmüş)
    public function hareketler_listele($sirket_id, $filtreler = array()) {
        $where = array("kh.sirket_id = ?", "kh.silindi_mi = 0");
        $params = array($sirket_id);

        if (!empty($filtreler['islem_tipi'])) {
            $where[] = "kh.islem_tipi = ?";
            $params[] = $filtreler['islem_tipi'];
        }

        if (!empty($filtreler['kategori'])) {
            $where[] = "kh.kategori = ?";
            $params[] = $filtreler['kategori'];
        }

        if (!empty($filtreler['baslangic_tarihi'])) {
            $where[] = "kh.tarih >= ?";
            $params[] = $filtreler['baslangic_tarihi'];
        }

        if (!empty($filtreler['bitis_tarihi'])) {
            $where[] = "kh.tarih <= ?";
            $params[] = $filtreler['bitis_tarihi'];
        }

        $where_sql = implode(" AND ", $where);

        $sayfa = max(1, (int)(isset($filtreler['sayfa']) ? $filtreler['sayfa'] : 1));
        $adet  = min(100, max(1, (int)(isset($filtreler['adet']) ? $filtreler['adet'] : 50)));
        $offset = ($sayfa - 1) * $adet;

        $sayac_sql = "SELECT COUNT(*) FROM kasa_hareketler kh WHERE $where_sql";
        $sayac_stmt = $this->db->prepare($sayac_sql);
        $sayac_stmt->execute($params);
        $toplam = (int)$sayac_stmt->fetchColumn();

        $sql = "SELECT kh.id, kh.islem_tipi, kh.kategori, kh.tarih, kh.baglanti_turu,
                       kh.tutar_sifreli, kh.aciklama_sifreli,
                       k.ad_soyad as ekleyen_adi, kh.olusturma_tarihi
                FROM kasa_hareketler kh
                LEFT JOIN kullanicilar k ON kh.ekleyen_id = k.id
                WHERE $where_sql
                ORDER BY kh.tarih DESC, kh.id DESC
                LIMIT " . (int)$adet . " OFFSET " . (int)$offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $satirlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Şifreli alanları çöz
        $hareketler = array();
        foreach ($satirlar as $satir) {
            $tutar     = $this->kripto->coz($satir['tutar_sifreli']);
            $aciklama  = $this->kripto->coz($satir['aciklama_sifreli']);
            $hareketler[] = array(
                'id'           => $satir['id'],
                'islem_tipi'   => $satir['islem_tipi'],
                'kategori'     => $satir['kategori'],
                'tutar'        => ($tutar !== null) ? (float)$tutar : null,
                'aciklama'     => $aciklama,
                'tarih'        => $satir['tarih'],
                'baglanti_turu'=> $satir['baglanti_turu'],
                'ekleyen_adi'  => $satir['ekleyen_adi'],
                'olusturma_tarihi' => $satir['olusturma_tarihi'],
            );
        }

        return array(
            'hareketler'   => $hareketler,
            'toplam'       => $toplam,
            'sayfa'        => $sayfa,
            'adet'         => $adet,
            'toplam_sayfa' => (int)ceil($toplam / $adet)
        );
    }

    // Yeni kasa hareketi ekle
    public function hareket_ekle($sirket_id, $veri, $ekleyen_id) {
        $tutar_sifreli    = $this->kripto->sifrele((string)$veri['tutar']);
        $aciklama_sifreli = $this->kripto->sifrele(isset($veri['aciklama']) ? $veri['aciklama'] : '');

        $sql = "INSERT INTO kasa_hareketler
                (sirket_id, islem_tipi, kategori, tutar_sifreli, aciklama_sifreli,
                 tarih, baglanti_turu, ekleyen_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $sirket_id,
            $veri['islem_tipi'],
            isset($veri['kategori']) ? $veri['kategori'] : null,
            $tutar_sifreli,
            $aciklama_sifreli,
            isset($veri['tarih']) ? $veri['tarih'] : date('Y-m-d'),
            isset($veri['baglanti_turu']) ? $veri['baglanti_turu'] : null,
            $ekleyen_id
        ]);

        // Bakiyeyi güncelle
        $mevcut_bakiye = $this->fiziki_bakiye_getir($sirket_id);
        $tutar = (float)$veri['tutar'];
        $yeni_bakiye = ($veri['islem_tipi'] === 'giris')
            ? $mevcut_bakiye + $tutar
            : $mevcut_bakiye - $tutar;

        $this->fiziki_bakiye_guncelle($sirket_id, $yeni_bakiye);

        return array(
            'hareket_id'   => (int)$this->db->lastInsertId(),
            'yeni_bakiye'  => $yeni_bakiye
        );
    }

    // Kasa hareketi sil (yumuşak)
    public function hareket_sil($sirket_id, $hareket_id) {
        // Önce tutarı al — bakiyeyi geri almak için
        $sql = "SELECT islem_tipi, tutar_sifreli FROM kasa_hareketler
                WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$hareket_id, $sirket_id]);
        $hareket = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$hareket) {
            return false;
        }

        $tutar = (float)$this->kripto->coz($hareket['tutar_sifreli']);

        // Yumuşak sil
        $sil_sql = "UPDATE kasa_hareketler
                    SET silindi_mi = 1, silinme_tarihi = NOW()
                    WHERE id = ? AND sirket_id = ?";
        $sil_stmt = $this->db->prepare($sil_sql);
        $sil_stmt->execute([$hareket_id, $sirket_id]);

        // Bakiyeyi geri al
        $mevcut_bakiye = $this->fiziki_bakiye_getir($sirket_id);
        $yeni_bakiye = ($hareket['islem_tipi'] === 'giris')
            ? $mevcut_bakiye - $tutar
            : $mevcut_bakiye + $tutar;

        $this->fiziki_bakiye_guncelle($sirket_id, $yeni_bakiye);

        return $yeni_bakiye;
    }

    // ─────────────────────────────────────────────────
    // YATIRIM KASASI
    // ─────────────────────────────────────────────────

    // Yatırımları listele (çözülmüş)
    public function yatirimlar_listele($sirket_id) {
        $sql = "SELECT id, yatirim_adi, alis_tarihi, doviz_kodu, kategori,
                       miktar_sifreli, birim_fiyat_sifreli, olusturma_tarihi
                FROM yatirim_kasasi
                WHERE sirket_id = ? AND silindi_mi = 0
                ORDER BY alis_tarihi DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        $satirlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $yatirimlar = array();
        foreach ($satirlar as $satir) {
            $miktar      = $this->kripto->coz($satir['miktar_sifreli']);
            $birim_fiyat = $this->kripto->coz($satir['birim_fiyat_sifreli']);
            $miktar_f    = ($miktar !== null) ? (float)$miktar : null;
            $fiyat_f     = ($birim_fiyat !== null) ? (float)$birim_fiyat : null;

            $yatirimlar[] = array(
                'id'           => $satir['id'],
                'yatirim_adi'  => $satir['yatirim_adi'],
                'miktar'       => $miktar_f,
                'birim_fiyat'  => $fiyat_f,
                'toplam_deger' => ($miktar_f !== null && $fiyat_f !== null) ? round($miktar_f * $fiyat_f, 2) : null,
                'alis_tarihi'  => $satir['alis_tarihi'],
                'doviz_kodu'   => $satir['doviz_kodu'],
                'kategori'     => $satir['kategori'],
                'olusturma_tarihi' => $satir['olusturma_tarihi'],
            );
        }

        return $yatirimlar;
    }

    // Yeni yatırım ekle
    public function yatirim_ekle($sirket_id, $veri) {
        $miktar_sifreli      = $this->kripto->sifrele((string)$veri['miktar']);
        $birim_fiyat_sifreli = $this->kripto->sifrele((string)(isset($veri['birim_fiyat']) ? $veri['birim_fiyat'] : 0));

        $sql = "INSERT INTO yatirim_kasasi
                (sirket_id, yatirim_adi, miktar_sifreli, birim_fiyat_sifreli,
                 alis_tarihi, doviz_kodu, kategori)
                VALUES (?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $sirket_id,
            $veri['yatirim_adi'],
            $miktar_sifreli,
            $birim_fiyat_sifreli,
            isset($veri['alis_tarihi']) ? $veri['alis_tarihi'] : date('Y-m-d'),
            isset($veri['doviz_kodu']) ? strtoupper($veri['doviz_kodu']) : 'TRY',
            isset($veri['kategori']) ? $veri['kategori'] : null,
        ]);

        return (int)$this->db->lastInsertId();
    }

    // Yatırım güncelle
    public function yatirim_guncelle($sirket_id, $yatirim_id, $veri) {
        $setler = array();
        $params = array();

        if (isset($veri['yatirim_adi'])) { $setler[] = "yatirim_adi = ?";  $params[] = $veri['yatirim_adi']; }
        if (isset($veri['alis_tarihi'])) { $setler[] = "alis_tarihi = ?";  $params[] = $veri['alis_tarihi']; }
        if (isset($veri['doviz_kodu']))  { $setler[] = "doviz_kodu = ?";   $params[] = strtoupper($veri['doviz_kodu']); }
        if (isset($veri['kategori']))    { $setler[] = "kategori = ?";     $params[] = $veri['kategori']; }

        if (isset($veri['miktar'])) {
            $setler[] = "miktar_sifreli = ?";
            $params[] = $this->kripto->sifrele((string)$veri['miktar']);
        }
        if (isset($veri['birim_fiyat'])) {
            $setler[] = "birim_fiyat_sifreli = ?";
            $params[] = $this->kripto->sifrele((string)$veri['birim_fiyat']);
        }

        if (empty($setler)) return false;

        $params[] = $yatirim_id;
        $params[] = $sirket_id;

        $sql = "UPDATE yatirim_kasasi SET " . implode(', ', $setler) . " WHERE id = ? AND sirket_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    // Yatırım sil — SOFT DELETE (silindi_mi = 1)
    public function yatirim_sil($sirket_id, $yatirim_id) {
        $sql  = "UPDATE yatirim_kasasi
                 SET silindi_mi = 1, silinme_tarihi = NOW()
                 WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$yatirim_id, $sirket_id]);
        return $stmt->rowCount() > 0;
    }

    // ─────────────────────────────────────────────────
    // ORTAK CARİSİ
    // ─────────────────────────────────────────────────

    // Ortak hareketlerini listele (çözülmüş)
    public function ortaklar_listele($sirket_id, $filtreler = array()) {
        $where = array("oc.sirket_id = ?", "oc.silindi_mi = 0");
        $params = array($sirket_id);

        if (!empty($filtreler['ortak_adi'])) {
            $where[] = "oc.ortak_adi LIKE ?";
            $params[] = '%' . $filtreler['ortak_adi'] . '%';
        }

        if (!empty($filtreler['islem_tipi'])) {
            $where[] = "oc.islem_tipi = ?";
            $params[] = $filtreler['islem_tipi'];
        }

        $where_sql = implode(" AND ", $where);

        $sayfa = max(1, (int)(isset($filtreler['sayfa']) ? $filtreler['sayfa'] : 1));
        $adet  = min(100, max(1, (int)(isset($filtreler['adet']) ? $filtreler['adet'] : 50)));
        $offset = ($sayfa - 1) * $adet;

        $sayac_sql = "SELECT COUNT(*) FROM ortak_carisi oc WHERE $where_sql";
        $sayac_stmt = $this->db->prepare($sayac_sql);
        $sayac_stmt->execute($params);
        $toplam = (int)$sayac_stmt->fetchColumn();

        $sql = "SELECT oc.id, oc.ortak_adi, oc.islem_tipi, oc.tarih,
                       oc.tutar_sifreli, oc.aciklama_sifreli,
                       k.ad_soyad as ekleyen_adi, oc.olusturma_tarihi
                FROM ortak_carisi oc
                LEFT JOIN kullanicilar k ON oc.ekleyen_id = k.id
                WHERE $where_sql
                ORDER BY oc.tarih DESC, oc.id DESC
                LIMIT " . (int)$adet . " OFFSET " . (int)$offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $satirlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $ortaklar = array();
        foreach ($satirlar as $satir) {
            $tutar    = $this->kripto->coz($satir['tutar_sifreli']);
            $aciklama = $this->kripto->coz($satir['aciklama_sifreli']);
            $ortaklar[] = array(
                'id'          => $satir['id'],
                'ortak_adi'   => $satir['ortak_adi'],
                'islem_tipi'  => $satir['islem_tipi'],
                'tutar'       => ($tutar !== null) ? (float)$tutar : null,
                'aciklama'    => $aciklama,
                'tarih'       => $satir['tarih'],
                'ekleyen_adi' => $satir['ekleyen_adi'],
                'olusturma_tarihi' => $satir['olusturma_tarihi'],
            );
        }

        return array(
            'ortaklar'     => $ortaklar,
            'toplam'       => $toplam,
            'sayfa'        => $sayfa,
            'adet'         => $adet,
            'toplam_sayfa' => (int)ceil($toplam / $adet)
        );
    }

    // Yeni ortak hareketi ekle
    public function ortak_hareket_ekle($sirket_id, $veri, $ekleyen_id) {
        $tutar_sifreli    = $this->kripto->sifrele((string)$veri['tutar']);
        $aciklama_sifreli = $this->kripto->sifrele(isset($veri['aciklama']) ? $veri['aciklama'] : '');

        $sql = "INSERT INTO ortak_carisi
                (sirket_id, ortak_adi, islem_tipi, tutar_sifreli, aciklama_sifreli, tarih, ekleyen_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $sirket_id,
            $veri['ortak_adi'],
            $veri['islem_tipi'],
            $tutar_sifreli,
            $aciklama_sifreli,
            isset($veri['tarih']) ? $veri['tarih'] : date('Y-m-d'),
            $ekleyen_id
        ]);

        return (int)$this->db->lastInsertId();
    }

    // Ortak hareketi sil — SOFT DELETE (silindi_mi = 1)
    public function ortak_hareket_sil($sirket_id, $hareket_id) {
        $sql  = "UPDATE ortak_carisi
                 SET silindi_mi = 1, silinme_tarihi = NOW()
                 WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$hareket_id, $sirket_id]);
        return $stmt->rowCount() > 0;
    }

    // ─────────────────────────────────────────────────
    // ÖZET
    // ─────────────────────────────────────────────────

    // Varlık & Kasa genel özeti
    public function ozet($sirket_id) {
        // Fiziki kasa bakiyesi
        $fiziki_bakiye = $this->fiziki_bakiye_getir($sirket_id);

        // Kasa hareket sayıları (şifreli alanlar dahil değil — sadece meta)
        $hareket_sql = "SELECT
                            COUNT(*) as toplam_hareket,
                            COUNT(CASE WHEN islem_tipi = 'giris' THEN 1 END) as giris_adet,
                            COUNT(CASE WHEN islem_tipi = 'cikis' THEN 1 END) as cikis_adet
                        FROM kasa_hareketler
                        WHERE sirket_id = ? AND silindi_mi = 0";
        $h_stmt = $this->db->prepare($hareket_sql);
        $h_stmt->execute([$sirket_id]);
        $hareket_meta = $h_stmt->fetch(PDO::FETCH_ASSOC);

        // Yatırım sayısı
        $yatirim_sql = "SELECT COUNT(*) as aktif_yatirim FROM yatirim_kasasi WHERE sirket_id = ? AND silindi_mi = 0";
        $y_stmt = $this->db->prepare($yatirim_sql);
        $y_stmt->execute([$sirket_id]);
        $yatirim_meta = $y_stmt->fetch(PDO::FETCH_ASSOC);

        // Ortak hareket sayısı
        $ortak_sql = "SELECT COUNT(*) as toplam_ortak_hareket FROM ortak_carisi WHERE sirket_id = ?";
        $o_stmt = $this->db->prepare($ortak_sql);
        $o_stmt->execute([$sirket_id]);
        $ortak_meta = $o_stmt->fetch(PDO::FETCH_ASSOC);

        return array(
            'fiziki_kasa_bakiye'   => $fiziki_bakiye,
            'toplam_hareket'       => (int)$hareket_meta['toplam_hareket'],
            'giris_adet'           => (int)$hareket_meta['giris_adet'],
            'cikis_adet'           => (int)$hareket_meta['cikis_adet'],
            'aktif_yatirim_adet'   => (int)$yatirim_meta['aktif_yatirim'],
            'toplam_ortak_hareket' => (int)$ortak_meta['toplam_ortak_hareket'],
        );
    }
}
