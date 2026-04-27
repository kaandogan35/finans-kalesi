# CLAUDE.md — ParamGo Proje Anayasası
# Bu dosya her oturumun başında otomatik okunur. Tüm kurallar bağlayıcıdır.
# Son Güncelleme: 16 Nisan 2026 — v1.0.1 App Store'dan onay aldı ✅

---

## PROJE SAHİBİ
**Kaan Doğan** — Yazılım geliştirmeyen, işini büyütmek isteyen bir işletme sahibi.
- Her teknik terimi sade, anlaşılır Türkçe ile açıkla
- "Bu basit", "kolay", "hızlıca" gibi ifadeler kullanma — her iş emek ister
- Her dosya değişikliğinde ne yaptığını ve neden yaptığını kısaca açıkla
- Bir şeyden emin değilsen, tahmin etme — sor

---

## PROJE: PARAMGO (SaaS)
Çekle çalışan esnaf ve KOBİ'lere satılacak abonelik tabanlı finans takip yazılımı.
Niş: Çek + Kasa + Cari takibi — muhasebe bilgisi gerektirmeden.
Canlı: https://paramgo.com

**Hedef platformlar:** Web ✅ → iOS ✅ (v1.0 + v1.0.1 onaylandı) → Android (sırada)
**Tamamlanan modüller:** Cari + Çek/Senet + Ödeme Takip + Kasa + Vade Hesaplayıcı + Dashboard + Raporlar + Veresiye + Kategoriler + Tekrarlayan İşlemler + Onboarding + Bildirimler + Push (APNs) + Abonelik (Apple IAP + RevenueCat)
**Güncel durum:** v1.0.1 App Store'dan onay aldı ✅ — Welcome ekranları + PaywallModal + 7 gün trial + revenue leak koruması canlıda

---

## TEKNOLOJİ YIĞINI — KESİN VE DEĞİŞMEZ

### Backend
- **Dil:** PHP 8.4 (Saf PHP — Laravel, Slim, Symfony yasak)
- **Veritabanı:** PDO + MariaDB (utf8mb4_unicode_ci)
- **Auth:** Özel JWT — `JWTHelper.php` (access: 15 dk, refresh: 7 gün)
- **Şifreleme:** AES-256-GCM — `KriptoHelper.php` (V2 prefix)
- **Mimari:** REST API, MVC benzeri

### Frontend
- **Stack:** React 19 + Vite + React Router v7 + Zustand + Axios
- **UI:** Bootstrap 5.3 + Bootstrap Icons
- **YASAK:** Tailwind, Shadcn, Material UI, Ant Design, Lucide React

### Mobil
Capacitor 8 entegre ✅ — iOS + Android klasörleri aktif (com.paramgo.app)

### Deployment
- cPanel Shared Hosting — PHP 8.4 desteği deploy öncesi doğrulanacak
- Hassas veriler yalnızca `.env` dosyasında

---

## ⚠️ KRİTİK KURALLAR

### 1. Multi-Tenant Güvenlik
Her SQL sorgusunda `WHERE sirket_id = :sirket_id` zorunlu.
`sirket_id` JWT'den alınır, kullanıcı girdisinden asla alınmaz.

```php
// DOĞRU
$stmt = $pdo->prepare("SELECT * FROM tablo WHERE id = :id AND sirket_id = :sirket_id");
// YANLIŞ — yasak
$stmt = $pdo->prepare("SELECT * FROM tablo WHERE id = :id");
```

### 2. PHP Kuralları
- PDO + Prepared Statements zorunlu
- Hata mesajları production'da kapalı, `error_log()` ile loglanır
- `public/` klasöründe test/debug dosyası bırakılmaz

### 3. Frontend Kuralları
- Modallar yalnızca React `useState` ile açılıp kapanır
- `bootstrap.bundle.min.js` import edilmez
- Token yönetimi: Zustand store (`authStore.js`) — `localStorage` yasak
- Sayfa yönlendirme: React Router — `window.location` yasak

### 3b. CSS SINIF TUTARLILIĞI — KRİTİK KURAL
**Yeni CSS sınıfı icat etmek YASAKTIR.** Tüm bileşenler `paramgo.css`'te tanımlı sınıfları kullanmalıdır.

**Yeni bir bileşen yazarken şu adımları izle:**
1. Önce `paramgo.css`'i oku ve mevcut sınıfları bul
2. Benzer bir bileşen daha önce yazılmışsa, AYNI CSS sınıflarını kullan
3. Yeni bir sınıfa ihtiyaç varsa, ÖNCE `paramgo.css`'e tanımla, SONRA JSX'te kullan
4. Asla tanımsız sınıf kullanma — tarayıcı görmezden gelir ve görsel bozulur

