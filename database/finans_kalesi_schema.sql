-- =====================================================
-- FİNANS KALESİ — Tam Veritabanı Şeması
-- MariaDB / MySQL — utf8mb4_unicode_ci
-- Oluşturulma: 2026-03-15
-- =====================================================
-- KULLANIM:
-- 1. Hosting panelinde phpMyAdmin'e girin
-- 2. Yeni bir veritabanı oluşturun (utf8mb4_unicode_ci)
-- 3. SQL sekmesine tıklayın
-- 4. Bu dosyanın tamamını yapıştırın ve "Çalıştır" deyin
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. ŞİRKETLER (Multi-tenant ana tablo)
-- =====================================================
CREATE TABLE IF NOT EXISTS `sirketler` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `firma_adi` VARCHAR(255) NOT NULL,
    `vergi_no` VARCHAR(50) DEFAULT NULL,
    `telefon` VARCHAR(30) DEFAULT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `adres` TEXT DEFAULT NULL,
    `sektor` VARCHAR(100) DEFAULT NULL,
    `abonelik_plani` ENUM('deneme','standart','kurumsal') NOT NULL DEFAULT 'deneme',
    `abonelik_bitis` DATETIME DEFAULT NULL,
    `deneme_bitis` DATETIME DEFAULT NULL COMMENT '30 günlük deneme bitiş tarihi',
    `kampanya_kullanici` TINYINT(1) NOT NULL DEFAULT 0,
    `tema_adi` VARCHAR(50) NOT NULL DEFAULT 'paramgo',
    `aktif_mi` TINYINT(1) NOT NULL DEFAULT 1,
    `kasa_sifre_hash` VARCHAR(255) DEFAULT NULL,
    `kasa_salt` VARCHAR(255) DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `guncelleme_tarihi` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. KULLANICILAR
-- =====================================================
CREATE TABLE IF NOT EXISTS `kullanicilar` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `ad_soyad` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `sifre_hash` VARCHAR(255) NOT NULL,
    `telefon` VARCHAR(30) DEFAULT NULL,
    `rol` ENUM('sahip','admin','muhasebeci','personel') NOT NULL DEFAULT 'personel',
    `yetkiler` TEXT DEFAULT NULL,
    `aktif_mi` TINYINT(1) NOT NULL DEFAULT 1,
    `son_giris` DATETIME DEFAULT NULL,
    `tamamlanan_turlar` JSON DEFAULT NULL COMMENT 'Onboarding tur tamamlanma durumları',
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `guncelleme_tarihi` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_kullanicilar_email` (`email`),
    KEY `idx_kullanicilar_sirket` (`sirket_id`),
    KEY `idx_kullanicilar_rol` (`sirket_id`, `rol`),
    CONSTRAINT `fk_kullanicilar_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. REFRESH TOKENS (JWT çoklu cihaz desteği)
-- =====================================================
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `kullanici_id` INT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `cihaz_bilgisi` TEXT DEFAULT NULL,
    `ip_adresi` VARCHAR(45) DEFAULT NULL,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `son_kullanim` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `bitis_tarihi` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_refresh_kullanici` (`kullanici_id`),
    KEY `idx_refresh_bitis` (`bitis_tarihi`),
    CONSTRAINT `fk_refresh_kullanici` FOREIGN KEY (`kullanici_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. CARİ KARTLAR (Müşteri/Tedarikçi)
