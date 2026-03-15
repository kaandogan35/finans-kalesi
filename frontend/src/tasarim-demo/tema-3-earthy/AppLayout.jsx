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
  { icon: 'bi-receipt',       label: 'Yeni Çek / Senet', bg: '#fdf0ee', color: '#c0392b' },
  { icon: 'bi-cash-coin',     label: 'Kasa Hareketi',    bg: '#edf7f0', color: '#2d8050' },
  { icon: 'bi-person-plus',   label: 'Yeni Cari',        bg: '#fdf5ea', color: '#a06040' },
  { icon: 'bi-calendar-plus', label: 'Ödeme Planla',     bg: '#fef9ec', color: '#c47f0a' },
]

export default function AppLayout() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setShowModal(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <div className="e-app">
      {/* ── Sidebar ── */}
      <aside className="e-sidebar">
        {/* Logo */}
        <div className="e-logo">
          <div className="e-logo-icon">
            <i className="bi bi-shield-check" />
          </div>
          <span className="e-logo-text">Finans Kalesi</span>
        </div>

        {/* Navigasyon */}
        <nav className="e-nav" role="navigation">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`e-nav-btn${activeMenu === item.id ? ' e-nav-active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
              type="button"
            >
              <i className={`bi ${item.icon} e-nav-icon`} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Alt alan */}
        <div className="e-sidebar-footer">
          <button
            className="e-quick-btn"
            onClick={() => setShowModal(true)}
            type="button"
          >
            <i className="bi bi-plus-lg" aria-hidden="true" />
            <span>Hızlı İşlem</span>
          </button>

          {/* Kullanıcı */}
          <div className="e-user">
            <div className="e-user-avatar" aria-hidden="true">KD</div>
            <div className="e-user-info">
              <span className="e-user-name">Kaan Doğan</span>
              <span className="e-user-role">Admin</span>
            </div>
            <button className="e-user-dots" type="button" aria-label="Kullanıcı menüsü">
              <i className="bi bi-three-dots-vertical" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="e-main">
        {/* Topbar */}
        <header className="e-topbar">
          <div>
            <h1 className="e-page-title">Dashboard</h1>
            <span className="e-breadcrumb">Mart 2026 · Genel Bakış</span>
          </div>
          <div className="e-topbar-right">
            <button className="e-icon-btn" type="button" aria-label="Ara">
              <i className="bi bi-search" aria-hidden="true" />
            </button>
            <button className="e-icon-btn" type="button" aria-label="Bildirimler">
              <i className="bi bi-bell" aria-hidden="true" />
              <span className="e-notif-dot" aria-hidden="true" />
            </button>
            <div className="e-topbar-avatar" role="img" aria-label="Profil">KD</div>
          </div>
        </header>

        {/* İçerik */}
        <main className="e-content">
          <Dashboard />
        </main>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="e-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="e-modal-title"
        >
          <div className="e-modal">
            <div className="e-modal-header">
              <h2 className="e-modal-title" id="e-modal-title">
                <i className="bi bi-lightning-charge" aria-hidden="true" />
                Hızlı İşlem
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
              <div className="e-modal-options">
                {modalOptions.map((opt) => (
                  <button
                    key={opt.label}
                    className="e-modal-option"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    <div
                      className="e-modal-opt-icon"
                      style={{ background: opt.bg, color: opt.color }}
                      aria-hidden="true"
                    >
                      <i className={`bi ${opt.icon}`} />
                    </div>
                    <span>{opt.label}</span>
                    <i
                      className="bi bi-chevron-right ms-auto"
                      style={{ color: 'var(--e-text-muted)', fontSize: 12 }}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="e-modal-footer">
              <button
                className="e-btn-ghost"
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
