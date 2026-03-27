# Modül Raporu — Durum Kontrol Skill'i
# Sen: "modül raporu", "durum raporu", "hangi modül eksik"

---

## NE YAPAR
Projedeki tüm modülleri tarar ve her birinin backend, frontend, tasarım ve güvenlik durumunu tablo halinde raporlar.

---

## TARAMA ADIMLARI

### 1. Modül Listesini Çıkar
`App.jsx` route tanımlarını oku → tüm modülleri listele

### 2. Her Modül İçin Kontrol Et

#### Backend Kontrolü
```
[ ] controllers/{Modul}Controller.php var mı?
[ ] models/{Modul}.php var mı?
[ ] routes/{modul}.php var mı?
[ ] public/index.php'de route require var mı?
[ ] Tüm sorgularda sirket_id filtresi var mı?
[ ] AuthMiddleware kullanılıyor mu?
```

#### Frontend Kontrolü
```
[ ] pages/{modul}/ klasörü var mı?
[ ] api/{modul}.js dosyası var mı?
[ ] App.jsx'te route tanımlı mı?
[ ] Sidebar'da link var mı? (AppLayoutParamGo.jsx)
```

#### Tasarım Kontrolü
```
[ ] p-page-header kullanılıyor mu?
[ ] p-page-header-icon ile sayfa ikonu var mı?
[ ] h1 + p-page-title kullanılıyor mu?
[ ] financial-num sınıfı tutar gösterimlerinde var mı?
[ ] Modal varsa ESC kapanma var mı?
[ ] Modal header doğru sınıf mı? (mh-default/danger/success)
[ ] Dekoratif ikon opacity 0.35 mi?
[ ] Border-radius 14px (kart) / 10px (buton) mi?
```

#### Güvenlik Kontrolü
```
[ ] Controller'da sirket_id JWT'den alınıyor mu?
[ ] Model'de WHERE sirket_id var mı?
[ ] Route'da AuthMiddleware var mı?
[ ] Frontend'de localStorage kullanılmamış mı?
```

---

## ÇIKTI FORMATI

```
📊 MODÜL DURUM RAPORU
━━━━━━━━━━━━━━━━━━━━

| Modül          | Backend | Frontend | Tasarım | Güvenlik | Durum  |
|----------------|---------|----------|---------|----------|--------|
| Dashboard      | ✅      | ✅       | ✅      | ✅       | Tamam  |
| Cari Hesaplar  | ✅      | ✅       | ✅      | ✅       | Tamam  |
| Çek/Senet      | ✅      | ✅       | ⚠️      | ✅       | 1 uyarı|
| Ödeme Takip    | ✅      | ✅       | ✅      | ✅       | Tamam  |
| Kasa           | ✅      | ✅       | ✅      | ✅       | Tamam  |
| Gelir/Gider    | ✅      | ✅       | ❌      | ✅       | 2 hata |
| Veresiye       | ✅      | ✅       | ⚠️      | ✅       | 1 uyarı|
| Vade Hesap.    | ✅      | ✅       | ✅      | ✅       | Tamam  |

━━━━━━━━━━━━━━━━━━━━
TOPLAM: 8 modül | 6 tamam | 1 uyarı | 1 hatalı

DETAYLAR:
🔴 Gelir/Gider — Tasarım:
  - page-header standartı kullanılmıyor
  - Kart border-radius tutarsız

🟡 Çek/Senet — Tasarım:
  - Yorum satırında eski tema referansı (kosmetik)
```

---

## EKLENEBİLECEK MODÜL ÖNERİSİ
Eğer PROJE.md veya mobil yol haritasında planlanmış ama henüz oluşturulmamış modüller varsa onları da listele:
```
📋 PLANLANMIŞ AMA EKSİK MODÜLLER:
  ⬜ Kategori Yönetimi — rakip analizinden çıktı
  ⬜ Bütçe Planlama — rakip analizinden çıktı
  ⬜ Tekrarlayan İşlemler — kısmen var, genişletilecek
```
