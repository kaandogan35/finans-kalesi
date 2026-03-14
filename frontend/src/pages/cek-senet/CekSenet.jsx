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
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, animation: 'cekSlideUp 0.2s ease',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
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
    { label: 'Dashboard',     renk: '#f59e0b', count: null            },
    { label: 'Portföydeki',   renk: '#f59e0b', count: portfoy.length  },
    { label: 'Tahsildeki',    renk: '#10b981', count: tahsil.length   },
    { label: 'Kendi Çekimiz', renk: '#ef4444', count: kendi.length    },
    { label: 'Cirolanan',     renk: '#d97706', count: ciro.length     },
    { label: 'Arşiv',         renk: 'rgba(255,255,255,0.5)', count: arsiv.length    },
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
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
      <div className="cek-spinner" role="status" />
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
      `}</style>

      {/* ─── Sayfa Başlığı ──────────────────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="bi bi-file-earmark-text" style={{ color: '#0d1b2e', fontSize: 20 }} />
        </div>
        <div>
          <h4 className="mb-0" style={{ fontWeight: 800, color: '#ffffff' }}>Çek / Senet</h4>
          <p className="mb-0" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Evrak takibi, portföy ve nakit akış yönetimi</p>
        </div>
      </div>

      {/* ─── Ana Kart ───────────────────────────────────────────────────────── */}
      <div className="cek-glass p-0 overflow-hidden" style={{ borderRadius: 16 }}>

        {/* Tab Başlıkları */}
        <div className="d-flex overflow-auto" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => tabDegistir(i)}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                padding: '14px 18px', fontSize: 13, whiteSpace: 'nowrap',
                fontWeight: aktifTab === i ? 700 : 500,
                color: aktifTab === i ? tab.renk : 'rgba(255,255,255,0.5)', minHeight: 48,
                borderBottom: aktifTab === i ? `2.5px solid ${tab.renk}` : '2.5px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="badge rounded-pill ms-1" style={{
                  background: aktifTab === i ? tab.renk : 'rgba(255,255,255,0.08)',
                  color: aktifTab === i ? (tab.renk === '#f59e0b' || tab.renk === '#d97706' ? '#0d1b2e' : '#fff') : 'rgba(255,255,255,0.5)', fontSize: 10,
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
                <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Nakit Akış Özeti</span>
                <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
              </div>

              {/* Net Pozisyon Bandı */}
              <div className="cek-glass" style={{
                padding: '22px 24px', marginBottom: 20,
                borderColor: netDurum >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
              }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <div style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 8,
                      textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600,
                      textShadow: '0 0 14px rgba(255,255,255,0.08)',
                    }}>
                      {filtre.tumZamanlar ? 'Tüm Zamanlar' : new Date(filtre.yil, filtre.ay - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className={`bi ${netDurum >= 0 ? 'bi-graph-up-arrow' : 'bi-exclamation-triangle-fill'}`}
                        style={{ color: netDurum >= 0 ? '#10b981' : '#ef4444', fontSize: 18 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Net Pozisyon</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 0 }}>
                      Tahsildeki evraklardan kendi ödeme evraklarınız çıkarılmıştır.
                    </p>
                  </div>
                  <div className="text-end">
                    <div style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4,
                      textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600,
                    }}>NET DURUM</div>
                    <div style={{
                      fontSize: 34, fontWeight: 500, fontFamily: "'Inter', sans-serif",
                      color: netDurum >= 0 ? '#10b981' : '#ef4444', lineHeight: 1,
                      textShadow: netDurum >= 0 ? '0 0 20px rgba(16,185,129,0.3)' : '0 0 20px rgba(239,68,68,0.3)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {TL(netDurum)}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                      Tahsilde: <strong style={{ color: '#10b981' }}>{TL(tahsilToplam)}</strong> — Ödenecek: <strong style={{ color: '#ef4444' }}>{TL(kendiToplam)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Özet Kart */}
              <div className="row g-3 mb-4">
                {[
                  { label: 'Tahsildeki Evraklar',          tutar: tahsilToplam,  adet: fT.length, renk: '#10b981', icon: 'bi-arrow-down-circle-fill', tab: 2 },
                  { label: 'Ödenecek Kendi Evraklarımız',  tutar: kendiToplam,   adet: fK.length, renk: '#ef4444', icon: 'bi-arrow-up-circle-fill',   tab: 3 },
                  { label: 'Portföydeki Evraklar',         tutar: portfoyToplam, adet: fP.length, renk: '#f59e0b', icon: 'bi-wallet2',                tab: 1 },
                  { label: 'Cirolanan Evraklar',           tutar: ciroToplam,    adet: fC.length, renk: '#d97706', icon: 'bi-arrow-left-right',       tab: 4 },
                ].map((k, i) => (
                  <div key={i} className="col-6 col-xl-3">
                    <div
                      className="cek-kpi"
                      onClick={() => tabDegistir(k.tab)}
                    >
                      <i className={`bi ${k.icon} cek-kpi-deco`} style={{ color: k.renk }} />
                      <h6 style={{
                        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                        textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px',
                        position: 'relative', zIndex: 1,
                        textShadow: '0 0 14px rgba(255,255,255,0.08)',
                      }}>{k.label}</h6>
                      <div className="cek-kpi-value" style={{
                        fontSize: 26, fontWeight: 500, color: k.renk, lineHeight: 1.15,
                        fontFamily: "'Inter', sans-serif", position: 'relative', zIndex: 1,
                        letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums',
                        textShadow: `0 0 20px ${k.renk}4D`,
                        WebkitFontSmoothing: 'antialiased',
                      }}>{TL(k.tutar)}</div>
                      <p style={{
                        fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500,
                        margin: '8px 0 0', position: 'relative', zIndex: 1,
                        textShadow: '0 0 12px rgba(255,255,255,0.06)',
                      }}>
                        {k.adet} kayıt · <span style={{ color: k.renk, opacity: 0.7, cursor: 'pointer' }}>Detay gör <i className="bi bi-arrow-right" /></span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aylık Karşılaştırma Tablosu */}
              <div className="cek-glass p-3 mb-4">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 14 }}>
                  <i className="bi bi-bar-chart-fill me-2" style={{ color: '#f59e0b' }} />
                  Son 6 Aylık Karşılaştırma
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '10px 12px' }}>Ay</th>
                        <th style={{ padding: '10px 12px', color: '#10b981 !important' }}>Tahsilat</th>
                        <th style={{ padding: '10px 12px', color: '#ef4444 !important' }}>Ödeme</th>
                        <th style={{ padding: '10px 12px' }}>Net</th>
                        <th style={{ padding: '10px 12px' }}>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {son6AyVeri.map((r, i) => {
                        const net = r.tahsil - r.odeme
                        return (
                          <tr key={i}>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#ffffff' }}>{r.ay}</td>
                            <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{TL(r.tahsil)}</td>
                            <td style={{ padding: '10px 12px', color: '#ef4444', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{TL(r.odeme)}</td>
                            <td style={{ padding: '10px 12px', color: net >= 0 ? '#10b981' : '#ef4444', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>{TL(net)}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span className="badge rounded-pill" style={{ background: net >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: net >= 0 ? '#10b981' : '#ef4444', fontSize: 11 }}>
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
                  <div className="cek-glass p-3 h-100" style={{ borderLeft: '4px solid #ef4444' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444', fontSize: 16 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#ef4444' }}>
                        Geciken Ödemeler ({gecikenKendi.length})
                      </span>
                    </div>
                    {gecikenKendi.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 0 }}>Geciken ödeme bulunmuyor.</p>
                    ) : (
                      gecikenKendi.map(item => (
                        <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{item.firma_adi}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Vade: {tarihFmt(item.vade_tarihi)} — {gunFark(item.vade_tarihi)} gün gecikmiş</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', fontFamily: "'Inter', sans-serif" }}>{TL(item.tutar)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="cek-glass p-3 h-100" style={{ borderLeft: '4px solid #d97706' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill" style={{ color: '#d97706', fontSize: 16 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#d97706' }}>
                        Geciken Tahsilatlar ({gecikenTahsil.length})
                      </span>
                    </div>
                    {gecikenTahsil.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 0 }}>Geciken tahsilat bulunmuyor.</p>
                    ) : (
                      gecikenTahsil.map(item => (
                        <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{item.firma_adi}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Vade: {tarihFmt(item.vade_tarihi)} — {gunFark(item.vade_tarihi)} gün gecikmiş</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706', fontFamily: "'Inter', sans-serif" }}>{TL(item.tutar)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Aylık Takvim */}
              <div className="cek-glass p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                    <i className="bi bi-calendar3 me-2" style={{ color: '#f59e0b' }} />
                    {new Date(filtre.yil, filtre.ay - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} Takvimi
                  </span>
                  <div className="d-flex gap-3">
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#10b981', marginRight: 4 }} />Tahsilat</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ef4444', marginRight: 4 }} />Ödeme</span>
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
              <div className="cek-glass" style={{ padding: '22px 24px', marginBottom: 20, borderColor: 'rgba(245,158,11,0.15)' }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, marginBottom: 8, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Toplam Portföy</div>
                    <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1, fontFamily: "'Inter', sans-serif", color: '#f59e0b', textShadow: '0 0 20px rgba(245,158,11,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(portfoyToplam)}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{fP.length} kayıt</div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              {/* Arama + Yeni Buton */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <div className="input-group flex-grow-1 cek-search" style={{ minWidth: 220 }}>
                  <span className="input-group-text" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}><i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.3)' }} /></span>
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="Müşteri, evrak no veya vade tarihi ara..."
                    value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                  {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
                </div>
                <button
                  className="btn btn-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0d1b2e', minHeight: 44, padding: '0 18px', fontWeight: 600 }}
                  onClick={() => { setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null); setPortfoyModal(true) }}
                >
                  <i className="bi bi-plus-circle-fill me-1" /> Yeni Evrak Ekle
                </button>
              </div>

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
                      <th style={{ padding: '10px 12px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fP.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fP.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px', ...vadeStil(item.vade_tarihi) }}>{tarihFmt(item.vade_tarihi)}</td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{tarihFmt(item.islem_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.firma_adi}</div>
                          {item.asil_borclu && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.asil_borclu}</div>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ color: '#f59e0b', fontWeight: 600 }}>{item.tur}</div>
                          {item.banka && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.banka}</div>}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{item.evrak_no}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-sm text-white" style={{ background: '#10b981', minHeight: 36, padding: '0 10px', fontSize: 12 }}
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
              <div className="cek-glass" style={{ padding: '22px 24px', marginBottom: 20, borderColor: 'rgba(16,185,129,0.2)' }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Bekleyen Vade</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#10b981', textShadow: '0 0 20px rgba(16,185,129,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(tahsilBekleyen)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Vadesi Geçen</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(tahsilGecmis)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Toplam Tahsilde</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>{TL(tahsilToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              {/* Arama */}
              <div className="input-group mb-3 cek-search">
                <span className="input-group-text" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}><i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.3)' }} /></span>
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
                      <th style={{ padding: '10px 12px' }}>Evrak No / Türü</th>
                      <th style={{ padding: '10px 12px' }}>Tahsildeki Banka</th>
                      <th style={{ padding: '10px 12px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fT.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fT.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px', ...vadeStil(item.vade_tarihi) }}>{tarihFmt(item.vade_tarihi)}</td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{tarihFmt(item.tahsil_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600 }}>{item.firma_adi}</div>
                          {item.asil_borclu && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.asil_borclu}</div>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{item.evrak_no}</div>
                          <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>{item.tur}</div>
                        </td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{item.banka || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-sm text-white" style={{ background: '#10b981', minHeight: 36, padding: '0 10px', fontSize: 12 }}
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
              <div className="cek-glass" style={{ padding: '22px 24px', marginBottom: 20, borderColor: 'rgba(239,68,68,0.2)' }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Bekleyen Borç</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(kendiBekleyen)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Vadesi Geçen</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#d97706', textShadow: '0 0 20px rgba(217,119,6,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(kendiGecmis)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Toplam Çıkış</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>{TL(kendiToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              {/* Arama + Yeni Buton */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <div className="input-group flex-grow-1 cek-search" style={{ minWidth: 220 }}>
                  <span className="input-group-text" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}><i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.3)' }} /></span>
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="Firma, evrak no, banka veya vade tarihi ara..."
                    value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                  {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
                </div>
                <button
                  className="btn btn-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0d1b2e', minHeight: 44, padding: '0 18px', fontWeight: 600 }}
                  onClick={() => { setKendiForm(kendiBosluk()); setKendiDzlId(null); setKendiModal(true) }}
                >
                  <i className="bi bi-plus-circle-fill me-1" /> Yeni Borç Ekle
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
                      <th style={{ padding: '10px 12px' }}>Banka Adı</th>
                      <th style={{ padding: '10px 12px' }}>Evrak No</th>
                      <th style={{ padding: '10px 12px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fK.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fK.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px', ...vadeStil(item.vade_tarihi) }}>{tarihFmt(item.vade_tarihi)}</td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{tarihFmt(item.islem_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#ef4444', fontFamily: "'Inter', sans-serif" }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{item.firma_adi}</td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{item.banka}</td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{item.evrak_no}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-sm text-white" style={{ background: '#10b981', minHeight: 36, padding: '0 10px', fontSize: 12 }}
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
              <div className="cek-glass" style={{ padding: '22px 24px', marginBottom: 20, borderColor: 'rgba(217,119,6,0.2)' }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Bekleyen Vade</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#d97706', textShadow: '0 0 20px rgba(217,119,6,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(ciroBekleyen)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Vadesi Geçen</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(ciroGecmis)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Toplam Cirolanan</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>{TL(ciroToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} />
                </div>
              </div>

              {/* Arama */}
              <div className="input-group mb-3 cek-search">
                <span className="input-group-text" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}><i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.3)' }} /></span>
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
                      <th style={{ padding: '10px 12px' }}>Evrak No / Türü</th>
                      <th style={{ padding: '10px 12px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fC.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Bu dönemde kayıt bulunamadı.</td></tr>
                    )}
                    {fC.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px', ...vadeStil(item.vade_tarihi) }}>{tarihFmt(item.vade_tarihi)}</td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{tarihFmt(item.ciro_tarihi)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#d97706', fontFamily: "'Inter', sans-serif" }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{item.asil_firma}</td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{item.teslim_yeri}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{item.evrak_no}</div>
                          <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>{item.tur}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 flex-wrap">
                            <button className="btn btn-sm text-white" style={{ background: '#10b981', minHeight: 36, padding: '0 10px', fontSize: 12 }}
                              onClick={() => ciroTamamlandi(item.id)}>
                              <i className="bi bi-check-lg me-1" />Tamamlandı
                            </button>
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

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 5 — ARŞİV
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 5 && (
            <div>
              <div className="cek-glass" style={{ padding: '22px 24px', marginBottom: 20 }}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Tahsil Edilen</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#10b981', textShadow: '0 0 20px rgba(16,185,129,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(arsiv.filter(i => i.tur_kategori === 'tahsil_edildi').reduce((s, i) => s + i.tutar, 0))}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Ödenen Kendi Çekleri</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#f59e0b', textShadow: '0 0 20px rgba(245,158,11,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(arsiv.filter(i => i.tur_kategori === 'kendi_odendi').reduce((s, i) => s + i.tutar, 0))}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, textShadow: '0 0 14px rgba(255,255,255,0.08)' }}>Ciro Tamamlanan</div>
                      <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: '#d97706', textShadow: '0 0 20px rgba(217,119,6,0.3)', fontVariantNumeric: 'tabular-nums' }}>{TL(arsiv.filter(i => i.tur_kategori === 'ciro_tamamlandi').reduce((s, i) => s + i.tutar, 0))}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    <i className="bi bi-archive-fill me-1" /> Toplam {arsiv.length} kayıt
                  </div>
                </div>
              </div>

              {/* Arama + Kategori Filtresi */}
              <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                <div className="input-group flex-grow-1 cek-search" style={{ minWidth: 220 }}>
                  <span className="input-group-text" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}><i className="bi bi-search" style={{ color: 'rgba(255,255,255,0.3)' }} /></span>
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
                      <th style={{ padding: '10px 12px' }}>Evrak No / Tür</th>
                      <th style={{ padding: '10px 12px' }}>Kategori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fA.length === 0 && (
                      <tr><td colSpan={6} className="text-center text-muted py-4" style={{ fontSize: 13 }}>Arşivde kayıt bulunamadı.</td></tr>
                    )}
                    {fA.map(item => {
                      const kat = item.tur_kategori
                      const katRenk = kat === 'tahsil_edildi' ? '#10b981' : kat === 'kendi_odendi' ? '#f59e0b' : '#d97706'
                      const katYazi = kat === 'tahsil_edildi' ? 'Tahsil Edildi' : kat === 'kendi_odendi' ? 'Kendi Ödendi' : 'Ciro Tamamlandı'
                      return (
                        <tr key={item.id}>
                          <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{tarihFmt(item.kapanis_tarihi)}</td>
                          <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{tarihFmt(item.vade_tarihi)}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>{TL(item.tutar)}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.firma_adi}</div>
                            {item.asil_borclu && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.asil_borclu}</div>}
                            {item.teslim_yeri && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>→ {item.teslim_yeri}</div>}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{item.evrak_no}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.tur}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className="badge rounded-pill" style={{
                              background: katRenk + '20', color: katRenk,
                              fontSize: 11, fontWeight: 700, padding: '5px 10px',
                            }}>{katYazi}</span>
                          </td>
                        </tr>
                      )
                    })}
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
        <div style={{ padding: '22px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="d-flex justify-content-between align-items-center mb-0 pb-4">
            <h6 style={{ fontWeight: 700, color: '#ffffff', margin: 0 }}>
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
                <AutoComplete value={portfoyForm.firma_adi}
                  onChange={(v) => setPortfoyForm({ ...portfoyForm, firma_adi: v, cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Cari seç..." id="pf-firma" required />
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
                <input type="date" className="form-control" style={{ minHeight: 44, borderColor: '#ef4444' }}
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
                  <span className="input-group-text">₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }}
            onClick={() => { setPortfoyModal(false); setPortfoyDzlId(null) }}>İptal</button>
          <button className="btn text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0d1b2e', minHeight: 44, padding: '0 24px', fontWeight: 600 }}
            onClick={portfoyKaydet}>Kaydet</button>
        </div>
      </Modal>

      {/* ─── Tahsile Ver Modalı ─────────────────────────────────────────────── */}
      <Modal open={tahsileModal} onClose={() => setTahsileModal(false)} size="sm">
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '18px 22px', borderRadius: '20px 20px 0 0' }}>
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
          <button className="btn text-white" style={{ background: '#10b981', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={tahsileVer}>İşlemi Tamamla</button>
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
        <div style={{ padding: '0 22px 22px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }} onClick={() => setCirolaModal(false)}>İptal</button>
          <button className="btn text-white" style={{ background: '#d97706', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={cirolaKaydet}>Ciroyu Tamamla</button>
        </div>
      </Modal>

      {/* ─── Kendi Çekimiz: Yeni / Düzenle ─────────────────────────────────── */}
      <Modal open={kendiModal} onClose={() => { setKendiModal(false); setKendiDzlId(null) }} scrollable>
        <div style={{ padding: '22px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="d-flex justify-content-between align-items-center mb-0 pb-4">
            <h6 style={{ fontWeight: 700, color: '#ffffff', margin: 0 }}>
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
                <input type="date" className="form-control" style={{ minHeight: 44, borderColor: '#ef4444' }}
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
                  <span className="input-group-text">₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }}
            onClick={() => { setKendiModal(false); setKendiDzlId(null) }}>İptal</button>
          <button className="btn text-white" style={{ background: '#ef4444', minHeight: 44, padding: '0 24px', fontWeight: 600 }}
            onClick={kendiKaydet}>Kaydet</button>
        </div>
      </Modal>

      {/* ─── Tahsil Düzenle Modalı ──────────────────────────────────────────── */}
      <Modal open={tahsilDzlModal} onClose={() => setTahsilDzlModal(false)} scrollable>
        <div style={{ padding: '22px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="d-flex justify-content-between align-items-center mb-0 pb-4">
            <h6 style={{ fontWeight: 700, color: '#ffffff', margin: 0 }}>Tahsildeki Evrak Düzenle</h6>
            <button className="btn-close" onClick={() => setTahsilDzlModal(false)} />
          </div>
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
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }} onClick={() => setTahsilDzlModal(false)}>İptal</button>
          <button className="btn text-white" style={{ background: '#10b981', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={tahsilDzlKaydet}>Güncelle</button>
        </div>
      </Modal>

      {/* ─── Ciro Düzenle Modalı ────────────────────────────────────────────── */}
      <Modal open={ciroDzlModal} onClose={() => setCiroDzlModal(false)} scrollable>
        <div style={{ padding: '22px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="d-flex justify-content-between align-items-center mb-0 pb-4">
            <h6 style={{ fontWeight: 700, color: '#ffffff', margin: 0 }}>Cirolanan Evrak Düzenle</h6>
            <button className="btn-close" onClick={() => setCiroDzlModal(false)} />
          </div>
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
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline-secondary" style={{ minHeight: 44, padding: '0 20px' }} onClick={() => setCiroDzlModal(false)}>İptal</button>
          <button className="btn text-white" style={{ background: '#d97706', minHeight: 44, padding: '0 24px', fontWeight: 600 }} onClick={ciroDzlKaydet}>Güncelle</button>
        </div>
      </Modal>

    </div>
  )
}
