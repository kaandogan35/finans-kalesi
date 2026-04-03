<?php
/**
 * ParamGo — Auth Middleware (Kimlik Dogrulama Katmani)
 * 
 * Eski sistemde: Her sayfanin basinda session kontrolu vardi
 *   if (!isset($_SESSION['kullanici_id'])) { header('Location: login.php'); }
 * 
 * Yeni sistemde: Her API isteginde JWT token kontrolu yapiliyor.
 * Token yoksa veya gecersizse → 401 Yetkisiz yaniti doner.
 * 
 * Benzetme: Binanin guvenlik gorevlisi. Kimlik kartini goster,
 * gecerliyse iceri al, degilse geri cevir.
 */

class AuthMiddleware {
    
    /**
     * Token dogrulama calistir
     * Korunmasi gereken her endpoint'in basinda cagirilir
     * 
     * @return array Dogrulanmis kullanici bilgileri (payload)
     */
    public static function dogrula() {
        // 1. Token'i istekten al
        $token = JWTHelper::istekten_token_al();
        
        if (!$token) {
            Response::yetkisiz('Token bulunamadi. Lutfen giris yapin.');
            exit;
        }
        
        // 2. Token'i dogrula
        $payload = JWTHelper::token_dogrula($token);
        
        if (!$payload) {
            Response::yetkisiz('Token gecersiz veya suresi dolmus.');
            exit;
        }
        
        // 3. Access token mi kontrol et (refresh token ile API cagrilamaz)
        if (!isset($payload['tip']) || $payload['tip'] !== 'access') {
            Response::yetkisiz('Gecersiz token tipi.');
            exit;
        }
        
        // 4. IP beyaz/kara liste kontrolu
        try {
            $guvenlik = new Guvenlik();
            $ayarlar = $guvenlik->ayarlar_getir((int)$payload['sirket_id']);
            $ip = SistemLog::ip_al();

            // Kara listede mi?
            if (!empty($ayarlar['ip_kara_liste']) && in_array($ip, $ayarlar['ip_kara_liste'])) {
                Response::yasak('Bu IP adresinden erişim engellendi.');
                exit;
            }

            // Beyaz liste varsa, sadece izin verilenler geçebilir
            if (!empty($ayarlar['ip_beyaz_liste']) && !in_array($ip, $ayarlar['ip_beyaz_liste'])) {
                Response::yasak('Bu IP adresinden erişim izni yok.');
                exit;
            }
        } catch (Exception $e) {
            // IP kontrolü hatası uygulamayı durdurmamalı
            error_log('IP kontrol hatasi: ' . $e->getMessage());
        }

        // 5. Kullanici bilgilerini dondur
        // Bu bilgiler controller'larda kullanilacak:
        //   $kullanici['sub']       → Kullanici ID
        //   $kullanici['sirket_id'] → Sirket ID (multi-tenant filtre icin)
        //   $kullanici['rol']       → Yetki rolu
        return $payload;
    }
    
    /**
     * Rol kontrolu yap
     * Belirli rollere ozel endpoint'ler icin kullanilir
     * 
     * @param array  $payload     Auth dogrulama sonucu
     * @param array  $izinli_roller Izin verilen roller ['admin', 'patron']
     * @return bool
     */
    public static function rol_kontrol($payload, $izinli_roller) {
        if (!in_array($payload['rol'], $izinli_roller)) {
            Response::yasak('Bu islem icin yetkiniz yok. Gerekli rol: ' . implode(', ', $izinli_roller));
            exit;
        }
        return true;
    }
}
