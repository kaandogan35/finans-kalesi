<?php
// =============================================================
// KasaController.php — Varlık & Kasa API Kontrol Merkezi
// Finans Kalesi SaaS — Aşama 1.9
//
// Her istek: JWT doğrulama zorunlu.
// =============================================================

class KasaController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ─── GET /api/kasa/ozet ───
    public function ozet($payload) {
        try {
            $kasa = new Kasa($this->db);
            $sonuc = $kasa->ozet($payload['sirket_id']);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Kasa ozet hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Ozet alinamadi');
        }
    }

    // ─── GET /api/kasa/hareketler ───
    public function hareketler_listele($payload) {
        try {
            $plan = isset($payload['plan']) ? $payload['plan'] : 'ucretsiz';
            $gecmis_kisitli = false;

            // Ücretsiz planda geçmiş verisi son 2 ay ile sınırlı
            $baslangic = isset($_GET['baslangic_tarihi']) ? $_GET['baslangic_tarihi'] : null;
            if ($plan === 'ucretsiz') {
                $sinir = date('Y-m-d', strtotime('-2 months'));
                if ($baslangic === null || $baslangic < $sinir) {
                    $baslangic = $sinir;
                    $gecmis_kisitli = true;
                }
            }

            $filtreler = array(
                'islem_tipi'       => isset($_GET['islem_tipi']) ? $_GET['islem_tipi'] : null,
                'kategori'         => isset($_GET['kategori']) ? $_GET['kategori'] : null,
                'baslangic_tarihi' => $baslangic,
                'bitis_tarihi'     => isset($_GET['bitis_tarihi']) ? $_GET['bitis_tarihi'] : null,
                'sayfa'            => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'             => isset($_GET['adet']) ? $_GET['adet'] : 50,
            );

            $kasa = new Kasa($this->db);
            $sonuc = $kasa->hareketler_listele($payload['sirket_id'], $filtreler);
            $sonuc['gecmis_kisitli'] = $gecmis_kisitli;
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Kasa hareketler_listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Hareketler alinamadi');
        }
    }

    // ─── POST /api/kasa/hareketler ───
    public function hareket_ekle($payload, $girdi) {
        try {
            $veri = $girdi;

            if (empty($veri['islem_tipi'])) {
                Response::dogrulama_hatasi(array('islem_tipi' => 'Islem tipi zorunludur (giris veya cikis)'));
                return;
            }

            if (!in_array($veri['islem_tipi'], array('giris', 'cikis'))) {
                Response::dogrulama_hatasi(array('islem_tipi' => 'Gecerli degerler: giris, cikis'));
                return;
            }

            if (!isset($veri['tutar']) || (float)$veri['tutar'] <= 0) {
                Response::dogrulama_hatasi(array('tutar' => 'Tutar sifirdan buyuk olmalidir'));
                return;
            }

            $kasa = new Kasa($this->db);
            $sonuc = $kasa->hareket_ekle($payload['sirket_id'], $veri, $payload['sub']);

            Response::basarili($sonuc, 'Hareket kaydedildi', 201);
        } catch (Exception $e) {
            error_log('Kasa hareket_ekle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Hareket eklenemedi');
        }
    }

    // ─── DELETE /api/kasa/hareketler/{id} ───
    public function hareket_sil($payload, $hareket_id) {
        try {
            $kasa = new Kasa($this->db);
            $yeni_bakiye = $kasa->hareket_sil($payload['sirket_id'], $hareket_id);

            if ($yeni_bakiye === false) {
                Response::bulunamadi('Hareket bulunamadi');
                return;
            }

            Response::basarili(array('yeni_bakiye' => $yeni_bakiye), 'Hareket silindi, bakiye guncellendi');
        } catch (Exception $e) {
            error_log('Kasa hareket_sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Hareket silinemedi');
        }
    }

    // ─── GET /api/kasa/yatirimlar ───
    public function yatirimlar_listele($payload) {
        try {
            $kasa = new Kasa($this->db);
            $yatirimlar = $kasa->yatirimlar_listele($payload['sirket_id']);
            Response::basarili(array('yatirimlar' => $yatirimlar));
        } catch (Exception $e) {
            error_log('Kasa yatirimlar_listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Yatirimlar alinamadi');
        }
    }

    // ─── POST /api/kasa/yatirimlar ───
    public function yatirim_ekle($payload, $girdi) {
        try {
            $veri = $girdi;

            // Frontend alan adı eşleştirmesi: tur → yatirim_adi, varlık_tipi → kategori
            if (empty($veri['yatirim_adi']) && !empty($veri['tur'])) {
                $veri['yatirim_adi'] = $veri['tur'];
            }
            if (empty($veri['kategori']) && !empty($veri['varlık_tipi'])) {
                $veri['kategori'] = $veri['varlık_tipi'];
            }

            if (empty($veri['yatirim_adi'])) {
                Response::dogrulama_hatasi(array('yatirim_adi' => 'Yatirim adi zorunludur (ornek: Altin 22 Ayar, Dolar, BIM Hissesi)'));
                return;
            }

            if (!isset($veri['miktar']) || (float)$veri['miktar'] <= 0) {
                Response::dogrulama_hatasi(array('miktar' => 'Miktar sifirdan buyuk olmalidir'));
                return;
            }

            $kasa = new Kasa($this->db);
            $yatirim_id = $kasa->yatirim_ekle($payload['sirket_id'], $veri);

            Response::basarili(array('id' => $yatirim_id), 'Yatirim kaydedildi', 201);
        } catch (Exception $e) {
            error_log('Kasa yatirim_ekle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Yatirim eklenemedi');
        }
    }

    // ─── PUT /api/kasa/yatirimlar/{id} ───
    public function yatirim_guncelle($payload, $yatirim_id, $girdi) {
        try {
            $veri = $girdi;

            // Frontend alan adı eşleştirmesi
            if (isset($veri['tur']) && !isset($veri['yatirim_adi'])) {
                $veri['yatirim_adi'] = $veri['tur'];
            }
            if (isset($veri['varlık_tipi']) && !isset($veri['kategori'])) {
                $veri['kategori'] = $veri['varlık_tipi'];
            }

            $kasa = new Kasa($this->db);
            $basarili = $kasa->yatirim_guncelle($payload['sirket_id'], $yatirim_id, $veri);

            if (!$basarili) {
                Response::bulunamadi('Yatirim bulunamadi veya guncellenemedi');
                return;
            }

            Response::basarili(null, 'Yatirim guncellendi');
        } catch (Exception $e) {
            error_log('Kasa yatirim_guncelle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Yatirim guncellenemedi');
        }
    }

    // ─── DELETE /api/kasa/yatirimlar/{id} ───
    public function yatirim_sil($payload, $yatirim_id) {
        try {
            $kasa = new Kasa($this->db);
            $basarili = $kasa->yatirim_sil($payload['sirket_id'], $yatirim_id);

            if (!$basarili) {
                Response::bulunamadi('Yatirim bulunamadi');
                return;
            }

            Response::basarili(null, 'Yatirim silindi');
        } catch (Exception $e) {
            error_log('Kasa yatirim_sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Yatirim silinemedi');
        }
    }

    // ─── GET /api/kasa/ortaklar ───
    public function ortaklar_listele($payload) {
        try {
            $filtreler = array(
                'ortak_adi'  => isset($_GET['ortak_adi']) ? $_GET['ortak_adi'] : null,
                'islem_tipi' => isset($_GET['islem_tipi']) ? $_GET['islem_tipi'] : null,
                'sayfa'      => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'       => isset($_GET['adet']) ? $_GET['adet'] : 50,
            );

            $kasa = new Kasa($this->db);
            $sonuc = $kasa->ortaklar_listele($payload['sirket_id'], $filtreler);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Kasa ortaklar_listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Ortak hareketleri alinamadi');
        }
    }

    // ─── POST /api/kasa/ortaklar ───
    public function ortak_hareket_ekle($payload, $girdi) {
        try {
            $veri = $girdi;

            if (empty($veri['ortak_adi'])) {
                Response::dogrulama_hatasi(array('ortak_adi' => 'Ortak adi zorunludur'));
                return;
            }

            if (empty($veri['islem_tipi']) || !in_array($veri['islem_tipi'], array('para_girisi', 'para_cikisi'))) {
                Response::dogrulama_hatasi(array('islem_tipi' => 'Gecerli degerler: para_girisi, para_cikisi'));
                return;
            }

            if (!isset($veri['tutar']) || (float)$veri['tutar'] <= 0) {
                Response::dogrulama_hatasi(array('tutar' => 'Tutar sifirdan buyuk olmalidir'));
                return;
            }

            $kasa = new Kasa($this->db);
            $id = $kasa->ortak_hareket_ekle($payload['sirket_id'], $veri, $payload['sub']);

            Response::basarili(array('id' => $id), 'Ortak hareketi kaydedildi', 201);
        } catch (Exception $e) {
            error_log('Kasa ortak_hareket_ekle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Ortak hareketi eklenemedi');
        }
    }

    // ─── DELETE /api/kasa/ortaklar/{id} ───
    public function ortak_hareket_sil($payload, $hareket_id) {
        try {
            $kasa = new Kasa($this->db);
            $basarili = $kasa->ortak_hareket_sil($payload['sirket_id'], $hareket_id);

            if (!$basarili) {
                Response::bulunamadi('Hareket bulunamadi');
                return;
            }

            Response::basarili(null, 'Ortak hareketi silindi');
        } catch (Exception $e) {
            error_log('Kasa ortak_hareket_sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Ortak hareketi silinemedi');
        }
    }

    // ─── GET /api/kasa/bilanco ───
    public function bilanco_listele($payload) {
        try {
            $kasa = new Kasa($this->db);
            $sonuc = $kasa->bilanco_listele($payload['sirket_id']);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Kasa bilanco_listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Bilancolar alinamadi');
        }
    }

    // ─── POST /api/kasa/bilanco ───
    public function bilanco_kaydet($payload, $girdi) {
        try {
            if (empty($girdi['donem'])) {
                Response::dogrulama_hatasi(array('donem' => 'Donem zorunludur'));
                return;
            }

            $kasa = new Kasa($this->db);
            $id = $kasa->bilanco_kaydet($payload['sirket_id'], $girdi);

            Response::basarili(array('id' => $id), 'Ay kapanisi kaydedildi', 201);
        } catch (Exception $e) {
            error_log('Kasa bilanco_kaydet hatasi: ' . $e->getMessage());
            // Muhtemelen UNIQUE constraint ihlali (aynı dönem tekrar)
            if (strpos($e->getMessage(), 'Duplicate') !== false) {
                Response::hata('Bu donem icin zaten kayit var', 409);
            } else {
                Response::sunucu_hatasi('Bilanco kaydedilemedi');
            }
        }
    }

    // ─── PUT /api/kasa/bilanco/{id} ───
    public function bilanco_guncelle($payload, $bilanco_id, $girdi) {
        try {
            $kasa = new Kasa($this->db);
            $basarili = $kasa->bilanco_guncelle($payload['sirket_id'], $bilanco_id, $girdi);

            if (!$basarili) {
                Response::bulunamadi('Bilanco bulunamadi');
                return;
            }

            Response::basarili(null, 'Bilanco guncellendi');
        } catch (Exception $e) {
            error_log('Kasa bilanco_guncelle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Bilanco guncellenemedi');
        }
    }

    // ─── DELETE /api/kasa/bilanco/{id} ───
    public function bilanco_sil($payload, $bilanco_id) {
        try {
            $kasa = new Kasa($this->db);
            $basarili = $kasa->bilanco_sil($payload['sirket_id'], $bilanco_id);

            if (!$basarili) {
                Response::bulunamadi('Bilanco bulunamadi');
                return;
            }

            Response::basarili(null, 'Bilanco silindi');
        } catch (Exception $e) {
            error_log('Kasa bilanco_sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Bilanco silinemedi');
        }
    }
}
