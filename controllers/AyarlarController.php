<?php
/**
 * Finans Kalesi — Ayarlar Controller
 *
 * PUT /api/ayarlar/tema  → Sirket temasini guncelle (sahip/admin)
 */

class AyarlarController {

    private $sirket_model;

    public function __construct() {
        $this->sirket_model = new Sirket();
    }

    /**
     * TEMA GUNCELLE
     * Sadece 'sahip' ve 'admin' rolleri tema degistirebilir.
     */
    public function tema_guncelle($girdi) {
        // 1. Token dogrula
        $payload = AuthMiddleware::dogrula();

        // 2. Yetki kontrolu — sadece sahip veya admin
        $izinli_roller = ['sahip', 'admin'];
        if (!in_array($payload['rol'], $izinli_roller, true)) {
            Response::hata('Bu islemi yapmak icin yetkiniz yok', 403);
            return;
        }

        // 3. Girdi dogrula
        $izinli_temalar = ['banking', 'earthy', 'dark'];
        $tema_adi = trim($girdi['tema_adi'] ?? '');

        if (!in_array($tema_adi, $izinli_temalar, true)) {
            Response::dogrulama_hatasi([
                'tema_adi' => 'Geçerli temalar: ' . implode(', ', $izinli_temalar)
            ]);
            return;
        }

        try {
            // 4. Sirket temasini guncelle (sirket_id JWT'den — kullanici girdisinden ASLA)
            $this->sirket_model->tema_guncelle($payload['sirket_id'], $tema_adi);

            SistemLog::kaydet(
                SistemLog::KASA_ERISIM,
                'tema_degistirildi: ' . $tema_adi,
                (int) $payload['sirket_id'],
                (int) $payload['sub']
            );

            Response::basarili(['tema_adi' => $tema_adi], 'Tema guncellendi');

        } catch (Exception $e) {
            Response::sunucu_hatasi('Tema guncellenemedi');
        }
    }
}
