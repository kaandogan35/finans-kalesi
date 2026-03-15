/**
 * CekSenet.jsx — Çek & Senet Yönetimi
 * Obsidian Vault Koyu Premium Tema
 * 5 Tab: Dashboard | Portföydeki | Tahsildeki | Kendi Çekimiz | Cirolanan
 * Bootstrap 5 + Saf React | Finans Kalesi
 * cek- prefix ile self-contained stiller
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import cekSenetApi from '../../api/cekSenet'
import { carilerApi } from '../../api/cariler'

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const BANKALAR = [
  'Ziraat Bankası', 'Garanti BBVA', 'İş Bankası', 'Yapı Kredi',
  'Halkbank', 'Vakıfbank', 'TEB', 'QNB Finansbank', 'Akbank', 'DenizBank',
]

// ─── Tür Eşlemeleri ──────────────────────────────────────────────────────────
const TUR_LABEL = {
  alacak_ceki:   'Müşteri Çeki',
  alacak_senedi: 'Müşteri Senedi',
  borc_ceki:     'Kendi Çekimiz',
  borc_senedi:   'Kendi Senedimiz',
}
const TUR_API = {
  'Müşteri Çeki':    'alacak_ceki',
  'Müşteri Senedi':  'alacak_senedi',
  'Kendi Çekimiz':   'borc_ceki',
  'Kendi Senedimiz': 'borc_senedi',
}

// Tab renk → RGB dönüşümü (inline rgba() için)
const RENK_RGB = {
  '#f59e0b': '245,158,11',
  '#10b981': '16,185,129',
  '#ef4444': '239,68,68',
  '#d97706': '217,119,6',
}

// ─── Tür Badge Konfigürasyonu ─────────────────────────────────────────────────
const TUR_BADGE = {
  'Müşteri Çeki':    { renk: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: 'bi-file-earmark-check'  },
  'Müşteri Senedi':  { renk: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: 'bi-file-earmark-text'   },
  'Kendi Çekimiz':   { renk: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: 'bi-file-earmark-minus'  },
  'Kendi Senedimiz': { renk: '#d97706', bg: 'rgba(217,119,6,0.12)',  icon: 'bi-file-earmark-minus'  },
}

// ─── Arşiv Badge Konfigürasyonu ───────────────────────────────────────────────
const ARSIV_BADGE = {
  tahsil_edildi:   { renk: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Tahsil Edildi'   },
  kendi_odendi:    { renk: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Kendi Ödendi'    },
  ciro_tamamlandi: { renk: '#d97706', bg: 'rgba(217,119,6,0.12)',  label: 'Ciro Tamamlandı' },
  iade_edildi:     { renk: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'İade Edildi'     },
  karsiliksiz:     { renk: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Karşılıksız'    },
  protestolu:      { renk: '#dc2626', bg: 'rgba(220,38,38,0.12)',  label: 'Protestolu'     },
}

function normalize(item) {
  const durum = item.durum
  let tur_kategori = durum
  if (durum === 'odendi')      tur_kategori = 'kendi_odendi'
  if (durum === 'cirolandi')   tur_kategori = 'ciro_tamamlandi'
  return {
    id:                  item.id,
    tur:                 TUR_LABEL[item.tur] || item.tur,
    firma_adi:           item.cari_adi || '',
    cari_id:             item.cari_id  || null,
    asil_borclu:         item.aciklama || '',
    evrak_no:            item.seri_no  || '',
    banka:               item.banka_adi || '',
    vade_tarihi:         item.vade_tarihi      || '',
    islem_tarihi:        item.kesilme_tarihi   || '',
    tahsil_tarihi:       item.tahsil_tarihi    || '',
    ciro_tarihi:         item.ciro_tarihi      || '',
    asil_firma:          item.cari_adi         || '',
    teslim_yeri:         item.ciro_edilen_cari_adi || '',
    ciro_edilen_cari_id: item.ciro_edilen_cari_id  || null,
    tutar:               parseFloat(item.tutar_tl || item.tutar || 0),
    tur_kategori,
    kapanis_tarihi:      item.tahsil_tarihi || item.ciro_tarihi || '',
  }
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────
const TL  = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n ?? 0) + ' ₺'
const tarihFmt = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString('tr-TR') : '—'
const bugunStr = () => new Date().toISOString().split('T')[0]

const formatParaInput = (v) => {
  let s = (v || '').replace(/[^0-9,]/g, '')
  const parts = s.split(',')
  if (parts.length > 2) s = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = s.split(',')
  const fmt = (tam || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? fmt + ',' + kesir.slice(0, 2) : fmt
}
const parseParaInput = (f) => parseFloat((f || '').replace(/\./g, '').replace(',', '.')) || 0

function vadeStil(tarih) {
  if (!tarih) return {}
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const vd  = new Date(tarih + 'T00:00:00')
  const gun = Math.ceil((vd - now) / 86400000)
  if (gun < 0) return { color: '#ef4444', fontWeight: 700 }
  if (gun <= 3) return { color: '#d97706', fontWeight: 700 }
  return {}
}

function toplam(liste, alan = 'tutar') {
  return liste.reduce((s, i) => s + (i[alan] || 0), 0)
}

// ─── Form Başlangıç Durumları ─────────────────────────────────────────────────
const portfoyBosluk = () => ({
  tur: 'Müşteri Çeki', firma_adi: '', cari_id: null, asil_borclu: '',
  evrak_no: '', banka: '', vade_tarihi: '', islem_tarihi: bugunStr(), tutarStr: '',
})
const kendiBosluk = () => ({
  tur: 'Kendi Çekimiz', firma_adi: '', cari_id: null, asil_borclu: '',
  evrak_no: '', banka: '', vade_tarihi: '', islem_tarihi: bugunStr(), tutarStr: '',
})

// ─────────────────────────────────────────────────────────────────────────────
// Alt Bileşenler
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, children, size = '', scrollable = false }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, onClose])

  if (!open) return null

  const maxW = size === 'lg' ? 800 : size === 'sm' ? 420 : 560

  return createPortal(
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1040,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          animation: 'cekFadeIn 0.15s ease',
        }}
      />
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, animation: 'cekSlideUp 0.2s ease',
        }}
      >
        <div className="cek-modal" style={{
          width: '100%', maxWidth: maxW,
          maxHeight: scrollable ? '90vh' : 'auto',
          display: 'flex', flexDirection: 'column',
          borderRadius: 20, overflow: scrollable ? 'auto' : 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          background: 'rgba(13,27,46,0.95)',
          backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}

function OnayModal({ open, onClose, onOnayla, baslik, mesaj, ikon, btnRenk = '#ef4444', btnYazi = 'Evet, Devam Et' }) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div style={{ padding: '28px 28px 0', textAlign: 'center' }}>
        {ikon && <div style={{ fontSize: 36, marginBottom: 12 }}>{ikon}</div>}
        <h6 style={{ fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>{baslik}</h6>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 0 }}>{mesaj}</p>
      </div>
      <div style={{ padding: '20px 28px 28px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onClose} style={{ minHeight: 44, padding: '0 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>İptal</button>
        <button className="btn text-white" style={{ background: btnRenk, minHeight: 44, padding: '0 20px' }} onClick={onOnayla}>{btnYazi}</button>
      </div>
    </Modal>
  )
}

function AutoComplete({ value, onChange, options, placeholder, id, required }) {
  const [acik, setAcik] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setAcik(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filtered = (options || []).filter(o => o.toLowerCase().includes((value || '').toLowerCase()))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        id={id}
        className="form-control"
        value={value || ''}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        style={{ minHeight: 44 }}
        onChange={(e) => { onChange(e.target.value); setAcik(true) }}
        onFocus={() => setAcik(true)}
      />
      {acik && filtered.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000,
          background: 'rgba(13,27,46,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)', listStyle: 'none',
          padding: '4px 0', margin: 0, maxHeight: 200, overflowY: 'auto',
        }}>
          {filtered.map(o => (
            <li
              key={o}
              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13, color: '#ffffff' }}
              onMouseDown={() => { onChange(o); setAcik(false) }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{o}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FiltreSatiri({ filtre, setFiltre }) {
  const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  const YILLAR = [2024, 2025, 2026, 2027]
  return (
    <div className="d-flex gap-2 align-items-center flex-wrap">
      <select
        className="form-select form-select-sm cek-select"
        style={{ width: 140, minHeight: 38 }}
        value={filtre.tumZamanlar ? 0 : filtre.ay}
        onChange={(e) => {
          const v = +e.target.value
          if (v === 0) setFiltre({ ...filtre, tumZamanlar: true })
          else setFiltre({ ...filtre, ay: v, tumZamanlar: false })
        }}
      >
        <option value={0}>— Tüm Zamanlar —</option>
        {AYLAR.map((a, i) => <option key={i} value={i + 1}>{a}</option>)}
      </select>
      <select
        className="form-select form-select-sm cek-select"
        style={{ width: 90, minHeight: 38 }}
        value={filtre.yil}
        disabled={filtre.tumZamanlar}
        onChange={(e) => setFiltre({ ...filtre, yil: +e.target.value, tumZamanlar: false })}
      >
        {YILLAR.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}

function AylikTakvim({ ay, yil, tahsilEvents, odemeEvents }) {
  const [tooltip, setTooltip] = useState(null)
  const GUN = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

  const ilk   = new Date(yil, ay - 1, 1)
  const sonGun = new Date(yil, ay, 0).getDate()
  const bosluk = ilk.getDay() === 0 ? 6 : ilk.getDay() - 1
  const gunler = [...Array(bosluk).fill(null), ...Array.from({ length: sonGun }, (_, i) => i + 1)]

  const olaylar = (gun) => {
    if (!gun) return { t: [], o: [] }
    const d = `${yil}-${String(ay).padStart(2,'0')}-${String(gun).padStart(2,'0')}`
    return { t: tahsilEvents.filter(e => e.tarih === d), o: odemeEvents.filter(e => e.tarih === d) }
  }

  const now = new Date(); now.setHours(0, 0, 0, 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {GUN.map(g => (
          <div key={g} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', padding: '4px 0' }}>{g}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {gunler.map((gun, i) => {
          const evt    = olaylar(gun)
          const isBugun = gun && new Date(yil, ay - 1, gun).getTime() === now.getTime()
          const hasEvt  = evt.t.length > 0 || evt.o.length > 0
          return (
            <div
              key={i}
              style={{
                minHeight: 40, borderRadius: 8,
                background: isBugun ? 'rgba(245,158,11,0.1)' : gun ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: isBugun ? '1.5px solid #f59e0b' : gun ? '1px solid rgba(255,255,255,0.06)' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: hasEvt ? 'pointer' : 'default', padding: 2, position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!gun || !hasEvt) return
                const r = e.currentTarget.getBoundingClientRect()
                setTooltip({ x: Math.min(r.left, window.innerWidth - 230), y: r.bottom + 6, evt })
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {gun && (
                <span style={{ fontSize: 12, fontWeight: isBugun ? 700 : 400, color: isBugun ? '#f59e0b' : 'rgba(255,255,255,0.7)' }}>
                  {gun}
                </span>
              )}
              {gun && hasEvt && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {evt.t.length > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
                  {evt.o.length > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {tooltip && createPortal(
        <div style={{
          position: 'fixed', left: tooltip.x, top: tooltip.y,
          background: '#1e293b', color: '#fff', borderRadius: 10, padding: '10px 14px',
          fontSize: 12, zIndex: 9999, maxWidth: 230, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}>
          {tooltip.evt.t.map((e, idx) => (
            <div key={idx}><span style={{ color: '#4ade80' }}>↑</span> {e.firma} — {TL(e.tutar)}</div>
          ))}
          {tooltip.evt.o.map((e, idx) => (
            <div key={idx}><span style={{ color: '#f87171' }}>↓</span> {e.firma} — {TL(e.tutar)}</div>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Renkli Özet Banner ───────────────────────────────────────────────────────
function Banner({ gradient, children }) {
  return (
    <div style={{
      background: gradient, borderRadius: 16, padding: '22px 24px',
      color: '#fff', marginBottom: 20,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {children}
    </div>
  )
}

// ─── Tür Badge ────────────────────────────────────────────────────────────────
function TurBadge({ tur }) {
  const cfg = TUR_BADGE[tur] || { renk: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)', icon: 'bi-file-earmark' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.bg, color: cfg.renk,
      fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 8px',
      border: `1px solid ${cfg.renk}30`, whiteSpace: 'nowrap',
    }}>
      <i className={`bi ${cfg.icon}`} style={{ fontSize: 10 }} />
      {tur}
    </span>
  )
}

// ─── Vade Badge ───────────────────────────────────────────────────────────────
function VadeBadge({ tarih }) {
  if (!tarih) return <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>—</span>
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const vd  = new Date(tarih + 'T00:00:00')
  const gun = Math.ceil((vd - now) / 86400000)
  if (gun < 0) return (
    <span>
      <span className="cek-vade-late">{tarihFmt(tarih)}</span>
      <span style={{ display: 'block', fontSize: 10, color: '#ef4444', fontWeight: 600, marginTop: 2 }}>+{Math.abs(gun)} gün gecikti</span>
    </span>
  )
  if (gun <= 3) return (
    <span>
      <span className="cek-vade-warn">{tarihFmt(tarih)}</span>
      <span style={{ display: 'block', fontSize: 10, color: '#d97706', fontWeight: 600, marginTop: 2 }}>{gun === 0 ? 'Bugün!' : `${gun} gün kaldı`}</span>
    </span>
  )
  return <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{tarihFmt(tarih)}</span>
}

// ─── Form Grubu ───────────────────────────────────────────────────────────────
function FG({ label, zorunlu, kritik, children }) {
  return (
    <div className="mb-3">
      <label className="form-label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'rgba(255,255,255,0.7)' }}>
        {label}
        {zorunlu && <span style={{ color: '#ef4444' }} className="ms-1">*</span>}
        {kritik  && <span style={{ color: '#ef4444', fontSize: 11 }} className="ms-1">(Kritik Alan)</span>}
      </label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana Bileşen
// ─────────────────────────────────────────────────────────────────────────────
export default function CekSenet() {
  // ─ Tab & Filtre ─────────────────────────────────────────────────────────────
  const [aktifTab, setAktifTab] = useState(0)
  const [filtre, setFiltre] = useState({
    ay: new Date().getMonth() + 1,
    yil: new Date().getFullYear(),
    tumZamanlar: false,
  })

  // ─ Arama ────────────────────────────────────────────────────────────────────
  const [aramaMetni, setAramaMetni] = useState('')
  const [arsivKategori, setArsivKategori] = useState('tumu')

  const tabDegistir = (i) => { setAktifTab(i); setAramaMetni('') }

  const aramaFiltrele = (liste, alanlar) => {
    if (!aramaMetni.trim()) return liste
    const q = aramaMetni.toLowerCase()
    return liste.filter(item => alanlar.some(alan => (item[alan] || '').toLowerCase().includes(q)))
  }

  // ─ Veri ─────────────────────────────────────────────────────────────────────
  const [yuklenIyor, setYuklenIyor] = useState(true)
  const [portfoy, setPortfoy] = useState([])
  const [tahsil,  setTahsil]  = useState([])
  const [kendi,   setKendi]   = useState([])
  const [ciro,    setCiro]    = useState([])
  const [arsiv,   setArsiv]   = useState([])
  const [cariler, setCariler] = useState([])

  // ─ Generic Onay Modalı ───────────────────────────────────────────────────────
  const [onay, setOnay] = useState(null)

  // ─ Portföy Modalleri ─────────────────────────────────────────────────────────
  const [portfoyModal,    setPortfoyModal]    = useState(false)
  const [portfoyForm,     setPortfoyForm]     = useState(portfoyBosluk())
  const [portfoyDzlId,    setPortfoyDzlId]    = useState(null)

  const [tahsileModal,    setTahsileModal]    = useState(false)
  const [tahsileForm,     setTahsileForm]     = useState({ banka: '', tarih: bugunStr() })
  const [tahsileId,       setTahsileId]       = useState(null)

  const [cirolaModal,     setCirolaModal]     = useState(false)
  const [cirolaForm,      setCirolaForm]      = useState({ firma: '', cari_id: null, tarih: bugunStr() })
  const [cirolaId,        setCirolaId]        = useState(null)

  // ─ Kendi Modalleri ───────────────────────────────────────────────────────────
  const [kendiModal,      setKendiModal]      = useState(false)
  const [kendiForm,       setKendiForm]       = useState(kendiBosluk())
  const [kendiDzlId,      setKendiDzlId]      = useState(null)

  // ─ Tahsil Düzenle ────────────────────────────────────────────────────────────
  const [tahsilDzlModal,  setTahsilDzlModal]  = useState(false)
  const [tahsilDzlForm,   setTahsilDzlForm]   = useState({})
  const [tahsilDzlId,     setTahsilDzlId]     = useState(null)

  // ─ Ciro Düzenle ──────────────────────────────────────────────────────────────
  const [ciroDzlModal,    setCiroDzlModal]    = useState(false)
  const [ciroDzlForm,     setCiroDzlForm]     = useState({})
  const [ciroDzlId,       setCiroDzlId]       = useState(null)


  // ─ Veri Yükleme ─────────────────────────────────────────────────────────────
  const veriYukle = useCallback(async () => {
    try {
      setYuklenIyor(true)
      const [cekR, cariR] = await Promise.all([
        cekSenetApi.listele({ adet: 500 }),
        carilerApi.listele({ adet: 500 }),
      ])
      const liste     = cekR.data.veri?.cek_senetler || []
      const alacak    = ['alacak_ceki', 'alacak_senedi']
      const borc      = ['borc_ceki', 'borc_senedi']
      const arsivDur  = ['tahsil_edildi', 'odendi', 'iade_edildi', 'karsiliksiz', 'protestolu']
      setPortfoy(liste.filter(i => alacak.includes(i.tur) && i.durum === 'portfoyde').map(normalize))
      setTahsil(liste.filter(i => alacak.includes(i.tur) && i.durum === 'tahsile_verildi').map(normalize))
      setKendi(liste.filter(i => borc.includes(i.tur) && i.durum === 'portfoyde').map(normalize))
      setCiro(liste.filter(i => i.durum === 'cirolandi').map(normalize))
      setArsiv(liste.filter(i => arsivDur.includes(i.durum)).map(normalize))
      setCariler((cariR.data.veri?.cariler || []).map(c => ({ id: c.id, adi: c.cari_adi || '' })))
    } catch {
      toast.error('Veriler yüklenemedi.')
    } finally {
      setYuklenIyor(false)
    }
  }, [])

  useEffect(() => { veriYukle() }, [veriYukle])

  // ─ Cari Yardımcıları ─────────────────────────────────────────────────────────
  const cariSecenekleri = cariler.map(c => c.adi)
  const cariIdBul = (adi) => cariler.find(c => c.adi === adi)?.id || null

  // ─ Filtre Uygulama ───────────────────────────────────────────────────────────
  const filtrele = (liste, alan = 'vade_tarihi') => {
    if (filtre.tumZamanlar) return liste
    return liste.filter(r => {
      const d = new Date((r[alan] || '') + 'T00:00:00')
      return d.getMonth() + 1 === filtre.ay && d.getFullYear() === filtre.yil
    })
  }

  // ─ Dashboard Hesaplamaları ───────────────────────────────────────────────────
  const TODAY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d })()

  const gecmis = (tarih) => new Date(tarih + 'T00:00:00') < TODAY

  const fP = aramaFiltrele(filtrele(portfoy), ['firma_adi', 'asil_borclu', 'evrak_no', 'vade_tarihi'])
  const fT = aramaFiltrele(filtrele(tahsil), ['firma_adi', 'asil_borclu', 'evrak_no', 'vade_tarihi'])
  const fK = aramaFiltrele(filtrele(kendi),  ['firma_adi', 'evrak_no', 'vade_tarihi', 'banka'])
  const fC = aramaFiltrele(filtrele(ciro),   ['asil_firma', 'teslim_yeri', 'evrak_no', 'vade_tarihi'])
  const fA = aramaFiltrele(
    arsivKategori === 'tumu' ? arsiv : arsiv.filter(i => i.tur_kategori === arsivKategori),
    ['firma_adi', 'evrak_no', 'vade_tarihi', 'asil_borclu']
  )

  const tahsilToplam   = toplam(fT)
  const kendiToplam    = toplam(fK)
  const portfoyToplam  = toplam(fP)
  const ciroToplam     = toplam(fC)
  const netDurum       = tahsilToplam - kendiToplam

  const tahsilBekleyen = fT.filter(i => !gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const tahsilGecmis   = fT.filter(i =>  gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const kendiBekleyen  = fK.filter(i => !gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const kendiGecmis    = fK.filter(i =>  gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const ciroBekleyen   = fC.filter(i => !gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const ciroGecmis     = fC.filter(i =>  gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)

  const gecikenKendi  = kendi.filter(i => gecmis(i.vade_tarihi))
  const gecikenTahsil = tahsil.filter(i => gecmis(i.vade_tarihi))

  const gunFark = (tarih) => Math.ceil((TODAY - new Date(tarih + 'T00:00:00')) / 86400000)

  const takvimTahsil = tahsil.map(i => ({ tarih: i.vade_tarihi, firma: i.firma_adi,  tutar: i.tutar }))
  const takvimOdeme  = kendi.map(i  => ({ tarih: i.vade_tarihi, firma: i.firma_adi,  tutar: i.tutar }))

  // ─ Son 6 Ay Verisi (arşivden hesaplanır) ─────────────────────────────────────
  const son6AyVeri = (() => {
    const sonuc = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ay  = d.getMonth() + 1
      const yil = d.getFullYear()
      const ayStr = d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })
      const ayFiltre = (liste, alan) => liste.filter(r => {
        const rd = new Date((r[alan] || '') + 'T00:00:00')
        return rd.getMonth() + 1 === ay && rd.getFullYear() === yil
      })
      const tahsilAy = ayFiltre(arsiv.filter(r => r.tur_kategori === 'tahsil_edildi'), 'kapanis_tarihi').reduce((s, r) => s + r.tutar, 0)
      const odemeAy  = ayFiltre(arsiv.filter(r => r.tur_kategori === 'kendi_odendi'),  'kapanis_tarihi').reduce((s, r) => s + r.tutar, 0)
      sonuc.push({ ay: ayStr, tahsil: tahsilAy, odeme: odemeAy })
    }
    return sonuc
  })()

  // ─ Tab Sayıları ──────────────────────────────────────────────────────────────
  const TABS = [
    { label: 'Dashboard',     renk: '#f59e0b', count: null,           icon: 'bi-speedometer2'          },
    { label: 'Portföydeki',   renk: '#f59e0b', count: portfoy.length, icon: 'bi-collection-fill'       },
    { label: 'Tahsildeki',    renk: '#10b981', count: tahsil.length,  icon: 'bi-bank'                  },
    { label: 'Kendi Çekimiz', renk: '#ef4444', count: kendi.length,   icon: 'bi-arrow-up-circle-fill'  },
    { label: 'Cirolanan',     renk: '#d97706', count: ciro.length,    icon: 'bi-arrow-left-right'      },
    { label: 'Arşiv',         renk: 'rgba(255,255,255,0.5)', count: arsiv.length, icon: 'bi-archive-fill' },
  ]

  // ─ Portföy İşlem Fonksiyonları ───────────────────────────────────────────────
  const portfoyKaydet = async () => {
    if (!portfoyForm.cari_id) { toast.error('Lütfen listeden bir cari seçin.'); return }
    if (!portfoyForm.vade_tarihi) { toast.error('Vade tarihi zorunludur.'); return }
    const tutar = parseParaInput(portfoyForm.tutarStr)
    if (tutar <= 0) { toast.error('Geçerli bir tutar giriniz.'); return }
    const veri = {
      cari_id:        portfoyForm.cari_id,
      seri_no:        portfoyForm.evrak_no    || undefined,
      banka_adi:      portfoyForm.banka        || undefined,
      kesilme_tarihi: portfoyForm.islem_tarihi || undefined,
      vade_tarihi:    portfoyForm.vade_tarihi,
      tutar,
      aciklama:       portfoyForm.asil_borclu  || undefined,
    }
    try {
      if (portfoyDzlId) {
        const r = await cekSenetApi.guncelle(portfoyDzlId, veri)
        setPortfoy(p => p.map(i => i.id === portfoyDzlId ? normalize(r.data.veri) : i))
        toast.success('Evrak güncellendi.')
      } else {
        const r = await cekSenetApi.ekle({ ...veri, tur: TUR_API[portfoyForm.tur] })
        setPortfoy(p => [normalize(r.data.veri), ...p])
        toast.success('Evrak portföye eklendi.')
      }
      setPortfoyModal(false); setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null)
    } catch {
      toast.error('İşlem başarısız, lütfen tekrar deneyin.')
    }
  }

  const portfoyDzlAc = (item) => {
    setPortfoyForm({
      tur: item.tur, firma_adi: item.firma_adi, cari_id: item.cari_id,
      asil_borclu: item.asil_borclu, evrak_no: item.evrak_no, banka: item.banka || '',
      vade_tarihi: item.vade_tarihi, islem_tarihi: item.islem_tarihi,
      tutarStr: formatParaInput(String(item.tutar)),
    })
    setPortfoyDzlId(item.id); setPortfoyModal(true)
  }

  const portfoySil = (id) => setOnay({
    baslik: 'Evrak Silinsin mi?', mesaj: 'Bu evrak kalıcı olarak silinecektir.', ikon: '🗑️',
    btnRenk: '#ef4444', btnYazi: 'Evet, Sil',
    islem: async () => {
      try {
        await cekSenetApi.sil(id)
        setPortfoy(p => p.filter(i => i.id !== id))
        toast.success('Evrak silindi.')
      } catch { toast.error('Silme başarısız.') }
      setOnay(null)
    },
  })

  const tahsileVer = async () => {
    if (!tahsileForm.tarih) { toast.error('Tarih zorunludur.'); return }
    try {
      if (tahsileForm.banka) {
        await cekSenetApi.guncelle(tahsileId, { banka_adi: tahsileForm.banka })
      }
      const r = await cekSenetApi.durumGuncelle(tahsileId, { durum: 'tahsile_verildi' })
      const item = normalize(r.data.veri)
      setPortfoy(p => p.filter(i => i.id !== tahsileId))
      setTahsil(p => [{ ...item, tahsil_tarihi: tahsileForm.tarih }, ...p])
      setTahsileModal(false); setTahsileForm({ banka: '', tarih: bugunStr() })
      toast.success('Evrak tahsile verildi.')
    } catch { toast.error('İşlem başarısız.') }
  }

  const cirolaKaydet = async () => {
    if (!cirolaForm.cari_id) { toast.error('Lütfen listeden teslim edilecek cariyi seçin.'); return }
    if (!cirolaForm.tarih) { toast.error('Ciro tarihi zorunludur.'); return }
    try {
      const r = await cekSenetApi.durumGuncelle(cirolaId, {
        durum: 'cirolandi',
        ciro_edilen_cari_id: cirolaForm.cari_id,
        ciro_tarihi: cirolaForm.tarih,
      })
      setPortfoy(p => p.filter(i => i.id !== cirolaId))
      setCiro(p => [normalize(r.data.veri), ...p])
      setCirolaModal(false); setCirolaForm({ firma: '', cari_id: null, tarih: bugunStr() })
      toast.success('Evrak cirolandı.')
    } catch { toast.error('İşlem başarısız.') }
  }

  // ─ Tahsil İşlem Fonksiyonları ─────────────────────────────────────────────
  const tahsilOdendi = (id) => setOnay({
    baslik: 'Ödendi Olarak İşaretlensin mi?',
    mesaj: 'Bu evrak tahsil edilmiş sayılacak ve arşive taşınacaktır.', ikon: '✅',
    btnRenk: '#10b981', btnYazi: 'Evet, Ödendi!',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'tahsil_edildi', tahsil_tarihi: bugunStr() })
        setTahsil(p => p.filter(i => i.id !== id))
        setArsiv(p => [normalize(r.data.veri), ...p])
        toast.success('Evrak tahsil edildi, arşive taşındı.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const tahsilIade = (id) => setOnay({
    baslik: 'Portföye İade Edilsin mi?', mesaj: 'Bu evrak portföydeki listeye geri taşınacaktır.', ikon: '↩️',
    btnRenk: '#f59e0b', btnYazi: 'Evet, İade Et',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'portfoyde' })
        setTahsil(p => p.filter(i => i.id !== id))
        setPortfoy(p => [normalize(r.data.veri), ...p])
        toast.success('Evrak portföye iade edildi.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const tahsilDzlAc = (item) => {
    setTahsilDzlForm({
      tur: item.tur, firma_adi: item.firma_adi, cari_id: item.cari_id,
      asil_borclu: item.asil_borclu, evrak_no: item.evrak_no, banka: item.banka || '',
      vade_tarihi: item.vade_tarihi, tahsil_tarihi: item.tahsil_tarihi,
      tutarStr: formatParaInput(String(item.tutar)),
    })
    setTahsilDzlId(item.id); setTahsilDzlModal(true)
  }

  const tahsilDzlKaydet = async () => {
    const tutar = parseParaInput(tahsilDzlForm.tutarStr)
    if (!tahsilDzlForm.vade_tarihi || tutar <= 0) {
      toast.error('Vade tarihi ve tutar zorunludur.'); return
    }
    try {
      const r = await cekSenetApi.guncelle(tahsilDzlId, {
        cari_id:     tahsilDzlForm.cari_id   || undefined,
        seri_no:     tahsilDzlForm.evrak_no   || undefined,
        banka_adi:   tahsilDzlForm.banka       || undefined,
        vade_tarihi: tahsilDzlForm.vade_tarihi,
        tutar,
        aciklama:    tahsilDzlForm.asil_borclu || undefined,
      })
      setTahsil(p => p.map(i => i.id === tahsilDzlId ? normalize(r.data.veri) : i))
      setTahsilDzlModal(false); toast.success('Evrak güncellendi.')
    } catch { toast.error('Güncelleme başarısız.') }
  }

  // ─ Kendi İşlem Fonksiyonları ──────────────────────────────────────────────
  const kendiKaydet = async () => {
    if (!kendiForm.cari_id) { toast.error('Lütfen listeden bir cari seçin.'); return }
    if (!kendiForm.vade_tarihi || !kendiForm.banka) {
      toast.error('Vade tarihi ve banka zorunludur.'); return
    }
    const tutar = parseParaInput(kendiForm.tutarStr)
    if (tutar <= 0) { toast.error('Geçerli bir tutar giriniz.'); return }
    const veri = {
      cari_id:        kendiForm.cari_id,
      seri_no:        kendiForm.evrak_no    || undefined,
      banka_adi:      kendiForm.banka,
      kesilme_tarihi: kendiForm.islem_tarihi || undefined,
      vade_tarihi:    kendiForm.vade_tarihi,
      tutar,
      aciklama:       kendiForm.asil_borclu  || undefined,
    }
    try {
      if (kendiDzlId) {
        const r = await cekSenetApi.guncelle(kendiDzlId, veri)
        setKendi(p => p.map(i => i.id === kendiDzlId ? normalize(r.data.veri) : i))
        toast.success('Evrak güncellendi.')
      } else {
        const r = await cekSenetApi.ekle({ ...veri, tur: TUR_API[kendiForm.tur] })
        setKendi(p => [normalize(r.data.veri), ...p])
        toast.success('Borç evrakı eklendi.')
      }
      setKendiModal(false); setKendiForm(kendiBosluk()); setKendiDzlId(null)
    } catch { toast.error('İşlem başarısız.') }
  }

  const kendiDzlAc = (item) => {
    setKendiForm({
      tur: item.tur, firma_adi: item.firma_adi, cari_id: item.cari_id,
      asil_borclu: item.asil_borclu || '', evrak_no: item.evrak_no, banka: item.banka,
      vade_tarihi: item.vade_tarihi, islem_tarihi: item.islem_tarihi,
      tutarStr: formatParaInput(String(item.tutar)),
    })
    setKendiDzlId(item.id); setKendiModal(true)
  }

  const kendiOdendi = (id) => setOnay({
    baslik: 'Ödendi Olarak İşaretlensin mi?', mesaj: 'Bu evrak ödenmiş/kapanmış olarak işaretlenecektir.', ikon: '✅',
    btnRenk: '#10b981', btnYazi: 'Evet, Ödendi!',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'odendi', tahsil_tarihi: bugunStr() })
        setKendi(p => p.filter(i => i.id !== id))
        setArsiv(p => [normalize(r.data.veri), ...p])
        toast.success('Evrak ödendi olarak kapatıldı, arşive taşındı.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const kendiSil = (id) => setOnay({
    baslik: 'Evrak Silinsin mi?', mesaj: 'Bu evrak kalıcı olarak silinecektir.', ikon: '🗑️',
    btnRenk: '#ef4444', btnYazi: 'Evet, Sil',
    islem: async () => {
      try {
        await cekSenetApi.sil(id)
        setKendi(p => p.filter(i => i.id !== id))
        toast.success('Evrak silindi.')
      } catch { toast.error('Silme başarısız.') }
      setOnay(null)
    },
  })

  // ─ Ciro İşlem Fonksiyonları ───────────────────────────────────────────────
  const ciroTamamlandi = (id) => setOnay({
    baslik: 'Ciro Tamamlandı mı?', mesaj: 'Bu evrak tahsil edilmiş sayılacak ve arşive taşınacaktır.', ikon: '✅',
    btnRenk: '#10b981', btnYazi: 'Evet, Tamamlandı!',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'tahsil_edildi', tahsil_tarihi: bugunStr() })
        setCiro(p => p.filter(i => i.id !== id))
        setArsiv(p => [normalize(r.data.veri), ...p])
        toast.success('Ciro tamamlandı, arşive taşındı.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const ciroIade = (id) => setOnay({
    baslik: 'Portföye İade Edilsin mi?', mesaj: 'Bu evrak portföydeki listeye geri taşınacaktır.', ikon: '↩️',
    btnRenk: '#f59e0b', btnYazi: 'Evet, İade Et',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'portfoyde' })
        setCiro(p => p.filter(i => i.id !== id))
        setPortfoy(p => [normalize(r.data.veri), ...p])
        toast.success('Evrak portföye iade edildi.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const ciroSil = (id) => setOnay({
    baslik: 'Evrak Silinsin mi?', mesaj: 'Bu cirolanan evrak kalıcı olarak silinecektir.', ikon: '🗑️',
    btnRenk: '#ef4444', btnYazi: 'Evet, Sil',
    islem: async () => {
      try {
        await cekSenetApi.sil(id)
        setCiro(p => p.filter(i => i.id !== id))
        toast.success('Evrak silindi.')
      } catch { toast.error('Silme başarısız.') }
      setOnay(null)
    },
  })

  const ciroDzlAc = (item) => {
    setCiroDzlForm({
      vade_tarihi: item.vade_tarihi, ciro_tarihi: item.ciro_tarihi,
      tutarStr: formatParaInput(String(item.tutar)),
      asil_firma: item.asil_firma, teslim_yeri: item.teslim_yeri,
      cari_id: item.cari_id, ciro_edilen_cari_id: item.ciro_edilen_cari_id,
      evrak_no: item.evrak_no, tur: item.tur,
    })
    setCiroDzlId(item.id); setCiroDzlModal(true)
  }

  const ciroDzlKaydet = async () => {
    const tutar = parseParaInput(ciroDzlForm.tutarStr)
    if (!ciroDzlForm.vade_tarihi || tutar <= 0) {
      toast.error('Vade tarihi ve tutar zorunludur.'); return
    }
    try {
      const r = await cekSenetApi.guncelle(ciroDzlId, {
        seri_no:     ciroDzlForm.evrak_no   || undefined,
        vade_tarihi: ciroDzlForm.vade_tarihi,
        tutar,
      })
      setCiro(p => p.map(i => i.id === ciroDzlId ? normalize(r.data.veri) : i))
      setCiroDzlModal(false); toast.success('Evrak güncellendi.')
    } catch { toast.error('Güncelleme başarısız.') }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  if (yuklenIyor) return (
    <div className="cek-root">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
        .cek-sk {
          background: linear-gradient(90deg,
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.08) 50%,
            rgba(255,255,255,0.04) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
      `}</style>
      {/* Skeleton Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, padding: '20px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="cek-sk" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
          <div>
            <div className="cek-sk" style={{ width: 200, height: 22, marginBottom: 8 }} />
            <div className="cek-sk" style={{ width: 280, height: 14 }} />
          </div>
        </div>
        <div className="d-flex gap-2">
          <div className="cek-sk" style={{ width: 100, height: 44, borderRadius: 10 }} />
          <div className="cek-sk" style={{ width: 100, height: 44, borderRadius: 10 }} />
          <div className="cek-sk" style={{ width: 100, height: 44, borderRadius: 10 }} />
        </div>
      </div>
      {/* Skeleton Tab Bar */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 8, marginBottom: 24, display: 'flex', gap: 6 }}>
        {[120, 100, 110, 130, 100, 80].map((w, i) => (
          <div key={i} className="cek-sk" style={{ width: w, height: 40, borderRadius: 10, flexShrink: 0 }} />
        ))}
      </div>
      {/* Skeleton KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <div className="cek-sk" style={{ width: '60%', height: 11, marginBottom: 18 }} />
            <div className="cek-sk" style={{ width: '80%', height: 28, marginBottom: 10 }} />
            <div className="cek-sk" style={{ width: '50%', height: 12 }} />
          </div>
        ))}
      </div>
      {/* Skeleton Table Rows */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 20px' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="cek-sk" style={{ height: 40, borderRadius: 8, marginBottom: i < 4 ? 8 : 0, opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="cek-root">
      <style>{`
        /* ═══ Çek/Senet — Obsidian Vault ═══ */
        .cek-root { position: relative; z-index: 1; }

        /* ─── Spinner ─── */
        .cek-spinner {
          width: 2.5rem; height: 2.5rem;
          border: 3px solid rgba(255,255,255,0.08);
          border-top-color: #f59e0b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* ─── Glass Card ─── */
        .cek-glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .cek-glass:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
        }

        /* ─── KPI Kart ─── */
        .cek-kpi {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 22px 24px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          height: 100%;
        }
        .cek-kpi:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-2px);
        }
        .cek-kpi-deco {
          position: absolute;
          top: 16px; right: 16px;
          font-size: 60px;
          opacity: 0.20;
          pointer-events: none;
        }

        /* ─── Select (Dark) ─── */
        .cek-select {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #ffffff !important;
          border-radius: 8px !important;
        }
        .cek-select:focus {
          border-color: #f59e0b !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12) !important;
        }
        .cek-select option { background: #0d1b2e; color: #fff; }

        /* ─── Modal Form Override ─── */
        .cek-modal .form-control,
        .cek-modal .form-select {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: #ffffff !important;
          min-height: 44px;
          font-family: 'Outfit', sans-serif;
        }
        .cek-modal .form-control:focus,
        .cek-modal .form-select:focus {
          border-color: #f59e0b !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12) !important;
          background: rgba(255,255,255,0.07) !important;
        }
        .cek-modal .form-control::placeholder {
          color: rgba(255,255,255,0.25) !important;
        }
        .cek-modal select option {
          background: #0d1b2e;
          color: #ffffff;
        }
        .cek-modal .input-group-text {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.7) !important;
          font-weight: 700;
        }
        .cek-modal .btn-close { filter: invert(1); }
        .cek-modal .btn-outline-secondary {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.7) !important;
        }
        .cek-modal .btn-outline-secondary:hover {
          background: rgba(255,255,255,0.1) !important;
          color: #ffffff !important;
        }

        /* ─── Search ─── */
        .cek-search .form-control {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #ffffff;
          min-height: 44px;
        }
        .cek-search .form-control::placeholder { color: rgba(255,255,255,0.25); }
        .cek-search .form-control:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
          background: rgba(255,255,255,0.07);
        }
        .cek-search .input-group-text {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.3);
        }
        .cek-search .btn-outline-secondary {
          border-color: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
        }

        /* ─── Table (Dark) ─── */
        .cek-root .table { --bs-table-bg: transparent; --bs-table-hover-bg: rgba(255,255,255,0.03); --bs-table-border-color: rgba(255,255,255,0.04); color: #ffffff; }
        .cek-root .table thead th {
          background: transparent !important;
          color: rgba(255,255,255,0.4) !important;
          font-size: 11px !important;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 600 !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
        }
        .cek-root .table tbody td { border-bottom: 1px solid rgba(255,255,255,0.04); }
        .cek-root .text-muted { color: rgba(255,255,255,0.4) !important; }

        /* ─── Arsiv Pill ─── */
        .cek-arsiv-pill {
          min-height: 44px; padding: 0 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.6);
          font-weight: 500;
          transition: all 0.15s;
          cursor: pointer;
        }
        .cek-arsiv-pill:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.85); }
        .cek-arsiv-pill.active {
          background: rgba(245,158,11,0.15);
          border-color: rgba(245,158,11,0.3);
          color: #f59e0b;
          font-weight: 700;
        }

        /* ─── Table Action Buttons ─── */
        .cek-root .btn-outline-secondary {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
        }
        .cek-root .btn-outline-secondary:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          color: #ffffff;
        }
        .cek-root .btn-outline-danger {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.2);
          color: #ef4444;
        }
        .cek-root .btn-outline-danger:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: #ffffff;
        }

        /* ─── Animations ─── */
        @keyframes cekFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cekSlideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }

        /* ─── Responsive ─── */
        @media (max-width: 992px) {
          .cek-kpi .cek-kpi-value { font-size: 20px !important; }
        }
        @media (max-width: 768px) {
          .cek-kpi { padding: 16px; }
          .cek-kpi .cek-kpi-value { font-size: 20px !important; }
        }
        @media (max-width: 480px) {
          .cek-kpi { padding: 14px !important; border-radius: 12px; }
          .cek-kpi .cek-kpi-value { font-size: 18px !important; }
          .cek-glass { border-radius: 12px; }
        }

        /* ─── Shimmer Skeleton ─── */
        @keyframes shimmer {
          0% { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
        .cek-sk {
          background: linear-gradient(90deg,
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.08) 50%,
            rgba(255,255,255,0.04) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }

        /* ─── Sayfa Header ─── */
        .cek-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding: 20px 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
        }
        .cek-page-header::before {
          content: '';
          position: absolute;
          top: -40%;
          left: -5%;
          width: 240px;
          height: 240px;
          background: radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .cek-page-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cek-page-title {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 4px;
          line-height: 1.2;
        }
        .cek-page-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          margin: 0;
          line-height: 1.4;
        }

        /* ─── Amber Primary Buton ─── */
        .cek-btn-primary {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #0d1b2e !important;
          border: none;
          border-radius: 10px;
          padding: 0 20px;
          min-height: 44px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          box-shadow: 0 4px 20px rgba(245,158,11,0.3);
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .cek-btn-primary:hover {
          box-shadow: 0 6px 28px rgba(245,158,11,0.45);
          transform: translateY(-1px);
        }

        /* ─── ERP Aksiyon Satırı Tooltip ─── */
        .cek-act[title]:hover::after {
          content: attr(title);
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(13,27,46,0.97);
          color: rgba(255,255,255,0.9);
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          pointer-events: none;
          z-index: 100;
        }
        .cek-act { position: relative; }

        /* ─── ERP Header Stat Pill ─── */
        .cek-stat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 8px 14px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          white-space: nowrap;
        }
        .cek-stat-label {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          line-height: 1;
          margin-bottom: 3px;
        }
        .cek-stat-val {
          font-size: 13px;
          font-weight: 800;
          font-family: 'Inter', sans-serif;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        /* ─── Amber Primary Buton ─── */

        /* ─── Tab Bar ─── */
        .cek-tab-bar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .cek-tab-bar::-webkit-scrollbar { display: none; }

        /* ─── Aksiyon Butonları (32×32 glass) ─── */
        .cek-act {
          width: 32px; height: 32px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
          cursor: pointer; font-size: 13px; flex-shrink: 0;
          transition: all 0.15s;
        }
        .cek-act:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.16); color: #ffffff; }
        .cek-act-danger { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.15); color: #ef4444; }
        .cek-act-danger:hover { background: #ef4444; border-color: #ef4444; color: #ffffff; }
        .cek-act-success { background: rgba(16,185,129,0.10); border-color: rgba(16,185,129,0.20); color: #10b981; }
        .cek-act-success:hover { background: #10b981; border-color: #10b981; color: #ffffff; }
        .cek-act-amber { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.15); color: #f59e0b; }
        .cek-act-amber:hover { background: #f59e0b; border-color: #f59e0b; color: #0d1b2e; }

        /* ─── Vade Badge ─── */
        .cek-vade-late { display: inline-block; color: #ef4444; font-weight: 700; font-size: 13px; }
        .cek-vade-warn { display: inline-block; color: #d97706; font-weight: 700; font-size: 13px; }

        /* ─── Glow Dot ─── */
        .cek-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

        /* ─── Modal Bottom-Sheet (Mobil) ─── */
        @media (max-width: 768px) {
          .cek-modal { border-radius: 16px 16px 0 0 !important; }
          .cek-page-title { font-size: 20px; }
          .cek-page-sub { font-size: 13px; }
        }
        @media (max-width: 576px) {
          .cek-page-header { flex-direction: column; align-items: flex-start; }
          .cek-stat-pill { padding: 6px 10px; }
          .cek-stat-val { font-size: 12px; }
        }
      `}</style>

      {/* ─── Sayfa Başlığı ──────────────────────────────────────────────────── */}
      <div className="cek-page-header mb-4">
        <div className="cek-page-header-left">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(245,158,11,0.35)', flexShrink: 0 }}>
            <i className="bi bi-file-earmark-text-fill" style={{ fontSize: 22, color: '#0d1b2e' }} />
          </div>
          <div>
            <h4 className="cek-page-title">Çek &amp; Senet Yönetimi</h4>
            <p className="cek-page-sub">Portföy takibi · Tahsilat · Borç evrakları · Ciro yönetimi</p>
          </div>
        </div>
        {/* ERP Quick Stats */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="cek-stat-pill" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
            <i className="bi bi-collection-fill" style={{ color: '#f59e0b', fontSize: 13 }} />
            <div>
              <div className="cek-stat-label">Portföy</div>
              <div className="cek-stat-val" style={{ color: '#f59e0b' }}>{TL(toplam(portfoy))}</div>
            </div>
          </div>
          <div className="cek-stat-pill" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
            <i className="bi bi-bank" style={{ color: '#10b981', fontSize: 13 }} />
            <div>
              <div className="cek-stat-label">Tahsilde</div>
              <div className="cek-stat-val" style={{ color: '#10b981' }}>{TL(toplam(tahsil))}</div>
            </div>
          </div>
          <div className="cek-stat-pill" style={{ borderColor: toplam(tahsil) - toplam(kendi) >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}>
            <i className={`bi ${toplam(tahsil) - toplam(kendi) >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}`} style={{ color: toplam(tahsil) - toplam(kendi) >= 0 ? '#10b981' : '#ef4444', fontSize: 13 }} />
            <div>
              <div className="cek-stat-label">Net Durum</div>
              <div className="cek-stat-val" style={{ color: toplam(tahsil) - toplam(kendi) >= 0 ? '#10b981' : '#ef4444' }}>{TL(toplam(tahsil) - toplam(kendi))}</div>
            </div>
          </div>
          <button
            onClick={veriYukle}
            title="Verileri Yenile"
            style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >
            <i className="bi bi-arrow-clockwise" style={{ fontSize: 15 }} />
          </button>
        </div>
      </div>

      {/* ─── Ana Kart ───────────────────────────────────────────────────────── */}
      <div className="cek-glass p-0 overflow-hidden" style={{ borderRadius: 16 }}>

        {/* Tab Başlıkları */}
        <div
          className="cek-tab-bar"
          style={{
            display: 'flex',
            gap: 4,
            padding: '6px 8px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            overflowX: 'auto',
          }}
        >
          {TABS.map((tab, i) => {
            const isActive = aktifTab === i
            const rgb = RENK_RGB[tab.renk] || '255,255,255'
            return (
              <button
                key={i}
                onClick={() => tabDegistir(i)}
                style={{
                  border: isActive ? `1px solid rgba(${rgb},0.25)` : '1px solid transparent',
                  background: isActive ? `rgba(${rgb},0.12)` : 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  padding: '7px 14px',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: 'nowrap',
                  color: isActive ? tab.renk : 'rgba(255,255,255,0.6)',
                  minHeight: 40,
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                {tab.icon && <i className={`bi ${tab.icon}`} style={{ fontSize: 13 }} />}
                {tab.label}
                {tab.count !== null && (
                  <span style={{
                    background: isActive ? `rgba(${rgb},0.15)` : 'rgba(255,255,255,0.08)',
                    color: isActive ? tab.renk : 'rgba(255,255,255,0.5)',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 20,
                    padding: '2px 8px',
                    lineHeight: '1.4',
                    display: 'inline-block',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab İçerikleri */}
        <div style={{ padding: '20px 20px 24px' }}>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 0 — DASHBOARD
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 0 && (
            <div>

              {/* Üst Filtre + Başlık */}
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  <i className="bi bi-speedometer2 me-2" style={{ color: '#f59e0b' }} />
                  Portföy Özeti
                </span>
                <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
              </div>

              {/* 4 KPI Kartı */}
              <div className="row g-3 mb-4">

                {/* Kart 1 — Portföydeki */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="cek-kpi" onClick={() => tabDegistir(1)}>
                    <i className="bi bi-collection-fill cek-kpi-deco" style={{ color: '#f59e0b' }} />
                    <h6 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px', position: 'relative', zIndex: 1, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>
                      Portföydeki Toplam
                    </h6>
                    <div className="cek-kpi-value" style={{ fontSize: 26, fontWeight: 500, color: '#f59e0b', lineHeight: 1.15, fontFamily: "'Inter', sans-serif", position: 'relative', zIndex: 1, letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 20px rgba(245,158,11,0.3)', WebkitFontSmoothing: 'antialiased' }}>
                      {TL(portfoyToplam)}
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500, margin: '8px 0 0', position: 'relative', zIndex: 1 }}>
                      {portfoy.length} adet evrak
                    </p>
                  </div>
                </div>

                {/* Kart 2 — Tahsildeki */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="cek-kpi" onClick={() => tabDegistir(2)}>
                    <i className="bi bi-bank cek-kpi-deco" style={{ color: '#10b981' }} />
                    <h6 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px', position: 'relative', zIndex: 1, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>
                      Tahsildeki
                    </h6>
                    <div className="cek-kpi-value" style={{ fontSize: 26, fontWeight: 500, color: '#10b981', lineHeight: 1.15, fontFamily: "'Inter', sans-serif", position: 'relative', zIndex: 1, letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 20px rgba(16,185,129,0.3)', WebkitFontSmoothing: 'antialiased' }}>
                      {TL(tahsilToplam)}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, position: 'relative', zIndex: 1 }}>
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>● {TL(tahsilBekleyen)} Bekleyen</span>
                      <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>● {TL(tahsilGecmis)} Gecikmiş</span>
                    </div>
                  </div>
                </div>

                {/* Kart 3 — Kendi Çekimiz */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="cek-kpi" onClick={() => tabDegistir(3)}>
                    <i className="bi bi-arrow-up-circle-fill cek-kpi-deco" style={{ color: '#ef4444' }} />
                    <h6 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px', position: 'relative', zIndex: 1, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>
                      Kendi Çekimiz
                    </h6>
                    <div className="cek-kpi-value" style={{ fontSize: 26, fontWeight: 500, color: '#ef4444', lineHeight: 1.15, fontFamily: "'Inter', sans-serif", position: 'relative', zIndex: 1, letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 20px rgba(239,68,68,0.3)', WebkitFontSmoothing: 'antialiased' }}>
                      {TL(kendiToplam)}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, position: 'relative', zIndex: 1 }}>
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>● {TL(kendiBekleyen)} Bekleyen</span>
                      <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>● {TL(kendiGecmis)} Gecikmiş</span>
                    </div>
                  </div>
                </div>

                {/* Kart 4 — Net Durum */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="cek-kpi">
                    <i
                      className={`bi ${netDurum >= 0 ? 'bi-graph-up-arrow' : 'bi-exclamation-triangle-fill'} cek-kpi-deco`}
                      style={{ color: netDurum >= 0 ? '#10b981' : '#ef4444' }}
                    />
                    <h6 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px', position: 'relative', zIndex: 1, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>
                      Net Durum
                    </h6>
                    <div className="cek-kpi-value" style={{ fontSize: 26, fontWeight: 500, color: netDurum >= 0 ? '#10b981' : '#ef4444', lineHeight: 1.15, fontFamily: "'Inter', sans-serif", position: 'relative', zIndex: 1, letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums', textShadow: `0 0 20px ${netDurum >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, WebkitFontSmoothing: 'antialiased' }}>
                      {TL(netDurum)}
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500, margin: '8px 0 0', position: 'relative', zIndex: 1 }}>
                      Alacak − Borç farkı
                    </p>
                  </div>
                </div>

              </div>

              {/* Risk Uyarı Kartları */}
              {(gecikenTahsil.length > 0 || gecikenKendi.length > 0) ? (
                <div className="row g-3 mb-4">

                  {/* Blok A — Gecikmiş Tahsilat */}
                  {gecikenTahsil.length > 0 && (
                    <div className="col-md-6">
                      <div className="cek-glass p-3 h-100" style={{ borderLeft: '3px solid #ef4444', background: 'rgba(239,68,68,0.06)' }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444', fontSize: 14 }} />
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#ef4444' }}>Gecikmiş Tahsilat</span>
                          <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 8px' }}>
                            {gecikenTahsil.length} evrak
                          </span>
                        </div>
                        {gecikenTahsil.slice(0, 5).map(item => (
                          <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{item.firma_adi}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{tarihFmt(item.vade_tarihi)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', fontFamily: "'Inter', sans-serif" }}>{TL(item.tutar)}</div>
                              <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 6, padding: '1px 6px' }}>+{gunFark(item.vade_tarihi)} gün</span>
                            </div>
                          </div>
                        ))}
                        {gecikenTahsil.length > 5 && (
                          <button onClick={() => tabDegistir(2)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 4 }}>
                            Tümünü gör ({gecikenTahsil.length}) <i className="bi bi-arrow-right" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Blok B — Gecikmiş Ödemelerimiz */}
                  {gecikenKendi.length > 0 && (
                    <div className="col-md-6">
                      <div className="cek-glass p-3 h-100" style={{ borderLeft: '3px solid #d97706', background: 'rgba(217,119,6,0.06)' }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#d97706', fontSize: 14 }} />
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#d97706' }}>Gecikmiş Ödemelerimiz</span>
                          <span style={{ background: 'rgba(217,119,6,0.15)', color: '#d97706', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 8px' }}>
                            {gecikenKendi.length} evrak
                          </span>
                        </div>
                        {gecikenKendi.slice(0, 5).map(item => (
                          <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{item.firma_adi}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{tarihFmt(item.vade_tarihi)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706', fontFamily: "'Inter', sans-serif" }}>{TL(item.tutar)}</div>
                              <span style={{ fontSize: 10, background: 'rgba(217,119,6,0.12)', color: '#d97706', borderRadius: 6, padding: '1px 6px' }}>+{gunFark(item.vade_tarihi)} gün</span>
                            </div>
                          </div>
                        ))}
                        {gecikenKendi.length > 5 && (
                          <button onClick={() => tabDegistir(3)} style={{ background: 'none', border: 'none', color: '#d97706', fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 4 }}>
                            Tümünü gör ({gecikenKendi.length}) <i className="bi bi-arrow-right" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* Yeşil Onay Banner */
                <div className="cek-glass d-flex align-items-center gap-3 p-3 mb-4" style={{ borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.05)' }}>
                  <i className="bi bi-check-circle-fill" style={{ color: '#10b981', fontSize: 24, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>Tüm evraklar vadeli</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Gecikmiş tahsilat veya ödeme bulunmuyor</div>
                  </div>
                </div>
              )}

              {/* Takvim + Son 6 Ay Grafik */}
              <div className="row g-3">

                {/* Vade Takvimi */}
                <div className="col-lg-6">
                  <div className="cek-glass p-3 h-100">
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 14 }}>
                      <i className="bi bi-calendar3 me-2" style={{ color: '#f59e0b' }} />
                      Vade Takvimi
                    </div>
                    <AylikTakvim ay={filtre.ay} yil={filtre.yil} tahsilEvents={takvimTahsil} odemeEvents={takvimOdeme} />
                    <div className="d-flex gap-4 mt-3">
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
                        Tahsil Vadesi
                      </span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }} />
                        Ödeme Vadesi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Son 6 Ay SVG Grafiği */}
                <div className="col-lg-6">
                  <div className="cek-glass p-3 h-100">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                        <i className="bi bi-bar-chart-line me-2" style={{ color: '#f59e0b' }} />
                        Son 6 Ay Özeti
                      </span>
                      <div className="d-flex gap-3">
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} /> Tahsil
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> Ödeme
                        </span>
                      </div>
                    </div>
                    {(() => {
                      const maxVal = Math.max(...son6AyVeri.flatMap(r => [r.tahsil, r.odeme]), 1)
                      const chartH = 140
                      const barW = 20
                      const intraGap = 8
                      const groupW = barW * 2 + intraGap
                      const groupGap = 22
                      const padX = 10
                      const totalW = son6AyVeri.length * (groupW + groupGap) - groupGap + padX * 2
                      const fmtK = (v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? Math.round(v / 1000) + 'K' : Math.round(v)
                      return (
                        <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 36}`} style={{ overflow: 'visible', display: 'block' }}>
                          {son6AyVeri.map((r, i) => {
                            const x = padX + i * (groupW + groupGap)
                            const th = Math.max((r.tahsil / maxVal) * chartH, r.tahsil > 0 ? 4 : 0)
                            const oh = Math.max((r.odeme  / maxVal) * chartH, r.odeme  > 0 ? 4 : 0)
                            return (
                              <g key={i}>
                                {/* Tahsil bar */}
                                <rect x={x} y={chartH - th} width={barW} height={th} rx={4} fill="#10b981" opacity={0.85} />
                                {r.tahsil > 0 && (
                                  <text x={x + barW / 2} y={chartH - th - 4} textAnchor="middle" fontSize={9} fill="#10b981" fontFamily="Inter,sans-serif">
                                    {fmtK(r.tahsil)}
                                  </text>
                                )}
                                {/* Ödeme bar */}
                                <rect x={x + barW + intraGap} y={chartH - oh} width={barW} height={oh} rx={4} fill="#ef4444" opacity={0.85} />
                                {r.odeme > 0 && (
                                  <text x={x + barW + intraGap + barW / 2} y={chartH - oh - 4} textAnchor="middle" fontSize={9} fill="#ef4444" fontFamily="Inter,sans-serif">
                                    {fmtK(r.odeme)}
                                  </text>
                                )}
                                {/* Ay etiketi */}
                                <text x={x + groupW / 2} y={chartH + 18} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.4)" fontFamily="Outfit,sans-serif">
                                  {r.ay.split(' ')[0]}
                                </text>
                              </g>
                            )
                          })}
                          <line x1={padX} y1={chartH} x2={totalW - padX} y2={chartH} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                        </svg>
                      )
                    })()}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1 — PORTFÖYDEKİ EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 1 && (
            <div>
              {/* Gradient Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.06) 100%)',
                border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16,
                padding: '22px 24px', marginBottom: 20,
              }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, marginBottom: 8 }}>Toplam Portföy</div>
                    <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1, fontFamily: "'Inter', sans-serif", color: '#f59e0b', textShadow: '0 0 20px rgba(245,158,11,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(portfoyToplam)}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                      <i className="bi bi-collection-fill me-1" style={{ color: '#f59e0b' }} />
                      {portfoy.length} adet evrak
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              {/* Arama + Yeni Buton */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <div className="input-group flex-grow-1 cek-search" style={{ minWidth: 220 }}>
                  <span className="input-group-text"><i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.3)' }} /></span>
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="Müşteri, evrak no veya vade tarihi ara..."
                    value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                  {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
                </div>
                <button className="cek-btn-primary"
                  onClick={() => { setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null); setPortfoyModal(true) }}>
                  <i className="bi bi-plus-lg me-2" /> Yeni Evrak
                </button>
              </div>

              {/* Tablo */}
              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px' }}>Vade Tarihi</th>
                      <th style={{ padding: '10px 12px' }}>İşlem Tarihi</th>
                      <th style={{ padding: '10px 12px' }}>Tutar</th>
                      <th style={{ padding: '10px 12px' }}>Firma / Asıl Borçlu</th>
                      <th style={{ padding: '10px 12px' }}>Tür / Banka</th>
                      <th style={{ padding: '10px 12px' }}>Evrak No</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fP.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-5 text-center">
                          <i className="bi bi-file-earmark-x" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)', display: 'block', marginBottom: 10 }} />
                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Bu dönemde evrak bulunamadı</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Filtre değiştirin veya yeni evrak ekleyin</div>
                        </td>
                      </tr>
                    )}
                    {fP.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px' }}><VadeBadge tarih={item.vade_tarihi} /></td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{tarihFmt(item.islem_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#f59e0b', fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 13 }}>{item.firma_adi}</div>
                          {item.asil_borclu && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{item.asil_borclu}</div>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <TurBadge tur={item.tur} />
                          {item.banka && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}><i className="bi bi-bank me-1" />{item.banka}</div>}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>{item.evrak_no || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 justify-content-end">
                            <button className="cek-act cek-act-success" title="Tahsile Ver"
                              onClick={() => { setTahsileId(item.id); setTahsileForm({ banka: '', tarih: bugunStr() }); setTahsileModal(true) }}>
                              <i className="bi bi-bank" />
                            </button>
                            <button className="cek-act cek-act-amber" title="Cirola"
                              onClick={() => { setCirolaId(item.id); setCirolaForm({ firma: '', tarih: bugunStr() }); setCirolaModal(true) }}>
                              <i className="bi bi-arrow-left-right" />
                            </button>
                            <button className="cek-act" title="Düzenle" onClick={() => portfoyDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="cek-act cek-act-danger" title="Sil" onClick={() => portfoySil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {fP.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '10px 16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{fP.length} evrak listeleniyor</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', fontFamily: "'Inter', sans-serif" }}>Toplam: {TL(portfoyToplam)}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2 — TAHSİLDEKİ EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 2 && (
            <div>
              {/* Gradient Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)',
                border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16,
                padding: '22px 24px', marginBottom: 20,
              }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Bekleyen Vade</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#10b981', textShadow: '0 0 20px rgba(16,185,129,0.3)', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(tahsilBekleyen)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Vadesi Geçen</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.3)', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(tahsilGecmis)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Toplam Tahsilde</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ffffff', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(tahsilToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              {/* Arama */}
              <div className="input-group mb-3 cek-search">
                <span className="input-group-text"><i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.3)' }} /></span>
                <input className="form-control" style={{ minHeight: 44 }} placeholder="Müşteri, evrak no veya vade tarihi ara..."
                  value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px' }}>Ödeme Tarihi (Vade)</th>
                      <th style={{ padding: '10px 12px' }}>Tahsile Veriş</th>
                      <th style={{ padding: '10px 12px' }}>Tutar</th>
                      <th style={{ padding: '10px 12px' }}>Firma / Asıl Borçlu</th>
                      <th style={{ padding: '10px 12px' }}>Tür / Banka</th>
                      <th style={{ padding: '10px 12px' }}>Evrak No</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fT.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-5 text-center">
                          <i className="bi bi-bank" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)', display: 'block', marginBottom: 10 }} />
                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Bu dönemde tahsildeki evrak bulunamadı</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Portföyden evrak tahsile gönderin</div>
                        </td>
                      </tr>
                    )}
                    {fT.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px' }}><VadeBadge tarih={item.vade_tarihi} /></td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{tarihFmt(item.tahsil_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#10b981', fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 13 }}>{item.firma_adi}</div>
                          {item.asil_borclu && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{item.asil_borclu}</div>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <TurBadge tur={item.tur} />
                          {item.banka && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}><i className="bi bi-bank me-1" />{item.banka}</div>}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>{item.evrak_no || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 justify-content-end">
                            <button className="cek-act cek-act-success" title="Ödendi" onClick={() => tahsilOdendi(item.id)}>
                              <i className="bi bi-check-lg" />
                            </button>
                            <button className="cek-act" title="Portföye İade Et" onClick={() => tahsilIade(item.id)}>
                              <i className="bi bi-arrow-counterclockwise" />
                            </button>
                            <button className="cek-act" title="Düzenle" onClick={() => tahsilDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {fT.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '10px 16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{fT.length} evrak listeleniyor</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981', fontFamily: "'Inter', sans-serif" }}>Toplam: {TL(tahsilToplam)}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3 — ÖDENECEK KENDİ EVRAKLARIMız
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 3 && (
            <div>
              {/* Gradient Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(185,28,28,0.05) 100%)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16,
                padding: '22px 24px', marginBottom: 20,
              }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Bekleyen Borç</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.3)', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(kendiBekleyen)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Vadesi Geçen</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#d97706', textShadow: '0 0 20px rgba(217,119,6,0.3)', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(kendiGecmis)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Toplam Çıkış</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ffffff', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(kendiToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              {/* Arama + Yeni Buton */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <div className="input-group flex-grow-1 cek-search" style={{ minWidth: 220 }}>
                  <span className="input-group-text"><i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.3)' }} /></span>
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="Firma, evrak no, banka veya vade tarihi ara..."
                    value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                  {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
                </div>
                <button className="cek-btn-primary"
                  onClick={() => { setKendiForm(kendiBosluk()); setKendiDzlId(null); setKendiModal(true) }}>
                  <i className="bi bi-plus-lg me-2" /> Yeni Borç Ekle
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px' }}>Ödeme Tarihi (Vade)</th>
                      <th style={{ padding: '10px 12px' }}>İşlem Tarihi</th>
                      <th style={{ padding: '10px 12px' }}>Tutar</th>
                      <th style={{ padding: '10px 12px' }}>Firma (Ödeme Yapılan)</th>
                      <th style={{ padding: '10px 12px' }}>Tür / Banka</th>
                      <th style={{ padding: '10px 12px' }}>Evrak No</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fK.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-5 text-center">
                          <i className="bi bi-arrow-up-circle" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)', display: 'block', marginBottom: 10 }} />
                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Bu dönemde borç evrakı bulunamadı</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Yeni borç evrakı ekleyin</div>
                        </td>
                      </tr>
                    )}
                    {fK.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px' }}><VadeBadge tarih={item.vade_tarihi} /></td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{tarihFmt(item.islem_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#ef4444', fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#ffffff', fontSize: 13 }}>{item.firma_adi}</td>
                        <td style={{ padding: '12px' }}>
                          <TurBadge tur={item.tur} />
                          {item.banka && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}><i className="bi bi-bank me-1" />{item.banka}</div>}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>{item.evrak_no || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 justify-content-end">
                            <button className="cek-act cek-act-success" title="Ödendi" onClick={() => kendiOdendi(item.id)}>
                              <i className="bi bi-check-lg" />
                            </button>
                            <button className="cek-act" title="Düzenle" onClick={() => kendiDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="cek-act cek-act-danger" title="Sil" onClick={() => kendiSil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {fK.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '10px 16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{fK.length} evrak listeleniyor</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', fontFamily: "'Inter', sans-serif" }}>Toplam: {TL(kendiToplam)}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4 — CİROLANAN EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 4 && (
            <div>
              {/* Gradient Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(217,119,6,0.15) 0%, rgba(146,64,14,0.05) 100%)',
                border: '1px solid rgba(217,119,6,0.2)', borderRadius: 16,
                padding: '22px 24px', marginBottom: 20,
              }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Bekleyen Vade</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#d97706', textShadow: '0 0 20px rgba(217,119,6,0.3)', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(ciroBekleyen)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Vadesi Geçen</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.3)', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(ciroGecmis)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Toplam Cirolanan</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ffffff', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(ciroToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              {/* Arama */}
              <div className="input-group mb-3 cek-search">
                <span className="input-group-text"><i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.3)' }} /></span>
                <input className="form-control" style={{ minHeight: 44 }} placeholder="Firma, teslim yeri, evrak no veya vade tarihi ara..."
                  value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px' }}>Ödeme Tarihi (Vade)</th>
                      <th style={{ padding: '10px 12px' }}>Ciro Tarihi</th>
                      <th style={{ padding: '10px 12px' }}>Tutar</th>
                      <th style={{ padding: '10px 12px' }}>Asıl Firma (Müşteri)</th>
                      <th style={{ padding: '10px 12px' }}>Teslim Edilen Yer</th>
                      <th style={{ padding: '10px 12px' }}>Tür / Evrak No</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fC.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-5 text-center">
                          <i className="bi bi-arrow-left-right" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)', display: 'block', marginBottom: 10 }} />
                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Bu dönemde cirolanan evrak bulunamadı</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Portföyden evrak cirolandığında burada görünür</div>
                        </td>
                      </tr>
                    )}
                    {fC.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px' }}><VadeBadge tarih={item.vade_tarihi} /></td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{tarihFmt(item.ciro_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#d97706', fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#ffffff', fontSize: 13 }}>{item.asil_firma}</td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                          {item.teslim_yeri ? (
                            <span><i className="bi bi-arrow-right me-1" style={{ color: '#d97706' }} />{item.teslim_yeri}</span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <TurBadge tur={item.tur} />
                          {item.evrak_no && <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', marginTop: 4 }}>{item.evrak_no}</div>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 justify-content-end">
                            <button className="cek-act cek-act-success" title="Tamamlandı" onClick={() => ciroTamamlandi(item.id)}>
                              <i className="bi bi-check-lg" />
                            </button>
                            <button className="cek-act" title="Portföye İade Et" onClick={() => ciroIade(item.id)}>
                              <i className="bi bi-arrow-counterclockwise" />
                            </button>
                            <button className="cek-act" title="Düzenle" onClick={() => ciroDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="cek-act cek-act-danger" title="Sil" onClick={() => ciroSil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {fC.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '10px 16px', background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.12)', borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{fC.length} evrak listeleniyor</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706', fontFamily: "'Inter', sans-serif" }}>Toplam: {TL(ciroToplam)}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 5 — ARŞİV
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 5 && (
            <div>
              {/* Banner */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
                padding: '22px 24px', marginBottom: 20,
              }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Tahsil Edilen</div>
                      <div style={{ fontSize: 20, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#10b981', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(arsiv.filter(i => i.tur_kategori === 'tahsil_edildi').reduce((s, i) => s + i.tutar, 0))}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Kendi Ödenen</div>
                      <div style={{ fontSize: 20, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#f59e0b', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(arsiv.filter(i => i.tur_kategori === 'kendi_odendi').reduce((s, i) => s + i.tutar, 0))}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Ciro Tamamlanan</div>
                      <div style={{ fontSize: 20, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#d97706', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{TL(arsiv.filter(i => i.tur_kategori === 'ciro_tamamlandi').reduce((s, i) => s + i.tutar, 0))}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="bi bi-archive-fill" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    Toplam {arsiv.length} kayıt
                  </div>
                </div>
              </div>

              {/* Arama + 6 Kategori Pill */}
              <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                <div className="input-group flex-grow-1 cek-search" style={{ minWidth: 220 }}>
                  <span className="input-group-text"><i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.3)' }} /></span>
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="Firma, evrak no veya vade tarihi ara..."
                    value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                  {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
                </div>
                <div className="d-flex gap-1 flex-wrap">
                  {[
                    { v: 'tumu',            label: 'Tümü' },
                    { v: 'tahsil_edildi',   label: 'Tahsil Edilen' },
                    { v: 'kendi_odendi',    label: 'Kendi Ödenen' },
                    { v: 'ciro_tamamlandi', label: 'Ciro Tamamlanan' },
                    { v: 'iade_edildi',     label: 'İade Edildi' },
                    { v: 'karsiliksiz',     label: 'Karşılıksız' },
                    { v: 'protestolu',      label: 'Protestolu' },
                  ].map(({ v, label }) => (
                    <button
                      key={v}
                      className={`btn btn-sm cek-arsiv-pill ${arsivKategori === v ? 'active' : ''}`}
                      onClick={() => setArsivKategori(v)}
                    >{label}</button>
                  ))}
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px' }}>Kapatma Tarihi</th>
                      <th style={{ padding: '10px 12px' }}>Vade Tarihi</th>
                      <th style={{ padding: '10px 12px' }}>Tutar</th>
                      <th style={{ padding: '10px 12px' }}>Firma</th>
                      <th style={{ padding: '10px 12px' }}>Tür / Evrak No</th>
                      <th style={{ padding: '10px 12px' }}>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fA.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-5 text-center">
                          <i className="bi bi-archive" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)', display: 'block', marginBottom: 10 }} />
                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Arşivde kayıt bulunamadı</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Tamamlanan evraklar burada görünür</div>
                        </td>
                      </tr>
                    )}
                    {fA.map(item => {
                      const cfg = ARSIV_BADGE[item.tur_kategori] || { renk: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)', label: item.tur_kategori }
                      return (
                        <tr key={item.id}>
                          <td style={{ padding: '12px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{tarihFmt(item.kapanis_tarihi)}</td>
                          <td style={{ padding: '12px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{tarihFmt(item.vade_tarihi)}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: cfg.renk, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{TL(item.tutar)}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 13 }}>{item.firma_adi}</div>
                            {item.asil_borclu && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{item.asil_borclu}</div>}
                            {item.teslim_yeri && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}><i className="bi bi-arrow-right me-1" />{item.teslim_yeri}</div>}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <TurBadge tur={item.tur} />
                            {item.evrak_no && <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', marginTop: 4 }}>{item.evrak_no}</div>}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: cfg.bg, color: cfg.renk,
                              fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 10px',
                              border: `1px solid ${cfg.renk}30`,
                            }}>
                              <span className="cek-dot" style={{ background: cfg.renk, boxShadow: `0 0 6px ${cfg.renk}80` }} />
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {fA.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{fA.length} kayıt gösteriliyor</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }}>Toplam: {TL(fA.reduce((s, i) => s + i.tutar, 0))}</span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALLER
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ─── Generic Onay ───────────────────────────────────────────────────── */}
      <OnayModal
        open={!!onay}
        onClose={() => setOnay(null)}
        onOnayla={() => onay?.islem?.()}
        baslik={onay?.baslik}
        mesaj={onay?.mesaj}
        ikon={onay?.ikon}
        btnRenk={onay?.btnRenk}
        btnYazi={onay?.btnYazi}
      />

      {/* ─── Portföy: Yeni / Düzenle ────────────────────────────────────────── */}
      <Modal open={portfoyModal} onClose={() => { setPortfoyModal(false); setPortfoyDzlId(null) }} scrollable>
        {/* Premium Gradient Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08))', borderBottom: '2px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.35)', flexShrink: 0 }}>
              <i className={`bi ${portfoyDzlId ? 'bi-pencil-square' : 'bi-file-earmark-plus'}`} style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{portfoyDzlId ? 'Evrak Düzenle' : 'Yeni Evrak — Portföy'}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Müşteri çeki veya senedi</div>
            </div>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', width: 36, height: 36, borderRadius: 10, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setPortfoyModal(false); setPortfoyDzlId(null) }}>
            <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
          </button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {/* Bölüm: Evrak Bilgileri */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: '#f59e0b' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cari & Evrak Bilgileri</span>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <FG label="Evrak Tipi" zorunlu>
                <select className="form-select" style={{ minHeight: 44 }}
                  value={portfoyForm.tur} onChange={(e) => setPortfoyForm({ ...portfoyForm, tur: e.target.value })}>
                  <option>Müşteri Çeki</option>
                  <option>Müşteri Senedi</option>
                </select>
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Firma / Müşteri" zorunlu>
                <AutoComplete value={portfoyForm.firma_adi}
                  onChange={(v) => setPortfoyForm({ ...portfoyForm, firma_adi: v, cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Cari seç..." id="pf-firma" required />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Asıl Borçlu">
                <input className="form-control" style={{ minHeight: 44 }} value={portfoyForm.asil_borclu}
                  placeholder="Asıl borçlu adı (opsiyonel)"
                  onChange={(e) => setPortfoyForm({ ...portfoyForm, asil_borclu: e.target.value })} />
              </FG>
            </div>
          </div>
          {/* Bölüm: Evrak Detayları */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: '#3b82f6' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Evrak Detayları</span>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <FG label="Evrak / Çek No">
                <input className="form-control" style={{ minHeight: 44 }} value={portfoyForm.evrak_no}
                  placeholder="Evrak numarası"
                  onChange={(e) => setPortfoyForm({ ...portfoyForm, evrak_no: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Banka Adı">
                <AutoComplete value={portfoyForm.banka} onChange={(v) => setPortfoyForm({ ...portfoyForm, banka: v })}
                  options={BANKALAR} placeholder="Banka seç veya yaz..." id="pf-banka" />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Vade Tarihi" zorunlu kritik>
                <input type="date" className="form-control" style={{ minHeight: 44, borderColor: 'rgba(239,68,68,0.5)' }}
                  value={portfoyForm.vade_tarihi}
                  onChange={(e) => setPortfoyForm({ ...portfoyForm, vade_tarihi: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Düzenlenme / Alınma Tarihi">
                <input type="date" className="form-control" style={{ minHeight: 44 }}
                  value={portfoyForm.islem_tarihi}
                  onChange={(e) => setPortfoyForm({ ...portfoyForm, islem_tarihi: e.target.value })} />
              </FG>
            </div>
            <div className="col-12">
              <FG label="Tutar" zorunlu>
                <div className="input-group">
                  <input className="form-control" style={{ minHeight: 44, fontSize: 16, fontWeight: 700 }} placeholder="0,00"
                    value={portfoyForm.tutarStr}
                    onChange={(e) => setPortfoyForm({ ...portfoyForm, tutarStr: formatParaInput(e.target.value) })} />
                  <span className="input-group-text" style={{ fontWeight: 700, fontSize: 15 }}>₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        {/* Premium Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(13,27,46,0.98)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button style={{ minHeight: 44, padding: '0 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            onClick={() => { setPortfoyModal(false); setPortfoyDzlId(null) }}>İptal</button>
          <button style={{ minHeight: 44, padding: '0 28px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 10, color: '#0d1b2e', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}
            onClick={portfoyKaydet}>
            <i className="bi bi-floppy me-2" />Kaydet
          </button>
        </div>
      </Modal>

      {/* ─── Tahsile Ver Modalı ─────────────────────────────────────────────── */}
      <Modal open={tahsileModal} onClose={() => setTahsileModal(false)} size="sm">
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.08))', borderBottom: '2px solid rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.35)', flexShrink: 0 }}>
              <i className="bi bi-bank" style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Tahsile Ver</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Banka tahsilatına gönder</div>
            </div>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', width: 36, height: 36, borderRadius: 10, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setTahsileModal(false)}>
            <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <FG label="Banka Adı" zorunlu>
            <AutoComplete value={tahsileForm.banka} onChange={(v) => setTahsileForm({ ...tahsileForm, banka: v })}
              options={BANKALAR} placeholder="Banka seç veya yaz..." id="tv-banka" required />
          </FG>
          <FG label="Tahsile Veriş Tarihi" zorunlu>
            <input type="date" className="form-control" style={{ minHeight: 44 }}
              value={tahsileForm.tarih}
              onChange={(e) => setTahsileForm({ ...tahsileForm, tarih: e.target.value })} />
          </FG>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={{ minHeight: 44, padding: '0 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }} onClick={() => setTahsileModal(false)}>İptal</button>
          <button style={{ minHeight: 44, padding: '0 24px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }} onClick={tahsileVer}>
            <i className="bi bi-check-circle me-2" />İşlemi Tamamla
          </button>
        </div>
      </Modal>

      {/* ─── Cirola Modalı ──────────────────────────────────────────────────── */}
      <Modal open={cirolaModal} onClose={() => setCirolaModal(false)} size="sm">
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(217,119,6,0.18), rgba(146,64,14,0.08))', borderBottom: '2px solid rgba(217,119,6,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#d97706,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(217,119,6,0.35)', flexShrink: 0 }}>
              <i className="bi bi-arrow-left-right" style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Evrakı Ciroyla</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Başka firmaya devret</div>
            </div>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', width: 36, height: 36, borderRadius: 10, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCirolaModal(false)}>
            <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <FG label="Teslim Edilecek Firma (Cari)" zorunlu>
            <AutoComplete value={cirolaForm.firma}
              onChange={(v) => setCirolaForm({ ...cirolaForm, firma: v, cari_id: cariIdBul(v) })}
              options={cariSecenekleri} placeholder="Cari seç..." id="ci-firma" required />
          </FG>
          <FG label="Ciro Tarihi" zorunlu>
            <input type="date" className="form-control" style={{ minHeight: 44 }}
              value={cirolaForm.tarih}
              onChange={(e) => setCirolaForm({ ...cirolaForm, tarih: e.target.value })} />
          </FG>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={{ minHeight: 44, padding: '0 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }} onClick={() => setCirolaModal(false)}>İptal</button>
          <button style={{ minHeight: 44, padding: '0 24px', background: 'linear-gradient(135deg,#d97706,#b45309)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(217,119,6,0.3)' }} onClick={cirolaKaydet}>
            <i className="bi bi-arrow-left-right me-2" />Ciroyu Tamamla
          </button>
        </div>
      </Modal>

      {/* ─── Kendi Çekimiz: Yeni / Düzenle ─────────────────────────────────── */}
      <Modal open={kendiModal} onClose={() => { setKendiModal(false); setKendiDzlId(null) }} scrollable>
        {/* Premium Red Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(185,28,28,0.08))', borderBottom: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.35)', flexShrink: 0 }}>
              <i className={`bi ${kendiDzlId ? 'bi-pencil-square' : 'bi-file-earmark-minus'}`} style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{kendiDzlId ? 'Borç Evrakı Düzenle' : 'Yeni Borç Evrakı'}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Kendi çekimiz / senedimiz</div>
            </div>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', width: 36, height: 36, borderRadius: 10, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setKendiModal(false); setKendiDzlId(null) }}>
            <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
          </button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {/* Bölüm: Cari & Evrak Bilgileri */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: '#ef4444' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cari & Evrak Bilgileri</span>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <FG label="Evrak Tipi" zorunlu>
                <select className="form-select" style={{ minHeight: 44 }}
                  value={kendiForm.tur} onChange={(e) => setKendiForm({ ...kendiForm, tur: e.target.value })}>
                  <option>Kendi Çekimiz</option>
                  <option>Kendi Senedimiz</option>
                </select>
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Firma / Tedarikçi" zorunlu>
                <AutoComplete value={kendiForm.firma_adi}
                  onChange={(v) => setKendiForm({ ...kendiForm, firma_adi: v, cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Cari seç..." id="ke-firma" required />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Asıl Borçlu">
                <input className="form-control" style={{ minHeight: 44 }} value={kendiForm.asil_borclu}
                  placeholder="İsteğe bağlı"
                  onChange={(e) => setKendiForm({ ...kendiForm, asil_borclu: e.target.value })} />
              </FG>
            </div>
          </div>
          {/* Bölüm: Ödeme Detayları */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: '#3b82f6' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ödeme Detayları</span>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <FG label="Evrak / Çek No">
                <input className="form-control" style={{ minHeight: 44 }} value={kendiForm.evrak_no}
                  placeholder="Evrak numarası"
                  onChange={(e) => setKendiForm({ ...kendiForm, evrak_no: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Banka Adı" zorunlu>
                <AutoComplete value={kendiForm.banka} onChange={(v) => setKendiForm({ ...kendiForm, banka: v })}
                  options={BANKALAR} placeholder="Banka seç..." id="ke-banka" required />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Vade Tarihi" zorunlu kritik>
                <input type="date" className="form-control" style={{ minHeight: 44, borderColor: 'rgba(239,68,68,0.5)' }}
                  value={kendiForm.vade_tarihi}
                  onChange={(e) => setKendiForm({ ...kendiForm, vade_tarihi: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Düzenlenme / Veriliş Tarihi">
                <input type="date" className="form-control" style={{ minHeight: 44 }}
                  value={kendiForm.islem_tarihi}
                  onChange={(e) => setKendiForm({ ...kendiForm, islem_tarihi: e.target.value })} />
              </FG>
            </div>
            <div className="col-12">
              <FG label="Tutar" zorunlu>
                <div className="input-group">
                  <input className="form-control" style={{ minHeight: 44, fontSize: 16, fontWeight: 700 }} placeholder="0,00"
                    value={kendiForm.tutarStr}
                    onChange={(e) => setKendiForm({ ...kendiForm, tutarStr: formatParaInput(e.target.value) })} />
                  <span className="input-group-text" style={{ fontWeight: 700, fontSize: 15 }}>₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        {/* Premium Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(13,27,46,0.98)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button style={{ minHeight: 44, padding: '0 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            onClick={() => { setKendiModal(false); setKendiDzlId(null) }}>İptal</button>
          <button style={{ minHeight: 44, padding: '0 28px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}
            onClick={kendiKaydet}>
            <i className="bi bi-floppy me-2" />Kaydet
          </button>
        </div>
      </Modal>

      {/* ─── Tahsil Düzenle Modalı ──────────────────────────────────────────── */}
      <Modal open={tahsilDzlModal} onClose={() => setTahsilDzlModal(false)} scrollable>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.07))', borderBottom: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.35)', flexShrink: 0 }}>
              <i className="bi bi-pencil-square" style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Tahsildeki Evrak Düzenle</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Tahsil bilgilerini güncelle</div>
            </div>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', width: 36, height: 36, borderRadius: 10, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setTahsilDzlModal(false)}>
            <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
          </button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div className="row g-3">
            <div className="col-md-6">
              <FG label="Firma / Müşteri" zorunlu>
                <AutoComplete value={tahsilDzlForm.firma_adi || ''}
                  onChange={(v) => setTahsilDzlForm({ ...tahsilDzlForm, firma_adi: v, cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Cari seç..." id="td-firma" />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Asıl Borçlu">
                <input className="form-control" style={{ minHeight: 44 }} value={tahsilDzlForm.asil_borclu || ''}
                  onChange={(e) => setTahsilDzlForm({ ...tahsilDzlForm, asil_borclu: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Evrak No">
                <input className="form-control" style={{ minHeight: 44 }} value={tahsilDzlForm.evrak_no || ''}
                  onChange={(e) => setTahsilDzlForm({ ...tahsilDzlForm, evrak_no: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Banka Adı">
                <AutoComplete value={tahsilDzlForm.banka || ''} onChange={(v) => setTahsilDzlForm({ ...tahsilDzlForm, banka: v })}
                  options={BANKALAR} placeholder="Banka seç..." id="td-banka" />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Vade Tarihi" zorunlu>
                <input type="date" className="form-control" style={{ minHeight: 44 }} value={tahsilDzlForm.vade_tarihi || ''}
                  onChange={(e) => setTahsilDzlForm({ ...tahsilDzlForm, vade_tarihi: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Tahsile Veriş Tarihi">
                <input type="date" className="form-control" style={{ minHeight: 44 }} value={tahsilDzlForm.tahsil_tarihi || ''}
                  onChange={(e) => setTahsilDzlForm({ ...tahsilDzlForm, tahsil_tarihi: e.target.value })} />
              </FG>
            </div>
            <div className="col-12">
              <FG label="Tutar" zorunlu>
                <div className="input-group">
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="0,00"
                    value={tahsilDzlForm.tutarStr || ''}
                    onChange={(e) => setTahsilDzlForm({ ...tahsilDzlForm, tutarStr: formatParaInput(e.target.value) })} />
                  <span className="input-group-text">₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(13,27,46,0.98)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button style={{ minHeight: 44, padding: '0 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }} onClick={() => setTahsilDzlModal(false)}>İptal</button>
          <button style={{ minHeight: 44, padding: '0 28px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }} onClick={tahsilDzlKaydet}>
            <i className="bi bi-floppy me-2" />Güncelle
          </button>
        </div>
      </Modal>

      {/* ─── Ciro Düzenle Modalı ────────────────────────────────────────────── */}
      <Modal open={ciroDzlModal} onClose={() => setCiroDzlModal(false)} scrollable>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(146,64,14,0.07))', borderBottom: '2px solid rgba(217,119,6,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#d97706,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(217,119,6,0.35)', flexShrink: 0 }}>
              <i className="bi bi-pencil-square" style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Cirolanan Evrak Düzenle</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Ciro bilgilerini güncelle</div>
            </div>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', width: 36, height: 36, borderRadius: 10, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCiroDzlModal(false)}>
            <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
          </button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div className="row g-3">
            <div className="col-md-6">
              <FG label="Asıl Firma (Müşteri)" zorunlu>
                <AutoComplete value={ciroDzlForm.asil_firma || ''}
                  onChange={(v) => setCiroDzlForm({ ...ciroDzlForm, asil_firma: v, cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Müşteri firması..." id="cd-firma" />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Teslim Edilen Yer">
                <AutoComplete value={ciroDzlForm.teslim_yeri || ''}
                  onChange={(v) => setCiroDzlForm({ ...ciroDzlForm, teslim_yeri: v, ciro_edilen_cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Teslim edilen firma..." id="cd-teslim" />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Evrak No">
                <input className="form-control" style={{ minHeight: 44 }} value={ciroDzlForm.evrak_no || ''}
                  onChange={(e) => setCiroDzlForm({ ...ciroDzlForm, evrak_no: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Evrak Tipi">
                <select className="form-select" style={{ minHeight: 44 }} value={ciroDzlForm.tur || 'Müşteri Çeki'}
                  onChange={(e) => setCiroDzlForm({ ...ciroDzlForm, tur: e.target.value })}>
                  <option>Müşteri Çeki</option>
                  <option>Müşteri Senedi</option>
                </select>
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Vade Tarihi" zorunlu>
                <input type="date" className="form-control" style={{ minHeight: 44 }} value={ciroDzlForm.vade_tarihi || ''}
                  onChange={(e) => setCiroDzlForm({ ...ciroDzlForm, vade_tarihi: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Ciro Tarihi">
                <input type="date" className="form-control" style={{ minHeight: 44 }} value={ciroDzlForm.ciro_tarihi || ''}
                  onChange={(e) => setCiroDzlForm({ ...ciroDzlForm, ciro_tarihi: e.target.value })} />
              </FG>
            </div>
            <div className="col-12">
              <FG label="Tutar" zorunlu>
                <div className="input-group">
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="0,00"
                    value={ciroDzlForm.tutarStr || ''}
                    onChange={(e) => setCiroDzlForm({ ...ciroDzlForm, tutarStr: formatParaInput(e.target.value) })} />
                  <span className="input-group-text">₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(13,27,46,0.98)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button style={{ minHeight: 44, padding: '0 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }} onClick={() => setCiroDzlModal(false)}>İptal</button>
          <button style={{ minHeight: 44, padding: '0 28px', background: 'linear-gradient(135deg,#d97706,#b45309)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(217,119,6,0.3)' }} onClick={ciroDzlKaydet}>
            <i className="bi bi-floppy me-2" />Güncelle
          </button>
        </div>
      </Modal>

    </div>
  )
}
