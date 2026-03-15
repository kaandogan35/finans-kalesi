/**
 * Palet 4 — Col Firtinasi (Desert Storm)
 *
 * Stripe / Notion ilhamli data-rich fintech dashboard.
 * Dashboard grid layout: 2 kolon ust (KPI + grafik), tam genislik alt (tablo).
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

// ─── Mock veri — 12 adet (6 giris, 6 cikis) ───
const HAREKETLER = [
  { id: 1,  tarih: '2026-03-15', aciklama: 'Karadeniz Celik San. — Fatura #2041',  tur: 'giris', tutar: 94200,  kategori: 'Satis',     cari: 'Karadeniz Celik' },
  { id: 2,  tarih: '2026-03-14', aciklama: 'Personel Maas Odemeleri — Mart 2026',   tur: 'cikis', tutar: 138500, kategori: 'Maas',      cari: 'Personel' },
  { id: 3,  tarih: '2026-03-14', aciklama: 'Anadolu Hirdavat — Fatura #775',        tur: 'giris', tutar: 27800,  kategori: 'Satis',     cari: 'Anadolu Hirdavat' },
  { id: 4,  tarih: '2026-03-13', aciklama: 'Dogalgaz Faturasi — Subat 2026',        tur: 'cikis', tutar: 6200,   kategori: 'Fatura',    cari: 'IGDAS' },
  { id: 5,  tarih: '2026-03-12', aciklama: 'Marmara Insaat — Proje Avans #5',       tur: 'giris', tutar: 175000, kategori: 'Avans',     cari: 'Marmara Insaat' },
  { id: 6,  tarih: '2026-03-12', aciklama: 'Depo Kira Odemesi — Mart 2026',         tur: 'cikis', tutar: 42000,  kategori: 'Kira',      cari: 'Emlak Yatirim A.S.' },
  { id: 7,  tarih: '2026-03-11', aciklama: 'Ege Demir Ticaret — Fatura #319',       tur: 'giris', tutar: 53600,  kategori: 'Satis',     cari: 'Ege Demir' },
  { id: 8,  tarih: '2026-03-10', aciklama: 'Hammadde Alimi — Paslanmaz Sac 2mm',    tur: 'cikis', tutar: 225000, kategori: 'Hammadde',  cari: 'Kardemir' },
  { id: 9,  tarih: '2026-03-10', aciklama: 'Guney Yapi Market — Fatura #1560',      tur: 'giris', tutar: 19400,  kategori: 'Satis',     cari: 'Guney Yapi' },
  { id: 10, tarih: '2026-03-09', aciklama: 'KDV Odemesi — Subat 2026',              tur: 'cikis', tutar: 48700,  kategori: 'Vergi',     cari: 'Vergi Dairesi' },
  { id: 11, tarih: '2026-03-09', aciklama: 'Bogazici Metal — Fatura #888',          tur: 'giris', tutar: 41300,  kategori: 'Satis',     cari: 'Bogazici Metal' },
  { id: 12, tarih: '2026-03-08', aciklama: 'Sevkiyat Odemesi — Nakliye #112',       tur: 'cikis', tutar: 11500,  kategori: 'Lojistik',  cari: 'Horoz Lojistik' },
]

// ─── Haftalik mock veri (7 gun) ───
const HAFTALIK = [
  { gun: 'Pzt', giris: 41300,  cikis: 11500 },
  { gun: 'Sal', giris: 19400,  cikis: 273700 },
  { gun: 'Car', giris: 53600,  cikis: 0 },
  { gun: 'Per', giris: 175000, cikis: 48200 },
  { gun: 'Cum', giris: 27800,  cikis: 138500 },
  { gun: 'Cmt', giris: 94200,  cikis: 0 },
  { gun: 'Paz', giris: 0,      cikis: 0 },
]

// ─── Kategori renkleri ───
const KAT_RENK = {
  'Satis':     '#10b981',
  'Maas':      '#ef4444',
  'Fatura':    '#f59e0b',
  'Kira':      '#8b5cf6',
  'Hammadde':  '#3b82f6',
  'Vergi':     '#ec4899',
  'Lojistik':  '#6366f1',
  'Avans':     '#14b8a6',
}

// ─── Animated Number Hook ───
function useAnimatedNumber(target, duration = 900) {
  const [val, setVal] = useState(0)
  const rafRef = useRef(null)
  const prevRef = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const initial = prevRef.current
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = initial + (target - initial) * eased
      setVal(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        prevRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return val
}

// ─── Bilesen ───
export default function Palet4ColDemo() {
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('tumu')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState('tarih')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedRows, setSelectedRows] = useState([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // ESC ile modal kapat
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowModal(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  // Hesaplamalar
  const toplamGiris = HAREKETLER.filter(h => h.tur === 'giris').reduce((t, h) => t + h.tutar, 0)
  const toplamCikis = HAREKETLER.filter(h => h.tur === 'cikis').reduce((t, h) => t + h.tutar, 0)
  const netAkis = toplamGiris - toplamCikis
  const kasaBakiye = 523750

  // Animated
  const animGiris = useAnimatedNumber(toplamGiris)
  const animCikis = useAnimatedNumber(toplamCikis)
  const animNet = useAnimatedNumber(netAkis)
  const animBakiye = useAnimatedNumber(kasaBakiye)

  // Filtre + siralama
  const filteredHareketler = HAREKETLER
    .filter(h => {
      if (activeTab === 'giris') return h.tur === 'giris'
      if (activeTab === 'cikis') return h.tur === 'cikis'
      return true
    })
    .filter(h => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return h.aciklama.toLowerCase().includes(q) ||
             h.cari.toLowerCase().includes(q) ||
             h.kategori.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortField === 'tarih') cmp = a.tarih.localeCompare(b.tarih)
      else if (sortField === 'tutar') cmp = a.tutar - b.tutar
      else if (sortField === 'kategori') cmp = a.kategori.localeCompare(b.kategori)
      else if (sortField === 'cari') cmp = a.cari.localeCompare(b.cari)
      return sortDir === 'desc' ? -cmp : cmp
    })

  // Haftalik grafik max degeri
  const haftalikMax = Math.max(...HAFTALIK.map(h => h.giris + h.cikis), 1)

  // Checkbox toggle
  const toggleRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }
  const toggleAll = () => {
    if (selectedRows.length === filteredHareketler.length) setSelectedRows([])
    else setSelectedRows(filteredHareketler.map(h => h.id))
  }

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const sortIcon = (field) => {
    if (sortField !== field) return 'bi-arrow-down-up'
    return sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down'
  }

  // KPI verileri
  const kpiItems = [
    {
      label: 'Toplam Giris',
      value: animGiris,
      color: '#10b981',
      icon: 'bi-arrow-down-left-circle',
      trend: '+12.4%',
      trendUp: true,
    },
    {
      label: 'Toplam Cikis',
      value: animCikis,
      color: '#ef4444',
      icon: 'bi-arrow-up-right-circle',
      trend: '+8.1%',
      trendUp: false,
    },
    {
      label: 'Net Akis',
      value: animNet,
      color: netAkis >= 0 ? '#10b981' : '#ef4444',
      icon: 'bi-graph-up-arrow',
      trend: netAkis >= 0 ? 'Pozitif' : 'Negatif',
      trendUp: netAkis >= 0,
    },
    {
      label: 'Kasa Bakiye',
      value: animBakiye,
      color: '#c45a3c',
      icon: 'bi-safe',
      trend: 'Guncel',
      trendUp: true,
    },
  ]

  return (
    <>
      <style>{CSS_CONTENT}</style>
      <div className={`p4-page ${mounted ? 'p4-mounted' : ''}`}>
        {/* ─── Header ─── */}
        <header className="p4-header">
          <div className="p4-header-left">
            <div className="p4-logo">
              <i className="bi bi-shield-fill"></i>
            </div>
            <div>
              <h1 className="p4-title">Palet 4 — Col Firtinasi</h1>
              <p className="p4-subtitle">Stripe / Notion ilhamli data-rich fintech</p>
            </div>
          </div>
          <div className="p4-header-right">
            <button
              className="p4-btn p4-btn-primary"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-plus-lg"></i>
              Yeni Hareket
            </button>
          </div>
        </header>

        {/* ─── Dashboard Grid ─── */}
        <div className="p4-dashboard-grid">
          {/* ─── Sol: KPI Kartlari ─── */}
          <div className="p4-kpi-section">
            {kpiItems.map((kpi, i) => (
              <div
                key={i}
                className="p4-kpi-card"
                style={{ '--kpi-color': kpi.color, animationDelay: `${i * 80}ms` }}
              >
                <div className="p4-kpi-top">
                  <span className="p4-kpi-label">{kpi.label}</span>
                  <i className={`bi ${kpi.icon} p4-kpi-icon`}></i>
                </div>
                <div className="p4-kpi-value">
                  {TL(Math.round(kpi.value))}
                  <span className="p4-kpi-currency"> TL</span>
                </div>
                <div className="p4-kpi-footer">
                  <span className={`p4-kpi-trend ${kpi.trendUp ? 'p4-trend-up' : 'p4-trend-down'}`}>
                    <i className={`bi ${kpi.trendUp ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}`}></i>
                    {kpi.trend}
                  </span>
                  <span className="p4-kpi-period">Bu ay</span>
                </div>
                {/* Mini trend cizgisi */}
                <div className="p4-kpi-sparkline">
                  <div className="p4-sparkline-line" style={{ '--spark-color': kpi.color }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Sag: Haftalik Akis Grafigi ─── */}
          <div className="p4-chart-section">
            <div className="p4-chart-card">
              <div className="p4-chart-header">
                <h3 className="p4-chart-title">
                  <i className="bi bi-bar-chart-fill"></i>
                  Haftalik Nakit Akisi
                </h3>
                <span className="p4-chart-badge">Bu Hafta</span>
              </div>
              <div className="p4-chart-body">
                <div className="p4-bar-chart">
                  {HAFTALIK.map((h, i) => {
                    const girisH = haftalikMax > 0 ? (h.giris / haftalikMax) * 100 : 0
                    const cikisH = haftalikMax > 0 ? (h.cikis / haftalikMax) * 100 : 0
                    return (
                      <div key={i} className="p4-bar-col">
                        <div className="p4-bar-stack" title={`Giris: ${TL(h.giris)} / Cikis: ${TL(h.cikis)}`}>
                          <div className="p4-bar p4-bar-cikis" style={{ height: `${cikisH}%` }}></div>
                          <div className="p4-bar p4-bar-giris" style={{ height: `${girisH}%` }}></div>
                        </div>
                        <span className="p4-bar-label">{h.gun}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="p4-chart-legend">
                  <span className="p4-legend-item">
                    <span className="p4-legend-dot p4-legend-giris"></span> Giris
                  </span>
                  <span className="p4-legend-item">
                    <span className="p4-legend-dot p4-legend-cikis"></span> Cikis
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tablo Bolumu (tam genislik) ─── */}
        <div className="p4-table-section">
          <div className="p4-table-card">
            {/* Tablo Header */}
            <div className="p4-table-toolbar">
              <div className="p4-table-toolbar-left">
                <h3 className="p4-table-title">
                  <i className="bi bi-list-ul"></i>
                  Nakit Hareketleri
                </h3>
                <div className="p4-tab-group">
                  {[
                    { key: 'tumu', label: 'Tumu', icon: 'bi-grid-3x3-gap' },
                    { key: 'giris', label: 'Girisler', icon: 'bi-arrow-down-left' },
                    { key: 'cikis', label: 'Cikislar', icon: 'bi-arrow-up-right' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      className={`p4-tab ${activeTab === tab.key ? 'p4-tab-active' : ''}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <i className={`bi ${tab.icon}`}></i>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p4-table-toolbar-right">
                <div className="p4-search-box">
                  <i className="bi bi-search p4-search-icon"></i>
                  <input
                    type="text"
                    className="p4-search-input"
                    placeholder="Ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="p4-search-clear" onClick={() => setSearchQuery('')}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
                {selectedRows.length > 0 && (
                  <span className="p4-selected-count">
                    {selectedRows.length} secili
                  </span>
                )}
              </div>
            </div>

            {/* Tablo */}
            <div className="table-responsive">
              <table className="p4-table">
                <thead>
                  <tr>
                    <th className="p4-th-check">
                      <label className="p4-checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={selectedRows.length === filteredHareketler.length && filteredHareketler.length > 0}
                          onChange={toggleAll}
                        />
                        <span className="p4-checkbox-visual"></span>
                      </label>
                    </th>
                    <th className="p4-th-sortable" onClick={() => handleSort('tarih')}>
                      Tarih <i className={`bi ${sortIcon('tarih')} p4-sort-icon`}></i>
                    </th>
                    <th>Aciklama</th>
                    <th className="p4-th-sortable" onClick={() => handleSort('cari')}>
                      Cari <i className={`bi ${sortIcon('cari')} p4-sort-icon`}></i>
                    </th>
                    <th className="p4-th-sortable" onClick={() => handleSort('kategori')}>
                      Kategori <i className={`bi ${sortIcon('kategori')} p4-sort-icon`}></i>
                    </th>
                    <th className="p4-th-sortable p4-th-right" onClick={() => handleSort('tutar')}>
                      Tutar <i className={`bi ${sortIcon('tutar')} p4-sort-icon`}></i>
                    </th>
                    <th className="p4-th-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHareketler.map((h, i) => (
                    <tr
                      key={h.id}
                      className={`p4-tr ${selectedRows.includes(h.id) ? 'p4-tr-selected' : ''} ${i % 2 === 0 ? 'p4-tr-even' : ''}`}
                    >
                      <td className="p4-td-check">
                        <label className="p4-checkbox-wrap">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(h.id)}
                            onChange={() => toggleRow(h.id)}
                          />
                          <span className="p4-checkbox-visual"></span>
                        </label>
                      </td>
                      <td className="p4-td-tarih">
                        <span className="p4-date-text">{tarihFormat(h.tarih)}</span>
                      </td>
                      <td className="p4-td-aciklama">
                        <span className="p4-aciklama-text">{h.aciklama}</span>
                      </td>
                      <td className="p4-td-cari">{h.cari}</td>
                      <td>
                        <span
                          className="p4-kategori-badge"
                          style={{
                            '--kat-color': KAT_RENK[h.kategori] || '#8c8070',
                          }}
                        >
                          {h.kategori}
                        </span>
                      </td>
                      <td className="p4-td-tutar">
                        <span className={h.tur === 'giris' ? 'p4-tutar-giris' : 'p4-tutar-cikis'}>
                          {h.tur === 'giris' ? '+' : '-'}{TL(h.tutar)} TL
                        </span>
                      </td>
                      <td className="p4-td-actions">
                        <div className="p4-row-actions">
                          <button className="p4-action-btn" title="Duzenle">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="p4-action-btn p4-action-delete" title="Sil">
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablo Footer */}
            <div className="p4-table-footer">
              <span className="p4-table-count">
                {filteredHareketler.length} kayit gosteriliyor
              </span>
              <div className="p4-table-summary">
                <span className="p4-summary-giris">
                  <i className="bi bi-arrow-down-left"></i>
                  {TL(filteredHareketler.filter(h => h.tur === 'giris').reduce((t, h) => t + h.tutar, 0))} TL
                </span>
                <span className="p4-summary-cikis">
                  <i className="bi bi-arrow-up-right"></i>
                  {TL(filteredHareketler.filter(h => h.tur === 'cikis').reduce((t, h) => t + h.tutar, 0))} TL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Sheet Modal (iOS tarzi) ─── */}
        {showModal && (
          <div className="p4-modal-overlay">
            <div className="p4-modal-sheet">
              <div className="p4-sheet-handle"></div>
              <div className="p4-sheet-header">
                <h2 className="p4-sheet-title">Yeni Nakit Hareketi</h2>
                <button className="p4-sheet-close" onClick={() => setShowModal(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="p4-sheet-body">
                <div className="p4-form-grid">
                  <div className="p4-form-group p4-form-full">
                    <label className="p4-form-label">Islem Tipi</label>
                    <div className="p4-type-toggle">
                      <button className="p4-type-btn p4-type-giris p4-type-active">
                        <i className="bi bi-arrow-down-left"></i> Giris
                      </button>
                      <button className="p4-type-btn p4-type-cikis">
                        <i className="bi bi-arrow-up-right"></i> Cikis
                      </button>
                    </div>
                  </div>
                  <div className="p4-form-group">
                    <label className="p4-form-label">Tutar (TL)</label>
                    <input type="text" className="p4-form-input" placeholder="0,00" />
                  </div>
                  <div className="p4-form-group">
                    <label className="p4-form-label">Tarih</label>
                    <input type="date" className="p4-form-input" defaultValue="2026-03-15" />
                  </div>
                  <div className="p4-form-group">
                    <label className="p4-form-label">Cari Hesap</label>
                    <input type="text" className="p4-form-input" placeholder="Cari adi..." />
                  </div>
                  <div className="p4-form-group">
                    <label className="p4-form-label">Kategori</label>
                    <select className="p4-form-input">
                      <option value="">Secin...</option>
                      <option>Satis</option>
                      <option>Maas</option>
                      <option>Fatura</option>
                      <option>Kira</option>
                      <option>Hammadde</option>
                      <option>Vergi</option>
                      <option>Lojistik</option>
                      <option>Avans</option>
                    </select>
                  </div>
                  <div className="p4-form-group p4-form-full">
                    <label className="p4-form-label">Aciklama</label>
                    <textarea className="p4-form-input p4-form-textarea" rows="3" placeholder="Detay yazin..."></textarea>
                  </div>
                </div>
              </div>
              <div className="p4-sheet-footer">
                <button className="p4-btn p4-btn-ghost" onClick={() => setShowModal(false)}>
                  Iptal
                </button>
                <button className="p4-btn p4-btn-primary" onClick={() => setShowModal(false)}>
                  <i className="bi bi-check-lg"></i>
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── CSS ───
const CSS_CONTENT = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ─── Reset & Base ─── */
.p4-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
  background: #f6f3ed;
  color: #201a12;
  min-height: 100vh;
  padding: 32px;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.p4-page.p4-mounted {
  opacity: 1;
  transform: translateY(0);
}
.p4-page *, .p4-page *::before, .p4-page *::after {
  box-sizing: border-box;
}

/* ─── Header ─── */
.p4-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}
.p4-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.p4-logo {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #c45a3c, #a8462b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(196, 90, 60, 0.3);
  flex-shrink: 0;
}
.p4-title {
  font-size: 22px;
  font-weight: 800;
  color: #1e1710;
  margin: 0;
  letter-spacing: -0.5px;
}
.p4-subtitle {
  font-size: 13px;
  color: #8c8070;
  margin: 2px 0 0 0;
  font-weight: 500;
}
.p4-header-right {
  display: flex;
  gap: 10px;
}

/* ─── Buttons ─── */
.p4-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  min-height: 44px;
}
.p4-btn-primary {
  background: linear-gradient(135deg, #c45a3c 0%, #a8462b 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(196, 90, 60, 0.25);
}
.p4-btn-primary:hover {
  box-shadow: 0 6px 20px rgba(196, 90, 60, 0.4);
  transform: translateY(-1px);
}
.p4-btn-primary:active {
  transform: translateY(0);
}
.p4-btn-primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(196, 90, 60, 0.25);
}
.p4-btn-ghost {
  background: transparent;
  color: #8c8070;
  border: 1px solid #ddd5c8;
}
.p4-btn-ghost:hover {
  background: #fef4f0;
  color: #c45a3c;
  border-color: #c45a3c;
}

/* ─── Dashboard Grid (2 kolon ust) ─── */
.p4-dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

/* ─── KPI Section ─── */
.p4-kpi-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.p4-kpi-card {
  background: #ffffff;
  border: 1px solid #ddd5c8;
  border-left: 4px solid var(--kpi-color);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease;
  animation: p4-fadeInUp 0.5s ease both;
}
.p4-kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    repeating-conic-gradient(
      rgba(196, 90, 60, 0.015) 0% 25%,
      transparent 0% 50%
    ) 0 0 / 20px 20px;
  pointer-events: none;
  z-index: 0;
}
.p4-kpi-card:hover {
  border-color: var(--kpi-color);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}
.p4-kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}
.p4-kpi-label {
  font-size: 12px;
  font-weight: 600;
  color: #8c8070;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.p4-kpi-icon {
  font-size: 18px;
  color: var(--kpi-color);
  opacity: 0.7;
}
.p4-kpi-value {
  font-size: 26px;
  font-weight: 800;
  color: #1e1710;
  letter-spacing: -0.5px;
  position: relative;
  z-index: 1;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.p4-kpi-currency {
  font-size: 14px;
  font-weight: 600;
  color: #a89e90;
}
.p4-kpi-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  position: relative;
  z-index: 1;
}
.p4-kpi-trend {
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 6px;
}
.p4-trend-up {
  color: #10b981;
  background: #ecfdf5;
}
.p4-trend-down {
  color: #ef4444;
  background: #fef2f2;
}
.p4-kpi-period {
  font-size: 11px;
  color: #a89e90;
  font-weight: 500;
}
.p4-kpi-sparkline {
  position: absolute;
  bottom: 0;
  left: 4px;
  right: 0;
  height: 24px;
  overflow: hidden;
  z-index: 0;
}
.p4-sparkline-line {
  position: absolute;
  bottom: 4px;
  left: 8px;
  right: 8px;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--spark-color) 15%,
    var(--spark-color) 20%,
    transparent 22%,
    transparent 28%,
    var(--spark-color) 30%,
    var(--spark-color) 40%,
    transparent 42%,
    transparent 48%,
    var(--spark-color) 50%,
    var(--spark-color) 55%,
    transparent 57%,
    transparent 63%,
    var(--spark-color) 65%,
    var(--spark-color) 75%,
    transparent 77%,
    transparent 83%,
    var(--spark-color) 85%,
    var(--spark-color) 90%,
    transparent 100%
  );
  opacity: 0.3;
  border-radius: 1px;
}

/* ─── Chart Section ─── */
.p4-chart-section {
  display: flex;
  flex-direction: column;
}
.p4-chart-card {
  background: #ffffff;
  border: 1px solid #ddd5c8;
  border-radius: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: p4-fadeInUp 0.5s ease 0.2s both;
}
.p4-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0 24px;
}
.p4-chart-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e1710;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.p4-chart-title i {
  color: #c45a3c;
  font-size: 16px;
}
.p4-chart-badge {
  font-size: 11px;
  font-weight: 600;
  color: #2a8f8f;
  background: #ccfbf1;
  border: 1px solid #2a8f8f;
  padding: 3px 10px;
  border-radius: 20px;
}
.p4-chart-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px 16px;
}
.p4-bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex: 1;
  min-height: 180px;
}
.p4-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
}
.p4-bar-stack {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  cursor: pointer;
  position: relative;
}
.p4-bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  min-height: 0;
}
.p4-bar-giris {
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
}
.p4-bar-cikis {
  background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
  border-radius: 0;
}
.p4-bar-stack:hover .p4-bar {
  opacity: 0.85;
  transform: scaleY(1.02);
}
.p4-bar-label {
  font-size: 11px;
  font-weight: 600;
  color: #8c8070;
}
.p4-chart-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f6f3ed;
}
.p4-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #8c8070;
}
.p4-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}
.p4-legend-giris {
  background: #10b981;
}
.p4-legend-cikis {
  background: #ef4444;
}

/* ─── Table Section ─── */
.p4-table-section {
  animation: p4-fadeInUp 0.5s ease 0.35s both;
}
.p4-table-card {
  background: #ffffff;
  border: 1px solid #ddd5c8;
  border-radius: 12px;
  overflow: hidden;
}

/* ─── Table Toolbar ─── */
.p4-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f6f3ed;
  flex-wrap: wrap;
  gap: 12px;
}
.p4-table-toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.p4-table-toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.p4-table-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e1710;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.p4-table-title i {
  color: #c45a3c;
}

/* ─── Tabs ─── */
.p4-tab-group {
  display: flex;
  gap: 4px;
  background: #f6f3ed;
  padding: 3px;
  border-radius: 8px;
}
.p4-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  background: transparent;
  color: #8c8070;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}
.p4-tab:hover {
  color: #1e1710;
}
.p4-tab-active {
  background: #ffffff;
  color: #c45a3c;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

/* ─── Search ─── */
.p4-search-box {
  position: relative;
  display: flex;
  align-items: center;
}
.p4-search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  color: #a89e90;
  pointer-events: none;
}
.p4-search-input {
  padding: 8px 36px 8px 36px;
  border: 1px solid #ddd5c8;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: #201a12;
  background: #fff;
  width: 200px;
  transition: all 0.2s ease;
  min-height: 44px;
  box-sizing: border-box;
}
.p4-search-input::placeholder {
  color: #a89e90;
}
.p4-search-input:focus {
  outline: none;
  border-color: #c45a3c;
  box-shadow: 0 0 0 3px rgba(196, 90, 60, 0.25);
}
.p4-search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #a89e90;
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
  display: flex;
  align-items: center;
  min-height: 44px;
  min-width: 44px;
  justify-content: center;
}
.p4-search-clear:hover {
  color: #ef4444;
}
.p4-selected-count {
  font-size: 12px;
  font-weight: 600;
  color: #c45a3c;
  background: #fef4f0;
  padding: 4px 12px;
  border-radius: 6px;
}

/* ─── Notion-style Table ─── */
.p4-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.p4-table thead {
  background: #faf8f4;
}
.p4-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: #8c8070;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #ddd5c8;
  white-space: nowrap;
  user-select: none;
}
.p4-th-sortable {
  cursor: pointer;
  transition: color 0.15s ease;
}
.p4-th-sortable:hover {
  color: #c45a3c;
}
.p4-sort-icon {
  font-size: 11px;
  margin-left: 4px;
  opacity: 0.5;
}
.p4-th-sortable:hover .p4-sort-icon {
  opacity: 1;
}
.p4-th-right {
  text-align: right;
}
.p4-th-check {
  width: 44px;
  text-align: center;
}
.p4-th-actions {
  width: 80px;
}
.p4-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f6f3ed;
  vertical-align: middle;
}
.p4-tr {
  transition: background 0.15s ease;
}
.p4-tr-even {
  background: #fcfbf8;
}
.p4-tr:hover {
  background: #fef4f0;
}
.p4-tr-selected {
  background: #fef4f0 !important;
}
.p4-td-check {
  text-align: center;
  width: 44px;
}
.p4-td-tarih {
  white-space: nowrap;
}
.p4-date-text {
  font-weight: 500;
  color: #201a12;
  font-size: 13px;
}
.p4-td-aciklama {
  max-width: 320px;
}
.p4-aciklama-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #201a12;
  font-weight: 500;
}
.p4-td-cari {
  color: #8c8070;
  font-weight: 500;
  white-space: nowrap;
}
.p4-kategori-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--kat-color);
  background: color-mix(in srgb, var(--kat-color) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--kat-color) 20%, transparent);
  letter-spacing: 0.3px;
}
.p4-td-tutar {
  text-align: right;
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.p4-tutar-giris {
  color: #10b981;
}
.p4-tutar-cikis {
  color: #ef4444;
}

/* ─── Row Actions (hover'da gorunur) ─── */
.p4-td-actions {
  width: 80px;
}
.p4-row-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
  justify-content: flex-end;
}
.p4-tr:hover .p4-row-actions {
  opacity: 1;
}
.p4-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #a89e90;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.15s ease;
  min-height: 44px;
  min-width: 44px;
}
.p4-action-btn:hover {
  background: #f6f3ed;
  color: #c45a3c;
}
.p4-action-delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* ─── Checkbox (Notion style) ─── */
.p4-checkbox-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
}
.p4-checkbox-wrap input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.p4-checkbox-visual {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd5c8;
  border-radius: 4px;
  transition: all 0.15s ease;
  position: relative;
}
.p4-checkbox-wrap input:checked + .p4-checkbox-visual {
  background: #c45a3c;
  border-color: #c45a3c;
}
.p4-checkbox-wrap input:checked + .p4-checkbox-visual::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 4px;
  width: 4px;
  height: 8px;
  border: 2px solid #fff;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}
.p4-checkbox-wrap input:focus-visible + .p4-checkbox-visual {
  box-shadow: 0 0 0 3px rgba(196, 90, 60, 0.25);
}

/* ─── Table Footer ─── */
.p4-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #f6f3ed;
  background: #faf8f4;
  flex-wrap: wrap;
  gap: 8px;
}
.p4-table-count {
  font-size: 12px;
  color: #a89e90;
  font-weight: 500;
}
.p4-table-summary {
  display: flex;
  gap: 16px;
}
.p4-summary-giris,
.p4-summary-cikis {
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}
.p4-summary-giris {
  color: #10b981;
}
.p4-summary-cikis {
  color: #ef4444;
}

/* ─── Bottom Sheet Modal (iOS tarzi) ─── */
.p4-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 23, 16, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: p4-fadeIn 0.2s ease;
}
.p4-modal-sheet {
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  animation: p4-slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.15);
}
.p4-sheet-handle {
  width: 36px;
  height: 5px;
  background: #ddd5c8;
  border-radius: 99px;
  margin: 12px auto 0;
}
.p4-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}
.p4-sheet-title {
  font-size: 18px;
  font-weight: 800;
  color: #1e1710;
  margin: 0;
}
.p4-sheet-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f6f3ed;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c8070;
  font-size: 16px;
  transition: all 0.15s ease;
  min-height: 44px;
  min-width: 44px;
}
.p4-sheet-close:hover {
  background: #fef4f0;
  color: #c45a3c;
}
.p4-sheet-body {
  padding: 24px;
}
.p4-sheet-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 24px;
  border-top: 1px solid #f6f3ed;
}

/* ─── Form Grid ─── */
.p4-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.p4-form-full {
  grid-column: 1 / -1;
}
.p4-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.p4-form-label {
  font-size: 12px;
  font-weight: 700;
  color: #8c8070;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.p4-form-input {
  padding: 10px 14px;
  border: 1px solid #ddd5c8;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #201a12;
  background: #fff;
  transition: all 0.2s ease;
  min-height: 44px;
  box-sizing: border-box;
}
.p4-form-input:focus {
  outline: none;
  border-color: #c45a3c;
  box-shadow: 0 0 0 3px rgba(196, 90, 60, 0.25);
}
.p4-form-input::placeholder {
  color: #a89e90;
}
.p4-form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* ─── Type Toggle ─── */
.p4-type-toggle {
  display: flex;
  gap: 8px;
}
.p4-type-btn {
  flex: 1;
  padding: 10px;
  border: 2px solid #ddd5c8;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fff;
  color: #8c8070;
  transition: all 0.2s ease;
  min-height: 44px;
}
.p4-type-giris.p4-type-active {
  border-color: #10b981;
  background: #ecfdf5;
  color: #10b981;
}
.p4-type-cikis.p4-type-active {
  border-color: #ef4444;
  background: #fef2f2;
  color: #ef4444;
}
.p4-type-btn:hover {
  border-color: #c8bfb0;
}

/* ─── Animations ─── */
@keyframes p4-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes p4-slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes p4-fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── Responsive: 992px ─── */
@media (max-width: 992px) {
  .p4-dashboard-grid {
    grid-template-columns: 1fr;
  }
  .p4-kpi-section {
    grid-template-columns: 1fr 1fr;
  }
  .p4-page {
    padding: 24px;
  }
}

/* ─── Responsive: 768px ─── */
@media (max-width: 768px) {
  .p4-page {
    padding: 16px;
  }
  .p4-kpi-section {
    grid-template-columns: 1fr;
  }
  .p4-kpi-value {
    font-size: 22px;
  }
  .p4-table-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .p4-table-toolbar-left,
  .p4-table-toolbar-right {
    width: 100%;
  }
  .p4-search-input {
    width: 100%;
  }
  .p4-tab-group {
    width: 100%;
  }
  .p4-tab {
    flex: 1;
    justify-content: center;
  }
  .p4-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .p4-modal-sheet {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
  }
  .p4-form-grid {
    grid-template-columns: 1fr;
  }
  .p4-td-aciklama {
    max-width: 180px;
  }
}

/* ─── Responsive: 480px ─── */
@media (max-width: 480px) {
  .p4-page {
    padding: 12px;
  }
  .p4-title {
    font-size: 18px;
  }
  .p4-kpi-card {
    padding: 14px;
  }
  .p4-kpi-value {
    font-size: 20px;
  }
  .p4-bar-chart {
    min-height: 140px;
    gap: 6px;
  }
  .p4-table th,
  .p4-table td {
    padding: 10px 10px;
  }
  .p4-td-aciklama {
    max-width: 140px;
  }
}
`
