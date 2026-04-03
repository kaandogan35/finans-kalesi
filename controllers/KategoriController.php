<?php
// =============================================================
// KategoriController.php — Gelir/Gider Kategori API
// ParamGo SaaS
// =============================================================

class KategoriController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ─── GET /api/kategoriler ───
    public function listele($payload) {
        try {
            $islem_tipi = isset($_GET['islem_tipi']) ? $_GET['islem_tipi'] : null;

            if ($islem_tipi && !in_array($islem_tipi, ['giris', 'cikis'])) {
                Response::dogrulama_hatasi(['islem_tipi' => 'Geçerli değerler: giris, cikis']);
                return;
            }

            $model = new Kategori($this->db);
            $sonuc = $model->listele($payload['sirket_id'], $islem_tipi);
            Response::basarili($sonuc);
        } catch (Exception $e) {
            error_log('Kategori listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kategoriler listelenemedi');
        }
    }

    // ─── POST /api/kategoriler ───
    public function ekle($payload, $girdi) {
        try {
            PlanKontrol::yazmaKontrol($payload);
            $hatalar = [];
            if (empty($girdi['ad'])) {
                $hatalar['ad'] = 'Kategori adı zorunludur';
            }
            if (empty($girdi['islem_tipi']) || !in_array($girdi['islem_tipi'], ['giris', 'cikis'])) {
                $hatalar['islem_tipi'] = 'İşlem tipi zorunludur (giris veya cikis)';
            }
            if (!empty($hatalar)) {
                Response::dogrulama_hatasi($hatalar);
                return;
            }

            $model = new Kategori($this->db);
            $id = $model->ekle($payload['sirket_id'], $girdi);
            Response::basarili(['id' => $id], 'Kategori eklendi', 201);
        } catch (Exception $e) {
            error_log('Kategori ekle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kategori eklenemedi');
        }
    }

    // ─── PUT /api/kategoriler/{id} ───
    public function guncelle($payload, $id, $girdi) {
        try {
            PlanKontrol::yazmaKontrol($payload);
            $model = new Kategori($this->db);
            $sonuc = $model->guncelle($payload['sirket_id'], $id, $girdi);

            if (!$sonuc) {
                Response::bulunamadi('Kategori bulunamadı veya varsayılan kategori değiştirilemez');
                return;
            }

            Response::basarili(null, 'Kategori güncellendi');
        } catch (Exception $e) {
            error_log('Kategori guncelle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kategori güncellenemedi');
        }
    }

    // ─── DELETE /api/kategoriler/{id} ───
    public function sil($payload, $id) {
        try {
            PlanKontrol::yazmaKontrol($payload);
            $model = new Kategori($this->db);
            $sonuc = $model->sil($payload['sirket_id'], $id);

            if (!$sonuc) {
                Response::bulunamadi('Kategori bulunamadı veya varsayılan kategori silinemez');
                return;
            }

            Response::basarili(null, 'Kategori silindi');
        } catch (Exception $e) {
            error_log('Kategori sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kategori silinemedi');
        }
    }
}
