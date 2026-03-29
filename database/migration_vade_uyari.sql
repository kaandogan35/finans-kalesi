-- =====================================================
-- ParamGo — Vade Uyarı + WhatsApp + Push Altyapısı
-- bildirim_tercihleri tablosuna 2 kolon eklenir
-- Tarih: 2026-03-28
-- =====================================================
-- UYGULAMA:
--   phpMyAdmin > SQL sekmesi > Yapıştır > Çalıştır
--   Güvenli: IF NOT EXISTS mantığıyla tekrar çalıştırmak hata vermez
-- =====================================================

-- 1. whatsapp tercihi (Meta Cloud API — şimdilik kapalı)
ALTER TABLE `bildirim_tercihleri`
    ADD COLUMN IF NOT EXISTS `whatsapp` TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'WhatsApp bildirimi (WHATSAPP_ENABLED=true olunca çalışır)'
        AFTER `telefon`;

-- 2. push tercihi (Capacitor mobil push — altyapı hazırlığı)
ALTER TABLE `bildirim_tercihleri`
    ADD COLUMN IF NOT EXISTS `push` TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'Mobil push bildirimi (Capacitor entegrasyonuna kadar pasif)'
        AFTER `whatsapp`;

-- =====================================================
-- Sonuç kontrolü (isteğe bağlı — çalıştırınca görürsün)
-- =====================================================
-- DESCRIBE bildirim_tercihleri;
