<?php
/**
 * Finans Kalesi — API Giriş Noktası (Tek Kapı)
 * 
 * Tüm API istekleri bu dosyadan geçer.
 * .htaccess gelen her isteği buraya yönlendirir.
 * Bu dosya URL'e bakarak doğru işlemi çalıştırır.
 * 
 * Eski sistemde: cariler.php, login.php, kasa_motoru.php ayrı dosyalardı
 * Yeni sistemde: HER İSTEK buradan geçer → doğru controller'a gider
 * 
 * Benzetme: Bir AVM'nin ana girişi. İçeri giren herkes
 * bilgi masasına (router) gider, oradan doğru mağazaya yönlendirilir.
 */

// ============================================
// 1. TEMEL AYARLAR
// ============================================

// Hata raporlama (ekrana basma, logla)
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Zaman dilimi
date_default_timezone_set('Europe/Istanbul');

// JSON yanit verecegimizi belirt
header('Content-Type: application/json; charset=utf-8');

// ============================================
// 2. DOSYALARI YUKLE (Autoload)
// ============================================

// Proje kok dizini (public/ klasorunun bir ustu = backend/)
define('BASE_PATH', dirname(__DIR__));

// Gerekli dosyalari yukle
require_once BASE_PATH . '/config/app.php';
require_once BASE_PATH . '/config/database.php';
require_once BASE_PATH . '/utils/Response.php';
require_once BASE_PATH . '/utils/SistemKripto.php';
require_once BASE_PATH . '/utils/JWTHelper.php';
require_once BASE_PATH . '/utils/SistemLog.php';
require_once BASE_PATH . '/utils/RateLimiter.php';
require_once BASE_PATH . '/middleware/CorsMiddleware.php';
require_once BASE_PATH . '/middleware/AuthMiddleware.php';
require_once BASE_PATH . '/models/Kullanici.php';
require_once BASE_PATH . '/models/Sirket.php';
require_once BASE_PATH . '/controllers/AuthController.php';

// ============================================
// 3. MIDDLEWARE'LERİ ÇALIŞTIR
// ============================================

// CORS izinlerini ayarla (React frontend'den gelen istekler için)
CorsMiddleware::calistir();

// ============================================
// 4. İSTEK BİLGİLERİNİ AL
// ============================================

// HTTP metodu: GET, POST, PUT, DELETE
$metod = $_SERVER['REQUEST_METHOD'];

// İstek yolunu al ve temizle
// Örnek: /api/cariler/5 → api/cariler/5
$istek_uri = $_SERVER['REQUEST_URI'];

// Query string'i ayır (?sayfa=1 gibi kısımları)
$istek_yolu = parse_url($istek_uri, PHP_URL_PATH);

// Baştaki ve sondaki slash'ları temizle
$istek_yolu = trim($istek_yolu, '/');

// "api/" prefix'ini kaldır — hem kök hem alt klasör kurulumunu destekler
// Örnek 1: /api/cariler/5        → cariler/5
// Örnek 2: /finans-kalesi/public/api/cariler/5 → cariler/5
$api_konum = strpos($istek_yolu, 'api/');
if ($api_konum !== false) {
    $istek_yolu = substr($istek_yolu, $api_konum + 4);
} elseif ($istek_yolu === 'api' || substr($istek_yolu, -4) === '/api') {
    $istek_yolu = '';
}

// Yolu parçalara ayır: "cariler/5/hareketler" → ["cariler", "5", "hareketler"]
$yol_parcalari = $istek_yolu !== '' ? explode('/', $istek_yolu) : [];

// POST/PUT verileri (JSON body'den oku)
$girdi = json_decode(file_get_contents('php://input'), true) ?? [];

// ============================================
// 5. ROUTER (URL → İşlem Eşleştirmesi)
// ============================================

// İlk parça hangi modüle gidileceğini belirler
$modul = $yol_parcalari[0] ?? '';

try {
    switch ($modul) {
        
        // ─── Sağlık Kontrolü ───
        // GET /api/health
        // İlk test endpoint'imiz — API çalışıyor mu diye kontrol
        case 'health':
            // Veritabanı bağlantısını test et
            $db_durum = 'baglanti_yok';
            try {
                $db = Database::baglan();
                $db->query('SELECT 1');
                $db_durum = 'bagli';
            } catch (Exception $e) {
                $db_durum = 'hata: ' . $e->getMessage();
            }
            
            Response::basarili([
                'durum'      => 'aktif',
                'versiyon'   => '1.0.0',
                'zaman'      => date('Y-m-d H:i:s'),
                'veritabani' => $db_durum,
            ], 'Finans Kalesi API çalışıyor');
            break;
        
        // ─── Auth (Giris/Kayit) ───
        case 'auth':
            require_once BASE_PATH . '/routes/auth.php';
            break;
        
        // ─── Cariler (Aşama 1.3) ───
        case 'cariler':
            require_once BASE_PATH . '/routes/cari.php';
            break;
        
        // ─── Çek/Senet (Aşama 1.4) ───
        case 'cek-senet':
            require_once BASE_PATH . '/routes/cek_senet.php';
            break;
        
        // ─── Ödeme Takip (Aşama 1.5) ───
        case 'odemeler':
            require_once BASE_PATH . '/routes/odeme.php';
            break;
        
        // ─── Varlık & Kasa (Aşama 1.9) ───
        case 'kasa':
            require_once BASE_PATH . '/routes/kasa.php';
            break;

        // ─── Dashboard Özet (Sprint 2A-3) ───
        case 'dashboard':
            require_once BASE_PATH . '/routes/dashboard.php';
            break;

        // ─── API Ana Sayfa ───
        case '':
            Response::basarili([
                'uygulama' => 'Finans Kalesi API',
                'versiyon' => '1.0.0',
                'dokuman'  => 'Endpoint listesi yakında eklenecek',
            ], 'Finans Kalesi API\'ye hoş geldiniz');
            break;
        
        // ─── Bilinmeyen Endpoint ───
        default:
            Response::bulunamadi("'$modul' endpoint'i bulunamadı");
            break;
    }
    
} catch (Exception $e) {
    // Hata yakalama — production'da detay gosterme
    $hata_mesaj = 'Beklenmeyen bir hata olustu';
    
    // Hatayi logla (error_log sunucu loguna yazar)
    error_log('Finans Kalesi HATA: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
    
    Response::sunucu_hatasi($hata_mesaj);
}