/**
 * Finans Kalesi V3 — Palet 3: Elektrik Murekkep
 *
 * Linear.app / Vercel.com ilhamli dark fintech tasarimi.
 * Koyu tema, neon glow efektler, dikey timeline layout.
 * Tablo YOK — git log tarzi timeline kartlari.
 * Auth gerektirmez.
 */

import { useState, useEffect, useRef } from 'react'

// --- Para format yardimcisi ---
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

// --- Tarih format ---
const tarihFormat = (d) =>
  new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })

const tarihGun = (d) =>
  new Date(d).toLocaleDateString('tr-TR', { weekday: 'short' })

// --- Mock veri ---
const HAREKETLER = [
  { id: 1, tarih: '2026-03-15', aciklama: 'Kocaeli Demir-\u00C7elik A.\u015E. \u2014 Fatura #2741', tur: 'giris', tutar: 94200, kategori: 'Sat\u0131\u015F', cari: 'Kocaeli Demir-\u00C7elik' },
  { id: 2, tarih: '2026-03-14', aciklama: 'Personel Maa\u015F \u00D6demeleri \u2014 Mart 2026', tur: 'cikis', tutar: 138500, kategori: 'Maa\u015F', cari: 'Personel' },
  { id: 3, tarih: '2026-03-14', aciklama: 'Bo\u011Fazi\u00E7i H\u0131rdavat \u2014 Fatura #1089', tur: 'giris', tutar: 27600, kategori: 'Sat\u0131\u015F', cari: 'Bo\u011Fazi\u00E7i H\u0131rdavat' },
  { id: 4, tarih: '2026-03-13', aciklama: 'Do\u011Falgaz Faturas\u0131 \u2014 \u015Eubat 2026', tur: 'cikis', tutar: 6350, kategori: 'Fatura', cari: '\u0130GDA\u015E' },
  { id: 5, tarih: '2026-03-13', aciklama: 'Anadolu \u0130n\u015Faat \u2014 Proje Avans\u0131 #7', tur: 'giris', tutar: 165000, kategori: 'Avans', cari: 'Anadolu \u0130n\u015Faat' },
  { id: 6, tarih: '2026-03-12', aciklama: 'Kira \u00D6demesi \u2014 Ana Depo + \u015Eube', tur: 'cikis', tutar: 42000, kategori: 'Kira', cari: 'Y\u0131ld\u0131z Gayrimenkul' },
  { id: 7, tarih: '2026-03-11', aciklama: 'Ege Metal Sanayi \u2014 Fatura #662', tur: 'giris', tutar: 53800, kategori: 'Sat\u0131\u015F', cari: 'Ege Metal Sanayi' },
  { id: 8, tarih: '2026-03-11', aciklama: 'Hammadde Al\u0131m\u0131 \u2014 HRP Sac 3mm', tur: 'cikis', tutar: 225000, kategori: 'Hammadde', cari: '\u0130sdemir' },
  { id: 9, tarih: '2026-03-10', aciklama: 'G\u00FCne\u015F Yap\u0131 Market \u2014 Fatura #1540', tur: 'giris', tutar: 19400, kategori: 'Sat\u0131\u015F', cari: 'G\u00FCne\u015F Yap\u0131 Market' },
  { id: 10, tarih: '2026-03-10', aciklama: 'KDV \u00D6demesi \u2014 \u015Eubat 2026', tur: 'cikis', tutar: 38700, kategori: 'Vergi', cari: 'Vergi Dairesi' },
  { id: 11, tarih: '2026-03-09', aciklama: 'Marmara \u00C7elik \u2014 Fatura #887', tur: 'giris', tutar: 41200, kategori: 'Sat\u0131\u015F', cari: 'Marmara \u00C7elik' },
  { id: 12, tarih: '2026-03-09', aciklama: 'Sevkiyat \u00D6demesi \u2014 Nakliye #44', tur: 'cikis', tutar: 11900, kategori: 'Lojistik', cari: 'Aras Lojistik' },
]

// --- Kategori ikon eslestirme ---
const KATEGORI_IKON = {
  'Sat\u0131\u015F': 'bi-receipt',
  'Maa\u015F': 'bi-people',
  'Fatura': 'bi-lightning',
  'Kira': 'bi-building',
  'Avans': 'bi-cash-stack',
  'Hammadde': 'bi-box-seam',
  'Vergi': 'bi-bank',
  'Lojistik': 'bi-truck',
}

