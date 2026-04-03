<?php
/**
 * ParamGo — TOTP (Time-based One-Time Password) Helper
 *
 * RFC 6238 uyumlu — Google Authenticator, Authy ile çalışır.
 * Sıfır bağımlılık, saf PHP.
 *
 * Kullanım:
 *   $secret = TOTPHelper::secret_olustur();
 *   $uri    = TOTPHelper::qr_uri($secret, $email, 'ParamGo');
 *   $gecerli = TOTPHelper::dogrula($secret, $kullanici_kodu);
 */

class TOTPHelper {

    // Base32 karakter seti (RFC 4648)
    private const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Yeni TOTP secret oluştur (160-bit, base32 encoded)
     */
    public static function secret_olustur(): string {
        $bytes = random_bytes(20); // 160 bit
        return self::base32_encode($bytes);
    }

    /**
     * Yedek kodlar oluştur (8 adet, 8 haneli)
     */
    public static function yedek_kodlar_olustur(int $adet = 8): array {
        $kodlar = [];
        for ($i = 0; $i < $adet; $i++) {
            $kodlar[] = strtoupper(bin2hex(random_bytes(4))); // 8 hex karakter
        }
        return $kodlar;
    }

    /**
     * TOTP kodu doğrula
     * ±1 pencere toleransı (30 saniyelik periyotlar: -30s, 0, +30s)
     *
     * @param string $secret  Base32 encoded secret
     * @param string $kod     Kullanıcının girdiği 6 haneli kod
     * @return bool
     */
    public static function dogrula(string $secret, string $kod): bool {
        $kod = trim($kod);
        if (!preg_match('/^\d{6}$/', $kod)) {
            return false;
        }

        $zaman = floor(time() / 30);

        // ±1 pencere toleransı
        for ($i = -1; $i <= 1; $i++) {
            $hesaplanan = self::totp_hesapla($secret, $zaman + $i);
            if (hash_equals($hesaplanan, $kod)) {
                return true;
            }
        }

        return false;
    }

    /**
     * OTP Auth URI oluştur (QR kod için)
     * Format: otpauth://totp/Label:account?secret=XXX&issuer=Label&digits=6&period=30
     */
    public static function qr_uri(string $secret, string $hesap, string $yayinci = 'ParamGo'): string {
        return sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s&digits=6&period=30&algorithm=SHA1',
            rawurlencode($yayinci),
            rawurlencode($hesap),
            $secret,
            rawurlencode($yayinci)
        );
    }

    /**
     * Belirli bir zaman penceresi için TOTP kodu hesapla
     */
    private static function totp_hesapla(string $secret, int $zaman): string {
        // Secret'ı base32'den decode et
        $key = self::base32_decode($secret);

        // Zaman değerini 8-byte big-endian olarak kodla
        $zaman_bytes = pack('N*', 0, $zaman);

        // HMAC-SHA1
        $hash = hash_hmac('sha1', $zaman_bytes, $key, true);

        // Dynamic truncation (RFC 4226, Section 5.4)
        $offset = ord($hash[19]) & 0x0F;
        $kod_int = (
            ((ord($hash[$offset])     & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8)  |
            ((ord($hash[$offset + 3]) & 0xFF))
        ) % 1000000;

        return str_pad((string)$kod_int, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Base32 encode (binary → base32 string)
     */
    private static function base32_encode(string $data): string {
        $result = '';
        $buffer = 0;
        $bitsLeft = 0;

        for ($i = 0; $i < strlen($data); $i++) {
            $buffer = ($buffer << 8) | ord($data[$i]);
            $bitsLeft += 8;

            while ($bitsLeft >= 5) {
                $bitsLeft -= 5;
                $index = ($buffer >> $bitsLeft) & 0x1F;
                $result .= self::BASE32_CHARS[$index];
            }
        }

        if ($bitsLeft > 0) {
            $index = ($buffer << (5 - $bitsLeft)) & 0x1F;
            $result .= self::BASE32_CHARS[$index];
        }

        return $result;
    }

    /**
     * Base32 decode (base32 string → binary)
     */
    private static function base32_decode(string $data): string {
        $data = strtoupper(rtrim($data, '='));
        $result = '';
        $buffer = 0;
        $bitsLeft = 0;

        for ($i = 0; $i < strlen($data); $i++) {
            $val = strpos(self::BASE32_CHARS, $data[$i]);
            if ($val === false) continue;

            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $result .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }

        return $result;
    }
}
