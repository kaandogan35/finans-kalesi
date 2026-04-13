# ParamGo — Yeni Abonelik Sistemi Planı

**Oluşturma tarihi:** 2026-04-13  
**Durum:** Planlandı — Uygulanmadı  
**Hedef:** Apple'ın onay sürecine takılmadan, dönüşüm oranı yüksek, free trial + otomatik yenileme sistemi  

---

## Apple Resmi Referanslar

| Kaynak | URL | Konu |
|--------|-----|------|
| Auto-Renewable Subscriptions | https://developer.apple.com/app-store/subscriptions/ | Genel abonelik politikası |
| Introductory Offers (App Store Connect) | https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions/ | Free trial tanımlama adımları |
| Implementing Introductory Offers (StoreKit) | https://developer.apple.com/documentation/storekit/implementing-introductory-offers-in-your-app | iOS kod implementasyonu |
| App Review Guideline 3.1.2 | https://developer.apple.com/app-store/review/guidelines/#payments | Abonelik kuralları |
| Human Interface Guidelines — In-App Purchase | https://developer.apple.com/design/human-interface-guidelines/in-app-purchase | Paywall UI kuralları |
| RevenueCat — Free Trials & Promo Offers | https://www.revenuecat.com/docs/subscription-guidance/subscription-offers | RevenueCat free trial yapılandırması |
| RevenueCat — Displaying Products | https://www.revenuecat.com/docs/getting-started/displaying-products | introPrice API kullanımı |
| RevenueCat — Eligibility Check | https://www.revenuecat.com/docs/subscription-guidance/subscription-offers#checking-eligibility | Trial eligibility API |

---

## Mevcut Sistem Analizi

### Mevcut Durum

**Çalışan parçalar:**
- RevenueCat SDK entegrasyonu (`@revenuecat/purchases-capacitor ^12.3.1`)
- iOS IAP satın alma akışı (`PlanSecim.jsx` — 796 satır)
- Backend doğrulama (`AbonelikController.php → iapDogrula()`)
- RevenueCat webhook alıcısı (`WebhookController.php`)
- Plan kontrol middleware (`PlanKontrol.php`)
- Entitlement hook (`usePlanKontrol.js`)
- Veritabanı şeması (`migration_abonelik_v2.sql`)
- Satın alımları geri yükleme butonu

**Mevcut sorunlar / eksikler:**
1. **30 günlük ücretsiz deneme** — Dönüşüm oranı çok düşük. Kullanıcı ödeme yapmadan 30 gün kullanıyor, sonra ayrılıyor.
2. **Paywall konumu yanlış** — Kullanıcı kendi isteğiyle `/abonelik` sayfasına gitmeli. Otomatik gösterim yok.
3. **Onboarding sonrası abonelik yok** — Onboarding biter, kullanıcı direkt dashboard'a düşer. Abonelik ekranı açılmaz.
4. **Trial introductory offer tanımlanmamış** — App Store Connect'te `introductory offer` tanımı yok (önceden kaldırıldı).
5. **`introPrice` kullanılmıyor** — Mevcut kod RevenueCat'in free trial alanlarını (`product.introPrice`) okuyup göstermiyor.
6. **Trial eligibility kontrolü yok** — Daha önce trial kullanan kullanıcıya aynı ekran gösteriliyor.
7. **Paywall'da legal linkler yok** — Gizlilik Politikası ve Kullanım Koşulları linki paywall ekranında yok (Apple 3.1.2 red sebebi).
8. **Fiyat hiyerarşisi hatalı** — "Ücretsiz" vurgusu çok büyük, fiyat küçük gösterilirse Apple reddeder.
9. **Demo hesabı yapılandırması belirsiz** — App Store reviewer içeriğe erişemezse red.

### Mevcut Dosya Yapısı