// --- Animated Number Hook ---
function useAnimatedNumber(target, duration = 900) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const prevRef = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const initial = prevRef.current
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = initial + (target - initial) * eased
      setVal(current)
      if (progress < 1) {
        ref.current = requestAnimationFrame(step)
      } else {
        prevRef.current = target
      }
    }
    ref.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(ref.current)
  }, [target, duration])

  return val
}

// --- CSS ---
const CSS_CONTENT = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.p3-root {
  --p3-primary: #6834e0;
  --p3-primary-hover: #5528b8;
  --p3-primary-light: #a78bfa;
  --p3-primary-ghost: rgba(104,52,224,0.1);
  --p3-dark: #110e1e;
  --p3-card-bg: rgba(255,255,255,0.04);
  --p3-card-border: rgba(255,255,255,0.08);
  --p3-card-hover-border: rgba(255,255,255,0.14);
  --p3-text: #ffffff;
  --p3-text-secondary: rgba(255,255,255,0.6);
  --p3-text-muted: rgba(255,255,255,0.4);
  --p3-placeholder: rgba(255,255,255,0.25);
  --p3-green: #10b981;
  --p3-red: #ef4444;
  --p3-teal: #2dd4bf;
  --p3-badge-bg: rgba(45,212,191,0.15);
  --p3-badge-border: rgba(45,212,191,0.3);
  --p3-focus-ring: rgba(104,52,224,0.4);
  --p3-input-bg: rgba(255,255,255,0.05);
  --p3-input-border: rgba(255,255,255,0.1);

  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
  background: var(--p3-dark);
  color: var(--p3-text);
  min-height: 100vh;
  position: relative;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Dot grid background */
.p3-root::before {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
  z-index: 0;
}

.p3-container {
  position: relative;
  z-index: 1;
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

/* Header */
.p3-header {
  margin-bottom: 40px;
}

.p3-header-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 6px;
}

.p3-logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--p3-primary-ghost);
  color: var(--p3-primary);
  font-size: 18px;
  filter: drop-shadow(0 0 12px rgba(104,52,224,0.4));
}

.p3-header h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.4px;
  color: var(--p3-text);
  margin: 0;
}

.p3-header-sub {
  font-size: 13px;
  color: var(--p3-text-muted);
  letter-spacing: 0.2px;
  margin-left: 50px;
}

/* KPI Band */
.p3-kpi-band {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 36px;
}

.p3-kpi {
  background: var(--p3-card-bg);
  border: 1px solid var(--p3-card-border);
  border-radius: 12px;
  padding: 20px 22px;
  transition: border-color 0.2s ease, background 0.2s ease;
  backdrop-filter: blur(8px);
}

.p3-kpi:hover {
  border-color: var(--p3-card-hover-border);
  background: rgba(255,255,255,0.06);
}

.p3-kpi-label {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--p3-text-muted);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.p3-kpi-label i {
  font-size: 13px;
}

.p3-kpi-value {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.8px;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.p3-kpi-value.p3-glow-purple {
  text-shadow: 0 0 20px rgba(104,52,224,0.5), 0 0 60px rgba(104,52,224,0.2);
  color: var(--p3-primary-light);
}

.p3-kpi-value.p3-glow-green {
  text-shadow: 0 0 20px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.15);
  color: var(--p3-green);
}

.p3-kpi-value.p3-glow-red {
  text-shadow: 0 0 20px rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.15);
  color: var(--p3-red);
}

.p3-kpi-value.p3-glow-teal {
  text-shadow: 0 0 20px rgba(45,212,191,0.5), 0 0 60px rgba(45,212,191,0.15);
  color: var(--p3-teal);
}

.p3-kpi-suffix {
  font-size: 14px;
  font-weight: 600;
  margin-left: 4px;
  opacity: 0.7;
}

.p3-kpi-delta {
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
  color: var(--p3-text-muted);
}

/* Flow Bar */
.p3-flow-bar-wrap {
  margin-bottom: 36px;
  background: var(--p3-card-bg);
  border: 1px solid var(--p3-card-border);
  border-radius: 12px;
  padding: 20px 22px;
  backdrop-filter: blur(8px);
}

