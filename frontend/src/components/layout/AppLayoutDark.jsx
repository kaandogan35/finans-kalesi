import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import '../../temalar/dark.css'
import UpgradeBildirim from '../UpgradeBildirim'
import TanitimTuru from '../tanitim-turu/TanitimTuru'
import useTurStore from '../../stores/turStore'
import { TUR_ADIMLAR, ROTA_TUR } from '../tanitim-turu/turlar'

// ─── Navigasyon menüsü ────────────────────────────────────────────────────────
const menuItems = [
  { path: '/dashboard',        icon: 'bi-speedometer2',       label: 'Dashboard',         breadcrumb: 'DASHBOARD' },
  { path: '/cariler',          icon: 'bi-people',             label: 'Cari Hesaplar',     breadcrumb: 'CARİ HESAPLAR' },
  { path: '/cek-senet',        icon: 'bi-file-earmark-text',  label: 'Çek / Senet',       breadcrumb: 'ÇEK / SENET' },
  { path: '/odemeler',         icon: 'bi-calendar-check',     label: 'Ödeme Takip',       breadcrumb: 'ÖDEME TAKİP' },
  { path: '/kasa',             icon: 'bi-safe',               label: 'Kasa',              breadcrumb: 'VARLIK & KASA' },
  { path: '/vade-hesaplayici', icon: 'bi-calculator',         label: 'Vade Hesaplayıcı',  breadcrumb: 'VADE HESAPLAYICI' },
  { path: '/ayarlar/tema',     icon: 'bi-palette',            label: 'Tema Ayarları',     breadcrumb: 'TEMA AYARLARI' },
]

// ─── Hızlı işlem seçenekleri ──────────────────────────────────────────────────
const hizliIslemler = [
  { icon: 'bi-receipt',       label: 'Yeni Çek / Senet', path: '/cek-senet',  bg: 'rgba(0,212,255,0.1)',    color: '#00d4ff' },
  { icon: 'bi-cash-coin',     label: 'Kasa Hareketi',    path: '/kasa',       bg: 'rgba(0,214,143,0.1)',    color: '#00d68f' },
  { icon: 'bi-person-plus',   label: 'Yeni Cari',        path: '/cariler',    bg: 'rgba(200,220,240,0.07)', color: '#8ba4be' },
  { icon: 'bi-calendar-plus', label: 'Ödeme Planla',     path: '/odemeler',   bg: 'rgba(244,197,66,0.1)',   color: '#f4c542' },
]

// ─── İsim kısaltması ──────────────────────────────────────────────────────────
function kisalt(adSoyad) {
  if (!adSoyad) return '?'
  const parcalar = adSoyad.trim().split(' ')
  if (parcalar.length === 1) return parcalar[0][0].toUpperCase()
  return (parcalar[0][0] + parcalar[parcalar.length - 1][0]).toUpperCase()
}

// ─── Rol etiketi ──────────────────────────────────────────────────────────────
const rolEtiket = { sahip: 'Şirket Sahibi', admin: 'Yönetici', muhasebeci: 'Muhasebeci', personel: 'Personel' }

