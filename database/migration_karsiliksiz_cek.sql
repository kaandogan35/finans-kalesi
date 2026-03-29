-- ============================================================
-- Migration: Karşılıksız çek alanları
-- Tarih: 2026-03-28
-- Tablo: cek_senetler
-- ============================================================
-- Yerel veritabanına uygulandı: 2026-03-28
-- Canlıya uygulama: phpMyAdmin > SQL sekmesine yapıştır ve çalıştır

ALTER TABLE cek_senetler
  ADD COLUMN serh_tarihi DATE DEFAULT NULL
    COMMENT 'Bankadan alinan serh/iade tarihi'
    AFTER tahsil_tarihi,

  ADD COLUMN karsiliksiz_not TEXT DEFAULT NULL
    COMMENT 'Karsiliksiz islemi notu: anlasma plani, takip notu vb.'
    AFTER serh_tarihi,

  ADD COLUMN karsiliksiz_aksiyon VARCHAR(30) DEFAULT NULL
    COMMENT 'anlasacagim | bekleyecegim | kapatildi'
    AFTER karsiliksiz_not;
