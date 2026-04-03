-- ParamGo — Şifre Sıfırlama Kolonları Migration
-- Çalıştırma: cPanel → phpMyAdmin → finans_kalesi DB → SQL sekmesi

ALTER TABLE `kullanicilar`
    ADD COLUMN `sifre_sifirlama_token` VARCHAR(255) DEFAULT NULL AFTER `sifre_hash`,
    ADD COLUMN `sifre_sifirlama_bitis` DATETIME DEFAULT NULL AFTER `sifre_sifirlama_token`,
    ADD KEY `idx_sifre_sifirlama_token` (`sifre_sifirlama_token`);
