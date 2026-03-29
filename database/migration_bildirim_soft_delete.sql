-- =====================================================
-- FİNANS KALESİ — Bildirimler Soft Delete Migration
-- bildirimler tablosuna silindi_mi kolonu eklenir
-- Tarih: 2026-03-28
-- =====================================================

ALTER TABLE `bildirimler`
    ADD COLUMN `silindi_mi` TINYINT(1) NOT NULL DEFAULT 0 AFTER `olusturma_tarihi`,
    ADD KEY `idx_aktif` (`sirket_id`, `kullanici_id`, `silindi_mi`, `okundu_mu`);
