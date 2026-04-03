# ParamGo IAP Entegrasyonu — Kapsamlı Denetim Raporu

**Tarih:** 2026-04-03
**Denetim Kapsamı:** Backend + Frontend + Konfigürasyon + Apple/RevenueCat Araştırma

---

## DURUM ÖZETİ

| Kategori | Kritik | Orta | Düşük |
|----------|--------|------|-------|
| Backend | 2 | 4 | 3 |
| Frontend | 3 | 5 | 4 |
| Konfigürasyon | 1 | 2 | 0 |
| **TOPLAM** | **6** | **11** | **7** |

### Çözülen Sorunlar (bu oturumda)
- ✅ `X-Platform: ios` header kaldırıldı → 403 hatası çözüldü
- ✅ Level sıralaması düzeltildi (App Store Connect)
- ✅ Yeni hesapla kurumsal yıllık test → başarılı

### 1 Günlük Bitiş Tarihi — SORUN DEĞİL
TestFlight'ta Apple tüm abonelikleri 24 saatte bir yeniler (Aralık 2024 değişikliği).
Gerçek kullanıcılarda: deneme=30 gün, aylık=30 gün, yıllık=365 gün.

---

## KRİTİK BULGULAR (Hemen düzeltilmeli)

### K1. Webhook Auth Bypass — Herkes sahte webhook gönderebilir
**Dosya:** `WebhookController.php:54-63`
**Sorun:** `REVENUECAT_WEBHOOK_SECRET` tanımlı değilse imza doğrulaması tamamen atlanıyor. Herhangi biri `/api/webhook/revenuecat` endpoint'ine sahte event gönderip başka şirketin planını değiştirebilir.
**Düzeltme:** Secret yoksa tüm webhook isteklerini reddet.

### K2. PRODUCT_CHANGE event'i handle edilmiyor
**Dosya:** `WebhookController.php:144`
**Sorun:** Kullanıcı App Store ayarlarından plan değiştirirse (upgrade/downgrade) RevenueCat `PRODUCT_CHANGE` gönderir. Bu event `default` dalına düşüp loglanıp göz ardı ediliyor. DB güncellenmez.
**Düzeltme:** `PRODUCT_CHANGE` → `INITIAL_PURCHASE` / `RENEWAL` ile aynı bloğa ekle.

### K3. Satın alma başarılı + backend doğrulama başarısız = para kaybı riski
**Dosya:** `PlanSecim.jsx:129-147`
**Sorun:** Apple parayı çekti ama `iapDogrula` 3 denemede başarısız olursa kullanıcı sadece toast görür. Plan aktif olmaz, kalıcı kayıt tutulmaz.
**Düzeltme:** Başarısız durumda bekleyen IAP işlemini kaydet, sayfa açılışında otomatik tekrar dene.

### K4. revenueCatBaslat hatayı yutup sessizce dönüyor
**Dosya:** `capacitorInit.js:145-148`
**Sorun:** RC configure başarısız olsa bile fonksiyon reject etmez. Sonra `getOfferings()` configure edilmemiş SDK üzerinde çalışır → belirsiz hata.
**Düzeltme:** Başarısızlıkta `throw` etmeli veya `false` dönmeli.

### K5. 401 interceptor IAP akışında oturum sonlandırabilir
**Dosya:** `axios.js:76-81`
**Sorun:** IAP akışı uzun sürerse (StoreKit dialog + bekleme + retry ≈ 15+ sn) JWT süresi dolabilir. Token yenileme başarısız olursa kullanıcı çıkış yapar — parası ödenmiş ama oturumu kapanmış.
**Düzeltme:** `iapDogrula` çağrısından önce token geçerliliğini kontrol et.

### K6. Sandbox/production ayrımı yok
**Dosya:** `WebhookController.php` + `AbonelikController.php`
**Sorun:** TestFlight sandbox satın alımları gerçek abonelik olarak DB'ye kaydediliyor. Webhook'ta `environment` kontrolü yok.
**Düzeltme:** Webhook event'inde `environment === 'SANDBOX'` kontrolü ekle, sandbox işlemleri production DB'ye yazılmasın veya ayrı flag ile işaretlensin.

