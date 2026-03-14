import { useState } from "react";

/* ─────────────────────────────────────────────
   Finans Kalesi · Tasarım Demo v4
   Glassmorphism — Orta Lacivert + Belirgin Cam
───────────────────────────────────────────── */

const STYLES = `
  .fk4-root *, .fk4-root *::before, .fk4-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }

  /* ── Sayfa Zemini ── */
  .fk4-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    background:
      radial-gradient(ellipse at 10% 5%,  rgba(99,179,255,0.22) 0%, transparent 45%),
      radial-gradient(ellipse at 88% 20%, rgba(56,132,255,0.18) 0%, transparent 40%),
      radial-gradient(ellipse at 55% 85%, rgba(80,160,255,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 3%  75%, rgba(100,140,255,0.12) 0%, transparent 40%),
      linear-gradient(160deg, #1b3a62 0%, #2657a3 30%, #1e3f78 65%, #18345a 100%);
    background-attachment: fixed;
    color: #fff;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Cam Utility ── */
  .gc {
    background: rgba(255,255,255,0.14);
    -webkit-backdrop-filter: blur(24px) saturate(200%);
    backdrop-filter: blur(24px) saturate(200%);
    border: 1px solid rgba(255,255,255,0.26);
    box-shadow: 0 8px 32px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.18);
  }
  .gc-lite {
    background: rgba(255,255,255,0.08);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.16);
  }
  .gc-dark {
    background: rgba(0,0,0,0.22);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.10);
  }

  /* ── Header ── */
  .fk4-header {
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.12);
    display: flex; align-items: center; gap: 12px;
    position: sticky; top: 0; z-index: 100;
    background: rgba(24,52,90,0.75);
    -webkit-backdrop-filter: blur(24px);
    backdrop-filter: blur(24px);
  }
  .fk4-logo {
    width: 36px; height: 36px; border-radius: 11px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 900; color: #fff; flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(59,130,246,0.4);
    border: 1px solid rgba(255,255,255,0.25);
  }
  .fk4-htitle { font-size: 15px; font-weight: 800; color: #fff; line-height: 1; }
  .fk4-hsub   { font-size: 11px; color: rgba(255,255,255,0.45); font-weight: 500; margin-top: 2px; }
  .fk4-chip {
    margin-left: auto;
    background: rgba(245,158,11,0.15);
    border: 1px solid rgba(245,158,11,0.35);
    color: #fbbf24; font-size: 10px; font-weight: 700;
    padding: 3px 10px; border-radius: 50px;
    letter-spacing: 0.06em; text-transform: uppercase;
  }

  /* ── İçerik ── */
  .fk4-body { padding: 22px 16px 48px; max-width: 540px; margin: 0 auto; }

  /* ── Selamlama ── */
  .fk4-greet { margin-bottom: 20px; }
  .fk4-glabel { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 3px; }
  .fk4-gname  { font-size: 23px; font-weight: 800; color: #fff; letter-spacing: -0.025em; line-height: 1.1; }
  .fk4-gname span { color: #93c5fd; }

  /* ── Section Başlık ── */
  .fk4-sh { display: flex; align-items: center; justify-content: space-between; margin-bottom: 11px; margin-top: 26px; }
  .fk4-sh:first-of-type { margin-top: 0; }
  .fk4-sh-t { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.8); letter-spacing: -0.01em; }
  .fk4-sh-a { font-size: 12px; font-weight: 600; color: #93c5fd; text-decoration: none; display: flex; align-items: center; gap: 2px; }

  /* ── Net Pozisyon ── */
  .fk4-net {
    border-radius: 20px; padding: 18px 20px; margin-bottom: 22px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .fk4-nl  { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .fk4-na  { font-size: 30px; font-weight: 900; color: #4ade80; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; line-height: 1; }
  .fk4-ns  { font-size: 11px; color: rgba(255,255,255,0.38); font-weight: 500; margin-top: 3px; }
  .fk4-np  { display: inline-flex; align-items: center; gap: 3px; padding: 5px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; background: rgba(74,222,128,0.16); color: #4ade80; border: 1px solid rgba(74,222,128,0.28); }
  .fk4-nr  { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
  .fk4-nsub { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 600; }

  /* ── KPI Grid ── */
  .fk4-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .fk4-kpi {
    border-radius: 18px; padding: 15px; position: relative; overflow: hidden;
    transition: transform 0.22s ease, box-shadow 0.22s ease;
    cursor: default;
  }
  .fk4-kpi:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.28) !important; }
  .fk4-kpi::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px; background: var(--ac); border-radius: 0 0 18px 18px;
  }
  .fk4-kpi::before {
    content: ''; position: absolute; top: -24px; right: -16px;
    width: 70px; height: 70px; border-radius: 50%;
    background: rgba(255,255,255,0.05); pointer-events: none;
  }
  .fk4-ktop { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 11px; }
  .fk4-klbl { font-size: 10px; font-weight: 700; color: var(--lc); letter-spacing: 0.05em; text-transform: uppercase; line-height: 1.3; padding-right: 6px; }
  .fk4-kico { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; background: var(--ib); color: var(--ic); }
  .fk4-kamt { font-size: 21px; font-weight: 900; color: #fff; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; line-height: 1; margin-bottom: 7px; }
  .fk4-ktrend { display: inline-flex; align-items: center; gap: 2px; padding: 2px 8px; border-radius: 50px; font-size: 11px; font-weight: 700; background: var(--tb); color: var(--tc); }
  .fk4-ksub  { font-size: 10px; color: var(--sc); font-weight: 600; margin-top: 5px; }

  /* ── Tabs ── */
  .fk4-tw { overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .fk4-tw::-webkit-scrollbar { display: none; }
  .fk4-tabs { display: flex; gap: 4px; padding: 5px; border-radius: 14px; width: max-content; min-width: 100%; }
  .fk4-tab {
    padding: 9px 16px; border-radius: 10px;
    font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.48);
    background: transparent; border: none; cursor: pointer; white-space: nowrap;
    transition: all 0.2s ease; min-height: 44px;
    display: flex; align-items: center; gap: 6px;
  }
  .fk4-tab:hover:not(.active) { color: rgba(255,255,255,0.78); background: rgba(255,255,255,0.07); }
  .fk4-tab.active {
    background: rgba(255,255,255,0.18);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.28);
    box-shadow: 0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
  }
  .fk4-tc { min-width: 18px; height: 18px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; padding: 0 4px; }
  .fk4-tab.active .fk4-tc { background: rgba(255,255,255,0.2); color: #fff; }
  .fk4-tab:not(.active) .fk4-tc { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.55); }

  /* ── Tablo ── */
  .fk4-tcard { border-radius: 18px; overflow: hidden; margin-top: 10px; }
  .fk4-tw2   { overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .fk4-tw2::-webkit-scrollbar { display: none; }
  .fk4-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
  .fk4-tbl thead tr { border-bottom: 1px solid rgba(255,255,255,0.10); }
  .fk4-tbl thead th { padding: 11px 14px; font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(255,255,255,0.38); text-align: left; white-space: nowrap; background: rgba(0,0,0,0.08); }
  .fk4-tbl tbody tr { border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.15s; }
  .fk4-tbl tbody tr:last-child { border-bottom: none; }
  .fk4-tbl tbody tr:hover { background: rgba(255,255,255,0.06); }
  .fk4-tbl tbody td { padding: 12px 14px; vertical-align: middle; white-space: nowrap; }
  .fk4-cn  { font-size: 13px; font-weight: 700; color: #fff; }
  .fk4-cs  { font-size: 11px; color: rgba(255,255,255,0.42); font-weight: 500; margin-top: 1px; }
  .fk4-tamt { font-size: 14px; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }

  /* ── Avatar ── */
  .fk4-av { border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #fff; flex-shrink: 0; }

  /* ── Badge ── */
  .fk4-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 50px; font-size: 11px; font-weight: 700; white-space: nowrap; border: 1px solid transparent; }
  .fk4-badge::before { content: ''; width: 4px; height: 4px; border-radius: 50%; background: currentColor; opacity: 0.75; flex-shrink: 0; }
  .b-blue   { background: rgba(59,130,246,0.22);  border-color: rgba(59,130,246,0.35);  color: #93c5fd; }
  .b-green  { background: rgba(52,211,153,0.20);  border-color: rgba(52,211,153,0.32);  color: #6ee7b7; }
  .b-red    { background: rgba(248,113,113,0.20); border-color: rgba(248,113,113,0.32); color: #fca5a5; }
  .b-amber  { background: rgba(251,191,36,0.18);  border-color: rgba(251,191,36,0.30);  color: #fde68a; }
  .b-purple { background: rgba(196,181,253,0.18); border-color: rgba(196,181,253,0.30); color: #ddd6fe; }
  .b-slate  { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.20); color: rgba(255,255,255,0.75); }

  /* ── Vade Rengi ── */
  .due-ok   { color: #6ee7b7; font-weight: 700; }
  .due-warn { color: #fde68a; font-weight: 700; }
  .due-late { color: #fca5a5; font-weight: 700; }

  /* ── Yatay Kaydırma ── */
  .fk4-hs { overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none; padding: 3px 0 8px; }
  .fk4-hs::-webkit-scrollbar { display: none; }
  .fk4-hsi { display: flex; gap: 10px; width: max-content; }
  .fk4-txn { width: 174px; flex-shrink: 0; border-radius: 16px; padding: 14px; transition: transform 0.2s, box-shadow 0.2s; }
  .fk4-txn:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.25) !important; }
  .fk4-txnh { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .fk4-txnn { font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
  .fk4-txna { font-size: 19px; font-weight: 900; letter-spacing: -0.025em; font-variant-numeric: tabular-nums; margin: 6px 0 4px; display: block; }
  .t-pos { color: #4ade80; }
  .t-neg { color: #f87171; }
  .fk4-txnd { font-size: 10px; color: rgba(255,255,255,0.38); font-weight: 600; display: flex; align-items: center; gap: 4px; }

  /* ── Form ── */
  .fk4-fcard { border-radius: 18px; padding: 18px; }
  .fk4-lbl   { display: block; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.55); margin-bottom: 8px; }
  .fk4-ig {
    display: flex; border: 1.5px solid rgba(255,255,255,0.2);
    border-radius: 12px; overflow: hidden;
    background: rgba(255,255,255,0.08);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .fk4-ig:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 4px rgba(147,197,253,0.18); }
  .fk4-ipfx { display: flex; align-items: center; padding: 0 13px; color: rgba(255,255,255,0.4); font-size: 16px; border-right: 1px solid rgba(255,255,255,0.12); flex-shrink: 0; }
  .fk4-inp  { flex: 1; border: none; outline: none; background: transparent; padding: 12px 13px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 500; color: #fff; min-height: 48px; }
  .fk4-inp::placeholder { color: rgba(255,255,255,0.28); font-weight: 400; }
  .fk4-hint { font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 500; margin-top: 7px; display: flex; align-items: center; gap: 4px; }
  .fk4-btn {
    margin-top: 14px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: #fff; border: none; border-radius: 12px; padding: 12px 24px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700; cursor: pointer;
    min-height: 48px; display: inline-flex; align-items: center; gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
    box-shadow: 0 4px 16px rgba(59,130,246,0.35);
    letter-spacing: -0.01em;
  }
  .fk4-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,130,246,0.5); filter: brightness(1.08); }

  /* ── Badge Showcase ── */
  .fk4-brow { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 18px; }

  /* ── Footer ── */
  .fk4-footer { text-align: center; padding: 16px; font-size: 11px; color: rgba(255,255,255,0.2); font-weight: 500; border-top: 1px solid rgba(255,255,255,0.07); }
`;

