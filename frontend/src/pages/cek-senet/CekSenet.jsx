/**
 * CekSenet.jsx — Çek & Senet Yönetimi
 * 5 Tab: Dashboard | Portföydeki | Tahsildeki | Kendi Çekimiz | Cirolanan
 * Tasarım Sistemi v2 — App.css sınıfları kullanılıyor
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

const vadeSinifi = (tarih) => {
  if (!tarih) return 'vade-normal'
  const fark = (new Date(tarih + 'T00:00:00') - new Date()) / 86400000
  if (fark < 0) return 'vade-gecmis'
  if (fark <= 3) return 'vade-yakin'
  return 'vade-normal'
}

const formatParaInput = (v) => {
  let s = (v || '').replace(/[^0-9,]/g, '')
  const parts = s.split(',')
  if (parts.length > 2) s = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = s.split(',')
  const fmt = (tam || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? fmt + ',' + kesir.slice(0, 2) : fmt
}
const parseParaInput = (f) => parseFloat((f || '').replace(/\./g, '').replace(',', '.')) || 0

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
// Modal Bileşeni (CariYonetimi ile aynı — createPortal, ESC kapatma)
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, children, size = '', scrollable = false, staticBackdrop = false }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const maxW = size === 'xl' ? 1140 : size === 'lg' ? 800 : size === 'sm' ? 420 : 560

  return createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1040, animation: 'fadeIn 0.15s ease', willChange: 'opacity' }}
        onClick={staticBackdrop ? undefined : onClose}
      />
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'slideUp 0.2s ease', willChange: 'transform' }}
        onClick={staticBackdrop ? undefined : (e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div style={{
          width: '100%', maxWidth: maxW,
          maxHeight: scrollable ? '90vh' : 'auto',
          display: 'flex', flexDirection: 'column',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: 'var(--shadow-modal)',
          background: '#fff',
        }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Onay Modalı ──────────────────────────────────────────────────────────────
function OnayModal({ open, onClose, onOnayla, baslik, mesaj, ikon, btnRenk = '#dc2626', btnYazi = 'Evet, Devam Et' }) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div style={{ padding: '28px 28px 0', textAlign: 'center' }}>
        {ikon && <div style={{ fontSize: 36, marginBottom: 12 }}>{ikon}</div>}
        <h6 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{baslik}</h6>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 0 }}>{mesaj}</p>
      </div>
      <div style={{ padding: '20px 28px 28px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-outline-secondary" onClick={onClose} style={{ minHeight: 44, padding: '0 20px' }}>İptal</button>
        <button className="btn text-white" style={{ background: btnRenk, minHeight: 44, padding: '0 20px' }} onClick={onOnayla}>{btnYazi}</button>
      </div>
    </Modal>
  )
}

// ─── AutoComplete ─────────────────────────────────────────────────────────────
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

// ─── Filtre Satırı ────────────────────────────────────────────────────────────
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

// ─── Aylık Takvim ─────────────────────────────────────────────────────────────
function AylikTakvim({ ay, yil, tahsilEvents, odemeEvents }) {
  const [tooltip, setTooltip] = useState(null)
  const GUN = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

  const ilk    = new Date(yil, ay - 1, 1)
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
          <div key={g} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', padding: '4px 0' }}>{g}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {gunler.map((gun, i) => {
          const evt     = olaylar(gun)
          const isBugun = gun && new Date(yil, ay - 1, gun).getTime() === now.getTime()
          const hasEvt  = evt.t.length > 0 || evt.o.length > 0
          return (
            <div
              key={i}
              style={{
                minHeight: 40, borderRadius: 8,
                background: isBugun ? 'var(--brand-light)' : gun ? '#fff' : 'transparent',
                border: isBugun ? '1.5px solid var(--brand-mid)' : gun ? '1px solid var(--border)' : 'none',
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
                <span style={{ fontSize: 12, fontWeight: isBugun ? 700 : 400, color: isBugun ? 'var(--brand-dark)' : '#495057' }}>
                  {gun}
                </span>
              )}
              {gun && hasEvt && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {evt.t.length > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />}
                  {evt.o.length > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />}
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

// ─── Modal Başlık Yardımcısı ──────────────────────────────────────────────────
function MHeader({ baslik, onKapat, gradient = 'linear-gradient(135deg, var(--brand-dark), var(--brand-mid))' }) {
  return (
    <div style={{ background: gradient, padding: '18px 22px', borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
      <div className="d-flex justify-content-between align-items-center">
        <h6 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>{baslik}</h6>
        <button className="btn-close btn-close-white" onClick={onKapat} />
      </div>
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
  const [portfoyModal,  setPortfoyModal]  = useState(false)
  const [portfoyForm,   setPortfoyForm]   = useState(portfoyBosluk())
  const [portfoyDzlId,  setPortfoyDzlId]  = useState(null)

  const [tahsileModal,  setTahsileModal]  = useState(false)
  const [tahsileForm,   setTahsileForm]   = useState({ banka: '', tarih: bugunStr() })
  const [tahsileId,     setTahsileId]     = useState(null)

  const [cirolaModal,   setCirolaModal]   = useState(false)
  const [cirolaForm,    setCirolaForm]    = useState({ firma: '', tarih: bugunStr() })
  const [cirolaId,      setCirolaId]      = useState(null)

  // ─ Kendi Modalleri ───────────────────────────────────────────────────────────
  const [kendiModal,    setKendiModal]    = useState(false)
  const [kendiForm,     setKendiForm]     = useState(kendiBosluk())
  const [kendiDzlId,    setKendiDzlId]   = useState(null)

  // ─ Tahsil Düzenle ────────────────────────────────────────────────────────────
  const [tahsilDzlModal, setTahsilDzlModal] = useState(false)
  const [tahsilDzlForm,  setTahsilDzlForm]  = useState({})
  const [tahsilDzlId,    setTahsilDzlId]    = useState(null)

  // ─ Ciro Düzenle ──────────────────────────────────────────────────────────────
  const [ciroDzlModal,  setCiroDzlModal]  = useState(false)
  const [ciroDzlForm,   setCiroDzlForm]   = useState({})
  const [ciroDzlId,     setCiroDzlId]     = useState(null)

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

  const tahsilToplam  = toplam(fT)
  const kendiToplam   = toplam(fK)
  const portfoyToplam = toplam(fP)
  const ciroToplam    = toplam(fC)
  const netDurum      = tahsilToplam - kendiToplam

  const tahsilBekleyen = fT.filter(i => !gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const tahsilGecmis   = fT.filter(i =>  gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const kendiBekleyen  = fK.filter(i => !gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const kendiGecmis    = fK.filter(i =>  gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const ciroBekleyen   = fC.filter(i => !gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const ciroGecmis     = fC.filter(i =>  gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)

  const gecikenKendi  = kendi.filter(i => gecmis(i.vade_tarihi))
  const gecikenTahsil = tahsil.filter(i => gecmis(i.vade_tarihi))

  const gunFark = (tarih) => Math.ceil((TODAY - new Date(tarih + 'T00:00:00')) / 86400000)

  const takvimTahsil = tahsil.map(i => ({ tarih: i.vade_tarihi, firma: i.firma_adi, tutar: i.tutar }))
  const takvimOdeme  = kendi.map(i  => ({ tarih: i.vade_tarihi, firma: i.firma_adi, tutar: i.tutar }))

  // ─ Tab Tanımları ─────────────────────────────────────────────────────────────
  const TABS = [
    { label: 'Dashboard',     icon: 'bi-speedometer2',        count: null,          bannerClass: 'hero-banner-dark'   },
    { label: 'Portföydeki',   icon: 'bi-wallet2',             count: portfoy.length, bannerClass: 'hero-banner-dark'   },
    { label: 'Tahsildeki',    icon: 'bi-arrow-down-circle',   count: tahsil.length,  bannerClass: 'hero-banner-green'  },
    { label: 'Kendi Çekimiz', icon: 'bi-arrow-up-circle',     count: kendi.length,   bannerClass: 'hero-banner-red'    },
    { label: 'Cirolanan',     icon: 'bi-arrow-left-right',    count: ciro.length,    bannerClass: 'hero-banner-orange' },
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
    btnRenk: '#dc2626', btnYazi: 'Evet, Sil',
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
    btnRenk: '#16a34a', btnYazi: 'Evet, Ödendi!',
    islem: () => { setTahsil(p => p.filter(i => i.id !== id)); toast.success('Evrak tahsil edildi, arşive taşındı.'); setOnay(null) },
  })

  const tahsilIade = (id) => setOnay({
    baslik: 'Portföye İade Edilsin mi?', mesaj: 'Bu evrak portföydeki listeye geri taşınacaktır.', ikon: '↩️',
    btnRenk: 'var(--brand-mid)', btnYazi: 'Evet, İade Et',
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
    btnRenk: '#16a34a', btnYazi: 'Evet, Ödendi!',
    islem: () => { setKendi(p => p.filter(i => i.id !== id)); toast.success('Evrak ödendi olarak kapatıldı.'); setOnay(null) },
  })

  const kendiSil = (id) => setOnay({
    baslik: 'Evrak Silinsin mi?', mesaj: 'Bu evrak kalıcı olarak silinecektir.', ikon: '🗑️',
    btnRenk: '#dc2626', btnYazi: 'Evet, Sil',
    islem: () => { setKendi(p => p.filter(i => i.id !== id)); toast.success('Evrak silindi.'); setOnay(null) },
  })

  // ─ Ciro İşlem Fonksiyonları ───────────────────────────────────────────────
  const ciroIade = (id) => setOnay({
    baslik: 'Portföye İade Edilsin mi?', mesaj: 'Bu evrak portföydeki listeye geri taşınacaktır.', ikon: '↩️',
    btnRenk: 'var(--brand-mid)', btnYazi: 'Evet, İade Et',
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
    btnRenk: '#dc2626', btnYazi: 'Evet, Sil',
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
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="icon-box icon-box-blue" style={{ width: 52, height: 52, borderRadius: 14, fontSize: '1.4rem' }}>
          <i className="bi bi-file-earmark-text" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Çek / Senet
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Evrak takibi, portföy ve nakit akış yönetimi
          </p>
        </div>
      </div>

      {/* ─── Ana Kart ───────────────────────────────────────────────────────── */}
      <div className="premium-card p-0" style={{ overflow: 'hidden' }}>

        {/* Tab Başlıkları */}
        <div style={{ background: '#fff', padding: '0 1rem' }}>
          <ul className="nav nav-tabs-premium">
            {TABS.map((tab, i) => (
              <li key={i} className="nav-item">
                <button
                  className={`nav-link ${aktifTab === i ? 'active' : ''}`}
                  onClick={() => setAktifTab(i)}
                >
                  <i className={`bi ${tab.icon} me-1`} />
                  {tab.label}
                  {tab.count !== null && (
                    <span className="badge rounded-pill ms-2" style={{
                      background: aktifTab === i ? 'var(--brand-dark)' : 'var(--border)',
                      color: aktifTab === i ? '#fff' : 'var(--text-secondary)',
                      fontSize: 10, fontWeight: 800,
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tab İçerikleri */}
        <div style={{ padding: '1.5rem' }}>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 0 — DASHBOARD
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 0 && (
            <div className="animate-fadeInUp">

              {/* Hero Banner */}
              <div className="hero-banner hero-banner-dark mb-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, margin: 0 }}>
                      {filtre.tumZamanlar ? 'TÜM ZAMANLAR' : new Date(filtre.yil, filtre.ay - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0.25rem 0', letterSpacing: '-0.02em', color: netDurum >= 0 ? '#4ade80' : '#f87171' }}>
                      {TL(netDurum)}
                    </p>
                    <p style={{ fontSize: '0.85rem', opacity: 0.8, margin: 0 }}>
                      Net Durum — Tahsilde: <strong>{TL(tahsilToplam)}</strong> / Ödenecek: <strong>{TL(kendiToplam)}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                  </div>
                </div>
              </div>

              {/* 4 Stat Kart */}
              <div className="row g-3 mb-4">
                {[
                  { label: 'TAHSİLDEKİ EVRAKLAR',        tutar: tahsilToplam,  adet: fT.length, accent: 'accent-green',  icon: 'bi-arrow-down-circle-fill', iconClass: 'icon-box-green',  tab: 2 },
                  { label: 'ÖDENECEĞİMİZ EVRAKLAR',       tutar: kendiToplam,   adet: fK.length, accent: 'accent-red',    icon: 'bi-arrow-up-circle-fill',   iconClass: 'icon-box-red',    tab: 3 },
                  { label: 'PORTFÖYDEKİ EVRAKLAR',        tutar: portfoyToplam, adet: fP.length, accent: 'accent-blue',   icon: 'bi-wallet2',                iconClass: 'icon-box-blue',   tab: 1 },
                  { label: 'CİROLANAN EVRAKLAR',          tutar: ciroToplam,    adet: fC.length, accent: 'accent-orange', icon: 'bi-arrow-left-right',       iconClass: 'icon-box-orange', tab: 4 },
                ].map((k, i) => (
                  <div key={i} className="col-6 col-xl-3">
                    <div className={`stat-card ${k.accent}`} style={{ cursor: 'pointer' }} onClick={() => setAktifTab(k.tab)}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className={`stat-label`}>{k.label}</div>
                        <div className={`icon-box ${k.iconClass}`} style={{ width: 36, height: 36, borderRadius: 10, fontSize: '1rem' }}>
                          <i className={`bi ${k.icon}`} />
                        </div>
                      </div>
                      <div className="stat-value financial-num">{TL(k.tutar)}</div>
                      <div className="stat-sub">{k.adet} kayıt · Detay gör →</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Son 6 Aylık Tablo */}
              <div className="premium-card mb-4">
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
                  <i className="bi bi-bar-chart-fill me-2" style={{ color: 'var(--brand-mid)' }} />
                  Son 6 Aylık Karşılaştırma
                </div>
                <div className="table-responsive">
                  <table className="table table-premium table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Ay</th>
                        <th style={{ color: '#16a34a' }}>Tahsilat</th>
                        <th style={{ color: '#dc2626' }}>Ödeme</th>
                        <th>Net</th>
                        <th>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SON_6_AY.map((r, i) => {
                        const net = r.tahsil - r.odeme
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{r.ay}</td>
                            <td style={{ color: '#16a34a', fontWeight: 600 }}>{TL(r.tahsil)}</td>
                            <td style={{ color: '#dc2626', fontWeight: 600 }}>{TL(r.odeme)}</td>
                            <td style={{ color: net >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{TL(net)}</td>
                            <td>
                              <span className="badge rounded-pill" style={{ background: net >= 0 ? '#dcfce7' : '#fee2e2', color: net >= 0 ? '#15803d' : '#991b1b', fontSize: 11 }}>
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
                  <div className="stat-card accent-red h-100">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill" style={{ color: '#dc2626', fontSize: 16 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#dc2626' }}>
                        Geciken Ödemeler ({gecikenKendi.length})
                      </span>
                    </div>
                    {gecikenKendi.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>Geciken ödeme bulunmuyor.</p>
                    ) : (
                      gecikenKendi.map(item => (
                        <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.firma_adi}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Vade: {tarihFmt(item.vade_tarihi)} — {gunFark(item.vade_tarihi)} gün gecikmiş</div>
                          </div>
                          <span className="vade-gecmis financial-num" style={{ fontSize: 13 }}>{TL(item.tutar)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="stat-card accent-orange h-100">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill" style={{ color: 'var(--warning)', fontSize: 16 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--warning)' }}>
                        Geciken Tahsilatlar ({gecikenTahsil.length})
                      </span>
                    </div>
                    {gecikenTahsil.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>Geciken tahsilat bulunmuyor.</p>
                    ) : (
                      gecikenTahsil.map(item => (
                        <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.firma_adi}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Vade: {tarihFmt(item.vade_tarihi)} — {gunFark(item.vade_tarihi)} gün gecikmiş</div>
                          </div>
                          <span className="vade-gecmis financial-num" style={{ fontSize: 13, color: 'var(--warning)' }}>{TL(item.tutar)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Aylık Takvim */}
              <div className="premium-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    <i className="bi bi-calendar3 me-2" style={{ color: 'var(--brand-mid)' }} />
                    {new Date(filtre.yil, filtre.ay - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} Takvimi
                  </span>
                  <div className="d-flex gap-3">
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#16a34a', marginRight: 4 }} />Tahsilat
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#dc2626', marginRight: 4 }} />Ödeme
                    </span>
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
            <div className="animate-fadeInUp">
              {/* Hero Banner */}
              <div className="hero-banner hero-banner-dark mb-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, margin: 0 }}>TOPLAM PORTFÖY</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0.25rem 0', letterSpacing: '-0.02em' }}>{TL(portfoyToplam)}</p>
                    <p style={{ fontSize: '0.85rem', opacity: 0.8, margin: 0 }}>{fP.length} evrak kasada bekliyor</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end mb-3">
                <button
                  className="btn btn-action text-white"
                  style={{ background: 'var(--brand-dark)', minHeight: 44, padding: '0 18px' }}
                  onClick={() => { setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null); setPortfoyModal(true) }}
                >
                  <i className="bi bi-plus-circle-fill" /> Yeni Evrak Ekle
                </button>
              </div>

              {/* Masaüstü Tablo */}
              <div className="table-responsive hide-mobile">
                <table className="table table-premium table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Vade Tarihi</th>
                      <th>İşlem Tarihi</th>
                      <th>Tutar</th>
                      <th>Firma / Asıl Borçlu</th>
                      <th>Tür / Banka</th>
                      <th>Evrak No</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fP.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fP.map(item => (
                      <tr key={item.id}>
                        <td>
                          <span className={vadeSinifi(item.vade_tarihi)}>{tarihFmt(item.vade_tarihi)}</span>
                          <br /><small style={{ color: 'var(--text-secondary)' }}>{tarihFmt(item.islem_tarihi)}</small>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{tarihFmt(item.islem_tarihi)}</td>
                        <td><span className="financial-num" style={{ fontWeight: 700 }}>{TL(item.tutar)}</span></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.firma_adi}</div>
                          {item.asil_borclu && <small style={{ color: 'var(--text-secondary)' }}>{item.asil_borclu}</small>}
                        </td>
                        <td>
                          <div style={{ color: 'var(--brand-mid)', fontWeight: 600 }}>{item.tur}</div>
                          {item.banka && <small style={{ color: 'var(--text-secondary)' }}>{item.banka}</small>}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{item.evrak_no}</td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-action btn-sm text-white" style={{ background: '#16a34a' }}
                              onClick={() => { setTahsileId(item.id); setTahsileForm({ banka: '', tarih: bugunStr() }); setTahsileModal(true) }}>
                              <i className="bi bi-bank" /> Tahsile Ver
                            </button>
                            <button className="btn btn-action btn-sm text-white" style={{ background: 'var(--warning)' }}
                              onClick={() => { setCirolaId(item.id); setCirolaForm({ firma: '', tarih: bugunStr() }); setCirolaModal(true) }}>
                              <i className="bi bi-arrow-left-right" /> Cirola
                            </button>
                            <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => portfoyDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="btn btn-action btn-sm btn-outline-danger" onClick={() => portfoySil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobil Kart Listesi */}
              <div className="mobile-card-list d-md-none">
                {fP.length === 0 && <p className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</p>}
                {fP.map(item => (
                  <div key={item.id} className="mobile-card animate-fadeInUp">
                    <div className="mobile-card-header">
                      <div>
                        <div className="mobile-card-firm">{item.firma_adi}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.evrak_no} · {item.tur}</div>
                      </div>
                      <div className="mobile-card-amount financial-num">{TL(item.tutar)}</div>
                    </div>
                    <div className="mobile-card-meta">
                      <span><i className="bi bi-calendar3 me-1" />Vade: <span className={vadeSinifi(item.vade_tarihi)}>{tarihFmt(item.vade_tarihi)}</span></span>
                      <span><i className="bi bi-bank me-1" />{item.banka || '—'}</span>
                    </div>
                    <div className="mobile-card-actions">
                      <button className="btn btn-action btn-sm text-white" style={{ background: '#16a34a' }}
                        onClick={() => { setTahsileId(item.id); setTahsileForm({ banka: '', tarih: bugunStr() }); setTahsileModal(true) }}>
                        <i className="bi bi-bank" /> Tahsile
                      </button>
                      <button className="btn btn-action btn-sm text-white" style={{ background: 'var(--warning)' }}
                        onClick={() => { setCirolaId(item.id); setCirolaForm({ firma: '', tarih: bugunStr() }); setCirolaModal(true) }}>
                        <i className="bi bi-arrow-left-right" /> Cirola
                      </button>
                      <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => portfoyDzlAc(item)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-action btn-sm btn-outline-danger" onClick={() => portfoySil(item.id)}><i className="bi bi-trash" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2 — TAHSİLDEKİ EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 2 && (
            <div className="animate-fadeInUp">
              {/* Hero Banner */}
              <div className="hero-banner hero-banner-green mb-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, margin: 0 }}>TAHSİLDEKİ EVRAKLAR</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0.25rem 0', letterSpacing: '-0.02em' }}>{TL(tahsilToplam)}</p>
                    <div className="d-flex gap-4 flex-wrap" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                      <span>Bekleyen: <strong>{TL(tahsilBekleyen)}</strong></span>
                      <span>Vadesi Geçen: <strong style={{ color: '#fde68a' }}>{TL(tahsilGecmis)}</strong></span>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              {/* Masaüstü Tablo */}
              <div className="table-responsive hide-mobile">
                <table className="table table-premium table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Vade Tarihi</th>
                      <th>Tahsile Veriş</th>
                      <th>Tutar</th>
                      <th>Firma / Asıl Borçlu</th>
                      <th>Evrak No / Türü</th>
                      <th>Tahsildeki Banka</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fT.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fT.map(item => (
                      <tr key={item.id}>
                        <td><span className={vadeSinifi(item.vade_tarihi)}>{tarihFmt(item.vade_tarihi)}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{tarihFmt(item.tahsil_tarihi)}</td>
                        <td><span className="financial-num" style={{ fontWeight: 700, color: '#16a34a' }}>{TL(item.tutar)}</span></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.firma_adi}</div>
                          {item.asil_borclu && <small style={{ color: 'var(--text-secondary)' }}>{item.asil_borclu}</small>}
                        </td>
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{item.evrak_no}</div>
                          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>{item.tur}</div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{item.banka || '—'}</td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-action btn-sm text-white" style={{ background: '#16a34a' }} onClick={() => tahsilOdendi(item.id)}>
                              <i className="bi bi-check-lg" /> Ödendi
                            </button>
                            <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => tahsilIade(item.id)}>
                              <i className="bi bi-arrow-counterclockwise" /> İade
                            </button>
                            <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => tahsilDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobil Kart Listesi */}
              <div className="mobile-card-list d-md-none">
                {fT.length === 0 && <p className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</p>}
                {fT.map(item => (
                  <div key={item.id} className="mobile-card animate-fadeInUp">
                    <div className="mobile-card-header">
                      <div>
                        <div className="mobile-card-firm">{item.firma_adi}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.evrak_no} · {item.tur}</div>
                      </div>
                      <div className="mobile-card-amount financial-num" style={{ color: '#16a34a' }}>{TL(item.tutar)}</div>
                    </div>
                    <div className="mobile-card-meta">
                      <span><i className="bi bi-calendar3 me-1" />Vade: <span className={vadeSinifi(item.vade_tarihi)}>{tarihFmt(item.vade_tarihi)}</span></span>
                      <span><i className="bi bi-bank me-1" />{item.banka || '—'}</span>
                    </div>
                    <div className="mobile-card-actions">
                      <button className="btn btn-action btn-sm text-white" style={{ background: '#16a34a' }} onClick={() => tahsilOdendi(item.id)}>
                        <i className="bi bi-check-lg" /> Ödendi
                      </button>
                      <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => tahsilIade(item.id)}>
                        <i className="bi bi-arrow-counterclockwise" /> İade
                      </button>
                      <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => tahsilDzlAc(item)}><i className="bi bi-pencil" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3 — KENDİ ÇEKİMİZ
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 3 && (
            <div className="animate-fadeInUp">
              {/* Hero Banner */}
              <div className="hero-banner hero-banner-red mb-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, margin: 0 }}>ÖDEYECEĞİMİZ EVRAKLAR</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0.25rem 0', letterSpacing: '-0.02em' }}>{TL(kendiToplam)}</p>
                    <div className="d-flex gap-4 flex-wrap" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                      <span>Bekleyen Borç: <strong>{TL(kendiBekleyen)}</strong></span>
                      <span>Vadesi Geçen: <strong style={{ color: '#fde68a' }}>{TL(kendiGecmis)}</strong></span>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              <div className="d-flex justify-content-end mb-3">
                <button
                  className="btn btn-action text-white"
                  style={{ background: '#dc2626', minHeight: 44, padding: '0 18px' }}
                  onClick={() => { setKendiForm(kendiBosluk()); setKendiDzlId(null); setKendiModal(true) }}
                >
                  <i className="bi bi-plus-circle-fill" /> Yeni Borç Ekle
                </button>
              </div>

              {/* Masaüstü Tablo */}
              <div className="table-responsive hide-mobile">
                <table className="table table-premium table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Vade Tarihi</th>
                      <th>İşlem Tarihi</th>
                      <th>Tutar</th>
                      <th>Firma (Ödeme Yapılan)</th>
                      <th>Banka Adı</th>
                      <th>Evrak No</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fK.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fK.map(item => (
                      <tr key={item.id}>
                        <td><span className={vadeSinifi(item.vade_tarihi)}>{tarihFmt(item.vade_tarihi)}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{tarihFmt(item.islem_tarihi)}</td>
                        <td><span className="financial-num" style={{ fontWeight: 700, color: '#dc2626' }}>{TL(item.tutar)}</span></td>
                        <td style={{ fontWeight: 600 }}>{item.firma_adi}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{item.banka}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{item.evrak_no}</td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-action btn-sm text-white" style={{ background: '#16a34a' }} onClick={() => kendiOdendi(item.id)}>
                              <i className="bi bi-check-lg" /> Ödendi
                            </button>
                            <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => kendiDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="btn btn-action btn-sm btn-outline-danger" onClick={() => kendiSil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobil Kart Listesi */}
              <div className="mobile-card-list d-md-none">
                {fK.length === 0 && <p className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</p>}
                {fK.map(item => (
                  <div key={item.id} className="mobile-card animate-fadeInUp">
                    <div className="mobile-card-header">
                      <div>
                        <div className="mobile-card-firm">{item.firma_adi}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.evrak_no} · {item.tur}</div>
                      </div>
                      <div className="mobile-card-amount financial-num" style={{ color: '#dc2626' }}>{TL(item.tutar)}</div>
                    </div>
                    <div className="mobile-card-meta">
                      <span><i className="bi bi-calendar3 me-1" />Vade: <span className={vadeSinifi(item.vade_tarihi)}>{tarihFmt(item.vade_tarihi)}</span></span>
                      <span><i className="bi bi-bank me-1" />{item.banka || '—'}</span>
                    </div>
                    <div className="mobile-card-actions">
                      <button className="btn btn-action btn-sm text-white" style={{ background: '#16a34a' }} onClick={() => kendiOdendi(item.id)}>
                        <i className="bi bi-check-lg" /> Ödendi
                      </button>
                      <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => kendiDzlAc(item)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-action btn-sm btn-outline-danger" onClick={() => kendiSil(item.id)}><i className="bi bi-trash" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4 — CİROLANAN EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 4 && (
            <div className="animate-fadeInUp">
              {/* Hero Banner */}
              <div className="hero-banner hero-banner-orange mb-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, margin: 0 }}>CİROLANAN EVRAKLAR</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0.25rem 0', letterSpacing: '-0.02em' }}>{TL(ciroToplam)}</p>
                    <div className="d-flex gap-4 flex-wrap" style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                      <span>Bekleyen Vade: <strong>{TL(ciroBekleyen)}</strong></span>
                      <span>Vadesi Geçen: <strong style={{ color: '#fef3c7' }}>{TL(ciroGecmis)}</strong></span>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              {/* Masaüstü Tablo */}
              <div className="table-responsive hide-mobile">
                <table className="table table-premium table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Vade Tarihi</th>
                      <th>Ciro Tarihi</th>
                      <th>Tutar</th>
                      <th>Asıl Firma (Müşteri)</th>
                      <th>Teslim Edilen Yer</th>
                      <th>Evrak No / Türü</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fC.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fC.map(item => (
                      <tr key={item.id}>
                        <td><span className={vadeSinifi(item.vade_tarihi)}>{tarihFmt(item.vade_tarihi)}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{tarihFmt(item.ciro_tarihi)}</td>
                        <td><span className="financial-num" style={{ fontWeight: 700, color: 'var(--warning)' }}>{TL(item.tutar)}</span></td>
                        <td style={{ fontWeight: 600 }}>{item.asil_firma}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{item.teslim_yeri}</td>
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{item.evrak_no}</div>
                          <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>{item.tur}</div>
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => ciroIade(item.id)}>
                              <i className="bi bi-arrow-counterclockwise" /> İade Et
                            </button>
                            <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => ciroDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="btn btn-action btn-sm btn-outline-danger" onClick={() => ciroSil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobil Kart Listesi */}
              <div className="mobile-card-list d-md-none">
                {fC.length === 0 && <p className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</p>}
                {fC.map(item => (
                  <div key={item.id} className="mobile-card animate-fadeInUp">
                    <div className="mobile-card-header">
                      <div>
                        <div className="mobile-card-firm">{item.asil_firma}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.evrak_no} · {item.tur}</div>
                      </div>
                      <div className="mobile-card-amount financial-num" style={{ color: 'var(--warning)' }}>{TL(item.tutar)}</div>
                    </div>
                    <div className="mobile-card-meta">
                      <span><i className="bi bi-calendar3 me-1" />Vade: <span className={vadeSinifi(item.vade_tarihi)}>{tarihFmt(item.vade_tarihi)}</span></span>
                      <span><i className="bi bi-building me-1" />{item.teslim_yeri}</span>
                    </div>
                    <div className="mobile-card-actions">
                      <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => ciroIade(item.id)}>
                        <i className="bi bi-arrow-counterclockwise" /> İade
                      </button>
                      <button className="btn btn-action btn-sm btn-outline-secondary" onClick={() => ciroDzlAc(item)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-action btn-sm btn-outline-danger" onClick={() => ciroSil(item.id)}><i className="bi bi-trash" /></button>
                    </div>
                  </div>
                ))}
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
        <MHeader
          baslik={portfoyDzlId ? 'Evrak Düzenle' : 'Yeni Evrak Ekle — Portföy'}
          onKapat={() => { setPortfoyModal(false); setPortfoyDzlId(null) }}
        />
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
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
                <input type="date" className="form-control" style={{ minHeight: 44, borderColor: '#dc2626' }}
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
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }}
            onClick={() => { setPortfoyModal(false); setPortfoyDzlId(null) }}>İptal</button>
          <button className="btn text-white btn-brand" style={{ minHeight: 44, padding: '0 24px' }}
            onClick={portfoyKaydet}>Kaydet</button>
        </div>
      </Modal>

      {/* ─── Tahsile Ver Modalı ─────────────────────────────────────────────── */}
      <Modal open={tahsileModal} onClose={() => setTahsileModal(false)} size="sm">
        <MHeader baslik="Tahsile Ver" onKapat={() => setTahsileModal(false)} gradient="linear-gradient(135deg, #0d6e4a, #16a34a)" />
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
          <button className="btn text-white" style={{ background: '#16a34a', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={tahsileVer}>İşlemi Tamamla</button>
        </div>
      </Modal>

      {/* ─── Cirola Modalı ──────────────────────────────────────────────────── */}
      <Modal open={cirolaModal} onClose={() => setCirolaModal(false)} size="sm">
        <MHeader baslik="Evrakı Ciroyla" onKapat={() => setCirolaModal(false)} gradient="linear-gradient(135deg, #b45309, #d97706)" />
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
          <button className="btn text-white" style={{ background: 'var(--warning)', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={cirolaKaydet}>Ciroyu Tamamla</button>
        </div>
      </Modal>

      {/* ─── Kendi Çekimiz: Yeni / Düzenle ─────────────────────────────────── */}
      <Modal open={kendiModal} onClose={() => { setKendiModal(false); setKendiDzlId(null) }} scrollable>
        <MHeader
          baslik={kendiDzlId ? 'Evrak Düzenle' : 'Yeni Borç Evrakı Ekle'}
          onKapat={() => { setKendiModal(false); setKendiDzlId(null) }}
          gradient="linear-gradient(135deg, #991b1b, #dc2626)"
        />
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
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
                <input type="date" className="form-control" style={{ minHeight: 44, borderColor: '#dc2626' }}
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
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }}
            onClick={() => { setKendiModal(false); setKendiDzlId(null) }}>İptal</button>
          <button className="btn text-white" style={{ background: '#dc2626', minHeight: 44, padding: '0 24px', fontWeight: 600 }}
            onClick={kendiKaydet}>Kaydet</button>
        </div>
      </Modal>

      {/* ─── Tahsil Düzenle Modalı ──────────────────────────────────────────── */}
      <Modal open={tahsilDzlModal} onClose={() => setTahsilDzlModal(false)} scrollable>
        <MHeader baslik="Tahsildeki Evrak Düzenle" onKapat={() => setTahsilDzlModal(false)} gradient="linear-gradient(135deg, #0d6e4a, #16a34a)" />
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
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
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }} onClick={() => setTahsilDzlModal(false)}>İptal</button>
          <button className="btn text-white" style={{ background: '#16a34a', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={tahsilDzlKaydet}>Güncelle</button>
        </div>
      </Modal>

      {/* ─── Ciro Düzenle Modalı ────────────────────────────────────────────── */}
      <Modal open={ciroDzlModal} onClose={() => setCiroDzlModal(false)} scrollable>
        <MHeader baslik="Cirolanan Evrak Düzenle" onKapat={() => setCiroDzlModal(false)} gradient="linear-gradient(135deg, #b45309, #d97706)" />
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
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
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }} onClick={() => setCiroDzlModal(false)}>İptal</button>
          <button className="btn text-white" style={{ background: 'var(--warning)', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={ciroDzlKaydet}>Güncelle</button>
        </div>
      </Modal>

    </div>
  )
}
