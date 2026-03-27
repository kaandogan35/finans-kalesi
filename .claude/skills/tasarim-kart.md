# Tasarım Skill — Kart & KPI & Panel Sistemi
# Referans: Dashboard.jsx, KasaGorunum.jsx
# CLAUDE.md'deki genel kurallar her zaman geçerlidir.

---

## KPI KART

### 3 Sütun Grid (Standart)
```jsx
<div className={`${p}-kpi-grid-3`}>  {/* 991px→2kolon, 480px→1kolon */}
  <div className={`${p}-kpi-card`}>
    <i className="bi bi-wallet2 p-kpi-deco"  // dekoratif ikon, opacity:0.35 (CSS'te tanımlı)
       style={{ color: 'var(--p-color-primary)' }} />
    <h6 className={`${p}-kpi-label`}>TOPLAM GELİR</h6>  {/* 11px, uppercase */}
    <div className={`${p}-kpi-value financial-num`}>     {/* clamp(16-26px), tabular-nums */}
      {TL(deger)} ₺
    </div>
    <p className={`${p}-kpi-sub neutral`}>Alt bilgi metni</p>  {/* neutral / up / down */}
  </div>
</div>
```

### 4 Sütun Grid
```jsx
<div className={`${p}-kpi-grid`}>  {/* 1200px→2kolon, 767px→1kolon */}
```

### KPI Alt Bilgi Renkleri
```jsx
<p className={`${p}-kpi-sub up`}>+%12 bu ay</p>      // yeşil
<p className={`${p}-kpi-sub down`}>-%5 bu ay</p>     // kırmızı
<p className={`${p}-kpi-sub neutral`}>42 kayıt</p>   // gri
```

---

## PANEL (Bölüm Kartı)

```jsx
<div className={`${p}-panel`}>
  {/* Başlık — yeşil gradient */}
  <div className={`${p}-panel-header`}>
    <div className={`${p}-panel-title`}>
      <i className="bi bi-safe-fill" />   {/* yeşil, opacity 0.7 — CSS'te tanımlı */}
      Panel Başlığı
    </div>
    <button className={`${p}-btn-outline`}>Filtre</button>
  </div>

  {/* İçerik */}
  <div className={`${p}-panel-body-padded`}>  {/* 20px 22px padding */}
    <div className={`${p}-metric-row`}>        {/* flex space-between */}
      <span className={`${p}-metric-label`}>Etiket</span>    {/* 13px, muted */}
      <span className={`${p}-metric-value financial-num`}>   {/* 13px, primary */}
        {TL(tutar)} ₺
      </span>
    </div>
  </div>
</div>
```

---

## GLASS CARD (Genel Amaçlı Kart)

```jsx
<div className={`${p}-kasa-glass-card`}>  {/* 14px radius, beyaz, shadow */}
  {/* içerik */}
</div>
```

---

## LİSTE SATIRI (Kart İçinde)

```jsx
<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
  <li className={`${p}-list-row`}>               {/* 12px 20px padding, hover bg */}
    <div className="d-flex align-items-center gap-3">
      <div className={`${p}-avatar`}>             {/* 36x36, yeşil bg, 50% radius */}
        <i className="bi bi-person" />
      </div>
      <div>
        <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Başlık</p>
        <p className={`${p}-metric-label`} style={{ margin: 0 }}>Alt bilgi</p>
      </div>
    </div>
    <div className="text-end">
      <span className={`${p}-metric-value financial-num`}>{TL(tutar)} ₺</span>
    </div>
  </li>
</ul>
```

---

## KART KURALLARI
- Border radius: **14px** (inline: `borderRadius: 14`)
- Shadow: `var(--p-shadow-card)` — hover: `var(--p-shadow-card-hover)`
- Hover transform: `translateY(-2px)`
- Dekoratif ikon: **opacity: 0.35** (kesinlikle)
- Padding: 22px 24px (KPI), 20px 22px (panel body)
- `container-type: inline-size` — KPI değer için clamp() çalışsın
