# Tasarim Denetim — Modullerdeki Tasarim Bozukluklarini Tespit Skill'i

---
name: tasarim-denetim
description: >
  ParamGo / ParamGo projesindeki tum modullerin tasarim kalitesini denetler.
  CSS tutarsizliklari, tema uyumsuzluklari, responsive sorunlar, bileşen standart ihlalleri
  ve erişilebilirlik problemlerini tespit eder. Turkce rapor uretir.
  Kullanici "tasarim denetle", "tasarim kontrol", "UI denetim", "stil tutarsizlik",
  "tasarim bozukluk", "CSS kontrol", "tema uyumsuzluk", "responsive sorun",
  "bileşen tutarsizlik", "tasarim raporu", "UI audit", "design audit",
  "gorsel kontrol", "bozuk tasarim", "tasarim kalitesi", "stil denetimi"
  gibi ifadeler kullandiginda MUTLAKA tetikle.
---

## AMAC

Bu skill, projedeki tum modulleri (veya belirtilen modulu) tarar ve
CLAUDE.md + tasarim-*.md dosyalarindaki kurallara gore tasarim ihlallerini tespit eder.
Her sorun icin dosya yolu, satir numarasi, aciklama, onem derecesi ve duzeltme onerisi verir.

---

## TARAMA STRATEJISI

### Kapsam Belirleme
- Kullanici belirli bir modul soylerse → sadece o modulun dosyalarini tara
- "tum moduller", "hepsini tara" derse → `frontend/src/pages/` altindaki tum modulleri tara
- Ek olarak: `frontend/src/components/` altindaki paylasilan bileşenleri de kontrol et

### Taranacak Dosyalar
```
frontend/src/pages/**/*.jsx       — Sayfa bileşenleri
frontend/src/components/**/*.jsx  — Paylasilan bileşenler
frontend/src/temalar/paramgo.css  — Tema dosyasi (referans olarak oku)
frontend/src/App.jsx              — Route yapisi
frontend/src/index.css            — Temel stiller
```

### Tarama Sirasi
1. Oncelikle `paramgo.css` dosyasini oku → mevcut CSS degiskenlerini ve siniflarini ogren
2. Her modulu sirayla tara
3. Tum sonuclari birleştir ve raporla

---

## DENETIM KONTROL LISTESi (8 KATEGORI, 54 KURAL)

---

### KATEGORI 1: BORDER-RADIUS UYUMU

Her JSX dosyasinda asagidaki kurallari kontrol et:

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| BR-01 | Kart, panel, modal, KPI bileşenlerinde border-radius | **14px** | Kritik |
| BR-02 | Buton, input, badge, tag elemanlarinda border-radius | **10px** | Kritik |
| BR-03 | Pill badge (vade, cari tipi) border-radius | **20px** (istisna) | Orta |
| BR-04 | Progress bar border-radius | **2px** (istisna) | Dusuk |
| BR-05 | YASAK degerler kullanilmis mi: 6, 7, 8, 12, 16px | Yok olmali | Kritik |

**Nasil Tespit Edilir:**
```
- `borderRadius:` veya `border-radius:` iceren satirlari bul
- Degeri cikar ve standartlarla karsilastir
- CSS sinifi kullaniliyorsa (ornegin p-kpi-card) sorun yok — sinifin icinde dogru tanimli
- Inline style ile YANLIS deger verilmis mi kontrol et
```

---

### KATEGORI 2: TIPOGRAFI & FONT

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| TY-01 | fontFamily inline style kullanilmis mi | YASAK — CSS degisken kullan | Yuksek |
| TY-02 | Inter disinda font referansi var mi | YASAK | Kritik |
| TY-03 | Sayfa basligi boyutu | 20px, fontWeight: 700 | Orta |
| TY-04 | KPI etiket stili | 11px, 600, uppercase, 0.08em letter-spacing | Orta |
| TY-05 | KPI deger stili | clamp(16px, 5cqw, 26px) kullanilmali | Orta |
| TY-06 | Tablo basligi stili | 11px, 700, uppercase | Orta |

**Nasil Tespit Edilir:**
```
- `fontFamily` inline style araması yap → varsa ihlal
- Font isimleri ara: Arial, Helvetica, Roboto, Poppins vb. → varsa ihlal
- Sayfa basliklarinda fontSize kontrolu yap
```

---

