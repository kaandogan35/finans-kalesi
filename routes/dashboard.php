<?php
// =============================================================
// routes/dashboard.php — Dashboard Özet Modülü URL Yönlendirmesi
// Finans Kalesi SaaS — Sprint 2A-3
//
// Bu dosya index.php'den require edilir ve doğrudan çalışır.
// Diğer route dosyalarıyla aynı yapıda.
//
// index.php'den gelen değişkenler:
//   $metod         → HTTP metodu (GET, POST, PUT, DELETE)
//   $yol_parcalari → URL parçaları ['dashboard']
// =============================================================

require_once BASE_PATH . '/controllers/DashboardController.php';

// JWT dogrulama — dashboard da giriş gerektirir
$payload = AuthMiddleware::dogrula();

// Veritabani baglantisi
$db = Database::baglan();

// Controller'i olustur
$dashboard = new DashboardController($db);

// URL parcalarini analiz et
// /api/dashboard → yol_parcalari: ['dashboard']
$parca_sayisi = count($yol_parcalari);

// ─── /api/dashboard ───
if ($parca_sayisi === 1) {
    if ($metod === 'GET') {
        $dashboard->ozet($payload);
    } else {
        Response::hata('Bu HTTP metodu desteklenmiyor', 405);
    }
}

// Hicbir route eslesmedi
else {
    Response::bulunamadi('Dashboard endpoint bulunamadi');
}
