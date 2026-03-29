<?php
/**
 * Finans Kalesi — Sirket Modeli
 * 
 * TABLO: sirketler
 * Sutunlar: id, firma_adi, vergi_no, telefon, email, adres, sektor,
 *           abonelik_plani (enum: deneme/baslangic/profesyonel/kurumsal),
 *           abonelik_bitis, aktif_mi (tinyint), kasa_sifre_hash, kasa_salt,
 *           olusturma_tarihi, guncelleme_tarihi
 */

class Sirket {
    
    private $db;
    
    public function __construct() {
        $this->db = Database::baglan();
    }
    
    /**
     * Yeni sirket olustur
     */
    public function olustur($veri) {
        $sql = "INSERT INTO sirketler (firma_adi, vergi_no, telefon, email, adres, sektor, abonelik_plani, aktif_mi)
                VALUES (?, ?, ?, ?, ?, ?, 'deneme', 1)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $veri['firma_adi'],
            $veri['vergi_no'] ?? null,
            $veri['telefon'] ?? null,
            $veri['email'] ?? null,
            $veri['adres'] ?? null,
            $veri['sektor'] ?? null
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * ID ile sirket bul
     */
    public function id_ile_bul($id) {
        $sql = "SELECT * FROM sirketler WHERE id = ? LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Sirket temasini guncelle
     */
    public function tema_guncelle($sirket_id, $tema_adi) {
        $sql = "UPDATE sirketler SET tema_adi = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$tema_adi, $sirket_id]);
    }

    /**
     * Onboarding — sektor ve calisan sayisi kaydet
     */
    public function onboarding_guncelle($sirket_id, $sektor, $calisan_sayisi) {
        $sql = "UPDATE sirketler SET sektor = ?, calisan_sayisi = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sektor, $calisan_sayisi, (int)$sirket_id]);
    }

    /**
     * Onboarding tamamlandi olarak isaretle
     */
    public function onboarding_tamamla($sirket_id) {
        $sql = "UPDATE sirketler SET onboarding_tamamlandi = 1 WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([(int)$sirket_id]);
    }
}