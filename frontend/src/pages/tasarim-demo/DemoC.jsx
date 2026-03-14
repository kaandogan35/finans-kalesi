/**
 * DemoC — "Obsidian Vault" Dark Premium Theme
 * Deep navy, glassmorphism, neon glows, amber gold accents.
 * Ana renkler: Lacivert #0d1b2e + Amber #f59e0b
 */
import { useState, useEffect } from 'react'

/* ─── Mock Veri ─────────────────────────────────────── */
const menuler = [
  { ikon: 'bi-speedometer2',          etiket: 'Gösterge Paneli',  aktif: true  },
  { ikon: 'bi-people-fill',           etiket: 'Cari Hesaplar',    aktif: false },
  { ikon: 'bi-file-earmark-text-fill',etiket: 'Çek/Senet',        aktif: false },
  { ikon: 'bi-credit-card-2-fill',    etiket: 'Ödemeler',         aktif: false },
  { ikon: 'bi-safe-fill',             etiket: 'Varlık & Kasa',    aktif: false },
]

const kpiVerileri = [
  {
    baslik: 'Şirket Net Değeri',
    tutar: 23209565,
    altBaslik: 'Tüm varlıklar – borçlar',
    renk: '#10b981',
    ikon: 'bi-gem',
  },
  {
    baslik: 'Acil Nakit Gücü',
    tutar: 10233362,
    altBaslik: 'Kasa + Banka',
    renk: '#f59e0b',
    ikon: 'bi-lightning-charge-fill',
  },
  {
    baslik: 'Piyasa Alacağı',
    tutar: 3460000,
    altBaslik: 'Açık alacaklar',
    renk: '#f59e0b',
    ikon: 'bi-globe2',
  },
  {
    baslik: 'Aylık Kâr',
    tutar: 842300,
    altBaslik: '+8.2% geçen aya göre',
    renk: '#10b981',
    ikon: 'bi-graph-up-arrow',
    prefix: '+',
  },
]

const sonIslemler = [
  { tarih: '14 Mar', aciklama: 'Günlük Çekmece Hasılatı', tur: 'Nakit Giriş',   tutar: 174555,    durum: 'Tamamlandı', durumRenk: '#10b981' },
  { tarih: '13 Mar', aciklama: 'Tedarikçi Ödemesi',       tur: 'Havale Çıkış',   tutar: -2360510,  durum: 'Tamamlandı', durumRenk: '#10b981' },
  { tarih: '13 Mar', aciklama: 'Havale/Çek Tahsil',       tur: 'Banka Giriş',    tutar: 2922560,   durum: 'Tamamlandı', durumRenk: '#10b981' },
  { tarih: '12 Mar', aciklama: 'Personel Maaş',           tur: 'Sabit Gider',    tutar: -598610,   durum: 'İşlendi',    durumRenk: '#f59e0b' },
  { tarih: '12 Mar', aciklama: 'POS İşlemi',              tur: 'Kart Giriş',     tutar: 609750,    durum: 'Beklemede',  durumRenk: '#d97706' },
  { tarih: '11 Mar', aciklama: 'Kredi Ödemesi',           tur: 'Banka Çıkış',    tutar: -113978,   durum: 'İşlendi',    durumRenk: '#f59e0b' },
]

const girisVerileri = [
  { etiket: 'Günlük Çekmece Hasılatı', tutar: 174555   },
  { etiket: 'Açık Hesap',              tutar: 102560   },
  { etiket: 'Havale/Çek Tahsil',       tutar: 2922560  },
  { etiket: 'POS İşlemi',              tutar: 609750   },
]

const cikisVerileri = [
  { etiket: 'Tedarikçi Ödemesi',       tutar: 2360510  },
  { etiket: 'Personel & Sabit Gider',  tutar: 598610   },
  { etiket: 'Günlük İşletme',          tutar: 149530   },
  { etiket: 'Kredi Ödemeleri',         tutar: 113978   },
]

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n)