/* ── Veri ── */
const KPI = [
  {
    label: "Toplam Alacak", amount: "₺284.500", trend: "+%12,3", dir: "up", sub: "68 aktif cari",
    icon: "bi-arrow-down-circle-fill",
    s: {
      background: "linear-gradient(135deg, rgba(52,211,153,0.28) 0%, rgba(16,185,129,0.18) 100%)",
      border: "1px solid rgba(52,211,153,0.30)", boxShadow: "0 6px 24px rgba(52,211,153,0.12)",
      "--ac": "#34d399", "--lc": "rgba(110,231,183,0.85)", "--ib": "rgba(52,211,153,0.22)",
      "--ic": "#6ee7b7", "--tb": "rgba(52,211,153,0.20)", "--tc": "#6ee7b7",
      "--sc": "rgba(110,231,183,0.5)",
    },
  },
  {
    label: "Toplam Borç", amount: "₺96.200", trend: "-%3,1", dir: "down", sub: "12 tedarikçi",
    icon: "bi-arrow-up-circle-fill",
    s: {
      background: "linear-gradient(135deg, rgba(248,113,113,0.28) 0%, rgba(239,68,68,0.18) 100%)",
      border: "1px solid rgba(248,113,113,0.30)", boxShadow: "0 6px 24px rgba(248,113,113,0.12)",
      "--ac": "#f87171", "--lc": "rgba(252,165,165,0.85)", "--ib": "rgba(248,113,113,0.22)",
      "--ic": "#fca5a5", "--tb": "rgba(248,113,113,0.20)", "--tc": "#fca5a5",
      "--sc": "rgba(252,165,165,0.5)",
    },
  },
  {
    label: "Portföydeki Çekler", amount: "₺145.000", trend: "8 adet", dir: "neu", sub: "En yakın: 5 gün",
    icon: "bi-file-earmark-text-fill",
    s: {
      background: "linear-gradient(135deg, rgba(251,191,36,0.26) 0%, rgba(245,158,11,0.16) 100%)",
      border: "1px solid rgba(251,191,36,0.28)", boxShadow: "0 6px 24px rgba(251,191,36,0.10)",
      "--ac": "#fbbf24", "--lc": "rgba(253,230,138,0.85)", "--ib": "rgba(251,191,36,0.20)",
      "--ic": "#fde68a", "--tb": "rgba(251,191,36,0.18)", "--tc": "#fde68a",
      "--sc": "rgba(253,230,138,0.5)",
    },
  },
  {
    label: "Bekleyen Ödemeler", amount: "₺32.400", trend: "3 adet", dir: "neu", sub: "Bu hafta vadeli",
    icon: "bi-clock-fill",
    s: {
      background: "linear-gradient(135deg, rgba(147,197,253,0.26) 0%, rgba(96,165,250,0.16) 100%)",
      border: "1px solid rgba(147,197,253,0.28)", boxShadow: "0 6px 24px rgba(96,165,250,0.10)",
      "--ac": "#93c5fd", "--lc": "rgba(186,230,253,0.85)", "--ib": "rgba(147,197,253,0.20)",
      "--ic": "#bae6fd", "--tb": "rgba(147,197,253,0.18)", "--tc": "#bae6fd",
      "--sc": "rgba(186,230,253,0.5)",
    },
  },
];

