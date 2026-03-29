-- =====================================================
-- Onboarding Kolonları — Migration
-- Tarih: 2026-03-29
-- =====================================================
-- DEĞİŞİKLİKLER:
--   1. sirketler.calisan_sayisi kolonu eklendi
--   2. sirketler.onboarding_tamamlandi kolonu eklendi
-- =====================================================
-- KULLANIM:
--   phpMyAdmin → Veritabanını seç → SQL sekmesi → yapıştır → Çalıştır
-- =====================================================

-- 1. calisan_sayisi kolonu ekle
ALTER TABLE `sirketler`
    ADD COLUMN `calisan_sayisi` VARCHAR(20) DEFAULT NULL COMMENT 'Çalışan sayısı aralığı (ör: 2-5 kişi)'
    AFTER `sektor`;

-- 2. onboarding_tamamlandi kolonu ekle
ALTER TABLE `sirketler`
    ADD COLUMN `onboarding_tamamlandi` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Onboarding adımları tamamlandı mı?'
    AFTER `calisan_sayisi`;

-- =====================================================
-- TAMAMLANDI!
-- Onboarding ekranı artık çalışacak.
-- =====================================================
