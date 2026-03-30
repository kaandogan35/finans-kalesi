-- =====================================================
-- FİNANS KALESİ — Sosyal Giriş Migration
-- Apple Sign-In ve Google Sign-In için kullanıcı ID sütunları
-- Tarih: 2026-03-30
-- =====================================================

ALTER TABLE `kullanicilar`
    ADD COLUMN IF NOT EXISTS `apple_user_id` VARCHAR(255) DEFAULT NULL COMMENT 'Apple Sign-In kullanıcı kimliği (sub claim)',
    ADD COLUMN IF NOT EXISTS `google_user_id` VARCHAR(255) DEFAULT NULL COMMENT 'Google Sign-In kullanıcı kimliği (sub claim)',
    ADD COLUMN IF NOT EXISTS `sosyal_giris` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = sosyal giriş ile oluşturuldu';

-- İndeks ekle (hızlı arama için)
ALTER TABLE `kullanicilar`
    ADD INDEX IF NOT EXISTS `idx_apple_user_id` (`apple_user_id`),
    ADD INDEX IF NOT EXISTS `idx_google_user_id` (`google_user_id`);
