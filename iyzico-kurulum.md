# iyzico Abonelik Entegrasyonu — Kurulum & Sorun Giderme

**İlk Oluşturma:** 2026-04-20
**Son Güncelleme:** 2026-04-25
**Mevcut Durum:** Entegrasyon TAMAMLANDI — `errorCode: 100001` iyzico backend hatası nedeniyle bekliyoruz
**Sonraki Oturum Trigger:** "iyzico'dan cevap geldi, kaldığımız yerden devam"

---

## 0. ŞU AN NEREDEYİZ — ÖZET

✅ **Bizim taraf %100 hazır:**
- iyzico PHP SDK kuruldu (manuel, composer yok)
- IyzicoHelper.php tüm fonksiyonlarıyla yazıldı (checkoutBaslat, checkoutSonucSorgula, abonelikDetay, abonelikIptal, webhookImzaDogrula V1+V3)
- AbonelikController.yukselt + iyzicoDogrula + iyzicoAktive + iyzicoIptal hazır
- WebhookController.webOdeme V1+V3 imza doğrulamalı çalışıyor
- Frontend: PlanSecim.jsx + PaywallModal.jsx web akışı + ManuelAktivasyon
- public/odeme.php profesyonel ödeme sayfası
- public/odeme-tamamlandi.php callback sayfası
- Kayıt formuna **telefon zorunlu alanı** eklendi (frontend + backend)

⏸ **Bekleniyor:**
- iyzico support cevabı (errorCode 100001 "Sistem hatası")
- Cevap gelene kadar test yapma — daha fazla anti-fraud bloğu riski

---

## 1. PROJE ÖZETİ

ParamGo SaaS web ödeme kanalı = iyzico Subscription + Checkout Form.
- **iOS:** Apple IAP + RevenueCat — DOKUNULMADI ✋
- **Web:** iyzico Subscription Checkout
- **Ortak backend:** `abonelikler.odeme_kanali` ENUM('web','apple','google','iyzico')

---

## 2. SABİTLENMİŞ KARARLAR

| # | Karar |
|---|---|
| 1 | Planlar: Standart + Kurumsal |
| 2 | Web fiyatları: Standart 360/3.600 ₺ • Kurumsal 540/5.400 ₺ |
| 3 | Apple fiyatları (dokunulmaz): 399,99/3.999,99 — 599,99/5.999,99 |
| 4 | 7 gün ücretsiz deneme (her plan) |
| 5 | Kart başta alınır, 8. gün otomatik çekim |
| 6 | İade: 14 gün tam iade (kullanılmamış olmak şartıyla) |
| 7 | İptal: Tek tık, dönem sonuna kadar erişim |
| 8 | Kurumsal akış: Standart ile aynı otomatik akış |
| 9 | Kart saklama eklentisi: Kapalı |

**KDV:** "+KDV / dönem" ibaresi kullanılıyor (rakipler Paraşüt, BizimHesap ile uyumlu)

---

## 3. iyzico HESAP & PANEL

| Bilgi | Değer |
|-------|-------|
| Üye No | **101030951** |
| Şirket | HAFİZE DOĞAN (Şahıs) |
| Website | www.paramgo.com |
| Para gönderim | Haftalık |
| Bloke gün | 14 gün |
| 3D Secure | Tutar boş (tüm ödemeler non-3DS riskli, ileride zorla) |
| Kart Saklama | Kapalı ✅ |
| BKM Express | Kapalı ✅ |
| Webhook URL | `https://paramgo.com/api/webhook/web` |

### Plan Referans Kodları (canlı production'da hardcoded)

```php
PLAN_KODLARI = [
    'standart' => [
        'aylik'  => '06d2cecf-bdb9-44b4-8740-bb0fa42d8968',
        'yillik' => '2e8611ba-bd74-48dc-8db3-49a3c16a4931',
    ],
    'kurumsal' => [
        'aylik'  => 'ffdeb3cb-de30-4c14-8a36-f5791797bf48',
        'yillik' => '129785d6-3cee-44e6-9f36-d3061caedb61',
    ],
]
```

### .env Değişkenleri (canlıda set edili)

```
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
IYZICO_BASE_URL=https://api.iyzipay.com
```

---

## 4. TAMAMLANAN DOSYALAR

### Backend
- `vendor/iyzico/iyzipay-php/` — manuel kurulu, autoloader IyzicoHelper'da SplClassLoader ile başlatılıyor
- `utils/IyzicoHelper.php` — TÜM iyzico iletişimi (telefon format, customer, çekim, iptal, webhook V1+V3 imza)
- `controllers/AbonelikController.php`:
  - `yukselt()` — checkout formu başlat (telefon zorunlu kontrol + sirket adresi)
  - `iyzicoDogrula($token)` — token ile abonelik aktive
  - `iyzicoAktive($abonelik_ref)` — manuel ref kodu ile aktive
  - `iyzicoIptal()` — abonelik iptal
