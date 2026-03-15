import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { odemeApi } from '../../api/odeme'

/* ═══════════════════════════════════════════════════════════════
   YARDIMCI FONKSİYONLAR
   ═══════════════════════════════════════════════════════════════ */

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'TRY', maximumFractionDigits: 0,
  }).format(n || 0)

const tarihStr = (t) => {
  if (!t) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date(t + 'T00:00:00'))
}

const gunFarki = (t) => {
  if (!t) return null
  const b = new Date(); b.setHours(0, 0, 0, 0)
  return Math.floor((new Date(t + 'T00:00:00') - b) / 86400000)
}

const bugunStr = (offset = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

/* ═══════════════════════════════════════════════════════════════
   SABİTLER — Koyu Tema Renk Paleti
   ═══════════════════════════════════════════════════════════════ */

const ONCELIK_META = {
  kritik: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',          label: 'Kritik',  dot: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  yuksek: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',         label: 'Yüksek',  dot: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  normal: { color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.07)', label: 'Normal', dot: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.12)' },
  dusuk:  { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', label: 'Düşük',  dot: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.08)' },
}

const ARAMA_DURUM_META = {
  aranmadi:   { label: 'Aranmadı',   color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.07)', icon: 'bi-telephone' },
  cevap_yok:  { label: 'Cevap Yok',  color: '#ef4444',              bg: 'rgba(239,68,68,0.12)',   icon: 'bi-telephone-x' },
  soz_alindi: { label: 'Söz Alındı', color: '#f59e0b',              bg: 'rgba(245,158,11,0.12)',  icon: 'bi-check2' },
  tamamlandi: { label: 'Tamamlandı', color: '#10b981',              bg: 'rgba(16,185,129,0.12)',  icon: 'bi-check-circle-fill' },
}

const ARAMA_SECENEKLERI = [
  { id: 'cevap_yok',  emoji: '📵', label: 'Cevap Vermedi' },
  { id: 'soz_alindi', emoji: '💬', label: 'Görüştüm — Söz Verdi' },
  { id: 'tamamlandi', emoji: '✅', label: 'Ödedi / Tahsil Ettim' },
  { id: 'ertelendi',  emoji: '⏰', label: 'Ertele (Tarih Seç)' },
]

const ONCELIK_SIRA = { kritik: 0, yuksek: 1, normal: 2, dusuk: 3 }

/* ═══════════════════════════════════════════════════════════════
   MOCK VERİ
   ═══════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════
   STILLER — Obsidian Vault Koyu Tema  |  odm- prefix
   ═══════════════════════════════════════════════════════════════ */

