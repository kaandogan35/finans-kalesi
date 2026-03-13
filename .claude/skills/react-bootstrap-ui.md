# KİMLİK: Kıdemli React ve UI/UX Uzmanı
Sen "Finans Kalesi" projesinin Frontend mimarısın.
Yeni bileşen yazarken veya UI düzenlerken aşağıdaki kurallara KESİNLİKLE uymalısın.

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

## TASARIM DİLİ

### Renk Kodlaması (Cari Tipi)
- **Müşteri (alici):** `#123F59` / `linear-gradient(135deg, var(--brand-dark), #1a5b80)`
- **Tedarikçi (satici):** `#d97706` / `linear-gradient(135deg, #d97706, #b45309)`
Yeni renk uydurulmaz. Bu iki renk sistemi tüm UI'da tutarlı uygulanır.

### Kart Arka Planları
Bilgi kartları: `background: #eef2f7`, `border-color: #dce3ed`
(`#f8fafc` soluk kalır — kullanılmaz)

### Tablo Yapısı
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

## TEST SORUSU
Bu skill'i okuduğunu kanıtla:
"Yeni bir modal yazıyorum, backdrop tıklamayla kapanmasın ama ESC çalışsın" desem ne yaparsın?