```
frontend/src/
├── pages/abonelik/PlanSecim.jsx       ← Paywall UI (796 satır) — GÜNCELLENECEK
├── pages/onboarding/Onboarding.jsx    ← Onboarding wizard — GÜNCELLENECEK
├── hooks/usePlanKontrol.js            ← Entitlement check — DEĞİŞMEYECEK
├── stores/authStore.js                ← Plan güncelleme — KÜÇÜK DEĞİŞİKLİK
└── lib/capacitorInit.js               ← RevenueCat başlatma — DEĞİŞMEYECEK

controllers/AbonelikController.php     ← iapDogrula() — KÜÇÜK DEĞİŞİKLİK
models/Abonelik.php                    ← DENEME_SURESI_GUN değişecek
```

---

## Hedef Sistem Tanımı

### Kullanıcı Akışı (Adım Adım)

```
1. Kullanıcı App Store'dan ParamGo'yu indirir (ücretsiz)
2. Uygulamayı açar → Giriş/Kayıt ekranı
3. Mail ile kayıt olur veya giriş yapar
4. Onboarding açılır (3 adım: işletme bilgisi, ilk müşteri, ilk işlem)
5. Onboarding tamamlanır veya "Geç" butonuna basılır
   ↓
6. OTOMATİK OLARAK PaywallModal açılır (tam ekran, kapatılamaz*)
7. Ekranda görünen:
   ─────────────────────────────────────
   [Plan adı: Standart]
   399 TL / ay  ← BÜYÜK YAZILI
   İlk 7 gün ücretsiz  ← alt yazı
   ─────────────────────────────────────
   [7 Gün Ücretsiz Başlat]  ← Ana buton
   [Satın Alımları Geri Yükle]  ← Alt link
   [Gizlilik Politikası] [Kullanım Koşulları]  ← Küçük linkler
   ─────────────────────────────────────
8. Kullanıcı "7 Gün Ücretsiz Başlat"a basar
9. Apple'ın standart ödeme sayfası açılır (Face ID ile onaylanır)
10. Trial başlar — 7 gün boyunca para çekilmez
11. Kullanıcı uygulamayı tam özellikli kullanır
    ↓
12a. 7. gün sonunda kullanıcı iptal etmezse → Apple otomatik 399 TL çeker
12b. 7 gün içinde iOS Ayarlar > Abonelikler'den iptal ederse → hiç çekilmez
```

*Reviewer için kapatma butonu — sonraki bölümde detaylandırıldı.

### Değişmeyecek Parçalar

- RevenueCat SDK yapılandırması ve başlatma mekanizması
- Backend iapDogrula() akışı
- Webhook altyapısı
- usePlanKontrol.js entitlement sistemi
- Veritabanı şeması (sadece DENEME_SURESI_GUN değişir)
- Tüm diğer uygulama modülleri

---

## Uygulama Aşamaları

---

### AŞAMA 1 — App Store Connect Yapılandırması

> Bu adım kod yazmadan önce yapılmalı. RevenueCat bu bilgiyi App Store'dan çeker.

**Adımlar:**

1. App Store Connect → Apps → ParamGo → Sol menü: **Subscriptions**
2. Subscription Groups → Mevcut grup → `com.paramgo.app.standart.aylik` ürününe tıkla
3. **Subscription Prices** bölümüne git → **"Set up Introductory Offer"** butonuna bas
4. Ayarlar:
   - Ülkeler: Tümünü seç (Türkiye dahil)
   - Başlangıç tarihi: Bugün
   - Bitiş tarihi: Boş (süresiz)
   - Offer type: **Free**
   - Süre: **7 gün** (1 week)
5. Confirm ve kaydet

**Aynı işlemi şu ürünler için tekrarla:**
- `com.paramgo.app.standart.aylik` ← Öncelikli (ana paket)
- `com.paramgo.app.standart.yillik`
- `com.paramgo.app.kurumsal.aylik`
- `com.paramgo.app.kurumsal.yillik`

**Kritik kurallar:**
- Bir introductory offer tanımlandıktan sonra **düzenlenemez** — silip yeniden oluşturman gerekir
- Aynı subscription group içinde herhangi bir plan için trial kullanan kullanıcı, diğer planlar için de artık trial alamaz
- Sandbox'a yansıması 1 saat, production'a 24 saat sürebilir

