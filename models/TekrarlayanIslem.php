<?php
// =============================================================
// TekrarlayanIslem.php — Tekrarlayan İşlemler Veritabanı Modeli
// Finans Kalesi SaaS
//
// Kapsam: tekrarlayan_islemler tablosu
// Her ay/hafta/gün otomatik tekrar eden gelir ve gider tanımları
// =============================================================

class TekrarlayanIslem {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ─────────────────────────────────────────────────
    // LİSTELE — Tüm tekrarlayan işlemleri getir
    // ─────────────────────────────────────────────────
    public function listele($sirket_id, $filtreler = []) {
        $sayfa = isset($filtreler['sayfa']) ? max(1, (int)$filtreler['sayfa']) : 1;
        $adet  = isset($filtreler['adet'])  ? min((int)$filtreler['adet'], 200) : 50;
        $offset = ($sayfa - 1) * $adet;

        $kosullar = ['t.sirket_id = :sirket_id', 't.silindi_mi = 0'];
        $parametreler = ['sirket_id' => $sirket_id];

        // Aktiflik filtresi
        if (isset($filtreler['aktif_mi']) && $filtreler['aktif_mi'] !== null) {
            $kosullar[] = 't.aktif_mi = :aktif_mi';
            $parametreler['aktif_mi'] = (int)$filtreler['aktif_mi'];
        }

        // İşlem tipi filtresi
        if (!empty($filtreler['islem_tipi'])) {
            $kosullar[] = 't.islem_tipi = :islem_tipi';
            $parametreler['islem_tipi'] = $filtreler['islem_tipi'];
        }

        // Periyot filtresi
        if (!empty($filtreler['periyot'])) {
            $kosullar[] = 't.periyot = :periyot';
            $parametreler['periyot'] = $filtreler['periyot'];
        }

        $where = implode(' AND ', $kosullar);

        // Toplam kayıt sayısı
        $sql_sayim = "SELECT COUNT(*) as toplam FROM tekrarlayan_islemler t WHERE {$where}";
        $stmt = $this->db->prepare($sql_sayim);
        $stmt->execute($parametreler);
        $toplam = (int)$stmt->fetch(PDO::FETCH_ASSOC)['toplam'];

        // Veri çekme
        $sql = "SELECT t.*, k.ad_soyad as ekleyen_adi
                FROM tekrarlayan_islemler t
                LEFT JOIN kullanicilar k ON k.id = t.ekleyen_id
                WHERE {$where}
                ORDER BY t.aktif_mi DESC, t.sonraki_calistirma ASC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        foreach ($parametreler as $key => $val) {
            $stmt->bindValue(':' . $key, $val);
        }
        $stmt->bindValue(':limit', $adet, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $kayitlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'islemler'    => $kayitlar,
            'toplam'      => $toplam,
            'sayfa'       => $sayfa,
            'toplam_sayfa' => ceil($toplam / $adet),
        ];
    }

