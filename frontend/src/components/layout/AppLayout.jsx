/**
 * AppLayout — Giriş yapılmış sayfaların ana iskelet düzeni
 * Bootstrap 5 tabanlı: Sol sidebar + sağ içerik alanı
 * Tasarım: Premium KOBİ Bankacılığı — Kurumsal Lacivert (#123F59)
 */

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Vault,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import useAuthStore from '../../stores/authStore'

const menuOgeleri = [
  { yol: '/dashboard', etiket: 'Dashboard',    icon: LayoutDashboard },
  { yol: '/cariler',   etiket: 'Cari Hesaplar', icon: Users           },
  { yol: '/cek-senet', etiket: 'Çek / Senet',  icon: FileText        },
  { yol: '/odemeler',  etiket: 'Ödemeler',      icon: CreditCard      },
  { yol: '/kasa',      etiket: 'Varlık & Kasa', icon: Vault           },
]

export default function AppLayout() {
  const [sidebarAcik, setSidebarAcik] = useState(false)
  const { kullanici, cikisYap } = useAuthStore()
  const navigate = useNavigate()

  const handleCikis = async () => {
    await cikisYap()
    navigate('/giris')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ─── Mobil Overlay ─────────────────────────────────────────────── */}
      {sidebarAcik && (
        <div
          onClick={() => setSidebarAcik(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 1040,
            backdropFilter: 'blur(2px)',
          }}
          className="d-lg-none"
        />
      )}

      {/* ─── Sidebar ───────────────────────────────────────────────────── */}
      <aside
        style={{
          width: 256,
          flexShrink: 0,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, bottom: 0, left: 0,
          zIndex: 1041,
          transform: sidebarAcik ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
        }}
        className="sidebar-panel"
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            height: 64, padding: '0 20px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: 34, height: 34,
                borderRadius: 10,
                background: 'var(--brand-navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(18,63,89,0.3)',
              }}
            >
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
          <button
            onClick={() => setSidebarAcik(false)}
            className="d-lg-none btn btn-sm"
            style={{ color: '#94a3b8', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigasyon */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
          {menuOgeleri.map((item) => (
            <NavLink
              key={item.yol}
              to={item.yol}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 10 }}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={17}
                    style={{ color: isActive ? 'var(--brand-navy)' : '#94a3b8', flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }}>{item.etiket}</span>
                  {isActive && <ChevronRight size={13} style={{ color: 'var(--brand-navy)', opacity: 0.6 }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Kullanıcı + Çıkış */}
        <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12, padding: '10px 12px',
            }}
          >
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'var(--brand-navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(18,63,89,0.25)',
              }}
            >
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                {kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'K'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {kullanici?.ad_soyad || 'Kullanıcı'}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'capitalize' }}>
                {kullanici?.rol || ''}
              </div>
            </div>
            <button
              onClick={handleCikis}
              title="Çıkış yap"
              style={{ background: 'none', border: 'none', padding: 4, color: '#94a3b8', cursor: 'pointer', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Desktop Sidebar (statik) ──────────────────────────────────── */}
      <aside
        className="d-none d-lg-flex flex-column"
        style={{
          width: 256,
          flexShrink: 0,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            height: 64, padding: '0 20px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'var(--brand-navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(18,63,89,0.3)',
              }}
            >
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
        </div>

        {/* Navigasyon */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {menuOgeleri.map((item) => (
            <NavLink
              key={item.yol}
              to={item.yol}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              style={{ marginBottom: 2 }}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={17}
                    style={{ color: isActive ? 'var(--brand-navy)' : '#94a3b8', flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }}>{item.etiket}</span>
                  {isActive && <ChevronRight size={13} style={{ color: 'var(--brand-navy)', opacity: 0.6 }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Kullanıcı + Çıkış */}
        <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12, padding: '10px 12px',
            }}
          >
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'var(--brand-navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(18,63,89,0.25)',
              }}
            >
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                {kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'K'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {kullanici?.ad_soyad || 'Kullanıcı'}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'capitalize' }}>
                {kullanici?.rol || ''}
              </div>
            </div>
            <button
              onClick={handleCikis}
              title="Çıkış yap"
              style={{ background: 'none', border: 'none', padding: 4, color: '#94a3b8', cursor: 'pointer', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Ana İçerik ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Mobil Header */}
        <header
          className="d-flex d-lg-none align-items-center gap-3"
          style={{
            height: 64, padding: '0 16px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <button
            onClick={() => setSidebarAcik(true)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Finans Kalesi</span>
        </header>

        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
