<?php
// =============================================================
// routes/guvenlik.php — Güvenlik Modülü URL Yönlendirmesi
// ParamGo SaaS
//
// index.php'den gelen değişkenler:
//   $metod         → HTTP metodu (GET, POST, PUT, DELETE)
//   $yol_parcalari → URL parçaları ['guvenlik', 'oturumlar', ...]
//   $girdi         → JSON body
// =============================================================

require_once BASE_PATH . '/controllers/GuvenlikController.php';
require_once BASE_PATH . '/models/Guvenlik.php';
require_once BASE_PATH . '/utils/TOTPHelper.php';

$payload = AuthMiddleware::dogrula();
AuthMiddleware::rol_kontrol($payload, ['sahip']); // Güvenlik yalnızca sahibe açık

$ctrl = new GuvenlikController();

$parca_sayisi = count($yol_parcalari);

// ─── /api/guvenlik/oturumlar ──────────────────────────────────
if ($parca_sayisi >= 2 && $yol_parcalari[1] === 'oturumlar') {

    // GET /api/guvenlik/oturumlar
    if ($parca_sayisi === 2 && $metod === 'GET') {
        $ctrl->oturumlar($payload);
    }
    // DELETE /api/guvenlik/oturumlar/hepsi
    elseif ($parca_sayisi === 3 && $yol_parcalari[2] === 'hepsi' && $metod === 'DELETE') {
        $ctrl->tumOturumlariSonlandir($payload);
    }
    // DELETE /api/guvenlik/oturumlar/:id
    elseif ($parca_sayisi === 3 && $metod === 'DELETE') {
        $oturum_id = (int)$yol_parcalari[2];
        if ($oturum_id <= 0) {
            Response::hata('Geçersiz oturum ID', 400);
        } else {
            $ctrl->oturumSonlandir($payload, $oturum_id);
        }
    }
    else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/guvenlik/giris-gecmisi ──────────────────────────────
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'giris-gecmisi') {
    if ($metod === 'GET') {
        $ctrl->girisGecmisi($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/guvenlik/ayarlar ────────────────────────────────────
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'ayarlar') {
    switch ($metod) {
        case 'GET':
            $ctrl->ayarlarGetir($payload);
            break;
        case 'PUT':
            $ctrl->ayarlarKaydet($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/guvenlik/2fa ────────────────────────────────────────
elseif ($parca_sayisi >= 2 && $yol_parcalari[1] === '2fa') {

    // POST /api/guvenlik/2fa/baslat
    if ($parca_sayisi === 3 && $yol_parcalari[2] === 'baslat' && $metod === 'POST') {
        $ctrl->ikiFaktorBaslat($payload);
    }
    // POST /api/guvenlik/2fa/dogrula
    elseif ($parca_sayisi === 3 && $yol_parcalari[2] === 'dogrula' && $metod === 'POST') {
        $ctrl->ikiFaktorDogrula($payload, $girdi);
    }
    // DELETE /api/guvenlik/2fa
    elseif ($parca_sayisi === 2 && $metod === 'DELETE') {
        $ctrl->ikiFaktorDevreDisi($payload, $girdi);
    }
    else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/guvenlik/log ────────────────────────────────────────
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'log') {
    if ($metod === 'GET') {
        $ctrl->loglar($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/guvenlik/veri-disa-aktar ────────────────────────────
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'veri-disa-aktar') {
    if ($metod === 'POST') {
        $ctrl->veriDisaAktar($payload, $girdi);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

else {
    Response::bulunamadi('Güvenlik endpoint\'i bulunamadı');
}
