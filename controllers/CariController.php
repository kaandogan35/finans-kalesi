<?php
// =============================================================
// CariController.php — Cari Modülü API Kontrol Merkezi
// Finans Kalesi SaaS — Aşama 1.3
//
// KRİTİK NOT: AuthMiddleware::dogrula() JWT payload döndürür.
// Payload yapısı (JWTHelper'dan geliyor):
//   $payload['sub']       → Kullanıcı ID
//   $payload['sirket_id'] → Şirket ID
//   $payload['rol']       → Yetki rolü
//   $payload['tip']       → 'access'
//
// Bu controller'da $payload['sub'] ve $payload['sirket_id'] kullanılıyor.
// =============================================================

class CariController {
    private $cariKart;
    private $cariHareket;
    private $db;

    public function __construct($db) {
        $this->db = $db;
        $this->cariKart = new CariKart($db);
        $this->cariHareket = new CariHareket($db);
    }

    // ─── GET /api/cariler ───
    public function listele($payload) {
        try {
            $adet = isset($_GET['adet']) ? min((int)$_GET['adet'], 500) : 50;
            $filtreler = array(
                'arama'                => isset($_GET['arama']) ? $_GET['arama'] : null,
                'cari_turu'            => isset($_GET['cari_turu']) ? $_GET['cari_turu'] : null,
                'aktif_mi'             => isset($_GET['aktif_mi']) ? $_GET['aktif_mi'] : null,
                'sadece_borclular'     => isset($_GET['sadece_borclular']) ? $_GET['sadece_borclular'] : null,
                'sadece_vadesi_gecmis' => isset($_GET['sadece_vadesi_gecmis']) ? $_GET['sadece_vadesi_gecmis'] : null,
                'siralama'             => isset($_GET['siralama']) ? $_GET['siralama'] : 'son_islem',
                'sayfa'                => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'                 => $adet,
            );

            $sonuc = $this->cariKart->listele($payload['sirket_id'], $filtreler);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Cari listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cari listesi alinamadi');
        }
    }

    // ─── POST /api/cariler ───
    public function olustur($payload, $girdi) {
        try {
            $veri = $girdi;

            if (empty($veri['cari_adi'])) {
                Response::dogrulama_hatasi(array('cari_adi' => 'Cari adi zorunludur'));
                return;
            }

            $gecerli_turler = array('musteri', 'tedarikci', 'her_ikisi');
            if (!empty($veri['cari_turu']) && !in_array($veri['cari_turu'], $gecerli_turler)) {
                Response::dogrulama_hatasi(array('cari_turu' => 'Geçerli değerler: musteri, tedarikci, her_ikisi'));
                return;
            }

            // Plan sınırı kontrolü
            SinirKontrol::kontrol($payload, 'cari');

            $cari = $this->cariKart->olustur($payload['sirket_id'], $veri);
            Response::basarili($cari, 'Cari kart olusturuldu', 201);
        } catch (Exception $e) {
            error_log('Cari olustur hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cari kart olusturulamadi');
        }
    }

    // ─── GET /api/cariler/ozet ───
    public function ozet($payload) {
        try {
            $istatistikler = $this->cariKart->ozet_istatistikler($payload['sirket_id']);
            Response::basarili($istatistikler);
        } catch (Exception $e) {
            error_log('Cari ozet hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Istatistikler alinamadi');
        }
    }

    // ─── GET /api/cariler/{id} ───
    public function detay($payload, $cari_id) {
        try {
            $cari = $this->cariKart->getir($payload['sirket_id'], $cari_id);

            if (!$cari) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            // Finansal özet: odeme_takip'ten açık ve vadesi geçmiş sayıları
            $stmt = $this->db->prepare(
                "SELECT
                    COUNT(CASE WHEN durum = 'bekliyor' THEN 1 END) as acik_odeme_sayisi,
                    COUNT(CASE WHEN durum = 'bekliyor' AND soz_tarihi < CURDATE() THEN 1 END) as vadesi_gecmis_odeme_sayisi
                 FROM odeme_takip
                 WHERE cari_id = ? AND sirket_id = ? AND silindi_mi = 0"
            );
            $stmt->execute([$cari_id, $payload['sirket_id']]);
            $odemeOzet = $stmt->fetch(PDO::FETCH_ASSOC);

            $cari['finansal_ozet'] = array(
                'toplam_alacak'              => (float)($cari['toplam_alacak'] ?? 0),
                'toplam_borc'                => (float)($cari['toplam_borc'] ?? 0),
                'net_bakiye'                 => (float)($cari['bakiye'] ?? 0),
                'acik_odeme_sayisi'          => (int)($odemeOzet['acik_odeme_sayisi'] ?? 0),
                'vadesi_gecmis_odeme_sayisi' => (int)($odemeOzet['vadesi_gecmis_odeme_sayisi'] ?? 0),
            );

            Response::basarili($cari);
        } catch (Exception $e) {
            error_log('Cari detay hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cari kart detayi alinamadi');
        }
    }

