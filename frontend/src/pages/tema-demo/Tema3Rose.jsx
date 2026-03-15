import React, { useState } from 'react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');

.tema3-wrap {
  min-height: 100vh;
  background: #fff1f2;
  font-family: 'Outfit', sans-serif;
  color: #1c1917;
  padding-bottom: 60px;
}

.tema3-wrap * { box-sizing: border-box; }

/* ── HEADER ── */
.tema3-header {
  background: #ffffff;
  border-bottom: 1px solid rgba(225,29,72,0.08);
  padding: 20px 0;
  margin-bottom: 32px;
}
.tema3-header h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #1c1917;
  margin: 0;
}
.tema3-header h1 span {
  background: linear-gradient(135deg, #e11d48, #9f1239);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.tema3-header p {
  color: #a8a29e;
  font-size: 13px;
  margin: 4px 0 0;
}

/* ── SECTION TITLES ── */
.tema3-section-title {
  font-family: 'Outfit', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #1c1917;
  margin: 40px 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.tema3-section-title i {
  color: #e11d48;
  font-size: 20px;
}

/* ── KPI CARDS ── */
.tema3-kpi-card {
  background: #ffffff;
  border: 1px solid rgba(225,29,72,0.08);
  border-radius: 16px;
  padding: 22px 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease;
  height: 100%;
  container-type: inline-size;
}
.tema3-kpi-card:hover {
  border-color: rgba(225,29,72,0.18);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(225,29,72,0.08);
}
.tema3-kpi-deco {
  position: absolute;
  top: 12px;
  right: 14px;
  font-size: 48px;
  opacity: 0.06;
  color: #e11d48;
}
.tema3-kpi-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #a8a29e;
  margin-bottom: 6px;
}
.tema3-kpi-value {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: clamp(20px, 5cqi, 28px);
  color: #1c1917;
  margin-bottom: 8px;
}
.tema3-kpi-chart {
  margin-top: 8px;
}

/* ── TABLE CARD ── */
.tema3-card {
  background: #ffffff;
  border: 1px solid rgba(225,29,72,0.08);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

/* ── SEARCH INPUT ── */
.tema3-search-wrap {
  position: relative;
  max-width: 320px;
  margin-bottom: 16px;
}
.tema3-search-wrap i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a8a29e;
  font-size: 15px;
}
.tema3-search-wrap input {
  width: 100%;
  padding: 10px 14px 10px 40px;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  background: #fafaf9;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #1c1917;
  outline: none;
  transition: all 0.2s;
  min-height: 44px;
}
.tema3-search-wrap input::placeholder {
  color: #d6d3d1;
}
.tema3-search-wrap input:focus {
  border-color: #e11d48;
  box-shadow: 0 0 0 3px rgba(225,29,72,0.08);
}

/* ── TABLE ── */
.tema3-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.tema3-table thead th {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #a8a29e;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f4;
  white-space: nowrap;
}
.tema3-table tbody td {
  padding: 14px 16px;
  font-size: 14px;
  color: #1c1917;
  border-bottom: 1px solid #f5f5f4;
  vertical-align: middle;
}
.tema3-table tbody tr:last-child td {
  border-bottom: none;
}
.tema3-table tbody tr:hover {
  background: rgba(225,29,72,0.02);
}
.tema3-money {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
}
.tema3-money.green { color: #10b981; }
.tema3-money.red { color: #ef4444; }

/* ── BADGES ── */
.tema3-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.tema3-badge.rose {
  background: rgba(225,29,72,0.08);
  color: #e11d48;
}
.tema3-badge.teal {
  background: rgba(8,145,178,0.08);
  color: #0891b2;
}
.tema3-badge.green {
  background: rgba(16,185,129,0.08);
  color: #059669;
}
.tema3-badge.red {
  background: rgba(239,68,68,0.08);
  color: #dc2626;
}
.tema3-badge.amber {
  background: rgba(245,158,11,0.08);
  color: #d97706;
}
.tema3-badge.blue {
  background: rgba(59,130,246,0.08);
  color: #2563eb;
}
.tema3-badge.stone {
  background: rgba(168,162,158,0.08);
  color: #78716c;
}

/* ── PAGINATION ── */
.tema3-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 16px;
}
.tema3-pagination button {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  background: #ffffff;
  color: #57534e;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Outfit', sans-serif;
}
.tema3-pagination button:hover {
  border-color: rgba(225,29,72,0.3);
  color: #e11d48;
}
.tema3-pagination button.active {
  background: #e11d48;
  border-color: #e11d48;
  color: #fff;
}

/* ── KASA ── */
.tema3-kasa-summary {
  border-radius: 14px;
  padding: 20px 24px;
  height: 100%;
}
.tema3-kasa-summary.giris {
  background: rgba(16,185,129,0.06);
  border: 1px solid rgba(16,185,129,0.12);
}
.tema3-kasa-summary.cikis {
  background: rgba(239,68,68,0.06);
  border: 1px solid rgba(239,68,68,0.12);
}
.tema3-kasa-summary .label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tema3-kasa-summary.giris .label { color: #059669; }
.tema3-kasa-summary.cikis .label { color: #dc2626; }
.tema3-kasa-summary .value {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: 24px;
  margin-top: 6px;
}
.tema3-kasa-summary.giris .value { color: #10b981; }
.tema3-kasa-summary.cikis .value { color: #ef4444; }

.tema3-tx-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f4;
}
.tema3-tx-row:last-child { border-bottom: none; }
.tema3-tx-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.tema3-tx-icon.giris {
  background: rgba(16,185,129,0.08);
  color: #10b981;
}
.tema3-tx-icon.cikis {
  background: rgba(239,68,68,0.08);
  color: #ef4444;
}
.tema3-tx-desc {
  flex: 1;
  min-width: 0;
}
.tema3-tx-desc .title {
  font-size: 14px;
  font-weight: 600;
  color: #1c1917;
}
.tema3-tx-desc .sub {
  font-size: 12px;
  color: #a8a29e;
  margin-top: 2px;
}
.tema3-tx-amount {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 15px;
  text-align: right;
  white-space: nowrap;
}
.tema3-tx-date {
  font-size: 12px;
  color: #a8a29e;
  text-align: right;
  min-width: 80px;
}

/* ── TABS ── */
.tema3-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.tema3-tab {
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
.tema3-tab.active {
  background: #e11d48;
  color: #fff;
  font-weight: 700;
}
.tema3-tab.inactive {
  background: transparent;
  color: #78716c;
}
.tema3-tab.inactive:hover {
  background: rgba(225,29,72,0.05);
  color: #e11d48;
}

/* ── FORM ── */
.tema3-form-label {
  font-size: 13px;
  font-weight: 600;
  color: #44403c;
  margin-bottom: 6px;
  display: block;
}
.tema3-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  background: #fafaf9;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #1c1917;
  outline: none;
  transition: all 0.2s;
  min-height: 44px;
}
.tema3-input::placeholder { color: #d6d3d1; }
.tema3-input:focus {
  border-color: #e11d48;
  box-shadow: 0 0 0 3px rgba(225,29,72,0.08);
}
.tema3-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  background: #fafaf9;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: #1c1917;
  outline: none;
  transition: all 0.2s;
  min-height: 44px;
  cursor: pointer;
}
.tema3-select:focus {
  border-color: #e11d48;
  box-shadow: 0 0 0 3px rgba(225,29,72,0.08);
}

/* ── BUTTONS ── */
.tema3-btn-primary {
  background: linear-gradient(135deg, #e11d48, #9f1239);
  color: #fff;
  font-weight: 700;
  border: none;
  border-radius: 50px;
  padding: 12px 28px;
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(225,29,72,0.3);
  transition: all 0.25s;
  min-height: 44px;
}
.tema3-btn-primary:hover {
  box-shadow: 0 6px 20px rgba(225,29,72,0.4);
  transform: translateY(-1px);
}
.tema3-btn-secondary {
  background: rgba(225,29,72,0.05);
  border: 1px solid rgba(225,29,72,0.12);
  color: #9f1239;
  border-radius: 10px;
  padding: 10px 20px;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}
.tema3-btn-secondary:hover {
  background: rgba(225,29,72,0.1);
}
.tema3-btn-outline {
  background: transparent;
  border: 1px solid rgba(225,29,72,0.4);
  color: #e11d48;
  border-radius: 10px;
  padding: 10px 20px;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}
.tema3-btn-outline:hover {
  background: rgba(225,29,72,0.05);
}

/* ── VADE RESULT CARD ── */
.tema3-result-card {
  background: rgba(225,29,72,0.03);
  border: 1px solid rgba(225,29,72,0.1);
  border-radius: 14px;
  padding: 24px;
  height: 100%;
}
.tema3-result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(225,29,72,0.06);
}
.tema3-result-row:last-child { border-bottom: none; }
.tema3-result-row .label {
  font-size: 13px;
  color: #57534e;
}
.tema3-result-row .value {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: #1c1917;
}

/* ── MODAL ── */
.tema3-modal-overlay {
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
.tema3-modal-box {
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
.tema3-modal-header {
  background: linear-gradient(135deg, rgba(225,29,72,0.12), rgba(159,18,57,0.06));
  border-bottom: 2px solid rgba(225,29,72,0.4);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.tema3-modal-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e11d48, #9f1239);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(225,29,72,0.3);
  flex-shrink: 0;
}
.tema3-modal-title-wrap {
  flex: 1;
}
.tema3-modal-title {
  font-size: 17px;
  font-weight: 800;
  color: #1c1917;
  margin: 0;
}
.tema3-modal-subtitle {
  font-size: 11px;
  color: #a8a29e;
  margin: 2px 0 0;
}
.tema3-modal-close {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(225,29,72,0.12);
  background: #fff;
  color: #57534e;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  flex-shrink: 0;
}
.tema3-modal-close:hover {
  background: rgba(225,29,72,0.05);
  color: #e11d48;
}
.tema3-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
.tema3-modal-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0 16px;
}
.tema3-modal-divider:first-child {
  margin-top: 0;
}
.tema3-modal-divider .bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
}
.tema3-modal-divider .bar.rose { background: #e11d48; }
.tema3-modal-divider .bar.blue { background: #0891b2; }
.tema3-modal-divider .text {
  font-size: 13px;
  font-weight: 700;
  color: #1c1917;
}
.tema3-modal-preview {
  background: rgba(225,29,72,0.03);
  border: 1px solid rgba(225,29,72,0.08);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}
.tema3-modal-preview .preview-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #a8a29e;
  margin-bottom: 10px;
}
.tema3-modal-preview .preview-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}
.tema3-modal-preview .preview-row .label { color: #57534e; }
.tema3-modal-preview .preview-row .value {
  font-weight: 600;
  color: #1c1917;
  font-family: 'Inter', sans-serif;
}
.tema3-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f5f5f4;
  background: #ffffff;
}
.tema3-modal-footer .tema3-btn-primary {
  width: 100%;
  border-radius: 50px;
  padding: 14px;
  font-size: 15px;
}
`;

const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const fmtD = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

const kpiData = [
  { label: 'Toplam Bakiye', value: 2450000, icon: 'bi-wallet2', color: '#e11d48' },
  { label: 'Alacak', value: 1820000, icon: 'bi-arrow-down-left', color: '#10b981' },
  { label: 'Borç', value: 630000, icon: 'bi-arrow-up-right', color: '#ef4444' },
  { label: 'Kasa', value: 485000, icon: 'bi-safe', color: '#0891b2' },
];

const cariData = [
  { ad: 'Anadolu Demir Çelik A.Ş.', tip: 'Alıcı', bakiye: 425000, sonIslem: '12.03.2026', durum: 'Aktif' },
  { ad: 'Yıldız Hırdavat Ltd. Şti.', tip: 'Satıcı', bakiye: -185000, sonIslem: '11.03.2026', durum: 'Aktif' },
  { ad: 'Karadeniz Metal San. Tic.', tip: 'Alıcı', bakiye: 312000, sonIslem: '10.03.2026', durum: 'Aktif' },
  { ad: 'Özkan İnşaat Malzemeleri', tip: 'Alıcı', bakiye: -92000, sonIslem: '08.03.2026', durum: 'Pasif' },
  { ad: 'Doğan Endüstriyel Ürünler', tip: 'Satıcı', bakiye: 178000, sonIslem: '07.03.2026', durum: 'Aktif' },
];

const kasaTxData = [
  { tip: 'giris', baslik: 'Anadolu Demir Çelik', aciklama: 'Fatura tahsilatı', tutar: 85000, tarih: '14.03.2026' },
  { tip: 'cikis', baslik: 'Yıldız Hırdavat', aciklama: 'Mal alım ödemesi', tutar: 42000, tarih: '13.03.2026' },
  { tip: 'giris', baslik: 'Karadeniz Metal', aciklama: 'Çek tahsilatı', tutar: 120000, tarih: '12.03.2026' },
  { tip: 'cikis', baslik: 'SGK Ödemesi', aciklama: 'Mart 2026 prim', tutar: 28500, tarih: '11.03.2026' },
  { tip: 'giris', baslik: 'Doğan Endüstriyel', aciklama: 'Nakit satış', tutar: 63000, tarih: '10.03.2026' },
];

const cekSenetData = [
  { belgeNo: 'ÇK-2026-0147', tur: 'Çek', tutar: 185000, vade: '25.04.2026', taraf: 'Anadolu Demir Çelik', durum: 'Beklemede' },
  { belgeNo: 'SN-2026-0089', tur: 'Senet', tutar: 92000, vade: '15.05.2026', taraf: 'Yıldız Hırdavat', durum: 'Beklemede' },
  { belgeNo: 'ÇK-2026-0132', tur: 'Çek', tutar: 310000, vade: '01.03.2026', taraf: 'Karadeniz Metal', durum: 'Tahsil Edildi' },
  { belgeNo: 'ÇK-2026-0118', tur: 'Çek', tutar: 75000, vade: '20.02.2026', taraf: 'Özkan İnşaat', durum: 'Protestolu' },
  { belgeNo: 'SN-2026-0076', tur: 'Senet', tutar: 145000, vade: '10.04.2026', taraf: 'Doğan Endüstriyel', durum: 'Ciro Edildi' },
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
        <linearGradient id={`g-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#g-${color.replace('#','')})`} />
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

export default function Tema3Rose() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tumu');
  const [modalCari, setModalCari] = useState('');
  const [modalTutar, setModalTutar] = useState('50000');
  const [modalTur, setModalTur] = useState('Çek');

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
      <div className="tema3-wrap">
        {/* HEADER */}
        <div className="tema3-header">
          <div className="container-fluid px-4">
            <h1><span>Rose Quartz</span> Tema</h1>
            <p>Finans Kalesi - Tema Demo</p>
          </div>
        </div>

        <div className="container-fluid px-4">

          {/* ── 1. DASHBOARD KPI ── */}
          <div className="tema3-section-title">
            <i className="bi bi-grid-1x2-fill" />
            Dashboard
          </div>
          <div className="row g-3">
            {kpiData.map((kpi, i) => (
              <div className="col-lg-3 col-md-6" key={i}>
                <div className="tema3-kpi-card">
                  <div className="tema3-kpi-deco">
                    <i className={`bi ${kpi.icon}`} />
                  </div>
                  <div className="tema3-kpi-label">{kpi.label}</div>
                  <div className="tema3-kpi-value">{fmt(kpi.value)}</div>
                  <div className="tema3-kpi-chart">
                    <MiniChart color={kpi.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── 2. CARİ HESAPLAR ── */}
          <div className="tema3-section-title">
            <i className="bi bi-people-fill" />
            Cari Hesaplar
          </div>
          <div className="tema3-card">
            <div className="tema3-search-wrap">
              <i className="bi bi-search" />
              <input type="text" placeholder="Cari hesap ara..." />
            </div>
            <div className="table-responsive">
              <table className="tema3-table">
                <thead>
                  <tr>
                    <th>Cari Adı</th>
                    <th>Tip</th>
                    <th style={{ textAlign: 'right' }}>Bakiye</th>
                    <th>Son İşlem</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {cariData.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{c.ad}</td>
                      <td>
                        <span className={`tema3-badge ${c.tip === 'Alıcı' ? 'rose' : 'teal'}`}>
                          {c.tip}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`tema3-money ${c.bakiye >= 0 ? 'green' : 'red'}`}>
                          {fmtD(Math.abs(c.bakiye))}
                        </span>
                      </td>
                      <td style={{ color: '#57534e', fontSize: 13 }}>{c.sonIslem}</td>
                      <td>
                        <span className={`tema3-badge ${c.durum === 'Aktif' ? 'green' : 'stone'}`}>
                          {c.durum}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tema3-pagination">
              <button><i className="bi bi-chevron-left" /></button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button><i className="bi bi-chevron-right" /></button>
            </div>
          </div>

          {/* ── 3. KASA ── */}
          <div className="tema3-section-title">
            <i className="bi bi-safe-fill" />
            Kasa
          </div>
          <div className="tema3-card">
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="tema3-kasa-summary giris">
                  <div className="label"><i className="bi bi-arrow-down-circle me-1" /> Toplam Giriş</div>
                  <div className="value">{fmt(268000)}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="tema3-kasa-summary cikis">
                  <div className="label"><i className="bi bi-arrow-up-circle me-1" /> Toplam Çıkış</div>
                  <div className="value">{fmt(70500)}</div>
                </div>
              </div>
            </div>
            {kasaTxData.map((tx, i) => (
              <div className="tema3-tx-row" key={i}>
                <div className={`tema3-tx-icon ${tx.tip}`}>
                  <i className={`bi ${tx.tip === 'giris' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`} />
                </div>
                <div className="tema3-tx-desc">
                  <div className="title">{tx.baslik}</div>
                  <div className="sub">{tx.aciklama}</div>
                </div>
                <div className={`tema3-tx-amount ${tx.tip === 'giris' ? 'tema3-money green' : 'tema3-money red'}`}>
                  {tx.tip === 'giris' ? '+' : '-'}{fmt(tx.tutar)}
                </div>
                <div className="tema3-tx-date">{tx.tarih}</div>
              </div>
            ))}
          </div>

          {/* ── 4. ÇEK / SENET ── */}
          <div className="tema3-section-title">
            <i className="bi bi-receipt-cutoff" />
            Çek / Senet
          </div>
          <div className="tema3-card">
            <div className="tema3-tabs">
              {[
                { key: 'tumu', label: 'Tümü' },
                { key: 'cek', label: 'Çekler' },
                { key: 'senet', label: 'Senetler' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`tema3-tab ${activeTab === tab.key ? 'active' : 'inactive'}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="table-responsive">
              <table className="tema3-table">
                <thead>
                  <tr>
                    <th>Belge No</th>
                    <th>Tür</th>
                    <th style={{ textAlign: 'right' }}>Tutar</th>
                    <th>Vade Tarihi</th>
                    <th>Kime/Kimden</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {cekSenetData
                    .filter(d => activeTab === 'tumu' || (activeTab === 'cek' && d.tur === 'Çek') || (activeTab === 'senet' && d.tur === 'Senet'))
                    .map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13 }}>{d.belgeNo}</td>
                      <td>
                        <span className={`tema3-badge ${d.tur === 'Çek' ? 'rose' : 'teal'}`}>
                          {d.tur}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="tema3-money">{fmtD(d.tutar)}</span>
                      </td>
                      <td style={{ color: '#57534e', fontSize: 13 }}>{d.vade}</td>
                      <td style={{ fontSize: 13 }}>{d.taraf}</td>
                      <td>
                        <span className={`tema3-badge ${getDurumBadge(d.durum)}`}>
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
          <div className="tema3-section-title">
            <i className="bi bi-calculator-fill" />
            Vade Hesaplayıcı
          </div>
          <div className="tema3-card">
            <div className="row g-4">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="tema3-form-label">Tutar (₺)</label>
                  <input
                    type="text"
                    className="tema3-input"
                    value={vadeTutar}
                    onChange={e => setVadeTutar(e.target.value)}
                    placeholder="Tutar girin"
                  />
                </div>
                <div className="mb-3">
                  <label className="tema3-form-label">Aylık Faiz Oranı (%)</label>
                  <input
                    type="text"
                    className="tema3-input"
                    value={vadeFaiz}
                    onChange={e => setVadeFaiz(e.target.value)}
                    placeholder="Faiz oranı"
                  />
                </div>
                <div className="mb-3">
                  <label className="tema3-form-label">Vade (Gün)</label>
                  <input
                    type="text"
                    className="tema3-input"
                    value={vadeGun}
                    onChange={e => setVadeGun(e.target.value)}
                    placeholder="Gün sayısı"
                  />
                </div>
                <div className="mb-3">
                  <label className="tema3-form-label">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    className="tema3-input"
                    defaultValue="2026-03-15"
                  />
                </div>
                <button className="tema3-btn-primary" style={{ marginTop: 8 }}>
                  <i className="bi bi-calculator me-2" />
                  Hesapla
                </button>
              </div>
              <div className="col-md-6">
                <div className="tema3-result-card">
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                    Hesaplama Sonucu
                  </div>
                  <div className="tema3-result-row">
                    <span className="label">Anapara</span>
                    <span className="value">{fmtD(parseFloat(vadeTutar) || 0)}</span>
                  </div>
                  <div className="tema3-result-row">
                    <span className="label">Faiz Oranı</span>
                    <span className="value">%{vadeFaiz || '0'}</span>
                  </div>
                  <div className="tema3-result-row">
                    <span className="label">Vade Süresi</span>
                    <span className="value">{vadeGun || '0'} gün</span>
                  </div>
                  <div className="tema3-result-row">
                    <span className="label">Faiz Tutarı</span>
                    <span className="value" style={{ color: '#e11d48' }}>{fmtD(vadeResult.faizTutar)}</span>
                  </div>
                  <div className="tema3-result-row" style={{ borderBottom: 'none', marginTop: 8 }}>
                    <span className="label" style={{ fontWeight: 700, color: '#1c1917' }}>Toplam Tutar</span>
                    <span className="value" style={{ fontSize: 20, color: '#e11d48' }}>{fmtD(vadeResult.toplam)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 6. MODAL DEMO TRIGGER ── */}
          <div className="tema3-section-title">
            <i className="bi bi-window-stack" />
            Modal Demo
          </div>
          <div className="tema3-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ color: '#57534e', fontSize: 14, marginBottom: 20 }}>
              Modal bileşenini test etmek için aşağıdaki butona tıklayın
            </p>
            <button className="tema3-btn-primary" onClick={() => setModalOpen(true)}>
              <i className="bi bi-plus-lg me-2" />
              Yeni Kayıt Ekle
            </button>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button className="tema3-btn-secondary">
                <i className="bi bi-pencil me-1" /> Düzenle
              </button>
              <button className="tema3-btn-outline">
                <i className="bi bi-download me-1" /> Dışa Aktar
              </button>
            </div>
          </div>

        </div>

        {/* ── MODAL ── */}
        {modalOpen && (
          <div className="tema3-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { /* backdrop click disabled */ } }}>
            <div className="tema3-modal-box">
              <div className="tema3-modal-header">
                <div className="tema3-modal-icon">
                  <i className="bi bi-plus-lg" />
                </div>
                <div className="tema3-modal-title-wrap">
                  <div className="tema3-modal-title">Yeni Çek/Senet Kaydı</div>
                  <div className="tema3-modal-subtitle">Belge bilgilerini doldurun</div>
                </div>
                <button className="tema3-modal-close" onClick={() => setModalOpen(false)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              <div className="tema3-modal-body">
                {/* Section 1 */}
                <div className="tema3-modal-divider">
                  <div className="bar rose" />
                  <div className="text">Temel Bilgiler</div>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="tema3-form-label">Cari Hesap</label>
                    <select className="tema3-select" value={modalCari} onChange={e => setModalCari(e.target.value)}>
                      <option value="">Seçiniz...</option>
                      <option>Anadolu Demir Çelik A.Ş.</option>
                      <option>Yıldız Hırdavat Ltd. Şti.</option>
                      <option>Karadeniz Metal San. Tic.</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="tema3-form-label">Belge Türü</label>
                    <select className="tema3-select" value={modalTur} onChange={e => setModalTur(e.target.value)}>
                      <option>Çek</option>
                      <option>Senet</option>
                    </select>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="tema3-modal-divider">
                  <div className="bar blue" />
                  <div className="text">İşlem Detayları</div>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="tema3-form-label">Tutar (₺)</label>
                    <input
                      type="text"
                      className="tema3-input"
                      value={modalTutar}
                      onChange={e => setModalTutar(e.target.value)}
                      placeholder="Tutar girin"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="tema3-form-label">Vade Tarihi</label>
                    <input type="date" className="tema3-input" defaultValue="2026-06-15" />
                  </div>
                </div>

                {/* Live Preview */}
                <div className="tema3-modal-preview">
                  <div className="preview-title">Canlı Önizleme</div>
                  <div className="preview-row">
                    <span className="label">Cari Hesap</span>
                    <span className="value">{modalCari || '—'}</span>
                  </div>
                  <div className="preview-row">
                    <span className="label">Belge Türü</span>
                    <span className="value">{modalTur}</span>
                  </div>
                  <div className="preview-row">
                    <span className="label">Tutar</span>
                    <span className="value">{fmtD(parseFloat(modalTutar) || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="tema3-modal-footer">
                <button className="tema3-btn-primary" onClick={() => setModalOpen(false)}>
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
