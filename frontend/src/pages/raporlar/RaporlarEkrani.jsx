/**
 * RaporlarEkrani.jsx — Raporlama Ana Sayfası
 * Tab navigasyonlu 5 rapor tipi + rapor geçmişi
 * Tema: ParamGo v2 — rpr- prefix
 */

import { useState } from 'react'
import CariYaslandirma from './CariYaslandirma'
import NakitAkis from './NakitAkis'
import CekPortfoy from './CekPortfoy'
import OdemeOzet from './OdemeOzet'
import GenelOzet from './GenelOzet'
import RaporGecmisi from './RaporGecmisi'

const p = 'p'

const TABLAR = [
  { id: 'genel',       ikon: 'bi-bar-chart-line-fill', etiket: 'Genel Özet' },
  { id: 'cari',        ikon: 'bi-people-fill',         etiket: 'Cari Yaşlandırma' },
  { id: 'nakit',       ikon: 'bi-graph-up-arrow',      etiket: 'Nakit Akış' },
  { id: 'cek',         ikon: 'bi-file-earmark-text-fill', etiket: 'Çek/Senet Portföy' },
  { id: 'odeme',       ikon: 'bi-credit-card-2-front-fill', etiket: 'Ödeme Özet' },
  { id: 'gecmis',      ikon: 'bi-clock-history',       etiket: 'Rapor Geçmişi' },
]

