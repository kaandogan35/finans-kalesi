# PROJE.md — ParamGo (Finans Kalesi) Durum ve Yol Haritasi
# Son Guncelleme: 29 Mart 2026

---

## GUNCEL DURUM: Asama 5 — Mobil Uygulama Hazirlik

Web MVP tamamlandi. Store'lara cikmadan once eksik moduller, guvenlik ve UX iyilestirmeleri yapilacak.

**Canli site:** https://paramgo.com/
**Aktif tema:** ParamGo (tek tema — banking/earthy/dark silindi)

---

## SQL KURALI
Veritabani degisikligi gerektiren her islemde SQL kodu mesajda verilir.
Kaan bunu cPanel phpMyAdmin (hosting) ve Laragon (local) uzerinden kendisi calistirir.

---

## STRATEJIK KARARLAR (Degismez)

| Karar | Aciklama |
|-------|----------|
| Mobil Strateji | Capacitor.js — mevcut React kodu iOS/Android'e donusturulur |
| Tek Tema | ParamGo (.p- prefix) — diger temalar silindi |
| Odeme | Saglayici secimi beklemede (Iyzico / Param / Stripe) |
| Hedef | App Store + Google Play'e hazir rekabetci finans uygulamasi |

---

## TAMAMLANAN ASAMALAR

### Asama 1 — PHP REST API ✅ KILITLENDI
20 controller, 14 model, 19 route dosyasi. Degistirilmeden once onay istenir.

| Modul | Controller | Route | Endpoint |
|-------|-----------|-------|----------|
| Auth | AuthController.php | routes/auth.php | 7 |
| Cari Hesaplar | CariController.php | routes/cari.php | 12 |
| Cek / Senet | CekSenetController.php | routes/cek_senet.php | 7 |
| Odeme Takip | OdemeTakipController.php | routes/odeme.php | 6 |
| Kasa | KasaController.php | routes/kasa.php | 16 |
| Dashboard | DashboardController.php | routes/dashboard.php | 1 |
| Abonelik | AbonelikController.php | routes/abonelik.php | 5 |
| Sinir | SinirController.php | routes/sinir.php | 1 |
| Raporlar | RaporController.php | routes/raporlar.php | 7 |
| Kullanicilar | KullaniciController.php | routes/kullanicilar.php | 6 |
| Bildirimler | BildirimController.php | routes/bildirimler.php | 2 |
| Guvenlik | GuvenlikController.php | routes/guvenlik.php | 4 |
| Veresiye | VeresiyeController.php | routes/veresiye.php | 2 |
| Cron | CronController.php | routes/cron.php | 4 |
| Webhook | WebhookController.php | routes/abonelik.php | 3 |
| Kategoriler | KategoriController.php | routes/kategoriler.php | — |
| Tekrarlayan Islemler | TekrarlayanIslemController.php | routes/tekrarlayan_islem.php | — |
| Onboarding | OnboardingController.php | routes/onboarding.php | — |
| Turler | TurController.php | routes/tur.php | — |
| Ayarlar | AyarlarController.php | routes/ayarlar.php | — |

### Asama 2 — React Frontend ✅ TAMAMLANDI
38 sayfa bileseni, 19 API dosyasi, 3 store, 2 hook, 13 component. Tum moduller API'ye bagli.

### Asama 3 — Canliya Cikis ✅ TAMAMLANDI
Domain: paramgo.com | SSL aktif | PHP 8.4 | MariaDB canli

