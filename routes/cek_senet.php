<?php
// =============================================================
// routes/cek_senet.php — Çek/Senet Modülü URL Yönlendirmesi
// ParamGo SaaS — Aşama 1.4
//
// Bu dosya index.php'den require edilir ve doğrudan çalışır.
// cari.php ile AYNI yapıda — fonksiyon yok, doğrudan if/switch.
//
// index.php'den gelen değişkenler:
//   $metod         → HTTP metodu (GET, POST, PUT, DELETE)
//   $yol_parcalari → URL parçaları ['cek-senet', '5', 'durum']
// =============================================================

// Model ve Controller dosyalarini yukle
require_once BASE_PATH . '/models/CekSenet.php';
require_once BASE_PATH . '/models/Kasa.php';
require_once BASE_PATH . '/models/CariKart.php';
require_once BASE_PATH . '/controllers/CekSenetController.php';

// JWT dogrulama — her endpoint giris gerektirir
$payload = AuthMiddleware::dogrula();
YetkiKontrol::modul_kontrol($payload, 'cek_senet');

// Veritabani baglantisi
$db = Database::baglan();

// Controller'i olustur
$cek_senet = new CekSenetController($db);

// URL parcalarini analiz et
// /api/cek-senet           → yol_parcalari: ['cek-senet']
// /api/cek-senet/ozet      → yol_parcalari: ['cek-senet', 'ozet']
// /api/cek-senet/5         → yol_parcalari: ['cek-senet', '5']
// /api/cek-senet/5/durum   → yol_parcalari: ['cek-senet', '5', 'durum']

$parca_sayisi = count($yol_parcalari);

// ─── /api/cek-senet ───
if ($parca_sayisi === 1) {
    switch ($metod) {
        case 'GET':
            $cek_senet->listele($payload);
            break;
        case 'POST':
            $cek_senet->olustur($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
            break;
    }
}

// ─── /api/cek-senet/ozet ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'ozet') {
    if ($metod === 'GET') {
        $cek_senet->ozet($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/cek-senet/toplu ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'toplu') {
    if ($metod === 'POST') {
        $cek_senet->topluYukle($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/cek-senet/{id} ───
elseif ($parca_sayisi === 2) {
    $cek_id = (int)$yol_parcalari[1];
    if ($cek_id <= 0) {
        Response::hata('Gecersiz cek/senet ID', 400);
    } else {
        switch ($metod) {
            case 'GET':
                $cek_senet->detay($payload, $cek_id);
                break;
            case 'PUT':
                $cek_senet->guncelle($payload, $cek_id, $girdi);
                break;
            case 'DELETE':
                $cek_senet->sil($payload, $cek_id);
                break;
            default:
                Response::hata('Bu HTTP metodu desteklenmiyor', 405);
                break;
        }
    }
}

// ─── /api/cek-senet/{id}/durum ───
elseif ($parca_sayisi === 3 && $yol_parcalari[2] === 'durum') {
    $cek_id = (int)$yol_parcalari[1];
    if ($cek_id <= 0) {
        Response::hata('Gecersiz cek/senet ID', 400);
    } elseif ($metod === 'PUT') {
        $cek_senet->durum_degistir($payload, $cek_id, $girdi);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// Hicbir route eslesmedi
else {
    Response::bulunamadi('Cek/senet endpoint bulunamadi');
}
