/**
 * Finans Kalesi V3 — Nakit Akis Demo
 *
 * ikas ilhamli tasarim sistemi showcase.
 * Gercek bir Nakit Akis sayfasi gibi tasarlandi.
 * Auth gerektirmez — /tasarim-demo-v3 rotasinda erisilir.
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

// ─── Mock veri ───
const HAREKETLER = [
  { id: 1, tarih: '2026-03-15', aciklama: 'Demir-Celik Ticaret A.S. — Fatura #1247', tur: 'giris', tutar: 84500, kategori: 'Satis', cari: 'Demir-Celik Ticaret' },
  { id: 2, tarih: '2026-03-14', aciklama: 'Personel Maas Odemeleri — Mart 2026', tur: 'cikis', tutar: 127800, kategori: 'Maas', cari: 'Personel' },
  { id: 3, tarih: '2026-03-14', aciklama: 'Atlas Hirdavat — Fatura #892', tur: 'giris', tutar: 23400, kategori: 'Satis', cari: 'Atlas Hirdavat' },
  { id: 4, tarih: '2026-03-13', aciklama: 'Elektrik Faturasi — Subat 2026', tur: 'cikis', tutar: 4850, kategori: 'Fatura', cari: 'TEDAS' },
  { id: 5, tarih: '2026-03-13', aciklama: 'Guven Insaat — Proje Avans #3', tur: 'giris', tutar: 150000, kategori: 'Avans', cari: 'Guven Insaat' },
  { id: 6, tarih: '2026-03-12', aciklama: 'Kira Odemesi — Depo & Ofis', tur: 'cikis', tutar: 35000, kategori: 'Kira', cari: 'Gayrimenkul A.S.' },
  { id: 7, tarih: '2026-03-12', aciklama: 'Yilmaz Metal San. — Fatura #445', tur: 'giris', tutar: 67200, kategori: 'Satis', cari: 'Yilmaz Metal' },
  { id: 8, tarih: '2026-03-11', aciklama: 'Hammadde Alimi — Celik Rulo 4mm', tur: 'cikis', tutar: 210000, kategori: 'Hammadde', cari: 'Erdemir' },
  { id: 9, tarih: '2026-03-11', aciklama: 'Ozkan Yapi Market — Fatura #1103', tur: 'giris', tutar: 18900, kategori: 'Satis', cari: 'Ozkan Yapi' },
  { id: 10, tarih: '2026-03-10', aciklama: 'SGK Primi — Mart 2026', tur: 'cikis', tutar: 42300, kategori: 'Vergi', cari: 'SGK' },
  { id: 11, tarih: '2026-03-10', aciklama: 'KDV Iadesi — Subat 2026', tur: 'giris', tutar: 31500, kategori: 'Vergi', cari: 'Vergi Dairesi' },
  { id: 12, tarih: '2026-03-09', aciklama: 'Nakliye Odemesi — Sevkiyat #78', tur: 'cikis', tutar: 8700, kategori: 'Lojistik', cari: 'Aras Kargo' },
]

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
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setVal(initial + (target - initial) * eased)
      if (progress < 1) ref.current = requestAnimationFrame(step)
    }
    ref.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(ref.current)
  }, [target])
  return val
}

export default function NakitAkisDemo() {
  const [activeTab, setActiveTab] = useState('tumu')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // ESC ile modal kapat
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        setShowDeleteModal(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = (showModal || showDeleteModal) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal, showDeleteModal])

  // Hesaplamalar
  const toplamGiris = HAREKETLER.filter(h => h.tur === 'giris').reduce((t, h) => t + h.tutar, 0)
  const toplamCikis = HAREKETLER.filter(h => h.tur === 'cikis').reduce((t, h) => t + h.tutar, 0)
  const netAkis = toplamGiris - toplamCikis
  const kasaBakiye = 487250

  // Animated
  const animGiris = useAnimatedNumber(toplamGiris)
  const animCikis = useAnimatedNumber(toplamCikis)
  const animNet = useAnimatedNumber(netAkis)
  const animBakiye = useAnimatedNumber(kasaBakiye)

  // Filtre
  const filteredHareketler = HAREKETLER.filter(h => {
    if (activeTab === 'giris') return h.tur === 'giris'
    if (activeTab === 'cikis') return h.tur === 'cikis'
    return true
  }).filter(h => {
    if (!searchQuery) return true
    return h.aciklama.toLowerCase().includes(searchQuery.toLowerCase()) ||
           h.cari.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Akis cubugu oranlari
  const total = toplamGiris + toplamCikis
  const girisOran = total > 0 ? (toplamGiris / total) * 100 : 50
  const cikisOran = total > 0 ? (toplamCikis / total) * 100 : 50

  // Kategori bazli dagilim
  const kategoriler = {}
  HAREKETLER.forEach(h => {
    if (!kategoriler[h.kategori]) kategoriler[h.kategori] = { giris: 0, cikis: 0 }
    if (h.tur === 'giris') kategoriler[h.kategori].giris += h.tutar
    else kategoriler[h.kategori].cikis += h.tutar
  })

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{CSS_CONTENT}</style>

      {/* ═══ HEADER ═══ */}
      <header className="fk-demo-header">
        <div className="fk-demo-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="fk-demo-logo-icon">
              <i className="bi bi-shield-lock-fill" style={{ fontSize: 20, color: '#3034ff' }}></i>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#121926', letterSpacing: '-0.34px' }}>
                Finans Kalesi
              </div>
              <div style={{ fontSize: 11, color: '#9aa4b2', letterSpacing: '-0.22px', marginTop: -1 }}>
                Nakit Akis Yonetimi
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="fk3-btn fk3-btn-secondary" style={{ padding: '8px 14px', fontSize: 14 }}>
              <i className="bi bi-arrow-clockwise" style={{ fontSize: 15 }}></i>
            </button>
            <button className="fk3-btn fk3-btn-primary" onClick={() => setShowModal(true)}>
              <i className="bi bi-plus-lg" style={{ fontSize: 14 }}></i>
              <span className="fk-hide-mobile">Yeni Hareket</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="fk-demo-main">

        {/* ─── KPI KARTLAR ─── */}
        <div className={`fk-kpi-grid ${mounted ? 'fk-animate-in' : ''}`}>
          {[
            { label: 'Toplam Giris', value: animGiris, color: '#10b981', iconBg: '#ecfdf5', icon: 'bi-arrow-down-left', change: '+12.4%', changeUp: true },
            { label: 'Toplam Cikis', value: animCikis, color: '#ef4444', iconBg: '#fef2f2', icon: 'bi-arrow-up-right', change: '+8.2%', changeUp: false },
            { label: 'Net Nakit Akis', value: animNet, color: '#3034ff', iconBg: '#ebf3ff', icon: 'bi-activity', change: null, isNet: true },
            { label: 'Kasa Bakiye', value: animBakiye, color: '#f59e0b', iconBg: '#fffbeb', icon: 'bi-safe-fill', change: null },
          ].map((kpi, i) => (
            <div key={i} className="fk-kpi-card" style={{ animationDelay: `${i * 80}ms` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="fk-kpi-icon-box" style={{ background: kpi.iconBg }}>
                    <i className={`bi ${kpi.icon}`} style={{ fontSize: 18, color: kpi.color }}></i>
                  </div>
                  <span className="fk-kpi-label">{kpi.label}</span>
                </div>
                {kpi.change && (
                  <span className={`fk-kpi-change ${kpi.changeUp ? 'up' : 'down'}`}>
                    <i className={`bi ${kpi.changeUp ? 'bi-arrow-up' : 'bi-arrow-up'}`} style={{ fontSize: 10 }}></i>
                    {kpi.change}
                  </span>
                )}
              </div>
              <div className="fk-kpi-value" style={{ color: kpi.isNet ? (animNet >= 0 ? '#10b981' : '#ef4444') : kpi.color }}>
                {kpi.isNet && animNet < 0 ? '-' : ''}{kpi.isNet && animNet < 0 ? '' : ''}
                {TL(Math.abs(kpi.value))} <span className="fk-kpi-currency">₺</span>
              </div>
            </div>
          ))}
        </div>

        {/* ─── AKIS CUBUGU (Flow Bar) ─── */}
        <div className={`fk-flow-section ${mounted ? 'fk-animate-in' : ''}`} style={{ animationDelay: '320ms' }}>
          <div className="fk-card-v3">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 className="fk-section-title">
                <i className="bi bi-water" style={{ color: '#3034ff', marginRight: 8 }}></i>
                Nakit Akis Dengesi
              </h3>
              <span className="fk-badge-neon">
                Mart 2026
              </span>
            </div>
            <div className="fk-flow-bar-container">
              <div className="fk-flow-bar">
                <div className="fk-flow-bar-giris" style={{ width: `${girisOran}%` }}>
                  <span className="fk-flow-bar-label">Giris %{Math.round(girisOran)}</span>
                </div>
                <div className="fk-flow-bar-cikis" style={{ width: `${cikisOran}%` }}>
                  <span className="fk-flow-bar-label">Cikis %{Math.round(cikisOran)}</span>
                </div>
              </div>
              <div className="fk-flow-legend">
                <div className="fk-flow-legend-item">
                  <div className="fk-flow-dot" style={{ background: '#10b981' }}></div>
                  <span>{TL(toplamGiris)} ₺</span>
                </div>
                <div className="fk-flow-legend-item">
                  <div className="fk-flow-dot" style={{ background: '#ef4444' }}></div>
                  <span>{TL(toplamCikis)} ₺</span>
                </div>
              </div>
            </div>

            {/* Kategori breakdown */}
            <div className="fk-kategori-grid">
              {Object.entries(kategoriler).map(([kat, val]) => (
                <div key={kat} className="fk-kategori-item">
                  <span className="fk-kategori-name">{kat}</span>
                  <div className="fk-kategori-values">
                    {val.giris > 0 && <span style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}>+{TL(val.giris)}</span>}
                    {val.cikis > 0 && <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>-{TL(val.cikis)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── HAREKET LISTESI ─── */}
        <div className={`fk-transactions-section ${mounted ? 'fk-animate-in' : ''}`} style={{ animationDelay: '400ms' }}>
          <div className="fk-card-v3">
            <div className="fk-txn-header">
              <h3 className="fk-section-title">
                <i className="bi bi-list-ul" style={{ color: '#3034ff', marginRight: 8 }}></i>
                Son Hareketler
              </h3>
              <div className="fk-txn-controls">
                {/* Arama */}
                <div className="fk-search-box">
                  <i className="bi bi-search" style={{ color: '#9aa4b2', fontSize: 14 }}></i>
                  <input
                    type="text"
                    placeholder="Hareket ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="fk-search-input"
                  />
                </div>

                {/* Tablar */}
                <div className="fk-tab-container">
                  {[
                    { key: 'tumu', label: 'Tumu' },
                    { key: 'giris', label: 'Girisler' },
                    { key: 'cikis', label: 'Cikislar' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      className={`fk-tab ${activeTab === tab.key ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                      {tab.key === 'tumu' && (
                        <span className="fk-tab-count">{HAREKETLER.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tablo */}
            <div className="table-responsive">
              <table className="fk-table">
                <thead>
                  <tr>
                    <th style={{ width: '42%' }}>Aciklama</th>
                    <th>Kategori</th>
                    <th>Tarih</th>
                    <th style={{ textAlign: 'right' }}>Tutar</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHareketler.map((h, i) => (
                    <tr key={h.id} className="fk-txn-row" style={{ animationDelay: `${i * 40}ms` }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className={`fk-txn-indicator ${h.tur}`}>
                            <i className={`bi ${h.tur === 'giris' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`}
                              style={{ fontSize: 13 }}></i>
                          </div>
                          <div>
                            <div className="fk-txn-cari">{h.cari}</div>
                            <div className="fk-txn-desc">{h.aciklama}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`fk-badge fk-badge-${h.tur === 'giris' ? 'success' : 'danger'}`}>
                          {h.kategori}
                        </span>
                      </td>
                      <td>
                        <span className="fk-txn-date">{tarihFormat(h.tarih)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`fk-txn-amount ${h.tur}`}>
                          {h.tur === 'giris' ? '+' : '-'}{TL(h.tutar)} ₺
                        </span>
                      </td>
                      <td>
                        <button className="fk-txn-action-btn" title="Detay">
                          <i className="bi bi-three-dots"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredHareketler.length === 0 && (
              <div className="fk-empty-state">
                <div className="fk-empty-icon">
                  <i className="bi bi-inbox" style={{ fontSize: 28, color: '#3034ff' }}></i>
                </div>
                <h4>Sonuc bulunamadi</h4>
                <p>Arama kriterlerinize uygun hareket yok.</p>
              </div>
            )}

            {/* Alt bar */}
            <div className="fk-txn-footer">
              <span className="fk-txn-footer-text">
                {filteredHareketler.length} hareket gosteriliyor
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="fk3-btn fk3-btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>
                  <i className="bi bi-download" style={{ fontSize: 13, marginRight: 4 }}></i>
                  Disari Aktar
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ YENi HAREKET MODAL ═══ */}
      {showModal && (
        <div className="fk-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { /* backdrop tiklama kapatmaz */ } }}>
          <div className="fk-modal">
            <div className="fk-modal-header">
              <h5 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-plus-circle"></i>
                Yeni Nakit Hareketi
              </h5>
              <button className="fk-modal-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x-lg" style={{ fontSize: 14 }}></i>
              </button>
            </div>
            <div className="fk-modal-body">
              {/* Tur secimi */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button className="fk3-btn fk-tur-btn active-giris" style={{ flex: 1 }}>
                  <i className="bi bi-arrow-down-left"></i> Giris
                </button>
                <button className="fk3-btn fk-tur-btn" style={{ flex: 1, background: '#fff', color: '#697586', border: '1px solid #e3e8ef' }}>
                  <i className="bi bi-arrow-up-right"></i> Cikis
                </button>
              </div>

              {/* Form */}
              <div className="fk-form-group">
                <div className="fk-input-wrapper">
                  <input type="text" className="fk-input" placeholder=" " />
                  <label className="fk-float-label">Aciklama</label>
                </div>
              </div>
              <div className="fk-form-row">
                <div className="fk-form-group" style={{ flex: 1 }}>
                  <div className="fk-input-wrapper">
                    <input type="text" className="fk-input" placeholder=" " />
                    <label className="fk-float-label">Tutar (₺)</label>
                  </div>
                </div>
                <div className="fk-form-group" style={{ flex: 1 }}>
                  <div className="fk-input-wrapper">
                    <input type="date" className="fk-input" defaultValue="2026-03-15" />
                    <label className="fk-float-label" style={{ top: 0, left: 8, fontSize: 12, padding: '0 4px' }}>Tarih</label>
                  </div>
                </div>
              </div>
              <div className="fk-form-group">
                <div className="fk-input-wrapper">
                  <select className="fk-input" defaultValue="">
                    <option value="" disabled>Kategori secin</option>
                    <option>Satis</option>
                    <option>Maas</option>
                    <option>Fatura</option>
                    <option>Kira</option>
                    <option>Hammadde</option>
                    <option>Vergi</option>
                    <option>Lojistik</option>
                    <option>Avans</option>
                  </select>
                  <label className="fk-float-label" style={{ top: 0, left: 8, fontSize: 12, padding: '0 4px' }}>Kategori</label>
                </div>
              </div>
              <div className="fk-form-group">
                <div className="fk-input-wrapper">
                  <input type="text" className="fk-input" placeholder=" " />
                  <label className="fk-float-label">Cari Hesap</label>
                </div>
              </div>
            </div>
            <div className="fk-modal-footer">
              <button className="fk3-btn fk3-btn-secondary" onClick={() => setShowModal(false)}>
                Iptal
              </button>
              <button className="fk3-btn fk3-btn-primary" onClick={() => setShowModal(false)}>
                <i className="bi bi-check-lg" style={{ fontSize: 16 }}></i>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SiLME ONAY MODAL ═══ */}
      {showDeleteModal && (
        <div className="fk-modal-backdrop">
          <div className="fk-modal" style={{ maxWidth: 400 }}>
            <div className="fk-modal-header" style={{ background: '#ef4444' }}>
              <h5 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                Silme Onayi
              </h5>
              <button className="fk-modal-close" onClick={() => setShowDeleteModal(false)}>
                <i className="bi bi-x-lg" style={{ fontSize: 14 }}></i>
              </button>
            </div>
            <div className="fk-modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: '#fef2f2', border: '1px solid #fecaca',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <i className="bi bi-trash" style={{ fontSize: 24, color: '#ef4444' }}></i>
              </div>
              <p style={{ color: '#697586', fontSize: 14, marginBottom: 4 }}>
                Bu hareketi silmek istediginizden emin misiniz?
              </p>
              <p style={{ color: '#9aa4b2', fontSize: 13 }}>
                Bu islem geri alinamaz.
              </p>
            </div>
            <div className="fk-modal-footer">
              <button className="fk3-btn fk3-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Iptal
              </button>
              <button className="fk3-btn fk3-btn-danger" onClick={() => setShowDeleteModal(false)}>
                <i className="bi bi-trash" style={{ fontSize: 14 }}></i>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// CSS — ikas DNA, Finans Kalesi V3
// ═══════════════════════════════════════════════════
const CSS_CONTENT = `
  /* ─── Reset & Base ─── */
  .fk-demo-header,
  .fk-demo-main,
  .fk-card-v3,
  .fk-kpi-card,
  .fk-modal,
  .fk-modal-backdrop,
  .fk3-btn,
  .fk-table,
  .fk-tab,
  .fk-input,
  .fk-badge,
  .fk-search-input {
    font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
    font-family: 'Inter', sans-serif;
    box-sizing: border-box;
  }

  /* ─── HEADER ─── */
  .fk-demo-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid #e3e8ef;
  }
  .fk-demo-header-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .fk-demo-logo-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #ebf3ff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #bed2ff;
  }

  /* ─── MAIN ─── */
  .fk-demo-main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 28px 24px 60px;
  }

  /* ─── ANIMATIONS ─── */
  @keyframes fkSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fkFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .fk-animate-in {
    animation: fkSlideUp 0.5s ease both;
  }
  .fk-kpi-card {
    animation: fkSlideUp 0.5s ease both;
  }
  .fk-txn-row {
    animation: fkFadeIn 0.3s ease both;
  }

  /* ─── KPI GRID ─── */
  .fk-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  @media (max-width: 992px) {
    .fk-kpi-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .fk-kpi-grid { grid-template-columns: 1fr; }
  }

  /* ─── KPI CARD ─── */
  .fk-kpi-card {
    background: #ffffff;
    border: 1px solid #e3e8ef;
    border-radius: 10px;
    padding: 18px 20px;
    box-shadow:
      0px 2px 1px 0px rgba(38,69,109,0.01),
      0px 1px 1px 0px rgba(38,69,109,0.02);
    transition: all 300ms ease;
    cursor: default;
  }
  .fk-kpi-card:hover {
    box-shadow:
      0px 12px 3px 0px rgba(81,114,148,0),
      0px 8px 3px 0px rgba(81,114,148,0.01),
      0px 4px 3px 0px rgba(81,114,148,0.02),
      0px 2px 2px 0px rgba(81,114,148,0.04),
      0px 0px 1px 0px rgba(81,114,148,0.05);
    border-color: #cdd5df;
    transform: translateY(-2px);
  }
  .fk-kpi-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .fk-kpi-label {
    font-size: 13px;
    font-weight: 500;
    color: #697586;
    letter-spacing: -0.26px;
  }
  .fk-kpi-value {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.52px;
    margin-top: 10px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .fk-kpi-currency {
    font-size: 18px;
    font-weight: 500;
    opacity: 0.7;
  }
  .fk-kpi-change {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    letter-spacing: -0.24px;
  }
  .fk-kpi-change.up {
    background: #ecfdf5;
    color: #059669;
  }
  .fk-kpi-change.down {
    background: #fef2f2;
    color: #dc2626;
  }

  @media (max-width: 768px) {
    .fk-kpi-value { font-size: 22px; }
  }
  @media (max-width: 480px) {
    .fk-kpi-value { font-size: 20px; }
  }

  /* ─── CARD V3 ─── */
  .fk-card-v3 {
    background: #ffffff;
    border: 1px solid #e3e8ef;
    border-radius: 12px;
    padding: 24px;
    box-shadow:
      0px 2px 1px 0px rgba(38,69,109,0.01),
      0px 1px 1px 0px rgba(38,69,109,0.02);
  }

  /* ─── SECTION TITLE ─── */
  .fk-section-title {
    font-size: 16px;
    font-weight: 700;
    color: #121926;
    letter-spacing: -0.32px;
    margin: 0;
    display: flex;
    align-items: center;
  }

  /* ─── FLOW BAR ─── */
  .fk-flow-section { margin-bottom: 24px; }
  .fk-flow-bar-container { margin-top: 8px; }
  .fk-flow-bar {
    display: flex;
    height: 36px;
    border-radius: 8px;
    overflow: hidden;
    gap: 2px;
  }
  .fk-flow-bar-giris {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px 0 0 8px;
    transition: width 1s ease;
    min-width: 60px;
  }
  .fk-flow-bar-cikis {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 8px 8px 0;
    transition: width 1s ease;
    min-width: 60px;
  }
  .fk-flow-bar-label {
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.24px;
  }
  .fk-flow-legend {
    display: flex;
    gap: 24px;
    margin-top: 10px;
  }
  .fk-flow-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #121926;
    letter-spacing: -0.28px;
  }
  .fk-flow-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  /* ─── KATEGORi GRID ─── */
  .fk-kategori-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eef2f6;
  }
  .fk-kategori-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #eef2f6;
    transition: all 200ms ease;
  }
  .fk-kategori-item:hover {
    background: #fff;
    border-color: #e3e8ef;
  }
  .fk-kategori-name {
    font-size: 13px;
    font-weight: 500;
    color: #697586;
    letter-spacing: -0.26px;
  }
  .fk-kategori-values {
    display: flex;
    gap: 8px;
  }

  /* ─── TRANSACTIONS ─── */
  .fk-transactions-section { margin-bottom: 24px; }
  .fk-txn-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .fk-txn-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  /* ─── SEARCH ─── */
  .fk-search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #e3e8ef;
    border-radius: 8px;
    padding: 0 12px;
    height: 40px;
    min-width: 200px;
    transition: all 200ms ease;
  }
  .fk-search-box:focus-within {
    border-color: #3034ff;
    box-shadow: 0px 0px 0px 2px rgba(48,52,255,0.25);
  }
  .fk-search-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: #121926;
    width: 100%;
    letter-spacing: -0.28px;
  }
  .fk-search-input::placeholder {
    color: #9aa4b2;
  }

  /* ─── TABS ─── */
  .fk-tab-container {
    display: inline-flex;
    gap: 0;
    background: #eef2f6;
    border-radius: 10px;
    padding: 4px;
  }
  .fk-tab {
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #697586;
    background: transparent;
    border: none;
    cursor: pointer;
    min-height: 34px;
    transition: all 200ms ease;
    letter-spacing: -0.26px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .fk-tab:hover { color: #121926; }
  .fk-tab.active {
    background: #ffffff;
    color: #121926;
    font-weight: 600;
    box-shadow:
      0px 2px 4px rgba(0,0,0,0.06),
      0px 1px 2px rgba(0,0,0,0.04);
  }
  .fk-tab-count {
    font-size: 11px;
    font-weight: 600;
    background: #ebf3ff;
    color: #3034ff;
    padding: 1px 7px;
    border-radius: 10px;
  }

  /* ─── TABLE ─── */
  .fk-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 600px;
  }
  .fk-table thead th {
    font-size: 12px;
    font-weight: 600;
    color: #9aa4b2;
    padding: 10px 16px;
    text-align: left;
    border-bottom: 1px solid #e3e8ef;
    letter-spacing: -0.24px;
    white-space: nowrap;
  }
  .fk-table tbody td {
    font-size: 14px;
    color: #121926;
    padding: 12px 16px;
    border-bottom: 1px solid #eef2f6;
    letter-spacing: -0.28px;
    vertical-align: middle;
  }
  .fk-table tbody tr {
    transition: background 150ms ease;
  }
  .fk-table tbody tr:hover {
    background: #f8fafc;
  }
  .fk-table tbody tr:last-child td {
    border-bottom: none;
  }

  /* ─── TXN INDICATOR ─── */
  .fk-txn-indicator {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .fk-txn-indicator.giris {
    background: #ecfdf5;
    color: #10b981;
  }
  .fk-txn-indicator.cikis {
    background: #fef2f2;
    color: #ef4444;
  }

  .fk-txn-cari {
    font-size: 14px;
    font-weight: 600;
    color: #121926;
    letter-spacing: -0.28px;
    line-height: 1.3;
  }
  .fk-txn-desc {
    font-size: 12px;
    color: #9aa4b2;
    letter-spacing: -0.24px;
    margin-top: 1px;
    line-height: 1.3;
  }
  .fk-txn-date {
    font-size: 13px;
    color: #697586;
    white-space: nowrap;
  }
  .fk-txn-amount {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.28px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .fk-txn-amount.giris { color: #10b981; }
  .fk-txn-amount.cikis { color: #ef4444; }

  .fk-txn-action-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #9aa4b2;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 150ms ease;
    font-size: 16px;
  }
  .fk-txn-action-btn:hover {
    background: #eef2f6;
    color: #121926;
  }

  .fk-txn-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #eef2f6;
  }
  .fk-txn-footer-text {
    font-size: 13px;
    color: #9aa4b2;
    letter-spacing: -0.26px;
  }

  /* ─── BADGES ─── */
  .fk-badge {
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.24px;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }
  .fk-badge-success { background: #ecfdf5; color: #059669; }
  .fk-badge-danger  { background: #fef2f2; color: #dc2626; }
  .fk-badge-warning { background: #fffbeb; color: #d97706; }
  .fk-badge-primary { background: #ebf3ff; color: #3034ff; }
  .fk-badge-neon {
    background: #ebfbac;
    color: #121926;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 4px;
    border: 1px solid #cce85f;
    letter-spacing: -0.24px;
  }

  /* ─── BUTTONS (ikas 3D system) ─── */
  .fk3-btn {
    display: inline-flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    width: fit-content;
    outline: none;
    border: none;
    background: none;
    border-radius: 8px;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 24px;
    letter-spacing: -0.28px;
    cursor: pointer;
    transition: all 300ms ease;
    padding: 8px 16px;
    min-height: 44px;
    white-space: nowrap;
    font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
  }
  .fk3-btn-primary {
    border: 1px solid #6e87ff;
    background: #3034ff;
    color: #fff;
    box-shadow:
      0px -3px 2px 0px rgba(19,20,83,0.25) inset,
      0px 4px 1px 0px rgba(38,69,109,0),
      0px 2px 1px 0px rgba(38,69,109,0.01),
      0px 1px 1px 0px rgba(38,69,109,0.02),
      0px 1px 1px 0px rgba(38,69,109,0.03);
  }
  .fk3-btn-primary:hover {
    border-color: #3034ff;
    background: #2020e2;
    box-shadow:
      0px 18px 5px 0px rgba(32,32,226,0),
      0px 11px 4px 0px rgba(32,32,226,0.02),
      0px 6px 4px 0px rgba(32,32,226,0.07),
      0px 3px 3px 0px rgba(32,32,226,0.11),
      0px 1px 2px 0px rgba(32,32,226,0.13),
      0px -3px 2px 0px rgba(19,20,83,0.25) inset;
  }
  .fk3-btn-secondary {
    border: 1px solid #e3e8ef;
    background: #ffffff;
    color: #121926;
    box-shadow:
      0px -3px 1px 0px rgba(238,242,246,0.5) inset,
      0px 4px 1px 0px rgba(38,69,109,0),
      0px 2px 1px 0px rgba(38,69,109,0.01),
      0px 1px 1px 0px rgba(38,69,109,0.02),
      0px 1px 1px 0px rgba(38,69,109,0.03);
  }
  .fk3-btn-secondary:hover {
    background: #f8fafc;
    box-shadow:
      0px -3px 1px 0px rgba(221,231,242,0.5) inset,
      0px 12px 3px 0px rgba(81,114,148,0),
      0px 8px 3px 0px rgba(81,114,148,0.01),
      0px 4px 3px 0px rgba(81,114,148,0.02),
      0px 2px 2px 0px rgba(81,114,148,0.04),
      0px 0px 1px 0px rgba(81,114,148,0.05);
  }
  .fk3-btn-danger {
    border: 1px solid #ef4444;
    background: #ef4444;
    color: #fff;
    box-shadow:
      0px -3px 2px 0px rgba(120,20,20,0.25) inset,
      0px 2px 1px 0px rgba(109,38,38,0.02),
      0px 1px 1px 0px rgba(109,38,38,0.04);
  }
  .fk3-btn-danger:hover {
    background: #dc2626;
    box-shadow:
      0px 8px 3px 0px rgba(220,38,38,0),
      0px 5px 3px 0px rgba(220,38,38,0.02),
      0px 3px 2px 0px rgba(220,38,38,0.07),
      0px 1px 1px 0px rgba(220,38,38,0.11),
      0px -3px 2px 0px rgba(120,20,20,0.25) inset;
  }

  /* Tur secim butonu (modal icinde) */
  .fk-tur-btn {
    border-radius: 8px;
    font-size: 14px;
    min-height: 44px;
  }
  .fk-tur-btn.active-giris {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
    box-shadow: none;
  }

  /* ─── MODAL ─── */
  .fk-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.16);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fkFadeIn 0.2s ease;
  }
  .fk-modal {
    background: #ffffff;
    border-radius: 12px;
    max-width: 520px;
    width: 92%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow:
      0px 24px 48px rgba(0,0,0,0.12),
      0px 8px 16px rgba(0,0,0,0.08),
      0px 2px 4px rgba(0,0,0,0.04);
    animation: fkModalSlideUp 0.3s ease;
    overflow: hidden;
  }
  @keyframes fkModalSlideUp {
    from { transform: translateY(24px) scale(0.98); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }
  .fk-modal-header {
    background: #14141a;
    color: #ffffff;
    padding: 18px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .fk-modal-close {
    background: rgba(255,255,255,0.12);
    border: none;
    color: #ffffff;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 200ms;
  }
  .fk-modal-close:hover {
    background: rgba(255,255,255,0.22);
  }
  .fk-modal-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }
  .fk-modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #e3e8ef;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  @media (max-width: 768px) {
    .fk-modal-backdrop { align-items: flex-end; }
    .fk-modal {
      border-radius: 16px 16px 0 0;
      max-height: 85vh;
      width: 100%;
      max-width: 100%;
    }
    @keyframes fkModalSlideUp {
      from { transform: translateY(100%); opacity: 1; }
      to { transform: translateY(0); opacity: 1; }
    }
  }

  /* ─── FORM ─── */
  .fk-form-group {
    margin-bottom: 16px;
  }
  .fk-form-row {
    display: flex;
    gap: 12px;
  }
  @media (max-width: 480px) {
    .fk-form-row { flex-direction: column; }
  }
  .fk-input-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .fk-input {
    display: flex;
    padding: 12px 14px;
    align-items: center;
    border-radius: 8px;
    outline: none;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 400;
    line-height: 20px;
    background: #fff;
    border: 1px solid #e3e8ef;
    color: #121926;
    min-height: 44px;
    width: 100%;
    transition: border-color 200ms, box-shadow 200ms;
    letter-spacing: -0.3px;
    font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
  }
  .fk-input::placeholder { color: #9aa4b2; }
  .fk-input:focus {
    border-color: #3034ff;
    box-shadow: 0px 0px 0px 2px rgba(48,52,255,0.25);
  }
  .fk-float-label {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 15px;
    color: #697586;
    background: #fff;
    pointer-events: none;
    transition: all 0.25s ease;
    border-radius: 4px;
    letter-spacing: -0.3px;
  }
  .fk-input:focus + .fk-float-label,
  .fk-input:not(:placeholder-shown) + .fk-float-label {
    top: 0px;
    left: 8px;
    font-size: 11px;
    padding: 0 5px;
    color: #3034ff;
  }

  /* ─── EMPTY STATE ─── */
  .fk-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    text-align: center;
    padding: 40px;
  }
  .fk-empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: #ebf3ff;
    border: 1px solid #bed2ff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }
  .fk-empty-state h4 {
    font-size: 15px;
    font-weight: 600;
    color: #121926;
    margin: 0 0 4px;
  }
  .fk-empty-state p {
    font-size: 13px;
    color: #9aa4b2;
    margin: 0;
  }

  /* ─── MOBILE HELPERS ─── */
  @media (max-width: 768px) {
    .fk-hide-mobile { display: none; }
    .fk-demo-main { padding: 16px 16px 40px; }
    .fk-card-v3 { padding: 16px; border-radius: 10px; }
    .fk-txn-header { flex-direction: column; }
    .fk-txn-controls { width: 100%; }
    .fk-search-box { width: 100%; min-width: auto; }
    .fk-flow-legend { flex-direction: column; gap: 8px; }
    .fk-kategori-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 480px) {
    .fk-demo-main { padding: 12px 12px 40px; }
    .fk-kpi-card { padding: 14px 16px; }
    .fk-txn-desc { display: none; }
  }

  /* ─── SCROLLBAR ─── */
  .fk-modal-body::-webkit-scrollbar { width: 6px; }
  .fk-modal-body::-webkit-scrollbar-track { background: transparent; }
  .fk-modal-body::-webkit-scrollbar-thumb {
    background: #e3e8ef;
    border-radius: 3px;
  }
  .fk-modal-body::-webkit-scrollbar-thumb:hover { background: #cdd5df; }
`
