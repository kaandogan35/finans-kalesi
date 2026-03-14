/**
 * AppLayout — Obsidian Vault Koyu Tema
 * Sol sidebar (260px, glassmorphism) + sağ içerik alanı
 * Mobil: Offcanvas sidebar (React state ile kontrol edilir)
 * Masaüstü: Sabit sidebar (d-none d-lg-flex)
 */

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'

const menuOgeleri = [
  { yol: '/dashboard', etiket: 'Dashboard',     icon: 'bi-speedometer2'          },
  { yol: '/cariler',   etiket: 'Cari Hesaplar',  icon: 'bi-people-fill'           },
  { yol: '/cek-senet', etiket: 'Çek / Senet',   icon: 'bi-file-earmark-text-fill' },
  { yol: '/odemeler',  etiket: 'Ödemeler',       icon: 'bi-credit-card-2-fill'    },
  { yol: '/kasa',      etiket: 'Varlık & Kasa',  icon: 'bi-safe-fill'             },
]

/* Sidebar içeriği — mobil ve masaüstünde ortak kullanılır */
function SidebarIcerik({ kullanici, handleCikis, onKapat }) {
  return (
    <>
      {/* Logo */}
      <div className="d-flex align-items-center justify-content-between"
           style={{ padding: '28px 20px 8px' }}>
        <div className="d-flex align-items-center gap-3">
          <i className="bi bi-shield-lock-fill sidebar-logo-icon" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
              Finans Kalesi
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, textShadow: '0 0 10px rgba(255,255,255,0.05)' }}>
              Varlık Yönetimi
            </div>
          </div>
        </div>
        {/* Mobilde kapat butonu */}
        {onKapat && (
          <button onClick={onKapat}
                  className="btn btn-sm d-lg-none"
                  style={{ color: 'rgba(255,255,255,0.5)', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-x-lg" style={{ fontSize: 18 }}></i>
          </button>
        )}
      </div>

      {/* Ayırıcı çizgi */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 20px 12px' }} />

      {/* Navigasyon */}
      <nav className="flex-grow-1 overflow-auto" style={{ padding: '0 12px' }}>
        {menuOgeleri.map((item) => (
          <NavLink
            key={item.yol}
            to={item.yol}
            onClick={onKapat}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            style={{ marginBottom: 4 }}
          >
            {({ isActive }) => (
              <>
                <i className={`bi ${item.icon}`}
                   style={{ fontSize: 18, color: isActive ? '#f59e0b' : 'rgba(255,255,255,0.55)', flexShrink: 0, width: 22, textAlign: 'center' }} />
                <span className="flex-grow-1">{item.etiket}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Kullanıcı + Çıkış */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
        <div className="d-flex align-items-center gap-2 rounded-3 p-2"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex-shrink-0 d-flex align-items-center justify-content-center"
               style={{
                 width: 34, height: 34, borderRadius: 10,
                 background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                 boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
               }}>
            <span style={{ color: '#0d1b2e', fontSize: 12, fontWeight: 700 }}>
              {kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'K'}
            </span>
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="text-truncate" style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
              {kullanici?.ad_soyad || 'Kullanıcı'}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
              {kullanici?.rol || ''}
            </div>
          </div>
          <button
            onClick={handleCikis}
            title="Çıkış yap"
            className="sidebar-cikis-btn"
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: 15 }}></i>
          </button>
        </div>
      </div>
    </>
  )
}

export default function AppLayout() {
  const [sidebarAcik, setSidebarAcik] = useState(false)
  const { kullanici, cikisYap } = useAuthStore()
  const navigate = useNavigate()

  const handleCikis = async () => {
    await cikisYap()
    navigate('/giris')
  }

  const kapatSidebar = () => setSidebarAcik(false)

  return (
    <div className="d-flex vh-100 overflow-hidden">

      {/* ─── Mobil Overlay ─────────────────────────────────────────────── */}
      {sidebarAcik && (
        <div
          onClick={kapatSidebar}
          className="sidebar-overlay d-lg-none"
        />
      )}

      {/* ─── Mobil Sidebar (offcanvas tarzı, React state ile) ──────── */}
      <aside className={`sidebar-mobile d-lg-none d-flex flex-column ${sidebarAcik ? 'show' : ''}`}>
        <SidebarIcerik
          kullanici={kullanici}
          handleCikis={handleCikis}
          onKapat={kapatSidebar}
        />
      </aside>

      {/* ─── Masaüstü Sidebar (sabit) ─────────────────────────────── */}
      <aside className="sidebar-desktop d-none d-lg-flex flex-column flex-shrink-0">
        <SidebarIcerik
          kullanici={kullanici}
          handleCikis={handleCikis}
        />
      </aside>

      {/* ─── Ana İçerik ─────────────────────────────────────────────── */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>

        {/* Mobil Header */}
        <header className="d-flex d-lg-none align-items-center gap-3"
                style={{
                  height: 72, padding: '0 18px',
                  background: 'rgba(13,27,46,0.92)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
          <button
            onClick={() => setSidebarAcik(true)}
            className="btn btn-sm"
            style={{ color: '#f59e0b', padding: 6, minWidth: 48, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="bi bi-list" style={{ fontSize: 30 }}></i>
          </button>
          <div className="d-flex align-items-center gap-3">
            <i className="bi bi-shield-lock-fill" style={{ color: '#f59e0b', fontSize: 26, filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.35))' }} />
            <span style={{ fontWeight: 700, fontSize: 20, color: '#ffffff', letterSpacing: '-0.3px' }}>Finans Kalesi</span>
          </div>
        </header>

        {/* İçerik Alanı — şeffaf arka plan, body gradient'i görünsün */}
        <main className="flex-grow-1 overflow-auto" style={{ position: 'relative', zIndex: 1 }}>
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
