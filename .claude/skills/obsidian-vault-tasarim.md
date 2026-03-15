---
name: obsidian-vault-tasarim
description: >
  Finans Kalesi projesinin onaylanmış "Obsidian Vault" tasarım sistemi.
  Yeni sayfa, bileşen veya modül yazarken bu dosyadaki renk paleti, tipografi,
  kart stilleri, tablo yapısı, modal kuralları ve responsive breakpoint'leri
  KESİNLİKLE uygulanır. Anahtar kelimeler: tasarım, UI, sayfa, bileşen, modal,
  kart, tablo, stil, tema, renk, dark, koyu. Bu skill tetiklendiğinde
  react-bootstrap-ui.md ile birlikte okunmalıdır.
---

# Obsidian Vault — Finans Kalesi Tasarım Sistemi

Bu dosya, Finans Kalesi'nin onaylanmış görsel dilini tanımlar.
Tüm yeni sayfalar ve bileşenler bu kurallara uymalıdır.
Referans uygulama: `frontend/src/pages/tasarim-demo/DemoC.jsx`

---

## 1. RENK PALETİ

Yeni renk uydurmak YASAKTIR. Sadece aşağıdaki renkler kullanılır:

### Ana Renkler
| Değişken | HEX | Kullanım |
|----------|-----|----------|
| Lacivert (zemin) | `#0d1b2e` | Sayfa arka planı, sidebar, modal bg |
| Lacivert koyu | `#0a1628` | Gradient orta nokta |
| Lacivert açık | `#0d1f35` | Gradient bitiş |
| Amber (vurgu) | `#f59e0b` | Butonlar, aktif menü, badge, KPI vurgu |
| Amber koyu | `#d97706` | Gradient bitiş, ikincil amber |

### Fonksiyonel Renkler
| Değişken | HEX | Kullanım |
|----------|-----|----------|
| Yeşil (gelir) | `#10b981` | Pozitif tutarlar, giriş, başarılı durumlar |
| Kırmızı (gider) | `#ef4444` | Negatif tutarlar, çıkış, uyarı, bildirim dot |

### Metin Renkleri
| Opaklık | Değer | Kullanım |
|---------|-------|----------|
| Birincil | `#ffffff` | Başlıklar, aktif metin |
| KPI etiketi | `rgba(255,255,255,0.75)` + `text-shadow: 0 0 14px rgba(255,255,255,0.08)` | KPI başlıkları, üst etiketler |
| Form etiketi | `rgba(255,255,255,0.7)` | Form label'ları, input üst etiketleri |
| İkincil | `rgba(255,255,255,0.65)` + `text-shadow: 0 0 12px rgba(255,255,255,0.06)` | Alt başlıklar, açıklama metinleri |
| Pasif menü | `rgba(255,255,255,0.6)` + `text-shadow: 0 0 12px rgba(255,255,255,0.06)` | Sidebar pasif menü, bilgi metinleri |
| Yardımcı metin | `rgba(255,255,255,0.55)` | Copyright, boş durum metinleri |
| Soluk | `rgba(255,255,255,0.5)` | Rol yazısı, çok ikincil metin |
| Çok soluk | `rgba(255,255,255,0.25)` | Input placeholder |

### Kenar & Ayırıcı Renkleri
| Opaklık | Değer | Kullanım |
|---------|-------|----------|
| Standart | `rgba(255,255,255,0.08)` | Kart kenarı, divider, tablo satır alt |
| Hover | `rgba(255,255,255,0.14)` | Kart hover kenar |
| İnce | `rgba(255,255,255,0.04)` | Tablo satır arası |
| Amber kenar | `rgba(245,158,11,0.08)` | Sidebar sağ kenar |

---

## 2. TİPOGRAFİ

### Font Yığını
```css
/* Gövde metni */
font-family: 'Outfit', sans-serif;

/* Finansal rakamlar, tutar, KPI değerleri */
font-family: 'Inter', sans-serif;
```

