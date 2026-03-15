---
name: ikas-tasarim
description: >
  Finans Kalesi projesinin "Açık Tema" tasarım sistemi.
  İçerik alanları beyaz/açık gri arka planla tasarlanır; sidebar koyu kalır.
  Anahtar kelimeler: açık tema, light, beyaz kart, ödemeler, bilanço,
  analitik, tablo, KPI, liste, varlık, kasa, dashboard satırı.
  VarlikKasa Aylık Bilanço bölümü bu sistemin referans tasarımıdır.
---

# Finans Kalesi — Açık Tema Tasarım Sistemi

Bu dosya, koyu Obsidian Vault temasının **YASAK** olduğu sayfalarda
uygulanacak açık tema kurallarını tanımlar.
Referans uygulama: `frontend/src/pages/odeme-takip/OdemeTakip.jsx`
Referans bölüm: `VarlikKasa.jsx → AylikBilanco` (KPI kart + performans satırı yapısı)

---

## 1. RENK PALETİ

Yeni renk uydurmak YASAKTIR. Sadece aşağıdaki değerler kullanılır:

### Zemin & Kart
| Eleman              | Değer     | Kullanım                        |
|---------------------|-----------|---------------------------------|
| Sayfa arka planı    | `#f1f5f9` | `<body>` / sayfa wrapper        |
| Kart arka planı     | `#ffffff` | Tüm kartlar                     |
| Kart kenarı         | `#e2e8f0` | border                          |
| Kart kenarı hover   | `#cbd5e1` | hover state                     |
| İç arka plan        | `#f8fafc` | tablo thead, drawer header, input bg |
| Çizgi / ayırıcı     | `#f1f5f9` | satır altı, bölüm ayırıcı      |

### Metin Renkleri
| Seviye       | Değer     | Kullanım                     |
|--------------|-----------|------------------------------|
| Birincil     | `#0f172a` | Başlıklar, sayfa başlığı     |
| Güçlü        | `#1e293b` | Firma adı, kart başlığı      |
| Normal       | `#334155` | Tablo hücre metni            |
| İkincil      | `#475569` | Alt başlık, açıklama         |
| Üçüncül      | `#64748b` | Tarih, yardımcı metin        |
| Soluk        | `#94a3b8` | Etiket, placeholder, ikon    |
| Çok soluk    | `#cbd5e1` | Input placeholder            |

### Amber (Ana Vurgu — Sidebar ile uyumlu)
| Değer     | Kullanım                              |
|-----------|---------------------------------------|
| `#f59e0b` | Primary buton gradient başlangıç      |
| `#d97706` | Primary buton gradient bitiş, KPI     |
| `#92400e` | Koyu amber metin (açık bg üzerinde)   |
| `#fffbeb` | Amber arka plan                       |
| `#fef3c7` | Amber orta arka plan                  |
| `#fde68a` | Amber kenar                           |

### Durum Renkleri (Açık bg uyumlu)
| Durum   | Metin     | Arka Plan | Kenar     |
|---------|-----------|-----------|-----------|
| Başarı  | `#065f46` | `#d1fae5` | `#6ee7b7` |
| Uyarı   | `#92400e` | `#fffbeb` | `#fde68a` |
| Tehlike | `#991b1b` | `#fee2e2` | `#fca5a5` |
| Bilgi   | `#1e40af` | `#eff6ff` | `#bfdbfe` |
| Mor     | `#5b21b6` | `#f5f3ff` | `#c4b5fd` |
| Teal    | `#0e7490` | `#ecfeff` | `#67e8f9` |

---

## 2. TİPOGRAFİ

Font yığını koyu temayla aynıdır:
```css
/* Gövde / etiket */
font-family: 'Outfit', sans-serif;

/* Finansal rakamlar */
font-family: 'Inter', sans-serif;
font-variant-numeric: tabular-nums;
```

### Boyutlar (Açık Tema Uyarlaması)
| Eleman            | Boyut | Ağırlık | Renk      |
|-------------------|-------|---------|-----------|
| Sayfa başlığı     | 22px  | 700     | `#0f172a` |
| Kart başlığı      | 14px  | 700     | `#0f172a` |
| KPI değeri        | 24px  | 700     | Aksan rengi |
| KPI etiketi       | 11px uppercase | 600 | `#94a3b8` |
| Tablo header      | 11px uppercase, 0.7px spacing | 600 | `#94a3b8` |
| Tablo hücre       | 14px  | normal  | `#334155` |
| Tutar             | 13–15px | 700   | `#0f172a` / durum rengi |
| Küçük metin       | 12px  | normal  | `#64748b` |
| Badge             | 11px  | 600     | Durum rengi |

---

## 3. KPI KART YAPISI (VarlikKasa DortKart Referansı)

