<?php
$gizli = 'fk_migrate_2026';
if (($_GET['token'] ?? '') !== $gizli) { http_response_code(403); echo '{}'; exit; }

define('BASE_PATH', dirname(__DIR__));
require_once BASE_PATH . '/config/app.php';
require_once BASE_PATH . '/config/database.php';

header('Content-Type: application/json; charset=utf-8');

$sonuclar = [];

try {
    $db = Database::baglan();

    // 1. varlik_turu → yatirim_adi
    $db->exec("ALTER TABLE yatirim_kasasi CHANGE varlik_turu yatirim_adi VARCHAR(255) NOT NULL");
    $sonuclar[] = "varlik_turu → yatirim_adi: OK";

    // 2. kur_fiyati_sifreli → birim_fiyat_sifreli
    $db->exec("ALTER TABLE yatirim_kasasi CHANGE kur_fiyati_sifreli birim_fiyat_sifreli TEXT");
    $sonuclar[] = "kur_fiyati_sifreli → birim_fiyat_sifreli: OK";

    // 3. aciklama kaldır
    $db->exec("ALTER TABLE yatirim_kasasi DROP COLUMN aciklama");
    $sonuclar[] = "aciklama sütunu kaldırıldı: OK";

    // 4. doviz_kodu ekle
    $db->exec("ALTER TABLE yatirim_kasasi ADD COLUMN doviz_kodu CHAR(3) NOT NULL DEFAULT 'TRY' AFTER alis_tarihi");
    $sonuclar[] = "doviz_kodu eklendi: OK";

    // 5. kategori ekle
    $db->exec("ALTER TABLE yatirim_kasasi ADD COLUMN kategori VARCHAR(100) DEFAULT NULL AFTER doviz_kodu");
    $sonuclar[] = "kategori eklendi: OK";

    // Son tablo yapısını göster
    $stmt = $db->query("DESCRIBE yatirim_kasasi");
    $sutunlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'durum'    => 'TAMAMLANDI',
        'adimlar'  => $sonuclar,
        'yeni_yapi' => array_column($sutunlar, 'Field'),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'durum'       => 'HATA',
        'tamamlanan'  => $sonuclar,
        'hata_mesaji' => $e->getMessage(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