### Asama 4 — Abonelik & SaaS Altyapisi ✅ TAMAMLANDI (odeme haric)
- 4A: DB + Plan Sistemi ✅
- 4B: Backend API (PlanKontrol, SinirKontrol, Abonelik) ✅
- 4C: Frontend (KayitOl, PlanSecim, PlanYukseltModal, hook'lar) ✅
- 4D: Kullanim Sinirlari (25 cari, 10 cek/ay, 2 ay gecmis) ✅
- 4E: Odeme Entegrasyonu ⬜ → Asama 6'ya tasindi
- 4F: Upgrade Bildirimleri ✅

---

## YENI YOL HARITASI — Mobil Store Hazirlik

### Asama 5: Web Eksikleri & Guvenlik ← SIMDIKI ASAMA

#### 5A — Landing Page Guvenlik Duzeltmeleri
> Kaynak: `paramgo-landing/`

| # | Is | Oncelik | Durum |
|---|-----|---------|-------|
| 1 | Form backend entegrasyonu (FormSubmit.co) | YUKSEK | ⬜ |
| 2 | CDN SRI (integrity) attribute'lari | YUKSEK | ⬜ |
| 3 | Confetti versiyon standardizasyonu (v1.9.3) | YUKSEK | ⬜ |
| 4 | `target="_blank"` → `rel="noopener noreferrer"` (8 link) | ORTA | ⬜ |
| 5 | Schema.org logo yolu duzeltme | ORTA | ⬜ |
| 6 | Sitemap'e fiyatlar + destek ekleme | ORTA | ⬜ |
| 7 | Guvenlik basliklari (CSP, HSTS, Permissions-Policy) | ORTA | ⬜ |
| 8 | robots.txt guncelleme | ORTA | ⬜ |
| 9 | PNG → WebP optimizasyon (~37MB → ~5MB) | DUSUK | ⬜ |

#### 5B — Uygulama Guvenlik Tamamlama
> Kaynak: `finans-kalesi/`

| # | Is | Durum |
|---|-----|-------|
| 1 | 2FA (TOTP) implementasyonu | 🔶 Backend hazir (TOTPHelper.php), frontend eksik |
| 2 | Biometric login hazirligi (Capacitor sonrasi) | ⬜ |
| 3 | Session timeout UI bildirimi | ✅ OturumUyari.jsx |

#### 5C — Eksik Moduller (Rakip Analizi Sonucu)

Papara, YNAB, PocketGuard, Spendee, Wallet analiz edildi. Store rekabeti icin:

| # | Modul | Aciklama | Durum |
|---|-------|----------|-------|
| 1 | Tekrarlayan Islemler | Kira, maas, abonelik otomatik kayit | ✅ Backend + Frontend tamamlandi |
| 2 | Kategori Yonetimi | Gelir/gider kategorileri (ozellestirilebilir) | ✅ Backend + Frontend tamamlandi |
| 3 | Butce Planlama | Aylik kategori bazli butce + takip | ⬜ |
| 4 | Gelir/Gider Grafikler | Trend grafikleri, pasta grafik, karsilastirma | ⬜ |
| 5 | Disa Aktarma Gelistirme | Tum modullerden CSV/Excel/PDF | ⬜ |
| 6 | Arama & Filtreleme | Global arama, gelismis filtreler | ⬜ |
| 7 | Veri Ice Aktarma | Excel/CSV'den toplu veri yukleme | ⬜ |

#### 5D — UX Iyilestirmeleri (Store Kalitesi)

| # | Is | Durum |
|---|-----|-------|
| 1 | Bos durum (empty state) ekranlari | ✅ EmptyState.jsx |
| 2 | Skeleton loading animasyonlari | ⬜ |
| 3 | Pull-to-refresh (mobil) | ⬜ |
| 4 | Swipe gesture (silme, durum degistirme) | ✅ SwipeCard.jsx |
| 5 | Onboarding wizard (ilk giris rehberi) | ✅ Onboarding.jsx + OnboardingController |
| 6 | Offline banner ("Baglanti yok") | ⬜ |

---

### Asama 6: Odeme Entegrasyonu

| # | Is | Durum |
|---|-----|-------|
| 1 | Odeme saglayici secimi (Iyzico / Param / Stripe) | ⬜ |
| 2 | Web odeme akisi (checkout → webhook → plan guncelle) | ⬜ |
| 3 | Apple IAP entegrasyonu | ⬜ |
| 4 | Google Play Billing entegrasyonu | ⬜ |
| 5 | Fatura/makbuz olusturma | ⬜ |

---

### Asama 7: Capacitor.js Entegrasyonu

| # | Is | Durum |
|---|-----|-------|
| 1 | Capacitor CLI + proje init | ⬜ |
| 2 | iOS + Android platform ekleme | ⬜ |
| 3 | capacitor.config.ts yapilandirma | ⬜ |
| 4 | Native plugin entegrasyonu (Camera, Haptics, Push, StatusBar) | ⬜ |
| 5 | Deep link yapilandirma | ⬜ |
| 6 | Splash screen + app icon tasarimi | ⬜ |
| 7 | iOS build + test | ⬜ |
| 8 | Android build + test | ⬜ |
| 9 | Push notification altyapisi (FCM + APNs) | ⬜ |

---

### Asama 8: Offline & Performans

| # | Is | Durum |
|---|-----|-------|
| 1 | Service Worker + PWA manifest | ⬜ |
| 2 | IndexedDB ile offline islem kuyruklama | ⬜ |
| 3 | Lazy loading (code splitting) | ⬜ |
| 4 | Image/asset optimizasyonu | ⬜ |
| 5 | API response caching | ⬜ |

---

### Asama 9: Store Hazirlik & Yayinlama

#### 9A — App Store (iOS)
| # | Is | Durum |
|---|-----|-------|
| 1 | Apple Developer hesabi (Organization — $99/yil) | ⬜ |
| 2 | App Store Connect'te uygulama olusturma | ⬜ |
| 3 | Gizlilik politikasi sayfasi (paramgo.com/gizlilik) | ⬜ |
| 4 | Kullanim kosullari sayfasi | ⬜ |
| 5 | App Store ekran goruntuleri (6.7", 6.5", 5.5", iPad) | ⬜ |
| 6 | App Store aciklamasi + anahtar kelimeler (TR + EN) | ⬜ |
| 7 | TestFlight beta testi | ⬜ |

#### 9B — Google Play Store
| # | Is | Durum |
|---|-----|-------|
| 1 | Google Play Developer hesabi ($25) | ⬜ |
| 2 | Financial Features Declaration formu | ⬜ |
| 3 | Data Safety bolumu | ⬜ |
| 4 | Play Store ekran goruntuleri + feature graphic | ⬜ |
| 5 | Closed/Open beta test | ⬜ |

#### 9C — Hukuki & Uyumluluk
| # | Is | Durum |
|---|-----|-------|
| 1 | KVKK uyumluluk metni | ⬜ |
| 2 | Aydinlatma metni | ⬜ |
| 3 | Acik riza formu | ⬜ |
| 4 | Cerez politikasi | ⬜ |

---

### Asama 10: Landing Page Guncellemeleri

| # | Is | Durum |
|---|-----|-------|
| 1 | Gercek store linkleri (APP_STORE_LINK, PLAY_STORE_LINK) | ⬜ |
| 2 | Gercek WhatsApp numarasi | ⬜ |
| 3 | App download bolumu + QR kod | ⬜ |
| 4 | Gizlilik politikasi sayfasi (gizlilik.html) | ⬜ |
| 5 | Kullanim kosullari sayfasi | ⬜ |
| 6 | KVKK aydinlatma metni sayfasi | ⬜ |

---

### Asama 11: Buyume & Gelismis Ozellikler (Post-Launch)

| # | Ozellik | Aciklama |
|---|---------|----------|
| 1 | Canli doviz/altin kurlari | TCMB veya ucuncu parti API |
| 2 | Banka entegrasyonu | Open Banking API |
| 3 | OCR ile cek/senet tarama | Kamera ile otomatik veri okuma |
| 4 | e-Fatura yonetimi | GIB entegrasyonu |
| 5 | Cok dilli destek | Ingilizce + Arapca |
| 6 | Yapay zeka onerileri | Harcama analizi, nakit akis tahmini |
| 7 | WhatsApp bildirim | Otomatik hatirlatmalar |
| 8 | Widget destegi | iOS/Android ana ekran widget'lari |

---

## GUNCEL DOSYA YAPISI

```
finans-kalesi/
├── config/
│   ├── app.php
│   └── database.php
├── controllers/ (20 dosya)
│   ├── AbonelikController.php
│   ├── AuthController.php
│   ├── AyarlarController.php
│   ├── BildirimController.php
│   ├── CariController.php
│   ├── CekSenetController.php
│   ├── CronController.php
│   ├── DashboardController.php
│   ├── GuvenlikController.php
│   ├── KasaController.php
│   ├── KategoriController.php
│   ├── KullaniciController.php
│   ├── OdemeTakipController.php
│   ├── OnboardingController.php
│   ├── RaporController.php
│   ├── SinirController.php
│   ├── TekrarlayanIslemController.php
│   ├── TurController.php
│   ├── VeresiyeController.php
│   └── WebhookController.php
├── middleware/ (5 dosya)
│   ├── AuthMiddleware.php
│   ├── CorsMiddleware.php
│   ├── PlanKontrol.php
│   ├── SinirKontrol.php
│   └── YetkiKontrol.php
├── models/ (14 dosya)
│   ├── Abonelik.php
│   ├── Bildirim.php
│   ├── CariHareket.php
│   ├── CariKart.php
│   ├── CekSenet.php
│   ├── Guvenlik.php
│   ├── Kasa.php
│   ├── Kategori.php
│   ├── Kullanici.php
│   ├── OdemeTakip.php
│   ├── Rapor.php
│   ├── Sirket.php
│   ├── TekrarlayanIslem.php
│   └── Veresiye.php
├── routes/ (19 dosya)
│   ├── abonelik.php
│   ├── auth.php
│   ├── ayarlar.php
│   ├── bildirimler.php
│   ├── cari.php
│   ├── cek_senet.php
│   ├── cron.php
│   ├── dashboard.php
│   ├── guvenlik.php
│   ├── kasa.php
│   ├── kategoriler.php
│   ├── kullanicilar.php
│   ├── odeme.php
│   ├── onboarding.php
│   ├── raporlar.php
│   ├── sinir.php
│   ├── tekrarlayan_islem.php
│   ├── tur.php
│   └── veresiye.php
├── utils/ (12 dosya)
│   ├── BildirimOlusturucu.php
│   ├── JWTHelper.php
│   ├── KriptoHelper.php
│   ├── MailHelper.php
│   ├── MailSablonlar.php
│   ├── RateLimiter.php
│   ├── Response.php
│   ├── SistemKripto.php
│   ├── SistemLog.php
│   ├── SmtpHelper.php
│   ├── TOTPHelper.php
│   └── WhatsappHelper.php
├── cron/
│   ├── .htaccess
│   └── vade-uyari-cron.php
├── database/
│   ├── finans_kalesi_schema.sql (20 tablo)
│   └── migration_*.sql (6 migration dosyasi)
├── frontend/src/
│   ├── api/ (19 dosya — auth, axios, abonelik, ayarlar, bildirimler, cariler, cekSenet, dashboard, guvenlik, kasa, kategori, kullanicilar, odeme, onboarding, raporlar, sinir, tekrarlayanIslem, tur, veresiye)
│   ├── components/ (15 dosya)
│   │   ├── layout/
│   │   │   ├── AppLayoutParamGo.jsx (tek aktif layout)
│   │   │   ├── KorunanSayfa.jsx
│   │   │   ├── ModulKoruma.jsx
│   │   │   └── TemaLayout.jsx
│   │   ├── ui/ (DateInput, DateRangePicker)
│   │   ├── BildirimZili.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── GuvenlikKoruyucu.jsx (biyometrik kilit + jailbreak tespiti)
│   │   ├── KvkkOnay.jsx (KVKK ilk acilis onay ekrani)
│   │   ├── OturumUyari.jsx
│   │   ├── PlanYukseltModal.jsx
│   │   ├── SwipeCard.jsx
│   │   └── UpgradeBildirim.jsx
│   ├── utils/ (haptics.js — titresim feedback)
│   ├── pages/ (39 JSX, 16 klasor)
│   │   ├── auth/ (GirisYap, KayitOl, SifreSifirla)
│   │   ├── dashboard/Dashboard.jsx
│   │   ├── cariler/ (CariYonetimi, CarilerListesi)
│   │   ├── cek-senet/CekSenet.jsx
│   │   ├── kasa/ (VarlikKasa, GostergePaneli, AylikBilanco, GelirGiderSayfasi, OrtakCarisi, YatirimKalesi + components/)
│   │   ├── gelirler/Gelirler.jsx
│   │   ├── giderler/Giderler.jsx
│   │   ├── odeme-takip/OdemeTakip.jsx
│   │   ├── vade-hesaplayici/VadeHesaplayici.jsx
│   │   ├── tekrarlayan-islemler/TekrarlayanIslemler.jsx
│   │   ├── onboarding/Onboarding.jsx
│   │   ├── abonelik/PlanSecim.jsx
│   │   ├── kullanicilar/ (KullaniciYonetimi, KullaniciModal, SifreGuncelleModal)
│   │   ├── ayarlar/TemaSecimi.jsx
│   │   ├── guvenlik/GuvenlikEkrani.jsx
│   │   ├── bildirimler/BildirimlerEkrani.jsx
│   │   ├── raporlar/ (RaporlarEkrani, GenelOzet, NakitAkis, CariYaslandirma, OdemeOzet, CekPortfoy, RaporGecmisi)
│   │   └── veresiye/ (VeresiyeListesi, VeresiyeDetay)
│   ├── hooks/ (usePlanKontrol, useSinirler)
│   ├── stores/ (authStore, bildirimStore, temaStore)
│   ├── logo/ParamGoLogo.jsx
│   ├── lib/ (temaRenkleri, temaPrefix)
│   ├── temalar/paramgo.css (tek aktif tema)
│   ├── App.jsx
│   └── main.jsx
├── public/
│   ├── index.php (tek giris noktasi)
│   ├── .htaccess
│   ├── .well-known/ (apple-app-site-association, assetlinks.json)
│   ├── gizlilik.html
│   ├── destek.html
│   ├── kullanim-sartlari.html
│   └── frontend-build/
├── frontend/ios/ (Capacitor iOS projesi)
├── frontend/android/ (Capacitor Android projesi)
├── .env / .env.example
├── CLAUDE.md
├── PROJE.md
└── MOBIL-GECIS-PLANI.md (45 gorev, mobil store yol haritasi)
```

---

## TEKNOLOJI YIGINI

| Katman | Teknoloji | Versiyon |
|--------|-----------|---------|
| Backend | PHP (Saf) | 8.4 |
| Veritabani | MariaDB | 10.5+ |
| Auth | Ozel JWT | access: 15dk, refresh: 7gun |
| Sifreleme | AES-256-GCM | KriptoHelper.php |
| Frontend | React + Vite | 19 / 7+ |
| Routing | React Router | v7 |
| State | Zustand | v5 |
| HTTP | Axios | v1 |
| UI | Bootstrap + Bootstrap Icons | 5.3 |
| Grafik | Chart.js + react-chartjs-2 | v4 |
| PDF | html2pdf.js | 0.14 |
| Excel | xlsx | 0.18 |
| Toast | sonner | v2 |
| Mobil | Capacitor.js | 8.3 (iOS + Android projesi hazir) |
| Biyometrik | @aparajita/capacitor-biometric-auth | v10 |
| Guvenli Storage | @capacitor/preferences | v8 |
| Hosting | cPanel Shared Hosting | paramgo.com |

---

## AKTIF TEKNIK BORCLAR

| # | Sorun | Oncelik |
|---|-------|---------|
| 1 | sonner toast Bootstrap disi — degerlendirilecek | DUSUK |
| 2 | ~~demo-renk-kontrast.html~~ ✅ Silindi (29 Mart 2026) | COZULDU |
| 3 | public/index-canli.php — canli sunucu giris noktasi (deploy dosyasi, KALACAK) | BİLGİ |
