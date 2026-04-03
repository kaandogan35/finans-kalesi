<?php
/**
 * ParamGo — Standart JSON Yanıt Sınıfı
 * 
 * Tüm API yanıtları bu sınıftan geçer.
 * Böylece her endpoint aynı formatta cevap verir:
 *   Başarılı: {"basarili": true, "veri": {...}}
 *   Hata:     {"basarili": false, "hata": "mesaj"}
 * 
 * Eski sistemde her yerde echo json_encode yazıyorduk — artık tek merkezden yönetiliyor.
 */

class Response {
    
    /**
     * Başarılı yanıt gönder
     * 
     * @param mixed  $veri    Döndürülecek veri (dizi, nesne vb.)
     * @param string $mesaj   İsteğe bağlı başarı mesajı
     * @param int    $kod     HTTP durum kodu (varsayılan: 200)
     */
    public static function basarili($veri = null, string $mesaj = '', int $kod = 200): void {
        http_response_code($kod);
        
        $yanit = ['basarili' => true];
        
        if ($mesaj !== '') {
            $yanit['mesaj'] = $mesaj;
        }
        
        if ($veri !== null) {
            $yanit['veri'] = $veri;
        }
        
        self::json_gonder($yanit);
    }
    
    /**
     * Hata yanıtı gönder
     * 
     * @param string $mesaj  Hata mesajı
     * @param int    $kod    HTTP durum kodu (varsayılan: 400)
     * @param array  $detay  İsteğe bağlı ek hata detayları
     */
    public static function hata(string $mesaj, int $kod = 400, array $detay = []): void {
        http_response_code($kod);
        
        $yanit = [
            'basarili' => false,
            'hata' => $mesaj
        ];
        
        if (!empty($detay)) {
            $yanit['detay'] = $detay;
        }
        
        self::json_gonder($yanit);
    }
    
    /**
     * Doğrulama hatası yanıtı (form hataları için)
     * 
     * @param array $hatalar Alan bazlı hata listesi ["alan" => "mesaj"]
     */
    public static function dogrulama_hatasi(array $hatalar): void {
        http_response_code(422);
        
        self::json_gonder([
            'basarili' => false,
            'hata' => 'Doğrulama hatası',
            'hatalar' => $hatalar
        ]);
    }
    
    /**
     * Yetkisiz erişim yanıtı (401)
     */
    public static function yetkisiz(string $mesaj = 'Bu işlem için giriş yapmalısınız'): void {
        self::hata($mesaj, 401);
    }
    
    /**
     * Yasaklı erişim yanıtı (403)
     */
    public static function yasak(string $mesaj = 'Bu işlem için yetkiniz yok'): void {
        self::hata($mesaj, 403);
    }
    
    /**
     * Bulunamadı yanıtı (404)
     */
    public static function bulunamadi(string $mesaj = 'Aradığınız kayıt bulunamadı'): void {
        self::hata($mesaj, 404);
    }
    
    /**
     * Çok fazla istek yanıtı (429 Too Many Requests)
     *
     * @param int $bekleme_saniye Kaç saniye sonra tekrar denenebilir
     */
    public static function cok_fazla_istek(int $bekleme_saniye = 0): void {
        if ($bekleme_saniye > 0) {
            header('Retry-After: ' . $bekleme_saniye);
        }
        $dakika = (int)ceil($bekleme_saniye / 60);
        $mesaj  = $dakika > 0
            ? "Çok fazla başarısız deneme. $dakika dakika sonra tekrar deneyin."
            : 'Çok fazla istek. Lütfen biraz bekleyin.';
        self::hata($mesaj, 429);
    }

    /**
     * Sunucu hatası yanıtı (500)
     */
    public static function sunucu_hatasi(string $mesaj = 'Sunucu hatası oluştu'): void {
        self::hata($mesaj, 500);
    }
    
    /**
     * JSON formatında çıktı gönder ve işlemi bitir
     */
    private static function json_gonder(array $veri): void {
        // JSON header'ı ayarla
        header('Content-Type: application/json; charset=utf-8');
        
        // Türkçe karakterlerin bozulmaması için JSON_UNESCAPED_UNICODE
        echo json_encode($veri, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