```jsx
/* Her kartın üstünde 3px solid renkli şerit */
<div style={{ borderTop: `3px solid ${numColor}`, borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0', padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
  {/* Dekoratif arka plan ikon — opacity 0.07 (açık temada daha düşük) */}
  <i className={`bi ${icon}`} style={{ position: 'absolute', top: 12, right: 14, fontSize: 52, opacity: 0.07, color: numColor }} />
  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7, color: '#94a3b8' }}>{label}</div>
  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, color: numColor }}>{deger}</div>
</div>
```

Grid: `repeat(4, 1fr)` → tablet `repeat(2,1fr)` → mobil `1fr`

---

## 4. BİLANÇO SATIRI (VarlikKasa AylikBilanco Referansı)

İki kolonlu grid: `grid-template-columns: 1fr 1fr`
- **Sol kart**: Yaşlandırma / kategori analizi (progress bar listesi)
- **Sağ kart**: Takvim / yaklaşan liste

### Progress Bar Satırı
```jsx
<div style={{ background: '#f1f5f9', borderRadius: 6, height: 7, overflow: 'hidden' }}>
  <div style={{ width: `${oran}%`, height: '100%', borderRadius: 6, background: renk }} />
</div>
```

### Alt Bilgi Şeridi (DSO / özet)
```jsx
<div style={{ padding: '11px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
  {/* ikon + açıklama  +  sağda değer */}
</div>
```

---

## 5. TABLO

Açık temada tablo stilleri:
```css
.tablo-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden }

thead th {
  background: #f8fafc;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.7px; color: #94a3b8;
  border-bottom: 1px solid #f1f5f9;
  padding: 11px 14px;
}

tbody td { color: #334155; padding: 13px 14px; border-bottom: 1px solid #f8fafc }
tbody tr:hover { background: #f8fafc }
tbody tr.secili { background: #fffbeb }
```

Sol kenarlık hücresi: 4px geniş, durum rengini taşır.

---

## 6. BADGE SİSTEMİ

```css
.badge {
  padding: 3px 9px; border-radius: 7px;
  font-size: 11px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 4px;
}
/* Renk çiftleri: color + bg (durum tablosundan) */
```

Öncelik badge'larına ek olarak `border: 1px solid {kenar rengi}` eklenir.

---

## 7. BUTONLAR

### Amber Primary
```css
background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
color: #0d1b2e;   /* koyu metin — kontrast */
border-radius: 10px; min-height: 44px; font-weight: 700;
box-shadow: 0 4px 14px rgba(245,158,11,0.3);
```

### Light Secondary
```css
background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569;
border-radius: 10px; min-height: 44px;
```

### Icon Buton
```css
width: 34px; height: 34px; border-radius: 8px;
border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b;
```
Amber varyant: `border-color: #fde68a; background: #fffbeb; color: #d97706`
Emerald varyant: `border-color: #6ee7b7; background: #ecfdf5; color: #059669`

---

## 8. MODAL

Modal her zaman **koyu glassmorphism** kalır (backdrop üzerinde kontrastı korur):
```css
background: rgba(13,27,46,0.97);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 18px;
/* header alt çizgi: border-bottom: 2px solid #f59e0b */
```

Backdrop: `background: rgba(0,0,0,0.65); backdrop-filter: blur(8px)`
ESC ile kapanır, backdrop tıklamayla KAPANMAZ.

---

## 9. DRAWER (Sağ Panel)

```css
background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
flex: 0 0 340px; width: 340px;
position: sticky; top: 20px;
```

Header: `background: #f8fafc; border-bottom: 1px solid #f1f5f9`
Mobil: `position: fixed; bottom: 0; border-radius: 14px 14px 0 0; height: 85vh`

---

## 10. RESPONSIVE BREAKPOINT'LER

| Breakpoint | Değişiklikler                                                   |
|------------|-----------------------------------------------------------------|
| `<991px`   | KPI grid → 2 kolon, sayfa padding: 20px 16px                   |
| `<767px`   | Analitik satır → tek kolon, filtre panel → tek kolon           |
| `<480px`   | KPI grid → 1 kolon, sayfa padding: 14px 12px, KPI font: 18px  |

---

## 11. CSS CLASS PREFIX KURALI

Bu tema için: `odm-` (Ödemeler), `kasa-` (Kasa) vb. mevcut prefix'ler korunur.
Genel açık tema bileşenleri: `fk-light-` prefix kullanır.

Tüm stiller `<style>{``}</style>` tag içinde self-contained tutulur.

---

## 12. ÇAPRAZ KURAL: SIDEBAR UYUMU

Sidebar her zaman koyu kalır (`rgba(13,27,46,0.92)`).
İçerik alanı açık (`#f1f5f9`).
Bu kontrast amaçlıdır — değiştirilemez.

Amber (`#f59e0b`) her iki temada da birincil vurgu rengidir.
Positive tutarlar: `#059669` (açık temada metin rengi olarak)
Negative tutarlar: `#dc2626`
