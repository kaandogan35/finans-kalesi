/**
 * AppLayout — Obsidian Vault Koyu Tema
 * Sol sidebar (260px, glassmorphism) + sağ içerik alanı
 * Desktop: Sidebar + üst başlık barı
 * Mobil: Offcanvas sidebar + header (React state ile kontrol)
 * koyu-tema.md + react-bootstrap-ui.md kurallarına uyar
 */

import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'

// ─── Menü Öğeleri ─────────────────────────────────────────────────────────────
const menuOgeleri = [
  { yol: '/dashboard', etiket: 'Dashboard',      icon: 'bi-speedometer2'           },
  { yol: '/cariler',   etiket: 'Cari Hesaplar',   icon: 'bi-people-fill'            },
  { yol: '/cek-senet', etiket: 'Çek / Senet',    icon: 'bi-file-earmark-text-fill'  },
  { yol: '/odemeler',  etiket: 'Ödemeler',        icon: 'bi-credit-card-2-fill'     },
  { yol: '/kasa',      etiket: 'Varlık & Kasa',   icon: 'bi-safe-fill'              },
]

// ─── Aktif Sayfa Başlığı ──────────────────────────────────────────────────────
function aktifSayfaBul(pathname) {
  const eslesen = [...menuOgeleri]
    .sort((a, b) => b.yol.length - a.yol.length)
    .find(m => pathname.startsWith(m.yol))
  return eslesen || menuOgeleri[0]
}

// ─── Tarih Formatı ─────────────────────────────────────────────────────────────
function bugunStr() {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// ─── Sidebar İçeriği ──────────────────────────────────────────────────────────
function SidebarIcerik({ kullanici, handleCikis, onKapat }) {
  return (
    <>
      {/* Logo */}
      <div className="d-flex align-items-center justify-content-between"
           style={{ padding: '24px 20px 8px' }}>
        <div className="d-flex align-items-center gap-3">
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="bi bi-shield-lock-fill" style={{ fontSize: 18, color: '#0d1b2e' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
              Finans Kalesi
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
              Varlık Yönetimi
            </div>
          </div>
        </div>
        {/* Mobilde kapat butonu */}
        {onKapat && (
          <button
            onClick={onKapat}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)', borderRadius: 8,
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <i className="bi bi-x-lg" style={{ fontSize: 13 }} />
          </button>
        )}
      </div>

      {/* Ayırıcı */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '14px 20px 10px' }} />

      {/* Navigasyon */}
      <nav className="flex-grow-1 overflow-auto" style={{ padding: '0 10px' }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
          padding: '0 10px', margin: '0 0 6px',
        }}>
          Modüller
        </p>
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
                <i
                  className={`bi ${item.icon}`}
                  style={{
                    fontSize: 17,
                    color: isActive ? '#f59e0b' : 'rgba(255,255,255,0.45)',
                    flexShrink: 0, width: 20, textAlign: 'center',
                    transition: 'color 150ms',
                  }}
                />
                <span className="flex-grow-1">{item.etiket}</span>
                {isActive && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#f59e0b',
                    boxShadow: '0 0 8px rgba(245,158,11,0.6)',
                    flexShrink: 0,
                  }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Kullanıcı + Çıkış */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
        <div
          className="d-flex align-items-center gap-2"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '8px 10px',
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#0d1b2e', fontSize: 12, fontWeight: 800 }}>
              {kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'K'}
            </span>
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="text-truncate" style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {kullanici?.ad_soyad || 'Kullanıcı'}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
              {kullanici?.rol || 'Kullanıcı'}
            </div>
          </div>
          <button
            onClick={handleCikis}
            title="Çıkış yap"
            className="sidebar-cikis-btn"
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: 14 }} />
          </button>
        </div>

        {/* Versiyon */}
        <p style={{ margin: '8px 4px 0', fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
          Finans Kalesi v0.9 Beta
        </p>
      </div>
    </>
  )
}

