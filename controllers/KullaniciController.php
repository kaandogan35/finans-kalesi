<?php
// =============================================================
// KullaniciController.php — Alt Kullanıcı Yönetimi
// ParamGo SaaS
//
// Sadece 'sahip' rolüne sahip kullanıcılar erişebilir.
// Plan limiti:  deneme=2, standart=2, kurumsal=10
//
// GET    /api/kullanicilar          → listele()
// POST   /api/kullanicilar          → olustur()
// GET    /api/kullanicilar/:id      → getir()
// PUT    /api/kullanicilar/:id      → guncelle()
// DELETE /api/kullanicilar/:id      → sil()
// PUT    /api/kullanicilar/:id/sifre → sifreGuncelle()
// =============================================================

class KullaniciController {

    private $model;

    // İzinli modül adları — validasyon için sabit liste
    const IZINLI_MODULLER = [
        'dashboard',
        'cari',
        'cek_senet',
        'odemeler',
        'kasa',
        'vade_hesaplayici',
    ];

    // Kullanıcıya atanabilecek roller (sahip atanamaz)
    const ATANABILIR_ROLLER = ['admin', 'muhasebeci', 'personel'];

    public function __construct() {
        $this->model = new Kullanici();
    }

    // ─── Kullanıcıları Listele ───────────────────────────────
    public function listele(array $payload): void {
        AuthMiddleware::rol_kontrol($payload, ['sahip']);
        $sirket_id = (int) $payload['sirket_id'];

        $kullanicilar = $this->model->sirket_kullanicilari($sirket_id);

        // Şifre hash'ini asla döndürme, yetkiler JSON'ı parse et
        $temiz = array_map(function ($k) {
            unset($k['sifre_hash']);
            $k['yetkiler'] = $k['yetkiler'] ? json_decode($k['yetkiler'], true) : null;
            return $k;
        }, $kullanicilar);

        Response::basarili(['kullanicilar' => $temiz]);
    }

    // ─── Tek Kullanıcı Getir ────────────────────────────────
    public function getir(array $payload, int $id): void {
        AuthMiddleware::rol_kontrol($payload, ['sahip']);
        $sirket_id = (int) $payload['sirket_id'];

        $kullanici = $this->model->id_ile_bul($id);

        if (!$kullanici || (int)$kullanici['sirket_id'] !== $sirket_id) {
            Response::bulunamadi('Kullanıcı bulunamadı');
            return;
        }

        unset($kullanici['sifre_hash']);
        $kullanici['yetkiler'] = $kullanici['yetkiler'] ? json_decode($kullanici['yetkiler'], true) : null;

        Response::basarili(['kullanici' => $kullanici]);
    }

    // ─── Yeni Kullanıcı Oluştur ─────────────────────────────
    public function olustur(array $payload, array $girdi): void {
        AuthMiddleware::rol_kontrol($payload, ['sahip']);

        // Plan özellik kontrolü: cok_kullanici gerektirir
        PlanKontrol::kontrol($payload, 'cok_kullanici');

        // Kullanıcı sayısı limit kontrolü
        SinirKontrol::kontrol($payload, 'kullanici');

        $sirket_id = (int) $payload['sirket_id'];

        // Zorunlu alanlar
        $eksik = [];
        foreach (['ad_soyad', 'email', 'sifre'] as $alan) {
            if (empty($girdi[$alan])) {
                $eksik[$alan] = "{$alan} zorunludur";
            }
        }
        if (!empty($eksik)) {
            Response::dogrulama_hatasi($eksik);
            return;
        }

        // E-posta format kontrolü
        if (!filter_var($girdi['email'], FILTER_VALIDATE_EMAIL)) {
            Response::dogrulama_hatasi(['email' => 'Geçerli bir e-posta adresi girin']);
            return;
        }

        // Şifre uzunluğu
        if (strlen($girdi['sifre']) < 8) {
            Response::dogrulama_hatasi(['sifre' => 'Şifre en az 8 karakter olmalıdır']);
            return;
        }

        // Rol kontrolü
        $rol = $girdi['rol'] ?? 'personel';
        if (!in_array($rol, self::ATANABILIR_ROLLER, true)) {
            Response::dogrulama_hatasi(['rol' => 'Geçersiz rol. Kullanılabilir: admin, muhasebeci, personel']);
            return;
        }

        // E-posta tekrar kaydı kontrolü
        if ($this->model->eposta_var_mi($girdi['email'])) {
            Response::hata('Bu e-posta adresi zaten kayıtlı', 409);
            return;
        }

        // Yetkiler validasyonu
        $yetkiler_json = $this->_yetkileriDogrula($girdi['yetkiler'] ?? null);
        if ($yetkiler_json === false) {
            Response::dogrulama_hatasi(['yetkiler' => 'Geçersiz modül adı içeriyor']);
            return;
        }

        $kullanici_id = $this->model->olustur([
            'sirket_id' => $sirket_id,
            'ad_soyad'  => trim($girdi['ad_soyad']),
            'email'     => strtolower(trim($girdi['email'])),
            'sifre'     => $girdi['sifre'],
            'telefon'   => $girdi['telefon'] ?? null,
            'rol'       => $rol,
            'yetkiler'  => $yetkiler_json,
        ]);

        Response::basarili([
            'kullanici' => [
                'id'        => $kullanici_id,
                'sirket_id' => $sirket_id,
                'ad_soyad'  => trim($girdi['ad_soyad']),
                'email'     => strtolower(trim($girdi['email'])),
                'rol'       => $rol,
                'yetkiler'  => $yetkiler_json ? json_decode($yetkiler_json, true) : null,
            ]
        ], 'Kullanıcı oluşturuldu', 201);
    }

