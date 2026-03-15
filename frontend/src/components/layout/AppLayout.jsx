/**
 * AppLayout — Obsidian Vault Koyu Tema v2
 * Premium glassmorphism sidebar + üst bar
 * koyu-tema.md + react-bootstrap-ui.md kurallarına uyar
 */

import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'

// ─── Menü Öğeleri ─────────────────────────────────────────────────────────────
const menuOgeleri = [
  { yol: '/dashboard', etiket: 'Dashboard',      icon: 'bi-speedometer2',             renk: '#f59e0b', rgb: '245,158,11'  },
  { yol: '/cariler',   etiket: 'Cari Hesaplar',   icon: 'bi-people-fill',              renk: '#10b981', rgb: '16,185,129'  },
  { yol: '/cek-senet', etiket: 'Çek / Senet',    icon: 'bi-file-earmark-text-fill',   renk: '#3b82f6', rgb: '59,130,246'  },
  { yol: '/odemeler',  etiket: 'Ödemeler',        icon: 'bi-credit-card-2-front-fill', renk: '#a78bfa', rgb: '167,139,250' },
  { yol: '/kasa',             etiket: 'Varlık & Kasa',    icon: 'bi-safe-fill',                renk: '#f59e0b', rgb: '245,158,11'  },
  { yol: '/vade-hesaplayici', etiket: 'Vade Hesaplayıcı', icon: 'bi-calculator-fill',          renk: '#06b6d4', rgb: '6,182,212'   },
  { yol: '/ayarlar/tema',     etiket: 'Tema Ayarları',    icon: 'bi-palette-fill',             renk: '#8b5cf6', rgb: '139,92,246'  },
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

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

  .fk-sidebar * { font-family: 'Outfit', sans-serif; box-sizing: border-box; }

  /* ── Menü linki ── */
  .fk-nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px 0 14px;
    height: 42px;
    border-radius: 11px;
    text-decoration: none !important;
    color: rgba(255,255,255,0.45);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.1px;
    position: relative;
    transition: color 0.16s ease, background 0.16s ease, border-color 0.16s ease;
    margin-bottom: 2px;
    border: 1px solid transparent;
    overflow: hidden;
  }

  /* Sol çubuk */
  .fk-nav-link::before {
    content: '';
    position: absolute;
    left: 0; top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 3px;
    height: 55%;
    border-radius: 0 3px 3px 0;
    background: #f59e0b;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .fk-nav-link:hover {
    color: rgba(255,255,255,0.8);
    background: rgba(255,255,255,0.045);
    border-color: rgba(255,255,255,0.055);
  }

  .fk-nav-link.active {
    color: #ffffff;
    background: linear-gradient(135deg,
      rgba(245,158,11,0.12) 0%,
      rgba(217,119,6,0.05) 100%
    );
    border-color: rgba(245,158,11,0.2);
    box-shadow: 0 2px 14px rgba(245,158,11,0.07), inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .fk-nav-link.active::before {
    transform: translateY(-50%) scaleY(1);
    box-shadow: 0 0 8px rgba(245,158,11,0.6);
  }

  /* ── İkon kutusu ── */
  .fk-nav-icon {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.16s ease;
    background: rgba(255,255,255,0.035);
  }
  .fk-nav-link:hover .fk-nav-icon { background: rgba(255,255,255,0.06); }
  .fk-nav-link.active .fk-nav-icon { background: rgba(255,255,255,0.07); }

  /* ── Aktif nokta animasyonu ── */
  .fk-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
    animation: fkDotPulse 2.4s ease-in-out infinite;
  }
  @keyframes fkDotPulse {
    0%, 100% { opacity: 1;   transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.8); }
  }

  /* ── Çıkış butonu ── */
  .fk-logout-btn {
    background: rgba(239,68,68,0.05);
    border: 1px solid rgba(239,68,68,0.13);
    color: rgba(239,68,68,0.65);
    border-radius: 8px;
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.16s ease;
  }
  .fk-logout-btn:hover {
    background: rgba(239,68,68,0.13);
    border-color: rgba(239,68,68,0.28);
    color: #f87171;
  }

  /* ── Sidebar yapıları ── */
  .fk-sidebar-desktop {
    width: 256px;
    background: linear-gradient(175deg, #0d1b2e 0%, #091525 100%);
    border-right: 1px solid rgba(245,158,11,0.07);
    position: relative;
    z-index: 10;
    flex-shrink: 0;
  }
  /* Gradient kenar efekti */
  .fk-sidebar-desktop::after {
    content: '';
    position: absolute;
    right: 0; top: 80px; bottom: 80px;
    width: 1px;
    background: linear-gradient(to bottom,
      transparent,
      rgba(245,158,11,0.14) 35%,
      rgba(245,158,11,0.14) 65%,
      transparent
    );
    pointer-events: none;
  }

  .fk-sidebar-mobile {
    position: fixed; left: 0; top: 0; bottom: 0;
    width: 256px; z-index: 1040;
    background: linear-gradient(175deg, #0d1b2e 0%, #091525 100%);
    border-right: 1px solid rgba(245,158,11,0.08);
    transform: translateX(-100%);
    transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fk-sidebar-mobile.show { transform: translateX(0); }

  /* ── Overlay ── */
  .fk-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 1039;
  }

  /* ── İçerik alanı ── */
  .page-container { padding: 24px; }
  @media (max-width: 767px) { .page-container { padding: 16px; } }

  /* ── Scrollbar ── */
  .fk-sidebar-desktop ::-webkit-scrollbar,
  .fk-sidebar-mobile ::-webkit-scrollbar  { width: 3px; }
  .fk-sidebar-desktop ::-webkit-scrollbar-thumb,
  .fk-sidebar-mobile ::-webkit-scrollbar-thumb {
    background: rgba(245,158,11,0.25); border-radius: 2px;
  }
`

// ─── Sidebar İçeriği ──────────────────────────────────────────────────────────
function SidebarIcerik({ kullanici, handleCikis, onKapat }) {
  return (
    <div className="fk-sidebar d-flex flex-column h-100">

      {/* ── Logo ── */}
      <div style={{ padding: '22px 14px 0' }}>
        <div className="d-flex align-items-center justify-content-between">

          <div className="d-flex align-items-center gap-3">
            {/* Logo kutusu */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 4px 18px rgba(245,158,11,0.38), 0 0 0 1px rgba(245,158,11,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-shield-lock-fill" style={{ fontSize: 18, color: '#0d1b2e' }} />
              </div>
              {/* Ambient glow */}
              <div style={{
                position: 'absolute', inset: -6, borderRadius: 19,
                background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: 15.5, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.4px' }}>
                Finans Kalesi
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 500, letterSpacing: '0.04em' }}>
                Varlık Yönetimi
              </div>
            </div>
          </div>

          {onKapat && (
            <button onClick={onKapat} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)', borderRadius: 8,
              width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <i className="bi bi-x-lg" style={{ fontSize: 12 }} />
            </button>
          )}
        </div>

        {/* Gradient divider */}
        <div style={{
          height: 1, marginTop: 18,
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07) 25%, rgba(255,255,255,0.07) 75%, transparent)',
        }} />
      </div>

      {/* ── Navigasyon ── */}
      <nav className="flex-grow-1 overflow-auto" style={{ padding: '12px 8px 0' }}>
        <p style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase',
          padding: '0 6px', margin: '0 0 7px',
        }}>
          Modüller
        </p>

        {menuOgeleri.map((item) => (
          <NavLink
            key={item.yol}
            to={item.yol}
            onClick={onKapat}
            className={({ isActive }) => `fk-nav-link${isActive ? ' active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {/* İkon */}
                <div className="fk-nav-icon">
                  <i
                    className={`bi ${item.icon}`}
                    style={{
                      fontSize: 13,
                      color: isActive ? item.renk : 'rgba(255,255,255,0.38)',
                      transition: 'color 0.16s ease',
                      filter: isActive ? `drop-shadow(0 0 4px rgba(${item.rgb},0.5))` : 'none',
                    }}
                  />
                </div>

                {/* Etiket */}
                <span className="flex-grow-1">{item.etiket}</span>

                {/* Aktif göstergesi */}
                {isActive && (
                  <span
                    className="fk-dot"
                    style={{
                      background: item.renk,
                      boxShadow: `0 0 6px rgba(${item.rgb},0.7)`,
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Kullanıcı Paneli ── */}
      <div style={{ padding: '8px 8px 12px', marginTop: 'auto' }}>
        {/* Divider */}
        <div style={{
          height: 1, marginBottom: 10,
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.065) 25%, rgba(255,255,255,0.065) 75%, transparent)',
        }} />

        <div className="d-flex align-items-center gap-2" style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.065)',
          borderRadius: 11, padding: '8px 10px',
        }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '0 2px 8px rgba(245,158,11,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#0d1b2e', fontSize: 12, fontWeight: 800 }}>
              {kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'K'}
            </span>
          </div>

          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="text-truncate" style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
              {kullanici?.ad_soyad || 'Kullanıcı'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', textTransform: 'capitalize', fontWeight: 500 }}>
              {kullanici?.rol || 'Kullanıcı'}
            </div>
          </div>

          <button onClick={handleCikis} title="Çıkış yap" className="fk-logout-btn">
            <i className="bi bi-box-arrow-right" style={{ fontSize: 13 }} />
          </button>
        </div>

        <p style={{ margin: '7px 0 0', fontSize: 9.5, color: 'rgba(255,255,255,0.16)', textAlign: 'center', fontWeight: 500, letterSpacing: '0.02em' }}>
          Finans Kalesi v0.9 Beta
        </p>
      </div>

    </div>
  )
}

