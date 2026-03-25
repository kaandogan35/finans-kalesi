<?php
// =============================================================
// Kasa.php — Varlık & Kasa Veritabanı İşlemleri (Model)
// Finans Kalesi SaaS — Aşama 1.9 (Soft Delete + AES-256-GCM)
//
// Tüm hassas veriler SistemKripto (APP_ENCRYPTION_KEY) ile
// AES-256-GCM şifreli saklanır.
// UYARI: Bu modelde hiçbir plaintext değer loglanmamalı!
//
// Kapsam: kasa_hareketler, fiziki_kasa, yatirim_kasasi, ortak_carisi
// =============================================================

class Kasa {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Şifreleme yardımcısı
    private function sifrele($metin) {
        return SistemKripto::sifrele($metin);
    }

    // Çözme yardımcısı
    private function coz($sifrelenmis) {
        return SistemKripto::coz($sifrelenmis);
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

        $sifrelenmis_sifir = $this->sifrele('0');
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

        $cozulmus = $this->coz($row['bakiye_sifreli']);
        return ($cozulmus !== null) ? (float)$cozulmus : 0;
    }

    // Fiziki kasa bakiyesini güncelle
    private function fiziki_bakiye_guncelle($sirket_id, $yeni_bakiye) {
        $sifrelenmis = $this->sifrele((string)$yeni_bakiye);
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
            $tutar     = $this->coz($satir['tutar_sifreli']);
            $aciklama  = $this->coz($satir['aciklama_sifreli']);
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
        $tutar_sifreli    = $this->sifrele((string)$veri['tutar']);
        $aciklama_sifreli = $this->sifrele(isset($veri['aciklama']) ? $veri['aciklama'] : '');

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

        $cozulmus = $this->coz($hareket['tutar_sifreli']);
        $tutar = ($cozulmus !== null) ? (float)$cozulmus : 0.0;

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
                       miktar_sifreli, birim_fiyat_sifreli, guncel_fiyat_sifreli,
                       olusturma_tarihi
                FROM yatirim_kasasi
                WHERE sirket_id = ? AND silindi_mi = 0
                ORDER BY alis_tarihi DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        $satirlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $yatirimlar = array();
        foreach ($satirlar as $satir) {
            $miktar        = $this->coz($satir['miktar_sifreli']);
            $birim_fiyat   = $this->coz($satir['birim_fiyat_sifreli']);
            $guncel_fiyat  = !empty($satir['guncel_fiyat_sifreli'])
                ? $this->coz($satir['guncel_fiyat_sifreli'])
                : null;
            $miktar_f      = ($miktar !== null) ? (float)$miktar : null;
            $fiyat_f       = ($birim_fiyat !== null) ? (float)$birim_fiyat : null;
            $guncel_f      = ($guncel_fiyat !== null) ? (float)$guncel_fiyat : null;

            $yatirimlar[] = array(
                'id'           => $satir['id'],
                'yatirim_adi'  => $satir['yatirim_adi'],
                'tur'          => $satir['yatirim_adi'],
                'miktar'       => $miktar_f,
                'birim_fiyat'  => $fiyat_f,
                'toplam_deger' => ($miktar_f !== null && $fiyat_f !== null) ? round($miktar_f * $fiyat_f, 2) : null,
                'guncel_fiyat' => $guncel_f,
                'alis_tarihi'  => $satir['alis_tarihi'],
                'doviz_kodu'   => $satir['doviz_kodu'],
                'kategori'     => $satir['kategori'],
                'varlık_tipi'  => $satir['kategori'],
                'olusturma_tarihi' => $satir['olusturma_tarihi'],
            );
        }

        return $yatirimlar;
    }

    // Yeni yatırım ekle
    public function yatirim_ekle($sirket_id, $veri) {
        $miktar_sifreli      = $this->sifrele((string)$veri['miktar']);
        $birim_fiyat_sifreli = $this->sifrele((string)(isset($veri['birim_fiyat']) ? $veri['birim_fiyat'] : 0));

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
            $params[] = $this->sifrele((string)$veri['miktar']);
        }
        if (isset($veri['birim_fiyat'])) {
            $setler[] = "birim_fiyat_sifreli = ?";
            $params[] = $this->sifrele((string)$veri['birim_fiyat']);
        }

