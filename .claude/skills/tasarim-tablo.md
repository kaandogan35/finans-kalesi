# Tasarım Skill — Tablo Sistemi
# Referans: CarilerListesi.jsx, OdemeTakip.jsx, KasaGorunum.jsx
# CLAUDE.md'deki genel kurallar her zaman geçerlidir.

---

## STANDART TABLO

```jsx
<div className="table-responsive">          {/* ZORUNLU wrapper — mobil/Capacitor */}
  <table className={`${p}-table`}>
    <thead>
      <tr>
        <th>Cari Adı</th>                   {/* 11px, uppercase, gradient bg */}
        <th>Tür</th>
        <th className="text-end">Tutar</th>
      </tr>
    </thead>
    <tbody>
      {liste.map((item) => (
        <tr key={item.id}>
          <td>{item.ad}</td>
          <td>
            <span className={`${p}-badge ${p}-badge-success`}>Aktif</span>
          </td>
          <td className="text-end">
            <span className="p-amount-pos financial-num">{TL(item.tutar)} ₺</span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## TABLO BAŞLIK GRADİENT (Zorunlu — Thead)

```css
/* paramgo.css .p-table thead th içinde tanımlı */
background: linear-gradient(90deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%);
```

---

## LISTE TABLO (Panel İçi — Cari Pattern)

```jsx
<div className={`${p}-panel`} style={{ padding: 0, overflow: 'hidden' }}>

  {/* Başlık satırı */}
  <div className={`${p}-cari-grid-header`}>   {/* yeşil gradient bg */}
    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Ad</span>
    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Tutar</span>
    <span />
  </div>

  {/* Veri satırları */}
  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
    {liste.map((item) => (
      <li key={item.id} className={`${p}-cari-grid-row`}>   {/* hover yeşil */}
        <div className="d-flex align-items-center gap-3">
          <div className={`${p}-cari-avatar`}>
            {item.ad?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{item.ad}</p>
            <p style={{ fontSize: 11, color: 'var(--p-text-muted)', margin: 0 }}>{item.alt}</p>
          </div>
        </div>
        <span className="p-amount-pos financial-num">{TL(item.tutar)} ₺</span>
        <AksiyonMenusu item={item} />
      </li>
    ))}
  </ul>
</div>
```

---

## TUTAR RENKLERİ

```jsx
<span className="p-amount-pos financial-num">{TL(alacak)} ₺</span>   // yeşil
<span className="p-amount-neg financial-num">{TL(borc)} ₺</span>     // kırmızı
```

---

## BOŞ DURUM

```jsx
{liste.length === 0 && (
  <div className="text-center py-5">
    <i className="bi bi-inbox" style={{ fontSize: 40, color: 'var(--p-text-muted)', opacity: 0.4 }} />
    <p style={{ color: 'var(--p-text-muted)', marginTop: 12, fontSize: 14 }}>
      Henüz kayıt yok
    </p>
    <button className={`${p}-cari-btn-new`} onClick={onYeniEkle}>
      <i className="bi bi-plus-lg" /> İlk Kaydı Ekle
    </button>
  </div>
)}
```

---

## YÜKLENİYOR (Skeleton)

```jsx
{yukleniyor && (
  <div className="p-4 text-center">
    <i className="bi bi-hourglass-split me-2" style={{ color: 'var(--p-color-primary)' }} />
    <span style={{ color: 'var(--p-text-muted)', fontSize: 14 }}>Yükleniyor...</span>
  </div>
)}
```

---

## KURALLAR
- `table-responsive` wrapper ZORUNLU (Capacitor uyumu)
- Tablo başlıkları: 11px, 700, uppercase, gradient bg
- Satır hover: `var(--p-bg-table-row-hover)` (#f0fdf4)
- `financial-num` sınıfı tüm tutar hücrelerinde zorunlu
- Sayfalama için `tasarim-buton.md` → Sayfalama bölümü
