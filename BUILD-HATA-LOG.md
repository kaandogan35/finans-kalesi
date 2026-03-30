# ParamGo — Build Hata & Çözüm Logu
> Her yeni hata/çözüm bu dosyaya eklenir. Aynı hataya tekrar düşmemek için.
> Son güncelleme: 2026-03-30

---

## OTURUM 4 — 2026-03-30 (Codemagic Build Maratonu)

### HATA 1 — Yanlış Repo'ya Push
**Belirti:** Build başlıyor ama kodda hiçbir değişiklik yok gibi davranıyor
**Neden:** `git push origin master` yapıldı ama Codemagic `paramgo/main`'i izliyor
**Çözüm:** Her zaman iki remote'a push: `git push paramgo master:main && git push origin master`
**Dosya:** —

---

### HATA 2 — APP_STORE_CONNECT_PRIVATE_KEY PEM Hatası
**Belirti:** `not a valid PEM encoded private key`
**Neden:** Codemagic'e base64 olarak kayıtlı, CLI doğrudan PEM bekliyor
**Çözüm:** Script içinde decode:
```bash
if ! echo "$APP_STORE_CONNECT_PRIVATE_KEY" | grep -q "BEGIN"; then
  export APP_STORE_CONNECT_PRIVATE_KEY="$(echo "$APP_STORE_CONNECT_PRIVATE_KEY" | base64 --decode)"
fi
```
**Dosya:** codemagic.yaml

---

