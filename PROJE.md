# PROJE.md — Finans Kalesi Canlı Durum ve Yol Haritası
# Son Güncelleme: 13 Mart 2026 — Oturum #9 (Sprint 2C-1 Tamamlandı)

---

## GÜNCEL DURUM: 🏗️ Sprint 2C — Çek/Senet Modülü Sırada
Token altyapısı temizlendi. Axios interceptor Zustand tabanlı yazıldı.
Sıradaki iş: Çek/Senet UI + API bağlantısı.

---

## STRATEJİK KARARLAR (Değişmez)

| Karar | Açıklama |
|-------|----------|
| Mobil Strateji | Capacitor.js — Web bittikten sonra mevcut React kodu iOS/Android'e dönüştürülür |
| Dashboard | En sona bırakıldı — tüm modüller tamamlandıktan sonra gerçek veriyle tasarlanacak |
| Canlıya Çıkış | Uygulama tamamen bitmeden canlıya çıkılmaz |
| Modül Sırası | Çek/Senet → Kasa → Ödemeler → Vade Hesaplayıcı → Dashboard |

---

## AŞAMA DURUMU

### Aşama 1 — PHP REST API ✅ TAMAMLANDI & KİLİTLENDİ
51 endpoint, 6 modül. Değiştirilmeden önce onay istenir.

---

### Aşama 2 — React Frontend 🏗️ DEVAM EDİYOR

#### Sprint 2A — Temizlik ✅ TAMAMLANDI
#### Sprint 2B — UI Standardizasyonu ✅ BÜYÜK ÖLÇÜDE TAMAMLANDI
> Dashboard sayfası (2B-4) kasıtlı olarak en sona bırakıldı.

#### Sprint 2C — API Entegrasyonu 🏗️ DEVAM EDİYOR

| Durum | Görev | Notlar |
|-------|-------|--------|
| ✅ | 2C-1: Axios Interceptor | localStorage → Zustand. window.location → CustomEvent + React Router. lucide-react kaldırıldı. |
| ✅ | 2C-2: Cari API | Mock veri silindi, gerçek backend bağlandı. |
| ⬜ | **2C-3: Çek/Senet UI + API** | Sayfa tasarımı + `api/cekSenet.js` — ŞU ANKİ GÖREV |
| ⬜ | 2C-4: Kasa UI + API | `VarlikKasa.jsx` başlanmış, tamamlanacak. `api/kasa.js` bağlanacak. |
| ⬜ | 2C-5: Ödemeler UI + API | Sayfa tasarımı + `api/odemeler.js` |

---

### Aşama 2D — Vade Hesaplayıcı ⬜ BEKLEMEDE
> Sprint 2C tamamen bitmeden başlanmaz. DB sütunları henüz yok.

