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
