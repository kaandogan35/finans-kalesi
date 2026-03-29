<?php
/**
 * Finans Kalesi — Merkezi Bildirim Oluşturucu
 *
 * Bildirim oluşturma, tercih kontrolü ve email gönderme işlemlerini
 * tek noktadan yönetir. Dedup kuralını uygular.
 *
 * Kullanım:
 *   BildirimOlusturucu::gonder([
 *       'sirket_id'    => 1,
 *       'kullanici_id' => 3,
 *       'tip'          => 'odeme_vade',
 *       'baslik'       => 'Ödeme vadesi yaklaşıyor',
 *       'mesaj'        => 'XYZ firmasına 5.000 TL ödeme yarın',
 *       'oncelik'      => 'yuksek',
 *       'kaynak_turu'  => 'odeme_takip',
 *       'kaynak_id'    => 42,
 *       'aksiyon_url'  => '/odemeler',
 *   ]);
 */

class BildirimOlusturucu {

    /**
     * Bildirim tipi etiketleri (email konu satırı için)
     */
    private const TIP_ETIKET = [
        'odeme_vade'     => 'Ödeme Vadesi',
        'cek_vade'       => 'Çek/Senet Vadesi',
        'geciken_odeme'  => 'Geciken Ödeme',
        'guvenlik'       => 'Güvenlik Uyarısı',
        'sistem'         => 'Sistem Bildirimi',
    ];