---

### AŞAMA 2 — Veritabanı Değişikliği

**Dosya:** `models/Abonelik.php`

```php
// ESKİ:
const DENEME_SURESI_GUN = 30;

// YENİ:
const DENEME_SURESI_GUN = 7;
```

**Neden:** Mevcut "30 gün ücretsiz deneme" kaldırılıyor. Yerine Apple'ın 7 günlük trial sistemi geliyor. Backend'deki deneme süresi de buna uyumlu olmalı.

**Not:** Mevcut aktif "deneme" planındaki kullanıcılar için migration gerekip gerekmediğine karar verilmeli. Yeni kayıtlar 7 günlük olacak.

---

### AŞAMA 3 — PaywallModal Bileşeni (Yeni Dosya)

**Dosya:** `frontend/src/pages/abonelik/PaywallModal.jsx` (YENİ)

Bu bileşen tam ekran, kapatılamaz bir modal olacak. Mevcut `PlanSecim.jsx`'ten farklı — bu sayfa kendi isteğiyle gelinebilir, modal ise zorla gösterilir.

**Bileşenin yapması gerekenler:**

```
1. Açıldığında getOfferings() çağır
2. standart aylık paketi bul (com.paramgo.app.standart.aylik)
3. product.introPrice kontrolü:
   - introPrice != null VE introPrice.price === 0 → "7 Gün Ücretsiz" göster
   - introPrice null ise → Normal fiyat göster
4. checkTrialOrIntroDiscountEligibility() çağır (iOS only):
   - ELIGIBLE → "7 Gün Ücretsiz Başlat" butonu göster
   - INELIGIBLE → "Abone Ol — 399 TL/ay" butonu göster
   - UNKNOWN → Normal fiyat göster (güvenli taraf)
5. Buton tıklanınca purchasePackage() tetikle
6. Başarılı olursa iapDogrula() backend çağrısı
7. Modal kapan, kullanıcı dashboard'a geç
```

**UI Zorunlu Elementler (Apple 3.1.2):**

```jsx
{/* Ana fiyat — büyük ve net */}
<h2>399 TL / ay</h2>

{/* Trial bilgisi — küçük, alt metin */}
{introEligible && <p>İlk 7 gün ücretsiz — istediğiniz zaman iptal edin</p>}

{/* Ana buton */}
<button>{introEligible ? '7 Gün Ücretsiz Başlat' : 'Abone Ol'}</button>

{/* Zorunlu: Geri yükleme */}
<button onClick={satinAlimlarıGeriYukle}>Satın Alımları Geri Yükle</button>

{/* Zorunlu: Legal linkler */}
<a href="https://paramgo.com/gizlilik">Gizlilik Politikası</a>
<a href="https://paramgo.com/kullanim-kosullari">Kullanım Koşulları</a>
```

**Reviewer için kapatma (çok önemli):**

Apple reviewer'lar satın alma yapamaz. Eğer modal kapatılamazsa reviewer uygulamayı test edemez ve "App Completeness" (Guideline 2.1) ile reddeder.

Çözüm:
- Modal'in sağ üstünde küçük bir "×" butonu — ama sadece App Store Connect'te tanımlı demo hesabı giriş yapmışsa göster
- Alternatif: Modal'i 3. ekrana gelindiğinde değil, 2. ekranda göster ve ilk açılışta küçük bir "Şimdi değil, ilerle" linki koy (görünür ama küçük)

**Önerilen yaklaşım:** "Şimdi değil, ilerle" linki koy. Bu Apple'ın da önerdiği yaklaşım — kullanıcı zorlanamaz, ama paywall gösterilmeli.

```jsx
{/* Alt, küçük, gri link */}
<button style={{color: '#999', fontSize: 12}}>
  Şimdi değil, ilerle
</button>
```

---

### AŞAMA 4 — Onboarding'e Paywall Bağlantısı

**Dosya:** `frontend/src/pages/onboarding/Onboarding.jsx`