// ─── Ana Layout ───────────────────────────────────────────────────────────────
export default function AppLayout() {
  const [sidebarAcik, setSidebarAcik] = useState(false)
  const { kullanici, cikisYap } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleCikis = async () => {
    await cikisYap()
    navigate('/giris')
  }

  const aktifSayfa = aktifSayfaBul(location.pathname)

  return (
    <div className="d-flex vh-100 overflow-hidden">

      {/* ─── Mobil Overlay ──────────────────────────────────────────────── */}
      {sidebarAcik && (
        <div onClick={() => setSidebarAcik(false)} className="sidebar-overlay d-lg-none" />
      )}

      {/* ─── Mobil Sidebar ──────────────────────────────────────────────── */}
      <aside className={`sidebar-mobile d-lg-none d-flex flex-column ${sidebarAcik ? 'show' : ''}`}>
        <SidebarIcerik
          kullanici={kullanici}
          handleCikis={handleCikis}
          onKapat={() => setSidebarAcik(false)}
        />
      </aside>

      {/* ─── Desktop Sidebar ────────────────────────────────────────────── */}
      <aside className="sidebar-desktop d-none d-lg-flex flex-column flex-shrink-0">
        <SidebarIcerik kullanici={kullanici} handleCikis={handleCikis} />
      </aside>

      {/* ─── İçerik Sütunu ──────────────────────────────────────────────── */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>

        {/* ── Desktop Top Bar ── */}
        <header
          className="d-none d-lg-flex align-items-center justify-content-between flex-shrink-0"
          style={{
            height: 60,
            padding: '0 28px',
            background: 'rgba(10,22,40,0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            zIndex: 10,
          }}
        >
          {/* Sol: Aktif sayfa ikonu + adı */}
          <div className="d-flex align-items-center gap-3">
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`bi ${aktifSayfa.icon}`} style={{ fontSize: 14, color: '#f59e0b' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                {aktifSayfa.etiket}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
                {bugunStr()}
              </p>
            </div>
          </div>

          {/* Sağ: Kullanıcı rozeti */}
          <div className="d-flex align-items-center gap-3">
            {/* Bildirim ikonu (ileride aktif edilecek) */}
            <button style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)', borderRadius: 8,
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              <i className="bi bi-bell" style={{ fontSize: 14 }} />
            </button>

            {/* Kullanıcı */}
            <div className="d-flex align-items-center gap-2" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '5px 12px 5px 7px',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#0d1b2e', fontSize: 11, fontWeight: 800 }}>
                  {kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'K'}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                {kullanici?.ad_soyad?.split(' ')[0] || 'Kullanıcı'}
              </span>
            </div>

            {/* Çıkış */}
            <button
              onClick={handleCikis}
              title="Çıkış yap"
              style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', borderRadius: 8,
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
            >
              <i className="bi bi-box-arrow-right" style={{ fontSize: 14 }} />
            </button>
          </div>
        </header>

        {/* ── Mobil Header ── */}
        <header
          className="d-flex d-lg-none align-items-center justify-content-between flex-shrink-0"
          style={{
            height: 64, padding: '0 16px',
            background: 'rgba(10,22,40,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Sol: Hamburger */}
          <button
            onClick={() => setSidebarAcik(true)}
            style={{
              background: 'none', border: 'none',
              color: '#f59e0b', cursor: 'pointer',
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="bi bi-list" style={{ fontSize: 28 }} />
          </button>

          {/* Orta: Logo */}
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock-fill" style={{
              color: '#f59e0b', fontSize: 22,
              filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.35))',
            }} />
            <span style={{ fontWeight: 700, fontSize: 17, color: '#fff', letterSpacing: '-0.3px' }}>
              Finans Kalesi
            </span>
          </div>

          {/* Sağ: Aktif sayfa ikonu */}
          <div style={{
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={`bi ${aktifSayfa.icon}`} style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />
          </div>
        </header>

        {/* ── İçerik Alanı ── */}
        <main className="flex-grow-1 overflow-auto" style={{ position: 'relative', zIndex: 1 }}>
          <div className="page-container">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  )
}
