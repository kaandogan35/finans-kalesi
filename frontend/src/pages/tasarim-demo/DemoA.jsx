/**
 * Demo A — Ivory & Navy
 * Premium corporate banking interface. Dark navy sidebar contrasts with
 * warm ivory/white content area. Gold/amber accents signal premium status.
 * Think: private banking portal.
 */
import { useState, useEffect } from 'react'

/* ─── Mock Veri ─────────────────────────────────────── */
const menuler = [
  { ikon: 'bi-speedometer2',      etiket: 'Dashboard',      aktif: true  },
  { ikon: 'bi-people',            etiket: 'Cari Hesaplar',  aktif: false },
  { ikon: 'bi-file-earmark-text', etiket: 'Çek/Senet',      aktif: false },
  { ikon: 'bi-credit-card',       etiket: 'Ödemeler',       aktif: false },
  { ikon: 'bi-safe',              etiket: 'Varlık & Kasa',  aktif: false },
]

const kpiVerileri = [
  { baslik: 'Toplam Bakiye', tutar: 2458320, renk: '#0f172a', ikon: 'bi-wallet2',        ikonBg: '#fef3c7', ikonRenk: '#f59e0b' },
  { baslik: 'Alacaklar',     tutar: 856400,  renk: '#059669', ikon: 'bi-arrow-down-left', ikonBg: '#ecfdf5', ikonRenk: '#059669' },
  { baslik: 'Borçlar',       tutar: 412800,  renk: '#dc2626', ikon: 'bi-arrow-up-right',  ikonBg: '#fef2f2', ikonRenk: '#dc2626' },
  { baslik: 'Nakit',         tutar: 1189120, renk: '#2563eb', ikon: 'bi-cash-stack',      ikonBg: '#eff6ff', ikonRenk: '#2563eb' },
]

const islemler = [
  { tarih: '14 Mar 2026', firma: 'Demir-Çelik A.Ş.',   tur: 'Çek Tahsilat',    tutar: 85000,  giris: true,  durum: 'Tamamlandı'  },
  { tarih: '13 Mar 2026', firma: 'İnşaat Malz. Ltd.',  tur: 'Havale Gönderim', tutar: 42500,  giris: false, durum: 'Tamamlandı'  },
  { tarih: '13 Mar 2026', firma: 'Çelik Boru San.',    tur: 'Açık Hesap',      tutar: 31200,  giris: true,  durum: 'Beklemede'   },
  { tarih: '12 Mar 2026', firma: 'Yapı Malz. Tic.',    tur: 'Tedarikçi Ödeme', tutar: 18750,  giris: false, durum: 'Tamamlandı'  },
  { tarih: '11 Mar 2026', firma: 'Hırdavat Dünyası',  tur: 'Nakit Satış',     tutar: 10850,  giris: true,  durum: 'Tamamlandı'  },
  { tarih: '10 Mar 2026', firma: 'Metal San. Ltd.',     tur: 'Çek Verme',       tutar: 65000,  giris: false, durum: 'Vadesi Geldi'},
]

const vadeler = [
  { tarih: '18 Mar', firma: 'Demir-Çelik A.Ş.',  tutar: 85000,  giris: true  },
  { tarih: '22 Mar', firma: 'İnşaat Malz. Ltd.', tutar: 42500,  giris: false },
  { tarih: '25 Mar', firma: 'Çelik Boru San.',   tutar: 31200,  giris: true  },
]

const hizliIslemler = [
  { ikon: 'bi-file-earmark-plus', etiket: 'Çek Ekle',    modal: true  },
  { ikon: 'bi-send',              etiket: 'Ödeme Yap',   modal: false },
  { ikon: 'bi-person-plus',       etiket: 'Cari Ekle',   modal: false },
  { ikon: 'bi-box-arrow-in-down', etiket: 'Kasa Girişi', modal: false },
]

const TL = (n) => new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY', maximumFractionDigits: 0
}).format(n)

const durumStil = {
  'Tamamlandı':  { bg: '#ecfdf5', renk: '#059669' },
  'Beklemede':   { bg: '#fef3c7', renk: '#d97706' },
  'Vadesi Geldi':{ bg: '#fef2f2', renk: '#dc2626' },
}

const bugun = new Date().toLocaleDateString('tr-TR', {
  day: 'numeric', month: 'long', year: 'numeric'
})