### HATA 3 — CERTIFICATE_PRIVATE_KEY Eksik
**Belirti:** Code signing adımında `CERTIFICATE_PRIVATE_KEY is not set` hatası
**Neden:** Codemagic env var'ı tanımlanmamış
**Çözüm:** Script içinde openssl ile oluştur:
```bash
if [ -z "$CERTIFICATE_PRIVATE_KEY" ]; then
  openssl genrsa -out /tmp/cert_private_key.pem 2048 2>/dev/null
  export CERTIFICATE_PRIVATE_KEY="$(cat /tmp/cert_private_key.pem)"
fi
```
**Dosya:** codemagic.yaml
**Not:** Build geçtikten sonra bu key'i Codemagic'e env var olarak kaydet (her build'de yeni sertifika oluşturmasın)

---

### HATA 4 — Provisioning Profile UUID Deprecated
**Belirti:** "Profile is missing UUID" veya xcode-project use-profiles hata
**Neden:** Xcode 16+ profil dizini değişti: `~/Library/Developer/Xcode/UserData/Provisioning Profiles/`
**Çözüm:** Manuel base64 profil yerine API otomatik indirme:
```bash
app-store-connect fetch-signing-files "$BUNDLE_ID" \
  --type IOS_APP_STORE --platform IOS --create
```
**Dosya:** codemagic.yaml

---

### HATA 5 — @capacitor-community/apple-sign-in SPM Çakışması
**Belirti:** `npm install` geçiyor ama iOS build'de SPM seviyesinde hata
**Neden:** capacitor-swift-pm 7.x bağımlılığı Capacitor 8 (swift-pm 8.x) ile uyumsuz
**Çözüm:** Paketi kaldır. Capacitor 8 uyumlu alternatif: `@capgo/capacitor-social-login` v8.3.6
**Dosya:** package.json

---

### HATA 6 — @codetrix-studio/capacitor-google-auth v4 Mevcut Değil
**Belirti:** `npm install` sırasında "version not found" veya peer dep hatası
**Neden:** v4.0.0 hiç yayınlanmadı; v3.4.0-rc.4 Capacitor 6 destekli
**Çözüm:** Paketi kaldır. Çözüm: `@capgo/capacitor-social-login` v8.3.6 (Apple + Google birlikte)
**Dosya:** package.json

---

## OTURUM 5 — 2026-03-30 (TestFlight Test + Mobil Hatalar)

### HATA 7 — Status Bar Race Condition
**Belirti:** Login ekranında siyah ikonlar (koyu arka plana gözükmuyor), dashboard'da beyaz ikonlar
**Neden:** `capacitorBaslat()` await edilmeden React render başlıyordu. `setStyle` çağrıları yarışa giriyordu — hangisi son bitirse o kalıyordu
**Çözüm:**
- `main.jsx`: async fonksiyon içinde `await capacitorBaslat()` sonra render
- `capacitorInit.js`: window fonksiyonları hazırlandı (`__statusBarSetDark/Light`)
- Auth sayfaları + AppLayout: async import yerine window fonksiyonu kullanıyor (senkron)
**Dosyalar:** main.jsx, capacitorInit.js, GirisYap.jsx, KayitOl.jsx, SifreSifirla.jsx, AppLayoutParamGo.jsx

---

### HATA 8 — FAB Butonlar Alt Menü Altında Kalıyor
**Belirti:** Gelirler/Giderler/TekrarlayanIslemler/CariYonetimi sayfalarında + butonu alt navigasyonun arkasına gömülüyor
**Neden:** Inline style `bottom: 88` (sabit piksel) — `env(safe-area-inset-bottom)` eklenmemiş. iPhone home indicator ~34px
**Çözüm:** `bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))'`
**Dosyalar:** GelirGiderSayfasi.jsx, TekrarlayanIslemler.jsx, CariYonetimi.jsx
**Not:** CekSenet FAB `p-fab-wrap` CSS class kullanıyor (paramgo.css'de doğru hesaplanmış) — sorun yok

---

### HATA 9 — Klavye Modal İçeriği Kapatıyor
**Belirti:** Modal içinde bir input'a tıklanınca klavye açılıyor, dropdown/içerik klavye arkasında kalıyor
**Neden:** Önceki çözüm (`scrollTop`) sadece input'u scroll ediyordu, dropdown listeler absolute konumlu olduğu için kayamıyordu
**Çözüm:** CSS değişkeni yaklaşımı — `--keyboard-h` set edilir, tüm modaller otomatik kayar:
- `capacitorInit.js`: keyboardWillShow → `--keyboard-h` CSS var set et; keyboardWillHide → kaldır
- `paramgo.css`: `body.keyboard-open .p-modal-center { padding-bottom: var(--keyboard-h, 0px) }`
**Dosyalar:** capacitorInit.js, paramgo.css

---

### HATA 10 — Xcode 26.2 ile use-profiles Çalışmıyor
**Belirti:** Step 8 (Build iOS IPA) hata: `"App" requires a provisioning profile` — status code 65
**Neden:** `xcode-project use-profiles` Xcode 26.2'de `project.pbxproj`'u güncellemedi. `CODE_SIGN_STYLE = Automatic` + `CODE_SIGN_IDENTITY = iPhone Developer` olarak kaldı. `build-ipa` `CODE_SIGN_STYLE=Manual` ile çağırıyor ama profil ataması boş.
**Çözüm:** `use-profiles` sonrası sed ile `project.pbxproj`'a elle yaz:
```bash
PROFILE_NAME=$(security cms -D -i "$PROFILE_FILE" | PlistBuddy -c "Print :Name" /dev/stdin)
sed -i '' 's/CODE_SIGN_STYLE = Automatic/CODE_SIGN_STYLE = Manual/g' "$PBXPROJ"
sed -i '' "s/PROVISIONING_PROFILE_SPECIFIER = \"[^\"]*\"/PROVISIONING_PROFILE_SPECIFIER = \"$PROFILE_NAME\"/g" "$PBXPROJ"
```
**Dosya:** codemagic.yaml (Set up code signing adımı)
**Not:** Xcode 26+ için kalıcı kural — `use-profiles` artık güvenilir değil, fallback zorunlu

---

## OTURUM 6 — 2026-03-30 (Status Bar + OpenSSL + Dropdown)

### HATA 11 — OpenSSL 3.x `-legacy` Flag Eksik
**Belirti:** `Private key extracted: (boş)` → `app-store-connect: error: argument --certificate-key: Provided value "" is not valid`
**Neden:** macOS Codemagic ortamında OpenSSL 3.x kurulu. OpenSSL 3.x, eski araçlarla üretilmiş `.p12` dosyalarını okumak için `-legacy` flag zorunlu kılar. `2>/dev/null` hataları susturduğu için boş çıktı sessizce geçiyordu.
**Çözüm:** `-legacy` flag ekle, fallback olarak standart mode dene:
```bash
EXTRACTED_KEY="$(openssl pkcs12 -legacy -in /tmp/dist_cert.p12 -nocerts -nodes -passin pass:"$CM_CERTIFICATE_PASSWORD" 2>/dev/null | sed -n '/-----BEGIN/,/-----END/p')"
if [ -z "$EXTRACTED_KEY" ]; then
  EXTRACTED_KEY="$(openssl pkcs12 -in /tmp/dist_cert.p12 -nocerts -nodes -passin pass:"$CM_CERTIFICATE_PASSWORD" 2>/dev/null | sed -n '/-----BEGIN/,/-----END/p')"
fi
```
**Not:** `grep -A 100 'BEGIN'` yerine `sed -n '/-----BEGIN/,/-----END/p'` kullan — çok satırlı PEM bloklarını doğru çeker.
**Dosya:** codemagic.yaml

---

### HATA 12 — Capacitor StatusBar Style Enum Tersine Anlaşıldı
**Belirti:** Login'de siyah ikonlar (koyu bg'da görünmüyor), Dashboard'da beyaz ikonlar (beyaz bg'da görünmüyor)
**Neden:** Capacitor `Style.Dark` ve `Style.Light` isimleri sezgisel değil:
- `Style.Dark` = **beyaz/açık ikonlar** → koyu arka plan için
- `Style.Light` = **siyah/koyu ikonlar** → açık arka plan için
**Çözüm:**
- Login/auth sayfaları (koyu bg) → `window.__statusBarSetDark?.()` (beyaz ikonlar)
- Dashboard/AppLayout (beyaz bg) → `window.__statusBarSetLight?.()` (siyah ikonlar)
- Sidebar açık (koyu bg) → `window.__statusBarSetDark?.()`
**Dosyalar:** GirisYap.jsx, KayitOl.jsx, SifreSifirla.jsx, AppLayoutParamGo.jsx
**KESİN KURAL:** "Dark" = koyu arka plan için beyaz ikon, "Light" = açık arka plan için siyah ikon.

