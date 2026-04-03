<?php
/**
 * ParamGo — MailHelper
 *
 * SmtpHelper üzerinden mail gönderir ve mail_log tablosuna kayıt düşer.
 * Başarısız gönderimlerde error_log() ile hata kaydeder.
 */

class MailHelper {

    /**
     * Mail gönder + logla.
     *
     * @param string   $alici        Alıcı e-posta adresi
     * @param string   $konu         Mail konusu
     * @param string   $html         Tam HTML şablon
     * @param int|null $sirket_id    Şirket ID (log için)
     * @param int|null $kullanici_id Kullanıcı ID (log için)
     * @param string   $mail_turu    Log etiketi (hosgeldin, guvenlik, cron_gunluk vb.)
     * @return bool
     */
    public static function gonder(
        string $alici,
        string $konu,
        string $html,
        ?int $sirket_id    = null,
        ?int $kullanici_id = null,
        string $mail_turu  = 'genel'
    ): bool {
        $basarili = SmtpHelper::gonder($alici, $konu, $html);

        // Her durumda mail_log'a kayıt düş
        try {
            $db   = Database::baglan();
            $stmt = $db->prepare(
                "INSERT INTO mail_log
                    (sirket_id, kullanici_id, mail_turu, alici_email, konu, durum, hata_mesaji)
                 VALUES
                    (:sid, :kid, :tur, :email, :konu, :durum, :hata)"
            );
            $stmt->execute([
                ':sid'   => $sirket_id,
                ':kid'   => $kullanici_id,
                ':tur'   => $mail_turu,
                ':email' => $alici,
                ':konu'  => $konu,
                ':durum' => $basarili ? 'gonderildi' : 'basarisiz',
                ':hata'  => $basarili ? null : 'SMTP gönderimi başarısız — SmtpHelper detay için PHP error log bakın',
            ]);
        } catch (Exception $e) {
            error_log('MailHelper log hatası: ' . $e->getMessage());
        }

        if (!$basarili) {
            error_log("MailHelper: Mail gönderilemedi — Alıcı: $alici | Konu: $konu | Tür: $mail_turu");
        }

        return $basarili;
    }
}
