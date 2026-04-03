<?php
/**
 * ParamGo — API Giriş Noktası (Tek Kapı)
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

// Güvenlik header'ları
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

// ============================================
// 2. DOSYALARI YUKLE (Autoload)
// ============================================

// ⚠️ CANLI SUNUCU: Sabit yol (lokaldeki dirname(__DIR__) yerine)
define('BASE_PATH', '/home/goparam/repositories/finans-kalesi');

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
require_once BASE_PATH . '/models/Abonelik.php';
require_once BASE_PATH . '/middleware/PlanKontrol.php';
require_once BASE_PATH . '/middleware/SinirKontrol.php';
require_once BASE_PATH . '/middleware/YetkiKontrol.php';
require_once BASE_PATH . '/controllers/AuthController.php';
require_once BASE_PATH . '/controllers/PushTokenController.php';
require_once BASE_PATH . '/utils/SmtpHelper.php';
require_once BASE_PATH . '/utils/MailHelper.php';
require_once BASE_PATH . '/utils/MailSablonlar.php';
require_once BASE_PATH . '/controllers/CronController.php';
require_once BASE_PATH . '/controllers/TurController.php';
require_once BASE_PATH . '/models/Guvenlik.php';
require_once BASE_PATH . '/utils/TOTPHelper.php';
require_once BASE_PATH . '/models/Bildirim.php';
require_once BASE_PATH . '/utils/BildirimOlusturucu.php';
require_once BASE_PATH . '/models/Rapor.php';
require_once BASE_PATH . '/controllers/RaporController.php';

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
        case 'health':
            try {
                $db = Database::baglan();
                $db->query('SELECT 1');
            } catch (Exception $e) {
                error_log('Health check DB hatasi: ' . $e->getMessage());
                Response::sunucu_hatasi('Servis geçici olarak kullanılamıyor');
                break;
            }
            Response::basarili([
                'durum' => 'aktif',
                'zaman' => date('Y-m-d H:i:s'),
            ], 'ParamGo API çalışıyor');
            break;

        // ─── Auth (Giris/Kayit) ───
        case 'auth':
            require_once BASE_PATH . '/routes/auth.php';
            break;

        // ─── Cariler ───
        case 'cariler':
            require_once BASE_PATH . '/routes/cari.php';
            break;

        // ─── Çek/Senet ───
        case 'cek-senet':
            require_once BASE_PATH . '/routes/cek_senet.php';
            break;

        // ─── Ödeme Takip ───
        case 'odemeler':
            require_once BASE_PATH . '/routes/odeme.php';
            break;

        // ─── Kasa ───
        case 'kasa':
            require_once BASE_PATH . '/routes/kasa.php';
            break;

        // ─── Dashboard ───
        case 'dashboard':
            require_once BASE_PATH . '/routes/dashboard.php';
            break;

        // ─── Ayarlar ───
        case 'ayarlar':
            require_once BASE_PATH . '/routes/ayarlar.php';
            break;

        // ─── Abonelik ───
        case 'abonelik':
            require_once BASE_PATH . '/routes/abonelik.php';
            break;

        // ─── Webhook ───
        case 'webhook':
            require_once BASE_PATH . '/routes/abonelik.php';
            break;

        // ─── Kullanım Sınırları ───
        case 'sinir':
            require_once BASE_PATH . '/routes/sinir.php';
            break;

        // ─── Cron ───
        case 'cron':
            require_once BASE_PATH . '/routes/cron.php';
            break;

        // ─── Tanıtım Turu ───
        case 'tur':
            require_once BASE_PATH . '/routes/tur.php';
            break;

        // ─── Veresiye ───
        case 'veresiye':
            require_once BASE_PATH . '/routes/veresiye.php';
            break;

        // ─── Kullanıcı Yönetimi ───
        case 'kullanicilar':
            require_once BASE_PATH . '/routes/kullanicilar.php';
            break;

        // ─── Güvenlik ───
        case 'guvenlik':
            require_once BASE_PATH . '/routes/guvenlik.php';
            break;

        // ─── Bildirimler ───
        case 'bildirimler':
            require_once BASE_PATH . '/routes/bildirimler.php';
            break;

        // ─── Raporlar ───
        case 'raporlar':
            require_once BASE_PATH . '/routes/raporlar.php';
            break;

        // ─── Tekrarlayan İşlemler ───
        case 'tekrarlayan-islemler':
            require_once BASE_PATH . '/routes/tekrarlayan_islem.php';
            break;

        // ─── Kategoriler ───
        case 'kategoriler':
            require_once BASE_PATH . '/routes/kategoriler.php';
            break;

        // ─── Onboarding ───
        case 'onboarding':
            require_once BASE_PATH . '/routes/onboarding.php';
            break;

        // ─── Push Token (Mobil Bildirim) ───
        case 'push-tokens':
            require_once BASE_PATH . '/routes/push_token.php';
            break;

        // ─── API Ana Sayfa ───
        case '':
            Response::basarili([
                'uygulama' => 'ParamGo API',
                'versiyon' => '1.0.0',
                'dokuman'  => 'Endpoint listesi yakında eklenecek',
            ], 'ParamGo API\'ye hoş geldiniz');
            break;

        // ─── Bilinmeyen Endpoint ───
        default:
            Response::bulunamadi("'" . htmlspecialchars($modul, ENT_QUOTES, 'UTF-8') . "' endpoint'i bulunamadı");
            break;
    }

} catch (Exception $e) {
    $hata_mesaj = 'Beklenmeyen bir hata olustu';
    error_log('ParamGo HATA: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
    Response::sunucu_hatasi($hata_mesaj);
}