const bugun = new Date().toLocaleDateString('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/* ─── Bileşen ───────────────────────────────────────── */
export default function DemoC() {
  const [modalAcik, setModalAcik] = useState(false)
  const [sidebarAcik, setSidebarAcik] = useState(false)
  const [aktifFiltre, setAktifFiltre] = useState('Tümü')
  const [form, setForm] = useState({
    islemTuru: '',
    aciklama: '',
    tutar: '',
    tarih: '',
    kategori: '',
  })

  /* ESC ile modal ve sidebar kapatma */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setModalAcik(false)
        setSidebarAcik(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  /* Body scroll lock */
  useEffect(() => {
    if (modalAcik || sidebarAcik) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalAcik, sidebarAcik])

  const filtrelenmisIslemler = sonIslemler.filter((islem) => {
    if (aktifFiltre === 'Tümü') return true
    if (aktifFiltre === 'Giriş') return islem.tutar > 0
    if (aktifFiltre === 'Çıkış') return islem.tutar < 0
    return true
  })

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div className="dc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        /* ═══════════════════════════════════════════
           BASE STYLES
           ═══════════════════════════════════════════ */

        .dc-root {
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
          background: linear-gradient(160deg, #0d1b2e 0%, #0a1628 50%, #0d1f35 100%);
          background-attachment: fixed;
          color: #ffffff;
          position: relative;
          -webkit-overflow-scrolling: touch;
        }
        .dc-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 10%, rgba(245,158,11,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.04) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        .dc-root *, .dc-root *::before, .dc-root *::after {
          box-sizing: border-box;
        }

        /* ─── Sidebar ─── */
        .dc-sidebar {
          width: 260px;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100;
          background: rgba(13,27,46,0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-right: 1px solid rgba(245,158,11,0.08);
          display: flex;
          flex-direction: column;
          padding: 28px 20px 20px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }
        .dc-sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }
        .dc-sidebar-logo i {
          font-size: 28px;
          color: #f59e0b;
          filter: drop-shadow(0 0 8px rgba(245,158,11,0.4));
        }
        .dc-sidebar-logo span {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }
        .dc-sidebar-subtitle {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          margin-left: 40px;
          margin-bottom: 24px;
        }
        .dc-sidebar-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 0 0 20px;
        }
        .dc-sidebar-nav {
          list-style: none;
          padding: 0;
          margin: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dc-sidebar-nav li {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255,255,255,0.45);
          font-size: 14px;
          font-weight: 500;
          border-left: 3px solid transparent;
          min-height: 44px;
        }
        .dc-sidebar-nav li:hover {
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.04);
        }
        .dc-sidebar-nav li.dc-active {
          color: #ffffff;
          background: rgba(245,158,11,0.08);
          border-left-color: #f59e0b;
        }
        .dc-sidebar-nav li.dc-active i {
          color: #f59e0b;
        }
        .dc-sidebar-nav li i {
          font-size: 18px;
          width: 22px;
          text-align: center;
        }
        .dc-sidebar-bottom {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin-top: auto;
        }
        .dc-version-badge {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-family: 'JetBrains Mono', monospace;
          background: rgba(255,255,255,0.06);
          padding: 3px 10px;
          border-radius: 6px;
        }
        .dc-premium-badge {
          font-size: 11px;
          color: #f59e0b;
          font-weight: 600;
          background: rgba(245,158,11,0.12);
          padding: 3px 12px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }

        /* ─── Mobile Sidebar ─── */
        .dc-sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 99;
        }
        .dc-sidebar-overlay.dc-show {
          display: block;
        }
        .dc-hamburger {
          display: none;
          background: none;
          border: none;
          color: #f59e0b;
          font-size: 24px;
          cursor: pointer;
          padding: 8px;
          min-width: 44px;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ─── Content ─── */
        .dc-content {
          margin-left: 260px;
          padding: 28px 28px 40px;
          position: relative;
          z-index: 1;
          min-height: 100vh;
        }

        /* ─── Header ─── */
        .dc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .dc-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dc-header-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .dc-header-date {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          margin-top: 2px;
        }
        .dc-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dc-btn-amber {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #0d1b2e;
          border: none;
          padding: 10px 22px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(245,158,11,0.3);
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .dc-btn-amber:hover {
          box-shadow: 0 6px 28px rgba(245,158,11,0.45);
          transform: translateY(-1px);
        }
        .dc-notification-btn {
          position: relative;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .dc-notification-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .dc-notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(239,68,68,0.5);
        }

        /* ─── Glass Card ─── */
        .dc-glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .dc-glass-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
        }

        /* ─── KPI Cards ─── */
        .dc-kpi-card {
          position: relative;
        }
        .dc-kpi-card:hover {
          transform: translateY(-2px);
        }
        .dc-kpi-label {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          font-weight: 500;
          margin-bottom: 10px;
          letter-spacing: 0.2px;
        }
        .dc-kpi-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
          word-break: break-word;
        }
        .dc-kpi-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          font-weight: 400;
        }
        .dc-kpi-icon {
          position: absolute;
          top: 16px;
          right: 16px;
          font-size: 60px;
          opacity: 0.06;
          color: #fff;
          pointer-events: none;
        }

        /* ─── Table Card ─── */
        .dc-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dc-card-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
        .dc-badge-amber {
          background: rgba(245,158,11,0.15);
          color: #f59e0b;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 8px;
        }
        .dc-filter-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
        }
        .dc-filter-tab {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
          padding: 7px 18px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Outfit', sans-serif;
          min-height: 36px;
          white-space: nowrap;
        }
        .dc-filter-tab:hover {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
        }
        .dc-filter-tab.dc-tab-active {
          background: rgba(245,158,11,0.15);
          border-color: rgba(245,158,11,0.3);
          color: #f59e0b;
        }

        /* ─── Dark Table ─── */
        .dc-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .dc-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 500px;
        }
        .dc-table thead th {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: rgba(255,255,255,0.4);
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          white-space: nowrap;
          text-align: left;
        }
        .dc-table tbody td {
          padding: 14px;
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          white-space: nowrap;
        }
        .dc-table tbody tr {
          transition: background 0.15s ease;
        }
        .dc-table tbody tr:hover {
          background: rgba(255,255,255,0.03);
        }
        .dc-table tbody tr:last-child td {
          border-bottom: none;
        }
        .dc-tutar-positive {
          color: #10b981;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          font-size: 13px;
        }
        .dc-tutar-negative {
          color: #ef4444;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          font-size: 13px;
        }
        .dc-status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
          vertical-align: middle;
        }
        .dc-status-text {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
        }
        .dc-tur-badge {
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 6px;
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.55);
          font-weight: 500;
        }

        /* ─── Distribution Cards ─── */
        .dc-dist-card {
          padding: 20px;
        }
        .dc-dist-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          font-size: 15px;
          font-weight: 600;
        }
        .dc-dist-header i {
          font-size: 20px;
        }
        .dc-dist-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          gap: 12px;
        }
        .dc-dist-row:last-child {
          border-bottom: none;
        }
        .dc-dist-label {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          font-weight: 400;
        }
        .dc-dist-amount {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ─── Modal ─── */
        .dc-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: dc-fadeIn 0.2s ease;
        }
        .dc-modal {
          width: 100%;
          max-width: 520px;
          background: rgba(13,27,46,0.95);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          overflow: hidden;
          animation: dc-slideUp 0.3s ease;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .dc-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 2px solid #f59e0b;
          flex-shrink: 0;
        }
        .dc-modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }
        .dc-modal-close {
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          font-size: 22px;
          cursor: pointer;
          padding: 4px;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .dc-modal-close:hover {
          color: #f59e0b;
          background: rgba(245,158,11,0.08);
        }
        .dc-modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          overflow-y: auto;
          flex: 1;
        }
        .dc-form-group label {
          display: block;
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 6px;
          font-weight: 500;
        }
        .dc-form-control {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 12px 16px;
          color: #ffffff;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s ease;
          outline: none;
          min-height: 44px;
        }
        .dc-form-control::placeholder {
          color: rgba(255,255,255,0.25);
        }
        .dc-form-control:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }
        .dc-form-control.dc-mono {
          font-family: 'JetBrains Mono', monospace;
        }
        select.dc-form-control {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.4)' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
        }
        select.dc-form-control option {
          background: #0d1b2e;
          color: #ffffff;
        }
        .dc-modal-footer {
          padding: 16px 24px 24px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }
        .dc-btn-glass {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7);
          padding: 10px 24px;
          border-radius: 10px;
          font-weight: 500;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 44px;
        }
        .dc-btn-glass:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }

        /* ─── Animations ─── */
        @keyframes dc-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dc-slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* ═══════════════════════════════════════════
           RESPONSIVE — Büyükten Küçüğe
           ═══════════════════════════════════════════ */

        /* ─── Tablet & Mobil (< 992px) ─── */
        @media (max-width: 991.98px) {
          .dc-sidebar {
            transform: translateX(-100%);
            z-index: 101;
          }
          .dc-sidebar.dc-sidebar-open {
            transform: translateX(0);
          }
          .dc-hamburger {
            display: inline-flex;
          }
          .dc-content {
            margin-left: 0;
            padding: 20px;
          }
        }

        /* ─── Mobil (< 768px) ─── */
        @media (max-width: 767.98px) {
          .dc-content {
            padding: 16px;
          }
          .dc-header {
            margin-bottom: 20px;
            gap: 12px;
          }
          .dc-header-title {
            font-size: 18px;
          }
          .dc-header-date {
            font-size: 12px;
          }
          .dc-btn-amber {
            padding: 8px 16px;
            font-size: 13px;
          }
          .dc-glass-card {
            padding: 16px;
            border-radius: 14px;
          }
          .dc-kpi-value {
            font-size: 20px;
          }
          .dc-kpi-label {
            font-size: 12px;
          }
          .dc-kpi-icon {
            font-size: 44px;
            top: 12px;
            right: 12px;
          }
          .dc-card-title {
            font-size: 15px;
          }
          .dc-filter-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
          }
          .dc-table {
            min-width: 420px;
          }
          .dc-table thead th {
            padding: 10px;
            font-size: 10px;
          }
          .dc-table tbody td {
            padding: 10px;
            font-size: 13px;
          }
          .dc-dist-card {
            padding: 14px;
          }
          .dc-dist-header {
            font-size: 14px;
            margin-bottom: 12px;
          }
          .dc-dist-label {
            font-size: 12px;
          }
          .dc-dist-amount {
            font-size: 13px;
          }
          .dc-modal-backdrop {
            padding: 12px;
            align-items: flex-end;
          }
          .dc-modal {
            max-width: 100%;
            border-radius: 16px 16px 0 0;
            max-height: 85vh;
          }
          .dc-modal-header {
            padding: 16px 18px;
          }
          .dc-modal-header h3 {
            font-size: 16px;
          }
          .dc-modal-body {
            padding: 18px;
            gap: 14px;
          }
          .dc-modal-footer {
            padding: 14px 18px 18px;
          }
        }

        /* ─── Küçük Mobil (< 480px) ─── */
        @media (max-width: 479.98px) {
          .dc-content {
            padding: 12px;
          }
          .dc-header-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .dc-kpi-value {
            font-size: 18px;
          }
          .dc-glass-card {
            padding: 14px;
            border-radius: 12px;
          }
          .dc-filter-tab {
            padding: 6px 12px;
            font-size: 12px;
          }
          .dc-tutar-positive,
          .dc-tutar-negative {
            font-size: 12px;
          }
          .dc-tur-badge {
            font-size: 11px;
            padding: 2px 8px;
          }
        }
      `}</style>

      {/* ─── Sidebar Overlay (mobile) ─── */}
      <div
        className={`dc-sidebar-overlay ${sidebarAcik ? 'dc-show' : ''}`}
        onClick={() => setSidebarAcik(false)}
      />

      {/* ─── Sidebar ─── */}
      <aside className={`dc-sidebar ${sidebarAcik ? 'dc-sidebar-open' : ''}`}>
        <div className="dc-sidebar-logo">
          <i className="bi bi-shield-lock-fill" />
          <span>Finans Kalesi</span>
        </div>
        <div className="dc-sidebar-subtitle">Varlık Yönetimi</div>
        <div className="dc-sidebar-divider" />

        <ul className="dc-sidebar-nav">
          {menuler.map((m, i) => (
            <li key={i} className={m.aktif ? 'dc-active' : ''} onClick={() => setSidebarAcik(false)}>
              <i className={`bi ${m.ikon}`} />
              {m.etiket}
            </li>
          ))}
        </ul>

        <div className="dc-sidebar-bottom">
          <span className="dc-version-badge">v2.1</span>
          <span className="dc-premium-badge">Premium</span>
        </div>
      </aside>

      {/* ─── Content ─── */}
      <main className="dc-content">
        {/* Header */}
        <header className="dc-header">
          <div className="dc-header-left">
            <button
              className="dc-hamburger"
              onClick={() => setSidebarAcik(true)}
              aria-label="Menüyü aç"
            >
              <i className="bi bi-list" />
            </button>
            <div>
              <h1 className="dc-header-title">Gösterge Paneli</h1>
              <div className="dc-header-date">{bugun}</div>
            </div>
          </div>
          <div className="dc-header-actions">
            <button className="dc-btn-amber" onClick={() => setModalAcik(true)}>
              <i className="bi bi-plus-lg" />
              Yeni İşlem
            </button>
            <button className="dc-notification-btn" aria-label="Bildirimler">
              <i className="bi bi-bell" />
              <span className="dc-notification-dot" />
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="row g-3 mb-4">
          {kpiVerileri.map((kpi, i) => (
            <div className="col-xl-3 col-md-6 col-12" key={i}>
              <div className="dc-glass-card dc-kpi-card">
                <div className="dc-kpi-label">{kpi.baslik}</div>
                <div
                  className="dc-kpi-value"
                  style={{
                    color: kpi.renk,
                    textShadow: `0 0 20px ${kpi.renk}4D`,
                  }}
                >
                  {kpi.prefix || ''}{TL(kpi.tutar)}
                </div>
                <div className="dc-kpi-sub">{kpi.altBaslik}</div>
                <i className={`bi ${kpi.ikon} dc-kpi-icon`} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="row g-3">
          {/* Left — Son İşlemler */}
          <div className="col-lg-8">
            <div className="dc-glass-card">
              <div className="dc-card-header">
                <h2 className="dc-card-title">Son İşlemler</h2>
                <span className="dc-badge-amber">24 yeni</span>
              </div>

              <div className="dc-filter-tabs">
                {['Tümü', 'Giriş', 'Çıkış'].map((f) => (
                  <button
                    key={f}
                    className={`dc-filter-tab ${aktifFiltre === f ? 'dc-tab-active' : ''}`}
                    onClick={() => setAktifFiltre(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="dc-table-wrap table-responsive">
                <table className="dc-table">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Açıklama</th>
                      <th>Tür</th>
                      <th style={{ textAlign: 'right' }}>Tutar</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrelenmisIslemler.map((islem, i) => (
                      <tr key={i}>
                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                          {islem.tarih}
                        </td>
                        <td>{islem.aciklama}</td>
                        <td>
                          <span className="dc-tur-badge">{islem.tur}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={islem.tutar > 0 ? 'dc-tutar-positive' : 'dc-tutar-negative'}>
                            {islem.tutar > 0 ? '+' : ''}{TL(Math.abs(islem.tutar))}
                          </span>
                        </td>
                        <td>
                          <span
                            className="dc-status-dot"
                            style={{
                              background: islem.durumRenk,
                              boxShadow: `0 0 6px ${islem.durumRenk}66`,
                            }}
                          />
                          <span className="dc-status-text">{islem.durum}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-lg-4">
            {/* Giriş Dağılımı */}
            <div className="dc-glass-card dc-dist-card mb-3">
              <div className="dc-dist-header">
                <i className="bi bi-arrow-down-circle" style={{ color: '#10b981' }} />
                Giriş Dağılımı
              </div>
              {girisVerileri.map((item, i) => (
                <div className="dc-dist-row" key={i}>
                  <span className="dc-dist-label">{item.etiket}</span>
                  <span className="dc-dist-amount" style={{ color: '#10b981' }}>
                    {TL(item.tutar)}
                  </span>
                </div>
              ))}
            </div>

            {/* Çıkış Dağılımı */}
            <div className="dc-glass-card dc-dist-card">
              <div className="dc-dist-header">
                <i className="bi bi-arrow-up-circle" style={{ color: '#ef4444' }} />
                Çıkış Dağılımı
              </div>
              {cikisVerileri.map((item, i) => (
                <div className="dc-dist-row" key={i}>
                  <span className="dc-dist-label">{item.etiket}</span>
                  <span className="dc-dist-amount" style={{ color: '#ef4444' }}>
                    {TL(item.tutar)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ─── Modal ─── */}
      {modalAcik && (
        <div className="dc-modal-backdrop">
          <div className="dc-modal">
            <div className="dc-modal-header">
              <h3>Yeni İşlem Ekle</h3>
              <button
                className="dc-modal-close"
                onClick={() => setModalAcik(false)}
                aria-label="Kapat"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="dc-modal-body">
              <div className="dc-form-group">
                <label>İşlem Türü</label>
                <select
                  className="dc-form-control"
                  name="islemTuru"
                  value={form.islemTuru}
                  onChange={handleFormChange}
                >
                  <option value="">Seçiniz...</option>
                  <option value="nakit-giris">Nakit Giriş</option>
                  <option value="havale-giris">Havale Giriş</option>
                  <option value="nakit-cikis">Nakit Çıkış</option>
                  <option value="havale-cikis">Havale Çıkış</option>
                </select>
              </div>

              <div className="dc-form-group">
                <label>Açıklama</label>
                <input
                  type="text"
                  className="dc-form-control"
                  name="aciklama"
                  placeholder="İşlem açıklaması..."
                  value={form.aciklama}
                  onChange={handleFormChange}
                />
              </div>

              <div className="dc-form-group">
                <label>Tutar (₺)</label>
                <input
                  type="text"
                  className="dc-form-control dc-mono"
                  name="tutar"
                  placeholder="0"
                  value={form.tutar}
                  onChange={handleFormChange}
                />
              </div>

              <div className="dc-form-group">
                <label>Tarih</label>
                <input
                  type="date"
                  className="dc-form-control"
                  name="tarih"
                  value={form.tarih}
                  onChange={handleFormChange}
                />
              </div>

              <div className="dc-form-group">
                <label>Kategori</label>
                <select
                  className="dc-form-control"
                  name="kategori"
                  value={form.kategori}
                  onChange={handleFormChange}
                >
                  <option value="">Seçiniz...</option>
                  <option value="cekmece">Çekmece</option>
                  <option value="acik-hesap">Açık Hesap</option>
                  <option value="havale">Havale</option>
                  <option value="pos">POS</option>
                  <option value="tedarikci">Tedarikçi</option>
                  <option value="personel">Personel</option>
                  <option value="isletme">İşletme</option>
                  <option value="kredi">Kredi</option>
                </select>
              </div>
            </div>

            <div className="dc-modal-footer">
              <button className="dc-btn-glass" onClick={() => setModalAcik(false)}>
                İptal
              </button>
              <button className="dc-btn-amber" onClick={() => setModalAcik(false)}>
                <i className="bi bi-check-lg" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
