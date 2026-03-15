/**
 * VarlikKasa.jsx — Kasa & Varlık Yönetimi
 * Obsidian Vault Koyu Premium Tema
 * 5 Sekme: Gösterge Paneli | Nakit Akışı | Aylık Bilanço | Ortak Carisi | Yatırım Kalesi
 * Bootstrap 5 + Saf React | Finans Kalesi
 * kasa- prefix ile self-contained stiller
 */

import { useState, useMemo, useEffect, useRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import {
  hareketleriGetir, hareketEkle, hareketSil,
  yatirimlariGetir, yatirimEkle, yatirimGuncelle as yatirimGuncelleApi, yatirimSil,
  ortaklariGetir, ortakHareketEkle, ortakHareketSil,
  bilancoListele, bilancoKaydet, bilancoGuncelle, bilancoSil,
} from '../../api/kasa'

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)
const tarihFmt  = (s) => (s ? new Date(s).toLocaleDateString('tr-TR') : '—')
const bugunTarih = () => new Date().toISOString().split('T')[0]
const formatParaInput = (value) => {
  let v = value.replace(/[^0-9,]/g, '')
  const parts = v.split(',')
  if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = v.split(',')
  const formatted = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? formatted + ',' + kesir.slice(0, 2) : formatted
}
const parseParaInput = (f) => parseFloat(String(f).replace(/\./g, '').replace(',', '.')) || 0


const ORTAK_RENKLERI = ['#f59e0b', '#d97706', '#10b981', '#7c3aed', '#0891b2', '#ef4444']

const GIRIS_KAT = ['Günlük Çekmece Hasılatı', 'Açık Hesap', 'Havale / Çek Tahsil', 'POS İşlemi']
const CIKIS_KAT = ['Tedarikçi / Toptancı Ödemesi', 'Personel, Vergi ve Sabit Giderler', 'Günlük İşletme Giderleri', 'Kredi Kartı ve Banka Kredisi Ödemeleri']

const GIRIS_KAT_IKON = {
  'Günlük Çekmece Hasılatı': 'bi-cash-stack',
  'Açık Hesap':               'bi-person-lines-fill',
  'Havale / Çek Tahsil':      'bi-bank2',
  'POS İşlemi':               'bi-credit-card-2-front',
}
const CIKIS_KAT_IKON = {
  'Tedarikçi / Toptancı Ödemesi':           'bi-truck',
  'Personel, Vergi ve Sabit Giderler':       'bi-people-fill',
  'Günlük İşletme Giderleri':               'bi-receipt',
  'Kredi Kartı ve Banka Kredisi Ödemeleri': 'bi-credit-card',
}

function baglantiSecenekleri(tur, kategori) {
  if (tur === 'giris') {
    if (kategori === 'Açık Hesap') return ['POS Cihazından Çekildi', 'Banka Havalesi']
    return []
  }
  const temel = ['Banka / Havale', 'Merkez Kasa', 'Günlük Çekmece Nakdi']
  if (kategori === 'Tedarikçi / Toptancı Ödemesi') return [...temel, 'Mail Order']
  return temel
}

const SEKMELER = [
  { key: 'gosterge', label: 'Gösterge Paneli', icon: 'bi-speedometer2'     },
  { key: 'nakit',    label: 'Nakit Akışı',      icon: 'bi-arrow-left-right' },
  { key: 'bilanco',  label: 'Aylık Bilanço',    icon: 'bi-bar-chart-line'   },
  { key: 'ortak',    label: 'Ortak Carisi',     icon: 'bi-people'           },
  { key: 'yatirim',  label: 'Yatırım Kalesi',   icon: 'bi-safe2'            },
]
const AY_ADLARI = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

// ─── Stil Yardımcıları (Obsidian Vault) ──────────────────────────────────────
const ikonKutu   = (c, bg) => ({ width:42, height:42, borderRadius:12, background:bg || `${c}15`, display:'flex', alignItems:'center', justifyContent:'center' })
const kartEtiket = (c)     => ({ fontSize:11, fontWeight:600, color: 'rgba(255,255,255,0.75)', textTransform:'uppercase', letterSpacing:'0.8px', textShadow:'0 0 14px rgba(255,255,255,0.08)' })

// ─── Ortak Hesaplama ──────────────────────────────────────────────────────────
function hesaplaOzet(hareketler, kapanislar = []) {
  const siraliKap = [...kapanislar].sort((a,b) => a.donem.localeCompare(b.donem))
  const sonKapanis = siraliKap[siraliKap.length - 1] || null
  const oncekiAyBankaNakit = sonKapanis ? sonKapanis.banka_nakdi : 0
  const girisler = hareketler.filter(h => h.islem_tipi === 'giris')
  const cikislar  = hareketler.filter(h => h.islem_tipi === 'cikis')
  const mailOrderTutar = cikislar.filter(h => h.baglanti_turu === 'Mail Order').reduce((s, h) => s + (h.tutar ?? 0), 0)
  const toplamGiris = girisler.reduce((s, h) => s + (h.tutar ?? 0), 0) + mailOrderTutar
  const toplamCikis  = cikislar.reduce((s, h)  => s + (h.tutar ?? 0), 0)
  const bankaGiris  = girisler.filter(h => (h.baglanti_turu ?? '').startsWith('Banka')).reduce((s, h) => s + (h.tutar ?? 0), 0)
  const bankaCikis   = cikislar.filter(h => (h.baglanti_turu ?? '').startsWith('Banka')).reduce((s, h)  => s + (h.tutar ?? 0), 0)
  const bankaGuncel = oncekiAyBankaNakit + bankaGiris - bankaCikis
  const girisFark   = 0
  const cikisFark   = 0
  const girisDagilim = GIRIS_KAT.map(kat => ({ kat, tutar: girisler.filter(h => h.kategori === kat).reduce((s,h) => s+(h.tutar ?? 0), 0) }))
  const cikisDagilim  = CIKIS_KAT.map(kat  => ({ kat, tutar: cikislar.filter(h  => h.kategori === kat).reduce((s,h) => s+(h.tutar ?? 0), 0) }))
  const merkezGiris = girisler.filter(h => h.baglanti_turu === 'Merkez Kasa').reduce((s,h) => s+(h.tutar ?? 0), 0)
  const merkezCikis = cikislar.filter(h => h.baglanti_turu === 'Merkez Kasa').reduce((s,h) => s+(h.tutar ?? 0), 0)
  const merkezKasa = merkezGiris - merkezCikis
  return { toplamGiris, toplamCikis, bankaGuncel, oncekiAyBankaNakit, girisFark, cikisFark, girisDagilim, cikisDagilim, merkezKasa }
}

// ─── Değişim Göstergesi ───────────────────────────────────────────────────────
function DegisimBadge({ fark, tersCevirim = false }) {
  const pozitif = tersCevirim ? fark < 0 : fark > 0
  return (
    <span style={{ fontSize:12, fontWeight:700, color: pozitif ? '#10b981' : '#ef4444', display:'inline-flex', alignItems:'center', gap:2 }}>
      <i className={`bi ${fark > 0 ? 'bi-arrow-up' : 'bi-arrow-down'}`} style={{ fontSize:11 }} />
      {Math.abs(fark).toFixed(1)}% geçen aya göre
    </span>
  )
}

// ─── Dönem Filtresi (Paylaşımlı) ─────────────────────────────────────────────
function DonemFiltresi({ secilenAy, secilenYil, setSecilenAy, setSecilenYil }) {
  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
      <span style={{ fontSize:15, fontWeight:600, color:'rgba(255,255,255,0.65)', textShadow:'0 0 12px rgba(255,255,255,0.06)' }}>
        Dönem:{' '}
        <span style={{ color:'#f59e0b', fontWeight:800 }}>{AY_ADLARI[secilenAy-1]} {secilenYil}</span>
      </span>
      <div className="d-flex gap-2">
        <select value={secilenAy} onChange={e => setSecilenAy(Number(e.target.value))}
          className="kasa-donem-select" style={{ width:110 }}>
          {AY_ADLARI.map((ad,i) => <option key={i} value={i+1}>{ad}</option>)}
        </select>
        <select value={secilenYil} onChange={e => setSecilenYil(Number(e.target.value))}
          className="kasa-donem-select" style={{ width:80 }}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}

// ─── 4 Üst Kart (Paylaşımlı) ─────────────────────────────────────────────────
function DortKart({ ozet }) {
  const { toplamGiris, toplamCikis, bankaGuncel, girisFark, cikisFark, merkezKasa } = ozet
  const kartlar = [
    { label:'Merkez Kasa', deger:merkezKasa, ikon:'bi-safe2', numColor:'#f59e0b', glowColor:'rgba(245,158,11,0.3)', alt:'Fiziki kasa bakiyesi' },
    { label:'Bu Ay Giren', deger:toplamGiris, ikon:'bi-arrow-down-circle-fill', numColor:'#10b981', glowColor:'rgba(16,185,129,0.3)', fark:girisFark },
    { label:'Bu Ay Çıkan', deger:toplamCikis, ikon:'bi-arrow-up-circle-fill', numColor:'#ef4444', glowColor:'rgba(239,68,68,0.3)', fark:cikisFark, ters:true },
    { label:'Güncel Banka Nakit', deger:bankaGuncel, ikon:'bi-bank', numColor:'#d97706', glowColor:'rgba(217,119,6,0.3)', alt:`Geçen Aydan Devreden: ${TL(ozet.oncekiAyBankaNakit ?? 0)}` },
  ]
  return (
    <div className="row g-3 mb-4">
      {kartlar.map(k => (
        <div key={k.label} className="col-12 col-sm-6 col-xl-3">
          <div className="kasa-kpi-card">
            <i className={`bi ${k.ikon}`} style={{ position:'absolute', top:16, right:16, fontSize:60, opacity:0.20, color:k.numColor, pointerEvents:'none' }} />
            <h6 style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.75)', textTransform:'uppercase', letterSpacing:'0.8px', margin:'0 0 12px', position:'relative', zIndex:1, textShadow:'0 0 14px rgba(255,255,255,0.08)' }}>{k.label}</h6>
            <div className="financial-num kasa-kpi-val" style={{ fontFamily:'Inter, sans-serif', fontSize:26, fontWeight:500, color:k.numColor, textShadow:`0 0 20px ${k.glowColor}`, lineHeight:1.15, position:'relative', zIndex:1, letterSpacing:'0.01em', fontVariantNumeric:'tabular-nums', WebkitFontSmoothing:'antialiased' }}>{TL(k.deger)}</div>
            {k.fark !== undefined && <div style={{ marginTop:8, position:'relative', zIndex:1 }}><DegisimBadge fark={k.fark} tersCevirim={k.ters} /></div>}
            {k.alt && <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', margin:'8px 0 0', fontWeight:500, position:'relative', zIndex:1, textShadow:'0 0 12px rgba(255,255,255,0.06)' }}>{k.alt}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Giriş / Çıkış Dağılımı (Paylaşımlı) ────────────────────────────────────
function GirisCikisDagilim({ girisDagilim, cikisDagilim, onGirisKlik, onCikisKlik }) {
  const satir = (item, renk, onClick) => (
    <div key={item.kat}
      className="kasa-list-item"
      style={{ padding:'10px 14px', cursor: onClick ? 'pointer' : 'default' }}
      onClick={() => onClick && onClick(item.kat)}
    >
      <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)' }}>{item.kat}</span>
      <div className="d-flex align-items-center gap-2">
        <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:600, color:renk }}>{TL(item.tutar)}</span>
        <i className="bi bi-chevron-right" style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }} />
      </div>
    </div>
  )
  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-md-6">
        <div className="kasa-glass-card" style={{ padding:0 }}>
          <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="d-flex align-items-center gap-2">
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="bi bi-arrow-down-circle-fill" style={{ color:'#10b981', fontSize:14 }} />
              </div>
              <span style={{ fontSize:14, fontWeight:700, color:'#10b981' }}>Giriş Dağılımı</span>
            </div>
          </div>
          {girisDagilim.map(item => satir(item, '#10b981', onGirisKlik))}
        </div>
      </div>
      <div className="col-12 col-md-6">
        <div className="kasa-glass-card" style={{ padding:0 }}>
          <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="d-flex align-items-center gap-2">
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="bi bi-arrow-up-circle-fill" style={{ color:'#ef4444', fontSize:14 }} />
              </div>
              <span style={{ fontSize:14, fontWeight:700, color:'#ef4444' }}>Çıkış Dağılımı</span>
            </div>
          </div>
          {cikisDagilim.map(item => satir(item, '#ef4444', onCikisKlik))}
        </div>
      </div>
    </div>
  )
}

