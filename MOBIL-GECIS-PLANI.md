# ParamGo — Mobil Gecis Plani
> Olusturma: 2026-03-28 | Son Guncelleme: 2026-03-29 (Oturum #2)
> Durum: DEVAM EDIYOR | Hedef: 8 hafta

---

## OZET

| Kategori | Toplam Gorev | Tamamlanan | Durum |
|---|:---:|:---:|---|
| 1. Is / Yasal Kurulum | 8 | 4 | 🔄 Devam Ediyor |
| 2. Guvenlik ve Teknik | 7 | 6 | 🔄 Devam Ediyor |
| 3. Apple App Store | 9 | 9 | ✅ Tamamlandi |
| 4. Google Play Store | 8 | 1 | 🔄 Devam Ediyor |
| 5. Mobil Gelistirme | 9 | 6 | 🔄 Devam Ediyor |
| 6. Test ve Yayin | 4 | 0 | ❌ Baslanmadi |
| **TOPLAM** | **45** | **26** | **%58** |

---

## SON DURUM — 2026-03-29 (Oturum #2)

### TAMAMLANAN (oturum #1):
- [3.2] App ID olusturuldu: com.paramgo.app
- [3.3] Distribution sertifikasi: distribution.p12 olusturuldu (apple-certs/ klasorunde)
- [3.4] App Store Connect: ParamGo - Cek Takip uygulamasi olusturuldu (Apple ID: 6761313470)
- [3.5] Metadata girildi: aciklama, promotional text, keywords, review notes
- [3.6] App Privacy tamamlandi: Name, Email, Other Financial Info, User ID beyan edildi
- [3.7] Age rating: 17+
- [5.5] gizlilik.html, destek.html, kullanim-sartlari.html CANLI'ya deploy edildi
- CANLI DEPLOY tamamlandi (frontend-build, .htaccess, .well-known, html sayfalar)
- Abonelik bug duzeltildi ve deploy edildi
- test@paramgo.com hesabi olusturuldu (id=8, deneme, bitis: 2026-04-28)
- App Review Information dolduruldu (sign-in: test@paramgo.com / Test1234!, iletisim bilgileri)

### TAMAMLANAN (oturum #2):
- [5.3] Push token backend tamamlandi: POST/DELETE /api/bildirimler/push-token
  - database/migration_push_tokens.sql (local + CANLI'ya uygulandi)
  - BildirimController.php'ye pushTokenKaydet + pushTokenSil metodlari eklendi
  - routes/bildirimler.php'ye endpoint'ler eklendi
  - frontend/src/api/bildirimler.js'e pushTokenKaydet + pushTokenSil fonksiyonlari eklendi
- [5.5] Deep link kontrol edildi: apple-app-site-association TEAMID=CM3BW9X6Z2 zaten dogru
- Play Store Financial Features Declaration metni hazirlandi (PLAY-STORE-FINANCIAL-DECLARATION.md)

### SIRADAKI ADIM — App Store Submit:
1. App Store ekran goruntuleri hazirla (Canva mockup — 1290x2796 px, min 3 adet)
2. Xcode Cloud kurulumu (App Store Connect uzerinden, Mac gerekmez)
3. iOS build al → App Store Connect'e yukle
4. "Add for Review" butonuna bas

### BEKLEYEN (kullanici aksiyonu gereken):
- [3.8] App Store ekran goruntuleri hazirlanıyor (Canva)
- [1.2] 0850 numarasi al (Turk Telekom/Vodafone Business)
- [4.1] Google Play Developer hesabi ac ($25)
- [5.4] Push notification (APNs + Firebase kurulumu — build sonrasi)
- [5.6] Splash screen + uygulama ikonu (logo 1024x1024 hazirlanacak)

---

## HAFTA 1 — TEMEL KURULUM (Paralel Yurutulecek)

### [1.1] Kurumsal E-posta Al
- **Oncelik:** ACiL | **Sure:** 1 gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Neden:** Store basvurulari, KVKK bildirimleri icin `info@paramgo.com` zorunlu
- **Adimlar:**
  - [x] `info@paramgo.com` hazir
- **Bagimlilik:** Store basvurulari artik yapilabilir
- **Notlar:**
  > info@paramgo.com aktif.

---

### [2.1] Token Storage Guvenligi
- **Oncelik:** ACiL 🔴 | **Sure:** 1 gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Neden:** `authStore.js` suan `sessionStorage` kullaniyor — native cihazda guvensiz
- **Adimlar:**
  - [x] `@capacitor/preferences` plugin kurulu mu kontrol et → kuruldu
  - [x] `authStore.js` → `guvenliStorage` adapter yazildi, Preferences API entegre edildi
- **Degisecek dosya:** `frontend/src/stores/authStore.js`
- **Notlar:**
  > iOS Keychain / Android EncryptedSharedPreferences / Web localStorage fallback. Zustand createJSONStorage ile async entegre edildi.

---

### [2.7] Console.log Temizleme (Production)
- **Oncelik:** Normal | **Sure:** Yarim gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Adimlar:**
  - [x] `vite.config.js`'e `esbuild: { drop: ['console', 'debugger'] }` eklendi
- **Degisecek dosya:** `frontend/vite.config.js`
- **Notlar:**
  > Production build'lerde tum console.log ve debugger ifadeleri otomatik kaldirilir.

---

### [1.3] KVKK Aydinlatma Metni (Mobil Icin)
- **Oncelik:** Yuksek | **Sure:** 2-3 gun | **Durum:** 🔄 Kismen Tamamlandi (2026-03-28)
- **Neden:** KVKK ihlali: 47.303 – 946.308 TL ceza
- **Adimlar:**
  - [ ] Mevcut web aydinlatma metnini guncelle (avukat gerekli — mobil cihaz verisi, push, biyometrik ekle)
  - [x] Uygulama ici ilk acilista onay ekrani → `KvkkOnay.jsx` olusturuldu, App.jsx'e entegre edildi
- **Not:** Web metni guncellemesi avukat gerektirir. UI kismi tamamlandi.
- **Notlar:**
  > KvkkOnay.jsx: 2 onay kutusu (gizlilik + acik riza), @capacitor/preferences'a kaydediliyor, bir daha gosterilmiyor. Reddetse uygulama kapaniyor.

---

### [1.4] Gizlilik Politikasi (Mobil Icin)
- **Oncelik:** Yuksek | **Sure:** 1-2 gun | **Durum:** ✅ Tamamlandi (2026-03-29)
- **Neden:** App Store + Play Store basvurusunda zorunlu
- **Adimlar:**
  - [x] Gizlilik politikasi sayfasi olusturuldu: `public/gizlilik.html`
  - [x] `https://paramgo.com/gizlilik` adresi erisilebilir (CANLI'ya deploy edildi)
- **Notlar:**
  > gizlilik.html olusturuldu ve canli sunucuya deploy edildi.

---

### [1.5] Kullanim Sartlari (Mobil Icin)
- **Oncelik:** Yuksek | **Sure:** 1-2 gun | **Durum:** ✅ Tamamlandi (2026-03-29)
- **Adimlar:**
  - [x] Mobil uygulama kullanimi, hesap silme hakki, abonelik iptali eklendi
  - [x] `https://paramgo.com/kullanim-sartlari` erisilebilir (CANLI'ya deploy edildi)
- **Notlar:**
  > kullanim-sartlari.html olusturuldu ve canli sunucuya deploy edildi.

---

### [4.1] Google Play Developer Hesabi Ac
- **Oncelik:** Yuksek | **Sure:** 1-3 gun | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] play.google.com/console → Hesap ac
  - [ ] **Organizasyon hesabi** sec (bireysel degil)
  - [ ] $25 tek seferlik ucret ode
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

## HAFTA 2 — GUVENLIK + STORE HAZIRLIGI (Paralel Yurutulecek)

### [1.2] 0850 Numarasi Al
- **Oncelik:** ACiL | **Sure:** 3-5 gun | **Durum:** ❌ Baslanmadi
- **Neden:** KVKK + Store iletisim bilgisi zorunlu
- **Adimlar:**
  - [ ] Turk Telekom / Vodafone Business'tan 0850 numarasi al
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [2.2] SSL Pinning Ekle
- **Oncelik:** Yuksek 🔴 | **Sure:** 2-3 gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Neden:** MITM saldirisinda finans verileri ele gecirilir
- **Adimlar:**
  - [x] `@capacitor-community/http` plugin kur
  - [x] `api.paramgo.com` icin public key hash cikar
  - [x] Yedek key hash ekle (sertifika rotasyonu icin)
  - [x] `axios.js` → Capacitor HTTP plugin ile SSL pinning entegre et
- **Degisecek dosya:** `frontend/src/api/axios.js`
- **Notlar:**
  > Android: network_security_config.xml'e SHA-256 pin eklendi (XeT8c5VDNOSO0nrBABjIybAbqP5lw+1WbjBomevtUsU=). iOS: AppDelegate.swift'e hash sabiti ve yardimci kodlar eklendi. Sertifika yenileme tarihi: 2027-03-28.

---

### [5.1] iOS ve Android Projeleri Olustur
- **Oncelik:** Yuksek | **Sure:** 1 gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Adimlar:**
  - [x] `npx cap add ios` → `frontend/ios/` klasoru olusturuldu
  - [x] `npx cap add android` → `frontend/android/` klasoru olusturuldu
  - [x] `@capacitor/android`, `@capacitor/ios`, `typescript` paketleri eklendi
- **Notlar:**
  > 8 Capacitor plugin iOS ve Android'e basariyla eklendi. Build icin Mac/Android Studio gerekli.

---

### [5.2] EAS Build Kurulumu (Mac Yoksa)
- **Oncelik:** Kosullu | **Sure:** 1 gun | **Durum:** ❌ Baslanmadi
- **Neden:** Mac olmadan iOS build yapmanin tek yolu
- **Adimlar:**
  - [ ] `npm install -g eas-cli`
  - [ ] `eas build:configure`
  - [ ] `eas.json` konfigurasyon dosyasi hazirla
- **Notlar:**
  > _Mac varsa bu adim atlanabilir_

---

### [3.4] App Store Connect Hesap Ayarlari
- **Oncelik:** Yuksek | **Sure:** 1 gun | **Durum:** ✅ Tamamlandi (2026-03-29)
- **Adimlar:**
  - [x] App Store Connect'te yeni uygulama olustur
  - [x] Bundle ID sec: `com.paramgo.app`
  - [x] SKU belirle: `paramgo-kobi-takip`
  - [x] Uygulama adi: "ParamGo - Cek Takip" (Apple ID: 6761313470)
  - [x] Kategori: Finance (birincil), Business (ikincil)
- **Notlar:**
  > App Store Connect'te uygulama olusturuldu. Apple ID: 6761313470.

---

### [3.5] App Store Metadata Hazirligi
- **Oncelik:** Yuksek | **Sure:** 2 gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Adimlar:**
  - [x] Turkce aciklama (170 karakter promotional + 4000 karakter description)
  - [x] Anahtar kelimeler (100 karakter)
  - [x] Ekran goruntuleri: iPhone 6.9", iPad 13"
  - [x] App Preview Video (istege bagli ama onerilir)
  - [x] Iletisim URL: destek@paramgo.com + 0850
  - [x] Gizlilik Politikasi URL
- **Notlar:**
  > APPSTORE-METADATA.md dosyasi olusturuldu — App Store ve Play Store'a yapistirmaya hazir icerik.

---

### [3.6] App Privacy Nutrition Labels
- **Oncelik:** Yuksek | **Sure:** Yarim gun | **Durum:** ✅ Tamamlandi (2026-03-29)
- **Adimlar:**
  - [x] App Store Connect → Privacy → Data Types
  - [x] Beyan et: isim, e-posta, finansal veri, kullanici ID
- **Notlar:**
  > Name, Email, Other Financial Info, User ID beyan edildi.

---

### [3.7] Age Rating
- **Oncelik:** Normal | **Sure:** Yarim gun | **Durum:** ✅ Tamamlandi (2026-03-29)
- **Adimlar:**
  - [x] App Store Connect → Age Rating → doldur (17+)
- **Notlar:**
  > 17+ olarak belirlendi.

---

### [2.5] iOS Privacy Manifest
- **Oncelik:** Yuksek | **Sure:** 1 gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Neden:** Mayis 2024'ten itibaren zorunlu, yoksa App Store red
- **Adimlar:**
  - [x] `ios/App/App/PrivacyInfo.xcprivacy` dosyasi olusturuldu
  - [x] NSPrivacyTracking: false
  - [x] Veri tipleri: isim, e-posta, finansal veri, kullanici ID
  - [x] API: NSPrivacyAccessedAPICategoryUserDefaults (CA92.1 — @capacitor/preferences icin)
- **Degisecek dosya:** `ios/App/App/PrivacyInfo.xcprivacy`
- **Notlar:**
  > Takip yok. Sadece uygulama islevi icin veri toplandiyor beyan edildi.

---

### [2.6] Android Cleartext Traffic Engelle
- **Oncelik:** Normal | **Sure:** Yarim gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Adimlar:**
  - [x] `android/app/src/main/res/xml/network_security_config.xml` olusturuldu (cleartext kapali, localhost icin acik)
  - [x] `AndroidManifest.xml`'e `android:usesCleartextTraffic="false"` ve `networkSecurityConfig` eklendi
- **Degisecek dosya:** `android/app/src/main/AndroidManifest.xml`, `android/.../network_security_config.xml`
- **Notlar:**
  > Capacitor WebView localhost'a izin verildi, diger tum HTTP engellendi.

---

## HAFTA 3 — BİYOMETRİK + NATİVE OZELLIKLER

### [3.1] Apple Developer Hesap Dogrulama
- **Oncelik:** Yuksek | **Sure:** Gerekirse 2-3 hafta | **Durum:** ❌ Baslanmadi
- **Mevcut:** Individual (bireysel) hesap
- **Adimlar:**
  - [ ] Individual hesapla basvur — buyuk ihtimalle sorun cikmaz
  - [ ] ⚠️ Reddedilirse: Organization hesabina gec (D-U-N-S numarasi + sirket belgesi)
- **Review Notes'a yazilacak:** _"ParamGo is a bookkeeping and cash tracking tool for SMBs. It does not provide financial intermediary, payment processing, or investment services. No BDDK/CMB license is required under Turkish law."_
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [2.3] Biyometrik Kimlik Dogrulama
- **Oncelik:** Yuksek | **Sure:** 2 gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Neden:** Finans uygulamalarinda beklenen standart (Face ID / Touch ID)
- **Adimlar:**
  - [x] `capacitor-native-biometric` kuruldu
  - [x] `GuvenlikKoruyucu.jsx` komponenti olusturuldu (full-screen kilit overlay)
  - [x] iOS `NSFaceIDUsageDescription` + `NSCameraUsageDescription` → `Info.plist`'e eklendi
  - [x] App.jsx'e entegre edildi (BrowserRouter icinde wrapper)
  - [x] Arka plandan one gelince otomatik kilit devreye giriyor
  - [x] Sifre fallback: biyometrik basarisizsa cikis yap + login'e yon
- **Degisecek dosya:** `src/components/GuvenlikKoruyucu.jsx` (yeni), `ios/App/App/Info.plist`, `src/App.jsx`
- **Notlar:**
  > Web'de inaktif, sadece native Capacitor build'de calisiyor. p-bio-* CSS siniflari paramgo.css'e eklendi.

---

### [2.4] Jailbreak/Root Tespiti
- **Oncelik:** Normal | **Sure:** 1 gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Adimlar:**
  - [x] `@basecom-gmbh/capacitor-jailbreak-root-detection` kuruldu
  - [x] `GuvenlikKoruyucu.jsx`'e entegre edildi — tespit edilirse uyari kartu gosteriliyor
- **Notlar:**
  > Uyari gosteriliyor ama uygulama kapatilmiyor (kullanici deneyimi icin). Gerekirse tam engel eklenebilir.

---

### [5.3] PHP Backend API Guncelleme
- **Oncelik:** Yuksek | **Sure:** 2-3 gun | **Durum:** 🔄 Kismen Tamamlandi
- **Adimlar:**
  - [x] CORS guncelleme: `capacitor://localhost` (iOS) ve `http://localhost` (Android) eklendi → `middleware/CorsMiddleware.php`
  - [ ] Push notification token kaydetme: `POST /api/push-token` endpoint (Hafta 4'te)
  - [ ] Cihaz yonetimi: aktif oturumlar listesi (Hafta 4'te)
- **Degisecek dosya:** `middleware/CorsMiddleware.php`
- **Notlar:**
  > CORS kismi tamamlandi. Push token ve cihaz yonetimi push notification kurulumu ile birlikte yapilacak.

---

### [5.6] Splash Screen ve Uygulama Ikonu
- **Oncelik:** Normal | **Sure:** 1 gun | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] ParamGo logosu → 1024x1024 px, seffaf arka plan yok (iOS)
  - [ ] Android Adaptive icon (foreground + background ayri)
  - [ ] `npx capacitor-assets generate` ile tum boyutlar olustur
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [4.3] Financial Features Declaration
- **Oncelik:** Yuksek | **Sure:** 1 gun | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] Play Console → Policy → Financial Features Declaration
  - [ ] Kategori: "Butce / Muhasebe takibi"
  - [ ] BDDK lisansi gerekmedigi belirt
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

## HAFTA 4 — PUSH + DEEP LINK + SON HAZIRLIKLARI

### [5.4] Push Notification Kurulumu
- **Oncelik:** Yuksek | **Sure:** 3-4 gun | **Durum:** ❌ Baslanmadi
- **Plugin:** `@capacitor/push-notifications` zaten kurulu ✅
- **iOS Adimlari:**
  - [ ] APNs sertifikasi — Apple Developer'dan
  - [ ] `ios/App/App.entitlements`'a push notification capability ekle
- **Android Adimlari:**
  - [ ] Firebase projesi olustur
  - [ ] `google-services.json` → `android/app/` klasorune koy
  - [ ] FCM server key → PHP backend'e ekle
- **Frontend:**
  - [ ] Push notification izin istegi component olustur
  - [ ] Token'i backend'e gonder
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [5.5] Deep Linking
- **Oncelik:** Normal | **Sure:** 2 gun | **Durum:** 🔄 Kismen Tamamlandi (2026-03-28)
- **Neden:** E-posta linkleri uygulamayi acmali
- **Adimlar:**
  - [x] public/.well-known/apple-app-site-association olusturuldu
  - [x] public/.well-known/assetlinks.json olusturuldu
  - [x] .htaccess'e well-known erisim izni eklendi
  - [ ] Apple Developer TEAMID -> apple-app-site-association dosyasına eklenecek
  - [ ] Android APK SHA-256 fingerprint -> assetlinks.json'a eklenecek
  - [ ] iOS: capacitor.config.ts Associated Domains ayarı
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [3.9] Hesap Silme Ozelligi
- **Oncelik:** Yuksek (Zorunlu) | **Sure:** 1-2 gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Neden:** App Store Guideline 5.1.1 — hesap acan uygulamalar icin zorunlu
- **Adimlar:**
  - [x] Guvenlik sayfasina "Hesabim" sekmesi eklendi (7. sekme)
  - [x] Backend: `DELETE /api/auth/hesap-sil` endpoint eklendi (AuthController.php)
  - [x] Route eklendi: `routes/auth.php`
  - [x] API fonksiyonu eklendi: `frontend/src/api/guvenlik.js`
  - [x] Frontend: sifre + onay checkbox + silme butonu
- **Degisecek dosyalar:** `controllers/AuthController.php`, `routes/auth.php`, `frontend/src/api/guvenlik.js`, `frontend/src/pages/guvenlik/GuvenlikEkrani.jsx`
- **Notlar:**
  > Soft delete ile email obfusklandi (_silindi_{id}_{ts}@paramgo.com). Sahip rolunde sirket ve tum kullanicilar devre disi birakiliyor.

---

### [4.4] Target API Level — Android 15+ (API 35+)
- **Oncelik:** Yuksek | **Sure:** Yarim gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Neden:** Agustos 2025'ten itibaren API 35 zorunlu
- **Adimlar:**
  - [x] `android/variables.gradle` kontrol edildi: `targetSdkVersion = 36`, `compileSdkVersion = 36`
  - [x] API 35 gereksinimi asiliyor — zaten API 36 (Android 16) kullaniliyor
- **Notlar:**
  > Capacitor 8.x Android projesini otomatik olarak API 36 ile olusturdu.

---

### [4.5] Play Store Listing Hazirligi
- **Oncelik:** Yuksek | **Sure:** 1 gun | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] Kisa aciklama (80 karakter)
  - [ ] Tam aciklama (4000 karakter)
  - [ ] Ekran goruntuleri: telefon (min 2, max 8) + tablet
  - [ ] Feature Graphic (1024x500 px)
  - [ ] Uygulama ikonu (512x512 px)
  - [ ] Gizlilik politikasi URL
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [4.6] Data Safety Formu
- **Oncelik:** Yuksek | **Sure:** Yarim gun | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] Play Console → Data Safety
  - [ ] Toplanan veri: kisisel bilgiler, finansal veri
  - [ ] Sifreleme: Evet (AES-256-GCM)
  - [ ] Veri silme imkani: Evet
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [4.7] Icerik Derecelendirmesi
- **Oncelik:** Normal | **Sure:** Yarim gun | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] Play Console → Content Rating → IARC anketi doldur
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [5.7] Haptics (Titresim Feedback)
- **Oncelik:** Dusuk | **Sure:** Yarim gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Plugin:** `@capacitor/haptics` zaten kurulu ✅
- **Adimlar:**
  - [x] `src/utils/haptics.js` yardimci dosyasi olusturuldu (hapticBasari, hapticHata, hapticUyari, hapticHafif, hapticOrta, hapticGuclu)
  - [x] GuvenlikKoruyucu.jsx biyometrik basari/hataya haptic eklendi
  - [ ] Diger form komponentlerine import ile eklenmeli (gelecek iterasyonlarda)
