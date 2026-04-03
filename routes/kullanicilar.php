<?php
// =============================================================
// routes/kullanicilar.php — Kullanıcı Yönetimi URL Yönlendirmesi
// ParamGo SaaS
//
// index.php'den gelen değişkenler:
//   $metod         → HTTP metodu (GET, POST, PUT, DELETE)
//   $yol_parcalari → URL parçaları ['kullanicilar', '5', 'sifre']
// =============================================================

require_once BASE_PATH . '/controllers/KullaniciController.php';

$payload = AuthMiddleware::dogrula();
AuthMiddleware::rol_kontrol($payload, ['sahip']); // Kullanıcı yönetimi yalnızca sahibe açık

$ctrl = new KullaniciController();

$parca_sayisi = count($yol_parcalari);

// ─── /api/kullanicilar ───────────────────────────────────────
if ($parca_sayisi === 1) {
    switch ($metod) {
        case 'GET':
            $ctrl->listele($payload);
            break;
        case 'POST':
            $ctrl->olustur($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/kullanicilar/:id ───────────────────────────────────
elseif ($parca_sayisi === 2) {
    $kullanici_id = (int)$yol_parcalari[1];
    if ($kullanici_id <= 0) {
        Response::hata('Geçersiz kullanıcı ID', 400);
    } else {
        switch ($metod) {
            case 'GET':
                $ctrl->getir($payload, $kullanici_id);
                break;
            case 'PUT':
                $ctrl->guncelle($payload, $kullanici_id, $girdi);
                break;
            case 'DELETE':
                $ctrl->sil($payload, $kullanici_id);
                break;
            default:
                Response::hata('Bu HTTP metodu desteklenmiyor', 405);
        }
    }
}

// ─── /api/kullanicilar/:id/sifre ────────────────────────────
elseif ($parca_sayisi === 3 && $yol_parcalari[2] === 'sifre') {
    $kullanici_id = (int)$yol_parcalari[1];
    if ($kullanici_id <= 0) {
        Response::hata('Geçersiz kullanıcı ID', 400);
    } elseif ($metod === 'PUT') {
        $ctrl->sifreGuncelle($payload, $kullanici_id, $girdi);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

else {
    Response::bulunamadi('Kullanıcı endpoint\'i bulunamadı');
}