    // ─── Kullanıcı Güncelle ─────────────────────────────────
    public function guncelle(array $payload, int $id, array $girdi): void {
        AuthMiddleware::rol_kontrol($payload, ['sahip']);
        $sirket_id = (int) $payload['sirket_id'];

        // Hedef kullanıcıyı doğrula
        $hedef = $this->model->id_ile_bul($id);
        if (!$hedef || (int)$hedef['sirket_id'] !== $sirket_id) {
            Response::bulunamadi('Kullanıcı bulunamadı');
            return;
        }

        // Sahip kendi hesabını bu endpoint'ten düzenleyemez
        if ((int)$hedef['id'] === (int)$payload['sub']) {
            Response::hata('Kendi hesabınızı bu endpoint\'ten düzenleyemezsiniz', 403);
            return;
        }

        // Sahip rolü atanamaz
        $rol = $girdi['rol'] ?? $hedef['rol'];
        if (!in_array($rol, self::ATANABILIR_ROLLER, true)) {
            Response::dogrulama_hatasi(['rol' => 'Geçersiz rol. Kullanılabilir: admin, muhasebeci, personel']);
            return;
        }

        // Yetkiler validasyonu
        $yetkiler_json = $this->_yetkileriDogrula($girdi['yetkiler'] ?? null);
        if ($yetkiler_json === false) {
            Response::dogrulama_hatasi(['yetkiler' => 'Geçersiz modül adı içeriyor']);
            return;
        }

        $this->model->guncelle($id, $sirket_id, [
            'ad_soyad'  => trim($girdi['ad_soyad'] ?? $hedef['ad_soyad']),
            'telefon'   => $girdi['telefon'] ?? $hedef['telefon'],
            'rol'       => $rol,
            'yetkiler'  => $yetkiler_json,
            'aktif_mi'  => isset($girdi['aktif_mi']) ? (int)$girdi['aktif_mi'] : (int)$hedef['aktif_mi'],
        ]);

        Response::basarili(null, 'Kullanıcı güncellendi');
    }

    // ─── Kullanıcı Sil ──────────────────────────────────────
    public function sil(array $payload, int $id): void {
        AuthMiddleware::rol_kontrol($payload, ['sahip']);
        $sirket_id = (int) $payload['sirket_id'];

        // Sahip kendini silemez
        if ($id === (int)$payload['sub']) {
            Response::hata('Kendi hesabınızı silemezsiniz', 403);
            return;
        }

        $hedef = $this->model->id_ile_bul($id);
        if (!$hedef || (int)$hedef['sirket_id'] !== $sirket_id) {
            Response::bulunamadi('Kullanıcı bulunamadı');
            return;
        }

        // Sahip rolüne sahip kullanıcı silinemez
        if ($hedef['rol'] === 'sahip') {
            Response::hata('Sahip rolündeki kullanıcı silinemez', 403);
            return;
        }

        $this->model->sil($id, $sirket_id);
        Response::basarili(null, 'Kullanıcı silindi');
    }

    // ─── Şifre Güncelle ─────────────────────────────────────
    public function sifreGuncelle(array $payload, int $id, array $girdi): void {
        AuthMiddleware::rol_kontrol($payload, ['sahip']);
        $sirket_id = (int) $payload['sirket_id'];

        if (empty($girdi['yeni_sifre'])) {
            Response::dogrulama_hatasi(['yeni_sifre' => 'Yeni şifre zorunludur']);
            return;
        }
        if (strlen($girdi['yeni_sifre']) < 8) {
            Response::dogrulama_hatasi(['yeni_sifre' => 'Şifre en az 8 karakter olmalıdır']);
            return;
        }

        $hedef = $this->model->id_ile_bul($id);
        if (!$hedef || (int)$hedef['sirket_id'] !== $sirket_id) {
            Response::bulunamadi('Kullanıcı bulunamadı');
            return;
        }

        $this->model->sifre_guncelle($id, $sirket_id, $girdi['yeni_sifre']);
        Response::basarili(null, 'Şifre güncellendi');
    }

    // ─── Yardımcı: Yetkiler JSON Doğrulama ──────────────────
    // Dizi veya obje gelirse doğrular, JSON string döner.
    // Boş/null gelirse dashboard içeren default döner.
    // Geçersiz modül adı varsa false döner.
    private function _yetkileriDogrula($yetkiler): string|false|null {
        if (empty($yetkiler)) {
            // Minimum: sadece dashboard
            return json_encode(['moduller' => ['dashboard']]);
        }

        // Frontend obje gönderebilir: {'moduller': [...]}
        if (is_array($yetkiler)) {
            $moduller = $yetkiler['moduller'] ?? $yetkiler;
        } else {
            // JSON string gelmişse decode et
            $decoded = json_decode($yetkiler, true);
            $moduller = $decoded['moduller'] ?? (is_array($decoded) ? $decoded : []);
        }

        // dashboard her zaman zorunlu
        if (!in_array('dashboard', $moduller, true)) {
            $moduller[] = 'dashboard';
        }

        // Geçersiz modül adı var mı?
        foreach ($moduller as $m) {
            if (!in_array($m, self::IZINLI_MODULLER, true)) {
                return false;
            }
        }

        return json_encode(['moduller' => array_values(array_unique($moduller))]);
    }
}
