<?php
/**
 * ParamGo — Ayarlar Route'ları
 *
 * PUT /api/ayarlar/tema  → Sirket temasini guncelle
 *
 * index.php'den gelen değişkenler:
 *   $metod         → HTTP metodu
 *   $yol_parcalari → ['ayarlar', 'tema'] gibi
 */

require_once BASE_PATH . '/controllers/AyarlarController.php';

// JWT dogrulama — tüm ayarlar endpoint'leri giris gerektirir
$payload = AuthMiddleware::dogrula();

$controller = new AyarlarController();
$girdi = json_decode(file_get_contents('php://input'), true) ?? [];

// $yol_parcalari[0] = 'ayarlar', [1] = alt yol
$alt_yol = $yol_parcalari[1] ?? '';

switch ($alt_yol) {
    case 'tema':
        if ($metod === 'PUT') {
            $controller->tema_guncelle($girdi);
        } else {
            Response::hata('Metod desteklenmiyor', 405);
        }
        break;

    default:
        Response::bulunamadi('Ayarlar endpoint bulunamadi');
}