| Durum | Adım |
|-------|------|
| ⬜ | DB tasarımı (`vade_hesaplamalari` tablosu) |
| ⬜ | Backend (yeni-modul-ekle.md skill'i okunarak) |
| ⬜ | Frontend — bağımsız sayfa |

---

### Aşama 2E — Dashboard ⬜ EN SONA BIRAKILDI
> Tüm modüller tamamlandıktan sonra gerçek kullanıcı verisine bakılarak tasarlanacak.
> Hangi metriğin önemli olduğuna o zaman karar verilecek.

---

### Aşama 3 — Canlıya Çıkış Hazırlığı ⬜ BEKLEMEDE

| Durum | Adım |
|-------|------|
| ⬜ | PHP 8.4 hosting desteği doğrula |
| ⬜ | Güvenlik denetimi (.env, .htaccess, hata mesajları kapalı) |
| ⬜ | `npm run build` → `dist/` cPanel'e yüklenir |
| ⬜ | Canlı ortam testi |
| ⬜ | PWA yapılandırması (manifest.json + service worker) |
| ⬜ | İlk müşteri pilot — Hırdavat Durağı / Yön Cıvata |

---

### Aşama 4 — Mobil (Capacitor.js) ⬜ Web kararlı olduktan sonra

| Durum | Adım |
|-------|------|
| ⬜ | Capacitor kurulumu |
| ⬜ | iOS build (Xcode + TestFlight) |
| ⬜ | Android build (Android Studio + Play Store beta) |
| ⬜ | Store yayını |

---

### Aşama 5 — Büyüme Modülleri ⬜ UZAK DÖNEM
Fatura/e-Fatura, Raporlama (PDF), Çoklu Kullanıcı (rol yönetimi)

---

## 📂 GÜNCEL DOSYA YAPISI

```
finans-kalesi/
├── config/
│   ├── app.php
│   └── database.php
├── controllers/
│   ├── AuthController.php       ✅
│   ├── CariController.php       ✅
│   ├── CekSenetController.php   ✅
│   ├── DashboardController.php  ✅
│   ├── KasaController.php       ✅
│   └── OdemeTakipController.php ✅
├── middleware/
│   ├── AuthMiddleware.php
│   └── CorsMiddleware.php
├── models/
│   ├── CariHareket.php, CariKart.php, CekSenet.php
│   ├── Kasa.php, Kullanici.php, OdemeTakip.php, Sirket.php
├── routes/
│   ├── auth.php, cari.php, cek_senet.php
│   ├── dashboard.php, kasa.php, odeme.php
├── utils/
│   ├── JWTHelper.php, KriptoHelper.php, RateLimiter.php
│   ├── Response.php, SistemKripto.php, SistemLog.php
├── public/
│   ├── index.php
│   ├── .htaccess
│   └── ⚠️ htaccess (noktasız kopya — silinecek)
├── frontend/
│   ├── dist/                    ✅ Build mevcut
│   └── src/
│       ├── api/
│       │   ├── auth.js          ✅
│       │   ├── axios.js         ✅ Interceptor yazıldı (Zustand + CustomEvent)
│       │   ├── cariler.js       ✅
│       │   ├── dashboard.js     ✅
│       │   ├── cekSenet.js      ⬜ Oluşturulacak (2C-3)
│       │   ├── kasa.js          ⬜ Oluşturulacak (2C-4)
│       │   └── odemeler.js      ⬜ Oluşturulacak (2C-5)
│       ├── components/layout/
│       │   ├── AppLayout.jsx    ✅
│       │   └── KorunanSayfa.jsx ✅
│       ├── pages/
│       │   ├── auth/GirisYap.jsx          ✅
│       │   ├── cariler/CariYonetimi.jsx   ✅ API bağlı
│       │   ├── cariler/CarilerListesi.jsx ✅
│       │   ├── dashboard/Dashboard.jsx    ✅ (UI en sona)
│       │   ├── kasa/VarlikKasa.jsx        ⚠️ Başlanmış, tamamlanacak
│       │   ├── cek-senet/                 ⬜ Oluşturulacak
│       │   ├── odemeler/                  ⬜ Oluşturulacak
│       │   └── vade-hesaplayici/          ⬜ Oluşturulacak
│       ├── stores/authStore.js   ✅ Zustand (accessToken + refreshToken)
│       ├── hooks/                (boş — temizlenebilir)
│       ├── lib/                  (boş — temizlenebilir)
│       ├── App.jsx               ✅ AuthLogoutListener eklendi
│       ├── App.css
│       └── main.jsx
├── .claude/skills/
│   ├── sistem-analisti.md        ✅
│   ├── php-api-gelistirici.md    ✅
│   ├── react-bootstrap-ui.md     ✅
│   ├── kod-temizligi-refactor.md ✅
│   └── yeni-modul-ekle.md        ✅
├── .env / .env.example
├── CLAUDE.md
└── PROJE.md
```

---

## 🛠️ TEKNOLOJİ YIĞINI

| Katman | Teknoloji | Versiyon |
|--------|-----------|---------|
| Backend | PHP (Saf) | 8.4 |
| Veritabanı | MariaDB | 10.5+ |
| DB Sürücüsü | PDO | — |
| Auth | Özel JWT | — |
| Şifreleme | AES-256-GCM | — |
| Frontend | React + Vite | 19 / 7+ |
| Routing | React Router | v7 |
| State | Zustand | v5 |
| HTTP | Axios | v1 |
| UI | Bootstrap + Bootstrap Icons | 5.3 |
| PDF | html2pdf.js | 0.14 |
| Toast | sonner | v2 (değerlendirilecek) |
| Mobil (gelecek) | Capacitor.js | — |
| Hosting | cPanel Shared Hosting | — |

---

## 🚨 AKTİF TEKNİK BORÇLAR

| # | Sorun | Öncelik |
|---|-------|---------|
| 1 | `public/htaccess` noktasız kopya | 🟡 Silinecek |
| 2 | `sonner` toast kütüphanesi Bootstrap dışı | 🟡 Değerlendirilecek |
| 3 | `hooks/` ve `lib/` boş klasörler | 🟢 Temizlenebilir |
| 4 | Çek/Senet, Kasa, Ödemeler sayfaları tamamlanmadı | 🟡 Sprint 2C |
| 5 | Vade Hesaplayıcı DB sütunları yok | 🟡 Sprint 2D |