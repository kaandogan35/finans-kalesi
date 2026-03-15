/**
 * Finans Kalesi — Palet 1: Volkanik Obsidyen
 *
 * Mercury.com / Ramp.com ilhamli minimal fintech tasarimi.
 * Sol dikey ozet paneli + sag icerik alani layout.
 * Timeline kart yapisi, donut grafik, drawer panel.
 * Auth gerektirmez.
 */

import { useState, useEffect, useRef } from 'react'

// ─── Para format yardimcisi ───
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

// ─── Tarih format ───
const tarihFormat = (d) =>
  new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })

const gunAdi = (d) => {
  const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
  return gunler[new Date(d).getDay()]
}

// ─── Mock veri ───
const HAREKETLER = [
  { id: 1, tarih: '2026-03-15', aciklama: 'Anadolu Demir-Çelik A.Ş. — Fatura #2041', tur: 'giris', tutar: 94500, kategori: 'Satış', cari: 'Anadolu Demir-Çelik' },
  { id: 2, tarih: '2026-03-14', aciklama: 'Personel Maaş Ödemeleri — Mart 2026', tur: 'cikis', tutar: 132000, kategori: 'Maaş', cari: 'Personel' },
  { id: 3, tarih: '2026-03-13', aciklama: 'Ege Hırdavat — Fatura #738', tur: 'giris', tutar: 27800, kategori: 'Satış', cari: 'Ege Hırdavat' },
  { id: 4, tarih: '2026-03-12', aciklama: 'Doğalgaz Faturası — Şubat 2026', tur: 'cikis', tutar: 6200, kategori: 'Fatura', cari: 'İGDAŞ' },
  { id: 5, tarih: '2026-03-11', aciklama: 'Karadeniz İnşaat — Proje Avansı #5', tur: 'giris', tutar: 175000, kategori: 'Avans', cari: 'Karadeniz İnşaat' },
  { id: 6, tarih: '2026-03-10', aciklama: 'Depo Kira Ödemesi — Mart 2026', tur: 'cikis', tutar: 38000, kategori: 'Kira', cari: 'Özcan Gayrimenkul' },
  { id: 7, tarih: '2026-03-09', aciklama: 'Güneş Metal San. — Fatura #1089', tur: 'giris', tutar: 58300, kategori: 'Satış', cari: 'Güneş Metal' },
  { id: 8, tarih: '2026-03-08', aciklama: 'Hammadde Alımı — HRP Sac 3mm', tur: 'cikis', tutar: 224000, kategori: 'Hammadde', cari: 'Erdemir' },
  { id: 9, tarih: '2026-03-07', aciklama: 'Boğaziçi Yapı Market — Fatura #456', tur: 'giris', tutar: 19600, kategori: 'Satış', cari: 'Boğaziçi Yapı' },
  { id: 10, tarih: '2026-03-06', aciklama: 'KDV Ödemesi — Şubat 2026', tur: 'cikis', tutar: 47500, kategori: 'Vergi', cari: 'Vergi Dairesi' },
  { id: 11, tarih: '2026-03-05', aciklama: 'Trakya Çelik — Fatura #2103', tur: 'giris', tutar: 41200, kategori: 'Satış', cari: 'Trakya Çelik' },
  { id: 12, tarih: '2026-03-04', aciklama: 'Sevkiyat Ödemesi — Nakliye #34', tur: 'cikis', tutar: 11800, kategori: 'Lojistik', cari: 'Aras Kargo' },
]

// ─── Kategori ikonlari ───
const KATEGORI_IKON = {
  'Satış': 'bi-receipt',
  'Maaş': 'bi-people',
  'Fatura': 'bi-lightning',
  'Kira': 'bi-building',
  'Avans': 'bi-cash-stack',
  'Hammadde': 'bi-box-seam',
  'Vergi': 'bi-bank',
  'Lojistik': 'bi-truck',
}

