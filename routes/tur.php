<?php
/**
 * Finans Kalesi — Tur Route Tanımları
 *
 * GET /api/tur           → TurController::durum()
 * PUT /api/tur/{tur_adi} → TurController::tamamla()
 */

$tur = new TurController();

$islem = $yol_parcalari[1] ?? '';

switch ($islem) {

    case '':
        if ($metod !== 'GET') { Response::hata('Sadece GET kabul edilir', 405); break; }
        $tur->durum();
        break;

    default:
        // /api/tur/{tur_adi}
        if ($metod !== 'PUT') { Response::hata('Sadece PUT kabul edilir', 405); break; }
        $tur->tamamla($islem);
        break;
}
