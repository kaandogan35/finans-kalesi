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
// [ gün_farkı => [ oncelik, alacak_mesaj_sablonu, borc_mesaj_sablonu ] ]
$vade_kurallari = [
    3 => [
        'oncelik' => 'yuksek',
        'alacak'  => '3 gün sonra çekin doluyor',
        'borc'    => '3 gün sonra verdiğin çek doluyor',
    ],
    1 => [
        'oncelik' => 'yuksek',
        'alacak'  => 'Yarın çekin doluyor',
        'borc'    => 'Yarın verdiğin çek doluyor',
    ],
    0 => [
        'oncelik' => 'kritik',
        'alacak'  => 'Bugün çekin doluyor!',
        'borc'    => 'Bugün verdiğin çek doluyor!',
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
            "SELECT id, seri_no, tutar, tutar_tl, doviz_kodu, cari_id
             FROM cek_senet
             WHERE sirket_id    = :sirket_id
               AND tur          = 'alacak'
               AND durum        = 'tahsilde'
               AND vade_tarihi  = :vade_tarihi
               AND silindi_mi   = 0"
        );
        $stmt->execute([':sirket_id' => $sirket_id, ':vade_tarihi' => $hedef_tarih]);
        $alacak_cekler = $stmt->fetchAll();

        foreach ($alacak_cekler as $cek) {
            $toplam_cek_tarandi++;
            $tutar_goster = format_tutar($cek['tutar_tl'] ?? $cek['tutar'], $cek['doviz_kodu'] ?? 'TRY');

            $baslik = $kural['alacak'];
            $mesaj  = "{$kural['alacak']} — Seri: {$cek['seri_no']} / {$tutar_goster}";
            if ($gun_farki === 0) {
                $mesaj = "Bugün tahsil edilmesi gereken çekin var: {$cek['seri_no']} ({$tutar_goster})";
            }

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
            "SELECT id, seri_no, tutar, tutar_tl, doviz_kodu, cari_id
             FROM cek_senet
             WHERE sirket_id    = :sirket_id
               AND tur          = 'borc'
               AND durum        IN ('verildi', 'odeme_bekleniyor')
               AND vade_tarihi  = :vade_tarihi
               AND silindi_mi   = 0"
        );
        $stmt->execute([':sirket_id' => $sirket_id, ':vade_tarihi' => $hedef_tarih]);
        $borc_cekler = $stmt->fetchAll();

        foreach ($borc_cekler as $cek) {
            $toplam_cek_tarandi++;
            $tutar_goster = format_tutar($cek['tutar_tl'] ?? $cek['tutar'], $cek['doviz_kodu'] ?? 'TRY');

            $baslik = $kural['borc'];
            $mesaj  = "{$kural['borc']} — Seri: {$cek['seri_no']} / {$tutar_goster}";
            if ($gun_farki === 0) {
                $mesaj = "Bugün ödenmesi gereken çekin var: {$cek['seri_no']} ({$tutar_goster})";
            }

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
