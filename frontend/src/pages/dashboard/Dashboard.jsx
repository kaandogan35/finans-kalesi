/**
 * Dashboard — 3 Tema Uyumlu (Banking / Earthy / Dark)
 * frontend-design + react-bootstrap-ui.md
 * 4 API eş zamanlı: dashboard + cariler/ozet + kasa/ozet + cek-senet/ozet
 * Uzman finansçı perspektifi: alacak yaşlandırma, risk bandı, oranlar, likidite
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { Link }        from 'react-router-dom'
import { dashboardApi } from '../../api/dashboard'
import { carilerApi }   from '../../api/cariler'
import { kasaOzeti }    from '../../api/kasa'
import cekSenetApi      from '../../api/cekSenet'
import useAuthStore     from '../../stores/authStore'
import useTemaStore     from '../../stores/temaStore'
import { temaRenkleri } from '../../lib/temaRenkleri'

// ─── Tema Prefix ────────────────────────────────────────────────────────────
const prefixMap = { banking: 'b', earthy: 'e', dark: 'd' }

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

// ─── KPI Kart ─────────────────────────────────────────────────────────────────
function KpiKart({ baslik, deger, alt, ikon, link, yukleniyor, p }) {
  const animDeger = useAnimatedNumber(parseFloat(deger ?? 0))

  return (
    <div className={`${p}-kpi-card`}>
      <i className={`bi ${ikon} ${p}-kpi-deco`} />
      <h6 className={`${p}-kpi-label`}>{baslik}</h6>

      {yukleniyor ? (
        <div className={`${p}-skeleton`} style={{ height: 30, width: '75%', marginBottom: 8 }} />
      ) : (
        <div className={`${p}-kpi-value`}>
          {TL(animDeger)} ₺
        </div>
      )}

      {alt && !yukleniyor && (
        <p className={`${p}-kpi-sub neutral`}>{alt}</p>
      )}

      {link && (
        <Link to={link} className={`${p}-link-accent`} style={{ fontSize: 11, marginTop: 4 }}>
          Detaylar <i className="bi bi-arrow-up-right" style={{ fontSize: 10 }} />
        </Link>
      )}
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
    portfoyde:    { c: renkler.accent,  l: 'Portföyde'   },
    odendi:       { c: renkler.success, l: 'Ödendi'       },
    tahsilde:     { c: renkler.accent,  l: 'Tahsilde'     },
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
  const p = prefixMap[aktifTema] || 'b'
  const renkler = temaRenkleri[aktifTema] || temaRenkleri.banking

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
      link: '/cariler',
    },
    {
      baslik: 'Toplam Borç',
      deger: topBorc,
      alt: `Net: ${netPozitif ? '+' : ''}${TLKisa(netPozisyon)}`,
      ikon: 'bi-arrow-up-circle-fill',
      link: '/cariler',
    },
    {
      baslik: 'Kasa Bakiyesi',
      deger: kasaBakiye,
      alt: kasaGiris > 0 ? `Bu ay giriş: ${TLKisa(kasaGiris)}` : 'Nakit varlığı',
      ikon: 'bi-safe-fill',
      link: '/kasa',
    },
    {
      baslik: 'Portföydeki Çekler',
      deger: cekPortfoyde,
      alt: `${cekPortfoyAdet} adet`,
      ikon: 'bi-file-earmark-text-fill',
      link: '/cek-senet',
    },
    {
      baslik: 'Bekleyen Ödemeler',
      deger: bekleyenToplam,
      alt: `${bekleyenAdet} işlem bekliyor`,
      ikon: 'bi-credit-card-2-fill',
      link: '/odemeler',
    },
    {
      baslik: 'Likidite Tahmini',
      deger: likidite,
      alt: 'Kasa + Alacak toplamı',
      ikon: 'bi-graph-up-arrow',
      link: null,
    },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`${p}-page-root`}>

      {/* ─── Başlık ────────────────────────────────────────────────────────── */}
      <div className={`d-flex align-items-start justify-content-between ${p}-greeting`}>
        <div>
          <h1>
            {selamlama}{ad ? `, ${ad}` : ''} 👋
          </h1>
          <p className={`${p}-greeting-sub`}>
            {gunc
              ? `Son güncelleme: ${gunc.toLocaleTimeString('tr-TR')}`
              : 'Finansal durumunuzun güncel özeti'
            }
          </p>
        </div>
        <button
          className={`${p}-btn-accent`}
          onClick={() => verileriYukle(true)}
          disabled={yukl}
        >
          <i className={`bi bi-arrow-clockwise${donuyor ? ` ${p}-spin` : ''}`} style={{ fontSize: 14 }} />
          Yenile
        </button>
      </div>

      {/* ─── KPI Kartları (6'lı, 3 sütun) ────────────────────────────────── */}
      <div className={`${p}-kpi-grid-3`}>
        {kpiler.map((k) => (
          <KpiKart key={k.baslik} {...k} yukleniyor={yukl} p={p} />
        ))}
      </div>

      {/* ─── Risk Uyarı Bandı (Karşılıksız Çek) ──────────────────────────── */}
      {!yukl && (cekKarsilıksızAdet > 0 || kritikVade > 0) && (
        <div className={`${p}-risk-band`}>
          <div className={`${p}-risk-band-icon`}>
            <i className="bi bi-exclamation-triangle-fill" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
              Risk Uyarısı
            </p>
            <p className={`${p}-metric-label`} style={{ margin: '2px 0 0' }}>
              {cekKarsilıksızAdet > 0 && `${cekKarsilıksızAdet} adet karşılıksız çek (${TLKisa(cekKarsilıksız)}) `}
              {cekKarsilıksızAdet > 0 && kritikVade > 0 && '· '}
              {kritikVade > 0 && `${kritikVade} çek/senet 7 gün içinde vadesine geliyor`}
            </p>
          </div>
          <Link to="/cek-senet" className={`${p}-link-accent`} style={{ whiteSpace: 'nowrap' }}>
            İncele <i className="bi bi-arrow-right" />
          </Link>
        </div>
      )}

      {/* ─── Net Pozisyon Bandı ────────────────────────────────────────────── */}
      {!yukl && (
        <div className={`${p}-net-band`}>
          <i
            className={`bi ${netPozitif ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}`}
            style={{ fontSize: 22, color: netPozitif ? renkler.success : renkler.danger, flexShrink: 0 }}
          />
          <div>
            <p className={`${p}-net-band-label`}>Piyasa Net Pozisyonu</p>
            <p className={`${p}-net-band-value`} style={{ color: netPozitif ? renkler.success : renkler.danger }}>
              {netPozisyon > 0 ? '+' : ''}{TL(netPozisyon)} ₺
            </p>
          </div>

          {toplamCiro > 0 && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <OranCubugu
                etiket1="Alacak" yuzde1={alacakYuzde} renk1={renkler.success}
                etiket2="Borç"   yuzde2={borcYuzde}   renk2={renkler.danger}
                p={p}
              />
            </div>
          )}

          <p className={`${p}-net-band-hint`}>Alacak − Borç</p>
        </div>
      )}

      {/* ─── Orta: Analiz ──────────────────────────────────────────────────── */}
      <div className={`${p}-analiz-grid`}>

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
                <span className={`${p}-metric-value`} style={{ color: kasaBakiye >= 0 ? renkler.accent : renkler.danger }}>
                  {TL(kasaBakiye)} ₺
                </span>
              </div>
              {kasaGiris > 0 && (
                <div className={`${p}-metric-row`}>
                  <span className={`${p}-metric-label`}>Bu Ay Giriş</span>
                  <span className={`${p}-metric-value`} style={{ color: renkler.success }}>
                    +{TL(kasaGiris)} ₺
                  </span>
                </div>
              )}
              {kasaCikis > 0 && (
                <div className={`${p}-metric-row`}>
                  <span className={`${p}-metric-label`}>Bu Ay Çıkış</span>
                  <span className={`${p}-metric-value`} style={{ color: renkler.danger }}>
                    -{TL(kasaCikis)} ₺
                  </span>
                </div>
              )}
              {kasaGiris > 0 && kasaCikis > 0 && (
                <div className={`${p}-metric-row`}>
                  <span className={`${p}-metric-label`}>Bu Ay Net</span>
                  <span className={`${p}-metric-value`} style={{
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
                  Likidite Tahmini
                </span>
                <span className={`${p}-metric-value`} style={{ color: renkler.info }}>
                  {TLKisa(likidite)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Portföy Dağılımı */}
        <div className={`${p}-panel`} style={{ height: '100%' }}>
          <PanelBaslik ikon="bi-pie-chart-fill" baslik="Çek/Senet Portföy Dağılımı" link="/cek-senet" p={p} />
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
              {[
                { etiket: 'Portföyde',   tutar: cekPortfoyde,    renk: renkler.accent,  ikon: 'bi-archive-fill' },
                { etiket: 'Tahsilde',    tutar: cekTahsilToplam, renk: renkler.accent,  ikon: 'bi-hourglass-split' },
                { etiket: 'Ödendi',      tutar: cekOdendi,       renk: renkler.success, ikon: 'bi-check-circle-fill' },
                { etiket: 'Karşılıksız', tutar: cekKarsilıksız,  renk: renkler.danger,  ikon: 'bi-x-circle-fill' },
              ].map(({ etiket, tutar, renk, ikon }) => (
                <div key={etiket} className={`${p}-metric-row`}>
                  <span className={`d-flex align-items-center gap-2 ${p}-metric-label`}>
                    <i className={`bi ${ikon}`} style={{ color: renk, fontSize: 12 }} />
                    {etiket}
                  </span>
                  <span className={`${p}-metric-value`} style={{ color: tutar > 0 ? renk : renkler.textSec }}>
                    {tutar > 0 ? `${TL(tutar)} ₺` : '—'}
                  </span>
                </div>
              ))}
              {(cekPortfoyde + cekTahsilToplam + cekOdendi) > 0 && (
                <div style={{ padding: '10px 20px' }}>
                  <OranCubugu
                    etiket1={`Aktif %${Math.round(((cekPortfoyde + cekTahsilToplam) / (cekPortfoyde + cekTahsilToplam + cekOdendi + cekKarsilıksız || 1)) * 100)}`}
                    yuzde1={Math.round(((cekPortfoyde + cekTahsilToplam) / (cekPortfoyde + cekTahsilToplam + cekOdendi + cekKarsilıksız || 1)) * 100)}
                    renk1={renkler.accent}
                    etiket2={`Kapandı %${Math.round(((cekOdendi + cekKarsilıksız) / (cekPortfoyde + cekTahsilToplam + cekOdendi + cekKarsilıksız || 1)) * 100)}`}
                    yuzde2={Math.round(((cekOdendi + cekKarsilıksız) / (cekPortfoyde + cekTahsilToplam + cekOdendi + cekKarsilıksız || 1)) * 100)}
                    renk2={renkler.textSec}
                    p={p}
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
          <div className={`${p}-panel`} style={{ height: '100%' }}>
            <PanelBaslik ikon="bi-clock-fill" baslik="Yaklaşan Vadeler" link="/cek-senet" p={p} />
            {yukl ? (
              <div style={{ padding: '4px 0' }}>
                {[1,2,3,4].map(i => <IskeleSatir key={i} p={p} />)}
              </div>
            ) : yakVadeler.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {yakVadeler.slice(0, 6).map((v) => (
                  <li key={v.id} className={`${p}-list-row`}>
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className={`${p}-avatar`}
                        style={{
                          background: (v.gun !== null && v.gun <= 3)
                            ? `${renkler.danger}1e` : `${renkler.accent}1a`,
                          color: (v.gun !== null && v.gun <= 3) ? renkler.danger : renkler.accent,
                        }}
                      >
                        <i className="bi bi-file-earmark-text" style={{ fontSize: 14 }} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                          {v.seri_no || 'Seri yok'}
                        </p>
                        <p className={`${p}-metric-label`} style={{ margin: '2px 0 0', fontSize: 11 }}>
                          <i className="bi bi-calendar3 me-1" style={{ fontSize: 10 }} />
                          {tarihFmt(v.vade_tarihi)}
                        </p>
                      </div>
                    </div>
                    <div className="text-end d-flex flex-column align-items-end gap-1">
                      <span className={`${p}-metric-value`}>
                        {TL(v.tutar_tl)} ₺
                      </span>
                      <VadeRozeti gun={v.gun} p={p} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={`${p}-empty-state`}>
                <i className="bi bi-check-circle" style={{ color: renkler.success }} />
                <p>Yaklaşan vade bulunmuyor</p>
              </div>
            )}
          </div>
        </div>

        {/* Yüksek Bakiyeli Cariler */}
        <div className="col-12 col-lg-6">
          <div className={`${p}-panel`} style={{ height: '100%' }}>
            <PanelBaslik ikon="bi-people-fill" baslik="Yüksek Bakiyeli Cariler" link="/cariler" p={p} />
            {yukl ? (
              <div style={{ padding: '4px 0' }}>
                {[1,2,3,4].map(i => <IskeleSatir key={i} p={p} />)}
              </div>
            ) : (dash?.cari?.en_yuksek_bakiyeli?.length > 0) ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {dash.cari.en_yuksek_bakiyeli.slice(0, 6).map((c) => {
                  const bakiye  = parseFloat(c.bakiye ?? 0)
                  const pozitif = bakiye >= 0
                  const isTedarikci = c.cari_turu === 'tedarikci'
                  const avatarBg    = isTedarikci ? `${renkler.accent}18` : `${renkler.success}18`
                  const avatarColor = isTedarikci ? renkler.accent : renkler.success
                  return (
                    <li key={c.id} className={`${p}-list-row`}>
                      <div className="d-flex align-items-center gap-3">
                        <div className={`${p}-avatar`} style={{ background: avatarBg, color: avatarColor }}>
                          {c.cari_adi?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p style={{
                            margin: 0, fontSize: 13, fontWeight: 600,
                            maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {c.cari_adi}
                          </p>
                          <p className={`${p}-metric-label`} style={{ margin: '2px 0 0', fontSize: 11, textTransform: 'capitalize' }}>
                            <i className="bi bi-circle-fill me-1" style={{ fontSize: 5, color: avatarColor }} />
                            {c.cari_turu?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <span className={pozitif ? `${p}-amount-pos` : `${p}-amount-neg`} style={{ fontSize: 13 }}>
                        {pozitif ? '+' : ''}{TL(bakiye)} ₺
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className={`${p}-empty-state`}>
                <i className="bi bi-people" />
                <p style={{ marginBottom: 10 }}>Henüz cari kaydı yok</p>
                <Link to="/cariler" className={`${p}-link-accent`} style={{ fontSize: 12 }}>
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
