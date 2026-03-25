<?php
// =============================================================
// routes/veresiye.php — Veresiye Defteri URL Yönlendirmesi
// Finans Kalesi SaaS
//
// Bu dosya index.php'den require edilir ve doğrudan çalışır.
//
// index.php'den gelen değişkenler:
//   $metod         → HTTP metodu (GET, POST, DELETE)
//   $yol_parcalari → URL parçaları ['veresiye', '5', 'islemler', '3']
// =============================================================

require_once BASE_PATH . '/models/CariKart.php';
require_once BASE_PATH . '/models/CariHareket.php';
require_once BASE_PATH . '/models/Veresiye.php';
require_once BASE_PATH . '/controllers/VeresiyeController.php';

// JWT dogrulama
$payload = AuthMiddleware::dogrula();
YetkiKontrol::modul_kontrol($payload, 'veresiye');

// Veritabanı bağlantısı
$db = Database::baglan();

// Controller oluştur
$veresiye = new VeresiyeController($db);

$parca_sayisi = count($yol_parcalari);

// ─── GET /api/veresiye ───
if ($parca_sayisi === 1) {
    if ($metod === 'GET') {
        $veresiye->listele($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/veresiye/{cariId} ───
elseif ($parca_sayisi === 2) {
    $cari_id = (int)$yol_parcalari[1];
    if ($cari_id <= 0) {
        Response::hata('Gecersiz cari ID', 400);
    } elseif ($metod === 'GET') {
        $veresiye->cari_detay($payload, $cari_id);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── POST /api/veresiye/{cariId}/islemler ───
elseif ($parca_sayisi === 3 && $yol_parcalari[2] === 'islemler') {
    $cari_id = (int)$yol_parcalari[1];
    if ($cari_id <= 0) {
        Response::hata('Gecersiz cari ID', 400);
    } elseif ($metod === 'POST') {
        $veresiye->islem_ekle($payload, $cari_id, $girdi);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── DELETE /api/veresiye/{cariId}/islemler/{islemId} ───
elseif ($parca_sayisi === 4 && $yol_parcalari[2] === 'islemler') {
    $cari_id  = (int)$yol_parcalari[1];
    $islem_id = (int)$yol_parcalari[3];
    if ($cari_id <= 0 || $islem_id <= 0) {
        Response::hata('Gecersiz ID', 400);
    } elseif ($metod === 'DELETE') {
        $veresiye->islem_sil($payload, $cari_id, $islem_id);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// Hiçbir route eşleşmedi
else {
    Response::bulunamadi('Veresiye endpoint bulunamadi');
}
