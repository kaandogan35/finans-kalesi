-- =====================================================
-- FİNANS KALESİ — Push Token Migration
-- Mobil push notification token yönetimi
-- Tarih: 2026-03-29
-- =====================================================

CREATE TABLE IF NOT EXISTS `push_tokens` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sirket_id` INT NOT NULL,
    `kullanici_id` INT NOT NULL,
    `token` VARCHAR(512) NOT NULL COMMENT 'FCM token (Android) veya APNs token (iOS)',
    `platform` VARCHAR(10) NOT NULL COMMENT 'ios, android',
    `cihaz_id` VARCHAR(255) DEFAULT NULL COMMENT 'Cihaz benzersiz kimliği',
    `aktif` TINYINT(1) NOT NULL DEFAULT 1,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `guncelleme_tarihi` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_token` (`token`),
    KEY `idx_kullanici` (`kullanici_id`, `aktif`),
    KEY `idx_sirket` (`sirket_id`, `aktif`),
    CONSTRAINT `fk_push_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_push_kullanici` FOREIGN KEY (`kullanici_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
