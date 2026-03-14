/**
 * Demo 3 — Executive Dark
 * İkas / Modern SaaS tarzı: Koyu lacivert sidebar, açık mavi-gri içerik,
 * Solid (glassmorphism değil), kurumsal, olgun, veri odaklı.
 */
import { useState } from 'react'

/* ─── Mock Veri ─────────────────────────────────────── */
const cekler = [
  { id: 1, firma: 'Demir-Çelik A.Ş.',   tutar: 85000,  vade: '18 Mar 2026', gun: 4,  durum: 'Aktif'        },
  { id: 2, firma: 'İnşaat Malz. Ltd.',  tutar: 42500,  vade: '22 Mar 2026', gun: 8,  durum: 'Tahsilde'     },
  { id: 3, firma: 'Çelik Boru San.',    tutar: 31200,  vade: '25 Mar 2026', gun: 11, durum: 'Aktif'        },
  { id: 4, firma: 'Yapı Malz. Tic.',    tutar: 18750,  vade: '10 Mar 2026', gun: -4, durum: 'Vadesi Geçti' },
  { id: 5, firma: 'Hırdavat Dünyası',  tutar: 10850,  vade: '05 Nis 2026', gun: 22, durum: 'Aktif'        },
]

const aktiviteler = [
  { tip: 'cek',   aciklama: 'Yeni çek eklendi',           firma: 'Demir-Çelik A.Ş.',  zaman: '14:32', renk: '#10b981' },
  { tip: 'kasa',  aciklama: 'Kasa girişi kaydedildi',     firma: 'Açık Hesap',         zaman: '12:18', renk: '#3b82f6' },
  { tip: 'odeme', aciklama: 'Tedarikçi ödemesi yapıldı',  firma: 'Boru San. Ltd.',     zaman: '09:45', renk: '#f59e0b' },
  { tip: 'cari',  aciklama: 'Cari hesap güncellendi',     firma: 'Yapı Malz. Tic.',   zaman: 'Dün',   renk: '#8b5cf6' },
]

const menuler = [
  { ikon: 'bi-speedometer2',      etiket: 'Dashboard',      aktif: true,  badge: null },
  { ikon: 'bi-people',            etiket: 'Cari Hesaplar',  aktif: false, badge: null },
  { ikon: 'bi-file-earmark-text', etiket: 'Çek/Senet',      aktif: false, badge: '14' },
  { ikon: 'bi-credit-card',       etiket: 'Ödemeler',       aktif: false, badge: '3'  },
  { ikon: 'bi-safe',              etiket: 'Varlık & Kasa',  aktif: false, badge: null },
]

const TL = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Math.abs(n))
const bugun = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

const durum_cfg = {
  'Aktif':        { bg: '#f0fdf4', renk: '#166534', border: '#bbf7d0' },
  'Tahsilde':     { bg: '#eff6ff', renk: '#1d4ed8', border: '#bfdbfe' },
  'Vadesi Geçti': { bg: '#fff1f2', renk: '#9f1239', border: '#fecdd3' },
}

