import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import '../../tasarim-demo/tema-3-earthy/tema.css'

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

// ─── Hızlı işlem seçenekleri ──────────────────────────────────────────────────
const hizliIslemler = [
  { icon: 'bi-receipt',       label: 'Yeni Çek / Senet', path: '/cek-senet',  bg: '#fdf0ee', color: '#c0392b' },
  { icon: 'bi-cash-coin',     label: 'Kasa Hareketi',    path: '/kasa',       bg: '#edf7f0', color: '#2d8050' },
  { icon: 'bi-person-plus',   label: 'Yeni Cari',        path: '/cariler',    bg: '#fdf5ea', color: '#a06040' },
  { icon: 'bi-calendar-plus', label: 'Ödeme Planla',     path: '/odemeler',   bg: '#fef9ec', color: '#c47f0a' },
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

export default function AppLayoutEarthy() {
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

  return (
    <div className="e-app">

      {/* ── Mobil overlay ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="e-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`e-sidebar${sidebarOpen ? ' e-sidebar-open' : ''}`} role="navigation" aria-label="Ana menü">

        {/* Logo */}
        <div className="e-logo">
          <div className="e-logo-icon" aria-hidden="true">
            <i className="bi bi-shield-check" />
          </div>
          <span className="e-logo-text">Finans Kalesi</span>
        </div>

        {/* Bölüm başlığı */}
        <div className="e-nav-section">
          <span className="e-nav-section-label">Ana Modüller</span>
        </div>

        {/* Navigasyon */}
        <nav className="e-nav">
          {menuItems.filter(m => m.path !== '/ayarlar/tema').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `e-nav-btn${isActive ? ' e-nav-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`bi ${item.icon} e-nav-icon`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Ayarlar bölümü */}
          <div className="e-nav-section" style={{ marginTop: 8 }}>
            <span className="e-nav-section-label">Sistem</span>
          </div>
          <NavLink
            to="/ayarlar/tema"
            className={({ isActive }) => `e-nav-btn${isActive ? ' e-nav-active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-palette e-nav-icon" aria-hidden="true" />
            <span>Tema Ayarları</span>
          </NavLink>
        </nav>

        {/* Çıkış butonu */}
        <div style={{ padding: '0 14px 12px' }}>
          <button
            className="e-nav-btn"
            style={{ color: 'var(--e-text-muted)', width: '100%' }}
            onClick={handleCikis}
            type="button"
          >
            <i className="bi bi-box-arrow-right e-nav-icon" aria-hidden="true" />
            <span>Çıkış Yap</span>
          </button>
        </div>

        {/* Kullanıcı */}
        <div className="e-user">
          <div className="e-user-avatar" aria-hidden="true">{adKisalt}</div>
          <div className="e-user-info">
            <span className="e-user-name">{kullanici?.ad_soyad || 'Kullanıcı'}</span>
            <span className="e-user-role">{rolEtiket[kullanici?.rol] || kullanici?.rol}</span>
          </div>
        </div>

      </aside>

      {/* ── Ana İçerik ─────────────────────────────────────────────────── */}
      <div className="e-main">

        {/* Topbar */}
        <header className="e-topbar">
          <div>
            <h1 className="e-page-title">{aktifMenu.label}</h1>
            <span className="e-breadcrumb">Anasayfa / {aktifMenu.breadcrumb}</span>
          </div>

          <div className="e-topbar-right">
            {/* Hamburger (sadece mobil) */}
            <button
              className="e-icon-btn e-hamburger"
              type="button"
              aria-label="Menüyü aç"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>

            {/* Hızlı işlem */}
            <button
              className="e-icon-btn"
              type="button"
              aria-label="Hızlı işlem"
              title="Hızlı İşlem"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-plus-lg" aria-hidden="true" />
            </button>

            {/* Profil */}
            <div
              className="e-topbar-avatar"
              role="img"
              aria-label={`Profil: ${kullanici?.ad_soyad}`}
              title={kullanici?.ad_soyad}
            >
              {adKisalt}
            </div>
          </div>
        </header>

        {/* Sayfa içeriği */}
        <main className="e-content">
          <Outlet />
        </main>

      </div>

      {/* ── Hızlı İşlem Modalı ─────────────────────────────────────────── */}
      {showModal && (
        <div
          className="e-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="e-modal-title"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="e-modal">
            <div className="e-modal-header">
              <h2 className="e-modal-title" id="e-modal-title">
                <i className="bi bi-lightning-charge" aria-hidden="true" />
                Hızlı İşlem Oluştur
              </h2>
              <button
                className="e-modal-close"
                onClick={() => setShowModal(false)}
                type="button"
                aria-label="Kapat"
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            <div className="e-modal-body">
              <p style={{ fontSize: 12.5, color: 'var(--e-text-muted)', marginBottom: 14, fontFamily: 'var(--e-font-body)' }}>
                Hangi işlemi gerçekleştirmek istiyorsunuz?
              </p>
              <div className="e-modal-options">
                {hizliIslemler.map((islem) => (
                  <button
                    key={islem.label}
                    className="e-modal-option"
                    type="button"
                    onClick={() => handleHizliIslem(islem.path)}
                  >
                    <div
                      className="e-modal-opt-icon"
                      style={{ background: islem.bg, color: islem.color }}
                      aria-hidden="true"
                    >
                      <i className={`bi ${islem.icon}`} />
                    </div>
                    <span>{islem.label}</span>
                    <i className="bi bi-chevron-right ms-auto" style={{ color: 'var(--e-text-muted)', fontSize: 12 }} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div className="e-modal-footer">
              <button className="e-btn-outline" onClick={() => setShowModal(false)} type="button">
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
