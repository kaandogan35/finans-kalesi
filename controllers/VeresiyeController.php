<?php
// =============================================================
// VeresiyeController.php — Veresiye Defteri API Kontrol Merkezi
// Finans Kalesi SaaS
//
// Payload yapısı (JWTHelper'dan):
//   $payload['sub']       → Kullanıcı ID
//   $payload['sirket_id'] → Şirket ID
//   $payload['rol']       → Yetki rolü
// =============================================================

class VeresiyeController {
    private $veresiye;
    private $db;

    public function __construct($db) {
        $this->db = $db;
        $this->veresiye = new Veresiye($db);
    }

    // ─── GET /api/veresiye ───
    // Tüm cariler veresiye bakiyesiyle birlikte
    public function listele($payload) {
        try {
            $filtreler = [
                'arama'           => isset($_GET['arama']) ? $_GET['arama'] : null,
                'sadece_borclular' => isset($_GET['sadece_borclular']) ? (bool)$_GET['sadece_borclular'] : false,
            ];

            $cariler = $this->veresiye->cari_listesi($payload['sirket_id'], $filtreler);
            $ozet    = $this->veresiye->genel_ozet($payload['sirket_id']);

            Response::basarili([
                'cariler' => $cariler,
                'ozet'    => $ozet,
            ]);
        } catch (Exception $e) {
            error_log('Veresiye listele hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Veresiye listesi alinamadi');
        }
    }

    // ─── GET /api/veresiye/{cariId} ───
    // Bir carinin veresiye detayı (bilgi + özet + işlemler)
    public function cari_detay($payload, $cari_id) {
        try {
            $bilgi = $this->veresiye->cari_bilgi($payload['sirket_id'], $cari_id);

            if (!$bilgi) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $islemler = $this->veresiye->islemler($payload['sirket_id'], $cari_id);

            Response::basarili([
                'cari'    => $bilgi,
                'islemler' => $islemler,
            ]);
        } catch (Exception $e) {
            error_log('Veresiye cari detay hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Veresiye detay alinamadi');
        }
    }

    // ─── POST /api/veresiye/{cariId}/islemler ───
    // Yeni satış veya ödeme ekle
    public function islem_ekle($payload, $cari_id, $girdi) {
        try {
            PlanKontrol::yazmaKontrol($payload);
            // Cari var mı kontrol et
            $bilgi = $this->veresiye->cari_bilgi($payload['sirket_id'], $cari_id);
            if (!$bilgi) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $veri = $girdi;

            // Zorunlu alan kontrolleri
            $gecerli_turler = ['satis', 'odeme'];
            if (empty($veri['tur']) || !in_array($veri['tur'], $gecerli_turler)) {
                Response::dogrulama_hatasi(['tur' => 'Geçerli değerler: satis, odeme']);
                return;
            }

            if (!isset($veri['tutar']) || (float)$veri['tutar'] <= 0) {
                Response::dogrulama_hatasi(['tutar' => 'Tutar sıfırdan büyük olmalıdır']);
                return;
            }

            // Tarih formatı kontrolü
            if (!empty($veri['tarih'])) {
                $tarih = DateTime::createFromFormat('Y-m-d', $veri['tarih']);
                if (!$tarih) {
                    Response::dogrulama_hatasi(['tarih' => 'Tarih formatı: YYYY-AA-GG']);
                    return;
                }
            }

            $islem_id = $this->veresiye->islem_ekle(
                $payload['sirket_id'],
                $cari_id,
                $veri,
                $payload['sub']
            );

            // Güncel özeti döndür
            $ozet = $this->veresiye->cari_ozet($payload['sirket_id'], $cari_id);

            $tur_mesaj = ($veri['tur'] === 'satis') ? 'Satış kaydedildi' : 'Ödeme kaydedildi';
            Response::basarili([
                'islem_id'     => $islem_id,
                'guncel_ozet'  => $ozet,
            ], $tur_mesaj, 201);
        } catch (Exception $e) {
            error_log('Veresiye islem ekle hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Islem eklenemedi');
        }
    }

    // ─── DELETE /api/veresiye/{cariId}/islemler/{islemId} ───
    // İşlem sil (soft delete)
    public function islem_sil($payload, $cari_id, $islem_id) {
        try {
            PlanKontrol::yazmaKontrol($payload);
            // Cari var mı kontrol et
            $bilgi = $this->veresiye->cari_bilgi($payload['sirket_id'], $cari_id);
            if (!$bilgi) {
                Response::bulunamadi('Cari kart bulunamadi');
                return;
            }

            $silindi = $this->veresiye->islem_sil($payload['sirket_id'], $islem_id);

            if (!$silindi) {
                Response::bulunamadi('Islem bulunamadi veya zaten silinmis');
                return;
            }

            $ozet = $this->veresiye->cari_ozet($payload['sirket_id'], $cari_id);

            Response::basarili([
                'guncel_ozet' => $ozet,
            ], 'Islem silindi');
        } catch (Exception $e) {
            error_log('Veresiye islem sil hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Islem silinemedi');
        }
    }
}
