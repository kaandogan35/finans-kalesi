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
        // Development ortamında tüm originlere izin ver, production'da sadece canlı domain
        $app_env = env('APP_ENV', 'production');
        if ($app_env === 'development') {
            $izinli_adres = '*';
        } else {
            $izinli_adres = env('CORS_ORIGIN', 'https://app.hirdavatduragi.shop');
        }

        // Tarayıcıya hangi adresten istek gelebileceğini söyle
        header("Access-Control-Allow-Origin: $izinli_adres");
        
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
