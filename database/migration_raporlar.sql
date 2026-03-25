-- =====================================================
-- FİNANS KALESİ — Raporlama Modülü Migration
-- Mevcut veritabanına uygulanacak değişiklikler
-- Tarih: 2026-03-25
-- =====================================================

-- 1. Rapor Geçmişi tablosu
CREATE TABLE IF NOT EXISTS `rapor_gecmisi` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sirket_id` INT NOT NULL,
    `kullanici_id` INT NOT NULL,
    `rapor_turu` VARCHAR(50) NOT NULL COMMENT 'cari_yaslandirma, nakit_akis, cek_portfoy, odeme_ozet, genel_ozet',
    `rapor_adi` VARCHAR(255) NOT NULL,
    `filtreler` JSON DEFAULT NULL COMMENT 'Uygulanmış filtreler',
    `format` VARCHAR(10) NOT NULL DEFAULT 'ekran' COMMENT 'ekran, pdf, excel',
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_rapor_sirket` (`sirket_id`, `olusturma_tarihi`),
    KEY `idx_rapor_kullanici` (`sirket_id`, `kullanici_id`),
    CONSTRAINT `fk_rapor_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_rapor_kullanici` FOREIGN KEY (`kullanici_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
