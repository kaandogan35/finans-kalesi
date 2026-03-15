---
name: koyu-tema
description: >
  Finans Kalesi'nin üretim-kalitesinde koyu (Obsidian Vault) tasarım sistemi.
  Glassmorphism kartlar, amber vurgu, premium modal sistemi, responsive grid ve
  tüm UI bileşen standartlarını içerir. Tasarım, UI, sayfa, bileşen, modal, kart,
  tablo, stil, tema, renk, dark, koyu, grafik, KPI, tutar anahtar kelimelerinde
  react-bootstrap-ui.md ile birlikte otomatik tetiklenir. frontend-design skill'i
  ile beraber çalışır — bu skill görsel tema kurallarını sağlar, frontend-design
  tasarım kalitesini yönetir.
---

# Koyu Tema — Finans Kalesi Tasarım Sistemi

Bu dosya, Finans Kalesi'nin onaylanmış koyu tema görsel dilini tanımlar.
Tüm yeni sayfalar ve bileşenler bu kurallara uymalıdır.

> **ÇALIŞMA MODELİ:**
> - Bu skill, tasarım görevlerinde `react-bootstrap-ui.md` ile birlikte otomatik okunur.
> - `frontend-design` skill'i tasarım kalitesini yönetir; bu skill görsel tema kurallarını sağlar.
> - `ikas-tasarim.md` → KULLANILMAZ (eski V3 sistemi).
> - Referans uygulama: `frontend/src/pages/kasa/VarlikKasa.jsx`

---

## 1. RENK PALETİ

Yeni renk uydurmak YASAKTIR. Sadece aşağıdaki renkler kullanılır.

### Ana Renkler

| Rol | HEX | Kullanım |
|-----|-----|----------|
| Zemin (lacivert) | `#0d1b2e` | Sayfa arka planı, sidebar, modal bg |
| Zemin gradient orta | `#0a1628` | Gradient orta nokta |
| Zemin gradient bitiş | `#0d1f35` | Gradient bitiş |
| Amber (vurgu) | `#f59e0b` | Butonlar, aktif menü, badge, KPI vurgu |
| Amber koyu | `#d97706` | Gradient bitiş, ikincil amber |

```css
/* Sayfa zemini */
background: linear-gradient(160deg, #0d1b2e 0%, #0a1628 50%, #0d1f35 100%);
background-attachment: fixed;
```

### Fonksiyonel Renkler

| Rol | HEX Açık | HEX Koyu | Kullanım |
|-----|----------|----------|----------|
| Yeşil (gelir) | `#10b981` | `#059669` | Pozitif tutarlar, giriş, başarı |
| Kırmızı (gider) | `#ef4444` | `#dc2626` | Negatif tutarlar, çıkış, uyarı |
| Cyan (bilgi) | `#0891b2` | `#0e7490` | Güncel piyasa, bilgi kartı |
| Mavi (bölüm) | `#3b82f6` | — | Section divider'lar |

### Metin Renkleri

| Seviye | Değer | Kullanım |
|--------|-------|----------|
| Birincil | `#ffffff` | Başlıklar, aktif metin |
| Form etiketi | `rgba(255,255,255,0.7)` | Label, input üst etiketleri |
| İkincil | `rgba(255,255,255,0.5)` | Alt başlıklar, tablo header |
| Soluk | `rgba(255,255,255,0.4)` | Açıklama, alt metin |
| Çok soluk | `rgba(255,255,255,0.35)` | Pasif durum, boş alan metni |
| Placeholder | `rgba(255,255,255,0.25)` | Input placeholder |

### Kenar & Ayırıcı Renkleri

| Seviye | Değer | Kullanım |
|--------|-------|----------|
| Standart | `rgba(255,255,255,0.08)` | Kart kenarı, divider |
| Hover | `rgba(255,255,255,0.14)` | Kart hover kenar |
| İnce | `rgba(255,255,255,0.06)` | Tablo satır arası, iç bölüm |
| Amber kenar | `rgba(245,158,11,0.08)` | Sidebar sağ kenar |

---

## 2. TİPOGRAFİ

```css
/* Gövde metni */
font-family: 'Outfit', sans-serif;

/* Finansal rakamlar — className="financial-num" ile işaretle */
font-family: 'Inter', sans-serif;
```

### Font Boyutları