        if (empty($setler)) return false;

        $params[] = $yatirim_id;
        $params[] = $sirket_id;

        $sql = "UPDATE yatirim_kasasi SET " . implode(', ', $setler) . " WHERE id = ? AND sirket_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    // Güncel fiyatları toplu güncelle (aynı tur'a sahip tüm kayıtlar)
    public function guncel_fiyat_toplu_guncelle($sirket_id, $fiyatlar) {
        // $fiyatlar = [ 'Ata Altın' => 4200.50, 'Dolar ($)' => 38.50, ... ]
        $guncellenen = 0;

        foreach ($fiyatlar as $tur => $fiyat) {
            if ($fiyat === null) {
                // Boş bırakılan: guncel_fiyat_sifreli = NULL yap
                $sql = "UPDATE yatirim_kasasi
                        SET guncel_fiyat_sifreli = NULL
                        WHERE sirket_id = ? AND yatirim_adi = ? AND silindi_mi = 0";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([$sirket_id, $tur]);
            } else {
                $sifreli = $this->sifrele((string)$fiyat);
                $sql = "UPDATE yatirim_kasasi
                        SET guncel_fiyat_sifreli = ?
                        WHERE sirket_id = ? AND yatirim_adi = ? AND silindi_mi = 0";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([$sifreli, $sirket_id, $tur]);
            }
            $guncellenen += $stmt->rowCount();
        }

        return $guncellenen;
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
            $tutar    = $this->coz($satir['tutar_sifreli']);
            $aciklama = $this->coz($satir['aciklama_sifreli']);
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
        $tutar_sifreli    = $this->sifrele((string)$veri['tutar']);
        $aciklama_sifreli = $this->sifrele(isset($veri['aciklama']) ? $veri['aciklama'] : '');

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
    // AYLIK BİLANÇO
    // ─────────────────────────────────────────────────

    // Tüm bilançoları listele (çözülmüş)
    public function bilanco_listele($sirket_id) {
        $sql = "SELECT id, donem, kar_marji, olusturma_tarihi,
                       donem_basi_stok_sifreli, kesilen_fatura_sifreli,
                       gelen_alis_sifreli, alacaklar_sifreli, borclar_sifreli,
                       banka_nakdi_sifreli, yatirim_birikimi_sifreli,
                       smm_sifreli, sanal_stok_sifreli, net_varlik_sifreli
                FROM ay_kapanislar
                WHERE sirket_id = ? AND silindi_mi = 0
                ORDER BY donem ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        $satirlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $liste = array();
        foreach ($satirlar as $s) {
            $liste[] = array(
                'id'              => $s['id'],
                'donem'           => $s['donem'],
                'kar_marji'       => (float)$s['kar_marji'],
                'donem_basi_stok' => (float)($this->coz($s['donem_basi_stok_sifreli']) ?? 0),
                'kesilen_fatura'  => (float)($this->coz($s['kesilen_fatura_sifreli'])  ?? 0),
                'gelen_alis'      => (float)($this->coz($s['gelen_alis_sifreli'])      ?? 0),
                'alacaklar'       => (float)($this->coz($s['alacaklar_sifreli'])       ?? 0),
                'borclar'         => (float)($this->coz($s['borclar_sifreli'])         ?? 0),
                'banka_nakdi'     => (float)($this->coz($s['banka_nakdi_sifreli'])     ?? 0),
                'yatirim_birikimi'=> (float)($this->coz($s['yatirim_birikimi_sifreli'])  ?? 0),
                'smm'             => (float)($this->coz($s['smm_sifreli'])             ?? 0),
                'sanal_stok'      => (float)($this->coz($s['sanal_stok_sifreli'])      ?? 0),
                'net_varlik'      => (float)($this->coz($s['net_varlik_sifreli'])      ?? 0),
                'olusturma_tarihi'=> $s['olusturma_tarihi'],
            );
        }
        return array('kapanislar' => $liste);
    }

    // Yeni ay kapanışı kaydet (soft-delete edilmiş aynı dönem varsa geri getirir)
    public function bilanco_kaydet($sirket_id, $veri) {
        // Önce aktif (silinmemiş) kayıt var mı kontrol et
        $aktif_kontrol = $this->db->prepare(
            "SELECT id FROM ay_kapanislar WHERE sirket_id = ? AND donem = ? AND silindi_mi = 0"
        );
        $aktif_kontrol->execute([$sirket_id, $veri['donem']]);
        if ($aktif_kontrol->fetch(PDO::FETCH_ASSOC)) {
            throw new RuntimeException('Bu dönem için zaten aktif bir kayıt mevcut: ' . $veri['donem']);
        }

        // Aynı dönem için soft-delete edilmiş kayıt var mı kontrol et
        $kontrol = $this->db->prepare(
            "SELECT id FROM ay_kapanislar WHERE sirket_id = ? AND donem = ? AND silindi_mi = 1"
        );
        $kontrol->execute([$sirket_id, $veri['donem']]);
        $silinen = $kontrol->fetch(PDO::FETCH_ASSOC);

        $kar_marji = isset($veri['kar_marji']) ? (float)$veri['kar_marji'] : 35;
        $sifreli = [
            $this->sifrele((string)($veri['donem_basi_stok']  ?? 0)),
            $this->sifrele((string)($veri['kesilen_fatura']   ?? 0)),
            $this->sifrele((string)($veri['gelen_alis']       ?? 0)),
            $this->sifrele((string)($veri['alacaklar']        ?? 0)),
            $this->sifrele((string)($veri['borclar']          ?? 0)),
            $this->sifrele((string)($veri['banka_nakdi']      ?? 0)),
            $this->sifrele((string)($veri['yatirim_birikimi'] ?? 0)),
            $this->sifrele((string)($veri['smm']              ?? 0)),
            $this->sifrele((string)($veri['sanal_stok']       ?? 0)),
            $this->sifrele((string)($veri['net_varlik']       ?? 0)),
        ];

        if ($silinen) {
            // Soft-delete edilmiş kaydı geri getir ve yeni verilerle güncelle
            $sql = "UPDATE ay_kapanislar
                    SET silindi_mi = 0, kar_marji = ?,
                        donem_basi_stok_sifreli = ?, kesilen_fatura_sifreli = ?,
                        gelen_alis_sifreli = ?, alacaklar_sifreli = ?, borclar_sifreli = ?,
                        banka_nakdi_sifreli = ?, yatirim_birikimi_sifreli = ?,
                        smm_sifreli = ?, sanal_stok_sifreli = ?, net_varlik_sifreli = ?,
                        olusturma_tarihi = NOW()
                    WHERE id = ? AND sirket_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(array_merge([$kar_marji], $sifreli, [(int)$silinen['id'], $sirket_id]));
            return (int)$silinen['id'];
        }

        // Yeni kayıt oluştur
        $sql = "INSERT INTO ay_kapanislar
                (sirket_id, donem, kar_marji,
                 donem_basi_stok_sifreli, kesilen_fatura_sifreli,
                 gelen_alis_sifreli, alacaklar_sifreli, borclar_sifreli,
                 banka_nakdi_sifreli, yatirim_birikimi_sifreli,
                 smm_sifreli, sanal_stok_sifreli, net_varlik_sifreli)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_merge([$sirket_id, $veri['donem'], $kar_marji], $sifreli));
        return (int)$this->db->lastInsertId();
    }