// ─── SVG Bar Grafiği (Gösterge) ───────────────────────────────────────────────
function GunlukGrafik({ veri }) {
  const maxTutar = Math.max(...veri.flatMap(g => [g.giris, g.cikis]), 1)
  const svgW=700, svgH=180, mL=52, mR=16, mT=20, mB=40
  const chartW=svgW-mL-mR, chartH=svgH-mT-mB
  const groupW = chartW / veri.length
  const barW   = Math.min(Math.floor((groupW-10)/2), 22)
  const barH   = (v) => v > 0 ? Math.max(3, (v/maxTutar)*(chartH-4)) : 0
  const barY   = (v) => mT + chartH - barH(v)
  const yTicks = [0,0.25,0.5,0.75,1].map(r => ({ y: mT+chartH-r*(chartH-4), val: Math.round(maxTutar*r) }))
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width:'100%', height:'auto', display:'block' }}>
      {yTicks.map((t,i) => (
        <g key={i}>
          <line x1={mL} y1={t.y} x2={svgW-mR} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={mL-5} y={t.y+4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.4)">
            {t.val >= 1000 ? `${(t.val/1000).toFixed(0)}K` : t.val}
          </text>
        </g>
      ))}
      <line x1={mL} y1={mT} x2={mL} y2={mT+chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {veri.map((g,i) => {
        const cx=mL+i*groupW+groupW/2, gx=cx-barW-2, rx=cx+2
        return (
          <g key={g.tarih}>
            {barH(g.giris) > 0 && <rect x={gx} y={barY(g.giris)} width={barW} height={barH(g.giris)} rx="3" fill="#10b981" fillOpacity="0.85" />}
            {barH(g.cikis) > 0 && <rect x={rx}  y={barY(g.cikis)}  width={barW} height={barH(g.cikis)}  rx="3" fill="#ef4444" fillOpacity="0.85" />}
            <text x={cx} y={svgH-8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.35)">{g.gun} Mar</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── SVG Kümülatif Çizgi Grafiği (Nakit Akışı) ───────────────────────────────
function KumulatifGrafik({ veri }) {
  if (veri.length < 2) return <div style={{ padding:'24px', textAlign:'center', color:'rgba(255,255,255,0.35)', fontSize:13 }}>Yeterli veri yok</div>
  const svgW=700, svgH=180, mL=60, mR=16, mT=20, mB=40
  const chartW=svgW-mL-mR, chartH=svgH-mT-mB
  const bakiyeler = veri.map(v => v.bakiye)
  const minB=Math.min(...bakiyeler), maxB=Math.max(...bakiyeler)
  const pad=(maxB-minB)*0.15 || 1000
  const yMin=minB-pad, yMax=maxB+pad, yRange=yMax-yMin
  const xS = (i) => mL + (i/(veri.length-1))*chartW
  const yS = (v) => mT + chartH - ((v-yMin)/yRange)*(chartH-4)
  const pts = veri.map((v,i) => `${xS(i)},${yS(v.bakiye)}`).join(' ')
  const area = `${mL},${mT+chartH} ${pts} ${xS(veri.length-1)},${mT+chartH}`
  const yTicks = [0,0.25,0.5,0.75,1].map(r => ({ y: mT+chartH-r*(chartH-4), val: Math.round(yMin+r*yRange) }))
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width:'100%', height:'auto', display:'block' }}>
      {yTicks.map((t,i) => (
        <g key={i}>
          <line x1={mL} y1={t.y} x2={svgW-mR} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={mL-5} y={t.y+4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.4)">
            {Math.abs(t.val) >= 1000 ? `${(t.val/1000).toFixed(0)}K` : t.val}
          </text>
        </g>
      ))}
      <line x1={mL} y1={mT} x2={mL} y2={mT+chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <polygon points={area} fill="rgba(16,185,129,0.08)" />
      <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />
      {veri.map((v,i) => (
        <g key={v.tarih}>
          <circle cx={xS(i)} cy={yS(v.bakiye)} r="4" fill="#10b981" stroke="#fff" strokeWidth="2" />
          <text x={xS(i)} y={svgH-8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.35)">{v.gun} Mar</text>
        </g>
      ))}
    </svg>
  )
}

// ─── Nakit Ekleme Modalı ──────────────────────────────────────────────────────
function NakitModal({ open, onClose, initialTur, onKaydet, hareketler }) {
  const [tur,       setTur]       = useState(initialTur)
  const [kategori,  setKategori]  = useState('')
  const [baglanti,  setBalanti]   = useState('')
  const [tarih,     setTarih]     = useState(bugunTarih())
  const [tutar,     setTutar]     = useState('')
  const [aciklama,  setAciklama]  = useState('')

  useEffect(() => {
    if (open) { setTur(initialTur); setKategori(''); setBalanti(''); setTarih(bugunTarih()); setTutar(''); setAciklama('') }
  }, [open, initialTur])

  useEffect(() => { setBalanti('') }, [tur, kategori])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const katList  = tur === 'giris' ? GIRIS_KAT : CIKIS_KAT
  const son5     = [...hareketler].reverse().slice(0, 5)
  const acikRenk = tur === 'giris' ? '#059669' : '#dc2626'

  const baglantiTuruHesapla = () => {
    if (tur === 'giris') {
      if (kategori === 'Günlük Çekmece Hasılatı') return 'Merkez Kasa'
      if (kategori === 'Havale / Çek Tahsil')     return 'Banka / Havale'
      if (kategori === 'POS İşlemi')               return 'Banka / POS'
      if (kategori === 'Açık Hesap') {
        return baglanti === 'POS Cihazından Çekildi' ? 'Banka / POS' : 'Banka / Havale'
      }
      return 'Banka / POS'
    }
    return baglanti || 'Banka / Havale'
  }

  const kaydet = () => {
    if (!kategori) return
    const tutarSayi = parseParaInput(tutar)
    if (tutarSayi <= 0) return
    if (baglantiSecenekleri(tur, kategori).length > 0 && !baglanti) return
    onKaydet({
      id: Date.now(),
      tarih,
      islem_tipi:    tur,
      kategori,
      tutar:         tutarSayi,
      aciklama,
      baglanti_turu: baglantiTuruHesapla(),
    })
    onClose()
  }

  return createPortal(
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', zIndex:1040, animation:'kasaFadeIn 0.15s ease' }} />
      <div style={{ position:'fixed', inset:0, zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div style={{ width:'100%', maxWidth:580, maxHeight:'90vh', display:'flex', flexDirection:'column', borderRadius:20, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', background:'rgba(13,27,46,0.95)', backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)', border:'1px solid rgba(255,255,255,0.1)' }}>

          {/* Başlık */}
          <div style={{ padding:'18px 24px', borderBottom:'2px solid #f59e0b', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <span style={{ fontSize:17, fontWeight:800, color:'#ffffff' }}>Yeni İşlem Ekle</span>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:18, width:44, height:44, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Gövde */}
          <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>

            {/* Tür seçici */}
            <div className="row g-2 mb-4">
              {[
                { key:'giris', label:'Giriş (Tahsilat)', aciklama:'Tahsilat, nakit, havale', icon:'bi-arrow-down-circle-fill', renk:'#059669', bg:'rgba(16,185,129,0.08)' },
                { key:'cikis', label:'Çıkış (Gider)',    aciklama:'Gider, ödeme, masraf',    icon:'bi-arrow-up-circle-fill',   renk:'#dc2626', bg:'rgba(220,38,38,0.08)'  },
              ].map(t => (
                <div key={t.key} className="col-6">
                  <button
                    onClick={() => { setTur(t.key); setKategori('') }}
                    style={{ width:'100%', padding:'20px 16px', border:`2px solid ${tur===t.key ? t.renk : 'rgba(255,255,255,0.1)'}`, borderRadius:14, background: tur===t.key ? t.bg : 'rgba(255,255,255,0.04)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all 0.15s' }}
                  >
                    <i className={`bi ${t.icon}`} style={{ color:t.renk, fontSize:28 }} />
                    <span style={{ fontWeight:800, fontSize:14, color: tur===t.key ? t.renk : 'rgba(255,255,255,0.45)' }}>{t.label}</span>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:500 }}>{t.aciklama}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Kategori grid */}
            <p style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>1. İşlem Kategorisi (Ne İçin?)</p>
            <div className="row g-2 mb-3">
              {katList.map(kat => {
                const secili = kategori === kat
                const ikonAdi = (tur === 'giris' ? GIRIS_KAT_IKON : CIKIS_KAT_IKON)[kat]
                return (
                  <div key={kat} className="col-6">
                    <button
                      onClick={() => setKategori(kat)}
                      style={{ width:'100%', minHeight:60, padding:'10px 12px', textAlign:'left', border:`2px solid ${secili ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`, borderRadius:10, background: secili ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', cursor:'pointer', display:'flex', alignItems:'center', gap:8, transition:'all 0.15s' }}
                    >
                      <i className={`bi ${ikonAdi}`} style={{ color: secili ? '#f59e0b' : 'rgba(255,255,255,0.35)', fontSize:18, flexShrink:0 }} />
                      <span style={{ fontSize:12, fontWeight: secili ? 700 : 500, color: secili ? '#f59e0b' : 'rgba(255,255,255,0.6)', lineHeight:1.3 }}>{kat}</span>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Bağlantı dropdown (koşullu) */}
            {baglantiSecenekleri(tur, kategori).length > 0 && (
              <div className="mb-4">
                <p style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>
                  2. {tur === 'giris' ? 'Tahsilat Nasıl Yapıldı?' : 'Para Havuzu (Nereden Çıktı?)'}
                </p>
                <select
                  value={baglanti}
                  onChange={e => setBalanti(e.target.value)}
                  className="kasa-select"
                >
                  <option value="">— Seçiniz —</option>
                  {baglantiSecenekleri(tur, kategori).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 3 input */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-4">
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Tarih</label>
                <input type="date" value={tarih} onChange={e => setTarih(e.target.value)}
                  className="kasa-input" />
              </div>
              <div className="col-12 col-sm-4">
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Tutar (₺)</label>
                <input type="text" value={tutar} onChange={e => setTutar(formatParaInput(e.target.value))}
                  placeholder="0,00" className="kasa-input" style={{ color:acikRenk }} />
              </div>
              <div className="col-12 col-sm-4">
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Açıklama (ops.)</label>
                <input type="text" value={aciklama} onChange={e => setAciklama(e.target.value)}
                  placeholder="Opsiyonel not" className="kasa-input" />
              </div>
            </div>

            {/* Kaydet */}
            <button onClick={kaydet} className="btn w-100 mb-4"
              className="kasa-btn-amber" style={{ width:'100%', borderRadius:12 }}>
              <i className="bi bi-shield-lock-fill me-2" />Kaydet & Şifrele
            </button>

            {/* Son 5 İşlem */}
            <p style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Son 5 İşlem</p>
            <div className="table-responsive">
              <table className="kasa-table" style={{ fontSize:13 }}>
                <thead>
                  <tr>
                    <th style={{ fontWeight:700, color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', background:'rgba(255,255,255,0.03)' }}>Tarih</th>
                    <th style={{ fontWeight:700, color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', background:'rgba(255,255,255,0.03)' }}>Tür</th>
                    <th style={{ fontWeight:700, color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', background:'rgba(255,255,255,0.03)' }}>Kategori</th>
                    <th style={{ fontWeight:700, color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', background:'rgba(255,255,255,0.03)', textAlign:'right' }}>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {son5.map(h => (
                    <tr key={h.id}>
                      <td style={{ color:'rgba(255,255,255,0.5)' }}>{tarihFmt(h.tarih)}</td>
                      <td>
                        <span className="badge" style={{ background: h.islem_tipi==='giris' ? 'rgba(16,185,129,0.12)' : 'rgba(220,38,38,0.1)', color: h.islem_tipi==='giris' ? '#059669' : '#dc2626', fontWeight:700, fontSize:11 }}>
                          {h.islem_tipi==='giris' ? 'Giriş' : 'Çıkış'}
                        </span>
                      </td>
                      <td style={{ color:'rgba(255,255,255,0.9)', fontWeight:600 }}>{h.kategori}</td>
                      <td className="financial-num" style={{ textAlign:'right', fontWeight:800, color: h.islem_tipi==='giris' ? '#059669' : '#dc2626' }}>
                        {h.islem_tipi==='giris' ? '+' : '-'}{TL(h.tutar)}
                      </td>
                    </tr>
                  ))}
                  {son5.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign:'center', color:'rgba(255,255,255,0.35)', padding:'16px' }}>Henüz işlem yok</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Dönem Formatlayıcı ───────────────────────────────────────────────────────
const donemFmt = (d) => {
  if (!d) return '—'
  const [ay, yil] = d.split('-')
  return AY_ADLARI[parseInt(ay)-1]?.slice(0,3) + ' ' + (yil?.slice(2) ?? '')
}

// ─── SVG Bilanço Büyüme Grafiği ───────────────────────────────────────────────
function BilancoGrafik({ kapanislar }) {
  const [tooltip, setTooltip] = useState(null)
  const wrapRef = useRef(null)

  if (kapanislar.length < 1) return (
    <div style={{ padding:'24px', textAlign:'center', color:'rgba(255,255,255,0.35)', fontSize:13 }}>Henüz kapanış kaydı yok</div>
  )

  const sirali = [...kapanislar].sort((a,b) => a.donem.localeCompare(b.donem))

  if (sirali.length === 1) {
    const k = sirali[0]
    return (
      <div style={{ textAlign:'center', padding:'24px' }}>
        <div className="financial-num" style={{ fontSize:16, fontWeight:800, color:'#f59e0b' }}>
          {donemFmt(k.donem)}: {TL(k.net_varlik)}
        </div>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:6 }}>Grafik için en az 2 kapanış gerekli</p>
      </div>
    )
  }

  const svgW=700, svgH=180, mL=72, mR=16, mT=20, mB=40
  const chartW=svgW-mL-mR, chartH=svgH-mT-mB
  const vals   = sirali.map(k => k.net_varlik)
  const minV   = Math.min(...vals), maxV = Math.max(...vals)
  const pad    = (maxV-minV)*0.2 || 500000
  const yMin=minV-pad, yMax=maxV+pad, yRange=yMax-yMin
  const xS = (i) => mL + (i/(sirali.length-1))*chartW
  const yS = (v) => mT + chartH - ((v-yMin)/yRange)*(chartH-4)
  const pts = sirali.map((k,i) => `${xS(i)},${yS(k.net_varlik)}`).join(' ')
  const area = `${mL},${mT+chartH} ${pts} ${xS(sirali.length-1)},${mT+chartH}`
  const yTicks = [0,0.25,0.5,0.75,1].map(r => ({ y:mT+chartH-r*(chartH-4), val:Math.round(yMin+r*yRange) }))

  const handleEnter = (e, k, i) => {
    if (!wrapRef.current) return
    const wrap = wrapRef.current.getBoundingClientRect()
    const svg  = wrapRef.current.querySelector('svg').getBoundingClientRect()
    const scX  = svg.width / svgW
    const scY  = svg.height / svgH
    setTooltip({ x: xS(i)*scX, y: yS(k.net_varlik)*scY - 12, donem: donemFmt(k.donem), val: k.net_varlik })
  }

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      {tooltip && (
        <div style={{ position:'absolute', left:tooltip.x, top:tooltip.y, transform:'translate(-50%,-100%)', background:'rgba(13,27,46,0.95)', backdropFilter:'blur(12px)', color:'#fff', borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:700, pointerEvents:'none', zIndex:10, whiteSpace:'nowrap', boxShadow:'0 8px 24px rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ opacity:0.7, marginBottom:2, fontSize:11 }}>{tooltip.donem}</div>
          <div style={{ color:'#f59e0b', textShadow:'0 0 12px rgba(245,158,11,0.3)' }}>{TL(tooltip.val)}</div>
        </div>
      )}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width:'100%', height:'auto', display:'block' }}>
        {yTicks.map((t,i) => (
          <g key={i}>
            <line x1={mL} y1={t.y} x2={svgW-mR} y2={t.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={mL-5} y={t.y+4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.4)">
              {Math.abs(t.val)>=1000000 ? `${(t.val/1000000).toFixed(1)}M` : Math.abs(t.val)>=1000 ? `${(t.val/1000).toFixed(0)}K` : t.val}
            </text>
          </g>
        ))}
        <line x1={mL} y1={mT} x2={mL} y2={mT+chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <polygon points={area} fill="rgba(245,158,11,0.08)" />
        <polyline points={pts} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
        {sirali.map((k,i) => (
          <g key={k.id}
            onMouseEnter={(e) => handleEnter(e, k, i)}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor:'pointer' }}
          >
            <circle cx={xS(i)} cy={yS(k.net_varlik)} r="10" fill="transparent" />
            <circle cx={xS(i)} cy={yS(k.net_varlik)} r="5" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
            <text x={xS(i)} y={svgH-8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.35)">{donemFmt(k.donem)}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Ay Kapanış Modalı ────────────────────────────────────────────────────────
function AyKapanisModal({ open, onClose, kapanislar, onKaydet, yatirimGuncelDeger = 0, duzenlenen = null }) {
  const siraliKap  = [...kapanislar].sort((a,b) => a.donem.localeCompare(b.donem))
  const sonKapanis = siraliKap[siraliKap.length - 1] || null

  const sonraPeriod = () => {
    if (!sonKapanis) {
      const bugun = new Date()
      return `${String(bugun.getMonth()+1).padStart(2,'0')}-${bugun.getFullYear()}`
    }
    const [ay, yil] = sonKapanis.donem.split('-')
    let nextAy  = parseInt(ay) + 1
    let nextYil = parseInt(yil)
    if (nextAy > 12) { nextAy = 1; nextYil++ }
    return `${String(nextAy).padStart(2,'0')}-${nextYil}`
  }

  const [form, setForm] = useState({
    donem: '', devredenStok: '', kesilenFatura: '',
    karMarji: '35', gelenAlis: '', alacaklar: '', borclar: '', bankaKasaNakdi: '',
  })

  useEffect(() => {
    if (open) {
      if (duzenlenen) {
        setForm({
          donem:          duzenlenen.donem,
          devredenStok:   formatParaInput(String(duzenlenen.donem_basi_stok ?? 0).replace('.', ',')),
          kesilenFatura:  formatParaInput(String(duzenlenen.kesilen_fatura ?? 0).replace('.', ',')),
          karMarji:       String(duzenlenen.kar_marji ?? 35),
          gelenAlis:      formatParaInput(String(duzenlenen.gelen_alis ?? 0).replace('.', ',')),
          alacaklar:      formatParaInput(String(duzenlenen.alacaklar ?? 0).replace('.', ',')),
          borclar:        formatParaInput(String(duzenlenen.borclar ?? 0).replace('.', ',')),
          bankaKasaNakdi: formatParaInput(String(duzenlenen.banka_nakdi ?? 0).replace('.', ',')),
        })
        return
      }
      setForm({
        donem: sonraPeriod(),
        devredenStok:  sonKapanis ? String(sonKapanis.sanal_stok) : '',
        kesilenFatura: '', karMarji: '35',
        gelenAlis: '', alacaklar: '', borclar: '', bankaKasaNakdi: '',
      })
    }
  }, [open, sonKapanis])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const p  = (v) => parseParaInput(v)
  const smm       = form.kesilenFatura ? p(form.kesilenFatura) / (1 + p(form.karMarji) / 100) : 0
  const sanaiStok = p(form.devredenStok) + p(form.gelenAlis) - smm
  const netVarlik = sanaiStok + p(form.bankaKasaNakdi) + yatirimGuncelDeger + p(form.alacaklar) - p(form.borclar)

  const set  = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const setP = (k) => (e) => set(k, formatParaInput(e.target.value))

  const kaydet = () => {
    if (!form.donem.trim()) { toast.error('Dönem alanı zorunludur.'); return }
    if (kapanislar.some(k => k.donem === form.donem.trim() && k.id !== duzenlenen?.id)) {
      toast.warning(`${form.donem} dönemi zaten kayıtlı.`)
      return
    }
    onKaydet({
      id:              Date.now(),
      donem:           form.donem.trim(),
      kesilen_fatura:  p(form.kesilenFatura),
      gelen_alis:      p(form.gelenAlis),
      kar_marji:       p(form.karMarji),
      donem_basi_stok: p(form.devredenStok),
      alacaklar:       p(form.alacaklar),
      borclar:         p(form.borclar),
      banka_nakdi:     p(form.bankaKasaNakdi),
      yatirim_birikimi: yatirimGuncelDeger,
      smm,
      sanal_stok:      sanaiStok,
      net_varlik:      netVarlik,
    })
    toast.success(duzenlenen ? 'Kayıt güncellendi.' : 'Ay kapanışı kaydedildi.')
    onClose()
  }

  const lbl = (txt, ikon) => (
    <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
      {ikon && <i className={`bi ${ikon}`} style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }} />}
      {txt}
    </label>
  )

  return createPortal(
    <>
      {/* Backdrop */}
      <div style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
        backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
        zIndex:1040, animation:'kasaFadeIn 0.2s ease'
      }} />

      {/* Modal Wrapper */}
      <div className="kasa-modal-wrapper" style={{
        position:'fixed', inset:0, zIndex:1050,
        display:'flex', alignItems:'center', justifyContent:'center', padding:16
      }}>
        <div className="kasa-modal" style={{
          width:'100%', maxWidth:720, maxHeight:'92vh',
          display:'flex', flexDirection:'column', borderRadius:20, overflow:'hidden',
          boxShadow:'0 32px 80px rgba(0,0,0,0.6), 0 0 120px rgba(245,158,11,0.06)',
          background:'linear-gradient(180deg, rgba(13,27,46,0.98) 0%, rgba(10,22,40,0.98) 100%)',
          backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)',
          border:'1px solid rgba(255,255,255,0.1)',
          animation:'kasaSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>

          {/* ── Header — Amber gradient strip ── */}
          <div style={{
            padding:'20px 24px', flexShrink:0,
            background:'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.06) 100%)',
            borderBottom:'2px solid rgba(245,158,11,0.4)',
            display:'flex', alignItems:'center', justifyContent:'space-between'
          }}>
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width:40, height:40, borderRadius:12,
                background:'linear-gradient(135deg, #f59e0b, #d97706)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 4px 16px rgba(245,158,11,0.35)'
              }}>
                <i className={`bi ${duzenlenen ? 'bi-pencil-square' : 'bi-calculator-fill'}`} style={{ color:'#0d1b2e', fontSize:18 }} />
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'#ffffff', letterSpacing:'-0.3px' }}>
                  {duzenlenen ? 'Kayıt Düzenle' : 'SMM Motoru & Ay Kapanışı'}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500, marginTop:2 }}>
                  {duzenlenen ? `${donemFmt(duzenlenen.donem)} dönemini güncelliyorsunuz` : 'Dönemi hesapla ve varlığını kaydet'}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="kasa-modal-close" style={{
              background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)',
              cursor:'pointer', color:'rgba(255,255,255,0.6)', fontSize:16,
              width:44, height:44, borderRadius:10,
              display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s'
            }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* ── Body ── */}
          <div style={{ overflowY:'auto', flex:1, padding:'24px' }}>

            {/* Bilgi kutusu */}
            <div className="kasa-info-box" style={{ marginBottom:20 }}>
              <i className="bi bi-lightbulb-fill" style={{ color:'#f59e0b', fontSize:15, flexShrink:0, marginTop:2 }} />
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)', fontWeight:500, lineHeight:1.55 }}>
                Sistem; kestiğiniz fatura ve kâr marjınızdan yola çıkarak maliyeti bulur ve yeni tahmini deponuzu hesaplayıp net varlığınıza ekler.
              </span>
            </div>

            {/* ── Bölüm 1: Dönem Bilgileri ── */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'rgba(245,158,11,0.7)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:16, height:2, background:'#f59e0b', borderRadius:1 }} />
                Dönem Bilgileri
              </div>
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  {lbl('Dönem (AA-YYYY)', 'bi-calendar3')}
                  <input type="text" value={form.donem} onChange={e => set('donem', e.target.value)}
                    placeholder="03-2026" className="kasa-input" />
                </div>
                <div className="col-12 col-sm-6">
                  {lbl('Dönem Başı Devreden Stok (₺)', 'bi-box-seam')}
                  <input type="text" value={form.devredenStok} onChange={setP('devredenStok')}
                    placeholder="0,00" className="kasa-input" />
                </div>
              </div>
            </div>

            {/* ── Bölüm 2: Ciro & Maliyet ── */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'rgba(16,185,129,0.7)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:16, height:2, background:'#10b981', borderRadius:1 }} />
                Ciro & Maliyet
              </div>
              <div className="row g-3">
                <div className="col-12 col-sm-4">
                  {lbl('Kestiğimiz Fatura (₺)', 'bi-receipt')}
                  <input type="text" value={form.kesilenFatura} onChange={setP('kesilenFatura')}
                    placeholder="0,00" className="kasa-input" />
                </div>
                <div className="col-12 col-sm-4">
                  {lbl('Kâr Marjı (%)', 'bi-percent')}
                  <input type="number" value={form.karMarji} onChange={e => set('karMarji', e.target.value)}
                    min="0" max="100" step="0.5" className="kasa-input" />
                </div>
                <div className="col-12 col-sm-4">
                  {lbl('Gelen Alış Faturaları (₺)', 'bi-truck')}
                  <input type="text" value={form.gelenAlis} onChange={setP('gelenAlis')}
                    placeholder="0,00" className="kasa-input" />
                </div>
              </div>
            </div>

            {/* ── Bölüm 3: Piyasa Durumu ── */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'rgba(8,145,178,0.7)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:16, height:2, background:'#0891b2', borderRadius:1 }} />
                Piyasa Durumu
              </div>
              <div className="row g-3">
                <div className="col-12 col-sm-4">
                  {lbl('Toplam Alacağımız (₺)', 'bi-arrow-down-circle')}
                  <input type="text" value={form.alacaklar} onChange={setP('alacaklar')}
                    placeholder="0,00" className="kasa-input" style={{ color:'#10b981' }} />
                </div>
                <div className="col-12 col-sm-4">
                  {lbl('Toplam Borcumuz (₺)', 'bi-arrow-up-circle')}
                  <input type="text" value={form.borclar} onChange={setP('borclar')}
                    placeholder="0,00" className="kasa-input" style={{ color:'#ef4444' }} />
                </div>
                <div className="col-12 col-sm-4">
                  {lbl('Banka Ticari Nakdi (₺)', 'bi-bank')}
                  <input type="text" value={form.bankaKasaNakdi} onChange={setP('bankaKasaNakdi')}
                    placeholder="0,00" className="kasa-input" />
                </div>
              </div>
            </div>

            {/* ── Canlı Önizleme — Premium Panel ── */}
            <div style={{
              background:'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(13,27,46,0.4) 100%)',
              border:'1px solid rgba(245,158,11,0.15)',
              borderRadius:14, padding:'18px 20px', marginBottom:20
            }}>
              <div style={{ fontSize:11, fontWeight:800, color:'rgba(245,158,11,0.6)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                <i className="bi bi-eye-fill" style={{ fontSize:12 }} />
                Canlı Önizleme
              </div>

              {/* SMM hesabı */}
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>
                  SMM = {TL(p(form.kesilenFatura))} / (1 + %{p(form.karMarji)})
                </span>
                <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.85)', fontVariantNumeric:'tabular-nums' }}>{TL(smm)}</span>
              </div>

              {/* Sanal Stok */}
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>Sanal Stok</span>
                <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:800, color:'#7c3aed', fontVariantNumeric:'tabular-nums' }}>{TL(sanaiStok)}</span>
              </div>

              {/* Yatırım Birikimi */}
              <div className="d-flex justify-content-between align-items-center mb-3" style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>Yatırım Birikimi</span>
                {yatirimGuncelDeger > 0
                  ? <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:800, color:'#059669', fontVariantNumeric:'tabular-nums' }}>{TL(yatirimGuncelDeger)}</span>
                  : <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.3)' }}>Henüz fiyat girilmedi</span>
                }
              </div>

              {/* Net Varlık — büyük sonuç */}
              <div style={{ borderTop:'2px solid rgba(245,158,11,0.2)', paddingTop:14, textAlign:'center' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>
                  <i className="bi bi-trophy-fill me-1" style={{ color:'#f59e0b' }} />Net Varlık
                </div>
                <div className="financial-num" style={{
                  fontFamily:'Inter, sans-serif', fontSize:28, fontWeight:900,
                  color:'#f59e0b', lineHeight:1, fontVariantNumeric:'tabular-nums',
                  textShadow:'0 0 24px rgba(245,158,11,0.25)',
                  WebkitFontSmoothing:'antialiased'
                }}>
                  {TL(netVarlik)}
                </div>
              </div>
            </div>

          </div>

          {/* ── Footer — Sticky buton alanı ── */}
          <div style={{
            padding:'16px 24px', flexShrink:0,
            borderTop:'1px solid rgba(255,255,255,0.08)',
            background:'rgba(10,22,40,0.6)'
          }}>
            <button onClick={kaydet}
              className="kasa-btn-amber"
              style={{
                width:'100%', borderRadius:12, padding:'14px',
                fontSize:16, fontWeight:700,
                boxShadow:'0 4px 20px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.1)'
              }}>
              <i className={`bi ${duzenlenen ? 'bi-floppy' : 'bi-calculator-fill'} me-2`} style={{ fontSize:18 }} />
              {duzenlenen ? 'Güncelle & Kaydet' : 'Hesapla & Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Performans Karşılaştırma Kartı ──────────────────────────────────────────
function PerformansKarti({ label, yeni, eski, renk, bg, ikon, tersCevirim = false }) {
  const f = (eski != null && eski > 0) ? ((yeni - eski) / eski) * 100 : null
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="kasa-kpi-card">
        <div className="d-flex align-items-center gap-2 mb-2">
          <div style={ikonKutu(renk, bg)}><i className={`bi ${ikon}`} style={{ color:renk, fontSize:17 }} /></div>
          <span style={kartEtiket(renk)}>{label}</span>
        </div>
        <div className="financial-num" style={{ fontSize:'1.45rem', fontWeight:800, color:'#ffffff', lineHeight:1.1 }}>{TL(yeni)}</div>
        {f != null ? (
          <div style={{ marginTop:5 }}><DegisimBadge fark={f} tersCevirim={tersCevirim} /></div>
        ) : (
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:'5px 0 0', fontWeight:500 }}>Kıyaslanacak geçmiş veri yok.</p>
        )}
      </div>
    </div>
  )
}

// ─── Aylık Bilanço ────────────────────────────────────────────────────────────
function AylikBilanco({ kapanislar, setKapanislar, yatirimGuncelDeger = 0 }) {
  const [modalAcik,        setModalAcik]        = useState(false)
  const [duzenlenenKapanis, setDuzenlenenKapanis] = useState(null)
  const [arama,            setArama]            = useState('')
  const [silOnayId,        setSilOnayId]        = useState(null)
  const [sayfa,            setSayfa]            = useState(1)
  const sayfaBasi = 10

  const sirali     = [...kapanislar].sort((a,b) => a.donem.localeCompare(b.donem))
  const sonKapanis = sirali[sirali.length - 1] || null
  const onceki     = sirali[sirali.length - 2] || null

  const filtrelendi = [...sirali]
    .reverse()
    .filter(k => k.donem.includes(arama) || donemFmt(k.donem).toLowerCase().includes(arama.toLowerCase()))

  const toplamSayfa = Math.ceil(filtrelendi.length / sayfaBasi)
  const sayfaliVeri = filtrelendi.slice((sayfa-1)*sayfaBasi, sayfa*sayfaBasi)

  const acEkle     = () => { setDuzenlenenKapanis(null); setModalAcik(true) }
  const acDuzenle  = (k) => { setDuzenlenenKapanis(k);   setModalAcik(true) }

  const kaydet = async (yeni) => {
    if (duzenlenenKapanis) {
      const onceki = kapanislar.find(k => k.id === duzenlenenKapanis.id)
      setKapanislar(prev => prev.map(k => k.id === duzenlenenKapanis.id ? { ...yeni, id: duzenlenenKapanis.id } : k))
      setDuzenlenenKapanis(null)
      try {
        await bilancoGuncelle(duzenlenenKapanis.id, yeni)
      } catch {
        if (onceki) setKapanislar(prev => prev.map(k => k.id === duzenlenenKapanis.id ? onceki : k))
        toast.error('Güncelleme kaydedilemedi.')
      }
    } else {
      const geciciId = Date.now()
      setKapanislar(prev => [...prev, { ...yeni, id: geciciId }])
      setSayfa(1)
      setDuzenlenenKapanis(null)
      try {
        const res = await bilancoKaydet(yeni)
        const gercekId = res.data?.veri?.id
        if (gercekId) setKapanislar(prev => prev.map(k => k.id === geciciId ? { ...k, id: gercekId } : k))
      } catch {
        setKapanislar(prev => prev.filter(k => k.id !== geciciId))
        toast.error('Kayıt kaydedilemedi.')
      }
    }
  }
  const sil = async (id) => {
    const yedek = kapanislar.find(k => k.id === id)
    setKapanislar(prev => prev.filter(k => k.id !== id))
    setSilOnayId(null)
    try {
      await bilancoSil(id)
    } catch {
      if (yedek) setKapanislar(prev => [...prev, yedek])
      toast.error('Kayıt silinemedi.')
    }
  }

  return (
    <div>

      {/* ══════════════════════════════════════════════════════════════
          ÜST SATIR — Varlıklar (3'lü Grid)
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3 mb-4">

        {/* Kart 1 — Güncel Net Varlık */}
        <div className="col-12 col-md-4">
          <div className="kasa-kpi-card">
            <i className="bi bi-bank" style={{ position:'absolute', top:14, right:14, fontSize:54, color:'#0891b2', opacity:0.20, pointerEvents:'none' }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu('#0891b2','rgba(8,145,178,0.12)')}><i className="bi bi-bank" style={{ color:'#0891b2', fontSize:17 }} /></div>
              <span style={kartEtiket('#0891b2')}>Güncel Net Varlık</span>
            </div>
            {sonKapanis ? (
              <div className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:'clamp(16px, 5cqw, 24px)', fontWeight:800, color:'#ffffff', lineHeight:1.1, fontVariantNumeric:'tabular-nums', textShadow:'0 0 20px rgba(8,145,178,0.2)' }}>
                {TL(sonKapanis.net_varlik)}
              </div>
            ) : (
              <div style={{ fontSize:20, fontWeight:800, color:'rgba(255,255,255,0.25)' }}>—</div>
            )}
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', margin:'8px 0 0', fontWeight:500 }}>
              Stok + Kasa + Yatırımlar + Alacaklar − Borçlar
            </p>
          </div>
        </div>

        {/* Kart 2 — Sanal Stok */}
        <div className="col-12 col-md-4">
          <div className="kasa-kpi-card">
            <i className="bi bi-box-seam" style={{ position:'absolute', top:14, right:14, fontSize:54, color:'#7c3aed', opacity:0.20, pointerEvents:'none' }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu('#7c3aed','rgba(124,58,237,0.12)')}><i className="bi bi-box-seam" style={{ color:'#7c3aed', fontSize:17 }} /></div>
              <span style={kartEtiket('#7c3aed')}>Hesaplanan Sanal Stok</span>
            </div>
            {sonKapanis ? (
              <div className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:'clamp(16px, 5cqw, 24px)', fontWeight:800, color:'#ffffff', lineHeight:1.1, fontVariantNumeric:'tabular-nums', textShadow:'0 0 20px rgba(124,58,237,0.2)' }}>
                {TL(sonKapanis.sanal_stok)}
              </div>
            ) : (
              <div style={{ fontSize:20, fontWeight:800, color:'rgba(255,255,255,0.25)' }}>—</div>
            )}
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', margin:'8px 0 0', fontWeight:500 }}>
              Kâr marjı formülü ile hesaplanan tahmini depo
            </p>
          </div>
        </div>

        {/* Kart 3 — Yatırım Birikimi */}
        <div className="col-12 col-md-4">
          <div className="kasa-kpi-card">
            <i className="bi bi-safe2" style={{ position:'absolute', top:14, right:14, fontSize:54, color:'#059669', opacity:0.20, pointerEvents:'none' }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu('#059669','rgba(5,150,105,0.12)')}><i className="bi bi-safe2" style={{ color:'#059669', fontSize:17 }} /></div>
              <span style={kartEtiket('#059669')}>Kenardaki Yatırım Birikimi</span>
            </div>
            {yatirimGuncelDeger > 0 ? (
              <div className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:'clamp(16px, 5cqw, 24px)', fontWeight:800, color:'#ffffff', lineHeight:1.1, fontVariantNumeric:'tabular-nums', textShadow:'0 0 20px rgba(5,150,105,0.2)' }}>
                {TL(yatirimGuncelDeger)}
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 mt-1" style={{ color:'rgba(255,255,255,0.3)' }}>
                <i className="bi bi-info-circle" style={{ fontSize:14 }} />
                <span style={{ fontSize:13, fontWeight:600 }}>Henüz fiyat girilmedi</span>
              </div>
            )}
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', margin:'8px 0 0', fontWeight:500 }}>
              Döviz ve altın kasanızın güncel TL karşılığı
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          İKİNCİ SATIR — Ticaret (4'lü Grid)
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3 mb-4">
        <PerformansKarti label="Bu Ay Kestiğimiz" yeni={sonKapanis?.kesilen_fatura ?? 0} eski={onceki?.kesilen_fatura}
          renk="#059669" bg="rgba(16,185,129,0.1)" ikon="bi-receipt" />
        <PerformansKarti label="Bu Ay Gelen Alış" yeni={sonKapanis?.gelen_alis ?? 0} eski={onceki?.gelen_alis}
          renk="#d97706" bg="rgba(217,119,6,0.1)" ikon="bi-truck" />
        <PerformansKarti label="Toplam Alacağımız" yeni={sonKapanis?.alacaklar ?? 0} eski={onceki?.alacaklar}
          renk="#f59e0b" bg="rgba(245,158,11,0.1)" ikon="bi-arrow-down-circle" />
        <PerformansKarti label="Toplam Borcumuz" yeni={sonKapanis?.borclar ?? 0} eski={onceki?.borclar}
          renk="#dc2626" bg="rgba(220,38,38,0.1)" ikon="bi-arrow-up-circle" tersCevirim />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ÜÇÜNCÜ ALAN — Aksiyon Butonu + Aylık Büyüme Grafiği
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3 mb-4">

        {/* ── Ay Kapanışı Yap — Belirgin Aksiyon Alanı ── */}
        <div className="col-12 col-md-4">
          <div style={{
            background:'linear-gradient(160deg, rgba(245,158,11,0.08) 0%, rgba(217,119,6,0.04) 100%)',
            border:'1px solid rgba(245,158,11,0.2)',
            borderRadius:16, padding:'28px 22px',
            height:'100%', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', textAlign:'center'
          }}>
            {/* İkon alanı */}
            <div style={{
              width:60, height:60, borderRadius:16, marginBottom:16,
              background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08))',
              border:'1px solid rgba(245,158,11,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <i className="bi bi-calculator-fill" style={{ fontSize:26, color:'#f59e0b' }} />
            </div>

            <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:6 }}>
              Ay Kapanışı Yap
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:'0 0 20px', lineHeight:1.5 }}>
              Dönemi hesapla, varlığını kaydet ve büyüme grafiğini güncelle.
            </p>

            {/* Glow buton */}
            <button onClick={acEkle}
              className="kasa-btn-amber d-flex align-items-center gap-2"
              style={{
                borderRadius:50, padding:'12px 28px',
                boxShadow:'0 4px 20px rgba(245,158,11,0.35), 0 0 60px rgba(245,158,11,0.08)',
                animation:'kasaGlow 2s ease-in-out infinite alternate'
              }}>
              <i className="bi bi-plus-circle-fill" style={{ fontSize:16 }} />
              Hesapla & Kaydet
            </button>
          </div>
        </div>

        {/* ── Aylık Büyüme Grafiği ── */}
        <div className="col-12 col-md-8">
          <div className="kasa-glass-card" style={{ padding:'20px 22px', height:'100%' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <div style={{ width:30, height:30, borderRadius:9, background:'rgba(245,158,11,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="bi bi-graph-up" style={{ color:'#f59e0b', fontSize:14 }} />
              </div>
              <div>
                <span style={{ fontSize:14, fontWeight:700, color:'#ffffff' }}>Aylık Büyüme Grafiği</span>
                <p className="mb-0" style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>Ay kapanışlarından hesaplanır</p>
              </div>
            </div>
            <BilancoGrafik kapanislar={kapanislar} />
          </div>
        </div>
      </div>

      {/* ─── Geçmiş Dönem Tablosu ─── */}
      <div className="kasa-glass-card" style={{ padding:0 }}>
        <div className="px-4 pt-4 pb-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <span style={{ fontSize:15, fontWeight:700, color:'#ffffff' }}>Geçmiş Dönem Bilanço Kayıtları</span>
            <p className="mb-0" style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>{filtrelendi.length} kayıt</p>
          </div>
          <div style={{ width:220, position:'relative' }}>
            <i className="bi bi-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)', fontSize:13, pointerEvents:'none' }} />
            <input type="text" value={arama} onChange={e => { setArama(e.target.value); setSayfa(1) }}
              placeholder="Dönem filtrele..." className="kasa-search" />
          </div>
        </div>
        <div className="table-responsive">
          <table className="kasa-table">
            <thead>
              <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                {['Dönem (Ay)','Aylık Ciro','Kar Marjı','Sanal Stok','Net Varlık','İşlemler'].map((h,i) => (
                  <th key={i} style={{ fontWeight:700, color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 16px', textAlign: (i===1||i===3||i===4) ? 'right' : (i===5 ? 'right' : 'left') }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sayfaliVeri.map(k => (
                <tr key={k.id}>
                  <td style={{ padding:'11px 16px' }}>
                    <span style={{ fontWeight:700, color:'#f59e0b', fontSize:14 }}>{donemFmt(k.donem)}</span>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginLeft:6 }}>{k.donem}</span>
                  </td>
                  <td className="financial-num" style={{ textAlign:'right', fontWeight:700, fontSize:13, padding:'11px 16px', color:'rgba(255,255,255,0.9)' }}>{TL(k.kesilen_fatura)}</td>
                  <td style={{ padding:'11px 16px' }}>
                    <span className="badge" style={{ background:'rgba(18,63,89,0.1)', color:'#f59e0b', fontWeight:700, fontSize:12 }}>
                      %{k.kar_marji}
                    </span>
                  </td>
                  <td className="financial-num" style={{ textAlign:'right', fontWeight:700, fontSize:13, padding:'11px 16px', color:'#7c3aed' }}>{TL(k.sanal_stok)}</td>
                  <td className="financial-num" style={{ textAlign:'right', fontWeight:800, fontSize:14, padding:'11px 16px', color:'#f59e0b' }}>{TL(k.net_varlik)}</td>
                  <td style={{ padding:'11px 16px', textAlign:'right', whiteSpace:'nowrap' }}>
                    {silOnayId === k.id ? (
                      <span className="d-inline-flex align-items-center gap-1">
                        <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', marginRight:2 }}>Emin misiniz?</span>
                        <button onClick={() => sil(k.id)} className="kasa-sil-btn">Sil</button>
                        <button onClick={() => setSilOnayId(null)} className="kasa-vazgec-btn">Vazgeç</button>
                      </span>
                    ) : (
                      <div className="d-flex gap-1 justify-content-end">
                        <button onClick={() => acDuzenle(k)}
                          style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, width:44, height:44, padding:0, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='#f59e0b'; e.currentTarget.style.background='rgba(245,158,11,0.1)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.background='none' }}>
                          <i className="bi bi-pencil" style={{ fontSize:13, color:'#f59e0b' }} />
                        </button>
                        <button onClick={() => setSilOnayId(k.id)}
                          style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, width:44, height:44, padding:0, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'border-color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='#dc2626' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(239,68,68,0.2)' }}>
                          <i className="bi bi-trash3" style={{ fontSize:13, color:'#dc2626' }} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {sayfaliVeri.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'32px', color:'rgba(255,255,255,0.35)', fontSize:14 }}>Kayıt bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        {toplamSayfa > 1 && (
          <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>
              {(sayfa-1)*sayfaBasi+1}–{Math.min(sayfa*sayfaBasi, filtrelendi.length)} / {filtrelendi.length} kayıt
            </span>
            <div className="d-flex gap-2">
              <button onClick={() => setSayfa(p => Math.max(1,p-1))} disabled={sayfa===1}
                className="kasa-sayfa-btn">
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: toplamSayfa }, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => setSayfa(p)} className="btn btn-sm"
                  className="kasa-sayfa-btn" style={{ background: p===sayfa ? '#f59e0b' : 'transparent', color: p===sayfa ? '#0d1b2e' : 'rgba(255,255,255,0.5)', borderColor: p===sayfa ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setSayfa(p => Math.min(toplamSayfa,p+1))} disabled={sayfa===toplamSayfa}
                className="kasa-sayfa-btn">
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AyKapanisModal
        open={modalAcik} onClose={() => { setModalAcik(false); setDuzenlenenKapanis(null) }}
        kapanislar={kapanislar} onKaydet={kaydet}
        yatirimGuncelDeger={yatirimGuncelDeger}
        duzenlenen={duzenlenenKapanis}
      />
    </div>
  )
}

// ─── Ortak İşlem Modalı ───────────────────────────────────────────────────────
function OrtakModal({ open, onClose, mevcutOrtaklar, onKaydet }) {
  const [ortakAdi,  setOrtakAdi]  = useState('')
  const [tur,       setTur]       = useState('para_girisi')
  const [tarih,     setTarih]     = useState(bugunTarih())
  const [tutar,     setTutar]     = useState('')
  const [aciklama,  setAciklama]  = useState('')

  useEffect(() => {
    if (open) { setOrtakAdi(''); setTur('para_girisi'); setTarih(bugunTarih()); setTutar(''); setAciklama('') }
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const kaydet = () => {
    if (!ortakAdi.trim()) { toast.error('Ortak adı zorunludur.'); return }
    const tutarSayi = parseParaInput(tutar)
    if (tutarSayi <= 0) { toast.error('Tutar sıfırdan büyük olmalı.'); return }
    onKaydet({ id: Date.now(), tarih, ortak_adi: ortakAdi.trim(), islem_tipi: tur, tutar: tutarSayi, aciklama })
    onClose()
  }

  const giris = tur === 'para_girisi'
  const acikRenk = giris ? '#059669' : '#dc2626'
  const tutarSayi = parseParaInput(tutar)
  const basHarfler = ortakAdi.trim() ? ortakAdi.trim().split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : '?'

  return createPortal(
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', zIndex:1040, animation:'kasaFadeIn 0.15s ease' }} />
      <div style={{ position:'fixed', inset:0, zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div style={{ width:'100%', maxWidth:540, maxHeight:'90vh', display:'flex', flexDirection:'column', borderRadius:20, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', background:'rgba(13,27,46,0.97)', backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)', border:'1px solid rgba(255,255,255,0.1)', animation:'kasaSlideUp 0.25s ease' }}>

          {/* ── Başlık — Gradient Header ── */}
          <div style={{ padding:'20px 24px', background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08))', borderBottom:'2px solid rgba(245,158,11,0.4)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div className="d-flex align-items-center gap-3">
              <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(245,158,11,0.35)' }}>
                <i className="bi bi-people-fill" style={{ color:'#fff', fontSize:18 }} />
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'#ffffff', lineHeight:1.2 }}>Kullanım / Çekim Ekle</div>
                <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', letterSpacing:'0.03em' }}>Ortak cari hareketi kaydı</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', color:'rgba(255,255,255,0.6)', fontSize:16, width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.15)'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.6)' }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* ── Gövde ── */}
          <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>

            {/* ─ Bölüm 1: Ortak Bilgisi ─ */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:4, height:18, borderRadius:2, background:'#f59e0b' }} />
              <span style={{ fontSize:12, fontWeight:700, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.06em' }}>Ortak Bilgisi</span>
            </div>

            <div className="mb-4">
              <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Ortak Adı</label>
              <input
                list="ortak-list" value={ortakAdi} onChange={e => setOrtakAdi(e.target.value)}
                placeholder="Ortak adı yazın veya seçin..." className="kasa-input"
              />
              <datalist id="ortak-list">
                {mevcutOrtaklar.map(ad => <option key={ad} value={ad} />)}
              </datalist>
            </div>

            {/* ─ Bölüm 2: İşlem Detayları ─ */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:4, height:18, borderRadius:2, background:'#3b82f6' }} />
              <span style={{ fontSize:12, fontWeight:700, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.06em' }}>İşlem Detayları</span>
            </div>

            {/* Tür seçici */}
            <div className="row g-2 mb-3">
              {[
                { key:'para_girisi', label:'Ortaktan Giriş', desc:'Ortağın şirkete koyduğu para', icon:'bi-arrow-down-circle-fill', renk:'#059669', bg:'rgba(16,185,129,0.08)' },
                { key:'para_cikisi', label:'Ortağa Çıkış', desc:'Şirketten ortağa çekilen para', icon:'bi-arrow-up-circle-fill', renk:'#dc2626', bg:'rgba(220,38,38,0.08)' },
              ].map(t => (
                <div key={t.key} className="col-6">
                  <button
                    onClick={() => setTur(t.key)}
                    style={{ width:'100%', padding:'14px 12px', border:`2px solid ${tur===t.key ? t.renk : 'rgba(255,255,255,0.1)'}`, borderRadius:12, background: tur===t.key ? t.bg : 'rgba(255,255,255,0.04)', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className={`bi ${t.icon}`} style={{ color:t.renk, fontSize:18 }} />
                      <span style={{ fontWeight:700, fontSize:14, color: tur===t.key ? t.renk : 'rgba(255,255,255,0.45)' }}>{t.label}</span>
                    </div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', paddingLeft:26 }}>{t.desc}</div>
                  </button>
                </div>
              ))}
            </div>

            {/* Tarih | Tutar */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Tarih</label>
                <input type="date" value={tarih} onChange={e => setTarih(e.target.value)}
                  className="kasa-input" />
              </div>
              <div className="col-12 col-sm-6">
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Tutar (₺)</label>
                <input type="text" value={tutar} onChange={e => setTutar(formatParaInput(e.target.value))}
                  placeholder="0,00" className="kasa-input" style={{ color:acikRenk, fontFamily:'Inter, sans-serif', fontWeight:700 }} />
              </div>
            </div>

            {/* Açıklama */}
            <div className="mb-4">
              <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Açıklama <span style={{ color:'rgba(255,255,255,0.3)', fontWeight:400 }}>(opsiyonel)</span></label>
              <input type="text" value={aciklama} onChange={e => setAciklama(e.target.value)}
                placeholder="Sermaye artırımı, kâr dağıtımı, cari hesap..." className="kasa-input" />
            </div>

            {/* ─ Canlı Önizleme ─ */}
            {(ortakAdi.trim() || tutarSayi > 0) && (
              <div style={{ background:'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(217,119,6,0.03))', border:'1px solid rgba(245,158,11,0.15)', borderRadius:14, padding:'14px 18px', marginBottom:8 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(245,158,11,0.7)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Kayıt Önizleme</div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ width:38, height:38, borderRadius:10, background: giris ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.12)', border:`1px solid ${giris ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.25)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:14, fontWeight:800, color: acikRenk }}>{basHarfler}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:'#fff', lineHeight:1.2 }}>{ortakAdi.trim() || 'Ortak Adı'}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{giris ? 'Ortaktan Giriş' : 'Ortağa Çıkış'} · {tarihFmt(tarih)}</div>
                    </div>
                  </div>
                  <div className="financial-num" style={{ fontSize:18, fontWeight:800, color: acikRenk }}>
                    {giris ? '+' : '-'}{tutarSayi > 0 ? TL(tutarSayi) : '₺0,00'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer — Yapışkan ── */}
          <div style={{ padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.08)', background:'rgba(13,27,46,0.98)', flexShrink:0 }}>
            <button onClick={kaydet} className="btn w-100"
              style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontWeight:700, fontSize:15, borderRadius:12, padding:'13px', border:'none', boxShadow:'0 4px 16px rgba(245,158,11,0.3)', transition:'all 0.2s' }}>
              <i className="bi bi-shield-lock-fill me-2" />Kaydet & Şifrele
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Ortak Carisi ─────────────────────────────────────────────────────────────
function OrtakCarisi({ ortakHareketler, setOrtakHareketler }) {
  const [modalAcik, setModalAcik] = useState(false)
  const [arama,     setArama]     = useState('')
  const [silOnayId, setSilOnayId] = useState(null)
  const [sayfa,     setSayfa]     = useState(1)
  const sayfaBasi = 10

  // Benzersiz ortak listesi (ekleme sırasına göre)
  const ortaklar = useMemo(() => {
    const seen = new Set()
    return ortakHareketler.reduce((acc, h) => {
      if (!seen.has(h.ortak_adi)) { seen.add(h.ortak_adi); acc.push(h.ortak_adi) }
      return acc
    }, [])
  }, [ortakHareketler])

  const ortakRenk = (ad) => ORTAK_RENKLERI[ortaklar.indexOf(ad) % ORTAK_RENKLERI.length]

  // Her ortak için bakiye hesapla
  const ortakBakiye = useMemo(() => {
    return ortaklar.map(ad => {
      const giris = ortakHareketler.filter(h => h.ortak_adi===ad && h.islem_tipi==='para_girisi').reduce((s,h)=>s+(h.tutar ?? 0),0)
      const cikis  = ortakHareketler.filter(h => h.ortak_adi===ad && h.islem_tipi==='para_cikisi').reduce((s,h) =>s+(h.tutar ?? 0),0)
      return { ad, bakiye: giris - cikis }
    })
  }, [ortaklar, ortakHareketler])

  // Filtreli + sıralı liste
  const filtrelendi = useMemo(() => {
    const sirali = [...ortakHareketler].sort((a,b) => b.tarih.localeCompare(a.tarih) || b.id-a.id)
    if (!arama.trim()) return sirali
    return sirali.filter(h => h.ortak_adi.toLowerCase().includes(arama.toLowerCase()))
  }, [ortakHareketler, arama])

  const toplamSayfa = Math.ceil(filtrelendi.length / sayfaBasi)
  const sayfaliVeri = filtrelendi.slice((sayfa-1)*sayfaBasi, sayfa*sayfaBasi)

  const islemEkle = async (yeni) => {
    try {
      const res = await ortakHareketEkle(yeni)
      if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt eklenemedi.'); return }
      setOrtakHareketler(prev => [...prev, { ...yeni, id: res.data.veri.id }])
    } catch {
      toast.error('Kayıt eklenemedi.')
    }
  }

  const islemSil = async (id) => {
    try {
      const res = await ortakHareketSil(id)
      if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt silinemedi.'); return }
      setOrtakHareketler(prev => prev.filter(h => h.id !== id))
      setSilOnayId(null)
    } catch {
      toast.error('Kayıt silinemedi.')
    }
  }

  // Baş harfleri daire
  const BasHarf = ({ ad, renk }) => (
    <div style={{ width:44, height:44, borderRadius:12, background:renk, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <span style={{ fontSize:16, fontWeight:800, color:'#fff', lineHeight:1 }}>
        {ad.split(' ').map(s=>s[0]).slice(0,2).join('')}
      </span>
    </div>
  )

  // Toplam giriş / çıkış hesapla
  const toplamGiris = useMemo(() => ortakHareketler.filter(h => h.islem_tipi==='para_girisi').reduce((s,h) => s+(h.tutar??0), 0), [ortakHareketler])
  const toplamCikis = useMemo(() => ortakHareketler.filter(h => h.islem_tipi==='para_cikisi').reduce((s,h) => s+(h.tutar??0), 0), [ortakHareketler])
  const toplamNet = toplamGiris - toplamCikis

  return (
    <div>
      {/* Başlık + Filtre + Buton */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h2 style={{ fontSize:'1.1rem', fontWeight:800, color:'rgba(255,255,255,0.9)', margin:0 }}>Ortak Cari Hesapları</h2>
          <p className="mb-0" style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>{ortaklar.length} ortak · {ortakHareketler.length} işlem</p>
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <div style={{ width:220, position:'relative' }}>
            <i className="bi bi-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)', fontSize:13, pointerEvents:'none' }} />
            <input type="text" value={arama} onChange={e => { setArama(e.target.value); setSayfa(1) }}
              placeholder="Ortak adı filtrele..." className="kasa-search" />
          </div>
          <button onClick={() => setModalAcik(true)}
            className="btn d-flex align-items-center gap-2"
            style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontWeight:700, fontSize:14, borderRadius:50, padding:'10px 22px', border:'none', boxShadow:'0 3px 10px rgba(245,158,11,0.3)' }}>
            <i className="bi bi-plus-lg" />Kullanım / Çekim Ekle
          </button>
        </div>
      </div>

      {/* ── Toplam Özet Şeridi ── */}
      {ortakHareketler.length > 0 && (
        <div className="row g-3 mb-4">
          {[
            { label:'Toplam Giriş', deger:toplamGiris, renk:'#059669', ikon:'bi-arrow-down-circle-fill', bg:'rgba(5,150,105,0.08)' },
            { label:'Toplam Çıkış', deger:toplamCikis, renk:'#dc2626', ikon:'bi-arrow-up-circle-fill', bg:'rgba(220,38,38,0.06)' },
            { label:'Net Bakiye', deger:toplamNet, renk: toplamNet >= 0 ? '#059669' : '#dc2626', ikon:'bi-wallet2', bg:'rgba(245,158,11,0.06)' },
          ].map((k,i) => (
            <div key={i} className="col-12 col-md-4">
              <div className="kasa-kpi-card" style={{ position:'relative', overflow:'hidden' }}>
                <i className={`bi ${k.ikon}`} style={{ position:'absolute', right:14, top:14, fontSize:28, opacity:0.08, color:'#fff' }} />
                <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{k.label}</div>
                <div className="financial-num" style={{ fontSize:'1.4rem', fontWeight:800, lineHeight:1.1, color: k.renk }}>
                  {k.label === 'Net Bakiye' && toplamNet >= 0 ? '+' : ''}{k.label === 'Toplam Çıkış' ? '-' : ''}{TL(k.deger)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Ortak Bakiye Kartları ── */}
      {ortakBakiye.length > 0 && (
        <div className="row g-3 mb-4">
          {ortakBakiye.map(({ ad, bakiye }) => {
            const renk = ortakRenk(ad)
            const pozitif = bakiye >= 0
            // Her ortağın giriş/çıkış oranı
            const oGiris = ortakHareketler.filter(h => h.ortak_adi===ad && h.islem_tipi==='para_girisi').reduce((s,h) => s+(h.tutar??0), 0)
            const oCikis = ortakHareketler.filter(h => h.ortak_adi===ad && h.islem_tipi==='para_cikisi').reduce((s,h) => s+(h.tutar??0), 0)
            const oToplam = oGiris + oCikis
            const girisYuzde = oToplam > 0 ? (oGiris / oToplam) * 100 : 50
            return (
              <div key={ad} className="col-12 col-sm-6 col-md-4 col-xl-3">
                <div className="kasa-kpi-card" style={{ position:'relative', overflow:'hidden' }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <BasHarf ad={ad} renk={renk} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:'#ffffff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ad}</div>
                      <div style={{ fontSize:11, fontWeight:700, color: pozitif ? '#059669' : '#dc2626', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                        {pozitif ? 'Şirkette alacak' : 'Şirkete borç'}
                      </div>
                    </div>
                  </div>
                  <div className="financial-num" style={{ fontSize:'1.4rem', fontWeight:800, lineHeight:1.1, color: pozitif ? '#059669' : '#dc2626', marginBottom:10 }}>
                    {pozitif ? '+' : ''}{TL(bakiye)}
                  </div>
                  {/* Mini giriş/çıkış oranı barı */}
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ flex:1, height:4, borderRadius:2, background:'rgba(220,38,38,0.25)', overflow:'hidden' }}>
                      <div style={{ width:`${girisYuzde}%`, height:'100%', borderRadius:2, background:'#059669', transition:'width 0.4s ease' }} />
                    </div>
                    <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap' }}>
                      {Math.round(girisYuzde)}G / {Math.round(100-girisYuzde)}Ç
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Kullanım Dökümü Tablosu ── */}
      <div className="kasa-glass-card" style={{ padding:0 }}>
        <div className="px-4 pt-4 pb-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <span style={{ fontSize:15, fontWeight:700, color:'#ffffff' }}>Kullanım Dökümü</span>
            <p className="mb-0" style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>
              {filtrelendi.length} kayıt{arama ? ` · "${arama}" filtresi` : ''}
            </p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="kasa-table">
            <thead>
              <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                {['Tarih','Ortak Adı','İşlem Türü','Açıklama','Tutar',''].map((h,i) => (
                  <th key={i} style={{ fontWeight:700, color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 16px', textAlign: i===4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sayfaliVeri.map(h => {
                const renk = ortakRenk(h.ortak_adi)
                const giris = h.islem_tipi === 'para_girisi'
                return (
                  <tr key={h.id}>
                    <td style={{ fontSize:13, color:'rgba(255,255,255,0.5)', padding:'10px 16px', whiteSpace:'nowrap' }}>{tarihFmt(h.tarih)}</td>
                    <td style={{ padding:'10px 16px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width:28, height:28, borderRadius:8, background:renk, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:11, fontWeight:800, color:'#fff', lineHeight:1 }}>
                            {h.ortak_adi.split(' ').map(s=>s[0]).slice(0,2).join('')}
                          </span>
                        </div>
                        <span style={{ fontWeight:700, fontSize:13, color: renk }}>{h.ortak_adi}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 16px' }}>
                      <span className="badge" style={{ background: giris ? 'rgba(16,185,129,0.12)' : 'rgba(220,38,38,0.1)', color: giris ? '#059669' : '#dc2626', fontWeight:700, fontSize:11, padding:'4px 8px', borderRadius:6 }}>
                        <i className={`bi ${giris ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'} me-1`} style={{ fontSize:10 }} />
                        {giris ? 'Ortaktan Giriş' : 'Ortağa Çıkış'}
                      </span>
                    </td>
                    <td style={{ fontSize:13, color:'rgba(255,255,255,0.5)', padding:'10px 16px' }}>{h.aciklama || '—'}</td>
                    <td className="financial-num" style={{ textAlign:'right', fontWeight:800, fontSize:14, padding:'10px 16px', color: giris ? '#059669' : '#dc2626', whiteSpace:'nowrap' }}>
                      {giris ? '+' : '-'}{TL(h.tutar)}
                    </td>
                    <td style={{ padding:'10px 16px', textAlign:'right', whiteSpace:'nowrap' }}>
                      {silOnayId === h.id ? (
                        <span className="d-inline-flex align-items-center gap-1">
                          <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', marginRight:2 }}>Emin misiniz?</span>
                          <button onClick={() => islemSil(h.id)} className="kasa-sil-btn">Sil</button>
                          <button onClick={() => setSilOnayId(null)} className="kasa-vazgec-btn">Vazgeç</button>
                        </span>
                      ) : (
                        <button onClick={() => setSilOnayId(h.id)}
                          style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'4px 8px', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:14, transition:'all 0.15s', minWidth:44, minHeight:44, display:'inline-flex', alignItems:'center', justifyContent:'center' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.color='#dc2626' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.35)' }}>
                          <i className="bi bi-trash3" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {sayfaliVeri.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'32px', color:'rgba(255,255,255,0.35)', fontSize:14 }}>
                  {arama ? `"${arama}" için kayıt bulunamadı` : 'Henüz işlem yok'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        {toplamSayfa > 1 && (
          <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>
              {(sayfa-1)*sayfaBasi+1}–{Math.min(sayfa*sayfaBasi, filtrelendi.length)} / {filtrelendi.length} kayıt
            </span>
            <div className="d-flex gap-2">
              <button onClick={() => setSayfa(p => Math.max(1,p-1))} disabled={sayfa===1}
                className="kasa-sayfa-btn">
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: toplamSayfa }, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => setSayfa(p)}
                  className="kasa-sayfa-btn" style={{ background: p===sayfa ? '#f59e0b' : 'transparent', color: p===sayfa ? '#0d1b2e' : 'rgba(255,255,255,0.5)', borderColor: p===sayfa ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setSayfa(p => Math.min(toplamSayfa,p+1))} disabled={sayfa===toplamSayfa}
                className="kasa-sayfa-btn">
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <OrtakModal
        open={modalAcik} onClose={() => setModalAcik(false)}
        mevcutOrtaklar={ortaklar} onKaydet={islemEkle}
      />
    </div>
  )
}

// ─── Gösterge Paneli ──────────────────────────────────────────────────────────
function GostergePaneli({ hareketler, kapanislar, yatirimGuncelDeger, secilenAy, secilenYil }) {
  const [secilenTarih, setSecilenTarih] = useState(bugunTarih())

  const hesap = useMemo(() => {
    const siraliKap = [...kapanislar].sort((a,b) => a.donem.localeCompare(b.donem))
    const sonKapanis = siraliKap[siraliKap.length - 1] || null
    const oncekiKapanis = siraliKap[siraliKap.length - 2] || null

    // ── HERO 1 — Şirketin Net Değeri ──
    // Acil Nakit Gücü + Sanal Stok + Alacaklar - Borçlar
    const acilNakit = (sonKapanis ? sonKapanis.banka_nakdi : 0) + yatirimGuncelDeger
    const sanalStok = sonKapanis ? sonKapanis.sanal_stok : 0
    const alacaklar = sonKapanis ? sonKapanis.alacaklar : 0
    const borclar   = sonKapanis ? sonKapanis.borclar : 0
    const netDeger  = acilNakit + sanalStok + alacaklar - borclar

    // ── HERO 2 — Acil Nakit Gücü (Likit Varlıklar) ──
    // Merkez Kasa + Güncel Banka + Yatırım Karşılığı
    const merkezKasaH = hareketler.filter(h => h.baglanti_turu === 'Merkez Kasa')
    const merkezGiris = merkezKasaH.filter(h => h.islem_tipi === 'giris').reduce((s,h) => s+(h.tutar ?? 0), 0)
    const merkezCikis = merkezKasaH.filter(h => h.islem_tipi === 'cikis').reduce((s,h) => s+(h.tutar ?? 0), 0)
    const merkezKasa = merkezGiris - merkezCikis

    // ── HERO 3 — Piyasa Net Pozisyonu ──
    const piyasaNet = alacaklar - borclar
    const oncekiPiyasaNet = oncekiKapanis ? oncekiKapanis.alacaklar - oncekiKapanis.borclar : null
    const piyasaTrend = (oncekiPiyasaNet !== null && oncekiPiyasaNet !== 0)
      ? ((piyasaNet - oncekiPiyasaNet) / Math.abs(oncekiPiyasaNet)) * 100
      : null

    // ── Asit-Test Oranı ──
    const asitPay = acilNakit + alacaklar
    const asitOran = (sonKapanis && borclar > 0) ? asitPay / borclar : null
    const asitDurum = asitOran === null ? null
      : asitOran >= 1.0  ? { label:'Güvenli', renk:'#059669', ikon:'bi-shield-check',        bg:'rgba(5,150,105,0.12)' }
      : asitOran >= 0.70 ? { label:'Dikkat',  renk:'#d97706', ikon:'bi-exclamation-triangle', bg:'rgba(217,119,6,0.12)' }
      : { label:'Riskli',  renk:'#dc2626', ikon:'bi-x-circle',             bg:'rgba(220,38,38,0.1)' }

    // ── Operasyonel Nakit Tamponu ──
    // Aylık sabit giderler = "Personel, Vergi ve Sabit Giderler" kategorisindeki çıkışlar
    const aylikSabitGider = hareketler
      .filter(h => h.islem_tipi === 'cikis' && h.kategori === 'Personel, Vergi ve Sabit Giderler')
      .reduce((s,h) => s + (h.tutar ?? 0), 0)

    // ── Günlük Nakit Akış Ritmi ──
    const gunlukH = hareketler.filter(h => h.tarih === secilenTarih)
    const gunlukGiris = gunlukH.filter(h => h.islem_tipi === 'giris').reduce((s,h) => s+(h.tutar ?? 0), 0)
    const gunlukCikis = gunlukH.filter(h => h.islem_tipi === 'cikis').reduce((s,h) => s+(h.tutar ?? 0), 0)
    const gunlukNet = gunlukGiris - gunlukCikis
    const gunlukVar = gunlukH.length > 0

    return {
      sonKapanis, oncekiKapanis,
      netDeger, acilNakit, merkezKasa, sanalStok, alacaklar, borclar,
      piyasaNet, piyasaTrend,
      asitOran, asitDurum,
      aylikSabitGider,
      gunlukGiris, gunlukCikis, gunlukNet, gunlukVar,
    }
  }, [kapanislar, hareketler, secilenTarih, yatirimGuncelDeger])

  const {
    sonKapanis, netDeger, acilNakit, merkezKasa, sanalStok, alacaklar, borclar,
    piyasaNet, piyasaTrend,
    asitOran, asitDurum,
    aylikSabitGider,
    gunlukGiris, gunlukCikis, gunlukNet, gunlukVar,
  } = hesap
  const piyasaRenk = piyasaNet >= 0 ? '#059669' : '#dc2626'

  // Borç/Alacak oran hesabı (görsel çubuk için)
  const boAcakPct = (alacaklar + borclar > 0)
    ? Math.round(alacaklar / (alacaklar + borclar) * 100)
    : 50

  return (
    <div>

      {/* ══════════════════════════════════════════════════════════════
          SATIR 1 — HERO CARDS (3'lü Grid)
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3 mb-3">

        {/* ── HERO KART 1 — Şirketin Net Değeri (En büyük, vurgulu) ── */}
        <div className="col-12 col-lg-5">
          <div className="kasa-gp-hero">
            {/* Kart başlık şeridi */}
            <div className="kasa-gp-hero-header">
              <div style={{ width:32, height:32, borderRadius:10, background:'rgba(8,145,178,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className="bi bi-building" style={{ color:'#0891b2', fontSize:16 }} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.9px' }}>Şirketin Net Değeri</span>
            </div>

            {/* Kart gövde */}
            <div className="kasa-gp-hero-body">
              {sonKapanis ? (
                <>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.7px' }}>
                    Nakit + Stok + Alacak − Borç
                  </div>
                  <div className="financial-num" style={{
                    fontFamily:'Inter, sans-serif', fontSize:'clamp(24px, 4.5vw, 38px)', fontWeight:800,
                    color:'#ffffff', letterSpacing:'-0.02em', lineHeight:1, marginBottom:18,
                    WebkitFontSmoothing:'antialiased', textShadow:'0 0 36px rgba(8,145,178,0.22)',
                    fontVariantNumeric:'tabular-nums'
                  }}>
                    {TL(netDeger)}
                  </div>
                  {/* Detay kutucukları — 2x2 grid */}
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="kasa-gp-tile">
                        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>Acil Nakit</div>
                        <div className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:700, color:'#10b981', fontVariantNumeric:'tabular-nums' }}>{TL(acilNakit)}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="kasa-gp-tile">
                        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>Sanal Stok</div>
                        <div className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:700, color:'#f59e0b', fontVariantNumeric:'tabular-nums' }}>{TL(sanalStok)}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="kasa-gp-tile" style={{ background:'rgba(16,185,129,0.06)', borderColor:'rgba(16,185,129,0.12)' }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'rgba(16,185,129,0.6)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>Alacaklar</div>
                        <div className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:700, color:'#10b981', fontVariantNumeric:'tabular-nums' }}>{TL(alacaklar)}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="kasa-gp-tile" style={{ background:'rgba(239,68,68,0.06)', borderColor:'rgba(239,68,68,0.12)' }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'rgba(239,68,68,0.6)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>Borçlar</div>
                        <div className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:700, color:'#ef4444', fontVariantNumeric:'tabular-nums' }}>−{TL(borclar)}</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding:'24px 0', textAlign:'center' }}>
                  <i className="bi bi-calendar-x" style={{ fontSize:34, color:'rgba(255,255,255,0.12)', display:'block', marginBottom:10 }} />
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', fontWeight:600 }}>Henüz ay kapanışı yapılmadı</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)', marginTop:4 }}>Bilanço sekmesinden kapanış yapın</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── HERO KART 2 — Acil Nakit Gücü (Likit Varlıklar) ── */}
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="kasa-gp-sm-kpi" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
            <i className="bi bi-lightning-charge-fill" style={{ position:'absolute', top:14, right:14, fontSize:54, color:'#10b981', opacity:0.20, pointerEvents:'none' }} />
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14 }}>
              <i className="bi bi-lightning-charge me-1" style={{ color:'#10b981', opacity:0.8 }} />Acil Nakit Gücü
            </div>
            <div className="financial-num" style={{
              fontFamily:'Inter, sans-serif', fontSize:'clamp(18px, 3.5vw, 26px)', fontWeight:800,
              color:'#10b981', letterSpacing:'-0.01em', WebkitFontSmoothing:'antialiased',
              fontVariantNumeric:'tabular-nums', marginBottom:16, textShadow:'0 0 20px rgba(16,185,129,0.3)'
            }}>
              {TL(acilNakit)}
            </div>
            {/* Alt detaylar */}
            <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:6 }}>
              <div className="d-flex justify-content-between align-items-center" style={{ padding:'6px 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}><i className="bi bi-safe2 me-1" />Merkez Kasa</span>
                <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', fontVariantNumeric:'tabular-nums' }}>{TL(merkezKasa)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}><i className="bi bi-bank me-1" />Banka Nakdi</span>
                <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', fontVariantNumeric:'tabular-nums' }}>{TL(sonKapanis?.banka_nakdi ?? 0)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}><i className="bi bi-gem me-1" />Yatırım Karşılığı</span>
                <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', fontVariantNumeric:'tabular-nums' }}>{TL(yatirimGuncelDeger)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── HERO KART 3 — Piyasa Net Pozisyonu ── */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="kasa-gp-sm-kpi" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
            <i className={`bi ${piyasaNet >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}`} style={{ position:'absolute', top:14, right:14, fontSize:54, color:piyasaRenk, opacity:0.20, pointerEvents:'none' }} />
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14 }}>
              <i className="bi bi-arrow-left-right me-1" style={{ color:piyasaRenk, opacity:0.8 }} />Piyasa Pozisyonu
            </div>
            <div className="financial-num" style={{
              fontFamily:'Inter, sans-serif', fontSize:'clamp(18px, 3.5vw, 26px)', fontWeight:800,
              color: piyasaNet >= 0 ? '#10b981' : '#ef4444', letterSpacing:'-0.01em',
              WebkitFontSmoothing:'antialiased', fontVariantNumeric:'tabular-nums', marginBottom:8,
              textShadow: `0 0 20px ${piyasaRenk}4D`
            }}>
              {piyasaNet >= 0 ? '+' : ''}{TL(piyasaNet)}
            </div>

            <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', fontWeight:500, marginBottom:8 }}>Alacaklar − Borçlar</div>
            {piyasaTrend !== null
              ? <DegisimBadge fark={piyasaTrend} />
              : <span style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontWeight:500 }}>Kıyaslanacak geçmiş yok</span>
            }

            {/* Mini durum badge */}
            <div style={{ marginTop:'auto', paddingTop:10 }}>
              <span style={{
                fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:8,
                background: piyasaNet >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: piyasaNet >= 0 ? '#10b981' : '#ef4444', display:'inline-block'
              }}>
                <i className={`bi ${piyasaNet >= 0 ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-1`} style={{ fontSize:10 }} />
                {piyasaNet >= 0 ? 'Alacak Lehine' : 'Borç Lehine'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SATIR 2 — FİNANSAL SAĞLIK (2'li Grid)
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3 mb-3">

        {/* ── ASİT-TEST ORANI — Gauge Kadranı ── */}
        <div className="col-12 col-md-6">
          <div className="kasa-gp-health">
            {/* Başlık + durum badge */}
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={{ width:32, height:32, borderRadius:10, background: asitDurum?.bg ?? 'rgba(100,116,139,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className={`bi ${asitDurum?.ikon ?? 'bi-dash-circle'}`} style={{ color: asitDurum?.renk ?? 'rgba(255,255,255,0.35)', fontSize:16 }} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.9px' }}>Asit-Test Oranı</span>
              {asitDurum && (
                <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, padding:'4px 11px', borderRadius:7, background: asitDurum.bg, color: asitDurum.renk, whiteSpace:'nowrap', flexShrink:0 }}>
                  <i className={`bi ${asitDurum.ikon} me-1`} style={{ fontSize:10 }} />{asitDurum.label}
                </span>
              )}
            </div>

            {sonKapanis ? (
              <>
                {/* SVG Gauge */}
                <AsitGauge oran={asitOran} durum={asitDurum} />

                {/* Formül açıklama */}
                <div style={{ marginTop:8, padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.05)' }}>
                  <div className="d-flex justify-content-between" style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>
                    <span>Pay: Nakit + Alacak</span>
                    <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', color:'rgba(255,255,255,0.6)', fontVariantNumeric:'tabular-nums' }}>
                      {TL(acilNakit + alacaklar)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mt-1" style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>
                    <span>Payda: Borçlar</span>
                    <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', color:'rgba(255,255,255,0.6)', fontVariantNumeric:'tabular-nums' }}>
                      {TL(borclar)}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:'8px 0 0', fontWeight:500, lineHeight:1.55, textAlign:'center' }}>
                  Stok hariç kısa vadeli ödeme gücü. 1.0 ve üzeri güvenli bölge.
                </p>
              </>
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'30px 0' }}>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontWeight:600, textAlign:'center' }}>
                  <i className="bi bi-speedometer2" style={{ fontSize:28, display:'block', marginBottom:8, opacity:0.4 }} />
                  Henüz ay kapanışı yapılmadı
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── OPERASYONEl NAKİT TAMPONU ── */}
        <div className="col-12 col-md-6">
          <div className="kasa-gp-health">
            {/* Başlık */}
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={{ width:32, height:32, borderRadius:10, background:'rgba(245,158,11,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className="bi bi-hourglass-split" style={{ color:'#f59e0b', fontSize:16 }} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.9px' }}>Operasyonel Nakit Tamponu</span>
            </div>

            {sonKapanis ? (
              <NakitTamponuBari aylikGider={aylikSabitGider} acilNakit={acilNakit} />
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'30px 0' }}>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontWeight:600, textAlign:'center' }}>
                  <i className="bi bi-hourglass" style={{ fontSize:28, display:'block', marginBottom:8, opacity:0.4 }} />
                  Henüz ay kapanışı yapılmadı
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SATIR 3 — AKSİYON ve AKIŞ (2'li Grid)
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3">

        {/* ── GÜNLÜK RİTİM ── */}
        <div className="col-12 col-md-6">
          <div className="kasa-gp-balance" style={{ height:'100%' }}>
            {/* Başlık + tarih seçici */}
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
              <div className="d-flex align-items-center gap-2">
                <div style={{ width:30, height:30, borderRadius:9, background:'rgba(245,158,11,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="bi bi-calendar-check" style={{ color:'#f59e0b', fontSize:14 }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.9px' }}>Günlük Ritim</span>
              </div>
              <input
                type="date" value={secilenTarih} onChange={e => setSecilenTarih(e.target.value)}
                className="kasa-input" style={{ width:140, fontSize:11, padding:'5px 8px', minHeight:34, borderRadius:8 }}
              />
            </div>

            {gunlukVar ? (
              <div>
                {/* Giriş — Çıkış yan yana kartlar */}
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.12)', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:10, color:'rgba(16,185,129,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>
                        <i className="bi bi-arrow-down-circle me-1" />Giriş
                      </div>
                      <div className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:16, fontWeight:800, color:'#10b981', fontVariantNumeric:'tabular-nums' }}>
                        +{TL(gunlukGiris)}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.12)', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:10, color:'rgba(239,68,68,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>
                        <i className="bi bi-arrow-up-circle me-1" />Çıkış
                      </div>
                      <div className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:16, fontWeight:800, color:'#ef4444', fontVariantNumeric:'tabular-nums' }}>
                        −{TL(gunlukCikis)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Günlük Net sonuç */}
                <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'14px', textAlign:'center', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>Günlük Net</div>
                  <div className="financial-num" style={{
                    fontFamily:'Inter, sans-serif', fontSize:22, fontWeight:800,
                    color: gunlukNet >= 0 ? '#10b981' : '#ef4444', fontVariantNumeric:'tabular-nums'
                  }}>
                    {gunlukNet >= 0 ? '+' : ''}{TL(gunlukNet)}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 0' }}>
                <div style={{ textAlign:'center', color:'rgba(255,255,255,0.28)', fontSize:12, fontWeight:500 }}>
                  <i className="bi bi-calendar-x" style={{ fontSize:28, display:'block', marginBottom:8, opacity:0.5 }} />
                  Bu tarihte işlem bulunamadı
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── BORÇ / ALACAK DENGESİ ── */}
        <div className="col-12 col-md-6">
          <div className="kasa-gp-balance" style={{ height:'100%' }}>
            {/* Başlık */}
            <div className="d-flex align-items-center gap-2 mb-3">
              <div style={{ width:30, height:30, borderRadius:9, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="bi bi-bar-chart-line" style={{ color:'rgba(255,255,255,0.5)', fontSize:14 }} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.9px' }}>Borç / Alacak Dengesi</span>
            </div>

            {/* Alacak değeri */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span style={{ fontSize:11, color:'rgba(16,185,129,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px' }}>
                <i className="bi bi-arrow-down-circle me-1" />Alacağımız
              </span>
              <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:15, fontWeight:800, color:'#10b981', fontVariantNumeric:'tabular-nums' }}>
                {TL(alacaklar)}
              </span>
            </div>

            {/* Alacak çubuğu (yeşil) */}
            <div style={{ height:10, borderRadius:5, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:12, position:'relative' }}>
              <div style={{
                width:`${boAcakPct}%`, height:'100%',
                background:'linear-gradient(90deg, #10b981, #059669)',
                borderRadius:5, transition:'width 0.4s ease',
                boxShadow:'0 0 8px rgba(16,185,129,0.3)'
              }} />
            </div>

            {/* Borç çubuğu (kırmızı, ters yönde) */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span style={{ fontSize:11, color:'rgba(239,68,68,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px' }}>
                <i className="bi bi-arrow-up-circle me-1" />Borcumuz
              </span>
              <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:15, fontWeight:800, color:'#ef4444', fontVariantNumeric:'tabular-nums' }}>
                {TL(borclar)}
              </span>
            </div>

            <div style={{ height:10, borderRadius:5, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:14, position:'relative' }}>
              <div style={{
                width:`${100 - boAcakPct}%`, height:'100%',
                background:'linear-gradient(90deg, #ef4444, #dc2626)',
                borderRadius:5, transition:'width 0.4s ease',
                boxShadow:'0 0 8px rgba(239,68,68,0.3)'
              }} />
            </div>

            {/* Net pozisyon özeti */}
            <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'12px 14px', textAlign:'center', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span style={{ fontSize:10, fontWeight:700, color:'rgba(16,185,129,0.6)' }}>{boAcakPct}% alacak</span>
                <span style={{
                  fontSize:12, fontWeight:700,
                  color: alacaklar >= borclar ? '#10b981' : '#ef4444'
                }}>
                  <i className={`bi ${alacaklar >= borclar ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-1`} style={{ fontSize:11 }} />
                  Net: {TL(Math.abs(alacaklar - borclar))}
                </span>
                <span style={{ fontSize:10, fontWeight:700, color:'rgba(239,68,68,0.6)' }}>{100 - boAcakPct}% borç</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// ─── SVG Gauge (Asit-Test Kadranı) ──────────────────────────────────────────
function AsitGauge({ oran, durum }) {
  // 180° yarım daire gauge
  const r = 72, cx = 90, cy = 90, sw = 10
  const circumHalf = Math.PI * r // yarım çevre
  const clamped = Math.min(Math.max(oran ?? 0, 0), 2.5) // 0–2.5 arasına sınırla
  const pct = clamped / 2.5
  const dashLen = pct * circumHalf
  const dashGap = circumHalf - dashLen
  const renk = durum?.renk ?? 'rgba(255,255,255,0.2)'

  // Arc path: sol-180° → sağ-0°
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  return (
    <svg viewBox="0 0 180 110" style={{ width: '100%', maxWidth: 220, height: 'auto', display: 'block', margin: '0 auto' }}>
      {/* Arka plan track */}
      <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} strokeLinecap="round" />

      {/* Hedef çizgisi (1.0 noktası = %40) */}
      {(() => {
        const hedefAci = Math.PI - (1.0 / 2.5) * Math.PI
        const hx = cx + r * Math.cos(hedefAci)
        const hy = cy - r * Math.sin(hedefAci)
        const ix = cx + (r - sw - 4) * Math.cos(hedefAci)
        const iy = cy - (r - sw - 4) * Math.sin(hedefAci)
        const ox = cx + (r + 4) * Math.cos(hedefAci)
        const oy = cy - (r + 4) * Math.sin(hedefAci)
        return <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
      })()}

      {/* Dolgu arc */}
      <path d={arcPath} fill="none" stroke={renk} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={`${dashLen} ${dashGap}`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />

      {/* Oran değeri */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill={renk} fontSize="32" fontWeight="900"
        fontFamily="Inter, sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {oran !== null ? oran.toFixed(2) : '—'}
      </text>

      {/* Alt etiket */}
      <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="600">
        HEDEF: 1.00
      </text>

      {/* Ölçek etiketleri */}
      <text x={cx - r - 2} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">0</text>
      <text x={cx + r + 2} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">2.5</text>
    </svg>
  )
}

// ─── Operasyonel Nakit Tamponu Barı ─────────────────────────────────────────
function NakitTamponuBari({ aylikGider, acilNakit }) {
  const aylikG = aylikGider > 0 ? aylikGider : 1
  const tamponAy = acilNakit / aylikG
  const maxAy = 12
  const pct = Math.min((tamponAy / maxAy) * 100, 100)
  const renk = tamponAy >= 6 ? '#10b981' : tamponAy >= 3 ? '#f59e0b' : '#ef4444'
  const durumLabel = tamponAy >= 6 ? 'Güvenli' : tamponAy >= 3 ? 'Dikkat' : 'Riskli'
  const durumIkon = tamponAy >= 6 ? 'bi-shield-check' : tamponAy >= 3 ? 'bi-exclamation-triangle' : 'bi-x-circle'

  return (
    <div>
      {/* Büyük rakam */}
      <div className="text-center" style={{ padding: '12px 0 16px' }}>
        <div className="financial-num" style={{
          fontFamily: 'Inter, sans-serif', fontSize: 48, fontWeight: 900,
          color: renk, lineHeight: 1, WebkitFontSmoothing: 'antialiased',
          textShadow: `0 0 28px ${renk}35`, fontVariantNumeric: 'tabular-nums'
        }}>
          {tamponAy.toFixed(1)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
          Ay Yeterli Nakit
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${renk}, ${renk}cc)`,
          borderRadius: 4, transition: 'width 0.6s ease'
        }} />
      </div>

      {/* Alt bilgi */}
      <div className="d-flex justify-content-between align-items-center mt-2">
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>0 Ay</span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 7,
          background: `${renk}18`, color: renk
        }}>
          <i className={`bi ${durumIkon} me-1`} style={{ fontSize: 10 }} />{durumLabel}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>12 Ay</span>
      </div>

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '10px 0 0', fontWeight: 500, lineHeight: 1.55, textAlign: 'center' }}>
        Acil Nakit / Aylık Sabit Giderler
      </p>
    </div>
  )
}

// ─── SVG Donut Chart (Dağılım Pasta Grafiği) ────────────────────────────────
function DonutChart({ parcalar, renk, boyut = 100 }) {
  const cx = boyut / 2, cy = boyut / 2, r = (boyut / 2) - 8, sw = 14
  const toplam = parcalar.reduce((s, p) => s + p.tutar, 0)
  if (toplam === 0) {
    return (
      <svg width={boyut} height={boyut} viewBox={`0 0 ${boyut} ${boyut}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="11" fontWeight="600">Veri Yok</text>
      </svg>
    )
  }
  const renkler = renk === 'giris'
    ? ['#10b981', '#059669', '#047857', '#065f46']
    : ['#ef4444', '#dc2626', '#b91c1c', '#991b1b']
  const circumference = 2 * Math.PI * r
  let offset = -circumference / 4 // 12 o'clock başlangıç

  return (
    <svg width={boyut} height={boyut} viewBox={`0 0 ${boyut} ${boyut}`}>
      {parcalar.map((p, i) => {
        const pct = p.tutar / toplam
        const dashLen = pct * circumference
        const dashGap = circumference - dashLen
        const currentOffset = offset
        offset += dashLen
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={renkler[i % renkler.length]} strokeWidth={sw}
            strokeDasharray={`${dashLen} ${dashGap}`}
            strokeDashoffset={-currentOffset}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        )
      })}
      {/* Ortadaki toplam */}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="700" letterSpacing="0.5">TOPLAM</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill={renk === 'giris' ? '#10b981' : '#ef4444'} fontSize="11" fontWeight="800" fontFamily="Inter, sans-serif">
        {toplam >= 1000000 ? `${(toplam/1000000).toFixed(1)}M` : toplam >= 1000 ? `${(toplam/1000).toFixed(0)}K` : toplam.toFixed(0)}
      </text>
    </svg>
  )
}

// ─── Kategori Detay Modalı ────────────────────────────────────────────────────
function KategoriDetayModal({ show, onClose, kategori, tip, hareketler }) {
  const [siralamaAlan,  setSiralamaAlan]  = useState('tarih')
  const [siralamaYon,   setSiralamaYon]   = useState('azalan')

  useEffect(() => {
    if (!show) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [show, onClose])

  useEffect(() => {
    if (!show) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [show])

  if (!show || !kategori) return null

  const filtreli = hareketler.filter(h => h.kategori === kategori && h.islem_tipi === tip)

  const sirali = [...filtreli].sort((a, b) => {
    let fark = 0
    if (siralamaAlan === 'tarih')         fark = a.tarih.localeCompare(b.tarih)
    else if (siralamaAlan === 'baglanti') fark = (a.baglanti_turu || '').localeCompare(b.baglanti_turu || '')
    else if (siralamaAlan === 'tutar')    fark = (a.tutar ?? 0) - (b.tutar ?? 0)
    return siralamaYon === 'azalan' ? -fark : fark
  })

  const toplam = sirali.reduce((s, h) => s + (h.tutar ?? 0), 0)

  const sutunTikla = (alan) => {
    if (siralamaAlan === alan) setSiralamaYon(y => y === 'azalan' ? 'artan' : 'azalan')
    else { setSiralamaAlan(alan); setSiralamaYon('azalan') }
  }

  const SiralamaIkon = ({ alan }) => {
    if (siralamaAlan !== alan) return null
    return <i className={`bi bi-arrow-${siralamaYon === 'azalan' ? 'down' : 'up'}`} style={{ fontSize:11, marginLeft:3 }} />
  }

  const girismi = tip === 'giris'
  const tipRenk = girismi ? '#059669' : '#dc2626'
  const tipBg   = girismi ? 'rgba(16,185,129,0.12)' : 'rgba(220,38,38,0.1)'

  return createPortal(
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', zIndex:1040, animation:'kasaFadeIn 0.15s ease' }} />
      <div style={{ position:'fixed', inset:0, zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div style={{ width:'100%', maxWidth:600, maxHeight:'88vh', display:'flex', flexDirection:'column', borderRadius:20, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', background:'rgba(13,27,46,0.95)', backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)', border:'1px solid rgba(255,255,255,0.1)' }}>

          {/* Başlık */}
          <div style={{ padding:'18px 24px', borderBottom:'2px solid #f59e0b', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span style={{ fontSize:16, fontWeight:800, color:'#ffffff' }}>{kategori}</span>
              <span className="badge" style={{ background:tipBg, color:tipRenk, fontWeight:700, fontSize:12 }}>
                {girismi ? 'Giriş' : 'Çıkış'}
              </span>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:18, width:44, height:44, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0 }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Tablo */}
          <div style={{ overflowY:'auto', flex:1 }}>
            {sirali.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.35)', fontSize:14 }}>
                Bu kategoriye ait işlem bulunamadı.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="kasa-table">
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                      <th onClick={() => sutunTikla('tarih')} style={{ fontWeight:700, color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 16px', cursor:'pointer', userSelect:'none' }}>
                        Tarih <SiralamaIkon alan="tarih" />
                      </th>
                      <th onClick={() => sutunTikla('baglanti')} style={{ fontWeight:700, color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 16px', cursor:'pointer', userSelect:'none' }}>
                        Bağlantı Türü <SiralamaIkon alan="baglanti" />
                      </th>
                      <th onClick={() => sutunTikla('tutar')} style={{ fontWeight:700, color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 16px', textAlign:'right', cursor:'pointer', userSelect:'none' }}>
                        Tutar <SiralamaIkon alan="tutar" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sirali.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontSize:13, color:'rgba(255,255,255,0.5)', padding:'10px 16px', whiteSpace:'nowrap' }}>{tarihFmt(h.tarih)}</td>
                        <td style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.9)', padding:'10px 16px' }}>{h.baglanti_turu || '—'}</td>
                        <td className="financial-num" style={{ textAlign:'right', fontWeight:800, fontSize:13, padding:'10px 16px', color:tipRenk, whiteSpace:'nowrap' }}>
                          {TL(h.tutar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop:'2px solid rgba(255,255,255,0.08)' }}>
                      <td colSpan={2} style={{ padding:'10px 16px', fontWeight:700, color:'rgba(255,255,255,0.6)', fontSize:13 }}>Toplam</td>
                      <td className="financial-num" style={{ textAlign:'right', fontWeight:900, fontSize:14, padding:'10px 16px', color:tipRenk }}>
                        {TL(toplam)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Nakit Akışı ─────────────────────────────────────────────────────────────
function NakitAkisi({ secilenAy, secilenYil, setSecilenAy, setSecilenYil, hareketler, setHareketler, kapanislar }) {
  const [modalAcik,    setModalAcik]    = useState(false)
  const [silOnayId,    setSilOnayId]    = useState(null)
  const [sayfa,        setSayfa]        = useState(1)
  const [detayKategori, setDetayKategori] = useState(null)
  const [detayTip,      setDetayTip]      = useState(null)
  const sayfaBasi = 10

  const hesap = useMemo(() => {
    const ozet = hesaplaOzet(hareketler, kapanislar)
    const siraliKap = [...(kapanislar ?? [])].sort((a,b) => a.donem.localeCompare(b.donem))
    const sonKap = siraliKap[siraliKap.length - 1] || null
    const tarihler = [...new Set(hareketler.map(h => h.tarih))].sort()
    let bakiye = sonKap ? sonKap.banka_nakdi : 0
    const kumulatif = tarihler.map(t => {
      const gG = hareketler.filter(h => h.tarih===t && h.islem_tipi==='giris').reduce((s,h)=>s+(h.tutar ?? 0),0)
      const gC  = hareketler.filter(h => h.tarih===t && h.islem_tipi==='cikis').reduce((s,h) =>s+(h.tutar ?? 0),0)
      bakiye += gG - gC
      return { tarih:t, gun:parseInt(t.split('-')[2]), bakiye }
    })
    return { ...ozet, kumulatif }
  }, [hareketler, kapanislar])

  const sirali      = [...hareketler].sort((a,b) => b.tarih.localeCompare(a.tarih) || b.id-a.id)
  const toplamSayfa = Math.ceil(sirali.length / sayfaBasi)
  const sayfaliVeri = sirali.slice((sayfa-1)*sayfaBasi, sayfa*sayfaBasi)

  const islemEkle = async (yeni) => {
    if (yeni.islem_tipi === 'cikis' && yeni.baglanti_turu === 'Günlük Çekmece Nakdi') {
      try {
        const res = await hareketEkle(yeni)
        if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt eklenemedi.'); return }
        const kaydedilen = { ...yeni, id: res.data.veri.hareket_id }
        const autoGiris = {
          id: 'auto-' + kaydedilen.id,
          tarih: kaydedilen.tarih,
          islem_tipi: 'giris',
          kategori: 'Günlük Çekmece Hasılatı',
          baglanti_turu: 'Çekmece Otomatik',
          tutar: kaydedilen.tutar,
          aciklama: '',
        }
        setHareketler(prev => [...prev, autoGiris, kaydedilen])
      } catch {
        toast.error('Kayıt eklenemedi.')
      }
    } else {
      try {
        const res = await hareketEkle(yeni)
        if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt eklenemedi.'); return }
        setHareketler(prev => [...prev, { ...yeni, id: res.data.veri.hareket_id }])
      } catch {
        toast.error('Kayıt eklenemedi.')
      }
    }
  }

  const islemSil = async (id) => {
    if (String(id).startsWith('auto-')) {
      setHareketler(prev => prev.filter(h => h.id !== id))
      setSilOnayId(null)
      return
    }
    try {
      const res = await hareketSil(id)
      if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt silinemedi.'); return }
      setHareketler(prev => prev.filter(h => h.id !== id))
      setSilOnayId(null)
    } catch {
      toast.error('Kayıt silinemedi.')
    }
  }

  // Aylık net nakit akış hızı
  const aylikNet = hesap.toplamGiris - hesap.toplamCikis

  // Donut chart için dağılım verileri
  const girisRenkler = ['#10b981', '#059669', '#047857', '#065f46']
  const cikisRenkler = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b']

  return (
    <div>
      {/* ── Dönem Seçici (En Üstte) ── */}
      <DonemFiltresi secilenAy={secilenAy} secilenYil={secilenYil} setSecilenAy={setSecilenAy} setSecilenYil={setSecilenYil} />

      {/* ══════════════════════════════════════════════════════════════
          ÜST SATIR — 4'lü KPI Grid
          ══════════════════════════════════════════════════════════════ */}
      <DortKart ozet={hesap} />

      {/* Yeni İşlem Ekle */}
      <div className="d-flex justify-content-center mb-4">
        <button onClick={() => setModalAcik(true)} className="kasa-btn-amber d-flex align-items-center gap-2"
          style={{ borderRadius:50, padding:'12px 36px' }}>
          <i className="bi bi-plus-circle-fill" style={{ fontSize:18 }} />
          Yeni İşlem Ekle
        </button>
      </div>

      <NakitModal
        open={modalAcik} onClose={() => setModalAcik(false)}
        initialTur="giris" onKaydet={islemEkle} hareketler={hareketler}
      />

      {/* ══════════════════════════════════════════════════════════════
          ORTA SATIR — Dağılımlar (2'li Grid) + Donut Chart
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3 mb-4">

        {/* ── Giriş Dağılımı + Donut ── */}
        <div className="col-12 col-md-6">
          <div className="kasa-glass-card" style={{ padding:0, height:'100%' }}>
            <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="d-flex align-items-center gap-2">
                <div style={{ width:28, height:28, borderRadius:8, background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="bi bi-arrow-down-circle-fill" style={{ color:'#10b981', fontSize:14 }} />
                </div>
                <span style={{ fontSize:14, fontWeight:700, color:'#10b981' }}>Giriş Dağılımı</span>
              </div>
            </div>
            <div className="d-flex flex-column flex-sm-row">
              {/* Donut Chart */}
              <div className="d-flex align-items-center justify-content-center" style={{ padding:'16px 12px', flexShrink:0 }}>
                <DonutChart parcalar={hesap.girisDagilim} renk="giris" boyut={110} />
              </div>
              {/* Liste */}
              <div style={{ flex:1 }}>
                {hesap.girisDagilim.map((item, idx) => {
                  const toplam = hesap.girisDagilim.reduce((s, p) => s + p.tutar, 0)
                  const pct = toplam > 0 ? ((item.tutar / toplam) * 100).toFixed(0) : 0
                  return (
                    <div key={item.kat}
                      className="kasa-list-item"
                      style={{ padding:'10px 14px', cursor:'pointer' }}
                      onClick={() => { setDetayKategori(item.kat); setDetayTip('giris') }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width:8, height:8, borderRadius:'50%', background:girisRenkler[idx % girisRenkler.length], flexShrink:0, boxShadow:`0 0 6px ${girisRenkler[idx % girisRenkler.length]}66` }} />
                        <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)' }}>{item.kat}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)' }}>{pct}%</span>
                        <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:700, color:'#10b981' }}>{TL(item.tutar)}</span>
                        <i className="bi bi-chevron-right" style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Çıkış Dağılımı + Donut ── */}
        <div className="col-12 col-md-6">
          <div className="kasa-glass-card" style={{ padding:0, height:'100%' }}>
            <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="d-flex align-items-center gap-2">
                <div style={{ width:28, height:28, borderRadius:8, background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="bi bi-arrow-up-circle-fill" style={{ color:'#ef4444', fontSize:14 }} />
                </div>
                <span style={{ fontSize:14, fontWeight:700, color:'#ef4444' }}>Çıkış Dağılımı</span>
              </div>
            </div>
            <div className="d-flex flex-column flex-sm-row">
              {/* Donut Chart */}
              <div className="d-flex align-items-center justify-content-center" style={{ padding:'16px 12px', flexShrink:0 }}>
                <DonutChart parcalar={hesap.cikisDagilim} renk="cikis" boyut={110} />
              </div>
              {/* Liste */}
              <div style={{ flex:1 }}>
                {hesap.cikisDagilim.map((item, idx) => {
                  const toplam = hesap.cikisDagilim.reduce((s, p) => s + p.tutar, 0)
                  const pct = toplam > 0 ? ((item.tutar / toplam) * 100).toFixed(0) : 0
                  return (
                    <div key={item.kat}
                      className="kasa-list-item"
                      style={{ padding:'10px 14px', cursor:'pointer' }}
                      onClick={() => { setDetayKategori(item.kat); setDetayTip('cikis') }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width:8, height:8, borderRadius:'50%', background:cikisRenkler[idx % cikisRenkler.length], flexShrink:0, boxShadow:`0 0 6px ${cikisRenkler[idx % cikisRenkler.length]}66` }} />
                        <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)' }}>{item.kat}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)' }}>{pct}%</span>
                        <span className="financial-num" style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:700, color:'#ef4444' }}>{TL(item.tutar)}</span>
                        <i className="bi bi-chevron-right" style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ALT SATIR — Kümülatif Grafik + Net Nakit Akış Hızı
          ══════════════════════════════════════════════════════════════ */}
      <div className="kasa-glass-card" style={{ padding:'20px 22px', marginBottom:'1rem' }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <span style={{ fontSize:15, fontWeight:700, color:'#ffffff' }}>Kümülatif Banka & Kasa Bakiyesi</span>
            <p className="mb-0" style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>{AY_ADLARI[secilenAy-1]} {secilenYil} — Günlük değişim</p>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span style={{ width:12, height:12, borderRadius:2, background:'#10b981', display:'inline-block' }} />
            <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)' }}>Bakiye</span>
          </div>
        </div>
        <KumulatifGrafik veri={hesap.kumulatif} />

        {/* Aylık Net Nakit Akış Hızı İndikatörü */}
        <div style={{
          marginTop:16, padding:'12px 16px', borderRadius:10,
          background: aylikNet >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${aylikNet >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`
        }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${aylikNet >= 0 ? 'bi-speedometer2' : 'bi-exclamation-triangle'}`}
                style={{ color: aylikNet >= 0 ? '#10b981' : '#ef4444', fontSize:16 }} />
              <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                Aylık Net Nakit Akış Hızı
              </span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
                Giriş − Çıkış
              </span>
              <span className="financial-num" style={{
                fontFamily:'Inter, sans-serif', fontSize:16, fontWeight:800,
                color: aylikNet >= 0 ? '#10b981' : '#ef4444', fontVariantNumeric:'tabular-nums'
              }}>
                {aylikNet >= 0 ? '+' : ''}{TL(aylikNet)}
              </span>
              <i className={`bi ${aylikNet >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}`}
                style={{ color: aylikNet >= 0 ? '#10b981' : '#ef4444', fontSize:16 }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── İşlem Hareketleri Tablosu ── */}
      <div className="kasa-glass-card" style={{ padding:0 }}>
        <div className="px-4 pt-4 pb-3 d-flex align-items-center justify-content-between" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <span style={{ fontSize:15, fontWeight:700, color:'#ffffff' }}>İşlem Hareketleri</span>
            <p className="mb-0" style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>{sirali.length} kayıt</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="kasa-table">
            <thead>
              <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                {['Tarih','Tür','Kategori','Açıklama','Tutar',''].map((h,i) => (
                  <th key={i} style={{ fontWeight:700, color:'rgba(255,255,255,0.5)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 16px', textAlign: i===4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sayfaliVeri.map(h => (
                <tr key={h.id}>
                  <td style={{ fontSize:13, color:'rgba(255,255,255,0.5)', padding:'10px 16px', whiteSpace:'nowrap' }}>{tarihFmt(h.tarih)}</td>
                  <td style={{ padding:'10px 16px' }}>
                    <span className="badge" style={{ background: h.islem_tipi==='giris' ? 'rgba(16,185,129,0.12)' : 'rgba(220,38,38,0.1)', color: h.islem_tipi==='giris' ? '#059669' : '#dc2626', fontWeight:700, fontSize:11, padding:'4px 8px' }}>
                      {h.islem_tipi==='giris' ? 'Giriş' : 'Çıkış'}
                    </span>
                  </td>
                  <td style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.9)', padding:'10px 16px' }}>{h.kategori}</td>
                  <td style={{ fontSize:13, color:'rgba(255,255,255,0.5)', padding:'10px 16px' }}>{h.aciklama || '—'}</td>
                  <td className="financial-num" style={{ textAlign:'right', fontWeight:800, fontSize:14, padding:'10px 16px', color: h.islem_tipi==='giris' ? '#059669' : '#dc2626', whiteSpace:'nowrap' }}>
                    {h.islem_tipi==='giris' ? '+' : '-'}{TL(h.tutar)}
                  </td>
                  <td style={{ padding:'10px 16px', textAlign:'right', whiteSpace:'nowrap' }}>
                    {silOnayId === h.id ? (
                      <span className="d-inline-flex align-items-center gap-1">
                        <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', marginRight:2 }}>Emin misiniz?</span>
                        <button onClick={() => islemSil(h.id)}
                          style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          Sil
                        </button>
                        <button onClick={() => setSilOnayId(null)}
                          style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)', border:'none', borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          Vazgeç
                        </button>
                      </span>
                    ) : (
                      <button onClick={() => setSilOnayId(h.id)}
                        style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'4px 8px', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:14, transition:'all 0.15s', minWidth:44, minHeight:44, display:'inline-flex', alignItems:'center', justifyContent:'center' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.color='#dc2626' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.35)' }}>
                        <i className="bi bi-trash3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sayfaliVeri.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'32px', color:'rgba(255,255,255,0.35)', fontSize:14 }}>Kayıt bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        {toplamSayfa > 1 && (
          <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>
              {(sayfa-1)*sayfaBasi+1}–{Math.min(sayfa*sayfaBasi, sirali.length)} / {sirali.length} kayıt
            </span>
            <div className="d-flex gap-2">
              <button onClick={() => setSayfa(p => Math.max(1,p-1))} disabled={sayfa===1}
                className="kasa-sayfa-btn">
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: toplamSayfa }, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => setSayfa(p)}
                  className="kasa-sayfa-btn" style={{ background: p===sayfa ? '#f59e0b' : 'transparent', color: p===sayfa ? '#0d1b2e' : 'rgba(255,255,255,0.5)', borderColor: p===sayfa ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setSayfa(p => Math.min(toplamSayfa,p+1))} disabled={sayfa===toplamSayfa}
                className="kasa-sayfa-btn">
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <KategoriDetayModal
        show={detayKategori !== null}
        onClose={() => setDetayKategori(null)}
        kategori={detayKategori}
        tip={detayTip}
        hareketler={hareketler}
      />
    </div>
  )
}

// ─── Yatırım Kalesi — Sabitler ────────────────────────────────────────────────
const VARLIK_TIPI_CFG = {
  Altin: { icon:'bi-circle-fill',       color:'#d97706', label:'Altın' },
  Doviz: { icon:'bi-currency-exchange', color:'#0891b2', label:'Döviz' },
  Diger: { icon:'bi-box-seam',          color:'rgba(255,255,255,0.5)', label:'Diğer' },
}
const ALTIN_TURLERI = ['Çeyrek Altın', 'Yarım Altın', 'Gram Altın', 'Ata Altın', 'Külçe Altın']
const DOVIZ_TURLERI = ['Dolar ($)', 'Euro (€)', 'Sterlin (£)', 'İsviçre Frangı (CHF)']
const GRUP_SIRASI   = ['Altin', 'Doviz', 'Diger']
const BOSH_VARLIK_FORM = { varlık_tipi:'Altin', tur:'', miktar:'', alis_tarihi:'', birim_fiyat:'' }

// ─── Varlık Ekleme / Düzenleme Modalı ────────────────────────────────────────
function YatirimModal({ open, onClose, onKaydet, duzenlenen }) {
  const [form, setForm] = useState(BOSH_VARLIK_FORM)

  useEffect(() => {
    if (!open) return
    if (duzenlenen) {
      setForm({
        varlık_tipi: duzenlenen.varlık_tipi,
        tur:         duzenlenen.tur,
        miktar:      String(duzenlenen.miktar),
        alis_tarihi: duzenlenen.alis_tarihi,
        birim_fiyat: formatParaInput(String(duzenlenen.birim_fiyat).replace('.', ',')),
      })
    } else {
      setForm({ ...BOSH_VARLIK_FORM, alis_tarihi: bugunTarih() })
    }
  }, [open, duzenlenen])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const miktar      = parseFloat(String(form.miktar).replace(',', '.')) || 0
  const birimFiyat  = parseParaInput(form.birim_fiyat)
  const toplamDeger = miktar * birimFiyat
  const turSecenekleri = form.varlık_tipi === 'Altin' ? ALTIN_TURLERI
                       : form.varlık_tipi === 'Doviz' ? DOVIZ_TURLERI
                       : null

  const kaydet = () => {
    if (!form.tur.trim())            { toast.error('Tür zorunludur.'); return }
    if (!form.miktar || miktar <= 0) { toast.error("Miktar 0'dan büyük olmalı."); return }
    if (!form.alis_tarihi)           { toast.error('Alış tarihi zorunludur.'); return }
    if (birimFiyat <= 0)             { toast.error('Birim fiyat zorunludur.'); return }
    onKaydet({
      varlık_tipi:  form.varlık_tipi,
      tur:          form.tur.trim(),
      miktar,
      alis_tarihi:  form.alis_tarihi,
      birim_fiyat:  birimFiyat,
      guncel_fiyat: duzenlenen?.guncel_fiyat ?? null,
    })
    onClose()
  }

  const tipCfg = VARLIK_TIPI_CFG[form.varlık_tipi] || VARLIK_TIPI_CFG['Diger']

  return createPortal(
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', zIndex:1040, animation:'kasaFadeIn 0.15s ease' }} />
      <div style={{ position:'fixed', inset:0, zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div style={{ width:'100%', maxWidth:540, maxHeight:'90vh', display:'flex', flexDirection:'column', borderRadius:20, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', background:'rgba(13,27,46,0.97)', backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)', border:'1px solid rgba(255,255,255,0.1)', animation:'kasaSlideUp 0.25s ease' }}>

          {/* ── Başlık — Gradient Header ── */}
          <div style={{ padding:'20px 24px', background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08))', borderBottom:'2px solid rgba(245,158,11,0.4)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div className="d-flex align-items-center gap-3">
              <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(245,158,11,0.35)' }}>
                <i className={`bi ${duzenlenen ? 'bi-pencil-square' : 'bi-safe2'}`} style={{ color:'#fff', fontSize:18 }} />
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'#ffffff', lineHeight:1.2 }}>
                  {duzenlenen ? 'Varlık Düzenle' : 'Yeni Varlık Ekle'}
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', letterSpacing:'0.03em' }}>Döviz, altın ve diğer birikimler</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', color:'rgba(255,255,255,0.6)', fontSize:16, width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.15)'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.6)' }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* ── Gövde ── */}
          <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>

            {/* ─ Bölüm 1: Varlık Bilgisi ─ */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:4, height:18, borderRadius:2, background:tipCfg.color }} />
              <span style={{ fontSize:12, fontWeight:700, color:tipCfg.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>Varlık Bilgisi</span>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6">
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Varlık Tipi</label>
                <select className="kasa-select" value={form.varlık_tipi}
                  onChange={e => setForm(p => ({ ...p, varlık_tipi: e.target.value, tur: '' }))}>
                  <option value="Altin">Altın</option>
                  <option value="Doviz">Döviz</option>
                  <option value="Diger">Diğer</option>
                </select>
              </div>
              <div className="col-12 col-sm-6">
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Tür</label>
                {turSecenekleri ? (
                  <select className="kasa-select" value={form.tur}
                    onChange={e => set('tur', e.target.value)}>
                    <option value="">— Seçiniz —</option>
                    {turSecenekleri.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <input type="text" className="kasa-input" placeholder="Tür adı girin..."
                    value={form.tur} onChange={e => set('tur', e.target.value)} />
                )}
              </div>
            </div>

            {/* ─ Bölüm 2: Alış Detayları ─ */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:4, height:18, borderRadius:2, background:'#3b82f6' }} />
              <span style={{ fontSize:12, fontWeight:700, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.06em' }}>Alış Detayları</span>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-4">
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Miktar</label>
                <input type="number" className="kasa-input" placeholder="0" min="0"
                  value={form.miktar} onChange={e => set('miktar', e.target.value)} />
              </div>
              <div className="col-12 col-sm-4">
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Alış Tarihi</label>
                <input type="date" className="kasa-input"
                  value={form.alis_tarihi} onChange={e => set('alis_tarihi', e.target.value)} />
              </div>
              <div className="col-12 col-sm-4">
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, display:'block' }}>Birim Fiyat (₺)</label>
                <input type="text" className="kasa-input" placeholder="0,00" inputMode="decimal"
                  value={form.birim_fiyat} onChange={e => set('birim_fiyat', formatParaInput(e.target.value))}
                  style={{ fontFamily:'Inter, sans-serif', fontWeight:700 }} />
              </div>
            </div>

            {/* ─ Canlı Önizleme ─ */}
            {(form.tur.trim() || toplamDeger > 0) && (
              <div style={{ background:'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(217,119,6,0.03))', border:'1px solid rgba(245,158,11,0.15)', borderRadius:14, padding:'14px 18px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(245,158,11,0.7)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Kayıt Önizleme</div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ width:38, height:38, borderRadius:10, background:`${tipCfg.color}18`, border:`1px solid ${tipCfg.color}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <i className={`bi ${tipCfg.icon}`} style={{ fontSize:16, color:tipCfg.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:'#fff', lineHeight:1.2 }}>{form.tur.trim() || tipCfg.label}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{miktar > 0 ? `${miktar} adet` : '—'} · {tarihFmt(form.alis_tarihi)}</div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="financial-num" style={{ fontSize:18, fontWeight:800, color:'#059669' }}>
                      {toplamDeger > 0 ? TL(toplamDeger) : '₺0,00'}
                    </div>
                    {birimFiyat > 0 && <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>birim: {TL(birimFiyat)}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer — Yapışkan ── */}
          <div style={{ padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.08)', background:'rgba(13,27,46,0.98)', flexShrink:0 }}>
            <button onClick={kaydet} className="btn w-100"
              style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontWeight:700, fontSize:15, borderRadius:12, padding:'13px', border:'none', boxShadow:'0 4px 16px rgba(245,158,11,0.3)', transition:'all 0.2s' }}>
              <i className="bi bi-floppy me-2" />{duzenlenen ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Fiyatları Güncelle Modalı ────────────────────────────────────────────────
function FiyatGuncelleModal({ open, onClose, yatirimlar, onGuncelle }) {
  const [fiyatlar, setFiyatlar] = useState({})

  const benzersizTurler = useMemo(() => {
    const seen = new Set()
    return GRUP_SIRASI.flatMap(tip =>
      yatirimlar.filter(y => y.varlık_tipi === tip && !seen.has(y.tur) && (seen.add(y.tur) || true))
    )
  }, [yatirimlar])

  useEffect(() => {
    if (!open) return
    const init = {}
    benzersizTurler.forEach(y => {
      init[y.tur] = y.guncel_fiyat != null
        ? formatParaInput(String(y.guncel_fiyat).replace('.', ','))
        : ''
    })
    setFiyatlar(init)
  }, [open, benzersizTurler])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  const kaydet = () => { onGuncelle(fiyatlar); onClose() }

  return createPortal(
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', zIndex:1040, animation:'kasaFadeIn 0.15s ease' }} />
      <div style={{ position:'fixed', inset:0, zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div style={{ width:'100%', maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column', borderRadius:20, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', background:'rgba(13,27,46,0.97)', backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)', border:'1px solid rgba(255,255,255,0.1)', animation:'kasaSlideUp 0.25s ease' }}>

          {/* ── Başlık — Gradient Header ── */}
          <div style={{ padding:'20px 24px', background:'linear-gradient(135deg, rgba(8,145,178,0.12), rgba(6,182,212,0.05))', borderBottom:'2px solid rgba(8,145,178,0.4)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div className="d-flex align-items-center gap-3">
              <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#0891b2,#0e7490)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(8,145,178,0.35)' }}>
                <i className="bi bi-graph-up-arrow" style={{ color:'#fff', fontSize:18 }} />
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'#ffffff', lineHeight:1.2 }}>Güncel Piyasa Fiyatları</div>
                <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', letterSpacing:'0.03em' }}>Kâr/zarar hesabı için güncel fiyatları girin</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', color:'rgba(255,255,255,0.6)', fontSize:16, width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.15)'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.6)' }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* ── Gövde ── */}
          <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:16, fontWeight:500 }}>
              <i className="bi bi-info-circle me-1" />Boş bırakılan alanlar hesaba katılmaz.
            </div>
            {benzersizTurler.map(y => {
              const cfg = VARLIK_TIPI_CFG[y.varlık_tipi] || VARLIK_TIPI_CFG['Diger']
              const deger = fiyatlar[y.tur] ? parseParaInput(fiyatlar[y.tur]) : null
              const fark = (deger !== null && y.birim_fiyat > 0) ? ((deger - y.birim_fiyat) / y.birim_fiyat) * 100 : null
              return (
                <div key={y.tur} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 16px', marginBottom:10 }}>
                  <div className="d-flex align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-2" style={{ flex:1 }}>
                      <div style={{ width:30, height:30, borderRadius:8, background:`${cfg.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <i className={`bi ${cfg.icon}`} style={{ fontSize:13, color:cfg.color }} />
                      </div>
                      <div>
                        <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{y.tur}</span>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>Alış: {TL(y.birim_fiyat)}</div>
                      </div>
                    </div>
                    <div style={{ width:160 }}>
                      <input type="text" className="kasa-input" placeholder="Güncel fiyat (₺)"
                        value={fiyatlar[y.tur] || ''}
                        onChange={e => setFiyatlar(prev => ({ ...prev, [y.tur]: formatParaInput(e.target.value) }))}
                        style={{ fontSize:14, fontWeight:700, borderRadius:10, textAlign:'right', fontFamily:'Inter, sans-serif' }} />
                    </div>
                  </div>
                  {fark !== null && (
                    <div className="text-end" style={{ marginTop:4 }}>
                      <span style={{ fontSize:10, fontWeight:700, color: fark >= 0 ? '#059669' : '#dc2626' }}>
                        {fark >= 0 ? '+' : ''}{fark.toFixed(1)}% {fark >= 0 ? 'kâr' : 'zarar'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Footer — Yapışkan ── */}
          <div style={{ padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.08)', background:'rgba(13,27,46,0.98)', flexShrink:0 }}>
            <button onClick={kaydet} className="btn w-100"
              style={{ background:'linear-gradient(135deg,#0891b2,#0e7490)', color:'#fff', fontWeight:700, fontSize:15, borderRadius:12, padding:'13px', border:'none', boxShadow:'0 4px 16px rgba(8,145,178,0.3)', transition:'all 0.2s' }}>
              <i className="bi bi-floppy me-2" />Fiyatları Kaydet
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Yatırım Kalesi ───────────────────────────────────────────────────────────
function YatirimKalesi({ yatirimlar, setYatirimlar }) {
  const [modalAcik,      setModalAcik]      = useState(false)
  const [duzenlenen,     setDuzenlenen]     = useState(null)
  const [silOnayId,      setSilOnayId]      = useState(null)
  const [showFiyatModal, setShowFiyatModal] = useState(false)

  const ozet = useMemo(() => {
    const bilancoMaliyet = yatirimlar.reduce((s, y) => s + y.miktar * y.birim_fiyat, 0)
    const guncelKayitlar = yatirimlar.filter(y => y.guncel_fiyat !== null)
    const guncelDeger    = guncelKayitlar.reduce((s, y) => s + y.miktar * y.guncel_fiyat, 0)
    const alisMaliyeti   = guncelKayitlar.reduce((s, y) => s + y.miktar * y.birim_fiyat, 0)
    const kz             = guncelKayitlar.length > 0 ? guncelDeger - alisMaliyeti : null
    const kzYuzde        = (kz !== null && alisMaliyeti > 0) ? (kz / alisMaliyeti) * 100 : null
    return { bilancoMaliyet, guncelDeger, kz, kzYuzde, hicGuncel: guncelKayitlar.length === 0 }
  }, [yatirimlar])

  const grupluVeri = useMemo(() =>
    GRUP_SIRASI
      .map(tip => ({ tip, kayitlar: yatirimlar.filter(y => y.varlık_tipi === tip) }))
      .filter(g => g.kayitlar.length > 0),
    [yatirimlar]
  )

  const acEkle    = () => { setDuzenlenen(null); setModalAcik(true) }
  const acDuzenle = (y) => { setDuzenlenen(y);   setModalAcik(true) }

  const kaydet = async (form) => {
    if (duzenlenen) {
      try {
        const res = await yatirimGuncelleApi(duzenlenen.id, form)
        if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt güncellenemedi.'); return }
        setYatirimlar(p => p.map(y => y.id === duzenlenen.id ? { ...y, ...form } : y))
      } catch {
        toast.error('Kayıt güncellenemedi.')
      }
    } else {
      try {
        const mevcutFiyat = yatirimlar.find(y => y.tur === form.tur && y.guncel_fiyat !== null)?.guncel_fiyat ?? null
        const gonderilen = { ...form, guncel_fiyat: mevcutFiyat }
        const res = await yatirimEkle(gonderilen)
        if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt eklenemedi.'); return }
        setYatirimlar(p => [...p, { ...gonderilen, id: res.data.veri.id }])
      } catch {
        toast.error('Kayıt eklenemedi.')
      }
    }
  }

  const sil = async (id) => {
    try {
      const res = await yatirimSil(id)
      if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt silinemedi.'); return }
      setYatirimlar(p => p.filter(y => y.id !== id))
      setSilOnayId(null)
    } catch {
      toast.error('Kayıt silinemedi.')
    }
  }

  const fiyatGuncelle = (fiyatlar) => {
    setYatirimlar(prev => prev.map(y => {
      const deger = fiyatlar[y.tur]
      if (deger === undefined || deger === '') return { ...y, guncel_fiyat: null }
      return { ...y, guncel_fiyat: parseParaInput(deger) }
    }))
  }

  const kzRenk = ozet.kz === null ? 'rgba(255,255,255,0.4)' : ozet.kz >= 0 ? '#10b981' : '#ef4444'
  const kzBg   = ozet.kz === null ? 'rgba(255,255,255,0.06)' : ozet.kz >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(220,38,38,0.1)'
  const kzIkon = ozet.kz === null ? 'bi-dash-circle' : ozet.kz >= 0 ? 'bi-arrow-up-circle-fill' : 'bi-arrow-down-circle-fill'

  // Portföy dağılımı (donut için)
  const dagılım = useMemo(() => {
    return GRUP_SIRASI.map(tip => {
      const topTutar = yatirimlar.filter(y => y.varlık_tipi === tip).reduce((s,y) => s + y.miktar * y.birim_fiyat, 0)
      return { tip, tutar: topTutar }
    }).filter(d => d.tutar > 0)
  }, [yatirimlar])
  const dagılımToplam = dagılım.reduce((s,d) => s + d.tutar, 0)

  return (
    <div>
      {/* ── Başlık + Butonlar ── */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h2 style={{ fontSize:'1.1rem', fontWeight:800, color:'rgba(255,255,255,0.9)', margin:0 }}>
            <i className="bi bi-safe2 me-2" style={{ color:'#f59e0b' }} />Yatırım Kalesi
          </h2>
          <p className="mb-0" style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Döviz, altın ve birikimleriniz · {yatirimlar.length} varlık</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {yatirimlar.length > 0 && (
            <button onClick={() => setShowFiyatModal(true)}
              className="kasa-btn-outline-amber">
              <i className="bi bi-graph-up-arrow me-1" style={{ fontSize:13 }} />Fiyatları Güncelle
            </button>
          )}
          <button onClick={acEkle}
            className="btn d-flex align-items-center gap-2"
            style={{ borderRadius:50, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', border:'none', padding:'10px 22px', fontSize:14, fontWeight:700, boxShadow:'0 3px 10px rgba(245,158,11,0.3)' }}>
            <i className="bi bi-plus-lg" />Varlık Ekle
          </button>
        </div>
      </div>

      {/* ── 3 Hero KPI Kartı ── */}
      <div className="row g-3 mb-4">
        {/* Kart 1 — Bilanço Değeri */}
        <div className="col-12 col-lg-4">
          <div className="kasa-kpi-card" style={{ position:'relative', overflow:'hidden', minHeight:130 }}>
            <i className="bi bi-wallet2" style={{ position:'absolute', right:16, top:16, fontSize:40, opacity:0.06, color:'#fff' }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu('rgba(255,255,255,0.5)', 'rgba(255,255,255,0.06)')}><i className="bi bi-wallet2" style={{ fontSize:18, color:'rgba(255,255,255,0.6)' }} /></div>
              <span style={kartEtiket('rgba(255,255,255,0.5)')}>Bilanço (Sabit) Değeri</span>
            </div>
            <div className="financial-num" style={{ fontSize:'1.6rem', fontWeight:800, color:'#ffffff', lineHeight:1.1 }}>{TL(ozet.bilancoMaliyet)}</div>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:'8px 0 0', fontWeight:500 }}>Kayıtlı alış maliyetlerinizin toplamı</p>
          </div>
        </div>

        {/* Kart 2 — Güncel Piyasa Karşılığı */}
        <div className="col-12 col-lg-4">
          <div className="kasa-kpi-card" style={{ position:'relative', overflow:'hidden', minHeight:130 }}>
            <i className="bi bi-graph-up" style={{ position:'absolute', right:16, top:16, fontSize:40, opacity:0.06, color:'#0891b2' }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu('#0891b2', 'rgba(8,145,178,0.1)')}><i className="bi bi-graph-up" style={{ fontSize:18, color:'#0891b2' }} /></div>
              <span style={kartEtiket('#0891b2')}>Güncel Piyasa Karşılığı</span>
            </div>
            {ozet.hicGuncel ? (
              <div className="d-flex align-items-center gap-2 mt-1" style={{ color:'rgba(255,255,255,0.35)' }}>
                <i className="bi bi-info-circle" style={{ fontSize:14 }} />
                <span style={{ fontSize:13, fontWeight:600 }}>Henüz fiyat girilmedi</span>
              </div>
            ) : (
              <div className="financial-num" style={{ fontSize:'1.6rem', fontWeight:800, color:'#ffffff', lineHeight:1.1 }}>{TL(ozet.guncelDeger)}</div>
            )}
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:'8px 0 0', fontWeight:500 }}>Şu an bozarsanız elde edeceğiniz nakit</p>
          </div>
        </div>

        {/* Kart 3 — Potansiyel K/Z */}
        <div className="col-12 col-lg-4">
          <div className="kasa-kpi-card" style={{ position:'relative', overflow:'hidden', minHeight:130 }}>
            <i className={`bi ${kzIkon}`} style={{ position:'absolute', right:16, top:16, fontSize:40, opacity:0.06, color: kzRenk }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu(kzRenk, kzBg)}><i className={`bi ${kzIkon}`} style={{ fontSize:18, color:kzRenk }} /></div>
              <span style={kartEtiket(kzRenk)}>Potansiyel Kâr / Zarar</span>
            </div>
            {ozet.kz === null ? (
              <div className="financial-num" style={{ fontSize:'1.6rem', fontWeight:800, color:'rgba(255,255,255,0.35)', lineHeight:1.1 }}>—</div>
            ) : (
              <div className="d-flex align-items-baseline gap-3">
                <div className="financial-num" style={{ fontSize:'1.6rem', fontWeight:800, lineHeight:1.1, color:kzRenk }}>
                  {ozet.kz >= 0 ? '+' : ''}{TL(ozet.kz)}
                </div>
                {ozet.kzYuzde !== null && (
                  <span className="badge" style={{ background: kzBg, color:kzRenk, fontWeight:700, fontSize:12, padding:'4px 10px', borderRadius:8 }}>
                    {ozet.kz >= 0 ? '+' : ''}{ozet.kzYuzde.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:'8px 0 0', fontWeight:500 }}>Reel piyasaya göre net fark</p>
          </div>
        </div>
      </div>

      {/* ── Portföy Dağılımı + Envanter ── */}
      {yatirimlar.length === 0 ? (
        <div className="kasa-glass-card text-center py-5">
          <i className="bi bi-safe2" style={{ fontSize:52, opacity:0.15, color:'#f59e0b' }} />
          <p className="mt-3 mb-1" style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>Henüz varlık eklenmedi</p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.3)', margin:0 }}>Altın, döviz veya diğer birikimlerinizi buradan takip edin.</p>
        </div>
      ) : (
        <div className="row g-3">
          {/* Portföy Dağılımı — Mini Panel */}
          {dagılım.length > 1 && (
            <div className="col-12 col-md-4 col-lg-3">
              <div className="kasa-glass-card" style={{ padding:'20px', height:'100%' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#ffffff', marginBottom:16 }}>Portföy Dağılımı</div>
                {dagılım.map(d => {
                  const cfg = VARLIK_TIPI_CFG[d.tip] || VARLIK_TIPI_CFG['Diger']
                  const yuzde = dagılımToplam > 0 ? (d.tutar / dagılımToplam) * 100 : 0
                  return (
                    <div key={d.tip} className="mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width:8, height:8, borderRadius:'50%', background:cfg.color, flexShrink:0 }} />
                          <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)' }}>{cfg.label}</span>
                        </div>
                        <span className="financial-num" style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>{yuzde.toFixed(0)}%</span>
                      </div>
                      <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                        <div style={{ width:`${yuzde}%`, height:'100%', borderRadius:3, background:cfg.color, transition:'width 0.4s ease' }} />
                      </div>
                      <div className="financial-num" style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{TL(d.tutar)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Envanter Kartları (tablo yerine kart görünümü) */}
          <div className={dagılım.length > 1 ? 'col-12 col-md-8 col-lg-9' : 'col-12'}>
            {grupluVeri.map(({ tip, kayitlar }) => {
              const cfg = VARLIK_TIPI_CFG[tip] || VARLIK_TIPI_CFG['Diger']
              return (
                <div key={tip} className="mb-4">
                  {/* Grup Başlığı */}
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div style={{ width:28, height:28, borderRadius:8, background:`${cfg.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <i className={`bi ${cfg.icon}`} style={{ fontSize:14, color:cfg.color }} />
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color:cfg.color, letterSpacing:'0.02em' }}>{cfg.label}</span>
                    <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.3)' }}>· {kayitlar.length} varlık</span>
                  </div>

                  {/* Varlık Kartları */}
                  <div className="row g-3">
                    {kayitlar.map(y => {
                      const alisMaliyet = y.miktar * y.birim_fiyat
                      const guncelDeger = y.guncel_fiyat !== null ? y.miktar * y.guncel_fiyat : null
                      const kz          = guncelDeger !== null ? guncelDeger - alisMaliyet : null
                      const kzYuzde     = (kz !== null && alisMaliyet > 0) ? (kz / alisMaliyet) * 100 : null
                      return (
                        <div key={y.id} className="col-12 col-sm-6 col-xl-4">
                          <div className="kasa-glass-card" style={{ padding:'16px 18px', position:'relative', overflow:'hidden' }}>
                            {/* Dekoratif ikon */}
                            <i className={`bi ${cfg.icon}`} style={{ position:'absolute', right:12, bottom:10, fontSize:44, opacity:0.04, color:cfg.color }} />

                            {/* Üst: Tür + Aksiyon */}
                            <div className="d-flex align-items-start justify-content-between mb-3">
                              <div>
                                <div style={{ fontWeight:800, fontSize:15, color:'#ffffff', lineHeight:1.2 }}>{y.tur}</div>
                                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{y.miktar} Adet · {tarihFmt(y.alis_tarihi)}</div>
                              </div>
                              {silOnayId === y.id ? (
                                <div className="d-flex align-items-center gap-1">
                                  <button onClick={() => sil(y.id)} className="kasa-sil-btn" style={{ fontSize:11, padding:'3px 8px' }}>Sil</button>
                                  <button onClick={() => setSilOnayId(null)} className="kasa-vazgec-btn" style={{ fontSize:11, padding:'3px 8px' }}>Vazgeç</button>
                                </div>
                              ) : (
                                <div className="d-flex gap-1">
                                  <button onClick={() => acDuzenle(y)}
                                    style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, width:44, height:44, padding:0, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor='#f59e0b' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)' }}>
                                    <i className="bi bi-pencil" style={{ fontSize:12, color:'#f59e0b' }} />
                                  </button>
                                  <button onClick={() => setSilOnayId(y.id)}
                                    style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, width:44, height:44, padding:0, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.color='#dc2626' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.35)' }}>
                                    <i className="bi bi-trash3" style={{ fontSize:12, color:'#dc2626' }} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Orta: Alış + Güncel yan yana */}
                            <div className="row g-2 mb-2">
                              <div className="col-6">
                                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>Alış Maliyeti</div>
                                <div className="financial-num" style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{TL(alisMaliyet)}</div>
                              </div>
                              <div className="col-6 text-end">
                                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>Güncel Değer</div>
                                <div className="financial-num" style={{ fontSize:14, fontWeight:700, color: guncelDeger !== null ? '#ffffff' : 'rgba(255,255,255,0.3)' }}>
                                  {guncelDeger !== null ? TL(guncelDeger) : '—'}
                                </div>
                              </div>
                            </div>

                            {/* Alt: K/Z barı */}
                            {kz !== null ? (
                              <div style={{ background: kz >= 0 ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.06)', borderRadius:8, padding:'6px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                <span style={{ fontSize:11, fontWeight:700, color: kz >= 0 ? '#059669' : '#dc2626' }}>
                                  {kz >= 0 ? 'Kâr' : 'Zarar'}
                                </span>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="financial-num" style={{ fontSize:13, fontWeight:800, color: kz >= 0 ? '#059669' : '#dc2626' }}>
                                    {kz >= 0 ? '+' : ''}{TL(kz)}
                                  </span>
                                  <span className="badge" style={{ background: kz >= 0 ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.12)', color: kz >= 0 ? '#059669' : '#dc2626', fontWeight:700, fontSize:10, padding:'2px 6px', borderRadius:4 }}>
                                    {kz >= 0 ? '+' : ''}{kzYuzde?.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'6px 10px', textAlign:'center' }}>
                                <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:600 }}>Güncel fiyat girilmedi</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <YatirimModal
        open={modalAcik}
        onClose={() => setModalAcik(false)}
        onKaydet={kaydet}
        duzenlenen={duzenlenen}
      />

      <FiyatGuncelleModal
        open={showFiyatModal}
        onClose={() => setShowFiyatModal(false)}
        yatirimlar={yatirimlar}
        onGuncelle={fiyatGuncelle}
      />
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function VarlikKasa() {
  const bugun = new Date()
  const [aktifSekme,  setAktifSekme]  = useState('gosterge')
  const [secilenAy,   setSecilenAy]   = useState(bugun.getMonth() + 1)
  const [secilenYil,  setSecilenYil]  = useState(bugun.getFullYear())
  const [hareketler,  setHareketler]  = useState([])
  const [kapanislar,      setKapanislar]      = useState([])
  const [ortakHareketler, setOrtakHareketler] = useState([])
  const [yatirimlar,      setYatirimlar]      = useState([])
  const [yukleniyor,      setYukleniyor]      = useState(true)

  // Yatırımlar, ortak hareketler ve bilanço: sadece bir kez yükle
  useEffect(() => {
    Promise.all([yatirimlariGetir(), ortaklariGetir(), bilancoListele()])
      .then(([yRes, oRes, bRes]) => {
        if (yRes.data.basarili) setYatirimlar(yRes.data.veri.yatirimlar ?? [])
        if (oRes.data.basarili) setOrtakHareketler(oRes.data.veri.ortaklar ?? [])
        if (bRes.data.basarili) setKapanislar(bRes.data.veri.kapanislar ?? [])
      })
      .catch(() => {})
  }, [])

  // Kasa hareketleri: seçili ay/yıl değiştiğinde yeniden çek
  useEffect(() => {
    const ay  = String(secilenAy).padStart(2, '0')
    const son = new Date(secilenYil, secilenAy, 0).getDate()
    const bas = `${secilenYil}-${ay}-01`
    const bit = `${secilenYil}-${ay}-${String(son).padStart(2, '0')}`
    setYukleniyor(true)
    hareketleriGetir({ baslangic_tarihi: bas, bitis_tarihi: bit, adet: 500 })
      .then(res => { if (res.data.basarili) setHareketler(res.data.veri.hareketler ?? []) })
      .catch(() => toast.error('Hareketler yüklenemedi.'))
      .finally(() => setYukleniyor(false))
  }, [secilenAy, secilenYil])

  const shared = { secilenAy, secilenYil, setSecilenAy, setSecilenYil, hareketler, setHareketler, kapanislar }

  const yatirimGuncelDeger = yatirimlar
    .filter(y => y.guncel_fiyat !== null)
    .reduce((s, y) => s + y.miktar * y.guncel_fiyat, 0)

  return (
    <div className="kasa-root">
      <style>{`
        /* ═══ Kasa & Varlık — Obsidian Vault ═══ */

        .kasa-root { position: relative; z-index: 1; }

        /* ─── KPI Kart (glassmorphism) ─── */
        .kasa-kpi-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 22px 24px;
          transition: all 0.2s ease;
          position: relative; overflow: hidden; height: 100%;
          container-type: inline-size; min-width: 0;
        }
        /* Yüksek rakamlarda taşma önleme — container genişliğine göre otomatik ölçekleme */
        .kasa-kpi-card .kasa-kpi-val,
        .kasa-kpi-card .financial-num {
          font-size: clamp(13px, 6.5cqw, 26px) !important;
          overflow-wrap: break-word;
          word-break: break-all;
          hyphens: none;
          max-width: 100%;
          display: block;
        }
        .kasa-kpi-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-2px);
        }

        /* ─── Glass Card (genel) ─── */
        .kasa-glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; overflow: hidden;
          transition: all 0.2s ease;
        }
        .kasa-glass-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
        }

        /* ─── Gösterge Paneli Özel Kartlar ─── */
        .kasa-gp-hero {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; overflow: hidden;
          transition: all 0.2s ease; height: 100%;
        }
        .kasa-gp-hero:hover { border-color: rgba(255,255,255,0.14); }
        .kasa-gp-hero-header {
          padding: 14px 22px;
          background: linear-gradient(90deg, rgba(8,145,178,0.13) 0%, rgba(8,145,178,0.02) 100%);
          border-bottom: 1px solid rgba(8,145,178,0.18);
          display: flex; align-items: center; gap: 10px;
        }
        .kasa-gp-hero-body { padding: 24px 22px; }
        .kasa-gp-tile {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 10px 14px;
        }
        .kasa-gp-health {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 22px;
          height: 100%; display: flex; flex-direction: column;
          transition: all 0.2s ease;
        }
        .kasa-gp-health:hover { border-color: rgba(255,255,255,0.14); }
        .kasa-gp-sm-kpi {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 18px 20px;
          height: 100%; position: relative; overflow: hidden;
          transition: all 0.2s ease;
          container-type: inline-size; min-width: 0;
        }
        .kasa-gp-sm-kpi:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-2px);
        }
        .kasa-gp-sm-kpi .financial-num {
          font-size: clamp(13px, 5cqw, 21px) !important;
          overflow-wrap: break-word; word-break: break-all;
          max-width: 100%; display: block;
        }
        .kasa-gp-balance {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 24px;
          transition: all 0.2s ease;
        }
        .kasa-gp-balance:hover { border-color: rgba(255,255,255,0.14); }
        .kasa-gp-bar-track {
          height: 8px; border-radius: 4px;
          background: rgba(255,255,255,0.06);
          overflow: hidden; position: relative;
        }
        .kasa-gp-asit-track {
          height: 6px; border-radius: 3px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
        }

        /* ─── Kart Header ─── */
        .kasa-card-header {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        /* ─── Liste Satırları ─── */
        .kasa-list-item {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 13px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .kasa-list-item:hover { background: rgba(255,255,255,0.03); }
        .kasa-list-item:last-child { border-bottom: none; }

        /* ─── Tab sistemi ─── */
        .kasa-tab-container {
          display: flex; gap: 4px; padding: 4px;
          background: rgba(255,255,255,0.04);
          border-radius: 12px; overflow-x: auto;
          border: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 24px;
        }
        .kasa-tab {
          padding: 10px 18px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          color: rgba(255,255,255,0.5); background: transparent;
          border: none; cursor: pointer; min-height: 44px;
          transition: all 0.2s ease; white-space: nowrap;
          display: flex; align-items: center; gap: 8px;
          font-family: 'Outfit', sans-serif;
        }
        .kasa-tab:hover { color: rgba(255,255,255,0.8); }
        .kasa-tab.active {
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.15);
          color: #f59e0b; font-weight: 600;
        }

        /* ─── Tablo ─── */
        .kasa-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .kasa-table thead th {
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.4); text-transform: uppercase;
          letter-spacing: 0.8px; padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          text-align: left;
        }
        .kasa-table tbody td {
          font-size: 13px; color: rgba(255,255,255,0.7);
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .kasa-table tbody tr { transition: background 0.15s; }
        .kasa-table tbody tr:hover { background: rgba(255,255,255,0.03); }
        .kasa-table tfoot td {
          padding: 12px 16px;
          border-top: 2px solid rgba(255,255,255,0.08);
        }

        /* ─── Butonlar ─── */
        .kasa-btn-amber {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #0d1b2e; border-radius: 10px;
          box-shadow: 0 4px 20px rgba(245,158,11,0.3);
          min-height: 44px; border: none;
          font-weight: 700; font-size: 14px;
          padding: 10px 22px; cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Outfit', sans-serif;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .kasa-btn-amber:hover {
          box-shadow: 0 6px 28px rgba(245,158,11,0.45);
          transform: translateY(-1px);
        }
        .kasa-btn-glass {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7);
          border-radius: 10px; min-height: 44px;
          font-weight: 600; font-size: 14px;
          padding: 10px 22px; cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Outfit', sans-serif;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .kasa-btn-glass:hover {
          background: rgba(255,255,255,0.1); color: #fff;
        }
        .kasa-btn-outline-amber {
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.3);
          color: #f59e0b; border-radius: 10px;
          min-height: 44px; font-weight: 700; font-size: 14px;
          padding: 10px 22px; cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Outfit', sans-serif;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .kasa-btn-outline-amber:hover {
          background: rgba(245,158,11,0.15);
          border-color: rgba(245,158,11,0.5);
        }

        /* ─── Input (koyu) ─── */
        .kasa-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #fff;
          min-height: 44px; padding: 10px 14px;
          font-size: 14px; font-weight: 600;
          width: 100%; outline: none;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s ease;
        }
        .kasa-input:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }
        .kasa-input::placeholder { color: rgba(255,255,255,0.25); }
        .kasa-input-label {
          font-size: 12px; font-weight: 600;
          color: rgba(255,255,255,0.7);
          margin-bottom: 6px; display: block;
        }
        .kasa-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #fff;
          min-height: 44px; padding: 10px 14px;
          font-size: 14px; font-weight: 600;
          width: 100%; outline: none;
          font-family: 'Outfit', sans-serif;
          appearance: auto;
        }
        .kasa-select option { background: #0d1b2e; color: #fff; }

        /* ─── Badge ─── */
        .kasa-badge {
          font-size: 12px; font-weight: 600;
          padding: 4px 12px; border-radius: 8px;
          display: inline-flex; align-items: center;
        }
        .kasa-badge-giris { background: rgba(16,185,129,0.15); color: #10b981; }
        .kasa-badge-cikis { background: rgba(239,68,68,0.15); color: #ef4444; }
        .kasa-badge-amber { background: rgba(245,158,11,0.15); color: #f59e0b; }

        /* ─── Modal (Obsidian Vault) ─── */
        .kasa-modal-backdrop {
          position: fixed; inset: 0; z-index: 1040;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          animation: kasaFadeIn 0.15s ease;
        }
        .kasa-modal-wrapper {
          position: fixed; inset: 0; z-index: 1050;
          display: flex; align-items: center; justify-content: center;
          padding: 16px; animation: kasaSlideUp 0.2s ease;
        }
        .kasa-modal {
          background: rgba(13,27,46,0.95);
          backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          display: flex; flex-direction: column;
          max-height: 90vh; overflow: hidden;
        }
        .kasa-modal-header {
          padding: 18px 24px;
          border-bottom: 2px solid #f59e0b;
          display: flex; align-items: center;
          justify-content: space-between; flex-shrink: 0;
        }
        .kasa-modal-body {
          overflow-y: auto; flex: 1; padding: 20px 24px;
        }
        .kasa-modal-close {
          background: rgba(255,255,255,0.1); border: none;
          color: rgba(255,255,255,0.7); width: 44px; height: 44px;
          border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .kasa-modal-close:hover {
          background: rgba(255,255,255,0.2); color: #fff;
        }

        /* ─── Silme onay ─── */
        .kasa-sil-btn {
          background: rgba(239,68,68,0.15); color: #ef4444;
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 6px; padding: 0 14px; min-height: 44px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          transition: all 0.15s;
        }
        .kasa-sil-btn:hover { background: #ef4444; color: #fff; }
        .kasa-vazgec-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          border-radius: 6px; padding: 0 14px; min-height: 44px;
          font-size: 12px; font-weight: 600; cursor: pointer;
        }

        /* ─── Sayfalama ─── */
        .kasa-sayfa-btn {
          border-radius: 8px; min-width: 44px; min-height: 44px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6);
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 13px;
        }
        .kasa-sayfa-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .kasa-sayfa-btn.active {
          background: rgba(245,158,11,0.15); color: #f59e0b;
          border-color: rgba(245,158,11,0.3);
        }
        .kasa-sayfa-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ─── İşlem butonları ─── */
        .kasa-islem-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; width: 44px; height: 44px;
          padding: 0; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .kasa-islem-btn:hover { border-color: rgba(255,255,255,0.25); }
        .kasa-islem-btn-sil {
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.15);
        }
        .kasa-islem-btn-sil:hover {
          border-color: #ef4444; background: rgba(239,68,68,0.15);
        }

        /* ─── Dönem filtresi ─── */
        .kasa-donem-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; color: #fff;
          padding: 6px 12px; font-size: 13px;
          font-weight: 600; outline: none;
          font-family: 'Outfit', sans-serif;
          min-height: 36px;
        }
        .kasa-donem-select option { background: #0d1b2e; color: #fff; }

        /* ─── Bilgi kutusu ─── */
        .kasa-info-box {
          background: rgba(245,158,11,0.06);
          border: 1px solid rgba(245,158,11,0.15);
          border-radius: 12px; padding: 12px 16px;
          display: flex; align-items: flex-start; gap: 10px;
        }

        /* ─── Canlı önizleme ─── */
        .kasa-preview-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 14px 18px;
        }

        /* ─── Toggle buton (giriş/çıkış) ─── */
        .kasa-toggle-btn {
          width: 100%; padding: 16px; border-radius: 14px;
          cursor: pointer; display: flex; flex-direction: column;
          align-items: center; gap: 6px; transition: all 0.2s ease;
          background: rgba(255,255,255,0.03);
          border: 2px solid rgba(255,255,255,0.08);
        }
        .kasa-toggle-btn.active-giris {
          border-color: #10b981; background: rgba(16,185,129,0.08);
        }
        .kasa-toggle-btn.active-cikis {
          border-color: #ef4444; background: rgba(239,68,68,0.08);
        }

        /* ─── Kategori seçim ─── */
        .kasa-kat-btn {
          width: 100%; min-height: 56px; padding: 10px 12px;
          text-align: left; border-radius: 10px;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: all 0.15s; font-family: 'Outfit', sans-serif;
          background: rgba(255,255,255,0.03);
          border: 2px solid rgba(255,255,255,0.08);
        }
        .kasa-kat-btn:hover { border-color: rgba(255,255,255,0.15); }
        .kasa-kat-btn.active {
          border-color: #f59e0b; background: rgba(245,158,11,0.08);
        }

        /* ─── Baş harf avatar ─── */
        .kasa-avatar {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* ─── Arama inputu ─── */
        .kasa-search {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #fff;
          padding: 8px 14px 8px 36px;
          font-size: 13px; font-weight: 600;
          outline: none; width: 220px;
          font-family: 'Outfit', sans-serif;
          transition: border-color 0.2s;
        }
        .kasa-search:focus { border-color: #f59e0b; }
        .kasa-search::placeholder { color: rgba(255,255,255,0.25); }
        .kasa-search-wrap {
          position: relative; display: inline-block;
        }
        .kasa-search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.3); font-size: 13px;
          pointer-events: none;
        }

        /* ─── Animasyonlar ─── */
        @keyframes kasaFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes kasaSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes kasaGlow {
          from { box-shadow: 0 0 8px rgba(245, 158, 11, 0.3); }
          to { box-shadow: 0 0 20px rgba(245, 158, 11, 0.6), 0 0 40px rgba(245, 158, 11, 0.2); }
        }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
          .kasa-kpi-card { padding: 16px !important; }
          .kasa-kpi-card .kasa-kpi-val, .kasa-kpi-card .financial-num { font-size: clamp(12px, 6.5cqw, 20px) !important; }
          .kasa-card-header { padding: 14px 16px; }
          .kasa-table thead th, .kasa-table tbody td { padding: 10px 12px; }
          .kasa-modal { border-radius: 16px 16px 0 0; max-height: 85vh; }
          .kasa-modal-wrapper { align-items: flex-end; }
          .kasa-search { width: 180px; }
        }
        @media (max-width: 480px) {
          .kasa-kpi-card .kasa-kpi-val, .kasa-kpi-card .financial-num { font-size: clamp(11px, 6cqw, 18px) !important; }
          .kasa-kpi-card { border-radius: 12px; }
          .kasa-glass-card { border-radius: 12px; }
        }
      `}</style>

      {/* ─── Sayfa Başlığı ─── */}
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#ffffff', margin:0, letterSpacing:'-0.3px' }}>
            Kasa & Varlık Yönetimi
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontWeight:400, textShadow:'0 0 12px rgba(255,255,255,0.05)' }}>
            Nakit akışı, bilanço ve yatırım takibi
          </p>
        </div>
      </div>

      {yukleniyor ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div style={{ width:36, height:36, border:'3px solid rgba(255,255,255,0.08)', borderTopColor:'#f59e0b', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : (
      <>
        {/* ─── Tab Navigasyonu ─── */}
        <div className="kasa-tab-container">
          {SEKMELER.map(s => (
            <button key={s.key} onClick={() => setAktifSekme(s.key)}
              className={`kasa-tab ${aktifSekme === s.key ? 'active' : ''}`}>
              <i className={`bi ${s.icon}`} style={{ fontSize:15 }} />
              {s.label}
            </button>
          ))}
        </div>

        {/* ─── Sekme İçerikleri ─── */}
        {aktifSekme === 'gosterge' && <GostergePaneli hareketler={hareketler} kapanislar={kapanislar} yatirimGuncelDeger={yatirimGuncelDeger} secilenAy={secilenAy} secilenYil={secilenYil} />}
        {aktifSekme === 'nakit'    && <NakitAkisi    {...shared} />}
        {aktifSekme === 'bilanco'  && <AylikBilanco kapanislar={kapanislar} setKapanislar={setKapanislar} yatirimGuncelDeger={yatirimGuncelDeger} />}
        {aktifSekme === 'ortak'    && <OrtakCarisi ortakHareketler={ortakHareketler} setOrtakHareketler={setOrtakHareketler} />}
        {aktifSekme === 'yatirim'  && <YatirimKalesi yatirimlar={yatirimlar} setYatirimlar={setYatirimlar} />}
      </>
      )}
    </div>
  )
}
