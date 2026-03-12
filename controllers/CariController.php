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

    public function __construct($db) {
        $this->cariKart = new CariKart($db);
        $this->cariHareket = new CariHareket($db);
    }

    // ─── GET /api/cariler ───
    public function listele($payload) {
        try {
            $filtreler = array(
                'arama'           => isset($_GET['arama']) ? $_GET['arama'] : null,
                'cari_turu'       => isset($_GET['cari_turu']) ? $_GET['cari_turu'] : null,
                'aktif_mi'        => isset($_GET['aktif_mi']) ? $_GET['aktif_mi'] : null,
                'sadece_borclular'=> isset($_GET['sadece_borclular']) ? $_GET['sadece_borclular'] : null,
                'siralama'        => isset($_GET['siralama']) ? $_GET['siralama'] : 'son_islem',
                'sayfa'           => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'            => isset($_GET['adet']) ? $_GET['adet'] : 50,
            );

            $sonuc = $this->cariKart->listele($payload['sirket_id'], $filtreler);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Cari listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cari listesi alinamadi');
        }
    }

    // ─── POST /api/cariler ───
    public function olustur($payload) {
        try {
            $veri = json_decode(file_get_contents('php://input'), true);

            if (empty($veri['cari_adi'])) {
                Response::dogrulama_hatasi(array('cari_adi' => 'Cari adi zorunludur'));
                return;
            }

            $gecerli_turler = array('musteri', 'tedarikci', 'her_ikisi');
            if (!empty($veri['cari_turu']) && !in_array($veri['cari_turu'], $gecerli_turler)) {
                Response::dogrulama_hatasi(array('cari_turu' => 'Gecerli degerler: musteri, tedarikci, her_ikisi'));
                return;
            }

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

            Response::basarili($cari);
        } catch (Exception $e) {
            error_log('Cari detay hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cari kart detayi alinamadi');
        }
    }

    // ─── PUT /api/cariler/{id} ───
    public function guncelle($payload, $cari_id) {
        try {
            $mevcut = $this->cariKart->getir($payload['sirket_id'], $cari_id);
            if (!$mevcut) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $veri = json_decode(file_get_contents('php://input'), true);

            if (!empty($veri['cari_turu'])) {
                $gecerli_turler = array('musteri', 'tedarikci', 'her_ikisi');
                if (!in_array($veri['cari_turu'], $gecerli_turler)) {
                    Response::dogrulama_hatasi(array('cari_turu' => 'Gecersiz cari turu'));
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

            $filtreler = array(
                'islem_tipi'       => isset($_GET['islem_tipi']) ? $_GET['islem_tipi'] : null,
                'baslangic_tarihi' => isset($_GET['baslangic_tarihi']) ? $_GET['baslangic_tarihi'] : null,
                'bitis_tarihi'     => isset($_GET['bitis_tarihi']) ? $_GET['bitis_tarihi'] : null,
                'belge_no'         => isset($_GET['belge_no']) ? $_GET['belge_no'] : null,
                'sayfa'            => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'             => isset($_GET['adet']) ? $_GET['adet'] : 50,
            );

            $sonuc = $this->cariHareket->listele($payload['sirket_id'], $cari_id, $filtreler);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Hareket listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Hareket listesi alinamadi');
        }
    }

    // ─── POST /api/cariler/{id}/hareketler ───
    public function hareket_ekle($payload, $cari_id) {
        try {
            if (!$this->cariKart->var_mi($payload['sirket_id'], $cari_id)) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $veri = json_decode(file_get_contents('php://input'), true);

            // Zorunlu alan kontrolleri
            if (empty($veri['islem_tipi'])) {
                Response::dogrulama_hatasi(array('islem_tipi' => 'Islem tipi zorunludur (borclandirma veya tahsilat)'));
                return;
            }

            $gecerli_tipler = array('borclandirma', 'tahsilat');
            if (!in_array($veri['islem_tipi'], $gecerli_tipler)) {
                Response::dogrulama_hatasi(array('islem_tipi' => 'Gecerli degerler: borclandirma, tahsilat'));
                return;
            }

            if (!isset($veri['tutar']) || (float)$veri['tutar'] <= 0) {
                Response::dogrulama_hatasi(array('tutar' => 'Tutar sifirdan buyuk olmalidir'));
                return;
            }

            // Doviz kodu kontrolu
            if (!empty($veri['doviz_kodu'])) {
                $gecerli_dovizler = array('TRY', 'USD', 'EUR', 'GBP');
                if (!in_array(strtoupper($veri['doviz_kodu']), $gecerli_dovizler)) {
                    Response::dogrulama_hatasi(array('doviz_kodu' => 'Gecerli: TRY, USD, EUR, GBP'));
                    return;
                }
                $veri['doviz_kodu'] = strtoupper($veri['doviz_kodu']);
            }

            // Doviz secilmis ama kur girilmemisse
            if (!empty($veri['doviz_kodu']) && $veri['doviz_kodu'] !== 'TRY' && empty($veri['kur'])) {
                Response::dogrulama_hatasi(array('kur' => 'Doviz secildiginde kur degeri zorunludur'));
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
    public function hareket_guncelle($payload, $cari_id, $hareket_id) {
        try {
            if (!$this->cariKart->var_mi($payload['sirket_id'], $cari_id)) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $veri = json_decode(file_get_contents('php://input'), true);

            if (!empty($veri['islem_tipi'])) {
                $gecerli_tipler = array('borclandirma', 'tahsilat');
                if (!in_array($veri['islem_tipi'], $gecerli_tipler)) {
                    Response::dogrulama_hatasi(array('islem_tipi' => 'Gecersiz islem tipi'));
                    return;
                }
            }

            if (isset($veri['tutar']) && (float)$veri['tutar'] <= 0) {
                Response::dogrulama_hatasi(array('tutar' => 'Tutar sifirdan buyuk olmalidir'));
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