    // Ay kapanışı güncelle
    public function bilanco_guncelle($sirket_id, $bilanco_id, $veri) {
        $sql = "UPDATE ay_kapanislar
                SET kar_marji = ?,
                    donem_basi_stok_sifreli = ?,
                    kesilen_fatura_sifreli = ?,
                    gelen_alis_sifreli = ?,
                    alacaklar_sifreli = ?,
                    borclar_sifreli = ?,
                    banka_nakdi_sifreli = ?,
                    yatirim_birikimi_sifreli = ?,
                    smm_sifreli = ?,
                    sanal_stok_sifreli = ?,
                    net_varlik_sifreli = ?
                WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            isset($veri['kar_marji']) ? (float)$veri['kar_marji'] : 35,
            $this->sifrele((string)($veri['donem_basi_stok']  ?? 0)),
            $this->sifrele((string)($veri['kesilen_fatura']   ?? 0)),
            $this->sifrele((string)($veri['gelen_alis']       ?? 0)),
            $this->sifrele((string)($veri['alacaklar']        ?? 0)),
            $this->sifrele((string)($veri['borclar']          ?? 0)),
            $this->sifrele((string)($veri['banka_nakdi']      ?? 0)),
            $this->sifrele((string)($veri['yatirim_birikimi'] ?? 0)),
            $this->sifrele((string)($veri['smm']              ?? 0)),
            $this->sifrele((string)($veri['sanal_stok']       ?? 0)),
            $this->sifrele((string)($veri['net_varlik']       ?? 0)),
            $bilanco_id,
            $sirket_id,
        ]);
        return $stmt->rowCount() > 0;
    }

    // Ay kapanışı sil (soft delete — bilanço kayıtları arşiv niteliğinde, geri alınabilir)
    public function bilanco_sil($sirket_id, $bilanco_id) {
        $sql = "UPDATE ay_kapanislar SET silindi_mi = 1 WHERE id = ? AND sirket_id = ? AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$bilanco_id, $sirket_id]);
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
        $ortak_sql = "SELECT COUNT(*) as toplam_ortak_hareket FROM ortak_carisi WHERE sirket_id = ? AND silindi_mi = 0";
        $o_stmt = $this->db->prepare($ortak_sql);
        $o_stmt->execute([$sirket_id]);
        $ortak_meta = $o_stmt->fetch(PDO::FETCH_ASSOC);

        // Bu ay giriş/çıkış toplamları — şifreli olduğu için PHP'de çözülür
        $ay_bas = date('Y-m-01');
        $ay_son = date('Y-m-t');
        $ay_sql = "SELECT islem_tipi, tutar_sifreli
                   FROM kasa_hareketler
                   WHERE sirket_id = ? AND silindi_mi = 0
                     AND tarih BETWEEN ? AND ?";
        $ay_stmt = $this->db->prepare($ay_sql);
        $ay_stmt->execute([$sirket_id, $ay_bas, $ay_son]);
        $ay_hareketler = $ay_stmt->fetchAll(PDO::FETCH_ASSOC);

        $aylik_giris = 0.0;
        $aylik_cikis = 0.0;
        foreach ($ay_hareketler as $h) {
            $tutar = $this->coz($h['tutar_sifreli']);
            $tutar_f = ($tutar !== null) ? (float)$tutar : 0.0;
            if ($h['islem_tipi'] === 'giris') {
                $aylik_giris += $tutar_f;
            } else {
                $aylik_cikis += $tutar_f;
            }
        }

        return array(
            'fiziki_kasa_bakiye'   => $fiziki_bakiye,
            'bakiye'               => $fiziki_bakiye,
            'aylik_giris'          => round($aylik_giris, 2),
            'aylik_cikis'          => round($aylik_cikis, 2),
            'toplam_hareket'       => (int)$hareket_meta['toplam_hareket'],
            'giris_adet'           => (int)$hareket_meta['giris_adet'],
            'cikis_adet'           => (int)$hareket_meta['cikis_adet'],
            'aktif_yatirim_adet'   => (int)$yatirim_meta['aktif_yatirim'],
            'toplam_ortak_hareket' => (int)$ortak_meta['toplam_ortak_hareket'],
        );
    }
}
