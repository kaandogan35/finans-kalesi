<?php
/**
 * Finans Kalesi — Rapor Route'ları
 *
 * Tüm route'lar auth gerektirir (rol sınırlaması yok).
 *
 * GET /api/raporlar/cari-yaslandirma  → Cari yaşlandırma
 * GET /api/raporlar/nakit-akis        → Nakit akış
 * GET /api/raporlar/cek-portfoy       → Çek/senet portföy
 * GET /api/raporlar/odeme-ozet        → Ödeme özet
 * GET /api/raporlar/genel-ozet        → Genel finansal özet
 * GET /api/raporlar/gecmis            → Rapor geçmişi
 */
// Auth kontrolü — tüm kullanıcılar erişebilir
$payload = AuthMiddleware::dogrula();

$rapor = new RaporController();

$alt_yol = $yol_parcalari[1] ?? '';
$method   = $_SERVER['REQUEST_METHOD'];

switch ($alt_yol) {
    case 'cari-yaslandirma':
        if ($method === 'GET') { $rapor->cariYaslandirma($payload); }
        else { Response::hata('Method not allowed', 405); }
        break;

    case 'nakit-akis':
        if ($method === 'GET') { $rapor->nakitAkis($payload); }
        else { Response::hata('Method not allowed', 405); }
        break;

    case 'cek-portfoy':
        if ($method === 'GET') { $rapor->cekPortfoy($payload); }
        else { Response::hata('Method not allowed', 405); }
        break;

    case 'odeme-ozet':
        if ($method === 'GET') { $rapor->odemeOzet($payload); }
        else { Response::hata('Method not allowed', 405); }
        break;

    case 'genel-ozet':
        if ($method === 'GET') { $rapor->genelOzet($payload); }
        else { Response::hata('Method not allowed', 405); }
        break;

    case 'gecmis':
        if ($method === 'GET') { $rapor->gecmis($payload); }
        else { Response::hata('Method not allowed', 405); }
        break;

    default:
        Response::hata('Bilinmeyen rapor endpoint\'i', 404);
        break;
}