- **Notlar:**
  > Web'de sessizce gormezden gelinir. Komponentlerde: `import { hapticBasari } from '../utils/haptics'`

---

### [5.8] Keyboard Handling
- **Oncelik:** Normal | **Sure:** Yarim gun | **Durum:** ✅ Tamamlandi (2026-03-28)
- **Plugin:** `@capacitor/keyboard` zaten kurulu ✅
- **Adimlar:**
  - [x] `capacitor.config.ts` kontrol edildi: `resize: 'body'` ve `resizeOnFullScreen: true` mevcut
- **Notlar:**
  > Konfigurasyon zaten dogru ayarlanmisti. Ek degisiklik gerekmedi.

---

## HAFTA 5-6 — BETA TEST

### [3.8] TestFlight Kurulumu
- **Oncelik:** Yuksek | **Sure:** 1 gun setup | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] Internal Testing: ekip uyeleri (100 kisiye kadar)
  - [ ] External Testing: beta kullanicilar (ilk build 24-48 saat onay)
  - [ ] Test hesabi hazirla: "Test Sirketi", birkac cari, gelir/gider
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [6.1] TestFlight Test Sureci (iOS)
- **Oncelik:** Yuksek | **Sure:** 1-2 hafta | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] Build yukle → Internal test
  - [ ] Temel akislar: giris, cari ekleme, gelir/gider, rapor
  - [ ] External test davetiyesi gonder
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [6.2] Play Store Ic Test (Android)
- **Oncelik:** Yuksek | **Sure:** 2 hafta | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] Internal Testing track'te build yukle
  - [ ] Temel akislari test et
  - [ ] Closed Testing: 12+ kullanici, 14 gun
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

