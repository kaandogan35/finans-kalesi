<?php
/**
 * Onboarding Route
 *
 * POST /api/onboarding/sirket   → Adım 1
 * POST /api/onboarding/cari     → Adım 2 (opsiyonel)
 * POST /api/onboarding/tamamla  → Adım 3 + tamamla
 */

require_once BASE_PATH . '/models/CariKart.php';
require_once BASE_PATH . '/models/CekSenet.php';
require_once BASE_PATH . '/controllers/OnboardingController.php';

// JWT dogrulama — tüm onboarding endpoint'leri giris gerektirir
$payload = AuthMiddleware::dogrula();

$onboarding = new OnboardingController();
$islem      = $yol_parcalari[1] ?? '';

switch ($islem) {

    case 'sirket':
        if ($metod !== 'POST') { Response::hata('Bu endpoint sadece POST kabul eder', 405); break; }
        $onboarding->sirket($girdi);
        break;

    case 'cari':
        if ($metod !== 'POST') { Response::hata('Bu endpoint sadece POST kabul eder', 405); break; }
        $onboarding->cari($girdi);
        break;

    case 'tamamla':
        if ($metod !== 'POST') { Response::hata('Bu endpoint sadece POST kabul eder', 405); break; }
        $onboarding->tamamla($girdi);
        break;

    default:
        Response::bulunamadi("Onboarding endpoint'i bulunamadı: " . htmlspecialchars($islem, ENT_QUOTES, 'UTF-8'));
        break;
}
