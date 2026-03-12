<?php
$gizli = 'fk_db_2026';
if (($_GET['token'] ?? '') !== $gizli) { http_response_code(403); echo '{}'; exit; }

define('BASE_PATH', dirname(__DIR__));
require_once BASE_PATH . '/config/app.php';
require_once BASE_PATH . '/config/database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::baglan();

    $stmt = $db->query("DESCRIBE yatirim_kasasi");
    $satirlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'yatirim_kasasi_tam' => $satirlar,
        'sadece_isimler'     => array_column($satirlar, 'Field'),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode(['hata' => $e->getMessage()]);
}
