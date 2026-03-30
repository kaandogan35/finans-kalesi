/**
 * Dashboard — 3 Tema Uyumlu (Banking / Earthy / Dark)
 * frontend-design + react-bootstrap-ui.md
 * 4 API eş zamanlı: dashboard + cariler/ozet + kasa/ozet + cek-senet/ozet
 * Uzman finansçı perspektifi: alacak yaşlandırma, risk bandı, oranlar, likidite
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { dashboardApi } from '../../api/dashboard'
import { carilerApi }   from '../../api/cariler'
import { kasaOzeti }    from '../../api/kasa'
import cekSenetApi      from '../../api/cekSenet'
import useAuthStore     from '../../stores/authStore'
import useTemaStore     from '../../stores/temaStore'
import { temaRenkleri } from '../../lib/temaRenkleri'

// ─── Tema Prefix ────────────────────────────────────────────────────────────
const prefixMap = { paramgo: 'p' }

// ─── Para Formatları ──────────────────────────────────────────────────────────
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0)

const TLKisa = (n) => `${TL(parseFloat(n ?? 0))} ₺`

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
      const pr = Math.min((now - t0) / duration, 1)
      const e = 1 - Math.pow(1 - pr, 3)
      setVal(from + (target - from) * e)
      if (pr < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return val
}

// ─── KPI Kart (Çek/Senet stili) ──────────────────────────────────────────────
function KpiKart({ baslik, deger, alt, ikon, link, yukleniyor, p, ikonRenk, renkler }) {
  const animDeger = useAnimatedNumber(parseFloat(deger ?? 0))

  return (
    <div className={`${p}-cek-kpi`}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', borderRadius: '16px 0 0 16px', background: ikonRenk, opacity: 0.7 }} />
      <i className={`bi ${ikon} ${p}-kpi-deco`} style={ikonRenk ? { color: ikonRenk, opacity: 0.35 } : undefined} />
      <h6 style={{ fontSize: 11, fontWeight: 600, color: renkler?.textSec ?? 'var(--p-text-sec)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
        {baslik}
      </h6>

      {yukleniyor ? (
        <div className={`${p}-skeleton`} style={{ height: 30, width: '75%', marginBottom: 8 }} />
      ) : (
        <div className={`${p}-td-amount financial-num`} style={{ fontSize: 28, fontWeight: 800, color: ikonRenk }}>
          {TL(animDeger)} ₺
        </div>
      )}

      {alt && !yukleniyor && (
        <p style={{ fontSize: 12, color: renkler?.textSec ?? 'var(--p-text-sec)', fontWeight: 500, margin: '8px 0 0' }}>
          {alt}
        </p>
      )}

      {link && (
        <Link to={link} className={`${p}-link-accent`} style={{ fontSize: 11, marginTop: 6, display: 'inline-block' }}>
          Detaylar <i className="bi bi-arrow-up-right" style={{ fontSize: 10 }} />
        </Link>
      )}
    </div>
  )
}

// ─── Aylık Özet Hero Kartı (v2 — Koyu Tema) ─────────────────────────────────
function AylikOzetKart({ kasaBakiye, kasaGiris, kasaCikis, haftaVadeAdet, haftaVadeTutar, yukleniyor, p, renkler }) {
  const animBakiye  = useAnimatedNumber(kasaBakiye)
  const bakiyePozitif = kasaBakiye >= 0

  // Yumuşak renk paleti — koyu arka plan üzerinde göz yormayan tonlar
  const rGirdi = '#4ADE80'   // canlı yeşil
  const rCikti = '#F87171'   // canlı kırmızı

  return (
    <div className="p-dash-hero">
      {/* Üst: etiket + tarih */}
      <div className="p-dash-hero-top">
        <div className="p-dash-hero-tag">
          <i className="bi bi-safe-fill" />
          Aylık Özet
        </div>
        <span className="p-dash-hero-date">
          {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Büyük bakiye rakamı */}
      {yukleniyor ? (
        <div className={`${p}-skeleton`} style={{ height: 42, width: 280, marginBottom: 8, borderRadius: 8 }} />
      ) : (
        <div className="p-dash-hero-amount financial-num" style={{ color: bakiyePozitif ? 'rgba(255,255,255,0.92)' : rCikti }}>
          {TL(animBakiye)} ₺
        </div>
      )}
      <div className="p-dash-hero-sublabel">Bu Ay Kasa Bakiyesi</div>

      {/* Alt metrikler */}
      <div className="p-dash-hero-metrics">
        <div className="p-dash-hero-chip">
          <i className="bi bi-arrow-down-circle-fill" style={{ color: rGirdi, fontSize: 14 }} />
          <span className="p-dash-hero-chip-label">Girdi</span>
          <span className="p-dash-hero-chip-val financial-num" style={{ color: rGirdi }}>
            {yukleniyor ? '...' : TLKisa(kasaGiris)}
          </span>
        </div>
        <div className="p-dash-hero-chip">
          <i className="bi bi-arrow-up-circle-fill" style={{ color: rCikti, fontSize: 14 }} />
          <span className="p-dash-hero-chip-label">Çıktı</span>
          <span className="p-dash-hero-chip-val financial-num" style={{ color: rCikti }}>
            {yukleniyor ? '...' : TLKisa(kasaCikis)}
          </span>
        </div>
        {!yukleniyor && kasaGiris > 0 && kasaCikis > 0 && (
          <div className="p-dash-hero-chip">
            <i className="bi bi-activity" style={{ color: (kasaGiris - kasaCikis >= 0) ? rGirdi : rCikti, fontSize: 14 }} />
            <span className="p-dash-hero-chip-label">Net</span>
            <span className="p-dash-hero-chip-val financial-num" style={{ color: (kasaGiris - kasaCikis >= 0) ? rGirdi : rCikti }}>
              {kasaGiris - kasaCikis > 0 ? '+' : ''}{TLKisa(kasaGiris - kasaCikis)}
            </span>
          </div>
        )}
      </div>

      {/* Gelir / Gider oran çubuğu */}
      {!yukleniyor && (kasaGiris > 0 || kasaCikis > 0) && (() => {
        const toplam = kasaGiris + kasaCikis
        const girisYuzde = toplam > 0 ? Math.round((kasaGiris / toplam) * 100) : 50
        return (
          <div className="p-dash-hero-ratio">
            <div className="p-dash-hero-ratio-labels">
              <span>Gelir %{girisYuzde}</span>
              <span>Gider %{100 - girisYuzde}</span>
            </div>
            <div className="p-dash-hero-ratio-bar">
              <div className="p-dash-hero-ratio-fill" style={{ width: `${girisYuzde}%` }} />
            </div>
          </div>
        )
      })()}

      {/* Vade uyarı chip */}
      {!yukleniyor && haftaVadeAdet > 0 && (
        <div className="p-dash-hero-alerts">
          <div className="p-dash-alert-chip p-dash-alert-warning">
            <i className="bi bi-exclamation-triangle-fill" />
            {haftaVadeAdet} çek bu hafta · {TLKisa(haftaVadeTutar)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Net Çek / Senet KPI Kartı (Çek/Senet stili) ─────────────────────────────
function NetCekKpiKart({ alacakToplam, borcToplam, yukleniyor, p, renkler }) {
  const net     = alacakToplam - borcToplam
  const pozitif = net >= 0
  const animNet = useAnimatedNumber(net)

  const accentRenk = pozitif ? renkler.success : renkler.danger

  return (
    <div className={`${p}-cek-kpi`}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', borderRadius: '16px 0 0 16px', background: accentRenk, opacity: 0.7 }} />
      <i
        className={`bi bi-arrow-left-right ${p}-kpi-deco`}
        style={{ color: renkler.info, opacity: 0.35 }}
      />
      <h6 style={{ fontSize: 11, fontWeight: 600, color: renkler.textSec, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
        Çekten Alacağım
      </h6>

      {yukleniyor ? (
        <div className={`${p}-skeleton`} style={{ height: 30, width: '75%', marginBottom: 8 }} />
      ) : (
        <div
          className={`${p}-td-amount financial-num`}
          style={{ fontSize: 28, fontWeight: 800, color: accentRenk }}
        >
          {net > 0 ? '+' : ''}{TL(animNet)} ₺
        </div>
      )}

      {yukleniyor ? (
        <>
          <div className={`${p}-skeleton`} style={{ height: 11, width: '65%', marginBottom: 5 }} />
          <div className={`${p}-skeleton`} style={{ height: 11, width: '55%' }} />
        </>
      ) : (
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: renkler.success, fontWeight: 500 }}>
            ● <span className="financial-num">{TLKisa(alacakToplam)}</span> Alacağım
          </span>
          <span style={{ fontSize: 11, color: renkler.danger, fontWeight: 700 }}>
            ● <span className="financial-num">{TLKisa(borcToplam)}</span> Ödeyeceğim
          </span>
        </div>
      )}

      <Link to="/cek-senet" className={`${p}-link-accent`} style={{ fontSize: 11, marginTop: 6, display: 'inline-block' }}>
        Detaylar <i className="bi bi-arrow-up-right" style={{ fontSize: 10 }} />
      </Link>
    </div>
  )
}

// ─── Risk Seviye Rozeti ───────────────────────────────────────────────────────
function VadeRozeti({ gun, p }) {
  if (gun === null) return null
  if (gun < 0)   return <span className={`${p}-badge-vade ${p}-badge-overdue`}>Vadesi Geçti</span>
  if (gun === 0) return <span className={`${p}-badge-vade ${p}-badge-today`}>Bugün!</span>
  if (gun <= 3)  return <span className={`${p}-badge-vade ${p}-badge-critical`}>{gun} gün</span>
  if (gun <= 7)  return <span className={`${p}-badge-vade ${p}-badge-caution`}>{gun} gün</span>
  if (gun <= 15) return <span className={`${p}-badge-vade ${p}-badge-attention`}>{gun} gün</span>
  return <span className={`${p}-badge-vade ${p}-badge-ok`}>{gun} gün</span>
}

// ─── Durum Rozeti ─────────────────────────────────────────────────────────────
function DurumRozeti({ durum, p, renkler }) {
  const harita = {
    portfoyde:    { c: renkler.info,    l: 'Elimde'                  },
    odendi:       { c: renkler.success, l: 'Ödendi'                  },
    tahsilde:     { c: renkler.info,    l: 'Bankada / Tahsilatta'    },
    karsilıksız:  { c: renkler.danger,  l: 'Karşılıksız'  },
    ciroslu:      { c: renkler.info,    l: 'Cirolu'       },
    banka_garantili: { c: renkler.info, l: 'Banka Garanti' },
  }
  const s = harita[durum] || { c: renkler.textSec, l: durum || '—' }
  return (
    <span className="d-inline-flex align-items-center gap-1">
      <span className={`${p}-status-dot`} style={{ background: s.c, boxShadow: `0 0 6px ${s.c}88` }} />
      <span style={{ fontSize: 11, fontWeight: 600 }} className={`${p}-metric-label`}>{s.l}</span>
    </span>
  )
}

// ─── Panel Başlığı ────────────────────────────────────────────────────────────
function PanelBaslik({ ikon, baslik, link, p }) {
  return (
    <div className={`${p}-panel-header`}>
      <div className={`${p}-panel-title`}>
        <i className={`bi ${ikon}`} />
        {baslik}
      </div>
      {link && (
        <Link to={link} className={`${p}-link-accent`} style={{ fontSize: 11 }}>
          Tümünü gör <i className="bi bi-arrow-right" style={{ fontSize: 10 }} />
        </Link>
      )}
    </div>
  )
}

// ─── İskelet Satır ────────────────────────────────────────────────────────────
function IskeleSatir({ p }) {
  return (
    <div className="d-flex align-items-center gap-3" style={{ padding: '12px 20px' }}>
      <div className={`${p}-skeleton`} style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className={`${p}-skeleton`} style={{ height: 12, width: '55%', marginBottom: 7 }} />
        <div className={`${p}-skeleton`} style={{ height: 10, width: '38%' }} />
      </div>
      <div className={`${p}-skeleton`} style={{ height: 12, width: 80 }} />
    </div>
  )
}

// ─── Yatay Oran Çubuğu ────────────────────────────────────────────────────────
function OranCubugu({ etiket1, yuzde1, renk1, etiket2, yuzde2, renk2, p }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="d-flex justify-content-between mb-1">
        <span style={{ fontSize: 11, fontWeight: 700, color: renk1 }}>{etiket1} %{yuzde1}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: renk2 }}>{etiket2} %{yuzde2}</span>
      </div>
      <div className={`${p}-ratio-track`}>
        <div
          className={`${p}-ratio-fill-left`}
          style={{
            width: `${yuzde1}%`,
            background: `linear-gradient(90deg, ${renk1}cc, ${renk1})`,
            boxShadow: `0 0 8px ${renk1}66`,
          }}
        />
        <div
          className={`${p}-ratio-fill-right`}
          style={{ background: `linear-gradient(90deg, ${renk2}, ${renk2}cc)` }}
        />
      </div>
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { kullanici } = useAuthStore()
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'p'
  const renkler = temaRenkleri[aktifTema] || temaRenkleri.paramgo


  // Veri state
  const [dash,   setDash]   = useState(null)
  const [cari,   setCari]   = useState(null)
  const [kasa,   setKasa]   = useState(null)
  const [cek,    setCek]    = useState(null)
  const [yukl,   setYukl]   = useState(true)
  const [gunc,   setGunc]   = useState(null)
  const [donuyor, setDonuyor] = useState(false)
  const [showHizliIslem, setShowHizliIslem] = useState(false)
  const navigate = useNavigate()

  // ─ Pull to refresh ──────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const pullYRef = useRef(0)
  const pullIndicatorRef = useRef(null)
  const pageRef = useRef(null)

  // Hızlı işlem seçenekleri
  const hizliIslemler = [
    { icon: 'bi-receipt',           label: 'Yeni Çek / Senet',   path: '/cek-senet' },
    { icon: 'bi-arrow-down-circle', label: 'Gelir Ekle',         path: '/gelirler' },
    { icon: 'bi-arrow-up-circle',   label: 'Gider Ekle',         path: '/giderler' },
    { icon: 'bi-cash-coin',         label: 'Kasa Hareketi Ekle', path: '/kasa' },
    { icon: 'bi-person-plus',       label: 'Yeni Firma Ekle',    path: '/cariler' },
    { icon: 'bi-calendar-plus',     label: 'Tahsilat Planla',    path: '/odemeler' },
  ]

  const handleHizliIslem = (path) => {
    setShowHizliIslem(false)
    navigate(path)
  }

  // ESC ile Hızlı İşlem modalını kapat
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setShowHizliIslem(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

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

  // Pull-to-refresh handlers — DOM manipülasyonu ile (setState yok, re-render yok)
  const handleTouchStart = useCallback((e) => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop || 0
    touchStartY.current = scrollTop <= 5 ? e.touches[0].clientY : 0
    pullYRef.current = 0
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!touchStartY.current || refreshing) return
    const diff = e.touches[0].clientY - touchStartY.current
    if (diff > 0 && diff < 140) {
      pullYRef.current = diff
      // DOM direkt güncelleme — setState yok, re-render yok
      if (pullIndicatorRef.current) {
        pullIndicatorRef.current.style.height = `${diff / 2}px`
        pullIndicatorRef.current.style.opacity = Math.min(diff / 70, 1)
      }
    }
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (pullYRef.current > 70 && !refreshing) {
      setRefreshing(true)
      await verileriYukle(true)
      setRefreshing(false)
    }
    pullYRef.current = 0
    if (pullIndicatorRef.current) {
      pullIndicatorRef.current.style.height = '0px'
      pullIndicatorRef.current.style.opacity = '0'
    }
    touchStartY.current = 0
  }, [refreshing, verileriYukle])

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

  // Kasa — Gösterge Paneli ile aynı kaynak: merkez_kasa + banka toplamı (kümülatif)
  const kasaBakiye = parseFloat(kasa?.merkez_kasa_bakiye ?? 0) + parseFloat(kasa?.banka_bakiye ?? 0)
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

  // Net Çek Pozisyonu (dashboard API'sinden gelen alacak/borç ayrımı)
  const cekAlacakToplam = parseFloat(dash?.cekSenet?.alacak_toplam ?? 0)
  const cekBorcToplam   = parseFloat(dash?.cekSenet?.borc_toplam   ?? 0)

  // Gecikmiş çekler (tarihi geçmiş, işlem yapılmamış)
  const gecikenTahsilAdet   = dash?.cekSenet?.geciken_tahsil_adet   ?? 0
  const gecikenTahsilToplam = parseFloat(dash?.cekSenet?.geciken_tahsil_toplam ?? 0)
  const gecikenKendiAdet    = dash?.cekSenet?.geciken_kendi_adet    ?? 0
  const gecikenKendiToplam  = parseFloat(dash?.cekSenet?.geciken_kendi_toplam  ?? 0)

  // Ödemeler
  const bekleyenToplam = parseFloat(dash?.odeme?.bekleyen_toplam ?? 0)
  const bekleyenAdet   = dash?.odeme?.bekleyen_adet ?? 0

  // Yaklaşan vadeler
  const yakVadeler = (dash?.cekSenet?.yaklasan_vadeler ?? [])
    .map(v => ({ ...v, gun: gunKaldi(v.vade_tarihi) }))
    .sort((a, b) => (a.gun ?? 999) - (b.gun ?? 999))

  // Kritik vade sayısı ve tutarı (7 gün veya daha az)
  const haftaVadeler   = yakVadeler.filter(v => v.gun !== null && v.gun <= 7)
  const kritikVade     = haftaVadeler.length
  const haftaVadeTutar = haftaVadeler.reduce((s, v) => s + parseFloat(v.tutar_tl ?? 0), 0)

  // Selamlama
  const sh = new Date().getHours()
  const selamlama = sh < 12 ? 'Günaydın' : sh < 18 ? 'İyi günler' : 'İyi akşamlar'
  const ad = kullanici?.ad_soyad?.split(' ')[0] || ''

  // ─── KPI Veri Dizisi (5 standart kart — 6. slot NetCekKpiKart) ───────────
  const kpiler = [
    {
      baslik: 'Toplam Alacak',
      deger: topAlacak,
      alt: `${aktifCari} aktif cari · Net: ${netPozitif ? '+' : ''}${TLKisa(netPozisyon)}`,
      ikon: 'bi-arrow-down-circle-fill',
      ikonRenk: renkler.success,
      link: '/cariler',
    },
    {
      baslik: 'Toplam Borç',
      deger: topBorc,
      alt: topBorc > 0
        ? `Alacak/Borç: %${alacakYuzde} / %${borcYuzde}`
        : 'Borç kaydı yok',
      ikon: 'bi-arrow-up-circle-fill',
      ikonRenk: renkler.danger,
      link: '/cariler',
    },
    {
      baslik: 'Kasa Bakiyesi',
      deger: kasaBakiye,
      alt: (kasaGiris > 0 || kasaCikis > 0)
        ? `↑ ${TLKisa(kasaGiris)} · ↓ ${TLKisa(kasaCikis)} bu ay`
        : 'Nakit varlığı',
      ikon: 'bi-safe-fill',
      ikonRenk: renkler.info,
      link: '/kasa',
    },
    // 4. slot → NetCekKpiKart (ayrı render edilecek)
    {
      baslik: 'Elimdeki Çekler',
      deger: cekPortfoyde,
      alt: cekPortfoyAdet > 0
        ? `${cekPortfoyAdet} adet evrak elimde`
        : 'Elimde evrak yok',
      ikon: 'bi-collection-fill',
      ikonRenk: renkler.primary,
      link: '/cek-senet',
    },
    {
      baslik: 'Kullanılabilir Nakit',
      deger: likidite,
      alt: `${TLKisa(kasaBakiye)} kasa + ${TLKisa(topAlacak)} alacak`,
      ikon: 'bi-graph-up-arrow',
      ikonRenk: renkler.info,
      link: null,
    },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`${p}-page-root`} ref={pageRef}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Pull to refresh indicator — DOM ref ile güncellenir, re-render yok */}
      <div ref={pullIndicatorRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: 0, opacity: 0, overflow: 'hidden', transition: 'height 0.2s, opacity 0.2s' }}>
        <i className={`bi bi-arrow-clockwise${refreshing ? ' p-spin' : ''}`}
          style={{ fontSize: 22, color: 'var(--p-primary)' }} />
      </div>
      {/* ─── Başlık ────────────────────────────────────────────────────────── */}
      <div className={`${p}-page-header ${p}-greeting`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon`}>
            <i className="bi bi-grid-1x2-fill" />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>
              {selamlama}{ad ? `, ${ad}` : ''} 👋
            </h1>
            <p className={`${p}-page-sub`}>
              {gunc
                ? `Son güncelleme: ${gunc.toLocaleTimeString('tr-TR')}`
                : 'Finansal durumunuzun güncel özeti'
              }
            </p>
          </div>
        </div>
        <div className={`${p}-page-header-right`}>
          <button
            data-tur="hizli-islem"
            className={`${p}-btn-accent`}
            onClick={() => setShowHizliIslem(true)}
          >
            <i className="bi bi-plus-lg" style={{ fontSize: 14 }} />
            Hızlı İşlem
          </button>
        </div>
      </div>

      {/* ─── Aylık Özet ─────────────────────────────────────────────────── */}
      <AylikOzetKart
        kasaBakiye={kasaBakiye}
        kasaGiris={kasaGiris}
        kasaCikis={kasaCikis}
        haftaVadeAdet={kritikVade}
        haftaVadeTutar={haftaVadeTutar}
        yukleniyor={yukl}
        p={p}
        renkler={renkler}
      />

      {/* ─── KPI Kartları (3'lü) ────────────────────────────────────────── */}
      <div className={`${p}-kpi-grid-3`} data-tur="kpi-kartlar">
        <NetCekKpiKart
          alacakToplam={cekAlacakToplam}
          borcToplam={cekBorcToplam}
          yukleniyor={yukl}
          p={p}
          renkler={renkler}
        />
        <KpiKart key={kpiler[3].baslik} {...kpiler[3]} yukleniyor={yukl} p={p} renkler={renkler} />
        <KpiKart key={kpiler[4].baslik} {...kpiler[4]} yukleniyor={yukl} p={p} renkler={renkler} />
      </div>

      {/* ─── Risk Uyarı Bandı — tarihi geçmiş işlemsiz çekler ─────────────── */}
      {!yukl && (gecikenTahsilAdet > 0 || gecikenKendiAdet > 0) && (
        <div className={`${p}-risk-band`}>
          <div className={`${p}-risk-band-icon`}>
            <i className="bi bi-exclamation-triangle-fill" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
              Vadesi Geçmiş Çekler
            </p>
            <p className={`${p}-metric-label`} style={{ margin: '2px 0 0' }}>
              {gecikenTahsilAdet > 0 && (
                <span>
                  Bankada / Tahsilatta: <strong>{gecikenTahsilAdet} adet</strong> · {TLKisa(gecikenTahsilToplam)}
                </span>
              )}
              {gecikenTahsilAdet > 0 && gecikenKendiAdet > 0 && ' · '}
              {gecikenKendiAdet > 0 && (
                <span>
                  Kendi Çekimiz: <strong>{gecikenKendiAdet} adet</strong> · {TLKisa(gecikenKendiToplam)}
                </span>
              )}
            </p>
          </div>
          <Link to="/cek-senet" className={`${p}-link-accent`} style={{ whiteSpace: 'nowrap' }}>
            İncele <i className="bi bi-arrow-right" />
          </Link>
        </div>
      )}


      {/* ─── Orta: Analiz ──────────────────────────────────────────────────── */}
      <div className={`${p}-analiz-grid`} data-tur="grafik-alan">

        {/* Kasa & Nakit Akış */}
        <div className={`${p}-panel`} style={{ height: '100%' }}>
          <PanelBaslik ikon="bi-safe-fill" baslik="Kasa & Nakit Durumu" link="/kasa" p={p} />
          {yukl ? (
            <div style={{ padding: 16 }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="d-flex justify-content-between align-items-center" style={{ marginBottom: 10 }}>
                  <div className={`${p}-skeleton`} style={{ height: 12, width: '40%' }} />
                  <div className={`${p}-skeleton`} style={{ height: 12, width: '30%' }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className={`${p}-metric-row`}>
                <span className={`${p}-metric-label`}>Mevcut Bakiye</span>
                <span className={`${p}-metric-value financial-num`} style={{ color: kasaBakiye >= 0 ? renkler.success : renkler.danger }}>
                  {TL(kasaBakiye)} ₺
                </span>
              </div>
              {kasaGiris > 0 && (
                <div className={`${p}-metric-row`}>
                  <span className={`${p}-metric-label`}>Bu Ay Giriş</span>
                  <span className={`${p}-metric-value financial-num`} style={{ color: renkler.success }}>
                    +{TL(kasaGiris)} ₺
                  </span>
                </div>
              )}
              {kasaCikis > 0 && (
                <div className={`${p}-metric-row`}>
                  <span className={`${p}-metric-label`}>Bu Ay Çıkış</span>
                  <span className={`${p}-metric-value financial-num`} style={{ color: renkler.danger }}>
                    -{TL(kasaCikis)} ₺
                  </span>
                </div>
              )}
              {kasaGiris > 0 && kasaCikis > 0 && (
                <div className={`${p}-metric-row`}>
                  <span className={`${p}-metric-label`}>Bu Ay Net</span>
                  <span className={`${p}-metric-value financial-num`} style={{
                    color: kasaGiris - kasaCikis >= 0 ? renkler.success : renkler.danger,
                    fontWeight: 700,
                  }}>
                    {kasaGiris - kasaCikis > 0 ? '+' : ''}{TL(kasaGiris - kasaCikis)} ₺
                  </span>
                </div>
              )}
              <div className={`${p}-metric-row`}>
                <span className={`${p}-metric-label`}>
                  <i className="bi bi-info-circle me-1" style={{ fontSize: 11, opacity: 0.6 }} />
                  Kullanılabilir Nakit
                </span>
                <span className={`${p}-metric-value financial-num`} style={{ color: renkler.info }}>
                  {TLKisa(likidite)}
                </span>
              </div>
              {/* Alacak / Borç oran çubuğu */}
              {(topAlacak + topBorc) > 0 && (
                <div style={{ padding: '8px 20px 4px' }}>
                  <OranCubugu
                    etiket1={`Alacak %${alacakYuzde}`}
                    yuzde1={alacakYuzde}
                    renk1={renkler.success}
                    etiket2={`Borç %${borcYuzde}`}
                    yuzde2={borcYuzde}
                    renk2={renkler.danger}
                    p={p}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Portföy Dağılımı */}
        <div className={`${p}-panel`} style={{ height: '100%' }}>
          <PanelBaslik ikon="bi-pie-chart-fill" baslik="Çek/Senet Özeti" link="/cek-senet" p={p} />
          {yukl ? (
            <div style={{ padding: 16 }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="d-flex justify-content-between align-items-center" style={{ marginBottom: 10 }}>
                  <div className={`${p}-skeleton`} style={{ height: 12, width: '45%' }} />
                  <div className={`${p}-skeleton`} style={{ height: 12, width: '30%' }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Portföy, Tahsil, Borçlu satırları */}
              {[
                { etiket: 'Portföy',     tutar: cekPortfoyde,    renk: renkler.info,    ikon: 'bi-archive-fill',      aciklama: 'Elinizdeki çek/senet' },
                { etiket: 'Tahsil',      tutar: cekAlacakToplam, renk: renkler.success, ikon: 'bi-hourglass-split',   aciklama: 'Tahsil edilecek alacak' },
                { etiket: 'Borçlu Çek',  tutar: cekBorcToplam,   renk: renkler.danger,  ikon: 'bi-arrow-up-circle-fill', aciklama: 'Ödenecek borç çeki' },
              ].map(({ etiket, tutar, renk, ikon, aciklama }) => (
                <div key={etiket} className={`${p}-metric-row`}>
                  <span className={`d-flex align-items-center gap-2 ${p}-metric-label`}>
                    <i className={`bi ${ikon}`} style={{ color: renk, fontSize: 12 }} />
                    <span>
                      {etiket}
                      <span style={{ display: 'block', fontSize: 10, opacity: 0.55, fontWeight: 400 }}>{aciklama}</span>
                    </span>
                  </span>
                  <span className={`${p}-metric-value financial-num`} style={{ color: tutar > 0 ? renk : renkler.textSec }}>
                    {tutar > 0 ? `${TL(tutar)} ₺` : '—'}
                  </span>
                </div>
              ))}

              {/* Net Durum — Tahsil − Borçlu */}
              {(() => {
                const net = cekAlacakToplam - cekBorcToplam
                const pozitif = net >= 0
                return (
                  <div
                    style={{
                      margin: '10px 20px 8px',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: pozitif ? `${renkler.success}12` : `${renkler.danger}12`,
                      border: `1px solid ${pozitif ? renkler.success : renkler.danger}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: pozitif ? renkler.success : renkler.danger, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className={`bi ${pozitif ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}`} style={{ fontSize: 13 }} />
                      Net Durum
                      <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>(Tahsil − Borçlu)</span>
                    </span>
                    <span className="financial-num" style={{ fontSize: 15, fontWeight: 800, color: pozitif ? renkler.success : renkler.danger }}>
                      {net > 0 ? '+' : ''}{TL(net)} ₺
                    </span>
                  </div>
                )
              })()}

              {/* Oran çubuğu: Tahsil vs Borçlu */}
              {(cekAlacakToplam + cekBorcToplam) > 0 && (
                <div style={{ padding: '4px 20px 8px' }}>
                  <OranCubugu
                    etiket1={`Tahsil %${Math.round((cekAlacakToplam / (cekAlacakToplam + cekBorcToplam)) * 100)}`}
                    yuzde1={Math.round((cekAlacakToplam / (cekAlacakToplam + cekBorcToplam)) * 100)}
                    renk1={renkler.success}
                    etiket2={`Borçlu %${Math.round((cekBorcToplam / (cekAlacakToplam + cekBorcToplam)) * 100)}`}
                    yuzde2={Math.round((cekBorcToplam / (cekAlacakToplam + cekBorcToplam)) * 100)}
                    renk2={renkler.danger}
                    p={p}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>


      {/* ── Hızlı İşlem Modalı ─────────────────────────────────────────── */}
      {showHizliIslem && (
        <>
          <div className={`${p}-modal-overlay`} onClick={() => setShowHizliIslem(false)} aria-hidden="true" />
          <div
            className={`${p}-modal-center ${p}-modal-confirm`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-hizli-title"
            onClick={(e) => e.target === e.currentTarget && setShowHizliIslem(false)}
          >
            <div className={`${p}-modal-box`} style={{ maxWidth: 440 }}>
              <div className={`${p}-modal-header ${p}-mh-default`}>
                <h2 className={`${p}-modal-title`} id="dash-hizli-title">
                  <i className="bi bi-plus-circle-fill" aria-hidden="true" />
                  Hızlı İşlem Oluştur
                </h2>
                <button
                  className={`${p}-modal-close`}
                  onClick={() => setShowHizliIslem(false)}
                  type="button"
                  aria-label="Kapat"
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>
              <div className={`${p}-modal-body`}>
                <p className={`${p}-modal-desc`}>
                  Hangi işlemi gerçekleştirmek istiyorsunuz?
                </p>
                <div className={`${p}-modal-options`}>
                  {hizliIslemler.map((islem) => (
                    <button
                      key={islem.label}
                      className={`${p}-modal-option`}
                      type="button"
                      onClick={() => handleHizliIslem(islem.path)}
                    >
                      <div className={`${p}-modal-opt-icon`} aria-hidden="true">
                        <i className={`bi ${islem.icon}`} />
                      </div>
                      <span>{islem.label}</span>
                      <i className={`bi bi-chevron-right ms-auto ${p}-modal-opt-arrow`} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
              <div className={`${p}-modal-esc-hint`}>
                <kbd>Esc</kbd> ile kapat
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
