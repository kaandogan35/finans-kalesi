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
  { icon: 'bi-receipt',       label: 'Yeni Çek / Senet', bg: '#6C5CE720', color: '#6C5CE7' },
  { icon: 'bi-cash-coin',     label: 'Kasa Hareketi',    bg: '#00b89420', color: '#00b894' },
  { icon: 'bi-person-plus',   label: 'Yeni Cari',        bg: '#0984e320', color: '#0984e3' },
  { icon: 'bi-calendar-plus', label: 'Ödeme Planla',     bg: '#d6910b20', color: '#d6910b' },
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
    <div className="g-app">
      {/* Arka plan orb'ları */}
      <div className="g-orbs" aria-hidden="true">
        <div className="g-orb g-orb-1" />
        <div className="g-orb g-orb-2" />
        <div className="g-orb g-orb-3" />
      </div>

      {/* ── Sidebar ── */}
      <aside className="g-sidebar">
        {/* Logo */}
        <div className="g-logo">
          <div className="g-logo-icon">
            <i className="bi bi-shield-check" />
          </div>
          <span className="g-logo-text" style={{ fontFamily: 'var(--g-font-display)' }}>
            Finans Kalesi
          </span>
        </div>

        {/* Navigasyon */}
        <nav className="g-nav" role="navigation">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`g-nav-btn${activeMenu === item.id ? ' g-nav-active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
              type="button"
            >
              <i className={`bi ${item.icon} g-nav-icon`} aria-hidden="true" />
              <span className="g-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Alt alan */}
        <div className="g-sidebar-footer">
          <button
            className="g-quick-btn"
            onClick={() => setShowModal(true)}
            type="button"
          >
            <i className="bi bi-lightning-charge" aria-hidden="true" />
            <span>Hızlı İşlem</span>
          </button>

          {/* Kullanıcı */}
          <div className="g-user">
            <div className="g-user-avatar" aria-hidden="true">KD</div>
            <div className="g-user-info">
              <span className="g-user-name">Kaan Doğan</span>
              <span className="g-user-role">Admin</span>
            </div>
            <button className="g-user-dots" type="button" aria-label="Kullanıcı menüsü">
              <i className="bi bi-three-dots-vertical" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="g-main">
        {/* Topbar */}
        <header className="g-topbar">
          <div>
            <h1 className="g-page-title">Dashboard</h1>
            <span className="g-breadcrumb">Genel Bakış · Mart 2026</span>
          </div>
          <div className="g-topbar-right">
            <button className="g-icon-btn" type="button" aria-label="Ara">
              <i className="bi bi-search" aria-hidden="true" />
            </button>
            <button className="g-icon-btn" type="button" aria-label="Bildirimler">
              <i className="bi bi-bell" aria-hidden="true" />
              <span className="g-notif-dot" aria-hidden="true" />
            </button>
            <div className="g-topbar-avatar" role="img" aria-label="Profil">KD</div>
          </div>
        </header>

        {/* İçerik */}
        <main className="g-content">
          <Dashboard />
        </main>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="g-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="g-modal-title"
        >
          <div className="g-modal">
            <div className="g-modal-header">
              <h2 className="g-modal-title" id="g-modal-title">
                <i className="bi bi-lightning-charge" aria-hidden="true" />
                Hızlı İşlem
              </h2>
              <button
                className="g-modal-close"
                onClick={() => setShowModal(false)}
                type="button"
                aria-label="Kapat"
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            <div className="g-modal-body">
              <div className="g-modal-options">
                {modalOptions.map((opt) => (
                  <button
                    key={opt.label}
                    className="g-modal-option"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    <div
                      className="g-modal-opt-icon"
                      style={{ background: opt.bg, color: opt.color }}
                      aria-hidden="true"
                    >
                      <i className={`bi ${opt.icon}`} />
                    </div>
                    <span>{opt.label}</span>
                    <i className="bi bi-chevron-right ms-auto" style={{ color: 'var(--g-text-muted)' }} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div className="g-modal-footer">
              <button
                className="g-btn-ghost"
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
