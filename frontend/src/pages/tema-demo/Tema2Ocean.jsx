import React, { useState, useEffect } from 'react';

const formatPara = (n) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n);

/* ── Mock Data ─────────────────────────────────────────── */
const kpiData = [
  { baslik: 'Toplam Bakiye', tutar: 2450000, ikon: 'bi-wallet2', renk: '#0ea5e9' },
  { baslik: 'Alacak', tutar: 1820000, ikon: 'bi-arrow-down-circle', renk: '#10b981' },
  { baslik: 'Borc', tutar: 630000, ikon: 'bi-arrow-up-circle', renk: '#ef4444' },
  { baslik: 'Kasa', tutar: 485000, ikon: 'bi-safe', renk: '#06b6d4', chart: true },
];

const cariData = [
  { ad: 'Demir Celik San. A.S.', tip: 'Alici', bakiye: 420000, sonIslem: '12.03.2026', durum: 'Aktif' },
  { ad: 'Anadolu Hirdavat Ltd.', tip: 'Satici', bakiye: -185000, sonIslem: '11.03.2026', durum: 'Aktif' },
  { ad: 'Marmara Insaat Tic.', tip: 'Alici', bakiye: 95000, sonIslem: '10.03.2026', durum: 'Pasif' },
  { ad: 'Yildiz Metal San.', tip: 'Satici', bakiye: -42000, sonIslem: '09.03.2026', durum: 'Aktif' },
  { ad: 'Karadeniz Civata A.S.', tip: 'Alici', bakiye: 310000, sonIslem: '08.03.2026', durum: 'Aktif' },
];

const kasaIslemler = [
  { ikon: 'bi-arrow-down-left', aciklama: 'Demir Celik San. tahsilat', tutar: 85000, tarih: '14.03.2026', tip: 'giris' },
  { ikon: 'bi-arrow-up-right', aciklama: 'Anadolu Hirdavat odeme', tutar: 42000, tarih: '13.03.2026', tip: 'cikis' },
  { ikon: 'bi-arrow-down-left', aciklama: 'Karadeniz Civata tahsilat', tutar: 120000, tarih: '12.03.2026', tip: 'giris' },
  { ikon: 'bi-arrow-up-right', aciklama: 'Kira odemesi', tutar: 18500, tarih: '11.03.2026', tip: 'cikis' },
  { ikon: 'bi-arrow-down-left', aciklama: 'Marmara Insaat tahsilat', tutar: 67000, tarih: '10.03.2026', tip: 'giris' },
];

const cekSenetData = [
  { belgeNo: 'CK-2026-001', tur: 'Cek', tutar: 145000, vade: '25.04.2026', taraf: 'Demir Celik San.', durum: 'Beklemede' },
  { belgeNo: 'SN-2026-014', tur: 'Senet', tutar: 82000, vade: '18.03.2026', taraf: 'Anadolu Hirdavat', durum: 'Tahsil Edildi' },
  { belgeNo: 'CK-2026-003', tur: 'Cek', tutar: 210000, vade: '30.05.2026', taraf: 'Yildiz Metal San.', durum: 'Ciro Edildi' },
  { belgeNo: 'SN-2026-008', tur: 'Senet', tutar: 55000, vade: '10.04.2026', taraf: 'Marmara Insaat', durum: 'Protestolu' },
  { belgeNo: 'CK-2026-005', tur: 'Cek', tutar: 175000, vade: '15.06.2026', taraf: 'Karadeniz Civata', durum: 'Beklemede' },
];

/* ── Mini Bar Chart SVG ────────────────────────────────── */
const MiniBarChart = () => (
  <svg width="60" height="32" viewBox="0 0 60 32" style={{ display: 'block' }}>
    {[8, 18, 12, 24, 16, 28, 20].map((h, i) => (
      <rect key={i} x={i * 9} y={32 - h} width="6" rx="2" height={h}
        fill={i === 5 ? '#0ea5e9' : 'rgba(14,165,233,0.25)'} />
    ))}
  </svg>
);

