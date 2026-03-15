import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import './tema.css'

const menuItems = [
  { id: 'dashboard',  icon: 'bi-speedometer2',      label: 'Dashboard' },
  { id: 'cariler',    icon: 'bi-people',             label: 'Cari Hesaplar' },
  { id: 'cek-senet',  icon: 'bi-file-earmark-text',  label: 'Çek / Senet' },
  { id: 'odeme',      icon: 'bi-calendar-check',     label: 'Ödeme Takip' },
  { id: 'kasa',       icon: 'bi-safe',               label: 'Kasa' },
  { id: 'vade',       icon: 'bi-calculator',         label: 'Vade Hesaplayıcı' },
]

const modalOptions = [
  { icon: 'bi-receipt',       label: 'Yeni Çek / Senet', bg: '#eef2ff', color: '#0a2463' },
  { icon: 'bi-cash-coin',     label: 'Kasa Hareketi',    bg: '#e8f7f3', color: '#1a7a55' },
  { icon: 'bi-person-plus',   label: 'Yeni Cari',        bg: '#e8f0fe', color: '#1565c0' },
  { icon: 'bi-calendar-plus', label: 'Ödeme Planla',     bg: '#fef8ec', color: '#b8860b' },
]

export default function AppLayout() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Sidebar açıkken body scroll'u kilitle
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const handleMenuClick = (id) => {
    setActiveMenu(id)
    setSidebarOpen(false)
  }

  return (
    <div className="b-app">
      {/* Mobil overlay */}
      {sidebarOpen && (
        <div
          className="b-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`b-sidebar${sidebarOpen ? ' b-sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="b-logo">
          <div className="b-logo-icon">
            <i className="bi bi-shield-check" />
          </div>
          <span className="b-logo-text">Finans Kalesi</span>
        </div>

        {/* Nav bölüm başlığı */}
        <div className="b-nav-section">
          <span className="b-nav-section-label">Ana Modüller</span>
        </div>

        {/* Navigasyon */}
        <nav className="b-nav" role="navigation">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`b-nav-btn${activeMenu === item.id ? ' b-nav-active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
              type="button"
            >
              <i className={`bi ${item.icon} b-nav-icon`} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Kullanıcı */}
        <div className="b-user">
          <div className="b-user-avatar" aria-hidden="true">KD</div>
          <div className="b-user-info">
            <span className="b-user-name">Kaan Doğan</span>
            <span className="b-user-role">Admin · Süper Kullanıcı</span>
          </div>
          <button className="b-user-dots" type="button" aria-label="Kullanıcı menüsü">
            <i className="bi bi-three-dots-vertical" aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="b-main">
        {/* Topbar */}
        <header className="b-topbar">
          <div>
            <h1 className="b-page-title" style={{ fontFamily: 'var(--b-font-display)' }}>
              Dashboard
            </h1>
            <span className="b-breadcrumb">Anasayfa / Genel Bakış</span>
          </div>
          <div className="b-topbar-right">
            {/* Hamburger — sadece mobilde görünür */}
            <button
              className="b-icon-btn b-hamburger"
              type="button"
              aria-label="Menü"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>
            <button
              className="b-icon-btn"
              type="button"
              aria-label="Hızlı İşlem"
              onClick={() => setShowModal(true)}
              title="Hızlı İşlem"
            >
              <i className="bi bi-plus-lg" aria-hidden="true" />
            </button>
            <button className="b-icon-btn" type="button" aria-label="Bildirimler">
              <i className="bi bi-bell" aria-hidden="true" />
              <span className="b-notif-dot" aria-hidden="true" />
            </button>
            <div className="b-topbar-avatar" role="img" aria-label="Profil">KD</div>
          </div>
        </header>

        {/* İçerik */}
        <main className="b-content">
          <Dashboard />
        </main>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="b-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="b-modal-title"
        >
          <div className="b-modal">
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
              <p style={{
                fontSize: 12.5, color: 'var(--b-text-muted)',
                marginBottom: 14, fontFamily: 'var(--b-font-body)',
              }}>
                Hangi işlemi gerçekleştirmek istiyorsunuz?
              </p>
              <div className="b-modal-options">
                {modalOptions.map((opt) => (
                  <button
                    key={opt.label}
                    className="b-modal-option"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    <div
                      className="b-modal-opt-icon"
                      style={{ background: opt.bg, color: opt.color }}
                      aria-hidden="true"
                    >
                      <i className={`bi ${opt.icon}`} />
                    </div>
                    <span>{opt.label}</span>
                    <i
                      className="bi bi-chevron-right ms-auto"
                      style={{ color: 'var(--b-text-muted)', fontSize: 12 }}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="b-modal-footer">
              <button
                className="b-btn-outline"
                onClick={() => setShowModal(false)}
                type="button"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