-- =====================================================
CREATE TABLE IF NOT EXISTS `cari_kartlar` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `cari_turu` VARCHAR(20) NOT NULL COMMENT 'musteri veya satici',
    `cari_adi_sifreli` TEXT NOT NULL COMMENT 'AES-256-GCM ile şifreli',
    `vergi_no_sifreli` TEXT DEFAULT NULL,
    `telefon_sifreli` TEXT DEFAULT NULL,
    `email_sifreli` TEXT DEFAULT NULL,
    `adres_sifreli` TEXT DEFAULT NULL,
    `yetkili_kisi_sifreli` TEXT DEFAULT NULL,
    `il` VARCHAR(100) DEFAULT NULL,
    `ilce` VARCHAR(100) DEFAULT NULL,
    `kredi_limiti` DECIMAL(12,2) DEFAULT NULL,
    `bakiye` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `toplam_borc` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `toplam_alacak` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `son_islem_tarihi` DATETIME DEFAULT NULL,
    `aktif_mi` TINYINT(1) NOT NULL DEFAULT 1,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `silinme_tarihi` DATETIME DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_cari_sirket` (`sirket_id`),
    KEY `idx_cari_turu` (`sirket_id`, `cari_turu`),
    KEY `idx_cari_silindi` (`sirket_id`, `silindi_mi`),
    KEY `idx_cari_il` (`sirket_id`, `il`),
    CONSTRAINT `fk_cari_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. CARİ HAREKETLER (Borç/Alacak işlemleri)
-- =====================================================
CREATE TABLE IF NOT EXISTS `cari_hareketler` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `cari_id` INT UNSIGNED NOT NULL,
    `islem_tipi` VARCHAR(30) NOT NULL COMMENT 'borclandirma veya tahsilat',
    `tutar` DECIMAL(12,2) NOT NULL,
    `doviz_kodu` VARCHAR(10) NOT NULL DEFAULT 'TRY',
    `kur` DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    `tutar_tl` DECIMAL(12,2) NOT NULL,
    `aciklama_sifreli` TEXT DEFAULT NULL,
    `belge_no` VARCHAR(100) DEFAULT NULL,
    `vade_tarihi` DATE DEFAULT NULL,
    `islem_tarihi` DATETIME NOT NULL,
    `ekleyen_id` INT UNSIGNED NOT NULL,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `silinme_tarihi` DATETIME DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_hareket_sirket` (`sirket_id`),
    KEY `idx_hareket_cari` (`sirket_id`, `cari_id`),
    KEY `idx_hareket_tarih` (`sirket_id`, `islem_tarihi`),
    KEY `idx_hareket_vade` (`sirket_id`, `vade_tarihi`),
    KEY `idx_hareket_belge` (`sirket_id`, `belge_no`),
    KEY `idx_hareket_silindi` (`sirket_id`, `silindi_mi`),
    CONSTRAINT `fk_hareket_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_hareket_cari` FOREIGN KEY (`cari_id`)
        REFERENCES `cari_kartlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_hareket_ekleyen` FOREIGN KEY (`ekleyen_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. ÇEK/SENET
-- =====================================================
CREATE TABLE IF NOT EXISTS `cek_senetler` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `cari_id` INT UNSIGNED DEFAULT NULL,
    `tur` VARCHAR(30) NOT NULL COMMENT 'alacak_ceki, alacak_senedi, borc_ceki, borc_senedi',
    `durum` VARCHAR(30) NOT NULL DEFAULT 'portfoyde' COMMENT 'portfoyde, tahsile_verildi, tahsil_edildi, odendi, karsiliksiz, protestolu, cirolandi',
    `seri_no` VARCHAR(100) DEFAULT NULL,
    `banka_adi_sifreli` TEXT DEFAULT NULL,
    `sube_sifreli` TEXT DEFAULT NULL,
    `hesap_no_sifreli` TEXT DEFAULT NULL,
    `kesilme_tarihi` DATE DEFAULT NULL,
    `vade_tarihi` DATE NOT NULL,
    `tutar` DECIMAL(12,2) NOT NULL,
    `doviz_kodu` VARCHAR(10) NOT NULL DEFAULT 'TRY',
    `kur` DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    `tutar_tl` DECIMAL(12,2) NOT NULL,
    `aciklama_sifreli` TEXT DEFAULT NULL,
    `ciro_edilen_cari_id` INT UNSIGNED DEFAULT NULL,
    `ciro_tarihi` DATE DEFAULT NULL,
    `tahsil_tarihi` DATE DEFAULT NULL,
    `ekleyen_id` INT UNSIGNED NOT NULL,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `silinme_tarihi` DATETIME DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_cek_sirket` (`sirket_id`),
    KEY `idx_cek_cari` (`sirket_id`, `cari_id`),
    KEY `idx_cek_tur` (`sirket_id`, `tur`),
    KEY `idx_cek_durum` (`sirket_id`, `durum`),
    KEY `idx_cek_vade` (`sirket_id`, `vade_tarihi`),
    KEY `idx_cek_seri` (`sirket_id`, `seri_no`),
    KEY `idx_cek_silindi` (`sirket_id`, `silindi_mi`),
    CONSTRAINT `fk_cek_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_cek_cari` FOREIGN KEY (`cari_id`)
        REFERENCES `cari_kartlar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_cek_ciro_cari` FOREIGN KEY (`ciro_edilen_cari_id`)
        REFERENCES `cari_kartlar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_cek_ekleyen` FOREIGN KEY (`ekleyen_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. ÖDEME TAKİP
