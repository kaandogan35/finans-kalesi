<?php
// =============================================================
// TekrarlayanIslemController.php — Tekrarlayan İşlemler API
// Finans Kalesi SaaS
//
// Her istek: JWT doğrulama zorunlu.
// =============================================================

class TekrarlayanIslemController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ─── GET /api/tekrarlayan-islemler ───
    public function listele($payload) {
        try {
            $filtreler = [
                'aktif_mi'   => isset($_GET['aktif_mi']) ? $_GET['aktif_mi'] : null,
                'islem_tipi' => isset($_GET['islem_tipi']) ? $_GET['islem_tipi'] : null,
                'periyot'    => isset($_GET['periyot']) ? $_GET['periyot'] : null,
                'sayfa'      => isset($_GET['sayfa']) ? $_GET['sayfa'] : 1,
                'adet'       => isset($_GET['adet']) ? min((int)$_GET['adet'], 200) : 50,
            ];

            $model = new TekrarlayanIslem($this->db);
            $sonuc = $model->listele($payload['sirket_id'], $filtreler);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Tekrarlayan islem listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('İşlemler listelenemedi');
        }
    }

    // ─── GET /api/tekrarlayan-islemler/ozet ───
    public function ozet($payload) {
        try {
            $model = new TekrarlayanIslem($this->db);
            $sonuc = $model->ozet($payload['sirket_id']);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Tekrarlayan islem ozet hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Özet alınamadı');
        }
    }

    // ─── GET /api/tekrarlayan-islemler/{id} ───
    public function detay($payload, $id) {
        try {
            $model = new TekrarlayanIslem($this->db);
            $sonuc = $model->detay($payload['sirket_id'], $id);

            if (!$sonuc) {
                Response::bulunamadi('İşlem bulunamadı');
                return;
            }
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Tekrarlayan islem detay hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('İşlem detayı alınamadı');
        }
    }

    // ─── POST /api/tekrarlayan-islemler ───
    public function olustur($payload, $girdi) {
        try {
            // Zorunlu alanlar
            $hatalar = [];

            if (empty($girdi['baslik'])) {
                $hatalar['baslik'] = 'Başlık zorunludur';
            }
            if (empty($girdi['islem_tipi']) || !in_array($girdi['islem_tipi'], ['giris', 'cikis'])) {
                $hatalar['islem_tipi'] = 'İşlem tipi zorunludur (giris veya cikis)';
            }
            if (!isset($girdi['tutar']) || (float)$girdi['tutar'] <= 0) {
                $hatalar['tutar'] = 'Tutar sıfırdan büyük olmalıdır';
            }
            if (empty($girdi['baslangic_tarihi'])) {
                $hatalar['baslangic_tarihi'] = 'Başlangıç tarihi zorunludur';
            }

            // Periyot kontrolü
            $gecerli_periyotlar = ['gunluk', 'haftalik', 'aylik', 'yillik'];
            $periyot = $girdi['periyot'] ?? 'aylik';
            if (!in_array($periyot, $gecerli_periyotlar)) {
                $hatalar['periyot'] = 'Geçerli değerler: gunluk, haftalik, aylik, yillik';
            }

            if (!empty($hatalar)) {
                Response::dogrulama_hatasi($hatalar);
                return;
            }

            // Sonraki çalışma tarihini başlangıç tarihi yap
            $girdi['sonraki_calistirma'] = $girdi['baslangic_tarihi'];
            $girdi['periyot'] = $periyot;

            // Plan sınır kontrolü
            SinirKontrol::kontrol($payload, 'tekrarlayan_islem');

            $model = new TekrarlayanIslem($this->db);
            $sonuc = $model->olustur($payload['sirket_id'], $girdi, $payload['sub']);

            Response::basarili($sonuc, 'Tekrarlayan işlem başarıyla oluşturuldu', 201);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'limit') !== false || strpos($e->getMessage(), 'sinir') !== false) {
                Response::hata($e->getMessage(), 403);
                return;
            }
            error_log('Tekrarlayan islem olustur hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('İşlem oluşturulamadı');
        }
    }

    // ─── PUT /api/tekrarlayan-islemler/{id} ───
    public function guncelle($payload, $id, $girdi) {
        try {
            // Gelen verileri doğrula
            if (isset($girdi['islem_tipi']) && !in_array($girdi['islem_tipi'], ['giris', 'cikis'])) {
                Response::dogrulama_hatasi(['islem_tipi' => 'Geçerli değerler: giris, cikis']);
                return;
            }
            if (isset($girdi['tutar']) && (float)$girdi['tutar'] <= 0) {
                Response::dogrulama_hatasi(['tutar' => 'Tutar sıfırdan büyük olmalıdır']);
                return;
            }
            if (isset($girdi['periyot']) && !in_array($girdi['periyot'], ['gunluk', 'haftalik', 'aylik', 'yillik'])) {
                Response::dogrulama_hatasi(['periyot' => 'Geçerli değerler: gunluk, haftalik, aylik, yillik']);
                return;
            }

            $model = new TekrarlayanIslem($this->db);
            $sonuc = $model->guncelle($payload['sirket_id'], $id, $girdi);

            if (!$sonuc) {
                Response::bulunamadi('İşlem bulunamadı');
                return;
            }

            Response::basarili($sonuc, 'İşlem güncellendi');
        } catch (Exception $e) {
            error_log('Tekrarlayan islem guncelle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('İşlem güncellenemedi');
        }
    }

    // ─── PUT /api/tekrarlayan-islemler/{id}/durum ───
    public function durum_degistir($payload, $id, $girdi) {
        try {
            if (!isset($girdi['aktif_mi'])) {
                Response::dogrulama_hatasi(['aktif_mi' => 'Aktif durumu belirtilmelidir (0 veya 1)']);
                return;
            }

            $model = new TekrarlayanIslem($this->db);
            $sonuc = $model->durum_degistir($payload['sirket_id'], $id, $girdi['aktif_mi']);

            if (!$sonuc) {
                Response::bulunamadi('İşlem bulunamadı');
                return;
            }

            $durum_metin = $girdi['aktif_mi'] ? 'aktif' : 'duraklatıldı';
            Response::basarili(['aktif_mi' => (int)$girdi['aktif_mi']], "İşlem {$durum_metin}");
        } catch (Exception $e) {
            error_log('Tekrarlayan islem durum hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Durum değiştirilemedi');
        }
    }

    // ─── DELETE /api/tekrarlayan-islemler/{id} ───
    public function sil($payload, $id) {
        try {
            $model = new TekrarlayanIslem($this->db);
            $sonuc = $model->sil($payload['sirket_id'], $id);

            if (!$sonuc) {
                Response::bulunamadi('İşlem bulunamadı');
                return;
            }

            Response::basarili(null, 'Tekrarlayan işlem silindi');
        } catch (Exception $e) {
            error_log('Tekrarlayan islem sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('İşlem silinemedi');
        }
    }

    // ─── POST /api/tekrarlayan-islemler/calistir (Cron) ───
    public function calistir($payload) {
        try {
            $model = new TekrarlayanIslem($this->db);
            $sonuc = $model->vadesi_gelenleri_calistir();
            Response::basarili($sonuc, 'Cron çalıştırıldı');
        } catch (Exception $e) {
            error_log('Tekrarlayan islem cron hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Cron çalıştırılamadı');
        }
    }
}
