---
name: demo-tasarim
description: >
  Bağımsız demo ve prototip arayüzler oluşturmak için kullanılır.
  Projeye özgü tema veya renk kısıtı yoktur — teknik platform kuralları
  (Bootstrap 5, React state, Capacitor uyumlu) geçerlidir, tasarım tamamen serbesttir.
  "demo tasarım", "prototip yap", "konsept çiz", "örnek arayüz", "demo yap"
  gibi açık komutlarla tetiklenir. Otomatik tetiklenmez.
---

# Demo Tasarım Skill'i

Bu skill, projenin mevcut tema ve renk sistemiyle bağlantısı olmayan,
serbest demo ve prototip arayüzler üretmek için kullanılır.

> **BAĞIMSIZLIK NOTU:**
> Bu skill hiçbir tema dosyasına, renk paletine veya proje stiline bağlı değildir.
> Renk, tipografi, kart stili ve görsel dil tamamen serbesttir.
> `frontend-design` Skill'i ile birlikte kullanılabilir (isteğe bağlı).

---

## TEKNİK ZORUNLULUKLAR

Aşağıdaki kurallar platform hedefi (web + iOS + Android) gereği her demoda uygulanır.

### 1. Bootstrap 5 — Sadece CSS
`bootstrap.bundle.min.js` kullanılmaz.
Modallar, dropdown'lar, tooltip'ler tamamen React State ile çalışır:
```jsx
// DOĞRU
<div className={`modal fade ${show ? 'show d-block' : ''}`}>
// YANLIŞ
<button data-bs-toggle="modal">
```

### 2. Kütüphane Kısıtları
Shadcn UI, Tailwind, Material UI, Lucide React — kullanılmaz.
İkonlar: SADECE Bootstrap Icons (`<i className="bi bi-x"></i>`)

### 3. Para Formatı (Türkçe Standart)
```jsx
// Görüntüleme
Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(tutar)

// Input masking
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
- **ESC ile kapanma:** Tüm modallar ESC tuşuyla kapanır
- **Backdrop tıklama:** Modallar dışarıya tıklamayla kapanmaz — sadece ESC ve Kapat/İptal butonu
```jsx
useEffect(() => {
  const handleEsc = (e) => { if (e.key === 'Escape') setShowModal(false) }
  document.addEventListener('keydown', handleEsc)
  return () => document.removeEventListener('keydown', handleEsc)
}, [])
```

### 5. Veri / State
Sayfa yüklendiğinde mock veri ya da gerçek veri çekilir:
```jsx
useEffect(() => { veriGetir() }, [])
```

---

## MOBİL UYUMLULUK (Capacitor Hazırlığı)

Demo bileşenler de mobil uyumlu yazılır:
- Sabit `px` yerine Bootstrap responsive sınıfları (`col-md-6`, `gap-2`)
- Tıklanabilir alan minimum **44x44px**
- `window.location` kullanma → React Router kullan
- `localStorage` kullanma → Zustand store kullan
- Tablolarda `table-responsive` wrapper zorunlu:
```jsx
<div className="table-responsive">
  <table className="table table-hover align-middle">
```

---

## SERBEST TASARIM ALANI

Aşağıdaki kararlar tamamen serbesttir — proje temasına bağlı kalma zorunluluğu yoktur:

- **Renk paleti:** İstenen her renk kombinasyonu kullanılabilir
- **Arka plan:** Açık, koyu, gradyan, solid — serbest
- **Kart stili:** Glassmorphism, neumorphism, flat, outlined — serbest
- **Tipografi:** Bootstrap varsayılanı veya Google Fonts — serbest
- **Buton stili:** Rounded, sharp, gradient, solid — serbest
- **Animasyonlar:** CSS transition/keyframe — serbest

Tasarım kararlarında hedef kitleyi ve demo amacını ön planda tut.
