<?php
// =============================================================
// KriptoHelper.php — AES-256-GCM Şifreleme/Çözme Yardımcısı (Varlık & Kasa)
// Finans Kalesi SaaS — Aşama 1.6
//
// KRİTİK GÜVENLİK KURALLARI:
// - Çözülmüş veriler ASLA loglanmaz, error_log'a yazılmaz
// - PBKDF2 ile anahtar türetme (100.000 iterasyon)
// - Her şifreleme için rastgele IV (12 byte / 96 bit GCM)
// - Authentication tag (16 byte) veri bütünlüğünü garanti eder
// - Depolama formatı: base64(IV[12] + TAG[16] + SİFRELİ)
// =============================================================

class KriptoHelper {
    private $anahtar; // 32 byte AES-256 anahtarı

    public function __construct($kasa_sifre, $kasa_salt) {
        // PBKDF2 ile şifreden anahtar türet — salt veritabanındaki sirketler.kasa_salt
        $this->anahtar = hash_pbkdf2('sha256', $kasa_sifre, $kasa_salt, 100000, 32, true);
    }

    // Metni şifrele — her çağrıda farklı IV üretir
    public function sifrele($metin) {
        if ($metin === null || $metin === '') {
            return null;
        }

        $iv = random_bytes(12); // GCM için 96-bit IV
        $tag = '';

        $sifreli = openssl_encrypt(
            (string)$metin,
            'aes-256-gcm',
            $this->anahtar,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            16 // tag uzunluğu: 128 bit
        );

        if ($sifreli === false) {
            throw new Exception('Sifreleme basarisiz');
        }

        // IV + TAG + SİFRELİ VERİ → base64
        return base64_encode($iv . $tag . $sifreli);
    }

    // Şifreli veriyi çöz
    public function coz($sifrelenmis_veri) {
        if (empty($sifrelenmis_veri)) {
            return null;
        }

        $ham = base64_decode($sifrelenmis_veri, true);

        if ($ham === false || strlen($ham) < 29) {
            return null; // Bozuk veri
        }

        $iv      = substr($ham, 0, 12);
        $tag     = substr($ham, 12, 16);
        $sifreli = substr($ham, 28);

        $metin = openssl_decrypt(
            $sifreli,
            'aes-256-gcm',
            $this->anahtar,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        // false = yanlış şifre veya bozuk veri
        return ($metin === false) ? null : $metin;
    }

    // ─── Statik Yardımcılar ───

    // İlk kez kasa şifresi kurulumunda: hash + salt üret
    public static function sifre_hash_olustur($sifre) {
        $salt = bin2hex(random_bytes(32)); // 64 hex karakter
        $hash = password_hash($sifre . $salt, PASSWORD_BCRYPT, array('cost' => 12));
        return array('hash' => $hash, 'salt' => $salt);
    }

    // Girilen şifre doğru mu? (Giriş kontrolü)
    public static function sifre_dogrula($sifre, $hash, $salt) {
        if (empty($sifre) || empty($hash) || empty($salt)) {
            return false;
        }
        return password_verify($sifre . $salt, $hash);
    }
}
