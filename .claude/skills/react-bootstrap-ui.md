# KİMLİK: Kıdemli React ve UI/UX Uzmanı
Sen "Finans Kalesi" projesinin Frontend mimarısın.
Yeni bileşen yazarken veya UI düzenlerken aşağıdaki kurallara KESİNLİKLE uymalısın.

> **ÇALIŞMA MODELİ:**
> - Bu dosya tasarım görevlerinde OTOMATİK okunur — platform, mimari ve davranış kuralları için.
> - Tüm renkler, fontlar, kart stilleri, buton ve modal görünümleri → `tasarim-demo/` klasöründeki 3 tema CSS dosyasından alınır (`tema-2-banking/tema.css`, `tema-3-earthy/tema.css`, `tema-5-dark/tema.css`).
> - `koyu-tema.md` ve `ikas-tasarim.md` KULLANILMAZ — eski sistemlerdir.
> - Tasarım kalitesi → sistem `frontend-design` Skill'i tarafından yönetilir.
> - Ekstra yönerge yoksa → aynı modülün mevcut `.jsx` dosyasını tasarım referansı olarak al.
> - Aşağıdaki "ORTAK TASARIM STANDARTLARI" bölümü tüm sayfalar için bağlayıcıdır — her bileşen bu değerlere uymalıdır.

---

## KURALLAR (SOP)

### 1. Bootstrap 5 — Sadece CSS
`bootstrap.bundle.min.js` kullanmak YASAKTIR.
Modallar, dropdown'lar, tooltip'ler tamamen React State ile çalışır:
```jsx
// DOĞRU
<div className={`modal fade ${show ? 'show d-block' : ''}`}>
// YANLIŞ
<button data-bs-toggle="modal">
```

### 2. Kütüphane Yasakları
Shadcn UI, Tailwind, Material UI, Lucide React — kesinlikle kullanılmaz.
İkonlar: SADECE Bootstrap Icons (`<i className="bi bi-x"></i>`)

### 3. Para Formatı (Zorunlu Standart)
```jsx
// Görüntüleme
Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(tutar)

// Input masking (kullanıcı yazarken)
const formatParaInput = (value) => {
  let v = value.replace(/[^0-9,]/g, '')
  const parts = v.split(',')
  if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = v.split(',')
  const formatted = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? formatted + ',' + kesir.slice(0, 2) : formatted
}
const parseParaInput = (f) => parseFloat(f.replace(/\./g, '').replace(',', '.')) || 0
```

### 4. Modal Davranış Kuralları
- **ESC ile kapanma:** TÜM modallar ESC ile kapanır (staticBackdrop dahil)
- **Backdrop tıklama:** Modallar dışarı tıklamayla KAPANMAZ — sadece ESC ve (X)/İptal butonu
- Her modal bileşeninde global keydown listener zorunlu:
```jsx
useEffect(() => {
  const handleEsc = (e) => { if (e.key === 'Escape') setShowModal(false) }
  document.addEventListener('keydown', handleEsc)
  return () => document.removeEventListener('keydown', handleEsc)
}, [])
```

### 5. Veri Çekme Standartı
Sayfa yüklendiğinde veriler backend'den çekilir:
```jsx
useEffect(() => { veriGetir() }, []) // boş dependency array
```

---

## TABLO YAPISI
Tüm tablolar `table-responsive` wrapper içinde olur (Capacitor/mobil zorunlu):
```jsx
<div className="table-responsive">
  <table className="table table-hover align-middle">
```

---

## MOBİL UYUMLULUK (Capacitor Hazırlığı)
Her bileşen bu kurallara uyar — ileride sıfır düzeltme hedefi:
- Sabit `px` yerine Bootstrap responsive sınıfları (`col-md-6`, `gap-2`)
- Tıklanabilir alan minimum **44x44px**
- `window.location` kullanma → React Router kullan
- `localStorage` kullanma → Zustand store kullan

---

## ORTAK TASARIM STANDARTLARI (Bağlayıcıdır — Tüm Sayfalar İçin Geçerli)

> Aşağıdaki değerler `tasarim-demo/` klasöründeki 3 tema CSS dosyasında tanımlıdır.
> Her yeni sayfa veya bileşen bu standartlara UYMALDIR. Mevcut sayfalar da bu standartlara çekilecektir.
> `{p}` = aktif temanın prefix'i (`b`, `e`, `d`)

### Tipografi Hiyerarşisi

| Eleman | Font Size | Weight | Family | Color |
|--------|-----------|--------|--------|-------|
| Sayfa Başlığı | 20px | 700 | `var(--{p}-font-display)` | `var(--{p}-text)` |
| Sayfa Alt Başlığı | 13px | 500 | `var(--{p}-font-body)` | `var(--{p}-text-sec)` |
| KPI Etiket | 11px | 600 | `var(--{p}-font-body)` | `var(--{p}-text-label)` |
| KPI Değer | `clamp(16px, 5cqw, 26px)` | 700 | `var(--{p}-font-display)` | `var(--{p}-text)` |
| Kart Başlığı | 14px | 700 | `var(--{p}-font-body)` | `var(--{p}-text)` |
| Kart Açıklaması | 12px | 400 | `var(--{p}-font-body)` | `var(--{p}-text-muted)` |
| Tablo Başlığı | 11px | 700 | `var(--{p}-font-body)` | `var(--{p}-text-muted)` |
| Badge Metin | 11px | 600 | `var(--{p}-font-body)` | (badge rengine göre) |

