/**
 * Dashboard — Obsidian Vault Tema (Yeniden Tasarım)
 * frontend-design + react-bootstrap-ui.md + koyu-tema.md
 * 4 API eş zamanlı: dashboard + cariler/ozet + kasa/ozet + cek-senet/ozet
 * Uzman finansçı perspektifi: alacak yaşlandırma, risk bandı, oranlar, likidite
 * dash- prefix, self-contained stiller
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { Link }        from 'react-router-dom'
import { dashboardApi } from '../../api/dashboard'
import { carilerApi }   from '../../api/cariler'
import { kasaOzeti }    from '../../api/kasa'
import cekSenetApi      from '../../api/cekSenet'
import useAuthStore     from '../../stores/authStore'

// ─── Para Formatları ──────────────────────────────────────────────────────────
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0)

const TLKisa = (n) => {
  const s = parseFloat(n ?? 0)
  if (s >= 1_000_000) return `${(s / 1_000_000).toFixed(1).replace('.', ',')} M ₺`
  if (s >= 1_000)     return `${(s / 1_000).toFixed(0)} K ₺`
  return `${TL(s)} ₺`
}

const tarihFmt = (s) =>
  s ? new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

// ─── Vadeye Kalan Gün ────────────────────────────────────────────────────────
const gunKaldi = (tarih) => {
  if (!tarih) return null
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0)
  const hedef = new Date(tarih); hedef.setHours(0, 0, 0, 0)
  return Math.ceil((hedef - bugun) / 86_400_000)
}

// ─── Animasyonlu Sayaç ────────────────────────────────────────────────────────
function useAnimatedNumber(target, duration = 750) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  const prev = useRef(0)

  useEffect(() => {
    const t0 = performance.now()
    const from = prev.current
    prev.current = target
    cancelAnimationFrame(raf.current)
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(from + (target - from) * e)
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return val
}

// ─── KPI Kart ─────────────────────────────────────────────────────────────────
function KpiKart({ baslik, deger, alt, ikon, numColor, glowColor, link, yukleniyor, index }) {
  const animDeger = useAnimatedNumber(parseFloat(deger ?? 0))

  return (
    <div className="dash-kpi-card" style={{ animationDelay: `${index * 70}ms` }}>
      {/* Dekoratif büyük ikon */}
      <i className={`bi ${ikon}`} style={{
        position: 'absolute', top: 14, right: 14,
        fontSize: 58, opacity: 0.18, color: numColor, pointerEvents: 'none',
      }} />

      <h6 className="dash-kpi-label">{baslik}</h6>

      {yukleniyor ? (
        <div className="dash-iskelet" style={{ height: 34, width: '75%', marginBottom: 8 }} />
      ) : (
        <div className="dash-kpi-value" style={{ color: numColor, textShadow: `0 0 20px ${glowColor}` }}>
          {TL(animDeger)} ₺
        </div>
      )}

      {alt && !yukleniyor && (
        <p className="dash-kpi-alt">{alt}</p>
      )}

      {link && (
        <Link to={link} className="dash-link-amber" style={{ fontSize: 11 }}>
          Detaylar <i className="bi bi-arrow-up-right" style={{ fontSize: 10 }} />
        </Link>
      )}
    </div>
  )
}

// ─── Risk Seviye Rozeti ───────────────────────────────────────────────────────
function VadeRozeti({ gun }) {
  if (gun === null) return null
  if (gun < 0)   return <span className="dash-vade-rozet dash-vade-gecmis">Vadesi Geçti</span>
  if (gun === 0) return <span className="dash-vade-rozet dash-vade-bugun">Bugün!</span>
  if (gun <= 3)  return <span className="dash-vade-rozet dash-vade-kritik">{gun} gün</span>
  if (gun <= 7)  return <span className="dash-vade-rozet dash-vade-uyari">{gun} gün</span>
  if (gun <= 15) return <span className="dash-vade-rozet dash-vade-dikkat">{gun} gün</span>
  return <span className="dash-vade-rozet dash-vade-normal">{gun} gün</span>
}

