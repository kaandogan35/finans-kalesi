<?php
// OPCache Temizleme Aracı — Finans Kalesi
// KULLANIM SONRASI SİL!
// Güvenlik: sadece yerel IP veya özel token ile çalışır

$gizli_token = 'fk_cache_2026'; // Bu URL'i sadece sen biliyorsun
$gelen_token = isset($_GET['token']) ? $_GET['token'] : '';

if ($gelen_token !== $gizli_token) {
    http_response_code(403);
    echo json_encode(['hata' => 'Yetkisiz']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

$sonuc = [];

// OPCache temizle
if (function_exists('opcache_reset')) {
    $sonuc['opcache_reset'] = opcache_reset() ? 'basarili' : 'basarisiz';
} else {
    $sonuc['opcache_reset'] = 'opcache yok veya devre disi';
}

// Mevcut KasaController versiyonunu doğrula
$controller_path = dirname(__DIR__) . '/controllers/KasaController.php';
$controller_icerik = file_get_contents($controller_path);
$sonuc['kasa_controller_versiyon'] = (strpos($controller_icerik, 'yatirim_adi') !== false)
    ? 'YENI (yatirim_adi mevcut)'
    : 'ESKI (varlik_turu kullaniliyor)';

$sonuc['zaman'] = date('Y-m-d H:i:s');

echo json_encode($sonuc, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
