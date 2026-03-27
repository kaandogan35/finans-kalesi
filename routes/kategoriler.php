<?php
// =============================================================
// routes/kategoriler.php — Kategori API Route'ları
//
// URL yapısı:
//   /api/kategoriler          → GET (listele), POST (ekle)
//   /api/kategoriler/{id}     → PUT (güncelle), DELETE (sil)
// =============================================================

require_once BASE_PATH . '/models/Kategori.php';
require_once BASE_PATH . '/controllers/KategoriController.php';

$payload = AuthMiddleware::dogrula();
$db = Database::baglan();
$controller = new KategoriController($db);

// $yol_parcalari[0] = 'kategoriler', [1] = id (varsa)
$id = isset($yol_parcalari[1]) ? (int)$yol_parcalari[1] : null;

switch ($metod) {
    case 'GET':
        $controller->listele($payload);
        break;

    case 'POST':
        $controller->ekle($payload, $girdi);
        break;

    case 'PUT':
        if (!$id) {
            Response::dogrulama_hatasi(['id' => 'Kategori ID gerekli']);
            break;
        }
        $controller->guncelle($payload, $id, $girdi);
        break;

    case 'DELETE':
        if (!$id) {
            Response::dogrulama_hatasi(['id' => 'Kategori ID gerekli']);
            break;
        }
        $controller->sil($payload, $id);
        break;

    default:
        Response::hata('Method Not Allowed', 405);
}
