<?php
// =============================================================
// SistemKripto.php — Sistem Seviyesi AES-256-GCM Şifreleme
// ParamGo SaaS — Aşama 1.9
//
// Global PII verileri için (Cari, Çek/Senet, Ödeme Takip).
// Anahtar kaynağı: .env → APP_ENCRYPTION_KEY
//
// KRİTİK NOTLAR:
//   - Varlık & Kasa modülü BU sınıfı KULLANMAZ.
//     Varlık & Kasa için kullanıcının özel kasa şifresiyle
//     çalışan KriptoHelper kullanılır.
//   - Çözülmüş veriler ASLA loglanmaz, error_log'a yazılmaz.
//   - Depolama formatı: base64(IV[12] + TAG[16] + ŞİFRELİ)
// =============================================================

class SistemKripto {

    private static ?string $anahtar = null;

    // Anahtarı .env'den türet (lazy, tek seferlik)
    private static function anahtar(): string {
        if (self::$anahtar === null) {
            $key = function_exists('env')
                ? env('APP_ENCRYPTION_KEY')
                : ($_ENV['APP_ENCRYPTION_KEY'] ?? null);

            if (empty($key)) {
                throw new RuntimeException('SistemKripto: APP_ENCRYPTION_KEY .env dosyasında tanımlı değil');
            }

            // SHA-256 hash ile 32 byte'lık AES-256 anahtarı elde et
            self::$anahtar = hash('sha256', $key, true);
        }
        return self::$anahtar;
    }

    // Metni şifrele — her çağrıda benzersiz IV üretir
    public static function sifrele(?string $metin): ?string {
        if ($metin === null || $metin === '') {
            return null;
        }

        $iv  = random_bytes(12); // GCM için 96-bit IV
        $tag = '';

        $sifreli = openssl_encrypt(
            $metin,
            'aes-256-gcm',
            self::anahtar(),
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            16 // 128-bit authentication tag
        );

        if ($sifreli === false) {
            throw new RuntimeException('SistemKripto: Şifreleme başarısız');
        }

        return base64_encode($iv . $tag . $sifreli);
    }

    // Şifreli veriyi çöz
    public static function coz(?string $sifrelenmis): ?string {
        if (empty($sifrelenmis)) {
            return null;
        }

        $ham = base64_decode($sifrelenmis, true);

        if ($ham === false || strlen($ham) < 29) {
            return null; // Bozuk veya geçersiz veri
        }

        $iv      = substr($ham, 0, 12);
        $tag     = substr($ham, 12, 16);
        $sifreli = substr($ham, 28);

        $metin = openssl_decrypt(
            $sifreli,
            'aes-256-gcm',
            self::anahtar(),
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        return ($metin === false) ? null : $metin;
    }
}
