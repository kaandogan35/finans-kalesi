# Tasarım Skill — Form & Input Sistemi
# Referans: GelirGiderSayfasi.jsx, GirisYap.jsx, CariYonetimi.jsx
# CLAUDE.md'deki genel kurallar her zaman geçerlidir.

---

## STANDART INPUT

```jsx
<div style={{ marginBottom: 16 }}>
  <label className={`${p}-kasa-input-label`}>Alan Başlığı</label>
  <input
    type="text"
    className={`${p}-kasa-input`}
    placeholder="Yazın..."
    value={deger}
    onChange={(e) => setDeger(e.target.value)}
  />
</div>
```

---

## SELECT

```jsx
<div style={{ marginBottom: 16 }}>
  <label className={`${p}-kasa-input-label`}>Seçim</label>
  <select
    className={`${p}-kasa-select`}
    value={secim}
    onChange={(e) => setSecim(e.target.value)}
  >
    <option value="">Seçiniz...</option>
    <option value="a">Seçenek A</option>
  </select>
</div>
```

---

## PARA GİRİŞİ (Maskeleme)

```jsx
const formatParaInput = (value) => {
  let v = value.replace(/[^0-9,]/g, '')
  const parts = v.split(',')
  if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = v.split(',')
  const formatted = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? formatted + ',' + kesir.slice(0, 2) : formatted
}
const parseParaInput = (f) => parseFloat(f.replace(/\./g, '').replace(',', '.')) || 0

<input
  type="text"
  className={`${p}-kasa-input`}
  placeholder="0,00"
  value={tutarText}
  onChange={(e) => setTutarText(formatParaInput(e.target.value))}
/>
```

---

## ARAMA KUTUSU

```jsx
<div className={`${p}-cari-search-wrap`}>
  <i className={`bi bi-search ${p}-cari-search-icon`} />
  <input
    type="text"
    className={`${p}-cari-search-input`}
    placeholder="Ara..."
    value={aramaText}
    onChange={(e) => setAramaText(e.target.value)}
  />
</div>
```

---

## MODAL İÇİ FORM (Bootstrap override — otomatik stillanır)

```jsx
// .p-modal-box içinde Bootstrap form-control otomatik stillanır
// Ekstra sınıf gerekmez — paramgo.css override tanımlı
<div className={`${p}-modal-body`}>
  <div className="mb-3">
    <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
      Alan Adı
    </label>
    <input
      type="text"
      className="form-control"
      style={{ borderRadius: 10 }}
      placeholder="Yazın..."
    />
  </div>
  <div className="mb-3">
    <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
      Seçim
    </label>
    <select className="form-select" style={{ borderRadius: 10 }}>
      <option>Seçiniz</option>
    </select>
  </div>
</div>
```

---

## FORM GRİD (2 Kolon)

```jsx
<div className="row g-3">
  <div className="col-md-6">
    <label className={`${p}-kasa-input-label`}>Ad</label>
    <input className={`${p}-kasa-input`} type="text" />
  </div>
  <div className="col-md-6">
    <label className={`${p}-kasa-input-label`}>Soyad</label>
    <input className={`${p}-kasa-input`} type="text" />
  </div>
</div>
```

---

## KURALLAR
- Input min-height: **44px** (mobil dokunma)
- Border radius: **10px**
- Focus: `box-shadow: 0 0 0 3px rgba(16,185,129,0.10)` — CSS'te tanımlı
- Label: `p-kasa-input-label` (12px, 600, muted)
- Hata mesajı: `style={{ color: 'var(--p-color-danger)', fontSize: 12, marginTop: 4 }}`
- Zorunlu alan işareti: `<span style={{ color: 'var(--p-color-danger)' }}>*</span>`
