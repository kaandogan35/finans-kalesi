<?php
/**
 * Finans Kalesi — Genel Uygulama Ayarları
 * 
 * Bu dosya .env'deki gizli ayarları okur ve tüm uygulamaya sunar.
 * Eski sistemdeki db.php + ayarların birleşik hali.
 * 
 * Kullanım: $ayarlar = require __DIR__ . '/app.php';
 */

// .env dosyasini oku ve degiskenlere yukle
// function_exists kontrolu: dosya birden fazla yuklenirse hata vermesin
if (!function_exists('env_oku')) {
function env_oku($dosya_yolu) {
    if (!file_exists($dosya_yolu)) {
        throw new RuntimeException('.env dosyası bulunamadı: ' . $dosya_yolu);
    }
    
    $satirlar = file($dosya_yolu, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($satirlar as $satir) {
        // Yorum satırlarını atla
        $satir = trim($satir);
        if (empty($satir) || $satir[0] === '#') {
            continue;
        }
        
        // ANAHTAR=DEGER formatını ayır
        $parca = explode('=', $satir, 2);
        if (count($parca) === 2) {
            $anahtar = trim($parca[0]);
            $deger = trim($parca[1]);
            
            // Çevre değişkenine yükle (PHP'nin global ayar deposu)
            $_ENV[$anahtar] = $deger;
            putenv("$anahtar=$deger");
        }
    }
}
}

// .env dosyasini yukle (backend klasorunun kokunden)
env_oku(__DIR__ . '/../.env');

// Yardimci fonksiyon: Cevre degiskenini oku, yoksa varsayilan degeri dondur
if (!function_exists('env')) {
function env($anahtar, $varsayilan = null) {
    return $_ENV[$anahtar] ?? getenv($anahtar) ?: $varsayilan;
}
}

// Tüm ayarları düzenli bir dizi olarak döndür
return [
    // Veritabanı
    'db' => [
        'host'    => env('DB_HOST', 'localhost'),
        'isim'    => env('DB_NAME'),
        'kullanici' => env('DB_USER'),
        'sifre'   => env('DB_PASS'),
        'charset' => 'utf8mb4',
    ],
    
    // JWT Token
    'jwt' => [
        'secret'         => env('JWT_SECRET'),
        'issuer'         => env('JWT_ISSUER', 'finans-kalesi-api'),
        'access_suresi'  => (int) env('JWT_ACCESS_SURESI', 900),      // 15 dakika
        'refresh_suresi' => (int) env('JWT_REFRESH_SURESI', 2592000), // 30 gün
    ],
    
    // Uygulama
    'app' => [
        'env'   => env('APP_ENV', 'production'),
        'debug' => env('APP_DEBUG', 'false') === 'true',
        'url'   => env('APP_URL', 'https://paramgo.com'),
    ],
    
    // CORS
    'cors' => [
        'origin' => env('CORS_ORIGIN', 'https://paramgo.com'),
    ],
    
    // Şifreleme — Varlık & Kasa (kullanıcı kasa şifresi salt'ı)
    'crypto' => [
        'salt' => env('CRYPTO_SALT'),
    ],

    // Şifreleme — Sistem Geneli PII (cari, çek, ödeme modülleri)
    'sistem_sifreleme' => [
        'anahtar' => env('APP_ENCRYPTION_KEY'),
    ],

    // Abonelik — Lansman Kampanyası
    // .env'de LANSMAN_BITIS_TARIHI tanımlanmışsa kampanya aktif sayılır.
    // Örnek: LANSMAN_BITIS_TARIHI=2026-06-14 23:59:59
    'lansman' => [
        'bitis_tarihi' => env('LANSMAN_BITIS_TARIHI', null),
    ],
];