// ─── Durum Rozeti ─────────────────────────────────────────────────────────────
function DurumRozeti({ durum }) {
  const harita = {
    portfoyde:    { c: '#f59e0b', l: 'Portföyde'   },
    odendi:       { c: '#10b981', l: 'Ödendi'       },
    tahsilde:     { c: '#d97706', l: 'Tahsilde'     },
    karsilıksız:  { c: '#ef4444', l: 'Karşılıksız'  },
    ciroslu:      { c: '#6366f1', l: 'Cirolu'       },
    banka_garantili: { c: '#0ea5e9', l: 'Banka Garanti' },
  }
  const s = harita[durum] || { c: 'rgba(255,255,255,0.4)', l: durum || '—' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: s.c, boxShadow: `0 0 6px ${s.c}88`,
      }} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{s.l}</span>
    </span>
  )
}

// ─── Panel Başlığı ────────────────────────────────────────────────────────────
function PanelBaslik({ ikon, renkHex, baslik, link }) {
  return (
    <div className="dash-panel-header">
      <div className="d-flex align-items-center gap-2">
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: `${renkHex}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`bi ${ikon}`} style={{ fontSize: 14, color: renkHex }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{baslik}</span>
      </div>
      {link && (
        <Link to={link} className="dash-link-amber" style={{ fontSize: 11 }}>
          Tümünü gör <i className="bi bi-arrow-right" style={{ fontSize: 10 }} />
        </Link>
      )}
    </div>
  )
}

// ─── İskelet Satır ────────────────────────────────────────────────────────────
function IskeleSatir() {
  return (
    <div className="d-flex align-items-center gap-3" style={{ padding: '12px 20px' }}>
      <div className="dash-iskelet" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="dash-iskelet" style={{ height: 12, width: '55%', marginBottom: 7 }} />
        <div className="dash-iskelet" style={{ height: 10, width: '38%' }} />
      </div>
      <div className="dash-iskelet" style={{ height: 12, width: 80 }} />
    </div>
  )
}

// ─── Yatay Oran Çubuğu ────────────────────────────────────────────────────────
function OranCubugu({ etiket1, yuzde1, renk1, etiket2, yuzde2, renk2 }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="d-flex justify-content-between mb-1">
        <span style={{ fontSize: 11, fontWeight: 700, color: renk1 }}>{etiket1} %{yuzde1}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: renk2 }}>{etiket2} %{yuzde2}</span>
      </div>
      <div style={{
        height: 8, borderRadius: 99,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
        display: 'flex',
      }}>
        <div style={{
          width: `${yuzde1}%`,
          background: `linear-gradient(90deg, ${renk1}cc, ${renk1})`,
          borderRadius: '99px 0 0 99px',
          transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
          boxShadow: `0 0 8px ${renk1}66`,
        }} />
        <div style={{
          flex: 1,
          background: `linear-gradient(90deg, ${renk2}, ${renk2}cc)`,
          borderRadius: '0 99px 99px 0',
        }} />
      </div>
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { kullanici } = useAuthStore()

  // Veri state
  const [dash,   setDash]   = useState(null)
  const [cari,   setCari]   = useState(null)
  const [kasa,   setKasa]   = useState(null)
  const [cek,    setCek]    = useState(null)
  const [yukl,   setYukl]   = useState(true)
  const [gunc,   setGunc]   = useState(null)
  const [donuyor, setDonuyor] = useState(false)

  const verileriYukle = useCallback(async (manuel = false) => {
    if (manuel) setDonuyor(true)
    setYukl(true)

    const [dashRes, cariRes, kasaRes, cekRes] = await Promise.allSettled([
      dashboardApi.tumOzet(),
      carilerApi.ozet(),
      kasaOzeti(),
      cekSenetApi.ozet(),
    ])

    if (dashRes.status === 'fulfilled') {
      const d = dashRes.value.data.veri ?? {}
      setDash(d)
    }
    if (cariRes.status === 'fulfilled') {
      setCari(cariRes.value.data.veri ?? null)
    }
    if (kasaRes.status === 'fulfilled') {
      setKasa(kasaRes.value.data.veri ?? null)
    }
    if (cekRes.status === 'fulfilled') {
      setCek(cekRes.value.data.veri ?? null)
    }

    setYukl(false)
    setGunc(new Date())
    if (manuel) setTimeout(() => setDonuyor(false), 700)
  }, [])

  useEffect(() => { verileriYukle() }, [verileriYukle])

  // ─── Türetilen Metrikler ──────────────────────────────────────────────────
  // Cari
  const topAlacak  = parseFloat(dash?.cari?.toplam_alacak  ?? cari?.toplam_alacak  ?? 0)
  const topBorc    = parseFloat(dash?.cari?.toplam_borc    ?? cari?.toplam_borc    ?? 0)
  const netPozisyon = topAlacak - topBorc
  const netPozitif  = netPozisyon >= 0
  const aktifCari   = dash?.cari?.aktif_cari_sayisi ?? cari?.aktif_cari_sayisi ?? 0

  // Alacak/Borç oranı
  const toplamCiro  = topAlacak + topBorc
  const alacakYuzde = toplamCiro > 0 ? Math.round((topAlacak / toplamCiro) * 100) : 0
  const borcYuzde   = 100 - alacakYuzde

  // Kasa
  const kasaBakiye = parseFloat(kasa?.bakiye ?? kasa?.toplam_bakiye ?? 0)
  const kasaGiris  = parseFloat(kasa?.aylik_giris  ?? kasa?.bu_ay_giris  ?? 0)
  const kasaCikis  = parseFloat(kasa?.aylik_cikis  ?? kasa?.bu_ay_cikis  ?? 0)

  // Likidite = Kasa + tahsil edilebilir (nakit + alacak)
  const likidite = kasaBakiye + topAlacak

  // Çek/Senet
  const cekPortfoyde    = parseFloat(dash?.cekSenet?.portfoyde_toplam  ?? cek?.portfoyde?.toplam   ?? 0)
  const cekPortfoyAdet  = dash?.cekSenet?.portfoyde_adet  ?? cek?.portfoyde?.adet   ?? 0
  const cekTahsilToplam = parseFloat(cek?.tahsilde?.toplam ?? 0)
  const cekOdendi       = parseFloat(cek?.odendi?.toplam   ?? 0)
  const cekKarsilıksız  = parseFloat(cek?.karsilıksız?.toplam ?? 0)
  const cekKarsilıksızAdet = cek?.karsilıksız?.adet ?? 0

  // Ödemeler
  const bekleyenToplam = parseFloat(dash?.odeme?.bekleyen_toplam ?? 0)
  const bekleyenAdet   = dash?.odeme?.bekleyen_adet ?? 0

  // Yaklaşan vadeler
  const yakVadeler = (dash?.cekSenet?.yaklasan_vadeler ?? [])
    .map(v => ({ ...v, gun: gunKaldi(v.vade_tarihi) }))
    .sort((a, b) => (a.gun ?? 999) - (b.gun ?? 999))

  // Kritik vade sayısı (7 gün veya daha az)
  const kritikVade = yakVadeler.filter(v => v.gun !== null && v.gun <= 7).length

  // Selamlama
  const sh = new Date().getHours()
  const selamlama = sh < 12 ? 'Günaydın' : sh < 18 ? 'İyi günler' : 'İyi akşamlar'
  const ad = kullanici?.ad_soyad?.split(' ')[0] || ''

  // ─── KPI Veri Dizisi ─────────────────────────────────────────────────────
  const kpiler = [
    {
      baslik: 'Toplam Alacak',
      deger: topAlacak,
      alt: `${aktifCari} aktif cari`,
      ikon: 'bi-arrow-down-circle-fill',
      numColor: '#10b981',
      glowColor: 'rgba(16,185,129,0.35)',
      link: '/cariler',
    },
    {
      baslik: 'Toplam Borç',
      deger: topBorc,
      alt: `Net: ${netPozitif ? '+' : ''}${TLKisa(netPozisyon)}`,
      ikon: 'bi-arrow-up-circle-fill',
      numColor: '#ef4444',
      glowColor: 'rgba(239,68,68,0.35)',
      link: '/cariler',
    },
    {
      baslik: 'Kasa Bakiyesi',
      deger: kasaBakiye,
      alt: kasaGiris > 0 ? `Bu ay giriş: ${TLKisa(kasaGiris)}` : 'Nakit varlığı',
      ikon: 'bi-safe-fill',
      numColor: '#f59e0b',
      glowColor: 'rgba(245,158,11,0.35)',
      link: '/kasa',
    },
    {
      baslik: 'Portföydeki Çekler',
      deger: cekPortfoyde,
      alt: `${cekPortfoyAdet} adet`,
      ikon: 'bi-file-earmark-text-fill',
      numColor: '#6366f1',
      glowColor: 'rgba(99,102,241,0.35)',
      link: '/cek-senet',
    },
    {
      baslik: 'Bekleyen Ödemeler',
      deger: bekleyenToplam,
      alt: `${bekleyenAdet} işlem bekliyor`,
      ikon: 'bi-credit-card-2-fill',
      numColor: '#d97706',
      glowColor: 'rgba(217,119,6,0.35)',
      link: '/odemeler',
    },
    {
      baslik: 'Likidite Tahmini',
      deger: likidite,
      alt: 'Kasa + Alacak toplamı',
      ikon: 'bi-graph-up-arrow',
      numColor: likidite >= 0 ? '#10b981' : '#ef4444',
      glowColor: likidite >= 0 ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
      link: null,
    },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="dash-root">
      <style>{`
        /* ═══ Dashboard — Obsidian Vault Redesign ═══ */

        .dash-root {
          position: relative; z-index: 1;
          padding: 28px;
          max-width: 1300px;
          margin: 0 auto;
        }
        @media (max-width: 767px) { .dash-root { padding: 16px; } }
        @media (max-width: 480px) { .dash-root { padding: 12px; } }

        /* ── Giriş Animasyonu ── */
        @keyframes dash-rise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dash-spin { to { transform: rotate(360deg); } }
        @keyframes dash-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* ── KPI Izgara ── */
        .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 16px;
          animation: dash-rise 0.4s ease both;
        }
        @media (max-width: 991px) { .dash-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .dash-kpi-grid { grid-template-columns: 1fr; gap: 10px; } }

        /* ── KPI Kart ── */
        .dash-kpi-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px 22px 18px;
          position: relative;
          overflow: hidden;
          transition: all 220ms ease;
          animation: dash-rise 0.45s ease both;
        }
        .dash-kpi-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .dash-kpi-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin: 0 0 10px;
          position: relative; z-index: 1;
        }
        .dash-kpi-value {
          font-family: 'Inter', sans-serif;
          font-size: 24px;
          font-weight: 500;
          margin: 0 0 6px;
          line-height: 1.15;
          position: relative; z-index: 1;
          letter-spacing: 0.01em;
          font-variant-numeric: tabular-nums;
          -webkit-font-smoothing: antialiased;
          word-break: break-word;
        }
        @media (max-width: 1200px) { .dash-kpi-value { font-size: 20px; } }
        @media (max-width: 480px)  { .dash-kpi-value { font-size: 18px; } }
        .dash-kpi-alt {
          font-size: 11px;
          color: rgba(255,255,255,0.55);
          font-weight: 500;
          margin: 0 0 10px;
          position: relative; z-index: 1;
        }

        /* ── Risk Uyarı Bandı ── */
        .dash-risk-bandi {
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          animation: dash-rise 0.4s ease both;
          flex-wrap: wrap;
        }
        .dash-risk-bandi-ikon {
          width: 36px; height: 36px; flex-shrink: 0;
          border-radius: 10px;
          background: rgba(239,68,68,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #ef4444;
          animation: dash-pulse 2s ease-in-out infinite;
        }

        /* ── Net Pozisyon Bandı ── */
        .dash-net-bandi {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 14px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          animation: dash-rise 0.4s 0.1s ease both;
          flex-wrap: wrap;
        }

        /* ── Glass Kart (paneller) ── */
        .dash-glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
          transition: all 220ms ease;
          animation: dash-rise 0.45s 0.15s ease both;
          height: 100%;
        }
        .dash-glass-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
        }

        /* ── Panel Başlığı ── */
        .dash-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        /* ── Liste Satır ── */
        .dash-list-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 120ms ease;
        }
        .dash-list-row:last-child { border-bottom: none; }
        .dash-list-row:hover { background: rgba(255,255,255,0.03); }

        /* ── Avatar ── */
        .dash-avatar {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800;
          flex-shrink: 0;
        }

        /* ── Linkler ── */
        .dash-link-amber {
          font-size: 12px; font-weight: 700;
          color: #f59e0b;
          text-decoration: none;
          transition: all 150ms;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .dash-link-amber:hover { color: #fbbf24; }

        /* ── Vade Rozetleri ── */
        .dash-vade-rozet {
          font-size: 11px; font-weight: 700;
          padding: 2px 9px; border-radius: 20px;
          white-space: nowrap; letter-spacing: 0.02em;
        }
        .dash-vade-gecmis { background: rgba(239,68,68,0.2);  color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
        .dash-vade-bugun  { background: rgba(239,68,68,0.3);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.5); animation: dash-pulse 1s infinite; }
        .dash-vade-kritik { background: rgba(239,68,68,0.15); color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
        .dash-vade-uyari  { background: rgba(234,88,12,0.15); color: #fb923c; border: 1px solid rgba(234,88,12,0.25); }
        .dash-vade-dikkat { background: rgba(217,119,6,0.15); color: #fbbf24; border: 1px solid rgba(217,119,6,0.25); }
        .dash-vade-normal { background: rgba(16,185,129,0.1); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.2); }

        /* ── Yenile Butonu ── */
        .dash-btn-yenile {
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.3);
          color: #f59e0b;
          border-radius: 10px;
          font-size: 13px; font-weight: 600;
          min-height: 44px; padding: 0 18px;
          display: inline-flex; align-items: center; gap: 8px;
          cursor: pointer;
          transition: all 220ms ease;
          white-space: nowrap;
        }
        .dash-btn-yenile:hover:not(:disabled) {
          background: rgba(245,158,11,0.15);
          border-color: rgba(245,158,11,0.5);
        }
        .dash-btn-yenile:disabled { opacity: 0.55; cursor: not-allowed; }
        .dash-spin { animation: dash-spin 0.7s linear infinite; display: inline-block; }

        /* ── Orta: Analiz Bölümü ── */
        .dash-analiz-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 767px) { .dash-analiz-grid { grid-template-columns: 1fr; } }

        /* ── İskelet ── */
        .dash-iskelet {
          border-radius: 6px;
          background: linear-gradient(90deg,
            rgba(255,255,255,0.06) 25%,
            rgba(255,255,255,0.12) 50%,
            rgba(255,255,255,0.06) 75%
          );
          background-size: 200% 100%;
          animation: dash-shimmer 1.4s infinite;
        }
        @keyframes dash-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Metric Satır ── */
        .dash-metric-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .dash-metric-row:last-child { border-bottom: none; }

        @media (max-width: 768px) {
          .dash-kpi-value { font-size: 20px; }
          .dash-panel-header { padding: 12px 16px; }
          .dash-list-row { padding: 10px 16px; }
          .dash-metric-row { padding: 10px 16px; }
        }
      `}</style>

      {/* ─── Başlık ────────────────────────────────────────────────────────── */}
      <div className="d-flex align-items-start justify-content-between mb-4"
           style={{ animation: 'dash-rise 0.35s ease both' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
            {selamlama}{ad ? `, ${ad}` : ''} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '4px 0 0', fontWeight: 400 }}>
            {gunc
              ? `Son güncelleme: ${gunc.toLocaleTimeString('tr-TR')}`
              : 'Finansal durumunuzun güncel özeti'
            }
          </p>
        </div>
        <button
          className="dash-btn-yenile"
          onClick={() => verileriYukle(true)}
          disabled={yukl}
        >
          <i className={`bi bi-arrow-clockwise${donuyor ? ' dash-spin' : ''}`} style={{ fontSize: 14 }} />
          Yenile
        </button>
      </div>

      {/* ─── KPI Kartları (6'lı) ───────────────────────────────────────────── */}
      <div className="dash-kpi-grid">
        {kpiler.map((k, i) => (
          <KpiKart key={k.baslik} {...k} yukleniyor={yukl} index={i} />
        ))}
      </div>

      {/* ─── Risk Uyarı Bandı (Karşılıksız Çek) ──────────────────────────── */}
      {!yukl && (cekKarsilıksızAdet > 0 || kritikVade > 0) && (
        <div className="dash-risk-bandi">
          <div className="dash-risk-bandi-ikon">
            <i className="bi bi-exclamation-triangle-fill" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>
              Risk Uyarısı
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
              {cekKarsilıksızAdet > 0 && `${cekKarsilıksızAdet} adet karşılıksız çek (${TLKisa(cekKarsilıksız)}) `}
              {cekKarsilıksızAdet > 0 && kritikVade > 0 && '· '}
              {kritikVade > 0 && `${kritikVade} çek/senet 7 gün içinde vadesine geliyor`}
            </p>
          </div>
          <Link to="/cek-senet" className="dash-link-amber" style={{ whiteSpace: 'nowrap' }}>
            İncele <i className="bi bi-arrow-right" />
          </Link>
        </div>
      )}

      {/* ─── Net Pozisyon Bandı ────────────────────────────────────────────── */}
      {!yukl && (
        <div
          className="dash-net-bandi"
          style={{ borderColor: netPozitif ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)' }}
        >
          <i
            className={`bi ${netPozitif ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}`}
            style={{ fontSize: 22, color: netPozitif ? '#10b981' : '#ef4444', flexShrink: 0 }}
          />
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Piyasa Net Pozisyonu
            </p>
            <p style={{
              margin: '2px 0 0',
              fontFamily: "'Inter', sans-serif",
              fontSize: 20, fontWeight: 500,
              color: netPozitif ? '#10b981' : '#ef4444',
              fontVariantNumeric: 'tabular-nums',
              textShadow: `0 0 16px ${netPozitif ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            }}>
              {netPozisyon > 0 ? '+' : ''}{TL(netPozisyon)} ₺
            </p>
          </div>

          {/* Alacak/Borç oranı bandı */}
          {toplamCiro > 0 && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <OranCubugu
                etiket1="Alacak" yuzde1={alacakYuzde} renk1="#10b981"
                etiket2="Borç"   yuzde2={borcYuzde}   renk2="#ef4444"
              />
            </div>
          )}

          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
            Alacak − Borç
          </p>
        </div>
      )}

      {/* ─── Orta: Analiz ──────────────────────────────────────────────────── */}
      <div className="dash-analiz-grid">

        {/* Kasa & Nakit Akış */}
        <div className="dash-glass-card">
          <PanelBaslik ikon="bi-safe-fill" renkHex="#f59e0b" baslik="Kasa & Nakit Durumu" link="/kasa" />
          {yukl ? (
            <div style={{ padding: 16 }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="d-flex justify-content-between align-items-center" style={{ marginBottom: 10 }}>
                  <div className="dash-iskelet" style={{ height: 12, width: '40%' }} />
                  <div className="dash-iskelet" style={{ height: 12, width: '30%' }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="dash-metric-row">
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Mevcut Bakiye</span>
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                  color: kasaBakiye >= 0 ? '#f59e0b' : '#ef4444',
                  textShadow: `0 0 12px ${kasaBakiye >= 0 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {TL(kasaBakiye)} ₺
                </span>
              </div>
              {kasaGiris > 0 && (
                <div className="dash-metric-row">
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Bu Ay Giriş</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                    +{TL(kasaGiris)} ₺
                  </span>
                </div>
              )}
              {kasaCikis > 0 && (
                <div className="dash-metric-row">
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Bu Ay Çıkış</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                    -{TL(kasaCikis)} ₺
                  </span>
                </div>
              )}
              {kasaGiris > 0 && kasaCikis > 0 && (
                <div className="dash-metric-row">
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Bu Ay Net</span>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700,
                    color: kasaGiris - kasaCikis >= 0 ? '#10b981' : '#ef4444',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {kasaGiris - kasaCikis > 0 ? '+' : ''}{TL(kasaGiris - kasaCikis)} ₺
                  </span>
                </div>
              )}
              <div className="dash-metric-row">
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  <i className="bi bi-info-circle me-1" style={{ fontSize: 11, opacity: 0.6 }} />
                  Likidite Tahmini
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#a78bfa', fontVariantNumeric: 'tabular-nums' }}>
                  {TLKisa(likidite)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Portföy Dağılımı */}
        <div className="dash-glass-card">
          <PanelBaslik ikon="bi-pie-chart-fill" renkHex="#6366f1" baslik="Çek/Senet Portföy Dağılımı" link="/cek-senet" />
          {yukl ? (
            <div style={{ padding: 16 }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="d-flex justify-content-between align-items-center" style={{ marginBottom: 10 }}>
                  <div className="dash-iskelet" style={{ height: 12, width: '45%' }} />
                  <div className="dash-iskelet" style={{ height: 12, width: '30%' }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              {[
                { etiket: 'Portföyde',   tutar: cekPortfoyde,    renk: '#f59e0b', ikon: 'bi-archive-fill' },
                { etiket: 'Tahsilde',    tutar: cekTahsilToplam, renk: '#d97706', ikon: 'bi-hourglass-split' },
                { etiket: 'Ödendi',      tutar: cekOdendi,       renk: '#10b981', ikon: 'bi-check-circle-fill' },
                { etiket: 'Karşılıksız', tutar: cekKarsilıksız,  renk: '#ef4444', ikon: 'bi-x-circle-fill' },
              ].map(({ etiket, tutar, renk, ikon }) => (
                <div key={etiket} className="dash-metric-row">
                  <span className="d-flex align-items-center gap-2" style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                    <i className={`bi ${ikon}`} style={{ color: renk, fontSize: 12 }} />
                    {etiket}
                  </span>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                    color: tutar > 0 ? renk : 'rgba(255,255,255,0.3)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {tutar > 0 ? `${TL(tutar)} ₺` : '—'}
                  </span>
                </div>
              ))}
              {/* Toplam çubuk */}
              {(cekPortfoyde + cekTahsilToplam + cekOdendi) > 0 && (
                <div style={{ padding: '10px 20px' }}>
                  <OranCubugu
                    etiket1={`Aktif %${Math.round(((cekPortfoyde + cekTahsilToplam) / (cekPortfoyde + cekTahsilToplam + cekOdendi + cekKarsilıksız || 1)) * 100)}`}
                    yuzde1={Math.round(((cekPortfoyde + cekTahsilToplam) / (cekPortfoyde + cekTahsilToplam + cekOdendi + cekKarsilıksız || 1)) * 100)}
                    renk1="#f59e0b"
                    etiket2={`Kapandı %${Math.round(((cekOdendi + cekKarsilıksız) / (cekPortfoyde + cekTahsilToplam + cekOdendi + cekKarsilıksız || 1)) * 100)}`}
                    yuzde2={Math.round(((cekOdendi + cekKarsilıksız) / (cekPortfoyde + cekTahsilToplam + cekOdendi + cekKarsilıksız || 1)) * 100)}
                    renk2="rgba(255,255,255,0.3)"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Alt İki Kolon ─────────────────────────────────────────────────── */}
      <div className="row g-3">

        {/* Yaklaşan Vadeler */}
        <div className="col-12 col-lg-6">
          <div className="dash-glass-card">
            <PanelBaslik ikon="bi-clock-fill" renkHex="#d97706" baslik="Yaklaşan Vadeler" link="/cek-senet" />
            {yukl ? (
              <div style={{ padding: '4px 0' }}>
                {[1,2,3,4].map(i => <IskeleSatir key={i} />)}
              </div>
            ) : yakVadeler.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {yakVadeler.slice(0, 6).map((v) => (
                  <li key={v.id} className="dash-list-row">
                    <div className="d-flex align-items-center gap-3">
                      <div className="dash-avatar" style={{
                        background: (v.gun !== null && v.gun <= 3)
                          ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)',
                        color: (v.gun !== null && v.gun <= 3) ? '#f87171' : '#f59e0b',
                      }}>
                        <i className="bi bi-file-earmark-text" style={{ fontSize: 14 }} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                          {v.seri_no || 'Seri yok'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
                          <i className="bi bi-calendar3 me-1" style={{ fontSize: 10 }} />
                          {tarihFmt(v.vade_tarihi)}
                        </p>
                      </div>
                    </div>
                    <div className="text-end d-flex flex-column align-items-end gap-1">
                      <span style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 13, fontWeight: 600,
                        color: 'rgba(255,255,255,0.85)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {TL(v.tutar_tl)} ₺
                      </span>
                      <VadeRozeti gun={v.gun} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ padding: '44px 24px' }}>
                <i className="bi bi-check-circle" style={{ fontSize: 28, color: '#10b981', marginBottom: 10 }} />
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, margin: 0 }}>
                  Yaklaşan vade bulunmuyor
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Yüksek Bakiyeli Cariler */}
        <div className="col-12 col-lg-6">
          <div className="dash-glass-card">
            <PanelBaslik ikon="bi-people-fill" renkHex="#10b981" baslik="Yüksek Bakiyeli Cariler" link="/cariler" />
            {yukl ? (
              <div style={{ padding: '4px 0' }}>
                {[1,2,3,4].map(i => <IskeleSatir key={i} />)}
              </div>
            ) : (dash?.cari?.en_yuksek_bakiyeli?.length > 0) ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {dash.cari.en_yuksek_bakiyeli.slice(0, 6).map((c, i) => {
                  const bakiye  = parseFloat(c.bakiye ?? 0)
                  const pozitif = bakiye >= 0
                  const avatarBg    = c.cari_turu === 'tedarikci' ? '#d9780618' : '#10b98118'
                  const avatarColor = c.cari_turu === 'tedarikci' ? '#d97706'   : '#10b981'
                  return (
                    <li key={c.id} className="dash-list-row">
                      <div className="d-flex align-items-center gap-3">
                        <div className="dash-avatar" style={{ background: avatarBg, color: avatarColor }}>
                          {c.cari_adi?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p style={{
                            margin: 0, fontSize: 13, fontWeight: 600, color: '#fff',
                            maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {c.cari_adi}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>
                            <i className="bi bi-circle-fill me-1" style={{ fontSize: 5, color: avatarColor }} />
                            {c.cari_turu?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <span style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 13, fontWeight: 600,
                        color: pozitif ? '#10b981' : '#ef4444',
                        textShadow: `0 0 10px ${pozitif ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {pozitif ? '+' : ''}{TL(bakiye)} ₺
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ padding: '44px 24px' }}>
                <i className="bi bi-people" style={{ fontSize: 28, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }} />
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, margin: '0 0 10px' }}>
                  Henüz cari kaydı yok
                </p>
                <Link to="/cariler" className="dash-link-amber" style={{ fontSize: 12 }}>
                  İlk cariyi ekle →
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
