# ParamGo — Sürüm Notları 1.0.1

**Yayın tarihi:** 2026-04-13
**Önceki sürüm:** 1.0
**Build:** 90+

---

## 📱 BÖLÜM 1 — Kullanıcıya Gösterilecek (App Store "What's New")

Bu metin TestFlight ve App Store'da son kullanıcıya görünür.
App Store Connect → App Store sekmesi → Version Information → **"What's New in This Version"** alanına kopyala.

---

```
✨ Yenilikler ve İyileştirmeler

• Premium sürüm eklendi — İlk 7 gün ücretsiz
• Yeni tanıtım ekranları: Çek takibi, kar/zarar analizi
  ve gerçek kâr hesaplama
• Sınırsız çek ve müşteri takibi Premium'la
• Daha hızlı ve akıcı kullanım
• Çeşitli hata düzeltmeleri ve iyileştirmeler
```

---

## 🔍 BÖLÜM 2 — Apple Reviewer İçin (App Review Notes)

Bu metin SADECE Apple inceleme ekibine görünür, kullanıcıya gösterilmez.
App Store Connect → Apps → ParamGo → App Store → Version → **"App Review Information"** → **Notes** alanına kopyala.

Not: İngilizce yazılmalı (Apple reviewer'ları tüm dilleri desteklemeyebilir).

---

```
Version 1.0.1 — Changes Summary

NEW FEATURES:

1. Welcome Screens (3-slide onboarding)
   - Shown after new user registration
   - Introduces: Bank check tracking, Profit/Loss analysis,
     Real cash position calculation
   - Can be skipped with "Skip" link in top right

2. Premium Subscription with 7-Day Free Trial
   - Auto-renewable monthly subscription
   - Product ID: com.paramgo.app.standart.aylik
   - Price: ₺399.99/month
   - Introductory Offer: 1 week free trial (eligible new users)
   - Configured in App Store Connect with Introductory Offer

3. Paywall (Guideline 3.1.2 compliant)
   - Displayed after onboarding
   - Dismissible via "Not now, later" link
   - "Restore Purchases" button available
   - Privacy Policy and Terms of Use links visible
   - Price clearly displayed as primary text (₺399.99/month)
   - Free trial info shown as secondary text when eligible
   - Auto-renewal terms disclosed at the bottom

4. Revenue Leak Protection
   - Backend synchronization with RevenueCat on every session
   - Transfer behavior: "Keep with original App User ID"
   - Prevents subscription sharing across multiple accounts

HOW TO TEST THE SUBSCRIPTION FLOW:

1. Register a new account (email + password, free)
2. Welcome screens appear (swipe through or tap "Skip")
3. Paywall appears showing "₺399,99 / ay" and "First 7 days free"
4. Options:
   a) Tap "7 Gün Ücretsiz Başlat" → Apple payment sheet opens
   b) Tap "Şimdi değil, daha sonra" → dismisses paywall

5. After dismissal:
   - User can browse all modules (read-only mode)
   - Any write action (add customer, add check) will
     re-trigger the paywall

6. Restore Purchases flow:
   - Tap "Satın Alımları Geri Yükle" on paywall
   - RevenueCat syncs with App Store for active subscriptions

IMPORTANT NOTES:

- This app is fully functional in view-only mode without a
  subscription. Users can browse all modules and see sample
  data. Subscription is only required for creating or editing
  financial records.

- Existing users (registered before 2026-04-13) are NOT forced
  into the paywall — they keep their existing 7-day free access.

- Web version (paramgo.com) does not show paywall — users get
  full 7-day trial without payment.

- All subscription management is handled via Apple's standard
  StoreKit flow through RevenueCat SDK.

DEMO ACCOUNT:
Username: [TODO: Demo hesabı bilgilerini ekle]
Password: [TODO: Demo şifresi]

TECHNICAL DETAILS:

- RevenueCat SDK 12.3.1 (Capacitor)
- Subscription Group: ParamGo Abonelik
- Webhook: https://paramgo.com/api/webhook/revenuecat
- Backend validation: iOS IAP receipt verified via RevenueCat REST API
- Bug fixes: CORS headers, toast notification handling,
  iOS Safari date parsing
```

---

## 🔧 BÖLÜM 3 — Teknik Değişiklik Listesi (İç Dökümantasyon)

Bu bölüm ekip içi referans içindir, Apple'a veya kullanıcıya gönderilmez.

### Yeni Dosyalar
- `frontend/src/pages/welcome/Welcome.jsx` — 3 swipe Welcome ekranı (SVG illustrations)
- `frontend/src/components/PaywallModal.jsx` — Apple IAP uyumlu paywall bileşeni
- `frontend/src/components/PaywallKoruyucu.jsx` — Global paywall event dinleyicisi
- `utils/RevenueCatHelper.php` — RevenueCat REST API senkronizasyon helper
- `ABONELIK-YENI-PLAN.md` — Abonelik sistemi plan dokümanı

### Backend Değişiklikleri
- `models/Abonelik.php` — DENEME_SURESI_GUN 30 → 7
- `models/Sirket.php` — olustur() onboarding_tamamlandi default = 1
- `controllers/AuthController.php` — yeni_sistem_kullanici flag, yeni_kayit flag
- `controllers/AbonelikController.php` — iapDogrula 404 sync, durum() RC sync
- `controllers/WebhookController.php` — TRANSFER event handler
- `controllers/KasaController.php` — 12 yazma metoduna PlanKontrol::yazmaKontrol
- `controllers/TekrarlayanIslemController.php` — 4 yazma metoduna PlanKontrol
- `middleware/PlanKontrol.php` — iOS/Web ayrımlı mantık, YENI_SISTEM_TARIHI eşiği
- `middleware/CorsMiddleware.php` — X-Platform header whitelist'e eklendi
- `public/index.php` + `public/index-canli.php` — RevenueCatHelper require
- `frontend/ios/App/App.xcodeproj/project.pbxproj` — MARKETING_VERSION 1.0 → 1.0.1

### Frontend Değişiklikleri
- `frontend/src/App.jsx` — /welcome route eklendi
- `frontend/src/api/axios.js` — X-Platform header + 403 PLAN_GEREKLI interceptor
- `frontend/src/pages/auth/KayitOl.jsx` — kayıt sonrası /welcome yönlendirme
- `frontend/src/pages/onboarding/Onboarding.jsx` — PaywallModal entegrasyonu
- `frontend/src/pages/abonelik/PlanSecim.jsx` — metin ve link güncellemeleri
- `frontend/src/components/UpgradeBildirim.jsx` — iOS Safari date parse fix, yeni metinler
- `frontend/src/components/PlanYukseltModal.jsx` — plan adı güncellemesi
- `frontend/src/components/ui/CenterAlert.jsx` — bildirim.bastirSonraki() metodu
- `frontend/src/components/layout/AppLayoutParamGo.jsx` — PaywallKoruyucu ekleme
- `frontend/src/hooks/usePlanKontrol.js` — PLAN_ADLARI güncellemesi

### Veritabanı
- SQL şema değişikliği YOK
- `sirketler.onboarding_tamamlandi` ve `sirketler.olusturma_tarihi` kolonları zaten mevcut

### RevenueCat Dashboard
- Transfer Behavior: "Keep with original App User ID" (production)
- Transfer Behavior (Sandbox): "Transfer to new App User ID"
- Webhook URL: https://paramgo.com/api/webhook/revenuecat (aktif)
- Apple Server Notifications URL: apply edildi

### Çözülen Kritik Hatalar
1. Dashboard'da yeni kullanıcılara yanlışlıkla "Deneme süreniz doldu" uyarısı
2. iOS Safari `new Date("2026-05-13 10:30:00")` = Invalid Date sorunu
3. CORS preflight reddetme — X-Platform header whitelist'te değildi
4. Revenue leak — aynı Apple ID ile birden fazla hesapta abonelik kullanımı
5. Sistem hatası toast'larının paywall yerine gösterilmesi
6. RevenueCat priceString sandbox'ta USD dönmesi → sabit TL

---

## 📝 BÖLÜM 4 — Sonraki Oturumlarda Eklenecekler

Bu alana kullanıcı (sen) ayrı oturumlarda yaptığın değişiklikleri not al.
Sürüm yayınlanmadan önce bu liste BÖLÜM 1 ve BÖLÜM 2'ye dahil edilmeli.

### 2026-04-14 — Swipe Navigasyon + iOS Push Bildirimleri

**Swipe Navigasyon (react-swipeable)**
- Tüm modüller arası geçiş parmak kaydırmasıyla yapılabilir (Instagram tarzı)
- Çek/Senet sayfasında bölge bazlı swipe: üst alan = modül değiştir, alt alan = sekme değiştir
- Kasa sayfasında swipe AppLayout üzerinden yönetiliyor (VarlikKasa kaldırıldı)
- Hassasiyet: delta 25px, swipeDuration 250ms
- Değiştirilen dosyalar: `frontend/src/components/layout/AppLayoutParamGo.jsx`, `frontend/src/pages/cek-senet/CekSenet.jsx`, `frontend/src/pages/kasa/VarlikKasa.jsx`

**iOS Push Bildirimleri (APNs)**
- `utils/PushHelper.php` — yeni dosya: APNs JWT (ES256) ile push gönderme
  - Token 55 dakika cache'lenir
  - HTTP 410 yanıtında geçersiz token otomatik devre dışı bırakılır
- `utils/BildirimOlusturucu.php` — push bildirimi 6. adım olarak eklendi
- `public/index.php` — PushHelper require eklendi
- `codemagic.yaml` — `App.entitlements`'a `aps-environment: production` eklendi
- `.env` — APNS_AUTH_KEY, APNS_KEY_ID, APNS_TEAM_ID eklendi

**Vade Uyarı Bildirimleri İyileştirme**
- `cron/vade-uyari-cron.php` — bildirim metinleri müşteri adı + tutar + tarih içeriyor
  - Örnek: `"50.000 ₺ · Yön Cıvata'dan alacak çekin yarın tahsil edilmeli"`
  - `cari_kisalt()` — müşteri adını max 15 karakter / 2 kelimeye kısaltır
  - `tarih_kisalt()` — tarihi "16 Nis" formatına çevirir
  - SQL sorguları `cariler` tablosunu JOIN ile çekiyor

---

## 📌 Deploy Checklist — 1.0.1 İçin

Bu sürümü App Store'a göndermeden önce tamamlanması gerekenler:

- [x] MARKETING_VERSION 1.0.1 olarak güncellendi
- [x] Codemagic build başarılı (build 90)
- [x] TestFlight'a yüklendi
- [ ] Dahili test tamamlandı (Welcome + Paywall + Revenue leak)
- [ ] App Review Notes doldurulduı (Bölüm 2)
- [ ] What's New metni doldurulduı (Bölüm 1)
- [ ] Demo hesap bilgisi eklendi (reviewer için)
- [ ] Ekran görüntüleri güncellendi (Welcome ekranları için yeni)
- [ ] Privacy Policy URL doğrulandı
- [ ] Terms of Use URL doğrulandı
- [ ] Submit for Review