-- =====================================================
CREATE TABLE IF NOT EXISTS `odeme_takip` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `cari_id` INT UNSIGNED DEFAULT NULL,
    `firma_adi_sifreli` TEXT DEFAULT NULL,
    `ilgili_kisi_sifreli` TEXT DEFAULT NULL,
    `telefon_sifreli` TEXT DEFAULT NULL,
    `tutar` DECIMAL(12,2) DEFAULT NULL,
    `doviz_kodu` VARCHAR(10) NOT NULL DEFAULT 'TRY',
    `yon` VARCHAR(20) NOT NULL DEFAULT 'tahsilat' COMMENT 'tahsilat veya odeme',
    `soz_tarihi` DATE DEFAULT NULL,
    `durum` VARCHAR(20) NOT NULL DEFAULT 'bekliyor' COMMENT 'bekliyor | cevap_vermedi | soz_verildi | tamamlandi | iptal',
    `oncelik` VARCHAR(20) NOT NULL DEFAULT 'normal' COMMENT 'dusuk, normal, yuksek, kritik',
    `gorusme_notu_sifreli` TEXT DEFAULT NULL,
    `hatirlatma_tarihi` DATE DEFAULT NULL,
    `son_arama_tarihi` DATE DEFAULT NULL,
    `hatirlatma_gun_araligi` SMALLINT UNSIGNED DEFAULT NULL,
    `ekleyen_id` INT UNSIGNED NOT NULL,
    `tamamlayan_id` INT UNSIGNED DEFAULT NULL,
    `tamamlanma_tarihi` DATETIME DEFAULT NULL,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `silinme_tarihi` DATETIME DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_odeme_sirket` (`sirket_id`),
    KEY `idx_odeme_cari` (`sirket_id`, `cari_id`),
    KEY `idx_odeme_durum` (`sirket_id`, `durum`),
    KEY `idx_odeme_yon` (`sirket_id`, `yon`),
    KEY `idx_odeme_soz` (`sirket_id`, `soz_tarihi`),
    KEY `idx_odeme_oncelik` (`sirket_id`, `oncelik`),
    KEY `idx_odeme_silindi` (`sirket_id`, `silindi_mi`),
    CONSTRAINT `fk_odeme_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_odeme_cari` FOREIGN KEY (`cari_id`)
        REFERENCES `cari_kartlar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_odeme_ekleyen` FOREIGN KEY (`ekleyen_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_odeme_tamamlayan` FOREIGN KEY (`tamamlayan_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. KASA HAREKETLERİ (Günlük nakit giriş/çıkış)