**Mevcut son satır (tamamlama kısmı):**
```javascript
// onboardingTamamla() çağrılır → dashboard'a yönlenir
```

**Yeni akış:**
```javascript
// Onboarding tamamlandıktan sonra:
onboardingTamamla()
// Ardından PaywallModal aç (dashboard'a geçmeden önce)
setPaywallAcik(true)
```

**Implementasyon:**
```jsx
// Onboarding.jsx'e eklenecek state
const [paywallAcik, setPaywallAcik] = useState(false)

// Tamamlama fonksiyonu
const tamamla = async () => {
  await onboardingTamamla()
  // Native platformda PaywallModal aç
  if (Capacitor.isNativePlatform()) {
    setPaywallAcik(true)
  } else {
    navigate('/dashboard')
  }
}

// JSX'e ekle
{paywallAcik && (
  <PaywallModal
    onKapat={() => {
      setPaywallAcik(false)
      navigate('/dashboard')
    }}
    onBasarili={() => {
      setPaywallAcik(false)
      navigate('/dashboard')
    }}
  />
)}
```

**Not:** Web versiyonunda Apple IAP çalışmaz. Bu yüzden `Capacitor.isNativePlatform()` kontrolü zorunlu.

---

### AŞAMA 5 — PlanSecim.jsx Güncellemesi (Mevcut Abonelik Sayfası)

**Dosya:** `frontend/src/pages/abonelik/PlanSecim.jsx`

Bu sayfa silinmez — kullanıcı mevcut planını görmek, değiştirmek veya yükseltmek için kullanıyor. Ancak şu değişiklikler yapılmalı:

1. **introPrice desteği ekle** — Mevcut kullanıcıya da trial göster (eligibilitye göre)
2. **Fiyat hiyerarşisi düzelt** — Ana fiyat büyük, trial bilgisi küçük alt metin
3. **Legal linkler ekle** — Gizlilik + Kullanım Koşulları linki alt kısma
4. **Toggle paywall yok** — Mevcut kodda zaten toggle yok, doğrulama için kontrol et

---

### AŞAMA 6 — RevenueCat Dashboard Yapılandırması

> Kod değişikliği yok — sadece dashboard ayarı

1. RevenueCat Dashboard → ParamGo uygulaması
2. **Offerings** bölümüne git
3. Current Offering'in güncellenmesini bekle (App Store Connect'te tanımlanan trial otomatik yansır)
4. **Webhooks** bölümünde şu event'lerin aktif olduğunu doğrula:
   - `INITIAL_PURCHASE` ✓
   - `RENEWAL` ✓
   - `EXPIRATION` ✓
   - `CANCELLATION` ✓
   - `BILLING_ISSUE` ✓

---

### AŞAMA 7 — App Store Connect — Demo Hesabı

> Reviewer için kritik — yapılmazsa Guideline 2.1 red

