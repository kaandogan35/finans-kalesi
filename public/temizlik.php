<?php
// Güvenlik temizlik aracı — bir kez çalıştır, kendini de siler
if (($_GET['token'] ?? '') !== 'fk_temizlik_2026') {
    http_response_code(403); exit;
}

$klasor = __DIR__;
$silinecekler = [
    'debug_tables.php',
    'debug_kasa.php',
    'debug2.php',
    'opcache_temizle.php',
    'tablo_kontrol.php',
    'migrate_yatirim.php',
    'test.html',
    'test_cari.html',
    'test_cek_senet.html',
    'test_kasa.html',
    'test_odeme.html',
    'htaccess',
    'error_log',
];

$sonuclar = [];
foreach ($silinecekler as $dosya) {
    $yol = $klasor . '/' . $dosya;
    if (file_exists($yol)) {
        $sonuclar[$dosya] = unlink($yol) ? 'SILINDI' : 'HATA';
    } else {
        $sonuclar[$dosya] = 'ZATEN_YOK';
    }
}

// Kendini de sil
header('Content-Type: application/json; charset=utf-8');
echo json_encode($sonuclar, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

// Kendini sil
unlink(__FILE__);