---

### HATA 13 — AutoComplete Dropdown Klavye Altında Kalıyor
**Belirti:** Çek/senet modalında "Banka Seç" dropdown'ı klavye açıkken görünmüyor
**Neden:** `.p-autocomplete-list` `position: absolute; top: 100%` ile input'un altına açılıyor. Klavye açıkken o alan klavyenin altında kalıyor.
**Çözüm:** CSS ile klavye açıkken dropdown'ı yukarı çevir:
```css
body.keyboard-open .p-autocomplete-list { top: auto; bottom: 100%; }
```
**Dosya:** paramgo.css
**Not:** Bu fix tüm autocomplete dropdown'larını kapsar (banka seç, cari seç vb.)

---

## GENEL KURALLAR (Her Build'de Uygula)

1. **İki remote:** `git push paramgo master:main && git push origin master`
2. **API key:** Codemagic'te base64 → script'te PEM'e decode et
3. **Profil:** Manuel base64 değil, API otomatik (`fetch-signing-files --create`)
4. **Yeni paket eklemeden önce:** `npm view PAKET peerDependencies` + SPM uyumluluğu kontrol et
5. **Build hata okuma sırası:** Hangi step → o step'in logu → tam hata mesajı
6. **status bar:** Auth ekranları `window.__statusBarSetLight()`, AppLayout `window.__statusBarSetDark()`
7. **FAB butonlar:** `bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))'` — sabit 88 KULLANMA
8. **Klavye:** CSS var `--keyboard-h` ile çalışır, yeni modal eklerken `.p-modal-center` class kullan
