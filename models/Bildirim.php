<?php
/**
 * ParamGo — Bildirim Modeli
 *
 * Bildirimler modülü veritabanı sorguları:
 * - Bildirim CRUD
 * - Okunmamış sayısı
 * - Bildirim tercihleri
 * - Dedup kontrolü
 */

class Bildirim {

    private $db;

    public function __construct() {
        $this->db = Database::baglan();
    }

    // ─── BİLDİRİM LİSTELEME ─────────────────────────────────────

    /**
     * Kullanıcının bildirimlerini listele (sayfalı)
     */
    public function listele(int $sirket_id, int $kullanici_id, int $sayfa = 1, int $limit = 20, array $filtreler = []): array {
        $offset = ($sayfa - 1) * $limit;

        $where = "WHERE b.sirket_id = :sirket_id AND b.kullanici_id = :kullanici_id AND b.silindi_mi = 0";
        $params = [':sirket_id' => $sirket_id, ':kullanici_id' => $kullanici_id];

        if (isset($filtreler['okundu_mu'])) {
            $where .= " AND b.okundu_mu = :okundu";
            $params[':okundu'] = (int)$filtreler['okundu_mu'];
        }

        if (!empty($filtreler['tip'])) {
            $where .= " AND b.tip = :tip";
            $params[':tip'] = $filtreler['tip'];
        }

        if (!empty($filtreler['oncelik'])) {
            $where .= " AND b.oncelik = :oncelik";
            $params[':oncelik'] = $filtreler['oncelik'];
        }

        // Toplam sayı
        $sql_say = "SELECT COUNT(*) as toplam FROM bildirimler b $where";
        $stmt = $this->db->prepare($sql_say);
        $stmt->execute($params);
        $toplam = (int)$stmt->fetch()['toplam'];

        // Kayıtlar
        $sql = "SELECT b.*
                FROM bildirimler b
                $where
                ORDER BY b.olusturma_tarihi DESC
                LIMIT $limit OFFSET $offset";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $kayitlar = $stmt->fetchAll();

        return [
            'kayitlar'     => $kayitlar,
            'toplam'       => $toplam,
            'sayfa'        => $sayfa,
            'limit'        => $limit,
            'toplam_sayfa' => ceil($toplam / $limit),
        ];
    }

