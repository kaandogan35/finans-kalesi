<?php
/**
 * ParamGo — Push Token Route
 *
 * POST   /api/push-tokens/kaydet → PushTokenController::kaydet()
 * DELETE /api/push-tokens/sil    → PushTokenController::sil()
 */

$pushToken = new PushTokenController();

$islem = $yol_parcalari[1] ?? '';

switch ($islem) {

    case 'kaydet':
        if ($metod !== 'POST') {
            Response::hata('Bu endpoint sadece POST kabul eder', 405);
            break;
        }
        $pushToken->kaydet($girdi);
        break;

    case 'sil':
        if ($metod !== 'DELETE') {
            Response::hata('Bu endpoint sadece DELETE kabul eder', 405);
            break;
        }
        $pushToken->sil($girdi);
        break;

    default:
        Response::bulunamadi("Push token endpoint'i bulunamadı: " . htmlspecialchars($islem, ENT_QUOTES, 'UTF-8'));
        break;
}