.p3-flow-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.p3-flow-bar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--p3-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.p3-flow-bar-legend {
  display: flex;
  gap: 16px;
}

.p3-flow-bar-legend span {
  font-size: 12px;
  color: var(--p3-text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.p3-flow-bar-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.p3-flow-bar-legend-dot.p3-green { background: var(--p3-green); }
.p3-flow-bar-legend-dot.p3-red { background: var(--p3-red); }

.p3-flow-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255,255,255,0.06);
}

.p3-flow-bar-giris {
  background: var(--p3-green);
  border-radius: 4px 0 0 4px;
  transition: width 1s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 0 12px rgba(16,185,129,0.3);
}

.p3-flow-bar-cikis {
  background: var(--p3-red);
  border-radius: 0 4px 4px 0;
  transition: width 1s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 0 12px rgba(239,68,68,0.3);
}

.p3-flow-bar-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.p3-flow-bar-labels span {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Controls Row */
.p3-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

.p3-controls-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.p3-tab-group {
  display: flex;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--p3-card-border);
  border-radius: 8px;
  padding: 3px;
}

.p3-tab-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--p3-text-muted);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
}

.p3-tab-btn:hover {
  color: var(--p3-text-secondary);
}

.p3-tab-btn.p3-active {
  background: var(--p3-primary);
  color: #fff;
  box-shadow: 0 0 16px rgba(104,52,224,0.3);
}

.p3-search-wrap {
  position: relative;
}

.p3-search-wrap i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--p3-text-muted);
  pointer-events: none;
}

.p3-search-input {
  background: var(--p3-input-bg);
  border: 1px solid var(--p3-input-border);
  border-radius: 8px;
  padding: 10px 14px 10px 36px;
  font-size: 13px;
  color: var(--p3-text);
  font-family: inherit;
  font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
  outline: none;
  width: 240px;
  min-height: 44px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.p3-search-input::placeholder {
  color: var(--p3-placeholder);
}

.p3-search-input:focus {
  border-color: var(--p3-primary);
  box-shadow: 0 0 0 3px var(--p3-focus-ring);
}

.p3-btn-outlined {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--p3-primary-light);
  background: transparent;
  border: 1px solid var(--p3-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  font-family: inherit;
}

.p3-btn-outlined:hover {
  box-shadow: 0 0 20px rgba(104,52,224,0.4), 0 0 40px rgba(104,52,224,0.15);
  background: var(--p3-primary-ghost);
  color: #fff;
}

.p3-btn-outlined:active {
  transform: scale(0.97);
}

/* Timeline */
.p3-timeline-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--p3-text-muted);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.p3-timeline-section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--p3-card-border);
}

.p3-timeline {
  position: relative;
  padding-left: 36px;
}

.p3-timeline::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    var(--p3-primary) 0%,
    rgba(104,52,224,0.3) 50%,
    rgba(104,52,224,0.08) 100%
  );
  border-radius: 1px;
}

.p3-timeline-group {
  margin-bottom: 8px;
}

.p3-timeline-date {
  position: relative;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--p3-text-muted);
  margin-bottom: 12px;
  padding: 4px 0;
}

.p3-timeline-date::before {
  content: '';
  position: absolute;
  left: -36px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--p3-primary);
  border: 2px solid var(--p3-dark);
  box-shadow: 0 0 8px rgba(104,52,224,0.5);
  z-index: 2;
}

.p3-timeline-item {
  position: relative;
  background: var(--p3-card-bg);
  border: 1px solid var(--p3-card-border);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(6px);
  animation: p3ItemIn 0.3s ease backwards;
}

.p3-timeline-item:hover {
  border-color: var(--p3-card-hover-border);
  background: rgba(255,255,255,0.06);
  transform: translateX(4px);
}

.p3-timeline-item::before {
  content: '';
  position: absolute;
  left: -30px;
  top: 22px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  z-index: 2;
}

.p3-timeline-item.p3-giris::before {
  background: var(--p3-green);
  box-shadow: 0 0 6px rgba(16,185,129,0.5);
}

