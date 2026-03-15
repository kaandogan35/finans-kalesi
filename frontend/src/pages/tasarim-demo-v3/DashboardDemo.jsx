/**
 * Finans Kalesi — Dashboard Demo
 * ikas DNA: Siyah (#14141a) + İndigo (#3034ff)
 * frontend-design skill ile tasarlandı.
 * Auth gerektirmez — /tasarim-demo-v3/dashboard
 */

import { useState, useEffect, useRef } from 'react'

// ─── Para format ───
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const TLShort = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toString()
}

// ─── Animated Number ───
function useAnimatedNumber(target, duration = 900) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const prevTarget = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const initial = prevTarget.current
    prevTarget.current = target
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setVal(initial + (target - initial) * eased)
      if (progress < 1) ref.current = requestAnimationFrame(step)
    }
    ref.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(ref.current)
  }, [target])
  return val
}

// ─── Mock Data ───
const KPIS = [
  { id: 'alacak', label: 'Toplam Alacak', value: 847500, icon: 'bi-arrow-down-left', color: '#0a6e52', trend: '+12.4%', trendUp: true },
  { id: 'borc', label: 'Toplam Borç', value: 523200, icon: 'bi-arrow-up-right', color: '#b41c1c', trend: '+3.8%', trendUp: false },
  { id: 'kasa', label: 'Kasa Bakiye', value: 324300, icon: 'bi-safe-fill', color: '#1a4d8f', trend: '+8.1%', trendUp: true },
  { id: 'cek', label: 'Açık Çek/Senet', value: 215000, icon: 'bi-file-earmark-text', color: '#1e40af', trend: '12 adet', trendUp: null },
]

const HAREKETLER = [
  { id: 1, cari: 'Demir-Çelik Ticaret A.Ş.', aciklama: 'Fatura #1247', tarih: '15 Mar', tutar: 84500, tur: 'giris' },
  { id: 2, cari: 'Personel Maaşları', aciklama: 'Mart 2026', tarih: '14 Mar', tutar: 127800, tur: 'cikis' },
  { id: 3, cari: 'Atlas Hırdavat', aciklama: 'Fatura #892', tarih: '14 Mar', tutar: 23400, tur: 'giris' },
  { id: 4, cari: 'TEDAŞ', aciklama: 'Elektrik — Şubat', tarih: '13 Mar', tutar: 4850, tur: 'cikis' },
  { id: 5, cari: 'Güven İnşaat', aciklama: 'Proje Avans #3', tarih: '13 Mar', tutar: 150000, tur: 'giris' },
  { id: 6, cari: 'Erdemir', aciklama: 'Çelik Rulo 4mm', tarih: '12 Mar', tutar: 210000, tur: 'cikis' },
]

const YAKLASAN_ODEMELER = [
  { id: 1, cari: 'Yılmaz Metal San.', tutar: 67200, gun: 3, tip: 'Çek' },
  { id: 2, cari: 'SGK', tutar: 42300, gun: 5, tip: 'Prim' },
  { id: 3, cari: 'Kira — Depo', tutar: 35000, gun: 7, tip: 'Kira' },
  { id: 4, cari: 'KDV Ödemesi', tutar: 28900, gun: 12, tip: 'Vergi' },
]

const AYLIK_AKIS = [
  { ay: 'Eki', giris: 420000, cikis: 380000 },
  { ay: 'Kas', giris: 510000, cikis: 440000 },
  { ay: 'Ara', giris: 380000, cikis: 520000 },
  { ay: 'Oca', giris: 490000, cikis: 410000 },
  { ay: 'Şub', giris: 560000, cikis: 470000 },
  { ay: 'Mar', giris: 375500, cikis: 428650 },
]

const SIDEBAR_MENU = [
  { icon: 'bi-speedometer2', label: 'Dashboard', active: true },
  { icon: 'bi-people-fill', label: 'Cari Hesaplar' },
  { icon: 'bi-file-earmark-text-fill', label: 'Çek / Senet' },
  { icon: 'bi-credit-card-2-fill', label: 'Ödemeler' },
  { icon: 'bi-safe-fill', label: 'Kasa' },
  { icon: 'bi-calculator', label: 'Vade Hesaplayıcı' },
]

