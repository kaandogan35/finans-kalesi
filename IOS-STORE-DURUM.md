# ParamGo — iOS App Store Hazırlık Durumu
Son güncelleme: 2026-03-30

---

## TAMAMLANANLAR ✅

### Teknik Altyapı
- [x] Capacitor 8 + SPM (CocoaPods yok)
- [x] contentInset: 'never' — beyaz şerit düzeltildi
- [x] StatusBar rengi — auth ekranı beyaz ikon, dashboard siyah ikon
- [x] Klavye sorunu — input klavye arkasına gizlenmiyor
- [x] Bildirim popup — status bar altından açılıyor
- [x] Çek/senet modallarında Tutar 2. sıraya taşındı
- [x] viewport-fit=cover, UIViewControllerBasedStatusBarAppearance
- [x] NSFaceIDUsageDescription, NSCameraUsageDescription
- [x] PrivacyInfo.xcprivacy (Financial Info, Email, Name, UserID)

### Codemagic
- [x] mac_mini_m2 instance
- [x] Cache: node_modules, SPM, CompilationCache
- [x] cancel_previous_builds
- [x] Dinamik provisioning profile UUID
- [x] Sign In with Apple entitlements build adımı

### Apple Developer Portal
- [x] Sign In with Apple capability — com.paramgo.app
- [x] Provisioning Profile yenilendi + Codemagic'e yüklendi

### App Store Connect
- [x] Privacy Policy URL: https://paramgo.com/gizlilik
- [x] Data Types: Name, Email, Financial Info, User ID

### Sosyal Giriş & Push
- [x] Apple Sign-In — frontend + backend (JWT doğrulama)
- [x] Google Sign-In — frontend + backend (kod hazır, Client ID eksik)
- [x] Push Notification — izin altyapısı + token kayıt
- [x] Database: apple_user_id, google_user_id, push_tokens tablosu

---

## BEKLEYEN ⏳

### Öncelik 1 — Build Sonucu
- [ ] Codemagic build başarılı mı kontrol et
- [ ] TestFlight'ta yeni build görünüyor mu
- [ ] Status bar, klavye, Apple Sign-In test et

### Öncelik 2 — Google Sign-In Kurulumu (Kullanıcı Yapacak)
- [ ] console.cloud.google.com → Yeni proje oluştur
- [ ] "Google Sign-In" API'yi etkinleştir
- [ ] OAuth 2.0 → iOS client ID oluştur (bundle ID: com.paramgo.app)
- [ ] Client ID'yi Codemagic env veya capacitor.config.ts'e ekle
- [ ] Info.plist'e reversed client ID URL scheme ekle

### Öncelik 3 — App Store Submission
- [ ] Ekran görüntüleri hazırla (iPhone 6.7" ve 6.1")
- [ ] Uygulama açıklaması yaz (TR + EN)
- [ ] Yaş sınırı: 4+ (finansal içerik, şiddet yok)
- [ ] App Review bilgileri: demo hesap ekle (test@paramgo.com / Test1234!)
- [ ] 1.0 versiyonunu App Store Review'a gönder

### Öncelik 4 — İleride
- [ ] Face ID / Touch ID test (cihazda dene)
- [ ] Push notification gönderme altyapısı (APNs sertifikası)
- [ ] Android build (Google Play)
- [ ] Ödeme entegrasyonu (PayTR / Apple IAP)

---

## NOTLAR

- iOS klasörü `.gitignore`'da → build Codemagic'te yapılıyor
- Push token kayıt: giriş sonrası otomatik (authStore.js)
- Apple Sign-In sadece mobilde çalışır (isNative kontrolü var)
- Google Sign-In için Client ID olmadan buton görünür ama hata verir