/* ─── Ana Bileşen ───────────────────────────────────── */
export default function DemoA() {
  const [sidebarAcik, setSidebarAcik]   = useState(false)
  const [modalAcik, setModalAcik]       = useState(false)
  const [hoveredMenu, setHoveredMenu]   = useState(null)
  const [hoveredRow, setHoveredRow]     = useState(null)
  const [hoveredKpi, setHoveredKpi]     = useState(null)
  const [hoveredBtn, setHoveredBtn]     = useState(null)
  const [hoveredVade, setHoveredVade]   = useState(null)

  /* ESC ile modal kapat */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && modalAcik) setModalAcik(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [modalAcik])

  return (
    <>
      <style>{`
        /* ─── Reset & Base ─────────────────────────── */
        .da-wrapper {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f4f6f9;
          min-height: 100vh;
          display: flex;
          color: #0f172a;
        }

        /* ─── Sidebar ─────────────────────────────── */
        .da-sidebar {
          width: 260px;
          min-height: 100vh;
          background: #0d1b2e;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1040;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
        }

        .da-sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .da-logo-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #f59e0b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 16px;
          color: #0d1b2e;
          flex-shrink: 0;
        }

        .da-logo-text {
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
        }

        .da-logo-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          font-weight: 500;
          margin-top: 1px;
        }

        .da-sidebar-nav {
          flex: 1;
          padding: 16px 0;
          overflow-y: auto;
        }

        .da-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          margin: 2px 10px;
          border-radius: 10px;
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          min-height: 44px;
          text-decoration: none;
        }

        .da-nav-item:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.04);
        }

        .da-nav-item.da-active {
          color: #ffffff;
          background: rgba(245,158,11,0.1);
          border-left-color: #f59e0b;
        }

        .da-nav-item.da-active i {
          color: #f59e0b;
        }

        .da-nav-item i {
          font-size: 18px;
          width: 22px;
          text-align: center;
          transition: color 0.2s ease;
        }

        .da-sidebar-user {
          padding: 18px 20px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .da-user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          color: #0d1b2e;
          flex-shrink: 0;
        }

        .da-user-name {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        .da-user-role {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          margin-top: 1px;
        }

        /* ─── Content Area ────────────────────────── */
        .da-content {
          flex: 1;
          margin-left: 260px;
          min-height: 100vh;
        }

        .da-content-inner {
          padding: 28px;
        }

        /* ─── Header Bar ──────────────────────────── */
        .da-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          background: #ffffff;
          border-bottom: 1px solid rgba(13,27,46,0.06);
        }

        .da-header-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .da-header-date {
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
        }

        .da-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .da-bell-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(13,27,46,0.08);
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          color: #64748b;
          font-size: 18px;
        }

        .da-bell-btn:hover {
          border-color: #f59e0b;
          color: #f59e0b;
        }

        .da-bell-dot {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #dc2626;
          border: 2px solid #ffffff;
        }

        .da-header-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          color: #0d1b2e;
          cursor: pointer;
        }

        /* ─── Hamburger ───────────────────────────── */
        .da-hamburger {
          display: none;
          width: 44px;
          height: 44px;
          border: none;
          background: none;
          font-size: 22px;
          color: #0f172a;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        .da-hamburger:hover {
          background: rgba(13,27,46,0.05);
        }

        /* ─── KPI Cards ───────────────────────────── */
        .da-kpi-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 22px;
          border-left: 3px solid #f59e0b;
          box-shadow: 0 1px 3px rgba(13,27,46,0.08), 0 6px 24px rgba(13,27,46,0.06);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          animation: da-fadeUp 0.5s ease both;
        }

        .da-kpi-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(13,27,46,0.12), 0 12px 36px rgba(13,27,46,0.1);
        }

        .da-kpi-icon {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .da-kpi-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .da-kpi-value {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .da-kpi-trend {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ─── Table Card ──────────────────────────── */
        .da-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(13,27,46,0.08), 0 6px 24px rgba(13,27,46,0.06);
          overflow: hidden;
          animation: da-fadeUp 0.5s ease both;
        }

        .da-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 22px 16px;
        }

        .da-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .da-card-action {
          font-size: 13px;
          font-weight: 600;
          color: #f59e0b;
          cursor: pointer;
          background: none;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .da-card-action:hover {
          background: #fef3c7;
        }

        .da-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .da-table thead th {
          padding: 10px 22px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(13,27,46,0.06);
          text-align: left;
          white-space: nowrap;
        }

        .da-table tbody tr {
          transition: background 0.15s ease;
          cursor: default;
        }

        .da-table tbody tr:hover {
          background: #f8fafc;
        }

        .da-table tbody td {
          padding: 14px 22px;
          border-bottom: 1px solid rgba(13,27,46,0.04);
          white-space: nowrap;
        }

        .da-table tbody tr:last-child td {
          border-bottom: none;
        }

        .da-firma-text {
          font-weight: 600;
          color: #0f172a;
        }

        .da-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .da-tutar-positive {
          color: #059669;
          font-weight: 700;
        }

        .da-tutar-negative {
          color: #dc2626;
          font-weight: 700;
        }

        /* ─── Vade Takvimi ────────────────────────── */
        .da-vade-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 22px;
          border-bottom: 1px solid rgba(13,27,46,0.05);
          transition: background 0.15s ease;
        }

        .da-vade-item:last-child {
          border-bottom: none;
        }

        .da-vade-item:hover {
          background: #f8fafc;
        }

        .da-vade-bar {
          width: 4px;
          height: 40px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .da-vade-info {
          flex: 1;
          min-width: 0;
        }

        .da-vade-firma {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .da-vade-tarih {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .da-vade-tutar {
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
        }

        /* ─── Hızlı İşlemler ──────────────────────── */
        .da-quick-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 18px 12px;
          border-radius: 14px;
          border: 1px solid rgba(13,27,46,0.08);
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 90px;
          text-align: center;
        }

        .da-quick-btn:hover {
          border-color: #f59e0b;
          background: #fffbeb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245,158,11,0.15);
        }

        .da-quick-btn i {
          font-size: 22px;
          color: #f59e0b;
        }

        .da-quick-btn span {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
        }

        /* ─── Modal ───────────────────────────────── */
        .da-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(13,27,46,0.5);
          z-index: 1060;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: da-fadeIn 0.2s ease;
        }

        .da-modal {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          overflow: hidden;
          animation: da-slideUp 0.3s ease;
          box-shadow: 0 20px 60px rgba(13,27,46,0.3);
        }

        .da-modal-header {
          background: #0d1b2e;
          color: #ffffff;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .da-modal-title {
          font-size: 17px;
          font-weight: 700;
          margin: 0;
        }

        .da-modal-close {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.15);
          background: none;
          color: rgba(255,255,255,0.7);
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          min-width: 44px;
          min-height: 44px;
        }

        .da-modal-close:hover {
          background: rgba(255,255,255,0.1);
          color: #ffffff;
        }

        .da-modal-body {
          padding: 24px;
        }

        .da-form-group {
          margin-bottom: 18px;
        }

        .da-form-group:last-child {
          margin-bottom: 0;
        }

        .da-form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .da-form-input,
        .da-form-select {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(13,27,46,0.12);
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a;
          background: #ffffff;
          transition: border-color 0.2s ease;
          outline: none;
          min-height: 44px;
          box-sizing: border-box;
        }

        .da-form-input:focus,
        .da-form-select:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }

        .da-form-input::placeholder {
          color: #94a3b8;
        }

        .da-modal-footer {
          padding: 16px 24px 24px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .da-btn {
          padding: 10px 22px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .da-btn-outline {
          background: #ffffff;
          color: #64748b;
          border: 1.5px solid rgba(13,27,46,0.12);
        }

        .da-btn-outline:hover {
          border-color: #0f172a;
          color: #0f172a;
        }

        .da-btn-amber {
          background: #f59e0b;
          color: #0d1b2e;
        }

        .da-btn-amber:hover {
          background: #d97706;
          box-shadow: 0 4px 12px rgba(245,158,11,0.35);
        }

        /* ─── Overlay (mobile sidebar) ────────────── */
        .da-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1035;
          animation: da-fadeIn 0.2s ease;
        }

        /* ─── Animations ──────────────────────────── */
        @keyframes da-fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes da-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes da-slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ─── Responsive ──────────────────────────── */
        @media (max-width: 991.98px) {
          .da-sidebar {
            transform: translateX(-100%);
          }
          .da-sidebar.da-sidebar-open {
            transform: translateX(0);
          }
          .da-content {
            margin-left: 0;
          }
          .da-content-inner {
            padding: 16px;
          }
          .da-header {
            padding: 16px;
          }
          .da-hamburger {
            display: flex;
          }
          .da-kpi-value {
            font-size: 20px;
          }
        }

        @media (max-width: 575.98px) {
          .da-header-title {
            font-size: 18px;
          }
          .da-header-date {
            font-size: 12px;
          }
        }
      `}</style>

      <div className="da-wrapper">
        {/* ─── Mobile Overlay ──────────────────── */}
        {sidebarAcik && (
          <div
            className="da-overlay d-lg-none"
            onClick={() => setSidebarAcik(false)}
          />
        )}

        {/* ─── Sidebar ────────────────────────── */}
        <aside className={`da-sidebar d-none d-lg-flex ${sidebarAcik ? 'da-sidebar-open d-flex' : ''}`}>
          {/* Logo */}
          <div className="da-sidebar-logo">
            <div className="da-logo-circle">FK</div>
            <div>
              <div className="da-logo-text">Finans Kalesi</div>
              <div className="da-logo-sub">İşletme Yönetim Paneli</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="da-sidebar-nav">
            {menuler.map((m, i) => (
              <div
                key={i}
                className={`da-nav-item ${m.aktif ? 'da-active' : ''}`}
                onMouseEnter={() => setHoveredMenu(i)}
                onMouseLeave={() => setHoveredMenu(null)}
                style={
                  !m.aktif && hoveredMenu === i
                    ? { color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.04)' }
                    : {}
                }
              >
                <i className={`bi ${m.ikon}`} />
                {m.etiket}
              </div>
            ))}
          </nav>

          {/* User */}
          <div className="da-sidebar-user">
            <div className="da-user-avatar">KD</div>
            <div>
              <div className="da-user-name">Kaan Doğan</div>
              <div className="da-user-role">Yönetici</div>
            </div>
          </div>
        </aside>

        {/* ─── Content ────────────────────────── */}
        <main className="da-content">
          {/* Header */}
          <div className="da-header">
            <div className="d-flex align-items-center gap-3">
              <button
                className="da-hamburger"
                onClick={() => setSidebarAcik(!sidebarAcik)}
                aria-label="Menü"
              >
                <i className={`bi ${sidebarAcik ? 'bi-x-lg' : 'bi-list'}`} />
              </button>
              <div>
                <h1 className="da-header-title">Dashboard</h1>
                <div className="da-header-date">{bugun}</div>
              </div>
            </div>
            <div className="da-header-right">
              <div className="da-bell-btn">
                <i className="bi bi-bell" />
                <span className="da-bell-dot" />
              </div>
              <div className="da-header-avatar">KD</div>
            </div>
          </div>

          <div className="da-content-inner">
            {/* ─── KPI Cards ──────────────────── */}
            <div className="row g-3 mb-4">
              {kpiVerileri.map((kpi, i) => (
                <div className="col-xl-3 col-md-6 col-12" key={i}>
                  <div
                    className="da-kpi-card"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      transform: hoveredKpi === i ? 'translateY(-3px)' : 'translateY(0)',
                      boxShadow: hoveredKpi === i
                        ? '0 4px 12px rgba(13,27,46,0.12), 0 12px 36px rgba(13,27,46,0.1)'
                        : '0 1px 3px rgba(13,27,46,0.08), 0 6px 24px rgba(13,27,46,0.06)',
                    }}
                    onMouseEnter={() => setHoveredKpi(i)}
                    onMouseLeave={() => setHoveredKpi(null)}
                  >
                    <div
                      className="da-kpi-icon"
                      style={{ background: kpi.ikonBg, color: kpi.ikonRenk }}
                    >
                      <i className={`bi ${kpi.ikon}`} />
                    </div>
                    <div className="da-kpi-label">{kpi.baslik}</div>
                    <div className="da-kpi-value" style={{ color: kpi.renk }}>
                      {TL(kpi.tutar)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── Main Content Grid ──────────── */}
            <div className="row g-3">
              {/* Left Column — Transaction Table */}
              <div className="col-xl-8 col-12">
                <div className="da-card" style={{ animationDelay: '0.4s' }}>
                  <div className="da-card-header">
                    <h2 className="da-card-title">Son İşlemler</h2>
                    <button className="da-card-action">Tümünü Gör</button>
                  </div>
                  <div className="table-responsive">
                    <table className="da-table">
                      <thead>
                        <tr>
                          <th>Tarih</th>
                          <th>Firma</th>
                          <th>İşlem Türü</th>
                          <th>Tutar</th>
                          <th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {islemler.map((islem, i) => (
                          <tr
                            key={i}
                            onMouseEnter={() => setHoveredRow(i)}
                            onMouseLeave={() => setHoveredRow(null)}
                            style={hoveredRow === i ? { background: '#f8fafc' } : {}}
                          >
                            <td style={{ color: '#64748b', fontSize: '13px' }}>{islem.tarih}</td>
                            <td className="da-firma-text">{islem.firma}</td>
                            <td style={{ color: '#64748b' }}>{islem.tur}</td>
                            <td className={islem.giris ? 'da-tutar-positive' : 'da-tutar-negative'}>
                              {islem.giris ? '+' : '-'}{TL(islem.tutar)}
                            </td>
                            <td>
                              <span
                                className="da-badge"
                                style={{
                                  background: durumStil[islem.durum]?.bg || '#f1f5f9',
                                  color: durumStil[islem.durum]?.renk || '#64748b',
                                }}
                              >
                                {islem.durum}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column — Side Cards */}
              <div className="col-xl-4 col-12">
                {/* Vade Takvimi */}
                <div className="da-card mb-3" style={{ animationDelay: '0.5s' }}>
                  <div className="da-card-header">
                    <h2 className="da-card-title">Vade Takvimi</h2>
                    <button className="da-card-action">Tümü</button>
                  </div>
                  {vadeler.map((v, i) => (
                    <div
                      key={i}
                      className="da-vade-item"
                      onMouseEnter={() => setHoveredVade(i)}
                      onMouseLeave={() => setHoveredVade(null)}
                      style={hoveredVade === i ? { background: '#f8fafc' } : {}}
                    >
                      <div
                        className="da-vade-bar"
                        style={{ background: v.giris ? '#059669' : '#dc2626' }}
                      />
                      <div className="da-vade-info">
                        <div className="da-vade-firma">{v.firma}</div>
                        <div className="da-vade-tarih">{v.tarih} 2026</div>
                      </div>
                      <div
                        className="da-vade-tutar"
                        style={{ color: v.giris ? '#059669' : '#dc2626' }}
                      >
                        {v.giris ? '+' : '-'}{TL(v.tutar)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hızlı İşlemler */}
                <div className="da-card" style={{ animationDelay: '0.6s' }}>
                  <div className="da-card-header">
                    <h2 className="da-card-title">Hızlı İşlemler</h2>
                  </div>
                  <div style={{ padding: '0 22px 22px' }}>
                    <div className="row g-2">
                      {hizliIslemler.map((btn, i) => (
                        <div className="col-6" key={i}>
                          <div
                            className="da-quick-btn"
                            onClick={() => btn.modal && setModalAcik(true)}
                            onMouseEnter={() => setHoveredBtn(i)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={
                              hoveredBtn === i
                                ? {
                                    borderColor: '#f59e0b',
                                    background: '#fffbeb',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(245,158,11,0.15)',
                                  }
                                : {}
                            }
                          >
                            <i className={`bi ${btn.ikon}`} />
                            <span>{btn.etiket}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ─── Modal: Yeni Çek Ekle ─────────────── */}
      {modalAcik && (
        <div className="da-modal-backdrop">
          <div className="da-modal">
            <div className="da-modal-header">
              <h3 className="da-modal-title">Yeni Çek Ekle</h3>
              <button
                className="da-modal-close"
                onClick={() => setModalAcik(false)}
                aria-label="Kapat"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="da-modal-body">
              <div className="da-form-group">
                <label className="da-form-label">Firma Adı</label>
                <input
                  type="text"
                  className="da-form-input"
                  placeholder="Firma adını yazın..."
                />
              </div>
              <div className="da-form-group">
                <label className="da-form-label">Çek Numarası</label>
                <input
                  type="text"
                  className="da-form-input"
                  placeholder="Çek numarasını girin"
                />
              </div>
              <div className="da-form-group">
                <label className="da-form-label">Tutar (₺)</label>
                <input
                  type="text"
                  className="da-form-input"
                  placeholder="0"
                />
              </div>
              <div className="da-form-group">
                <label className="da-form-label">Vade Tarihi</label>
                <input
                  type="date"
                  className="da-form-input"
                />
              </div>
              <div className="da-form-group">
                <label className="da-form-label">Çek Türü</label>
                <select className="da-form-select">
                  <option value="">Seçiniz...</option>
                  <option value="alınan">Alınan Çek</option>
                  <option value="verilen">Verilen Çek</option>
                </select>
              </div>
            </div>
            <div className="da-modal-footer">
              <button
                className="da-btn da-btn-outline"
                onClick={() => setModalAcik(false)}
              >
                İptal
              </button>
              <button className="da-btn da-btn-amber">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