.p3-timeline-item.p3-cikis::before {
  background: var(--p3-red);
  box-shadow: 0 0 6px rgba(239,68,68,0.5);
}

.p3-timeline-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.p3-timeline-item-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.p3-timeline-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 16px;
  flex-shrink: 0;
}

.p3-timeline-icon.p3-giris {
  background: rgba(16,185,129,0.1);
  color: var(--p3-green);
}

.p3-timeline-icon.p3-cikis {
  background: rgba(239,68,68,0.1);
  color: var(--p3-red);
}

.p3-timeline-info {
  flex: 1;
  min-width: 0;
}

.p3-timeline-cari {
  font-size: 14px;
  font-weight: 600;
  color: var(--p3-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.p3-timeline-desc {
  font-size: 12px;
  color: var(--p3-text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.p3-timeline-item-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.p3-timeline-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--p3-badge-bg);
  color: var(--p3-teal);
  border: 1px solid var(--p3-badge-border);
  white-space: nowrap;
}

.p3-timeline-tutar {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
  min-width: 110px;
}

.p3-timeline-tutar.p3-giris {
  color: var(--p3-green);
}

.p3-timeline-tutar.p3-cikis {
  color: var(--p3-red);
}

/* Empty state */
.p3-empty {
  text-align: center;
  padding: 48px 20px;
  color: var(--p3-text-muted);
}

.p3-empty i {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.4;
}

/* Modal */
.p3-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: p3FadeIn 0.15s ease;
}

.p3-modal {
  background: #1a1528;
  border: 1px solid rgba(104,52,224,0.3);
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  box-shadow:
    0 0 30px rgba(104,52,224,0.15),
    0 24px 48px rgba(0,0,0,0.5);
  animation: p3SlideUp 0.2s ease;
  max-height: 90vh;
  overflow-y: auto;
}

.p3-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 0;
}

.p3-modal-header h2 {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--p3-text);
}

.p3-modal-close {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--p3-card-border);
  background: transparent;
  border-radius: 8px;
  color: var(--p3-text-muted);
  cursor: pointer;
  font-size: 18px;
  transition: all 0.15s ease;
  min-height: 44px;
  min-width: 44px;
}

.p3-modal-close:hover {
  border-color: var(--p3-primary);
  color: var(--p3-text);
  box-shadow: 0 0 12px rgba(104,52,224,0.3);
}

.p3-modal-body {
  padding: 22px 24px 24px;
}

.p3-form-group {
  margin-bottom: 18px;
}

.p3-form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--p3-text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.p3-form-input,
.p3-form-select {
  width: 100%;
  background: var(--p3-input-bg);
  border: 1px solid var(--p3-input-border);
  border-radius: 8px;
  padding: 11px 14px;
  font-size: 14px;
  color: var(--p3-text);
  font-family: inherit;
  font-feature-settings: "cv01" on, "cv02" on, "cv03" on, "cv04" on, "cv11" on;
  outline: none;
  min-height: 44px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.p3-form-input::placeholder {
  color: var(--p3-placeholder);
}

.p3-form-input:focus,
.p3-form-select:focus {
  border-color: var(--p3-primary);
  box-shadow: 0 0 0 3px var(--p3-focus-ring);
}

.p3-form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.4)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.p3-form-select option {
  background: #1a1528;
  color: var(--p3-text);
}

.p3-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.p3-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 8px;
}

.p3-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--p3-primary);
  border: 1px solid var(--p3-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  font-family: inherit;
}

.p3-btn-primary:hover {
  background: var(--p3-primary-hover);
  box-shadow: 0 0 20px rgba(104,52,224,0.4);
}

.p3-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 500;
  color: var(--p3-text-muted);
  background: transparent;
  border: 1px solid var(--p3-card-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 44px;
  font-family: inherit;
}

.p3-btn-ghost:hover {
  color: var(--p3-text-secondary);
  border-color: var(--p3-card-hover-border);
}

/* Delete modal */
.p3-delete-modal-body {
  text-align: center;
  padding: 32px 24px 28px;
}

.p3-delete-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(239,68,68,0.1);
  color: var(--p3-red);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 16px;
  border: 1px solid rgba(239,68,68,0.2);
}

.p3-delete-modal-body h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--p3-text);
}

