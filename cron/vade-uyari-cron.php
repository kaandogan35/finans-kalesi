<?php
/**
 * ParamGo — Vade Uyarı Cron Script
 *
 * Her gün sabah 10:00'da çalışır (cPanel Cron Jobs ile ayarlanır).
 * Tüm şirketlerin çeklerini tarar ve vadeye yakın olanlar için
 * BildirimOlusturucu::toplu_gonder() ile bildirim gönderir.
 *
 * Kapsam:
 *   - Alacak çekleri (durum = 'tahsilde')        → biz alacağız
 *   - Borç çekleri   (durum = 'verildi' | 'odeme_bekleniyor') → biz ödeyeceğiz
 *
 * Çalışma günlüğü (log):
 *   Her çalışmada kaç bildirim gönderildiği error_log'a yazılır.
 *
 * GÜVENLİK: Bu script yalnızca komut satırından (CLI) çalıştırılabilir.
 *           HTTP üzerinden doğrudan erişim engellendi.
 */

// ─── CLI Güvenlik Kontrolü ─────────────────────────────────────────
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Bu script yalnızca cron ile çalıştırılabilir.');
}

// ─── Bootstrap ────────────────────────────────────────────────────
// Bu script /cron/ klasöründe, config ise /config/ klasöründe
define('CRON_ROOT', dirname(__DIR__));

require_once CRON_ROOT . '/config/app.php';     // .env yükle, env() fonksiyon
require_once CRON_ROOT . '/config/database.php'; // Database::baglan()
require_once CRON_ROOT . '/models/Bildirim.php';
require_once CRON_ROOT . '/utils/BildirimOlusturucu.php';

// BildirimOlusturucu::email_gonder() MailHelper kullanıyor — varsa yükle
$mail_helper = CRON_ROOT . '/utils/MailHelper.php';
if (file_exists($mail_helper)) {
    require_once $mail_helper;
}

// WhatsappHelper — varsa yükle (yoksa BildirimOlusturucu kendisi atlar)
$wp_helper = CRON_ROOT . '/utils/WhatsappHelper.php';
if (file_exists($wp_helper)) {
    require_once $wp_helper;
}

// ─── Sayaçlar ─────────────────────────────────────────────────────
$toplam_gonderilen = 0;
$toplam_cek_tarandi = 0;
$baslangic = microtime(true);

error_log("[vade-uyari-cron] Başladı: " . date('Y-m-d H:i:s'));

// ─── Vade Kuralları ───────────────────────────────────────────────
$vade_kurallari = [
    3 => [
        'oncelik'       => 'yuksek',
        'alacak_baslik' => 'Çek Vadesi Yaklaşıyor · 3 Gün Kaldı',
        'borc_baslik'   => 'Ödeme Vadesi Yaklaşıyor · 3 Gün Kaldı',
    ],
    1 => [
        'oncelik'       => 'yuksek',
        'alacak_baslik' => 'Yarın Vadesi Dolan Çekin Var',
        'borc_baslik'   => 'Yarın Ödenmesi Gereken Çekin Var',
    ],
    0 => [
        'oncelik'       => 'kritik',
        'alacak_baslik' => 'Bugün Vadesi Dolan Çekin Var!',
        'borc_baslik'   => 'Bugün Ödenmesi Gereken Çekin Var!',
    ],
];

// ─── Veritabanı Bağlantısı ────────────────────────────────────────
try {
    $db = Database::baglan();
} catch (Exception $e) {
    error_log("[vade-uyari-cron] DB bağlantı hatası: " . $e->getMessage());
    exit(1);
}

// ─── Aktif Şirketleri Çek ─────────────────────────────────────────
$stmt = $db->query("SELECT id FROM sirketler WHERE aktif_mi = 1");
$sirketler = $stmt->fetchAll(PDO::FETCH_COLUMN);

