<?php
// =============================================================
// SinirController.php — Kullanım Sınırları API
// Finans Kalesi SaaS
//
// GET /api/sinir/durum → Kullanıcının mevcut kullanımı + sınırlar
// =============================================================

class SinirController {

    // ─── GET /api/sinir/durum ───────────────────────────────
    public function durum($payload) {
        try {
            $ozet = SinirKontrol::durumOzeti($payload);
            Response::basarili($ozet);
        } catch (Exception $e) {
            error_log('Sinir durum hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Kullanim limitleri alinamadi');
        }
    }
}