-- =====================================================
CREATE TABLE IF NOT EXISTS `kasa_hareketler` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `islem_tipi` VARCHAR(20) NOT NULL COMMENT 'giris veya cikis',
    `kategori` VARCHAR(100) DEFAULT NULL,
    `tutar_sifreli` TEXT NOT NULL COMMENT 'AES-256-GCM',
    `aciklama_sifreli` TEXT DEFAULT NULL,
    `tarih` DATE NOT NULL,
    `baglanti_turu` VARCHAR(50) DEFAULT NULL,
    `ekleyen_id` INT UNSIGNED NOT NULL,
    `kaynak_modul` VARCHAR(30) DEFAULT NULL COMMENT 'cek_senet, tekrarlayan, manuel',
    `kaynak_id` INT DEFAULT NULL COMMENT 'kaynak tablodaki kayıt ID',
    `odeme_kaynagi` VARCHAR(30) DEFAULT NULL COMMENT 'banka, cekmece, merkez_kasa',
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `silinme_tarihi` DATETIME DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_kasa_sirket` (`sirket_id`),
    KEY `idx_kasa_tarih` (`sirket_id`, `tarih`),
    KEY `idx_kasa_tip` (`sirket_id`, `islem_tipi`),
    KEY `idx_kasa_kaynak` (`sirket_id`, `kaynak_modul`),
    KEY `idx_kasa_silindi` (`sirket_id`, `silindi_mi`),
    CONSTRAINT `fk_kasa_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_kasa_ekleyen` FOREIGN KEY (`ekleyen_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. FİZİKİ KASA (Anlık kasa bakiyesi)
-- =====================================================
CREATE TABLE IF NOT EXISTS `fiziki_kasa` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `bakiye_sifreli` TEXT NOT NULL COMMENT 'AES-256-GCM — Toplam bakiye',
    `banka_bakiye_sifreli` TEXT DEFAULT NULL COMMENT 'AES-256-GCM — Banka hesabı bakiyesi',
    `cekmece_bakiye_sifreli` TEXT DEFAULT NULL COMMENT 'AES-256-GCM — Çekmece (nakit) bakiyesi',
    `merkez_bakiye_sifreli` TEXT DEFAULT NULL COMMENT 'AES-256-GCM — Merkez kasa bakiyesi',
    `guncelleme_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_fiziki_kasa_sirket` (`sirket_id`),
    CONSTRAINT `fk_fiziki_kasa_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. YATIRIM KASASI (Altın, döviz, vb.)
-- =====================================================
CREATE TABLE IF NOT EXISTS `yatirim_kasasi` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `yatirim_adi` VARCHAR(255) NOT NULL,
    `miktar_sifreli` TEXT NOT NULL COMMENT 'AES-256-GCM',
    `birim_fiyat_sifreli` TEXT NOT NULL COMMENT 'AES-256-GCM',
    `guncel_fiyat_sifreli` TEXT DEFAULT NULL COMMENT 'AES-256-GCM güncel piyasa fiyatı',
    `alis_tarihi` DATE NOT NULL,
    `doviz_kodu` VARCHAR(10) NOT NULL DEFAULT 'TRY',
    `kategori` VARCHAR(100) DEFAULT NULL,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `silinme_tarihi` DATETIME DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `guncelleme_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_yatirim_sirket` (`sirket_id`),
    KEY `idx_yatirim_silindi` (`sirket_id`, `silindi_mi`),
    CONSTRAINT `fk_yatirim_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. ORTAK CARİSİ (Şirket sahip/ortak hesabı)
-- =====================================================
CREATE TABLE IF NOT EXISTS `ortak_carisi` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `ortak_adi` VARCHAR(255) NOT NULL,
    `islem_tipi` VARCHAR(20) NOT NULL COMMENT 'giris veya cikis',
    `tutar_sifreli` TEXT NOT NULL COMMENT 'AES-256-GCM',
    `aciklama_sifreli` TEXT DEFAULT NULL,
    `tarih` DATE NOT NULL,
    `ekleyen_id` INT UNSIGNED NOT NULL,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `silinme_tarihi` DATETIME DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_ortak_sirket` (`sirket_id`),
    KEY `idx_ortak_silindi` (`sirket_id`, `silindi_mi`),
    CONSTRAINT `fk_ortak_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_ortak_ekleyen` FOREIGN KEY (`ekleyen_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. AY KAPANIŞLAR (Aylık mali özet)