.p3-delete-modal-body p {
  font-size: 13px;
  color: var(--p3-text-muted);
  margin: 0 0 24px;
  line-height: 1.5;
}

.p3-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--p3-red);
  border: 1px solid var(--p3-red);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  font-family: inherit;
}

.p3-btn-danger:hover {
  box-shadow: 0 0 20px rgba(239,68,68,0.4);
  background: #dc2626;
}

/* Count badge */
.p3-count {
  font-size: 11px;
  font-weight: 600;
  background: var(--p3-primary-ghost);
  color: var(--p3-primary-light);
  padding: 2px 7px;
  border-radius: 4px;
  margin-left: 4px;
}

/* Animations */
@keyframes p3FadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes p3SlideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes p3ItemIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Responsive */
@media (max-width: 992px) {
  .p3-kpi-band {
    grid-template-columns: repeat(2, 1fr);
  }
  .p3-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .p3-controls-left {
    flex-wrap: wrap;
  }
  .p3-search-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .p3-container {
    padding: 20px 16px 48px;
  }
  .p3-kpi-band {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .p3-kpi {
    padding: 16px;
  }
  .p3-kpi-value {
    font-size: 22px;
  }
  .p3-timeline-item-row {
    flex-wrap: wrap;
    gap: 8px;
  }
  .p3-timeline-item-right {
    width: 100%;
    justify-content: space-between;
  }
  .p3-form-row {
    grid-template-columns: 1fr;
  }
  .p3-modal {
    max-width: 100%;
    margin: 0;
    border-radius: 12px;
  }
}

@media (max-width: 480px) {
  .p3-kpi-band {
    grid-template-columns: 1fr;
  }
  .p3-kpi-value {
    font-size: 20px;
  }
  .p3-header h1 {
    font-size: 18px;
  }
  .p3-timeline {
    padding-left: 28px;
  }
  .p3-timeline::before {
    left: 7px;
  }
  .p3-timeline-date::before {
    left: -28px;
    width: 8px;
    height: 8px;
  }
  .p3-timeline-item::before {
    left: -23px;
    width: 5px;
    height: 5px;
  }
  .p3-timeline-item {
    padding: 14px 16px;
  }
  .p3-flow-bar-legend {
    display: none;
  }
}
`

export default function Palet3MurekkeDemo() {
  const [activeTab, setActiveTab] = useState('tumu')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // ESC ile modal kapat
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false)
        setShowDeleteModal(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = (showModal || showDeleteModal) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal, showDeleteModal])

  // Hesaplamalar
  const toplamGiris = HAREKETLER.filter(h => h.tur === 'giris').reduce((t, h) => t + h.tutar, 0)
  const toplamCikis = HAREKETLER.filter(h => h.tur === 'cikis').reduce((t, h) => t + h.tutar, 0)
  const netAkis = toplamGiris - toplamCikis
  const kasaBakiye = 512350

  // Animated
  const animGiris = useAnimatedNumber(toplamGiris)
  const animCikis = useAnimatedNumber(toplamCikis)
  const animNet = useAnimatedNumber(netAkis)
  const animBakiye = useAnimatedNumber(kasaBakiye)

  // Filtre
  const filteredHareketler = HAREKETLER.filter(h => {
    if (activeTab === 'giris') return h.tur === 'giris'
    if (activeTab === 'cikis') return h.tur === 'cikis'
    return true
  }).filter(h => {
    if (!searchQuery) return true
    return h.aciklama.toLowerCase().includes(searchQuery.toLowerCase()) ||
           h.cari.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Akis cubugu oranlari
  const total = toplamGiris + toplamCikis
  const girisOran = total > 0 ? (toplamGiris / total) * 100 : 50

  // Tarihe gore gruplama
  const grouped = {}
  filteredHareketler.forEach(h => {
    if (!grouped[h.tarih]) grouped[h.tarih] = []
    grouped[h.tarih].push(h)
  })
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))

  // Toplam item index for stagger animation
  let globalIdx = 0

  const openDetail = (item) => {
    setSelectedItem(item)
    setShowDeleteModal(false)
  }

  const handleDelete = (item) => {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  return (
    <div className="p3-root">
      <style>{CSS_CONTENT}</style>
      <div className="p3-container">

        {/* Header */}
        <div className="p3-header">
          <div className="p3-header-top">
            <div className="p3-logo-icon">
              <i className="bi bi-droplet-half"></i>
            </div>
            <h1>Palet 3 {'\u2014'} Elektrik M{'\u00FC'}rekkep</h1>
          </div>
          <div className="p3-header-sub">Linear / Vercel ilhaml{'\u0131'} dark fintech</div>
        </div>

        {/* KPI Band */}
        <div className="p3-kpi-band">
          <div className="p3-kpi">
            <div className="p3-kpi-label">
              <i className="bi bi-arrow-down-left"></i>
              Toplam Giri{'\u015F'}
            </div>
            <div className="p3-kpi-value p3-glow-green">
              {TL(Math.round(animGiris))}
              <span className="p3-kpi-suffix">{'\u20BA'}</span>
            </div>
            <div className="p3-kpi-delta">6 i{'\u015F'}lem {'\u2014'} Mart 2026</div>
          </div>
          <div className="p3-kpi">
            <div className="p3-kpi-label">
              <i className="bi bi-arrow-up-right"></i>
              Toplam {'\u00C7\u0131k\u0131\u015F'}
            </div>
            <div className="p3-kpi-value p3-glow-red">
              {TL(Math.round(animCikis))}
              <span className="p3-kpi-suffix">{'\u20BA'}</span>
            </div>
            <div className="p3-kpi-delta">6 i{'\u015F'}lem {'\u2014'} Mart 2026</div>
          </div>
          <div className="p3-kpi">
            <div className="p3-kpi-label">
              <i className="bi bi-activity"></i>
              Net Ak{'\u0131\u015F'}
            </div>
            <div className={'p3-kpi-value ' + (netAkis >= 0 ? 'p3-glow-teal' : 'p3-glow-red')}>
              {netAkis >= 0 ? '+' : ''}{TL(Math.round(animNet))}
              <span className="p3-kpi-suffix">{'\u20BA'}</span>
            </div>
            <div className="p3-kpi-delta">
              {netAkis >= 0 ? 'Pozitif nakit ak\u0131\u015F\u0131' : 'Negatif nakit ak\u0131\u015F\u0131'}
            </div>
          </div>
          <div className="p3-kpi">
            <div className="p3-kpi-label">
              <i className="bi bi-safe2"></i>
              Kasa Bakiye
            </div>
            <div className="p3-kpi-value p3-glow-purple">
              {TL(Math.round(animBakiye))}
              <span className="p3-kpi-suffix">{'\u20BA'}</span>
            </div>
            <div className="p3-kpi-delta">Anl{'\u0131'}k bakiye</div>
          </div>
        </div>

        {/* Flow Bar */}
        <div className="p3-flow-bar-wrap">
          <div className="p3-flow-bar-header">
            <div className="p3-flow-bar-title">Giri{'\u015F'} / {'\u00C7\u0131k\u0131\u015F'} Oran{'\u0131'}</div>
            <div className="p3-flow-bar-legend">
              <span>
                <span className="p3-flow-bar-legend-dot p3-green"></span>
                Giri{'\u015F'} {'\u2014'} %{girisOran.toFixed(1)}
              </span>
              <span>
                <span className="p3-flow-bar-legend-dot p3-red"></span>
                {'\u00C7\u0131k\u0131\u015F'} {'\u2014'} %{(100 - girisOran).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="p3-flow-bar">
            <div
              className="p3-flow-bar-giris"
              style={{ width: mounted ? girisOran + '%' : '0%' }}
            ></div>
            <div
              className="p3-flow-bar-cikis"
              style={{ width: mounted ? (100 - girisOran) + '%' : '0%' }}
            ></div>
          </div>
          <div className="p3-flow-bar-labels">
            <span style={{ color: 'var(--p3-green)' }}>{TL(toplamGiris)} {'\u20BA'}</span>
            <span style={{ color: 'var(--p3-red)' }}>{TL(toplamCikis)} {'\u20BA'}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="p3-controls">
          <div className="p3-controls-left">
            <div className="p3-tab-group">
              <button
                className={'p3-tab-btn' + (activeTab === 'tumu' ? ' p3-active' : '')}
                onClick={() => setActiveTab('tumu')}
              >
                T{'\u00FC'}m{'\u00FC'}
                <span className="p3-count">{HAREKETLER.length}</span>
              </button>
              <button
                className={'p3-tab-btn' + (activeTab === 'giris' ? ' p3-active' : '')}
                onClick={() => setActiveTab('giris')}
              >
                Giri{'\u015F'}
              </button>
              <button
                className={'p3-tab-btn' + (activeTab === 'cikis' ? ' p3-active' : '')}
                onClick={() => setActiveTab('cikis')}
              >
                {'\u00C7\u0131k\u0131\u015F'}
              </button>
            </div>
            <div className="p3-search-wrap">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="p3-search-input"
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <button className="p3-btn-outlined" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg"></i>
            Yeni Hareket
          </button>
        </div>

        {/* Timeline */}
        <div className="p3-timeline-section-title">
          <i className="bi bi-clock-history" style={{ fontSize: 13 }}></i>
          Nakit Ak{'\u0131\u015F'} Zaman {'\u00C7'}izelgesi
        </div>

        {sortedDates.length === 0 ? (
          <div className="p3-empty">
            <i className="bi bi-inbox"></i>
            <div>Sonu{'\u00E7'} bulunamad{'\u0131'}</div>
          </div>
        ) : (
          <div className="p3-timeline">
            {sortedDates.map(function(date) {
              return (
                <div key={date} className="p3-timeline-group">
                  <div className="p3-timeline-date">
                    {tarihFormat(date)} {'\u2014'} {tarihGun(date)}
                  </div>
                  {grouped[date].map(function(item) {
                    var idx = globalIdx++
                    return (
                      <div
                        key={item.id}
                        className={'p3-timeline-item ' + (item.tur === 'giris' ? 'p3-giris' : 'p3-cikis')}
                        style={{ animationDelay: (idx * 50) + 'ms' }}
                        onClick={() => openDetail(item)}
                      >
                        <div className="p3-timeline-item-row">
                          <div className="p3-timeline-item-left">
                            <div className={'p3-timeline-icon ' + (item.tur === 'giris' ? 'p3-giris' : 'p3-cikis')}>
                              <i className={'bi ' + (KATEGORI_IKON[item.kategori] || 'bi-circle')}></i>
                            </div>
                            <div className="p3-timeline-info">
                              <div className="p3-timeline-cari">{item.cari}</div>
                              <div className="p3-timeline-desc">{item.aciklama}</div>
                            </div>
                          </div>
                          <div className="p3-timeline-item-right">
                            <span className="p3-timeline-badge">{item.kategori}</span>
                            <div>
                              <div className={'p3-timeline-tutar ' + (item.tur === 'giris' ? 'p3-giris' : 'p3-cikis')}>
                                {item.tur === 'giris' ? '+' : '\u2212'}{TL(item.tutar)} {'\u20BA'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && !showDeleteModal && (
          <div className="p3-modal-overlay">
            <div className="p3-modal">
              <div className="p3-modal-header">
                <h2>
                  <i className={'bi ' + (selectedItem.tur === 'giris' ? 'bi-arrow-down-left' : 'bi-arrow-up-right')}
                     style={{ color: selectedItem.tur === 'giris' ? 'var(--p3-green)' : 'var(--p3-red)' }}
                  ></i>
                  Hareket Detay{'\u0131'}
                </h2>
                <button className="p3-modal-close" onClick={() => setSelectedItem(null)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="p3-modal-body">
                <div className="p3-form-row" style={{ marginBottom: 16 }}>
                  <div>
                    <div className="p3-form-label">Cari</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedItem.cari}</div>
                  </div>
                  <div>
                    <div className="p3-form-label">Kategori</div>
                    <span className="p3-timeline-badge">{selectedItem.kategori}</span>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div className="p3-form-label">A{'\u00E7\u0131'}klama</div>
                  <div style={{ fontSize: 13, color: 'var(--p3-text-secondary)', lineHeight: 1.5 }}>
                    {selectedItem.aciklama}
                  </div>
                </div>
                <div className="p3-form-row" style={{ marginBottom: 16 }}>
                  <div>
                    <div className="p3-form-label">Tarih</div>
                    <div style={{ fontSize: 14 }}>{tarihFormat(selectedItem.tarih)}</div>
                  </div>
                  <div>
                    <div className="p3-form-label">Tutar</div>
                    <div style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: selectedItem.tur === 'giris' ? 'var(--p3-green)' : 'var(--p3-red)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {selectedItem.tur === 'giris' ? '+' : '\u2212'}{TL(selectedItem.tutar)} {'\u20BA'}
                    </div>
                  </div>
                </div>
                <div className="p3-modal-actions">
                  <button className="p3-btn-ghost" onClick={() => handleDelete(selectedItem)}>
                    <i className="bi bi-trash3"></i>
                    Sil
                  </button>
                  <button className="p3-btn-ghost" onClick={() => setSelectedItem(null)}>
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Yeni Hareket Modal */}
        {showModal && (
          <div className="p3-modal-overlay">
            <div className="p3-modal">
              <div className="p3-modal-header">
                <h2>
                  <i className="bi bi-plus-circle" style={{ color: 'var(--p3-primary-light)' }}></i>
                  Yeni Hareket
                </h2>
                <button className="p3-modal-close" onClick={() => setShowModal(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="p3-modal-body">
                <div className="p3-form-group">
                  <label className="p3-form-label">T{'\u00FC'}r</label>
                  <select className="p3-form-select" defaultValue="">
                    <option value="" disabled>Se{'\u00E7'}iniz...</option>
                    <option value="giris">Giri{'\u015F'} (Tahsilat)</option>
                    <option value="cikis">{'\u00C7\u0131k\u0131\u015F'} ({'\u00D6'}deme)</option>
                  </select>
                </div>
                <div className="p3-form-group">
                  <label className="p3-form-label">Cari Hesap</label>
                  <input type="text" className="p3-form-input" placeholder="Cari ad\u0131 girin..." />
                </div>
                <div className="p3-form-row">
                  <div className="p3-form-group">
                    <label className="p3-form-label">Tutar ({'\u20BA'})</label>
                    <input type="text" className="p3-form-input" placeholder="0,00" />
                  </div>
                  <div className="p3-form-group">
                    <label className="p3-form-label">Kategori</label>
                    <select className="p3-form-select" defaultValue="">
                      <option value="" disabled>Se{'\u00E7'}iniz...</option>
                      <option>Sat{'\u0131\u015F'}</option>
                      <option>Maa{'\u015F'}</option>
                      <option>Fatura</option>
                      <option>Kira</option>
                      <option>Hammadde</option>
                      <option>Vergi</option>
                      <option>Lojistik</option>
                      <option>Avans</option>
                    </select>
                  </div>
                </div>
                <div className="p3-form-group">
                  <label className="p3-form-label">Tarih</label>
                  <input type="date" className="p3-form-input" defaultValue="2026-03-15" />
                </div>
                <div className="p3-form-group">
                  <label className="p3-form-label">A{'\u00E7\u0131'}klama</label>
                  <input type="text" className="p3-form-input" placeholder="Hareket a\u00E7\u0131klamas\u0131..." />
                </div>
                <div className="p3-modal-actions">
                  <button className="p3-btn-ghost" onClick={() => setShowModal(false)}>
                    {'\u0130'}ptal
                  </button>
                  <button className="p3-btn-primary" onClick={() => setShowModal(false)}>
                    <i className="bi bi-check-lg"></i>
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedItem && (
          <div className="p3-modal-overlay">
            <div className="p3-modal">
              <div className="p3-delete-modal-body">
                <div className="p3-delete-icon">
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <h3>Hareketi Sil</h3>
                <p>
                  <strong>{selectedItem.cari}</strong> {'\u2014'} {TL(selectedItem.tutar)} {'\u20BA'} tutar{'\u0131'}ndaki
                  hareketi silmek istedi{'\u011F'}inize emin misiniz? Bu i{'\u015F'}lem geri al{'\u0131'}namaz.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="p3-btn-ghost" onClick={() => { setShowDeleteModal(false); setSelectedItem(null) }}>
                    Vazge{'\u00E7'}
                  </button>
                  <button className="p3-btn-danger" onClick={() => { setShowDeleteModal(false); setSelectedItem(null) }}>
                    <i className="bi bi-trash3"></i>
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