const TABS = [
  { id: "p", label: "Portföydeki",  count: 8 },
  { id: "t", label: "Tahsildeki",   count: 3 },
  { id: "k", label: "Kendi Çekimiz",count: 5 },
  { id: "c", label: "Cirolanan",    count: 2 },
];

const TABLE = [
  { i: "TA", c: "#2563eb", name: "Teknik Alüminyum A.Ş.", info: "Müşteri Çeki", amt: "₺42.500", due: "18.03.2026", dc: "due-warn", b: { cls: "b-blue",   t: "Tahsilde"      } },
  { i: "DE", c: "#059669", name: "Demirhan Endüstri Ltd.", info: "Portföy",      amt: "₺28.000", due: "25.03.2026", dc: "due-ok",   b: { cls: "b-green",  t: "Ödendi"        } },
  { i: "KD", c: "#7c3aed", name: "Karadeniz Demir Tic.",   info: "Müşteri Çeki", amt: "₺15.750", due: "10.03.2026", dc: "due-late", b: { cls: "b-red",    t: "Vadesi Geçti"  } },
  { i: "YS", c: "#d97706", name: "Yıldız Sanayi A.Ş.",    info: "Ciro",          amt: "₺58.800", due: "02.04.2026", dc: "due-ok",   b: { cls: "b-purple", t: "Cirolandı"     } },
];

