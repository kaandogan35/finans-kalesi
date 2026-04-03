<?php
// =============================================================
// SinirKontrol.php — Plan Kullanım Sınırları
// ParamGo SaaS
//
// Plan başına işlem sınırlarını tanımlar ve kontrol eder.
// Deneme planı: Standart ile aynı sınırlar.
// Deneme süresi dolmuşsa yazma engellenir.
//
// Kullanım:
//   SinirKontrol::kontrol($payload, 'cari');   // 403 + exit
//   SinirKontrol::cariSayisi($payload);        // int döner
// =============================================================

class SinirKontrol {

    // ─── Plan Başına Sınırlar ───────────────────────────────
    // -1 = sınırsız
    const SINIRLAR = [
        'deneme' => [
            'cari_toplam'     => -1,   // Sınırsız (Standart ile aynı)
            'cek_aylik'       => 50,
            'kasa_gecmis_ay'  => -1,   // Sınırsız
            'kullanici_sayisi'=> 2,
        ],
        'standart' => [
            'cari_toplam'     => -1,   // Sınırsız
            'cek_aylik'       => 50,
            'kasa_gecmis_ay'  => -1,   // Sınırsız
            'kullanici_sayisi'=> 2,
        ],
        'kurumsal' => [
            'cari_toplam'     => -1,
            'cek_aylik'       => -1,
            'kasa_gecmis_ay'  => -1,
            'kullanici_sayisi'=> 10,
        ],
    ];

    // ─── Mevcut Cari Sayısı ─────────────────────────────────
    public static function cariSayisi(int $sirket_id): int {
        $db = Database::baglan();
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM cari_kartlar
             WHERE sirket_id = :sid AND silindi_mi = 0"
        );
        $stmt->execute([':sid' => $sirket_id]);
        return (int) $stmt->fetchColumn();
    }

    // ─── Aktif Kullanıcı Sayısı ─────────────────────────────
    public static function kullaniciSayisi(int $sirket_id): int {
        $db = Database::baglan();
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM kullanicilar
             WHERE sirket_id = :sid AND aktif_mi = 1"
        );
        $stmt->execute([':sid' => $sirket_id]);
        return (int) $stmt->fetchColumn();
    }

    // ─── Bu Ayki Çek/Senet Sayısı ──────────────────────────
    public static function cekAylikSayisi(int $sirket_id): int {
        $db = Database::baglan();
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM cek_senetler
             WHERE sirket_id = :sid
               AND silindi_mi = 0
               AND YEAR(olusturma_tarihi)  = YEAR(NOW())
               AND MONTH(olusturma_tarihi) = MONTH(NOW())"
        );
        $stmt->execute([':sid' => $sirket_id]);
        return (int) $stmt->fetchColumn();
    }

    // ─── Kontrol + 403 (Sınır Aşılmışsa) ──────────────────
    // $tur: 'cari' | 'cek' | 'kullanici'
    public static function kontrol(array $payload, string $tur): void {
        $plan     = $payload['plan'] ?? 'deneme';
        $sinirlar = self::SINIRLAR[$plan] ?? self::SINIRLAR['deneme'];
        $sirket   = (int) $payload['sirket_id'];

        // Deneme süresi dolmuşsa yazma işlemlerini engelle
        if ($plan === 'deneme') {
            PlanKontrol::denemeSuresiKontrol($payload);
        }

        if ($tur === 'cari') {
            $sinir = $sinirlar['cari_toplam'];
            if ($sinir === -1) return;
            $mevcut = self::cariSayisi($sirket);
            if ($mevcut >= $sinir) {
                Response::json([
                    'basarili' => false,
                    'hata'     => "Planınızda en fazla {$sinir} cari kart açabilirsiniz. Mevcut: {$mevcut}. Planınızı yükseltin.",
                    'kod'      => 'SINIR_ASILDI',
                    'sinir'    => $sinir,
                    'mevcut'   => $mevcut,
                ], 403);
                exit;
            }
        }

        if ($tur === 'cek') {
            $sinir = $sinirlar['cek_aylik'];
            if ($sinir === -1) return;
            $mevcut = self::cekAylikSayisi($sirket);
            if ($mevcut >= $sinir) {
                Response::json([
                    'basarili' => false,
                    'hata'     => "Bu ay {$sinir} çek/senet limitine ulaştınız. Mevcut: {$mevcut}. Planınızı yükseltin.",
                    'kod'      => 'SINIR_ASILDI',
                    'sinir'    => $sinir,
                    'mevcut'   => $mevcut,
                ], 403);
                exit;
            }
        }

        if ($tur === 'kullanici') {
            $sinir = $sinirlar['kullanici_sayisi'];
            $mevcut = self::kullaniciSayisi($sirket);
            if ($mevcut >= $sinir) {
                Response::json([
                    'basarili' => false,
                    'hata'     => "Planınızda en fazla {$sinir} kullanıcı tanımlayabilirsiniz. Mevcut: {$mevcut}. Planınızı yükseltin.",
                    'kod'      => 'SINIR_ASILDI',
                    'sinir'    => $sinir,
                    'mevcut'   => $mevcut,
                ], 403);
                exit;
            }
        }
    }

    // ─── Durum Özeti (API için) ─────────────────────────────
    public static function durumOzeti(array $payload): array {
        $plan     = $payload['plan'] ?? 'deneme';
        $sinirlar = self::SINIRLAR[$plan] ?? self::SINIRLAR['deneme'];
        $sirket   = (int) $payload['sirket_id'];

        $cari_mevcut = self::cariSayisi($sirket);
        $cek_mevcut  = self::cekAylikSayisi($sirket);

        $cari_sinir = $sinirlar['cari_toplam'];
        $cek_sinir  = $sinirlar['cek_aylik'];
        $kasa_ay    = $sinirlar['kasa_gecmis_ay'];
        $k_sinir    = $sinirlar['kullanici_sayisi'];
        $k_mevcut   = self::kullaniciSayisi($sirket);

        return [
            'plan' => $plan,
            'cari' => [
                'mevcut'  => $cari_mevcut,
                'sinir'   => $cari_sinir,
                'yuzde'   => $cari_sinir === -1 ? 0 : round(($cari_mevcut / $cari_sinir) * 100),
                'sinirsiz'=> $cari_sinir === -1,
            ],
            'cek_aylik' => [
                'mevcut'  => $cek_mevcut,
                'sinir'   => $cek_sinir,
                'yuzde'   => $cek_sinir === -1 ? 0 : round(($cek_mevcut / $cek_sinir) * 100),
                'sinirsiz'=> $cek_sinir === -1,
            ],
            'kasa_gecmis_ay' => [
                'sinir'   => $kasa_ay,
                'sinirsiz'=> $kasa_ay === -1,
            ],
            'kullanici' => [
                'mevcut'  => $k_mevcut,
                'sinir'   => $k_sinir,
                'yuzde'   => round(($k_mevcut / $k_sinir) * 100),
                'sinirsiz'=> false,
            ],
        ];
    }
}