// ─── Ana Layout ───────────────────────────────────────────────────────────────
export default function AppLayout() {
  const [sidebarAcik, setSidebarAcik] = useState(false)
  const { kullanici, cikisYap } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleCikis = async () => {
    await cikisYap()
    navigate('/giris')
  }

  const aktifSayfa = aktifSayfaBul(location.pathname)

  return (
    <div
      className="d-flex vh-100 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d1b2e 0%, #0a1628 50%, #0d1f35 100%)', backgroundAttachment: 'fixed' }}
    >
      <style>{CSS}</style>

      {/* ─── Mobil Overlay ── */}
      {sidebarAcik && (
        <div onClick={() => setSidebarAcik(false)} className="fk-overlay d-lg-none" />
      )}

      {/* ─── Mobil Sidebar ── */}
      <aside className={`fk-sidebar-mobile d-lg-none ${sidebarAcik ? 'show' : ''}`}>
        <SidebarIcerik
          kullanici={kullanici}
          handleCikis={handleCikis}
          onKapat={() => setSidebarAcik(false)}
        />
      </aside>

      {/* ─── Desktop Sidebar ── */}
      <aside className="fk-sidebar-desktop d-none d-lg-flex flex-column">
        <SidebarIcerik kullanici={kullanici} handleCikis={handleCikis} />
      </aside>

      {/* ─── İçerik Sütunu ── */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>

        {/* ── Desktop Top Bar ── */}
        <header
          className="d-none d-lg-flex align-items-center justify-content-between flex-shrink-0"
          style={{
            height: 58,
            padding: '0 26px',
            background: 'rgba(9,21,37,0.78)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderBottom: '1px solid rgba(255,255,255,0.052)',
            zIndex: 10,
          }}
        >
          {/* Sol: Aktif sayfa */}
          <div className="d-flex align-items-center gap-3">
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: `rgba(${aktifSayfa.rgb},0.09)`,
              border: `1px solid rgba(${aktifSayfa.rgb},0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 2px 10px rgba(${aktifSayfa.rgb},0.1)`,
            }}>
              <i className={`bi ${aktifSayfa.icon}`} style={{ fontSize: 14, color: aktifSayfa.renk }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>
                {aktifSayfa.etiket}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.36)', fontFamily: 'Outfit, sans-serif' }}>
                {bugunStr()}
              </p>
            </div>
          </div>

          {/* Sağ */}
          <div className="d-flex align-items-center gap-2">
            {/* Bildirim */}
            <button
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.4)', borderRadius: 8,
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.16s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
            >
              <i className="bi bi-bell" style={{ fontSize: 14 }} />
            </button>

            {/* Kullanıcı rozeti */}
            <div className="d-flex align-items-center gap-2" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '5px 12px 5px 6px',
              fontFamily: 'Outfit, sans-serif',
            }}>
              <div style={{
                width: 27, height: 27, borderRadius: 8,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#0d1b2e', fontSize: 11, fontWeight: 800 }}>
                  {kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'K'}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>
                {kullanici?.ad_soyad?.split(' ')[0] || 'Kullanıcı'}
              </span>
            </div>

            {/* Çıkış */}
            <button
              onClick={handleCikis}
              title="Çıkış yap"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.16)',
                color: '#f87171', borderRadius: 8,
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.16s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.13)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
            >
              <i className="bi bi-box-arrow-right" style={{ fontSize: 14 }} />
            </button>
          </div>
        </header>

        {/* ── Mobil Header ── */}
        <header
          className="d-flex d-lg-none align-items-center justify-content-between flex-shrink-0"
          style={{
            height: 62, padding: '0 16px',
            background: 'rgba(9,21,37,0.9)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.052)',
          }}
        >
          <button
            onClick={() => setSidebarAcik(true)}
            style={{
              background: 'none', border: 'none',
              color: '#f59e0b', cursor: 'pointer',
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="bi bi-list" style={{ fontSize: 26 }} />
          </button>

          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock-fill" style={{
              color: '#f59e0b', fontSize: 20,
              filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.45))',
            }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.3px', fontFamily: 'Outfit, sans-serif' }}>
              Finans Kalesi
            </span>
          </div>

          <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i
              className={`bi ${aktifSayfa.icon}`}
              style={{ fontSize: 18, color: aktifSayfa.renk, opacity: 0.75 }}
            />
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
