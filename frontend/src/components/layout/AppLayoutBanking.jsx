import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import '../../temalar/banking.css'
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

// ─── Hızlı işlem seçenekleri ──────────────────────────────────────────────────
const hizliIslemler = [
  { icon: 'bi-receipt',       label: 'Yeni Çek / Senet', path: '/cek-senet',         bg: '#eef2ff', color: '#0a2463' },
  { icon: 'bi-cash-coin',     label: 'Kasa Hareketi',    path: '/kasa',              bg: '#e8f7f3', color: '#1a7a55' },
  { icon: 'bi-person-plus',   label: 'Yeni Cari',        path: '/cariler',           bg: '#e8f0fe', color: '#1565c0' },
  { icon: 'bi-calendar-plus', label: 'Ödeme Planla',     path: '/odemeler',          bg: '#fef8ec', color: '#b8860b' },
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

export default function AppLayoutBanking() {
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
    <div className="b-app">
      <TanitimTuru />

      {/* ── Mobil overlay ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="b-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`b-sidebar${sidebarOpen ? ' b-sidebar-open' : ''}`} role="navigation" aria-label="Ana menü" data-tur="sol-menu">

        {/* Logo */}
        <div className="b-logo">
          <div className="b-logo-icon" aria-hidden="true">
            <i className="bi bi-shield-check" />
          </div>
          <span className="b-logo-text">Finans Kalesi</span>
        </div>

        {/* Bölüm başlığı */}
        <div className="b-nav-section">
          <span className="b-nav-section-label">Ana Modüller</span>
        </div>

        {/* Navigasyon */}
        <nav className="b-nav">
          {menuItems.filter(m => m.path !== '/ayarlar/tema').map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `b-nav-btn${isActive ? ' b-nav-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`bi ${item.icon} b-nav-icon`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Ayarlar bölümü */}
          <div className="b-nav-section" style={{ marginTop: 8 }}>
            <span className="b-nav-section-label">Sistem</span>
          </div>
          <NavLink
            to="/abonelik"
            className={({ isActive }) => `b-nav-btn${isActive ? ' b-nav-active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-credit-card b-nav-icon" aria-hidden="true" />
            <span>Aboneliğim</span>
          </NavLink>
          <NavLink
            to="/ayarlar/tema"
            className={({ isActive }) => `b-nav-btn${isActive ? ' b-nav-active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-palette b-nav-icon" aria-hidden="true" />
            <span>Tema Ayarları</span>
          </NavLink>
        </nav>

        {/* Çıkış butonu */}
        <div style={{ padding: '0 14px 12px' }}>
          <button
            className="b-nav-btn"
            style={{ color: 'rgba(255,255,255,0.55)', width: '100%' }}
            onClick={handleCikis}
            type="button"
          >
            <i className="bi bi-box-arrow-right b-nav-icon" aria-hidden="true" />
            <span>Çıkış Yap</span>
          </button>
        </div>

        {/* Kullanıcı */}
        <div className="b-user">
          <div className="b-user-avatar" aria-hidden="true">{adKisalt}</div>
          <div className="b-user-info">
            <span className="b-user-name">{kullanici?.ad_soyad || 'Kullanıcı'}</span>
            <span className="b-user-role">{rolEtiket[kullanici?.rol] || kullanici?.rol}</span>
          </div>
        </div>

      </aside>

      {/* ── Ana İçerik ─────────────────────────────────────────────────── */}
      <div className="b-main">

        {/* Topbar */}
        <header className="b-topbar">
          <div>
            <h1 className="b-page-title">{aktifMenu.label}</h1>
            <span className="b-breadcrumb">Anasayfa / {aktifMenu.breadcrumb}</span>
          </div>

          <div className="b-topbar-right">
            {/* Hamburger (sadece mobil) */}
            <button
              className="b-icon-btn b-hamburger"
              type="button"
              aria-label="Menüyü aç"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>

            {/* Hızlı işlem */}
            <button
              data-tur="hizli-islem"
              className="b-icon-btn"
              type="button"
              aria-label="Hızlı işlem"
              title="Hızlı İşlem"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-plus-lg" aria-hidden="true" />
            </button>

            {/* Profil */}
            <div
              className="b-topbar-avatar"
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
        <main className="b-content">
          <Outlet />
        </main>

      </div>

      {/* ── Hızlı İşlem Modalı ─────────────────────────────────────────── */}
      {showModal && (
        <>
          <div className="b-modal-overlay" onClick={() => setShowModal(false)} aria-hidden="true" />
          <div
            className="b-modal-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="b-modal-title"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <div className="b-modal-box" style={{ maxWidth: 440 }}>
              <div className="b-modal-header">
                <h2 className="b-modal-title" id="b-modal-title">
                  <i className="bi bi-plus-square" aria-hidden="true" />
                  Hızlı İşlem Oluştur
                </h2>
                <button
                  className="b-modal-close"
                  onClick={() => setShowModal(false)}
                  type="button"
                  aria-label="Kapat"
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>

              <div className="b-modal-body">
                <p className="b-modal-desc">
                  Hangi işlemi gerçekleştirmek istiyorsunuz?
                </p>
                <div className="b-modal-options">
                  {hizliIslemler.map((islem) => (
                    <button
                      key={islem.label}
                      className="b-modal-option"
                      type="button"
                      onClick={() => handleHizliIslem(islem.path)}
                    >
                      <div
                        className="b-modal-opt-icon"
                        style={{ background: islem.bg, color: islem.color }}
                        aria-hidden="true"
                      >
                        <i className={`bi ${islem.icon}`} />
                      </div>
                      <span>{islem.label}</span>
                      <i className="bi bi-chevron-right ms-auto b-modal-opt-arrow" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="b-modal-footer">
                <button className="b-btn-cancel" onClick={() => setShowModal(false)} type="button">
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
          background: '#0a2463',
          border: '2px solid #b8860b',
          color: '#fff',
          fontSize: 20,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(10,36,99,0.4)',
          zIndex: 1050,
        }}
      >
        <i className="bi bi-question-lg" />
      </button>

    </div>
  )
}