    // ─────────────────────────────────────────────────
    // DETAY — Tek kayıt getir
    // ─────────────────────────────────────────────────
    public function detay($sirket_id, $id) {
        $sql = "SELECT t.*, k.ad_soyad as ekleyen_adi
                FROM tekrarlayan_islemler t
                LEFT JOIN kullanicilar k ON k.id = t.ekleyen_id
                WHERE t.id = :id AND t.sirket_id = :sirket_id AND t.silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id, 'sirket_id' => $sirket_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ─────────────────────────────────────────────────
    // OLUŞTUR — Yeni tekrarlayan işlem tanımla
    // ─────────────────────────────────────────────────
    public function olustur($sirket_id, $veri, $ekleyen_id) {
        $sql = "INSERT INTO tekrarlayan_islemler (
                    sirket_id, baslik, islem_tipi, kategori, tutar, doviz_kodu,
                    periyot, tekrar_gunu, baslangic_tarihi, bitis_tarihi,
                    sonraki_calistirma, aktif_mi, aciklama, ekleyen_id
                ) VALUES (
                    :sirket_id, :baslik, :islem_tipi, :kategori, :tutar, :doviz_kodu,
                    :periyot, :tekrar_gunu, :baslangic_tarihi, :bitis_tarihi,
                    :sonraki_calistirma, 1, :aciklama, :ekleyen_id
                )";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'sirket_id'          => $sirket_id,
            'baslik'             => $veri['baslik'],
            'islem_tipi'         => $veri['islem_tipi'],
            'kategori'           => $veri['kategori'] ?? null,
            'tutar'              => $veri['tutar'],
            'doviz_kodu'         => $veri['doviz_kodu'] ?? 'TRY',
            'periyot'            => $veri['periyot'] ?? 'aylik',
            'tekrar_gunu'        => $veri['tekrar_gunu'] ?? null,
            'baslangic_tarihi'   => $veri['baslangic_tarihi'],
            'bitis_tarihi'       => $veri['bitis_tarihi'] ?? null,
            'sonraki_calistirma' => $veri['sonraki_calistirma'],
            'aciklama'           => $veri['aciklama'] ?? null,
            'ekleyen_id'         => $ekleyen_id,
        ]);

        $yeni_id = (int)$this->db->lastInsertId();
        return $this->detay($sirket_id, $yeni_id);
    }

    // ─────────────────────────────────────────────────
    // GÜNCELLE — Mevcut işlemi düzenle
    // ─────────────────────────────────────────────────
    public function guncelle($sirket_id, $id, $veri) {
        // Önce kaydın var olduğunu kontrol et
        $mevcut = $this->detay($sirket_id, $id);
        if (!$mevcut) return false;

        $alanlar = [];
        $parametreler = ['id' => $id, 'sirket_id' => $sirket_id];

        $izinli = ['baslik', 'islem_tipi', 'kategori', 'tutar', 'doviz_kodu',
                   'periyot', 'tekrar_gunu', 'baslangic_tarihi', 'bitis_tarihi',
                   'sonraki_calistirma', 'aciklama'];

        foreach ($izinli as $alan) {
            if (array_key_exists($alan, $veri)) {
                $alanlar[] = "{$alan} = :{$alan}";
                $parametreler[$alan] = $veri[$alan];
            }
        }

        if (empty($alanlar)) return $mevcut;

        $sql = "UPDATE tekrarlayan_islemler SET " . implode(', ', $alanlar) .
               " WHERE id = :id AND sirket_id = :sirket_id AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($parametreler);

        return $this->detay($sirket_id, $id);
    }

    // ─────────────────────────────────────────────────
    // AKTİF / PASİF — Duraklatma ve devam ettirme
    // ─────────────────────────────────────────────────
    public function durum_degistir($sirket_id, $id, $aktif_mi) {
        $sql = "UPDATE tekrarlayan_islemler
                SET aktif_mi = :aktif_mi
                WHERE id = :id AND sirket_id = :sirket_id AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'aktif_mi'  => (int)$aktif_mi,
            'id'        => $id,
            'sirket_id' => $sirket_id,
        ]);
        return $stmt->rowCount() > 0;
    }

    // ─────────────────────────────────────────────────
    // SİL — Soft delete
    // ─────────────────────────────────────────────────
    public function sil($sirket_id, $id) {
        $sql = "UPDATE tekrarlayan_islemler
                SET silindi_mi = 1, silinme_tarihi = NOW()
                WHERE id = :id AND sirket_id = :sirket_id AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id, 'sirket_id' => $sirket_id]);
        return $stmt->rowCount() > 0;
    }

    // ─────────────────────────────────────────────────
    // ÖZET — Dashboard istatistikleri
    // ─────────────────────────────────────────────────
    public function ozet($sirket_id) {
        $sql = "SELECT
                    COUNT(*) as toplam,
                    SUM(CASE WHEN aktif_mi = 1 THEN 1 ELSE 0 END) as aktif,
                    SUM(CASE WHEN aktif_mi = 0 THEN 1 ELSE 0 END) as pasif,
                    SUM(CASE WHEN islem_tipi = 'giris' AND aktif_mi = 1 THEN tutar ELSE 0 END) as aylik_giris,
                    SUM(CASE WHEN islem_tipi = 'cikis' AND aktif_mi = 1 THEN tutar ELSE 0 END) as aylik_cikis,
                    SUM(CASE WHEN sonraki_calistirma <= CURDATE() AND aktif_mi = 1 THEN 1 ELSE 0 END) as bekleyen
                FROM tekrarlayan_islemler
                WHERE sirket_id = :sirket_id AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['sirket_id' => $sirket_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'toplam'      => (int)$row['toplam'],
            'aktif'       => (int)$row['aktif'],
            'pasif'       => (int)$row['pasif'],
            'aylik_giris' => (float)$row['aylik_giris'],
            'aylik_cikis' => (float)$row['aylik_cikis'],
            'bekleyen'    => (int)$row['bekleyen'],
        ];
    }

    // ─────────────────────────────────────────────────
    // CRON — Vadesi gelen işlemleri çalıştır
    // Kasa hareketine otomatik kayıt oluşturur
    // ─────────────────────────────────────────────────
    public function vadesi_gelenleri_calistir() {
        // Bugün veya daha önce çalışması gereken aktif işlemleri bul
        $sql = "SELECT * FROM tekrarlayan_islemler
                WHERE aktif_mi = 1
                  AND silindi_mi = 0
                  AND sonraki_calistirma <= CURDATE()
                  AND (bitis_tarihi IS NULL OR bitis_tarihi >= CURDATE())";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $islemler = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sonuclar = ['basarili' => 0, 'hatali' => 0, 'detaylar' => []];

        foreach ($islemler as $islem) {
            try {
                $this->db->beginTransaction();

                // 1) Kasa hareketine otomatik kayıt ekle (şifreli kolonlar)
                $tutar_sifreli    = SistemKripto::sifrele((string)$islem['tutar']);
                $aciklama_sifreli = SistemKripto::sifrele('[Otomatik] ' . $islem['baslik']);

                $kasa_sql = "INSERT INTO kasa_hareketler (
                                sirket_id, islem_tipi, kategori, tutar_sifreli,
                                aciklama_sifreli, tarih, baglanti_turu, ekleyen_id,
                                kaynak_modul, kaynak_id, odeme_kaynagi
                             ) VALUES (
                                :sirket_id, :islem_tipi, :kategori, :tutar_sifreli,
                                :aciklama_sifreli, CURDATE(), :baglanti_turu, :ekleyen_id,
                                :kaynak_modul, :kaynak_id, :odeme_kaynagi
                             )";
                $kasa_stmt = $this->db->prepare($kasa_sql);
                $kasa_stmt->execute([
                    'sirket_id'        => $islem['sirket_id'],
                    'islem_tipi'       => $islem['islem_tipi'],
                    'kategori'         => $islem['kategori'] ?? 'Diğer',
                    'tutar_sifreli'    => $tutar_sifreli,
                    'aciklama_sifreli' => $aciklama_sifreli,
                    'baglanti_turu'    => 'Tekrarlayan İşlem',
                    'ekleyen_id'       => $islem['ekleyen_id'],
                    'kaynak_modul'     => 'tekrarlayan',
                    'kaynak_id'        => (int)$islem['id'],
                    'odeme_kaynagi'    => $islem['odeme_kaynagi'] ?? 'banka',
                ]);

                // 2) Sonraki çalışma tarihini hesapla
                $sonraki = $this->sonraki_tarih_hesapla(
                    $islem['sonraki_calistirma'],
                    $islem['periyot'],
                    $islem['tekrar_gunu']
                );

                // 3) Tekrarlayan işlem kaydını güncelle
                $guncelle_sql = "UPDATE tekrarlayan_islemler
                                 SET son_calistirma = CURDATE(),
                                     sonraki_calistirma = :sonraki,
                                     toplam_calistirma = toplam_calistirma + 1
                                 WHERE id = :id";
                $guncelle_stmt = $this->db->prepare($guncelle_sql);
                $guncelle_stmt->execute([
                    'sonraki' => $sonraki,
                    'id'      => $islem['id'],
                ]);

                // 4) Bitiş tarihi geçtiyse otomatik kapat
                if ($islem['bitis_tarihi'] && $sonraki > $islem['bitis_tarihi']) {
                    $kapat_sql = "UPDATE tekrarlayan_islemler SET aktif_mi = 0 WHERE id = :id";
                    $kapat_stmt = $this->db->prepare($kapat_sql);
                    $kapat_stmt->execute(['id' => $islem['id']]);
                }

                $this->db->commit();
                $sonuclar['basarili']++;
                $sonuclar['detaylar'][] = [
                    'id'     => $islem['id'],
                    'baslik' => $islem['baslik'],
                    'durum'  => 'basarili',
                ];
            } catch (Exception $e) {
                $this->db->rollBack();
                $sonuclar['hatali']++;
                $sonuclar['detaylar'][] = [
                    'id'     => $islem['id'],
                    'baslik' => $islem['baslik'],
                    'durum'  => 'hatali',
                    'hata'   => $e->getMessage(),
                ];
                error_log('Tekrarlayan islem cron hatasi [ID: ' . $islem['id'] . ']: ' . $e->getMessage());
            }
        }

        return $sonuclar;
    }

    // ─────────────────────────────────────────────────
    // YARDIMCI — Sonraki çalışma tarihini hesapla
    // ─────────────────────────────────────────────────
    private function sonraki_tarih_hesapla($mevcut_tarih, $periyot, $tekrar_gunu = null) {
        $tarih = new DateTime($mevcut_tarih);

        switch ($periyot) {
            case 'gunluk':
                $tarih->modify('+1 day');
                break;

            case 'haftalik':
                $tarih->modify('+1 week');
                break;

            case 'aylik':
                // Ayın belirli günü belirtilmişse ona ayarla
                if ($tekrar_gunu) {
                    $tarih->modify('+1 month');
                    $ay_son_gun = (int)$tarih->format('t');
                    $gun = min($tekrar_gunu, $ay_son_gun);
                    $tarih->setDate(
                        (int)$tarih->format('Y'),
                        (int)$tarih->format('m'),
                        $gun
                    );
                } else {
                    $tarih->modify('+1 month');
                }
                break;

            case 'yillik':
                $tarih->modify('+1 year');
                break;

            default:
                $tarih->modify('+1 month');
                break;
        }

        return $tarih->format('Y-m-d');
    }
}