Google Fonts import (index.html `<link>` ile yüklenir):
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
```

### Font Boyutları
| Eleman | Boyut | Ağırlık |
|--------|-------|---------|
| Sayfa başlığı | 24px | 700 |
| Kart başlığı | 14px | 700 |
| KPI değeri | 26px (desktop), 20px (tablet), 18px (mobil) | 500 |
| KPI etiketi | 11px | 600 |
| KPI alt yazı | 12px | 500 |
| Tablo header | 11px uppercase, letter-spacing: 0.8px | 600 |
| Tablo hücre | 14px | normal |
| Tutar (mono) | 13px | 500 |
| Sidebar menü | 14px | 500 |
| Badge / etiket | 12px | 600 |
| Küçük metin | 11px | normal |

---

## 3. SAYFA ZEMİNİ

```css
background: linear-gradient(160deg, #0d1b2e 0%, #0a1628 50%, #0d1f35 100%);
background-attachment: fixed;
```

Dekoratif radial glow (::before pseudo-element ile):
```css
background:
  radial-gradient(ellipse at 20% 10%, rgba(245,158,11,0.06) 0%, transparent 50%),
  radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.04) 0%, transparent 50%);
pointer-events: none;
```

---

## 4. GLASSMORPHISM KART

Tüm kartlar bu temel stili paylaşır:

```css
.glass-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}
.glass-card:hover {
  background: rgba(255,255,255,0.07);
  border-color: rgba(255,255,255,0.14);
}
```

### KPI Kart Ek Stilleri
- Dekoratif ikon: `position: absolute; top: 16px; right: 16px; font-size: 60px; opacity: 0.20; color: {kartın vurgu rengi}`
  - Önemli: Koyu arka planda 0.06 veya 0.12 neredeyse görünmez. Minimum 0.20 kullanılmalı.
  - İkon rengi kartın vurgu rengini (numColor) kullanır, beyaz değil.
- Değer neon glow: `text-shadow: 0 0 20px {renk}4D`
- Hover: `transform: translateY(-2px)`

---

## 5. SIDEBAR

```
Genişlik: 260px (fixed, sol)
Arka plan: rgba(13,27,46,0.92) + backdrop-filter: blur(24px)
Sağ kenar: 1px solid rgba(245,158,11,0.08)
```

### Logo Alanı
- İkon: `bi-shield-lock-fill`, renk: `#f59e0b`, glow filter
- Yazı: "Finans Kalesi", 20px, weight 700
- Alt yazı: "Varlık Yönetimi", 12px, `rgba(255,255,255,0.4)`

### Menü Öğeleri
- Aktif: `bg rgba(245,158,11,0.08)`, `border-left: 3px solid #f59e0b`, ikon `#f59e0b`, metin `#fff`
- Pasif: metin `rgba(255,255,255,0.6)` + `text-shadow: 0 0 12px rgba(255,255,255,0.06)`, hover → `0.85` + `text-shadow: 0 0 16px rgba(255,255,255,0.1)`
- Pasif ikon: `rgba(255,255,255,0.55)`
- Font: 14px, weight 500
- Min yükseklik: 44px, border-radius: 10px

### Mobil Davranış
- `<992px`: Sidebar `transform: translateX(-100%)` ile gizli
- Hamburger butonu (amber renk) ile açılır
- Overlay: `rgba(0,0,0,0.6)` + `backdrop-filter: blur(4px)`
- Sidebar tıklanınca kapanır

---

## 6. TABLO

```jsx
<div className="table-responsive">
  <table className="...tablo-class">
```

### Stil Kuralları
- `min-width: 500px` (mobilde yatay scroll)
- Header: 11px, uppercase, `letter-spacing: 0.8px`, `rgba(255,255,255,0.4)`
- Hücre padding: 14px (desktop), 10px (mobil)
- Satır arası: `1px solid rgba(255,255,255,0.04)`
- Hover: `background rgba(255,255,255,0.03)`
- Pozitif tutar: `#10b981` (Inter)
- Negatif tutar: `#ef4444` (Inter)

### Durum Badge'leri
- Renkli dot (8px) + metin: `rgba(255,255,255,0.6)`
- Dot glow: `box-shadow: 0 0 6px {renk}66`

### Tür Badge
- `bg rgba(255,255,255,0.06)`, `rgba(255,255,255,0.55)`, border-radius: 6px

---

## 7. BUTONLAR

### Amber (Primary)
```css
background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
color: #0d1b2e;
border-radius: 10px;
box-shadow: 0 4px 20px rgba(245,158,11,0.3);
min-height: 44px;
/* Hover: */
box-shadow: 0 6px 28px rgba(245,158,11,0.45);
transform: translateY(-1px);
```

