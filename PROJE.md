# PROJE.md — ParamGo Durum ve Yol Haritası
# Son Güncelleme: 14 Nisan 2026

---

## GÜNCEL DURUM: Post-Launch Optimizasyon

**Web:** Canlı — https://paramgo.com
**iOS:** v1.0 App Store'da yayında, v1.0.1 onaya gönderildi (14 Nisan 2026)
**Android:** Play Store başvurusu — henüz başlamadı

**Aktif tema:** ParamGo (tek tema — .p- prefix)

---

## SQL KURALI
Veritabanı değişikliği gerektiren her işlemde SQL kodu mesajda verilir.
Kaan bunu cPanel phpMyAdmin (canlı) ve Laragon (lokal) üzerinden kendisi çalıştırır.

---

## STRATEJİK KARARLAR (Değişmez)

| Karar | Açıklama |
|-------|----------|
| Mobil Strateji | Capacitor 8 — React kodu iOS/Android'e dönüştürülür |
| Tek Tema | ParamGo (.p- prefix) — diğer temalar silindi |
| Ödeme | Apple IAP + RevenueCat (iOS), Google Play Billing (Android — sırada), web için sağlayıcı açık |
| Hedef | App Store ve Google Play'de rekabetçi finans uygulaması |

---

## TAMAMLANAN AŞAMALAR

### Aşama 1 — PHP REST API ✅
21 controller, 14 model, 20 route dosyası. Değiştirilmeden önce onay istenir.

### Aşama 2 — React Frontend ✅
40+ sayfa bileşeni, 19 API dosyası, 3 store, 2 hook, 15 component. Tüm modüller API'ye bağlı.

### Aşama 3 — Canlıya Çıkış ✅
Domain: paramgo.com | SSL aktif | PHP 8.4 | MariaDB canlı

