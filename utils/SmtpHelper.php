<?php
/**
 * Finans Kalesi — SmtpHelper
 *
 * Saf PHP, sıfır harici kütüphane.
 * stream_socket_client() ile STARTTLS (port 587) ve SSL (port 465) destekler.
 *
 * .env gereksinimleri:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   SMTP_FROM_EMAIL, SMTP_FROM_NAME
 */

class SmtpHelper {

    /** SMTP sunucusuyla TCP bağlantısı kur */
    private static function _baglan(string $host, int $port, bool $ssl) {
        $context = stream_context_create([
            'ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true,
            ],
        ]);
        $socket = @stream_socket_client(
            ($ssl ? 'ssl://' : '') . "$host:$port",
            $errno, $errstr, 10,
            STREAM_CLIENT_CONNECT,
            $context
        );
        if (!$socket) {
            error_log("SmtpHelper: bağlantı kurulamadı — $host:$port — $errstr ($errno)");
        }
        return $socket;
    }

    /** Sunucudan tam yanıt satırını oku (4xx / 2xx sonuna kadar) */
    private static function _oku($socket): string {
        $yanit = '';
        while ($satir = fgets($socket, 512)) {
            $yanit .= $satir;
            if (isset($satir[3]) && $satir[3] === ' ') break;
        }
        return $yanit;
    }

    /** Komut gönder ve yanıt döndür */
    private static function _cmd($socket, string $komut): string {
        fwrite($socket, $komut . "\r\n");
        return self::_oku($socket);
    }

    /**
     * HTML mail gönder.
     *
     * @param string $alici   Alıcı e-posta
     * @param string $konu    Mail konusu
     * @param string $html    Tam HTML içerik
     * @return bool           Başarı durumu
     */
    public static function gonder(string $alici, string $konu, string $html): bool {
        $host = env('SMTP_HOST', 'smtp.gmail.com');
        $port = (int) env('SMTP_PORT', 587);
        $user = env('SMTP_USER', '');
        $pass = env('SMTP_PASS', '');
        $from = env('SMTP_FROM_EMAIL', '');
        $name = env('SMTP_FROM_NAME', 'Finans Kalesi');
        $ssl  = ($port === 465);

        if (empty($host) || empty($user) || empty($pass) || empty($from)) {
            error_log('SmtpHelper: SMTP yapılandırması eksik — .env dosyasını kontrol edin');
            return false;
        }

        $socket = self::_baglan($host, $port, $ssl);
        if (!$socket) return false;

        try {
            self::_oku($socket); // Sunucu selamlama mesajı

            $domain = $_SERVER['SERVER_NAME'] ?? 'localhost';
            $ehlo   = self::_cmd($socket, "EHLO $domain");

            // Port 587 → STARTTLS yükseltmesi
            if (!$ssl && stripos($ehlo, 'STARTTLS') !== false) {
                $r = self::_cmd($socket, 'STARTTLS');
                if (substr($r, 0, 3) !== '220') {
                    throw new RuntimeException("STARTTLS başlatılamadı: $r");
                }
                if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new RuntimeException('TLS şifreleme etkinleştirilemedi');
                }
                self::_cmd($socket, "EHLO $domain"); // TLS sonrası tekrar EHLO
            }

            // Kimlik doğrulama (AUTH LOGIN)
            self::_cmd($socket, 'AUTH LOGIN');
            self::_cmd($socket, base64_encode($user));
            $r = self::_cmd($socket, base64_encode($pass));
            if (substr($r, 0, 3) !== '235') {
                throw new RuntimeException("SMTP kimlik doğrulama başarısız: $r");
            }

            // Gönderici ve alıcı
            self::_cmd($socket, "MAIL FROM:<$from>");
            self::_cmd($socket, "RCPT TO:<$alici>");

            // DATA fazı
            $r = self::_cmd($socket, 'DATA');
            if (substr($r, 0, 3) !== '354') {
                throw new RuntimeException("DATA komutu reddedildi: $r");
            }

            // RFC 2047 kodlama ile başlıklar
            $encoded_name = '=?UTF-8?B?' . base64_encode($name) . '?=';
            $encoded_konu = '=?UTF-8?B?' . base64_encode($konu) . '?=';

            $msj  = "From: $encoded_name <$from>\r\n";
            $msj .= "To: $alici\r\n";
            $msj .= "Subject: $encoded_konu\r\n";
            $msj .= "MIME-Version: 1.0\r\n";
            $msj .= "Content-Type: text/html; charset=UTF-8\r\n";
            $msj .= "Content-Transfer-Encoding: base64\r\n";
            $msj .= "\r\n";
            $msj .= chunk_split(base64_encode($html));
            $msj .= "\r\n.\r\n"; // DATA sonu

            fwrite($socket, $msj);
            $r = self::_oku($socket);

            fwrite($socket, "QUIT\r\n");
            self::_oku($socket);
            fclose($socket);

            if (substr($r, 0, 3) === '250') return true;
            throw new RuntimeException("Gönderim kabul edilmedi: $r");

        } catch (Exception $e) {
            error_log('SmtpHelper hata: ' . $e->getMessage());
            if (is_resource($socket)) fclose($socket);
            return false;
        }
    }
}
