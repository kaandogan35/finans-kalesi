<?php
// =============================================================
// controllers/DashboardController.php — Dashboard Özet Kontrolcüsü
// Finans Kalesi SaaS — Sprint 2A-3
//
// Üç modülün (Cari, Çek/Senet, Ödeme) özet verilerini
// tek sorguda derleyip Dashboard'a sunar.
// Her sorgu sirket_id ile korunur — Multi-Tenant güvenliği sağlanır.
// =============================================================

class DashboardController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // ─── GET /api/dashboard ───────────────────────────────────────────────────
    public function ozet(array $payload): void
    {
        try {
            $sirket_id = (int) $payload['sirket_id'];

            Response::basarili([
                'cari'     => $this->cari_ozet($sirket_id),
                'cekSenet' => $this->cek_senet_ozet($sirket_id),
                'odeme'    => $this->odeme_ozet($sirket_id),
            ]);
        } catch (Exception $e) {
            error_log('Dashboard ozet hatasi: ' . $e->getMessage());
            Response::sunucu_hatasi('Dashboard verileri alinamadi');
        }
    }

    // ─── Cari Özet ────────────────────────────────────────────────────────────
    // Döndürür:
    //   toplam_alacak       → bakiye > 0 olan kartların toplamı
    //   toplam_borc         → bakiye < 0 olan kartların mutlak değer toplamı
    //   aktif_cari_sayisi   → aktif ve silinmemiş kart sayısı
    //   en_yuksek_bakiyeli  → bakiyesi en yüksek (mutlak değerce) 5 cari
    private function cari_ozet(int $sirket_id): array
    {
        // Özet rakamlar
        $stmt = $this->db->prepare(
            "SELECT
                COALESCE(SUM(CASE WHEN bakiye > 0 THEN bakiye    ELSE 0 END), 0) AS toplam_alacak,
                COALESCE(SUM(CASE WHEN bakiye < 0 THEN ABS(bakiye) ELSE 0 END), 0) AS toplam_borc,
                COUNT(CASE WHEN aktif_mi = 1 THEN 1 END) AS aktif_cari_sayisi
             FROM cari_kartlar
             WHERE sirket_id = :sirket_id AND silindi_mi = 0"
        );
        $stmt->execute([':sirket_id' => $sirket_id]);
        $ozet = $stmt->fetch(PDO::FETCH_ASSOC);

        // En yüksek bakiyeli 5 cari (pozitif veya negatif)
        $stmt2 = $this->db->prepare(
            "SELECT id, cari_adi_sifreli, cari_turu, bakiye
             FROM cari_kartlar
             WHERE sirket_id = :sirket_id AND silindi_mi = 0 AND aktif_mi = 1
             ORDER BY ABS(bakiye) DESC
             LIMIT 5"
        );
        $stmt2->execute([':sirket_id' => $sirket_id]);
        $kayitlar = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        // Şifreli cari adını çöz
        $kripto = new SistemKripto();
        foreach ($kayitlar as &$k) {
            $k['cari_adi'] = $kripto->coz($k['cari_adi_sifreli']);
            unset($k['cari_adi_sifreli']);
        }
        unset($k);
        $ozet['en_yuksek_bakiyeli'] = $kayitlar;

        return $ozet;
    }

    // ─── Çek / Senet Özet ─────────────────────────────────────────────────────
    // Döndürür:
    //   portfoyde_toplam  → durum='portfoyde' olan çek/senetlerin toplam TL tutarı
    //   portfoyde_adet    → durum='portfoyde' olan çek/senet sayısı
    //   alacak_toplam     → alacak_ceki/alacak_senedi (portföyde + tahsilde) toplam TL
    //   borc_toplam       → borc_ceki/borc_senedi (portföyde) toplam TL
    //   yaklasan_vadeler  → bugünden 30 gün içinde vadesi gelen, portföydeki/tahsildeki 5 kayıt
    private function cek_senet_ozet(int $sirket_id): array
    {
        // Portföy toplamı + alacak/borç ayrımı + gecikmiş çekler
        $stmt = $this->db->prepare(
            "SELECT
                COALESCE(SUM(CASE WHEN durum = 'portfoyde' THEN tutar_tl ELSE 0 END), 0) AS portfoyde_toplam,
                COUNT(CASE WHEN durum = 'portfoyde' THEN 1 END) AS portfoyde_adet,
                COALESCE(SUM(CASE WHEN tur IN ('alacak_ceki','alacak_senedi')
                    AND durum IN ('portfoyde','tahsile_verildi') THEN tutar_tl ELSE 0 END), 0) AS alacak_toplam,
                COALESCE(SUM(CASE WHEN tur IN ('borc_ceki','borc_senedi')
                    AND durum = 'portfoyde' THEN tutar_tl ELSE 0 END), 0) AS borc_toplam,
                COUNT(CASE WHEN durum = 'tahsile_verildi'
                    AND vade_tarihi < CURDATE() THEN 1 END) AS geciken_tahsil_adet,
                COALESCE(SUM(CASE WHEN durum = 'tahsile_verildi'
                    AND vade_tarihi < CURDATE() THEN tutar_tl ELSE 0 END), 0) AS geciken_tahsil_toplam,
                COUNT(CASE WHEN tur IN ('borc_ceki','borc_senedi')
                    AND durum = 'portfoyde'
                    AND vade_tarihi < CURDATE() THEN 1 END) AS geciken_kendi_adet,
                COALESCE(SUM(CASE WHEN tur IN ('borc_ceki','borc_senedi')
                    AND durum = 'portfoyde'
                    AND vade_tarihi < CURDATE() THEN tutar_tl ELSE 0 END), 0) AS geciken_kendi_toplam
             FROM cek_senetler
             WHERE sirket_id = :sirket_id AND silindi_mi = 0"
        );
        $stmt->execute([':sirket_id' => $sirket_id]);
        $ozet = $stmt->fetch(PDO::FETCH_ASSOC);

        // Yaklaşan vadeler (bugün → +30 gün) — cari adı ile birlikte
        $stmt2 = $this->db->prepare(
            "SELECT cs.id, cs.seri_no, cs.vade_tarihi, cs.tutar_tl, cs.durum, cs.tur,
                    ck.cari_adi_sifreli
             FROM cek_senetler cs
             LEFT JOIN cari_kartlar ck
                ON cs.cari_id = ck.id AND ck.silindi_mi = 0
             WHERE cs.sirket_id = :sirket_id
               AND cs.silindi_mi = 0
               AND cs.durum IN ('portfoyde', 'tahsile_verildi')
               AND cs.vade_tarihi BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
             ORDER BY cs.vade_tarihi ASC
             LIMIT 5"
        );
        $stmt2->execute([':sirket_id' => $sirket_id]);
        $vadeler = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        // Şifreli cari adını çöz
        $kripto = new SistemKripto();
        foreach ($vadeler as &$v) {
            $v['cari_adi'] = $v['cari_adi_sifreli'] ? $kripto->coz($v['cari_adi_sifreli']) : null;
            unset($v['cari_adi_sifreli']);
        }
        unset($v);

        $ozet['yaklasan_vadeler'] = $vadeler;

        return $ozet;
    }

    // ─── Ödeme Takip Özet ─────────────────────────────────────────────────────
    // Döndürür:
    //   bekleyen_toplam → durum='bekliyor' olan tüm ödeme/tahsilatların toplam tutarı
    //   bekleyen_adet   → durum='bekliyor' olan kayıt sayısı
    private function odeme_ozet(int $sirket_id): array
    {
        $stmt = $this->db->prepare(
            "SELECT
                COUNT(CASE WHEN durum = 'bekliyor' THEN 1 END) AS bekleyen_adet,
                COALESCE(SUM(CASE WHEN durum = 'bekliyor' THEN tutar ELSE 0 END), 0) AS bekleyen_toplam
             FROM odeme_takip
             WHERE sirket_id = :sirket_id AND silindi_mi = 0"
        );
        $stmt->execute([':sirket_id' => $sirket_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
