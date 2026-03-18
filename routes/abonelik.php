<?php
/**
 * Finans Kalesi — Abonelik & Webhook Route'ları
 *
 * /api/abonelik/*  → AbonelikController
 * /api/webhook/*   → WebhookController
 */

$db = Database::baglan();

require_once BASE_PATH . '/models/Abonelik.php';
require_once BASE_PATH . '/middleware/PlanKontrol.php';
require_once BASE_PATH . '/controllers/AbonelikController.php';
require_once BASE_PATH . '/controllers/WebhookController.php';

$abonelik_ctrl = new AbonelikController($db);
$webhook_ctrl  = new WebhookController($db);

// İkinci yol parçası: abonelik veya webhook
$alt_modul = $yol_parcalari[0] ?? '';   // 'abonelik' veya 'webhook'
$islem     = $yol_parcalari[1] ?? '';   // 'planlar', 'durum', 'gecmis', 'yukselt'
                                         // veya 'web', 'apple', 'google'

// ── ABONELIK ENDPOINT'LERİ ─────────────────
if ($alt_modul === 'abonelik') {

    // GET /api/abonelik/planlar — herkese açık
    if ($metod === 'GET' && $islem === 'planlar') {
        $abonelik_ctrl->planlar();
        exit;
    }

    // GET /api/abonelik/durum — JWT gerekli
    if ($metod === 'GET' && $islem === 'durum') {
        $abonelik_ctrl->durum();
        exit;
    }

    // GET /api/abonelik/gecmis — JWT gerekli
    if ($metod === 'GET' && $islem === 'gecmis') {
        $abonelik_ctrl->gecmis();
        exit;
    }

    // POST /api/abonelik/yukselt — JWT gerekli
    if ($metod === 'POST' && $islem === 'yukselt') {
        $abonelik_ctrl->yukselt($girdi);
        exit;
    }
}

// ── WEBHOOK ENDPOINT'LERİ ──────────────────
if ($alt_modul === 'webhook') {

    // POST /api/webhook/web
    if ($metod === 'POST' && $islem === 'web') {
        $webhook_ctrl->webOdeme($girdi);
        exit;
    }

    // POST /api/webhook/apple
    if ($metod === 'POST' && $islem === 'apple') {
        $webhook_ctrl->appleIap($girdi);
        exit;
    }

    // POST /api/webhook/google
    if ($metod === 'POST' && $islem === 'google') {
        $webhook_ctrl->googlePlay($girdi);
        exit;
    }
}

// Tanımlanmamış endpoint
Response::bulunamadi("'" . htmlspecialchars("$alt_modul/$islem", ENT_QUOTES, 'UTF-8') . "' endpoint'i bulunamadi");
