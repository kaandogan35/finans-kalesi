<?php
// =============================================================
// routes/cari.php — Cari Modülü URL Yönlendirmesi
// Finans Kalesi SaaS — Aşama 1.3
//
// Bu dosya index.php'den require edilir ve doğrudan çalışır.
// auth.php ile AYNI yapıda — fonksiyon yok, doğrudan switch/if.
//
// index.php'den gelen değişkenler:
//   $metod         → HTTP metodu (GET, POST, PUT, DELETE)
//   $yol_parcalari → URL parçaları ['cariler', '5', 'hareketler']
// =============================================================

// Model ve Controller dosyalarini yukle
require_once BASE_PATH . '/models/CariKart.php';
require_once BASE_PATH . '/models/CariHareket.php';
require_once BASE_PATH . '/controllers/CariController.php';

// JWT dogrulama — her cari endpoint'i giris gerektirir
$payload = AuthMiddleware::dogrula();
// dogrula() basarisizsa zaten exit yapiyor, buraya gelinmez

// Veritabani baglantisi
$db = Database::baglan();

// Controller'i olustur
$cari = new CariController($db);

// URL parcalarini analiz et
// /api/cariler              → yol_parcalari: ['cariler']
// /api/cariler/ozet         → yol_parcalari: ['cariler', 'ozet']
// /api/cariler/5            → yol_parcalari: ['cariler', '5']
// /api/cariler/5/hareketler → yol_parcalari: ['cariler', '5', 'hareketler']
// /api/cariler/5/hareketler/12 → yol_parcalari: ['cariler', '5', 'hareketler', '12']

$parca_sayisi = count($yol_parcalari);

// ─── /api/cariler ───
if ($parca_sayisi === 1) {
    switch ($metod) {
        case 'GET':
            $cari->listele($payload);
            break;
        case 'POST':
            $cari->olustur($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
            break;
    }
}

// ─── /api/cariler/ozet ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'ozet') {
    if ($metod === 'GET') {
        $cari->ozet($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/cariler/toplu ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'toplu') {
    if ($metod === 'POST') {
        $cari->topluYukle($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/cariler/{id} ───
elseif ($parca_sayisi === 2) {
    $cari_id = (int)$yol_parcalari[1];
    if ($cari_id <= 0) {
        Response::hata('Gecersiz cari ID', 400);
    } else {
        switch ($metod) {
            case 'GET':
                $cari->detay($payload, $cari_id);
                break;
            case 'PUT':
                $cari->guncelle($payload, $cari_id, $girdi);
                break;
            case 'DELETE':
                $cari->sil($payload, $cari_id);
                break;
            default:
                Response::hata('Bu HTTP metodu desteklenmiyor', 405);
                break;
        }
    }
}

// ─── /api/cariler/{id}/yaslandirma ───
elseif ($parca_sayisi === 3 && $yol_parcalari[2] === 'yaslandirma') {
    $cari_id = (int)$yol_parcalari[1];
    if ($cari_id <= 0) {
        Response::hata('Gecersiz cari ID', 400);
    } elseif ($metod === 'GET') {
        $cari->yaslandirma($payload, $cari_id);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/cariler/{id}/hareketler ───
elseif ($parca_sayisi === 3 && $yol_parcalari[2] === 'hareketler') {
    $cari_id = (int)$yol_parcalari[1];
    if ($cari_id <= 0) {
        Response::hata('Gecersiz cari ID', 400);
    } else {
        switch ($metod) {
            case 'GET':
                $cari->hareketler_listele($payload, $cari_id);
                break;
            case 'POST':
                $cari->hareket_ekle($payload, $cari_id, $girdi);
                break;
            default:
                Response::hata('Bu HTTP metodu desteklenmiyor', 405);
                break;
        }
    }
}

// ─── /api/cariler/{id}/hareketler/{hid} ───
elseif ($parca_sayisi === 4 && $yol_parcalari[2] === 'hareketler') {
    $cari_id = (int)$yol_parcalari[1];
    $hareket_id = (int)$yol_parcalari[3];

    if ($cari_id <= 0 || $hareket_id <= 0) {
        Response::hata('Gecersiz ID', 400);
    } else {
        switch ($metod) {
            case 'PUT':
                $cari->hareket_guncelle($payload, $cari_id, $hareket_id, $girdi);
                break;
            case 'DELETE':
                $cari->hareket_sil($payload, $cari_id, $hareket_id);
                break;
            default:
                Response::hata('Bu HTTP metodu desteklenmiyor', 405);
                break;
        }
    }
}

// Hicbir route eslesmedi
else {
    Response::bulunamadi('Cari endpoint bulunamadi');
}