---

## ORTA SEVİYE BULGULAR

### O1. planGuncelle transaction kullanmıyor (race condition)
**Dosya:** `Abonelik.php:71-116`
**Sorun:** 3 ayrı SQL işlemi (pasife çek, yeni kayıt, sirketler güncelle) transaction olmadan çalışıyor. Eşzamanlı çağrıda (kullanıcı + webhook) çakışma olabilir.
**Düzeltme:** `BEGIN TRANSACTION` / `COMMIT` ekle.

### O2. Entitlements fallback'inde deneme_mi set edilmiyor
**Dosya:** `AbonelikController.php:262-284`
**Sorun:** Subscriptions bloğunda `deneme_mi` set ediliyor ama entitlements fallback'inde set edilmiyor. Trial döneminde sahte ödeme kaydı oluşabilir.
**Düzeltme:** Entitlements bloğuna da `$deneme_mi` ataması ekle.

### O3. Her çağrıda yeni abonelik + ödeme kaydı oluşuyor
**Dosya:** `AbonelikController.php:297`
**Sorun:** "Geri Yükle" veya retry'da `iapDogrula` her çağrıda yeni kayıt oluşturuyor. Aynı plan için gereksiz kayıtlar birikir.
**Düzeltme:** Mevcut aktif planı kontrol et, aynıysa yeni kayıt oluşturma. `referans_no` ile duplicate kontrolü yap.

### O4. Ödeme tutarı sabit tablodan, Apple'ın gerçek tutarından değil
**Dosya:** `AbonelikController.php:303` + `WebhookController.php:113`
**Sorun:** `Abonelik::FIYATLAR` sabitinden alınıyor. Apple farklı tutar tahsil edebilir (ülke farkı, komisyon).
**Düzeltme:** RevenueCat'in `price_in_purchased_currency` field'ini kullan.

### O5. Anonim/boş müşteri ID eşlemesi
**Dosya:** `WebhookController.php:73-84`
**Sorun:** RevenueCat bazen `$RCAnonymousID:xxx` gönderir. Regex sadece `sirket_\d+` kabul ediyor → anonim kullanıcıların RENEWAL/EXPIRATION event'leri atlanıyor.
**Düzeltme:** `original_app_user_id` field'ini de kontrol et, DB'den `revenuecat_musteri_id` ile ara.

### O6. Satın alınan plan backend'e gönderilmiyor
**Dosya:** `PlanSecim.jsx:82` + `abonelik.js:25`
**Sorun:** `iapDogrula()` body'siz POST. Backend tamamen RevenueCat'e güveniyor. Cross-check yok.
**Düzeltme:** `beklenen_plan` parametresi gönderip backend'de doğrula.

### O7. Geri yükleme başarısız ama hatasız dönüş sessiz
**Dosya:** `PlanSecim.jsx:204-209`
**Sorun:** `iapDogrula` hata fırlatmadan `{basarili: false}` dönerse kullanıcıya bilgi verilmez.
**Düzeltme:** `else` bloğuna hata mesajı ekle.

### O8. Hesap değişiminde configure yerine logIn kullanılmalı
**Dosya:** `capacitorInit.js:131-143`
**Sorun:** Farklı `sirketId` ile `Purchases.configure` tekrar çağrılıyor. RevenueCat dokümanlarına göre `Purchases.logIn()` kullanılmalı.
**Düzeltme:** İlk configure sonrası hesap değişimlerinde `logIn()` kullan.

### O9. Background'dan dönüşte state kaybı riski
**Dosya:** `PlanSecim.jsx:82-171`
**Sorun:** StoreKit dialog'u sırasında iOS WebView'u öldürebilir. `purchasePackage` başarılı olmuş ama callback çalışmamış olur.
**Düzeltme:** `app:resume` event'inde `getCustomerInfo()` ile aktif aboneliği kontrol et.

