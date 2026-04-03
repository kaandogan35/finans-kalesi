<?php
/**
 * ParamGo — MailSablonlar
 *
 * 7 kurumsal HTML mail şablonu.
 * Tasarım: Demo 1 (Modern Minimal) — DM Serif Display + DM Sans
 * Tüm stiller inline CSS (Gmail, Outlook, Apple Mail uyumlu).
 *
 * Renk sistemi:
 *   Yeşil      #10B981  |  Koyu yeşil #059669  |  En koyu #064e3b
 *   Zemin      #fafaf7  |  Kart #ffffff          |  Border  #eeede8
 *   Metin K    #0d1a10  |  Metin G #52574f       |  Silik   #c8c8c0
 *
 * Logo URL: https://paramgo.com/assets/paramgo-logo.png
 *           (400x80 px, light variant — koyu metin + yeşil)
 */

class MailSablonlar {

    // ── Sabitler ────────────────────────────────────────────────
    private const LOGO_URL  = 'https://paramgo.com/assets/paramgo-logo.png';
    private const APP_URL   = 'https://app.paramgo.com';
    private const SITE_URL  = 'https://paramgo.com';
    private const FONT_URL  = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap';

    // ── Yardımcı: Türkçe tarih ─────────────────────────────────
    private static function tarih(string $tarih): string {
        $aylar = [
            1=>'Ocak',2=>'Şubat',3=>'Mart',4=>'Nisan',5=>'Mayıs',6=>'Haziran',
            7=>'Temmuz',8=>'Ağustos',9=>'Eylül',10=>'Ekim',11=>'Kasım',12=>'Aralık'
        ];
        $t = strtotime($tarih);
        return date('d', $t) . ' ' . $aylar[(int)date('n', $t)] . ' ' . date('Y', $t);
    }

    // ── Yardımcı: TRY formatı ───────────────────────────────────
    private static function tl(float $tutar): string {
        return '₺' . number_format($tutar, 2, ',', '.');
    }

