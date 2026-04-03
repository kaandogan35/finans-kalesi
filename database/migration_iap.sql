-- ParamGo — IAP Entegrasyonu Migration
-- RevenueCat müşteri ID'si için sirketler tablosuna kolon ekle
-- Çalıştırma: phpMyAdmin veya MySQL CLI ile bir kez çalıştır

ALTER TABLE sirketler
ADD COLUMN revenuecat_musteri_id VARCHAR(255) NULL
AFTER abonelik_bitis;