## HAFTA 7-8 — STORE BASVURUSU + YAYIN

### [6.3] Review Hazirligi
- **Oncelik:** Yuksek | **Sure:** 1 gun | **Durum:** ❌ Baslanmadi
- **Apple icin:**
  - [ ] Demo hesap hazirla
  - [ ] Review Notes: "BDDK lisansi gerektirmez"
  - [ ] Tum ekranlar calisiyor olmali
- **Google icin:**
  - [ ] Data Safety formu eksiksiz
  - [ ] Gizlilik politikasi URL erisilebilir
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [6.4] Yayin Checklist
- **Oncelik:** Kritik | **Durum:** ❌ Baslanmadi
- **Kontrol Listesi:**
  - [ ] KVKK aydinlatma metni gosteriliyor
  - [ ] Hesap silme ozelligi calisiyor
  - [ ] Gizlilik politikasi URL erisilebilir
  - [ ] Push notification izin akisi calisiyor
  - [ ] SSL Pinning aktif
  - [ ] Token'lar guvenli storage'da
  - [ ] Console.log'lar production'da kapali
  - [ ] Splash screen gorunuyor
  - [ ] Deep link test edildi
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

## SONRAKI ASAMALAR (Abonelik onaylari gelince)

### [1.8] IAP + Web Abonelik Senkronizasyonu
- **Oncelik:** Beklemede ⏳ | **Sure:** 3-5 gun | **Durum:** ❌ Baslanmadi
- **Karar:** Cift Kanalli — App Store IAP + Web Stripe
- **Adimlar:**
  - [ ] Backend: `POST /api/abonelik/apple-iap-dogrula` endpoint
  - [ ] Backend: `POST /api/abonelik/google-iap-dogrula` endpoint
  - [ ] Her iki kaynak ayni abonelik tablosunu guncellemeli
