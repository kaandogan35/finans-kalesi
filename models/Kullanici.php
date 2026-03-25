<?php
/**
 * Finans Kalesi — Kullanici Modeli
 * 
 * TABLO: kullanicilar
 * Sutunlar: id, sirket_id, ad_soyad, email, sifre_hash, telefon, 
 *           rol (enum: sahip/admin/muhasebeci/personel), yetkiler,
 *           aktif_mi (tinyint), son_giris, olusturma_tarihi
 */

class Kullanici {
    
    private $db;
    
    public function __construct() {
        $this->db = Database::baglan();
    }
    
    /**
     * E-posta ile kullanici bul
     */
    public function eposta_ile_bul($email) {
        $sql = "SELECT * FROM kullanicilar WHERE email = ? LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
        return $stmt->fetch();
    }
    
    /**
     * ID ile kullanici bul
     */
    public function id_ile_bul($id) {
        $sql = "SELECT id, sirket_id, ad_soyad, email, telefon, rol, yetkiler, aktif_mi, son_giris, olusturma_tarihi
                FROM kullanicilar WHERE id = ? LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    /**
     * Yeni kullanici olustur (kayit)
     */
    public function olustur($veri) {
        $sifre_hash = password_hash($veri['sifre'], PASSWORD_BCRYPT, ['cost' => 12]);

        $sql = "INSERT INTO kullanicilar (sirket_id, ad_soyad, email, sifre_hash, telefon, rol, yetkiler, aktif_mi)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $veri['sirket_id'],
            $veri['ad_soyad'],
            $veri['email'],
            $sifre_hash,
            $veri['telefon'] ?? null,
            $veri['rol'] ?? 'personel',
            $veri['yetkiler'] ?? null,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Şirketin tüm kullanıcılarını listele
     */
    public function sirket_kullanicilari(int $sirket_id): array {
        $sql = "SELECT id, sirket_id, ad_soyad, email, telefon, rol, yetkiler, aktif_mi, son_giris, olusturma_tarihi
                FROM kullanicilar
                WHERE sirket_id = ? AND aktif_mi = 1
                ORDER BY olusturma_tarihi ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sirket_id]);
        return $stmt->fetchAll();
    }

    /**
     * Kullanıcı güncelle (ad, telefon, rol, yetkiler, aktif_mi)
     */
    public function guncelle(int $id, int $sirket_id, array $veri): bool {
        $sql = "UPDATE kullanicilar
                SET ad_soyad = :ad_soyad,
                    telefon  = :telefon,
                    rol      = :rol,
                    yetkiler = :yetkiler,
                    aktif_mi = :aktif_mi
                WHERE id = :id AND sirket_id = :sirket_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':ad_soyad'  => $veri['ad_soyad'],
            ':telefon'   => $veri['telefon'] ?? null,
            ':rol'       => $veri['rol'],
            ':yetkiler'  => $veri['yetkiler'] ?? null,
            ':aktif_mi'  => $veri['aktif_mi'] ?? 1,
            ':id'        => $id,
            ':sirket_id' => $sirket_id,
        ]);
    }

    /**
     * Kullanıcı sil (soft delete — aktif_mi = 0)
     */
    public function sil(int $id, int $sirket_id): bool {
        $sql = "UPDATE kullanicilar SET aktif_mi = 0 WHERE id = :id AND sirket_id = :sirket_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $id, ':sirket_id' => $sirket_id]);
    }

    /**
     * Şifre güncelle (sahip başkasının şifresini sıfırlar)
     */
    public function sifre_guncelle(int $id, int $sirket_id, string $yeni_sifre): bool {
        $hash = password_hash($yeni_sifre, PASSWORD_BCRYPT, ['cost' => 12]);
        $sql  = "UPDATE kullanicilar SET sifre_hash = :hash WHERE id = :id AND sirket_id = :sirket_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':hash' => $hash, ':id' => $id, ':sirket_id' => $sirket_id]);
    }
    
    /**
     * Sifre dogrula (bcrypt)
     */
    public function sifre_dogrula($sifre, $hash) {
        return password_verify($sifre, $hash);
    }
    
    /**
     * E-posta zaten kayitli mi?
     */
    public function eposta_var_mi($email) {
        $sql = "SELECT COUNT(*) as sayi FROM kullanicilar WHERE email = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
        $sonuc = $stmt->fetch();
        return $sonuc['sayi'] > 0;
    }
    
    /**
     * Refresh token kaydet
     * TABLO: refresh_tokens
     * Sutunlar: id, kullanici_id, token_hash, cihaz_bilgisi, ip_adresi,
     *           son_kullanim, olusturma_tarihi, bitis_tarihi
     */
    public function refresh_token_kaydet($kullanici_id, $token, $bitis_tarihi) {
        // Max 5 cihaz — en eski tokeni sil
        $sql_say = "SELECT COUNT(*) as sayi FROM refresh_tokens WHERE kullanici_id = ?";
        $stmt = $this->db->prepare($sql_say);
        $stmt->execute([$kullanici_id]);
        $sayi = $stmt->fetch()['sayi'];
        
        if ($sayi >= 5) {
            $sql_sil = "DELETE FROM refresh_tokens WHERE kullanici_id = ? 
                        ORDER BY olusturma_tarihi ASC LIMIT 1";
            $stmt = $this->db->prepare($sql_sil);
            $stmt->execute([$kullanici_id]);
        }
        
        // Token'i hash'leyerek sakla (guvenlik — DB sizintisinda token aciga cikmaz)
        $token_hash = hash('sha256', $token);
        
        // IP ve cihaz bilgisini al
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $cihaz = $_SERVER['HTTP_USER_AGENT'] ?? null;
        
        $sql = "INSERT INTO refresh_tokens (kullanici_id, token_hash, cihaz_bilgisi, ip_adresi, son_kullanim, bitis_tarihi) 
                VALUES (?, ?, ?, ?, NOW(), ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$kullanici_id, $token_hash, $cihaz, $ip, $bitis_tarihi]);
    }
    
    /**
     * Refresh token dogrula
     */
    public function refresh_token_dogrula($token) {
        $token_hash = hash('sha256', $token);
        
        $sql = "SELECT rt.*, k.sirket_id, k.ad_soyad, k.email, k.rol, k.aktif_mi
                FROM refresh_tokens rt
                JOIN kullanicilar k ON k.id = rt.kullanici_id
                WHERE rt.token_hash = ? AND rt.bitis_tarihi > NOW()
                LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$token_hash]);
        return $stmt->fetch();
    }
    
    /**
     * Refresh token sil (cikis yapma)
     */
    public function refresh_token_sil($token) {
        $token_hash = hash('sha256', $token);
        $sql = "DELETE FROM refresh_tokens WHERE token_hash = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$token_hash]);
    }
    
    /**
     * Tum refresh tokenlari sil (tum cihazlardan cikis)
     */
    public function tum_tokenlari_sil($kullanici_id) {
        $sql = "DELETE FROM refresh_tokens WHERE kullanici_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$kullanici_id]);
    }
    
    /**
     * Son giris zamanini guncelle
     */
    public function son_giris_guncelle($kullanici_id) {
        $sql = "UPDATE kullanicilar SET son_giris = NOW() WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$kullanici_id]);
    }
}