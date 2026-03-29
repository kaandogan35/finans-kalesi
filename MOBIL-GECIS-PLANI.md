# ParamGo — Mobil Gecis Plani
> Olusturma: 2026-03-28 | Son Guncelleme: 2026-03-29 (Oturum #3)
> Durum: DEVAM EDIYOR | Hedef: 6 hafta (kalan)

---

## OZET

| Kategori | Toplam Gorev | Tamamlanan | Durum |
|---|:---:|:---:|---|
| 1. Is / Yasal Kurulum | 8 | 4 | 🔄 Devam Ediyor |
| 2. Guvenlik ve Teknik | 7 | 6 | 🔄 Devam Ediyor |
| 3. Apple App Store | 9 | 9 | ✅ Tamamlandi |
| 4. Google Play Store | 8 | 1 | 🔄 Devam Ediyor |
| 5. Mobil Gelistirme | 9 | 8 | 🔄 Devam Ediyor |
| 6. Test ve Yayin | 4 | 1 | 🔄 Devam Ediyor |
| 7. Codemagic CI/CD | 4 | 4 | ✅ Tamamlandi (YENi) |
| 8. Mobil UI/UX | 3 | 3 | ✅ Tamamlandi (YENi) |
| **TOPLAM** | **52** | **36** | **%69** |

---

## SON DURUM — 2026-03-29 (Oturum #3)

### TAMAMLANAN (oturum #3):

**Codemagic CI/CD (Mac olmadan iOS build):**
- [7.1] GitHub repo olusturuldu: kaandogan35/paramgo (remote: `paramgo`)
- [7.2] codemagic.yaml yazildi ve debug edildi (16 deneme!)
  - Node.js 22 (Capacitor 8 gereksinimi)
  - `cap add ios` + `cap sync ios` (iOS klasoru gitignore'da)
  - Capacitor 8 = SPM (CocoaPods kaldırıldı)
  - Manuel code signing: keychain + p12 + mobileprovision
  - export_options.plist oluşturuldu
  - Otomatik build number (PROJECT_BUILD_NUMBER)
- [7.3] Apple sertifika/profil: distribution_pwd.p12 (şifreli) + ParamGo_AppStore.mobileprovision
- [7.4] Codemagic environment variables ayarlandi (6 degisken)

**TestFlight:**
- [6.1] İlk başarılı build: Version 1.0 (Build 1) → TestFlight'a yüklendi ✅
- Kaan Test grubu oluşturuldu, internal testing aktif
- Compliance (şifreleme beyanı) tamamlandı
- Fethi Akkın test kullanıcısı olarak davet edildi

**Mobil UI/UX:**
- [8.1] Giriş ekranı: Papara tarzı native tasarım (pm-login-* CSS)
- [8.2] Kayıt ekranı: 2 adımlı native tasarım (pm-reg-* CSS)
- [8.3] Şifre sıfırlama: Native tasarım
- Web tasarımları değişmedi (isNative ile ayrım)

**API Bağlantısı:**
- axios.js: Capacitor.isNativePlatform() → `https://paramgo.com/api`
- capacitor.config.ts: allowNavigation, iosScheme, androidScheme eklendi
- CORS: capacitor://localhost + http://localhost zaten destekleniyor

**Deploy Süreci:**
- CANLI-DEPLOY.md güncellendi: 3 aşamalı deploy haritası (web + mobil)
- `git push paramgo master:main` komutu ile Codemagic tetikleniyor

---

## AKTIF YOL HARİTASI

### AŞAMA A — Uygulama İçi Hatalar (ŞUAN)
> Öncelik: TestFlight'ta test et, hataları topla, tek seferde düzelt

| # | Test Konusu | Durum | Not |
|---|---|---|---|
| A1 | Giriş yapabilme (API bağlantısı) | 🔄 Test ediliyor | API URL düzeltildi |
| A2 | Kayıt olabilme | 🔄 Test ediliyor | |
| A3 | Dashboard yüklenme | ❌ Test edilecek | |
| A4 | Cari hesap ekleme/düzenleme | ❌ Test edilecek | |
| A5 | Çek/Senet işlemleri | ❌ Test edilecek | |
| A6 | Kasa işlemleri | ❌ Test edilecek | |
| A7 | Menü/sidebar mobil uyumu | ❌ Test edilecek | |
| A8 | Tablo responsive davranışı | ❌ Test edilecek | |
| A9 | Form/klavye davranışı | ❌ Test edilecek | |
| A10 | Oturum sürekliliği (arka plan/ön plan) | ❌ Test edilecek | |

### AŞAMA B — Telefon/POS Beklerken Yapılabilecekler
> 0850 telefon ve ödeme altyapısı beklerken paralel ilerlenecek

| # | Görev | Süre | Bağımlılık |
|---|---|---|---|
| B1 | Splash screen tasarımı (yeşil ekran + logo) | 1 gün | Yok |
| B2 | Uygulama ikonu 1024x1024 | 1 gün | Yok |
| B3 | App Store ekran görüntüleri (6.9" + 6.7") | 1 gün | Yok |
| B4 | Compliance otomatik: ITSAppUsesNonExemptEncryption = NO | 15 dk | Yok |
| B5 | Google Play Developer hesabı aç ($25) | 1 gün | Yok |
| B6 | Google Play listing hazırlığı (açıklama, görseller) | 1 gün | B5 |
| B7 | Push notification kurulumu (APNs + Firebase) | 3 gün | Yok |
| B8 | KVKK aydınlatma metni (avukat) | 3 gün | Yok |
| B9 | Offline banner ("Çevrimdışı" uyarısı) | Yarım gün | Yok |
| B10 | ETBIS kaydı | 1 gün | Yok |

### AŞAMA C — Ödeme Entegrasyonu (Telefon/POS gelince)
> Apple komisyon araştırması sonucuna göre karar verilecek

| # | Görev | Süre | Bağımlılık |
|---|---|---|---|
| C1 | Ödeme stratejisi kararı (IAP vs Web vs Hibrit) | 1 gün | Araştırma |
| C2 | In-App Purchase kurulumu (App Store + Play Store) | 3 gün | C1 |
| C3 | Web ödeme entegrasyonu (PayTR/Stripe) | 3 gün | C1 |
| C4 | IAP + Web abonelik senkronizasyonu | 2 gün | C2, C3 |

### AŞAMA D — Store Yayın
> Tüm testler tamamlandıktan sonra

| # | Görev | Süre | Bağımlılık |
|---|---|---|---|
| D1 | App Store "Add for Review" | 1 gün | A tamamlanmış, B1-B4 |
| D2 | Apple review bekleme | 1-3 gün | D1 |
| D3 | Google Play internal test (14 gün) | 14 gün | B5, B6 |
| D4 | Google Play production yayın | 1 gün | D3 |

---

## BEKLEYEN KULLANICI AKSİYONLARI

| # | Aksiyon | Durum | Not |
|---|---|---|---|
| 1 | 0850 numarası al | ❌ | KVKK + Store iletişim |
| 2 | Google Play Developer hesabı aç ($25) | ❌ | play.google.com/console |
| 3 | KVKK aydınlatma metni güncelle (avukat) | ❌ | Mobil cihaz verisi, push, biyometrik |
| 4 | ETBIS kaydı | ❌ | etbis.eticaret.gov.tr |
| 5 | TestFlight test → hataları raporla | 🔄 | Ekran görüntüleriyle |

---

## KRİTİK BİLGİLER

### Codemagic CI/CD
- **GitHub Repo:** kaandogan35/paramgo (remote: `paramgo`)
- **Push komutu:** `git push paramgo master:main`
- **Workflow:** ParamGo iOS Release
- **Build süresi:** ~2-3 dakika
- **Environment variables:** 6 adet (default group)
- **Sertifika:** distribution_pwd.p12 (şifreli: paramgo2026)
- **Profil:** ParamGo_AppStore.mobileprovision (UUID: e205b272-...)

### TestFlight
- **Version:** 1.0
- **Test grubu:** Kaan Test (internal)
- **Test kullanıcıları:** kaandogan92@hotmail.com, fethiakkin@icloud.com

### Deploy Akışı
- **Sadece backend:** SFTP otomatik
- **Sadece frontend:** `npm run build` → WinSCP + `git push paramgo master:main`
- **İkisi birden:** Her iki adım da gerekli

### Apple Ödeme (Araştırma tamamlandı 2026-03-29)
- **POS gerekmiyor** — Apple tüm ödeme altyapısını sağlıyor
- **Komisyon:** %15 (Small Business Program, yıllık 1M$ altı)
- **Ödeme:** Ayda 1, ~45 gün gecikme, USD olarak Wise hesabına
- **Türkiye teşviki:** Komisyonun %50'si devletten iade ediliyor
- **Strateji:** Faz 1 = Web-first ödeme (%0 komisyon), Faz 2 = IAP eklenir
- **Yapılacak:** Wise hesabı aç (USD IBAN), W-8BEN formu doldur, Small Business Program başvurusu

---

## TAMAMLANMIŞ GÖREVLER ARŞİVİ

<details>
<summary>Tamamlanan 36 görev (tıkla)</summary>

### Oturum #1 (2026-03-28)
- [1.1] Kurumsal e-posta (info@paramgo.com)
- [2.1] Token storage güvenliği (@capacitor/preferences)
- [2.2] SSL Pinning
- [2.3] Biyometrik kimlik doğrulama (Face ID / Touch ID)
- [2.4] Jailbreak/Root tespiti
- [2.5] iOS Privacy Manifest
- [2.6] Android cleartext traffic engelleme
- [2.7] Console.log temizleme (production)
- [3.2] App ID: com.paramgo.app
- [3.3] Distribution sertifikası
- [3.4] App Store Connect: ParamGo - Çek Takip
- [3.5] App Store metadata
- [3.6] App Privacy nutrition labels
- [3.7] Age rating (17+)
- [3.9] Hesap silme özelliği
- [4.4] Android API 36
- [5.1] iOS ve Android projeleri
- [5.7] Haptics (titreşim feedback)
- [5.8] Keyboard handling
- [1.3] KVKK aydınlatma metni (kısmi — UI tamamlandı)
- [1.4] Gizlilik politikası
- [1.5] Kullanım şartları

### Oturum #2 (2026-03-29)
- [5.3] Push token backend (POST/DELETE endpoint)
- [5.5] Deep link (apple-app-site-association)
- Play Store Financial Declaration metni

### Oturum #3 (2026-03-29)
- [7.1] GitHub repo + Codemagic bağlantısı
- [7.2] codemagic.yaml (16 iterasyon)
- [7.3] Sertifika/profil (distribution_pwd.p12)
- [7.4] Codemagic environment variables
- [6.1] TestFlight ilk build başarılı
- [8.1] Mobil giriş ekranı (Papara tarzı)
- [8.2] Mobil kayıt ekranı
- [8.3] Mobil şifre sıfırlama ekranı
- API URL düzeltmesi (paramgo.com/api)
- CANLI-DEPLOY.md güncelleme (3 aşamalı)

</details>
