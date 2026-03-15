---
name: ikas-tasarim
description: >
  Finans Kalesi V3 Tasarim Sistemi — ikas ilhamli modern fintech + kurumsal bankacilik paleti.
  Elektrik indigo (#3034ff) primary, temiz beyaz yuzeyler, katmanli golge sistemi, Inter font,
  3D butonlar (inset shadow). Dashboard grafik ve KPI kartlarinda klasik bankacilik renkleri
  (derin zumrut #0a6e52, derin kirmizi #b41c1c, lacivert kasa #1a4d8f) kullanilir.
  Yeni sayfa, bilesen veya modul yazarken bu dosyadaki tum kurallar KESINLIKLE uygulanir.
  Anahtar kelimeler: tasarim, UI, sayfa, bilesen, modal, kart, tablo, stil, tema,
  renk, v3, ikas, grafik, chart, KPI, tutar, para, bankaci. Bu skill tetiklendiginde
  react-bootstrap-ui.md ile birlikte okunmalidir.
---

# Finans Kalesi — ikas Tasarim Sistemi

Bu dosya, Finans Kalesi'nin onaylanmis gorsel dilini tanimlar.
**Ilham:** ikas.com tasarim dili (birebir renk paleti + buton/golge sistemi)
**Ruh:** Cesur, temiz, premium fintech + kurumsal bankacilik guveni
Demo: `frontend/src/pages/tasarim-demo-v3/DashboardDemo.jsx`

---

## 1. RENK PALETI

Yeni renk uydurmak YASAKTIR. Sadece asagidaki renkler kullanilir.

### 1A. Marka Renkleri (ikas Paleti)
| Degisken | HEX | Kullanim |
|----------|-----|----------|
| Primary (Indigo) | `#3034ff` | Primary buton bg, aktif tab, link, focus ring |
| Primary hover | `#2020e2` | Buton hover, aktif state |
| Primary light | `#6e87ff` | Border accent, secondary link |
| Primary soluk | `#bed2ff` | Disabled buton bg |
| Primary cok soluk | `#ebf3ff` | Alert bilgi bg, badge bg |
| Koyu (Near Black) | `#14141a` | Koyu buton bg, sidebar bg, modal header |
| Koyu hover | `#2e2e33` | Koyu buton hover |
| Koyu border | `#727276` | Koyu buton hover border |

### 1B. Fonksiyonel Renkler
| Degisken | HEX | Kullanim |
|----------|-----|----------|
| Yesil (gelir) | `#10b981` | Pozitif tutar, basarili durum, giris (standart) |
| Yesil acik bg | `#ecfdf5` | Basari alert arka plani |
| Kirmizi (gider) | `#ef4444` | Negatif tutar, hata, silme (standart) |
| Kirmizi acik bg | `#fef2f2` | Hata alert arka plani |
| Turuncu (uyari) | `#f59e0b` | Uyari durumu |
| Turuncu acik bg | `#fffbeb` | Uyari alert arka plani |
| Neon badge | `#cce85f` | "Yeni" badge border |
| Neon badge bg | `#ebfbac` | "Yeni" badge arka plani |

#### Bankacılık Paleti (Dashboard KPI + Grafik)
Klasik bankacılık uygulamalarında (Garanti, HSBC, Yapı Kredi gibi) parlak/neon renkler
yerine derin, doymuş, "güven" hissettiren tonlar kullanılır. Dashboard grafik barları ve
KPI para değerleri bu paleti kullanır.

| Degisken | HEX | Arka Plan | Kullanim |
|----------|-----|-----------|----------|
| Yesil bankaci (gelir) | `#0a6e52` | `#e8f5ef` | KPI Alacak degeri, grafik giris bari, txn giris tutari |
| Kirmizi bankaci (gider) | `#b41c1c` | `#fdf1f1` | KPI Borc degeri, grafik cikis bari, txn cikis tutari |
| Lacivert (kasa) | `#1a4d8f` | `#e8f0fa` | KPI Kasa Bakiye degeri |
| Kurumsal mavi (cek) | `#1e40af` | `#eff6ff` | KPI Cek/Senet degeri |

**Grafik bar stilleri (linear-gradient ile derinlik):**
```css
/* Giris (gelir) bari */
.bar-giris {
  background: linear-gradient(180deg, #0d8a67 0%, #0a6e52 100%);
  box-shadow: 0 -2px 8px rgba(10,110,82,0.25);
}
/* Cikis (gider) bari */
.bar-cikis {
  background: linear-gradient(180deg, #cc2020 0%, #b41c1c 100%);
  box-shadow: 0 -2px 8px rgba(180,28,28,0.2);
}
```

**CSS degiskeni ornegi (bir sayfa icin):**
```css
--green: #0a6e52;
--green-light: #e8f5ef;
--red: #b41c1c;
--red-light: #fdf1f1;
--blue: #1e40af;
```

### 1C. Yuzey Renkleri
| Degisken | HEX | Kullanim |
|----------|-----|----------|
| Sayfa zemini | `#f6f7fb` | Sayfa arka plani |
| Kart bg | `#ffffff` | Kart, modal body, sidebar arka plani |
| Kenar rengi | `#e3e8ef` | Kart kenari, input kenari, tablo cizgisi |
| Kenar hover | `#cdd5df` | Hover state kenarlar |
| Acik zemin | `#eef2f6` | Hover buton bg, tab container bg, striped row |
| Cok acik zemin | `#f8fafc` | Disabled input bg |

### 1D. Metin Renkleri
| Degisken | HEX | Kullanim |
|----------|-----|----------|
| Ana metin | `#121926` | Baslik, birincil metin |
| Ikincil metin | `#697586` | Aciklama, placeholder, pasif tab |
| Soluk metin | `#9aa4b2` | Yardimci metin, copyright |

---

## 2. TIPOGRAFI

### Font Yigini
```css
/* TEK FONT — Her yerde Inter */
font-family: 'Inter', sans-serif;
```

Google Fonts import (index.html `<link>` ile yuklenir):
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### Font Boyutlari
| Eleman | Boyut | Agirlik | Letter-spacing |
|--------|-------|---------|----------------|
| Sayfa basligi | 22px | 700 | -0.44px |
| Kart basligi | 14px | 600 | -0.28px |
| KPI degeri | 28px (desktop), 22px (mobil) | 700 | -0.56px |
| KPI etiketi | 12px | 500 | -0.24px |
| Tablo header | 12px | 600 | -0.24px |
| Tablo hucre | 14px | 400 | -0.28px |
| Tutar | 14px | 600 | -0.28px |
| Sidebar menu | 14px | 500 | -0.28px |
| Badge / etiket | 12px | 600 | -0.24px |
| Input metin | 16px | 400 | -0.32px |
| Buton | 16px | 600 | -0.32px |

### Font Ozellik (feature-settings)
Tum metinlerde:
```css
font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
```

---

## 3. BUTON SISTEMI (ikas Birebir)

Tum butonlar: `border-radius: 8px`, `font-size: 16px`, `font-weight: 600`, `letter-spacing: -0.32px`, `padding: 10px 16px`, `cursor: pointer`, `transition: all 300ms ease`.

### 3A. Primary (Indigo)
```css
.fk-btn-primary {
  border: 1px solid #6e87ff;
  background: #3034ff;
  color: #ffffff;
  box-shadow:
    0px -3px 2px 0px rgba(19,20,83,0.25) inset,
    0px 2px 1px 0px rgba(38,69,109,0.01),
    0px 1px 1px 0px rgba(38,69,109,0.02);
}
.fk-btn-primary:hover {
  background: #2020e2;
  box-shadow:
    0px -3px 2px 0px rgba(19,20,83,0.25) inset,
    0px 6px 4px 0px rgba(32,32,226,0.07),
    0px 3px 3px 0px rgba(32,32,226,0.11);
}
```

### 3B. Secondary (Beyaz)
```css
.fk-btn-secondary {
  border: 1px solid #e3e8ef;
  background: #ffffff;
  color: #121926;
  box-shadow:
    0px -3px 1px 0px rgba(238,242,246,0.5) inset,
    0px 2px 1px 0px rgba(38,69,109,0.01);
}
.fk-btn-secondary:hover {
  background: #f8fafc;
  box-shadow:
    0px -3px 1px 0px rgba(221,231,242,0.5) inset,
    0px 4px 3px 0px rgba(81,114,148,0.02),
    0px 2px 2px 0px rgba(81,114,148,0.04);
}
```

### 3C. Dark (Koyu/Near Black)
```css
.fk-btn-dark {
  border: 1px solid #2e2e33;
  background: #14141a;
  color: #ffffff;
  box-shadow:
    0px -3px 1px 0px rgba(71,71,71,0.5) inset,
    0px 2px 1px 0px rgba(38,69,109,0.01);
}
.fk-btn-dark:hover {
  border-color: #727276;
  background: #2e2e33;
  box-shadow:
    0px -3px 2px 0px rgba(34,34,34,0.5) inset,
    0px 3px 2px 0px rgba(46,46,51,0.05),
    0px 1px 1px 0px rgba(46,46,51,0.08);
}
```

### 3D. Ghost (Sadece Metin)
```css
.fk-btn-ghost {
  background: transparent;
  border: none;
  color: #3034ff;
  box-shadow: none;
}
.fk-btn-ghost:hover { opacity: 0.8; }
```

---

## 4. KART SISTEMI

### Standart Kart
```css
.fk-card {
  background: #ffffff;
  border: 1px solid #e3e8ef;
  border-radius: 10px;
  padding: 20px;
  box-shadow:
    0px 2px 1px 0px rgba(38,69,109,0.01),
    0px 1px 1px 0px rgba(38,69,109,0.02);
  transition: all 300ms ease;
}
.fk-card:hover {
  box-shadow:
    0px 12px 3px 0px rgba(81,114,148,0),
    0px 8px 3px 0px rgba(81,114,148,0.01),
    0px 4px 3px 0px rgba(81,114,148,0.02),
    0px 2px 2px 0px rgba(81,114,148,0.04);
  border-color: #cdd5df;
}
```

### KPI Karti — Bankaci Renkleri
```jsx
// Renk atamalari (bankaci paleti)
const KPI_RENKLER = {
  alacak: { color: '#0a6e52', bg: '#e8f5ef' },  // derin zumrut
  borc:   { color: '#b41c1c', bg: '#fdf1f1' },  // derin kirmizi
  kasa:   { color: '#1a4d8f', bg: '#e8f0fa' },  // lacivert
  cek:    { color: '#1e40af', bg: '#eff6ff' },  // kurumsal mavi
}

// KPI ikon kutusu
<div style={{ background: `${kpi.color}12`, color: kpi.color }}>
  <i className={`bi ${kpi.icon}`}></i>
</div>

// KPI para degeri
<div style={{ color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>
  {TL(kpi.value)} ₺
</div>
```

---

## 5. INPUT SISTEMI

```css
.fk-input {
  padding: 12px;
  border-radius: 8px;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  background: #fff;
  border: 1px solid #e3e8ef;
  color: #121926;
  min-height: 44px;
}
.fk-input:focus {
  border-color: #3034ff;
  box-shadow: 0px 0px 0px 2px rgba(48,52,255,0.25);
}
```

---

## 6. TABLO SISTEMI

```css
.fk-table thead th {
  font-size: 12px;
  font-weight: 600;
  color: #9aa4b2;
  padding: 12px 16px;
  border-bottom: 1px solid #e3e8ef;
}
.fk-table tbody td {
  font-size: 14px;
  color: #121926;
  padding: 14px 16px;
  border-bottom: 1px solid #eef2f6;
}
.fk-table tbody tr:hover { background: #f8fafc; }
```

`table-responsive` wrapper ZORUNLUDUR.

### Para Formati (Bankaci Rengi)
```jsx
// Pozitif (gelir/alacak)
<span style={{ color: '#0a6e52', fontWeight: 600 }}>
  +{TL(tutar)} ₺
</span>

// Negatif (gider/borc)
<span style={{ color: '#b41c1c', fontWeight: 600 }}>
  -{TL(Math.abs(tutar))} ₺
</span>
```

---

## 7. TAB SISTEMI

```css
.fk-tab-container {
  display: inline-flex;
  background: #eef2f6;
  border-radius: 10px;
  padding: 4px;
}
.fk-tab {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #697586;
  background: transparent;
  border: none;
  cursor: pointer;
  min-height: 40px;
}
.fk-tab.active {
  background: #ffffff;
  color: #121926;
  font-weight: 600;
  box-shadow: 0px 2px 4px rgba(0,0,0,0.06);
}
```

---

## 8. BADGE SISTEMI

```css
.fk-badge { padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.fk-badge-primary { background: #ebf3ff; color: #3034ff; }
.fk-badge-success { background: #e8f5ef; color: #0a6e52; }  /* bankaci yesil */
.fk-badge-danger  { background: #fdf1f1; color: #b41c1c; }  /* bankaci kirmizi */
.fk-badge-warning { background: #fffbeb; color: #d97706; }
```

---

## 9. MODAL

- React `useState` ile acilir/kapanir
- ESC ile kapanir (`useEffect + keydown` zorunlu)
- Backdrop tiklama KAPATMAZ
- Body scroll lock: `document.body.style.overflow = 'hidden'`

```css
.fk-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
}
.fk-modal {
  background: #ffffff; border-radius: 12px;
  max-width: 520px; width: 90%; max-height: 90vh;
  box-shadow: 0px 24px 48px rgba(0,0,0,0.12);
  overflow: hidden;
}
.fk-modal-header { background: #14141a; color: #ffffff; padding: 18px 24px; }
.fk-modal-body   { padding: 24px; overflow-y: auto; }
.fk-modal-footer { padding: 16px 24px; border-top: 1px solid #e3e8ef; }
```

---

## 10. SIDEBAR

```css
.fk-sidebar {
  width: 260px; height: 100vh;
  position: fixed; left: 0; top: 0;
  background: #14141a;
  z-index: 1100; overflow-y: auto;
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
}
.fk-menu-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border-radius: 8px;
  font-size: 14px; font-weight: 500;
  color: #ececed; min-height: 44px; cursor: pointer;
}
.fk-menu-item:hover { background: rgba(255,255,255,0.06); color: #ffffff; }
.fk-menu-item.active {
  background: var(--indigo);   /* #b0d12a lime */
  color: #14141a; font-weight: 600;
}
```

Mobil `<992px`: `transform: translateX(-100%)` ile gizli, hamburger ile acilir.

---

## 11. GOLGE SISTEMI (ikas Katmanli)

```css
/* Kart */
--fk-shadow-sm: 0px 2px 1px 0px rgba(38,69,109,0.01), 0px 1px 1px 0px rgba(38,69,109,0.02);
/* Kart hover */
--fk-shadow-md: 0px 8px 3px 0px rgba(81,114,148,0.01), 0px 4px 3px 0px rgba(81,114,148,0.02), 0px 2px 2px 0px rgba(81,114,148,0.04);
/* Modal */
--fk-shadow-lg: 0px 24px 48px rgba(0,0,0,0.12), 0px 8px 16px rgba(0,0,0,0.08);
```

---

## 12. RESPONSIVE BREAKPOINTS

| Breakpoint | Hedef | Degisiklikler |
|------------|-------|--------------|
| `>=992px` | Desktop | Sidebar gorunur, content margin-left: 260px |
| `<992px` | Tablet | Sidebar gizli, hamburger aktif |
| `<768px` | Mobil | Padding: 16px, KPI 2 sutun, modal bottom-sheet |
| `<480px` | Kucuk mobil | Padding: 12px, KPI tek sutun |

---

## 13. CSS CLASS PREFIX KURALI

Genel sistem: `fk-`
- Dashboard: `fk-dash-` veya `db-` (demo dosyasinda `db-`)
- Cari: `fk-cari-`
- Cek/Senet: `fk-cek-`
- Kasa: `fk-kasa-`
- Odemeler: `fk-odm-`

Tum stiller `<style>{``}</style>` tag'i icinde self-contained tutulur.

---

## 14. IKON KULLANIMI

Sadece Bootstrap Icons (`bi-*`). Diger ikon kutuphaneleri YASAKTIR.

| Modul | Ikon |
|-------|------|
| Dashboard | `bi-speedometer2` |
| Cari | `bi-people-fill` |
| Cek/Senet | `bi-file-earmark-text-fill` |
| Odemeler | `bi-credit-card-2-fill` |
| Kasa | `bi-safe-fill` |
| Logo | `bi-shield-lock-fill` |
| Ekle | `bi-plus-lg` |
| Kapat | `bi-x-lg` |
| Menu | `bi-list` |

---

## 15. PARA FORMATI

```jsx
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
// Kullanim: {TL(tutar)} ₺
// Bankaci pozitif: #0a6e52 | Bankaci negatif: #b41c1c
```
