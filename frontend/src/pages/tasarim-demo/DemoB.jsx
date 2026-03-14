import { useState, useEffect } from 'react';

export default function DemoB() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tumunu');

  const [formData, setFormData] = useState({
    firmaAdi: '',
    vergiNo: '',
    telefon: '',
    tur: 'musteri',
    eposta: '',
  });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [modalOpen]);

  const formatPara = (n) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(n);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
    { id: 'cari', label: 'Cari Hesaplar', icon: 'bi-people' },
    { id: 'cek-senet', label: 'Çek / Senet', icon: 'bi-receipt' },
    { id: 'odemeler', label: 'Ödemeler', icon: 'bi-credit-card-2-front' },
    { id: 'kasa', label: 'Varlık & Kasa', icon: 'bi-safe2' },
  ];

  const cariData = [
    { firma: 'Demir-Çelik A.Ş.', tur: 'Müşteri', bakiye: 185000, tarih: '14 Mar' },
    { firma: 'İnşaat Malz. Ltd.', tur: 'Tedarikçi', bakiye: -92400, tarih: '13 Mar' },
    { firma: 'Çelik Boru San.', tur: 'Müşteri', bakiye: 54200, tarih: '12 Mar' },
    { firma: 'Yapı Malz. Tic.', tur: 'Tedarikçi', bakiye: -38750, tarih: '11 Mar' },
    { firma: 'Hırdavat Dünyası', tur: 'Müşteri', bakiye: 28600, tarih: '10 Mar' },
    { firma: 'Metal San. Ltd.', tur: 'Müşteri', bakiye: 15300, tarih: '9 Mar' },
  ];

  const vadeler = [
    { tarih: '15 Mar', firma: 'Demir-Çelik A.Ş.', tutar: 45000, acil: true },
    { tarih: '16 Mar', firma: 'İnşaat Malz. Ltd.', tutar: 28000, acil: true },
    { tarih: '22 Mar', firma: 'Çelik Boru San.', tutar: 67500, acil: false },
    { tarih: '28 Mar', firma: 'Yapı Malz. Tic.', tutar: 32000, acil: false },
  ];

  const aktiviteler = [
    { tip: 'cek', aciklama: 'Yeni çek eklendi — ₺45.000', zaman: '2 saat önce', renk: '#10b981' },
    { tip: 'odeme', aciklama: 'Ödeme yapıldı — İnşaat Malz.', zaman: '4 saat önce', renk: '#0ea5e9' },
    { tip: 'cari', aciklama: 'Cari güncellendi — Çelik Boru', zaman: '6 saat önce', renk: '#6366f1' },
    { tip: 'kasa', aciklama: 'Kasa girişi — ₺12.800', zaman: '1 gün önce', renk: '#f59e0b' },
  ];

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setModalOpen(false);
    setFormData({ firmaAdi: '', vergiNo: '', telefon: '', tur: 'musteri', eposta: '' });
  };

  const filteredCari = cariData.filter((item) => {
    if (activeTab === 'tumunu') return true;
    if (activeTab === 'musteriler') return item.tur === 'Müşteri';
    if (activeTab === 'tedarikciler') return item.tur === 'Tedarikçi';
    return true;
  });

  return (
    <div className="db-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .db-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          min-height: 100vh;
          background: #f1f5f9;
          color: #0f172a;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Sidebar ── */
        .db-sidebar {
          width: 240px;
          min-height: 100vh;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 100;
          transition: transform 0.2s ease;
        }

        .db-sidebar-header {
          padding: 24px 20px 16px;
        }

        .db-logo-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .db-logo-text {
          font-size: 17px;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: -0.02em;
        }

        .db-pro-badge {
          background: #0ea5e9;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 9999px;
          letter-spacing: 0.04em;
          line-height: 1.4;
        }

        .db-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 0 20px;
        }

        .db-menu-label {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 20px 20px 8px;
        }

        .db-menu-list {
          list-style: none;
          padding: 0;
          margin: 0;
          flex: 1;
        }

        .db-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          margin: 2px 8px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
          border-left: 2px solid transparent;
          min-height: 44px;
        }

        .db-menu-item:hover {
          background: #f1f5f9;
        }

        .db-menu-item.db-active {
          background: #f0f9ff;
          color: #0ea5e9;
          border-left-color: #0ea5e9;
        }

        .db-menu-item.db-active i {
          color: #0ea5e9;
        }

        .db-menu-item i {
          font-size: 16px;
          width: 20px;
          text-align: center;
          color: #94a3b8;
          transition: color 0.15s ease;
        }

        .db-sidebar-footer {
          padding: 16px 20px 20px;
        }

        .db-user-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .db-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .db-user-info {
          display: flex;
          flex-direction: column;
        }

        .db-user-name {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }

        .db-user-status {
          font-size: 11px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .db-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #10b981;
          display: inline-block;
        }

        /* ── Content ── */
        .db-content {
          margin-left: 240px;
          flex: 1;
          min-height: 100vh;
        }

        .db-content-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 32px 48px;
        }

        /* ── Top bar ── */
        .db-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          padding-top: 4px;
        }

        .db-breadcrumb {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        .db-breadcrumb span {
          color: #0f172a;
        }

        .db-topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .db-search-wrap {
          position: relative;
        }

        .db-search-input {
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          padding: 8px 16px 8px 36px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          background: #fff;
          color: #0f172a;
          width: 200px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .db-search-input::placeholder {
          color: #94a3b8;
        }

        .db-search-input:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }

        .db-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 14px;
          pointer-events: none;
        }

        .db-notif-btn {
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: border-color 0.15s ease;
          min-width: 44px;
          min-height: 44px;
        }

        .db-notif-btn:hover {
          border-color: #cbd5e1;
        }

        .db-notif-btn i {
          color: #64748b;
          font-size: 15px;
        }

        .db-notif-dot {
          position: absolute;
          top: 8px;
          right: 9px;
          width: 7px;
          height: 7px;
          background: #ef4444;
          border-radius: 9999px;
          border: 1.5px solid #fff;
        }

        /* ── KPI Cards ── */
        .db-kpi-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: border-color 0.15s ease;
          height: 100%;
        }

        .db-kpi-card:hover {
          border-color: #0ea5e9;
        }

        .db-kpi-label {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .db-kpi-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }

        .db-kpi-amount {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .db-kpi-sub {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .db-kpi-sub.db-positive {
          color: #10b981;
        }

        .db-sparkline {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 32px;
        }

        .db-sparkline-bar {
          width: 4px;
          border-radius: 2px;
          background: #0ea5e9;
          opacity: 0.25;
        }

        .db-sparkline-bar:nth-child(1) { height: 40%; }
        .db-sparkline-bar:nth-child(2) { height: 65%; }
        .db-sparkline-bar:nth-child(3) { height: 45%; }
        .db-sparkline-bar:nth-child(4) { height: 85%; }
        .db-sparkline-bar:nth-child(5) { height: 100%; opacity: 0.5; }

        /* ── Cards ── */
        .db-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        .db-card-header {
          padding: 20px 24px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .db-card-title {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .db-count-badge {
          background: #f1f5f9;
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .db-btn-primary {
          background: #0ea5e9;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: background 0.15s ease;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .db-btn-primary:hover {
          background: #0284c7;
        }

        .db-btn-ghost {
          background: transparent;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.15s ease;
          min-height: 44px;
        }

        .db-btn-ghost:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* ── Tabs ── */
        .db-tabs {
          display: flex;
          gap: 0;
          padding: 16px 24px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .db-tab {
          padding: 8px 16px 12px;
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .db-tab:hover {
          color: #64748b;
        }

        .db-tab.db-tab-active {
          color: #0ea5e9;
          border-bottom-color: #0ea5e9;
        }

        /* ── Table ── */
        .db-table {
          width: 100%;
          border-collapse: collapse;
        }

        .db-table th {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 14px 24px 10px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }

        .db-table td {
          padding: 14px 24px;
          font-size: 13px;
          color: #334155;
          border-bottom: 1px solid #f8fafc;
        }

        .db-table tr:last-child td {
          border-bottom: none;
        }

        .db-table tbody tr {
          transition: background 0.15s ease;
          cursor: pointer;
        }

        .db-table tbody tr:hover {
          background: #f8fafc;
        }

        .db-firma-name {
          font-weight: 500;
          color: #0f172a;
        }

        .db-tur-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .db-tur-dot {
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          display: inline-block;
          flex-shrink: 0;
        }

        .db-dot-musteri { background: #0ea5e9; }
        .db-dot-tedarikci { background: #f59e0b; }

        .db-amount-positive { color: #10b981; font-weight: 600; }
        .db-amount-negative { color: #ef4444; font-weight: 600; }

        /* ── Vadeler ── */
        .db-vade-list {
          padding: 8px 0;
        }

        .db-vade-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .db-vade-item:last-child {
          border-bottom: none;
        }

        .db-vade-date {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #64748b;
          white-space: nowrap;
        }

        .db-vade-date.db-urgent {
          background: #fef2f2;
          color: #ef4444;
        }

        .db-vade-firma {
          font-size: 13px;
          font-weight: 500;
          color: #0f172a;
          flex: 1;
        }

        .db-vade-amount {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
        }

        /* ── Aktiviteler ── */
        .db-timeline {
          padding: 16px 24px;
        }

        .db-timeline-item {
          display: flex;
          gap: 12px;
          position: relative;
          padding-bottom: 20px;
        }

        .db-timeline-item:last-child {
          padding-bottom: 0;
        }

        .db-timeline-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 6px;
          top: 18px;
          bottom: 0;
          width: 1px;
          background: #e2e8f0;
        }

        .db-timeline-dot {
          width: 13px;
          height: 13px;
          border-radius: 9999px;
          flex-shrink: 0;
          margin-top: 3px;
        }

        .db-timeline-content {
          flex: 1;
        }

        .db-timeline-text {
          font-size: 13px;
          font-weight: 500;
          color: #334155;
        }

        .db-timeline-time {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* ── Modal ── */
        .db-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: db-fade-in 0.15s ease;
        }

        @keyframes db-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .db-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          margin: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
          animation: db-modal-enter 0.2s ease;
        }

        @keyframes db-modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .db-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px 0;
        }

        .db-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }

        .db-modal-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          min-width: 44px;
          min-height: 44px;
        }

        .db-modal-close:hover {
          background: #f1f5f9;
          color: #475569;
        }

        .db-modal-body {
          padding: 24px 28px;
        }

        .db-form-group {
          margin-bottom: 18px;
        }

        .db-form-group:last-child {
          margin-bottom: 0;
        }

        .db-form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          margin-bottom: 6px;
        }

        .db-form-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }

        .db-form-input::placeholder {
          color: #cbd5e1;
        }

        .db-form-input:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }

        .db-toggle-group {
          display: flex;
          gap: 8px;
        }

        .db-toggle-pill {
          flex: 1;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .db-toggle-pill:hover {
          border-color: #cbd5e1;
        }

        .db-toggle-pill.db-pill-active {
          background: #f0f9ff;
          border-color: #0ea5e9;
          color: #0ea5e9;
        }

        .db-modal-footer {
          padding: 0 28px 24px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        /* ── Mobile ── */
        .db-mobile-toggle {
          display: none;
          width: 44px;
          height: 44px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #475569;
          font-size: 18px;
        }

        .db-sidebar-backdrop {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.3);
          z-index: 99;
        }

        @media (max-width: 991px) {
          .db-sidebar {
            transform: translateX(-100%);
          }

          .db-sidebar.db-sidebar-open {
            transform: translateX(0);
          }

          .db-sidebar-backdrop.db-backdrop-show {
            display: block;
          }

          .db-content {
            margin-left: 0;
          }

          .db-content-inner {
            padding: 16px;
          }

          .db-mobile-toggle {
            display: flex;
          }

          .db-search-input {
            width: 140px;
          }
        }

        @media (max-width: 575px) {
          .db-kpi-amount {
            font-size: 22px;
          }

          .db-search-input {
            display: none;
          }
        }
      `}</style>

      {/* Sidebar Backdrop (mobile) */}
      <div
        className={`db-sidebar-backdrop ${sidebarOpen ? 'db-backdrop-show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`db-sidebar ${sidebarOpen ? 'db-sidebar-open' : ''}`}>
        <div className="db-sidebar-header">
          <div className="db-logo-row">
            <span className="db-logo-text">Finans Kalesi</span>
            <span className="db-pro-badge">PRO</span>
          </div>
        </div>

        <div className="db-divider" />

        <div className="db-menu-label">MODÜLLER</div>

        <ul className="db-menu-list">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className={`db-menu-item ${activeMenu === item.id ? 'db-active' : ''}`}
              onClick={() => {
                setActiveMenu(item.id);
                setSidebarOpen(false);
              }}
            >
              <i className={`bi ${item.icon}`} />
              {item.label}
            </li>
          ))}
        </ul>

        <div className="db-divider" />

        <div className="db-sidebar-footer">
          <div className="db-user-row">
            <div className="db-user-avatar">KD</div>
            <div className="db-user-info">
              <span className="db-user-name">Kaan Doğan</span>
              <span className="db-user-status">
                <span className="db-status-dot" />
                Çevrimiçi
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="db-content">
        <div className="db-content-inner">
          {/* Top bar */}
          <div className="db-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="db-mobile-toggle"
                onClick={() => setSidebarOpen(true)}
              >
                <i className="bi bi-list" />
              </button>
              <span className="db-breadcrumb">
                Finans Kalesi / <span>Dashboard</span>
              </span>
            </div>
            <div className="db-topbar-right">
              <div className="db-search-wrap">
                <i className="bi bi-search db-search-icon" />
                <input
                  type="text"
                  className="db-search-input"
                  placeholder="Ara..."
                />
              </div>
              <button className="db-notif-btn">
                <i className="bi bi-bell" />
                <span className="db-notif-dot" />
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="row g-3 mb-4">
            <div className="col-lg-4 col-md-6 col-12">
              <div className="db-kpi-card">
                <div className="db-kpi-label">Net Varlık</div>
                <div className="db-kpi-row">
                  <div>
                    <div className="db-kpi-amount">{formatPara(2458320)}</div>
                    <div className="db-kpi-sub db-positive">
                      <i className="bi bi-arrow-up-short" />
                      +12.4% geçen aya göre
                    </div>
                  </div>
                  <div className="db-sparkline">
                    <div className="db-sparkline-bar" />
                    <div className="db-sparkline-bar" />
                    <div className="db-sparkline-bar" />
                    <div className="db-sparkline-bar" />
                    <div className="db-sparkline-bar" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-12">
              <div className="db-kpi-card">
                <div className="db-kpi-label">Toplam Alacak</div>
                <div className="db-kpi-row">
                  <div>
                    <div className="db-kpi-amount">{formatPara(856400)}</div>
                    <div className="db-kpi-sub">23 açık fatura</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-12">
              <div className="db-kpi-card">
                <div className="db-kpi-label">Toplam Borç</div>
                <div className="db-kpi-row">
                  <div>
                    <div className="db-kpi-amount">{formatPara(412800)}</div>
                    <div className="db-kpi-sub">8 bekleyen ödeme</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content — Two Columns */}
          <div className="row g-3">
            {/* Left — Cari Hesaplar Table */}
            <div className="col-lg-8 col-12">
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title">
                    Cari Hesaplar
                    <span className="db-count-badge">156</span>
                  </div>
                  <button
                    className="db-btn-primary"
                    onClick={() => setModalOpen(true)}
                  >
                    <i className="bi bi-plus-lg" />
                    Yeni Ekle
                  </button>
                </div>

                <div className="db-tabs">
                  <div
                    className={`db-tab ${activeTab === 'tumunu' ? 'db-tab-active' : ''}`}
                    onClick={() => setActiveTab('tumunu')}
                  >
                    Tümü
                  </div>
                  <div
                    className={`db-tab ${activeTab === 'musteriler' ? 'db-tab-active' : ''}`}
                    onClick={() => setActiveTab('musteriler')}
                  >
                    Müşteriler
                  </div>
                  <div
                    className={`db-tab ${activeTab === 'tedarikciler' ? 'db-tab-active' : ''}`}
                    onClick={() => setActiveTab('tedarikciler')}
                  >
                    Tedarikçiler
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Firma</th>
                        <th>Tür</th>
                        <th>Bakiye</th>
                        <th>Son İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCari.map((item, idx) => (
                        <tr key={idx}>
                          <td className="db-firma-name">{item.firma}</td>
                          <td>
                            <div className="db-tur-cell">
                              <span
                                className={`db-tur-dot ${
                                  item.tur === 'Müşteri'
                                    ? 'db-dot-musteri'
                                    : 'db-dot-tedarikci'
                                }`}
                              />
                              {item.tur}
                            </div>
                          </td>
                          <td
                            className={
                              item.bakiye >= 0
                                ? 'db-amount-positive'
                                : 'db-amount-negative'
                            }
                          >
                            {item.bakiye >= 0 ? '+' : ''}
                            {formatPara(item.bakiye)}
                          </td>
                          <td>{item.tarih}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-lg-4 col-12">
              {/* Yaklaşan Vadeler */}
              <div className="db-card mb-3">
                <div className="db-card-header" style={{ paddingBottom: '4px' }}>
                  <div className="db-card-title">Yaklaşan Vadeler</div>
                </div>
                <div className="db-vade-list">
                  {vadeler.map((v, idx) => (
                    <div key={idx} className="db-vade-item">
                      <span
                        className={`db-vade-date ${v.acil ? 'db-urgent' : ''}`}
                      >
                        {v.tarih}
                      </span>
                      <span className="db-vade-firma">{v.firma}</span>
                      <span className="db-vade-amount">{formatPara(v.tutar)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Son Aktiviteler */}
              <div className="db-card">
                <div className="db-card-header" style={{ paddingBottom: '8px' }}>
                  <div className="db-card-title">Son Aktiviteler</div>
                </div>
                <div className="db-timeline">
                  {aktiviteler.map((a, idx) => (
                    <div key={idx} className="db-timeline-item">
                      <div
                        className="db-timeline-dot"
                        style={{ background: a.renk }}
                      />
                      <div className="db-timeline-content">
                        <div className="db-timeline-text">{a.aciklama}</div>
                        <div className="db-timeline-time">{a.zaman}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal — Yeni Cari Hesap */}
      {modalOpen && (
        <div className="db-modal-overlay">
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <span className="db-modal-title">Yeni Cari Hesap</span>
              <button
                className="db-modal-close"
                onClick={() => setModalOpen(false)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="db-modal-body">
              <div className="db-form-group">
                <label className="db-form-label">Firma Adı</label>
                <input
                  type="text"
                  className="db-form-input"
                  placeholder="Firma adını girin"
                  value={formData.firmaAdi}
                  onChange={(e) => handleFormChange('firmaAdi', e.target.value)}
                />
              </div>

              <div className="db-form-group">
                <label className="db-form-label">Vergi No</label>
                <input
                  type="text"
                  className="db-form-input"
                  placeholder="Vergi numarası"
                  value={formData.vergiNo}
                  onChange={(e) => handleFormChange('vergiNo', e.target.value)}
                />
              </div>

              <div className="db-form-group">
                <label className="db-form-label">Telefon</label>
                <input
                  type="text"
                  className="db-form-input"
                  placeholder="0(5XX) XXX XX XX"
                  value={formData.telefon}
                  onChange={(e) => handleFormChange('telefon', e.target.value)}
                />
              </div>

              <div className="db-form-group">
                <label className="db-form-label">Tür</label>
                <div className="db-toggle-group">
                  <button
                    className={`db-toggle-pill ${
                      formData.tur === 'musteri' ? 'db-pill-active' : ''
                    }`}
                    onClick={() => handleFormChange('tur', 'musteri')}
                  >
                    Müşteri
                  </button>
                  <button
                    className={`db-toggle-pill ${
                      formData.tur === 'tedarikci' ? 'db-pill-active' : ''
                    }`}
                    onClick={() => handleFormChange('tur', 'tedarikci')}
                  >
                    Tedarikçi
                  </button>
                </div>
              </div>

              <div className="db-form-group">
                <label className="db-form-label">E-posta</label>
                <input
                  type="email"
                  className="db-form-input"
                  placeholder="ornek@firma.com"
                  value={formData.eposta}
                  onChange={(e) => handleFormChange('eposta', e.target.value)}
                />
              </div>
            </div>

            <div className="db-modal-footer">
              <button
                className="db-btn-ghost"
                onClick={() => setModalOpen(false)}
              >
                İptal
              </button>
              <button className="db-btn-primary" onClick={handleSubmit}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
