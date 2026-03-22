import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import '../../temalar/paramgo.css'
import ParamGoLogo from '../../logo/ParamGoLogo'
import UpgradeBildirim from '../UpgradeBildirim'
import TanitimTuru from '../tanitim-turu/TanitimTuru'
import useTurStore from '../../stores/turStore'
import { TUR_ADIMLAR, ROTA_TUR } from '../tanitim-turu/turlar'

// ─── Navigasyon menüsü ────────────────────────────────────────────────────────
const menuItems = [
  { path: '/dashboard',        icon: 'bi-speedometer2',       label: 'Dashboard',         breadcrumb: 'Genel Bakış' },
  { path: '/cariler',          icon: 'bi-people',             label: 'Cari Hesaplar',     breadcrumb: 'Cari Hesaplar' },
  { path: '/cek-senet',        icon: 'bi-file-earmark-text',  label: 'Çek / Senet',       breadcrumb: 'Çek / Senet' },
  { path: '/odemeler',         icon: 'bi-calendar-check',     label: 'Ödeme Takip',       breadcrumb: 'Ödeme Takip' },
  { path: '/kasa',             icon: 'bi-safe',               label: 'Kasa',              breadcrumb: 'Varlık & Kasa' },
  { path: '/vade-hesaplayici', icon: 'bi-calculator',         label: 'Vade Hesaplayıcı',  breadcrumb: 'Vade Hesaplayıcı' },
  { path: '/ayarlar/tema',     icon: 'bi-palette',            label: 'Tema Ayarları',     breadcrumb: 'Tema Ayarları' },
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

export default function AppLayoutParamGo() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const kullanici = useAuthStore((s) => s.kullanici)
  const cikisYap  = useAuthStore((s) => s.cikisYap)
  const navigate  = useNavigate()
  const location  = useLocation()

  // Aktif sayfa bilgisi
  const aktifMenu = menuItems.find((m) => location.pathname.startsWith(m.path)) || menuItems[0]

  // Sayfa başlığını ParamGo olarak ayarla
  useEffect(() => {
    document.title = 'ParamGo'
    return () => { document.title = 'ParamGo' }
  }, [])

  // ESC tuşu → sidebar kapat
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') { setSidebarOpen(false) }
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

  const adKisalt = kisalt(kullanici?.ad_soyad)

  const turBaslat = useTurStore((s) => s.turBaslat)
  const handleTurBaslat = () => {
    const turAdi = ROTA_TUR[location.pathname] || 'dashboard'
    const adimlar = TUR_ADIMLAR[turAdi]
    if (adimlar) turBaslat(turAdi, adimlar)
  }

  return (
    <div className="p-app">
      <TanitimTuru />

      {/* ── Mobil overlay ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="p-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`p-sidebar${sidebarOpen ? ' p-sidebar-open' : ''}`} role="navigation" aria-label="Ana menü" data-tur="sol-menu">

        {/* Logo */}
        <div className="p-logo">
          <ParamGoLogo size="sm" />
        </div>

        {/* Bölüm başlığı */}
        <div className="p-nav-section">
          <span className="p-nav-section-label">Ana Modüller</span>
        </div>

        {/* Navigasyon */}
        <nav className="p-nav">
          {menuItems.filter(m => m.path !== '/ayarlar/tema').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`bi ${item.icon} p-nav-icon`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Ayarlar bölümü */}
          <div className="p-nav-section" style={{ marginTop: 8 }}>
            <span className="p-nav-section-label">Sistem</span>
          </div>
          <NavLink
            to="/abonelik"
            className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-credit-card p-nav-icon" aria-hidden="true" />
            <span>Aboneliğim</span>
          </NavLink>
          <NavLink
            to="/ayarlar/tema"
            className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-palette p-nav-icon" aria-hidden="true" />
            <span>Tema Ayarları</span>
          </NavLink>
        </nav>

        {/* Çıkış butonu */}
        <div style={{ padding: '0 14px 12px' }}>
          <button
            className="p-nav-btn"
            style={{ color: 'var(--p-text-muted)', width: '100%' }}
            onClick={handleCikis}
            type="button"
          >
            <i className="bi bi-box-arrow-right p-nav-icon" aria-hidden="true" />
            <span>Çıkış Yap</span>
          </button>
        </div>

        {/* Kullanıcı */}
        <div className="p-user">
          <div className="p-user-avatar" aria-hidden="true">{adKisalt}</div>
          <div className="p-user-info">
            <span className="p-user-name">{kullanici?.ad_soyad || 'Kullanıcı'}</span>
            <span className="p-user-role">{rolEtiket[kullanici?.rol] || kullanici?.rol}</span>
          </div>
        </div>

      </aside>

      {/* ── Ana İçerik ─────────────────────────────────────────────────── */}
      <div className="p-main">

        {/* Topbar */}
        <header className="p-topbar">
          <Link to="/dashboard" className="p-topbar-brand" style={{ textDecoration: 'none' }}>
            <ParamGoLogo size="xs" />
          </Link>

          <div className="p-topbar-right">
            {/* Hamburger (sadece mobil) */}
            <button
              className="p-icon-btn p-hamburger"
              type="button"
              aria-label="Menüyü aç"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>

          </div>
        </header>

        {/* Upgrade bildirimi (ücretsiz plan) */}
        <UpgradeBildirim />

        {/* Sayfa içeriği */}
        <main className="p-content">
          <Outlet />
        </main>

      </div>

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
          background: 'var(--p-color-primary)',
          border: '2px solid var(--p-color-primary-dark)',
          color: 'var(--p-text-on-primary)',
          fontSize: 20,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
          zIndex: 1050,
        }}
      >
        <i className="bi bi-question-lg" />
      </button>

    </div>
  )
}
