-- =====================================================
-- Trial Kullanildi Bayragi — Migration
-- Tarih: 2026-04-30
-- =====================================================
-- AMAC:
--   "1 kisi 1 kez trial" kuralini garantiye almak.
--   iyzico'nun musteri-bazli trial kontroline guvenmiyoruz, kendimiz tutuyoruz.
--
-- DAVRANIS:
--   trial_kullanildi=0 → ilk abonelikte iyzico 7 gun trial verir
--   trial_kullanildi=1 → iyzico'ya trial'siz plan UUID'si gonderilir, kart girer girmez cekim
--
-- GERIYE DONUK:
--   Tum mevcut sirketler trial_kullanildi=1 isaretlenir. Sebep:
--     - Aktif aboneler: zaten trial gectiler
--     - Trial'i bitmis kullanicilar: 7 gun denediler, ikinci sans yok
--     - Trial'i suren kullanicilar: kalan gunlerini kullansinlar, iyzico'da yine 7 gun verilmesin
--   Bu, eski sistemdeki 14 gun bedava acigi anlik kapatir.
-- =====================================================

-- 1. sirketler tablosuna trial_kullanildi kolonu ekle
ALTER TABLE `sirketler`
    ADD COLUMN `trial_kullanildi` TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'iyzico/Apple uzerinden bir kez trial kullanildi mi'
    AFTER `deneme_bitis`;

-- 2. Mevcut tum sirketleri trial_kullanildi=1 isaretle
UPDATE `sirketler` SET `trial_kullanildi` = 1;

-- =====================================================
-- TAMAMLANDI
--
-- Bundan sonra yeni kayitlar:
--   trial_kullanildi=0 (default), denemeBaslat() artik cagrilmiyor,
--   plan='deneme' + deneme_bitis=NULL → modullerde paywall
--
-- Ilk basarili abonelikte (iyzico/Apple) trial_kullanildi=1 isaretlenir
-- Iptal sonrasi tekrar abonelikte trial verilmez.
-- =====================================================