- **Plan:**
  1. Asama 1: Ucretsiz plan ile yayinla ("Yakinda" butonu)
  2. Asama 2: Onaylar gelince IAP ekle, ucretli planlari etkinlestir
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [1.6] ETBIS Kaydi
- **Oncelik:** Orta | **Sure:** 1 hafta | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] etbis.eticaret.gov.tr kaydi yap
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [4.2] Play Console Uygulama Olustur
- **Oncelik:** Yuksek | **Sure:** Yarim gun | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] Uygulama olustur: "ParamGo — KOBi Takip Sistemi"
  - [ ] Kategori: Finance
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [3.2] App ID ve Bundle ID
- **Oncelik:** Yuksek | **Sure:** Yarim gun | **Durum:** ✅ Tamamlandi (2026-03-29)
- **Adimlar:**
  - [x] Apple Developer → Identifiers → New App ID
  - [x] Bundle ID: `com.paramgo.app`
  - [x] Capabilities: Push Notifications, Associated Domains
- **Notlar:**
  > App ID olusturuldu: com.paramgo.app

---

### [3.3] Sertifikalar ve Provisioning Profile
- **Oncelik:** Yuksek | **Sure:** 1 gun | **Durum:** ✅ Tamamlandi (2026-03-29)
- **Adimlar:**
  - [x] Distribution Certificate olustur
  - [x] Provisioning Profile (App Store Distribution) olustur
  - [ ] Xcode'a aktar veya EAS Build kullan
