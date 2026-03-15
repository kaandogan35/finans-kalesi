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
  { icon: 'bi-receipt',       label: 'Yeni Çek / Senet', bg: '#ebf4ff', color: '#0070f3' },
  { icon: 'bi-cash-coin',     label: 'Kasa Hareketi',    bg: '#ecfdf5', color: '#10b981' },
  { icon: 'bi-person-plus',   label: 'Yeni Cari',        bg: '#f3f4f6', color: '#374151' },
  { icon: 'bi-calendar-plus', label: 'Ödeme Planla',     bg: '#fffbeb', color: '#f59e0b' },
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
    <div className="m-app">
      {/* Mobil overlay */}
      {sidebarOpen && (
        <div
          className="m-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`m-sidebar${sidebarOpen ? ' m-sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="m-logo">
          <div className="m-logo-icon">
            <i className="bi bi-shield-check" />
          </div>
          <span className="m-logo-text">Finans Kalesi</span>
        </div>

        {/* Nav grubu başlığı */}
        <div className="m-nav-group">
          <span className="m-nav-group-label">Genel</span>
        </div>

        {/* Navigasyon */}
        <nav className="m-nav" role="navigation">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`m-nav-btn${activeMenu === item.id ? ' m-nav-active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
              type="button"
            >
              <i className={`bi ${item.icon} m-nav-icon`} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Alt alan */}
        <div className="m-sidebar-footer">
          <button
            className="m-quick-btn"
            onClick={() => { setShowModal(true); setSidebarOpen(false) }}
            type="button"
          >
            <i className="bi bi-plus" aria-hidden="true" />
            <span>Yeni İşlem</span>
          </button>

          {/* Kullanıcı */}
          <div className="m-user">
            <div className="m-user-avatar" aria-hidden="true">KD</div>
            <div className="m-user-info">
              <span className="m-user-name">Kaan Doğan</span>
              <span className="m-user-role">Admin</span>
            </div>
            <button className="m-user-dots" type="button" aria-label="Kullanıcı menüsü">
              <i className="bi bi-three-dots-vertical" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="m-main">
        {/* Topbar */}
        <header className="m-topbar">
          <div>
            <h1 className="m-page-title">Dashboard</h1>
            <span className="m-breadcrumb">Genel Bakış · Mart 2026</span>
          </div>
          <div className="m-topbar-right">
            {/* Hamburger — sadece mobilde görünür */}
            <button
              className="m-icon-btn m-hamburger"
              type="button"
              aria-label="Menü"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>
            <button className="m-icon-btn" type="button" aria-label="Ara">
              <i className="bi bi-search" aria-hidden="true" />
            </button>
            <button className="m-icon-btn" type="button" aria-label="Bildirimler">
              <i className="bi bi-bell" aria-hidden="true" />
              <span className="m-notif-dot" aria-hidden="true" />
            </button>
            <div className="m-topbar-avatar" role="img" aria-label="Profil">KD</div>
          </div>
        </header>

        {/* İçerik */}
        <main className="m-content">
          <Dashboard />
        </main>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="m-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="m-modal-title"
        >
          <div className="m-modal">
            <div className="m-modal-header">
              <h2 className="m-modal-title" id="m-modal-title">
                <i className="bi bi-plus-circle" aria-hidden="true" />
                Yeni İşlem
              </h2>
              <button
                className="m-modal-close"
                onClick={() => setShowModal(false)}
                type="button"
                aria-label="Kapat"
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            <div className="m-modal-body">
              <div className="m-modal-options">
                {modalOptions.map((opt) => (
                  <button
                    key={opt.label}
                    className="m-modal-option"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    <div
                      className="m-modal-opt-icon"
                      style={{ background: opt.bg, color: opt.color }}
                      aria-hidden="true"
                    >
                      <i className={`bi ${opt.icon}`} />
                    </div>
                    <span>{opt.label}</span>
                    <i
                      className="bi bi-arrow-right ms-auto"
                      style={{ color: 'var(--m-text-muted)', fontSize: 13 }}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="m-modal-footer">
              <button
                className="m-btn-ghost"
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