    // ── Temel şablon ────────────────────────────────────────────
    // $badge   : sağ üstteki küçük etiket (ör: "Hoş geldiniz")
    // $eyebrow : başlık üstü küçük yeşil yazı
    // $baslik  : serif büyük başlık (HTML destekli, <br> kullanılabilir)
    // $giris   : başlık altı paragraf metni
    // $cta_url : CTA buton URL'i (boş bırakılırsa buton çıkmaz)
    // $cta_txt : CTA buton metni
    // $icerik  : features / tablo / ek bilgi HTML bloğu
    // $not     : yeşil kenarlıklı bilgi/uyarı kutusu (boş bırakılabilir)
    private static function _sablonOlustur(
        string $badge,
        string $eyebrow,
        string $baslik,
        string $giris,
        string $cta_url,
        string $cta_txt,
        string $icerik,
        string $not = ''
    ): string {
        $logo    = self::LOGO_URL;
        $appUrl  = self::APP_URL;
        $siteUrl = self::SITE_URL;
        $font    = self::FONT_URL;
        $yil     = date('Y');

        // CTA butonu
        $ctaHtml = '';
        if ($cta_url && $cta_txt) {
            $ctaHtml = <<<HTML
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
              <tr>
                <td style="border-radius:9px;background:#0d1a10;">
                  <a href="{$cta_url}" style="display:inline-block;padding:15px 32px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;letter-spacing:0.2px;white-space:nowrap;">
                    {$cta_txt}&nbsp; →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#c8c8c0;">
              veya &nbsp;<a href="{$cta_url}" style="color:#10B981;font-weight:500;text-decoration:none;">{$cta_url}</a>&nbsp; adresini ziyaret edin
            </p>
HTML;
        }

        // Bilgi kutusu
        $notHtml = '';
        if ($not) {
            $notHtml = <<<HTML
            <tr>
              <td style="background:#fafaf7;padding:0 52px 36px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background:#fff;border:1px solid #e8e8e2;border-left:3px solid #10B981;border-radius:6px;padding:14px 18px;">
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:400;color:#4a4a42;line-height:1.65;">{$not}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
HTML;
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="{$font}" rel="stylesheet">
  <style>
    body{margin:0;padding:0;background:#f0f1ed;font-family:'DM Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;}
    .email-wrap{max-width:600px;margin:0 auto;}
    a{color:inherit;text-decoration:none;}
    @media(max-width:600px){
      .p-main{padding:32px 24px !important;}
      .p-feat{padding:28px 24px !important;}
      .p-foot{padding:24px 24px !important;}
      .p-note{padding:0 24px 28px !important;}
      h1{font-size:34px !important;}
      .feat-td{display:block !important;width:100% !important;padding:0 0 20px 0 !important;border:none !important;}
    }
  </style>
</head>
<body style="margin:0;padding:40px 16px 60px;background:#f0f1ed;">

<table class="email-wrap" width="600" cellpadding="0" cellspacing="0" border="0"
       style="max-width:600px;width:100%;margin:0 auto;border-radius:8px;overflow:hidden;
              box-shadow:0 20px 60px rgba(0,0,0,0.08),0 4px 16px rgba(0,0,0,0.04);">

  <!-- TOP BAR -->
  <tr>
    <td style="height:4px;background:linear-gradient(90deg,#10B981 0%,#34d399 55%,#a7f3d0 100%);font-size:0;line-height:0;">&nbsp;</td>
  </tr>

  <!-- HEADER: Logo + Badge -->
  <tr>
    <td class="p-main" style="background:#ffffff;padding:36px 52px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:middle;">
            <img src="{$logo}" alt="ParamGo" width="148" height="30"
                 style="display:block;height:30px;width:auto;border:0;outline:0;" />
          </td>
          <td align="right" style="vertical-align:middle;">
            <span style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;
                         border-radius:20px;padding:5px 14px;font-family:'DM Sans',Arial,sans-serif;
                         font-size:11px;font-weight:500;color:#059669;letter-spacing:0.3px;">
              {$badge}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HERO -->
  <tr>
    <td class="p-main" style="background:#ffffff;padding:0 52px 44px;">
      <div style="height:1px;background:#f0f0ea;margin-bottom:36px;"></div>
      <p style="margin:0 0 10px;font-family:'DM Sans',Arial,sans-serif;font-size:10px;font-weight:600;
                color:#10B981;letter-spacing:3px;text-transform:uppercase;">
        {$eyebrow}
      </p>
      <h1 style="margin:0 0 20px;font-family:'DM Serif Display',Georgia,serif;font-size:40px;
                 font-weight:400;color:#0d1a10;line-height:1.1;letter-spacing:-0.8px;">
        {$baslik}
      </h1>
      <p style="margin:0 0 32px;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:300;
                color:#52574f;line-height:1.8;">
        {$giris}
      </p>
      {$ctaHtml}
    </td>
  </tr>

  <!-- CONTENT (features / table / extra) -->
  <tr>
    <td class="p-feat" style="background:#fafaf7;padding:36px 52px;border-top:1px solid #eeede8;">
      {$icerik}
    </td>
  </tr>

  <!-- INFO / WARNING BOX -->
  {$notHtml}

  <!-- FOOTER -->
  <tr>
    <td class="p-foot" style="background:#ffffff;padding:24px 52px;border-top:1px solid #eeede8;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin:0 0 3px;font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#c8c8c0;line-height:1.7;">
              © {$yil} ParamGo &nbsp;·&nbsp;
              <a href="{$siteUrl}" style="color:#c8c8c0;">paramgo.com</a>
            </p>
            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;line-height:1.7;">
              <a href="{$siteUrl}/gizlilik" style="color:#c8c8c0;text-decoration:none;">Gizlilik</a>
              <span style="color:#e0e0d8;">&nbsp;·&nbsp;</span>
              <a href="{$siteUrl}/destek" style="color:#c8c8c0;text-decoration:none;">Destek</a>
              <span style="color:#e0e0d8;">&nbsp;·&nbsp;</span>
              <a href="mailto:info@paramgo.com" style="color:#c8c8c0;text-decoration:none;">info@paramgo.com</a>
            </p>
          </td>
          <td align="right" style="vertical-align:middle;">
            <img src="{$logo}" alt="ParamGo" width="88" height="18"
                 style="height:18px;width:auto;opacity:0.3;border:0;outline:0;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BOTTOM BAR -->
  <tr>
    <td style="height:4px;background:linear-gradient(90deg,#10B981 0%,#34d399 55%,#a7f3d0 100%);font-size:0;line-height:0;">&nbsp;</td>
  </tr>

</table>
</body>
</html>
HTML;
    }

    // ════════════════════════════════════════════════════════════
    // 1. HOŞ GELDİN — Kayıt sonrası
    // ════════════════════════════════════════════════════════════
    public static function hosgeldin(string $adSoyad, string $firmaAdi): string {
        $ad = htmlspecialchars($adSoyad);
        $firma = htmlspecialchars($firmaAdi);
        $isim = explode(' ', trim($ad))[0]; // sadece ad

        $icerik = <<<HTML
        <p style="margin:0 0 26px;font-family:'DM Sans',Arial,sans-serif;font-size:10px;font-weight:600;
                  color:#b8b8b0;letter-spacing:2.5px;text-transform:uppercase;">
          ile başlayabilirsiniz
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="33%" style="vertical-align:top;padding-right:24px;border-right:1px solid #eae9e4;">
              <div style="width:40px;height:40px;background:#f0fdf4;border:1px solid #d1fae5;
                          border-radius:10px;text-align:center;line-height:40px;font-size:18px;margin-bottom:14px;">📋</div>
              <p style="margin:0 0 5px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#1a2018;">Çek &amp; Senet</p>
              <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:300;color:#8c8c84;line-height:1.65;">
                Portföy takibi, vade uyarıları ve tahsilat durumu
              </p>
            </td>
            <td width="33%" style="vertical-align:top;padding-left:24px;padding-right:24px;border-right:1px solid #eae9e4;">
              <div style="width:40px;height:40px;background:#f0fdf4;border:1px solid #d1fae5;
                          border-radius:10px;text-align:center;line-height:40px;font-size:18px;margin-bottom:14px;">👥</div>
              <p style="margin:0 0 5px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#1a2018;">Cari Hesaplar</p>
              <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:300;color:#8c8c84;line-height:1.65;">
                Müşteri bakiyeleri, veresiye ve ödeme takibi
              </p>
            </td>
            <td width="34%" style="vertical-align:top;padding-left:24px;">
              <div style="width:40px;height:40px;background:#f0fdf4;border:1px solid #d1fae5;
                          border-radius:10px;text-align:center;line-height:40px;font-size:18px;margin-bottom:14px;">💰</div>
              <p style="margin:0 0 5px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#1a2018;">Nakit Akışı</p>
              <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:300;color:#8c8c84;line-height:1.65;">
                Günlük kasa, gelir-gider dengesi ve raporlar
              </p>
            </td>
          </tr>
        </table>
HTML;

        $not = '<strong style="font-weight:600;color:#064e3b;">Güvenlik hatırlatması:</strong> Şifrenizi kimseyle paylaşmayın. ParamGo ekibi hiçbir zaman şifrenizi istemez.';

        return self::_sablonOlustur(
            '✓ Hesap aktif',
            'Hoş geldiniz',
            "Merhaba,<br>{$isim} Bey.",
            "<strong style=\"font-weight:500;color:#1a2018;\">{$firma}</strong> adına oluşturduğunuz ParamGo hesabı başarıyla aktifleştirildi. Çekler, cariler ve nakit akışı — artık hepsi tek ekranda.",
            self::APP_URL,
            'Hesabıma Gir',
            $icerik,
            $not
        );
    }

    // ════════════════════════════════════════════════════════════
    // 2. ŞİFRE SIFIRLA
    // ════════════════════════════════════════════════════════════
    public static function sifreSifirla(string $adSoyad, string $resetUrl): string {
        $ad = htmlspecialchars($adSoyad);
        $isim = explode(' ', trim($ad))[0];
        $url  = htmlspecialchars($resetUrl);

        $icerik = <<<HTML
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#fff;border:1px solid #eae9e4;border-radius:10px;padding:24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="48" style="vertical-align:top;">
                    <div style="width:40px;height:40px;background:#f0fdf4;border:1px solid #d1fae5;
                                border-radius:10px;text-align:center;line-height:40px;font-size:18px;">🔑</div>
                  </td>
                  <td style="vertical-align:top;padding-left:16px;">
                    <p style="margin:0 0 4px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#1a2018;">
                      Bağlantı bilgileri
                    </p>
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:300;color:#8c8c84;line-height:1.65;">
                      Bu bağlantı <strong style="font-weight:500;color:#52574f;">30 dakika</strong> geçerlidir.
                      Süre dolmadan şifrenizi sıfırlayın.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:16px;"></td></tr>
          <tr>
            <td style="background:#fff;border:1px solid #eae9e4;border-radius:10px;padding:24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="48" style="vertical-align:top;">
                    <div style="width:40px;height:40px;background:#f0fdf4;border:1px solid #d1fae5;
                                border-radius:10px;text-align:center;line-height:40px;font-size:18px;">🛡️</div>
                  </td>
                  <td style="vertical-align:top;padding-left:16px;">
                    <p style="margin:0 0 4px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#1a2018;">
                      Siz istemediyseniz
                    </p>
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:300;color:#8c8c84;line-height:1.65;">
                      Bu isteği siz yapmadıysanız bu maili görmezden gelebilirsiniz.
                      Hesabınız güvende.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
HTML;

        $not = '<strong style="font-weight:600;color:#064e3b;">Dikkat:</strong> Şifre sıfırlama bağlantısını başkasıyla paylaşmayın. Bu bağlantı yalnızca size özeldir.';

        return self::_sablonOlustur(
            '🔒 Güvenlik',
            'Şifre sıfırlama',
            "Şifrenizi<br>sıfırlayın.",
            "Hesabınız için bir şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.",
            $url,
            'Yeni Şifre Belirle',
            $icerik,
            $not
        );
    }

    // ════════════════════════════════════════════════════════════
    // 3. GÜVENLİK UYARISI — Yeni cihazdan giriş
    // ════════════════════════════════════════════════════════════
    public static function guvenlikUyarisi(
        string $adSoyad,
        string $cihaz,
        string $ip,
        string $tarih
    ): string {
        $ad    = htmlspecialchars($adSoyad);
        $isim  = explode(' ', trim($ad))[0];
        $cihaz = htmlspecialchars($cihaz);
        $ip    = htmlspecialchars($ip);

        $icerik = <<<HTML
        <p style="margin:0 0 18px;font-family:'DM Sans',Arial,sans-serif;font-size:10px;font-weight:600;
                  color:#b8b8b0;letter-spacing:2.5px;text-transform:uppercase;">giriş detayları</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fff;border:1px solid #eae9e4;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #f0f0ea;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:400;color:#8c8c84;">Tarih &amp; Saat</td>
                  <td align="right" style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:500;color:#1a2018;">{$tarih}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #f0f0ea;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:400;color:#8c8c84;">Cihaz / Tarayıcı</td>
                  <td align="right" style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:500;color:#1a2018;">{$cihaz}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:400;color:#8c8c84;">IP Adresi</td>
                  <td align="right" style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:500;color:#1a2018;">{$ip}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
HTML;

        $not = '<strong style="font-weight:600;color:#7c2d12;">Bu giriş siz değilseniz:</strong> Lütfen hemen şifrenizi değiştirin ve <a href="' . self::SITE_URL . '/destek" style="color:#10B981;font-weight:500;">destek ekibimizle</a> iletişime geçin.';

        return self::_sablonOlustur(
            '⚠️ Güvenlik uyarısı',
            'Hesap aktivitesi',
            "Yeni bir giriş<br>tespit edildi.",
            "Merhaba <strong style=\"font-weight:500;color:#1a2018;\">{$isim} Bey</strong>, ParamGo hesabınıza yeni bir cihazdan giriş yapıldı. Bu giriş sizin tarafınızdan yapıldıysa herhangi bir işlem yapmanıza gerek yok.",
            self::APP_URL . '/guvenlik',
            'Güvenlik Ayarlarını Gör',
            $icerik,
            $not
        );
    }

    // ════════════════════════════════════════════════════════════
    // 4. VADE BİLDİRİMİ — Vadesi yaklaşan çekler
    // ════════════════════════════════════════════════════════════
    public static function vadeBildirim(
        string $adSoyad,
        string $firmaAdi,
        array  $cekler  // [['cari'=>'...','tutar'=>123.45,'vade'=>'2026-04-10','gun'=>3], ...]
    ): string {
        $isim = htmlspecialchars(explode(' ', trim($adSoyad))[0]);

        $satirlar = '';
        foreach ($cekler as $c) {
            $cari  = htmlspecialchars($c['cari'] ?? '');
            $tutar = self::tl((float)($c['tutar'] ?? 0));
            $vade  = self::tarih($c['vade'] ?? date('Y-m-d'));
            $gun   = (int)($c['gun'] ?? 0);
            $renk  = $gun <= 1 ? '#dc2626' : ($gun <= 3 ? '#d97706' : '#059669');
            $etiket = $gun === 0 ? 'Bugün' : ($gun === 1 ? 'Yarın' : "{$gun} gün");

            $satirlar .= <<<HTML
            <tr>
              <td style="padding:14px 20px;border-bottom:1px solid #f0f0ea;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <p style="margin:0 0 2px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#1a2018;">{$cari}</p>
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:400;color:#8c8c84;">Vade: {$vade}</p>
                    </td>
                    <td align="right" style="vertical-align:middle;white-space:nowrap;">
                      <span style="display:inline-block;background:rgba(0,0,0,0.04);border-radius:4px;padding:2px 8px;
                                   font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:500;color:{$renk};margin-right:8px;">
                        {$etiket}
                      </span>
                      <span style="font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#1a2018;">{$tutar}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
HTML;
        }

        $toplamTutar = self::tl(array_sum(array_column($cekler, 'tutar')));
        $adet = count($cekler);

        $icerik = <<<HTML
        <p style="margin:0 0 18px;font-family:'DM Sans',Arial,sans-serif;font-size:10px;font-weight:600;
                  color:#b8b8b0;letter-spacing:2.5px;text-transform:uppercase;">vadesi yaklaşan çekler</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fff;border:1px solid #eae9e4;border-radius:10px;overflow:hidden;">
          {$satirlar}
          <tr>
            <td style="padding:14px 20px;background:#fafaf7;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:500;color:#52574f;">
                    Toplam ({$adet} çek)
                  </td>
                  <td align="right" style="font-family:'DM Sans',Arial,sans-serif;font-size:14px;font-weight:600;color:#10B981;">
                    {$toplamTutar}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
HTML;

        return self::_sablonOlustur(
            '🔔 Vade uyarısı',
            'Hatırlatma',
            "Vadesi yaklaşan<br>çekleriniz var.",
            "Merhaba <strong style=\"font-weight:500;color:#1a2018;\">{$isim} Bey</strong>, aşağıdaki çeklerinizin vadesi yaklaşıyor. Zamanında işlem yapmak için lütfen kontrol edin.",
            self::APP_URL . '/cek-senet',
            'Çekleri Görüntüle',
            $icerik
        );
    }

    // ════════════════════════════════════════════════════════════
    // 5. ÖDEME BİLDİRİMİ — Ödeme alındı
    // ════════════════════════════════════════════════════════════
    public static function odemeBildirim(
        string $adSoyad,
        string $cariAdi,
        float  $tutar,
        string $tarih,
        string $aciklama = ''
    ): string {
        $isim    = htmlspecialchars(explode(' ', trim($adSoyad))[0]);
        $cari    = htmlspecialchars($cariAdi);
        $tutarFt = self::tl($tutar);
        $tarihFt = self::tarih($tarih);
        $aciklama = $aciklama ? htmlspecialchars($aciklama) : 'Ödeme alındı';

        $icerik = <<<HTML
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fff;border:1px solid #eae9e4;border-radius:10px;overflow:hidden;margin-bottom:20px;">
          <tr>
            <td style="padding:20px 24px;text-align:center;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-bottom:1px solid #d1fae5;">
              <p style="margin:0 0 4px;font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:500;color:#059669;letter-spacing:1px;text-transform:uppercase;">Alınan Tutar</p>
              <p style="margin:0;font-family:'DM Serif Display',Georgia,serif;font-size:36px;font-weight:400;color:#064e3b;letter-spacing:-0.5px;">{$tutarFt}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0f0ea;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#8c8c84;">Cari</td>
                        <td align="right" style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:500;color:#1a2018;">{$cari}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0f0ea;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#8c8c84;">Tarih</td>
                        <td align="right" style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:500;color:#1a2018;">{$tarihFt}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#8c8c84;">Açıklama</td>
                        <td align="right" style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:500;color:#1a2018;">{$aciklama}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
HTML;

        return self::_sablonOlustur(
            '✓ Ödeme alındı',
            'Ödeme bildirimi',
            "Ödeme kaydı<br>oluşturuldu.",
            "Merhaba <strong style=\"font-weight:500;color:#1a2018;\">{$isim} Bey</strong>, <strong style=\"font-weight:500;color:#1a2018;\">{$cari}</strong> firmasından gelen ödeme başarıyla kaydedildi.",
            self::APP_URL . '/cari',
            'Cari Hesabı Görüntüle',
            $icerik
        );
    }

    // ════════════════════════════════════════════════════════════
    // 6. RAPOR HAZIR — Aylık bilanço
    // ════════════════════════════════════════════════════════════
    public static function raporHazir(
        string $adSoyad,
        string $firmaAdi,
        string $donem,       // ör: "Mart 2026"
        float  $gelir,
        float  $gider,
        float  $netKar
    ): string {
        $isim    = htmlspecialchars(explode(' ', trim($adSoyad))[0]);
        $firma   = htmlspecialchars($firmaAdi);
        $donem   = htmlspecialchars($donem);
        $gelirFt = self::tl($gelir);
        $giderFt = self::tl($gider);
        $netFt   = self::tl(abs($netKar));
        $netRenk = $netKar >= 0 ? '#059669' : '#dc2626';
        $netEtiket = $netKar >= 0 ? '↑ Kâr' : '↓ Zarar';

        $icerik = <<<HTML
        <p style="margin:0 0 18px;font-family:'DM Sans',Arial,sans-serif;font-size:10px;font-weight:600;
                  color:#b8b8b0;letter-spacing:2.5px;text-transform:uppercase;">{$donem} özeti</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fff;border:1px solid #eae9e4;border-radius:10px;overflow:hidden;">
          <tr>
            <td width="33%" style="padding:20px 16px;text-align:center;border-right:1px solid #f0f0ea;">
              <p style="margin:0 0 4px;font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:500;color:#8c8c84;text-transform:uppercase;letter-spacing:0.5px;">Gelir</p>
              <p style="margin:0;font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#059669;">{$gelirFt}</p>
            </td>
            <td width="33%" style="padding:20px 16px;text-align:center;border-right:1px solid #f0f0ea;">
              <p style="margin:0 0 4px;font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:500;color:#8c8c84;text-transform:uppercase;letter-spacing:0.5px;">Gider</p>
              <p style="margin:0;font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#dc2626;">{$giderFt}</p>
            </td>
            <td width="34%" style="padding:20px 16px;text-align:center;background:#fafaf7;">
              <p style="margin:0 0 4px;font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:500;color:#8c8c84;text-transform:uppercase;letter-spacing:0.5px;">{$netEtiket}</p>
              <p style="margin:0;font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:{$netRenk};">{$netFt}</p>
            </td>
          </tr>
        </table>
HTML;

        return self::_sablonOlustur(
            '📊 Rapor hazır',
            'Aylık rapor',
            "{$donem}<br>raporu hazır.",
            "Merhaba <strong style=\"font-weight:500;color:#1a2018;\">{$isim} Bey</strong>, <strong style=\"font-weight:500;color:#1a2018;\">{$firma}</strong> için {$donem} dönemi aylık bilanço raporu hazırlandı.",
            self::APP_URL . '/raporlar',
            'Raporları Görüntüle',
            $icerik
        );
    }

    // ════════════════════════════════════════════════════════════
    // 7. TEST MAİLİ
    // ════════════════════════════════════════════════════════════
    public static function deneme(): string {
        $icerik = <<<HTML
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fff;border:1px solid #eae9e4;border-radius:10px;">
          <tr>
            <td style="padding:24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="48" style="vertical-align:top;">
                    <div style="width:40px;height:40px;background:#f0fdf4;border:1px solid #d1fae5;
                                border-radius:10px;text-align:center;line-height:40px;font-size:18px;">✅</div>
                  </td>
                  <td style="vertical-align:top;padding-left:16px;">
                    <p style="margin:0 0 4px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#1a2018;">
                      SMTP bağlantısı başarılı
                    </p>
                    <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:300;color:#8c8c84;line-height:1.65;">
                      ParamGo mail sistemi doğru şekilde yapılandırılmış ve çalışıyor.
                      Bu maili aldıysanız her şey yolunda demektir.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
HTML;

        return self::_sablonOlustur(
            '🧪 Test',
            'Sistem testi',
            "Mail sistemi<br>çalışıyor.",
            "Bu, ParamGo SMTP yapılandırmasını doğrulamak için otomatik olarak gönderilmiş bir test mailidir.",
            '',
            '',
            $icerik,
            '<strong style="font-weight:600;color:#064e3b;">Bilgi:</strong> Bu mail <code>MailSablonlar::deneme()</code> metodu çağrılarak gönderildi. Gönderim tarihi: ' . date('d.m.Y H:i') . '.'
        );
    }
}