### Aşama 4 — Abonelik & SaaS Altyapısı ✅
- 4A: DB + Plan Sistemi ✅
- 4B: Backend API (PlanKontrol, SinirKontrol, Abonelik) ✅
- 4C: Frontend (KayitOl, PlanSecim, PlanYukseltModal, hook'lar) ✅
- 4D: Kullanım Sınırları (25 cari, 10 çek/ay, 2 ay geçmiş) ✅
- 4E: Ödeme Entegrasyonu → Apple IAP + RevenueCat ✅ (web için ayrı gerekiyor)
- 4F: Upgrade Bildirimleri ✅

### Aşama 5 — Web Eksikleri & Güvenlik ✅
- Landing page güvenlik düzeltmeleri ✅
- Uygulama güvenlik tamamlama (2FA backend hazır, frontend eksik) 🔶
- Eksik modüller: Tekrarlayan İşlemler ✅, Kategori Yönetimi ✅

### Aşama 6 — Ödeme Entegrasyonu ✅
- Apple IAP + RevenueCat 12.3.1 ✅
- Backend doğrulama (AbonelikController::iapDogrula) ✅
- Webhook handler (WebhookController) ✅
- Revenue leak koruması (Keep with original App User ID) ✅
- 7 gün free trial (Introductory Offer) ✅

### Aşama 7 — Capacitor 8 Entegrasyonu ✅
- iOS + Android platform eklendi ✅
- Native pluginler: Camera, Haptics, Push, StatusBar, Biometric, Preferences ✅
- iOS build + TestFlight ✅
- APNs push notification ✅
- Splash screen + app icon ✅

### Aşama 8 — Offline & Performans 🔶
- Service Worker silindi (SW problemleri nedeniyle) ✅
- Code splitting (Vite lazy loading) ✅
- IndexedDB offline kuyruklama — bekliyor ⬜
- API response caching — bekliyor ⬜

### Aşama 9 — Store Hazırlık & Yayınlama ✅
#### 9A — App Store (iOS)
- Apple Developer hesabı ✅
- App Store Connect uygulama ✅
- Gizlilik politikası + Kullanım koşulları sayfaları ✅
- Ekran görüntüleri ✅
- TestFlight beta testi ✅
- v1.0 App Store'da yayında ✅
- v1.0.1 submit edildi (14 Nisan 2026) ✅

#### 9B — Google Play Store ⬜
Henüz başlamadı. Plan dosyası: `PLAY-STORE-FINANCIAL-DECLARATION.md`

#### 9C — Hukuki & Uyumluluk ✅
- KVKK uyumluluk metni ✅
- Aydınlatma metni ✅
- Çerez politikası ✅

---

## DEVAM EDEN İŞLER

### 1.0.1 Sonrası Sıradakiler

| # | İş | Öncelik |
|---|-----|---------|
| 1 | v1.0.1 onay bekleme (14-16 Nisan 2026) | KRİTİK |
| 2 | Android Play Store başvurusu | YÜKSEK |
| 3 | Web ödeme entegrasyonu (Iyzico/Param) | ORTA |
| 4 | Bütçe planlama modülü | ORTA |
| 5 | Disa aktarma geliştirme (tüm modüller CSV/Excel/PDF) | ORTA |
| 6 | Veri içe aktarma (Excel/CSV toplu yükleme) | DÜŞÜK |
| 7 | 2FA frontend implementasyonu | DÜŞÜK |

### Post-Launch Büyüme Özellikleri (Aşama 11)

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | Canlı döviz/altın kurları | TCMB veya üçüncü parti API |
| 2 | OCR ile çek/senet tarama | Kamera ile otomatik veri okuma |
| 3 | e-Fatura yönetimi | GİB entegrasyonu |
| 4 | Çok dilli destek | İngilizce + Arapça |
| 5 | Yapay zeka önerileri | Harcama analizi, nakit akış tahmini |
| 6 | WhatsApp bildirim | Otomatik hatırlatmalar |
| 7 | Widget desteği | iOS/Android ana ekran widget'ları |

---

## GÜNCEL DOSYA YAPISI

```
finans-kalesi/
├── config/ (app.php, database.php)
├── controllers/ (21 dosya)
├── middleware/ (5 dosya)
├── models/ (14 dosya)
├── routes/ (20 dosya)
├── utils/ (14 dosya)
├── cron/ (vade-uyari-cron.php)
├── database/ (schema + 6+ migration)
├── public/ (index.php, index-canli.php, .htaccess, frontend-build/)
├── pazarlama/ (reklam/sosyal medya araçları)
├── frontend/
│   ├── src/ (React 19 + Vite)
│   │   ├── api/ (19 dosya)
│   │   ├── components/ (15+ dosya)
│   │   ├── pages/ (40+ JSX, 16+ klasör)
│   │   ├── hooks/, stores/, lib/, temalar/
│   │   └── App.jsx, main.jsx
│   ├── ios/ (Capacitor 8 — com.paramgo.app)
│   └── android/ (Capacitor 8 — com.paramgo.app)
├── _arsiv/ (eski plan/audit dosyaları)
├── CLAUDE.md (proje anayasası)
├── PROJE.md (bu dosya)
├── CANLI-DEPLOY.md (deploy rehberi)
├── APPSTORE-METADATA.md
├── PLAY-STORE-FINANCIAL-DECLARATION.md
└── SURUM-NOTLARI-1.0.1.md
```

---

## TEKNOLOJİ YIĞINI

| Katman | Teknoloji | Versiyon |
|--------|-----------|---------|
| Backend | PHP (Saf) | 8.4 |
| Veritabanı | MariaDB | 10.5+ |
| Auth | Özel JWT | access: 15dk, refresh: 7gün |
| Şifreleme | AES-256-GCM | KriptoHelper.php |
| Frontend | React + Vite | 19 / 7+ |
| Routing | React Router | v7 |
| State | Zustand | v5 |
| HTTP | Axios | v1 |
| UI | Bootstrap + Bootstrap Icons | 5.3 |
| Grafik | Chart.js + react-chartjs-2 | v4 |
| PDF | html2pdf.js | 0.14 |
| Excel | xlsx | 0.18 |
| Mobil | Capacitor | 8.3 |
| IAP | RevenueCat Capacitor | 12.3.1 |
| Biyometrik | @aparajita/capacitor-biometric-auth | v10 |
| Push | APNs (direkt) + Capacitor Push | v8 |
| CI/CD | Codemagic | ParamGo iOS Release workflow |
| Hosting | cPanel Shared Hosting | paramgo.com |

---

## AKTİF TEKNİK BORÇLAR

| # | Sorun | Öncelik |
|---|-------|---------|
| 1 | Web ödeme entegrasyonu (Iyzico/Param/Stripe seçimi) | ORTA |
| 2 | 2FA frontend tamamlama | DÜŞÜK |
| 3 | Android Play Store başvurusu | YÜKSEK |
| 4 | IndexedDB offline kuyruklama | DÜŞÜK |

---

## İLGİLİ DOKÜMANLAR

- `CLAUDE.md` → Proje anayasası, her oturumda otomatik okunur
- `CANLI-DEPLOY.md` → Deploy rehberi
- `SURUM-NOTLARI-1.0.1.md` → v1.0.1 sürüm notları
- `APPSTORE-METADATA.md` → App Store metadata
- `PLAY-STORE-FINANCIAL-DECLARATION.md` → Android Play Store beyanı
- `docs/APPLE-ABONELIK-ARASTIRMA.md` → Apple Subscription referans
- `_arsiv/` → Eski audit ve plan dosyaları (referans için saklandı)
