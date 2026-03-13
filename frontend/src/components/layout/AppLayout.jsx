/**
 * AppLayout — Giriş yapılmış sayfaların ana iskelet düzeni
 * Bootstrap 5 tabanlı: Sol sidebar + sağ içerik alanı
 * Mobil: Offcanvas sidebar (React state ile kontrol edilir)
 * Masaüstü: Sabit sidebar (d-none d-lg-flex)
 */

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'

const menuOgeleri = [
  { yol: '/dashboard', etiket: 'Dashboard',     icon: 'bi-speedometer2'     },
  { yol: '/cariler',   etiket: 'Cari Hesaplar',  icon: 'bi-people'           },
  { yol: '/cek-senet', etiket: 'Çek / Senet',   icon: 'bi-file-earmark-text' },
  { yol: '/odemeler',  etiket: 'Ödemeler',       icon: 'bi-credit-card'      },
  { yol: '/kasa',      etiket: 'Varlık & Kasa',  icon: 'bi-safe'             },
]

/* Sidebar içeriği — mobil ve masaüstünde ortak kullanılır */
function SidebarIcerik({ kullanici, handleCikis, onKapat }) {
  return (
    <>
      {/* Logo */}
      <div className="d-flex align-items-center justify-content-between border-bottom"
           style={{ height: 64, padding: '0 20px' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="sidebar-logo-badge">
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: '-0.5px' }}>FK</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', lineHeight: 1.2 }}>
              Finans Kalesi
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              KOBİ Bankacılığı
            </div>
          </div>
        </div>
        {/* Mobilde kapat butonu */}
        {onKapat && (
          <button onClick={onKapat}
                  className="btn btn-sm d-lg-none"
                  style={{ color: '#94a3b8', padding: 4 }}>
            <i className="bi bi-x-lg" style={{ fontSize: 18 }}></i>
          </button>
        )}
      </div>

      {/* Navigasyon */}
      <nav className="flex-grow-1 overflow-auto p-2">
        {menuOgeleri.map((item) => (
          <NavLink
            key={item.yol}
            to={item.yol}
            onClick={onKapat}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            style={{ marginBottom: 2 }}
          >
            {({ isActive }) => (
              <>
                <i className={`bi ${item.icon}`}
                   style={{ fontSize: 17, color: isActive ? 'var(--brand-navy)' : '#94a3b8', flexShrink: 0 }} />
                <span className="flex-grow-1">{item.etiket}</span>
                {isActive && (
                  <i className="bi bi-chevron-right"
                     style={{ fontSize: 13, color: 'var(--brand-navy)', opacity: 0.6 }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Kullanıcı + Çıkış */}
      <div className="p-2 border-top">
        <div className="d-flex align-items-center gap-2 rounded-3 p-2"
             style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="sidebar-logo-badge flex-shrink-0">
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
              {kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'K'}
            </span>
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="text-truncate" style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
              {kullanici?.ad_soyad || 'Kullanıcı'}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'capitalize' }}>
              {kullanici?.rol || ''}
            </div>
          </div>
          <button
            onClick={handleCikis}
            title="Çıkış yap"
            className="btn btn-sm sidebar-cikis-btn"
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
      <aside className="sidebar-desktop d-none d-lg-flex flex-column flex-shrink-0 bg-white border-end">
        <SidebarIcerik
          kullanici={kullanici}
          handleCikis={handleCikis}
        />
      </aside>

      {/* ─── Ana İçerik ─────────────────────────────────────────────── */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>

        {/* Mobil Header */}
        <header className="d-flex d-lg-none align-items-center gap-3 bg-white border-bottom"
                style={{ height: 64, padding: '0 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => setSidebarAcik(true)}
            className="btn btn-sm"
            style={{ color: '#64748b', padding: 4 }}
          >
            <i className="bi bi-list" style={{ fontSize: 20 }}></i>
          </button>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Finans Kalesi</span>
        </header>

        {/* İçerik Alanı — açık gri arka plan, premium-card'lar burada öne çıkar */}
        <main className="flex-grow-1 overflow-auto" style={{ background: '#f8f9fa' }}>
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