### O10. syncPurchases gereksiz yerde çağrılıyor
**Dosya:** `PlanSecim.jsx:122`
**Sorun:** `purchasePackage` zaten receipt'i gönderir. Hemen ardından `syncPurchases` ekstra ağ isteği ve potansiyel karışıklık yaratır.
**Düzeltme:** Satın alma sonrasından kaldır, sadece geri yükleme akışında kullan.

### O11. Apple Server Notifications V2 bağlı değil
**Sorun:** RevenueCat'e Apple Server Notifications V2 bağlanmamışsa, subscription event'leri 2-4 saat gecikmeli gelebilir.
**Düzeltme:** App Store Connect → App → General → Server Notifications → RevenueCat URL'sini ekle.

---

## DÜŞÜK SEVİYE BULGULAR

| # | Sorun | Dosya |
|---|-------|-------|
| D1 | `expires_date` null olabilir (lifetime) → aktif hak atlanır | AbonelikController:241 |
| D2 | BILLING_ISSUE sadece loglanıyor, aksiyon yok | WebhookController:140 |
| D3 | DEBUG logları production'da açık | AbonelikController:223,287 |
| D4 | `userCancelled` check'i SDK versiyonuna bağlı kırılgan | PlanSecim.jsx:160 |
| D5 | İnternet yokken teknik İngilizce hata mesajı | PlanSecim.jsx:163 |
| D6 | `iapPlanGuncelle` kullanıcı null ise plan güncellenmez | authStore.js:130 |
| D7 | Sabit 3 saniye bekleme — gereksiz veya yetersiz | PlanSecim.jsx:126,182 |

---

## APPLE SUBSCRIPTION DAVRANIŞI — ÖNEMLİ BİLGİLER

### Subscription Group Kuralları
- **Upgrade** (düşük seviye → yüksek): **Anında** geçerli, eski plan prorated iade edilir
- **Downgrade** (yüksek → düşük): **Ertelenmiş**, mevcut dönem sonunda geçerli olur
- Aynı gruptaki aynı Apple ID = tek aktif abonelik

### TestFlight Davranışı (Aralık 2024+)
- Tüm abonelikler **24 saatte bir** yenilenir (aylık/yıllık fark etmez)
- Toplam **6 kez** yenilenir (1 hafta), sonra durur
- Gerçek para çekilmez
- Aynı Apple ID tüm ParamGo hesaplarında **aynı aboneliği paylaşır**

### RevenueCat Transfer Davranışı
- Aynı Apple ID farklı `app_user_id` ile kullanıldığında transfer gerçekleşir
- RevenueCat Dashboard → Project Settings → Transfer Behavior ayarı kontrol edilmeli

---

## ÖNCELİKLİ DÜZELTME SIRASI

### Faz 1 — App Store'a Göndermeden Önce (KRİTİK)
1. K1: Webhook auth bypass düzelt
2. K2: PRODUCT_CHANGE event'ini handle et
3. K3: Başarısız iapDogrula sonrası kurtarma mekanizması
4. K4: revenueCatBaslat hata yönetimi
5. K5: Token geçerlilik kontrolü

### Faz 2 — İlk Hafta (ORTA)
6. O1: planGuncelle transaction
7. O2: Entitlements deneme_mi fix
8. O3: Duplicate kayıt kontrolü
9. O6: Beklenen plan cross-check
10. O8: logIn() kullanımı

### Faz 3 — İyileştirmeler (DÜŞÜK)
11. Diğer düşük seviye bulgular
12. Apple Server Notifications V2 entegrasyonu
13. Debug loglarını kaldır

---

## TEMİZ ALANLAR (Sorun Yok)

- ✅ API anahtarları doğru kullanılıyor (frontend=public, backend=secret)
- ✅ App User ID formatı (`sirket_N`) tüm katmanlarda tutarlı
- ✅ 4 ürün ID'si frontend ve backend'de birebir eşleşiyor
- ✅ Codemagic build'de secret key yok
- ✅ CORS middleware Capacitor origin'i destekliyor
- ✅ JWT token refresh mekanizması mevcut
- ✅ SSL doğrulaması aktif (cURL)