- `controllers/WebhookController.php::webOdeme()` — V1+V3 hibrit imza doğrulama
- `controllers/AuthController.php::kayit()` — telefon zorunlu, format kontrolü, kullanicilar tablosuna yaz
- `models/Abonelik.php` — iyzico ENUM, sirketIdIyzicoDan, iyzicoOdemeIslendiMi, planBilgisiIyzicoDan, iyzicoReferansKaydet
- `utils/RevenueCatHelper.php` — odeme_kanali='iyzico' veya 'web' olanlar için RC sync bypass

### Frontend
- `frontend/src/pages/abonelik/PlanSecim.jsx` — web akış + manuel aktivasyon + auto-verify
- `frontend/src/components/PaywallModal.jsx` — Capacitor.isNativePlatform() ile iOS/web ayrımı
- `frontend/src/pages/auth/KayitOl.jsx` — kayıt formuna telefon zorunlu alan (mobil + web)

### Public (sunucu)
- `public/odeme.php` — profesyonel iyzico checkout sayfası (popup-mode, spinner, kredi kartı uyarısı)
- `public/odeme-tamamlandi.php` — başarılı ödeme callback (statik PHP, auth gerektirmez)

### Sunucu Yolları
- Backend: `/home/goparam/repositories/finans-kalesi/`
- Public: `/home/goparam/public_html/`
- error_log: `/home/goparam/logs/php_error.log`

---

## 5. KARŞILAŞILAN SORUNLAR & ÇÖZÜMLER

| Sorun | Sebep | Çözüm |
|-------|-------|-------|
| `Class not found` | Composer yok, autoloader başlamıyor | SplClassLoader ile absolute path register |
| `Geçersiz telefon (200310)` | Dummy `+905555555555`, sonra `+905000000000` | Real phone enforcement, dummy fallback `+905550000000` |
| Form açılmıyor mobile | popup-mode butona tıklamak gerekiyordu | Geçici responsive denedik, sonra popup-mode'a geri döndük |
| `Ödeme formu tamamlanmamış` | Stale localStorage token sürekli verify ediyor | F12 console'dan localStorage temizleme + odeme.php popup-mode |
| RevenueCat planı silinen | RC Sync iyzico kanalını anlamıyor | RevenueCatHelper'a `odeme_kanali === 'iyzico'/'web'` bypass |
| ENUM truncate | abonelikler.odeme_kanali'da 'iyzico' yoktu | `ALTER TABLE ... ENUM('web','apple','google','iyzico')` |
| `Sistem hatası (100001)` | iyzico backend, bilinmeyen sebep | **iyzico support'a mail atıldı (2026-04-25)** |

---

## 6. iyzico SUPPORT'A GÖNDERİLEN MAIL (2026-04-25)

**Konu:** Production Subscription — errorCode 100001 — Destek Talebi

Endpoint: `POST https://api.iyzipay.com/v2/subscription/checkoutform/complete`
HTTP Status: 422
Response: `{"status":"failure","errorCode":"100001","errorMessage":"Sistem hatası","systemTime":1777120070770}`