**KPI Etiket ek kuralları:**
- `text-transform: uppercase`
- `letter-spacing: 0.08em`

### Kart Sistemi (Card)

| Özellik | Değer |
|---------|-------|
| Border radius | `var(--{p}-radius-card)` — tema bazlı: B=10px, E=12px, D=12px |
| Border | `1px solid var(--{p}-border)` |
| Shadow | `var(--{p}-shadow-card)` |
| Hover shadow | `var(--{p}-shadow-card-hover)` |
| Hover transform | `translateY(-2px)` |
| KPI card padding | `22px 24px` |
| Section header padding | `18px 22px` |
| Section body padding | `20px 22px` |

**Tema bazlı dekoratif farklar (izin verilen):**
- Banking: border-left 4px accent renk
- Earthy: bottom bar 3px accent renk
- Dark: top gradient 1px accent renk
- Bu farklar beklenen davranıştır — yapısal değerler (radius, padding, shadow) tüm temalarda aynı olmalıdır.

### Modal Sistemi

| Özellik | Değer |
|---------|-------|
| Border radius | 16px |
| Shadow | `var(--{p}-shadow-modal)` |
| Backdrop | `var(--{p}-bg-overlay)` |
| Header padding | 20px 24px |
| Body padding | 20px 24px |
| Footer padding | 14px 24px |
| Title font-size | 16px |
| Title font-weight | 800 |
| Mobil (≤767px) | Bottom-sheet: `border-radius: 16px 16px 0 0; max-height: 85vh` |

### Buton Sistemi

| Özellik | Değer |
|---------|-------|
| Min height | 44px (touch target zorunlu) |
| Border radius | 10px |
| Font size | 13px |
| Font weight | 600 |
| Padding | 0 18px |
| Transition | `var(--{p}-transition)` |

### Mobil Breakpoint'ler (3+1 Standart)

| Breakpoint | Ad | Kullanım |
|------------|-----|----------|
| `@media (max-width: 1200px)` | Geniş tablet | Yalnızca 4+ kolonlu KPI grid'lerde (istisnai) |
| `@media (max-width: 991px)` | Tablet | Grid: 4→2 kolon, drawer full-width |
| `@media (max-width: 767px)` | Mobil | Grid: 2→1 kolon, modal bottom-sheet, font küçültme |
| `@media (max-width: 480px)` | Küçük mobil | Tighter padding, son fallback |

Bu 4 breakpoint dışında yeni breakpoint eklenmez. Mevcut `576px`, `640px`, `1100px` gibi ara breakpoint'ler standardizasyon sırasında bu 4 değere çekilecektir.

### İnline Style Kuralları

| Durum | İzin |
|-------|------|
| Yapısal: skeleton boyutları, position, flex-basis | ✅ İzinli |
| Veri-driven: progress bar width, animasyon değerleri | ✅ İzinli |
| Tema rengi: `color: '#xxx'`, `background: '#xxx'`, `rgba(...)` | ❌ YASAK — CSS class kullan |
| Sabit boyut: `width: '200px'`, `height: '50px'` | ⚠️ Mümkünse CSS class'a taşı |

### CSS Class İsimlendirme Kuralı

```
.{p}-{modül}-{bileşen}
```

Örnekler:
- `.b-dash-kpi-card` → Banking Dashboard KPI kartı
- `.e-cek-modal` → Earthy CekSenet modalı
- `.d-odm-drawer` → Dark OdemeTakip drawer

**Ortak bileşenler (modülsüz):**
- `.{p}-kpi-card` — tüm sayfalarda paylaşılan KPI kartı
- `.{p}-modal-box` — tüm sayfalarda paylaşılan modal kutusu
- `.{p}-page-title` — sayfa başlığı
- `.{p}-page-sub` — sayfa alt başlığı

### Gölge Değerleri — Inline rgba() YASAK

```css
/* DOĞRU */
box-shadow: var(--b-shadow-card);
box-shadow: var(--b-shadow-card-hover);
box-shadow: var(--b-shadow-modal);

/* YANLIŞ — hiçbir sayfada inline shadow yazılmaz */
box-shadow: 0 4px 16px rgba(0,0,0,0.06);
```

Tema CSS'inde yeni shadow gerekiyorsa `:root`'a yeni variable eklenir.

### CSS Variable Kontrol Kuralı

Yeni bir CSS variable kullanmadan önce:
1. `grep` ile `:root` bloğunda tanımlı mı kontrol et
2. Aynı isimde eski tanım var mı kontrol et (alias çakışması riski)
3. Yoksa 3 tema dosyasına da ekle

