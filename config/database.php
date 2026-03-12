<?php
/**
 * Finans Kalesi — Veritabanı Bağlantısı (PDO)
 * 
 * Eski sistemdeki db.php'nin yeni versiyonu.
 * Aynı PDO + güvenlik ayarları, ama artık .env'den okuyor.
 * 
 * Fark: Eski sistemde her sayfada $db değişkeni vardı.
 * Yeni sistemde Database sınıfı tek bir bağlantı yönetiyor (Singleton pattern).
 * Bunu dükkanda tek bir kasa düşün — herkes aynı kasayı kullanıyor.
 */

class Database {
    // Tek bağlantı nesnesi (tüm uygulama boyunca bir tane yeter)
    private static ?PDO $baglanti = null;
    
    /**
     * Veritabanı bağlantısını getir
     * İlk çağrıda bağlantı kurar, sonrakilerinde aynı bağlantıyı döndürür
     */
    public static function baglan(): PDO {
        // Zaten bağlantı varsa tekrar kurma (performans)
        if (self::$baglanti !== null) {
            return self::$baglanti;
        }
        
        // Ayarları yükle
        $ayarlar = require __DIR__ . '/app.php';
        $db = $ayarlar['db'];
        
        try {
            // PDO bağlantısını kur (eski db.php'deki gibi)
            $dsn = "mysql:host={$db['host']};dbname={$db['isim']};charset={$db['charset']}";
            
            self::$baglanti = new PDO($dsn, $db['kullanici'], $db['sifre'], [
                // Güvenlik Protokolleri (eski db.php'den birebir):
                
                // 1. Hataları exception olarak fırlat (eski: ERRMODE_EXCEPTION)
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                
                // 2. Sonuçları ilişkisel dizi olarak getir (eski: FETCH_ASSOC)
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                
                // 3. Gerçek prepared statement kullan — SQL injection kalkanı (eski: EMULATE_PREPARES = false)
                PDO::ATTR_EMULATE_PREPARES => false,
                
                // 4. Bağlantı zaman aşımı (yeni — hosting için güvenlik)
                PDO::ATTR_TIMEOUT => 5,
            ]);
            
            return self::$baglanti;
            
        } catch (PDOException $e) {
            // Production'da hata detayını kullanıcıya gösterme!
            // Sadece genel bir mesaj ver, detay loglansın
            $hata_mesaji = 'Veritabanı bağlantısı kurulamadı.';
            
            // Debug modunda detay göster (geliştirme sırasında işe yarar)
            if (isset($ayarlar['app']['debug']) && $ayarlar['app']['debug']) {
                $hata_mesaji .= ' Detay: ' . $e->getMessage();
            }
            
            // HTTP 500 hatası döndür
            http_response_code(500);
            echo json_encode([
                'basarili' => false,
                'hata' => $hata_mesaji
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    
    /**
     * Bağlantıyı kapat (genelde gerek yok, PHP otomatik kapatır)
     */
    public static function kapat(): void {
        self::$baglanti = null;
    }
}