/* ─── Ana Bileşen ───────────────────────────────────── */
export default function Demo3() {
  const [sidebarAcik, setSidebarAcik] = useState(false)
  const [aktifTab, setAktifTab]       = useState('tumu')
  const [modalAcik, setModalAcik]     = useState(false)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');

        .d3-root * { box-sizing: border-box; }
        .d3-root {
          font-family: 'Outfit', -apple-system, sans-serif;
          letter-spacing: -0.01em;
        }
        .d3-mono {
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          letter-spacing: -0.02em;
        }

        /* Hero Kartlar (3'lü üst bant) */
        .d3-hero {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.7);
          box-shadow: 0 4px 20px rgba(13,27,46,0.07), 0 0 0 1px rgba(255,255,255,0.5) inset;
          padding: 22px 24px; position: relative; overflow: hidden;
          transition: box-shadow 0.22s ease, transform 0.22s ease;
        }
        .d3-hero:hover {
          box-shadow: 0 8px 32px rgba(13,27,46,0.12), 0 0 0 1px rgba(255,255,255,0.7) inset;
          transform: translateY(-2px);
        }
        .d3-hero-icon {
          position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(13,27,46,0.04);
          border: 1px solid rgba(13,27,46,0.06);
        }

        /* Sidebar Nav */
        .d3-nav-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 8px; cursor: pointer;
          font-size: 13.5px; font-weight: 500;
          color: rgba(255,255,255,0.5);
          transition: all 0.16s ease;
          border: none; background: transparent; width: 100%; text-align: left;
        }
        .d3-nav-btn:hover {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.85);
        }
        .d3-nav-btn.aktif {
          background: rgba(255,255,255,0.92);
          color: #0d1b2e;
          font-weight: 700;
        }
        .d3-nav-btn.aktif i { color: #0d1b2e !important; }

        /* KPI Kartlar — Glass Premium */
        .d3-kpi {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.65);
          box-shadow:
            0 4px 24px rgba(13,27,46,0.08),
            0 0 0 1px rgba(255,255,255,0.5) inset,
            0 1px 0 rgba(255,255,255,0.9) inset;
          padding: 24px; position: relative; overflow: hidden;
          transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
        }
        .d3-kpi::before {
          content: ''; position: absolute; top: -30px; right: -30px;
          width: 100px; height: 100px; border-radius: 50%;
          background: radial-gradient(circle, var(--kpi-accent, #10b981) 0%, transparent 70%);
          opacity: 0.06; pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .d3-kpi::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--kpi-accent, #10b981), transparent);
          opacity: 0; transition: opacity 0.25s ease;
        }
        .d3-kpi:hover {
          background: rgba(255,255,255,0.72);
          box-shadow:
            0 12px 40px rgba(13,27,46,0.14),
            0 0 0 1px rgba(255,255,255,0.7) inset,
            0 1px 0 rgba(255,255,255,1) inset;
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.8);
        }
        .d3-kpi:hover::before { opacity: 0.12; }
        .d3-kpi:hover::after { opacity: 1; }

        /* Modal */
        .d3-modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(13,27,46,0.45); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: d3ModalBgIn 0.2s ease;
        }
        @keyframes d3ModalBgIn { from { opacity: 0; } to { opacity: 1; } }
        .d3-modal {
          background: #fff; border-radius: 18px; width: 100%; max-width: 520px;
          box-shadow: 0 20px 60px rgba(13,27,46,0.25), 0 0 0 1px rgba(226,233,244,0.6);
          animation: d3ModalIn 0.25s ease;
          max-height: 90vh; overflow-y: auto;
        }
        @keyframes d3ModalIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .d3-input {
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1.5px solid #e2e9f4; background: #f8fafd;
          font-size: 14px; font-family: inherit; color: #0d1b2e;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          outline: none; min-height: 44px;
        }
        .d3-input:focus {
          border-color: #0d1b2e; box-shadow: 0 0 0 3px rgba(13,27,46,0.08);
          background: #fff;
        }
        .d3-input::placeholder { color: #94a3b8; }
        .d3-select {
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1.5px solid #e2e9f4; background: #f8fafd;
          font-size: 14px; font-family: inherit; color: #0d1b2e;
          outline: none; min-height: 44px; cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
        }
        .d3-select:focus { border-color: #0d1b2e; box-shadow: 0 0 0 3px rgba(13,27,46,0.08); }
        .d3-btn-primary {
          background: #0d1b2e; color: #fff; border: none; border-radius: 10px;
          padding: 12px 24px; font-size: 14px; font-weight: 700;
          font-family: inherit; cursor: pointer; min-height: 44px;
          transition: all 0.15s ease; display: inline-flex; align-items: center; gap: 8px;
        }
        .d3-btn-primary:hover { background: #162d4a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(13,27,46,0.2); }
        .d3-btn-secondary {
          background: transparent; color: #64748b; border: 1.5px solid #e2e9f4; border-radius: 10px;
          padding: 12px 24px; font-size: 14px; font-weight: 600;
          font-family: inherit; cursor: pointer; min-height: 44px;
          transition: all 0.15s ease;
        }
        .d3-btn-secondary:hover { border-color: #94a3b8; color: #0d1b2e; }

        /* İçerik Kart — Glass */
        .d3-panel {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.65);
          box-shadow: 0 4px 20px rgba(13,27,46,0.07), 0 0 0 1px rgba(255,255,255,0.4) inset;
          overflow: hidden;
        }
        .d3-panel-header {
          padding: 16px 20px; border-bottom: 1px solid #f1f5fb;
          display: flex; align-items: center; justify-content: space-between;
        }

        /* Tablo */
        .d3-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .d3-table th {
          font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.07em;
          color: #94a3b8; font-weight: 700; padding: 11px 16px;
          background: #f8fafd; border-bottom: 1px solid #edf2f7;
        }
        .d3-table td { padding: 13px 16px; border-bottom: 1px solid #f5f8fd; vertical-align: middle; }
        .d3-table tbody tr { transition: background 0.12s ease; }
        .d3-table tbody tr:hover { background: #f5f8fd; }
        .d3-table tbody tr:last-child td { border-bottom: none; }

        /* Badge */
        .d3-badge {
          display: inline-flex; align-items: center;
          padding: 3px 9px; border-radius: 6px; font-size: 0.71rem; font-weight: 700;
          border: 1px solid transparent;
        }

        /* Tab */
        .d3-tab {
          padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 500;
          border: none; cursor: pointer; transition: all 0.15s ease;
          background: transparent; color: #64748b;
        }
        .d3-tab:hover { background: #f0f4fa; color: #0d1b2e; }
        .d3-tab.aktif { background: #0d1b2e; color: #fff; font-weight: 600; }

        /* Overlay & Mobile Sidebar */
        .d3-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 40; display: none; }
        .d3-overlay.acik { display: block; }
        .d3-mob-sb {
          position: fixed; top: 0; left: 0; height: 100vh; width: 256px;
          background: #0d1b2e; z-index: 50; transform: translateX(-100%);
          transition: transform 0.25s ease; overflow-y: auto; padding: 24px 16px;
        }
        .d3-mob-sb.acik { transform: translateX(0); }

        /* Aktivite dot */
        .d3-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
        }

        /* Progress bar */
        .d3-prog-track {
          height: 5px; background: rgba(13,27,46,0.06); border-radius: 10px; overflow: hidden;
        }
        .d3-prog-bar { height: 100%; border-radius: 10px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }

        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .d3-fade { animation: fadeIn 0.35s ease both; }
        .d3-fade-1 { animation-delay: 0.05s; }
        .d3-fade-2 { animation-delay: 0.1s; }
        .d3-fade-3 { animation-delay: 0.15s; }
        .d3-fade-4 { animation-delay: 0.2s; }

        /* Mobil kart görünümü: tablo gizle, kartlar göster */
        .d3-table-desktop { display: table; }
        .d3-cards-mobile { display: none; }

        @media (min-width: 992px) {
          .d3-mob-header { display: none !important; }
          .d3-desk-sb { display: flex !important; }
          .d3-mob-sb, .d3-overlay { display: none !important; }
        }
        @media (max-width: 991px) {
          .d3-desk-sb { display: none !important; }
          .d3-mob-header { display: flex !important; }
        }
        @media (max-width: 767px) {
          .d3-table-desktop { display: none !important; }
          .d3-cards-mobile { display: flex !important; flex-direction: column; }
        }
        .d3-mobile-card {
          padding: 14px 18px; border-bottom: 1px solid #f1f5fb;
          transition: background 0.13s ease;
        }
        .d3-mobile-card:last-child { border-bottom: none; }
        .d3-mobile-card:hover { background: #f5f8fd; }
      `}</style>

      <div className="d3-root" style={{
        display: 'flex', minHeight: '100vh',
        background: 'linear-gradient(135deg, #eef2f9 0%, #f0f4fa 40%, #f4f1f8 100%)',
      }}>

        {/* ─── Desktop Sidebar ───────────────────────────── */}
        <aside
          className="d3-desk-sb"
          style={{
            width: 256, background: '#0d1b2e',
            flexDirection: 'column', flexShrink: 0,
            position: 'sticky', top: 0, height: '100vh',
            overflowY: 'auto', padding: '24px 14px',
          }}
        >
          <Sidebar3 />
        </aside>

        {/* ─── Mobile ──────────────────────────────────── */}
        <div className={`d3-overlay ${sidebarAcik ? 'acik' : ''}`} onClick={() => setSidebarAcik(false)} />
        <div className={`d3-mob-sb ${sidebarAcik ? 'acik' : ''}`}><Sidebar3 /></div>

        {/* ─── Ana İçerik ──────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Mobile Header */}
          <header className="d3-mob-header" style={{
            background: '#0d1b2e', height: 58, padding: '0 18px',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#0d1b2e' }}>FK</div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Finans Kalesi</span>
            </div>
            <button onClick={() => setSidebarAcik(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>
              <i className="bi bi-list" />
            </button>
          </header>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px' }}>

            {/* Breadcrumb + Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Finans Kalesi</span>
                  <i className="bi bi-chevron-right" style={{ fontSize: 10, color: '#cbd5e1' }} />
                  <span style={{ fontSize: 12, color: '#0d1b2e', fontWeight: 600 }}>Dashboard</span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0d1b2e', margin: 0, letterSpacing: '-0.4px' }}>
                  Genel Bakış
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{bugun}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, color: '#fff',
                }}>KD</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0d1b2e' }}>Kaan Doğan</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Yönetici</div>
                </div>
              </div>
            </div>

            {/* ─── Hero Kartlar (3'lü üst bant) ────────────── */}
            <div className="row g-3 mb-3">
              {[
                {
                  etiket: 'Şirketin Net Değeri (Varlık)',
                  tutar: 23209565,
                  alt: 'Tüm varlıklar (stok+nakit) eksi tüm borçlar.',
                  renk: '#10b981',
                  ikon: 'bi-gem',
                },
                {
                  etiket: 'Acil Nakit Gücü (Likidite)',
                  tutar: 10233362.91,
                  alt: 'Kasa + Banka + Canlı Yatırım Karşılığı.',
                  renk: '#06b6d4',
                  ikon: 'bi-lightning-charge-fill',
                },
                {
                  etiket: 'Piyasa Net Pozisyonu',
                  tutar: 3460000,
                  alt: 'Son aya göre (Alacaklarımız − Borçlarımız)',
                  renk: '#f59e0b',
                  ikon: 'bi-globe2',
                  prefix: '+',
                },
              ].map((h, i) => (
                <div key={i} className={`col-12 col-lg-4 d3-fade d3-fade-${i + 1}`}>
                  <div className="d3-hero">
                    <div className="d3-hero-icon">
                      <i className={`bi ${h.ikon}`} style={{ fontSize: 22, color: h.renk }} />
                    </div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 600, marginBottom: 8, paddingRight: 60 }}>
                      {h.etiket}
                    </div>
                    <div className="d3-mono" style={{ fontSize: '1.65rem', fontWeight: 700, color: h.renk, lineHeight: 1.1, marginBottom: 6 }}>
                      {h.prefix || ''}{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(h.tutar)} ₺
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, paddingRight: 60 }}>
                      <i className="bi bi-info-circle" style={{ fontSize: 11 }} />
                      {h.alt}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── Operasyonel Ritim ─────────────────────────── */}
            <div className="d3-panel mb-4" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <i className="bi bi-activity" style={{ fontSize: 18, color: '#f59e0b' }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0d1b2e' }}>Bu Ayki Operasyonel Ritim</span>
              </div>
              <div className="row g-4">
                <div className="col-12 col-md-6">
                  <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Giren (Ciro):</span>
                    <span className="d3-mono" style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>3.809.425,00 ₺</span>
                  </div>
                  <div className="d3-prog-track" style={{ height: 8, marginBottom: 4 }}>
                    <div className="d3-prog-bar" style={{ width: '72%', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Seçili Dönem Net Kalan:</span>
                    <span className="d3-mono" style={{ fontSize: 14, fontWeight: 700, color: '#0d1b2e' }}>1.245.830,00 ₺</span>
                  </div>
                  <div className="d3-prog-track" style={{ height: 8, marginBottom: 4 }}>
                    <div className="d3-prog-bar" style={{ width: '45%', background: 'linear-gradient(90deg, #0d1b2e, #1e3a5f)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Kartlar */}
            <div className="row g-3 mb-4">
              {[
                { etiket: 'Toplam Alacak',  tutar: 342800, renk: '#10b981', ikon: 'bi-arrow-down-circle', trend: '+%8,4', trendPos: true,  alt: 'Geçen aya göre', pct: 78 },
                { etiket: 'Toplam Borç',    tutar: 127450, renk: '#ef4444', ikon: 'bi-arrow-up-circle',   trend: '-%2,1', trendPos: false, alt: 'Geçen aya göre', pct: 38 },
                { etiket: 'Portföy Çek',    tutar: 188300, renk: '#f59e0b', ikon: 'bi-file-earmark-text', trend: '14 adet', trendPos: null,  alt: 'Aktif çek',     pct: 60 },
                { etiket: 'Kasa Bakiyesi',  tutar: 54200,  renk: '#6366f1', ikon: 'bi-safe',              trend: 'Güncel', trendPos: null,  alt: 'Bugün güncellendi', pct: 22 },
              ].map((k, i) => (
                <div key={i} className={`col-12 col-sm-6 col-xl-3 d3-fade d3-fade-${i + 1}`}>
                  <div className="d3-kpi" style={{ '--kpi-accent': k.renk, borderTop: `3px solid ${k.renk}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                      <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', fontWeight: 600 }}>
                        {k.etiket}
                      </span>
                      <div style={{
                        width: 38, height: 38, borderRadius: 12,
                        background: `rgba(255,255,255,0.6)`,
                        backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid rgba(255,255,255,0.8)`,
                        boxShadow: `0 2px 8px ${k.renk}18`,
                      }}>
                        <i className={`bi ${k.ikon}`} style={{ color: k.renk, fontSize: 17 }} />
                      </div>
                    </div>
                    <div className="d3-mono" style={{ fontSize: '2.2rem', fontWeight: 700, color: '#0d1b2e', lineHeight: 1.05, marginBottom: 6 }}>
                      {TL(k.tutar)}
                    </div>
                    {/* Trend satırı */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      {k.trendPos !== null && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          background: k.trendPos ? '#f0fdf4' : '#fff1f2',
                          border: k.trendPos ? '1px solid #bbf7d0' : '1px solid #fecdd3',
                          borderRadius: 20, padding: '2px 8px',
                          fontSize: 11, fontWeight: 700,
                          color: k.trendPos ? '#059669' : '#ef4444',
                        }}>
                          <i className={`bi ${k.trendPos ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}`} style={{ fontSize: 14 }} />
                          {k.trend}
                        </span>
                      )}
                      {k.trendPos === null && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{k.trend}</span>
                      )}
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{k.alt}</span>
                    </div>
                    {/* Progress */}
                    <div className="d3-prog-track">
                      <div className="d3-prog-bar" style={{ width: `${k.pct}%`, background: `linear-gradient(90deg, ${k.renk}, ${k.renk}aa)` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tab + Tablo */}
            <div className="d3-panel mb-3">
              <div className="d3-panel-header" style={{ flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0d1b2e' }}>Çek & Senetler</span>
                  <span style={{
                    background: '#f0f4fa', borderRadius: 6, padding: '2px 8px',
                    fontSize: 11, fontWeight: 700, color: '#64748b',
                  }}>5 kayıt</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {['tumu', 'aktif', 'vadede'].map(t => (
                    <button
                      key={t}
                      className={`d3-tab ${aktifTab === t ? 'aktif' : ''}`}
                      onClick={() => setAktifTab(t)}
                    >
                      {t === 'tumu' ? 'Tümü' : t === 'aktif' ? 'Aktif' : 'Yaklaşan'}
                    </button>
                  ))}
                  <button className="d3-btn-primary" style={{ padding: '7px 14px', fontSize: 13, borderRadius: 8 }} onClick={() => setModalAcik(true)}>
                    <i className="bi bi-plus-lg" style={{ fontSize: 12 }} /> Yeni Çek
                  </button>
                </div>
              </div>
              {/* Masaüstü: Tablo */}
              <table className="d3-table d3-table-desktop">
                <thead>
                  <tr>
                    <th>Firma Adı</th>
                    <th style={{ textAlign: 'right' }}>Tutar</th>
                    <th>Vade Tarihi</th>
                    <th>Kalan Gün</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {cekler.map((c) => {
                    const ds = durum_cfg[c.durum]
                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 9, background: '#f0f4fa',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: 12, color: '#0d1b2e', flexShrink: 0,
                            }}>
                              {c.firma.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#0d1b2e' }}>{c.firma}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>Çek #{1000 + c.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="d3-mono" style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b2e', fontSize: 14 }}>
                          {TL(c.tutar)}
                        </td>
                        <td style={{ color: '#475569', fontSize: 13 }}>{c.vade}</td>
                        <td>
                          <span style={{
                            fontWeight: 700, fontSize: 13,
                            color: c.gun < 0 ? '#ef4444' : c.gun <= 7 ? '#f59e0b' : '#64748b',
                          }}>
                            {c.gun < 0 ? `${Math.abs(c.gun)} gün geçti` : `${c.gun} gün`}
                          </span>
                        </td>
                        <td>
                          <span className="d3-badge" style={{
                            background: ds.bg, color: ds.renk, borderColor: ds.border,
                          }}>
                            {c.durum}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Mobil: Kart Görünümü */}
              <div className="d3-cards-mobile" style={{ display: 'none' }}>
                {cekler.map((c) => {
                  const ds = durum_cfg[c.durum]
                  return (
                    <div key={c.id} className="d3-mobile-card">
                      {/* Üst satır: Firma + Durum */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 9, background: '#f0f4fa',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 13, color: '#0d1b2e', flexShrink: 0,
                          }}>
                            {c.firma.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0d1b2e' }}>{c.firma}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Çek #{1000 + c.id}</div>
                          </div>
                        </div>
                        <span className="d3-badge" style={{
                          background: ds.bg, color: ds.renk, borderColor: ds.border,
                        }}>
                          {c.durum}
                        </span>
                      </div>
                      {/* Alt satır: Tutar + Vade + Kalan gün */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 46 }}>
                        <span className="d3-mono" style={{ fontWeight: 700, fontSize: 16, color: '#0d1b2e' }}>{TL(c.tutar)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{c.vade}</span>
                          <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: c.gun < 0 ? '#ef4444' : c.gun <= 7 ? '#f59e0b' : '#94a3b8',
                          }}>
                            {c.gun < 0 ? `${Math.abs(c.gun)} gün geçti` : `${c.gun} gün`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Alt: Aktivite + Mini İstatistik */}
            <div className="row g-3">
              {/* Son Aktivite */}
              <div className="col-12 col-lg-6">
                <div className="d3-panel">
                  <div className="d3-panel-header">
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0d1b2e' }}>
                      <i className="bi bi-activity" style={{ marginRight: 8, color: '#6366f1' }} />
                      Son Aktiviteler
                    </span>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    {aktiviteler.map((a, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 14, padding: '12px 20px',
                        borderBottom: i < aktiviteler.length - 1 ? '1px solid #f5f8fd' : 'none',
                      }}>
                        <div className="d3-dot" style={{ background: a.renk, marginTop: 5 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2e' }}>{a.aciklama}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{a.firma}</div>
                        </div>
                        <span style={{ fontSize: 11, color: '#cbd5e1', flexShrink: 0 }}>{a.zaman}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modül Özet */}
              <div className="col-12 col-lg-6">
                <div className="d3-panel">
                  <div className="d3-panel-header">
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0d1b2e' }}>
                      <i className="bi bi-bar-chart" style={{ marginRight: 8, color: '#f59e0b' }} />
                      Modül Doluluk
                    </span>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                      { etiket: 'Tahsildeki Çekler', deger: 78, renk: '#10b981', tutar: '₺188K' },
                      { etiket: 'Açık Cariler',      deger: 55, renk: '#3b82f6', tutar: '42 cari' },
                      { etiket: 'Bekleyen Ödemeler', deger: 34, renk: '#f59e0b', tutar: '8 ödeme' },
                      { etiket: 'Kasa Doluluk',      deger: 22, renk: '#6366f1', tutar: '₺54K' },
                    ].map((b, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{b.etiket}</span>
                          <span className="d3-mono" style={{ fontSize: 13, fontWeight: 700, color: '#0d1b2e' }}>{b.tutar}</span>
                        </div>
                        <div className="d3-prog-track">
                          <div className="d3-prog-bar" style={{ width: `${b.deger}%`, background: b.renk }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── Modal: Yeni Çek Ekle ─────────────────────── */}
      {modalAcik && (
        <div className="d3-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalAcik(false) }}>
          <div className="d3-modal">
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #f1f5fb',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0d1b2e', margin: 0 }}>Yeni Çek / Senet Ekle</h2>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, marginTop: 2 }}>Çek veya senet bilgilerini girin</p>
              </div>
              <button
                onClick={() => setModalAcik(false)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#f8fafd', border: '1px solid #e2e9f4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748b', fontSize: 18,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecdd3' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafd'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e9f4' }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 24px 8px' }}>
              {/* Tip seçimi */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {['Çek', 'Senet'].map(tip => (
                  <button key={tip} style={{
                    flex: 1, padding: '10px 16px', borderRadius: 10,
                    border: tip === 'Çek' ? '2px solid #0d1b2e' : '1.5px solid #e2e9f4',
                    background: tip === 'Çek' ? '#0d1b2e' : '#fff',
                    color: tip === 'Çek' ? '#fff' : '#64748b',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s ease',
                    minHeight: 44,
                  }}>
                    <i className={`bi ${tip === 'Çek' ? 'bi-file-earmark-text' : 'bi-file-earmark'}`} style={{ marginRight: 8 }} />
                    {tip}
                  </button>
                ))}
              </div>

              {/* Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Firma / Cari
                  </label>
                  <input className="d3-input" placeholder="Firma adı veya cari seçin" />
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Tutar (₺)
                    </label>
                    <input className="d3-input" placeholder="0,00" style={{ textAlign: 'right', fontWeight: 700 }} />
                  </div>
                  <div className="col-6">
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Vade Tarihi
                    </label>
                    <input className="d3-input" type="date" />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Yön
                  </label>
                  <select className="d3-select">
                    <option>Portföydeki (Bize verilen)</option>
                    <option>Kendi Çekimiz (Verdiğimiz)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Açıklama (Opsiyonel)
                  </label>
                  <input className="d3-input" placeholder="Çek ile ilgili not girin..." />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 24px', borderTop: '1px solid #f1f5fb',
              display: 'flex', justifyContent: 'flex-end', gap: 10,
              marginTop: 16,
            }}>
              <button className="d3-btn-secondary" onClick={() => setModalAcik(false)}>
                İptal
              </button>
              <button className="d3-btn-primary" onClick={() => setModalAcik(false)}>
                <i className="bi bi-check2" style={{ fontSize: 16 }} />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Sidebar ────────────────────────────────────────── */
function Sidebar3() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 48px)' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 30, paddingLeft: 2 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: '#f59e0b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 14, color: '#0d1b2e', flexShrink: 0,
        }}>FK</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14.5, lineHeight: 1.2 }}>Finans Kalesi</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10.5 }}>Yönetim Paneli</div>
        </div>
      </div>

      {/* Menü Label */}
      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.22)', fontWeight: 700, padding: '0 14px 8px', marginBottom: 2 }}>
        Modüller
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {menuler.map((m) => (
          <button key={m.etiket} className={`d3-nav-btn ${m.aktif ? 'aktif' : ''}`}>
            <i className={`bi ${m.ikon}`} style={{ fontSize: 15, width: 17, textAlign: 'center', color: m.aktif ? '#0d1b2e' : 'inherit' }} />
            <span style={{ flex: 1 }}>{m.etiket}</span>
            {m.badge && (
              <span style={{
                background: m.aktif ? '#0d1b2e' : 'rgba(255,255,255,0.12)',
                color: m.aktif ? '#fff' : 'rgba(255,255,255,0.7)',
                borderRadius: 20, padding: '1px 7px',
                fontSize: 10, fontWeight: 700,
              }}>{m.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />

      {/* Ayarlar & Destek */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
        <button className="d3-nav-btn">
          <i className="bi bi-gear" style={{ fontSize: 15, width: 17, textAlign: 'center' }} />
          Ayarlar
        </button>
        <button className="d3-nav-btn">
          <i className="bi bi-question-circle" style={{ fontSize: 15, width: 17, textAlign: 'center' }} />
          Destek
        </button>
      </div>

      {/* Kullanıcı */}
      <div style={{
        background: 'rgba(255,255,255,0.06)', borderRadius: 10,
        padding: '12px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 12, color: '#fff', flexShrink: 0,
        }}>KD</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Kaan Doğan</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Yönetici</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4, fontSize: 15 }} title="Çıkış">
          <i className="bi bi-box-arrow-right" />
        </button>
      </div>

    </div>
  )
}
