-- =====================================================
-- Abonelik Sistemi v2 — Migration
-- Tarih: 2026-03-28
-- =====================================================
-- DEĞİŞİKLİKLER:
--   1. sirketler.abonelik_plani ENUM → 'deneme' eklendi, 'ucretsiz' kaldırıldı
--   2. sirketler.deneme_bitis kolonu eklendi
--   3. Mevcut 'ucretsiz' kullanıcılar → 'deneme' + 30 gün deneme süresi
--   4. abonelikler.plan_adi artık 'deneme' değerini destekliyor
-- =====================================================
-- KULLANIM:
--   phpMyAdmin → SQL sekmesi → bu dosyayı yapıştır → Çalıştır
-- =====================================================

-- 1. sirketler tablosuna deneme_bitis kolonu ekle
ALTER TABLE `sirketler`
    ADD COLUMN `deneme_bitis` DATETIME DEFAULT NULL COMMENT '30 günlük deneme bitiş tarihi'
    AFTER `abonelik_bitis`;

-- 2. sirketler.abonelik_plani ENUM güncelle: 'deneme' ekle
ALTER TABLE `sirketler`
    MODIFY COLUMN `abonelik_plani` ENUM('deneme','standart','kurumsal') NOT NULL DEFAULT 'deneme';

-- 3. Mevcut 'ucretsiz' kullanıcıları 'deneme'ye çevir + 30 gün süre ver
UPDATE `sirketler`
SET `abonelik_plani` = 'deneme',
    `deneme_bitis` = DATE_ADD(NOW(), INTERVAL 30 DAY)
WHERE `abonelik_plani` = 'ucretsiz'
   OR `abonelik_plani` NOT IN ('standart', 'kurumsal');

-- 4. abonelikler tablosundaki mevcut 'ucretsiz' kayıtları güncelle
UPDATE `abonelikler`
SET `plan_adi` = 'deneme'
WHERE `plan_adi` = 'ucretsiz';

-- =====================================================
-- TAMAMLANDI!
-- Yeni kayıt olunduğunda:
--   abonelik_plani = 'deneme'
--   deneme_bitis   = NOW() + 30 gün
-- 30 gün sonunda ödeme yapılmazsa kısıtlı erişim uygulanır
-- =====================================================
