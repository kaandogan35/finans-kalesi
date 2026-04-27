import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useSwipeable } from 'react-swipeable'
import useAuthStore from '../../stores/authStore'
import useBildirimStore from '../../stores/bildirimStore'
import { guvenlikApi } from '../../api/guvenlik'
import { bildirim as toast } from '../ui/CenterAlert'
import { formatTelefon, telefonHam, telefonGecerliMi } from '../../utils/telefon'
import '../../temalar/paramgo.css'
import ParamGoLogo from '../../logo/ParamGoLogo'
import UpgradeBildirim from '../UpgradeBildirim'
import BildirimZili from '../BildirimZili'
import OturumUyari from '../OturumUyari'
import PaywallKoruyucu from '../PaywallKoruyucu'

// ─── Navigasyon menüsü ────────────────────────────────────────────────────────
const ISLEMLER_ITEMS = [
  { path: '/dashboard',        icon: 'bi-speedometer2',       label: 'Ana Ekran',              breadcrumb: 'Ana Ekran',             modul: 'dashboard'        },
  { path: '/cariler',          icon: 'bi-people',             label: 'Müşteriler & Firmalar',  breadcrumb: 'Müşteriler & Firmalar', modul: 'cari'             },
  { path: '/cek-senet',        icon: 'bi-file-earmark-text',  label: 'Çek & Senet Takibi',     breadcrumb: 'Çek & Senet Takibi',    modul: 'cek_senet'        },
  { path: '/odemeler',         icon: 'bi-calendar-check',     label: 'Tahsilat Takibi',        breadcrumb: 'Tahsilat Takibi',       modul: 'odemeler'         },
  { path: '/gelirler',         icon: 'bi-arrow-down-circle',  label: 'Gelirler',               breadcrumb: 'Gelirler',              modul: 'kasa'             },
  { path: '/giderler',         icon: 'bi-arrow-up-circle',    label: 'Giderler',               breadcrumb: 'Giderler',              modul: 'kasa'             },
  { path: '/tekrarlayan-islemler', icon: 'bi-arrow-repeat',   label: 'Sabit Gelir & Gider',    breadcrumb: 'Sabit Gelir & Gider',   modul: 'kasa'             },
  {
    icon: 'bi-safe', label: 'Kasa & Varlık', modul: 'kasa',
    children: [
      { path: '/kasa',             icon: 'bi-graph-up',      label: 'Kasa Özeti',       breadcrumb: 'Kasa Özeti'       },
      { path: '/kasa/bilanco',     icon: 'bi-journal-text',  label: 'Ay Sonu Özeti',    breadcrumb: 'Ay Sonu Özeti'    },
      { path: '/kasa/ortaklar',    icon: 'bi-people-fill',   label: 'Ortaklarım',       breadcrumb: 'Ortaklarım'       },
      { path: '/kasa/yatirimlar',  icon: 'bi-gem',           label: 'Döviz & Altın',    breadcrumb: 'Döviz & Altın'    },
    ]
  },
]

const ARACLAR_ITEMS = [
  { path: '/vade-hesaplayici', icon: 'bi-calculator',         label: 'Vade Hesapla',           breadcrumb: 'Vade Hesapla',          modul: 'vade_hesaplayici' },
  { path: '/veresiye',         icon: 'bi-journal-bookmark',   label: 'Veresiye Defteri',       breadcrumb: 'Veresiye Defteri',      modul: 'veresiye'         },
]

const TUM_MENU_ITEMS = [...ISLEMLER_ITEMS, ...ARACLAR_ITEMS]

function gorunurMenuHesapla(kullanici) {
  if (!kullanici || kullanici.rol === 'sahip') return TUM_MENU_ITEMS
  let izinliModuller = []
  try {
    const parsed = typeof kullanici.yetkiler === 'string'
      ? JSON.parse(kullanici.yetkiler)
      : (kullanici.yetkiler || {})
    izinliModuller = parsed?.moduller || []
  } catch { izinliModuller = [] }
  return TUM_MENU_ITEMS.filter(item => izinliModuller.includes(item.modul))
}

