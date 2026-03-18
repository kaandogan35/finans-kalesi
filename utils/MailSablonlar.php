<?php
/**
 * Finans Kalesi — MailSablonlar
 *
 * 7 kurumsal HTML mail şablonu.
 * Tüm tasarım kuralları mail-tasarim.md'den alınmıştır.
 * Inline CSS + Google Fonts + marka renk paleti.
 *
 * Renk referansı:
 *   Navy      #0a2463  |  Koyu navy #071a4a
 *   Gold      #b8860b
 *   Başarı    #16a34a  |  Uyarı #d97706  |  Tehlike #dc2626  |  Bilgi #1e40af
 *   Sayfa bg  #f2f4f7  |  Kart #ffffff   |  Border  #e5e8f0
 */

class MailSablonlar {

    // ── Yardımcı: Türkçe tarih formatı ─────────────────────────
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

    // ── Ortak inline style (mail istemci uyumlu — flexbox/grid YOK) ──
    // Gmail, Outlook ve diğer istemciler <style> bloğunu kısmen destekler.
    // Kritik stiller inline olarak uygulanır, <style> yalnızca destekleyen
    // istemciler için yedek/ek güzellik sağlar.
    private static function _css(): string {
        return '
        body { margin:0; padding:0; background:#f2f4f7; font-family:\'Source Sans 3\',\'Segoe UI\',Arial,sans-serif; font-size:15px; color:#1a1a2e; -webkit-font-smoothing:antialiased; }
        .data-table { width:100%; border-collapse:collapse; margin:20px 0; font-size:14px; }
        .data-table th { background:#0a2463; color:#ffffff; font-family:\'Source Sans 3\',sans-serif; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.8px; padding:10px 14px; text-align:left; }
        .data-table td { padding:10px 14px; border-bottom:1px solid #e5e8f0; color:#374151; }
        .data-table tr:last-child td { border-bottom:none; }
        .data-table tr:nth-child(even) td { background:#f9fafb; }
        a { color:#0a2463; }
        @media(max-width:600px){
          .content-cell { padding:24px 20px !important; }
          .header-cell { padding:20px !important; }
          .footer-cell { padding:16px 20px !important; }
          .stat-cell { display:block !important; width:100% !important; }
        }
        ';
    }

    // ── Temel şablon (table-based layout — tüm mail istemcilerinde çalışır) ──
    private static function _base(string $baslik, string $etiket, string $icerik): string {
        $css = self::_css();
        $font_url = 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap';

        return <<<HTML
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>{$baslik}</title>
  <link href="{$font_url}" rel="stylesheet">
  <style>{$css}</style>
</head>
<body style="margin:0;padding:0;background:#f2f4f7;font-family:'Source Sans 3','Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f4f7;">
<tr><td align="center" style="padding:32px 16px;">

  <!-- Ana kart -->
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e8f0;">

    <!-- HEADER -->
    <tr>
      <td class="header-cell" style="background-color:#0a2463;padding:28px 40px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:40px;vertical-align:middle;">
              <div style="width:36px;height:36px;background:#b8860b;border-radius:6px;text-align:center;line-height:36px;font-size:18px;">&#x1F6E1;</div>
            </td>
            <td style="vertical-align:middle;padding-left:12px;">
              <div style="font-family:'Libre Baskerville',Georgia,serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">Finans Kalesi</div>
              <div style="font-family:'Source Sans 3',sans-serif;font-size:12px;color:rgba(255,255,255,0.6);margin-top:2px;letter-spacing:1.5px;text-transform:uppercase;">{$etiket}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- İÇERİK -->
    <tr>
      <td class="content-cell" style="padding:36px 40px;">
        {$icerik}
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td class="footer-cell" style="background:#f2f4f7;border-top:1px solid #e5e8f0;padding:24px 40px;text-align:center;">
        <div style="font-family:'Libre Baskerville',Georgia,serif;font-size:14px;font-weight:700;color:#0a2463;margin-bottom:6px;">Finans Kalesi</div>
        <div style="font-size:12px;color:#9ca3af;line-height:1.6;">
          Bu mail otomatik olarak gönderilmiştir.<br>
          Sorularınız için <a href="mailto:destek@finanskalesi.com" style="color:#0a2463;text-decoration:none;">destek@finanskalesi.com</a> adresine yazabilirsiniz.<br><br>
          &copy; 2026 Finans Kalesi &middot; Tüm hakları saklıdır.
        </div>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>
HTML;
    }

    // ────────────────────────────────────────────────────────────
    // TİP 1 — Hoş Geldin Maili
    // ────────────────────────────────────────────────────────────
    public static function hosgeldin(string $ad_soyad, string $firma_adi, string $app_url = ''): string {
        if (!$app_url) $app_url = env('APP_URL', 'https://app.finanskalesi.com');

        $icerik = '
        <p style="font-family:\'Libre Baskerville\',Georgia,serif;font-size:22px;font-weight:700;color:#0a2463;margin:0 0 12px 0;line-height:1.3;">Finans Kalesi\'ne hoş geldiniz, ' . htmlspecialchars($ad_soyad) . '.</p>
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px 0;">
            <strong>' . htmlspecialchars($firma_adi) . '</strong> adına hesabınız başarıyla oluşturuldu.
            Finans Kalesi ile tüm finansal süreçlerinizi tek ekrandan yönetebilirsiniz.
        </p>

        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
          <tr>
            <td style="padding-bottom:14px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:32px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;background:#0a2463;border-radius:50%;text-align:center;line-height:28px;font-size:14px;">&#x1F465;</div>
                  </td>
                  <td style="padding-left:10px;font-size:14px;color:#374151;line-height:1.5;">
                    <span style="font-weight:700;color:#1a1a2e;">Cari Hesaplar</span><br>
                    Müşteri ve tedarikçilerinizi tek ekranda görün, bakiyelerini takip edin.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:14px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:32px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;background:#0a2463;border-radius:50%;text-align:center;line-height:28px;font-size:14px;">&#x1F4B3;</div>
                  </td>
                  <td style="padding-left:10px;font-size:14px;color:#374151;line-height:1.5;">
                    <span style="font-weight:700;color:#1a1a2e;">Çek / Senet Takibi</span><br>
                    Portföyünüzdeki tüm çek ve senetleri takip edin, vade hatırlatmalarını kaçırmayın.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:32px;vertical-align:top;padding-top:2px;">
                    <div style="width:28px;height:28px;background:#0a2463;border-radius:50%;text-align:center;line-height:28px;font-size:14px;">&#x1F4B0;</div>
                  </td>
                  <td style="padding-left:10px;font-size:14px;color:#374151;line-height:1.5;">
                    <span style="font-weight:700;color:#1a1a2e;">Nakit Akışı</span><br>
                    Kasa hareketlerinizi ve açık vadelerinizi anlık olarak görüntüleyin.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="text-align:center;margin:28px 0;">
          <a href="' . $app_url . '" style="display:inline-block;background:#0a2463;color:#ffffff !important;font-family:\'Source Sans 3\',sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:6px;letter-spacing:0.3px;">Hesabıma Gir</a>
        </div>

        <hr style="border:none;border-top:1px solid #e5e8f0;margin:24px 0;">
        <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;">
          Herhangi bir sorunuz olursa bize <a href="mailto:destek@finanskalesi.com" style="color:#0a2463;">destek@finanskalesi.com</a> adresinden ulaşabilirsiniz.
        </p>
        ';

        return self::_base('Finans Kalesi\'ne Hoş Geldiniz', 'HOŞ GELDİNİZ', $icerik);
    }

    // ────────────────────────────────────────────────────────────
    // TİP 2 — Şifre Sıfırlama Maili
    // ────────────────────────────────────────────────────────────
    public static function sifreSifirla(string $link, int $gecerlilik_dk = 30): string {
        $icerik = '
        <p style="font-family:\'Libre Baskerville\',Georgia,serif;font-size:22px;font-weight:700;color:#0a2463;margin:0 0 12px 0;line-height:1.3;">Şifre sıfırlama talebiniz alındı.</p>
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px 0;">
            Hesabınız için şifre sıfırlama talebinde bulunuldu. Bu talebi siz yapmadıysanız
            bu maili dikkate almayın — hesabınız güvende.
        </p>

        <div style="border-left:4px solid #1e40af;background:#eff6ff;border-radius:0 6px 6px 0;padding:14px 18px;margin:20px 0;">
            <div style="font-weight:700;font-size:14px;color:#1a1a2e;margin-bottom:4px;">&#9432; Bu link ' . $gecerlilik_dk . ' dakika geçerlidir.</div>
            <div style="font-size:14px;color:#374151;line-height:1.5;">Süre dolduktan sonra yeni bir sıfırlama talebi oluşturmanız gerekecektir.</div>
        </div>

        <div style="text-align:center;margin:28px 0;">
          <a href="' . htmlspecialchars($link) . '" style="display:inline-block;background:#b8860b;color:#ffffff !important;font-family:\'Source Sans 3\',sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:6px;letter-spacing:0.3px;">Şifremi Sıfırla</a>
        </div>

        <hr style="border:none;border-top:1px solid #e5e8f0;margin:24px 0;">
        <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;">
            Linkin süresi dolmuşsa <a href="' . htmlspecialchars($link) . '" style="color:#0a2463;">şifre sıfırlama sayfasından</a>
            yeni bir talep oluşturabilirsiniz.
        </p>
        ';

        return self::_base('Şifre Sıfırlama — Finans Kalesi', 'GÜVENLİK', $icerik);
    }

    // ────────────────────────────────────────────────────────────
    // TİP 3 — Güvenlik Uyarısı (Farklı IP Girişi)
    // ────────────────────────────────────────────────────────────
    public static function guvenlikUyarisi(
        string $tarih_saat,
        string $ip,
        string $cihaz,
        string $sifre_sifirla_link
    ): string {
        $icerik = '
        <p style="font-family:\'Libre Baskerville\',Georgia,serif;font-size:22px;font-weight:700;color:#0a2463;margin:0 0 12px 0;line-height:1.3;">Hesabınıza yeni bir cihazdan giriş yapıldı.</p>
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px 0;">
            Hesabınıza daha önce giriş yapılmadığı bir IP adresinden bağlantı sağlandı.
            Bu girişi siz yaptıysanız herhangi bir işlem yapmanıza gerek yok.
        </p>

        <div style="border-left:4px solid #dc2626;background:#fef2f2;border-radius:0 6px 6px 0;padding:14px 18px;margin:20px 0;">
            <div style="font-weight:700;font-size:14px;color:#1a1a2e;margin-bottom:4px;">&#9888; Giriş Bilgileri</div>
            <div style="font-size:14px;color:#374151;line-height:1.5;">
                <strong>Tarih / Saat:</strong> ' . htmlspecialchars($tarih_saat) . '<br>
                <strong>IP Adresi:</strong> ' . htmlspecialchars($ip) . '<br>
                <strong>Cihaz / Tarayıcı:</strong> ' . htmlspecialchars($cihaz) . '
            </div>
        </div>

        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px 0;">
            <strong>Bu girişi ben yaptım:</strong> Herhangi bir işlem yapmanıza gerek yok, hesabınız güvende.<br><br>
            <strong>Bu girişi ben yapmadım:</strong> Lütfen hemen şifrenizi sıfırlayın.
        </p>

        <div style="text-align:center;margin:28px 0;">
          <a href="' . htmlspecialchars($sifre_sifirla_link) . '" style="display:inline-block;background:#dc2626;color:#ffffff !important;font-family:\'Source Sans 3\',sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:6px;letter-spacing:0.3px;">Şifremi Hemen Sıfırla</a>
        </div>

        <hr style="border:none;border-top:1px solid #e5e8f0;margin:24px 0;">
        <p style="font-size:13px;color:#6b7280;line-height:1.7;margin:0;">
            Güvenliğiniz için şifrenizi kimseyle paylaşmayın. Sorularınız için
            <a href="mailto:destek@finanskalesi.com" style="color:#0a2463;">destek@finanskalesi.com</a> adresine yazabilirsiniz.
        </p>
        ';

        return self::_base('Güvenlik Uyarısı — Finans Kalesi', 'GÜVENLİK UYARISI', $icerik);
    }

    // ────────────────────────────────────────────────────────────
    // TİP 4 — Günlük Nakit Akış Özeti
    // $istatistikler = [tahsilat, odeme, net, bakiye] (float)
    // $hareketler    = [['saat', 'aciklama', 'tutar', 'tur'], ...]
    // ────────────────────────────────────────────────────────────
    public static function gunlukNakitOzeti(
        string $firma_adi,
        array  $istatistikler,
        array  $hareketler,
        string $app_url = ''
    ): string {
        if (!$app_url) $app_url = env('APP_URL', 'https://app.finanskalesi.com');

        $tarih_str = self::tarih(date('Y-m-d'));
        $tahsilat  = (float)($istatistikler['tahsilat'] ?? 0);
        $odeme     = (float)($istatistikler['odeme'] ?? 0);
        $net       = $tahsilat - $odeme;
        $bakiye    = (float)($istatistikler['bakiye'] ?? 0);

        $net_class    = $net >= 0 ? 'pos' : 'neg';
        $bakiye_class = $bakiye >= 0 ? '' : 'neg';

        // Hareket tablosu
        $tablo_satir = '';
        if (!empty($hareketler)) {
            foreach ($hareketler as $h) {
                $tutar = (float)$h['tutar'];
                $renk  = ($h['tur'] === 'giris') ? '#16a34a' : '#dc2626';
                $isaret= ($h['tur'] === 'giris') ? '+' : '-';
                $tablo_satir .= '<tr>
                    <td>' . htmlspecialchars($h['saat']) . '</td>
                    <td>' . htmlspecialchars($h['aciklama']) . '</td>
                    <td style="color:' . $renk . '; font-weight:700; font-family:Libre Baskerville,Georgia,serif;">'
                        . $isaret . self::tl(abs($tutar)) . '</td>
                    <td>' . ($h['tur'] === 'giris' ? 'Tahsilat' : 'Ödeme') . '</td>
                </tr>';
            }
        }

        $tablo_html = !empty($hareketler)
            ? '<table class="data-table">
                <thead><tr>
                  <th>Saat</th><th>Açıklama</th><th>Tutar</th><th>Tür</th>
                </tr></thead>
                <tbody>' . $tablo_satir . '</tbody>
               </table>'
            : '<p class="body-text" style="font-size:14px;color:#6b7280;">Bugün kayıtlı hareket bulunmuyor.</p>';

        $icerik = '
        <p class="greeting">' . $tarih_str . ' tarihli nakit akış özetiniz.</p>
        <p class="body-text">Merhaba <strong>' . htmlspecialchars($firma_adi) . '</strong>,<br>
           Günlük nakit akış özetiniz aşağıda yer almaktadır.</p>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">Bugünkü Tahsilat</div>
            <div class="stat-value pos">' . self::tl($tahsilat) . '</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Bugünkü Ödeme</div>
            <div class="stat-value neg">' . self::tl($odeme) . '</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Günlük Net</div>
            <div class="stat-value ' . $net_class . '">' . ($net >= 0 ? '+' : '') . self::tl($net) . '</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Kasa Bakiyesi</div>
            <div class="stat-value ' . $bakiye_class . '">' . self::tl($bakiye) . '</div>
          </div>
        </div>

        ' . $tablo_html . '

        <div class="cta-wrapper">
          <a href="' . $app_url . '/kasa" class="cta-button">Detaylı Görünüm</a>
        </div>
        ';

        return self::_base($tarih_str . ' Günlük Nakit Akış Özeti — Finans Kalesi', 'GÜNLÜK ÖZET', $icerik);
    }

    // ────────────────────────────────────────────────────────────
    // TİP 5 — Haftalık Ödeme / Vade Özeti
    // $yaklasanlar / $gecmisler = [['cari_adi', 'aciklama', 'vade_tarihi', 'tutar', 'gun_kaldi'], ...]
    // ────────────────────────────────────────────────────────────
    public static function haftalikVadeler(
        string $firma_adi,
        array  $yaklasanlar,
        array  $gecmisler = [],
        string $app_url   = ''
    ): string {
        if (!$app_url) $app_url = env('APP_URL', 'https://app.finanskalesi.com');

        $toplam_tutar = 0;
        foreach ($yaklasanlar as $y) $toplam_tutar += (float)$y['tutar'];
        foreach ($gecmisler as $g) $toplam_tutar += (float)$g['tutar'];
        $toplam_adet = count($yaklasanlar) + count($gecmisler);

        // Yaklaşan ödemeler tablosu
        $yaklasan_satirlar = '';
        foreach ($yaklasanlar as $y) {
            $gun     = (int)($y['gun_kaldi'] ?? 99);
            $renk    = $gun === 0 ? '#dc2626' : ($gun === 1 ? '#d97706' : '#d97706');
            $etiket  = $gun === 0 ? 'Bugün' : ($gun === 1 ? 'Yarın' : $gun . ' gün');
            $yaklasan_satirlar .= '<tr>
                <td>' . htmlspecialchars($y['cari_adi'] ?? '—') . '</td>
                <td>' . htmlspecialchars($y['aciklama'] ?? '—') . '</td>
                <td>' . self::tarih($y['vade_tarihi']) . '</td>
                <td style="font-family:Libre Baskerville,Georgia,serif;font-weight:700;">' . self::tl($y['tutar']) . '</td>
                <td style="color:' . $renk . ';font-weight:700;">' . $etiket . '</td>
            </tr>';
        }

        $yaklasan_tablo = !empty($yaklasanlar)
            ? '<table class="data-table"><thead><tr>
                <th>Cari Adı</th><th>Açıklama</th><th>Vade</th><th>Tutar</th><th>Durum</th>
               </tr></thead><tbody>' . $yaklasan_satirlar . '</tbody></table>'
            : '<p class="body-text" style="font-size:14px;color:#6b7280;">Bu hafta yaklaşan ödeme bulunmuyor.</p>';

        // Gecikmiş ödemeler tablosu
        $gecmis_html = '';
        if (!empty($gecmisler)) {
            $gecmis_satirlar = '';
            foreach ($gecmisler as $g) {
                $gun = abs((int)($g['gun_gecmis'] ?? 0));
                $gecmis_satirlar .= '<tr>
                    <td>' . htmlspecialchars($g['cari_adi'] ?? '—') . '</td>
                    <td>' . htmlspecialchars($g['aciklama'] ?? '—') . '</td>
                    <td>' . self::tarih($g['vade_tarihi']) . '</td>
                    <td style="font-family:Libre Baskerville,Georgia,serif;font-weight:700;color:#dc2626;">' . self::tl($g['tutar']) . '</td>
                    <td style="color:#dc2626;font-weight:700;">' . $gun . ' gün geçmiş</td>
                </tr>';
            }
            $gecmis_html = '<hr class="divider">
            <p class="body-text" style="font-weight:700;color:#dc2626;">&#9888; Gecikmiş Ödemeler</p>
            <table class="data-table"><thead><tr>
              <th>Cari Adı</th><th>Açıklama</th><th>Vade</th><th>Tutar</th><th>Gecikme</th>
            </tr></thead><tbody>' . $gecmis_satirlar . '</tbody></table>';
        }

        $icerik = '
        <p class="greeting">Bu hafta dikkat etmeniz gereken ödemeler.</p>
        <p class="body-text">Merhaba <strong>' . htmlspecialchars($firma_adi) . '</strong>,<br>
           Aşağıda bu haftaki ödeme ve vade özetiniz yer almaktadır.</p>

        <div class="alert-block">
          <div class="alert-title">&#9888; Haftalık Özet</div>
          <div class="alert-text">
            Toplam <strong>' . $toplam_adet . ' kayıt</strong>, toplam tutar: <strong>' . self::tl($toplam_tutar) . '</strong>
          </div>
        </div>

        ' . $yaklasan_tablo . $gecmis_html . '

        <div class="cta-wrapper">
          <a href="' . $app_url . '/odemeler" class="cta-button">Ödeme Takibine Git</a>
        </div>
        ';

        return self::_base('Haftalık Ödeme Özeti — Finans Kalesi', 'HAFTALIK ÖZET', $icerik);
    }

    // ────────────────────────────────────────────────────────────
    // TİP 6 — Aylık Bilanço / Kapanış Raporu
    // $istatistikler = [toplam_gelir, toplam_gider, net, acik_alacak, acik_borc, kapanis_bakiyesi]
    // $en_buyuk_tahsilatlar / $en_buyuk_odemeler = [['aciklama', 'tutar', 'tarih'], ...]
    // ────────────────────────────────────────────────────────────
    public static function aylikBilanco(
        string $firma_adi,
        string $ay_yil,
        array  $istatistikler,
        array  $en_buyuk_tahsilatlar = [],
        array  $en_buyuk_odemeler    = [],
        string $app_url              = ''
    ): string {
        if (!$app_url) $app_url = env('APP_URL', 'https://app.finanskalesi.com');

        $gelir   = (float)($istatistikler['toplam_gelir'] ?? 0);
        $gider   = (float)($istatistikler['toplam_gider'] ?? 0);
        $net     = (float)($istatistikler['net'] ?? ($gelir - $gider));
        $alacak  = (float)($istatistikler['acik_alacak'] ?? 0);
        $borc    = (float)($istatistikler['acik_borc'] ?? 0);
        $kapanis = (float)($istatistikler['kapanis_bakiyesi'] ?? 0);

        $net_class    = $net >= 0 ? 'pos' : 'neg';
        $kapanis_class= $kapanis >= 0 ? '' : 'neg';

        // Tahsilat tablosu
        $tahsilat_satirlar = '';
        foreach (array_slice($en_buyuk_tahsilatlar, 0, 5) as $t) {
            $tahsilat_satirlar .= '<tr>
                <td>' . htmlspecialchars($t['aciklama'] ?? '—') . '</td>
                <td>' . self::tarih($t['tarih']) . '</td>
                <td style="font-family:Libre Baskerville,Georgia,serif;font-weight:700;color:#16a34a;">+' . self::tl($t['tutar']) . '</td>
            </tr>';
        }
        $tahsilat_tablo = !empty($en_buyuk_tahsilatlar)
            ? '<p class="body-text" style="font-weight:700;">En Büyük 5 Tahsilat</p>
               <table class="data-table"><thead><tr><th>Açıklama</th><th>Tarih</th><th>Tutar</th></tr></thead>
               <tbody>' . $tahsilat_satirlar . '</tbody></table>'
            : '';

        // Ödeme tablosu
        $odeme_satirlar = '';
        foreach (array_slice($en_buyuk_odemeler, 0, 5) as $o) {
            $odeme_satirlar .= '<tr>
                <td>' . htmlspecialchars($o['aciklama'] ?? '—') . '</td>
                <td>' . self::tarih($o['tarih']) . '</td>
                <td style="font-family:Libre Baskerville,Georgia,serif;font-weight:700;color:#dc2626;">-' . self::tl($o['tutar']) . '</td>
            </tr>';
        }
        $odeme_tablo = !empty($en_buyuk_odemeler)
            ? '<p class="body-text" style="font-weight:700;margin-top:16px;">En Büyük 5 Ödeme</p>
               <table class="data-table"><thead><tr><th>Açıklama</th><th>Tarih</th><th>Tutar</th></tr></thead>
               <tbody>' . $odeme_satirlar . '</tbody></table>'
            : '';

        $icerik = '
        <p class="greeting">' . htmlspecialchars($ay_yil) . ' dönemi kapanış raporu.</p>
        <p class="body-text">Merhaba <strong>' . htmlspecialchars($firma_adi) . '</strong>,<br>
           Bir önceki aya ait finansal kapanış özeti aşağıda yer almaktadır.</p>

        <div class="stat-grid">
          <div class="stat-card"><div class="stat-label">Toplam Gelir</div><div class="stat-value pos">+' . self::tl($gelir) . '</div></div>
          <div class="stat-card"><div class="stat-label">Toplam Gider</div><div class="stat-value neg">-' . self::tl($gider) . '</div></div>
          <div class="stat-card"><div class="stat-label">Net Nakit Akışı</div><div class="stat-value ' . $net_class . '">' . ($net >= 0 ? '+' : '') . self::tl($net) . '</div></div>
          <div class="stat-card"><div class="stat-label">Açık Alacak</div><div class="stat-value warn">' . self::tl($alacak) . '</div></div>
          <div class="stat-card"><div class="stat-label">Açık Borç</div><div class="stat-value warn">' . self::tl($borc) . '</div></div>
          <div class="stat-card"><div class="stat-label">Kapanış Bakiyesi</div><div class="stat-value ' . $kapanis_class . '">' . self::tl($kapanis) . '</div></div>
        </div>

        <hr class="divider">
        ' . $tahsilat_tablo . $odeme_tablo . '

        <div class="cta-wrapper">
          <a href="' . $app_url . '/kasa" class="cta-button">Tam Raporu Görüntüle</a>
        </div>
        ';

        return self::_base($ay_yil . ' Aylık Bilanço Raporu — Finans Kalesi', 'AYLIK RAPOR', $icerik);
    }

    // ────────────────────────────────────────────────────────────
    // TİP 7 — Karşılıksız Çek Uyarısı
    // $cek = ['seri_no', 'cari_adi', 'tutar', 'vade_tarihi', 'cek_id']
    // ────────────────────────────────────────────────────────────
    public static function karsilıksızCek(
        string $firma_adi,
        array  $cek,
        float  $cari_bakiye = 0,
        string $app_url     = ''
    ): string {
        if (!$app_url) $app_url = env('APP_URL', 'https://app.finanskalesi.com');

        $cek_id   = (int)($cek['cek_id'] ?? 0);
        $detay_link  = $app_url . '/cek-senet';

        $bakiye_class = $cari_bakiye >= 0 ? 'pos' : 'neg';

        $icerik = '
        <p class="greeting">Karşılıksız çek bildirimi.</p>
        <p class="body-text">Merhaba <strong>' . htmlspecialchars($firma_adi) . '</strong>,<br>
           Aşağıdaki çekin durumu <strong style="color:#dc2626;">karşılıksız</strong> olarak güncellendi.
           Lütfen gerekli işlemleri yapın.</p>

        <div class="alert-block danger">
          <div class="alert-title">&#9888; Karşılıksız Çek Detayı</div>
          <div class="alert-text">
            <strong>Çek / Seri No:</strong> ' . htmlspecialchars($cek['seri_no'] ?? '—') . '<br>
            <strong>Cari:</strong> ' . htmlspecialchars($cek['cari_adi'] ?? '—') . '<br>
            <strong>Tutar:</strong> ' . self::tl((float)($cek['tutar'] ?? 0)) . '<br>
            <strong>Vade Tarihi:</strong> ' . self::tarih($cek['vade_tarihi'] ?? date('Y-m-d'))  . '
          </div>
        </div>

        <p class="body-text">Bu çekin durumu sisteminizde <strong>karşılıksız</strong> olarak işaretlendi.</p>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">Çek Tutarı</div>
            <div class="stat-value neg">' . self::tl((float)($cek['tutar'] ?? 0)) . '</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Cari Bakiye</div>
            <div class="stat-value ' . $bakiye_class . '">' . self::tl($cari_bakiye) . '</div>
          </div>
        </div>

        <div class="cta-wrapper">
          <a href="' . $detay_link . '" class="cta-button" style="background:#dc2626;">Çek Detayını Görüntüle</a>
        </div>
        <a href="' . $detay_link . '" class="text-link">Carinin tüm hareketlerini görüntüle &rarr;</a>
        ';

        return self::_base('ACİL: Karşılıksız Çek Bildirimi — Finans Kalesi', 'ACİL BİLDİRİM', $icerik);
    }
}