const STILLER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  @keyframes odmFadeIn   { from { opacity: 0 }                              to { opacity: 1 } }
  @keyframes odmSlideUp  { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  @keyframes odmSlideIn  { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
  @keyframes odmSpinAnim { to { transform: rotate(360deg) } }
  @keyframes odmPulseRed { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0) } 50% { box-shadow: 0 0 0 6px rgba(239,68,68,0.2) } }
  @keyframes odmBottomUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
  @keyframes kasaFadeIn  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes kasaSlideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

  /* ─── Sayfa ─── */
  .odm-page {
    font-family: 'Outfit', sans-serif;
    background: linear-gradient(160deg, #0d1b2e 0%, #0a1628 50%, #0d1f35 100%);
    background-attachment: fixed;
    min-height: 100vh;
    padding: 28px 24px;
  }
  @media (max-width: 991px) { .odm-page { padding: 20px 16px } }
  @media (max-width: 480px)  { .odm-page { padding: 14px 12px } }

  /* ─── Glassmorphism Kart ─── */
  .odm-card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 22px;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .odm-card:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
  }

  /* ─── KPI Grid ─── */
  .odm-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 16px;
  }
  @media (max-width: 991px) { .odm-kpi-grid { grid-template-columns: repeat(2, 1fr) } }
  @media (max-width: 480px)  { .odm-kpi-grid { grid-template-columns: 1fr } }

  .odm-kpi-kart {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 22px 24px;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    height: 100%;
    container-type: inline-size;
  }
  .odm-kpi-kart:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.14);
    transform: translateY(-2px);
  }
  .odm-kpi-deco {
    position: absolute; top: 16px; right: 16px;
    font-size: 42px; opacity: 0.07; line-height: 1; pointer-events: none;
  }
  .odm-kpi-etiket {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: rgba(255,255,255,0.5); margin-bottom: 10px;
  }
  .odm-kpi-deger {
    font-family: 'Inter', sans-serif;
    font-size: clamp(13px, 6.5cqw, 26px); font-weight: 800;
    font-variant-numeric: tabular-nums; line-height: 1.15;
    -webkit-font-smoothing: antialiased;
  }
  .odm-kpi-alt { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 6px; font-weight: 500 }

  /* ─── Analitik Satır ─── */
  .odm-analytics-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 16px;
  }
  @media (max-width: 767px) { .odm-analytics-row { grid-template-columns: 1fr } }

  .odm-kart-baslik   { font-size: 14px; font-weight: 700; color: #ffffff; letter-spacing: -0.28px }
  .odm-kart-aciklama { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px }

  /* ─── Yaşlandırma ─── */
  .odm-yas-item { margin-bottom: 14px }
  .odm-yas-item:last-child { margin-bottom: 0 }
  .odm-yas-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px }
  .odm-yas-aralik { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.75) }
  .odm-yas-tutar  { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums }
  .odm-yas-bar-bg { background: rgba(255,255,255,0.06); border-radius: 6px; height: 6px; overflow: hidden }
  .odm-yas-bar-fill { height: 100%; border-radius: 6px; transition: width 0.4s ease }

  /* ─── Yaklaşan Ödeme Satırı ─── */
  .odm-odeme-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .odm-odeme-item:last-child { border-bottom: none }
  .odm-odeme-ikon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
  }
  .odm-odeme-firma { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85) }
  .odm-odeme-tur   { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 1px }
  .odm-odeme-gun   { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; font-family: 'Inter', sans-serif; flex-shrink: 0 }
  .odm-odeme-tutar { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; color: rgba(255,255,255,0.85); margin-left: auto; flex-shrink: 0 }

  /* ─── Filtre Bar ─── */
  .odm-filtre-bar {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 11px 14px; margin-bottom: 12px;
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }

  .odm-arama-wrap { position: relative; flex: 1; min-width: 200px }
  .odm-arama-ikon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.35); font-size: 13px; pointer-events: none }
  .odm-arama-input {
    width: 100%; padding: 9px 14px 9px 36px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #ffffff;
    font-size: 14px; font-family: 'Outfit', sans-serif; min-height: 42px; outline: none; transition: all 200ms;
  }
  .odm-arama-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.12); background: rgba(255,255,255,0.07) }
  .odm-arama-input::placeholder { color: rgba(255,255,255,0.25) }

  .odm-tab-wrap { display: flex; gap: 5px; flex-wrap: nowrap; overflow-x: auto; flex-shrink: 0 }
  .odm-tab {
    padding: 7px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    cursor: pointer; min-height: 36px; transition: all 200ms; white-space: nowrap;
    font-family: 'Outfit', sans-serif;
  }
  .odm-tab:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.07) }
  .odm-tab.active { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.35); color: #f59e0b; font-weight: 700 }

  .odm-filtre-btn {
    padding: 7px 14px; border-radius: 9px; font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    cursor: pointer; min-height: 42px; transition: all 200ms; font-family: 'Outfit', sans-serif;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .odm-filtre-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8) }
  .odm-filtre-btn.aktif { border-color: rgba(245,158,11,0.35); color: #f59e0b; background: rgba(245,158,11,0.1) }

  .odm-filtre-panel {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
    padding: 16px; margin-bottom: 12px;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
  }
  @media (max-width: 767px) { .odm-filtre-panel { grid-template-columns: 1fr } }
  .odm-filtre-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: rgba(255,255,255,0.4); margin-bottom: 6px;
  }
  .odm-dark-select {
    width: 100%; padding: 8px 12px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff;
    font-size: 13px; font-family: 'Outfit', sans-serif; min-height: 40px; outline: none; cursor: pointer;
    color-scheme: dark;
  }
  .odm-dark-select:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.12) }
  .odm-dark-date {
    width: 100%; padding: 8px 12px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff;
    font-size: 13px; font-family: 'Outfit', sans-serif; min-height: 40px; outline: none;
    color-scheme: dark;
  }
  .odm-dark-date:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.12) }

  /* ─── Liste Layout + Tablo ─── */
  .odm-layout { display: flex; gap: 14px; align-items: flex-start }
  .odm-main   { flex: 1; min-width: 0 }

  .odm-tablo-wrap {
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; overflow: hidden;
  }
  .odm-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 500px }
  .odm-table thead th {
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
    color: rgba(255,255,255,0.5); padding: 12px 14px; text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap;
    background: rgba(255,255,255,0.03);
    font-family: 'Outfit', sans-serif;
  }
  .odm-table tbody td {
    font-size: 14px; color: rgba(255,255,255,0.75);
    padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle;
  }
  .odm-table tbody tr { transition: background 150ms ease; cursor: pointer }
  .odm-table tbody tr:hover { background: rgba(255,255,255,0.03) }
  .odm-table tbody tr:last-child td { border-bottom: none }
  .odm-table tbody tr.secili { background: rgba(245,158,11,0.05) }
  .odm-td-border { width: 4px; padding: 0 !important }

  /* ─── Badge ─── */
  .odm-badge {
    padding: 3px 9px; border-radius: 7px; font-size: 11px; font-weight: 700;
    font-family: 'Outfit', sans-serif; display: inline-flex; align-items: center;
    gap: 4px; white-space: nowrap;
  }

  /* ─── Aksiyon Butonları ─── */
  .odm-icon-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; color: rgba(255,255,255,0.5); transition: all 200ms;
  }
  .odm-icon-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.9); border-color: rgba(255,255,255,0.18) }
  .odm-icon-btn.amber  { border-color: rgba(245,158,11,0.35); background: rgba(245,158,11,0.1); color: #f59e0b }
  .odm-icon-btn.amber:hover  { background: rgba(245,158,11,0.18); border-color: rgba(245,158,11,0.5) }
  .odm-icon-btn.emerald { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.1); color: #10b981 }
  .odm-icon-btn.emerald:hover { background: rgba(16,185,129,0.18); border-color: rgba(16,185,129,0.5) }

  /* ─── Mobil Kart ─── */
  .odm-mobil-kart {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 14px; margin-bottom: 8px; transition: all 200ms; cursor: pointer; border-left-width: 4px;
  }
  .odm-mobil-kart:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14) }
  .odm-kritik-pulse { animation: odmPulseRed 2.5s ease-in-out infinite }

  /* ─── Sağ Drawer ─── */
  .odm-drawer {
    flex: 0 0 340px; width: 340px;
    background: rgba(13,27,46,0.97);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; overflow: hidden; animation: odmSlideIn 0.25s ease;
    position: sticky; top: 20px; max-height: calc(100vh - 40px); overflow-y: auto;
  }
  .odm-drawer-header {
    padding: 18px 20px;
    background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.06));
    border-bottom: 2px solid rgba(245,158,11,0.35);
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 5;
  }
  .odm-drawer-body { padding: 18px }
  @media (max-width: 767px) {
    .odm-drawer {
      position: fixed; bottom: 0; left: 0; right: 0; width: 100%; flex: none;
      height: 85vh; border-radius: 14px 14px 0 0; z-index: 1500;
      animation: odmBottomUp 0.3s ease; top: auto; max-height: 85vh;
    }
  }
  .odm-drawer-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1499;
  }
  @media (max-width: 767px) { .odm-drawer-overlay { display: block } }

  /* ─── Timeline ─── */
  .odm-timeline { list-style: none; padding: 0; margin: 0 }
  .odm-tl-item { display: flex; gap: 11px; padding-bottom: 14px; position: relative }
  .odm-tl-item:not(:last-child)::before {
    content: ''; position: absolute; left: 14px; top: 30px; bottom: 0;
    width: 1px; background: rgba(255,255,255,0.06);
  }
  .odm-tl-dot { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0 }

  /* ─── Modal ─── */
  .odm-modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000; animation: kasaFadeIn 0.15s ease;
  }
  .odm-modal {
    background: rgba(13,27,46,0.97);
    backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
    max-width: 500px; width: 92%; max-height: 90vh;
    display: flex; flex-direction: column;
    box-shadow: 0 32px 80px rgba(0,0,0,0.5);
    animation: kasaSlideUp 0.25s ease; overflow: hidden;
  }
  .odm-modal-header {
    padding: 20px 24px;
    background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08));
    border-bottom: 2px solid rgba(245,158,11,0.4);
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .odm-modal-body  { padding: 22px; overflow-y: auto; flex: 1 }
  .odm-modal-footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.08);
    background: rgba(13,27,46,0.98); flex-shrink: 0;
    display: flex; justify-content: flex-end; gap: 10px;
  }
  @media (max-width: 767px) {
    .odm-modal-backdrop { align-items: flex-end }
    .odm-modal { border-radius: 16px 16px 0 0; max-height: 85vh; width: 100%; max-width: 100% }
  }

  /* ─── Amber Butonu (Primary) ─── */
  .odm-btn-amber {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff; border: none; border-radius: 50px;
    font-size: 14px; font-weight: 700; padding: 10px 22px;
    cursor: pointer; min-height: 44px; font-family: 'Outfit', sans-serif;
    display: inline-flex; align-items: center; gap: 8px; transition: all 300ms;
    box-shadow: 0 3px 10px rgba(245,158,11,0.3);
  }
  .odm-btn-amber:hover { box-shadow: 0 6px 20px rgba(245,158,11,0.45); transform: translateY(-1px) }
  .odm-btn-amber:disabled { opacity: 0.5; cursor: not-allowed; transform: none }

  /* ─── Glass Butonu (İptal / İkincil) ─── */
  .odm-btn-glass {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.7); border-radius: 10px; font-size: 14px; font-weight: 500;
    padding: 10px 20px; cursor: pointer; min-height: 44px; font-family: 'Outfit', sans-serif;
    display: inline-flex; align-items: center; gap: 8px; transition: all 200ms;
  }
  .odm-btn-glass:hover { background: rgba(255,255,255,0.1); color: #fff }

  /* ─── Kapat Buton (Dark) ─── */
  .odm-kapat-dark {
    width: 36px; height: 36px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; transition: all 200ms; flex-shrink: 0;
  }
  .odm-kapat-dark:hover { background: rgba(255,255,255,0.14); color: #fff }

  /* ─── Kapat Buton (Drawer) ─── */
  .odm-kapat-btn {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; transition: all 200ms; flex-shrink: 0;
  }
  .odm-kapat-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.35); color: #ef4444 }

  /* ─── Modal Input/Textarea ─── */
  .odm-dark-field {
    display: block; width: 100%; padding: 10px 14px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
    color: #ffffff; font-size: 14px; font-family: 'Outfit', sans-serif;
    min-height: 44px; outline: none; transition: all 200ms; color-scheme: dark;
  }
  .odm-dark-field:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.12) }
  .odm-dark-field::placeholder { color: rgba(255,255,255,0.25) }

  /* ─── Arama Seçenek Kartları ─── */
  .odm-radio-kart {
    border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
    padding: 12px 14px; cursor: pointer; transition: all 200ms;
    display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); user-select: none;
    font-family: 'Outfit', sans-serif;
  }
  .odm-radio-kart:hover { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.14) }
  .odm-radio-kart.selected { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.4); color: #f59e0b }

  .odm-spinner {
    width: 36px; height: 36px;
    border: 3px solid rgba(255,255,255,0.08);
    border-top-color: #f59e0b;
    border-radius: 50%; animation: odmSpinAnim 0.8s linear infinite;
  }

  .odm-firma { font-weight: 600; font-size: 14px; color: #ffffff; letter-spacing: -0.28px }
  .odm-cari  { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 1px }
  .odm-aksiyon-grup { display: flex; align-items: center; gap: 6px }

  @media (max-width: 767px) {
    .odm-arama-wrap { min-width: 100%; order: -1 }
    .odm-tab-wrap { max-width: 100%; overflow-x: auto }
  }
`

/* ═══════════════════════════════════════════════════════════════
   TABLO YARDIMCILARI
   ═══════════════════════════════════════════════════════════════ */

function kenariRenk(tarih, durum) {
  if (durum === 'tamamlandi') return '#10b981'
  const fark = gunFarki(tarih)
  if (fark === null) return 'rgba(255,255,255,0.1)'
  if (fark < 0)   return '#ef4444'
  if (fark === 0) return '#f59e0b'
  if (fark <= 3)  return '#fbbf24'
  return 'rgba(255,255,255,0.1)'
}

function vadeBadge(tarih, durum) {
  if (durum === 'tamamlandi') return { text: 'Tamamlandı', color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
  const fark = gunFarki(tarih)
  if (fark === null) return null
  if (fark === 0)  return { text: 'Bugün',                    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  if (fark > 0)   return { text: `${fark} gün kaldı`,        color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
  return                  { text: `${Math.abs(fark)} gün geçti`, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
}

function isPulse(k) {
  return k.oncelik === 'kritik' && gunFarki(k.vade_tarihi) < 0 && k.arama_durumu === 'aranmadi'
}

/* ═══════════════════════════════════════════════════════════════
   ANA BİLEŞEN
   ═══════════════════════════════════════════════════════════════ */

export default function OdemeTakip() {
  const navigate = useNavigate()
  const [liste,            setListe]            = useState([])
  const [yukleniyor,       setYukleniyor]       = useState(true)
  const [apiHatasi,        setApiHatasi]        = useState(false)
  const [aktifFiltre,      setAktifFiltre]      = useState('bu_hafta')
  const [aramaTerm,        setAramaTerm]        = useState('')
  const [debouncedArama,   setDebouncedArama]   = useState('')
  const [secilenKayitId,   setSecilenKayitId]   = useState(null)
  const [aramaModaliId,    setAramaModaliId]    = useState(null)
  const [kpiVerisi,        setKpiVerisi]        = useState(null)
  const [filtrePaneli,     setFiltrePaneli]     = useState(false)
  const [oncelikFiltre,    setOncelikFiltre]    = useState('')
  const [baslangicTarihi,  setBaslangicTarihi]  = useState('')
  const [bitisTarihi,      setBitisTarihi]      = useState('')
  const [menuAcikId,       setMenuAcikId]       = useState(null)
  const [aramaSonucu,      setAramaSonucu]      = useState(null)
  const [aramaNotText,     setAramaNotText]     = useState('')
  const [hatirlaticiTarihi,setHatirlaticiTarihi]= useState('')

  // Yeni Kayıt Ekle modal state'leri
  const BOSH_YENI_FORM = { firma_adi: '', ilgili_kisi: '', telefon: '', tutar: '', yon: 'tahsilat', soz_tarihi: bugunStr(0), oncelik: 'normal' }
  const [showYeniModal,        setShowYeniModal]        = useState(false)
  const [yeniForm,             setYeniForm]             = useState(BOSH_YENI_FORM)
  const [yeniKaydetYukleniyor, setYeniKaydetYukleniyor] = useState(false)
  const [yeniFormHata,         setYeniFormHata]         = useState('')

  const secilenKayit = useMemo(() => liste.find(k => k.id === secilenKayitId) || null, [liste, secilenKayitId])
  const aramaModali  = useMemo(() => liste.find(k => k.id === aramaModaliId)  || null, [liste, aramaModaliId])

  useEffect(() => {
    const veriGetir = async () => {
      try {
        const [listeRes, ozetRes] = await Promise.all([
          odemeApi.listele(),
          odemeApi.ozet(),
        ])
        const kayitlar = listeRes.data?.veri?.kayitlar || listeRes.data?.veri || []
        // API'den gelen kayıtlarda vade_tarihi = soz_tarihi olabilir
        setListe(kayitlar.map(k => ({ ...k, vade_tarihi: k.vade_tarihi || k.soz_tarihi })))
        setKpiVerisi(ozetRes.data?.veri || null)
      } catch {
        setApiHatasi(true)
      } finally {
        setYukleniyor(false)
      }
    }
    veriGetir()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedArama(aramaTerm), 300)
    return () => clearTimeout(t)
  }, [aramaTerm])

  useEffect(() => {
    const fn = (e) => {
      if (e.key !== 'Escape') return
      if (showYeniModal) { setShowYeniModal(false); setYeniForm(BOSH_YENI_FORM); setYeniFormHata('') }
      else if (aramaModaliId) { setAramaModaliId(null); resetModal() }
      else if (menuAcikId) setMenuAcikId(null)
      else if (secilenKayitId) setSecilenKayitId(null)
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [showYeniModal, aramaModaliId, menuAcikId, secilenKayitId])

  useEffect(() => {
    document.body.style.overflow = (aramaModaliId || showYeniModal) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aramaModaliId, showYeniModal])

  useEffect(() => {
    if (!menuAcikId) return
    const fn = () => setMenuAcikId(null)
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [menuAcikId])

  const filtreliListe = useMemo(() => {
    let s = [...liste]
    if (aktifFiltre === 'bu_hafta') {
      const bugun = new Date(); bugun.setHours(0,0,0,0)
      const gun = bugun.getDay()
      const pzt = new Date(bugun); pzt.setDate(bugun.getDate() - (gun === 0 ? 6 : gun - 1))
      const pzr = new Date(pzt);   pzr.setDate(pzt.getDate() + 6); pzr.setHours(23,59,59,999)
      s = s.filter(k => { const v = new Date(k.vade_tarihi + 'T00:00:00'); return v >= pzt && v <= pzr })
    } else if (aktifFiltre === 'gecikmus') {
      const bugun = new Date(); bugun.setHours(0,0,0,0)
      s = s.filter(k => new Date(k.vade_tarihi + 'T00:00:00') < bugun && k.durum !== 'tamamlandi')
    } else if (aktifFiltre === 'arandi')    { s = s.filter(k => k.arama_durumu !== 'aranmadi') }
    else if (aktifFiltre === 'soz_alindi') { s = s.filter(k => k.arama_durumu === 'soz_alindi') }
    if (debouncedArama.trim()) {
      const q = debouncedArama.toLowerCase()
      s = s.filter(k => k.firma_adi.toLowerCase().includes(q) || (k.cari_adi || '').toLowerCase().includes(q) || (k.telefon && k.telefon.includes(q)))
    }
    if (oncelikFiltre)   s = s.filter(k => k.oncelik === oncelikFiltre)
    if (baslangicTarihi) s = s.filter(k => k.vade_tarihi >= baslangicTarihi)
    if (bitisTarihi)     s = s.filter(k => k.vade_tarihi <= bitisTarihi)
    return s.sort((a, b) => {
      const d = ONCELIK_SIRA[a.oncelik] - ONCELIK_SIRA[b.oncelik]
      return d !== 0 ? d : a.vade_tarihi.localeCompare(b.vade_tarihi)
    })
  }, [liste, aktifFiltre, debouncedArama, oncelikFiltre, baslangicTarihi, bitisTarihi])

  // Alacak Yaşlandırma — tahsilat kayıtlarından hesaplanır (her bucket: geçen gün)
  const yaslima = useMemo(() => {
    const bugun = new Date(); bugun.setHours(0,0,0,0)
    const alacaklar = liste.filter(k => k.yon === 'tahsilat' && k.durum !== 'tamamlandi' && k.durum !== 'iptal')
    const toplamTutar = alacaklar.reduce((s, k) => s + (parseFloat(k.tutar) || 0), 0)
    const buckets = [
      { aralik: '0 – 30 Gün',  min: 0,  max: 30,          renk: '#059669', bg: 'rgba(5,150,105,0.12)',  border: 'rgba(5,150,105,0.25)' },
      { aralik: '31 – 60 Gün', min: 31, max: 60,          renk: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
      { aralik: '61 – 90 Gün', min: 61, max: 90,          renk: '#ea580c', bg: 'rgba(234,88,12,0.12)',  border: 'rgba(234,88,12,0.25)' },
      { aralik: '90+ Gün',     min: 91, max: Infinity,    renk: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)' },
    ]
    return buckets.map(b => {
      const tutar = alacaklar
        .filter(k => {
          const vade = new Date((k.vade_tarihi || k.soz_tarihi) + 'T00:00:00')
          const gecenGun = Math.max(0, Math.floor((bugun - vade) / 86400000))
          return gecenGun >= b.min && gecenGun <= b.max
        })
        .reduce((s, k) => s + (parseFloat(k.tutar) || 0), 0)
      const oran = toplamTutar > 0 ? Math.round((tutar / toplamTutar) * 1000) / 10 : 0
      return { ...b, tutar, oran }
    })
  }, [liste])

  // Yaklaşan Giden Ödemeler — önümüzdeki 15 gün, yon=odeme
  const yaklasan = useMemo(() => {
    const bugun = new Date(); bugun.setHours(0,0,0,0)
    const sonGun = new Date(bugun); sonGun.setDate(bugun.getDate() + 15)
    return liste
      .filter(k => {
        if (k.yon !== 'odeme' || k.durum === 'tamamlandi' || k.durum === 'iptal') return false
        const v = new Date((k.vade_tarihi || k.soz_tarihi) + 'T00:00:00')
        return v >= bugun && v <= sonGun
      })
      .sort((a, b) => (a.vade_tarihi || a.soz_tarihi).localeCompare(b.vade_tarihi || b.soz_tarihi))
      .slice(0, 8)
      .map(k => ({
        id: k.id,
        firma: k.firma_adi,
        tur: 'Ödeme',
        tutar: parseFloat(k.tutar) || 0,
        tarih: k.vade_tarihi || k.soz_tarihi,
        ikon: 'bi-arrow-up-right-circle',
        renk: '#ef4444',
        bg: 'rgba(239,68,68,0.15)',
      }))
  }, [liste])

  const resetModal = () => { setAramaSonucu(null); setAramaNotText(''); setHatirlaticiTarihi('') }
  const modalAc    = (kayit) => { resetModal(); setAramaModaliId(kayit.id) }

  const yeniEkleKaydet = async () => {
    if (!yeniForm.firma_adi.trim()) { setYeniFormHata('Firma adı zorunludur.'); return }
    if (!yeniForm.soz_tarihi)       { setYeniFormHata('Vade tarihi zorunludur.'); return }
    setYeniFormHata('')
    setYeniKaydetYukleniyor(true)
    const tutar = parseFloat(yeniForm.tutar.replace(/\./g, '').replace(',', '.')) || 0
    try {
      const res   = await odemeApi.olustur({ ...yeniForm, tutar })
      const kayit = res.data?.veri || {}
      setListe(prev => [{ ...kayit, vade_tarihi: kayit.vade_tarihi || kayit.soz_tarihi || yeniForm.soz_tarihi, arama_gecmisi: [], arama_durumu: 'aranmadi' }, ...prev])
      setYeniKaydetYukleniyor(false)
      setShowYeniModal(false)
      setYeniForm(BOSH_YENI_FORM)
    } catch {
      setYeniKaydetYukleniyor(false)
      setYeniFormHata('Kayıt kaydedilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.')
    }
  }

  const aramaKaydet = () => {
    if (!aramaSonucu || !aramaModaliId) return
    const yeniGecmis = { tarih: bugunStr(0), sonuc: aramaSonucu === 'ertelendi' ? 'soz_alindi' : aramaSonucu, not: aramaNotText }
    const yeniDurum  = aramaSonucu === 'tamamlandi' ? 'tamamlandi' : aramaSonucu === 'ertelendi' ? 'soz_alindi' : aramaSonucu
    setListe(prev => prev.map(k => {
      if (k.id !== aramaModaliId) return k
      return {
        ...k, arama_durumu: yeniDurum,
        ...(aramaSonucu === 'tamamlandi' ? { durum: 'tamamlandi' } : {}),
        ...(aramaSonucu === 'ertelendi'  ? { durum: 'ertelendi' }  : {}),
        son_arama_tarihi: bugunStr(0), son_not: aramaNotText || null,
        arama_gecmisi: [yeniGecmis, ...k.arama_gecmisi],
      }
    }))
    setAramaModaliId(null); resetModal()
  }

  const tamamlaKayit = (id, e) => {
    e.stopPropagation()
    setListe(prev => prev.map(k => k.id === id ? { ...k, durum: 'tamamlandi', arama_durumu: 'tamamlandi' } : k))
  }

  const KPI_TANIM = [
    { key: 'bu_hafta_vadeli', label: 'Bu Hafta Vadeli',   icon: 'bi-calendar-week',        numColor: '#f59e0b' },
    { key: 'bekleyen_tutar',  label: 'Bekleyen Tahsilat', icon: 'bi-hourglass-split',      numColor: '#3b82f6', format: v => TL(v) },
    { key: 'bu_hafta_aranan', label: 'Bu Hafta Aranan',   icon: 'bi-telephone-outbound',   numColor: '#10b981' },
    { key: 'gecikmus',        label: 'Gecikmiş Alacak',   icon: 'bi-exclamation-triangle', numColor: '#ef4444' },
  ]

  const toplamYaslima  = yaslima.reduce((s, b) => s + b.tutar, 0)
  const toplamYaklasan = yaklasan.reduce((s, o) => s + o.tutar, 0)
  const donemAdi = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="odm-page">
      <style>{STILLER}</style>

      {/* ── API Hata Banner ── */}
      {apiHatasi && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#ef4444' }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 16, flexShrink: 0 }} />
          <span>Veriler sunucudan yüklenemedi. Lütfen sayfayı yenileyin.</span>
          <button onClick={() => navigate(0)} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
            Yenile
          </button>
        </div>
      )}

      {/* ── Sayfa Başlığı ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}>
              <i className="bi bi-credit-card-2-fill" style={{ color: '#fff', fontSize: 17 }} />
            </div>
            Ödeme Takip
          </h1>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '6px 0 0 50px' }}>
            Tahsilat takibi · Alacak yaşlandırma · Yaklaşan ödemeler
          </p>
        </div>
        <button className="odm-btn-amber" onClick={() => { setYeniForm(BOSH_YENI_FORM); setYeniFormHata(''); setShowYeniModal(true) }}>
          <i className="bi bi-plus-lg" />
          Yeni Ekle
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 1 — KPI Bandı
          ═══════════════════════════════════════════════════════════ */}
      <div className="odm-kpi-grid">
        {KPI_TANIM.map(kpi => {
          const ham = kpiVerisi?.[kpi.key] ?? 0
          const deger = yukleniyor ? '—' : kpi.format ? kpi.format(ham) : (kpi.key === 'bekleyen_tutar' ? TL(ham) : `${ham} ${kpi.key === 'bu_hafta_aranan' ? 'kişi' : 'kayıt'}`)
          return (
            <div key={kpi.key} className="odm-kpi-kart">
              <i className={`bi ${kpi.icon} odm-kpi-deco`} style={{ color: kpi.numColor }} />
              <div className="odm-kpi-etiket">{kpi.label}</div>
              <div className="odm-kpi-deger" style={{ color: kpi.numColor, textShadow: `0 0 20px ${kpi.numColor}4D` }}>
                {deger}
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 2 — Bilanço Satırı
          ═══════════════════════════════════════════════════════════ */}
      <div className="odm-analytics-row">

        {/* ── Sol: Alacak Yaşlandırma ── */}
        <div className="odm-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-clock-history" style={{ color: '#f59e0b', fontSize: 15 }} />
              </div>
              <div>
                <div className="odm-kart-baslik">Alacak Yaşlandırma</div>
                <div className="odm-kart-aciklama">
                  Toplam: <strong style={{ color: '#f59e0b', fontFamily: 'Inter, sans-serif' }}>{TL(toplamYaslima)}</strong>
                </div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 7, whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.08)' }}>
              {donemAdi}
            </span>
          </div>

          {yaslima.map((y) => (
            <div key={y.aralik} className="odm-yas-item">
              <div className="odm-yas-header">
                <span className="odm-yas-aralik">{y.aralik}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="odm-yas-tutar" style={{ color: y.renk }}>{TL(y.tutar)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: y.renk, background: y.bg, border: `1px solid ${y.border}`, padding: '2px 7px', borderRadius: 5 }}>
                    %{y.oran}
                  </span>
                </div>
              </div>
              <div className="odm-yas-bar-bg">
                <div className="odm-yas-bar-fill" style={{ width: `${y.oran}%`, background: y.renk }} />
              </div>
            </div>
          ))}

          {/* DSO Özet */}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(245,158,11,0.06)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              <i className="bi bi-graph-up me-2" style={{ color: '#f59e0b' }} />
              DSO — Ort. Tahsilat Süresi
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>43 Gün</span>
          </div>
        </div>

        {/* ── Sağ: Yaklaşan Ödemeler ── */}
        <div className="odm-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bi bi-calendar-x" style={{ color: '#ef4444', fontSize: 15 }} />
              </div>
              <div>
                <div className="odm-kart-baslik">Yaklaşan Ödemeler</div>
                <div className="odm-kart-aciklama">Önümüzdeki 15 gün — giden</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 800, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{TL(toplamYaklasan)}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{yaklasan.length} kalem</div>
            </div>
          </div>

          {yaklasan.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              <i className="bi bi-check-circle" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: '#10b981' }} />
              Önümüzdeki 15 günde giden ödeme yok.
            </div>
          ) : yaklasan.map((o) => {
            const fark = gunFarki(o.tarih)
            const acil = fark !== null && fark <= 3
            return (
              <div key={o.id} className="odm-odeme-item">
                <div className="odm-odeme-ikon" style={{ background: o.bg }}>
                  <i className={`bi ${o.ikon}`} style={{ color: o.renk }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="odm-odeme-firma">{o.firma}</div>
                  <div className="odm-odeme-tur">{o.tur}</div>
                </div>
                <span className="odm-odeme-gun" style={{
                  background: acil ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
                  color: acil ? '#ef4444' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${acil ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'}`,
                }}>
                  {fark === 0 ? 'Bugün' : `${fark}g`}
                </span>
                <span className="odm-odeme-tutar">{TL(o.tutar)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 3 — Filtre + Arama
          ═══════════════════════════════════════════════════════════ */}
      <div className="odm-filtre-bar">
        <div className="odm-arama-wrap">
          <i className="bi bi-search odm-arama-ikon" />
          <input
            className="odm-arama-input"
            placeholder="Firma, müşteri veya telefon..."
            value={aramaTerm}
            onChange={e => setAramaTerm(e.target.value)}
          />
        </div>
        <div className="odm-tab-wrap">
          {[
            { id: 'tumuu',       label: 'Tümü' },
            { id: 'bu_hafta',   label: 'Bu Hafta' },
            { id: 'gecikmus',   label: 'Gecikmiş' },
            { id: 'arandi',     label: 'Arandı' },
            { id: 'soz_alindi', label: 'Söz Alındı' },
          ].map(t => (
            <button key={t.id} className={`odm-tab${aktifFiltre === t.id ? ' active' : ''}`} onClick={() => setAktifFiltre(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <button className={`odm-filtre-btn${filtrePaneli ? ' aktif' : ''}`} onClick={() => setFiltrePaneli(p => !p)}>
          <i className="bi bi-funnel" />
          {filtrePaneli ? 'Kapat' : 'Filtrele'}
        </button>
      </div>

      {filtrePaneli && (
        <div className="odm-filtre-panel">
          <div>
            <div className="odm-filtre-label">Öncelik</div>
            <select className="odm-dark-select" value={oncelikFiltre} onChange={e => setOncelikFiltre(e.target.value)}>
              <option value="">Tümü</option>
              <option value="kritik">Kritik</option>
              <option value="yuksek">Yüksek</option>
              <option value="normal">Normal</option>
              <option value="dusuk">Düşük</option>
            </select>
          </div>
          <div>
            <div className="odm-filtre-label">Vade Başlangıç</div>
            <input type="date" className="odm-dark-date" value={baslangicTarihi} onChange={e => setBaslangicTarihi(e.target.value)} />
          </div>
          <div>
            <div className="odm-filtre-label">Vade Bitiş</div>
            <input type="date" className="odm-dark-date" value={bitisTarihi} onChange={e => setBitisTarihi(e.target.value)} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 4 — Liste + Sağ Drawer
          ═══════════════════════════════════════════════════════════ */}
      <div className="odm-layout">
        <div className="odm-main">

          {yukleniyor ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="odm-spinner" />
            </div>

          ) : filtreliListe.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '35vh', textAlign: 'center', padding: 40, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <i className="bi bi-inbox" style={{ fontSize: 22, color: '#f59e0b' }} />
              </div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Kayıt bulunamadı</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Bu filtreye uyan tahsilat kaydı yok.</p>
            </div>

          ) : (
            <>
              {/* ── Desktop Tablo ── */}
              <div className="d-none d-md-block">
                <div className="odm-tablo-wrap">
                  <div className="table-responsive">
                    <table className="odm-table">
                      <thead>
                        <tr>
                          <th className="odm-td-border" />
                          <th>Firma / Müşteri</th>
                          <th>Tutar</th>
                          <th>Vade Tarihi</th>
                          <th>Öncelik</th>
                          <th>Arama Durumu</th>
                          <th style={{ width: 110 }}>İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtreliListe.map(k => {
                          const vb     = vadeBadge(k.vade_tarihi, k.durum)
                          const ad     = ARAMA_DURUM_META[k.arama_durumu] || ARAMA_DURUM_META.aranmadi
                          const om     = ONCELIK_META[k.oncelik]           || ONCELIK_META.normal
                          const kenari = kenariRenk(k.vade_tarihi, k.durum)
                          const pulse  = isPulse(k)
                          return (
                            <tr
                              key={k.id}
                              className={`${pulse ? 'odm-kritik-pulse' : ''}${secilenKayitId === k.id ? ' secili' : ''}`}
                              onClick={() => setSecilenKayitId(k.id === secilenKayitId ? null : k.id)}
                            >
                              <td className="odm-td-border" style={{ background: kenari }} />

                              <td>
                                <div className="odm-firma">{k.firma_adi}</div>
                                <div className="odm-cari">{k.cari_adi}</div>
                              </td>

                              <td>
                                <span style={{ fontFamily: 'Inter, sans-serif', color: k.durum === 'tamamlandi' ? '#10b981' : 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                                  {TL(k.tutar)}
                                </span>
                              </td>

                              <td>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{tarihStr(k.vade_tarihi)}</div>
                                {vb && <span className="odm-badge" style={{ background: vb.bg, color: vb.color, marginTop: 4 }}>{vb.text}</span>}
                              </td>

                              <td>
                                <span className="odm-badge" style={{ background: om.bg, color: om.color, border: `1px solid ${om.border}` }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: om.dot, boxShadow: `0 0 6px ${om.dot}` }} />
                                  {om.label}
                                </span>
                              </td>

                              <td>
                                <span className="odm-badge" style={{ background: ad.bg, color: ad.color }}>
                                  <i className={`bi ${ad.icon}`} style={{ fontSize: 11 }} />
                                  {ad.label}
                                </span>
                                {k.son_not && (
                                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {k.son_not}
                                  </div>
                                )}
                              </td>

                              <td onClick={e => e.stopPropagation()}>
                                <div className="odm-aksiyon-grup">
                                  <button className="odm-icon-btn amber" title="Arama Kaydı" onClick={() => modalAc(k)}>
                                    <i className="bi bi-telephone" />
                                  </button>
                                  {k.durum !== 'tamamlandi' && (
                                    <button className="odm-icon-btn emerald" title="Tahsil Edildi" onClick={(e) => tamamlaKayit(k.id, e)}>
                                      <i className="bi bi-check-circle" />
                                    </button>
                                  )}
                                  <div style={{ position: 'relative' }}>
                                    <button className="odm-icon-btn" onClick={(e) => { e.stopPropagation(); setMenuAcikId(menuAcikId === k.id ? null : k.id) }}>
                                      <i className="bi bi-three-dots-vertical" />
                                    </button>
                                    {menuAcikId === k.id && (
                                      <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 200, background: 'rgba(13,27,46,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 5, minWidth: 140, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                                        {[
                                          { icon: 'bi-pencil', label: 'Düzenle', color: 'rgba(255,255,255,0.75)' },
                                          { icon: 'bi-trash',  label: 'Sil',     color: '#ef4444' },
                                        ].map(mi => (
                                          <button key={mi.label}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: mi.color, borderRadius: 7, fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                          >
                                            <i className={`bi ${mi.icon}`} />{mi.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── Mobil Kart Görünümü ── */}
              <div className="d-md-none">
                {filtreliListe.map(k => {
                  const vb     = vadeBadge(k.vade_tarihi, k.durum)
                  const ad     = ARAMA_DURUM_META[k.arama_durumu] || ARAMA_DURUM_META.aranmadi
                  const om     = ONCELIK_META[k.oncelik]           || ONCELIK_META.normal
                  const kenari = kenariRenk(k.vade_tarihi, k.durum)
                  const pulse  = isPulse(k)
                  return (
                    <div
                      key={k.id}
                      className={`odm-mobil-kart${pulse ? ' odm-kritik-pulse' : ''}`}
                      style={{ borderLeftColor: kenari }}
                      onClick={() => setSecilenKayitId(k.id === secilenKayitId ? null : k.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
                        <div>
                          <div className="odm-firma">{k.firma_adi}</div>
                          <div className="odm-cari">{k.cari_adi}</div>
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: k.durum === 'tamamlandi' ? '#10b981' : 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums' }}>
                          {TL(k.tutar)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 11 }}>
                        {vb && <span className="odm-badge" style={{ background: vb.bg, color: vb.color }}>{vb.text}</span>}
                        <span className="odm-badge" style={{ background: om.bg, color: om.color }}>{om.label}</span>
                        <span className="odm-badge" style={{ background: ad.bg, color: ad.color }}>
                          <i className={`bi ${ad.icon}`} style={{ fontSize: 11 }} />{ad.label}
                        </span>
                      </div>
                      <div className="odm-aksiyon-grup" onClick={e => e.stopPropagation()}>
                        <button className="odm-icon-btn amber" style={{ width: 44, height: 44 }} onClick={() => modalAc(k)}>
                          <i className="bi bi-telephone" />
                        </button>
                        {k.durum !== 'tamamlandi' && (
                          <button className="odm-icon-btn emerald" style={{ width: 44, height: 44 }} onClick={(e) => tamamlaKayit(k.id, e)}>
                            <i className="bi bi-check-circle" />
                          </button>
                        )}
                        <button className="odm-icon-btn" style={{ width: 44, height: 44 }}>
                          <i className="bi bi-pencil" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            BÖLÜM 5 — Sağ Drawer (Detay Paneli)
            ═══════════════════════════════════════════════════════════ */}
        {secilenKayit && (
          <>
            <div className="odm-drawer-overlay" onClick={() => setSecilenKayitId(null)} />
            <div className="odm-drawer">
              {/* Drawer Header — gradient amber */}
              <div className="odm-drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(245,158,11,0.3)' }}>
                    <i className="bi bi-person-fill" style={{ color: '#fff', fontSize: 16 }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.28px' }}>
                      {secilenKayit.firma_adi}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{secilenKayit.cari_adi}</div>
                  </div>
                </div>
                <button className="odm-kapat-btn" onClick={() => setSecilenKayitId(null)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div className="odm-drawer-body">
                {/* Tutar Kutusu */}
                <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(245,158,11,0.7)', marginBottom: 6, fontWeight: 700 }}>
                    Bekleyen Tutar
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 800, color: '#f59e0b', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
                    {TL(secilenKayit.tutar)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {(() => {
                      const vb = vadeBadge(secilenKayit.vade_tarihi, secilenKayit.durum)
                      const ad = ARAMA_DURUM_META[secilenKayit.arama_durumu] || ARAMA_DURUM_META.aranmadi
                      return (
                        <>
                          {vb && <span className="odm-badge" style={{ background: vb.bg, color: vb.color }}>{vb.text}</span>}
                          <span className="odm-badge" style={{ background: ad.bg, color: ad.color }}>
                            <i className={`bi ${ad.icon}`} style={{ fontSize: 11 }} />{ad.label}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Vade + Telefon */}
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-calendar3" style={{ color: '#f59e0b' }} />
                  Vade: <strong style={{ color: '#fff' }}>{tarihStr(secilenKayit.vade_tarihi)}</strong>
                </div>
                {secilenKayit.telefon && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-telephone" style={{ color: '#f59e0b' }} />
                    <a href={`tel:${secilenKayit.telefon}`} style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
                      {secilenKayit.telefon}
                    </a>
                  </div>
                )}

                <button
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, padding: '12px', cursor: 'pointer', marginBottom: 22, boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
                  onClick={() => modalAc(secilenKayit)}
                >
                  <i className="bi bi-telephone-outbound" />
                  Arama Kaydı Ekle
                </button>

                {/* Arama Geçmişi */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 4, height: 16, borderRadius: 2, background: '#3b82f6' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Arama Geçmişi</span>
                </div>

                {secilenKayit.arama_gecmisi.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <i className="bi bi-telephone-minus" style={{ fontSize: 22, color: 'rgba(255,255,255,0.2)', display: 'block', marginBottom: 8 }} />
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Henüz arama yapılmadı</div>
                  </div>
                ) : (
                  <ul className="odm-timeline">
                    {secilenKayit.arama_gecmisi.map((a, i) => {
                      const meta = ARAMA_DURUM_META[a.sonuc] || ARAMA_DURUM_META.aranmadi
                      return (
                        <li key={i} className="odm-tl-item">
                          <div className="odm-tl-dot" style={{ background: meta.bg }}>
                            <i className={`bi ${meta.icon}`} style={{ fontSize: 12, color: meta.color }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{tarihStr(a.tarih)}</span>
                            </div>
                            {a.not && (
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                                {a.not}
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 6 — "Aradım" Modalı — Premium Gradient Header
          ═══════════════════════════════════════════════════════════ */}
      {aramaModali && (
        <div className="odm-modal-backdrop">
          <div className="odm-modal">

            {/* Gradient Header */}
            <div className="odm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.35)', flexShrink: 0 }}>
                  <i className="bi bi-telephone-outbound" style={{ color: '#fff', fontSize: 18 }} />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Arama Kaydı</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                    {aramaModali.firma_adi} — {aramaModali.cari_adi}
                  </div>
                </div>
              </div>
              <button className="odm-kapat-dark" onClick={() => { setAramaModaliId(null); resetModal() }}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Gövde */}
            <div className="odm-modal-body">
              {/* Section: Arama Sonucu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: '#f59e0b' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Arama Sonucu</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
                {ARAMA_SECENEKLERI.map(s => (
                  <button key={s.id} className={`odm-radio-kart${aramaSonucu === s.id ? ' selected' : ''}`} onClick={() => setAramaSonucu(s.id)}>
                    <span style={{ fontSize: 20 }}>{s.emoji}</span>
                    <span>{s.label}</span>
                    {aramaSonucu === s.id && <i className="bi bi-check-circle-fill ms-auto" style={{ color: '#f59e0b', fontSize: 15 }} />}
                  </button>
                ))}
              </div>

              {aramaSonucu === 'ertelendi' && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 4, height: 18, borderRadius: 2, background: '#3b82f6' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hatırlatıcı Tarihi</span>
                  </div>
                  <input type="date" className="odm-dark-field" value={hatirlaticiTarihi} onChange={e => setHatirlaticiTarihi(e.target.value)} min={bugunStr(1)} />
                </div>
              )}

              {/* Section: Not */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: '#3b82f6' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Not <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>(isteğe bağlı)</span>
                </span>
              </div>
              <textarea
                className="odm-dark-field"
                style={{ minHeight: 80, resize: 'vertical' }}
                placeholder="Söylediği şeyi buraya yaz..."
                value={aramaNotText}
                onChange={e => setAramaNotText(e.target.value)}
              />
            </div>

            {/* Yapışkan Footer */}
            <div className="odm-modal-footer">
              <button className="odm-btn-glass" onClick={() => { setAramaModaliId(null); resetModal() }}>İptal</button>
              <button
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 12, padding: '12px 24px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(245,158,11,0.3)', opacity: !aramaSonucu ? 0.5 : 1, fontFamily: 'Outfit, sans-serif' }}
                disabled={!aramaSonucu}
                onClick={aramaKaydet}
              >
                <i className="bi bi-check-lg" />
                Kaydet
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 7 — Yeni Kayıt Ekle Modalı
          ═══════════════════════════════════════════════════════════ */}
      {showYeniModal && (
        <>
          {/* Backdrop */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ position:'fixed', inset:0,
              background:'rgba(0,0,0,0.72)',
              backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
              zIndex:1040, animation:'kasaFadeIn 0.15s ease',
              display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
          >
            {/* Modal Kutu */}
            <div style={{ width:'100%', maxWidth:520, maxHeight:'90vh',
              display:'flex', flexDirection:'column',
              borderRadius:20, overflow:'hidden',
              background:'rgba(13,27,46,0.97)',
              backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)',
              border:'1px solid rgba(255,255,255,0.1)',
              boxShadow:'0 32px 80px rgba(0,0,0,0.55)',
              animation:'kasaSlideUp 0.25s ease' }}>

              {/* Gradient Header */}
              <div style={{ padding:'20px 24px',
                background:'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(5,150,105,0.07))',
                borderBottom:'2px solid rgba(16,185,129,0.35)',
                display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:12,
                    background:'linear-gradient(135deg,#10b981,#059669)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 4px 12px rgba(16,185,129,0.35)', flexShrink:0 }}>
                    <i className="bi bi-plus-circle-fill" style={{ color:'#fff', fontSize:18 }} />
                  </div>
                  <div>
                    <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>Yeni Kayıt Ekle</div>
                    <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)' }}>Tahsilat veya ödeme takibi</div>
                  </div>
                </div>
                <button
                  onClick={() => { setShowYeniModal(false); setYeniForm(BOSH_YENI_FORM); setYeniFormHata('') }}
                  style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
                    width:36, height:36, borderRadius:10, color:'rgba(255,255,255,0.6)',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              {/* Form Gövde */}
              <div style={{ padding:'22px 24px', overflowY:'auto', flex:1 }}>

                {/* Hata mesajı */}
                {yeniFormHata && (
                  <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
                    borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13,
                    color:'#ef4444', display:'flex', alignItems:'center', gap:8 }}>
                    <i className="bi bi-exclamation-circle" />
                    {yeniFormHata}
                  </div>
                )}

                {/* Bölüm 1: Firma Bilgileri */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <div style={{ width:4, height:18, borderRadius:2, background:'#10b981' }} />
                  <span style={{ fontSize:12, fontWeight:700, color:'#10b981', textTransform:'uppercase', letterSpacing:'0.06em' }}>Firma Bilgileri</span>
                </div>

                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>
                    Firma Adı <span style={{ color:'#ef4444' }}>*</span>
                  </label>
                  <input
                    value={yeniForm.firma_adi}
                    onChange={e => setYeniForm(p => ({ ...p, firma_adi: e.target.value }))}
                    placeholder="Firma veya kişi adı..."
                    style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                      borderRadius:10, color:'#fff', padding:'10px 14px', fontSize:14,
                      fontFamily:'Outfit, sans-serif', outline:'none', minHeight:44, boxSizing:'border-box' }}
                    onFocus={e => { e.target.style.borderColor='#10b981'; e.target.style.boxShadow='0 0 0 3px rgba(16,185,129,0.12)' }}
                    onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
                  />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>İlgili Kişi</label>
                    <input
                      value={yeniForm.ilgili_kisi}
                      onChange={e => setYeniForm(p => ({ ...p, ilgili_kisi: e.target.value }))}
                      placeholder="Ad Soyad..."
                      style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                        borderRadius:10, color:'#fff', padding:'10px 14px', fontSize:14,
                        fontFamily:'Outfit, sans-serif', outline:'none', minHeight:44, boxSizing:'border-box' }}
                      onFocus={e => { e.target.style.borderColor='#10b981'; e.target.style.boxShadow='0 0 0 3px rgba(16,185,129,0.12)' }}
                      onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>Telefon</label>
                    <input
                      value={yeniForm.telefon}
                      onChange={e => setYeniForm(p => ({ ...p, telefon: e.target.value }))}
                      placeholder="05xx xxx xx xx"
                      style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                        borderRadius:10, color:'#fff', padding:'10px 14px', fontSize:14,
                        fontFamily:'Outfit, sans-serif', outline:'none', minHeight:44, boxSizing:'border-box' }}
                      onFocus={e => { e.target.style.borderColor='#10b981'; e.target.style.boxShadow='0 0 0 3px rgba(16,185,129,0.12)' }}
                      onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
                    />
                  </div>
                </div>

                {/* Bölüm 2: İşlem Detayları */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, marginTop:6 }}>
                  <div style={{ width:4, height:18, borderRadius:2, background:'#3b82f6' }} />
                  <span style={{ fontSize:12, fontWeight:700, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.06em' }}>İşlem Detayları</span>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>
                      Yön <span style={{ color:'#ef4444' }}>*</span>
                    </label>
                    <select
                      value={yeniForm.yon}
                      onChange={e => setYeniForm(p => ({ ...p, yon: e.target.value }))}
                      style={{ width:'100%', background:'#0d1b2e', border:'1px solid rgba(255,255,255,0.1)',
                        borderRadius:10, color:'#fff', padding:'10px 14px', fontSize:14,
                        fontFamily:'Outfit, sans-serif', outline:'none', minHeight:44, boxSizing:'border-box', cursor:'pointer' }}
                      onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)' }}
                      onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
                    >
                      <option value="tahsilat">📥 Tahsilat (Alacak)</option>
                      <option value="odeme">📤 Ödeme (Borç)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>Tutar (₺)</label>
                    <input
                      value={yeniForm.tutar}
                      onChange={e => {
                        let v = e.target.value.replace(/[^0-9,.]/g, '')
                        const parts = v.split(',')
                        if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')
                        const [tam, kesir] = v.split(',')
                        const fmt = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                        setYeniForm(p => ({ ...p, tutar: kesir !== undefined ? fmt + ',' + kesir.slice(0,2) : fmt }))
                      }}
                      placeholder="0"
                      style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                        borderRadius:10, color:'#fff', padding:'10px 14px', fontSize:14,
                        fontFamily:'Inter, sans-serif', outline:'none', minHeight:44, boxSizing:'border-box', fontVariantNumeric:'tabular-nums' }}
                      onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)' }}
                      onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
                    />
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>
                      Vade Tarihi <span style={{ color:'#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={yeniForm.soz_tarihi}
                      onChange={e => setYeniForm(p => ({ ...p, soz_tarihi: e.target.value }))}
                      style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                        borderRadius:10, color:'#fff', padding:'10px 14px', fontSize:14,
                        fontFamily:'Outfit, sans-serif', outline:'none', minHeight:44, boxSizing:'border-box', colorScheme:'dark' }}
                      onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)' }}
                      onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>Öncelik</label>
                    <select
                      value={yeniForm.oncelik}
                      onChange={e => setYeniForm(p => ({ ...p, oncelik: e.target.value }))}
                      style={{ width:'100%', background:'#0d1b2e', border:'1px solid rgba(255,255,255,0.1)',
                        borderRadius:10, color:'#fff', padding:'10px 14px', fontSize:14,
                        fontFamily:'Outfit, sans-serif', outline:'none', minHeight:44, boxSizing:'border-box', cursor:'pointer' }}
                      onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)' }}
                      onBlur={e =>  { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
                    >
                      <option value="dusuk">🟢 Düşük</option>
                      <option value="normal">⚪ Normal</option>
                      <option value="yuksek">🟡 Yüksek</option>
                      <option value="kritik">🔴 Kritik</option>
                    </select>
                  </div>
                </div>

                {/* Önizleme */}
                {(yeniForm.firma_adi || yeniForm.tutar) && (
                  <div style={{ background:'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.03))',
                    border:'1px solid rgba(16,185,129,0.15)', borderRadius:14, padding:'14px 18px', marginTop:6 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'rgba(16,185,129,0.7)',
                      textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Kayıt Önizleme</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{yeniForm.firma_adi || '—'}</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
                          {yeniForm.yon === 'tahsilat' ? '📥 Tahsilat' : '📤 Ödeme'} · Vade: {yeniForm.soz_tarihi || '—'}
                        </div>
                      </div>
                      {yeniForm.tutar && (
                        <div style={{ fontFamily:'Inter, sans-serif', fontSize:16, fontWeight:800,
                          color: yeniForm.yon === 'tahsilat' ? '#10b981' : '#ef4444',
                          fontVariantNumeric:'tabular-nums' }}>
                          ₺{yeniForm.tutar}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Yapışkan Footer */}
              <div style={{ padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.08)',
                background:'rgba(13,27,46,0.98)', flexShrink:0, display:'flex', gap:10 }}>
                <button
                  onClick={() => { setShowYeniModal(false); setYeniForm(BOSH_YENI_FORM); setYeniFormHata('') }}
                  style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
                    color:'rgba(255,255,255,0.7)', borderRadius:12, padding:'12px', cursor:'pointer',
                    fontFamily:'Outfit, sans-serif', fontWeight:600, fontSize:14, minHeight:44 }}>
                  İptal
                </button>
                <button
                  onClick={yeniEkleKaydet}
                  disabled={yeniKaydetYukleniyor || !yeniForm.firma_adi.trim()}
                  style={{ flex:2, background:'linear-gradient(135deg,#10b981,#059669)',
                    color:'#fff', border:'none', borderRadius:12, padding:'12px',
                    fontFamily:'Outfit, sans-serif', fontWeight:700, fontSize:14, cursor:'pointer',
                    boxShadow:'0 4px 16px rgba(16,185,129,0.3)', minHeight:44,
                    opacity: (yeniKaydetYukleniyor || !yeniForm.firma_adi.trim()) ? 0.5 : 1,
                    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {yeniKaydetYukleniyor
                    ? <><div className="odm-spinner" style={{ width:16, height:16, borderWidth:2 }} />Kaydediliyor...</>
                    : <><i className="bi bi-check-lg" />Kaydet</>
                  }
                </button>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  )
}