-- =====================================================
CREATE TABLE IF NOT EXISTS `ay_kapanislar` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `donem` VARCHAR(7) NOT NULL COMMENT 'YYYY-MM formatı',
    `kar_marji` DECIMAL(5,2) NOT NULL DEFAULT 35.00,
    `donem_basi_stok_sifreli` TEXT DEFAULT NULL,
    `kesilen_fatura_sifreli` TEXT DEFAULT NULL,
    `gelen_alis_sifreli` TEXT DEFAULT NULL,
    `alacaklar_sifreli` TEXT DEFAULT NULL,
    `borclar_sifreli` TEXT DEFAULT NULL,
    `banka_nakdi_sifreli` TEXT DEFAULT NULL,
    `yatirim_birikimi_sifreli` TEXT DEFAULT NULL,
    `smm_sifreli` TEXT DEFAULT NULL,
    `sanal_stok_sifreli` TEXT DEFAULT NULL,
    `net_varlik_sifreli` TEXT DEFAULT NULL,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `silinme_tarihi` DATETIME DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_ay_kapanislar_donem` (`sirket_id`, `donem`),
    KEY `idx_kapanislar_silindi` (`sirket_id`, `silindi_mi`),
    CONSTRAINT `fk_kapanislar_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. SİSTEM LOGLARI (Güvenlik ve işlem logları)
-- =====================================================
CREATE TABLE IF NOT EXISTS `sistem_loglari` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED DEFAULT NULL,
    `kullanici_id` INT UNSIGNED DEFAULT NULL,
    `kullanici_adi` VARCHAR(150) DEFAULT NULL,
    `islem_tipi` VARCHAR(100) NOT NULL,
    `islem_detayi` TEXT DEFAULT NULL,
    `ip_adresi` VARCHAR(50) DEFAULT NULL,
    `user_agent` VARCHAR(500) DEFAULT NULL,
    `tarih` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_sistem_sirket` (`sirket_id`),
    KEY `idx_sistem_kullanici` (`kullanici_id`),
    KEY `idx_sistem_tarih` (`sirket_id`, `tarih`),
    KEY `idx_sistem_islem_tipi` (`sirket_id`, `islem_tipi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. VARLIK GEÇMİŞİ (Aylık varlık değişim takibi)
-- =====================================================
CREATE TABLE IF NOT EXISTS `varlik_gecmisi` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `ay_yil` VARCHAR(7) NOT NULL COMMENT 'YYYY-MM formatı',
    `kestigimiz_fatura_sifreli` TEXT DEFAULT NULL,
    `gelen_fatura_sifreli` TEXT DEFAULT NULL,
    `stok_degeri_sifreli` TEXT DEFAULT NULL,
    `toplam_alacak_sifreli` TEXT DEFAULT NULL,
    `toplam_borc_sifreli` TEXT DEFAULT NULL,
    `operasyon_nakdi_sifreli` TEXT DEFAULT NULL,
    `net_varlik_sifreli` TEXT DEFAULT NULL,
    `olusturma_tarihi` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `guncelleme_tarihi` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_sirket_ay` (`sirket_id`, `ay_yil`),
    KEY `idx_varlik_sirket` (`sirket_id`),
    CONSTRAINT `fk_varlik_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 15. ABONELİKLER (Plan geçmişi ve aktif abonelik)
-- =====================================================
CREATE TABLE IF NOT EXISTS `abonelikler` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `plan_adi` VARCHAR(30) NOT NULL COMMENT 'deneme, standart, kurumsal',
    `odeme_donemi` VARCHAR(20) DEFAULT NULL COMMENT 'aylik veya yillik',
    `odeme_kanali` VARCHAR(50) DEFAULT NULL COMMENT 'web, ios, android',
    `baslangic_tarihi` DATETIME NOT NULL,
    `bitis_tarihi` DATETIME DEFAULT NULL,
    `kampanya_kullanici` TINYINT(1) NOT NULL DEFAULT 0,
    `kampanya_fiyat` DECIMAL(10,2) DEFAULT NULL,
    `durum` VARCHAR(20) NOT NULL DEFAULT 'aktif' COMMENT 'aktif veya pasif',
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_abonelik_sirket` (`sirket_id`),
    KEY `idx_abonelik_durum` (`sirket_id`, `durum`),
    CONSTRAINT `fk_abonelik_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 16. ÖDEME GEÇMİŞİ (Abonelik ödemeleri)
