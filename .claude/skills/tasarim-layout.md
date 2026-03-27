# Tasarım Skill — Sayfa Layout & Header Sistemi
# Referans: AppLayoutParamGo.jsx, Dashboard.jsx, VeresiyeListesi.jsx
# CLAUDE.md'deki genel kurallar her zaman geçerlidir.

---

## SAYFA HEADER (Her Sayfada Zorunlu Şablon)

```jsx
<div className={`${p}-page-header`}>
  <div className={`${p}-page-header-left`}>
    <div className={`${p}-page-header-icon`}>      {/* 44x44, 14px radius, yeşil gradient */}
      <i className="bi bi-[sayfa-ikonu]-fill" />   {/* 20px, yeşil */}
    </div>
    <div>
      <h1 className={`${p}-page-title`}>Sayfa Başlığı</h1>   {/* 20px, 700 */}
      <p  className={`${p}-page-sub`}>Alt açıklama</p>       {/* 13px, muted */}
    </div>
  </div>
  <div className={`${p}-page-header-right`}>   {/* aksiyon butonları */}
    <button className={`${p}-cari-btn-new`}>
      <i className="bi bi-plus-lg" /> Yeni Ekle
    </button>
  </div>
</div>
```

---

## SAYFA İKONLARI

| Sayfa | İkon |
|-------|------|
| Dashboard | `bi-grid-1x2-fill` |
| Cari Hesaplar | `bi-people-fill` |
| Çek/Senet | `bi-file-earmark-text-fill` |
| Ödeme Takip | `bi-credit-card-2-front-fill` |
| Kasa | `bi-safe-fill` |
| Gelirler | `bi-arrow-down-circle-fill` |
| Giderler | `bi-arrow-up-circle-fill` |
| Veresiye | `bi-journal-bookmark-fill` |
| Raporlar | `bi-bar-chart-fill` |
| Ayarlar | `bi-gear-fill` |
| Kullanıcılar | `bi-people-fill` |
| Vade Hesap. | `bi-calculator-fill` |

---

## APP LAYOUT YAPISI

```
p-app (flex, min-h-100vh)
├── p-sidebar (256px, fixed, beyaz)
│   ├── p-logo (38x38 ikon + ParamGo metni)
│   ├── p-nav (flex-col, gap 2px)
│   │   ├── p-nav-btn (44px min-h, hover yeşil)
│   │   ├── p-nav-btn p-nav-active (yeşil, sol border)
│   │   └── p-nav-accordion (alt menü)
│   └── p-user (avatar + ad + rol)
└── p-main (flex:1, margin-left 256px)
    ├── p-topbar (sticky, 80px, beyaz)
    │   ├── p-topbar-brand (logo + breadcrumb)
    │   └── p-topbar-right (bildirim + avatar)
    └── p-content (28px 32px padding, #EAECF0)
        └── <Outlet /> — sayfa içeriği
```

---

## DARK TEMA AÇMA/KAPAMA

```jsx
// Açık tema (varsayılan)
document.documentElement.removeAttribute('data-theme')

// Dark tema
document.documentElement.setAttribute('data-theme', 'dark')

// Toggle
const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark')
```

---

## SAYFA CONTAINER

```jsx
export default function BenimSayfam() {
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = { paramgo: 'p' }[aktifTema] || 'p'

  return (
    <div>
      {/* 1. Sayfa Header */}
      <div className={`${p}-page-header`}>
        ...
      </div>

      {/* 2. KPI Kartları (varsa) */}
      <div className={`${p}-kpi-grid-3`}>
        ...
      </div>

      {/* 3. Ana İçerik (panel veya tablo) */}
      <div className={`${p}-panel`}>
        ...
      </div>
    </div>
  )
}
```

---

## RESPONSIVE BREAKPOINTS (4 Standart)

| Breakpoint | Kullanım |
|-----------|---------|
| ≤1200px | KPI grid: 4→2 kolon (istisnai) |
| ≤991px | Genel grid: 4→2 kolon, drawer full-width |
| ≤767px | Grid: 2→1 kolon, modal → bottom-sheet |
| ≤480px | Sıkı padding, son fallback |

Bu 4 dışında breakpoint ekleme.

---

## KURALLAR
- Sayfa başlığı `h1` + `${p}-page-title` (h2/h4 yasak)
- Alt başlık `p` + `${p}-page-sub`
- Topbar'da sayfa başlığı OLMAZ — sayfa içinde header'da olur
- Her sayfada `p-page-header` zorunlu