export default function RaporlarEkrani() {
  const [aktifTab, setAktifTab] = useState('genel')

  return (
    <div>
      {/* ── Sayfa Header ─────────────────────────────────── */}
      <div className={`${p}-page-header`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon`}>
            <i className="bi bi-bar-chart-line-fill" />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>Raporlar</h1>
            <p className={`${p}-page-sub`}>Finansal verilerinizi analiz edin, grafik ve tablo olarak görüntüleyin</p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigasyon ───────────────────────────────── */}
      <div className="rpr-tab-bar">
        <div className="rpr-tab-scroll">
          {TABLAR.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rpr-tab-btn${aktifTab === tab.id ? ' rpr-tab-active' : ''}`}
              onClick={() => setAktifTab(tab.id)}
            >
              <i className={`bi ${tab.ikon}`} />
              <span>{tab.etiket}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab İçeriği ──────────────────────────────────── */}
      <div className="rpr-tab-content">
        {aktifTab === 'genel'  && <GenelOzet />}
        {aktifTab === 'cari'   && <CariYaslandirma />}
        {aktifTab === 'nakit'  && <NakitAkis />}
        {aktifTab === 'cek'    && <CekPortfoy />}
        {aktifTab === 'odeme'  && <OdemeOzet />}
        {aktifTab === 'gecmis' && <RaporGecmisi />}
      </div>

      {/* ── CSS ──────────────────────────────────────────── */}
      <style>{`
        /* ── Tab Bar ────────────────────────────────────── */
        .rpr-tab-bar {
          margin-bottom: 20px;
          border-bottom: 1px solid var(--p-border);
        }
        .rpr-tab-scroll {
          display: flex;
          gap: 2px;
          overflow-x: auto;
          padding-bottom: 0;
          scrollbar-width: none;
        }
        .rpr-tab-scroll::-webkit-scrollbar { display: none; }
        .rpr-tab-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 16px;
          border: none;
          background: none;
          color: var(--p-text-muted);
          font-size: 13px;
          font-weight: 600;
          font-family: var(--p-font-body);
          white-space: nowrap;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: var(--p-transition);
          border-radius: 0;
          margin-bottom: -1px;
        }
        .rpr-tab-btn:hover {
          color: var(--p-primary);
          background: rgba(16,185,129,0.04);
        }
        .rpr-tab-btn i { font-size: 14px; }
        .rpr-tab-active {
          color: var(--p-primary);
          border-bottom-color: var(--p-primary);
        }
        .rpr-tab-content { min-height: 400px; }

        /* ── Ortak Rapor Stilleri ────────────────────────── */
        .rpr-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-end;
          padding: 16px 20px;
          background: var(--p-bg-card);
          border: 1px solid var(--p-border);
          border-radius: 14px;
          margin-bottom: 20px;
        }
        .rpr-filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .rpr-filter-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--p-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .rpr-filter-input {
          height: 38px;
          border: 1px solid var(--p-border);
          border-radius: 10px;
          padding: 0 12px;
          font-size: 13px;
          font-family: var(--p-font-body);
          color: var(--p-text);
          background: var(--p-bg);
          min-width: 140px;
          outline: none;
          transition: var(--p-transition);
        }
        .rpr-filter-input:focus {
          border-color: var(--p-primary);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .rpr-filter-btn {
          height: 38px;
          padding: 0 16px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          font-family: var(--p-font-body);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: var(--p-transition);
        }
        .rpr-filter-btn-primary {
          background: var(--p-primary);
          color: #fff;
        }
        .rpr-filter-btn-primary:hover { opacity: 0.9; }

        /* ── Export Butonları ────────────────────────────── */
        .rpr-export-bar {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }
        .rpr-export-btn {
          height: 38px;
          padding: 0 14px;
          border: 1px solid var(--p-border);
          border-radius: 10px;
          background: var(--p-bg-card);
          color: var(--p-text-sec);
          font-size: 12px;
          font-weight: 600;
          font-family: var(--p-font-body);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: var(--p-transition);
        }
        .rpr-export-btn:hover {
          border-color: var(--p-primary);
          color: var(--p-primary);
          background: rgba(16,185,129,0.04);
        }
        .rpr-export-btn i { font-size: 14px; }

        /* ── Rapor Kartı ────────────────────────────────── */
        .rpr-card {
          background: var(--p-bg-card);
          border: 1px solid var(--p-border);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .rpr-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--p-border);
        }
        .rpr-card-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--p-text);
          font-family: var(--p-font-body);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rpr-card-title i { color: var(--p-primary); font-size: 16px; }
        .rpr-card-body { padding: 20px; }

        /* ── KPI Satırı ─────────────────────────────────── */
        .rpr-kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .rpr-kpi {
          background: var(--p-bg-card);
          border: 1px solid var(--p-border);
          border-radius: 14px;
          padding: 18px 20px;
          position: relative;
          overflow: hidden;
          transition: var(--p-transition);
        }
        .rpr-kpi:hover {
          box-shadow: var(--p-shadow-card-hover);
          transform: translateY(-2px);
        }
        .rpr-kpi-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--p-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .rpr-kpi-value {
          font-size: 22px;
          font-weight: 700;
          font-family: var(--p-font-display);
          color: var(--p-text);
        }
        .rpr-kpi-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 32px;
          opacity: 0.35;
          color: var(--p-primary);
        }
        .rpr-kpi-accent {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }

        /* ── Grafik Container ───────────────────────────── */
        .rpr-chart-wrap {
          position: relative;
          height: 300px;
          padding: 10px 0;
        }

        /* ── Tablo ──────────────────────────────────────── */
        .rpr-table thead th {
          font-size: 11px;
          font-weight: 700;
          color: var(--p-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 10px 14px;
          border-bottom: 2px solid var(--p-border);
          background: linear-gradient(90deg, rgba(16,185,129,0.04) 0%, rgba(16,185,129,0.01) 100%);
          white-space: nowrap;
        }
        .rpr-table tbody td {
          padding: 10px 14px;
          font-size: 13px;
          color: var(--p-text);
          border-bottom: 1px solid var(--p-border);
          vertical-align: middle;
        }
        .rpr-table tbody tr:hover {
          background: rgba(16,185,129,0.03);
        }
        .rpr-table tbody tr:last-child td { border-bottom: none; }

        /* ── Boş Durum ──────────────────────────────────── */
        .rpr-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--p-text-muted);
        }
        .rpr-empty-icon {
          font-size: 40px;
          opacity: 0.35;
          margin-bottom: 12px;
          color: var(--p-primary);
        }
        .rpr-empty-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--p-text-sec);
          margin-bottom: 4px;
        }
        .rpr-empty-sub {
          font-size: 12px;
          color: var(--p-text-muted);
        }

        /* ── Yükleniyor ─────────────────────────────────── */
        .rpr-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          color: var(--p-text-muted);
          font-size: 13px;
          gap: 10px;
        }
        .rpr-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--p-border);
          border-top-color: var(--p-primary);
          border-radius: 50%;
          animation: rprSpin 0.7s linear infinite;
        }
        @keyframes rprSpin { to { transform: rotate(360deg); } }

        /* ── Badge ──────────────────────────────────────── */
        .rpr-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .rpr-badge-emerald { background: #ECFDF5; color: #059669; }
        .rpr-badge-amber   { background: #FFFBEB; color: #D97706; }
        .rpr-badge-red     { background: #FEF2F2; color: #DC2626; }
        .rpr-badge-blue    { background: #EFF6FF; color: #2563EB; }
        .rpr-badge-gray    { background: #F3F4F6; color: #6B7280; }
        .rpr-badge-purple  { background: #F5F3FF; color: #7C3AED; }

        /* ── Responsive ─────────────────────────────────── */
        @media (max-width: 991px) {
          .rpr-kpi-row { grid-template-columns: repeat(2, 1fr); }
          .rpr-filter-bar { flex-direction: column; align-items: stretch; }
          .rpr-export-bar { margin-left: 0; }
        }
        @media (max-width: 767px) {
          .rpr-kpi-row { grid-template-columns: 1fr; }
          .rpr-tab-btn span { display: none; }
          .rpr-tab-btn { padding: 10px 12px; }
          .rpr-chart-wrap { height: 220px; }
          .rpr-kpi-value { font-size: 18px; }
        }
      `}</style>
    </div>
  )
}
