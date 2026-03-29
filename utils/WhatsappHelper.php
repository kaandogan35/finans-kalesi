<?php
/**
 * ParamGo — WhatsApp Mesaj Gönderici
 *
 * Meta Cloud API (WhatsApp Business) entegrasyonu.
 * Şimdilik WHATSAPP_ENABLED=false — gerçek gönderim için true yapılır.
 *
 * .env'e eklenecek değişkenler:
 *   WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxx
 *   WHATSAPP_PHONE_ID=1234567890
 *   WHATSAPP_ENABLED=false
 *
 * Kullanım:
 *   WhatsappHelper::gonder('905321234567', 'Yarın çekin doluyor — 5.000 ₺');
 */

class WhatsappHelper {

    private const API_URL = 'https://graph.facebook.com/v18.0/%s/messages';

    /**
     * WhatsApp mesajı gönder
     *
     * @param string $telefon  Uluslararası format, + olmadan (örn: 905321234567)
     * @param string $mesaj    Gönderilecek metin
     * @return bool            true = gönderildi, false = kapalı/hata
     */
    public static function gonder(string $telefon, string $mesaj): bool {
        // Entegrasyon kapalıysa sessizce çık (test ortamını bozmaz)
        if (!self::aktif_mi()) {
            return false;
        }

        $token    = self::env_oku('WHATSAPP_TOKEN');
        $phone_id = self::env_oku('WHATSAPP_PHONE_ID');

        if (empty($token) || empty($phone_id)) {
            error_log("WhatsappHelper: WHATSAPP_TOKEN veya WHATSAPP_PHONE_ID tanımlı değil");
            return false;
        }

        // Telefon numarasını temizle (boşluk, tire, + işareti)
        $telefon = preg_replace('/[^0-9]/', '', $telefon);
        if (strlen($telefon) < 10) {
            error_log("WhatsappHelper: Geçersiz telefon formatı: {$telefon}");
            return false;
        }

        $url = sprintf(self::API_URL, $phone_id);

        $govde = json_encode([
            'messaging_product' => 'whatsapp',
            'to'                => $telefon,
            'type'              => 'text',
            'text'              => ['body' => $mesaj],
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $govde,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                "Authorization: Bearer {$token}",
            ],
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $yanit      = curl_exec($ch);
        $http_kodu  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_hata  = curl_error($ch);
        curl_close($ch);

        if ($curl_hata) {
            error_log("WhatsappHelper cURL hatası: {$curl_hata}");
            return false;
        }

        if ($http_kodu !== 200) {
            error_log("WhatsappHelper API hatası ({$http_kodu}): {$yanit}");
            return false;
        }

        return true;
    }

    /**
     * WhatsApp entegrasyonu aktif mi?
     * .env'de WHATSAPP_ENABLED=true olmalı
     */
    public static function aktif_mi(): bool {
        $deger = self::env_oku('WHATSAPP_ENABLED', 'false');
        return strtolower(trim($deger)) === 'true';
    }

    /**
     * .env değişkenini oku (env() fonksiyonu tanımlıysa kullan, yoksa getenv)
     */
    private static function env_oku(string $anahtar, string $varsayilan = ''): string {
        if (function_exists('env')) {
            return (string)(env($anahtar, $varsayilan) ?? $varsayilan);
        }
        return (string)(getenv($anahtar) ?: $varsayilan);
    }
}
