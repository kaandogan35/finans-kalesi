<?php
// =============================================================
// routes/kasa.php — Varlık & Kasa URL Yönlendirmesi
// Finans Kalesi SaaS — Aşama 1.9
//
// index.php'den gelen değişkenler:
//   $metod         → HTTP metodu
//   $yol_parcalari → ['kasa', 'hareketler', '5'] gibi
//
// URL yapısı:
//   /api/kasa/ozet                → GET
//   /api/kasa/hareketler          → GET, POST
//   /api/kasa/hareketler/{id}     → DELETE
//   /api/kasa/yatirimlar          → GET, POST
//   /api/kasa/yatirimlar/{id}     → PUT, DELETE
//   /api/kasa/ortaklar            → GET, POST
//   /api/kasa/ortaklar/{id}       → DELETE
// =============================================================

require_once BASE_PATH . '/utils/KriptoHelper.php';
require_once BASE_PATH . '/models/Kasa.php';
require_once BASE_PATH . '/controllers/KasaController.php';

// JWT dogrulama (tüm kasa endpoint'leri için)
$payload = AuthMiddleware::dogrula();
YetkiKontrol::modul_kontrol($payload, 'kasa');

// Veritabani baglantisi
$db = Database::baglan();

// Controller olustur
$kasa = new KasaController($db);

$parca_sayisi = count($yol_parcalari);

// ─── /api/kasa/ozet ───
if ($parca_sayisi === 2 && $yol_parcalari[1] === 'ozet') {
    if ($metod === 'GET') {
        $kasa->ozet($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/kasa/hareketler ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'hareketler') {
    switch ($metod) {
        case 'GET':
            $kasa->hareketler_listele($payload);
            break;
        case 'POST':
            $kasa->hareket_ekle($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
            break;
    }
}

// ─── /api/kasa/hareketler/{id} ───
elseif ($parca_sayisi === 3 && $yol_parcalari[1] === 'hareketler') {
    $hareket_id = (int)$yol_parcalari[2];
    if ($hareket_id <= 0) {
        Response::hata('Gecersiz hareket ID', 400);
    } elseif ($metod === 'DELETE') {
        $kasa->hareket_sil($payload, $hareket_id);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/kasa/yatirimlar ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'yatirimlar') {
    switch ($metod) {
        case 'GET':
            $kasa->yatirimlar_listele($payload);
            break;
        case 'POST':
            $kasa->yatirim_ekle($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
            break;
    }
}

// ─── /api/kasa/yatirimlar/fiyat ───
elseif ($parca_sayisi === 3 && $yol_parcalari[1] === 'yatirimlar' && $yol_parcalari[2] === 'fiyat') {
    if ($metod === 'POST') {
        $kasa->guncel_fiyat_guncelle($payload, $girdi);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/kasa/yatirimlar/{id} ───
elseif ($parca_sayisi === 3 && $yol_parcalari[1] === 'yatirimlar') {
    $yatirim_id = (int)$yol_parcalari[2];
    if ($yatirim_id <= 0) {
        Response::hata('Gecersiz yatirim ID', 400);
    } else {
        switch ($metod) {
            case 'PUT':
                $kasa->yatirim_guncelle($payload, $yatirim_id, $girdi);
                break;
            case 'DELETE':
                $kasa->yatirim_sil($payload, $yatirim_id);
                break;
            default:
                Response::hata('Bu HTTP metodu desteklenmiyor', 405);
                break;
        }
    }
}

// ─── /api/kasa/ortaklar ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'ortaklar') {
    switch ($metod) {
        case 'GET':
            $kasa->ortaklar_listele($payload);
            break;
        case 'POST':
            $kasa->ortak_hareket_ekle($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
            break;
    }
}

// ─── /api/kasa/ortaklar/{id} ───
elseif ($parca_sayisi === 3 && $yol_parcalari[1] === 'ortaklar') {
    $hareket_id = (int)$yol_parcalari[2];
    if ($hareket_id <= 0) {
        Response::hata('Gecersiz hareket ID', 400);
    } elseif ($metod === 'DELETE') {
        $kasa->ortak_hareket_sil($payload, $hareket_id);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/kasa/bilanco ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'bilanco') {
    switch ($metod) {
        case 'GET':
            $kasa->bilanco_listele($payload);
            break;
        case 'POST':
            $kasa->bilanco_kaydet($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
            break;
    }
}

// ─── /api/kasa/bilanco/{id} ───
elseif ($parca_sayisi === 3 && $yol_parcalari[1] === 'bilanco') {
    $bilanco_id = (int)$yol_parcalari[2];
    if ($bilanco_id <= 0) {
        Response::hata('Gecersiz bilanco ID', 400);
    } else {
        switch ($metod) {
            case 'PUT':
                $kasa->bilanco_guncelle($payload, $bilanco_id, $girdi);
                break;
            case 'DELETE':
                $kasa->bilanco_sil($payload, $bilanco_id);
                break;
            default:
                Response::hata('Bu HTTP metodu desteklenmiyor', 405);
                break;
        }
    }
}

// Hicbir route eslesmedi
else {
    Response::bulunamadi('Kasa endpoint bulunamadi');
}
