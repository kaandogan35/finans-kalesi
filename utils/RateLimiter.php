<?php
/**
 * Finans Kalesi — Rate Limiter (Hız Sınırlayıcı)
 *
 * Login endpoint'ini brute-force saldırılarına karşı korur.
 * Aynı IP'den çok fazla başarısız giriş denemesi gelirse geçici olarak bloklar.
 *
 * Nasıl çalışır?
 *   Son 15 dakikada aynı IP'den 5+ başarısız giriş varsa → 15 dakika blok
 *   Blok kalkınca tekrar deneyebilir
 *
 * Veri kaynağı: sistem_loglari tablosu (giris_basarisiz kayıtları)
 */

class RateLimiter {

    // ─── Ayarlar ────────────────────────────────────────────────────────
    const LOGIN_MAX_DENEME = 5;   // Bu kadar başarısız denemeden sonra blok
    const LOGIN_PENCERE_DK = 15;  // Kaç dakika içinde sayılsın
    const LOGIN_BLOK_DK    = 15;  // Kaç dakika bloklanacak

    const KAYIT_MAX_DENEME = 3;   // Aynı IP'den maksimum kayıt denemesi
    const KAYIT_PENCERE_DK = 60;  // 1 saat içinde sayılsın

    const SIFRE_SIFIRLAMA_MAX = 3;   // Şifre sıfırlama: maks deneme
    const SIFRE_SIFIRLAMA_DK  = 30;  // 30 dakika içinde sayılsın

    /**
     * Bu IP'den giriş yapılabilir mi?
     *
     * Son LOGIN_PENCERE_DK dakika içinde LOGIN_MAX_DENEME veya daha fazla
     * başarısız giriş yapıldıysa giriş engellenir.
     *
     * @param string $ip Kontrol edilecek IP adresi
     * @return bool true = giriş serbest, false = bloklu
     */
    public static function login_izinli_mi(string $ip): bool {
        try {
            $db = Database::baglan();
            $stmt = $db->prepare(
                "SELECT COUNT(*) as sayi
                 FROM sistem_loglari
                 WHERE ip_adresi = ?
                   AND islem_tipi = 'giris_basarisiz'
                   AND tarih >= DATE_SUB(NOW(), INTERVAL ? MINUTE)"
            );
            $stmt->execute([$ip, self::LOGIN_PENCERE_DK]);
            $sonuc = $stmt->fetch();

            return (int)$sonuc['sayi'] < self::LOGIN_MAX_DENEME;

        } catch (Exception $e) {
            // Kontrol yapılamazsa açık bırak — servisi bloklama
            error_log('RateLimiter kontrol hatasi: ' . $e->getMessage());
            return true;
        }
    }

    /**
     * Bu IP'den yeni kayıt yapılabilir mi?
     *
     * Son KAYIT_PENCERE_DK dakika içinde KAYIT_MAX_DENEME veya daha fazla
     * kayıt yapıldıysa engellenir (bot/spam kaydını önler).
     *
     * @param string $ip Kontrol edilecek IP adresi
     * @return bool true = kayıt serbest, false = bloklu
     */
    public static function kayit_izinli_mi(string $ip): bool {
        try {
            $db = Database::baglan();
            $stmt = $db->prepare(
                "SELECT COUNT(*) as sayi
                 FROM sistem_loglari
                 WHERE ip_adresi = ?
                   AND islem_tipi = 'kayit'
                   AND tarih >= DATE_SUB(NOW(), INTERVAL ? MINUTE)"
            );
            $stmt->execute([$ip, self::KAYIT_PENCERE_DK]);
            $sonuc = $stmt->fetch();

            return (int)$sonuc['sayi'] < self::KAYIT_MAX_DENEME;

        } catch (Exception $e) {
            error_log('RateLimiter kayit kontrol hatasi: ' . $e->getMessage());
            return true;
        }
    }

    /**
     * Bu IP'den şifre sıfırlama talebi gönderilebilir mi?
     *
     * Son SIFRE_SIFIRLAMA_DK dakika içinde SIFRE_SIFIRLAMA_MAX veya daha fazla
     * talep geldiyse engellenir (brute-force token tahminini önler).
     */
    public static function sifre_sifirlama_izinli_mi(string $ip): bool {
        try {
            $db = Database::baglan();
            $stmt = $db->prepare(
                "SELECT COUNT(*) as sayi
                 FROM sistem_loglari
                 WHERE ip_adresi = ?
                   AND islem_tipi = 'giris_basarisiz'
                   AND detay LIKE 'sifre_sifirlama_talebi:%'
                   AND tarih >= DATE_SUB(NOW(), INTERVAL ? MINUTE)"
            );
            $stmt->execute([$ip, self::SIFRE_SIFIRLAMA_DK]);
            $sonuc = $stmt->fetch();

            return (int)$sonuc['sayi'] < self::SIFRE_SIFIRLAMA_MAX;

        } catch (Exception $e) {
            error_log('RateLimiter sifre_sifirlama kontrol hatasi: ' . $e->getMessage());
            return true;
        }
    }

    /**
     * Kaç saniye daha beklemesi gerektiğini hesapla
     *
     * İlk başarısız denemeden itibaren LOGIN_BLOK_DK dakika geçmesi gerekiyor.
     *
     * @param string $ip IP adresi
     * @return int Saniye cinsinden kalan bekleme süresi (0 = blok yok)
     */
    public static function bekleme_suresi(string $ip): int {
        try {
            $db = Database::baglan();
            // Pencere içindeki en eski başarısız denemeyi bul
            $stmt = $db->prepare(
                "SELECT tarih
                 FROM sistem_loglari
                 WHERE ip_adresi = ?
                   AND islem_tipi = 'giris_basarisiz'
                   AND tarih >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
                 ORDER BY tarih ASC
                 LIMIT 1"
            );
            $stmt->execute([$ip, self::LOGIN_PENCERE_DK]);
            $ilk_deneme = $stmt->fetch();

            if (!$ilk_deneme) {
                return 0;
            }

            // İlk denemeden LOGIN_BLOK_DK dakika sonra blok kalkar
            $blok_bitis = strtotime($ilk_deneme['tarih']) + (self::LOGIN_BLOK_DK * 60);
            $kalan      = $blok_bitis - time();

            return max(0, (int)$kalan);

        } catch (Exception $e) {
            error_log('RateLimiter bekleme hatasi: ' . $e->getMessage());
            return 0;
        }
    }
}