foreach ($sirketler as $sirket_id) {
    $sirket_id = (int)$sirket_id;

    // Şirketin aktif kullanıcılarını al
    $bildirim_model = new Bildirim();
    $kullanicilar   = $bildirim_model->sirket_kullanicilari($sirket_id);

    if (empty($kullanicilar)) {
        continue;
    }

    $kullanici_idler = array_column($kullanicilar, 'id');

    // Her vade kuralını işle
    foreach ($vade_kurallari as $gun_farki => $kural) {
        $hedef_tarih = date('Y-m-d', strtotime("+{$gun_farki} days"));

        // ── A) ALACAK ÇEKLERİ (tahsilde) ─────────────────────────
        $stmt = $db->prepare(
            "SELECT cs.id, cs.tutar, cs.tutar_tl, cs.doviz_kodu, cs.vade_tarihi,
                    COALESCE(c.ad, 'Bilinmeyen Cari') AS cari_adi
             FROM cek_senet cs
             LEFT JOIN cariler c ON c.id = cs.cari_id
             WHERE cs.sirket_id   = :sirket_id
               AND cs.tur         = 'alacak'
               AND cs.durum       = 'tahsilde'
               AND cs.vade_tarihi = :vade_tarihi
               AND cs.silindi_mi  = 0"
        );
        $stmt->execute([':sirket_id' => $sirket_id, ':vade_tarihi' => $hedef_tarih]);
        $alacak_cekler = $stmt->fetchAll();

        foreach ($alacak_cekler as $cek) {
            $toplam_cek_tarandi++;
            $tutar_goster = format_tutar($cek['tutar_tl'] ?? $cek['tutar'], $cek['doviz_kodu'] ?? 'TRY');
            $cari_kisa    = cari_kisalt($cek['cari_adi']);
            $vade_kisa    = tarih_kisalt($cek['vade_tarihi']);

            $baslik = $kural['alacak_baslik'];
            $mesaj  = match ((int)$gun_farki) {
                0 => "{$tutar_goster} · {$cari_kisa}'dan alacak çekin bugün tahsil edilmeli",
                1 => "{$tutar_goster} · {$cari_kisa}'dan alacak çekin yarın tahsil edilmeli",
                default => "{$tutar_goster} · {$cari_kisa}'dan alacak çekin {$vade_kisa}'de tahsil edilmeli",
            };

            $gonderilen = BildirimOlusturucu::toplu_gonder($kullanici_idler, [
                'sirket_id'   => $sirket_id,
                'tip'         => 'cek_vade',
                'baslik'      => $baslik,
                'mesaj'       => $mesaj,
                'oncelik'     => $kural['oncelik'],
                'kaynak_turu' => 'cek_senet',
                'kaynak_id'   => (int)$cek['id'],
                'aksiyon_url' => '/cek-senet',
            ]);

            $toplam_gonderilen += $gonderilen;
        }

        // ── B) BORÇ ÇEKLERİ (verildi / odeme_bekleniyor) ─────────
        $stmt = $db->prepare(
            "SELECT cs.id, cs.tutar, cs.tutar_tl, cs.doviz_kodu, cs.vade_tarihi,
                    COALESCE(c.ad, 'Bilinmeyen Cari') AS cari_adi
             FROM cek_senet cs
             LEFT JOIN cariler c ON c.id = cs.cari_id
             WHERE cs.sirket_id   = :sirket_id
               AND cs.tur         = 'borc'
               AND cs.durum       IN ('verildi', 'odeme_bekleniyor')
               AND cs.vade_tarihi = :vade_tarihi
               AND cs.silindi_mi  = 0"
        );
        $stmt->execute([':sirket_id' => $sirket_id, ':vade_tarihi' => $hedef_tarih]);
        $borc_cekler = $stmt->fetchAll();

        foreach ($borc_cekler as $cek) {
            $toplam_cek_tarandi++;
            $tutar_goster = format_tutar($cek['tutar_tl'] ?? $cek['tutar'], $cek['doviz_kodu'] ?? 'TRY');
            $cari_kisa    = cari_kisalt($cek['cari_adi']);
            $vade_kisa    = tarih_kisalt($cek['vade_tarihi']);

            $baslik = $kural['borc_baslik'];
            $mesaj  = match ((int)$gun_farki) {
                0 => "{$tutar_goster} · {$cari_kisa}'ya borcunuzun vadesi bugün ödenmeli",
                1 => "{$tutar_goster} · {$cari_kisa}'ya borcunuzun vadesi yarın",
                default => "{$tutar_goster} · {$cari_kisa}'ya borcunuzun vadesi {$vade_kisa}'de",
            };

            $gonderilen = BildirimOlusturucu::toplu_gonder($kullanici_idler, [
                'sirket_id'   => $sirket_id,
                'tip'         => 'cek_vade',
                'baslik'      => $baslik,
                'mesaj'       => $mesaj,
                'oncelik'     => $kural['oncelik'],
                'kaynak_turu' => 'cek_senet',
                'kaynak_id'   => (int)$cek['id'],
                'aksiyon_url' => '/cek-senet',
            ]);

            $toplam_gonderilen += $gonderilen;
        }
    }
}

// ─── Özet Log ─────────────────────────────────────────────────────
$sure = round(microtime(true) - $baslangic, 2);
error_log(sprintf(
    "[vade-uyari-cron] Tamamlandı: %s | Şirket: %d | Taranan çek: %d | Gönderilen bildirim: %d | Süre: %ss",
    date('Y-m-d H:i:s'),
    count($sirketler),
    $toplam_cek_tarandi,
    $toplam_gonderilen,
    $sure
));

exit(0);

// ─── Yardımcı: Cari Adı Kısalt ────────────────────────────────────
function cari_kisalt(string $ad): string {
    $ad = trim($ad);
    $kelimeler = preg_split('/\s+/', $ad);
    if (count($kelimeler) === 1) return $kelimeler[0];
    $iki_kelime = $kelimeler[0] . ' ' . $kelimeler[1];
    return mb_strlen($iki_kelime) <= 15 ? $iki_kelime : $kelimeler[0];
}

// ─── Yardımcı: Tarihi Kısalt ──────────────────────────────────────
function tarih_kisalt(string $tarih): string {
    $aylar = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    [$yil, $ay, $gun] = explode('-', $tarih);
    return (int)$gun . ' ' . ($aylar[(int)$ay] ?? $ay);
}

// ─── Yardımcı: Tutar Formatla ─────────────────────────────────────
function format_tutar(float $tutar, string $doviz): string {
    $formatli = number_format($tutar, 2, ',', '.');
    return match ($doviz) {
        'TRY'   => "{$formatli} ₺",
        'USD'   => "{$formatli} $",
        'EUR'   => "{$formatli} €",
        default => "{$formatli} {$doviz}",
    };
}