| Eleman | Boyut | Ağırlık |
|--------|-------|---------|
| Sayfa başlığı | 1.1rem | 800 |
| KPI değeri | `clamp(13px, 6.5cqw, 26px)` | 800 |
| KPI etiketi | 11px, uppercase, `letter-spacing: 0.06em` | 700 |
| KPI alt yazı | 11-12px | 500 |
| Tablo header | 11px, uppercase, `letter-spacing: 0.05em` | 700 |
| Tablo hücre | 13-14px | 600 |
| Badge | 11px | 700 |
| Küçük metin | 10px | 600-700 |

KPI kartlarında `container-type: inline-size` ile otomatik ölçekleme kullanılır.
Bu sayede dar kolonlarda rakamlar taşmaz.

---

## 3. GLASSMORPHISM KART SİSTEMİ

Her kart bu temel yapıyı paylaşır — hover efekti ve blur zorunludur.

### KPI Kart

```css
.kpi-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 22px 24px;
  transition: all 0.2s ease;
  position: relative; overflow: hidden;
  height: 100%;
  container-type: inline-size;
}
.kpi-card:hover {
  background: rgba(255,255,255,0.07);
  border-color: rgba(255,255,255,0.14);
  transform: translateY(-2px);
}
```

**Dekoratif ikon** — kartın sağ üstüne yarı-saydam büyük ikon:
```jsx
<i className="bi bi-wallet2"
   style={{ position:'absolute', right:16, top:16, fontSize:40,
            opacity:0.06, color:'#fff' }} />
```
İkon rengi kartın vurgu rengini kullanabilir (beyaz yerine). Opacity: 0.06–0.08 arası.

### Glass Card (Genel)

KPI ile aynı ama `height: 100%` ve `container-type` yok:
```css
background: rgba(255,255,255,0.04);
backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 16px; overflow: hidden;
```

---

## 4. BUTON SİSTEMİ

### Primary (Amber Gradient)
```css
background: linear-gradient(135deg, #f59e0b, #d97706);
color: #fff;
font-weight: 700;
border-radius: 50px;
padding: 10px 22px;
border: none;
box-shadow: 0 3px 10px rgba(245,158,11,0.3);
```

### Glass (Secondary / İptal)
```css
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.12);
color: rgba(255,255,255,0.7);
border-radius: 10px;
min-height: 44px;
```
Hover: `background: rgba(255,255,255,0.1); color: #fff;`

### Outline Amber
```css
background: transparent;
border: 1px solid rgba(245,158,11,0.4);
color: #f59e0b;
font-weight: 700;
border-radius: 10px;
padding: 8px 18px;
```
Hover: `background: rgba(245,158,11,0.08); border-color: #f59e0b;`

---

## 5. MODAL SİSTEMİ (Premium Tasarım)

Modal tasarımı premium kalitede olmalıdır — her modal 4 bölümden oluşur:
**Gradient Header → Bölümlenmiş Gövde → Canlı Önizleme → Yapışkan Footer**

### Backdrop + Kutu
```jsx
{/* Backdrop — tıklamayla KAPANMAZ */}
<div style={{ position:'fixed', inset:0,
  background:'rgba(0,0,0,0.7)',
  backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
  zIndex:1040, animation:'kasaFadeIn 0.15s ease' }} />

{/* Modal kutu */}
<div style={{ width:'100%', maxWidth:540, maxHeight:'90vh',
  display:'flex', flexDirection:'column',
  borderRadius:20, overflow:'hidden',
  background:'rgba(13,27,46,0.97)',
  backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)',
  border:'1px solid rgba(255,255,255,0.1)',
  boxShadow:'0 32px 80px rgba(0,0,0,0.5)',
  animation:'kasaSlideUp 0.25s ease' }}>
```

### Gradient Header
Başlık bölümü görsel olarak modalın "kimliğini" belirler:
```jsx
<div style={{ padding:'20px 24px',
  background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08))',
  borderBottom:'2px solid rgba(245,158,11,0.4)',
  display:'flex', alignItems:'center', justifyContent:'space-between' }}>
  <div className="d-flex align-items-center gap-3">
    {/* İkon Kutusu — 42px, gradient, shadow */}
    <div style={{ width:42, height:42, borderRadius:12,
      background:'linear-gradient(135deg,#f59e0b,#d97706)',
      display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:'0 4px 12px rgba(245,158,11,0.35)' }}>
      <i className="bi bi-icon-adi" style={{ color:'#fff', fontSize:18 }} />
    </div>
    <div>
      <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>Başlık</div>
      <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)' }}>Alt açıklama</div>
    </div>
  </div>
  {/* Kapat butonu */}
  <button style={{ background:'rgba(255,255,255,0.08)',
    border:'1px solid rgba(255,255,255,0.1)',
    width:36, height:36, borderRadius:10, color:'rgba(255,255,255,0.6)' }}>
    <i className="bi bi-x-lg" />
  </button>
</div>
```

