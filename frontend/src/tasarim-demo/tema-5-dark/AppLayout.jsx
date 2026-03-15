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
  { icon: 'bi-receipt',       label: 'Yeni Çek / Senet', bg: 'rgba(0,212,255,0.1)',    color: '#00d4ff' },
  { icon: 'bi-cash-coin',     label: 'Kasa Hareketi',    bg: 'rgba(0,214,143,0.1)',    color: '#00d68f' },
  { icon: 'bi-person-plus',   label: 'Yeni Cari',        bg: 'rgba(200,220,240,0.07)', color: '#8ba4be' },
  { icon: 'bi-calendar-plus', label: 'Ödeme Planla',     bg: 'rgba(244,197,66,0.1)',   color: '#f4c542' },
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

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const handleMenuClick = (id) => {
    setActiveMenu(id)
    setSidebarOpen(false)
  }

  return (
    <div className="d-app">
      {/* Mobil overlay */}
      {sidebarOpen && (
        <div
          className="d-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`d-sidebar${sidebarOpen ? ' d-sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="d-logo">
          <div className="d-logo-icon">
            <i className="bi bi-shield-check" />
          </div>
          <span className="d-logo-text">Finans Kalesi</span>
        </div>

        {/* Nav */}
        <div className="d-nav-section">
          <span className="d-nav-section-label">Navigasyon</span>
        </div>

        <nav className="d-nav" role="navigation">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`d-nav-btn${activeMenu === item.id ? ' d-nav-active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
              type="button"
            >
              <i className={`bi ${item.icon} d-nav-icon`} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Alt alan */}
        <div className="d-sidebar-footer">
          <button
            className="d-quick-btn"
            onClick={() => { setShowModal(true); setSidebarOpen(false) }}
            type="button"
          >
            <i className="bi bi-lightning-charge" aria-hidden="true" />
            <span>Hızlı İşlem</span>
          </button>

          {/* Kullanıcı */}
          <div className="d-user">
            <div className="d-user-avatar" aria-hidden="true">KD</div>
            <div className="d-user-info">
              <span className="d-user-name">Kaan Doğan</span>
              <span className="d-user-role">Admin · Süper Kullanıcı</span>
            </div>
            <button className="d-user-dots" type="button" aria-label="Kullanıcı menüsü">
              <i className="bi bi-three-dots-vertical" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="d-main">
        {/* Topbar */}
        <header className="d-topbar">
          <div>
            <h1 className="d-page-title">Dashboard</h1>
            <span className="d-breadcrumb">SYS / DASHBOARD / MART 2026</span>
          </div>
          <div className="d-topbar-right">
            {/* Hamburger — sadece mobilde görünür */}
            <button
              className="d-icon-btn d-hamburger"
              type="button"
              aria-label="Menü"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>
            <button className="d-icon-btn" type="button" aria-label="Ara">
              <i className="bi bi-search" aria-hidden="true" />
            </button>
            <button className="d-icon-btn" type="button" aria-label="Bildirimler">
              <i className="bi bi-bell" aria-hidden="true" />
              <span className="d-notif-dot" aria-hidden="true" />
            </button>
            <div className="d-topbar-avatar" role="img" aria-label="Profil">KD</div>
          </div>
        </header>

        {/* İçerik */}
        <main className="d-content">
          <Dashboard />
        </main>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="d-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="d-modal-title"
        >
          <div className="d-modal">
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
                {modalOptions.map((opt) => (
                  <button
                    key={opt.label}
                    className="d-modal-option"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    <div
                      className="d-modal-opt-icon"
                      style={{ background: opt.bg, color: opt.color }}
                      aria-hidden="true"
                    >
                      <i className={`bi ${opt.icon}`} />
                    </div>
                    <span>{opt.label}</span>
                    <i
                      className="bi bi-chevron-right ms-auto"
                      style={{ color: 'var(--d-text-muted)', fontSize: 12 }}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="d-modal-footer">
              <button
                className="d-btn-ghost"
                onClick={() => setShowModal(false)}
                type="button"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