const TXN = [
  { i: "AB", c: "#2563eb", n: "Asil Boru A.Ş.",    b: { cls: "b-green",  t: "Tahsil"       }, a: "+₺18.400", pos: true,  d: "14.03.2026" },
  { i: "MY", c: "#dc2626", n: "Metalyapı San.",    b: { cls: "b-amber",  t: "Bekliyor"     }, a: "-₺9.200",  pos: false, d: "13.03.2026" },
  { i: "GT", c: "#059669", n: "Güneş Ticaret Ltd.",b: { cls: "b-blue",   t: "Ciro"         }, a: "+₺33.000", pos: true,  d: "12.03.2026" },
  { i: "PK", c: "#7c3aed", n: "Profil Kimya A.Ş.",b: { cls: "b-red",    t: "Vadesi Geçti" }, a: "-₺5.600",  pos: false, d: "08.03.2026" },
];

export default function TasarimDemo() {
  const [tab, setTab] = useState("p");

  return (
    <div className="fk4-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Header */}
      <header className="fk4-header">
        <div className="fk4-logo">FK</div>
        <div>
          <div className="fk4-htitle">Finans Kalesi</div>
          <div className="fk4-hsub">Kaan Doğan · Genel Müdür</div>
        </div>
        <div className="fk4-chip">Demo v4</div>
      </header>

      <div className="fk4-body">

        {/* Selamlama */}
        <div className="fk4-greet">
          <div className="fk4-glabel">Hoş geldiniz</div>
          <div className="fk4-gname">Günaydın, <span>Kaan Bey</span> 👋</div>
        </div>

        {/* Net Pozisyon */}
        <div className="fk4-net gc">
          <div>
            <div className="fk4-nl">Net Pozisyon</div>
            <div className="fk4-na">+₺188.300</div>
            <div className="fk4-ns">14 Mart 2026 itibarıyla</div>
          </div>
          <div className="fk4-nr">
            <span className="fk4-np"><i className="bi bi-arrow-up-short"></i>+%8,4</span>
            <span className="fk4-nsub">Geçen aya göre</span>
          </div>
        </div>

        {/* KPI Kartlar */}
        <div className="fk4-sh">
          <span className="fk4-sh-t">Özet Göstergeler</span>
          <a href="#" className="fk4-sh-a">Tümü <i className="bi bi-chevron-right" style={{ fontSize: 10 }}></i></a>
        </div>
        <div className="fk4-grid">
          {KPI.map((k, i) => (
            <div key={i} className="fk4-kpi" style={k.s}>
              <div className="fk4-ktop">
                <div className="fk4-klbl">{k.label}</div>
                <div className="fk4-kico"><i className={`bi ${k.icon}`}></i></div>
              </div>
              <div className="fk4-kamt">{k.amount}</div>
              <span className="fk4-ktrend">
                {k.dir === "up"   && <i className="bi bi-arrow-up-short"></i>}
                {k.dir === "down" && <i className="bi bi-arrow-down-short"></i>}
                {k.dir === "neu"  && <i className="bi bi-dot" style={{ fontSize: 14 }}></i>}
                {k.trend}
              </span>
              <div className="fk4-ksub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab + Tablo */}
        <div className="fk4-sh"><span className="fk4-sh-t">Çek / Senet</span></div>
        <div className="fk4-tw">
          <div className="fk4-tabs gc-dark" style={{ borderRadius: 14 }}>
            {TABS.map(t => (
              <button key={t.id} className={`fk4-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
                <span className="fk4-tc">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fk4-tcard gc">
          <div className="fk4-tw2">
            <table className="fk4-tbl">
              <thead>
                <tr><th>Firma</th><th>Tutar</th><th>Vade</th><th>Durum</th></tr>
              </thead>
              <tbody>
                {TABLE.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div className="fk4-av" style={{ width: 32, height: 32, background: r.c }}>{r.i}</div>
                        <div><div className="fk4-cn">{r.name}</div><div className="fk4-cs">{r.info}</div></div>
                      </div>
                    </td>
                    <td><span className="fk4-tamt">{r.amt}</span></td>
                    <td><span className={r.dc}>{r.due}</span></td>
                    <td><span className={`fk4-badge ${r.b.cls}`}>{r.b.t}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Yatay İşlemler */}
        <div className="fk4-sh">
          <span className="fk4-sh-t">Son İşlemler</span>
          <a href="#" className="fk4-sh-a">Tümü <i className="bi bi-chevron-right" style={{ fontSize: 10 }}></i></a>
        </div>
        <div className="fk4-hs">
          <div className="fk4-hsi">
            {TXN.map((t, i) => (
              <div key={i} className="fk4-txn gc">
                <div className="fk4-txnh">
                  <div className="fk4-av" style={{ width: 30, height: 30, background: t.c, borderRadius: 8, fontSize: 10, flexShrink: 0 }}>{t.i}</div>
                  <div className="fk4-txnn">{t.n}</div>
                </div>
                <span className={`fk4-badge ${t.b.cls}`}>{t.b.t}</span>
                <span className={`fk4-txna ${t.pos ? "t-pos" : "t-neg"}`}>{t.a}</span>
                <div className="fk4-txnd"><i className="bi bi-calendar3"></i>{t.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="fk4-sh"><span className="fk4-sh-t">Form Bileşeni</span></div>
        <div className="fk4-fcard gc">
          <label className="fk4-lbl" htmlFor="fk4-s">Cari / Firma Arama</label>
          <div className="fk4-ig">
            <div className="fk4-ipfx"><i className="bi bi-building"></i></div>
            <input id="fk4-s" type="text" className="fk4-inp" placeholder="Firma adı, vergi no veya telefon..." />
          </div>
          <p className="fk4-hint"><i className="bi bi-info-circle"></i>En az 2 karakter ile arama yapabilirsiniz.</p>
          <button className="fk4-btn"><i className="bi bi-search"></i>Ara</button>
        </div>

        {/* Rozetler */}
        <div className="fk4-sh"><span className="fk4-sh-t">Durum Rozetleri</span></div>
        <div className="gc" style={{ borderRadius: 18 }}>
          <div className="fk4-brow">
            <span className="fk4-badge b-blue">Tahsilde</span>
            <span className="fk4-badge b-green">Ödendi</span>
            <span className="fk4-badge b-red">Vadesi Geçti</span>
            <span className="fk4-badge b-amber">Bekliyor</span>
            <span className="fk4-badge b-purple">Cirolandı</span>
            <span className="fk4-badge b-slate">Portföyde</span>
          </div>
        </div>

      </div>

      <div className="fk4-footer">
        Finans Kalesi · Sprint D0 Tasarım Demo v4 · Orta Lacivert Cam · Onay sonrası bu sayfa silinir
      </div>
    </div>
  );
}
