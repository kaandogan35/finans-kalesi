/**
 * AppLayout — Obsidian Vault Koyu Tema v2
 * Premium glassmorphism sidebar + üst bar
 * koyu-tema.md + react-bootstrap-ui.md kurallarına uyar
 */

import { useState, useMemo } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import UpgradeBildirim from '../UpgradeBildirim'
import ParamGoLogo from '../../logo/ParamGoLogo'

// ─── Menü Öğeleri ─────────────────────────────────────────────────────────────
const TUM_MENU = [
  { yol: '/dashboard',        etiket: 'Dashboard',        icon: 'bi-speedometer2',             renk: '#10B981', rgb: '16,185,129', modul: 'dashboard'         },
  { yol: '/cariler',          etiket: 'Cari Hesaplar',    icon: 'bi-people-fill',              renk: '#10B981', rgb: '16,185,129', modul: 'cari'              },
  { yol: '/cek-senet',        etiket: 'Çek / Senet',      icon: 'bi-file-earmark-text-fill',   renk: '#10B981', rgb: '16,185,129', modul: 'cek_senet'         },
  { yol: '/odemeler',         etiket: 'Ödemeler',         icon: 'bi-credit-card-2-front-fill', renk: '#10B981', rgb: '16,185,129', modul: 'odemeler'          },
  { yol: '/kasa',             etiket: 'Varlık & Kasa',    icon: 'bi-safe-fill',                renk: '#10B981', rgb: '16,185,129', modul: 'kasa'              },
  { yol: '/vade-hesaplayici', etiket: 'Vade Hesaplayıcı', icon: 'bi-calculator-fill',          renk: '#10B981', rgb: '16,185,129', modul: 'vade_hesaplayici'  },
  { yol: '/kullanicilar',     etiket: 'Kullanıcılar',     icon: 'bi-person-gear',              renk: '#10B981', rgb: '16,185,129', modul: '__sahip_only__'    },
  { yol: '/ayarlar/tema',     etiket: 'Tema Ayarları',    icon: 'bi-palette-fill',             renk: '#10B981', rgb: '16,185,129', modul: null                },
]

function gorunurMenuHesapla(kullanici) {
  if (!kullanici) return TUM_MENU
  if (kullanici.rol === 'sahip') return TUM_MENU

  let izinliModuller = []
  try {
    const parsed = typeof kullanici.yetkiler === 'string'
      ? JSON.parse(kullanici.yetkiler)
      : (kullanici.yetkiler || {})
    izinliModuller = parsed?.moduller || []
  } catch {
    izinliModuller = []
  }

  return TUM_MENU.filter(item => {
    if (item.modul === '__sahip_only__') return false
    if (item.modul === null) return true
    return izinliModuller.includes(item.modul)
  })
}

// ─── Aktif Sayfa Başlığı ──────────────────────────────────────────────────────
function aktifSayfaBul(pathname, menuListesi) {
  const eslesen = [...menuListesi]
    .sort((a, b) => b.yol.length - a.yol.length)
    .find(m => pathname.startsWith(m.yol))
  return eslesen || menuListesi[0] || TUM_MENU[0]
}

// ─── Tarih Formatı ─────────────────────────────────────────────────────────────
function bugunStr() {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}


