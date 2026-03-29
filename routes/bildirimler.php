<?php
// =============================================================
// routes/bildirimler.php — Bildirimler Modülü URL Yönlendirmesi
// Finans Kalesi SaaS
// =============================================================

require_once BASE_PATH . '/controllers/BildirimController.php';
require_once BASE_PATH . '/models/Bildirim.php';

$payload = AuthMiddleware::dogrula();

$ctrl = new BildirimController();

$parca_sayisi = count($yol_parcalari);

// ─── /api/bildirimler/okunmamis-sayisi ──────────────────────
if ($parca_sayisi === 2 && $yol_parcalari[1] === 'okunmamis-sayisi' && $metod === 'GET') {
    $ctrl->okunmamisSayisi($payload);
}

// ─── /api/bildirimler/tumunu-oku ────────────────────────────
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'tumunu-oku' && $metod === 'PUT') {
    $ctrl->tumunuOkunduYap($payload);
}

// ─── /api/bildirimler/push-token ────────────────────────────
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'push-token') {
    switch ($metod) {
        case 'POST':
            $ctrl->pushTokenKaydet($payload, $girdi);
            break;
        case 'DELETE':
            $ctrl->pushTokenSil($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/bildirimler/tercihler ─────────────────────────────
elseif ($parca_sayisi === 2 && $yol_parcalari[1] === 'tercihler') {
    switch ($metod) {
        case 'GET':
            $ctrl->tercihlerGetir($payload);
            break;
        case 'PUT':
            $ctrl->tercihlerKaydet($payload, $girdi);
            break;
        default:
            Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/bildirimler/:id/oku ───────────────────────────────
elseif ($parca_sayisi === 3 && $yol_parcalari[2] === 'oku' && $metod === 'PUT') {
    $id = (int)$yol_parcalari[1];
    if ($id <= 0) {
        Response::hata('Geçersiz bildirim ID', 400);
    } else {
        $ctrl->okunduYap($payload, $id);
    }
}

// ─── /api/bildirimler/:id ───────────────────────────────────
elseif ($parca_sayisi === 2 && is_numeric($yol_parcalari[1])) {
    $id = (int)$yol_parcalari[1];
    if ($id <= 0) {
        Response::hata('Geçersiz bildirim ID', 400);
    } elseif ($metod === 'DELETE') {
        $ctrl->sil($payload, $id);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// ─── /api/bildirimler (liste) ───────────────────────────────
elseif ($parca_sayisi === 1 && $metod === 'GET') {
    $ctrl->listele($payload);
}

else {
    Response::bulunamadi('Bildirim endpoint\'i bulunamadı');
}