Farklı modallar farklı gradient renkleri kullanabilir (cyan/teal gibi) — bu sayede
kullanıcı hangi modalde olduğunu görsel olarak anlayabilir.

### Bölümlenmiş Form (Section Divider'lar)
Form alanları mantıksal bölümlere ayrılır. Her bölümün renkli bir çubuk işareti vardır:
```jsx
<div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
  <div style={{ width:4, height:18, borderRadius:2, background:'#f59e0b' }} />
  <span style={{ fontSize:12, fontWeight:700, color:'#f59e0b',
    textTransform:'uppercase', letterSpacing:'0.06em' }}>Bölüm Başlığı</span>
</div>
```

Renk seçimi:
- **Amber (#f59e0b):** Birincil bilgiler — varlık, ortak, cari bilgisi
- **Mavi (#3b82f6):** İkincil detaylar — işlem, alış, tarih detayları

### Canlı Önizleme Paneli
Kullanıcı form doldurdukça anlık önizleme gösterir:
```jsx
<div style={{
  background:'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(217,119,6,0.03))',
  border:'1px solid rgba(245,158,11,0.15)',
  borderRadius:14, padding:'14px 18px' }}>
  <div style={{ fontSize:10, fontWeight:700, color:'rgba(245,158,11,0.7)',
    textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
    Kayıt Önizleme
  </div>
  {/* Sol: ikon + bilgi, Sağ: tutar */}
</div>
```

### Yapışkan Footer
Kaydet butonu her zaman görünür kalır:
```jsx
<div style={{ padding:'16px 24px',
  borderTop:'1px solid rgba(255,255,255,0.08)',
  background:'rgba(13,27,46,0.98)', flexShrink:0 }}>
  <button className="btn w-100" style={{
    background:'linear-gradient(135deg,#f59e0b,#d97706)',
    color:'#fff', fontWeight:700, fontSize:15,
    borderRadius:12, padding:'13px', border:'none',
    boxShadow:'0 4px 16px rgba(245,158,11,0.3)' }}>
    <i className="bi bi-floppy me-2" />Kaydet
  </button>
</div>
```

### Animasyonlar
```css
@keyframes kasaFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
@keyframes kasaSlideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes kasaGlow {
  from { box-shadow: 0 0 8px rgba(245,158,11,0.3); }
  to { box-shadow: 0 0 20px rgba(245,158,11,0.6), 0 0 40px rgba(245,158,11,0.2); }
}
```

Mobilde (`<768px`) modal bottom-sheet tarzına döner:
```css
border-radius: 16px 16px 0 0;
max-height: 85vh;
/* wrapper: align-items: flex-end */
```

---

## 6. TABLO STİLİ

Her zaman `table-responsive` wrapper ile sarılır (Capacitor/mobil zorunlu).

```css
/* Header */
background: rgba(255,255,255,0.03);
font-size: 11px; text-transform: uppercase;
letter-spacing: 0.05em; font-weight: 700;
color: rgba(255,255,255,0.5);
padding: 10px 16px;

/* Satırlar */
transition: background 0.15s;
border-bottom: 1px solid rgba(255,255,255,0.04);

/* Satır hover */
background: rgba(255,255,255,0.03);

/* Hücre */
padding: 10-11px 16px; font-size: 13-14px;

/* Pozitif tutar */  color: #059669;  font-family: Inter;
/* Negatif tutar */  color: #dc2626;  font-family: Inter;
```

---

## 7. FORM ELEMANLARI

### Input
```css
background: rgba(255,255,255,0.05);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 10px;
color: #ffffff;
min-height: 44px;
padding: 10px 14px;
font-size: 14px;
transition: all 0.15s;
```
Focus: `border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.12);`
Placeholder: `color: rgba(255,255,255,0.25);`

### Select
Input ile aynı stil. `option { background: #0d1b2e; color: #fff; }`

### Search Input
Input stili + `padding-left: 36px` (arama ikonu alanı).
Arama ikonu: `position: absolute; left: 12px; top: 50%; transform: translateY(-50%);`

---

## 8. BADGE SİSTEMİ

| Tür | Arka Plan | Renk |
|-----|-----------|------|
| Giriş (pozitif) | `rgba(16,185,129,0.12)` | `#059669` |
| Çıkış (negatif) | `rgba(220,38,38,0.1)` | `#dc2626` |
| Amber (bilgi) | `rgba(245,158,11,0.15)` | `#f59e0b` |

Ortak stil: `border-radius: 6-8px; font-weight: 700; font-size: 11px; padding: 4px 8px;`

---

## 9. UI PATTERN'LERİ

### İkon Kutusu (Kart Başlığı / Modal Header)
```jsx
const ikonKutu = (renk, bg) => ({
  width: 36, height: 36, borderRadius: 10,
  background: bg, display: 'flex',
  alignItems: 'center', justifyContent: 'center', flexShrink: 0
})
```

Gradient versiyonu (modal header için):
```jsx
<div style={{ width:42, height:42, borderRadius:12,
  background:'linear-gradient(135deg,#f59e0b,#d97706)',
  display:'flex', alignItems:'center', justifyContent:'center',
  boxShadow:'0 4px 12px rgba(245,158,11,0.35)' }}>
  <i className="bi bi-icon-adi" style={{ color:'#fff', fontSize:18 }} />
</div>
```

### Progress Bar
```jsx
<div style={{ height:6, borderRadius:3,
  background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
  <div style={{ width:`${yuzde}%`, height:'100%',
    borderRadius:3, background:renk,
    transition:'width 0.4s ease' }} />
</div>
```

### Sayfalama Butonları
```css
background: transparent;
border: 1px solid rgba(255,255,255,0.1);
border-radius: 8px;
min-width: 34px; min-height: 34px;
color: rgba(255,255,255,0.5);
/* Aktif: */
background: #f59e0b; color: #0d1b2e;
border-color: #f59e0b;
```

### Sil Onay Pattern
Tek buton → "Emin misiniz?" + Sil + Vazgeç geçişi:
```jsx
{silOnayId === id ? (
  <span className="d-inline-flex align-items-center gap-1">
    <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>Emin misiniz?</span>
    <button onClick={sil} className="sil-btn">Sil</button>
    <button onClick={vazgec} className="vazgec-btn">Vazgeç</button>
  </span>
) : (
  <button onClick={onaySor}><i className="bi bi-trash3" /></button>
)}
```

---

## 10. RESPONSIVE BREAKPOINT'LER

| Breakpoint | Hedef | Değişiklikler |
|------------|-------|---------------|
| `<992px` | Tablet | Sidebar gizli, hamburger aktif, content margin-left: 0 |
| `<768px` | Mobil | KPI font küçült, padding azalt, modal bottom-sheet |
| `<480px` | Küçük mobil | Kart border-radius: 12px, padding: 14px |

Zorunlu kurallar:
- Tüm tıklanabilir alan: minimum **44x44px**
- Tablo: `table-responsive` wrapper + `min-width: 500px`
- Filtre tabları: `overflow-x: auto` (yatay kaydırma)

---

## 11. CSS PREFIX KURALI

Her modül kendi prefix'ini kullanır — CSS çakışması olmamalıdır:

| Modül | Prefix |
|-------|--------|
| Kasa | `kasa-` |
| Dashboard | `dash-` |
| Cari | `cari-` |
| Çek/Senet | `cek-` |
| Ödemeler | `odm-` |
| Genel | `fk-` |

Stiller `<style>{``}</style>` tag'i içinde self-contained tutulur.
Global CSS dosyası kullanılmaz — her bileşen kendi stillerini taşır.

---

## 12. ÇAPRAZ RENK DENGESİ

Koyu arka planda en sık yapılan hata: elementlerin arka planla aynı tonlarda "kaybolması".

1. **Metin:** Minimum `rgba(255,255,255,0.5)` opaklık
2. **Butonlar:** Arka planla aynı tondaysa amber outline ekle
3. **Dekoratif ikonlar:** Minimum `opacity: 0.06` ve vurgu rengiyle
4. **Form etiketleri:** Minimum `rgba(255,255,255,0.7)`
5. **Badge/dot:** Renk + glow ile vurgula