// ─── Sidebar İçeriği ──────────────────────────────────────────────────────────
function SidebarIcerik({ kullanici, handleCikis, onKapat, menuOgeleri }) {
  return (
    <div className="fk-sidebar d-flex flex-column h-100">

      {/* ── Logo ── */}
      <div style={{ padding: '22px 14px 0' }}>
        <div className="d-flex align-items-center justify-content-between">

          <ParamGoLogo size="sm" variant="dark" />

          {onKapat && (
            <button onClick={onKapat} style={{
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid #E5E7EB',
              color: '#6B7280', borderRadius: 8,
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
          background: 'linear-gradient(to right, transparent, #E5E7EB 25%, #E5E7EB 75%, transparent)',
        }} />
      </div>

      {/* ── Navigasyon ── */}
      <nav className="flex-grow-1 overflow-auto" style={{ padding: '12px 8px 0' }}>
        <p style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em',
          color: '#9CA3AF', textTransform: 'uppercase',
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
                      color: isActive ? item.renk : '#9CA3AF',
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
          background: 'linear-gradient(to right, transparent, #E5E7EB 25%, #E5E7EB 75%, transparent)',
        }} />

        <div className="d-flex align-items-center gap-2" style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 11, padding: '8px 10px',
        }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            boxShadow: '0 2px 8px rgba(16,185,129,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 800 }}>
              {kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'K'}
            </span>
          </div>

          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="text-truncate" style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
              {kullanici?.ad_soyad || 'Kullanıcı'}
            </div>
            <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'capitalize', fontWeight: 500 }}>
              {kullanici?.rol || 'Kullanıcı'}
            </div>
          </div>

          <button onClick={handleCikis} title="Çıkış yap" className="fk-logout-btn">
            <i className="bi bi-box-arrow-right" style={{ fontSize: 13 }} />
          </button>
        </div>

        <p style={{ margin: '7px 0 0', fontSize: 9.5, color: '#D1D5DB', textAlign: 'center', fontWeight: 500, letterSpacing: '0.02em' }}>
          ParamGo v0.9 Beta
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

  const menuOgeleri = useMemo(() => gorunurMenuHesapla(kullanici), [kullanici])
  const aktifSayfa = aktifSayfaBul(location.pathname, menuOgeleri)

  return (
    <div
      className="d-flex vh-100 overflow-hidden"
      style={{ background: '#F8F9FA', backgroundAttachment: 'fixed' }}
    >
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
          menuOgeleri={menuOgeleri}
        />
      </aside>

      {/* ─── Desktop Sidebar ── */}
      <aside className="fk-sidebar-desktop d-none d-lg-flex flex-column">
        <SidebarIcerik kullanici={kullanici} handleCikis={handleCikis} menuOgeleri={menuOgeleri} />
      </aside>

      {/* ─── İçerik Sütunu ── */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>

        {/* ── Desktop Top Bar ── */}
        <header
          className="d-none d-lg-flex align-items-center justify-content-between flex-shrink-0"
          style={{
            height: 58,
            padding: '0 26px',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderBottom: '1px solid #E5E7EB',
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
              <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px', lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>
                {aktifSayfa.etiket}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontFamily: 'Outfit, sans-serif' }}>
                {bugunStr()}
              </p>
            </div>
          </div>

          {/* Sağ */}
          <div className="d-flex align-items-center gap-2">
            {/* Bildirim */}
            <button
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                color: '#6B7280', borderRadius: 8,
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.16s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#111827' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#6B7280' }}
            >
              <i className="bi bi-bell" style={{ fontSize: 14 }} />
            </button>

            {/* Kullanıcı rozeti */}
            <div className="d-flex align-items-center gap-2" style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 10, padding: '5px 12px 5px 6px',
              fontFamily: 'Outfit, sans-serif',
            }}>
              <div style={{
                width: 27, height: 27, borderRadius: 8,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 800 }}>
                  {kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'K'}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
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
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <button
            onClick={() => setSidebarAcik(true)}
            style={{
              background: 'none', border: 'none',
              color: '#10B981', cursor: 'pointer',
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="bi bi-list" style={{ fontSize: 26 }} />
          </button>

          <ParamGoLogo size="xs" variant="dark" />

          <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i
              className={`bi ${aktifSayfa.icon}`}
              style={{ fontSize: 18, color: aktifSayfa.renk, opacity: 0.75 }}
            />
          </div>
        </header>

        {/* Upgrade bildirimi (ücretsiz plan) */}
        <UpgradeBildirim />

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