**Modül bazlı CSS sınıf haritası (her modül kendi prefix'ini kullanır):**

| Bileşen Tipi | Sınıf Prefix'i | Örnek |
|-------------|----------------|-------|
| Sayfa yapısı | `p-page-*` | `p-page-root`, `p-page-header`, `p-page-title` |
| KPI kartları | `p-kpi-*` | `p-kpi-card`, `p-kpi-label`, `p-kpi-value`, `p-kpi-deco` |
| KPI hero/stat | `p-kpi-hero-*`, `p-kpi-stat-*` | `p-kpi-hero-body`, `p-kpi-stat-top` |
| Paneller | `p-panel-*` | `p-panel`, `p-panel-header`, `p-panel-title` |
| Modallar | `p-modal-*` | `p-modal-overlay`, `p-modal-box`, `p-mh-default` |
| Tablolar | `p-table` veya `p-cym-table` | `p-cym-th`, `p-cym-td`, `p-cym-tr` |
| Butonlar | `p-btn-*`, `p-cym-btn-*`, `p-cari-btn-*` | `p-btn-save`, `p-cym-btn-new` |
| Badge'ler | `p-badge-*`, `p-kasa-badge-*` | `p-badge-success`, `p-badge-vade` |
| Formlar | `p-kasa-input-*` | `p-kasa-input`, `p-kasa-input-label` |
| Cari modülü | `p-cari-*` | `p-cari-search-input`, `p-cari-menu-dropdown` |
| Çek/Senet | `p-cek-*`, `p-cym-*` | `p-cym-glass-card`, `p-cym-toolbar` |
| Kasa modülü | `p-kasa-*` | `p-kasa-glass-card`, `p-kasa-spinner` |
| Veresiye | `p-vry-*` | `p-vry-kpi`, `p-vry-kpi-value` |
| Layout | `p-sidebar`, `p-topbar`, `p-main` | `p-nav-btn`, `p-nav-active` |

**YASAK:** className'de `${p}-yeni-bir-sey` yazıp paramgo.css'te tanımlamamak.

### 4. Mobil Uyumluluk (Capacitor Hazırlığı)
- Sabit `px` yerine Bootstrap responsive sınıfları
- Tıklanabilir alanlar minimum 44x44px
- Tablolarda `table-responsive` wrapper zorunlu
- `localStorage` yasak → Zustand kullan
- `window.location` yasak → React Router kullan

### 5. Deployment Güvenliği
- Şifreler terminalde veya kodda açık yazılmaz
- `.env` Git'e eklenmez

### 5b. Deploy — Tüm Dosyalar WinSCP ile Manuel

**SFTP watcher ÇALIŞMIYOR.** Hiçbir dosya otomatik yüklenmiyor.
Her değişiklik sonrası Kaan'a WinSCP ile yükleme tablosu ver:

**Sunucu yolları:**
- Backend dosyaları → `/home/goparam/repositories/finans-kalesi/[aynı yol]`
- `public/index-canli.php` → `/home/goparam/public_html/index.php`
- `public/frontend-build/` → `/home/goparam/public_html/frontend-build/`
- `public/.htaccess` → `/home/goparam/public_html/.htaccess`

**Her değişiklik sonrası şu formatta bildir:**

| Yerel | Sunucu |
|-------|--------|
| `dosya/yolu` | `/home/goparam/hedef/yolu` |

### 5c. KRİTİK UYARI — index.php ve .htaccess

Aşağıdaki dosyalar değiştiğinde **her seferinde** Kaan'a açıkça uyarı ver, devam etme:

| Dosya | Sunucuda nereye? | Nasıl? |
|-------|-----------------|--------|
| `public/index-canli.php` | `public_html/index.php` | WinSCP ile manuel |
| `public/.htaccess` | `public_html/.htaccess` | WinSCP ile manuel |

**Uyarı formatı (geç, mutlaka yaz):**
> 🚨 MANUEL ADIM GEREKİYOR: `[dosya]` değişti.
> WinSCP ile `[kaynak]` → `[hedef]` yüklemeyi unutma!
> Bunu yapmadan site bozulabilir.

### 6. JSON Yanıt Formatı
```json
{"basarili": true, "veri": { ... }}
{"basarili": false, "hata": "mesaj"}
```

---

## AGENT YETENEKLERİ (SKILLS) — KULLANIM KURALLARI

`.claude/skills/` altındaki dosyalar ve sistem Skill'leri göreve özel protokollerdir.

---

### 🎨 OTOMATİK TETİKLENEN — Tasarım (Her Zaman)

Aşağıdaki anahtar kelimelerden **herhangi biri** mesajda geçiyorsa **iki şey birlikte yapılır:**
1. `.claude/skills/react-bootstrap-ui.md` OKUNUR (React/Bootstrap teknik kuralları)
2. Sistem `frontend-design` Skill'i ÇAĞIRILIR (tasarım kalitesi ve yaratıcılık için)

> "jsx", "bileşen", "sayfa", "modal", "UI", "tasarım", "grafik",
> "KPI", "tutar", "renk", "tablo", "kart", "buton", "form", "stil"

**Ekstra tasarım yönergesi verilmemişse:** Aynı modülün mevcut `.jsx` dosyasını veya
en son tamamlanmış sayfayı referans al — aynı dil, aynı renk, aynı bileşen yapısı.

> **Aktif tasarım sistemi:** ParamGo v2 — Açık tema, emerald primary (#10B981), beyaz kartlar, #F8F9FA zemin.
> Teknik kurallar → `react-bootstrap-ui.md`
> Tasarım kalitesi → `frontend-design` Skill
>

---

### 🔧 SADECE AÇIK KOMUTLA TETİKLENEN — Diğer Skill'ler

Aşağıdaki skill'ler **yalnızca kullanıcı açıkça istediğinde** devreye girer.
Anahtar kelime geçse bile OTOMATİK ÇAĞRILMAZ:

| Skill / Dosya | Ne Zaman Kullan |
|--------------|-----------------|
| `php-api-gelistirici.md` | Kullanıcı "php skill", "api yaz", "controller" gibi açık komut verirse |
| `kod-temizligi-refactor.md` | Kullanıcı "refactor yap", "temizle", "canlıya çık" derse |
| `yeni-modul-ekle.md` | Kullanıcı "yeni modül ekle" derse |
| `sistem-analisti.md` | Kullanıcı "analiz et", "rapor ver" derse |

---

## KLASÖR YAPISI

```
finans-kalesi/
├── config/          app.php, database.php
├── controllers/     20 controller
├── middleware/       5 dosya (Auth, Cors, PlanKontrol, SinirKontrol, YetkiKontrol)
├── models/          14 model
├── routes/          19 route dosyası
├── utils/           14 dosya (JWT, Kripto, Mail, TOTP, Whatsapp, Push, RevenueCat vb.)
├── cron/            Zamanlanmış görevler
├── database/        Schema + 6 migration
├── public/          index.php, .htaccess, .well-known/, gizlilik/destek/kullanim-sartlari.html, frontend-build/
├── frontend/ios/    Capacitor iOS projesi (com.paramgo.app)
├── frontend/android/ Capacitor Android projesi (com.paramgo.app)
└── frontend/src/
    ├── api/         19 API dosyası (her modül ayrı)
    ├── components/  15 bileşen (layout, ui, ortak)
    ├── pages/       39 sayfa bileşeni, 16 klasör
    ├── stores/      3 store (auth, bildirim, tema)
    ├── hooks/       2 hook (usePlanKontrol, useSinirler)
    └── App.jsx      Route tanımları + AuthLogoutListener
```

---

## TAMAMLANAN BACKEND MODÜLLERİ ✅
21 controller, 14 model, 20 route. Değiştirilmeden önce onay istenir.

| Modül | Controller | Route |
|-------|-----------|-------|
| Auth | AuthController.php | routes/auth.php |
| Cari Hesaplar | CariController.php | routes/cari.php |
| Çek / Senet | CekSenetController.php | routes/cek_senet.php |
| Ödeme Takip | OdemeTakipController.php | routes/odeme.php |
| Kasa | KasaController.php | routes/kasa.php |
| Dashboard | DashboardController.php | routes/dashboard.php |
| Abonelik (Apple IAP + RevenueCat) | AbonelikController.php | routes/abonelik.php |
| Sınır | SinirController.php | routes/sinir.php |
| Raporlar | RaporController.php | routes/raporlar.php |
| Kullanıcılar | KullaniciController.php | routes/kullanicilar.php |
| Bildirimler | BildirimController.php | routes/bildirimler.php |
| Push Token (APNs) | PushTokenController.php | routes/push_token.php |
| Güvenlik | GuvenlikController.php | routes/guvenlik.php |
| Veresiye | VeresiyeController.php | routes/veresiye.php |
| Kategoriler | KategoriController.php | routes/kategoriler.php |
| Tekrarlayan İşlemler | TekrarlayanIslemController.php | routes/tekrarlayan_islem.php |
| Onboarding | OnboardingController.php | routes/onboarding.php |
| Türler | TurController.php | routes/tur.php |
| Ayarlar | AyarlarController.php | routes/ayarlar.php |
| Cron | CronController.php | routes/cron.php |
| Webhook (RevenueCat) | WebhookController.php | routes/abonelik.php |