    /**
     * Okunmamış bildirim sayısı
     */
    public function okunmamis_sayisi(int $sirket_id, int $kullanici_id): int {
        $sql = "SELECT COUNT(*) as sayi FROM bildirimler
                WHERE sirket_id = :sirket_id AND kullanici_id = :kullanici_id AND okundu_mu = 0 AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':sirket_id' => $sirket_id, ':kullanici_id' => $kullanici_id]);
        return (int)$stmt->fetch()['sayi'];
    }

    // ─── BİLDİRİM OLUŞTURMA ─────────────────────────────────────

    /**
     * Yeni bildirim oluştur
     */
    public function olustur(array $veri): int {
        $sql = "INSERT INTO bildirimler
                    (sirket_id, kullanici_id, tip, baslik, mesaj, oncelik, kaynak_turu, kaynak_id, aksiyon_url)
                VALUES
                    (:sirket_id, :kullanici_id, :tip, :baslik, :mesaj, :oncelik, :kaynak_turu, :kaynak_id, :aksiyon_url)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':sirket_id'     => $veri['sirket_id'],
            ':kullanici_id'  => $veri['kullanici_id'],
            ':tip'           => $veri['tip'],
            ':baslik'        => $veri['baslik'],
            ':mesaj'         => $veri['mesaj'],
            ':oncelik'       => $veri['oncelik'] ?? 'normal',
            ':kaynak_turu'   => $veri['kaynak_turu'] ?? null,
            ':kaynak_id'     => $veri['kaynak_id'] ?? null,
            ':aksiyon_url'   => $veri['aksiyon_url'] ?? null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    // ─── OKUNDU İŞLEMİ ──────────────────────────────────────────

    /**
     * Tek bildirimi okundu yap
     */
    public function okundu_yap(int $id, int $sirket_id, int $kullanici_id): bool {
        $sql = "UPDATE bildirimler
                SET okundu_mu = 1, okunma_tarihi = NOW()
                WHERE id = :id AND sirket_id = :sirket_id AND kullanici_id = :kullanici_id AND okundu_mu = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id, ':sirket_id' => $sirket_id, ':kullanici_id' => $kullanici_id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Tüm bildirimleri okundu yap
     */
    public function tumunu_okundu_yap(int $sirket_id, int $kullanici_id): int {
        $sql = "UPDATE bildirimler
                SET okundu_mu = 1, okunma_tarihi = NOW()
                WHERE sirket_id = :sirket_id AND kullanici_id = :kullanici_id AND okundu_mu = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':sirket_id' => $sirket_id, ':kullanici_id' => $kullanici_id]);
        return $stmt->rowCount();
    }

    // ─── SİLME ───────────────────────────────────────────────────

    /**
     * Tek bildirimi sil
     */
    public function sil(int $id, int $sirket_id, int $kullanici_id): bool {
        // Soft delete — fiziksel silme yerine silindi_mi = 1
        $sql = "UPDATE bildirimler
                SET silindi_mi = 1
                WHERE id = :id AND sirket_id = :sirket_id AND kullanici_id = :kullanici_id AND silindi_mi = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id, ':sirket_id' => $sirket_id, ':kullanici_id' => $kullanici_id]);
        return $stmt->rowCount() > 0;
    }

    // ─── TERCİHLER ───────────────────────────────────────────────

    /**
     * Kullanıcının bildirim tercihlerini getir
     */
    public function tercihleri_getir(int $sirket_id, int $kullanici_id): array {
        $sql = "SELECT * FROM bildirim_tercihleri
                WHERE sirket_id = :sirket_id AND kullanici_id = :kullanici_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':sirket_id' => $sirket_id, ':kullanici_id' => $kullanici_id]);
        $kayitlar = $stmt->fetchAll();

        // Tip bazlı dönüştür
        $tercihler = [];
        foreach ($kayitlar as $k) {
            $tercihler[$k['bildirim_tipi']] = [
                'uygulama_ici' => (int)$k['uygulama_ici'],
                'email'        => (int)$k['email'],
                'sms'          => (int)$k['sms'],
                'telefon'      => (int)$k['telefon'],
                'whatsapp'     => (int)($k['whatsapp'] ?? 0),
                'push'         => (int)($k['push'] ?? 0),
            ];
        }

        // Varsayılan tipleri ekle (kayıt yoksa)
        $tipler = ['odeme_vade', 'cek_vade', 'geciken_odeme', 'guvenlik', 'sistem'];
        foreach ($tipler as $tip) {
            if (!isset($tercihler[$tip])) {
                $tercihler[$tip] = [
                    'uygulama_ici' => 1,
                    'email'        => 1,
                    'sms'          => 0,
                    'telefon'      => 0,
                    'whatsapp'     => 0,
                    'push'         => 0,
                ];
            }
        }

        return $tercihler;
    }

    /**
     * Bildirim tercihlerini kaydet (UPSERT)
     */
    public function tercihleri_kaydet(int $sirket_id, int $kullanici_id, array $tercihler): void {
        $sql = "INSERT INTO bildirim_tercihleri
                    (sirket_id, kullanici_id, bildirim_tipi, uygulama_ici, email, sms, telefon, whatsapp, push)
                VALUES (:sirket_id, :kullanici_id, :tip, :uygulama_ici, :email, :sms, :telefon, :whatsapp, :push)
                ON DUPLICATE KEY UPDATE
                    uygulama_ici = VALUES(uygulama_ici),
                    email        = VALUES(email),
                    sms          = VALUES(sms),
                    telefon      = VALUES(telefon),
                    whatsapp     = VALUES(whatsapp),
                    push         = VALUES(push)";

        $stmt = $this->db->prepare($sql);

        foreach ($tercihler as $tip => $ayar) {
            $stmt->execute([
                ':sirket_id'     => $sirket_id,
                ':kullanici_id'  => $kullanici_id,
                ':tip'           => $tip,
                ':uygulama_ici'  => (int)($ayar['uygulama_ici'] ?? 1),
                ':email'         => (int)($ayar['email'] ?? 1),
                ':sms'           => (int)($ayar['sms'] ?? 0),
                ':telefon'       => (int)($ayar['telefon'] ?? 0),
                ':whatsapp'      => (int)($ayar['whatsapp'] ?? 0),
                ':push'          => (int)($ayar['push'] ?? 0),
            ]);
        }
    }

    // ─── DEDUP KONTROLÜ ──────────────────────────────────────────

    /**
     * Aynı kaynak+tip için 24 saat içinde bildirim var mı?
     */
    public function dedup_kontrol(int $sirket_id, int $kullanici_id, string $tip, ?string $kaynak_turu, ?int $kaynak_id): bool {
        if (!$kaynak_turu || !$kaynak_id) return false;

        $sql = "SELECT COUNT(*) as sayi FROM bildirimler
                WHERE sirket_id = :sirket_id
                  AND kullanici_id = :kullanici_id
                  AND tip = :tip
                  AND kaynak_turu = :kaynak_turu
                  AND kaynak_id = :kaynak_id
                  AND silindi_mi = 0
                  AND olusturma_tarihi > DATE_SUB(NOW(), INTERVAL 24 HOUR)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':sirket_id'    => $sirket_id,
            ':kullanici_id' => $kullanici_id,
            ':tip'          => $tip,
            ':kaynak_turu'  => $kaynak_turu,
            ':kaynak_id'    => $kaynak_id,
        ]);
        return (int)$stmt->fetch()['sayi'] > 0;
    }

    // ─── YARDIMCI ────────────────────────────────────────────────

    /**
     * Şirketin sahip kullanıcısını getir (bildirim gönderilecek kişi)
     */
    public function sirket_sahipleri(int $sirket_id): array {
        $sql = "SELECT id, ad_soyad, email FROM kullanicilar
                WHERE sirket_id = :sirket_id AND rol = 'sahip' AND aktif_mi = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':sirket_id' => $sirket_id]);
        return $stmt->fetchAll();
    }

    /**
     * Şirketteki aktif kullanıcıları getir (tüm roller)
     */
    public function sirket_kullanicilari(int $sirket_id): array {
        $sql = "SELECT id, ad_soyad, email, rol FROM kullanicilar
                WHERE sirket_id = :sirket_id AND aktif_mi = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':sirket_id' => $sirket_id]);
        return $stmt->fetchAll();
    }
}