-- =====================================================
CREATE TABLE IF NOT EXISTS `odeme_gecmisi` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `abonelik_id` INT UNSIGNED DEFAULT NULL,
    `plan_adi` VARCHAR(30) NOT NULL,
    `odeme_donemi` VARCHAR(20) DEFAULT NULL,
    `odeme_kanali` VARCHAR(50) DEFAULT NULL,
    `tutar` DECIMAL(10,2) NOT NULL,
    `para_birimi` VARCHAR(10) NOT NULL DEFAULT 'TRY',
    `referans_no` VARCHAR(255) DEFAULT NULL,
    `durum` VARCHAR(30) NOT NULL DEFAULT 'tamamlandi',
    `odeme_tarihi` DATETIME NOT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_odeme_gec_sirket` (`sirket_id`),
    KEY `idx_odeme_gec_abonelik` (`abonelik_id`),
    CONSTRAINT `fk_odeme_gec_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_odeme_gec_abonelik` FOREIGN KEY (`abonelik_id`)
        REFERENCES `abonelikler` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 17. MAIL LOG (E-posta gönderim kayıtları)
-- =====================================================
CREATE TABLE IF NOT EXISTS `mail_log` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED DEFAULT NULL,
    `kullanici_id` INT UNSIGNED DEFAULT NULL,
    `mail_turu` VARCHAR(50) NOT NULL COMMENT 'hosgeldin, guvenlik, cron_gunluk vb.',
    `alici_email` VARCHAR(255) NOT NULL,
    `konu` VARCHAR(500) DEFAULT NULL,
    `durum` VARCHAR(20) NOT NULL DEFAULT 'gonderildi' COMMENT 'gonderildi veya basarisiz',
    `hata_mesaji` TEXT DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_mail_sirket` (`sirket_id`),
    KEY `idx_mail_turu` (`mail_turu`),
    KEY `idx_mail_tarih` (`olusturma_tarihi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 18. VERESİYE İŞLEMLER (Faturasız satış / açık hesap)
-- =====================================================
CREATE TABLE IF NOT EXISTS `veresiye_islemler` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `cari_id` INT UNSIGNED NOT NULL,
    `tur` ENUM('satis','odeme') NOT NULL DEFAULT 'satis',
    `tutar` DECIMAL(12,2) NOT NULL,
    `aciklama_sifreli` TEXT DEFAULT NULL COMMENT 'AES-256-GCM',
    `tarih` DATE NOT NULL,
    `olusturan_id` INT UNSIGNED NOT NULL,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `silinme_tarihi` DATETIME DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_ver_sirket` (`sirket_id`),
    KEY `idx_ver_cari` (`sirket_id`, `cari_id`),
    KEY `idx_ver_tarih` (`sirket_id`, `tarih`),
    KEY `idx_ver_silindi` (`sirket_id`, `silindi_mi`),
    CONSTRAINT `fk_ver_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_ver_cari` FOREIGN KEY (`cari_id`)
        REFERENCES `cari_kartlar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_ver_olusturan` FOREIGN KEY (`olusturan_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 19. GİRİŞ GEÇMİŞİ (Login history)
-- =====================================================
CREATE TABLE IF NOT EXISTS `giris_gecmisi` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `kullanici_id` INT UNSIGNED NOT NULL,
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

-- =====================================================
-- 20. GÜVENLİK AYARLARI (Şirket bazlı güvenlik politikaları)
-- =====================================================
CREATE TABLE IF NOT EXISTS `guvenlik_ayarlari` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
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

-- =====================================================
-- 21. TEKRARLAYAN İŞLEMLER (Otomatik gelir/gider tanımları)
-- =====================================================
CREATE TABLE IF NOT EXISTS `tekrarlayan_islemler` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sirket_id` INT UNSIGNED NOT NULL,
    `baslik` VARCHAR(255) NOT NULL,
    `islem_tipi` VARCHAR(20) NOT NULL COMMENT 'giris veya cikis',
    `kategori` VARCHAR(100) DEFAULT NULL,
    `tutar` DECIMAL(12,2) NOT NULL,
    `doviz_kodu` VARCHAR(10) NOT NULL DEFAULT 'TRY',
    `periyot` VARCHAR(20) NOT NULL DEFAULT 'aylik' COMMENT 'gunluk, haftalik, aylik, yillik',
    `tekrar_gunu` TINYINT UNSIGNED DEFAULT NULL COMMENT 'Ayın günü (1-31)',
    `baslangic_tarihi` DATE NOT NULL,
    `bitis_tarihi` DATE DEFAULT NULL,
    `son_calistirma` DATE DEFAULT NULL,
    `sonraki_calistirma` DATE NOT NULL,
    `toplam_calistirma` INT UNSIGNED NOT NULL DEFAULT 0,
    `aktif_mi` TINYINT(1) NOT NULL DEFAULT 1,
    `aciklama` TEXT DEFAULT NULL,
    `odeme_kaynagi` VARCHAR(30) DEFAULT 'banka' COMMENT 'banka, cekmece, merkez_kasa',
    `ekleyen_id` INT UNSIGNED NOT NULL,
    `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0,
    `silinme_tarihi` DATETIME DEFAULT NULL,
    `olusturma_tarihi` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `guncelleme_tarihi` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_tekrar_sirket` (`sirket_id`),
    KEY `idx_tekrar_sonraki` (`sirket_id`, `aktif_mi`, `sonraki_calistirma`),
    CONSTRAINT `fk_tekrar_sirket` FOREIGN KEY (`sirket_id`)
        REFERENCES `sirketler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_tekrar_ekleyen` FOREIGN KEY (`ekleyen_id`)
        REFERENCES `kullanicilar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 22. KATEGORİLER (Merkezi gelir/gider kategori yönetimi)
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
-- FOREIGN KEY KONTROL AÇ
-- =====================================================
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- TAMAMLANDI!
-- 22 tablo başarıyla oluşturuldu:
-- 1.  sirketler          — Şirket/firma bilgileri
-- 2.  kullanicilar       — Kullanıcı hesapları
-- 3.  refresh_tokens     — JWT yenileme token'ları
-- 4.  cari_kartlar       — Müşteri/tedarikçi kartları
-- 5.  cari_hareketler    — Borç/alacak hareketleri
-- 6.  cek_senetler       — Çek ve senet portföyü
-- 7.  odeme_takip        — Ödeme/tahsilat takibi
-- 8.  kasa_hareketler    — Kasa giriş/çıkış işlemleri
-- 9.  fiziki_kasa        — Anlık kasa bakiyesi
-- 10. yatirim_kasasi     — Yatırım portföyü
-- 11. ortak_carisi       — Ortak/sahip hesap hareketleri
-- 12. ay_kapanislar      — Aylık mali kapanış özeti
-- 13. sistem_loglari     — Güvenlik ve işlem logları
-- 14. varlik_gecmisi     — Aylık varlık değişim takibi
-- 15. abonelikler        — Abonelik plan geçmişi
-- 16. odeme_gecmisi      — Abonelik ödeme kayıtları
-- 17. mail_log           — E-posta gönderim logları
-- 18. veresiye_islemler  — Faturasız satış / açık hesap
-- 19. giris_gecmisi      — Login history
-- 20. guvenlik_ayarlari  — Şirket bazlı güvenlik politikaları
-- 21. tekrarlayan_islemler — Otomatik gelir/gider tanımları
-- 22. kategoriler         — Merkezi gelir/gider kategori yönetimi
-- =====================================================
