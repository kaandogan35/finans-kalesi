<?php
// =============================================================
// YetkiKontrol.php — Modül Bazlı Erişim Kontrolü
// ParamGo SaaS
//
// 'sahip' rolü her modüle erişebilir (bypass).
// Diğer roller için JWT payload'daki 'yetkiler' alanı kontrol edilir.
//
// Kullanım (route dosyalarında, AuthMiddleware::dogrula() sonrası):
//   YetkiKontrol::modul_kontrol($payload, 'cari');
// =============================================================

class YetkiKontrol {

    /**
     * Kullanıcının belirtilen modüle erişim yetkisi var mı kontrol eder.
     * Yetkisizse 403 döner ve çalışmayı durdurur.
     *
     * @param array  $payload JWT payload
     * @param string $modul   Modül adı (cari, kasa, cek_senet, odemeler, dashboard, vade_hesaplayici)
     */
    public static function modul_kontrol(array $payload, string $modul): void {
        // Sahip her zaman tam erişime sahiptir
        if (($payload['rol'] ?? '') === 'sahip') {
            return;
        }

        $yetkiler_raw = $payload['yetkiler'] ?? null;

        // yetkiler alanı JWT'de null ise (eski token) — erişime izin ver (geriye dönük uyumluluk)
        if ($yetkiler_raw === null) {
            return;
        }

        // JSON string ise decode et
        if (is_string($yetkiler_raw)) {
            $yetkiler = json_decode($yetkiler_raw, true);
        } else {
            $yetkiler = $yetkiler_raw;
        }

        $izinli_moduller = $yetkiler['moduller'] ?? [];

        if (!in_array($modul, $izinli_moduller, true)) {
            Response::hata('Bu modüle erişim yetkiniz yok.', 403);
            exit;
        }
    }
}