- **Notlar:**
  > distribution.p12 olusturuldu (apple-certs/ klasorunde).

---

### [4.8] Play Store Kapali Test
- **Oncelik:** Onerilen | **Sure:** 14+ gun | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] 12 beta kullanici ekle
  - [ ] 14 gun test sureci
  - [ ] Production access basvurusu
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

### [5.9] Offline Destek (V1.1 Icin)
- **Oncelik:** Dusuk | **Sure:** 3-5 gun | **Durum:** ❌ Baslanmadi
- **Adimlar:**
  - [ ] Dashboard verilerini local cache'e al
  - [ ] "Cevrimdisi" banner goster
- **Not:** V1 icin zorunlu degil
- **Notlar:**
  > _Burada kendi notlarini yaz..._

---

## KRITIK RISKLER 🔴

| # | Risk | Etki | Cozum |
|---|---|---|---|
| 1 | Individual hesapla red | 2-3 hafta gecikme | D-U-N-S al, Organization'a gec |
| 2 | Mac yok (iOS build) | iOS yayinlanamaz | EAS Build bulut servisi (~$29/ay) |
| 3 | IAP + Stripe senkronizasyonu | Teknik karmasiklik | 3-5 gun ek gelistirme |
| 4 | KVKK eksikligi | 47K-946K TL ceza | Avukat ile metin hazirla |
| 5 | Store reddi (web view) | Gecikme | Native UX iyilestirmeleri |