### Glass (Secondary/İptal)
```css
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.12);
color: rgba(255,255,255,0.7);
border-radius: 10px;
min-height: 44px;
/* Hover: */
background: rgba(255,255,255,0.1);
color: #fff;
```

### Filtre Tab (Pill Button)
```css
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 20px;
/* Aktif: */
background: rgba(245,158,11,0.15);
border-color: rgba(245,158,11,0.3);
color: #f59e0b;
```

---

## 8. MODAL

### Yapı Kuralları (react-bootstrap-ui.md ile uyumlu)
- React `useState` ile açılır/kapanır
- ESC ile kapanır (useEffect + keydown listener)
- Backdrop tıklama KAPATMAZ
- Body scroll lock: `document.body.style.overflow = 'hidden'`

### Görsel Stil
```css
/* Backdrop */
background: rgba(0,0,0,0.7);
backdrop-filter: blur(8px);

/* Modal kutu */
background: rgba(13,27,46,0.95);
backdrop-filter: blur(30px);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 20px;
max-width: 520px;
max-height: 90vh;
display: flex; flex-direction: column;

/* Header */
border-bottom: 2px solid #f59e0b;

/* Mobilde (<768px) */
border-radius: 16px 16px 0 0;
max-height: 85vh;
align-items: flex-end; /* bottom-sheet tarzı */
```

### Form Input
```css
background: rgba(255,255,255,0.05);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 10px;
color: #ffffff;
min-height: 44px;
/* Focus: */
border-color: #f59e0b;
box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
```

### Animasyonlar
```css
@keyframes fadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

---

## 9. RESPONSIVE BREAKPOINT'LER

| Breakpoint | Hedef | Değişiklikler |
|------------|-------|--------------|
| `<992px` | Tablet | Sidebar gizli, hamburger aktif, content margin-left: 0, padding: 20px |
| `<768px` | Mobil | Padding: 16px, KPI font: 20px, tablo th/td: 10px, modal bottom-sheet |
| `<480px` | Küçük mobil | Padding: 12px, KPI font: 18px, kart padding: 14px, kart radius: 12px |

### Mobil Öncelikleri
- Tüm tıklanabilir alan: min 44x44px
- Tablo: `table-responsive` wrapper + `min-width: 500px`
- Filtre tabları: `overflow-x: auto` (yatay kaydırma)
- Modal: Alt'tan açılır, `max-height: 85vh`, body scroll

---

## 10. PARA FORMATI

```jsx
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n)
```

Finansal rakamlar **her zaman** Inter ile gösterilir.
Pozitif: `#10b981`, Negatif: `#ef4444`

---

## 11. BADGE SİSTEMİ

### Amber Badge
```css
background: rgba(245,158,11,0.15);
color: #f59e0b;
font-size: 12px;
font-weight: 600;
padding: 4px 12px;
border-radius: 8px;
```

### Premium Badge
```css
color: #f59e0b;
font-weight: 600;
background: rgba(245,158,11,0.12);
padding: 3px 12px;
border-radius: 6px;
letter-spacing: 0.5px;
```

### Version Badge
```css
font-family: 'Inter', sans-serif;
color: rgba(255,255,255,0.35);
background: rgba(255,255,255,0.06);
padding: 3px 10px;
border-radius: 6px;
```

---

## 12. CSS CLASS PREFIX KURALI

Her sayfanın/bileşenin kendine özgü prefix'i olmalıdır:
- Dashboard: `dash-`
- Cari: `cari-`
- Çek/Senet: `cek-`
- Kasa: `kasa-`
- Ödemeler: `odm-`
- Genel: `fk-`

Bu sayede CSS çakışması olmaz. Tüm stiller `<style>{``}</style>` tag'i içinde self-contained tutulur.

---

## 13. İKON KULLANIMI

Sadece Bootstrap Icons (`bi-*`). Diğer ikon kütüphaneleri YASAKTIR.

### Sık Kullanılan İkonlar
| Modül | İkon |
|-------|------|
| Dashboard | `bi-speedometer2` |
| Cari | `bi-people-fill` |
| Çek/Senet | `bi-file-earmark-text-fill` |
| Ödemeler | `bi-credit-card-2-fill` |
| Kasa | `bi-safe-fill` |
| Logo | `bi-shield-lock-fill` |
| Bildirim | `bi-bell` |
| Ekle | `bi-plus-lg` |
| Kapat | `bi-x-lg` |
| Menü | `bi-list` |

