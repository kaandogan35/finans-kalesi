import React, { useState } from 'react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');

.tema4-wrap {
  min-height: 100vh;
  background: #f0fdf4;
  font-family: 'Outfit', sans-serif;
  color: #1a1a1a;
  padding-bottom: 60px;
}

.tema4-wrap * { box-sizing: border-box; }

/* ── HEADER ── */
.tema4-header {
  background: #ffffff;
  border-bottom: 1px solid rgba(5,150,105,0.1);
  padding: 20px 0;
  margin-bottom: 32px;
}
.tema4-header h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
}
.tema4-header h1 span {
  background: linear-gradient(135deg, #059669, #047857);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.tema4-header p {
  color: #a3a3a3;
  font-size: 13px;
  margin: 4px 0 0;
}

/* ── SECTION TITLES ── */
.tema4-section-title {
  font-family: 'Outfit', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 40px 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.tema4-section-title i {
  color: #059669;
  font-size: 20px;
}

/* ── KPI CARDS ── */
.tema4-kpi-card {
  background: #ffffff;
  border: 1px solid rgba(5,150,105,0.1);
  border-radius: 16px;
  padding: 22px 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease;
  height: 100%;
  container-type: inline-size;
}
.tema4-kpi-card:hover {
  border-color: rgba(5,150,105,0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(5,150,105,0.08);
}
.tema4-kpi-deco {
  position: absolute;
  top: 12px;
  right: 14px;
  font-size: 48px;
  opacity: 0.06;
  color: #059669;
}
.tema4-kpi-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #a3a3a3;
  margin-bottom: 6px;
}
.tema4-kpi-value {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: clamp(20px, 5cqi, 28px);
  color: #1a1a1a;
  margin-bottom: 8px;
}
.tema4-kpi-chart {
  margin-top: 8px;
}

/* ── TABLE CARD ── */
.tema4-card {
  background: #ffffff;
  border: 1px solid rgba(5,150,105,0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

/* ── SEARCH INPUT ── */
.tema4-search-wrap {
  position: relative;
  max-width: 320px;
  margin-bottom: 16px;
}
.tema4-search-wrap i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a3a3a3;
  font-size: 15px;
}
.tema4-search-wrap input {
  width: 100%;
  padding: 10px 14px 10px 40px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background: #fafafa;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #1a1a1a;
  outline: none;
  transition: all 0.2s;
  min-height: 44px;
}
.tema4-search-wrap input::placeholder {
  color: #d4d4d4;
}
.tema4-search-wrap input:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5,150,105,0.08);
}

/* ── TABLE ── */
.tema4-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.tema4-table thead th {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #a3a3a3;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  white-space: nowrap;
}
.tema4-table tbody td {
  padding: 14px 16px;
  font-size: 14px;
  color: #1a1a1a;
  border-bottom: 1px solid #f5f5f5;
  vertical-align: middle;
}
.tema4-table tbody tr:last-child td {
  border-bottom: none;
}
.tema4-table tbody tr:hover {
  background: rgba(5,150,105,0.02);
}
.tema4-money {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
}
.tema4-money.green { color: #10b981; }
.tema4-money.red { color: #ef4444; }

/* ── BADGES ── */
.tema4-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.tema4-badge.emerald {
  background: rgba(5,150,105,0.08);
  color: #059669;
}
.tema4-badge.teal {
  background: rgba(8,145,178,0.08);
  color: #0891b2;
}
.tema4-badge.green {
  background: rgba(16,185,129,0.08);
  color: #059669;
}
.tema4-badge.red {
  background: rgba(239,68,68,0.08);
  color: #dc2626;
}
.tema4-badge.amber {
  background: rgba(245,158,11,0.08);
  color: #d97706;
}
.tema4-badge.blue {
  background: rgba(59,130,246,0.08);
  color: #2563eb;
}
.tema4-badge.stone {
  background: rgba(163,163,163,0.08);
  color: #737373;
}

/* ── PAGINATION ── */
.tema4-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 16px;
}
.tema4-pagination button {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background: #ffffff;
  color: #525252;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Outfit', sans-serif;
}
.tema4-pagination button:hover {
  border-color: rgba(5,150,105,0.3);
  color: #059669;
}
.tema4-pagination button.active {
  background: #059669;
  border-color: #059669;
  color: #fff;
}

/* ── KASA ── */
.tema4-kasa-summary {
  border-radius: 14px;
  padding: 20px 24px;
  height: 100%;
}
.tema4-kasa-summary.giris {
  background: rgba(16,185,129,0.06);
  border: 1px solid rgba(16,185,129,0.12);
}
.tema4-kasa-summary.cikis {
  background: rgba(239,68,68,0.06);
  border: 1px solid rgba(239,68,68,0.12);
}
.tema4-kasa-summary .label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tema4-kasa-summary.giris .label { color: #059669; }
.tema4-kasa-summary.cikis .label { color: #dc2626; }
.tema4-kasa-summary .value {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: 24px;
  margin-top: 6px;
}
.tema4-kasa-summary.giris .value { color: #10b981; }
.tema4-kasa-summary.cikis .value { color: #ef4444; }

.tema4-tx-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
}
.tema4-tx-row:last-child { border-bottom: none; }
.tema4-tx-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.tema4-tx-icon.giris {
  background: rgba(16,185,129,0.08);
  color: #10b981;
}
.tema4-tx-icon.cikis {
  background: rgba(239,68,68,0.08);
  color: #ef4444;
}
.tema4-tx-desc {
  flex: 1;
  min-width: 0;
}
.tema4-tx-desc .title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.tema4-tx-desc .sub {
  font-size: 12px;
  color: #a3a3a3;
  margin-top: 2px;
}
.tema4-tx-amount {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 15px;
  text-align: right;
  white-space: nowrap;
}
.tema4-tx-date {
  font-size: 12px;
  color: #a3a3a3;
  text-align: right;
  min-width: 80px;
}

/* ── TABS ── */
.tema4-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.tema4-tab {
  padding: 8px 18px;
  border-radius: 10px;
  border: none;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tema4-tab.active {
  background: #059669;
  color: #fff;
  font-weight: 700;
}
.tema4-tab.inactive {
  background: transparent;
  color: #737373;
}
.tema4-tab.inactive:hover {
  background: rgba(5,150,105,0.05);
  color: #059669;
}

/* ── FORM ── */
.tema4-form-label {
  font-size: 13px;
  font-weight: 600;
  color: #404040;
  margin-bottom: 6px;
  display: block;
}
.tema4-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background: #fafafa;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #1a1a1a;
  outline: none;
  transition: all 0.2s;
  min-height: 44px;
}
.tema4-input::placeholder { color: #d4d4d4; }
.tema4-input:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5,150,105,0.08);
}
.tema4-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background: #fafafa;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #1a1a1a;
  outline: none;
  transition: all 0.2s;
  min-height: 44px;
  cursor: pointer;
}
.tema4-select:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5,150,105,0.08);
}

/* ── BUTTONS ── */
.tema4-btn-primary {
  background: linear-gradient(135deg, #059669, #047857);
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 50px;
  padding: 10px 22px;
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(5,150,105,0.3);
  transition: all 0.25s;
  min-height: 44px;
}
.tema4-btn-primary:hover {
  box-shadow: 0 6px 20px rgba(5,150,105,0.4);
  transform: translateY(-1px);
}
.tema4-btn-secondary {
  background: rgba(5,150,105,0.06);
  border: 1px solid rgba(5,150,105,0.15);
  color: #047857;
  border-radius: 10px;
  padding: 10px 20px;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}
.tema4-btn-secondary:hover {
  background: rgba(5,150,105,0.1);
}
.tema4-btn-outline {
  background: transparent;
  border: 1px solid rgba(5,150,105,0.4);
  color: #059669;
  border-radius: 10px;
  padding: 10px 20px;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}
.tema4-btn-outline:hover {
  background: rgba(5,150,105,0.05);
}

/* ── VADE RESULT CARD ── */
.tema4-result-card {
  background: rgba(5,150,105,0.03);
  border: 1px solid rgba(5,150,105,0.1);
  border-radius: 14px;
  padding: 24px;
  height: 100%;
}
.tema4-result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(5,150,105,0.06);
}
.tema4-result-row:last-child { border-bottom: none; }
.tema4-result-row .label {
  font-size: 13px;
  color: #525252;
}
.tema4-result-row .value {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: #1a1a1a;
}

/* ── MODAL ── */
.tema4-modal-overlay {
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
}
.tema4-modal-box {
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 32px 80px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tema4-modal-header {
  background: linear-gradient(135deg, rgba(5,150,105,0.12), rgba(4,120,87,0.06));
  border-bottom: 2px solid rgba(5,150,105,0.4);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.tema4-modal-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #059669, #047857);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(5,150,105,0.3);
  flex-shrink: 0;
}
.tema4-modal-title-wrap {
  flex: 1;
}
.tema4-modal-title {
  font-size: 17px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
}
.tema4-modal-subtitle {
  font-size: 11px;
  color: #a3a3a3;
  margin: 2px 0 0;
}
.tema4-modal-close {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(5,150,105,0.12);
  background: #fff;
  color: #525252;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  flex-shrink: 0;
}
.tema4-modal-close:hover {
  background: rgba(5,150,105,0.05);
  color: #059669;
}
.tema4-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
.tema4-modal-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0 16px;
}
.tema4-modal-divider:first-child {
  margin-top: 0;
}
.tema4-modal-divider .bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
}
.tema4-modal-divider .bar.green { background: #059669; }
.tema4-modal-divider .bar.blue { background: #0891b2; }
.tema4-modal-divider .text {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a1a;
}
.tema4-modal-preview {
  background: rgba(5,150,105,0.03);
  border: 1px solid rgba(5,150,105,0.08);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}
.tema4-modal-preview .preview-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #a3a3a3;
  margin-bottom: 10px;
}
.tema4-modal-preview .preview-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}
.tema4-modal-preview .preview-row .label { color: #525252; }
.tema4-modal-preview .preview-row .value {
  font-weight: 600;
  color: #1a1a1a;
  font-family: 'Inter', sans-serif;
}
.tema4-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f5f5f5;
  background: #ffffff;
}
.tema4-modal-footer .tema4-btn-primary {
  width: 100%;
  border-radius: 50px;
  padding: 14px;
  font-size: 15px;
}
`;

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const fmtD = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

const kpiData = [
  { label: 'Toplam Bakiye', value: 2450000, icon: 'bi-wallet2', color: '#059669' },
  { label: 'Alacak', value: 1820000, icon: 'bi-arrow-down-left', color: '#10b981' },
  { label: 'Borc', value: 630000, icon: 'bi-arrow-up-right', color: '#ef4444' },
  { label: 'Kasa', value: 485000, icon: 'bi-safe', color: '#0891b2' },
];

const cariData = [
  { ad: 'Anadolu Demir Celik A.S.', tip: 'Alici', bakiye: 425000, sonIslem: '12.03.2026', durum: 'Aktif' },
  { ad: 'Yildiz Hirdavat Ltd. Sti.', tip: 'Satici', bakiye: -185000, sonIslem: '11.03.2026', durum: 'Aktif' },
  { ad: 'Karadeniz Metal San. Tic.', tip: 'Alici', bakiye: 312000, sonIslem: '10.03.2026', durum: 'Aktif' },
  { ad: 'Ozkan Insaat Malzemeleri', tip: 'Alici', bakiye: -92000, sonIslem: '08.03.2026', durum: 'Pasif' },
  { ad: 'Dogan Endustriyel Urunler', tip: 'Satici', bakiye: 178000, sonIslem: '07.03.2026', durum: 'Aktif' },
];

const kasaTxData = [
  { tip: 'giris', baslik: 'Anadolu Demir Celik', aciklama: 'Fatura tahsilati', tutar: 85000, tarih: '14.03.2026' },
  { tip: 'cikis', baslik: 'Yildiz Hirdavat', aciklama: 'Mal alim odemesi', tutar: 42000, tarih: '13.03.2026' },
  { tip: 'giris', baslik: 'Karadeniz Metal', aciklama: 'Cek tahsilati', tutar: 120000, tarih: '12.03.2026' },
  { tip: 'cikis', baslik: 'SGK Odemesi', aciklama: 'Mart 2026 prim', tutar: 28500, tarih: '11.03.2026' },
  { tip: 'giris', baslik: 'Dogan Endustriyel', aciklama: 'Nakit satis', tutar: 63000, tarih: '10.03.2026' },
];

const cekSenetData = [
  { belgeNo: 'CK-2026-0147', tur: 'Cek', tutar: 185000, vade: '25.04.2026', taraf: 'Anadolu Demir Celik', durum: 'Beklemede' },
  { belgeNo: 'SN-2026-0089', tur: 'Senet', tutar: 92000, vade: '15.05.2026', taraf: 'Yildiz Hirdavat', durum: 'Beklemede' },
  { belgeNo: 'CK-2026-0132', tur: 'Cek', tutar: 310000, vade: '01.03.2026', taraf: 'Karadeniz Metal', durum: 'Tahsil Edildi' },
  { belgeNo: 'CK-2026-0118', tur: 'Cek', tutar: 75000, vade: '20.02.2026', taraf: 'Ozkan Insaat', durum: 'Protestolu' },
  { belgeNo: 'SN-2026-0076', tur: 'Senet', tutar: 145000, vade: '10.04.2026', taraf: 'Dogan Endustriyel', durum: 'Ciro Edildi' },
];

function MiniChart({ color }) {
  const points = [18, 25, 20, 32, 28, 35, 30, 38];
  const w = 120, h = 36;
  const maxV = Math.max(...points);
  const minV = Math.min(...points);
  const range = maxV - minV || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - minV) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const line = coords.join(' ');
  const areaPath = `M0,${h} L${coords.map(c => c).join(' L')} L${w},${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`g4-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#g4-${color.replace('#','')})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getDurumBadge(durum) {
  const map = {
    'Beklemede': 'amber',
    'Tahsil Edildi': 'green',
    'Protestolu': 'red',
    'Ciro Edildi': 'blue',
  };
  return map[durum] || 'stone';
}

export default function Tema4Sage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tumu');
  const [modalCari, setModalCari] = useState('');
  const [modalTutar, setModalTutar] = useState('50000');
  const [modalTur, setModalTur] = useState('Cek');

  // Vade hesaplayici state
  const [vadeTutar, setVadeTutar] = useState('100000');
  const [vadeFaiz, setVadeFaiz] = useState('2.5');
  const [vadeGun, setVadeGun] = useState('90');

  const hesaplaVade = () => {
    const t = parseFloat(vadeTutar) || 0;
    const f = parseFloat(vadeFaiz) || 0;
    const g = parseInt(vadeGun) || 0;
    const faizTutar = t * (f / 100) * (g / 30);
    const toplam = t + faizTutar;
    return { faizTutar, toplam };
  };

  const vadeResult = hesaplaVade();

  // ESC to close modal
  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    if (modalOpen) {
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [modalOpen]);

  return (
    <>
      <style>{CSS}</style>
      <div className="tema4-wrap">
        {/* HEADER */}
        <div className="tema4-header">
          <div className="container-fluid px-4">
            <h1><span>Sage Garden</span> Tema</h1>
            <p>Finans Kalesi - Tema Demo</p>
          </div>
        </div>

        <div className="container-fluid px-4">

          {/* ── 1. DASHBOARD KPI ── */}
          <div className="tema4-section-title">
            <i className="bi bi-grid-1x2-fill" />
            Dashboard
          </div>
          <div className="row g-3">
            {kpiData.map((kpi, i) => (
              <div className="col-lg-3 col-md-6" key={i}>
                <div className="tema4-kpi-card">
                  <div className="tema4-kpi-deco">
                    <i className={`bi ${kpi.icon}`} />
                  </div>
                  <div className="tema4-kpi-label">{kpi.label}</div>
                  <div className="tema4-kpi-value">{fmt(kpi.value)}</div>
                  <div className="tema4-kpi-chart">
                    <MiniChart color={kpi.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── 2. CARi HESAPLAR ── */}
          <div className="tema4-section-title">
            <i className="bi bi-people-fill" />
            Cari Hesaplar
          </div>
          <div className="tema4-card">
            <div className="tema4-search-wrap">
              <i className="bi bi-search" />
              <input type="text" placeholder="Cari hesap ara..." />
            </div>
            <div className="table-responsive">
              <table className="tema4-table">
                <thead>
                  <tr>
                    <th>Cari Adi</th>
                    <th>Tip</th>
                    <th style={{ textAlign: 'right' }}>Bakiye</th>
                    <th>Son Islem</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {cariData.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{c.ad}</td>
                      <td>
                        <span className={`tema4-badge ${c.tip === 'Alici' ? 'emerald' : 'teal'}`}>
                          {c.tip}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`tema4-money ${c.bakiye >= 0 ? 'green' : 'red'}`}>
                          {fmtD(Math.abs(c.bakiye))}
                        </span>
                      </td>
                      <td style={{ color: '#525252', fontSize: 13 }}>{c.sonIslem}</td>
                      <td>
                        <span className={`tema4-badge ${c.durum === 'Aktif' ? 'green' : 'stone'}`}>
                          {c.durum}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tema4-pagination">
              <button><i className="bi bi-chevron-left" /></button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button><i className="bi bi-chevron-right" /></button>
            </div>
          </div>

          {/* ── 3. KASA ── */}
          <div className="tema4-section-title">
            <i className="bi bi-safe-fill" />
            Kasa
          </div>
          <div className="tema4-card">
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="tema4-kasa-summary giris">
                  <div className="label"><i className="bi bi-arrow-down-circle me-1" /> Toplam Giris</div>
                  <div className="value">{fmt(268000)}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="tema4-kasa-summary cikis">
                  <div className="label"><i className="bi bi-arrow-up-circle me-1" /> Toplam Cikis</div>
                  <div className="value">{fmt(70500)}</div>
                </div>
              </div>
            </div>
            {kasaTxData.map((tx, i) => (
              <div className="tema4-tx-row" key={i}>
                <div className={`tema4-tx-icon ${tx.tip}`}>
                  <i className={`bi ${tx.tip === 'giris' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`} />
                </div>
                <div className="tema4-tx-desc">
                  <div className="title">{tx.baslik}</div>
                  <div className="sub">{tx.aciklama}</div>
                </div>
                <div className={`tema4-tx-amount ${tx.tip === 'giris' ? 'tema4-money green' : 'tema4-money red'}`}>
                  {tx.tip === 'giris' ? '+' : '-'}{fmt(tx.tutar)}
                </div>
                <div className="tema4-tx-date">{tx.tarih}</div>
              </div>
            ))}
          </div>

          {/* ── 4. CEK / SENET ── */}
          <div className="tema4-section-title">
            <i className="bi bi-receipt-cutoff" />
            Cek / Senet
          </div>
          <div className="tema4-card">
            <div className="tema4-tabs">
              {[
                { key: 'tumu', label: 'Tumu' },
                { key: 'cek', label: 'Cekler' },
                { key: 'senet', label: 'Senetler' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`tema4-tab ${activeTab === tab.key ? 'active' : 'inactive'}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="table-responsive">
              <table className="tema4-table">
                <thead>
                  <tr>
                    <th>Belge No</th>
                    <th>Tur</th>
                    <th style={{ textAlign: 'right' }}>Tutar</th>
                    <th>Vade Tarihi</th>
                    <th>Kime/Kimden</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {cekSenetData
                    .filter(d => activeTab === 'tumu' || (activeTab === 'cek' && d.tur === 'Cek') || (activeTab === 'senet' && d.tur === 'Senet'))
                    .map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13 }}>{d.belgeNo}</td>
                      <td>
                        <span className={`tema4-badge ${d.tur === 'Cek' ? 'emerald' : 'teal'}`}>
                          {d.tur}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="tema4-money">{fmtD(d.tutar)}</span>
                      </td>
                      <td style={{ color: '#525252', fontSize: 13 }}>{d.vade}</td>
                      <td style={{ fontSize: 13 }}>{d.taraf}</td>
                      <td>
                        <span className={`tema4-badge ${getDurumBadge(d.durum)}`}>
                          {d.durum}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 5. VADE HESAPLAYICI ── */}
          <div className="tema4-section-title">
            <i className="bi bi-calculator-fill" />
            Vade Hesaplayici
          </div>
          <div className="tema4-card">
            <div className="row g-4">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="tema4-form-label">Tutar (TL)</label>
                  <input
                    type="text"
                    className="tema4-input"
                    value={vadeTutar}
                    onChange={e => setVadeTutar(e.target.value)}
                    placeholder="Tutar girin"
                  />
                </div>
                <div className="mb-3">
                  <label className="tema4-form-label">Aylik Faiz Orani (%)</label>
                  <input
                    type="text"
                    className="tema4-input"
                    value={vadeFaiz}
                    onChange={e => setVadeFaiz(e.target.value)}
                    placeholder="Faiz orani"
                  />
                </div>
                <div className="mb-3">
                  <label className="tema4-form-label">Vade (Gun)</label>
                  <input
                    type="text"
                    className="tema4-input"
                    value={vadeGun}
                    onChange={e => setVadeGun(e.target.value)}
                    placeholder="Gun sayisi"
                  />
                </div>
                <div className="mb-3">
                  <label className="tema4-form-label">Baslangic Tarihi</label>
                  <input
                    type="date"
                    className="tema4-input"
                    defaultValue="2026-03-15"
                  />
                </div>
                <button className="tema4-btn-primary" style={{ marginTop: 8 }}>
                  <i className="bi bi-calculator me-2" />
                  Hesapla
                </button>
              </div>
              <div className="col-md-6">
                <div className="tema4-result-card">
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                    Hesaplama Sonucu
                  </div>
                  <div className="tema4-result-row">
                    <span className="label">Anapara</span>
                    <span className="value">{fmtD(parseFloat(vadeTutar) || 0)}</span>
                  </div>
                  <div className="tema4-result-row">
                    <span className="label">Faiz Orani</span>
                    <span className="value">%{vadeFaiz || '0'}</span>
                  </div>
                  <div className="tema4-result-row">
                    <span className="label">Vade Suresi</span>
                    <span className="value">{vadeGun || '0'} gun</span>
                  </div>
                  <div className="tema4-result-row">
                    <span className="label">Faiz Tutari</span>
                    <span className="value" style={{ color: '#059669' }}>{fmtD(vadeResult.faizTutar)}</span>
                  </div>
                  <div className="tema4-result-row" style={{ borderBottom: 'none', marginTop: 8 }}>
                    <span className="label" style={{ fontWeight: 700, color: '#1a1a1a' }}>Toplam Tutar</span>
                    <span className="value" style={{ fontSize: 20, color: '#059669' }}>{fmtD(vadeResult.toplam)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 6. MODAL DEMO TRIGGER ── */}
          <div className="tema4-section-title">
            <i className="bi bi-window-stack" />
            Modal Demo
          </div>
          <div className="tema4-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ color: '#525252', fontSize: 14, marginBottom: 20 }}>
              Modal bilesenini test etmek icin asagidaki butona tiklayin
            </p>
            <button className="tema4-btn-primary" onClick={() => setModalOpen(true)}>
              <i className="bi bi-plus-lg me-2" />
              Yeni Kayit Ekle
            </button>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button className="tema4-btn-secondary">
                <i className="bi bi-pencil me-1" /> Duzenle
              </button>
              <button className="tema4-btn-outline">
                <i className="bi bi-download me-1" /> Disa Aktar
              </button>
            </div>
          </div>

        </div>

        {/* ── MODAL ── */}
        {modalOpen && (
          <div className="tema4-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { /* backdrop click disabled */ } }}>
            <div className="tema4-modal-box">
              <div className="tema4-modal-header">
                <div className="tema4-modal-icon">
                  <i className="bi bi-plus-lg" />
                </div>
                <div className="tema4-modal-title-wrap">
                  <div className="tema4-modal-title">Yeni Cek/Senet Kaydi</div>
                  <div className="tema4-modal-subtitle">Belge bilgilerini doldurun</div>
                </div>
                <button className="tema4-modal-close" onClick={() => setModalOpen(false)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              <div className="tema4-modal-body">
                {/* Section 1 */}
                <div className="tema4-modal-divider">
                  <div className="bar green" />
                  <div className="text">Temel Bilgiler</div>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="tema4-form-label">Cari Hesap</label>
                    <select className="tema4-select" value={modalCari} onChange={e => setModalCari(e.target.value)}>
                      <option value="">Seciniz...</option>
                      <option>Anadolu Demir Celik A.S.</option>
                      <option>Yildiz Hirdavat Ltd. Sti.</option>
                      <option>Karadeniz Metal San. Tic.</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="tema4-form-label">Belge Turu</label>
                    <select className="tema4-select" value={modalTur} onChange={e => setModalTur(e.target.value)}>
                      <option>Cek</option>
                      <option>Senet</option>
                    </select>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="tema4-modal-divider">
                  <div className="bar blue" />
                  <div className="text">Islem Detaylari</div>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="tema4-form-label">Tutar (TL)</label>
                    <input
                      type="text"
                      className="tema4-input"
                      value={modalTutar}
                      onChange={e => setModalTutar(e.target.value)}
                      placeholder="Tutar girin"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="tema4-form-label">Vade Tarihi</label>
                    <input type="date" className="tema4-input" defaultValue="2026-06-15" />
                  </div>
                </div>

                {/* Live Preview */}
                <div className="tema4-modal-preview">
                  <div className="preview-title">Canli Onizleme</div>
                  <div className="preview-row">
                    <span className="label">Cari Hesap</span>
                    <span className="value">{modalCari || '\u2014'}</span>
                  </div>
                  <div className="preview-row">
                    <span className="label">Belge Turu</span>
                    <span className="value">{modalTur}</span>
                  </div>
                  <div className="preview-row">
                    <span className="label">Tutar</span>
                    <span className="value">{fmtD(parseFloat(modalTutar) || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="tema4-modal-footer">
                <button className="tema4-btn-primary" onClick={() => setModalOpen(false)}>
                  <i className="bi bi-check-lg me-2" />
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
