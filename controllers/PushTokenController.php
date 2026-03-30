<?php
/**
 * Finans Kalesi — Push Token Controller
 *
 * POST /api/push-tokens/kaydet  → Cihaz push token'ını kaydet/güncelle
 * DELETE /api/push-tokens/sil   → Çıkışta token'ı pasife çek
 */

class PushTokenController {

    /**
     * Cihaz token'ını kaydet veya güncelle
     */
    public function kaydet($girdi) {
        $payload = AuthMiddleware::dogrula();
        $kullanici_id = (int) $payload['sub'];
        $sirket_id    = (int) $payload['sirket_id'];

        if (empty($girdi['token'])) {
            Response::dogrulama_hatasi(['token' => 'Push token zorunludur']);
            return;
        }
        if (empty($girdi['platform']) || !in_array($girdi['platform'], ['ios', 'android'])) {
            Response::dogrulama_hatasi(['platform' => 'Platform ios veya android olmalıdır']);
            return;
        }

        try {
            $db = Database::baglan();

            // Token varsa güncelle, yoksa ekle (UPSERT)
            $stmt = $db->prepare("
                INSERT INTO push_tokens (sirket_id, kullanici_id, token, platform, cihaz_id, aktif)
                VALUES (:sid, :kid, :token, :platform, :cihaz_id, 1)
                ON DUPLICATE KEY UPDATE
                    kullanici_id = VALUES(kullanici_id),
                    sirket_id = VALUES(sirket_id),
                    platform = VALUES(platform),
                    aktif = 1,
                    guncelleme_tarihi = NOW()
            ");
            $stmt->execute([
                ':sid'      => $sirket_id,
                ':kid'      => $kullanici_id,
                ':token'    => substr($girdi['token'], 0, 512),
                ':platform' => $girdi['platform'],
                ':cihaz_id' => isset($girdi['cihaz_id']) ? substr($girdi['cihaz_id'], 0, 255) : null,
            ]);

            Response::basarili(null, 'Push token kaydedildi');

        } catch (Exception $e) {
            error_log('Push token kayıt hatası: ' . $e->getMessage());
            Response::sunucu_hatasi('Token kaydedilemedi');
        }
    }

    /**
     * Çıkışta token'ı pasife çek
     */
    public function sil($girdi) {
        $payload = AuthMiddleware::dogrula();
        $kullanici_id = (int) $payload['sub'];

        if (empty($girdi['token'])) {
            Response::dogrulama_hatasi(['token' => 'Push token zorunludur']);
            return;
        }

        try {
            $db = Database::baglan();
            $stmt = $db->prepare("
                UPDATE push_tokens SET aktif = 0
                WHERE token = :token AND kullanici_id = :kid
            ");
            $stmt->execute([':token' => $girdi['token'], ':kid' => $kullanici_id]);

            Response::basarili(null, 'Push token silindi');

        } catch (Exception $e) {
            error_log('Push token silme hatası: ' . $e->getMessage());
            Response::sunucu_hatasi('Token silinemedi');
        }
    }
}