---

## 14. GİRİŞ SAYFASI STİLİ

CSS prefix: `giris-`

### Kart Yapısı
```css
/* Ana kart — koyu glassmorphism */
background: rgba(13,27,46,0.95);
backdrop-filter: blur(30px);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 20px;
```

### Üst Şerit (Header)
```css
/* Amber gradient — login sayfasının tanımlayıcı öğesi */
background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
```
- Başlık ve alt yazı rengi: `#0d1b2e` (koyu lacivert, kontrast)
- Dekoratif arka plan ikonları: `color: #0d1b2e`, `opacity: 0.12–0.15`

### Form Alanı
- Etiketler: `rgba(255,255,255,0.7)`, 12px, uppercase, `letter-spacing: 0.08em`
- Input: `giris-input` sınıfı (self-contained, Bootstrap `.form-control` kullanılmaz)
- Focus: `border-color: #f59e0b`, `box-shadow: 0 0 0 3px rgba(245,158,11,0.12)`

---

## 15. DASHBOARD STİLİ

CSS prefix: `dash-`

### KPI Kartları
- Glass card + `overflow: hidden` + `position: relative`
- Dekoratif ikon: `opacity: 0.20`, `color: {kartın numColor'u}` (beyaz değil!)
- Değer: Inter, 26px, `font-weight: 500`, `letter-spacing: 0.01em`, `font-variant-numeric: tabular-nums`
- Değer neon glow: `text-shadow: 0 0 20px {glowColor}`
- Anti-aliasing: `-webkit-font-smoothing: antialiased`
- Etiket: 11px, uppercase, `letter-spacing: 0.8px`, `rgba(255,255,255,0.6)`

### Renk Paleti (4 KPI)
| Metrik | numColor | glowColor |
|--------|----------|-----------|
| Alacak (emerald) | `#10b981` | `rgba(16,185,129,0.3)` |
| Borç (rose) | `#ef4444` | `rgba(239,68,68,0.3)` |
| Çek/Senet (navy→amber) | `#f59e0b` | `rgba(245,158,11,0.3)` |
| Ödeme (amber dark) | `#d97706` | `rgba(217,119,6,0.3)` |

### Net Pozisyon Bandı
- Glass card, 16px padding
- Border rengi duruma göre: pozitif → `rgba(16,185,129,0.2)`, negatif → `rgba(239,68,68,0.2)`
- İkon: pozitif → `bi-graph-up-arrow #10b981`, negatif → `bi-exclamation-triangle-fill #ef4444`

---

## 16. MOBİL HEADER

```
Yükseklik: 72px
Arka plan: rgba(13,27,46,0.92) + backdrop-filter: blur(24px)
Alt kenar: 1px solid rgba(255,255,255,0.06)
Padding: 0 18px
```

- Hamburger ikonu: `bi-list`, `fontSize: 30`, `color: #f59e0b`, min 48x48px dokunma alanı
- Logo ikonu: `bi-shield-lock-fill`, `fontSize: 26`, `color: #f59e0b`
- Başlık: "Finans Kalesi", `fontSize: 20`, `fontWeight: 700`, `color: #fff`

---

## 17. ÇAPRAZ RENK DENGESİ (ÖNEMLİ)

Koyu arka plan tasarımda en sık yapılan hata: elementlerin arka planla aynı tonlarda kalıp "kaybolması".

### Kurallar
1. **Metin:** Koyu arka plan üzerinde minimum `rgba(255,255,255,0.5)` opaklık
2. **Butonlar:** Arka planla aynı renk tonundaysa amber outline/border ekle
3. **İkonlar:** Dekoratif ikonlar minimum `opacity: 0.20` ve vurgu rengiyle (beyaz değil)
4. **Linkler:** `rgba(255,255,255,0.35)` çok soluk — amber (`#f59e0b`) kullan
5. **Form etiketleri:** Minimum `rgba(255,255,255,0.7)` — 0.45 sönük kalır
6. **Badge/dot:** Renk + glow (`box-shadow`) ile vurgula
