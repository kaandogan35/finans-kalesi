<?php
/**
 * ParamGo — TurController
 *
 * Tanıtım turu tamamlanma durumlarını yönetir.
 * Görev 2 kapsamında tam olarak implement edilecek.
 *
 * GET /api/tur           → durum()
 * PUT /api/tur/{tur_adi} → tamamla()
 */

class TurController {

    private $db;

    public function __construct() {
        $this->db = Database::baglan();
    }

    /**
     * Kullanıcının tamamlanan turlarını döndür.
     * GET /api/tur
     */
    public function durum(): void {
        $payload = AuthMiddleware::dogrula();

        $stmt = $this->db->prepare(
            "SELECT tamamlanan_turlar FROM kullanicilar WHERE id = :id AND sirket_id = :sid"
        );
        $stmt->execute([
            ':id'  => (int)$payload['sub'],
            ':sid' => (int)$payload['sirket_id'],
        ]);
        $row = $stmt->fetch();

        $tamamlananlar = [];
        if ($row && $row['tamamlanan_turlar']) {
            $tamamlananlar = json_decode($row['tamamlanan_turlar'], true, 4) ?? [];
        }

        Response::basarili(['tamamlanan_turlar' => $tamamlananlar]);
    }

    /**
     * Bir turu tamamlandı olarak işaretle.
     * PUT /api/tur/{tur_adi}
     *
     * Geçerli tur adları: hosgeldin, dashboard, cariler, cek-senet, kasa, odemeler
     */
    public function tamamla(string $tur_adi): void {
        $payload = AuthMiddleware::dogrula();

        $gecerli_turlar = ['hosgeldin', 'dashboard', 'cariler', 'cek-senet', 'kasa', 'odemeler'];
        if (!in_array($tur_adi, $gecerli_turlar)) {
            Response::hata('Geçersiz tur adı', 400);
            return;
        }

        // Mevcut tamamlananları al
        $stmt = $this->db->prepare(
            "SELECT tamamlanan_turlar FROM kullanicilar WHERE id = :id AND sirket_id = :sid"
        );
        $stmt->execute([
            ':id'  => (int)$payload['sub'],
            ':sid' => (int)$payload['sirket_id'],
        ]);
        $row = $stmt->fetch();

        $tamamlananlar = [];
        if ($row && $row['tamamlanan_turlar']) {
            $tamamlananlar = json_decode($row['tamamlanan_turlar'], true, 4) ?? [];
        }

        // Zaten tamamlandıysa tekrar ekleme
        if (!in_array($tur_adi, $tamamlananlar)) {
            $tamamlananlar[] = $tur_adi;
        }

        $stmt2 = $this->db->prepare(
            "UPDATE kullanicilar SET tamamlanan_turlar = :turlar WHERE id = :id AND sirket_id = :sid"
        );
        $stmt2->execute([
            ':turlar' => json_encode($tamamlananlar),
            ':id'     => (int)$payload['sub'],
            ':sid'    => (int)$payload['sirket_id'],
        ]);

        Response::basarili(['tamamlanan_turlar' => $tamamlananlar], "Tur '$tur_adi' tamamlandı olarak işaretlendi");
    }
}