// ─── Animated Number Hook ───
function useAnimatedNumber(target, duration = 800) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const initial = val
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(initial + (target - initial) * eased)
      if (progress < 1) ref.current = requestAnimationFrame(step)
    }
    ref.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(ref.current)
  }, [target])
  return val
}

// ─── Donut Chart (SVG, kutuphane yok) ───
function DonutChart({ giris, cikis, size = 140 }) {
  const toplam = giris + cikis
  const girisYuzde = toplam > 0 ? (giris / toplam) * 100 : 50
  const cikisYuzde = toplam > 0 ? (cikis / toplam) * 100 : 50
  const strokeWidth = 18
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const girisLen = (girisYuzde / 100) * circumference
  const cikisLen = (cikisYuzde / 100) * circumference

  return (
    <div className="p1-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#ef4444" strokeWidth={strokeWidth}
          strokeDasharray={`${cikisLen} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#10b981" strokeWidth={strokeWidth}
          strokeDasharray={`${girisLen} ${circumference}`}
          strokeDashoffset={-cikisLen}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="p1-donut-center">
        <span className="p1-donut-label">Net</span>
        <span className={`p1-donut-value ${giris - cikis >= 0 ? 'p1-text-green' : 'p1-text-red'}`}>
          {TL(Math.abs(giris - cikis))}
        </span>
      </div>
    </div>
  )
}

// ─── Sparkline (mini SVG) ───
function Sparkline({ data, color = '#c2622d', width = 80, height = 28 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="p1-sparkline">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Palet1VolkanikDemo() {
  const [activeFilter, setActiveFilter] = useState('tumu')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedHareket, setSelectedHareket] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // ESC ile drawer kapat
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Body scroll lock
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  // Hesaplamalar
  const toplamGiris = HAREKETLER.filter(h => h.tur === 'giris').reduce((t, h) => t + h.tutar, 0)
  const toplamCikis = HAREKETLER.filter(h => h.tur === 'cikis').reduce((t, h) => t + h.tutar, 0)
  const netAkis = toplamGiris - toplamCikis
  const hareketSayisi = HAREKETLER.length

  // Animated numbers
  const animGiris = useAnimatedNumber(toplamGiris)
  const animCikis = useAnimatedNumber(toplamCikis)
  const animNet = useAnimatedNumber(netAkis)

  // Filtreleme
  const filtrelenmis = HAREKETLER.filter(h => {
    if (activeFilter === 'giris') return h.tur === 'giris'
    if (activeFilter === 'cikis') return h.tur === 'cikis'
    return true
  })

  // Tarihe gore grupla
  const gruplu = filtrelenmis.reduce((acc, h) => {
    if (!acc[h.tarih]) acc[h.tarih] = []
    acc[h.tarih].push(h)
    return acc
  }, {})
  const tarihler = Object.keys(gruplu).sort((a, b) => b.localeCompare(a))

  // Kategori dagilimi
  const kategoriDagilim = HAREKETLER.reduce((acc, h) => {
    if (!acc[h.kategori]) acc[h.kategori] = { giris: 0, cikis: 0 }
    if (h.tur === 'giris') acc[h.kategori].giris += h.tutar
    else acc[h.kategori].cikis += h.tutar
    return acc
  }, {})

  const openDrawer = (hareket) => {
    setSelectedHareket(hareket)
    setDrawerOpen(true)
  }

  return (
    <>
      <style>{CSS_CONTENT}</style>
      <div className={`p1-page ${mounted ? 'p1-mounted' : ''}`}>
        {/* Bakir gradient cizgi */}
        <div className="p1-top-line" />

        {/* Header */}
        <header className="p1-header">
          <div className="p1-header-inner">
            <div>
              <h1 className="p1-page-title">Palet 1 — Volkanik Obsidyen</h1>
              <p className="p1-page-subtitle">Mercury / Ramp ilhamlı minimal fintech</p>
            </div>
            <div className="p1-header-right">
              <span className="p1-date-badge">
                <i className="bi bi-calendar3" /> Mart 2026
              </span>
            </div>
          </div>
        </header>

        {/* Ana layout: Sol panel + Sag icerik */}
        <div className="p1-layout">

          {/* SOL DIKEY PANEL */}
          <aside className="p1-sidebar">
            <div className="p1-sidebar-inner">
              {/* KPI — Toplam Giris */}
              <div className="p1-kpi-block">
                <span className="p1-kpi-label">Toplam Giriş</span>
                <span className="p1-kpi-value p1-text-green">{TL(animGiris)}</span>
                <Sparkline data={[34, 52, 41, 67, 55, 72, 60]} color="#10b981" />
              </div>

              <div className="p1-kpi-divider" />

              {/* KPI — Toplam Cikis */}
              <div className="p1-kpi-block">
                <span className="p1-kpi-label">Toplam Çıkış</span>
                <span className="p1-kpi-value p1-text-red">{TL(animCikis)}</span>
                <Sparkline data={[28, 45, 62, 38, 51, 44, 57]} color="#ef4444" />
              </div>

              <div className="p1-kpi-divider" />

              {/* KPI — Net Akis */}
              <div className="p1-kpi-block">
                <span className="p1-kpi-label">Net Akış</span>
                <span className={`p1-kpi-value ${netAkis >= 0 ? 'p1-text-green' : 'p1-text-red'}`}>
                  {netAkis >= 0 ? '+' : '-'}{TL(Math.abs(animNet))}
                </span>
              </div>

              <div className="p1-kpi-divider" />

              {/* KPI — Hareket Sayisi */}
              <div className="p1-kpi-block">
                <span className="p1-kpi-label">Hareket Sayısı</span>
                <span className="p1-kpi-value p1-text-primary">{hareketSayisi}</span>
              </div>

              {/* Donut grafik */}
              <div className="p1-kpi-divider" />
              <div className="p1-donut-section">
                <span className="p1-kpi-label">Giriş / Çıkış Oranı</span>
                <DonutChart giris={toplamGiris} cikis={toplamCikis} size={130} />
                <div className="p1-donut-legend">
                  <span className="p1-legend-item">
                    <span className="p1-legend-dot p1-legend-green" /> Giriş
                  </span>
                  <span className="p1-legend-item">
                    <span className="p1-legend-dot p1-legend-red" /> Çıkış
                  </span>
                </div>
              </div>

              {/* Kategori mini dagilim */}
              <div className="p1-kpi-divider" />
              <div className="p1-cat-section">
                <span className="p1-kpi-label">Kategoriler</span>
                {Object.entries(kategoriDagilim).map(([kat, val]) => {
                  const toplam = val.giris + val.cikis
                  return (
                    <div key={kat} className="p1-cat-row">
                      <span className="p1-cat-name">
                        <i className={`bi ${KATEGORI_IKON[kat] || 'bi-tag'}`} /> {kat}
                      </span>
                      <span className="p1-cat-val">{TL(toplam)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* SAG ICERIK ALANI */}
          <main className="p1-main">
            {/* Filtreler */}
            <div className="p1-filters">
              <div className="p1-filter-group">
                {[
                  { key: 'tumu', label: 'Tümü', icon: 'bi-list-ul' },
                  { key: 'giris', label: 'Girişler', icon: 'bi-arrow-down-left' },
                  { key: 'cikis', label: 'Çıkışlar', icon: 'bi-arrow-up-right' },
                ].map(f => (
                  <button
                    key={f.key}
                    className={`p1-filter-btn ${activeFilter === f.key ? 'p1-filter-active' : ''}`}
                    onClick={() => setActiveFilter(f.key)}
                  >
                    <i className={`bi ${f.icon}`} /> {f.label}
                  </button>
                ))}
              </div>
              <span className="p1-result-count">{filtrelenmis.length} hareket</span>
            </div>

            {/* Timeline kartlari */}
            <div className="p1-timeline">
              {tarihler.map(tarih => (
                <div key={tarih} className="p1-timeline-group">
                  {/* Tarih basligi */}
                  <div className="p1-timeline-date">
                    <span className="p1-date-day">{new Date(tarih).getDate()}</span>
                    <div className="p1-date-meta">
                      <span className="p1-date-month">{new Date(tarih).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                      <span className="p1-date-weekday">{gunAdi(tarih)}</span>
                    </div>
                  </div>

                  {/* Hareketler */}
                  <div className="p1-timeline-items">
                    {gruplu[tarih].map((h, idx) => (
                      <button
                        key={h.id}
                        className="p1-timeline-card"
                        onClick={() => openDrawer(h)}
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <div className="p1-card-left">
                          <div className={`p1-card-icon ${h.tur === 'giris' ? 'p1-icon-green' : 'p1-icon-red'}`}>
                            <i className={`bi ${KATEGORI_IKON[h.kategori] || 'bi-tag'}`} />
                          </div>
                          <div className="p1-card-info">
                            <span className="p1-card-cari">{h.cari}</span>
                            <span className="p1-card-desc">{h.aciklama}</span>
                          </div>
                        </div>
                        <div className="p1-card-right">
                          <span className={`p1-card-amount ${h.tur === 'giris' ? 'p1-text-green' : 'p1-text-red'}`}>
                            {h.tur === 'giris' ? '+' : '-'}{TL(h.tutar)}
                          </span>
                          <span className="p1-card-badge">{h.kategori}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>

        {/* DRAWER PANEL — sagdan kayar */}
        {drawerOpen && (
          <div className="p1-drawer-overlay">
            <div className="p1-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="p1-drawer-header">
                <h2 className="p1-drawer-title">Hareket Detayı</h2>
                <button className="p1-drawer-close" onClick={() => setDrawerOpen(false)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              {selectedHareket && (
                <div className="p1-drawer-body">
                  {/* Tutar */}
                  <div className="p1-drawer-amount-section">
                    <span className={`p1-drawer-amount ${selectedHareket.tur === 'giris' ? 'p1-text-green' : 'p1-text-red'}`}>
                      {selectedHareket.tur === 'giris' ? '+' : '-'}{TL(selectedHareket.tutar)}
                    </span>
                    <span className={`p1-drawer-type-badge ${selectedHareket.tur === 'giris' ? 'p1-badge-green' : 'p1-badge-red'}`}>
                      <i className={`bi ${selectedHareket.tur === 'giris' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`} />
                      {selectedHareket.tur === 'giris' ? ' Giriş' : ' Çıkış'}
                    </span>
                  </div>

                  <div className="p1-drawer-divider" />

                  {/* Detay satirlari */}
                  <div className="p1-drawer-rows">
                    <div className="p1-drawer-row">
                      <span className="p1-drawer-label">Cari Hesap</span>
                      <span className="p1-drawer-val">{selectedHareket.cari}</span>
                    </div>
                    <div className="p1-drawer-row">
                      <span className="p1-drawer-label">Açıklama</span>
                      <span className="p1-drawer-val">{selectedHareket.aciklama}</span>
                    </div>
                    <div className="p1-drawer-row">
                      <span className="p1-drawer-label">Kategori</span>
                      <span className="p1-drawer-val">
                        <span className="p1-card-badge">{selectedHareket.kategori}</span>
                      </span>
                    </div>
                    <div className="p1-drawer-row">
                      <span className="p1-drawer-label">Tarih</span>
                      <span className="p1-drawer-val">{tarihFormat(selectedHareket.tarih)}</span>
                    </div>
                    <div className="p1-drawer-row">
                      <span className="p1-drawer-label">İşlem No</span>
                      <span className="p1-drawer-val">#{selectedHareket.id.toString().padStart(5, '0')}</span>
                    </div>
                  </div>

                  <div className="p1-drawer-divider" />

                  {/* Aksiyonlar */}
                  <div className="p1-drawer-actions">
                    <button className="p1-btn-ghost">
                      <i className="bi bi-pencil" /> Düzenle
                    </button>
                    <button className="p1-btn-ghost p1-btn-danger">
                      <i className="bi bi-trash3" /> Sil
                    </button>
                    <button className="p1-btn-ghost">
                      <i className="bi bi-printer" /> Yazdır
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}


// ─── CSS ───
const CSS_CONTENT = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* ─── Reset & Base ─── */
.p1-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
  background: #f4f2ef;
  color: #1a1a2e;
  min-height: 100vh;
  opacity: 0;
  transition: opacity 0.5s ease;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.p1-page.p1-mounted {
  opacity: 1;
}

/* ─── Bakir gradient ust cizgi ─── */
.p1-top-line {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #c2622d 0%, #e8a849 40%, #c2622d 70%, #a84f1f 100%);
  z-index: 1000;
}

/* ─── Header ─── */
.p1-header {
  padding: 28px 40px 20px;
  border-bottom: 1px solid #ddd8d0;
  background: #ffffff;
}
.p1-header-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.p1-page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 2px 0;
  letter-spacing: -0.02em;
}
.p1-page-subtitle {
  font-size: 13px;
  color: #8a8278;
  margin: 0;
  font-weight: 400;
}
.p1-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.p1-date-badge {
  font-size: 13px;
  color: #8a8278;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #fdf0e6;
  border-radius: 8px;
  border: 1px solid #ddd8d0;
  font-weight: 500;
}

/* ─── Layout: Sol panel + Sag icerik ─── */
.p1-layout {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 0;
  min-height: calc(100vh - 90px);
}

/* ─── Sol Sidebar ─── */
.p1-sidebar {
  width: 280px;
  min-width: 280px;
  border-right: 1px solid #ddd8d0;
  background: #ffffff;
}
.p1-sidebar-inner {
  position: sticky;
  top: 2px;
  padding: 28px 24px;
  max-height: calc(100vh - 92px);
  overflow-y: auto;
}
.p1-sidebar-inner::-webkit-scrollbar {
  width: 3px;
}
.p1-sidebar-inner::-webkit-scrollbar-thumb {
  background: #ddd8d0;
  border-radius: 3px;
}

/* ─── KPI Bloklari ─── */
.p1-kpi-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.p1-kpi-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #a8a098;
  margin-bottom: 2px;
}
.p1-kpi-value {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.p1-kpi-divider {
  height: 1px;
  background: #ddd8d0;
  margin: 16px 0;
}

/* ─── Renk yardimlari ─── */
.p1-text-green { color: #10b981; }
.p1-text-red { color: #ef4444; }
.p1-text-primary { color: #c2622d; }

/* ─── Sparkline ─── */
.p1-sparkline {
  display: block;
  margin-top: 4px;
}

/* ─── Donut ─── */
.p1-donut-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.p1-donut-section .p1-kpi-label {
  align-self: flex-start;
}
.p1-donut-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.p1-donut-center {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
.p1-donut-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #a8a098;
  font-weight: 500;
}
.p1-donut-value {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.p1-donut-legend {
  display: flex;
  gap: 16px;
}
.p1-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #8a8278;
  font-weight: 500;
}
.p1-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.p1-legend-green { background: #10b981; }
.p1-legend-red { background: #ef4444; }

/* ─── Kategori satirlari ─── */
.p1-cat-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.p1-cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.p1-cat-name {
  font-size: 12px;
  color: #1a1a2e;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.p1-cat-name i {
  color: #c2622d;
  font-size: 12px;
}
.p1-cat-val {
  font-size: 12px;
  color: #8a8278;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* ─── Sag Ana Icerik ─── */
.p1-main {
  flex: 1;
  padding: 28px 32px;
  min-width: 0;
}

/* ─── Filtreler ─── */
.p1-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 12px;
}
.p1-filter-group {
  display: flex;
  gap: 4px;
  background: #ffffff;
  border: 1px solid #ddd8d0;
  border-radius: 10px;
  padding: 3px;
}
.p1-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  min-height: 44px;
  font-size: 13px;
  font-weight: 500;
  color: #8a8278;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-feature-settings: inherit;
  position: relative;
}
.p1-filter-btn:hover {
  color: #1a1a2e;
}
.p1-filter-btn.p1-filter-active {
  background: #1a1a2e;
  color: #ffffff;
}
.p1-result-count {
  font-size: 12px;
  color: #a8a098;
  font-weight: 500;
}

/* ─── Timeline ─── */
.p1-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.p1-timeline-group {
  display: flex;
  gap: 24px;
  padding-bottom: 8px;
}

/* Tarih kolonu */
.p1-timeline-date {
  width: 64px;
  min-width: 64px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding-top: 16px;
}
.p1-date-day {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.03em;
  line-height: 1;
}
.p1-date-meta {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: 2px;
}
.p1-date-month {
  font-size: 11px;
  font-weight: 600;
  color: #8a8278;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.3;
}
.p1-date-weekday {
  font-size: 10px;
  color: #a8a098;
  font-weight: 400;
}

/* Hareket kartlari */
.p1-timeline-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-left: 1px solid #ddd8d0;
  padding-left: 24px;
  padding-bottom: 20px;
  min-width: 0;
}
.p1-timeline-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: #ffffff;
  border: 1px solid #ddd8d0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  width: 100%;
  text-align: left;
  font-family: inherit;
  font-feature-settings: inherit;
  animation: p1-fadeSlide 0.4s ease both;
}
.p1-timeline-card:hover {
  border-color: #c8c0b6;
  box-shadow: 0 2px 8px rgba(26, 26, 46, 0.05);
  transform: translateX(2px);
}

@keyframes p1-fadeSlide {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.p1-card-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}
.p1-card-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}
.p1-icon-green {
  background: #ecfdf5;
  color: #10b981;
}
.p1-icon-red {
  background: #fef2f2;
  color: #ef4444;
}
.p1-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.p1-card-cari {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.p1-card-desc {
  font-size: 12px;
  color: #8a8278;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.p1-card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.p1-card-amount {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.p1-card-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: #fdefd0;
  border: 1px solid #e8a849;
  color: #c2622d;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ─── Drawer Panel ─── */
.p1-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 46, 0.3);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
  animation: p1-overlayIn 0.25s ease;
}
@keyframes p1-overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.p1-drawer {
  width: 420px;
  max-width: 90vw;
  height: 100vh;
  background: #ffffff;
  box-shadow: -8px 0 30px rgba(26, 26, 46, 0.12);
  display: flex;
  flex-direction: column;
  animation: p1-drawerSlide 0.3s ease;
  overflow-y: auto;
}
@keyframes p1-drawerSlide {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.p1-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #ddd8d0;
  flex-shrink: 0;
}
.p1-drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}
.p1-drawer-close {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #8a8278;
  font-size: 18px;
  border-radius: 10px;
  transition: all 0.2s ease;
  font-family: inherit;
}
.p1-drawer-close:hover {
  background: #f4f2ef;
  color: #1a1a2e;
}
.p1-drawer-body {
  padding: 24px;
  flex: 1;
}
.p1-drawer-amount-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 0;
}
.p1-drawer-amount {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.p1-drawer-type-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.p1-badge-green {
  background: #ecfdf5;
  color: #10b981;
}
.p1-badge-red {
  background: #fef2f2;
  color: #ef4444;
}
.p1-drawer-divider {
  height: 1px;
  background: #ddd8d0;
  margin: 16px 0;
}
.p1-drawer-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.p1-drawer-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.p1-drawer-label {
  font-size: 13px;
  color: #a8a098;
  font-weight: 500;
  flex-shrink: 0;
}
.p1-drawer-val {
  font-size: 13px;
  color: #1a1a2e;
  font-weight: 500;
  text-align: right;
}

/* ─── Ghost Butonlar ─── */
.p1-drawer-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.p1-btn-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  min-height: 44px;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a2e;
  background: none;
  border: 1px solid #ddd8d0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-feature-settings: inherit;
  position: relative;
  overflow: hidden;
}
.p1-btn-ghost::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #c2622d, #e8a849);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}
.p1-btn-ghost:hover {
  border-color: #c8c0b6;
  color: #c2622d;
}
.p1-btn-ghost:hover::after {
  width: 70%;
}
.p1-btn-ghost.p1-btn-danger:hover {
  color: #ef4444;
  border-color: #fecaca;
}
.p1-btn-ghost.p1-btn-danger::after {
  background: #ef4444;
}
.p1-btn-ghost:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(194, 98, 45, 0.25);
}

/* ─── Focus Ring global ─── */
.p1-filter-btn:focus-visible,
.p1-timeline-card:focus-visible,
.p1-drawer-close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(194, 98, 45, 0.25);
}

/* ─── Responsive: Tablet 992px ─── */
@media (max-width: 992px) {
  .p1-layout {
    flex-direction: column;
  }
  .p1-sidebar {
    width: 100%;
    min-width: 100%;
    border-right: none;
    border-bottom: 1px solid #ddd8d0;
  }
  .p1-sidebar-inner {
    position: static;
    max-height: none;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 20px 24px;
  }
  .p1-kpi-divider {
    display: none;
  }
  .p1-donut-section,
  .p1-cat-section {
    grid-column: span 2;
  }
  .p1-donut-section {
    align-items: flex-start;
  }
  .p1-main {
    padding: 20px 24px;
  }
  .p1-header {
    padding: 20px 24px 16px;
  }
}

/* ─── Responsive: Mobil 768px ─── */
@media (max-width: 768px) {
  .p1-sidebar-inner {
    grid-template-columns: repeat(2, 1fr);
  }
  .p1-donut-section,
  .p1-cat-section {
    grid-column: span 2;
  }
  .p1-timeline-group {
    flex-direction: column;
    gap: 8px;
  }
  .p1-timeline-date {
    width: auto;
    min-width: auto;
    padding-top: 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #ddd8d0;
    margin-bottom: 4px;
  }
  .p1-timeline-items {
    border-left: none;
    padding-left: 0;
  }
  .p1-card-desc {
    display: none;
  }
  .p1-drawer {
    width: 100vw;
    max-width: 100vw;
  }
  .p1-header-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .p1-filter-group {
    flex-wrap: wrap;
  }
  .p1-filters {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ─── Responsive: Kucuk Mobil 480px ─── */
@media (max-width: 480px) {
  .p1-sidebar-inner {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 16px;
  }
  .p1-kpi-value {
    font-size: 18px;
  }
  .p1-main {
    padding: 16px;
  }
  .p1-header {
    padding: 16px;
  }
  .p1-page-title {
    font-size: 17px;
  }
  .p1-timeline-card {
    padding: 12px 14px;
    flex-wrap: wrap;
  }
  .p1-card-left {
    gap: 10px;
  }
  .p1-card-icon {
    width: 32px;
    height: 32px;
    min-width: 32px;
    font-size: 13px;
  }
  .p1-card-cari {
    font-size: 13px;
  }
  .p1-card-amount {
    font-size: 14px;
  }
  .p1-drawer-amount {
    font-size: 26px;
  }
  .p1-drawer-body {
    padding: 16px;
  }
  .p1-donut-section {
    grid-column: span 2;
  }
  .p1-cat-section {
    grid-column: span 2;
  }
}
`
