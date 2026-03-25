-- =====================================================
-- FİNANS KALESİ — Güvenlik Modülü Migration
-- Mevcut veritabanına uygulanacak değişiklikler
-- Tarih: 2026-03-25
-- =====================================================

-- 1. Giriş Geçmişi tablosu
CREATE TABLE IF NOT EXISTS `giris_gecmisi` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sirket_id` INT NOT NULL,
    `kullanici_id` INT NOT NULL,
    `ip_adresi` VARCHAR(45) NOT NULL,
    `cihaz_bilgisi` VARCHAR(500) DEFAULT NULL,
    `cihaz_turu` VARCHAR(50) DEFAULT NULL COMMENT 'masaustu, mobil, tablet',
    `tarayici` VARCHAR(100) DEFAULT NULL,
    `isletim_sistemi` VARCHAR(100) DEFAULT NULL,
    `basarili_mi` TINYINT(1) NOT NULL DEFAULT 1,
    `basarisizlik_nedeni` VARCHAR(100) DEFAULT NULL,
    `tarih` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_giris_kullanici` (`sirket_id`, `kullanici_id`),
    KEY `idx_giris_tarih` (`sirket_id`, `tarih`),
    CONSTRAINT `fk_giris_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Güvenlik Ayarları tablosu
CREATE TABLE IF NOT EXISTS `guvenlik_ayarlari` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sirket_id` INT NOT NULL,
    `min_sifre_uzunlugu` TINYINT UNSIGNED NOT NULL DEFAULT 8,
    `sifre_buyuk_harf_zorunlu` TINYINT(1) NOT NULL DEFAULT 0,
    `sifre_sayi_zorunlu` TINYINT(1) NOT NULL DEFAULT 0,
    `sifre_ozel_karakter_zorunlu` TINYINT(1) NOT NULL DEFAULT 0,
    `sifre_gecerlilik_gun` INT UNSIGNED DEFAULT NULL COMMENT 'NULL = süre yok',
    `hesap_kilitleme_deneme` INT UNSIGNED NOT NULL DEFAULT 5,
    `hesap_kilitleme_sure_dk` INT UNSIGNED NOT NULL DEFAULT 30,
    `ip_beyaz_liste` JSON DEFAULT NULL,
    `ip_kara_liste` JSON DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `guncelleme_tarihi` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_guvenlik_sirket` (`sirket_id`),
    CONSTRAINT `fk_guvenlik_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Refresh tokens tablosuna silindi_mi alanı ekle (oturum sonlandırma için)
ALTER TABLE `refresh_tokens`
    ADD COLUMN `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0;

-- 4. Kullanıcılar tablosuna güvenlik alanları ekle
ALTER TABLE `kullanicilar`
    ADD COLUMN `basarisiz_giris_sayisi` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `hesap_kilitli_kadar` DATETIME DEFAULT NULL,
    ADD COLUMN `iki_faktor_aktif` TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN `iki_faktor_gizli_sifreli` TEXT DEFAULT NULL COMMENT 'TOTP secret, AES-256-GCM şifreli',
    ADD COLUMN `iki_faktor_yedek_kodlar_sifreli` TEXT DEFAULT NULL COMMENT 'JSON array, AES-256-GCM şifreli';
