# Tasarım Skill — Buton Sistemi
# Referans: CarilerListesi.jsx, CariYonetimi.jsx, paramgo.css
# CLAUDE.md'deki genel kurallar her zaman geçerlidir.

---

## TEMEL KURALLAR
- Min height: **44px** (mobil dokunma zorunlu)
- Border radius: **10px**
- Font: Inter, 13-14px, weight 600
- Transition: `var(--p-transition)` (0.18s ease)

---

## ANA BUTONLAR

### Primary — Yeşil (Ana Aksiyon)
```jsx
// CSS sınıfı: p-cari-btn-new
<button className={`${p}-cari-btn-new`} onClick={...}>
  <i className="bi bi-plus-lg" /> Yeni Ekle
</button>
// Özellikler: #10B981, hover #059669 + translateY(-1px), shadow
```

### Secondary — İptal / Vazgeç
```jsx
// CSS sınıfı: p-btn-cancel
<button className={`${p}-btn-cancel`} onClick={onClose}>
  İptal
</button>
// Özellikler: #f0f2f5 bg, border, hover gri koyu
```

### Outline — İkincil Aksiyon
```jsx
// CSS sınıfı: p-cym-btn-outline
<button className={`${p}-cym-btn-outline`} onClick={...}>
  <i className="bi bi-download" /> Dışa Aktar
</button>
// Özellikler: Transparent bg, yeşil border + metin
```

---

## KAYDET BUTONLARI (Modal Footer)

```jsx
// Genel kaydet — yeşil gradient
<button className={`${p}-btn-save ${p}-btn-save-default`} disabled={yukleniyor}>
  {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
</button>

// Silme onayla — kırmızı gradient
<button className={`${p}-btn-save ${p}-btn-save-red`} disabled={yukleniyor}>
  {yukleniyor ? 'Siliniyor...' : 'Evet, Sil'}
</button>

// Tahsilat — yeşil gradient
<button className={`${p}-btn-save ${p}-btn-save-green`}>Tahsilat Yap</button>

// Ödeme — kırmızı gradient
<button className={`${p}-btn-save ${p}-btn-save-red`}>Ödeme Yap</button>

// Uyarı — turuncu gradient
<button className={`${p}-btn-save ${p}-btn-save-warning`}>Onayla</button>
```

---

## İKON BUTONLARI

### Tekil ikon (44x44)
```jsx
// CSS sınıfı: p-icon-btn (topbar/header için)
<button className={`${p}-icon-btn`}>
  <i className="bi bi-bell" />
</button>
```

### Aksiyon butonları (satır içi — 38x38)
```jsx
// Yeşil — finansal işlem
<button className={`${p}-cym-action-btn ${p}-cym-action-success`} title="İşlem Ekle">
  <i className="bi bi-cash" />
</button>

// Kırmızı — sil
<button className={`${p}-cym-action-btn ${p}-cym-action-danger`} title="Sil">
  <i className="bi bi-trash3" />
</button>

// Turuncu — düzenle/görüntüle
<button className={`${p}-cym-action-btn ${p}-cym-action-accent`} title="Düzenle">
  <i className="bi bi-pencil" />
</button>

// Mavi — ödeme
<button className={`${p}-cym-action-btn ${p}-cym-action-odeme`} title="Ödeme">
  <i className="bi bi-arrow-left-right" />
</button>
```

---

## ÜÇLÜ NOKTA MENÜSÜ (Dropdown)

```jsx
function AksiyonMenusu({ onDetay, onDuzenle, onSil, p }) {
  const [acik, setAcik] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button className={`${p}-cari-menu-trigger`} onClick={() => setAcik(v => !v)}>
        <i className="bi bi-three-dots-vertical" />
      </button>
      {acik && (
        <>
          <div className={`${p}-cari-menu-backdrop`} onClick={() => setAcik(false)} />
          <div className={`${p}-cari-menu-dropdown`}>
            <button className={`${p}-cari-menu-item`} onClick={() => { setAcik(false); onDetay() }}>
              <i className="bi bi-eye" /> Detay
            </button>
            <button className={`${p}-cari-menu-item`} onClick={() => { setAcik(false); onDuzenle() }}>
              <i className="bi bi-pencil" /> Düzenle
            </button>
            <div className={`${p}-cari-menu-divider`} />
            <button className={`${p}-cari-menu-item ${p}-cari-menu-item-danger`} onClick={() => { setAcik(false); onSil() }}>
              <i className="bi bi-trash3" /> Sil
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

---

## LOADING STATE (Spinner)

```jsx
// Buton içinde loading
<button className={`${p}-cari-btn-new`} disabled={yukleniyor}>
  {yukleniyor
    ? <><i className="bi bi-hourglass-split me-2" />Kaydediliyor...</>
    : <><i className="bi bi-plus-lg" />Yeni Ekle</>}
</button>
```

---

## SAYFALAMA

```jsx
<div className={`${p}-cari-pagination`}>
  <p className={`${p}-cari-page-info`}>{baslangic}–{bitis} / {toplam} kayıt</p>
  <div className="d-flex align-items-center gap-2">
    <button className={`${p}-cari-page-btn`} disabled={sayfa <= 1} onClick={() => setSayfa(s => s - 1)}>
      <i className="bi bi-chevron-left" /> Önceki
    </button>
    <span className={`${p}-cari-page-current`}>{sayfa} / {toplamSayfa}</span>
    <button className={`${p}-cari-page-btn`} disabled={sayfa >= toplamSayfa} onClick={() => setSayfa(s => s + 1)}>
      Sonraki <i className="bi bi-chevron-right" />
    </button>
  </div>
</div>
```

---

## YASAK
- `style={{ background: '#10B981' }}` — CSS sınıfı kullan
- 44px altında buton yüksekliği
- 10px dışında border-radius (pill hariç)
