# Tasarım Skill — Badge & Etiket & Rozet Sistemi
# Referans: Dashboard.jsx, CarilerListesi.jsx, KasaGorunum.jsx, OdemeTakip.jsx
# CLAUDE.md'deki genel kurallar her zaman geçerlidir.

---

## GENEL BADGE

```jsx
<span className={`${p}-badge ${p}-badge-success`}>Ödendi</span>    // yeşil
<span className={`${p}-badge ${p}-badge-danger`}>Gecikti</span>    // kırmızı
<span className={`${p}-badge ${p}-badge-warning`}>Bekliyor</span>  // turuncu
```
- Padding: 3px 8px, border-radius: 4px, font: 11px 600

---

## VADE ROZETİ (Dashboard — p-badge-vade)

```jsx
function VadeRozeti({ gun, p }) {
  if (gun < 0)    return <span className={`${p}-badge-vade ${p}-badge-overdue`}>Vadesi Geçti</span>
  if (gun === 0)  return <span className={`${p}-badge-vade ${p}-badge-today`}>Bugün!</span>
  if (gun <= 3)   return <span className={`${p}-badge-vade ${p}-badge-critical`}>{gun} gün</span>
  if (gun <= 7)   return <span className={`${p}-badge-vade ${p}-badge-caution`}>{gun} gün</span>
  if (gun <= 15)  return <span className={`${p}-badge-vade ${p}-badge-attention`}>{gun} gün</span>
  return <span className={`${p}-badge-vade ${p}-badge-ok`}>{gun} gün</span>
}
// border-radius: 20px (pill — istisna)
```

---

## CARİ TİPİ ROZETİ

```jsx
function CariTipiRozeti({ tur, p }) {
  const harita = {
    musteri:           { etiket: 'Müşteri',    cls: 'musteri' },
    tedarikci:         { etiket: 'Tedarikçi',  cls: 'tedarikci' },
    musteri_tedarikci: { etiket: 'Müşt./Ted.', cls: 'karma' },
  }
  const d = harita[tur] || { etiket: tur || '—', cls: 'musteri' }
  return <span className={`${p}-cari-badge ${p}-cari-badge-${d.cls}`}>{d.etiket}</span>
}
// border-radius: 20px (pill — istisna)
```

---

## KASA İŞLEM ROZETİ

```jsx
<span className={`${p}-kasa-badge ${p}-kasa-badge-giris`}>Giriş</span>   // yeşil
<span className={`${p}-kasa-badge ${p}-kasa-badge-cikis`}>Çıkış</span>   // kırmızı
<span className={`${p}-kasa-badge ${p}-kasa-badge-accent`}>Aktif</span>  // yeşil hafif
// border-radius: 10px, padding: 4px 12px, font: 12px 600
```

---

## ÖDEME TAKİP ROZETİ

```jsx
<span className={`${p}-odm-badge`}>Genel</span>
<span className={`${p}-odm-badge ${p}-odm-badge-kritik`}>Kritik</span>  // kırmızı
// border-radius: 10px
```

---

## DURUM ROZETİ (Özel — inline)

```jsx
// CSS class yoksa inline stil kullan (tek seferlik)
<span style={{
  fontSize: 11, fontWeight: 700,
  padding: '3px 10px', borderRadius: 10,
  background: 'var(--p-bg-badge-success)',
  color: 'var(--p-color-success)'
}}>
  Tamamlandı
</span>
```

---

## BORDER RADIUS HATIRLATMA
- Standart badge: **10px** (veya 4px — genel badge)
- Pill badge (vade, cari tipi): **20px** (istisna — kasıtlı yuvarlak)
- Progress bar: **2px** (istisna)
