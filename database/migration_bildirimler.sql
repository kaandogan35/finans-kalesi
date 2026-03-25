-- =====================================================
-- FİNANS KALESİ — Bildirimler Modülü Migration
-- Mevcut veritabanına uygulanacak değişiklikler
-- Tarih: 2026-03-25
-- =====================================================

-- 1. Bildirimler tablosu
CREATE TABLE IF NOT EXISTS `bildirimler` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sirket_id` INT NOT NULL,
    `kullanici_id` INT NOT NULL,
    `tip` VARCHAR(50) NOT NULL COMMENT 'odeme_vade, cek_vade, geciken_odeme, guvenlik, sistem',
    `baslik` VARCHAR(255) NOT NULL,
    `mesaj` TEXT NOT NULL,
    `oncelik` VARCHAR(20) NOT NULL DEFAULT 'normal' COMMENT 'dusuk, normal, yuksek, kritik',
    `okundu_mu` TINYINT(1) NOT NULL DEFAULT 0,
    `okunma_tarihi` DATETIME DEFAULT NULL,
    `kaynak_turu` VARCHAR(50) DEFAULT NULL COMMENT 'odeme_takip, cek_senet, cari_hareket',
    `kaynak_id` INT DEFAULT NULL,
    `aksiyon_url` VARCHAR(255) DEFAULT NULL COMMENT 'Tıklanınca gidilecek yol',
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_okunmamis` (`sirket_id`, `kullanici_id`, `okundu_mu`),
    KEY `idx_tarih` (`sirket_id`, `olusturma_tarihi`),
    KEY `idx_tip` (`sirket_id`, `tip`),
    CONSTRAINT `fk_bildirim_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_bildirim_kullanici` FOREIGN KEY (`kullanici_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bildirim Tercihleri tablosu
CREATE TABLE IF NOT EXISTS `bildirim_tercihleri` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sirket_id` INT NOT NULL,
    `kullanici_id` INT NOT NULL,
    `bildirim_tipi` VARCHAR(50) NOT NULL,
    `uygulama_ici` TINYINT(1) NOT NULL DEFAULT 1,
    `email` TINYINT(1) NOT NULL DEFAULT 1,
    `sms` TINYINT(1) NOT NULL DEFAULT 0,
    `telefon` TINYINT(1) NOT NULL DEFAULT 0,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `guncelleme_tarihi` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_tercih` (`kullanici_id`, `bildirim_tipi`),
    CONSTRAINT `fk_tercih_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_tercih_kullanici` FOREIGN KEY (`kullanici_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
