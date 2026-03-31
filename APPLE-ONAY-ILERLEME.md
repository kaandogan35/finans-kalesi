# ParamGo — Apple App Store Onay İlerleme Takibi
Son güncelleme: 2026-03-31

---

## DURUM ÖZETI
- Build: ✅ Codemagic başarılı (2026-03-31)
- TestFlight: ✅ Build yüklü
- App Store Gönderimi: ⏳ Devam ediyor

---

## TAMAMLANANLAR ✅

### Teknik (Önceki Oturumlar)
- PrivacyInfo.xcprivacy — Financial Info, Email, Name, UserID, UserDefaults beyan edildi
- Privacy Policy URL — https://paramgo.com/gizlilik App Store Connect'te kayıtlı
- App Privacy data types — Name, Email, Financial Info, User ID
- Hesap silme akışı — GuvenlikEkrani.jsx → Hesabım sekmesi (şifreli silme + onay)
- KVKK onay ekranı — KvkkOnay.jsx (iOS ilk açılışta gösteriyor)
- Sürüm 1.0 (MARKETING_VERSION = 1.0)

---

## YAPILACAKLAR

### KOD DEĞİŞİKLİKLERİ (Claude yapıyor)

- [ ] **1.** `PlanSecim.jsx` — iOS'ta fiyat/upgrade UI gizle + "Web'den aldığınız abonelik..." metnini kaldır
  - Sorun: iOS'ta plan fiyatları + upgrade butonu = Apple IAP kuralı ihlali
  - Sorun: "Web'den aldığınız abonelik iOS'ta geçerlidir" metni = dış ödeme yönlendirme = red
  - Çözüm: `Capacitor.isNativePlatform()` ile iOS'ta sadece mevcut plan bilgisi göster

- [ ] **2.** `AuthController.php` — `appleGiris()`, `googleGiris()`, `kayitOl()` → yeni kayıt = 'ucretsiz' plan
  - Sorun: Sosyal giriş ile kayıt olan kullanıcılar 'kurumsal' plan alıyor
  - Çözüm: Yeni kayıtlarda plan 'ucretsiz' olarak set edilmeli

- [ ] **3.** `paramgo.css` — `.p-ob-hero` onboarding status bar padding düzeltmesi
  - Sorun: Gradient header status bar arkasına giriyor
  - Çözüm: `padding-top: calc(env(safe-area-inset-top, 0px) + 44px)`

- [ ] **4.** Sonner → CenterAlert geçişi (25 dosyada import değişikliği)
  - Sorun: Toast bildirimleri status bar'ın üstüne biniyor
  - Çözüm: `import { toast } from 'sonner'` → `import { bildirim as toast } from '../../components/ui/CenterAlert'`

- [ ] **5.** Build al + `git push origin master` + `git push paramgo master`

### APP STORE CONNECT (Beraber yapılacak)

- [ ] **6.** Age Rating anketi doldur → 4+ çıkacak
  - Yol: App Store Connect → Uygulamam → App Information → Age Rating

- [ ] **7.** App Review Notes — finans beyanı + demo hesap
  - Demo: test@paramgo.com / Test1234!
  - Finans beyanı (kopyala-yapıştır):
    ```
    Demo Account: test@paramgo.com / Test1234!

    ParamGo does not process financial transactions, transfer funds, or
    provide financial services. It is a record-keeping tool that allows
    small business owners to track their own checks, cash flow, and
    receivables. No BDDK or financial institution license is required
    for this category under Turkish law.

    The app interface is in Turkish. "Çek" = check/promissory note,
    "Kasa" = cash register/safe, "Cari" = account receivable/payable.
    ```

- [ ] **8.** Metadata güncellemeleri:
  - Uygulama adı: `ParamGo: Çek & Kasa Takibi` (27 karakter)
  - Altyazı: `Kasa, Çek, Borç Takibi`
  - Keywords: `çek takip,kasa,borç alacak,vade,esnaf,nakit akışı,muhasebe,KOBİ,gelir gider,fatura`
  - Açıklama: (rapordaki hazır metin — BÖLÜM 1.4)
  - Export Compliance: Standard encryption (HTTPS)
  - IDFA: "No"
  - Primary Category: Finance
  - Secondary Category: Business

- [ ] **9.** Screenshots hazırla ve yükle
  - Boyut: 1320 × 2868 piksel (iPhone 6.9" — ZORUNLU)
  - Sıra: Çek listesi → Kasa → Borç-alacak → Vade bildirimi → Çek ekleme

- [ ] **10.** Submit for Review — GÖNDER

---

## ÖNEMLİ NOTLAR

### Apple IAP Kararı
ParamGo 1.0'da Apple IAP kullanmıyor. iOS'ta abonelik UI tamamen gizlenecek.
- Yasal: Uygulama içinde ücret sunulmadığında IAP zorunlu değil
- İleride: v1.1'de Apple IAP eklenecek (StoreKit + RevenueCat önerilen)

### Versiyon
- MARKETING_VERSION = 1.0
- CURRENT_PROJECT_VERSION = 1 (her yeni build +1 olmalı)

### Test Hesabı
- Email: test@paramgo.com
- Şifre: Test1234!
- Bu hesap App Review Notes'a yazılacak

### Codemagic
- Branch: master
- Push: `git push origin master` VE `git push paramgo master`
- Build süresi: ~5-8 dakika
