/**
 * CekSenet.jsx — Çek & Senet Yönetimi
 * 5 Tab: Dashboard | Portföydeki | Tahsildeki | Kendi Çekimiz | Cirolanan
 * Bootstrap 5 + Saf React | Finans Kalesi
 * ⚠️  Mock veri aşaması — gerçek API bağlantısı sonraki oturumda yapılacak
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const BANKALAR = [
  'Ziraat Bankası', 'Garanti BBVA', 'İş Bankası', 'Yapı Kredi',
  'Halkbank', 'Vakıfbank', 'TEB', 'QNB Finansbank', 'Akbank', 'DenizBank',
]

const MOCK_CARILER_ALICI = [
  'ABC Ticaret A.Ş.', 'XYZ Demir Ltd.', 'DEF Metal San.',
  'GHI Yapı Malz.', 'JKL Hırdavat', 'PQR Çelik',
]

const MOCK_CARILER_SATICI = [
  'STU Çelik A.Ş.', 'VWX Hırdavat', 'YZA Demir',
  'MNO Yapı', 'BCD Demir Ltd.', 'EFG Metal San.',
]

const SON_6_AY = [
  { ay: 'Eki 2025', tahsil: 45000, odeme: 32000 },
  { ay: 'Kas 2025', tahsil: 38500, odeme: 28000 },
  { ay: 'Ara 2025', tahsil: 62000, odeme: 41000 },
  { ay: 'Oca 2026', tahsil: 28000, odeme: 35000 },
  { ay: 'Şub 2026', tahsil: 51500, odeme: 29000 },
  { ay: 'Mar 2026', tahsil: 74000, odeme: 44000 },
]

// ─── Mock Başlangıç Verileri ──────────────────────────────────────────────────
const PORTFOY_INIT = [
  { id: 1, vade_tarihi: '2026-03-20', islem_tarihi: '2026-02-15', tutar: 15000, firma_adi: 'ABC Ticaret A.Ş.', asil_borclu: 'Ahmet Yılmaz',  tur: 'Müşteri Çeki',  banka: 'Ziraat Bankası', evrak_no: 'ÇK-2026-001' },
  { id: 2, vade_tarihi: '2026-04-10', islem_tarihi: '2026-02-20', tutar: 25000, firma_adi: 'XYZ Demir Ltd.',   asil_borclu: 'Mehmet Kaya',    tur: 'Müşteri Senedi', banka: '',              evrak_no: 'SN-2026-001' },
  { id: 3, vade_tarihi: '2026-03-12', islem_tarihi: '2026-03-01', tutar: 8500,  firma_adi: 'DEF Metal San.',   asil_borclu: 'Ayşe Demir',     tur: 'Müşteri Çeki',  banka: 'Garanti BBVA',  evrak_no: 'ÇK-2026-002' },
  { id: 4, vade_tarihi: '2026-05-01', islem_tarihi: '2026-03-10', tutar: 42000, firma_adi: 'GHI Yapı Malz.',  asil_borclu: 'Ali Yıldız',      tur: 'Müşteri Çeki',  banka: 'İş Bankası',    evrak_no: 'ÇK-2026-003' },
]

const TAHSIL_INIT = [
  { id: 5, vade_tarihi: '2026-03-25', tahsil_tarihi: '2026-03-01', tutar: 12000, firma_adi: 'JKL Hırdavat', asil_borclu: 'Can Öztürk',   evrak_no: 'ÇK-2026-004', tur: 'Müşteri Çeki',  banka: 'İş Bankası'  },
  { id: 6, vade_tarihi: '2026-03-10', tahsil_tarihi: '2026-02-28', tutar: 7500,  firma_adi: 'MNO Yapı',     asil_borclu: 'Hasan Çelik',  evrak_no: 'SN-2026-002', tur: 'Müşteri Senedi', banka: 'Yapı Kredi'  },
  { id: 7, vade_tarihi: '2026-04-15', tahsil_tarihi: '2026-03-05', tutar: 31000, firma_adi: 'PQR Çelik',    asil_borclu: 'Fatma Şahin', evrak_no: 'ÇK-2026-005', tur: 'Müşteri Çeki',  banka: 'Akbank'      },
]

const KENDI_INIT = [
  { id: 8,  vade_tarihi: '2026-03-28', islem_tarihi: '2026-02-10', tutar: 20000, firma_adi: 'STU Çelik A.Ş.', asil_borclu: '',            banka: 'Ziraat Bankası', evrak_no: 'KÇ-2026-001', tur: 'Kendi Çekimiz'   },
  { id: 9,  vade_tarihi: '2026-04-05', islem_tarihi: '2026-03-01', tutar: 35000, firma_adi: 'VWX Hırdavat',   asil_borclu: '',            banka: 'Garanti BBVA',   evrak_no: 'KÇ-2026-002', tur: 'Kendi Çekimiz'   },
  { id: 10, vade_tarihi: '2026-03-15', islem_tarihi: '2026-03-05', tutar: 9000,  firma_adi: 'YZA Demir',      asil_borclu: 'Ahmet Yılmaz', banka: 'Halkbank',       evrak_no: 'KS-2026-001', tur: 'Kendi Senedimiz' },
]

const CIRO_INIT = [
  { id: 11, vade_tarihi: '2026-04-20', ciro_tarihi: '2026-03-05', tutar: 18000, asil_firma: 'ABC Ticaret A.Ş.', teslim_yeri: 'STU Çelik A.Ş.', evrak_no: 'ÇK-2026-006', tur: 'Müşteri Çeki'   },
  { id: 12, vade_tarihi: '2026-03-30', ciro_tarihi: '2026-03-08', tutar: 11000, asil_firma: 'XYZ Demir Ltd.',   teslim_yeri: 'VWX Hırdavat',   evrak_no: 'ÇK-2026-007', tur: 'Müşteri Çeki'   },
  { id: 13, vade_tarihi: '2026-05-10', ciro_tarihi: '2026-03-10', tutar: 27500, asil_firma: 'DEF Metal San.',   teslim_yeri: 'YZA Demir',      evrak_no: 'SN-2026-003', tur: 'Müşteri Senedi' },
]

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
  if (gun < 0) return { color: '#dc3545', fontWeight: 700 }
  if (gun <= 3) return { color: '#d97706', fontWeight: 700 }
  return {}
}

function toplam(liste, alan = 'tutar') {
  return liste.reduce((s, i) => s + (i[alan] || 0), 0)
}

// ─── Form Başlangıç Durumları ─────────────────────────────────────────────────
const portfoyBosluk = () => ({
  tur: 'Müşteri Çeki', firma_adi: '', asil_borclu: '',
  evrak_no: '', banka: '', vade_tarihi: '', islem_tarihi: bugunStr(), tutarStr: '',
})
const kendiBosluk = () => ({
  tur: 'Kendi Çekimiz', firma_adi: '', asil_borclu: '',
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
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1040 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{
          width: '100%', maxWidth: maxW,
          maxHeight: scrollable ? '90vh' : 'auto',
          display: 'flex', flexDirection: 'column',
          borderRadius: 20, overflow: scrollable ? 'auto' : 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)', background: '#fff',
        }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}

function OnayModal({ open, onClose, onOnayla, baslik, mesaj, ikon, btnRenk = '#dc3545', btnYazi = 'Evet, Devam Et' }) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div style={{ padding: '28px 28px 0', textAlign: 'center' }}>
        {ikon && <div style={{ fontSize: 36, marginBottom: 12 }}>{ikon}</div>}
        <h6 style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>{baslik}</h6>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 0 }}>{mesaj}</p>
      </div>
      <div style={{ padding: '20px 28px 28px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-outline-secondary" onClick={onClose} style={{ minHeight: 44, padding: '0 20px' }}>İptal</button>
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
          background: '#fff', border: '1px solid #dee2e6', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', listStyle: 'none',
          padding: '4px 0', margin: 0, maxHeight: 200, overflowY: 'auto',
        }}>
          {filtered.map(o => (
            <li
              key={o}
              style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13 }}
              onMouseDown={() => { onChange(o); setAcik(false) }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
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
        className="form-select form-select-sm"
        style={{ width: 120, minHeight: 38 }}
        value={filtre.ay}
        disabled={filtre.tumZamanlar}
        onChange={(e) => setFiltre({ ...filtre, ay: +e.target.value, tumZamanlar: false })}
      >
        {AYLAR.map((a, i) => <option key={i} value={i + 1}>{a}</option>)}
      </select>
      <select
        className="form-select form-select-sm"
        style={{ width: 90, minHeight: 38 }}
        value={filtre.yil}
        disabled={filtre.tumZamanlar}
        onChange={(e) => setFiltre({ ...filtre, yil: +e.target.value, tumZamanlar: false })}
      >
        {YILLAR.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <button
        className={`btn btn-sm ${filtre.tumZamanlar ? 'btn-secondary' : 'btn-outline-secondary'}`}
        style={{ minHeight: 38, padding: '0 14px' }}
        onClick={() => setFiltre({ ...filtre, tumZamanlar: !filtre.tumZamanlar })}
      >
        Tüm Zamanlar
      </button>
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
          <div key={g} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{g}</div>
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
                background: isBugun ? '#eef2f7' : gun ? '#fff' : 'transparent',
                border: isBugun ? '1.5px solid #123F59' : gun ? '1px solid #e9ecef' : 'none',
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
                <span style={{ fontSize: 12, fontWeight: isBugun ? 700 : 400, color: isBugun ? '#123F59' : '#495057' }}>
                  {gun}
                </span>
              )}
              {gun && hasEvt && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {evt.t.length > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#198754' }} />}
                  {evt.o.length > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc3545' }} />}
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
    }}>
      {children}
    </div>
  )
}

// ─── Form Grubu ───────────────────────────────────────────────────────────────
function FG({ label, zorunlu, kritik, children }) {
  return (
    <div className="mb-3">
      <label className="form-label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
        {label}
        {zorunlu && <span className="text-danger ms-1">*</span>}
        {kritik  && <span className="text-danger ms-1" style={{ fontSize: 11 }}>(Kritik Alan)</span>}
      </label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana Bileşen
// ─────────────────────────────────────────────────────────────────────────────
export default function CekSenet() {
  const nextId = useRef(20)

  // ─ Tab & Filtre ─────────────────────────────────────────────────────────────
  const [aktifTab, setAktifTab] = useState(0)
  const [filtre, setFiltre] = useState({
    ay: new Date().getMonth() + 1,
    yil: new Date().getFullYear(),
    tumZamanlar: false,
  })

  // ─ Veri ─────────────────────────────────────────────────────────────────────
  const [portfoy, setPortfoy] = useState(PORTFOY_INIT)
  const [tahsil,  setTahsil]  = useState(TAHSIL_INIT)
  const [kendi,   setKendi]   = useState(KENDI_INIT)
  const [ciro,    setCiro]    = useState(CIRO_INIT)

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
  const [cirolaForm,      setCirolaForm]      = useState({ firma: '', tarih: bugunStr() })
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

  const fP = filtrele(portfoy); const fT = filtrele(tahsil)
  const fK = filtrele(kendi);   const fC = filtrele(ciro)

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

  // ─ Tab Sayıları ──────────────────────────────────────────────────────────────
  const TABS = [
    { label: 'Dashboard',     renk: '#0f172a', count: null            },
    { label: 'Portföydeki',   renk: '#123F59', count: portfoy.length  },
    { label: 'Tahsildeki',    renk: '#198754', count: tahsil.length   },
    { label: 'Kendi Çekimiz', renk: '#dc3545', count: kendi.length    },
    { label: 'Cirolanan',     renk: '#d97706', count: ciro.length     },
  ]

  // ─ Portföy İşlem Fonksiyonları ───────────────────────────────────────────────
  const portfoyKaydet = () => {
    if (!portfoyForm.firma_adi || !portfoyForm.vade_tarihi || !portfoyForm.tutarStr) {
      toast.error('Firma adı, vade tarihi ve tutar zorunludur.'); return
    }
    const tutar = parseParaInput(portfoyForm.tutarStr)
    if (tutar <= 0) { toast.error('Geçerli bir tutar giriniz.'); return }

    if (portfoyDzlId) {
      setPortfoy(p => p.map(i => i.id === portfoyDzlId ? { ...i, ...portfoyForm, tutar } : i))
      toast.success('Evrak güncellendi.')
    } else {
      setPortfoy(p => [{ ...portfoyForm, tutar, id: ++nextId.current }, ...p])
      toast.success('Evrak portföye eklendi.')
    }
    setPortfoyModal(false); setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null)
  }

  const portfoyDzlAc = (item) => {
    setPortfoyForm({
      tur: item.tur, firma_adi: item.firma_adi, asil_borclu: item.asil_borclu,
      evrak_no: item.evrak_no, banka: item.banka || '',
      vade_tarihi: item.vade_tarihi, islem_tarihi: item.islem_tarihi,
      tutarStr: formatParaInput(String(item.tutar)),
    })
    setPortfoyDzlId(item.id); setPortfoyModal(true)
  }

  const portfoySil = (id) => setOnay({
    baslik: 'Evrak Silinsin mi?', mesaj: 'Bu evrak kalıcı olarak silinecektir.', ikon: '🗑️',
    btnRenk: '#dc3545', btnYazi: 'Evet, Sil',
    islem: () => { setPortfoy(p => p.filter(i => i.id !== id)); toast.success('Evrak silindi.'); setOnay(null) },
  })

  const tahsileVer = () => {
    if (!tahsileForm.banka || !tahsileForm.tarih) { toast.error('Banka adı ve tarih zorunludur.'); return }
    const item = portfoy.find(i => i.id === tahsileId)
    if (!item) return
    setTahsil(p => [{ ...item, tahsil_tarihi: tahsileForm.tarih, banka: tahsileForm.banka }, ...p])
    setPortfoy(p => p.filter(i => i.id !== tahsileId))
    setTahsileModal(false); setTahsileForm({ banka: '', tarih: bugunStr() })
    toast.success('Evrak tahsile verildi.')
  }

  const cirolaKaydet = () => {
    if (!cirolaForm.firma || !cirolaForm.tarih) { toast.error('Firma adı ve tarih zorunludur.'); return }
    const item = portfoy.find(i => i.id === cirolaId)
    if (!item) return
    setCiro(p => [{
      id: item.id, vade_tarihi: item.vade_tarihi, ciro_tarihi: cirolaForm.tarih,
      tutar: item.tutar, asil_firma: item.firma_adi, teslim_yeri: cirolaForm.firma,
      evrak_no: item.evrak_no, tur: item.tur,
    }, ...p])
    setPortfoy(p => p.filter(i => i.id !== cirolaId))
    setCirolaModal(false); setCirolaForm({ firma: '', tarih: bugunStr() })
    toast.success('Evrak cirolandı.')
  }

  // ─ Tahsil İşlem Fonksiyonları ─────────────────────────────────────────────
  const tahsilOdendi = (id) => setOnay({
    baslik: 'Ödendi Olarak İşaretlensin mi?',
    mesaj: 'Bu evrak tahsil edilmiş sayılacak ve arşive taşınacaktır.', ikon: '✅',
    btnRenk: '#198754', btnYazi: 'Evet, Ödendi!',
    islem: () => { setTahsil(p => p.filter(i => i.id !== id)); toast.success('Evrak tahsil edildi, arşive taşındı.'); setOnay(null) },
  })

  const tahsilIade = (id) => setOnay({
    baslik: 'Portföye İade Edilsin mi?', mesaj: 'Bu evrak portföydeki listeye geri taşınacaktır.', ikon: '↩️',
    btnRenk: '#123F59', btnYazi: 'Evet, İade Et',
    islem: () => {
      const item = tahsil.find(i => i.id === id)
      if (item) {
        setPortfoy(p => [{ ...item, islem_tarihi: item.tahsil_tarihi }, ...p])
        setTahsil(p => p.filter(i => i.id !== id))
        toast.success('Evrak portföye iade edildi.')
      }
      setOnay(null)
    },
  })

  const tahsilDzlAc = (item) => {
    setTahsilDzlForm({
      tur: item.tur, firma_adi: item.firma_adi, asil_borclu: item.asil_borclu,
      evrak_no: item.evrak_no, banka: item.banka || '',
      vade_tarihi: item.vade_tarihi, tahsil_tarihi: item.tahsil_tarihi,
      tutarStr: formatParaInput(String(item.tutar)),
    })
    setTahsilDzlId(item.id); setTahsilDzlModal(true)
  }

  const tahsilDzlKaydet = () => {
    const tutar = parseParaInput(tahsilDzlForm.tutarStr)
    if (!tahsilDzlForm.firma_adi || !tahsilDzlForm.vade_tarihi || tutar <= 0) {
      toast.error('Firma adı, vade tarihi ve tutar zorunludur.'); return
    }
    setTahsil(p => p.map(i => i.id === tahsilDzlId ? { ...i, ...tahsilDzlForm, tutar } : i))
    setTahsilDzlModal(false); toast.success('Evrak güncellendi.')
  }

  // ─ Kendi İşlem Fonksiyonları ──────────────────────────────────────────────
  const kendiKaydet = () => {
    if (!kendiForm.firma_adi || !kendiForm.vade_tarihi || !kendiForm.banka || !kendiForm.tutarStr) {
      toast.error('Firma, vade tarihi, banka ve tutar zorunludur.'); return
    }
    const tutar = parseParaInput(kendiForm.tutarStr)
    if (tutar <= 0) { toast.error('Geçerli bir tutar giriniz.'); return }

    if (kendiDzlId) {
      setKendi(p => p.map(i => i.id === kendiDzlId ? { ...i, ...kendiForm, tutar } : i))
      toast.success('Evrak güncellendi.')
    } else {
      setKendi(p => [{ ...kendiForm, tutar, id: ++nextId.current }, ...p])
      toast.success('Borç evrakı eklendi.')
    }
    setKendiModal(false); setKendiForm(kendiBosluk()); setKendiDzlId(null)
  }

  const kendiDzlAc = (item) => {
    setKendiForm({
      tur: item.tur, firma_adi: item.firma_adi, asil_borclu: item.asil_borclu || '',
      evrak_no: item.evrak_no, banka: item.banka,
      vade_tarihi: item.vade_tarihi, islem_tarihi: item.islem_tarihi,
      tutarStr: formatParaInput(String(item.tutar)),
    })
    setKendiDzlId(item.id); setKendiModal(true)
  }

  const kendiOdendi = (id) => setOnay({
    baslik: 'Ödendi Olarak İşaretlensin mi?', mesaj: 'Bu evrak ödenmiş/kapanmış olarak işaretlenecektir.', ikon: '✅',
    btnRenk: '#198754', btnYazi: 'Evet, Ödendi!',
    islem: () => { setKendi(p => p.filter(i => i.id !== id)); toast.success('Evrak ödendi olarak kapatıldı.'); setOnay(null) },
  })

  const kendiSil = (id) => setOnay({
    baslik: 'Evrak Silinsin mi?', mesaj: 'Bu evrak kalıcı olarak silinecektir.', ikon: '🗑️',
    btnRenk: '#dc3545', btnYazi: 'Evet, Sil',
    islem: () => { setKendi(p => p.filter(i => i.id !== id)); toast.success('Evrak silindi.'); setOnay(null) },
  })

  // ─ Ciro İşlem Fonksiyonları ───────────────────────────────────────────────
  const ciroIade = (id) => setOnay({
    baslik: 'Portföye İade Edilsin mi?', mesaj: 'Bu evrak portföydeki listeye geri taşınacaktır.', ikon: '↩️',
    btnRenk: '#123F59', btnYazi: 'Evet, İade Et',
    islem: () => {
      const item = ciro.find(i => i.id === id)
      if (item) {
        setPortfoy(p => [{
          id: item.id, vade_tarihi: item.vade_tarihi, islem_tarihi: item.ciro_tarihi,
          tutar: item.tutar, firma_adi: item.asil_firma, asil_borclu: '', tur: item.tur, banka: '', evrak_no: item.evrak_no,
        }, ...p])
        setCiro(p => p.filter(i => i.id !== id))
        toast.success('Evrak portföye iade edildi.')
      }
      setOnay(null)
    },
  })

  const ciroSil = (id) => setOnay({
    baslik: 'Evrak Silinsin mi?', mesaj: 'Bu cirolanan evrak kalıcı olarak silinecektir.', ikon: '🗑️',
    btnRenk: '#dc3545', btnYazi: 'Evet, Sil',
    islem: () => { setCiro(p => p.filter(i => i.id !== id)); toast.success('Evrak silindi.'); setOnay(null) },
  })

  const ciroDzlAc = (item) => {
    setCiroDzlForm({
      vade_tarihi: item.vade_tarihi, ciro_tarihi: item.ciro_tarihi,
      tutarStr: formatParaInput(String(item.tutar)),
      asil_firma: item.asil_firma, teslim_yeri: item.teslim_yeri,
      evrak_no: item.evrak_no, tur: item.tur,
    })
    setCiroDzlId(item.id); setCiroDzlModal(true)
  }

  const ciroDzlKaydet = () => {
    const tutar = parseParaInput(ciroDzlForm.tutarStr)
    if (!ciroDzlForm.asil_firma || !ciroDzlForm.vade_tarihi || tutar <= 0) {
      toast.error('Firma adı, vade tarihi ve tutar zorunludur.'); return
    }
    setCiro(p => p.map(i => i.id === ciroDzlId ? { ...i, ...ciroDzlForm, tutar } : i))
    setCiroDzlModal(false); toast.success('Evrak güncellendi.')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ─── Sayfa Başlığı ──────────────────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, #123F59, #1a5b80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="bi bi-file-earmark-text" style={{ color: '#fff', fontSize: 20 }} />
        </div>
        <div>
          <h4 className="mb-0" style={{ fontWeight: 800, color: '#0f172a' }}>Çek / Senet</h4>
          <p className="mb-0" style={{ fontSize: 12, color: '#94a3b8' }}>Evrak takibi, portföy ve nakit akış yönetimi</p>
        </div>
      </div>

      {/* ─── Ana Kart ───────────────────────────────────────────────────────── */}
      <div className="premium-card p-0 overflow-hidden" style={{ borderRadius: 16 }}>

        {/* Tab Başlıkları */}
        <div className="d-flex border-bottom overflow-auto" style={{ background: '#fff' }}>
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setAktifTab(i)}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                padding: '14px 18px', fontSize: 13, whiteSpace: 'nowrap',
                fontWeight: aktifTab === i ? 700 : 500,
                color: aktifTab === i ? tab.renk : '#64748b', minHeight: 48,
                borderBottom: aktifTab === i ? `2.5px solid ${tab.renk}` : '2.5px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="badge rounded-pill ms-1" style={{
                  background: aktifTab === i ? tab.renk : '#e2e8f0',
                  color: aktifTab === i ? '#fff' : '#64748b', fontSize: 10,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab İçerikleri */}
        <div style={{ padding: '20px 20px 24px' }}>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 0 — DASHBOARD
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 0 && (
            <div>

              {/* Üst filtre */}
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Nakit Akış Özeti</span>
                <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
              </div>

              {/* Hero Banner */}
              <Banner gradient="linear-gradient(135deg, #0f172a, #1a3a6b)">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      {filtre.tumZamanlar ? 'Tüm Zamanlar' : new Date(filtre.yil, filtre.ay - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </div>
                    <h5 style={{ fontWeight: 800, marginBottom: 6 }}>Nakit Akış Özeti</h5>
                    <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 0 }}>
                      Tahsildeki evraklardan kendi ödeme evraklarınız çıkarılmıştır.
                    </p>
                  </div>
                  <div className="text-end">
                    <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>NET DURUM</div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: netDurum >= 0 ? '#4ade80' : '#f87171', lineHeight: 1 }}>
                      {TL(netDurum)}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                      Tahsilde: <strong>{TL(tahsilToplam)}</strong> — Ödenecek: <strong>{TL(kendiToplam)}</strong>
                    </div>
                  </div>
                </div>
              </Banner>

              {/* 4 Özet Kart */}
              <div className="row g-3 mb-4">
                {[
                  { label: 'Tahsildeki Evraklar',          tutar: tahsilToplam,  adet: fT.length, renk: '#198754', icon: 'bi-arrow-down-circle-fill', tab: 2 },
                  { label: 'Ödenecek Kendi Evraklarımız',  tutar: kendiToplam,   adet: fK.length, renk: '#dc3545', icon: 'bi-arrow-up-circle-fill',   tab: 3 },
                  { label: 'Portföydeki Evraklar',         tutar: portfoyToplam, adet: fP.length, renk: '#123F59', icon: 'bi-wallet2',                tab: 1 },
                  { label: 'Cirolanan Evraklar',           tutar: ciroToplam,    adet: fC.length, renk: '#d97706', icon: 'bi-arrow-left-right',       tab: 4 },
                ].map((k, i) => (
                  <div key={i} className="col-6 col-xl-3">
                    <div
                      className="premium-card h-100"
                      style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                      onClick={() => setAktifTab(k.tab)}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: k.renk + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`bi ${k.icon}`} style={{ color: k.renk, fontSize: 15 }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{TL(k.tutar)}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{k.adet} kayıt</div>
                      <div style={{ fontSize: 11, color: k.renk, fontWeight: 600, marginTop: 8 }}>
                        Detay gör <i className="bi bi-arrow-right" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aylık Karşılaştırma Tablosu */}
              <div className="premium-card mb-4">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                  <i className="bi bi-bar-chart-fill me-2" style={{ color: '#123F59' }} />
                  Son 6 Aylık Karşılaştırma
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                        <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Ay</th>
                        <th style={{ fontWeight: 600, color: '#198754', border: 'none', padding: '10px 12px' }}>Tahsilat</th>
                        <th style={{ fontWeight: 600, color: '#dc3545', border: 'none', padding: '10px 12px' }}>Ödeme</th>
                        <th style={{ fontWeight: 600, color: '#0f172a', border: 'none', padding: '10px 12px' }}>Net</th>
                        <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SON_6_AY.map((r, i) => {
                        const net = r.tahsil - r.odeme
                        return (
                          <tr key={i}>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.ay}</td>
                            <td style={{ padding: '10px 12px', color: '#198754', fontWeight: 600 }}>{TL(r.tahsil)}</td>
                            <td style={{ padding: '10px 12px', color: '#dc3545', fontWeight: 600 }}>{TL(r.odeme)}</td>
                            <td style={{ padding: '10px 12px', color: net >= 0 ? '#198754' : '#dc3545', fontWeight: 700 }}>{TL(net)}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span className="badge rounded-pill" style={{ background: net >= 0 ? '#d1fae5' : '#fee2e2', color: net >= 0 ? '#065f46' : '#991b1b', fontSize: 11 }}>
                                {net >= 0 ? 'Pozitif' : 'Negatif'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Geciken Uyarılar */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="premium-card h-100" style={{ borderLeft: '4px solid #dc3545' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill" style={{ color: '#dc3545', fontSize: 16 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#dc3545' }}>
                        Geciken Ödemeler ({gecikenKendi.length})
                      </span>
                    </div>
                    {gecikenKendi.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 0 }}>Geciken ödeme bulunmuyor.</p>
                    ) : (
                      gecikenKendi.map(item => (
                        <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.firma_adi}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Vade: {tarihFmt(item.vade_tarihi)} — {gunFark(item.vade_tarihi)} gün gecikmiş</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#dc3545' }}>{TL(item.tutar)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="premium-card h-100" style={{ borderLeft: '4px solid #d97706' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill" style={{ color: '#d97706', fontSize: 16 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#d97706' }}>
                        Geciken Tahsilatlar ({gecikenTahsil.length})
                      </span>
                    </div>
                    {gecikenTahsil.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 0 }}>Geciken tahsilat bulunmuyor.</p>
                    ) : (
                      gecikenTahsil.map(item => (
                        <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.firma_adi}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Vade: {tarihFmt(item.vade_tarihi)} — {gunFark(item.vade_tarihi)} gün gecikmiş</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>{TL(item.tutar)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Aylık Takvim */}
              <div className="premium-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    <i className="bi bi-calendar3 me-2" style={{ color: '#123F59' }} />
                    {new Date(filtre.yil, filtre.ay - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} Takvimi
                  </span>
                  <div className="d-flex gap-3">
                    <span style={{ fontSize: 12, color: '#64748b' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#198754', marginRight: 4 }} />Tahsilat</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#dc3545', marginRight: 4 }} />Ödeme</span>
                  </div>
                </div>
                <AylikTakvim ay={filtre.ay} yil={filtre.yil} tahsilEvents={takvimTahsil} odemeEvents={takvimOdeme} />
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1 — PORTFÖYDEKİ EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 1 && (
            <div>
              {/* Banner */}
              <Banner gradient="linear-gradient(135deg, #123F59, #1a5b80)">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Toplam Portföy</div>
                    <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{TL(portfoyToplam)}</div>
                    <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>{fP.length} kayıt</div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </Banner>

              {/* Tablo Başlığı */}
              <div className="d-flex justify-content-end mb-3">
                <button
                  className="btn btn-sm text-white"
                  style={{ background: '#123F59', minHeight: 44, padding: '0 18px', fontWeight: 600 }}
                  onClick={() => { setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null); setPortfoyModal(true) }}
                >
                  <i className="bi bi-plus-circle-fill me-1" /> Yeni Evrak Ekle
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Vade Tarihi</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>İşlem Tarihi</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Tutar</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Firma / Asıl Borçlu</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Tür / Banka</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Evrak No</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fP.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fP.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px', ...vadeStil(item.vade_tarihi) }}>{tarihFmt(item.vade_tarihi)}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{tarihFmt(item.islem_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.firma_adi}</div>
                          {item.asil_borclu && <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.asil_borclu}</div>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ color: '#123F59', fontWeight: 600 }}>{item.tur}</div>
                          {item.banka && <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.banka}</div>}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{item.evrak_no}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-sm text-white" style={{ background: '#198754', minHeight: 36, padding: '0 10px', fontSize: 12 }}
                              onClick={() => { setTahsileId(item.id); setTahsileForm({ banka: '', tarih: bugunStr() }); setTahsileModal(true) }}>
                              Tahsile Ver
                            </button>
                            <button className="btn btn-sm text-white" style={{ background: '#d97706', minHeight: 36, padding: '0 10px', fontSize: 12 }}
                              onClick={() => { setCirolaId(item.id); setCirolaForm({ firma: '', tarih: bugunStr() }); setCirolaModal(true) }}>
                              Cirola
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" style={{ minHeight: 36, padding: '0 10px' }} onClick={() => portfoyDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" style={{ minHeight: 36, padding: '0 10px' }} onClick={() => portfoySil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2 — TAHSİLDEKİ EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 2 && (
            <div>
              <Banner gradient="linear-gradient(135deg, #198754, #0d6e45)">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Bekleyen Vade</div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{TL(tahsilBekleyen)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Vadesi Geçen</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#fde68a' }}>{TL(tahsilGecmis)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Toplam Tahsilde</div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{TL(tahsilToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </Banner>

              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Ödeme Tarihi (Vade)</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Tahsile Veriş</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Tutar</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Firma / Asıl Borçlu</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Evrak No / Türü</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Tahsildeki Banka</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fT.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fT.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px', ...vadeStil(item.vade_tarihi) }}>{tarihFmt(item.vade_tarihi)}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{tarihFmt(item.tahsil_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600 }}>{item.firma_adi}</div>
                          {item.asil_borclu && <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.asil_borclu}</div>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{item.evrak_no}</div>
                          <div style={{ fontSize: 11, color: '#198754', fontWeight: 600 }}>{item.tur}</div>
                        </td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{item.banka || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-sm text-white" style={{ background: '#198754', minHeight: 36, padding: '0 10px', fontSize: 12 }}
                              onClick={() => tahsilOdendi(item.id)}>
                              <i className="bi bi-check-lg me-1" />Ödendi
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" style={{ minHeight: 36, padding: '0 10px', fontSize: 12 }}
                              onClick={() => tahsilIade(item.id)}>
                              <i className="bi bi-arrow-counterclockwise me-1" />İade Et
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" style={{ minHeight: 36, padding: '0 10px' }}
                              onClick={() => tahsilDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3 — ÖDENECEK KENDİ EVRAKLARIMız
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 3 && (
            <div>
              <Banner gradient="linear-gradient(135deg, #dc3545, #b02a37)">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Bekleyen Borç</div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{TL(kendiBekleyen)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Vadesi Geçen</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#fde68a' }}>{TL(kendiGecmis)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Toplam Çıkış</div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{TL(kendiToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </Banner>

              <div className="d-flex justify-content-end mb-3">
                <button
                  className="btn btn-sm text-white"
                  style={{ background: '#dc3545', minHeight: 44, padding: '0 18px', fontWeight: 600 }}
                  onClick={() => { setKendiForm(kendiBosluk()); setKendiDzlId(null); setKendiModal(true) }}
                >
                  <i className="bi bi-plus-circle-fill me-1" /> Yeni Borç Ekle
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Ödeme Tarihi (Vade)</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>İşlem Tarihi</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Tutar</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Firma (Ödeme Yapılan)</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Banka Adı</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Evrak No</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fK.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fK.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px', ...vadeStil(item.vade_tarihi) }}>{tarihFmt(item.vade_tarihi)}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{tarihFmt(item.islem_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#dc3545' }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{item.firma_adi}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{item.banka}</td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{item.evrak_no}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-sm text-white" style={{ background: '#198754', minHeight: 36, padding: '0 10px', fontSize: 12 }}
                              onClick={() => kendiOdendi(item.id)}>
                              <i className="bi bi-check-lg me-1" />Ödendi
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" style={{ minHeight: 36, padding: '0 10px' }} onClick={() => kendiDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" style={{ minHeight: 36, padding: '0 10px' }} onClick={() => kendiSil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4 — CİROLANAN EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 4 && (
            <div>
              <Banner gradient="linear-gradient(135deg, #d97706, #b45309)">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Bekleyen Vade</div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{TL(ciroBekleyen)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Vadesi Geçen</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#fef3c7' }}>{TL(ciroGecmis)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Toplam Cirolanan</div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{TL(ciroToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </Banner>

              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Ödeme Tarihi (Vade)</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Ciro Tarihi</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Tutar</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Asıl Firma (Müşteri)</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Teslim Edilen Yer</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>Evrak No / Türü</th>
                      <th style={{ fontWeight: 600, color: '#64748b', border: 'none', padding: '10px 12px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fC.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fC.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px', ...vadeStil(item.vade_tarihi) }}>{tarihFmt(item.vade_tarihi)}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{tarihFmt(item.ciro_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#d97706' }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{item.asil_firma}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{item.teslim_yeri}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{item.evrak_no}</div>
                          <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>{item.tur}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-sm btn-outline-secondary" style={{ minHeight: 36, padding: '0 10px', fontSize: 12 }}
                              onClick={() => ciroIade(item.id)}>
                              <i className="bi bi-arrow-counterclockwise me-1" />İade Et
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" style={{ minHeight: 36, padding: '0 10px' }} onClick={() => ciroDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" style={{ minHeight: 36, padding: '0 10px' }} onClick={() => ciroSil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
        <div style={{ padding: '22px 24px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div className="d-flex justify-content-between align-items-center mb-0 pb-4">
            <h6 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {portfoyDzlId ? 'Evrak Düzenle' : 'Yeni Evrak Ekle — Portföy'}
            </h6>
            <button className="btn-close" onClick={() => { setPortfoyModal(false); setPortfoyDzlId(null) }} />
          </div>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div className="row g-3">
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
                <AutoComplete value={portfoyForm.firma_adi} onChange={(v) => setPortfoyForm({ ...portfoyForm, firma_adi: v })}
                  options={MOCK_CARILER_ALICI} placeholder="Cari seç veya yaz..." id="pf-firma" required />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Asıl Borçlu">
                <input className="form-control" style={{ minHeight: 44 }} value={portfoyForm.asil_borclu}
                  placeholder="Asıl borçlu adı"
                  onChange={(e) => setPortfoyForm({ ...portfoyForm, asil_borclu: e.target.value })} />
              </FG>
            </div>
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
                <input type="date" className="form-control" style={{ minHeight: 44, borderColor: '#dc3545' }}
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
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="0,00"
                    value={portfoyForm.tutarStr}
                    onChange={(e) => setPortfoyForm({ ...portfoyForm, tutarStr: formatParaInput(e.target.value) })} />
                  <span className="input-group-text" style={{ background: '#f8f9fa', fontWeight: 700 }}>₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }}
            onClick={() => { setPortfoyModal(false); setPortfoyDzlId(null) }}>İptal</button>
          <button className="btn text-white" style={{ background: '#123F59', minHeight: 44, padding: '0 24px', fontWeight: 600 }}
            onClick={portfoyKaydet}>Kaydet</button>
        </div>
      </Modal>

      {/* ─── Tahsile Ver Modalı ─────────────────────────────────────────────── */}
      <Modal open={tahsileModal} onClose={() => setTahsileModal(false)} size="sm">
        <div style={{ background: 'linear-gradient(135deg, #198754, #0d6e45)', padding: '18px 22px', borderRadius: '20px 20px 0 0' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h6 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>Tahsile Ver</h6>
            <button className="btn-close btn-close-white" onClick={() => setTahsileModal(false)} />
          </div>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <FG label="Banka Adı" zorunlu>
            <AutoComplete value={tahsileForm.banka} onChange={(v) => setTahsileForm({ ...tahsileForm, banka: v })}
              options={BANKALAR} placeholder="Banka seç veya yaz..." id="tv-banka" required />
          </FG>
          <FG label="İşlem Tarihi" zorunlu>
            <input type="date" className="form-control" style={{ minHeight: 44 }}
              value={tahsileForm.tarih}
              onChange={(e) => setTahsileForm({ ...tahsileForm, tarih: e.target.value })} />
          </FG>
        </div>
        <div style={{ padding: '0 22px 22px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }} onClick={() => setTahsileModal(false)}>İptal</button>
          <button className="btn text-white" style={{ background: '#198754', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={tahsileVer}>İşlemi Tamamla</button>
        </div>
      </Modal>

      {/* ─── Cirola Modalı ──────────────────────────────────────────────────── */}
      <Modal open={cirolaModal} onClose={() => setCirolaModal(false)} size="sm">
        <div style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', padding: '18px 22px', borderRadius: '20px 20px 0 0' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h6 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>Evrakı Ciroyla</h6>
            <button className="btn-close btn-close-white" onClick={() => setCirolaModal(false)} />
          </div>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <FG label="Teslim Edilecek Firma" zorunlu>
            <AutoComplete value={cirolaForm.firma} onChange={(v) => setCirolaForm({ ...cirolaForm, firma: v })}
              options={MOCK_CARILER_SATICI} placeholder="Firma seç veya yaz..." id="ci-firma" required />
          </FG>
          <FG label="Ciro Tarihi" zorunlu>
            <input type="date" className="form-control" style={{ minHeight: 44 }}
              value={cirolaForm.tarih}
              onChange={(e) => setCirolaForm({ ...cirolaForm, tarih: e.target.value })} />
          </FG>
        </div>
        <div style={{ padding: '0 22px 22px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }} onClick={() => setCirolaModal(false)}>İptal</button>
          <button className="btn text-white" style={{ background: '#d97706', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={cirolaKaydet}>Ciroyu Tamamla</button>
        </div>
      </Modal>

      {/* ─── Kendi Çekimiz: Yeni / Düzenle ─────────────────────────────────── */}
      <Modal open={kendiModal} onClose={() => { setKendiModal(false); setKendiDzlId(null) }} scrollable>
        <div style={{ padding: '22px 24px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div className="d-flex justify-content-between align-items-center mb-0 pb-4">
            <h6 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {kendiDzlId ? 'Evrak Düzenle' : 'Yeni Borç Evrakı Ekle'}
            </h6>
            <button className="btn-close" onClick={() => { setKendiModal(false); setKendiDzlId(null) }} />
          </div>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div className="row g-3">
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
                <AutoComplete value={kendiForm.firma_adi} onChange={(v) => setKendiForm({ ...kendiForm, firma_adi: v })}
                  options={MOCK_CARILER_SATICI} placeholder="Cari seç veya yaz..." id="ke-firma" required />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Asıl Borçlu">
                <input className="form-control" style={{ minHeight: 44 }} value={kendiForm.asil_borclu}
                  placeholder="İsteğe bağlı"
                  onChange={(e) => setKendiForm({ ...kendiForm, asil_borclu: e.target.value })} />
              </FG>
            </div>
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
                <input type="date" className="form-control" style={{ minHeight: 44, borderColor: '#dc3545' }}
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
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="0,00"
                    value={kendiForm.tutarStr}
                    onChange={(e) => setKendiForm({ ...kendiForm, tutarStr: formatParaInput(e.target.value) })} />
                  <span className="input-group-text" style={{ background: '#f8f9fa', fontWeight: 700 }}>₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }}
            onClick={() => { setKendiModal(false); setKendiDzlId(null) }}>İptal</button>
          <button className="btn text-white" style={{ background: '#dc3545', minHeight: 44, padding: '0 24px', fontWeight: 600 }}
            onClick={kendiKaydet}>Kaydet</button>
        </div>
      </Modal>

      {/* ─── Tahsil Düzenle Modalı ──────────────────────────────────────────── */}
      <Modal open={tahsilDzlModal} onClose={() => setTahsilDzlModal(false)} scrollable>
        <div style={{ padding: '22px 24px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div className="d-flex justify-content-between align-items-center mb-0 pb-4">
            <h6 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>Tahsildeki Evrak Düzenle</h6>
            <button className="btn-close" onClick={() => setTahsilDzlModal(false)} />
          </div>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div className="row g-3">
            <div className="col-md-6">
              <FG label="Firma / Müşteri" zorunlu>
                <AutoComplete value={tahsilDzlForm.firma_adi || ''} onChange={(v) => setTahsilDzlForm({ ...tahsilDzlForm, firma_adi: v })}
                  options={MOCK_CARILER_ALICI} placeholder="Cari seç veya yaz..." id="td-firma" />
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
                  <span className="input-group-text" style={{ background: '#f8f9fa', fontWeight: 700 }}>₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }} onClick={() => setTahsilDzlModal(false)}>İptal</button>
          <button className="btn text-white" style={{ background: '#198754', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={tahsilDzlKaydet}>Güncelle</button>
        </div>
      </Modal>

      {/* ─── Ciro Düzenle Modalı ────────────────────────────────────────────── */}
      <Modal open={ciroDzlModal} onClose={() => setCiroDzlModal(false)} scrollable>
        <div style={{ padding: '22px 24px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div className="d-flex justify-content-between align-items-center mb-0 pb-4">
            <h6 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>Cirolanan Evrak Düzenle</h6>
            <button className="btn-close" onClick={() => setCiroDzlModal(false)} />
          </div>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div className="row g-3">
            <div className="col-md-6">
              <FG label="Asıl Firma (Müşteri)" zorunlu>
                <AutoComplete value={ciroDzlForm.asil_firma || ''} onChange={(v) => setCiroDzlForm({ ...ciroDzlForm, asil_firma: v })}
                  options={MOCK_CARILER_ALICI} placeholder="Müşteri firması..." id="cd-firma" />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Teslim Edilen Yer">
                <AutoComplete value={ciroDzlForm.teslim_yeri || ''} onChange={(v) => setCiroDzlForm({ ...ciroDzlForm, teslim_yeri: v })}
                  options={MOCK_CARILER_SATICI} placeholder="Teslim edilen firma..." id="cd-teslim" />
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
                  <span className="input-group-text" style={{ background: '#f8f9fa', fontWeight: 700 }}>₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }} onClick={() => setCiroDzlModal(false)}>İptal</button>
          <button className="btn text-white" style={{ background: '#d97706', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={ciroDzlKaydet}>Güncelle</button>
        </div>
      </Modal>

    </div>
  )
}
