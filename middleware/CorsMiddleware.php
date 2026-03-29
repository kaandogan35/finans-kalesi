<?php
/**
 * Finans Kalesi — CORS Middleware
 * 
 * CORS (Cross-Origin Resource Sharing) = Farklı adreslerden gelen isteklere izin verme.
 * 
 * Neden lazım? Eski sistemde PHP + HTML aynı dosyadaydı, sorun yoktu.
 * Yeni sistemde React frontend ayrı bir yerden çalışacak ve API'ye istek atacak.
 * Tarayıcı güvenlik gereği farklı adreslerden gelen istekleri engeller.
 * Bu middleware tarayıcıya "React'tan gelen isteklere izin ver" diyor.
 * 
 * Benzetme: Dükkana gelen müşteri kimliğini gösteriyor, 
 * biz de "tamam, içeri girebilirsin" diyoruz.
 */

class CorsMiddleware {
    
    /**
     * CORS başlıklarını ayarla
     * Her istek geldiğinde bu çalışır
     */
    public static function calistir(): void {
        // İzin verilen origin adresini belirle
        // NOT: Credentials (cookie/token) gönderiminde tarayıcılar "*" kabul etmez.
        // Bu yüzden development'ta bile gelen origin'i yansıtıyoruz.
        $app_env = env('APP_ENV', 'production');
        $gelen_origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if ($app_env === 'development') {
            // Geliştirme: İsteğin geldiği origin'i yansıt (localhost portları değişebilir)
            $izinli_adres = $gelen_origin ?: env('CORS_ORIGIN', 'http://localhost:3000');
        } else {
            // Production: Web sitesi + Capacitor mobil uygulama origin'leri
            // capacitor://localhost → iOS Capacitor uygulaması
            // http://localhost     → Android Capacitor uygulaması
            $izinli_originler = [
                env('CORS_ORIGIN', 'https://paramgo.com'),
                'https://paramgo.com',
                'capacitor://localhost',
                'http://localhost',
            ];

            if ($gelen_origin && in_array($gelen_origin, $izinli_originler, true)) {
                $izinli_adres = $gelen_origin;
            } else {
                $izinli_adres = env('CORS_ORIGIN', 'https://paramgo.com');
            }
        }

        // Tarayıcıya hangi adresten istek gelebileceğini söyle
        header("Access-Control-Allow-Origin: $izinli_adres");
        // Origin değişkenine göre cache'in doğru çalışması için Vary başlığı
        header('Vary: Origin');
        
        // Hangi HTTP metodlarına izin veriyoruz
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        
        // Hangi başlıklar (header) gönderilebilir
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        
        // Tarayıcı bu bilgiyi 1 saat cache'lesin (her istekte tekrar sormasın)
        header('Access-Control-Max-Age: 3600');
        
        // Kimlik bilgilerini (cookie, token) göndermeye izin ver
        header('Access-Control-Allow-Credentials: true');
        
        /**
         * OPTIONS isteği: Tarayıcı asıl isteği göndermeden önce
         * "bu isteğe izin var mı?" diye sorar. Buna "preflight" deniyor.
         * Cevap: "Evet var, buyur gönder" (204 = içerik yok ama başarılı)
         */
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
