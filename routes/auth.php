<?php
/**
 * Finans Kalesi — Auth Route (Kimlik Dogrulama Yollari)
 * 
 * Bu dosya index.php'den cagirilir.
 * URL'in ikinci parcasina bakarak dogru controller metodunu calistirir.
 * 
 * POST /api/auth/kayit   → AuthController::kayit()
 * POST /api/auth/giris   → AuthController::giris()
 * POST /api/auth/yenile  → AuthController::yenile()
 * POST /api/auth/cikis   → AuthController::cikis()
 * GET  /api/auth/ben     → AuthController::ben()
 */

// Controller'i olustur
$auth = new AuthController();

// URL'in ikinci parcasi: auth/kayit → "kayit"
$islem = $yol_parcalari[1] ?? '';

switch ($islem) {
    
    case 'kayit':
        // Sadece POST kabul et
        if ($metod !== 'POST') {
            Response::hata('Bu endpoint sadece POST kabul eder', 405);
            break;
        }
        $auth->kayit($girdi);
        break;
    
    case 'giris':
        if ($metod !== 'POST') {
            Response::hata('Bu endpoint sadece POST kabul eder', 405);
            break;
        }
        $auth->giris($girdi);
        break;
    
    case 'yenile':
        if ($metod !== 'POST') {
            Response::hata('Bu endpoint sadece POST kabul eder', 405);
            break;
        }
        $auth->yenile($girdi);
        break;
    
    case 'cikis':
        if ($metod !== 'POST') {
            Response::hata('Bu endpoint sadece POST kabul eder', 405);
            break;
        }
        $auth->cikis($girdi);
        break;
    
    case 'ben':
        if ($metod !== 'GET') {
            Response::hata('Bu endpoint sadece GET kabul eder', 405);
            break;
        }
        $auth->ben();
        break;
    
    default:
        Response::bulunamadi("Auth endpoint'i bulunamadi: $islem");
        break;
}
