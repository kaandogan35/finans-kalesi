# ParamGo — App Store & Google Play Metadata
> Hazırlık tarihi: 2026-03-28
> Durum: Hazır — App Store Connect ve Play Console'a yapıştırılabilir

---

## UYGULAMA ADI
```
ParamGo — KOBİ Takip Sistemi
```
> iOS: max 30 karakter → 30 karakter (tam limit)
> Android: max 50 karakter → kullanılabilir

---

## PROMOTIONAL TEXT (iOS — 170 karakter, her güncellemede değişebilir)
```
Çeklerinizi, kasanızı ve carilerinizi tek yerden takip edin. Muhasebe bilgisi gerekmez.
```

---

## KISA AÇIKLAMA (Android — max 80 karakter)
```
Çek, kasa ve cari takibi — esnaf ve KOBİ'ler için, muhasebe bilgisi gerekmez.
```
> 79 karakter ✓

---

## TAM AÇIKLAMA (iOS & Android — max 4000 karakter)

```
ParamGo, çekle çalışan esnaf ve KOBİ'ler için tasarlanmış gelir-gider ve cari hesap takip sistemidir. Muhasebe bilgisine gerek yoktur — günlük işlemlerinizi sadece birkaç dokunuşla kaydedin.

🟢 NE İŞE YARAR?

Cari Hesap Takibi
Müşterilerinizin ve tedarikçilerinizin borç/alacak durumunu anlık görün. Kimin ne kadar borcunuz olduğunu kolayca takip edin.

Çek ve Senet Yönetimi
Aldığınız ve verdiğiniz çeklerin vade tarihlerini, tahsilat durumunu ve tutarlarını kaydedin. Vade yaklaştığında hatırlatma alın.

Kasa ve Nakit Akışı
Günlük nakit girişlerinizi ve çıkışlarınızı kaydedin. Kasanızın anlık bakiyesini her zaman görün.

Gelir & Gider Takibi
Hangi kategoride ne kadar harcadığınızı, ne kadar kazandığınızı görsel raporlarla takip edin.

Vade Hesaplayıcı
Çek vadesi, faiz ve gün hesaplamalarını saniyeler içinde yapın.

Raporlar
Aylık, dönemsel ve özel tarih aralığı raporları — PDF olarak paylaşın veya CSV olarak dışa aktarın.

🔒 GÜVENLİK
• Verileriniz AES-256-GCM şifreleme ile korunur
• İki faktörlü kimlik doğrulama (2FA) desteği
• Face ID / Touch ID ile hızlı ve güvenli giriş
• Tüm verilerinizi istediğiniz zaman dışa aktarabilir veya hesabınızı silebilirsiniz

💼 KİM İÇİN?
• Çekle çalışan esnaf ve tüccarlar
• Küçük ve orta ölçekli işletmeler (KOBİ)
• Serbest çalışanlar ve girişimciler
• Muhasebesini kendi yönetmek isteyen işletme sahipleri

📱 PLATFORM
ParamGo web ve mobil uygulaması olarak çalışır. Tüm cihazlarınızda aynı veriye erişin — bilgisayar, tablet ve telefon.

Sorularınız için: destek@paramgo.com
Gizlilik politikası: https://paramgo.com/gizlilik
```
> ~1.850 karakter — limitin çok altında, genişletilebilir.

---

## ANAHTAR KELİMELER (iOS — max 100 karakter, virgülle ayrılmış)
```
çek takip,kasa,cari hesap,gelir gider,KOBİ,esnaf,finans,muhasebe,senet,vade
```
> 79 karakter ✓

---

## DESTEK URL
```
https://paramgo.com/destek
```

## GİZLİLİK POLİTİKASI URL
```
https://paramgo.com/gizlilik
```

## PAZARLAMA URL (isteğe bağlı)
```
https://paramgo.com
```

---

## YAŞ SINIRI
- **iOS:** 17+ (Finansal veri içerir)
- **Android:** Teen (13+) / Everyone (içeriğe göre IARC anketi doldurulacak)

---

## KATEGORİ
- **iOS Birincil:** Finance
- **iOS İkincil:** Business
- **Android:** Finance

---

## APP STORE REVIEW NOTES (İnceleme notu — Apple'a gönderilecek)
```
ParamGo is a bookkeeping and cash flow tracking tool for Turkish SMBs and tradespeople.

The app helps users track:
- Accounts receivable/payable (cari hesaplar)
- Checks and promissory notes (çek/senet) with due dates
- Daily cash transactions (kasa)
- Income and expenses by category

This app does NOT:
- Process payments or money transfers
- Act as a financial intermediary
- Require BDDK, SPK, or any other Turkish financial regulatory license

Test account credentials:
Email: test@paramgo.com
Password: Test1234!

The test account contains sample data (customers, checks, cash entries) for review purposes.
Please use the "Hesabım" tab in Security settings to see the account deletion feature.
```

---

## EKRAN GÖRÜNTÜLERİ GEREKSİNİMLERİ

### iOS (App Store Connect)
| Boyut | Cihaz | Zorunlu mu? |
|---|---|---|
| 1320 x 2868 px | iPhone 6.9" (iPhone 16 Pro Max) | ✅ Zorunlu |
| 1290 x 2796 px | iPhone 6.7" (iPhone 14 Pro Max) | Önerilen |
| 2048 x 2732 px | iPad 13" (12.9") | ✅ Zorunlu |
| 1488 x 2266 px | iPad 11" | Önerilen |

**Ekran görüntüsü alınacak akışlar:**
1. Dashboard — KPI kartları ve özet grafik
2. Cari listesi — müşteri/tedarikçi bakiyeleri
3. Çek/senet listesi — vade tarihleri ve durumlar
4. Kasa — nakit akışı özeti
5. Raporlar — grafik ve özet

### Android (Play Console)
| Boyut | Açıklama | Zorunlu mu? |
|---|---|---|
| 1080 x 1920 px | Telefon (min 2, max 8) | ✅ Zorunlu |
| 1200 x 1920 px | Tablet (opsiyonel) | Önerilen |
| 1024 x 500 px | Feature Graphic | ✅ Zorunlu |

---

## UYGULAMA İKONU
| Platform | Boyut | Not |
|---|---|---|
| iOS | 1024 x 1024 px | Şeffaf arka plan YOK, köşe yuvarlama Apple yapar |
| Android | 512 x 512 px (Play Store) | Adaptive icon: foreground + background ayrı |
| Android | 108 x 108 dp (adaptive foreground) | Safe zone: 72 x 72 dp |

**Komut:** `npx capacitor-assets generate` — tüm boyutları otomatik üretir (kaynak: 1024x1024 PNG)

---

## DEEP LINK URL ŞEMASI
- iOS: `paramgo://` (scheme) veya `https://paramgo.com` (Universal Links)
- Android: `https://paramgo.com` (App Links)

Desteklenen path'ler:
- `/sifre-sifirla` → şifre sıfırlama
- `/davet` → kullanıcı daveti
- `/dogrula` → e-posta doğrulama
