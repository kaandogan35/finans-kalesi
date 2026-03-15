/**
 * Finans Kalesi V3 — Palet 2: Gece Ormani
 *
 * Wealthsimple / Wise ilhamli organik fintech tasarimi.
 * Tek kolon, genis, bol nefes alan layout.
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

// ─── Kategori renkleri ve ikonlari ───
const KATEGORI_MAP = {
  Satis:     { icon: 'bi-cart-check',    bg: '#ecfdf5', color: '#10b981' },
  Maas:      { icon: 'bi-people',        bg: '#fef2f2', color: '#ef4444' },
  Fatura:    { icon: 'bi-receipt',        bg: '#fef2f2', color: '#ef4444' },
  Kira:      { icon: 'bi-building',      bg: '#fef2f2', color: '#ef4444' },
  Hammadde:  { icon: 'bi-box-seam',      bg: '#fef2f2', color: '#ef4444' },
  Vergi:     { icon: 'bi-bank',          bg: '#fef3c7', color: '#d4940a' },
  Lojistik:  { icon: 'bi-truck',         bg: '#fef2f2', color: '#ef4444' },
  Avans:     { icon: 'bi-cash-stack',    bg: '#ecfdf5', color: '#10b981' },
}

// ─── Mock veri ───
const HAREKETLER = [
  { id: 1,  tarih: '2026-03-15', aciklama: 'Kocaeli Demir-Celik A.S. — Profil Boru Satisi',   tur: 'giris',  tutar: 94500,  kategori: 'Satis',    cari: 'Kocaeli Demir-Celik' },
  { id: 2,  tarih: '2026-03-15', aciklama: 'Personel Maas Odemeleri — Mart 2026',              tur: 'cikis',  tutar: 138200, kategori: 'Maas',     cari: 'Personel' },
  { id: 3,  tarih: '2026-03-14', aciklama: 'Anadolu Hirdavat — Toplu Vida/Civata Satisi',      tur: 'giris',  tutar: 27800,  kategori: 'Satis',    cari: 'Anadolu Hirdavat' },
  { id: 4,  tarih: '2026-03-13', aciklama: 'Dogalgaz Faturasi — Subat 2026',                   tur: 'cikis',  tutar: 6350,   kategori: 'Fatura',   cari: 'IGDAS' },
  { id: 5,  tarih: '2026-03-13', aciklama: 'Marmara Insaat — Proje Avans Odemesi',             tur: 'giris',  tutar: 175000, kategori: 'Avans',    cari: 'Marmara Insaat' },
  { id: 6,  tarih: '2026-03-12', aciklama: 'Depo Kira Odemesi — Mart 2026',                    tur: 'cikis',  tutar: 42000,  kategori: 'Kira',     cari: 'Yildiz Gayrimenkul' },
  { id: 7,  tarih: '2026-03-12', aciklama: 'Bogazici Metal San. — Sac Levha Satisi',           tur: 'giris',  tutar: 58700,  kategori: 'Satis',    cari: 'Bogazici Metal' },
  { id: 8,  tarih: '2026-03-11', aciklama: 'Hammadde Alimi — Galvaniz Rulo 2mm',               tur: 'cikis',  tutar: 225000, kategori: 'Hammadde', cari: 'Kardemir' },
  { id: 9,  tarih: '2026-03-11', aciklama: 'Trakya Yapi Market — Boya & Aksesuar Satisi',      tur: 'giris',  tutar: 15400,  kategori: 'Satis',    cari: 'Trakya Yapi' },
  { id: 10, tarih: '2026-03-10', aciklama: 'KDV Odemesi — Subat 2026',                         tur: 'cikis',  tutar: 51800,  kategori: 'Vergi',    cari: 'Vergi Dairesi' },
  { id: 11, tarih: '2026-03-10', aciklama: 'Ege Celik — Kolon Profil Satisi',                  tur: 'giris',  tutar: 42300,  kategori: 'Satis',    cari: 'Ege Celik' },
  { id: 12, tarih: '2026-03-09', aciklama: 'Sevkiyat Odemesi — Nakliye #45',                   tur: 'cikis',  tutar: 9200,   kategori: 'Lojistik', cari: 'Lojistik Express' },
]

// ─── Son 7 gun bar chart verisi ───
function gunlukOzet() {
  const gunler = ['09 Mar', '10 Mar', '11 Mar', '12 Mar', '13 Mar', '14 Mar', '15 Mar']
  const tarihler = ['2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14', '2026-03-15']
  return tarihler.map((t, i) => {
    const giris = HAREKETLER.filter(h => h.tarih === t && h.tur === 'giris').reduce((a, h) => a + h.tutar, 0)
    const cikis = HAREKETLER.filter(h => h.tarih === t && h.tur === 'cikis').reduce((a, h) => a + h.tutar, 0)
    return { gun: gunler[i], giris, cikis }
  })
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
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
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

// ─── Toplam hesaplari ───
const toplamGiris = HAREKETLER.filter(h => h.tur === 'giris').reduce((a, h) => a + h.tutar, 0)
const toplamCikis = HAREKETLER.filter(h => h.tur === 'cikis').reduce((a, h) => a + h.tutar, 0)
const netBakiye = toplamGiris - toplamCikis

export default function Palet2OrmanDemo() {
  const [activeTab, setActiveTab] = useState('tumu')
  const [showModal, setShowModal] = useState(false)
  const [selectedHareket, setSelectedHareket] = useState(null)
  const [mounted, setMounted] = useState(false)

  const animGiris = useAnimatedNumber(toplamGiris)
  const animCikis = useAnimatedNumber(toplamCikis)
  const animNet = useAnimatedNumber(netBakiye)

  useEffect(() => { setMounted(true) }, [])

  // ESC ile modal kapat
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        setSelectedHareket(null)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Body scroll lock
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  const filtrelenmis = activeTab === 'tumu'
    ? HAREKETLER
    : HAREKETLER.filter(h => h.tur === activeTab)

  const chartData = gunlukOzet()
  const maxChart = Math.max(...chartData.map(d => Math.max(d.giris, d.cikis)), 1)

  const openDetail = (h) => {
    setSelectedHareket(h)
    setShowModal(true)
  }

  return (
    <>
      <style>{CSS_CONTENT}</style>
      <div className={`p2-page ${mounted ? 'p2-page--mounted' : ''}`}>
        {/* ─── Header ─── */}
        <header className="p2-header">
          <div className="p2-header__brand">
            <div className="p2-header__logo">
              <i className="bi bi-tree-fill"></i>
            </div>
            <div>
              <h1 className="p2-header__title">Palet 2 — Gece Ormani</h1>
              <p className="p2-header__subtitle">Wealthsimple / Wise ilhamli organik fintech</p>
            </div>
          </div>
          <button
            className="p2-btn p2-btn--primary"
            onClick={() => { setSelectedHareket(null); setShowModal(true) }}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Yeni Hareket</span>
          </button>
        </header>

        {/* ─── Hero KPI ─── */}
        <section className="p2-hero">
          <div className="p2-hero__pattern" aria-hidden="true"></div>
          <div className="p2-hero__content">
            <span className="p2-hero__label">Net Bakiye</span>
            <div className="p2-hero__amount">
              <span className={`p2-hero__value ${netBakiye >= 0 ? 'p2-hero__value--positive' : 'p2-hero__value--negative'}`}>
                {netBakiye >= 0 ? '+' : '-'}{TL(Math.abs(animNet))}
              </span>
              <span className="p2-hero__currency">TL</span>
            </div>
            <div className="p2-hero__row">
              <div className="p2-hero__sub">
                <span className="p2-hero__dot p2-hero__dot--green"></span>
                <span className="p2-hero__sub-label">Giris</span>
                <span className="p2-hero__sub-value p2-hero__sub-value--green">{TL(animGiris)}</span>
              </div>
              <div className="p2-hero__divider"></div>
              <div className="p2-hero__sub">
                <span className="p2-hero__dot p2-hero__dot--red"></span>
                <span className="p2-hero__sub-label">Cikis</span>
                <span className="p2-hero__sub-value p2-hero__sub-value--red">{TL(animCikis)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 7 Gunluk Bar Chart ─── */}
        <section className="p2-chart">
          <h2 className="p2-section-title">
            <i className="bi bi-bar-chart-line"></i>
            Son 7 Gun
          </h2>
          <div className="p2-chart__grid">
            {chartData.map((d, i) => (
              <div className="p2-chart__col" key={i}>
                <div className="p2-chart__bars">
                  <div
                    className="p2-chart__bar p2-chart__bar--green"
                    style={{ height: `${Math.max((d.giris / maxChart) * 100, d.giris > 0 ? 4 : 0)}%` }}
                    title={`Giris: ${TL(d.giris)} TL`}
                  >
                    {d.giris > 0 && <span className="p2-chart__bar-tip">{TL(d.giris / 1000)}k</span>}
                  </div>
                  <div
                    className="p2-chart__bar p2-chart__bar--red"
                    style={{ height: `${Math.max((d.cikis / maxChart) * 100, d.cikis > 0 ? 4 : 0)}%` }}
                    title={`Cikis: ${TL(d.cikis)} TL`}
                  >
                    {d.cikis > 0 && <span className="p2-chart__bar-tip">{TL(d.cikis / 1000)}k</span>}
                  </div>
                </div>
                <span className="p2-chart__day">{d.gun}</span>
              </div>
            ))}
          </div>
          <div className="p2-chart__legend">
            <span className="p2-chart__legend-item">
              <span className="p2-chart__legend-swatch p2-chart__legend-swatch--green"></span> Giris
            </span>
            <span className="p2-chart__legend-item">
              <span className="p2-chart__legend-swatch p2-chart__legend-swatch--red"></span> Cikis
            </span>
          </div>
        </section>

        {/* ─── Tabs ─── */}
        <div className="p2-tabs">
          {[
            { key: 'tumu', label: 'Tumu', icon: 'bi-list-ul' },
            { key: 'giris', label: 'Girisler', icon: 'bi-arrow-down-left' },
            { key: 'cikis', label: 'Cikislar', icon: 'bi-arrow-up-right' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`p2-tab ${activeTab === tab.key ? 'p2-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <i className={`bi ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Feed (Instagram-style vertical flow) ─── */}
        <section className="p2-feed">
          {filtrelenmis.map((h, i) => {
            const kat = KATEGORI_MAP[h.kategori] || { icon: 'bi-circle', bg: '#f3f4f6', color: '#6b7280' }
            return (
              <div
                className="p2-feed__item"
                key={h.id}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => openDetail(h)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') openDetail(h) }}
              >
                <div className="p2-feed__avatar" style={{ background: kat.bg, color: kat.color }}>
                  <i className={`bi ${kat.icon}`}></i>
                </div>
                <div className="p2-feed__body">
                  <div className="p2-feed__top">
                    <span className="p2-feed__cari">{h.cari}</span>
                    <span className={`p2-feed__tutar ${h.tur === 'giris' ? 'p2-feed__tutar--green' : 'p2-feed__tutar--red'}`}>
                      {h.tur === 'giris' ? '+' : '-'}{TL(h.tutar)}
                    </span>
                  </div>
                  <div className="p2-feed__bottom">
                    <span className="p2-feed__aciklama">{h.aciklama}</span>
                  </div>
                  <div className="p2-feed__meta">
                    <span className="p2-feed__badge">{h.kategori}</span>
                    <span className="p2-feed__tarih">{tarihFormat(h.tarih)}</span>
                  </div>
                </div>
                <div className="p2-feed__arrow">
                  <i className="bi bi-chevron-right"></i>
                </div>
              </div>
            )
          })}
        </section>

        {/* ─── Ozet Kutusu ─── */}
        <section className="p2-summary">
          <div className="p2-summary__row">
            <div className="p2-summary__card">
              <div className="p2-summary__icon p2-summary__icon--green">
                <i className="bi bi-arrow-down-left-circle-fill"></i>
              </div>
              <div className="p2-summary__info">
                <span className="p2-summary__label">Toplam Giris</span>
                <span className="p2-summary__value p2-summary__value--green">{TL(toplamGiris)}</span>
              </div>
            </div>
            <div className="p2-summary__card">
              <div className="p2-summary__icon p2-summary__icon--red">
                <i className="bi bi-arrow-up-right-circle-fill"></i>
              </div>
              <div className="p2-summary__info">
                <span className="p2-summary__label">Toplam Cikis</span>
                <span className="p2-summary__value p2-summary__value--red">{TL(toplamCikis)}</span>
              </div>
            </div>
          </div>
          <div className="p2-summary__net">
            <span className="p2-summary__net-label">Net Durum</span>
            <span className={`p2-summary__net-value ${netBakiye >= 0 ? 'p2-summary__net-value--green' : 'p2-summary__net-value--red'}`}>
              {netBakiye >= 0 ? '+' : '-'}{TL(Math.abs(netBakiye))} TL
            </span>
          </div>
        </section>

        {/* ─── Modal ─── */}
        {showModal && (
          <div className="p2-overlay" role="presentation">
            <div className="p2-modal" role="dialog" aria-modal="true">
              <div className="p2-modal__head">
                <h3 className="p2-modal__title">
                  {selectedHareket ? 'Hareket Detayi' : 'Yeni Hareket Ekle'}
                </h3>
                <button
                  className="p2-modal__close"
                  onClick={() => { setShowModal(false); setSelectedHareket(null) }}
                  aria-label="Kapat"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="p2-modal__body">
                {selectedHareket ? (
                  <div className="p2-detail">
                    <div className="p2-detail__hero">
                      <div
                        className="p2-detail__avatar"
                        style={{
                          background: (KATEGORI_MAP[selectedHareket.kategori] || {}).bg || '#f3f4f6',
                          color: (KATEGORI_MAP[selectedHareket.kategori] || {}).color || '#6b7280'
                        }}
                      >
                        <i className={`bi ${(KATEGORI_MAP[selectedHareket.kategori] || {}).icon || 'bi-circle'}`}></i>
                      </div>
                      <span className={`p2-detail__amount ${selectedHareket.tur === 'giris' ? 'p2-detail__amount--green' : 'p2-detail__amount--red'}`}>
                        {selectedHareket.tur === 'giris' ? '+' : '-'}{TL(selectedHareket.tutar)} TL
                      </span>
                    </div>
                    <div className="p2-detail__rows">
                      <div className="p2-detail__row">
                        <span className="p2-detail__label">Cari</span>
                        <span className="p2-detail__val">{selectedHareket.cari}</span>
                      </div>
                      <div className="p2-detail__row">
                        <span className="p2-detail__label">Aciklama</span>
                        <span className="p2-detail__val">{selectedHareket.aciklama}</span>
                      </div>
                      <div className="p2-detail__row">
                        <span className="p2-detail__label">Kategori</span>
                        <span className="p2-detail__val">
                          <span className="p2-feed__badge">{selectedHareket.kategori}</span>
                        </span>
                      </div>
                      <div className="p2-detail__row">
                        <span className="p2-detail__label">Tarih</span>
                        <span className="p2-detail__val">{tarihFormat(selectedHareket.tarih)}</span>
                      </div>
                      <div className="p2-detail__row">
                        <span className="p2-detail__label">Tur</span>
                        <span className="p2-detail__val">
                          <span className={`p2-tur-pill ${selectedHareket.tur === 'giris' ? 'p2-tur-pill--green' : 'p2-tur-pill--red'}`}>
                            <i className={`bi ${selectedHareket.tur === 'giris' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`}></i>
                            {selectedHareket.tur === 'giris' ? 'Giris' : 'Cikis'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p2-form">
                    <div className="p2-form__group">
                      <label className="p2-form__label">Cari Hesap</label>
                      <input type="text" className="p2-form__input" placeholder="Cari hesap adi..." />
                    </div>
                    <div className="p2-form__group">
                      <label className="p2-form__label">Aciklama</label>
                      <input type="text" className="p2-form__input" placeholder="Islem aciklamasi..." />
                    </div>
                    <div className="p2-form__pair">
                      <div className="p2-form__group" style={{ flex: 1 }}>
                        <label className="p2-form__label">Tutar (TL)</label>
                        <input type="number" className="p2-form__input" placeholder="0,00" />
                      </div>
                      <div className="p2-form__group" style={{ flex: 1 }}>
                        <label className="p2-form__label">Tur</label>
                        <select className="p2-form__input">
                          <option value="giris">Giris</option>
                          <option value="cikis">Cikis</option>
                        </select>
                      </div>
                    </div>
                    <div className="p2-form__group">
                      <label className="p2-form__label">Kategori</label>
                      <select className="p2-form__input">
                        {Object.keys(KATEGORI_MAP).map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                    <div className="p2-form__group">
                      <label className="p2-form__label">Tarih</label>
                      <input type="date" className="p2-form__input" defaultValue="2026-03-15" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p2-modal__foot">
                <button
                  className="p2-btn p2-btn--ghost"
                  onClick={() => { setShowModal(false); setSelectedHareket(null) }}
                >
                  {selectedHareket ? 'Kapat' : 'Iptal'}
                </button>
                {!selectedHareket && (
                  <button className="p2-btn p2-btn--primary">
                    <i className="bi bi-check-lg"></i>
                    Kaydet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// CSS — Self-contained, p2- prefix
// ─────────────────────────────────────────────
const CSS_CONTENT = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ─── Page Shell ─── */
.p2-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
  background: #f7f5f0;
  color: #162016;
  min-height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 32px 96px;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.p2-page--mounted {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Header ─── */
.p2-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 56px;
}
.p2-header__brand {
  display: flex;
  align-items: center;
  gap: 18px;
}
.p2-header__logo {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(145deg, #1b6b4a 0%, #0d2818 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #34d399;
  font-size: 1.6rem;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(27,107,74,0.18);
}
.p2-header__title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0d2818;
  margin: 0;
  line-height: 1.25;
  letter-spacing: -0.3px;
}
.p2-header__subtitle {
  font-size: 0.82rem;
  color: #7a8a76;
  margin: 4px 0 0;
  font-weight: 400;
}

/* ─── Pill Buttons ─── */
.p2-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 30px;
  border-radius: 100px;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  min-height: 44px;
  font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
  white-space: nowrap;
}
.p2-btn--primary {
  background: #1b6b4a;
  color: #fff;
  box-shadow: 0 3px 12px rgba(27,107,74,0.2);
}
.p2-btn--primary:hover {
  background: #145639;
  box-shadow: 0 6px 24px rgba(27,107,74,0.28);
  transform: translateY(-1px);
}
.p2-btn--primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(27,107,74,0.18);
}
.p2-btn--primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(27,107,74,0.25);
}
.p2-btn--ghost {
  background: transparent;
  color: #7a8a76;
  border: 1.5px solid #d5ddd3;
}
.p2-btn--ghost:hover {
  background: #e6f7ef;
  color: #1b6b4a;
  border-color: #1b6b4a;
}

/* ─── Hero KPI Section ─── */
.p2-hero {
  position: relative;
  background: #ffffff;
  border-radius: 28px;
  border: 1px solid #d5ddd3;
  padding: 64px 40px 52px;
  margin-bottom: 40px;
  overflow: hidden;
  text-align: center;
  box-shadow: 0 1px 3px rgba(13,40,24,0.04);
}
.p2-hero__pattern {
  position: absolute;
  inset: 0;
  opacity: 0.028;
  background:
    repeating-linear-gradient(
      60deg,
      transparent,
      transparent 18px,
      #1b6b4a 18px,
      #1b6b4a 19px
    ),
    repeating-linear-gradient(
      -60deg,
      transparent,
      transparent 18px,
      #1b6b4a 18px,
      #1b6b4a 19px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 24px,
      #34d399 24px,
      #34d399 25px
    );
  pointer-events: none;
}
.p2-hero__content {
  position: relative;
  z-index: 1;
}
.p2-hero__label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #7a8a76;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 16px;
  background: #e6f7ef;
  padding: 6px 18px;
  border-radius: 100px;
}
.p2-hero__amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  margin-bottom: 36px;
}
.p2-hero__value {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -2px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.p2-hero__value--positive { color: #10b981; }
.p2-hero__value--negative { color: #ef4444; }
.p2-hero__currency {
  font-size: 1.3rem;
  font-weight: 700;
  color: #99a896;
}
.p2-hero__row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 36px;
}
.p2-hero__sub {
  display: flex;
  align-items: center;
  gap: 10px;
}
.p2-hero__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.p2-hero__dot--green { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.35); }
.p2-hero__dot--red   { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.35); }
.p2-hero__sub-label {
  font-size: 0.82rem;
  color: #99a896;
  font-weight: 500;
}
.p2-hero__sub-value {
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.p2-hero__sub-value--green { color: #10b981; }
.p2-hero__sub-value--red   { color: #ef4444; }
.p2-hero__divider {
  width: 1px;
  height: 28px;
  background: #d5ddd3;
}

/* ─── Section Title ─── */
.p2-section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0d2818;
  margin: 0 0 28px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.p2-section-title i {
  color: #1b6b4a;
  font-size: 1.25rem;
}

/* ─── Bar Chart ─── */
.p2-chart {
  background: #ffffff;
  border-radius: 28px;
  border: 1px solid #d5ddd3;
  padding: 40px 36px 28px;
  margin-bottom: 40px;
  box-shadow: 0 1px 3px rgba(13,40,24,0.04);
}
.p2-chart__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.p2-chart__col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.p2-chart__bars {
  display: flex;
  gap: 5px;
  align-items: flex-end;
  height: 160px;
  width: 100%;
  justify-content: center;
}
.p2-chart__bar {
  width: 38%;
  max-width: 30px;
  min-height: 0;
  border-radius: 8px 8px 3px 3px;
  position: relative;
  transition: height 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.p2-chart__bar--green {
  background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
}
.p2-chart__bar--red {
  background: linear-gradient(180deg, #fca5a5 0%, #ef4444 100%);
}
.p2-chart__bar-tip {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.58rem;
  font-weight: 700;
  color: #7a8a76;
  white-space: nowrap;
  letter-spacing: -0.2px;
}
.p2-chart__day {
  font-size: 0.72rem;
  font-weight: 600;
  color: #99a896;
  letter-spacing: -0.2px;
}
.p2-chart__legend {
  display: flex;
  justify-content: center;
  gap: 28px;
  padding-top: 12px;
  border-top: 1px solid #e6f7ef;
}
.p2-chart__legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.78rem;
  color: #7a8a76;
  font-weight: 500;
}
.p2-chart__legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}
.p2-chart__legend-swatch--green { background: #10b981; }
.p2-chart__legend-swatch--red   { background: #ef4444; }

/* ─── Tabs (pill bar) ─── */
.p2-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  padding: 5px;
  background: #ffffff;
  border-radius: 100px;
  border: 1px solid #d5ddd3;
  box-shadow: 0 1px 3px rgba(13,40,24,0.04);
}
.p2-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 20px;
  border-radius: 100px;
  border: none;
  background: transparent;
  color: #7a8a76;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.25s ease;
  min-height: 44px;
  font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
}
.p2-tab:hover {
  color: #1b6b4a;
  background: #e6f7ef;
}
.p2-tab--active {
  background: #1b6b4a;
  color: #ffffff;
  box-shadow: 0 3px 12px rgba(27,107,74,0.22);
}
.p2-tab--active:hover {
  background: #145639;
  color: #ffffff;
}

/* ─── Feed (Instagram-style vertical flow) ─── */
.p2-feed {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 40px;
}
.p2-feed__item {
  display: flex;
  align-items: center;
  gap: 18px;
  background: #ffffff;
  border: 1px solid #d5ddd3;
  border-radius: 22px;
  padding: 22px 26px;
  cursor: pointer;
  transition: all 0.25s ease;
  animation: p2-slideUp 0.45s ease forwards;
  opacity: 0;
  min-height: 44px;
  box-shadow: 0 1px 3px rgba(13,40,24,0.03);
}
.p2-feed__item:hover {
  border-color: #bec8bc;
  box-shadow: 0 8px 32px rgba(13,40,24,0.07);
  transform: translateY(-3px);
}
.p2-feed__item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(27,107,74,0.25);
}
@keyframes p2-slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.p2-feed__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.p2-feed__item:hover .p2-feed__avatar {
  transform: scale(1.08);
}
.p2-feed__body {
  flex: 1;
  min-width: 0;
}
.p2-feed__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 5px;
}
.p2-feed__cari {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0d2818;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.p2-feed__tutar {
  font-size: 1.05rem;
  font-weight: 800;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.3px;
}
.p2-feed__tutar--green { color: #10b981; }
.p2-feed__tutar--red   { color: #ef4444; }
.p2-feed__bottom {
  margin-bottom: 8px;
}
.p2-feed__aciklama {
  font-size: 0.8rem;
  color: #7a8a76;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  line-height: 1.4;
}
.p2-feed__meta {
  display: flex;
  align-items: center;
  gap: 12px;
}
.p2-feed__badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  border-radius: 100px;
  background: #fef3c7;
  border: 1px solid #d4940a;
  color: #d4940a;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.6;
}
.p2-feed__tarih {
  font-size: 0.72rem;
  color: #99a896;
  font-weight: 500;
}
.p2-feed__arrow {
  color: #d5ddd3;
  font-size: 1rem;
  flex-shrink: 0;
  transition: all 0.25s ease;
}
.p2-feed__item:hover .p2-feed__arrow {
  color: #1b6b4a;
  transform: translateX(3px);
}

/* ─── Summary Section ─── */
.p2-summary {
  background: #ffffff;
  border-radius: 28px;
  border: 1px solid #d5ddd3;
  padding: 36px;
  box-shadow: 0 1px 3px rgba(13,40,24,0.04);
}
.p2-summary__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}
.p2-summary__card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 18px;
  background: #f7f5f0;
  border: 1px solid #e6f7ef;
}
.p2-summary__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}
.p2-summary__icon--green {
  background: #ecfdf5;
  color: #10b981;
}
.p2-summary__icon--red {
  background: #fef2f2;
  color: #ef4444;
}
.p2-summary__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.p2-summary__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #99a896;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.p2-summary__value {
  font-size: 1.1rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.p2-summary__value--green { color: #10b981; }
.p2-summary__value--red   { color: #ef4444; }
.p2-summary__net {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-radius: 18px;
  background: #0d2818;
}
.p2-summary__net-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #99a896;
}
.p2-summary__net-value {
  font-size: 1.25rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.p2-summary__net-value--green { color: #34d399; }
.p2-summary__net-value--red   { color: #fca5a5; }

/* ─── Modal ─── */
.p2-overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 40, 24, 0.42);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
  animation: p2-fadeIn 0.2s ease;
}
@keyframes p2-fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.p2-modal {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 88vh;
  overflow-y: auto;
  box-shadow: 0 32px 80px rgba(13,40,24,0.22);
  animation: p2-scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes p2-scaleIn {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
.p2-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 36px 0;
}
.p2-modal__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0d2818;
  margin: 0;
}
.p2-modal__close {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #e6f7ef;
  color: #1b6b4a;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.p2-modal__close:hover {
  background: #1b6b4a;
  color: #ffffff;
}
.p2-modal__body {
  padding: 32px 36px;
}
.p2-modal__foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 36px 32px;
}

/* ─── Detail View (modal content) ─── */
.p2-detail__hero {
  text-align: center;
  margin-bottom: 36px;
}
.p2-detail__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 18px;
}
.p2-detail__amount {
  display: block;
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.8px;
}
.p2-detail__amount--green { color: #10b981; }
.p2-detail__amount--red   { color: #ef4444; }
.p2-detail__rows {
  display: flex;
  flex-direction: column;
}
.p2-detail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #e6f7ef;
  gap: 16px;
}
.p2-detail__row:last-child { border-bottom: none; }
.p2-detail__label {
  font-size: 0.82rem;
  font-weight: 500;
  color: #99a896;
  flex-shrink: 0;
}
.p2-detail__val {
  font-size: 0.9rem;
  font-weight: 600;
  color: #162016;
  text-align: right;
  max-width: 65%;
  word-break: break-word;
}
.p2-tur-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 16px;
  border-radius: 100px;
  font-size: 0.78rem;
  font-weight: 700;
}
.p2-tur-pill--green { background: #ecfdf5; color: #10b981; }
.p2-tur-pill--red   { background: #fef2f2; color: #ef4444; }

/* ─── Form (modal content) ─── */
.p2-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.p2-form__group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.p2-form__pair {
  display: flex;
  gap: 16px;
}
.p2-form__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #7a8a76;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.p2-form__input {
  width: 100%;
  padding: 14px 20px;
  border: 1.5px solid #d5ddd3;
  border-radius: 16px;
  font-family: inherit;
  font-size: 0.9rem;
  color: #162016;
  background: #ffffff;
  transition: all 0.2s ease;
  min-height: 44px;
  font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
  box-sizing: border-box;
}
.p2-form__input:hover {
  border-color: #bec8bc;
}
.p2-form__input:focus {
  outline: none;
  border-color: #1b6b4a;
  box-shadow: 0 0 0 4px rgba(27,107,74,0.25);
}
.p2-form__input::placeholder {
  color: #99a896;
}

/* ─── Responsive: 992px ─── */
@media (max-width: 992px) {
  .p2-page {
    padding: 36px 24px 72px;
  }
  .p2-hero {
    padding: 52px 32px 44px;
  }
  .p2-hero__value {
    font-size: 2.6rem;
  }
  .p2-chart {
    padding: 36px 28px 24px;
  }
}

/* ─── Responsive: 768px ─── */
@media (max-width: 768px) {
  .p2-page {
    padding: 28px 18px 56px;
  }
  .p2-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 40px;
  }
  .p2-btn--primary {
    width: 100%;
    justify-content: center;
  }
  .p2-hero {
    padding: 40px 24px 36px;
    border-radius: 22px;
  }
  .p2-hero__value {
    font-size: 2.2rem;
    letter-spacing: -1.5px;
  }
  .p2-hero__row {
    flex-direction: column;
    gap: 14px;
  }
  .p2-hero__divider {
    width: 56px;
    height: 1px;
  }
  .p2-chart {
    padding: 28px 20px 20px;
    border-radius: 22px;
  }
  .p2-chart__bars {
    height: 110px;
  }
  .p2-chart__bar-tip {
    display: none;
  }
  .p2-feed__item {
    padding: 18px 20px;
    border-radius: 18px;
    gap: 14px;
  }
  .p2-feed__avatar {
    width: 48px;
    height: 48px;
    font-size: 1.15rem;
  }
  .p2-summary__row {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .p2-summary {
    padding: 28px 24px;
    border-radius: 22px;
  }
  .p2-modal__head {
    padding: 28px 24px 0;
  }
  .p2-modal__body {
    padding: 28px 24px;
  }
  .p2-modal__foot {
    padding: 0 24px 28px;
  }
  .p2-form__pair {
    flex-direction: column;
    gap: 22px;
  }
}

/* ─── Responsive: 480px ─── */
@media (max-width: 480px) {
  .p2-page {
    padding: 20px 14px 44px;
  }
  .p2-header__logo {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    font-size: 1.3rem;
  }
  .p2-header__title {
    font-size: 1.15rem;
  }
  .p2-header__subtitle {
    font-size: 0.75rem;
  }
  .p2-hero {
    padding: 32px 18px 28px;
    border-radius: 18px;
  }
  .p2-hero__value {
    font-size: 1.85rem;
    letter-spacing: -1px;
  }
  .p2-hero__currency {
    font-size: 1rem;
  }
  .p2-hero__sub-value {
    font-size: 0.88rem;
  }
  .p2-chart {
    border-radius: 18px;
    padding: 24px 14px 18px;
  }
  .p2-chart__grid {
    gap: 6px;
  }
  .p2-chart__day {
    font-size: 0.6rem;
  }
  .p2-chart__bars {
    height: 80px;
  }
  .p2-tabs {
    border-radius: 18px;
    padding: 4px;
  }
  .p2-tab {
    padding: 11px 10px;
    font-size: 0.78rem;
    gap: 5px;
    border-radius: 14px;
  }
  .p2-feed__item {
    padding: 16px 14px;
    gap: 12px;
    border-radius: 16px;
  }
  .p2-feed__avatar {
    width: 44px;
    height: 44px;
    font-size: 1.05rem;
  }
  .p2-feed__cari {
    font-size: 0.88rem;
  }
  .p2-feed__tutar {
    font-size: 0.9rem;
  }
  .p2-feed__aciklama {
    font-size: 0.72rem;
  }
  .p2-feed__arrow {
    display: none;
  }
  .p2-summary {
    padding: 22px 16px;
    border-radius: 18px;
  }
  .p2-summary__card {
    padding: 16px;
    border-radius: 14px;
    gap: 12px;
  }
  .p2-summary__icon {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }
  .p2-summary__value {
    font-size: 0.95rem;
  }
  .p2-summary__net {
    padding: 16px 18px;
    border-radius: 14px;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  .p2-summary__net-value {
    font-size: 1.1rem;
  }
  .p2-modal {
    border-radius: 18px;
    max-height: 92vh;
  }
  .p2-modal__head {
    padding: 24px 20px 0;
  }
  .p2-modal__body {
    padding: 24px 20px;
  }
  .p2-modal__foot {
    padding: 0 20px 24px;
  }
  .p2-detail__avatar {
    width: 64px;
    height: 64px;
    font-size: 1.6rem;
  }
  .p2-detail__amount {
    font-size: 1.65rem;
  }
}
`
