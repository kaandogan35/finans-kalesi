<?php
// =============================================================
// routes/sinir.php — Kullanım Sınırı Route'ları
// GET /api/sinir/durum
// =============================================================

require_once BASE_PATH . '/middleware/SinirKontrol.php';
require_once BASE_PATH . '/controllers/SinirController.php';

$payload    = AuthMiddleware::dogrula();
$controller = new SinirController();
$alt_yol    = $yol_parcalari[1] ?? '';

if ($metod === 'GET' && $alt_yol === 'durum') {
    $controller->durum($payload);
} else {
    Response::bulunamadi("Sinir endpoint'i bulunamadi: $alt_yol");
}
