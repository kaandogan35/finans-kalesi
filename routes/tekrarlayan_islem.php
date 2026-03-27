<?php
// =============================================================
// routes/tekrarlayan_islem.php — Tekrarlayan İşlemler Yönlendirme
// Finans Kalesi SaaS
//
// URL yapısı:
//   /api/tekrarlayan-islemler              → GET, POST
//   /api/tekrarlayan-islemler/ozet         → GET
//   /api/tekrarlayan-islemler/calistir     → POST (cron)
//   /api/tekrarlayan-islemler/{id}         → GET, PUT, DELETE
//   /api/tekrarlayan-islemler/{id}/durum   → PUT
// =============================================================

require_once BASE_PATH . '/models/TekrarlayanIslem.php';
require_once BASE_PATH . '/controllers/TekrarlayanIslemController.php';

// JWT doğrulama
$payload = AuthMiddleware::dogrula();
YetkiKontrol::modul_kontrol($payload, 'tekrarlayan_islem');

// Veritabanı bağlantısı
$db = Database::baglan();

// Controller oluştur
$controller = new TekrarlayanIslemController($db);

$parca_sayisi = count($yol_parcalari);

// ─── /api/tekrarlayan-islemler ───
if ($parca_sayisi === 1) {
    switch ($metod) {
        case 'GET':
            $controller->listele($payload);
            break;
        case 'POST':
            $controller->olustur($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
            break;
    }
}

// ─── /api/tekrarlayan-islemler/ozet ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'ozet') {
    if ($metod === 'GET') {
        $controller->ozet($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/tekrarlayan-islemler/calistir (Cron endpoint) ───
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'calistir') {
    if ($metod === 'POST') {
        $controller->calistir($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/tekrarlayan-islemler/{id} ───
elseif ($parca_sayisi === 2) {
    $islem_id = (int)$yol_parcalari[1];
    if ($islem_id <= 0) {
        Response::hata('Geçersiz işlem ID', 400);
    } else {
        switch ($metod) {
            case 'GET':
                $controller->detay($payload, $islem_id);
                break;
            case 'PUT':
                $controller->guncelle($payload, $islem_id, $girdi);
                break;
            case 'DELETE':
                $controller->sil($payload, $islem_id);
                break;
            default:
                Response::hata('Bu HTTP metodu desteklenmiyor', 405);
                break;
        }
    }
}

// ─── /api/tekrarlayan-islemler/{id}/durum ───
elseif ($parca_sayisi === 3 && $yol_parcalari[2] === 'durum') {
    $islem_id = (int)$yol_parcalari[1];
    if ($islem_id <= 0) {
        Response::hata('Geçersiz işlem ID', 400);
    } elseif ($metod === 'PUT') {
        $controller->durum_degistir($payload, $islem_id, $girdi);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// Hiçbir route eşleşmedi
else {
    Response::bulunamadi('Tekrarlayan işlem endpoint bulunamadı');
}