    /**
     * Merkezi bildirim gönderme metodu
     *
     * 1. Dedup kontrolü (aynı kaynak+tip 24 saat içinde tekrar bildirim engellenir)
     * 2. Bildirim tercihlerini kontrol et
     * 3. Uygulama içi bildirim oluştur (DB'ye yaz)
     * 4. Email aktifse MailHelper ile gönder
     *
     * @return int|false  Oluşturulan bildirim ID veya false (dedup/tercih engeli)
     */
    public static function gonder(array $veri) {
        try {
            $model = new Bildirim();

            $sirket_id    = (int)$veri['sirket_id'];
            $kullanici_id = (int)$veri['kullanici_id'];
            $tip          = $veri['tip'];
            $kaynak_turu  = $veri['kaynak_turu'] ?? null;
            $kaynak_id    = $veri['kaynak_id'] ?? null;

            // 1. Dedup kontrolü
            if ($model->dedup_kontrol($sirket_id, $kullanici_id, $tip, $kaynak_turu, $kaynak_id)) {
                return false; // 24 saat içinde aynı bildirim zaten gönderilmiş
            }

            // 2. Tercihleri kontrol et
            $tercihler = $model->tercihleri_getir($sirket_id, $kullanici_id);
            $tercih = $tercihler[$tip] ?? ['uygulama_ici' => 1, 'email' => 1, 'sms' => 0, 'telefon' => 0];

            // 3. Uygulama içi bildirim (tercih açıksa)
            $bildirim_id = false;
            if ($tercih['uygulama_ici']) {
                $bildirim_id = $model->olustur($veri);
            }

            // 4. Email bildirimi (tercih açıksa)
            if ($tercih['email']) {
                self::email_gonder($sirket_id, $kullanici_id, $veri);
            }

            // 5. WhatsApp bildirimi (tercih açıksa ve entegrasyon aktifse)
            if (!empty($tercih['whatsapp']) && class_exists('WhatsappHelper') && WhatsappHelper::aktif_mi()) {
                self::whatsapp_gonder($sirket_id, $kullanici_id, $veri);
            }

            return $bildirim_id;

        } catch (\Exception $e) {
            error_log("BildirimOlusturucu hata: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Birden fazla kullanıcıya aynı bildirimi gönder
     * (örn: şirketteki tüm kullanıcılara)
     */
    public static function toplu_gonder(array $kullanici_idler, array $veri): int {
        $basarili = 0;
        foreach ($kullanici_idler as $kid) {
            $veri['kullanici_id'] = $kid;
            $sonuc = self::gonder($veri);
            if ($sonuc !== false) $basarili++;
        }
        return $basarili;
    }

    /**
     * Şirketin sahiplerine bildirim gönder
     */
    public static function sahiplere_gonder(int $sirket_id, array $veri): int {
        $model = new Bildirim();
        $sahipler = $model->sirket_sahipleri($sirket_id);

        $basarili = 0;
        foreach ($sahipler as $sahip) {
            $veri['sirket_id']    = $sirket_id;
            $veri['kullanici_id'] = $sahip['id'];
            $sonuc = self::gonder($veri);
            if ($sonuc !== false) $basarili++;
        }
        return $basarili;
    }

    /**
     * WhatsApp mesajı gönder
     */
    private static function whatsapp_gonder(int $sirket_id, int $kullanici_id, array $veri): void {
        try {
            $db = Database::baglan();
            $stmt = $db->prepare("SELECT telefon FROM kullanicilar WHERE id = :id AND sirket_id = :sid");
            $stmt->execute([':id' => $kullanici_id, ':sid' => $sirket_id]);
            $kullanici = $stmt->fetch();

            if (!$kullanici || empty($kullanici['telefon'])) return;

            $mesaj = "[{$veri['baslik']}]\n{$veri['mesaj']}\n— ParamGo";

            WhatsappHelper::gonder($kullanici['telefon'], $mesaj);

        } catch (\Exception $e) {
            error_log("Bildirim WhatsApp hatası: " . $e->getMessage());
        }
    }

    /**
     * Email gönder (bildirim içeriğiyle)
     */
    private static function email_gonder(int $sirket_id, int $kullanici_id, array $veri): void {
        try {
            // Kullanıcı email adresini al
            $db = Database::baglan();
            $stmt = $db->prepare("SELECT email, ad_soyad FROM kullanicilar WHERE id = :id AND sirket_id = :sid");
            $stmt->execute([':id' => $kullanici_id, ':sid' => $sirket_id]);
            $kullanici = $stmt->fetch();

            if (!$kullanici || empty($kullanici['email'])) return;

            $tip_etiket = self::TIP_ETIKET[$veri['tip']] ?? 'Bildirim';
            $konu = "ParamGo — {$tip_etiket}: {$veri['baslik']}";

            $html = self::email_sablonu($kullanici['ad_soyad'], $veri);

            MailHelper::gonder(
                $kullanici['email'],
                $konu,
                $html,
                $sirket_id,
                $kullanici_id,
                'bildirim'
            );

        } catch (\Exception $e) {
            error_log("Bildirim email hatası: " . $e->getMessage());
        }
    }

    /**
     * Email HTML şablonu
     */
    private static function email_sablonu(string $ad_soyad, array $veri): string {
        $baslik  = htmlspecialchars($veri['baslik']);
        $mesaj   = nl2br(htmlspecialchars($veri['mesaj']));
        $oncelik = $veri['oncelik'] ?? 'normal';

        $oncelik_renk = match ($oncelik) {
            'kritik' => '#DC2626',
            'yuksek' => '#F59E0B',
            'dusuk'  => '#6B7280',
            default  => '#10B981',
        };

        $oncelik_etiket = match ($oncelik) {
            'kritik' => 'KRİTİK',
            'yuksek' => 'YÜKSEK',
            'dusuk'  => 'DÜŞÜK',
            default  => 'NORMAL',
        };

        return <<<HTML
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:32px auto;">
    <tr>
      <td style="background:#10B981;padding:20px 28px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600;">ParamGo</h1>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:28px;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 8px;color:#374151;font-size:14px;">Merhaba <strong>{$ad_soyad}</strong>,</p>

        <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px;border-left:4px solid {$oncelik_renk};">
          <span style="display:inline-block;padding:2px 8px;background:{$oncelik_renk};color:#fff;font-size:11px;font-weight:600;border-radius:4px;margin-bottom:8px;">{$oncelik_etiket}</span>
          <h2 style="margin:4px 0 8px;color:#111827;font-size:16px;font-weight:600;">{$baslik}</h2>
          <p style="margin:0;color:#4B5563;font-size:14px;line-height:1.5;">{$mesaj}</p>
        </div>

        <p style="margin:16px 0 0;color:#9CA3AF;font-size:12px;">
          Bu bildirim ParamGo tarafından otomatik olarak gönderilmiştir.
          Bildirim tercihlerinizi uygulama içinden değiştirebilirsiniz.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }
}
