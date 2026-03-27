-- =====================================================
-- MİGRASYON: Gelir/Gider Merkezi Mimari Yeniden Tasarımı
-- Tarih: 2026-03-26
-- Kapsam: kasa_hareketler yeni sütunlar, kategoriler tablosu,
--         fiziki_kasa ayrı bakiye, tekrarlayan_islemler odeme_kaynagi
-- =====================================================

SET NAMES utf8mb4;

-- =====================================================
-- 1. kasa_hareketler — 3 Yeni Sütun
-- Kod (Kasa.php) zaten bu sütunları kullanıyor,
-- ama veritabanında henüz tanımlı değil.
-- =====================================================
ALTER TABLE `kasa_hareketler`
    ADD COLUMN `kaynak_modul` VARCHAR(30) DEFAULT NULL
        COMMENT 'cek_senet, tekrarlayan, manuel' AFTER `ekleyen_id`,
    ADD COLUMN `kaynak_id` INT DEFAULT NULL
        COMMENT 'kaynak tablodaki kayıt ID' AFTER `kaynak_modul`,
    ADD COLUMN `odeme_kaynagi` VARCHAR(30) DEFAULT NULL
        COMMENT 'banka, cekmece, merkez_kasa' AFTER `kaynak_id`;

-- Index: kaynak modüle göre hızlı arama
ALTER TABLE `kasa_hareketler`
    ADD KEY `idx_kasa_kaynak` (`sirket_id`, `kaynak_modul`);

-- =====================================================
-- 2. tekrarlayan_islemler — odeme_kaynagi sütunu
-- Cron çalıştığında hangi kasadan düşeceğini bilmek için
-- =====================================================
ALTER TABLE `tekrarlayan_islemler`
    ADD COLUMN `odeme_kaynagi` VARCHAR(30) DEFAULT 'banka'
        COMMENT 'banka, cekmece, merkez_kasa' AFTER `aciklama`;

-- =====================================================
-- 3. fiziki_kasa — Ayrı Bakiye Takibi
-- Şu an tek bakiye var, banka/çekmece/merkez kasa ayrılıyor
-- =====================================================
ALTER TABLE `fiziki_kasa`
    ADD COLUMN `banka_bakiye_sifreli` TEXT DEFAULT NULL
        COMMENT 'AES-256-GCM — Banka hesabı bakiyesi' AFTER `bakiye_sifreli`,
    ADD COLUMN `cekmece_bakiye_sifreli` TEXT DEFAULT NULL
        COMMENT 'AES-256-GCM — Çekmece (nakit) bakiyesi' AFTER `banka_bakiye_sifreli`,
    ADD COLUMN `merkez_bakiye_sifreli` TEXT DEFAULT NULL
        COMMENT 'AES-256-GCM — Merkez kasa bakiyesi' AFTER `cekmece_bakiye_sifreli`;

-- =====================================================
-- 4. kategoriler tablosu — Merkezi kategori yönetimi
-- sirket_id NULL = sistem varsayılanı (herkes görür)
-- sirket_id doluysa = şirkete özel kategori
-- =====================================================
CREATE TABLE IF NOT EXISTS `kategoriler` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED DEFAULT NULL COMMENT 'NULL = sistem varsayılanı',
    `islem_tipi` VARCHAR(10) NOT NULL COMMENT 'giris veya cikis',
    `ad` VARCHAR(100) NOT NULL,
    `ikon` VARCHAR(50) DEFAULT NULL COMMENT 'Bootstrap icon sınıfı',
    `sira` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `aktif_mi` TINYINT(1) NOT NULL DEFAULT 1,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_kat_sirket` (`sirket_id`, `islem_tipi`),
    KEY `idx_kat_aktif` (`sirket_id`, `aktif_mi`, `islem_tipi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. Seed: 14 Gider + 7 Gelir Kategorisi (Sistem Varsayılanı)
-- sirket_id = NULL → tüm şirketler görür
-- =====================================================

-- GİDER KATEGORİLERİ (14 adet)
INSERT INTO `kategoriler` (`sirket_id`, `islem_tipi`, `ad`, `ikon`, `sira`) VALUES
(NULL, 'cikis', 'Personel Maaşı',          'bi-person-badge',          1),
(NULL, 'cikis', 'Personel SGK / Prim',     'bi-shield-plus',           2),
(NULL, 'cikis', 'Personel Yemek',          'bi-cup-hot',               3),
(NULL, 'cikis', 'Faturalar',               'bi-receipt',               4),
(NULL, 'cikis', 'Kira / Aidat',            'bi-building',              5),
(NULL, 'cikis', 'Tedarikçi Ödemesi',       'bi-truck',                 6),
(NULL, 'cikis', 'Vergi Ödemesi',           'bi-bank',                  7),
(NULL, 'cikis', 'Kredi / Taksit Ödemesi',  'bi-credit-card-2-front',   8),
(NULL, 'cikis', 'Günlük İşletme Gideri',   'bi-basket',                9),
(NULL, 'cikis', 'Nakliye / Kargo',         'bi-box-seam',              10),
(NULL, 'cikis', 'Sigorta',                 'bi-umbrella',              11),
(NULL, 'cikis', 'Reklam / Pazarlama',      'bi-megaphone',             12),
(NULL, 'cikis', 'Çek/Senet Ödemesi',       'bi-file-earmark-check',    13),
(NULL, 'cikis', 'Diğer Gider',             'bi-three-dots',            14);

-- GELİR KATEGORİLERİ (7 adet)
INSERT INTO `kategoriler` (`sirket_id`, `islem_tipi`, `ad`, `ikon`, `sira`) VALUES
(NULL, 'giris', 'Nakit Satış (Çekmece)',   'bi-cash-stack',            1),
(NULL, 'giris', 'Açık Hesap Tahsilat',     'bi-person-check',          2),
(NULL, 'giris', 'Havale / EFT',            'bi-bank2',                 3),
(NULL, 'giris', 'POS / Kredi Kartı',       'bi-credit-card',           4),
(NULL, 'giris', 'Çek/Senet Tahsilatı',     'bi-file-earmark-check',    5),
(NULL, 'giris', 'Düzenli Tahsilat',        'bi-arrow-repeat',          6),
(NULL, 'giris', 'Diğer Gelir',             'bi-three-dots',            7);

-- =====================================================
-- 6. Mevcut Veri Migrasyonu
-- Eski kayıtlara kaynak_modul ve odeme_kaynagi ata
-- =====================================================

-- Tekrarlayan işlemlerden gelen kayıtlar
UPDATE `kasa_hareketler`
SET `kaynak_modul` = 'tekrarlayan'
WHERE `baglanti_turu` = 'Tekrarlayan İşlem'
  AND `kaynak_modul` IS NULL;

-- Geri kalan hepsi manuel
UPDATE `kasa_hareketler`
SET `kaynak_modul` = 'manuel'
WHERE `kaynak_modul` IS NULL;

-- Ödeme kaynağı tahmini (mevcut veriye göre)
UPDATE `kasa_hareketler`
SET `odeme_kaynagi` = CASE
    WHEN `baglanti_turu` LIKE '%Banka%' THEN 'banka'
    WHEN `baglanti_turu` = 'Merkez Kasa' THEN 'merkez_kasa'
    WHEN `baglanti_turu` LIKE '%Çekmece%' THEN 'cekmece'
    ELSE 'banka'
END
WHERE `odeme_kaynagi` IS NULL;

-- =====================================================
-- TAMAMLANDI!
-- Eklenen: 3 ALTER TABLE, 1 CREATE TABLE, 21 seed kayıt
-- =====================================================
