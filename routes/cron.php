<?php
/**
 * ParamGo — Cron Route Tanımları
 *
 * GET /api/cron/gunluk-ozet      → CronController::gunlukOzet()
 * GET /api/cron/haftalik-vadeler → CronController::haftalikVadeler()
 * GET /api/cron/aylik-bilanco    → CronController::aylikBilanco()
 *
 * Tüm endpoint'ler ?key=CRON_SECRET ile korunur.
 */

require_once BASE_PATH . '/utils/SmtpHelper.php';
require_once BASE_PATH . '/utils/MailHelper.php';
require_once BASE_PATH . '/utils/MailSablonlar.php';

// Güvenlik: CRON_SECRET tanımlı değilse tüm cron endpoint'lerini kapat
if (empty(env('CRON_SECRET', ''))) {
    error_log('UYARI: CRON_SECRET tanimli degil — cron endpoint\'leri devre disi.');
    Response::hata('Cron servisi yapilandirilmamis', 503);
    return;
}

$cron = new CronController();

$islem = $yol_parcalari[1] ?? '';

switch ($islem) {

    case 'gunluk-ozet':
        if ($metod !== 'GET') { Response::hata('Sadece GET kabul edilir', 405); break; }
        $cron->gunlukOzet();
        break;

    case 'haftalik-vadeler':
        if ($metod !== 'GET') { Response::hata('Sadece GET kabul edilir', 405); break; }
        $cron->haftalikVadeler();
        break;

    case 'aylik-bilanco':
        if ($metod !== 'GET') { Response::hata('Sadece GET kabul edilir', 405); break; }
        $cron->aylikBilanco();
        break;

    case 'bildirim-kontrol':
        if ($metod !== 'GET') { Response::hata('Sadece GET kabul edilir', 405); break; }
        $cron->bildirimKontrol();
        break;

    case 'push-test':
        if ($metod !== 'GET') { Response::hata('Sadece GET kabul edilir', 405); break; }
        require_once BASE_PATH . '/utils/PushHelper.php';

        $env_kontrol = [
            'APNS_KEY_ID'    => env('APNS_KEY_ID') ? 'VAR (' . strlen(env('APNS_KEY_ID')) . ' karakter)' : 'EKSİK',
            'APNS_TEAM_ID'   => env('APNS_TEAM_ID') ? 'VAR (' . strlen(env('APNS_TEAM_ID')) . ' karakter)' : 'EKSİK',
            'APNS_AUTH_KEY'  => env('APNS_AUTH_KEY') ? 'VAR (' . strlen(env('APNS_AUTH_KEY')) . ' karakter)' : 'EKSİK',
            'APP_ENV'        => env('APP_ENV', 'tanımsız'),
        ];

        // push_tokens tablosundan ilk token'ı al
        try {
            $db = Database::baglan();
            $stmt = $db->query("SELECT kullanici_id, token, platform FROM push_tokens WHERE aktif = 1 LIMIT 1");
            $token_row = $stmt->fetch();
        } catch (Exception $e) {
            echo json_encode(['hata' => 'DB: ' . $e->getMessage()]);
            break;
        }

        if (!$token_row) {
            echo json_encode(['env' => $env_kontrol, 'hata' => 'push_tokens tablosunda aktif token yok']);
            break;
        }

        // Error log'u yakala
        ob_start();
        $eski_error_log = ini_set('log_errors', '1');
        $sonuc = PushHelper::gonder(
            $token_row['token'],
            'Test Bildirim',
            'ParamGo test mesajı — ' . date('H:i:s'),
            ['url' => '/dashboard']
        );
        ob_end_clean();

        header('Content-Type: application/json');
        echo json_encode([
            'env'    => $env_kontrol,
            'token'  => substr($token_row['token'], 0, 16) . '...',
            'user'   => $token_row['kullanici_id'],
            'sonuc'  => $sonuc ? 'BAŞARILI' : 'BAŞARISIZ',
        ], JSON_UNESCAPED_UNICODE);
        break;

    default:
        Response::bulunamadi("Cron endpoint bulunamadi: " . htmlspecialchars($islem, ENT_QUOTES, 'UTF-8'));
        break;
}
