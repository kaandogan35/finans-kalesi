<?php
// =============================================================
// KasaController.php — Varlık & Kasa API Kontrol Merkezi
// Finans Kalesi SaaS — Aşama 1.9
//
// Her istek: JWT doğrulama + X-Kasa-Sifre header zorunlu
// (sifre-kur ve sifre-dogrula endpoint'leri hariç)
//
// UYARI: Kasa şifresi loglanmaz, response'ta gönderilmez!
// =============================================================

class KasaController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Kasa şifresini header'dan al ve KriptoHelper oluştur
    // Şifre yanlışsa null döner
    private function kripto_olustur($sirket_id, $kasa_sifre) {
        if (empty($kasa_sifre)) {
            return null;
        }

        // Geçici Kasa nesnesi (kripto olmadan) — sadece sifre_bilgileri_al için
        $gecici = new Kasa($this->db, null);
        $bilgiler = $gecici->sifre_bilgileri_al($sirket_id);

        if (!$bilgiler || empty($bilgiler['kasa_sifre_hash'])) {
            return null; // Şifre kurulmamış
        }

        if (!KriptoHelper::sifre_dogrula($kasa_sifre, $bilgiler['kasa_sifre_hash'], $bilgiler['kasa_salt'])) {
            return null; // Yanlış şifre
        }

        return new KriptoHelper($kasa_sifre, $bilgiler['kasa_salt']);
    }

    // X-Kasa-Sifre header'ını al
    private function kasa_sifre_al() {
        if (isset($_SERVER['HTTP_X_KASA_SIFRE'])) {
            return $_SERVER['HTTP_X_KASA_SIFRE'];
        }
        // Apache bazı header'ları farklı isimlendirir
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['X-Kasa-Sifre'])) return $headers['X-Kasa-Sifre'];
            if (isset($headers['x-kasa-sifre'])) return $headers['x-kasa-sifre'];
        }
        return null;
    }

    // ─── POST /api/kasa/sifre-kur ───
    // İlk kez kasa şifresi oluştur
    public function sifre_kur($payload) {
        try {
            $gecici = new Kasa($this->db, null);

            if ($gecici->sifre_kurulu_mu($payload['sirket_id'])) {
                Response::hata('Kasa sifresi zaten kurulu. Degistirmek icin yoneticiyle iletisime gecin.', 422);
                return;
            }

            $veri = json_decode(file_get_contents('php://input'), true);

            if (empty($veri['kasa_sifre'])) {
                Response::dogrulama_hatasi(array('kasa_sifre' => 'Kasa sifresi zorunludur'));
                return;
            }

            if (strlen($veri['kasa_sifre']) < 6) {
                Response::dogrulama_hatasi(array('kasa_sifre' => 'Kasa sifresi en az 6 karakter olmalidir'));
                return;
            }

            if ($veri['kasa_sifre'] !== (isset($veri['kasa_sifre_tekrar']) ? $veri['kasa_sifre_tekrar'] : '')) {
                Response::dogrulama_hatasi(array('kasa_sifre_tekrar' => 'Sifreler eslesmiyor'));
                return;
            }

            // Model içinde doğru salt oluşturulur — null kripto ile başlat
            $kasa = new Kasa($this->db, null);
            $basarili = $kasa->sifre_kur($payload['sirket_id'], $veri['kasa_sifre']);

            if ($basarili) {
                Response::basarili(null, 'Kasa sifresi basariyla olusturuldu');
            } else {
                Response::sunucu_hatasi('Kasa sifresi olusturulamadi');
            }
        } catch (Exception $e) {
            error_log('Kasa sifre_kur hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kasa sifresi olusturulamadi');
        }
    }

    // ─── POST /api/kasa/dogrula ───
    // Şifreyi doğrula — doğruysa basarili döner
    public function dogrula($payload) {
        try {
            $veri = json_decode(file_get_contents('php://input'), true);
            $kasa_sifre = isset($veri['kasa_sifre']) ? $veri['kasa_sifre'] : null;

            if (empty($kasa_sifre)) {
                Response::dogrulama_hatasi(array('kasa_sifre' => 'Kasa sifresi zorunludur'));
                return;
            }

            $gecici = new Kasa($this->db, null);

            if (!$gecici->sifre_kurulu_mu($payload['sirket_id'])) {
                Response::hata('Kasa sifresi henuz kurulmamis', 422);
                return;
            }

            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Kasa sifresi yanlis');
                return;
            }

            Response::basarili(null, 'Kasa sifresi dogrulandi');
        } catch (Exception $e) {
            error_log('Kasa dogrula hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Dogrulama basarisiz');
        }
    }

    // ─── GET /api/kasa/ozet ───
    public function ozet($payload) {
        try {
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $kasa = new Kasa($this->db, $kripto);
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
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $filtreler = array(
                'islem_tipi'       => isset($_GET['islem_tipi']) ? $_GET['islem_tipi'] : null,
                'kategori'         => isset($_GET['kategori']) ? $_GET['kategori'] : null,
                'baslangic_tarihi' => isset($_GET['baslangic_tarihi']) ? $_GET['baslangic_tarihi'] : null,
                'bitis_tarihi'     => isset($_GET['bitis_tarihi']) ? $_GET['bitis_tarihi'] : null,
                'sayfa'            => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'             => isset($_GET['adet']) ? $_GET['adet'] : 50,
            );

            $kasa = new Kasa($this->db, $kripto);
            $sonuc = $kasa->hareketler_listele($payload['sirket_id'], $filtreler);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Kasa hareketler_listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Hareketler alinamadi');
        }
    }

    // ─── POST /api/kasa/hareketler ───
    public function hareket_ekle($payload) {
        try {
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $veri = json_decode(file_get_contents('php://input'), true);

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

            $kasa = new Kasa($this->db, $kripto);
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
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $kasa = new Kasa($this->db, $kripto);
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
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $kasa = new Kasa($this->db, $kripto);
            $yatirimlar = $kasa->yatirimlar_listele($payload['sirket_id']);
            Response::basarili(array('yatirimlar' => $yatirimlar));
        } catch (Exception $e) {
            error_log('Kasa yatirimlar_listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Yatirimlar alinamadi');
        }
    }

    // ─── POST /api/kasa/yatirimlar ───
    public function yatirim_ekle($payload) {
        try {
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $veri = json_decode(file_get_contents('php://input'), true);

            if (empty($veri['yatirim_adi'])) {
                Response::dogrulama_hatasi(array('yatirim_adi' => 'Yatirim adi zorunludur (ornek: Altin 22 Ayar, Dolar, BIM Hissesi)'));
                return;
            }

            if (!isset($veri['miktar']) || (float)$veri['miktar'] <= 0) {
                Response::dogrulama_hatasi(array('miktar' => 'Miktar sifirdan buyuk olmalidir'));
                return;
            }

            $kasa = new Kasa($this->db, $kripto);
            $yatirim_id = $kasa->yatirim_ekle($payload['sirket_id'], $veri);

            Response::basarili(array('id' => $yatirim_id), 'Yatirim kaydedildi', 201);
        } catch (Exception $e) {
            error_log('Kasa yatirim_ekle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Yatirim eklenemedi');
        }
    }

    // ─── PUT /api/kasa/yatirimlar/{id} ───
    public function yatirim_guncelle($payload, $yatirim_id) {
        try {
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $veri = json_decode(file_get_contents('php://input'), true);
            $kasa = new Kasa($this->db, $kripto);
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
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $kasa = new Kasa($this->db, $kripto);
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
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $filtreler = array(
                'ortak_adi'  => isset($_GET['ortak_adi']) ? $_GET['ortak_adi'] : null,
                'islem_tipi' => isset($_GET['islem_tipi']) ? $_GET['islem_tipi'] : null,
                'sayfa'      => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'       => isset($_GET['adet']) ? $_GET['adet'] : 50,
            );

            $kasa = new Kasa($this->db, $kripto);
            $sonuc = $kasa->ortaklar_listele($payload['sirket_id'], $filtreler);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Kasa ortaklar_listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Ortak hareketleri alinamadi');
        }
    }

    // ─── POST /api/kasa/ortaklar ───
    public function ortak_hareket_ekle($payload) {
        try {
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $veri = json_decode(file_get_contents('php://input'), true);

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

            $kasa = new Kasa($this->db, $kripto);
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
            $kasa_sifre = $this->kasa_sifre_al();
            $kripto = $this->kripto_olustur($payload['sirket_id'], $kasa_sifre);

            if (!$kripto) {
                Response::yetkisiz('Gecersiz veya eksik kasa sifresi (X-Kasa-Sifre header)');
                return;
            }

            $kasa = new Kasa($this->db, $kripto);
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
}