/* ── Component ─────────────────────────────────────────── */
export default function Tema2Ocean() {
  const [modalAcik, setModalAcik] = useState(false);
  const [aktifSekme, setAktifSekme] = useState('dashboard');

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setModalAcik(false); };
    if (modalAcik) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [modalAcik]);

  const sekmeler = [
    { id: 'dashboard', ad: 'Dashboard', ikon: 'bi-grid' },
    { id: 'cari', ad: 'Cari Hesaplar', ikon: 'bi-people' },
    { id: 'kasa', ad: 'Kasa', ikon: 'bi-safe' },
    { id: 'cek', ad: 'Cek / Senet', ikon: 'bi-file-earmark-check' },
    { id: 'vade', ad: 'Vade Hesaplayici', ikon: 'bi-calculator' },
  ];

  const durumRenk = (d) => {
    switch (d) {
      case 'Beklemede': return { bg: 'rgba(245,158,11,0.1)', renk: '#d97706', border: 'rgba(245,158,11,0.3)' };
      case 'Tahsil Edildi': return { bg: 'rgba(16,185,129,0.1)', renk: '#059669', border: 'rgba(16,185,129,0.3)' };
      case 'Protestolu': return { bg: 'rgba(239,68,68,0.1)', renk: '#dc2626', border: 'rgba(239,68,68,0.3)' };
      case 'Ciro Edildi': return { bg: 'rgba(14,165,233,0.1)', renk: '#0369a1', border: 'rgba(14,165,233,0.3)' };
      default: return { bg: 'rgba(148,163,184,0.1)', renk: '#64748b', border: 'rgba(148,163,184,0.3)' };
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');

        @keyframes tema2FadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tema2SlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .tema2-wrapper {
          min-height: 100vh;
          background: #f0f9ff;
          font-family: 'Outfit', sans-serif;
          color: #0f172a;
          animation: tema2FadeIn 0.4s ease;
        }

        .tema2-header {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 20px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .tema2-header-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tema2-header-title i {
          color: #0ea5e9;
          font-size: 22px;
        }
        .tema2-header-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: linear-gradient(135deg, rgba(14,165,233,0.1), rgba(3,105,161,0.06));
          color: #0369a1;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(14,165,233,0.15);
        }

        .tema2-tabs {
          display: flex;
          gap: 6px;
          padding: 12px 32px;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          overflow-x: auto;
          flex-wrap: nowrap;
        }
        .tema2-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s ease;
          min-height: 44px;
          min-width: 44px;
        }
        .tema2-tab-active {
          background: #0ea5e9;
          color: #fff;
          font-weight: 700;
          box-shadow: 0 2px 10px rgba(14,165,233,0.3);
        }
        .tema2-tab-inactive {
          background: transparent;
          color: #64748b;
        }
        .tema2-tab-inactive:hover {
          background: rgba(14,165,233,0.06);
          color: #0369a1;
        }

        .tema2-content {
          padding: 28px 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .tema2-section-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tema2-section-title i {
          color: #0ea5e9;
        }

        /* KPI Cards */
        .tema2-kpi-card {
          background: #ffffff;
          border: 1px solid rgba(14,165,233,0.1);
          border-radius: 16px;
          padding: 22px 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
          container-type: inline-size;
          animation: tema2SlideUp 0.5s ease both;
        }
        .tema2-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(14,165,233,0.2);
          box-shadow: 0 8px 24px rgba(14,165,233,0.08);
        }
        .tema2-kpi-icon-bg {
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 64px;
          opacity: 0.06;
        }
        .tema2-kpi-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 8px;
        }
        .tema2-kpi-value {
          font-family: 'Inter', sans-serif;
          font-size: clamp(13px, 6.5cqw, 26px);
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        /* Card wrapper */
        .tema2-card {
          background: #ffffff;
          border: 1px solid rgba(14,165,233,0.1);
          border-radius: 16px;
          overflow: hidden;
          animation: tema2SlideUp 0.5s ease both;
        }
        .tema2-card-header {
          padding: 18px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .tema2-card-body {
          padding: 20px 24px;
        }

        /* Search input */
        .tema2-search {
          position: relative;
        }
        .tema2-search input {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          padding: 10px 14px 10px 38px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
          outline: none;
          width: 260px;
          min-height: 44px;
          transition: all 0.2s;
        }
        .tema2-search input::placeholder { color: #cbd5e1; }
        .tema2-search input:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.1);
          background: #fff;
        }
        .tema2-search i {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 15px;
        }

        /* Table */
        .tema2-table {
          width: 100%;
          font-size: 13px;
          border-collapse: separate;
          border-spacing: 0;
        }
        .tema2-table thead th {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafcff;
        }
        .tema2-table tbody td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #0f172a;
          vertical-align: middle;
        }
        .tema2-table tbody tr:hover td {
          background: rgba(14,165,233,0.02);
        }
        .tema2-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* Badges */
        .tema2-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          min-height: 26px;
        }

        /* Buttons */
        .tema2-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #0ea5e9, #0369a1);
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 14px;
          border: none;
          border-radius: 50px;
          padding: 10px 22px;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(14,165,233,0.3);
          transition: all 0.2s ease;
          min-height: 44px;
          min-width: 44px;
        }
        .tema2-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(14,165,233,0.35);
        }
        .tema2-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(14,165,233,0.06);
          border: 1px solid rgba(14,165,233,0.15);
          color: #0369a1;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 13px;
          border-radius: 10px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 44px;
          min-width: 44px;
        }
        .tema2-btn-secondary:hover {
          background: rgba(14,165,233,0.1);
          border-color: rgba(14,165,233,0.25);
        }
        .tema2-btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: transparent;
          border: 1px solid rgba(14,165,233,0.4);
          color: #0ea5e9;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 13px;
          border-radius: 10px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 44px;
          min-width: 44px;
        }
        .tema2-btn-outline:hover {
          background: rgba(14,165,233,0.06);
        }

        /* Pagination */
        .tema2-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 16px 0 4px;
        }
        .tema2-page-btn {
          min-width: 44px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #475569;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tema2-page-btn:hover { border-color: #0ea5e9; color: #0ea5e9; }
        .tema2-page-btn-active {
          background: #0ea5e9;
          color: #fff;
          border-color: #0ea5e9;
        }

        /* Kasa */
        .tema2-kasa-summary {
          border-radius: 14px;
          padding: 20px 24px;
          border: 1px solid;
        }
        .tema2-kasa-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .tema2-kasa-item:last-child { border-bottom: none; }
        .tema2-kasa-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        /* Form */
        .tema2-form-label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
          display: block;
        }
        .tema2-form-input {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
          width: 100%;
          outline: none;
          min-height: 44px;
          transition: all 0.2s;
        }
        .tema2-form-input::placeholder { color: #cbd5e1; }
        .tema2-form-input:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.1);
          background: #fff;
        }

        /* Result card */
        .tema2-result-card {
          background: linear-gradient(135deg, rgba(14,165,233,0.06), rgba(3,105,161,0.03));
          border: 1px solid rgba(14,165,233,0.15);
          border-radius: 16px;
          padding: 28px 24px;
          text-align: center;
        }

        /* Modal */
        .tema2-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: tema2FadeIn 0.2s ease;
        }
        .tema2-modal-box {
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.12);
          display: flex;
          flex-direction: column;
          animation: tema2SlideUp 0.3s ease;
          overflow: hidden;
        }
        .tema2-modal-header {
          background: linear-gradient(135deg, rgba(14,165,233,0.12), rgba(3,105,161,0.06));
          border-bottom: 2px solid rgba(14,165,233,0.4);
          padding: 22px 24px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .tema2-modal-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0ea5e9, #0369a1);
          box-shadow: 0 4px 12px rgba(14,165,233,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          flex-shrink: 0;
        }
        .tema2-modal-title {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.3;
        }
        .tema2-modal-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }
        .tema2-modal-close {
          margin-left: auto;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: rgba(0,0,0,0.04);
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.2s;
          min-width: 44px;
          min-height: 44px;
        }
        .tema2-modal-close:hover {
          background: rgba(0,0,0,0.08);
          color: #0f172a;
        }
        .tema2-modal-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
        }
        .tema2-modal-section {
          margin-bottom: 20px;
        }
        .tema2-modal-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
          margin-bottom: 14px;
        }
        .tema2-modal-section-bar {
          width: 3px;
          height: 16px;
          border-radius: 2px;
        }
        .tema2-modal-preview {
          background: linear-gradient(135deg, rgba(14,165,233,0.06), rgba(3,105,161,0.03));
          border: 1px solid rgba(14,165,233,0.15);
          border-radius: 12px;
          padding: 16px;
        }
        .tema2-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          position: sticky;
          bottom: 0;
          background: #fff;
        }
        .tema2-modal-footer-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #0ea5e9, #0369a1);
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 14px;
          border: none;
          border-radius: 12px;
          padding: 14px 20px;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(14,165,233,0.3);
          transition: all 0.2s;
          min-height: 44px;
        }
        .tema2-modal-footer-btn:hover {
          box-shadow: 0 6px 20px rgba(14,165,233,0.35);
        }

        /* Money font */
        .tema2-money { font-family: 'Inter', sans-serif; font-weight: 700; }

        /* Spacing for sections */
        .tema2-section { margin-bottom: 32px; }

        @media (max-width: 768px) {
          .tema2-content { padding: 20px 16px; }
          .tema2-header { padding: 16px; }
          .tema2-tabs { padding: 10px 16px; }
          .tema2-search input { width: 100%; }
        }
      `}</style>

      <div className="tema2-wrapper">
        {/* Header */}
        <div className="tema2-header">
          <div className="tema2-header-title">
            <i className="bi bi-water" />
            Ocean Mist
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="tema2-header-badge">Acik Tema</span>
            <button className="tema2-btn-primary" onClick={() => setModalAcik(true)}>
              <i className="bi bi-plus-lg" /> Modal Demo
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tema2-tabs">
          {sekmeler.map((s) => (
            <button
              key={s.id}
              className={`tema2-tab ${aktifSekme === s.id ? 'tema2-tab-active' : 'tema2-tab-inactive'}`}
              onClick={() => setAktifSekme(s.id)}
            >
              <i className={s.ikon} /> {s.ad}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="tema2-content">

          {/* ── 1. DASHBOARD ─────────────────────────── */}
          {aktifSekme === 'dashboard' && (
            <div className="tema2-section">
              <div className="tema2-section-title">
                <i className="bi bi-grid" /> Dashboard
              </div>
              <div className="row g-3">
                {kpiData.map((k, i) => (
                  <div className="col-lg-3 col-md-6" key={i}>
                    <div className="tema2-kpi-card" style={{ animationDelay: `${i * 0.08}s` }}>
                      <i className={`bi ${k.ikon} tema2-kpi-icon-bg`} style={{ color: k.renk }} />
                      <div className="tema2-kpi-label">{k.baslik}</div>
                      <div className="tema2-kpi-value" style={{ color: k.renk === '#ef4444' ? '#ef4444' : '#0f172a' }}>
                        {'\u20BA'}{formatPara(k.tutar)}
                      </div>
                      {k.chart && (
                        <div style={{ marginTop: 12 }}>
                          <MiniBarChart />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 2. CARi HESAPLAR ─────────────────────── */}
          {aktifSekme === 'cari' && (
            <div className="tema2-section">
              <div className="tema2-card">
                <div className="tema2-card-header">
                  <div className="tema2-section-title" style={{ margin: 0 }}>
                    <i className="bi bi-people" /> Cari Hesaplar
                  </div>
                  <div className="tema2-search">
                    <i className="bi bi-search" />
                    <input type="text" placeholder="Cari ara..." />
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }} className="table-responsive">
                  <table className="tema2-table">
                    <thead>
                      <tr>
                        <th>Cari Adi</th>
                        <th>Tip</th>
                        <th>Bakiye</th>
                        <th>Son Islem</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cariData.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{c.ad}</td>
                          <td>
                            <span className="tema2-badge" style={{
                              background: c.tip === 'Alici' ? 'rgba(14,165,233,0.08)' : 'rgba(139,92,246,0.08)',
                              color: c.tip === 'Alici' ? '#0369a1' : '#7c3aed',
                              border: `1px solid ${c.tip === 'Alici' ? 'rgba(14,165,233,0.2)' : 'rgba(139,92,246,0.2)'}`,
                            }}>
                              {c.tip}
                            </span>
                          </td>
                          <td>
                            <span className="tema2-money" style={{ color: c.bakiye >= 0 ? '#059669' : '#dc2626' }}>
                              {c.bakiye < 0 ? '-' : ''}{'\u20BA'}{formatPara(Math.abs(c.bakiye))}
                            </span>
                          </td>
                          <td style={{ color: '#475569' }}>{c.sonIslem}</td>
                          <td>
                            <span className="tema2-badge" style={{
                              background: c.durum === 'Aktif' ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                              color: c.durum === 'Aktif' ? '#059669' : '#64748b',
                              border: `1px solid ${c.durum === 'Aktif' ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.3)'}`,
                            }}>
                              <i className={`bi ${c.durum === 'Aktif' ? 'bi-check-circle-fill' : 'bi-pause-circle'}`}
                                style={{ fontSize: 10 }} />
                              {c.durum}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="tema2-pagination">
                  <button className="tema2-page-btn"><i className="bi bi-chevron-left" /></button>
                  <button className="tema2-page-btn tema2-page-btn-active">1</button>
                  <button className="tema2-page-btn">2</button>
                  <button className="tema2-page-btn">3</button>
                  <button className="tema2-page-btn"><i className="bi bi-chevron-right" /></button>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. KASA ──────────────────────────────── */}
          {aktifSekme === 'kasa' && (
            <div className="tema2-section">
              <div className="tema2-section-title">
                <i className="bi bi-safe" /> Kasa
              </div>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="tema2-kasa-summary" style={{
                    background: 'rgba(16,185,129,0.04)',
                    borderColor: 'rgba(16,185,129,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <i className="bi bi-arrow-down-circle-fill" style={{ color: '#10b981', fontSize: 20 }} />
                      <span style={{ fontWeight: 700, color: '#059669', fontSize: 13 }}>Toplam Giris</span>
                    </div>
                    <div className="tema2-money" style={{ fontSize: 24, color: '#059669' }}>
                      {'\u20BA'}{formatPara(272000)}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="tema2-kasa-summary" style={{
                    background: 'rgba(239,68,68,0.04)',
                    borderColor: 'rgba(239,68,68,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <i className="bi bi-arrow-up-circle-fill" style={{ color: '#ef4444', fontSize: 20 }} />
                      <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 13 }}>Toplam Cikis</span>
                    </div>
                    <div className="tema2-money" style={{ fontSize: 24, color: '#dc2626' }}>
                      {'\u20BA'}{formatPara(60500)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="tema2-card">
                <div className="tema2-card-header">
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Son Islemler</span>
                </div>
                <div className="tema2-card-body" style={{ padding: '8px 24px' }}>
                  {kasaIslemler.map((isl, i) => (
                    <div className="tema2-kasa-item" key={i}>
                      <div className="tema2-kasa-icon" style={{
                        background: isl.tip === 'giris' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: isl.tip === 'giris' ? '#10b981' : '#ef4444',
                      }}>
                        <i className={`bi ${isl.ikon}`} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{isl.aciklama}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{isl.tarih}</div>
                      </div>
                      <div className="tema2-money" style={{
                        color: isl.tip === 'giris' ? '#059669' : '#dc2626',
                        fontSize: 14,
                      }}>
                        {isl.tip === 'giris' ? '+' : '-'}{'\u20BA'}{formatPara(isl.tutar)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 4. CEK / SENET ───────────────────────── */}
          {aktifSekme === 'cek' && (
            <div className="tema2-section">
              <div className="tema2-card">
                <div className="tema2-card-header">
                  <div className="tema2-section-title" style={{ margin: 0 }}>
                    <i className="bi bi-file-earmark-check" /> Cek / Senet
                  </div>
                  <button className="tema2-btn-secondary">
                    <i className="bi bi-funnel" /> Filtrele
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="tema2-table">
                    <thead>
                      <tr>
                        <th>Belge No</th>
                        <th>Tur</th>
                        <th>Tutar</th>
                        <th>Vade Tarihi</th>
                        <th>Kime/Kimden</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cekSenetData.map((c, i) => {
                        const d = durumRenk(c.durum);
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 600, fontFamily: "'Inter', sans-serif", fontSize: 12 }}>{c.belgeNo}</td>
                            <td>
                              <span className="tema2-badge" style={{
                                background: c.tur === 'Cek' ? 'rgba(14,165,233,0.08)' : 'rgba(20,184,166,0.08)',
                                color: c.tur === 'Cek' ? '#0369a1' : '#0d9488',
                                border: `1px solid ${c.tur === 'Cek' ? 'rgba(14,165,233,0.2)' : 'rgba(20,184,166,0.2)'}`,
                              }}>
                                {c.tur}
                              </span>
                            </td>
                            <td className="tema2-money" style={{ color: '#0f172a' }}>
                              {'\u20BA'}{formatPara(c.tutar)}
                            </td>
                            <td style={{ color: '#475569' }}>{c.vade}</td>
                            <td style={{ fontWeight: 500 }}>{c.taraf}</td>
                            <td>
                              <span className="tema2-badge" style={{
                                background: d.bg,
                                color: d.renk,
                                border: `1px solid ${d.border}`,
                              }}>
                                {c.durum}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── 5. VADE HESAPLAYICI ──────────────────── */}
          {aktifSekme === 'vade' && (
            <div className="tema2-section">
              <div className="tema2-section-title">
                <i className="bi bi-calculator" /> Vade Hesaplayici
              </div>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="tema2-card">
                    <div className="tema2-card-body">
                      <div style={{ marginBottom: 18 }}>
                        <label className="tema2-form-label">Tutar (TL)</label>
                        <input className="tema2-form-input" type="text" placeholder="0,00" />
                      </div>
                      <div style={{ marginBottom: 18 }}>
                        <label className="tema2-form-label">Faiz Orani (%)</label>
                        <input className="tema2-form-input" type="text" placeholder="0,00" />
                      </div>
                      <div style={{ marginBottom: 18 }}>
                        <label className="tema2-form-label">Vade (Gun)</label>
                        <input className="tema2-form-input" type="text" placeholder="30" />
                      </div>
                      <div style={{ marginBottom: 22 }}>
                        <label className="tema2-form-label">Baslangic Tarihi</label>
                        <input className="tema2-form-input" type="date" />
                      </div>
                      <button className="tema2-btn-primary" style={{ width: '100%' }}>
                        <i className="bi bi-calculator" /> Hesapla
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="tema2-result-card">
                    <i className="bi bi-graph-up-arrow" style={{ fontSize: 40, color: '#0ea5e9', opacity: 0.3, marginBottom: 12, display: 'block' }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Hesaplanan Tutar
                    </div>
                    <div className="tema2-money" style={{ fontSize: 32, color: '#0369a1', marginBottom: 16 }}>
                      {'\u20BA'}{formatPara(0)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Faiz Tutari</div>
                        <div className="tema2-money" style={{ fontSize: 15, color: '#0ea5e9' }}>{'\u20BA'}{formatPara(0)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Vade Sonu</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>--/--/----</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── 6. MODAL ─────────────────────────────────── */}
      {modalAcik && (
        <div className="tema2-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { /* backdrop click does NOT close */ } }}>
          <div className="tema2-modal-box">
            {/* Header */}
            <div className="tema2-modal-header">
              <div className="tema2-modal-icon-box">
                <i className="bi bi-plus-lg" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="tema2-modal-title">Yeni Kayit Ekle</div>
                <div className="tema2-modal-subtitle">Tum alanlari eksiksiz doldurunuz</div>
              </div>
              <button className="tema2-modal-close" onClick={() => setModalAcik(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Body */}
            <div className="tema2-modal-body">
              {/* Section 1 */}
              <div className="tema2-modal-section">
                <div className="tema2-modal-section-title">
                  <span className="tema2-modal-section-bar" style={{ background: '#0ea5e9' }} />
                  Temel Bilgiler
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="tema2-form-label">Cari Hesap</label>
                  <input className="tema2-form-input" placeholder="Cari secin veya arayın..." />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="tema2-form-label">Tutar</label>
                  <input className="tema2-form-input" placeholder="0,00" />
                </div>
              </div>

              {/* Section 2 */}
              <div className="tema2-modal-section">
                <div className="tema2-modal-section-title">
                  <span className="tema2-modal-section-bar" style={{ background: '#14b8a6' }} />
                  Islem Detaylari
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="tema2-form-label">Islem Tarihi</label>
                  <input className="tema2-form-input" type="date" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="tema2-form-label">Aciklama</label>
                  <input className="tema2-form-input" placeholder="Islem aciklamasi..." />
                </div>
              </div>

              {/* Live Preview */}
              <div className="tema2-modal-preview">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Onizleme
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>Cari Hesap</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>--/--/----</div>
                  </div>
                  <div className="tema2-money" style={{ fontSize: 18, color: '#0369a1' }}>
                    {'\u20BA'}{formatPara(0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="tema2-modal-footer">
              <button className="tema2-modal-footer-btn">
                <i className="bi bi-check-lg" /> Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