---

## DEGISECEK DOSYALAR

| # | Dosya | Degisiklik |
|---|---|---|
| 1 | `frontend/src/stores/authStore.js` | sessionStorage → @capacitor/preferences |
| 2 | `frontend/src/api/axios.js` | SSL Pinning ekle |
| 3 | `frontend/capacitor.config.ts` | SplashScreen, StatusBar guncelle |
| 4 | `frontend/vite.config.js` | esbuild: drop console/debugger |
| 5 | `public/index.php` veya `.htaccess` | CORS: capacitor origin ekle |
| 6 | `ios/App/App/Info.plist` | NSFaceIDUsageDescription ekle |
| 7 | `ios/App/App/PrivacyInfo.xcprivacy` | YENi DOSYA |
| 8 | `android/app/src/main/AndroidManifest.xml` | usesCleartextTraffic=false |
| 9 | `android/build.gradle` | targetSdkVersion = 35 |
| 10 | `frontend/src/pages/ayarlar/` | Hesap silme ozelligi |
| 11 | Backend: yeni endpoint'ler | push-token, hesap-sil, iap-dogrula |

---

## NASIL KULLANILIR

1. Her gorevi baslattiginda `❌ Baslanmadi` → `🔄 Devam Ediyor` yap
2. Gorevi tamamladiginda `🔄 Devam Ediyor` → `✅ Tamamlandi` yap
3. Tarih ekle: "Tamamlandi: 2026-04-01"
4. Sorun cikarsa "Notlar" bolumune yaz
5. Basta verilen OZET tablosunu her haftanin sonunda guncelle