**Test sonuçları:**
- Daha önce 4 başarılı abonelik ile aynı kod
- Eklentilerde Abonelik modülü AKTİF
- 4 farklı kullanıcı / kredi kartı / IP — hepsi aynı hata
- Müşteri verileri tam: gerçek email, +905XXX telefon, ad-soyad, fatura/teslimat
- Plan referansları doğru (yukarıdaki UUID'ler)

conversationId formatımız: `pg-{sirket_id}-{timestamp}`
systemTime: `1777120070770`

---

## 7. CEVAP GELDİĞİNDE NE YAPILACAK

### Senaryo A — iyzico "Hesabınızda kısıtlama vardı, açtık"
1. Tek bir test denemesi yap (gerçek kart, gerçek hesap)
2. Başarılıysa → frontend build → `public/frontend-build/` deploy
3. Test aboneliğini iyzico panelinden iptal et (gerçek 360 TL çekilmesin)
4. v1.0.2 release notes güncelle
5. Edge case testlerine geç (iptal, refund, expire, retry)

### Senaryo B — iyzico "Şu parametreyi yanlış gönderiyorsunuz"
1. Önerdikleri düzeltmeyi `IyzicoHelper.php`'ye uygula
2. WinSCP ile yükle
3. Tekrar test
4. Başarılıysa → A senaryosundan devam

### Senaryo C — iyzico "Şu eklentiyi açmanız lazım"
1. Eklentiyi al/aktifleştir (gerekirse ücret öde)
2. 24 saat bekle (genelde provision süresi var)
3. Test et

### Senaryo D — iyzico cevap vermezse 48 saat içinde
- Telefonla destek hattını ara: 0850 532 12 12
- conversationId, systemTime, hesap email ile

---

## 8. DEPLOY SIRASI (Cevap Sonrası Yeni Kod Çıkacaksa)

WinSCP ile manuel — SFTP watcher YOK:

| Yerel | Sunucu |
|-------|--------|
| `controllers/AbonelikController.php` | `/home/goparam/repositories/finans-kalesi/controllers/AbonelikController.php` |
| `controllers/AuthController.php` | `/home/goparam/repositories/finans-kalesi/controllers/AuthController.php` |
| `controllers/WebhookController.php` | `/home/goparam/repositories/finans-kalesi/controllers/WebhookController.php` |
| `utils/IyzicoHelper.php` | `/home/goparam/repositories/finans-kalesi/utils/IyzicoHelper.php` |
| `utils/RevenueCatHelper.php` | `/home/goparam/repositories/finans-kalesi/utils/RevenueCatHelper.php` |
| `models/Abonelik.php` | `/home/goparam/repositories/finans-kalesi/models/Abonelik.php` |
| `routes/abonelik.php` | `/home/goparam/repositories/finans-kalesi/routes/abonelik.php` |
| `public/odeme.php` | `/home/goparam/public_html/odeme.php` |
| `public/odeme-tamamlandi.php` | `/home/goparam/public_html/odeme-tamamlandi.php` |
| `frontend/dist/` (build sonrası) | `/home/goparam/public_html/frontend-build/` |

---

## 9. TEST SENARYOLARI (Cevap Sonrası, Sırasıyla)

1. ✅ Yeni hesap kayıt (telefon zorunlu) → email+telefon DB'ye yazıldı mı
2. ✅ Kayıt → 7 gün deneme aktif → Aboneliğim sayfasında deneme görünüyor
3. ⏸ Standart Aylık abone → kart bilgisi → ABONE OL → odeme-tamamlandi.php → plan aktif
4. ⏸ Webhook tetikleme → V3 imza doğrulama → log'da V3 yazıyor mu
5. ⏸ Plan değişimi (Standart → Kurumsal) → "zaten aktif planınız var" hatası mı
6. ⏸ İptal → iyzico panelinde CANCELED → DB'de plan deneme'ye düşüyor mu
7. ⏸ iOS regression: native cihazda Apple IAP hala çalışıyor mu
8. ⏸ Manuel Aktive Et — iyzico panelinden ref kopyala → workaround çalışıyor mu
9. ⏸ Yetersiz bakiye → kullanıcıya doğru hata mesajı
10. ⏸ Çift tıklama → duplicate koruma (yukselt'te aktif plan kontrolü)

---

## 10. iOS DOKUNULMAYACAK DOSYALAR ✋

- `utils/RevenueCatHelper.php` (sadece web/iyzico bypass eklendi, Apple kısmı dokunulmadı)
- `AbonelikController::iapDogrula()`
- `WebhookController::revenueCat()`
- iOS push, Capacitor entegrasyonu
- frontend'de Capacitor.isNativePlatform() kontrolü

---

## 11. KULLANIŞLI KOMUTLAR

```bash
# Local'de değişiklikleri görmek
cd /c/laragon/www/Projeler/finans-kalesi
git status

# Sunucu log'u (cPanel File Manager veya SSH)
tail -100 /home/goparam/logs/php_error.log

# localStorage temizle (tarayıcı F12 console)
localStorage.removeItem('iyzico_bekleyen_token'); location.reload()

# DB acil müdahale (phpMyAdmin)
SELECT id, email, telefon FROM kullanicilar WHERE email = 'X';
UPDATE kullanicilar SET telefon = '+905XXXXXXXXX' WHERE email = 'X';
```

---

## 12. KAYNAKLAR

- iyzico PHP SDK: https://github.com/iyzico/iyzipay-php
- Abonelik dokümantasyonu: https://docs.iyzico.com/urunler/abonelik/abonelik-entegrasyonu
- Webhook V3 imza: https://docs.iyzico.com/ek-servisler/imza-yanitinin-dogrulanmasi
- Hata kodları: https://docs.iyzico.com/ek-bilgiler/hata-kodlari
- Destek: destek@iyzico.com
- Telefon: 0850 532 12 12