1. App Store Connect → Apps → ParamGo → App Review
2. **App Review Information** → "Sign-in required" bölümü
3. Demo kullanıcı adı ve şifre gir (paramgo.com'da mevcut test hesabı)
4. Bu hesap için backend'de otomatik premium/deneme erişimi ver:
   - `AbonelikController.php` veya kayıt fonksiyonuna: eğer bu demo mail ise, `abonelik_plani = 'standart'` ve `abonelik_bitis` = 1 yıl sonrası yap
   - Ya da: App Store Connect'te "Manage" işaretli hesap → PaywallModal'da bu hesabı tanı ve "×" butonu göster

---

### AŞAMA 8 — Test ve Doğrulama

**Sandbox testi:**
1. Xcode → Ayarlar → Test hesabı tanımla (App Store Connect Sandbox Users'dan)
2. Simulator yerine fiziksel cihaz kullan (IAP simulator'da çalışmaz)
3. Onboarding'i tamamla → PaywallModal açılmalı
4. "7 Gün Ücretsiz Başlat"a bas → Apple payment sheet açılmalı
5. Sandbox hesabı ile onayla → Trial başlamalı
6. RevenueCat dashboard → Subscriber listesinde görünmeli
7. Backend `/api/abonelik/iap-dogrula` → plan güncellenmeli
8. Sandbox'ta "hızlanmış süre" ile 7 günü simüle et → Ücret kesilmeli
9. "Satın Alımları Geri Yükle" testi

**Kontrol listesi (onaydan önce):**
- [ ] App Store Connect'te 4 ürün için introductory offer tanımlı
- [ ] RevenueCat'te offerings doğru yansıdı
- [ ] PaywallModal açılıyor (onboarding sonrası otomatik)
- [ ] introPrice null kontrolü çalışıyor
- [ ] eligibility check doğru çalışıyor (daha önce trial kullanmış kullanıcı için)
- [ ] Fiyat büyük yazılı (399 TL / ay önde)
- [ ] "İlk 7 gün ücretsiz" alt metin
- [ ] Gizlilik Politikası linki tıklanabilir
- [ ] Kullanım Koşulları linki tıklanabilir
- [ ] "Satın Alımları Geri Yükle" butonu mevcut
- [ ] "Şimdi değil, ilerle" veya "×" kapatma seçeneği mevcut
- [ ] Başarılı satın alma → backend doğrulama → plan aktif
- [ ] Demo hesabı App Store Connect'te tanımlı
- [ ] Toggle paywall YOK (Apple 3.1.2 Ocak 2026 yasağı)

---

## Red Riski Analizi

| Risk | Severity | Önlem |
|------|----------|-------|
| Toggle paywall | KESİN RED | Yok — sabit gösterim |
| Legal linkler eksik | RED | Paywall'a eklendi |
| Fiyat küçük yazılı | RED | Hiyerarşi düzeltildi |
| Restore Purchases yok | RED | Mevcut, korunuyor |
| Demo hesabı yok | RED | Aşama 7'de ekleniyor |
| Paywall kapatılamıyor | RED | "Şimdi değil" linki |
| Eligibility kontrolü yok | Düşük (UX sorunu) | Aşama 3'te eklendi |

---

## Etkilenen Dosyalar Özeti

| Dosya | Değişim Türü | Öncelik |
|-------|-------------|---------|
| App Store Connect (4 ürün) | Introductory offer ekle | 1 — İlk yapılacak |
| `models/Abonelik.php` | DENEME_SURESI_GUN: 30 → 7 | 2 |
| `pages/abonelik/PaywallModal.jsx` | Yeni bileşen oluştur | 3 |
| `pages/onboarding/Onboarding.jsx` | PaywallModal tetikle | 4 |
| `pages/abonelik/PlanSecim.jsx` | introPrice + legal linkler | 5 |
| App Store Connect (demo hesap) | Reviewer erişimi | 6 |
| RevenueCat Dashboard | Webhook doğrulama | 7 |

---

## Değişmeyecek Parçalar

Aşağıdaki dosyalara dokunma — çalışıyor, bozma:
- `lib/capacitorInit.js` — RevenueCat başlatma
- `hooks/usePlanKontrol.js` — Entitlement sistemi
- `controllers/AbonelikController.php` — iapDogrula() çalışıyor
- `controllers/WebhookController.php` — Webhook altyapısı çalışıyor
- `middleware/PlanKontrol.php` — Plan kısıtlama çalışıyor
- `stores/authStore.js` — Plan güncelleme çalışıyor
- `database/migration_abonelik_v2.sql` — Şema yeterli
- RevenueCat API key ve konfigürasyonu

---

## Notlar

- Web versiyonunda (tarayıcı) PaywallModal gösterilmez — Stripe entegrasyonu ayrı bir konu
- Android için ayrı Google Play ürünleri tanımlanması gerekiyor (şu an placeholder)
- Introductory offer bir kez kullanıldıktan sonra aynı kullanıcıya bir daha verilemez (Apple kısıtı)
- Sandbox'ta trial süreleri hızlandırılmıştır: 7 gün = birkaç dakika
