# CLAUDE.md — Finans Kalesi Proje Anayasası
# Bu dosya her oturumun başında otomatik okunur. Tüm kurallar bağlayıcıdır.
# Son Güncelleme: 15 Mart 2026 — Oturum #10

---

## PROJE SAHİBİ
**Kaan Doğan** — Yazılım geliştirmeyen, işini büyütmek isteyen bir işletme sahibi.
- Her teknik terimi sade, anlaşılır Türkçe ile açıkla
- "Bu basit", "kolay", "hızlıca" gibi ifadeler kullanma — her iş emek ister
- Her dosya değişikliğinde ne yaptığını ve neden yaptığını kısaca açıkla
- Bir şeyden emin değilsen, tahmin etme — sor

---

## PROJE: FİNANS KALESİ (SaaS)
KOBİ'lere (hırdavat, demir-çelik başta olmak üzere tüm sektörlere) satılacak
abonelik tabanlı finans yönetim yazılımı.

**Hedef platformlar:** Web → iOS → Android (Capacitor.js ile)
**MVP modülleri:** Cari + Çek/Senet + Ödeme Takip + Kasa + Vade Hesaplayıcı
**Dashboard:** En sona — tüm modüller bittikten sonra gerçek veriyle tasarlanacak.

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

### Mobil (Capacitor.js — Gelecek Aşama)
Web uygulaması kararlı olduktan sonra entegre edilir.
Şimdiki görev: Her bileşeni Capacitor uyumlu yaz.

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

### 4. Mobil Uyumluluk (Capacitor Hazırlığı)
- Sabit `px` yerine Bootstrap responsive sınıfları
- Tıklanabilir alanlar minimum 44x44px
- Tablolarda `table-responsive` wrapper zorunlu
- `localStorage` yasak → Zustand kullan
- `window.location` yasak → React Router kullan

### 5. Deployment Güvenliği
- Şifreler terminalde veya kodda açık yazılmaz
- `.env` Git'e eklenmez

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

> **Aktif tasarım sistemi:** Obsidian Vault koyu glassmorphism.
> Teknik kurallar → `react-bootstrap-ui.md`
> Tasarım kalitesi → `frontend-design` Skill
>
> **ESKİ (kullanılmaz):** `ikas-tasarim.md`

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
├── controllers/     Her modülün Controller'ı
├── middleware/      AuthMiddleware.php, CorsMiddleware.php
├── models/          Veritabanı sorguları burada
├── routes/          URL → Controller eşleştirmesi
├── utils/           JWTHelper, KriptoHelper, RateLimiter, Response, SistemLog
├── public/          index.php (tek giriş), .htaccess
└── frontend/src/
    ├── api/         Axios çağrıları (her modül ayrı dosya)
    ├── components/  Bootstrap bileşenleri
    ├── pages/       Tam sayfalar (her modül kendi klasöründe)
    ├── stores/      Zustand (authStore.js)
    └── App.jsx      Route tanımları + AuthLogoutListener
```

---

## TAMAMLANAN BACKEND MODÜLLERİ ✅
Değiştirilmeden önce onay istenir.

| Modül | Controller | Route |
|-------|-----------|-------|
| Auth | AuthController.php | routes/auth.php |
| Cari Hesaplar | CariController.php | routes/cari.php |
| Çek / Senet | CekSenetController.php | routes/cek_senet.php |
| Ödeme Takip | OdemeTakipController.php | routes/odeme.php |
| Kasa | KasaController.php | routes/kasa.php |
| Dashboard | DashboardController.php | routes/dashboard.php |