    // ─── GET /api/cariler/{id}/yaslandirma ───
    public function yaslandirma($payload, $cari_id) {
        try {
            if (!$this->cariKart->var_mi($payload['sirket_id'], $cari_id)) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $stmt = $this->db->prepare(
                "SELECT
                    SUM(CASE WHEN DATEDIFF(CURDATE(), soz_tarihi) BETWEEN 1 AND 30 THEN 1 ELSE 0 END)    AS g1_30_sayi,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), soz_tarihi) BETWEEN 1 AND 30 THEN tutar ELSE 0 END) AS g1_30_tutar,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), soz_tarihi) BETWEEN 31 AND 60 THEN 1 ELSE 0 END)   AS g31_60_sayi,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), soz_tarihi) BETWEEN 31 AND 60 THEN tutar ELSE 0 END) AS g31_60_tutar,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), soz_tarihi) BETWEEN 61 AND 90 THEN 1 ELSE 0 END)   AS g61_90_sayi,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), soz_tarihi) BETWEEN 61 AND 90 THEN tutar ELSE 0 END) AS g61_90_tutar,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), soz_tarihi) > 90 THEN 1 ELSE 0 END)                 AS g90p_sayi,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), soz_tarihi) > 90 THEN tutar ELSE 0 END)              AS g90p_tutar
                 FROM odeme_takip
                 WHERE cari_id = ? AND sirket_id = ? AND durum = 'bekliyor'
                   AND soz_tarihi < CURDATE() AND silindi_mi = 0"
            );
            $stmt->execute([$cari_id, $payload['sirket_id']]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            Response::basarili(array(
                'g0_30'  => array('sayi' => (int)($row['g1_30_sayi']  ?? 0), 'tutar' => (float)($row['g1_30_tutar']  ?? 0)),
                'g31_60' => array('sayi' => (int)($row['g31_60_sayi'] ?? 0), 'tutar' => (float)($row['g31_60_tutar'] ?? 0)),
                'g61_90' => array('sayi' => (int)($row['g61_90_sayi'] ?? 0), 'tutar' => (float)($row['g61_90_tutar'] ?? 0)),
                'g90p'   => array('sayi' => (int)($row['g90p_sayi']   ?? 0), 'tutar' => (float)($row['g90p_tutar']   ?? 0)),
            ));
        } catch (Exception $e) {
            error_log('Cari yaslandirma hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Yaslandirma verisi alinamadi');
        }
    }

    // ─── POST /api/cariler/toplu ───
    public function topluYukle($payload) {
        try {
            if (empty($_FILES['dosya']) || $_FILES['dosya']['error'] !== UPLOAD_ERR_OK) {
                Response::hata('CSV dosyasi yuklenemedi', 400);
                return;
            }

            $dosya = $_FILES['dosya']['tmp_name'];
            $handle = fopen($dosya, 'r');
            if (!$handle) {
                Response::hata('Dosya acilamadi', 400);
                return;
            }

            // İlk satır başlık
            $basliklar = fgetcsv($handle, 0, ',');
            if (!$basliklar) {
                fclose($handle);
                Response::hata('Dosya bos veya gecersiz', 400);
                return;
            }

            // Beklenen sütun adları (küçük harf, trim)
            $basliklar = array_map(function($b) { return mb_strtolower(trim($b)); }, $basliklar);

            $basarili_sayisi = 0;
            $hatali_sayisi   = 0;
            $hatali_satirlar = array();
            $satirNo = 1;

            while (($satir = fgetcsv($handle, 0, ',')) !== false) {
                $satirNo++;
                if (count($satir) < count($basliklar)) {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = array('satir' => $satirNo, 'hata' => 'Eksik sutun sayisi');
                    continue;
                }

                $veri = array_combine($basliklar, array_map('trim', $satir));

                if (empty($veri['cari_adi'])) {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = array('satir' => $satirNo, 'hata' => 'cari_adi zorunludur');
                    continue;
                }

                $gecerli_turler = array('musteri', 'tedarikci', 'her_ikisi');
                $cari_turu = !empty($veri['cari_turu']) ? $veri['cari_turu'] : 'musteri';
                if (!in_array($cari_turu, $gecerli_turler)) {
                    $cari_turu = 'musteri';
                }

                try {
                    // Plan sınırı kontrolü (her kayıt için)
                    SinirKontrol::kontrol($payload, 'cari');

                    $this->cariKart->olustur($payload['sirket_id'], array(
                        'cari_adi'    => $veri['cari_adi'],
                        'cari_turu'   => $cari_turu,
                        'vergi_no'    => $veri['vergi_no']    ?? null,
                        'telefon'     => $veri['telefon']     ?? null,
                        'email'       => $veri['email']       ?? null,
                        'adres'       => $veri['adres']       ?? null,
                        'yetkili_kisi'=> $veri['yetkili_kisi']?? null,
                    ));
                    $basarili_sayisi++;
                } catch (Exception $kayitHata) {
                    $hatali_sayisi++;
                    $hatali_satirlar[] = array(
                        'satir' => $satirNo,
                        'hata'  => $kayitHata->getMessage(),
                    );
                }
            }

            fclose($handle);

            Response::basarili(array(
                'basarili_sayisi' => $basarili_sayisi,
                'hatali_sayisi'   => $hatali_sayisi,
                'hatali_satirlar' => $hatali_satirlar,
            ), "$basarili_sayisi kayit yuklendi");
        } catch (Exception $e) {
            error_log('Cari toplu yukle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Toplu yukleme basarisiz');
        }
    }

    // ─── PUT /api/cariler/{id} ───
    public function guncelle($payload, $cari_id, $girdi) {
        try {
            $mevcut = $this->cariKart->getir($payload['sirket_id'], $cari_id);
            if (!$mevcut) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $veri = $girdi;

            if (!empty($veri['cari_turu'])) {
                $gecerli_turler = array('musteri', 'tedarikci', 'her_ikisi');
                if (!in_array($veri['cari_turu'], $gecerli_turler)) {
                    Response::dogrulama_hatasi(array('cari_turu' => 'Geçersiz cari türü'));
                    return;
                }
            }

            $cari = $this->cariKart->guncelle($payload['sirket_id'], $cari_id, $veri);

            if (!$cari) {
                Response::hata('Guncellenecek alan bulunamadi', 422);
                return;
            }

            Response::basarili($cari, 'Cari kart guncellendi');
        } catch (Exception $e) {
            error_log('Cari guncelle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cari kart guncellenemedi');
        }
    }

    // ─── DELETE /api/cariler/{id} ───
    public function sil($payload, $cari_id) {
        try {
            $mevcut = $this->cariKart->getir($payload['sirket_id'], $cari_id);
            if (!$mevcut) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $silindi = $this->cariKart->sil($payload['sirket_id'], $cari_id);

            if ($silindi) {
                Response::basarili(null, 'Cari kart silindi (pasiflestirildi)');
            } else {
                Response::sunucu_hatasi('Cari kart silinemedi');
            }
        } catch (Exception $e) {
            error_log('Cari sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cari kart silinemedi');
        }
    }

    // ─── GET /api/cariler/{id}/hareketler ───
    public function hareketler_listele($payload, $cari_id) {
        try {
            if (!$this->cariKart->var_mi($payload['sirket_id'], $cari_id)) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $adet = isset($_GET['adet']) ? min((int)$_GET['adet'], 500) : 50;
            $filtreler = array(
                'islem_tipi'       => isset($_GET['islem_tipi']) ? $_GET['islem_tipi'] : null,
                'baslangic_tarihi' => isset($_GET['baslangic_tarihi']) ? $_GET['baslangic_tarihi'] : null,
                'bitis_tarihi'     => isset($_GET['bitis_tarihi']) ? $_GET['bitis_tarihi'] : null,
                'belge_no'         => isset($_GET['belge_no']) ? $_GET['belge_no'] : null,
                'sayfa'            => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'             => $adet,
            );

            $sonuc = $this->cariHareket->listele($payload['sirket_id'], $cari_id, $filtreler);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Hareket listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Hareket listesi alinamadi');
        }
    }

    // ─── POST /api/cariler/{id}/hareketler ───
    public function hareket_ekle($payload, $cari_id, $girdi) {
        try {
            if (!$this->cariKart->var_mi($payload['sirket_id'], $cari_id)) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $veri = $girdi;

            // Zorunlu alan kontrolleri
            if (empty($veri['islem_tipi'])) {
                Response::dogrulama_hatasi(array('islem_tipi' => 'İşlem tipi zorunludur (borclandirma veya tahsilat)'));
                return;
            }

            $gecerli_tipler = array('borclandirma', 'tahsilat');
            if (!in_array($veri['islem_tipi'], $gecerli_tipler)) {
                Response::dogrulama_hatasi(array('islem_tipi' => 'Geçerli değerler: borclandirma, tahsilat'));
                return;
            }

            if (!isset($veri['tutar']) || (float)$veri['tutar'] <= 0) {
                Response::dogrulama_hatasi(array('tutar' => 'Tutar sıfırdan büyük olmalıdır'));
                return;
            }

            // Doviz kodu kontrolu
            if (!empty($veri['doviz_kodu'])) {
                $gecerli_dovizler = array('TRY', 'USD', 'EUR', 'GBP');
                if (!in_array(strtoupper($veri['doviz_kodu']), $gecerli_dovizler)) {
                    Response::dogrulama_hatasi(array('doviz_kodu' => 'Geçerli: TRY, USD, EUR, GBP'));
                    return;
                }
                $veri['doviz_kodu'] = strtoupper($veri['doviz_kodu']);
            }

            // Doviz secilmis ama kur girilmemisse
            if (!empty($veri['doviz_kodu']) && $veri['doviz_kodu'] !== 'TRY' && empty($veri['kur'])) {
                Response::dogrulama_hatasi(array('kur' => 'Döviz seçildiğinde kur değeri zorunludur'));
                return;
            }

            // Hareket ekle — $payload['sub'] = kullanici ID
            $hareket_id = $this->cariHareket->ekle(
                $payload['sirket_id'],
                $cari_id,
                $veri,
                $payload['sub']
            );

            // Bakiyeyi otomatik guncelle
            $bakiye = $this->cariKart->bakiye_guncelle($payload['sirket_id'], $cari_id);

            // Eklenen hareketi dondur
            $hareket = $this->cariHareket->getir($payload['sirket_id'], $hareket_id);

            Response::basarili(array(
                'hareket'       => $hareket,
                'guncel_bakiye' => $bakiye
            ), 'Hareket kaydedildi', 201);
        } catch (Exception $e) {
            error_log('Hareket ekle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Hareket eklenemedi');
        }
    }

    // ─── PUT /api/cariler/{id}/hareketler/{hid} ───
    public function hareket_guncelle($payload, $cari_id, $hareket_id, $girdi) {
        try {
            if (!$this->cariKart->var_mi($payload['sirket_id'], $cari_id)) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $veri = $girdi;

            if (!empty($veri['islem_tipi'])) {
                $gecerli_tipler = array('borclandirma', 'tahsilat');
                if (!in_array($veri['islem_tipi'], $gecerli_tipler)) {
                    Response::dogrulama_hatasi(array('islem_tipi' => 'Geçersiz işlem tipi'));
                    return;
                }
            }

            if (isset($veri['tutar']) && (float)$veri['tutar'] <= 0) {
                Response::dogrulama_hatasi(array('tutar' => 'Tutar sıfırdan büyük olmalıdır'));
                return;
            }

            $guncellenen_cari_id = $this->cariHareket->guncelle($payload['sirket_id'], $hareket_id, $veri);

            if ($guncellenen_cari_id === false) {
                Response::bulunamadi('Hareket bulunamadi veya guncellenemedi');
                return;
            }

            $bakiye = $this->cariKart->bakiye_guncelle($payload['sirket_id'], $guncellenen_cari_id);
            $hareket = $this->cariHareket->getir($payload['sirket_id'], $hareket_id);

            Response::basarili(array(
                'hareket'       => $hareket,
                'guncel_bakiye' => $bakiye
            ), 'Hareket guncellendi');
        } catch (Exception $e) {
            error_log('Hareket guncelle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Hareket guncellenemedi');
        }
    }

    // ─── DELETE /api/cariler/{id}/hareketler/{hid} ───
    public function hareket_sil($payload, $cari_id, $hareket_id) {
        try {
            if (!$this->cariKart->var_mi($payload['sirket_id'], $cari_id)) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $silinen_cari_id = $this->cariHareket->sil($payload['sirket_id'], $hareket_id);

            if ($silinen_cari_id === false) {
                Response::bulunamadi('Hareket bulunamadi');
                return;
            }

            $bakiye = $this->cariKart->bakiye_guncelle($payload['sirket_id'], $silinen_cari_id);

            Response::basarili(array(
                'guncel_bakiye' => $bakiye
            ), 'Hareket silindi, bakiye guncellendi');
        } catch (Exception $e) {
            error_log('Hareket sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Hareket silinemedi');
        }
    }
}