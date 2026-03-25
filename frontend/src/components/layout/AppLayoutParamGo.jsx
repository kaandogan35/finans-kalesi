import { useState, useEffect, useMemo } from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import '../../temalar/paramgo.css'
import ParamGoLogo from '../../logo/ParamGoLogo'
import UpgradeBildirim from '../UpgradeBildirim'
import BildirimZili from '../BildirimZili'

// ─── Navigasyon menüsü ────────────────────────────────────────────────────────
const TUM_MENU_ITEMS = [
  { path: '/dashboard',        icon: 'bi-speedometer2',       label: 'Dashboard',         breadcrumb: 'Genel Bakış',      modul: 'dashboard'        },
  { path: '/cariler',          icon: 'bi-people',             label: 'Cari Hesaplar',     breadcrumb: 'Cari Hesaplar',    modul: 'cari'             },
  { path: '/cek-senet',        icon: 'bi-file-earmark-text',  label: 'Çek / Senet',       breadcrumb: 'Çek / Senet',      modul: 'cek_senet'        },
  { path: '/odemeler',         icon: 'bi-calendar-check',     label: 'Ödeme Takip',       breadcrumb: 'Ödeme Takip',      modul: 'odemeler'         },
  { path: '/kasa',             icon: 'bi-safe',               label: 'Kasa',              breadcrumb: 'Varlık & Kasa',    modul: 'kasa'             },
  { path: '/vade-hesaplayici', icon: 'bi-calculator',         label: 'Vade Hesaplayıcı',  breadcrumb: 'Vade Hesaplayıcı', modul: 'vade_hesaplayici' },
  { path: '/veresiye',         icon: 'bi-journal-bookmark',   label: 'Veresiye Defteri',  breadcrumb: 'Veresiye Defteri', modul: 'veresiye'         },
]

function gorunurMenuHesapla(kullanici) {
  if (!kullanici || kullanici.rol === 'sahip') return TUM_MENU_ITEMS
  let izinliModuller = []
  try {
    const parsed = typeof kullanici.yetkiler === 'string'
      ? JSON.parse(kullanici.yetkiler)
      : (kullanici.yetkiler || {})
    izinliModuller = parsed?.moduller || []
  } catch { izinliModuller = [] }
  return TUM_MENU_ITEMS.filter(item => izinliModuller.includes(item.modul))
}

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

  const menuItems = useMemo(() => gorunurMenuHesapla(kullanici), [kullanici])

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

  return (
    <div className="p-app">

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

          {/* Sistem bölümü */}
          <div className="p-nav-section" style={{ marginTop: 8 }}>
            <span className="p-nav-section-label">Sistem</span>
          </div>
          {kullanici?.rol === 'sahip' && (
            <>
              <NavLink
                to="/kullanicilar"
                className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <i className="bi bi-person-gear p-nav-icon" aria-hidden="true" />
                <span>Kullanıcılar</span>
              </NavLink>
              <NavLink
                to="/guvenlik"
                className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <i className="bi bi-shield-lock p-nav-icon" aria-hidden="true" />
                <span>Güvenlik</span>
              </NavLink>
            </>
          )}
          <NavLink
            to="/raporlar"
            className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-bar-chart-line p-nav-icon" aria-hidden="true" />
            <span>Raporlar</span>
          </NavLink>
          <NavLink
            to="/bildirimler"
            className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-bell p-nav-icon" aria-hidden="true" />
            <span>Bildirimler</span>
          </NavLink>
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
            <BildirimZili />
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

    </div>
  )
}
