<?php
// =============================================================
// routes/odeme.php — Ödeme/Tahsilat Takip URL Yönlendirmesi
// ParamGo SaaS — Aşama 1.5
//
// index.php'den gelen değişkenler:
//   $metod         → HTTP metodu (GET, POST, PUT, DELETE)
//   $yol_parcalari → URL parçaları ['odemeler', '5', 'tamamla']
// =============================================================

require_once BASE_PATH . '/models/OdemeTakip.php';
require_once BASE_PATH . '/controllers/OdemeTakipController.php';

// JWT dogrulama
$payload = AuthMiddleware::dogrula();
YetkiKontrol::modul_kontrol($payload, 'odemeler');

// Veritabani baglantisi
$db = Database::baglan();

// Controller olustur
$odeme = new OdemeTakipController($db);

// URL parcalarini analiz et
// /api/odemeler              → ['odemeler']
// /api/odemeler/ozet         → ['odemeler', 'ozet']
// /api/odemeler/5            → ['odemeler', '5']
// /api/odemeler/5/tamamla    → ['odemeler', '5', 'tamamla']

$parca_sayisi = count($yol_parcalari);

// ─── /api/odemeler ───
if ($parca_sayisi === 1) {
    switch ($metod) {
        case 'GET':
            $odeme->listele($payload);
            break;
        case 'POST':
            $odeme->olustur($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
            break;
    }
}

// ─── /api/odemeler/ozet ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'ozet') {
    if ($metod === 'GET') {
        $odeme->ozet($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/odemeler/{id} ───
elseif ($parca_sayisi === 2) {
    $kayit_id = (int)$yol_parcalari[1];
    if ($kayit_id <= 0) {
        Response::hata('Gecersiz kayit ID', 400);
    } else {
        switch ($metod) {
            case 'GET':
                $odeme->detay($payload, $kayit_id);
                break;
            case 'PUT':
                $odeme->guncelle($payload, $kayit_id, $girdi);
                break;
            case 'DELETE':
                $odeme->sil($payload, $kayit_id);
                break;
            default:
                Response::hata('Bu HTTP metodu desteklenmiyor', 405);
                break;
        }
    }
}

// ─── /api/odemeler/{id}/arama-kaydi ───
elseif ($parca_sayisi === 3 && $yol_parcalari[2] === 'arama-kaydi') {
    $kayit_id = (int)$yol_parcalari[1];
    if ($kayit_id <= 0) {
        Response::hata('Gecersiz kayit ID', 400);
    } elseif ($metod === 'PUT') {
        $odeme->aramaKaydi($payload, $kayit_id, $girdi);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// Hicbir route eslesmedi
else {
    Response::bulunamadi('Odeme endpoint bulunamadi');
}