export default function AppLayoutDark() {
  const [showModal, setShowModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const kullanici = useAuthStore((s) => s.kullanici)
  const cikisYap  = useAuthStore((s) => s.cikisYap)
  const navigate  = useNavigate()
  const location  = useLocation()

  // Aktif sayfa bilgisi
  const aktifMenu = menuItems.find((m) => location.pathname.startsWith(m.path)) || menuItems[0]

  // ESC tuşu → modal ve sidebar kapat
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') { setShowModal(false); setSidebarOpen(false) }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Sidebar açıkken body scroll kilitle
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const handleCikis = async () => {
    await cikisYap()
    navigate('/giris')
  }

  const handleHizliIslem = (path) => {
    setShowModal(false)
    navigate(path)
  }

  const adKisalt = kisalt(kullanici?.ad_soyad)

  const turBaslat = useTurStore((s) => s.turBaslat)
  const handleTurBaslat = () => {
    const turAdi = ROTA_TUR[location.pathname] || 'dashboard'
    const adimlar = TUR_ADIMLAR[turAdi]
    if (adimlar) turBaslat(turAdi, adimlar)
  }

  return (
    <div className="d-app">
      <TanitimTuru />

      {/* ── Mobil overlay ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="d-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`d-sidebar${sidebarOpen ? ' d-sidebar-open' : ''}`} role="navigation" aria-label="Ana menü" data-tur="sol-menu">

        {/* Logo */}
        <div className="d-logo">
          <div className="d-logo-icon" aria-hidden="true">
            <i className="bi bi-shield-check" />
          </div>
          <span className="d-logo-text">Finans Kalesi</span>
        </div>

        {/* Bölüm başlığı */}
        <div className="d-nav-section">
          <span className="d-nav-section-label">Navigasyon</span>
        </div>

        {/* Navigasyon */}
        <nav className="d-nav">
          {menuItems.filter(m => m.path !== '/ayarlar/tema').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `d-nav-btn${isActive ? ' d-nav-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`bi ${item.icon} d-nav-icon`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Sistem bölümü */}
          <div className="d-nav-section" style={{ marginTop: 8, padding: '10px 4px 6px' }}>
            <span className="d-nav-section-label">Sistem</span>
          </div>
          <NavLink
            to="/abonelik"
            className={({ isActive }) => `d-nav-btn${isActive ? ' d-nav-active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-credit-card d-nav-icon" aria-hidden="true" />
            <span>Aboneliğim</span>
          </NavLink>
          <NavLink
            to="/ayarlar/tema"
            className={({ isActive }) => `d-nav-btn${isActive ? ' d-nav-active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-palette d-nav-icon" aria-hidden="true" />
            <span>Tema Ayarları</span>
          </NavLink>
        </nav>

        {/* Alt alan */}
        <div className="d-sidebar-footer">
          {/* Çıkış butonu */}
          <button
            className="d-nav-btn"
            style={{ color: 'var(--d-text-muted)', width: '100%', marginBottom: 8 }}
            onClick={handleCikis}
            type="button"
          >
            <i className="bi bi-box-arrow-right d-nav-icon" aria-hidden="true" />
            <span>Çıkış Yap</span>
          </button>

          {/* Kullanıcı */}
          <div className="d-user">
            <div className="d-user-avatar" aria-hidden="true">{adKisalt}</div>
            <div className="d-user-info">
              <span className="d-user-name">{kullanici?.ad_soyad || 'Kullanıcı'}</span>
              <span className="d-user-role">{rolEtiket[kullanici?.rol] || kullanici?.rol}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Ana İçerik ─────────────────────────────────────────────────── */}
      <div className="d-main">

        {/* Topbar */}
        <header className="d-topbar">
          <div>
            <h1 className="d-page-title">{aktifMenu.label}</h1>
            <span className="d-breadcrumb">SYS / {aktifMenu.breadcrumb}</span>
          </div>

          <div className="d-topbar-right">
            {/* Hamburger (sadece mobil) */}
            <button
              className="d-icon-btn d-hamburger"
              type="button"
              aria-label="Menüyü aç"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>

            {/* Hızlı işlem */}
            <button
              data-tur="hizli-islem"
              className="d-icon-btn"
              type="button"
              aria-label="Hızlı işlem"
              title="Hızlı İşlem"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-lightning-charge" aria-hidden="true" />
            </button>

            {/* Profil */}
            <div
              className="d-topbar-avatar"
              role="img"
              aria-label={`Profil: ${kullanici?.ad_soyad}`}
              title={kullanici?.ad_soyad}
            >
              {adKisalt}
            </div>
          </div>
        </header>

        {/* Upgrade bildirimi (ücretsiz plan) */}
        <UpgradeBildirim />

        {/* Sayfa içeriği */}
        <main className="d-content">
          <Outlet />
        </main>

      </div>

      {/* ── Hızlı İşlem Modalı ─────────────────────────────────────────── */}
      {showModal && (
        <>
          <div className="d-modal-overlay" onClick={() => setShowModal(false)} aria-hidden="true" />
          <div
            className="d-modal-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="d-modal-title"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <div className="d-modal-box" style={{ maxWidth: 440 }}>
              <div className="d-modal-header">
                <h2 className="d-modal-title" id="d-modal-title">
                  <i className="bi bi-lightning-charge" aria-hidden="true" />
                  Hızlı İşlem
                </h2>
                <button
                  className="d-modal-close"
                  onClick={() => setShowModal(false)}
                  type="button"
                  aria-label="Kapat"
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>

              <div className="d-modal-body">
                <div className="d-modal-options">
                  {hizliIslemler.map((islem) => (
                    <button
                      key={islem.label}
                      className="d-modal-option"
                      type="button"
                      onClick={() => handleHizliIslem(islem.path)}
                    >
                      <div
                        className="d-modal-opt-icon"
                        style={{ background: islem.bg, color: islem.color }}
                        aria-hidden="true"
                      >
                        <i className={`bi ${islem.icon}`} />
                      </div>
                      <span>{islem.label}</span>
                      <i className="bi bi-chevron-right ms-auto d-modal-opt-arrow" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="d-modal-footer">
                <button className="d-btn-ghost" onClick={() => setShowModal(false)} type="button">
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Tanıtım Turu ? Butonu ──────────────────────────────────────────── */}
      <button
        onClick={handleTurBaslat}
        type="button"
        aria-label="Tanıtım turunu başlat"
        title="Tanıtım Turu"
        style={{
          position: 'fixed',
          bottom: 24, right: 24,
          width: 52, height: 52,
          borderRadius: '50%',
          background: '#0d1117',
          border: '2px solid #00d4ff',
          color: '#00d4ff',
          fontSize: 20,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(0,212,255,0.35)',
          zIndex: 1050,
        }}
      >
        <i className="bi bi-question-lg" />
      </button>

    </div>
  )
}
