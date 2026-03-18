<?php
/**
 * Finans Kalesi — Cron Route Tanımları
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

    default:
        Response::bulunamadi("Cron endpoint bulunamadi: " . htmlspecialchars($islem, ENT_QUOTES, 'UTF-8'));
        break;
}