function aktifMenuBul(menuItems, pathname) {
  for (const item of menuItems) {
    if (item.children) {
      const child = item.children.find(c => pathname === c.path || pathname.startsWith(c.path + '/'))
      if (child) return child
    } else if (pathname === item.path || pathname.startsWith(item.path + '/')) {
      return item
    }
  }
  return menuItems[0]
}

function kisalt(adSoyad) {
  if (!adSoyad) return '?'
  const parcalar = adSoyad.trim().split(' ')
  if (parcalar.length === 1) return parcalar[0][0].toUpperCase()
  return (parcalar[0][0] + parcalar[parcalar.length - 1][0]).toUpperCase()
}

const rolEtiket = { sahip: 'Şirket Sahibi', admin: 'Yönetici', muhasebeci: 'Muhasebeci', personel: 'Personel' }

export default function AppLayoutParamGo() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('p-sidebar-collapsed') === 'true' } catch { return false }
  })
  const [kasaAccOpen, setKasaAccOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)
  const contentRef = useRef(null)

  const kullanici        = useAuthStore((s) => s.kullanici)
  const kullaniciGuncelle = useAuthStore((s) => s.kullaniciGuncelle)
  const cikisYap         = useAuthStore((s) => s.cikisYap)

  // Telefon eksik modal state (Apple/Google ile kayıt olup telefon girmeyenler)
  const [telefonEksikModal, setTelefonEksikModal] = useState(false)
  const [telefonEksikInput, setTelefonEksikInput] = useState('')
  const [telefonEksikKayit, setTelefonEksikKayit] = useState(false)

  useEffect(() => {
    if (kullanici?.telefon_eksik) setTelefonEksikModal(true)
  }, [kullanici?.telefon_eksik])

  const telefonEksikGecerli = telefonGecerliMi(telefonEksikInput)

  const telefonEksikKaydet = async () => {
    if (!telefonEksikGecerli) {
      toast.error('Geçerli bir cep telefonu girin (11 rakam, 0 ile başlamalı)')
      return
    }
    setTelefonEksikKayit(true)
    try {
      await guvenlikApi.profilGuncelle({
        ad_soyad: kullanici?.ad_soyad || 'ParamGo Kullanıcısı',
        telefon: telefonHam(telefonEksikInput),  // backend'e sadece rakamlar
      })
      kullaniciGuncelle({ telefon_eksik: false })
      setTelefonEksikModal(false)
      toast.success('Telefon numaranız kaydedildi')
    } catch (e) {
      const hata = e?.response?.data?.dogrulama?.telefon
        || e?.response?.data?.hata
        || 'Telefon kaydedilemedi'
      toast.error(hata)
    } finally {
      setTelefonEksikKayit(false)
    }
  }
  const navigate  = useNavigate()
  const location  = useLocation()
  const okunmamisSayisi = useBildirimStore((s) => s.okunmamisSayisi)

  const menuItems = useMemo(() => gorunurMenuHesapla(kullanici), [kullanici])
  const islemlerItems = useMemo(() => menuItems.filter(m => ISLEMLER_ITEMS.some(i => i.label === m.label || (i.children && i.label === m.label))), [menuItems])
  const araclarItems = useMemo(() => menuItems.filter(m => ARACLAR_ITEMS.some(i => i.path === m.path)), [menuItems])

  const aktifMenu = useMemo(() => aktifMenuBul(menuItems, location.pathname), [menuItems, location.pathname])

  const kasaAktif = location.pathname.startsWith('/kasa')
  useEffect(() => { setKasaAccOpen(kasaAktif) }, [kasaAktif])

  // Collapsible sidebar localStorage'a kaydet
  useEffect(() => {
    try { localStorage.setItem('p-sidebar-collapsed', sidebarCollapsed) } catch {}
  }, [sidebarCollapsed])

  // Mobilde sidebar küçültmeyi engelle
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e) => { if (e.matches) setSidebarCollapsed(false) }
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])


  useEffect(() => {
    document.title = 'ParamGo'
    return () => { document.title = 'ParamGo' }
  }, [])

  // Ana uygulama açıkken status bar ikonları koyu (açık arka plan)
  // Style.Light = siyah ikonlar (beyaz bg için doğru)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    window.__statusBarSetLight?.()
  }, [])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') { setSidebarOpen(false); setUserDropdownOpen(false) }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    // Koyu sidebar: Style.Dark = beyaz ikonlar | Açık bg: Style.Light = siyah ikonlar
    if (sidebarOpen) window.__statusBarSetDark?.()
    else window.__statusBarSetLight?.()
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  // User dropdown dışı tıklamada kapat
  useEffect(() => {
    const handleOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false)
      }
    }
    if (userDropdownOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [userDropdownOpen])

  const handleCikis = async () => {
    await cikisYap()
    navigate('/giris')
  }

  // ─── Modül Swipe ────────────────────────────────────────────────────────────
  // /cek-senet hariç tüm sayfalarda aktif (cek-senet kendi zone'unu yönetiyor)
  const MODUL_ROTALARI = ['/dashboard', '/cek-senet', '/kasa', '/cariler']
  const KENDI_SWIPE_ROTALARI = ['/cek-senet']

  const modulSwipeAktif = !sidebarOpen && !KENDI_SWIPE_ROTALARI.some(r =>
    location.pathname === r || location.pathname.startsWith(r + '/')
  )

  const mevcutModulIndex = MODUL_ROTALARI.findIndex(r =>
    location.pathname === r || location.pathname.startsWith(r + '/')
  )

  const modulSwipeHandlers = useSwipeable({
    onSwipedLeft: (e) => {
      if (!modulSwipeAktif) return
      if (mevcutModulIndex === -1) return
      if (e.event?.target?.closest?.('.p-swipe-wrapper')) return
      const next = mevcutModulIndex + 1
      if (next < MODUL_ROTALARI.length) navigate(MODUL_ROTALARI[next])
    },
    onSwipedRight: (e) => {
      if (!modulSwipeAktif) return
      if (mevcutModulIndex === -1) return
      if (e.event?.target?.closest?.('.p-swipe-wrapper')) return
      const prev = mevcutModulIndex - 1
      if (prev >= 0) navigate(MODUL_ROTALARI[prev])
    },
    delta: 25,
    swipeDuration: 250,
    trackMouse: false,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  })

  const contentRefCb = useCallback((node) => {
    contentRef.current = node
    modulSwipeHandlers.ref(node)
  }, [])

  const adKisalt = kisalt(kullanici?.ad_soyad)

  const renderNavItem = (item, idx) => {
    if (item.children) {
      return (
        <div key={`acc-${idx}`} className="p-nav-accordion">
          <button
            type="button"
            className={`p-nav-btn p-nav-acc-toggle${kasaAktif ? ' p-nav-acc-active' : ''}`}
            onClick={() => setKasaAccOpen(o => !o)}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <i className={`bi ${item.icon} p-nav-icon`} aria-hidden="true" />
            {!sidebarCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
            {!sidebarCollapsed && <i className={`bi bi-chevron-down p-nav-acc-arrow${kasaAccOpen ? ' open' : ''}`} aria-hidden="true" />}
          </button>
          {!sidebarCollapsed && (
            <div className={`p-nav-acc-body${kasaAccOpen ? ' open' : ''}`}>
              {item.children.map(child => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  end={child.path === '/kasa'}
                  className={({ isActive }) => `p-nav-btn p-nav-child${isActive ? ' p-nav-active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={`bi ${child.icon} p-nav-icon`} aria-hidden="true" />
                  <span>{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )
    }
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        title={sidebarCollapsed ? item.label : undefined}
      >
        <i className={`bi ${item.icon} p-nav-icon`} aria-hidden="true" />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </NavLink>
    )
  }

  return (
    <div className={`p-app${sidebarCollapsed ? ' p-app-collapsed' : ''}`}>

      {/* ── Mobil overlay ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="p-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`p-sidebar${sidebarOpen ? ' p-sidebar-open' : ''}${sidebarCollapsed ? ' p-sidebar-collapsed' : ''}`} role="navigation" aria-label="Ana menü" data-tur="sol-menu">

        {/* Logo + collapse toggle */}
        <div className="p-logo">
          <ParamGoLogo size="sm" variant={sidebarCollapsed ? 'icon' : 'dark'} />
          <button
            type="button"
            className="p-sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(o => !o)}
            aria-label={sidebarCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
            title={sidebarCollapsed ? 'Genişlet' : 'Daralt'}
          >
            <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} aria-hidden="true" />
          </button>
        </div>

        {/* İşlemler bölümü */}
        {!sidebarCollapsed && (
          <div className="p-nav-section">
            <span className="p-nav-section-label">İşlemler</span>
          </div>
        )}

        {/* Ana navigasyon */}
        <nav className="p-nav">
          {islemlerItems.map((item, idx) => renderNavItem(item, idx))}

          {/* Araçlar bölümü */}
          {araclarItems.length > 0 && (
            <>
              {!sidebarCollapsed && (
                <div className="p-nav-section" style={{ marginTop: 8 }}>
                  <span className="p-nav-section-label">Araçlar</span>
                </div>
              )}
              {sidebarCollapsed && <div className="p-nav-divider" />}
              {araclarItems.map((item, idx) => renderNavItem(item, `arac-${idx}`))}
            </>
          )}

          {/* Sistem bölümü */}
          <>
            {!sidebarCollapsed && (
              <div className="p-nav-section" style={{ marginTop: 8 }}>
                <span className="p-nav-section-label">Sistem</span>
              </div>
            )}
            {sidebarCollapsed && <div className="p-nav-divider" />}

            <NavLink
              to="/raporlar"
              className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? 'Raporlarım' : undefined}
            >
              <i className="bi bi-bar-chart-line p-nav-icon" aria-hidden="true" />
              {!sidebarCollapsed && <span>Raporlarım</span>}
            </NavLink>
            <NavLink
              to="/abonelik"
              className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? 'Aboneliğim' : undefined}
            >
              <i className="bi bi-credit-card p-nav-icon" aria-hidden="true" />
              {!sidebarCollapsed && <span>Aboneliğim</span>}
            </NavLink>
            <NavLink
              to="/ayarlar"
              className={({ isActive }) => `p-nav-btn${isActive ? ' p-nav-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? 'Ayarlar' : undefined}
            >
              <i className="bi bi-gear p-nav-icon" aria-hidden="true" />
              {!sidebarCollapsed && <span style={{ flex: 1 }}>Ayarlar</span>}
              {!sidebarCollapsed && okunmamisSayisi > 0 && (
                <span className="p-nav-badge">{okunmamisSayisi > 99 ? '99+' : okunmamisSayisi}</span>
              )}
              {sidebarCollapsed && okunmamisSayisi > 0 && (
                <span className="p-nav-badge-dot" />
              )}
            </NavLink>
          </>
        </nav>

        {/* Kullanıcı profili dropdown */}
        <div className="p-user-area" ref={userDropdownRef}>
          {userDropdownOpen && (
            <div className="p-user-dropdown">
              <NavLink
                to="/ayarlar"
                className="p-user-dropdown-item"
                onClick={() => { setSidebarOpen(false); setUserDropdownOpen(false) }}
              >
                <i className="bi bi-gear" aria-hidden="true" />
                <span>Ayarlar</span>
              </NavLink>
              <div className="p-user-dropdown-sep" />
              <button
                type="button"
                className="p-user-dropdown-item p-user-dropdown-cikis"
                onClick={handleCikis}
              >
                <i className="bi bi-box-arrow-right" aria-hidden="true" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          )}
          <button
            type="button"
            className={`p-user${userDropdownOpen ? ' p-user-open' : ''}`}
            onClick={() => setUserDropdownOpen(o => !o)}
            aria-expanded={userDropdownOpen}
            aria-haspopup="true"
            title={sidebarCollapsed ? `${kullanici?.ad_soyad || 'Kullanıcı'} — ${rolEtiket[kullanici?.rol] || kullanici?.rol}` : undefined}
          >
            <div className="p-user-avatar" aria-hidden="true">{adKisalt}</div>
            {!sidebarCollapsed && (
              <>
                <div className="p-user-info">
                  <span className="p-user-name">{kullanici?.ad_soyad || 'Kullanıcı'}</span>
                  <span className="p-user-role">{rolEtiket[kullanici?.rol] || kullanici?.rol}</span>
                </div>
                <i className={`bi bi-three-dots-vertical p-user-dots-icon`} aria-hidden="true" />
              </>
            )}
          </button>
        </div>

      </aside>

      {/* ── Ana İçerik ─────────────────────────────────────────────────── */}
      <div className="p-main">

        {/* Topbar */}
        <header className="p-topbar">
          <Link to="/dashboard" className="p-topbar-brand" style={{ textDecoration: 'none' }}>
            <ParamGoLogo size="xs" />
          </Link>

          <div className="p-topbar-right">
            <BildirimZili />
            {/* Hamburger (sadece mobil) */}
            <button
              className="p-icon-btn p-hamburger"
              type="button"
              aria-label="Menüyü aç"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>

          </div>
        </header>

        {/* Upgrade bildirimi (ücretsiz plan) */}
        <UpgradeBildirim />

        {/* Sayfa içeriği */}
        <main className="p-content" ref={contentRefCb}>
          <Outlet />
        </main>

      </div>

      {/* ── Telefon Eksik Modal — Apple/Google sosyal giriş ─── */}
      {telefonEksikModal && createPortal(
        <>
          <div className="p-modal-overlay" />
          <div className="p-modal-center" role="dialog" aria-modal="true">
            <div className="p-modal-box" style={{ maxWidth: 420 }}>
              <div className="p-modal-header p-mh-default">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-modal-icon p-modal-icon-green">
                    <i className="bi bi-telephone-fill" />
                  </div>
                  <div>
                    <h2 className="p-modal-title">Telefon Numaranızı Ekleyin</h2>
                    <p className="p-modal-sub">Hesabınızla ilgili size ulaşabilmemiz için</p>
                  </div>
                </div>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); telefonEksikKaydet() }}
                style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}
              >
                <div className="p-modal-body">
                  <label className="p-kasa-input-label">Cep Telefonu *</label>
                  <input
                    className="p-kasa-input"
                    placeholder="0530 123 45 67"
                    value={formatTelefon(telefonEksikInput)}
                    onChange={(e) => setTelefonEksikInput(telefonHam(e.target.value))}
                    inputMode="numeric"
                    type="tel"
                    autoComplete="tel"
                    pattern="[0-9 ]*"
                    maxLength={13}
                    autoFocus
                  />
                </div>
                <div className="p-modal-footer d-flex justify-content-end">
                  <button
                    type="submit"
                    className="p-btn-save"
                    disabled={telefonEksikKayit || !telefonEksikGecerli}
                  >
                    {telefonEksikKayit
                      ? <><span className="spinner-border spinner-border-sm me-1" />Kaydediliyor...</>
                      : <><i className="bi bi-check2-circle me-1" />Kaydet ve Devam Et</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ── Oturum Uyarı Modalı ─────────────────────────────── */}
      <OturumUyari />

      {/* ── Paywall Koruyucu — iOS deneme planı yazma koruması ── */}
      <PaywallKoruyucu />

      {/* ── Mobil Alt Menü ─────────────────────────────────────── */}
      <nav className="p-bottom-nav" aria-label="Alt menü">
        {[
          { path: '/dashboard',  icon: 'bi-speedometer2',      label: 'Ana Ekran' },
          { path: '/cek-senet',  icon: 'bi-file-earmark-text', label: 'Çek/Senet' },
          { path: '/kasa',       icon: 'bi-safe',              label: 'Kasa' },
          { path: '/cariler',    icon: 'bi-people',            label: 'Cari' },
        ].map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `p-bnav-item${isActive ? ' active' : ''}`}
          >
            <i className={`bi ${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`p-bnav-item${sidebarOpen ? ' active' : ''}`}
          onClick={() => setSidebarOpen(true)}
        >
          <i className="bi bi-grid" />
          <span>Menü</span>
        </button>
      </nav>

    </div>
  )
}
