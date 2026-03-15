<?php
/**
 * Finans Kalesi — Sistem Loglama
 *
 * Önemli işlemleri sistem_loglari tablosuna yazar.
 * Kim, ne zaman, nereden hangi işlemi yaptı — hepsini kaydeder.
 *
 * Kullanım:
 *   SistemLog::kaydet(SistemLog::GIRIS_BASARILI, 'kullanici_id: 5', 3, 5);
 */

class SistemLog {

    // ─── İşlem Tipi Sabitleri ───────────────────────────────────────────
    const GIRIS_BASARILI  = 'giris_basarili';
    const GIRIS_BASARISIZ = 'giris_basarisiz';
    const KAYIT           = 'kayit';
    const CIKIS           = 'cikis';
    const TOKEN_YENILE    = 'token_yenile';
    const KASA_ERISIM     = 'kasa_erisim';
    const YETKISIZ_ERISIM = 'yetkisiz_erisim';

    /**
     * Log kaydı oluştur
     *
     * @param string   $islem_tipi  SistemLog sabiti (örn: SistemLog::GIRIS_BASARILI)
     * @param string   $detay       İlave bilgi (boş bırakılabilir)
     * @param int|null $sirket_id   Şirket ID (bilinmiyorsa null)
     * @param int|null $kullanici_id Kullanıcı ID (bilinmiyorsa null)
     */
    public static function kaydet(
        string $islem_tipi,
        string $detay = '',
        $sirket_id = null,
        $kullanici_id = null
    ): void {
        try {
            $db = Database::baglan();
            $stmt = $db->prepare(
                "INSERT INTO sistem_loglari
                    (sirket_id, kullanici_id, islem_tipi, islem_detayi, ip_adresi, tarih)
                 VALUES (?, ?, ?, ?, ?, NOW())"
            );
            $stmt->execute([
                $sirket_id,
                $kullanici_id,
                $islem_tipi,
                $detay,
                self::ip_al(),
            ]);
        } catch (Exception $e) {
            // Log yazma hatası uygulamayı durdurmamalı — sadece PHP loguna yaz
            error_log('SistemLog yazma hatasi: ' . $e->getMessage());
        }
    }

    /**
     * İstek yapan kişinin IP adresini al
     *
     * Güvenlik notu: HTTP_X_FORWARDED_FOR ve HTTP_CLIENT_IP başlıkları
     * istemci tarafından sahte olarak gönderilebilir (IP spoofing).
     * cPanel shared hosting'de güvenilir bir ters proxy yoktur,
     * bu nedenle yalnızca sunucunun belirlediği REMOTE_ADDR kullanılır.
     */
    public static function ip_al(): string {
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