export default function DashboardDemo() {
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Modal: ESC ile kapat + body scroll lock
  useEffect(() => {
    if (!modalOpen) return
    document.body.style.overflow = 'hidden'
    const handleKey = (e) => { if (e.key === 'Escape') setModalOpen(false) }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [modalOpen])

  // Animated KPI values
  const animAlacak = useAnimatedNumber(KPIS[0].value)
  const animBorc = useAnimatedNumber(KPIS[1].value)
  const animKasa = useAnimatedNumber(KPIS[2].value)
  const animCek = useAnimatedNumber(KPIS[3].value)
  const animValues = [animAlacak, animBorc, animKasa, animCek]

  // Chart max
  const chartMax = Math.max(...AYLIK_AKIS.flatMap(a => [a.giris, a.cikis]))

  return (
    <div className="db-root">
      <style>{CSS}</style>

      {/* ═══ SIDEBAR ═══ */}
      {sidebarOpen && (
        <div className="db-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
      <aside className={`db-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="db-logo">
          <div className="db-logo-icon">
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <div>
            <div className="db-logo-text">Finans Kalesi</div>
            <div className="db-logo-sub">Varlık Yönetimi</div>
          </div>
        </div>

        {/* Menu */}
        <nav className="db-nav">
          <div className="db-nav-label">MENÜ</div>
          {SIDEBAR_MENU.map((item) => (
            <button
              key={item.label}
              className={`db-nav-item ${activeMenu === item.label ? 'active' : ''}`}
              onClick={() => { setActiveMenu(item.label); setSidebarOpen(false) }}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
              {item.label === 'Çek / Senet' && (
                <span className="db-nav-badge">12</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="db-sidebar-bottom">
          <div className="db-user">
            <div className="db-user-avatar">KD</div>
            <div>
              <div className="db-user-name">Kaan Doğan</div>
              <div className="db-user-role">Yönetici</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="db-main">
        {/* Header */}
        <header className="db-header">
          <div className="db-header-left">
            <button className="db-hamburger" onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-list"></i>
            </button>
            <div>
              <h1 className="db-page-title">Dashboard</h1>
              <p className="db-page-subtitle">Finansal durumunuzun genel görünümü</p>
            </div>
          </div>
          <div className="db-header-right">
            <button className="db-icon-btn">
              <i className="bi bi-bell"></i>
              <span className="db-notif-dot"></span>
            </button>
            <button className="db-btn db-btn-dark" onClick={() => setModalOpen(true)}>
              <i className="bi bi-plus-lg"></i>
              <span className="db-hide-sm">Hızlı İşlem</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="db-content">

          {/* ─── KPI ROW ─── */}
          <div className="db-kpi-row">
            {KPIS.map((kpi, i) => (
              <div
                key={kpi.id}
                className={`db-kpi ${mounted ? 'db-reveal' : ''}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="db-kpi-top">
                  <div className="db-kpi-icon" style={{ background: `${kpi.color}12`, color: kpi.color }}>
                    <i className={`bi ${kpi.icon}`}></i>
                  </div>
                  {kpi.trendUp !== null && (
                    <span className={`db-kpi-trend ${kpi.trendUp ? 'up' : 'down'}`}>
                      <i className={`bi ${kpi.trendUp ? 'bi-trending-up' : 'bi-trending-down'}`} style={{ fontSize: 11 }}></i>
                      {kpi.trend}
                    </span>
                  )}
                  {kpi.trendUp === null && (
                    <span className="db-kpi-trend neutral">{kpi.trend}</span>
                  )}
                </div>
                <div className="db-kpi-value" style={{ color: kpi.color }}>
                  {TL(animValues[i])}
                  <span className="db-kpi-currency"> ₺</span>
                </div>
                <div className="db-kpi-label">{kpi.label}</div>
                {/* Mini sparkline */}
                <div className="db-kpi-spark">
                  <svg viewBox="0 0 80 24" className="db-spark-svg">
                    <polyline
                      points={kpi.trendUp === true ? "0,20 15,16 30,18 45,12 60,14 75,6" :
                              kpi.trendUp === false ? "0,8 15,10 30,6 45,14 60,12 75,18" :
                              "0,12 15,14 30,10 45,16 60,8 75,14"}
                      fill="none"
                      stroke={kpi.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.65"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* ─── NET POZİSYON BANDI ─── */}
          <div className={`db-net-band ${mounted ? 'db-reveal' : ''}`} style={{ animationDelay: '400ms' }}>
            <div className="db-net-left">
              <i className="bi bi-graph-up-arrow" style={{ color: '#0a6e52', fontSize: 18 }}></i>
              <div>
                <span className="db-net-label">Net Pozisyon</span>
                <span className="db-net-value" style={{ color: '#0a6e52' }}>
                  +{TL(KPIS[0].value - KPIS[1].value)} ₺
                </span>
              </div>
            </div>
            <div className="db-net-bar-container">
              <div className="db-net-bar">
                <div className="db-net-bar-fill" style={{
                  width: `${(KPIS[0].value / (KPIS[0].value + KPIS[1].value)) * 100}%`
                }}></div>
              </div>
              <div className="db-net-bar-labels">
                <span>Alacak %{Math.round((KPIS[0].value / (KPIS[0].value + KPIS[1].value)) * 100)}</span>
                <span>Borç %{Math.round((KPIS[1].value / (KPIS[0].value + KPIS[1].value)) * 100)}</span>
              </div>
            </div>
          </div>

          {/* ─── ÇİFT KOLON: GRAFİK + YAKLASAN ─── */}
          <div className="db-two-col">
            {/* Sol: Aylık Akış Grafiği */}
            <div className={`db-card db-chart-card ${mounted ? 'db-reveal' : ''}`} style={{ animationDelay: '500ms' }}>
              <div className="db-card-header">
                <div>
                  <h3 className="db-card-title">Aylık Nakit Akışı</h3>
                  <p className="db-card-subtitle">Son 6 ayın giriş / çıkış karşılaştırması</p>
                </div>
                <div className="db-chart-legend">
                  <span className="db-legend-item">
                    <span className="db-legend-dot" style={{ background: '#0a6e52' }}></span> Giriş
                  </span>
                  <span className="db-legend-item">
                    <span className="db-legend-dot" style={{ background: '#b41c1c' }}></span> Çıkış
                  </span>
                </div>
              </div>
              <div className="db-chart">
                {AYLIK_AKIS.map((ay, i) => (
                  <div key={ay.ay} className="db-chart-col">
                    <div className="db-chart-bars">
                      <div
                        className="db-chart-bar giris"
                        style={{
                          height: `${(ay.giris / chartMax) * 100}%`,
                          animationDelay: `${600 + i * 80}ms`
                        }}
                        title={`Giriş: ${TL(ay.giris)} ₺`}
                      >
                        <span className="db-chart-tooltip">{TLShort(ay.giris)}</span>
                      </div>
                      <div
                        className="db-chart-bar cikis"
                        style={{
                          height: `${(ay.cikis / chartMax) * 100}%`,
                          animationDelay: `${650 + i * 80}ms`
                        }}
                        title={`Çıkış: ${TL(ay.cikis)} ₺`}
                      >
                        <span className="db-chart-tooltip">{TLShort(ay.cikis)}</span>
                      </div>
                    </div>
                    <span className="db-chart-label">{ay.ay}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ: Yaklaşan Ödemeler */}
            <div className={`db-card db-upcoming-card ${mounted ? 'db-reveal' : ''}`} style={{ animationDelay: '600ms' }}>
              <div className="db-card-header">
                <div>
                  <h3 className="db-card-title">Yaklaşan Ödemeler</h3>
                  <p className="db-card-subtitle">Önümüzdeki 14 gün</p>
                </div>
                <button className="db-btn-ghost">Tümü →</button>
              </div>
              <div className="db-upcoming-list">
                {YAKLASAN_ODEMELER.map((odeme, i) => (
                  <div key={odeme.id} className="db-upcoming-item">
                    <div className="db-upcoming-left">
                      <div className={`db-upcoming-urgency ${odeme.gun <= 3 ? 'critical' : odeme.gun <= 7 ? 'warning' : 'normal'}`}>
                        <span className="db-upcoming-day">{odeme.gun}</span>
                        <span className="db-upcoming-day-label">gün</span>
                      </div>
                      <div>
                        <div className="db-upcoming-cari">{odeme.cari}</div>
                        <div className="db-upcoming-tip">{odeme.tip}</div>
                      </div>
                    </div>
                    <div className="db-upcoming-amount">
                      {TL(odeme.tutar)} ₺
                    </div>
                  </div>
                ))}
              </div>
              <div className="db-upcoming-total">
                <span>Toplam</span>
                <span className="db-upcoming-total-val">
                  {TL(YAKLASAN_ODEMELER.reduce((t, o) => t + o.tutar, 0))} ₺
                </span>
              </div>
            </div>
          </div>

          {/* ─── SON HAREKETLER ─── */}
          <div className={`db-card ${mounted ? 'db-reveal' : ''}`} style={{ animationDelay: '700ms' }}>
            <div className="db-card-header">
              <div>
                <h3 className="db-card-title">Son Hareketler</h3>
                <p className="db-card-subtitle">Son 7 günde gerçekleşen işlemler</p>
              </div>
              <button className="db-btn db-btn-secondary">
                <i className="bi bi-funnel" style={{ fontSize: 14 }}></i>
                Filtrele
              </button>
            </div>
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>İşlem</th>
                    <th>Açıklama</th>
                    <th>Tarih</th>
                    <th style={{ textAlign: 'right' }}>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {HAREKETLER.map((h, i) => (
                    <tr key={h.id} className={mounted ? 'db-row-reveal' : ''} style={{ animationDelay: `${800 + i * 60}ms` }}>
                      <td>
                        <div className="db-txn-cell">
                          <div className={`db-txn-icon ${h.tur}`}>
                            <i className={`bi ${h.tur === 'giris' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`}></i>
                          </div>
                          <span className="db-txn-cari">{h.cari}</span>
                        </div>
                      </td>
                      <td><span className="db-txn-desc">{h.aciklama}</span></td>
                      <td><span className="db-txn-date">{h.tarih}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`db-txn-amount ${h.tur}`}>
                          {h.tur === 'giris' ? '+' : '-'}{TL(h.tutar)} ₺
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* ═══ MODAL ═══ */}
      {modalOpen && (
        <div className="db-modal-overlay">
          <div className="db-modal">
            {/* Header — siyah #14141a */}
            <div className="db-modal-header">
              <h2 className="db-modal-title">
                <i className="bi bi-plus-circle-fill"></i>
                Hızlı İşlem
              </h2>
              <button className="db-modal-close" onClick={() => setModalOpen(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Body */}
            <div className="db-modal-body">
              <div className="db-modal-field">
                <label className="db-modal-label">İşlem Türü</label>
                <div className="db-modal-radio-group">
                  <label className="db-modal-radio active">
                    <i className="bi bi-arrow-down-left" style={{ color: 'var(--green)' }}></i>
                    Tahsilat
                  </label>
                  <label className="db-modal-radio">
                    <i className="bi bi-arrow-up-right" style={{ color: 'var(--red)' }}></i>
                    Ödeme
                  </label>
                  <label className="db-modal-radio">
                    <i className="bi bi-arrow-left-right" style={{ color: 'var(--indigo)' }}></i>
                    Virman
                  </label>
                </div>
              </div>

              <div className="db-modal-field">
                <label className="db-modal-label">Cari Hesap</label>
                <div className="db-modal-input-wrapper">
                  <i className="bi bi-search"></i>
                  <input type="text" className="db-modal-input" placeholder="Cari hesap ara..." />
                </div>
              </div>

              <div className="db-modal-row">
                <div className="db-modal-field" style={{ flex: 1 }}>
                  <label className="db-modal-label">Tutar</label>
                  <div className="db-modal-input-wrapper">
                    <span className="db-modal-input-prefix">₺</span>
                    <input type="text" className="db-modal-input has-prefix" placeholder="0,00" />
                  </div>
                </div>
                <div className="db-modal-field" style={{ flex: 1 }}>
                  <label className="db-modal-label">Tarih</label>
                  <div className="db-modal-input-wrapper">
                    <i className="bi bi-calendar3"></i>
                    <input type="text" className="db-modal-input" placeholder="15.03.2026" />
                  </div>
                </div>
              </div>

              <div className="db-modal-field">
                <label className="db-modal-label">Açıklama <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsiyonel)</span></label>
                <textarea className="db-modal-textarea" placeholder="Açıklama giriniz..." rows={3}></textarea>
              </div>
            </div>

            {/* Footer */}
            <div className="db-modal-footer">
              <button className="db-btn db-btn-secondary" onClick={() => setModalOpen(false)}>
                İptal
              </button>
              <button className="db-btn db-btn-primary">
                <i className="bi bi-check-lg"></i>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════
const CSS = `
  /* ─── VARIABLES ─── */
  .db-root {
    --indigo: #b0d12a;
    --indigo-hover: #9abb1f;
    --indigo-light: #c4e04e;
    --indigo-bg: #f4f9e4;
    --black: #14141a;
    --black-hover: #2e2e33;
    --black-border: #2a2a30;
    --bg: #f6f7fb;
    --card: #ffffff;
    --border: #e3e8ef;
    --border-hover: #cdd5df;
    --text: #121926;
    --text-secondary: #697586;
    --text-muted: #9aa4b2;
    --green: #0a6e52;
    --green-light: #e8f5ef;
    --red: #b41c1c;
    --red-light: #fdf1f1;
    --blue: #1e40af;
    --amber: #f59e0b;

    font-family: 'Inter', sans-serif;
    font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
    background: var(--bg);
    min-height: 100vh;
    display: flex;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  /* ─── SIDEBAR ─── */
  .db-sidebar {
    width: 260px;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    background: var(--black);
    display: flex;
    flex-direction: column;
    z-index: 1100;
    padding: 0;
    overflow-y: auto;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .db-sidebar::-webkit-scrollbar { width: 0; }

  .db-sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 1050;
    animation: dbFade 0.2s ease;
  }

  @media (max-width: 991px) {
    .db-sidebar {
      transform: translateX(-100%);
    }
    .db-sidebar.open {
      transform: translateX(0);
    }
    .db-sidebar-overlay {
      display: block;
    }
  }

  /* Logo */
  .db-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 20px 32px;
  }
  .db-logo-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--indigo);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--black);
    font-size: 18px;
    box-shadow: 0 4px 12px rgba(176,209,42,0.35);
  }
  .db-logo-text {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.32px;
  }
  .db-logo-sub {
    font-size: 11px;
    color: #ECECED;
    letter-spacing: -0.22px;
    margin-top: -1px;
  }

  /* Nav */
  .db-nav {
    padding: 0 12px;
    flex: 1;
  }
  .db-nav-label {
    font-size: 10px;
    font-weight: 700;
    color: #ECECED;
    letter-spacing: 1.2px;
    padding: 0 10px;
    margin-bottom: 8px;
  }
  .db-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #ECECED;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.28px;
    cursor: pointer;
    transition: all 200ms ease;
    min-height: 44px;
    text-align: left;
    font-family: inherit;
    font-feature-settings: inherit;
    margin-bottom: 2px;
  }
  .db-nav-item i {
    font-size: 18px;
    width: 22px;
    text-align: center;
  }
  .db-nav-item:hover {
    background: rgba(255,255,255,0.06);
    color: #ffffff;
  }
  .db-nav-item.active {
    background: var(--indigo);
    color: var(--black);
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(176,209,42,0.3);
  }
  .db-nav-item.active i {
    color: var(--black);
  }
  .db-nav-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 700;
    background: rgba(255,255,255,0.12);
    color: #ECECED;
    padding: 2px 8px;
    border-radius: 10px;
  }
  .db-nav-item.active .db-nav-badge {
    background: rgba(20,20,26,0.15);
    color: var(--black);
  }

  /* Sidebar Bottom */
  .db-sidebar-bottom {
    padding: 20px;
    border-top: 1px solid rgba(255,255,255,0.06);
    margin-top: auto;
  }
  .db-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .db-user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--indigo);
    color: var(--black);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
  }
  .db-user-name {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.26px;
  }
  .db-user-role {
    font-size: 11px;
    color: #ECECED;
  }

  /* ─── MAIN ─── */
  .db-main {
    flex: 1;
    margin-left: 260px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  @media (max-width: 991px) {
    .db-main { margin-left: 0; }
  }

  /* Header */
  .db-header {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    background: rgba(246,247,251,0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }
  @media (max-width: 768px) {
    .db-header { padding: 12px 16px; }
  }
  .db-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .db-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .db-hamburger {
    display: none;
    width: 44px;
    height: 44px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: 22px;
    cursor: pointer;
    align-items: center;
    justify-content: center;
  }
  @media (max-width: 991px) {
    .db-hamburger { display: flex; }
  }
  .db-page-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.4px;
    margin: 0;
    color: var(--text);
  }
  .db-page-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
    letter-spacing: -0.26px;
  }

  /* Icon button */
  .db-icon-btn {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text-secondary);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 200ms;
  }
  .db-icon-btn:hover {
    border-color: var(--border-hover);
    color: var(--text);
  }
  .db-notif-dot {
    position: absolute;
    top: 8px;
    right: 9px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--red);
    border: 2px solid var(--card);
  }

  /* Buttons */
  .db-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.28px;
    cursor: pointer;
    transition: all 250ms ease;
    min-height: 40px;
    border: none;
    font-family: inherit;
    font-feature-settings: inherit;
    white-space: nowrap;
  }
  .db-btn-dark {
    background: var(--black);
    color: #fff;
    border: 1px solid var(--black-border);
    box-shadow:
      0px -3px 1px 0px rgba(71,71,71,0.5) inset,
      0px 2px 1px 0px rgba(38,69,109,0.01),
      0px 1px 1px 0px rgba(38,69,109,0.02);
  }
  .db-btn-dark:hover {
    background: var(--black-hover);
    border-color: #727276;
    box-shadow:
      0px -3px 2px 0px rgba(34,34,34,0.5) inset,
      0px 8px 2px 0px rgba(46,46,51,0),
      0px 5px 2px 0px rgba(46,46,51,0.01),
      0px 3px 2px 0px rgba(46,46,51,0.05),
      0px 1px 1px 0px rgba(46,46,51,0.08);
  }
  .db-btn-primary {
    background: var(--black);
    color: #fff;
    border: 1px solid var(--black-border);
    box-shadow:
      0px -3px 1px 0px rgba(71,71,71,0.5) inset,
      0px 2px 1px 0px rgba(38,69,109,0.01),
      0px 1px 1px 0px rgba(38,69,109,0.02);
  }
  .db-btn-primary:hover {
    background: var(--black-hover);
    border-color: #727276;
    box-shadow:
      0px -3px 2px 0px rgba(34,34,34,0.5) inset,
      0px 8px 2px 0px rgba(46,46,51,0),
      0px 5px 2px 0px rgba(46,46,51,0.01),
      0px 3px 2px 0px rgba(46,46,51,0.05),
      0px 1px 1px 0px rgba(46,46,51,0.08);
  }
  .db-btn-secondary {
    background: var(--card);
    color: var(--text);
    border: 1px solid var(--border);
    box-shadow:
      0px -3px 1px 0px rgba(238,242,246,0.5) inset,
      0px 2px 1px 0px rgba(38,69,109,0.01),
      0px 1px 1px 0px rgba(38,69,109,0.02);
  }
  .db-btn-secondary:hover {
    background: #f8fafc;
    border-color: var(--border-hover);
    box-shadow:
      0px -3px 1px 0px rgba(221,231,242,0.5) inset,
      0px 4px 3px 0px rgba(81,114,148,0.02),
      0px 2px 2px 0px rgba(81,114,148,0.04);
  }
  .db-btn-ghost {
    background: none;
    border: none;
    color: var(--text);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 0;
    letter-spacing: -0.26px;
    font-family: inherit;
    transition: opacity 200ms;
  }
  .db-btn-ghost:hover { opacity: 0.7; }

  /* ─── CONTENT ─── */
  .db-content {
    padding: 28px 32px 48px;
    max-width: 1200px;
    width: 100%;
  }
  @media (max-width: 768px) {
    .db-content { padding: 16px 16px 40px; }
  }

  /* ─── ANIMATIONS ─── */
  @keyframes dbFade {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes dbReveal {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes dbBarGrow {
    from { height: 0; }
  }
  @keyframes dbRowReveal {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .db-reveal {
    animation: dbReveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .db-row-reveal {
    animation: dbRowReveal 0.4s ease both;
  }

  /* ─── KPI ROW ─── */
  .db-kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }
  @media (max-width: 1100px) {
    .db-kpi-row { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .db-kpi-row { grid-template-columns: 1fr; gap: 12px; }
  }

  .db-kpi {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 18px 20px 14px;
    position: relative;
    overflow: hidden;
    transition: all 300ms ease;
    box-shadow:
      0px 2px 1px 0px rgba(38,69,109,0.01),
      0px 1px 1px 0px rgba(38,69,109,0.02);
  }
  .db-kpi:hover {
    border-color: var(--border-hover);
    transform: translateY(-2px);
    box-shadow:
      0px 12px 3px 0px rgba(81,114,148,0),
      0px 8px 3px 0px rgba(81,114,148,0.01),
      0px 4px 3px 0px rgba(81,114,148,0.02),
      0px 2px 2px 0px rgba(81,114,148,0.04);
  }
  .db-kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .db-kpi-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  .db-kpi-trend {
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
    letter-spacing: -0.24px;
  }
  .db-kpi-trend.up { background: #f0fdf4; color: #16a34a; }
  .db-kpi-trend.down { background: #fef2f2; color: #dc2626; }
  .db-kpi-trend.neutral { background: #eff6ff; color: #2563eb; }
  .db-kpi-value {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.48px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .db-kpi-currency {
    font-size: 16px;
    font-weight: 500;
    opacity: 0.6;
  }
  .db-kpi-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-top: 6px;
    letter-spacing: -0.26px;
  }
  .db-kpi-spark {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 80px;
    height: 24px;
    opacity: 0.6;
  }
  .db-spark-svg {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 480px) {
    .db-kpi-value { font-size: 20px; }
  }

  /* ─── NET BAND ─── */
  .db-net-band {
    display: flex;
    align-items: center;
    gap: 24px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 20px;
    box-shadow:
      0px 2px 1px 0px rgba(38,69,109,0.01),
      0px 1px 1px 0px rgba(38,69,109,0.02);
  }
  @media (max-width: 768px) {
    .db-net-band { flex-direction: column; align-items: flex-start; gap: 12px; }
  }
  .db-net-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .db-net-label {
    font-size: 13px;
    color: var(--text-secondary);
    letter-spacing: -0.26px;
    display: block;
  }
  .db-net-value {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.36px;
    font-variant-numeric: tabular-nums;
  }
  .db-net-bar-container {
    flex: 1;
    min-width: 0;
    width: 100%;
  }
  .db-net-bar {
    height: 8px;
    border-radius: 4px;
    background: var(--red);
    overflow: hidden;
  }
  .db-net-bar-fill {
    height: 100%;
    background: var(--green);
    border-radius: 4px;
    transition: width 1s ease;
  }
  .db-net-bar-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
    letter-spacing: -0.22px;
  }

  /* ─── TWO COL ─── */
  .db-two-col {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  @media (max-width: 991px) {
    .db-two-col { grid-template-columns: 1fr; }
  }

  /* Card */
  .db-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0;
    box-shadow:
      0px 2px 1px 0px rgba(38,69,109,0.01),
      0px 1px 1px 0px rgba(38,69,109,0.02);
    overflow: hidden;
  }
  .db-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 18px 20px 14px;
    gap: 12px;
  }
  .db-card-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.3px;
    margin: 0;
  }
  .db-card-subtitle {
    font-size: 12px;
    color: var(--text-muted);
    margin: 2px 0 0;
    letter-spacing: -0.24px;
  }

  /* ─── CHART ─── */
  .db-chart-legend {
    display: flex;
    gap: 14px;
    flex-shrink: 0;
  }
  .db-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
    letter-spacing: -0.24px;
  }
  .db-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
  .db-chart {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    padding: 0 20px 16px;
    height: 200px;
    gap: 8px;
  }
  .db-chart-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    height: 100%;
  }
  .db-chart-bars {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    flex: 1;
    width: 100%;
    justify-content: center;
  }
  .db-chart-bar {
    width: 18px;
    border-radius: 4px 4px 0 0;
    position: relative;
    cursor: pointer;
    transition: opacity 200ms;
    animation: dbBarGrow 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .db-chart-bar.giris {
    background: linear-gradient(180deg, #0d8a67 0%, #0a6e52 100%);
    box-shadow: 0 -2px 8px rgba(10,110,82,0.25);
  }
  .db-chart-bar.cikis {
    background: linear-gradient(180deg, #cc2020 0%, #b41c1c 100%);
    box-shadow: 0 -2px 8px rgba(180,28,28,0.2);
  }
  .db-chart-bar:hover {
    opacity: 1;
  }
  .db-chart-bar:hover .db-chart-tooltip {
    opacity: 1;
    transform: translateY(-4px);
  }
  .db-chart-tooltip {
    position: absolute;
    top: -28px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    font-size: 11px;
    font-weight: 600;
    color: var(--text);
    background: var(--card);
    border: 1px solid var(--border);
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    transition: all 200ms ease;
    pointer-events: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.06);
  }
  .db-chart-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    margin-top: 8px;
    letter-spacing: -0.24px;
  }
  @media (max-width: 480px) {
    .db-chart { height: 140px; }
    .db-chart-bar { width: 12px; }
  }

  /* ─── UPCOMING ─── */
  .db-upcoming-list {
    padding: 0 20px;
  }
  .db-upcoming-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid #eef2f6;
    transition: all 200ms;
  }
  .db-upcoming-item:last-child {
    border-bottom: none;
  }
  .db-upcoming-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .db-upcoming-urgency {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .db-upcoming-urgency.critical {
    background: #fef2f2;
    color: var(--red);
  }
  .db-upcoming-urgency.warning {
    background: #fffbeb;
    color: var(--amber);
  }
  .db-upcoming-urgency.normal {
    background: #f1f5f9;
    color: var(--text-secondary);
  }
  .db-upcoming-day {
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.32px;
  }
  .db-upcoming-day-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1;
    margin-top: 1px;
  }
  .db-upcoming-cari {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.28px;
  }
  .db-upcoming-tip {
    font-size: 12px;
    color: var(--text-muted);
    letter-spacing: -0.24px;
  }
  .db-upcoming-amount {
    font-size: 14px;
    font-weight: 600;
    color: var(--red);
    letter-spacing: -0.28px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .db-upcoming-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: #f8fafc;
    border-top: 1px solid var(--border);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: -0.26px;
  }
  .db-upcoming-total-val {
    font-size: 15px;
    font-weight: 700;
    color: var(--red);
    letter-spacing: -0.3px;
  }

  /* ─── TABLE ─── */
  .db-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 500px;
  }
  .db-table thead th {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    padding: 10px 20px;
    text-align: left;
    border-bottom: 1px solid var(--border);
    letter-spacing: -0.24px;
  }
  .db-table tbody td {
    font-size: 14px;
    color: var(--text);
    padding: 12px 20px;
    border-bottom: 1px solid #eef2f6;
    letter-spacing: -0.28px;
    vertical-align: middle;
  }
  .db-table tbody tr {
    transition: background 150ms;
  }
  .db-table tbody tr:hover {
    background: #f8fafc;
  }
  .db-table tbody tr:last-child td {
    border-bottom: none;
  }
  .db-txn-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .db-txn-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }
  .db-txn-icon.giris {
    background: var(--green-light);
    color: var(--green);
  }
  .db-txn-icon.cikis {
    background: var(--red-light);
    color: var(--red);
  }
  .db-txn-cari {
    font-weight: 600;
    letter-spacing: -0.28px;
  }
  .db-txn-desc {
    color: var(--text-secondary);
    font-size: 13px;
  }
  .db-txn-date {
    color: var(--text-muted);
    font-size: 13px;
    white-space: nowrap;
  }
  .db-txn-amount {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.28px;
    white-space: nowrap;
  }
  .db-txn-amount.giris { color: var(--green); }
  .db-txn-amount.cikis { color: var(--red); }

  /* ─── MOBILE ─── */
  @media (max-width: 768px) {
    .db-hide-sm { display: none; }
    .db-page-title { font-size: 17px; }
  }
  @media (max-width: 480px) {
    .db-card-header { padding: 14px 16px 10px; flex-direction: column; }
    .db-chart { padding: 0 12px 12px; }
    .db-upcoming-list { padding: 0 14px; }
    .db-upcoming-total { padding: 12px 14px; }
    .db-table thead th, .db-table tbody td { padding: 10px 14px; }
  }

  /* ─── MODAL ─── */
  @keyframes dbModalOverlay {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes dbModalSlide {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .db-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: dbModalOverlay 0.2s ease;
  }

  .db-modal {
    background: var(--card);
    border-radius: 12px;
    width: 100%;
    max-width: 520px;
    overflow: hidden;
    box-shadow:
      0 24px 48px rgba(0, 0, 0, 0.16),
      0 8px 16px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(0, 0, 0, 0.04);
    animation: dbModalSlide 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .db-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    background: var(--black);
    border-bottom: 1px solid var(--black-border);
  }
  .db-modal-title {
    font-size: 16px;
    font-weight: 700;
    color: #ECECED;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: -0.32px;
  }
  .db-modal-title i {
    color: var(--indigo);
    font-size: 18px;
  }
  .db-modal-close {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.06);
    color: #ECECED;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 200ms;
    min-height: 44px;
    min-width: 44px;
  }
  .db-modal-close:hover {
    background: rgba(255,255,255,0.12);
    color: #fff;
  }

  .db-modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .db-modal-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .db-modal-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.26px;
  }

  .db-modal-radio-group {
    display: flex;
    gap: 8px;
  }
  .db-modal-radio {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 200ms;
    min-height: 44px;
    letter-spacing: -0.26px;
  }
  .db-modal-radio:hover {
    border-color: var(--border-hover);
    color: var(--text);
  }
  .db-modal-radio.active {
    border-color: #2E2E33;
    background: #2E2E33;
    color: #ffffff;
    font-weight: 600;
    box-shadow: none;
  }
  .db-modal-radio.active i {
    color: #ffffff !important;
  }

  .db-modal-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .db-modal-input-wrapper i,
  .db-modal-input-prefix {
    position: absolute;
    left: 14px;
    color: var(--text-muted);
    font-size: 14px;
    pointer-events: none;
    font-weight: 500;
  }
  .db-modal-input {
    width: 100%;
    padding: 10px 14px 10px 40px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font-size: 14px;
    font-family: inherit;
    font-feature-settings: inherit;
    color: var(--text);
    background: var(--card);
    transition: all 200ms;
    min-height: 44px;
    letter-spacing: -0.28px;
    outline: none;
    box-sizing: border-box;
  }
  .db-modal-input.has-prefix {
    padding-left: 32px;
  }
  .db-modal-input:focus {
    border-color: var(--black);
    box-shadow: 0 0 0 3px rgba(20, 20, 26, 0.08);
  }
  .db-modal-input::placeholder {
    color: var(--text-muted);
  }

  .db-modal-textarea {
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font-size: 14px;
    font-family: inherit;
    font-feature-settings: inherit;
    color: var(--text);
    background: var(--card);
    transition: all 200ms;
    min-height: 44px;
    letter-spacing: -0.28px;
    outline: none;
    resize: vertical;
    box-sizing: border-box;
  }
  .db-modal-textarea:focus {
    border-color: var(--black);
    box-shadow: 0 0 0 3px rgba(20, 20, 26, 0.08);
  }
  .db-modal-textarea::placeholder {
    color: var(--text-muted);
  }

  .db-modal-row {
    display: flex;
    gap: 12px;
  }
  @media (max-width: 480px) {
    .db-modal-row { flex-direction: column; }
    .db-modal-radio-group { flex-direction: column; }
    .db-modal-body { padding: 16px; }
    .db-modal-header { padding: 14px 16px; }
    .db-modal-footer { padding: 14px 16px; }
  }

  .db-modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    background: #f8fafc;
  }
`
