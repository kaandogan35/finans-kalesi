<?php
/**
 * Finans Kalesi — JWT Token Yardimcisi
 * 
 * JWT (JSON Web Token) = Kullanicinin kimligini tasiyan sifrelenmis bilet.
 * 
 * Eski sistemde: Session + cookie ile giris durumu tutuluyordu.
 * Yeni sistemde: JWT token kullaniyoruz cunku:
 *   - API (mobil + web) icin session calismaz
 *   - Token icinde kullanici bilgisi tasiniyor
 *   - Sunucu tarafinda session tutmaya gerek yok
 * 
 * Benzetme: Lunaparka girerken bilek bandı takıyorsun.
 * Her oyuncağa binişte bandı gösteriyorsun, tekrar gişeye gitmiyorsun.
 * Access token = bilek bandı (15 dk geçerli)
 * Refresh token = yıllık kart (7 gün geçerli, yeni bant alabilirsin)
 * 
 * NOT: firebase/php-jwt yerine saf PHP implementasyonu.
 * HMAC-SHA256 ile imzalama yapiyoruz — guvenli ve hafif.
 */

class JWTHelper {
    
    /**
     * Access token olustur (kisa sureli — 15 dakika)
     * 
     * @param array $kullanici Kullanici bilgileri
     * @return string JWT token
     */
    public static function access_token_olustur($kullanici) {
        $ayarlar = require BASE_PATH . '/config/app.php';
        $jwt = $ayarlar['jwt'];
        
        $simdi = time();
        
        $payload = [
            'iss' => $jwt['issuer'],           // Token'i kim olusturdu
            'iat' => $simdi,                    // Olusturma zamani
            'exp' => $simdi + $jwt['access_suresi'], // Son kullanim (15 dk)
            'sub' => $kullanici['id'],          // Kullanici ID
            'sirket_id' => $kullanici['sirket_id'], // Hangi sirkete ait (multi-tenant)
            'rol' => $kullanici['rol'],         // Yetki rolu (admin, kullanici vb.)
            'tip' => 'access'                   // Token tipi
        ];
        
        return self::token_olustur($payload, $jwt['secret']);
    }
    
    /**
     * Refresh token olustur (uzun sureli — 7 gun)
     * 
     * @param array $kullanici Kullanici bilgileri
     * @return array [token, son_kullanim]
     */
    public static function refresh_token_olustur($kullanici) {
        $ayarlar = require BASE_PATH . '/config/app.php';
        $jwt = $ayarlar['jwt'];
        
        $simdi = time();
        $son_kullanim = $simdi + $jwt['refresh_suresi'];
        
        // Refresh token icin rastgele benzersiz deger
        $rastgele = bin2hex(random_bytes(32));
        
        $payload = [
            'iss' => $jwt['issuer'],
            'iat' => $simdi,
            'exp' => $son_kullanim,
            'sub' => $kullanici['id'],
            'tip' => 'refresh',
            'jti' => $rastgele  // Benzersiz token kimliigi
        ];
        
        $token = self::token_olustur($payload, $jwt['secret']);
        
        return [
            'token' => $token,
            'son_kullanim' => date('Y-m-d H:i:s', $son_kullanim)
        ];
    }
    
    /**
     * Token dogrula ve icindeki bilgileri dondur
     * 
     * @param string $token JWT token
     * @return array|false Payload veya false
     */
    public static function token_dogrula($token) {
        $ayarlar = require BASE_PATH . '/config/app.php';
        $secret = $ayarlar['jwt']['secret'];
        
        // Token'i parcalara ayir (header.payload.signature)
        $parcalar = explode('.', $token);
        if (count($parcalar) !== 3) {
            return false;
        }
        
        list($header_b64, $payload_b64, $imza_b64) = $parcalar;
        
        // Imzayi dogrula
        $beklenen_imza = self::base64url_encode(
            hash_hmac('sha256', "$header_b64.$payload_b64", $secret, true)
        );
        
        if (!hash_equals($beklenen_imza, $imza_b64)) {
            return false; // Imza gecersiz — token degistirilmis olabilir
        }
        
        // Payload'i coz
        $payload = json_decode(self::base64url_decode($payload_b64), true);
        
        if (!$payload) {
            return false;
        }
        
        // Suresi dolmus mu kontrol et
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false; // Token suresi dolmus
        }
        
        return $payload;
    }
    
    /**
     * HTTP isteginden token'i cikart
     * Authorization: Bearer <token> headerindan alir
     * 
     * @return string|null Token veya null
     */
    public static function istekten_token_al() {
        // Authorization header'ini oku
        $header = null;
        
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $header = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            // Bazi hosting'lerde bu degisken kullanilir
            $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                $header = $headers['Authorization'];
            }
        }
        
        if (!$header) {
            return null;
        }
        
        // "Bearer " prefixini cikar
        if (preg_match('/^Bearer\s+(.+)$/i', $header, $eslesme)) {
            return $eslesme[1];
        }
        
        return null;
    }
    
    // ============================================
    // DAHILI YARDIMCI FONKSIYONLAR
    // ============================================
    
    /**
     * JWT token olustur (header + payload + imza)
     */
    private static function token_olustur($payload, $secret) {
        // Header: Algoritma bilgisi
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];
        
        // Base64URL encode
        $header_b64 = self::base64url_encode(json_encode($header));
        $payload_b64 = self::base64url_encode(json_encode($payload));
        
        // HMAC-SHA256 ile imzala
        $imza = self::base64url_encode(
            hash_hmac('sha256', "$header_b64.$payload_b64", $secret, true)
        );
        
        // Birlestir: header.payload.imza
        return "$header_b64.$payload_b64.$imza";
    }
    
    /**
     * Base64 URL-safe encode
     * Standart base64'teki +, / ve = karakterleri URL'de sorun cikarir
     * Bu fonksiyon onlari URL-guvenli karakterlerle degistirir
     */
    private static function base64url_encode($veri) {
        return rtrim(strtr(base64_encode($veri), '+/', '-_'), '=');
    }
    
    /**
     * Base64 URL-safe decode
     */
    private static function base64url_decode($veri) {
        return base64_decode(strtr($veri, '-_', '+/'));
    }
}