### KATEGORI 3: RENK & TEMA UYUMU

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| RK-01 | Inline `color:` ile hardcoded hex/rgb kullanilmis mi | YASAK — CSS class kullan | Kritik |
| RK-02 | Inline `background:` ile hardcoded renk | YASAK — CSS class kullan | Kritik |
| RK-03 | Inline `borderLeft/Right/Top/Bottom` renk | YASAK — CSS class kullan | Yuksek |
| RK-04 | Inline `boxShadow` kullanilmis mi | YASAK — var(--p-shadow-*) kullan | Yuksek |
| RK-05 | Navy (#0A2463) rengi kullanilmis mi | YASAK — eski tema | Kritik |
| RK-06 | Gold/Amber renkleri kullanilmis mi | YASAK — eski tema | Kritik |
| RK-07 | Eski tema sinif kalintilari: banking-, earthy-, dark- prefix | YASAK — silindi | Kritik |
| RK-08 | Tema prefix olmadan sinif kullanimi (p- olmadan) | Kontrol et | Yuksek |

**Nasil Tespit Edilir:**
```
- style={{ color: '#...' }} veya style={{ color: 'rgb(...)' }} ara
- style={{ background: ... }} (var(--p-...) haric) ara
- style={{ boxShadow: ... }} ara
- #0A2463, #0a2463, navy, amber, gold kelimelerini ara
- className icinde 'banking-', 'earthy-', 'dark-' ara
- className icinde ${p}- olmayan proje-spesifik siniflari kontrol et
```

**Izin Verilen Inline Renkler:**
```jsx
// BUNLAR SERBEST — ihlal sayma:
style={{ color: 'var(--p-color-primary)' }}   // CSS degiskeni → OK
style={{ color: 'var(--p-color-danger)' }}    // CSS degiskeni → OK
style={{ color: 'inherit' }}                  // inherit → OK
```

---

### KATEGORI 4: IKON & GORSEL UYUMU

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| IK-01 | Dekoratif ikon opacity degeri | **0.35** tam olarak | Kritik |
| IK-02 | Opacity 0.04, 0.06, 0.07, 0.08, 0.20 kullanilmis mi | YASAK | Kritik |
| IK-03 | Bootstrap Icons disinda ikon kutuphanesi | YASAK (Lucide, FontAwesome, vb.) | Kritik |
| IK-04 | KPI dekoratif ikonda p-kpi-deco sinifi | Olmali | Yuksek |

**Nasil Tespit Edilir:**
```
- opacity: veya opacity:{ iceren satirlari bul
- Degeri kontrol et: 0.35 mi, yoksa yasak degerlerden biri mi?
- NOT: opacity:1 veya opacity:0 (gosterme/gizleme) sorun degildir
- NOT: Animasyon/transition icinde degisen opacity sorun degildir
- 'lucide', 'font-awesome', 'fa-', 'heroicons' importlari ara
```

---

### KATEGORI 5: BILESEN STANDARTLARI

#### 5A: Modal Kontrolleri

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| MD-01 | Modal header sinifi dogru mu | mh-default / mh-danger / mh-success | Kritik |
| MD-02 | Amber/navy modal header kullanilmis mi | YASAK | Kritik |
| MD-03 | ESC ile kapanma handler'i var mi | useEffect + keydown zorunlu | Yuksek |
| MD-04 | Modal overlay sinifi | p-modal-overlay + p-modal-center | Yuksek |
| MD-05 | Modal genisligi | 480px-720px arasi (maxWidth) | Orta |

**ESC Handler Kontrolu:**
```
- Modal iceren dosyalarda asagidaki pattern'i ara:
  useEffect + 'Escape' + onClose/setXxx(false)
- Yoksa → MD-03 ihlali
```

#### 5B: Sayfa Yapisi Kontrolleri

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| SY-01 | Sayfa header'i var mi | p-page-header sinifi zorunlu | Kritik |
| SY-02 | Sayfa ikonu var mi | p-page-header-icon | Yuksek |
| SY-03 | h1 + page-title var mi | h1 icinde p-page-title | Yuksek |
| SY-04 | Sayfa basliginin hierarsisi | h1 > baska heading kullanilmamali (ayni seviyede) | Orta |

#### 5C: Tablo Kontrolleri

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| TB-01 | table-responsive wrapper var mi | Capacitor uyumluluk icin zorunlu | Kritik |
| TB-02 | Tablo baslik gradient'i | p-table sinifi veya gradient CSS | Yuksek |
| TB-03 | Tablo baslik tipografisi | 11px, 700, uppercase (CSS'te tanimli) | Orta |

#### 5D: Finansal Sayi Kontrolleri

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| FN-01 | Tutar gosteren span/div'lerde financial-num sinifi | ZORUNLU | Kritik |
| FN-02 | TL() formatter kullaniliyor mu | Intl.NumberFormat tr-TR | Yuksek |
| FN-03 | Pozitif tutar icin p-amount-pos sinifi | Olmali (yesil) | Orta |
| FN-04 | Negatif tutar icin p-amount-neg sinifi | Olmali (kirmizi) | Orta |

**Nasil Tespit Edilir:**
```
- TL( veya formatCurrency( veya toLocaleString ile formatlanan degerleri bul
- Bu degerlerin parent elementinde 'financial-num' sinifi var mi kontrol et
- ₺ sembolü iceren satirlarda financial-num kontrolu yap
```

#### 5E: Buton Kontrolleri

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| BT-01 | Buton min-height | 44px (touch target) | Yuksek |
| BT-02 | Buton border-radius | 10px | Yuksek |
| BT-03 | Buton p- sinifi kullanilmis mi | p-btn-save, p-btn-cancel, p-icon-btn vb. | Orta |

---

### KATEGORI 6: RESPONSIVE & MOBIL UYUMLULUK

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| RS-01 | Tiklanabilir alan boyutu | min 44x44px | Yuksek |
| RS-02 | Sabit px genislik (width: 500px gibi) | Bootstrap responsive sinifi kullan | Yuksek |
| RS-03 | Horizontal scroll riski (overflow) | Genis elementlerde overflow-x kontrol | Orta |
| RS-04 | Kucuk ekranda font boyutu | min 12px okunabilirlik | Orta |
| RS-05 | Capacitor uyumluluk: localStorage kullanimi | YASAK — Zustand kullan | Kritik |
| RS-06 | Capacitor uyumluluk: window.location kullanimi | YASAK — React Router kullan | Kritik |

**Nasil Tespit Edilir:**
```
- width: iceren inline style'larda sabit px deger ara (maxWidth haric)
- localStorage. veya sessionStorage. cagrisi ara
- window.location (href/replace/assign) ara
- onClick handler'i olan elementlerin boyutunu kontrol et
  (minHeight/minWidth 44px veya padding ile 44px'e ulasmali)
```

---

### KATEGORI 7: KONTRAST & ERISILEBILIRLIK

Renk kontrastinin yeterli olup olmadigini WCAG 2.1 AA standardina gore denetle.
Minimum kontrast oranlari: normal metin 4.5:1, buyuk metin (18px+ veya 14px bold+) 3:1.

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| KO-01 | Acik zemin uzerinde acik metin | Kontrast orani min 4.5:1 | Kritik |
| KO-02 | Muted/ikincil metin okunabilirligi | --p-text-muted (#6B7280) beyaz zeminde 4.6:1 → OK, ama daha acik degerler YASAK | Yuksek |
| KO-03 | Placeholder metin kontrastı | Inputlardaki placeholder en az 3:1 | Yuksek |
| KO-04 | Buton icindeki metin kontrastı | Yesil buton (#10B981) uzerinde beyaz metin → 3.1:1, sinirda — dark variant (#059669) tercih et | Yuksek |
| KO-05 | Badge/etiket icindeki metin | Arka plan rengine gore metin rengi yeterli kontrastta mi | Yuksek |
| KO-06 | Devre disi (disabled) eleman kontrastı | Disabled olsa bile min 3:1 olmali | Orta |
| KO-07 | Kirmizi hata mesaji kontrastı | --p-color-danger (#EF4444) beyaz zeminde 3.9:1 → buyuk metinde OK, kucuk metinde UYARI | Orta |
| KO-08 | Grafik/chart renkleri ayirt edilebilir mi | Komsu renkler arasi yeterli fark (sadece renge bagimli olmama) | Orta |
| KO-09 | Focus gorunurlugu | Focuslanan elemanda belirgin outline/ring var mi | Yuksek |
| KO-10 | aria-label / aria-labelledby eksikligi | Ikon-only butonlarda aria-label ZORUNLU | Yuksek |
| KO-11 | img/svg alt text eksikligi | Anlamli gorsellerde alt text olmali | Orta |
| KO-12 | Renk koru (color-blind) uyumu | Sadece renkle anlam iletme — ikon/metin destegi olmali | Orta |

**Bilinen Kontrast Degerleri (ParamGo Paleti):**
```
Beyaz zemin (#FFFFFF) uzerinde:
  --p-text (#111827)        → 15.4:1  GECTI
  --p-text-muted (#6B7280)  → 4.6:1   GECTI (sinirda)
  --p-color-primary (#10B981) → 2.5:1  KALDI (metin olarak YASAK, sadece dekoratif)
  --p-color-danger (#EF4444)  → 3.9:1  KALDI normal metin, buyuk metin OK
  --p-color-warning (#F59E0B) → 2.1:1  KALDI (metin olarak YASAK)
  --p-color-info (#3B82F6)    → 3.6:1  KALDI normal metin, buyuk metin OK

Yesil buton (#10B981) uzerinde:
  Beyaz metin (#FFFFFF)     → 2.5:1  SINIRDA — #059669 tercih (3.7:1)

Sayfa zemini (#EAECF0) uzerinde:
  --p-text (#111827)        → 12.1:1  GECTI
  --p-text-muted (#6B7280)  → 3.7:1   SINIRDA — buyuk metinde OK
```

**Nasil Tespit Edilir:**
```
- Inline style'da color: ile kullanilan renk degerini bul
- Parent veya closest arka plan rengini belirle (genelde beyaz kart veya #EAECF0 sayfa)
- Kontrast oranini hesapla: (L1 + 0.05) / (L2 + 0.05)
  L = relative luminance: 0.2126*R + 0.7152*G + 0.0722*B
- 4.5:1'in altinda → normal metin icin IHLAL
- 3:1'in altinda → buyuk metin icin bile IHLAL

- CSS sinifi kullanan renkler icin yukaridaki hazir tabloyu referans al
- Ikon-only butonlarda (<button> icinde sadece <i> var, metin yok):
  aria-label yoksa → KO-10 ihlali
- <img> etiketinde alt prop yoksa → KO-11 ihlali
- Sadece renk farki ile durum belirten elementler:
  Ornegin yesil=odendi, kirmizi=odenmedi ama yazi veya ikon destegi yoksa → KO-12 ihlali
```

**Yanlis Pozitif Onleme:**
```
- Dekoratif ikonlar (opacity: 0.35) kontrast kontrolune DAHIL ETME — zaten dekoratif
- SVG ikonlari icin alt text aranmaz, aria-hidden="true" yeterli
- Bootstrap Icons (<i className="bi bi-...">) icin aria-label sadece
  tek basina buton/link icinde kullaniliyorsa gerekli
- Disabled elemanlarda 3:1 yeterli, 4.5:1 aranmaz
```

---

### KATEGORI 8: KOD KALITESI & GENEL

| Kural ID | Kontrol | Standart | Onem |
|----------|---------|----------|------|
| KK-01 | bootstrap.bundle.min.js import edilmis mi | YASAK | Kritik |
| KK-02 | Tailwind/Shadcn/MUI/AntD import veya sinifi | YASAK | Kritik |
| KK-03 | Kullanilmayan CSS sinifi (JSX'te referans yok) | Temizlenmeli | Dusuk |
| KK-04 | Inline style sayisi asiri mi (>10 inline style) | CSS sinifina tasimali | Orta |
| KK-05 | z-index degerleri tutarli mi | Catisma riski kontrolu | Orta |
| KK-06 | Animasyon/transition: var(--p-transition) kullanilmali | 0.18s ease | Dusuk |

---

## RAPOR FORMATI

Tarama tamamlandiktan sonra asagidaki formatta Turkce rapor uret:

```
=========================================
  TASARIM DENETIM RAPORU
  Tarih: {tarih}
  Kapsam: {taranan modul sayisi} modul
=========================================

OZET ISTATISTIKLER
------------------
Taranan dosya sayisi  : {sayi}
Toplam tespit         : {sayi}
  Kritik              : {sayi}
  Yuksek              : {sayi}
  Orta                : {sayi}
  Dusuk               : {sayi}

MODUL BAZLI SKOR
----------------
| Modul           | Kritik | Yuksek | Orta | Dusuk | Skor   |
|-----------------|--------|--------|------|-------|--------|
| Dashboard       | 0      | 1      | 2    | 0     | 94/100 |
| Cari Hesaplar   | 2      | 3      | 1    | 1     | 72/100 |
| ...             |        |        |      |       |        |

SKOR HESAPLAMA:
  100 - (Kritik x 10) - (Yuksek x 5) - (Orta x 2) - (Dusuk x 1)
  Minimum: 0

=========================================
  DETAYLI TESPITLER
=========================================

--- MODUL: {Modul Adi} ---
Dosya: {dosya_yolu}

[KRITIK] BR-05 | Satir {no}
  Sorun: border-radius: 12px kullanilmis — YASAK deger
  Mevcut: style={{ borderRadius: 12 }}
  Duzeltme: borderRadius: 14 (kart/panel icin) veya 10 (buton/input icin)

[YUKSEK] RK-01 | Satir {no}
  Sorun: Hardcoded renk kullanilmis
  Mevcut: style={{ color: '#10B981' }}
  Duzeltme: style={{ color: 'var(--p-color-primary)' }} veya CSS sinifi kullan

[ORTA] TY-03 | Satir {no}
  Sorun: Sayfa basligi font boyutu standart disi
  Mevcut: fontSize: 18
  Duzeltme: fontSize: 20 veya p-page-title sinifi kullan

[DUSUK] GN-06 | Satir {no}
  Sorun: Ozel transition suresi
  Mevcut: transition: '0.3s ease'
  Duzeltme: transition: 'var(--p-transition)' (0.18s ease)

--- MODUL: {Sonraki Modul} ---
...

=========================================
  KATEGORI BAZLI OZET
=========================================

1. Border-Radius Uyumu      : {ihlal sayisi} ihlal
2. Tipografi & Font          : {ihlal sayisi} ihlal
3. Renk & Tema Uyumu         : {ihlal sayisi} ihlal
4. Ikon & Gorsel Uyumu       : {ihlal sayisi} ihlal
5. Bilesen Standartlari      : {ihlal sayisi} ihlal
6. Responsive & Mobil        : {ihlal sayisi} ihlal
7. Kontrast & Erisilebilirlik: {ihlal sayisi} ihlal
8. Kod Kalitesi & Genel      : {ihlal sayisi} ihlal

EN COK TEKRARLANAN 5 SORUN:
1. {Kural ID} — {aciklama} ({kac dosyada})
2. ...

ONCELIKLI AKSIYON PLANI:
1. {En kritik sorundan basla — hangi dosya, ne yapilmali}
2. {Ikinci oncelikli}
3. {Ucuncu oncelikli}
```

---

## ONEMLI NOTLAR

### Yanlis Pozitif (False Positive) Onleme
- `financial-num` kontrolunde: Eger deger bir tutar degil, adet/yuzde ise → ihlal SAYMA
- Opacity kontrolunde: `opacity: 0` (gizleme) veya `opacity: 1` (gosterme) → ihlal SAYMA
- Opacity kontrolunde: Animasyon/hover state icindeki opacity → ihlal SAYMA
- Border-radius kontrolunde: CSS sinifinda dogru tanimli ise inline style gereksiz → UYARI ver ama ihlal sayma
- Renk kontrolunde: `var(--p-...)` kullanan inline style → ihlal SAYMA
- Renk kontrolunde: Sadece `color: 'inherit'` veya `color: 'currentColor'` → ihlal SAYMA
- Import kontrolunde: node_modules icindeki dosyalar → TARAMA

### Oncelik Sirasi
Eger tum modulleri taramak cok uzun surecekse:
1. Once en cok kullanilan modulleri tara: Dashboard, Cari, Kasa
2. Sonra diger modulleri tara
3. Her modulu bitirdikce ara rapor ver

### Kullaniciya Soru Sor
- "Tum modulleri mi tarayalim yoksa belirli bir modulu mu?"
- "Sadece kritik sorunlari mi gostereyim, hepsini mi?"
- Eger 50+ tespit varsa: "Cok fazla tespit var. Once kritik olanlari gostereyim mi?"

---

## DUZELTME MODU (Opsiyonel)

Kullanici "duzelt", "fix", "onar" derse:
1. Sadece KRITIK ve YUKSEK tespitleri duzelt
2. Her duzeltmeyi tek tek goster ve onayla
3. Bir dosyada 3+ duzeltme varsa toplu goster
4. ORTA ve DUSUK icin sadece rapor ver, otomatik duzeltme
