/**
 * CariYonetimi.jsx — Cari & Finans Yönetimi
 * Bootstrap 5 + Premium CSS | Finans Kalesi
 * Modallar: Saf React state + createPortal
 */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

// ─── Para Formatı ─────────────────────────────────────────────────────────────
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)
const tarihFmt = (s) => (s ? new Date(s).toLocaleDateString('tr-TR') : '—')

// ─── Panoya Kopyala ──────────────────────────────────────────────────────────
const kopyala = async (metin, etiket) => {
  if (!metin) return
  try {
    await navigator.clipboard.writeText(metin)
    toast.success(`${etiket} kopyalandı!`)
  } catch {
    toast.error('Kopyalama başarısız.')
  }
}

function KopyalaBtn({ value, label }) {
  if (!value) return null
  return (
    <button
      title={`${label} kopyala`}
      onClick={() => kopyala(value, label)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '1px 4px', color: '#94a3b8', fontSize: 12,
        display: 'inline-flex', alignItems: 'center',
        borderRadius: 4, transition: 'color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand-dark)' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}
    >
      <i className="bi bi-copy" />
    </button>
  )
}

// ─── Modal Bileşeni (Saf React, Bootstrap JS yok) ────────────────────────────
function Modal({ open, onClose, children, size = '', scrollable = false, staticBackdrop = false }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape' && !staticBackdrop) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose, staticBackdrop])

  if (!open) return null

  const maxW = size === 'xl' ? 1100 : size === 'lg' ? 780 : size === 'sm' ? 400 : 500

  return createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', zIndex: 1040, animation: 'fadeIn 0.15s ease' }}
        onClick={staticBackdrop ? undefined : onClose}
      />
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'slideUp 0.2s ease' }}
        onClick={staticBackdrop ? undefined : (e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div style={{
          width: '100%', maxWidth: maxW,
          maxHeight: scrollable ? '88vh' : 'auto',
          display: 'flex', flexDirection: 'column',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.12)',
          background: '#fff',
        }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Mock Veri ────────────────────────────────────────────────────────────────
const MOCK_CARILER = [
  { id: 1,  cariTip: 'alici',  unvan: 'Akman İnşaat A.Ş.',    tip: 'kurumsal', telefon: '0212 555 10 20', vergi_dairesi: 'Levent VD',    vergi_no: '1234567890',  adres: 'Maslak Mah. Büyükdere Cad. No:123 İstanbul', bakiye: 47250.00,  kredi_limiti: 100000, durum: 'aktif',  son_islem: '2026-03-08' },
  { id: 2,  cariTip: 'satici', unvan: 'Demir Elektrik Ltd.',   tip: 'kurumsal', telefon: '0216 333 44 55', vergi_dairesi: 'Kadıköy VD',   vergi_no: '9876543210',  adres: 'Kozyatağı Mah. Değirmen Sok. No:5 İstanbul',  bakiye: -12400.50, kredi_limiti: 50000,  durum: 'aktif',  son_islem: '2026-03-05' },
  { id: 3,  cariTip: 'alici',  unvan: 'Yıldız Tekstil A.Ş.', tip: 'kurumsal', telefon: '0312 421 77 88', vergi_dairesi: 'Çankaya VD',   vergi_no: '4567890123',  adres: 'Çankaya Mah. Atatürk Bulvarı No:45 Ankara',   bakiye: 0,         kredi_limiti: 75000,  durum: 'pasif',  son_islem: '2026-01-15' },
  { id: 4,  cariTip: 'alici',  unvan: 'Mehmet Kaya',          tip: 'bireysel', telefon: '0532 111 22 33', vergi_dairesi: '',             vergi_no: '12345678901', adres: 'Bağcılar Mah. Gül Sok. No:8 İstanbul',       bakiye: 8750.00,   kredi_limiti: 20000,  durum: 'aktif',  son_islem: '2026-03-10' },
  { id: 5,  cariTip: 'satici', unvan: 'Güven Makine Ltd.',    tip: 'kurumsal', telefon: '0342 232 55 66', vergi_dairesi: 'Şahinbey VD',  vergi_no: '7890123456',  adres: 'Organize Sanayi Bölgesi 5. Cadde Gaziantep',  bakiye: -38900.00, kredi_limiti: 60000,  durum: 'aktif',  son_islem: '2026-02-28' },
  { id: 6,  cariTip: 'alici',  unvan: 'Bahar Kozmetik A.Ş.', tip: 'kurumsal', telefon: '0232 441 33 00', vergi_dairesi: 'Bornova VD',   vergi_no: '3456789012',  adres: 'Bornova OSB 3. Blok No:12 İzmir',             bakiye: 21600.75,  kredi_limiti: 40000,  durum: 'aktif',  son_islem: '2026-03-07' },
  { id: 7,  cariTip: 'satici', unvan: 'Ahmet Demir',          tip: 'bireysel', telefon: '0555 987 65 43', vergi_dairesi: '',             vergi_no: '98765432109', adres: 'Karşıyaka Mah. Deniz Cad. No:22 İzmir',      bakiye: -5200.00,  kredi_limiti: 10000,  durum: 'aktif',  son_islem: '2026-03-01' },
  { id: 8,  cariTip: 'alici',  unvan: 'Polat Lojistik A.Ş.', tip: 'kurumsal', telefon: '0322 355 88 99', vergi_dairesi: 'Seyhan VD',    vergi_no: '6789012345',  adres: 'Seyhan Mah. Ticaret Cad. No:67 Adana',       bakiye: 15300.00,  kredi_limiti: 80000,  durum: 'askida', son_islem: '2026-02-10' },
  { id: 9,  cariTip: 'satici', unvan: 'MetalTek San. A.Ş.',  tip: 'kurumsal', telefon: '0262 444 77 11', vergi_dairesi: 'Gebze VD',     vergi_no: '2345678901',  adres: 'Gebze OSB 8. Cadde No:44 Kocaeli',            bakiye: -8750.00,  kredi_limiti: 35000,  durum: 'aktif',  son_islem: '2026-03-09' },
  { id: 10, cariTip: 'alici',  unvan: 'Sümer Gıda Paz. Ltd.',tip: 'kurumsal', telefon: '0382 312 56 78', vergi_dairesi: 'Kastamonu VD', vergi_no: '8901234567',  adres: 'Kastamonu Merkez Mah. Pazar Cad. No:3',      bakiye: 33100.00,  kredi_limiti: 55000,  durum: 'aktif',  son_islem: '2026-03-06' },
]

const MOCK_HAREKETLER = {
  1:  [{ id: 101, tarih: '2026-03-08', aciklama: 'Malzeme satışı — Mart 2026',  tutar: 12000,    tur: 'alacak' },
       { id: 102, tarih: '2026-03-01', aciklama: 'Kısmi ödeme alındı',          tutar: -5000,    tur: 'odeme'  },
       { id: 103, tarih: '2026-02-20', aciklama: 'Hizmet bedeli',               tutar: 8500,     tur: 'alacak' },
       { id: 104, tarih: '2026-02-15', aciklama: 'Ödeme alındı',               tutar: -15000,   tur: 'odeme'  },
       { id: 105, tarih: '2026-02-01', aciklama: 'Proje başlangıç faturası',    tutar: 47250,    tur: 'alacak' }],
  2:  [{ id: 201, tarih: '2026-03-05', aciklama: 'Elektrik malzemesi alımı',    tutar: -12400.5, tur: 'borc'   },
       { id: 202, tarih: '2026-02-20', aciklama: 'Bakım hizmeti',               tutar: -3200,    tur: 'borc'   },
       { id: 203, tarih: '2026-02-18', aciklama: 'Ödeme yapıldı',               tutar: 3200,     tur: 'odeme'  }],
  4:  [{ id: 401, tarih: '2026-03-10', aciklama: 'Danışmanlık ücreti',          tutar: 8750,     tur: 'alacak' }],
  5:  [{ id: 501, tarih: '2026-02-28', aciklama: 'Makine alımı',                tutar: -45000,   tur: 'borc'   },
       { id: 502, tarih: '2026-03-01', aciklama: 'İlk taksit',                 tutar: 6100,     tur: 'odeme'  }],
  10: [{ id: 1001,tarih: '2026-03-06', aciklama: 'Gıda ürünleri satışı',        tutar: 33100,    tur: 'alacak' }],
}

// ─── Risk Progress Bar ────────────────────────────────────────────────────────
function RiskBar({ bakiye, kredi_limiti }) {
  if (!kredi_limiti || kredi_limiti <= 0 || bakiye === 0) return null
  const oran = (Math.abs(bakiye) / kredi_limiti) * 100
  const renk = oran >= 100 ? '#be123c' : oran >= 80 ? '#f43f5e' : oran >= 50 ? '#f59e0b' : '#10b981'
  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ height: 4, borderRadius: 9999, background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(oran, 100)}%`, background: renk, borderRadius: 9999, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: renk, fontWeight: 700, marginTop: 2 }}>
        %{oran.toFixed(0)} · {oran >= 100 ? 'Limit aşıldı!' : oran >= 80 ? 'Riskli' : oran >= 50 ? 'Dikkat' : 'Güvenli'}
      </div>
    </div>
  )
}

function durumRenk(d) {
  if (d === 'aktif')  return { bg: 'rgba(16,185,129,0.1)',   color: '#059669', border: 'rgba(16,185,129,0.3)'  }
  if (d === 'pasif')  return { bg: 'rgba(100,116,139,0.08)', color: '#475569', border: 'rgba(100,116,139,0.2)' }
  if (d === 'askida') return { bg: 'rgba(245,158,11,0.1)',   color: '#d97706', border: 'rgba(245,158,11,0.35)' }
  return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
}

const bosForm  = { cariTip: 'alici', tip: 'kurumsal', unvan: '', telefon: '', adres: '', vergi_dairesi: '', vergi_no: '', kredi_limiti: '', durum: 'aktif' }
const bosIslem = { tur: 'tahsilat', tutar: '', aciklama: '' }

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function CariYonetimi() {
  const [cariler, setCariler]         = useState(MOCK_CARILER)
  const [aktifSekme, setAktifSekme]   = useState('tumü')
  const [arama, setArama]             = useState('')
  const [siralama, setSiralama]       = useState({ alan: 'unvan', yon: 'asc' })
  const [sayfa, setSayfa]             = useState(1)
  const sayfaBasi = 8

  const [cariModalAcik, setCariModalAcik]     = useState(false)
  const [cariMod, setCariMod]                 = useState('ekle')
  const [seciliCari, setSeciliCari]           = useState(null)
  const [islemModalAcik, setIslemModalAcik]   = useState(false)
  const [islemCari, setIslemCari]             = useState(null)
  const [ekstreModalAcik, setEkstreModalAcik] = useState(false)
  const [ekstreCari, setEkstreCari]           = useState(null)
  const [silModalAcik, setSilModalAcik]       = useState(false)
  const [silCari, setSilCari]                 = useState(null)

  const [form, setForm]             = useState(bosForm)
  const [islem, setIslem]           = useState(bosIslem)
  const [yukleniyor, setYukleniyor] = useState(false)

  // ─── Filtrelenmiş + Sıralanmış Liste ────────────────────────────────────
  const filtrelendi = (() => {
    let s = [...cariler]
    if (aktifSekme === 'alici')  s = s.filter(c => c.cariTip === 'alici')
    if (aktifSekme === 'satici') s = s.filter(c => c.cariTip === 'satici')
    if (arama.trim()) {
      const q = arama.toLowerCase()
      s = s.filter(c => c.unvan.toLowerCase().includes(q) || c.telefon?.includes(q) || c.vergi_no?.includes(q))
    }
    if (aktifSekme === 'alici')  s.sort((a, b) => b.bakiye - a.bakiye)
    else if (aktifSekme === 'satici') s.sort((a, b) => a.bakiye - b.bakiye)
    else s.sort((a, b) => {
      let va = a[siralama.alan], vb = b[siralama.alan]
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
      return siralama.yon === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0)
    })
    return s
  })()

  useEffect(() => { setSayfa(1) }, [aktifSekme, arama])

  const sayfaliVeri = filtrelendi.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi)
  const toplamSayfa = Math.ceil(filtrelendi.length / sayfaBasi)

  // ─── İstatistikler ──────────────────────────────────────────────────────
  const stats = {
    toplamAlacak:  cariler.filter(c => c.bakiye > 0 && c.cariTip === 'alici').reduce((s, c) => s + c.bakiye, 0),
    aktifBorclu:   cariler.filter(c => c.bakiye < 0 && c.durum === 'aktif').length,
    toplamBorcumuz: cariler.filter(c => c.cariTip === 'satici' && c.bakiye < 0).reduce((s, c) => s + Math.abs(c.bakiye), 0),
  }

  const sortToggle = (alan) => setSiralama(p => p.alan === alan ? { alan, yon: p.yon === 'asc' ? 'desc' : 'asc' } : { alan, yon: 'asc' })
  const SortIcon = ({ alan }) => {
    if (aktifSekme !== 'tumü' || siralama.alan !== alan) return <i className="bi bi-arrow-down-up ms-1" style={{ fontSize: 9, opacity: 0.35 }} />
    return <i className={`bi bi-arrow-${siralama.yon === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: 10, color: 'var(--brand-dark)' }} />
  }

  // ─── Cari Modal ─────────────────────────────────────────────────────────
  const cariEkleAc = () => {
    setForm({ ...bosForm, cariTip: aktifSekme === 'satici' ? 'satici' : 'alici' })
    setCariMod('ekle'); setSeciliCari(null); setCariModalAcik(true)
  }
  const cariDuzenleAc = (cari) => {
    setForm({ cariTip: cari.cariTip, tip: cari.tip, unvan: cari.unvan, telefon: cari.telefon || '',
      adres: cari.adres || '', vergi_dairesi: cari.vergi_dairesi || '',
      vergi_no: cari.vergi_no || '', kredi_limiti: cari.kredi_limiti || '', durum: cari.durum })
    setCariMod('duzenle'); setSeciliCari(cari); setCariModalAcik(true)
  }
  const cariKaydet = async (e) => {
    e.preventDefault()
    if (!form.unvan.trim()) { toast.error('Cari ünvanı zorunludur.'); return }
    setYukleniyor(true)
    try {
      if (cariMod === 'ekle') {
        setCariler(p => [{ ...form, id: Date.now(), bakiye: 0, son_islem: null, kredi_limiti: Number(form.kredi_limiti) || 0 }, ...p])
        toast.success('Cari başarıyla eklendi.')
      } else {
        setCariler(p => p.map(c => c.id === seciliCari.id ? { ...c, ...form, kredi_limiti: Number(form.kredi_limiti) || c.kredi_limiti } : c))
        toast.success('Cari güncellendi.')
      }
      setCariModalAcik(false)
    } catch { toast.error('İşlem sırasında hata oluştu.') }
    finally { setYukleniyor(false) }
  }

  // ─── Finansal İşlem ──────────────────────────────────────────────────────
  const islemAc = (cari) => { setIslem(bosIslem); setIslemCari(cari); setIslemModalAcik(true) }
  const islemKaydet = async (e) => {
    e.preventDefault()
    const tutar = parseFloat(islem.tutar)
    if (!tutar || tutar <= 0) { toast.error('Geçerli bir tutar girin.'); return }
    if (!islem.aciklama.trim()) { toast.error('Açıklama zorunludur.'); return }
    setYukleniyor(true)
    try {
      const fark = islem.tur === 'tahsilat' ? -tutar : tutar
      setCariler(p => p.map(c => c.id === islemCari.id
        ? { ...c, bakiye: +(c.bakiye + fark).toFixed(2), son_islem: new Date().toISOString().slice(0, 10) } : c))
      toast.success(islem.tur === 'tahsilat' ? `${TL(tutar)} tahsilat alındı.` : `${TL(tutar)} borçlandırma yapıldı.`)
      setIslemModalAcik(false)
    } catch { toast.error('İşlem sırasında hata oluştu.') }
    finally { setYukleniyor(false) }
  }

  // ─── Ekstre ──────────────────────────────────────────────────────────────
  const ekstreAc = (cari) => { setEkstreCari(cari); setEkstreModalAcik(true) }

  // ─── Silme ───────────────────────────────────────────────────────────────
  const silOnayla = async () => {
    setYukleniyor(true)
    try {
      setCariler(p => p.filter(c => c.id !== silCari.id))
      toast.success('Cari pasife alındı.')
      setSilModalAcik(false)
    } catch { toast.error('Silme işlemi başarısız.') }
    finally { setYukleniyor(false) }
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Sayfa Başlığı */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: 2, letterSpacing: '-0.02em' }}>
            Cari & Finans Yönetimi
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>
            {cariler.length} toplam cari · {cariler.filter(c => c.durum === 'aktif').length} aktif
          </p>
        </div>
        <button onClick={cariEkleAc} style={ekleBtn}>
          <i className="bi bi-plus-lg" /> Yeni Cari Ekle
        </button>
      </div>

      {/* Stat Kartları */}
      <div className="row g-3 mb-4">

        {/* Toplam Alacak */}
        <div className="col-12 col-md-4">
          <div className="light-card tint-green p-4">
            <i className="bi bi-arrow-up-circle-fill card-deco-icon" style={{ color: '#059669' }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu('#059669', 'rgba(16,185,129,0.14)')}><i className="bi bi-wallet2" style={{ color: '#059669', fontSize: 17 }} /></div>
              <span style={kartEtiket('#059669')}>Toplam Alacak</span>
            </div>
            <div className="financial-num" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#065f46', lineHeight: 1.1 }}>{TL(stats.toplamAlacak)}</div>
            <p style={{ fontSize: 12, color: '#059669', margin: '5px 0 0', fontWeight: 600, opacity: 0.8 }}>
              {cariler.filter(c => c.bakiye > 0 && c.cariTip === 'alici').length} alacaklı müşteri
            </p>
          </div>
        </div>

        {/* Aktif Borçlu Sayısı */}
        <div className="col-12 col-md-4">
          <div className="light-card tint-navy p-4">
            <i className="bi bi-people-fill card-deco-icon" style={{ color: '#123F59' }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu('var(--brand-dark)', 'rgba(18,63,89,0.1)')}><i className="bi bi-person-lines-fill" style={{ color: 'var(--brand-dark)', fontSize: 17 }} /></div>
              <span style={kartEtiket('var(--brand-dark)')}>Aktif Borçlu</span>
            </div>
            <div className="financial-num" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{stats.aktifBorclu}</div>
            <p style={{ fontSize: 12, color: '#64748b', margin: '5px 0 0', fontWeight: 600 }}>aktif borçlu cari hesap</p>
          </div>
        </div>

        {/* Toplam Borcumuz (Tedarikçilere) */}
        <div className="col-12 col-md-4">
          <div className="light-card p-4" style={{ background: 'rgba(15,23,42,0.03)', borderColor: 'rgba(15,23,42,0.12)' }}>
            <i className="bi bi-building-fill-down card-deco-icon" style={{ color: '#1e293b' }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu('#1e293b', 'rgba(15,23,42,0.08)')}><i className="bi bi-truck" style={{ color: '#1e293b', fontSize: 17 }} /></div>
              <span style={kartEtiket('#1e293b')}>Toplam Borcumuz</span>
            </div>
            <div className="financial-num" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{TL(stats.toplamBorcumuz)}</div>
            <p style={{ fontSize: 12, color: '#475569', margin: '5px 0 0', fontWeight: 600 }}>
              {cariler.filter(c => c.cariTip === 'satici' && c.bakiye < 0).length} tedarikçiye borcumuz
            </p>
          </div>
        </div>
      </div>

      {/* Tablo Kartı */}
      <div className="premium-card" style={{ padding: 0 }}>

        {/* Sekmeler + Arama */}
        <div style={{ padding: '0 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div className="d-flex align-items-end justify-content-between flex-wrap gap-2" style={{ paddingTop: 16 }}>
            <div className="d-flex gap-1">
              {[
                { key: 'tumü',   label: 'Tüm Cariler', icon: 'bi-grid-3x3-gap-fill', sayi: cariler.length },
                { key: 'alici',  label: 'Müşteriler',  icon: 'bi-person-check-fill',  sayi: cariler.filter(c => c.cariTip === 'alici').length },
                { key: 'satici', label: 'Tedarikçiler', icon: 'bi-truck',             sayi: cariler.filter(c => c.cariTip === 'satici').length },
              ].map(s => {
                const a = aktifSekme === s.key
                return (
                  <button key={s.key} onClick={() => setAktifSekme(s.key)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    border: 'none', cursor: 'pointer', background: 'none', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: a ? 700 : 600,
                    color: a ? 'var(--brand-dark)' : '#64748b',
                    borderBottom: a ? '2px solid var(--brand-dark)' : '2px solid transparent',
                    marginBottom: -1, borderRadius: '8px 8px 0 0',
                  }}>
                    <i className={`bi ${s.icon}`} style={{ fontSize: 13 }} />
                    {s.label}
                    <span style={{ background: a ? 'rgba(18,63,89,0.1)' : '#f1f5f9', color: a ? 'var(--brand-dark)' : '#94a3b8', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 20, lineHeight: '18px' }}>{s.sayi}</span>
                  </button>
                )
              })}
            </div>
            <div style={{ paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 12px', gap: 8 }}>
                <i className="bi bi-search" style={{ color: '#94a3b8', fontSize: 13 }} />
                <input type="text" value={arama} onChange={e => setArama(e.target.value)}
                  placeholder="Ara: ünvan, tel, vergi no..."
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: 'inherit', width: 210 }} />
                {arama && (
                  <button onClick={() => setArama('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', fontSize: 16 }}>
                    <i className="bi bi-x" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {aktifSekme !== 'tumü' && (
          <div style={{ padding: '7px 24px', background: 'rgba(18,63,89,0.025)', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              <i className="bi bi-sort-down me-1" />
              {aktifSekme === 'alici' ? 'Müşteriler bakiyeye göre büyükten küçüğe sıralı.' : 'Tedarikçiler borca göre büyükten küçüğe sıralı.'}
            </span>
          </div>
        )}

        {/* Tablo */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 840 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ ...thS, cursor: 'pointer' }} onClick={() => sortToggle('unvan')}>Cari Ünvanı <SortIcon alan="unvan" /></th>
                <th style={thS}>İletişim & Vergi</th>
                <th style={thS}>Rol</th>
                <th style={{ ...thS, textAlign: 'right', cursor: 'pointer' }} onClick={() => sortToggle('bakiye')}>Bakiye / Risk <SortIcon alan="bakiye" /></th>
                <th style={{ ...thS, cursor: 'pointer' }} onClick={() => sortToggle('durum')}>Durum <SortIcon alan="durum" /></th>
                <th style={{ ...thS, textAlign: 'right', cursor: 'default' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {sayfaliVeri.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '52px 24px', textAlign: 'center' }}>
                  <i className="bi bi-inbox" style={{ fontSize: 38, color: '#cbd5e1', display: 'block', marginBottom: 10 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>{arama ? 'Aramanızla eşleşen cari bulunamadı.' : 'Bu kategoride kayıt yok.'}</span>
                </td></tr>
              ) : sayfaliVeri.map((cari, idx) => {
                const ds  = durumRenk(cari.durum)
                const bakR = cari.bakiye > 0 ? '#059669' : cari.bakiye < 0 ? '#e11d48' : '#64748b'
                const bg  = idx % 2 === 0 ? '#fff' : '#fafbfc'
                return (
                  <tr key={cari.id} style={{ background: bg, transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                    onMouseLeave={e => e.currentTarget.style.background = bg}>

                    {/* Ünvan — tıklanabilir ekstre açar */}
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: cari.tip === 'kurumsal' ? 'rgba(18,63,89,0.08)' : 'rgba(245,158,11,0.1)',
                          border: cari.tip === 'kurumsal' ? '1px solid rgba(18,63,89,0.12)' : '1px solid rgba(245,158,11,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`bi ${cari.tip === 'kurumsal' ? 'bi-buildings-fill' : 'bi-person-fill'}`}
                            style={{ fontSize: 15, color: cari.tip === 'kurumsal' ? 'var(--brand-dark)' : '#d97706' }} />
                        </div>
                        <div>
                          <div
                            onClick={() => ekstreAc(cari)}
                            style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand-dark)', cursor: 'pointer',
                              textDecoration: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'rgba(18,63,89,0.3)' }}
                            title="Hesap ekstresini görüntüle"
                          >
                            {cari.unvan}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Son: {tarihFmt(cari.son_islem)}</div>
                        </div>
                      </div>
                    </td>

                    {/* İletişim + Kopyala */}
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{cari.telefon || '—'}</span>
                        <KopyalaBtn value={cari.telefon} label="Telefon" />
                      </div>
                      {cari.vergi_dairesi && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{cari.vergi_dairesi} · {cari.vergi_no}</span>
                          <KopyalaBtn value={cari.vergi_no} label="Vergi No" />
                        </div>
                      )}
                    </td>

                    {/* Rol */}
                    <td style={tdS}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: cari.cariTip === 'alici' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.1)',
                        color: cari.cariTip === 'alici' ? '#059669' : '#d97706',
                        border: `1px solid ${cari.cariTip === 'alici' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.3)'}` }}>
                        <i className={`bi ${cari.cariTip === 'alici' ? 'bi-person-check' : 'bi-truck'}`} style={{ fontSize: 10 }} />
                        {cari.cariTip === 'alici' ? 'Müşteri' : 'Tedarikçi'}
                      </span>
                    </td>

                    {/* Bakiye + Risk Bar */}
                    <td style={{ ...tdS, textAlign: 'right' }}>
                      <div className="financial-num" style={{ fontSize: 15, fontWeight: 800, color: bakR }}>{TL(cari.bakiye)}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 1 }}>Limit: {TL(cari.kredi_limiti)}</div>
                      <RiskBar bakiye={cari.bakiye} kredi_limiti={cari.kredi_limiti} />
                    </td>

                    {/* Durum */}
                    <td style={tdS}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: ds.bg, color: ds.color, border: `1px solid ${ds.border}` }}>
                        {cari.durum === 'aktif' ? 'Aktif' : cari.durum === 'pasif' ? 'Pasif' : 'Askıda'}
                      </span>
                    </td>

                    {/* İşlemler */}
                    <td style={{ ...tdS, textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <AkBtn title="Finansal İşlem"  color="#10b981"           icon="bi-currency-exchange" onClick={() => islemAc(cari)} />
                        <AkBtn title="Hesap Ekstresi"  color="var(--brand-dark)" icon="bi-file-earmark-text"  onClick={() => ekstreAc(cari)} />
                        <AkBtn title="Düzenle"         color="#f59e0b"           icon="bi-pencil"             onClick={() => cariDuzenleAc(cari)} />
                        <AkBtn title="Sil / Pasife Al" color="#f43f5e"           icon="bi-trash"              onClick={() => { setSilCari(cari); setSilModalAcik(true) }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {toplamSayfa > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
              {filtrelendi.length} kayıttan {(sayfa - 1) * sayfaBasi + 1}–{Math.min(sayfa * sayfaBasi, filtrelendi.length)} gösteriliyor
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <PgBtn onClick={() => setSayfa(p => p - 1)} disabled={sayfa === 1}><i className="bi bi-chevron-left" /></PgBtn>
              {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map(p => (
                <PgBtn key={p} onClick={() => setSayfa(p)} aktif={p === sayfa}>{p}</PgBtn>
              ))}
              <PgBtn onClick={() => setSayfa(p => p + 1)} disabled={sayfa === toplamSayfa}><i className="bi bi-chevron-right" /></PgBtn>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          MODAL 1 — Cari Ekle / Düzenle
      ══════════════════════════════════════════════ */}
      <Modal open={cariModalAcik} onClose={() => setCariModalAcik(false)} size="lg" scrollable staticBackdrop>
        <MHeader icon={cariMod === 'ekle' ? 'bi-person-plus-fill' : 'bi-pencil-square'}
          baslik={cariMod === 'ekle' ? 'Yeni Cari Ekle' : 'Cari Düzenle'}
          onKapat={() => setCariModalAcik(false)} />
        <form onSubmit={cariKaydet} noValidate style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
            <div className="row g-3">
              {/* Cari Rolü */}
              <div className="col-12">
                <label style={lblS}>Cari Rolü</label>
                <div className="d-flex gap-2">
                  {[
                    { val: 'alici',  label: 'Müşteri (Alıcı)',    icon: 'bi-person-check-fill', color: '#059669', bg: 'rgba(16,185,129,0.07)'  },
                    { val: 'satici', label: 'Tedarikçi (Satıcı)', icon: 'bi-truck',             color: '#d97706', bg: 'rgba(245,158,11,0.07)' },
                  ].map(t => {
                    const sel = form.cariTip === t.val
                    return (
                      <label key={t.val} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                        border: `2px solid ${sel ? t.color : '#e2e8f0'}`, background: sel ? t.bg : '#fff', transition: 'all 0.15s' }}>
                        <input type="radio" name="cariTip" value={t.val} checked={sel}
                          onChange={e => setForm(p => ({ ...p, cariTip: e.target.value }))} style={{ display: 'none' }} />
                        <i className={`bi ${t.icon}`} style={{ fontSize: 18, color: sel ? t.color : '#94a3b8' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: sel ? t.color : '#64748b' }}>{t.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="col-6">
                <label style={lblS}>Hesap Türü</label>
                <select value={form.tip} onChange={e => setForm(p => ({ ...p, tip: e.target.value }))} style={selS}>
                  <option value="kurumsal">Kurumsal (Şirket)</option>
                  <option value="bireysel">Bireysel (Şahıs)</option>
                </select>
              </div>
              <div className="col-6">
                <label style={lblS}>Durum</label>
                <select value={form.durum} onChange={e => setForm(p => ({ ...p, durum: e.target.value }))} style={selS}>
                  <option value="aktif">Aktif</option>
                  <option value="pasif">Pasif</option>
                  <option value="askida">Askıda</option>
                </select>
              </div>
              <div className="col-12">
                <label style={lblS}>Cari Ünvanı *</label>
                <input type="text" value={form.unvan} onChange={e => setForm(p => ({ ...p, unvan: e.target.value }))}
                  placeholder={form.tip === 'kurumsal' ? 'Şirket Adı A.Ş.' : 'Ad Soyad'}
                  className="form-control form-control-custom" required />
              </div>
              <div className="col-6">
                <label style={lblS}>Telefon</label>
                <input type="text" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))}
                  placeholder="0212 555 00 00" className="form-control form-control-custom" />
              </div>
              <div className="col-6">
                <label style={lblS}>Kredi Limiti (₺)</label>
                <input type="number" value={form.kredi_limiti} onChange={e => setForm(p => ({ ...p, kredi_limiti: e.target.value }))}
                  placeholder="0" min="0" className="form-control form-control-custom" />
              </div>
              <div className="col-6">
                <label style={lblS}>{form.tip === 'kurumsal' ? 'Vergi Dairesi' : '—'}</label>
                <input type="text" value={form.vergi_dairesi} onChange={e => setForm(p => ({ ...p, vergi_dairesi: e.target.value }))}
                  placeholder={form.tip === 'kurumsal' ? 'Örn: Levent VD' : ''} className="form-control form-control-custom" />
              </div>
              <div className="col-6">
                <label style={lblS}>{form.tip === 'kurumsal' ? 'Vergi Numarası' : 'TC Kimlik No'}</label>
                <input type="text" value={form.vergi_no} onChange={e => setForm(p => ({ ...p, vergi_no: e.target.value }))}
                  placeholder={form.tip === 'kurumsal' ? '10 haneli' : '11 haneli'} className="form-control form-control-custom" />
              </div>
              <div className="col-12">
                <label style={lblS}>Adres</label>
                <textarea value={form.adres} onChange={e => setForm(p => ({ ...p, adres: e.target.value }))}
                  placeholder="Tam adres..." rows={2} className="form-control form-control-custom"
                  style={{ resize: 'none', borderRadius: 10 }} />
              </div>
            </div>
          </div>
          <MFooter onIptal={() => setCariModalAcik(false)} yukleniyor={yukleniyor}
            kaydetLabel={cariMod === 'ekle' ? 'Cari Ekle' : 'Güncelle'} />
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL 2 — Finansal İşlem
      ══════════════════════════════════════════════ */}
      <Modal open={islemModalAcik} onClose={() => setIslemModalAcik(false)} staticBackdrop>
        <MHeader icon="bi-currency-exchange" baslik="Finansal İşlem" altBaslik={islemCari?.unvan}
          headerBg="linear-gradient(135deg,#059669,#047857)" onKapat={() => setIslemModalAcik(false)} />
        <form onSubmit={islemKaydet} noValidate>
          <div style={{ padding: 24 }}>
            {islemCari && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Güncel Bakiye</span>
                <span className="financial-num" style={{ fontSize: 18, fontWeight: 800, color: islemCari.bakiye >= 0 ? '#059669' : '#e11d48' }}>
                  {TL(islemCari.bakiye)}
                </span>
              </div>
            )}
            <div className="mb-3">
              <label style={lblS}>İşlem Türü</label>
              <div className="d-flex gap-2">
                {[
                  { val: 'tahsilat',     label: 'Tahsilat Al', icon: 'bi-arrow-down-circle-fill', color: '#059669', bg: 'rgba(16,185,129,0.08)' },
                  { val: 'borclandirma', label: 'Borçlandır',  icon: 'bi-arrow-up-circle-fill',   color: '#e11d48', bg: 'rgba(244,63,94,0.07)'  },
                ].map(t => (
                  <label key={t.val} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${islem.tur === t.val ? t.color : '#e2e8f0'}`,
                    background: islem.tur === t.val ? t.bg : '#fff', transition: 'all 0.15s' }}>
                    <input type="radio" name="islemTur" value={t.val} checked={islem.tur === t.val}
                      onChange={e => setIslem(p => ({ ...p, tur: e.target.value }))} style={{ display: 'none' }} />
                    <i className={`bi ${t.icon}`} style={{ fontSize: 24, color: t.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: islem.tur === t.val ? t.color : '#64748b' }}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label style={lblS}>Tutar (₺) *</label>
              <input type="number" value={islem.tutar} onChange={e => setIslem(p => ({ ...p, tutar: e.target.value }))}
                placeholder="0,00" min="0.01" step="0.01" className="form-control form-control-custom" required />
            </div>
            <div>
              <label style={lblS}>Açıklama *</label>
              <textarea value={islem.aciklama} onChange={e => setIslem(p => ({ ...p, aciklama: e.target.value }))}
                placeholder="İşlem açıklaması..." rows={2} className="form-control form-control-custom"
                style={{ resize: 'none', borderRadius: 10 }} required />
            </div>
          </div>
          <MFooter onIptal={() => setIslemModalAcik(false)} yukleniyor={yukleniyor}
            kaydetLabel="İşlemi Uygula" kaydetStyle={{ background: 'linear-gradient(135deg,#059669,#047857)' }} />
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL 3 — Hesap Ekstresi
      ══════════════════════════════════════════════ */}
      <Modal open={ekstreModalAcik} onClose={() => setEkstreModalAcik(false)} size="xl" scrollable>
        <MHeader icon="bi-file-earmark-bar-graph-fill" baslik="Hesap Ekstresi" altBaslik={ekstreCari?.unvan}
          onKapat={() => setEkstreModalAcik(false)} />
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {ekstreCari && (
            <div className="row g-3 mb-4">
              {[
                { label: 'Güncel Bakiye',  val: TL(ekstreCari.bakiye),       color: ekstreCari.bakiye >= 0 ? '#059669' : '#e11d48' },
                { label: 'Kredi Limiti',   val: TL(ekstreCari.kredi_limiti), color: 'var(--brand-dark)' },
                { label: 'İşlem Sayısı',  val: (MOCK_HAREKETLER[ekstreCari.id] || []).length, color: '#0f172a' },
                { label: 'Son İşlem',     val: tarihFmt(ekstreCari.son_islem), color: '#64748b' },
              ].map((item, i) => (
                <div key={i} className="col-6 col-md-3">
                  <div style={{ padding: '14px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>{item.label}</div>
                    <div className="financial-num" style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.val}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(() => {
            const hareketler = ekstreCari ? (MOCK_HAREKETLER[ekstreCari.id] || []) : []
            if (!hareketler.length) return (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <i className="bi bi-inbox" style={{ fontSize: 40, color: '#cbd5e1', display: 'block', marginBottom: 10 }} />
                <p style={{ fontWeight: 600, fontSize: 13, color: '#94a3b8' }}>Hareket kaydı bulunamadı.</p>
              </div>
            )
            return (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  <th style={thS}>Tarih</th><th style={thS}>Açıklama</th><th style={thS}>Tür</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Tutar</th>
                </tr></thead>
                <tbody>
                  {hareketler.map(h => {
                    const poz = h.tutar > 0
                    return (
                      <tr key={h.id} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={tdS}><span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{tarihFmt(h.tarih)}</span></td>
                        <td style={tdS}><span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{h.aciklama}</span></td>
                        <td style={tdS}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                            background: poz ? 'rgba(244,63,94,0.07)' : 'rgba(16,185,129,0.08)',
                            color: poz ? '#e11d48' : '#059669',
                            border: `1px solid ${poz ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                            {h.tur === 'alacak' ? 'Satış/Alacak' : h.tur === 'odeme' ? 'Tahsilat' : 'Borç'}
                          </span>
                        </td>
                        <td style={{ ...tdS, textAlign: 'right' }}>
                          <span className="financial-num" style={{ fontSize: 14, fontWeight: 800, color: poz ? '#e11d48' : '#059669' }}>
                            {poz ? '+' : ''}{TL(h.tutar)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          })()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <button onClick={() => setEkstreModalAcik(false)} style={cancelBtnS}>Kapat</button>
          <button onClick={() => toast.info('PDF çıktı yakında aktif olacak.')} style={saveBtnS}>
            <i className="bi bi-file-earmark-pdf me-2" />PDF İndir
          </button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL 4 — Silme Onayı
      ══════════════════════════════════════════════ */}
      <Modal open={silModalAcik} onClose={() => setSilModalAcik(false)} size="sm" staticBackdrop>
        <div style={{ padding: '32px 28px 24px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(244,63,94,0.09)', border: '1px solid rgba(244,63,94,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 26, color: '#f43f5e' }} />
          </div>
          <h5 style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Cari Pasife Al</h5>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 0 }}>
            <strong style={{ color: '#0f172a' }}>{silCari?.unvan}</strong> cari kaydını pasife almak istediğinizden emin misiniz?
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '0 28px 28px' }}>
          <button onClick={() => setSilModalAcik(false)} style={{ ...cancelBtnS, minWidth: 110 }}>Vazgeç</button>
          <button onClick={silOnayla} disabled={yukleniyor} style={{ minWidth: 110, background: 'linear-gradient(135deg,#f43f5e,#be123c)',
            color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '9px 20px',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
            {yukleniyor
              ? <><i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }} /> İşleniyor...</>
              : <><i className="bi bi-trash" /> Pasife Al</>}
          </button>
        </div>
      </Modal>
    </>
  )
}

// ─── Küçük Yardımcı Bileşenler ────────────────────────────────────────────────
function AkBtn({ title, color, icon, onClick }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 32, height: 32, padding: 0, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 8, border: `1px solid ${color}28`, background: `${color}12`, color, fontSize: 14, transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}25`; e.currentTarget.style.transform = 'scale(1.12)' }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.transform = 'scale(1)' }}>
      <i className={`bi ${icon}`} />
    </button>
  )
}

function PgBtn({ children, onClick, disabled, aktif }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      minWidth: 32, height: 32, padding: '0 8px', borderRadius: 8, border: '1px solid #e2e8f0',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: aktif ? 'var(--brand-dark)' : '#fff',
      color: aktif ? '#fff' : disabled ? '#cbd5e1' : '#475569',
      fontWeight: aktif ? 800 : 600, fontSize: 12, fontFamily: 'inherit',
    }}>{children}</button>
  )
}

function MHeader({ icon, baslik, altBaslik, onKapat, headerBg }) {
  return (
    <div style={{ background: headerBg || 'linear-gradient(135deg,var(--brand-dark),#1a5b80)', padding: '18px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className={`bi ${icon}`} style={{ color: '#fff', fontSize: 20 }} />
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>{baslik}</div>
          {altBaslik && <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 500 }}>{altBaslik}</div>}
        </div>
      </div>
      <button onClick={onKapat} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
        color: '#fff', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
      </button>
    </div>
  )
}

function MFooter({ onIptal, yukleniyor, kaydetLabel, kaydetStyle = {} }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
      <button type="button" onClick={onIptal} style={cancelBtnS}>İptal</button>
      <button type="submit" disabled={yukleniyor} style={{ ...saveBtnS, ...kaydetStyle }}>
        {yukleniyor
          ? <><i className="bi bi-arrow-repeat me-2" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />Kaydediliyor...</>
          : <><i className="bi bi-check-lg me-2" />{kaydetLabel}</>}
      </button>
    </div>
  )
}

// ─── Stil Sabitleri ────────────────────────────────────────────────────────────
const ekleBtn = { background: 'linear-gradient(135deg,var(--brand-dark),#1a5b80)', color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '9px 20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(18,63,89,0.25)', fontFamily: 'inherit' }
const thS     = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '11px 16px', whiteSpace: 'nowrap', borderBottom: '2px solid #f1f5f9', userSelect: 'none', background: '#f8fafc' }
const tdS     = { fontSize: 13, padding: '13px 16px', verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' }
const lblS    = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }
const selS    = { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--brand-dark)', fontFamily: "'Plus Jakarta Sans',sans-serif", borderRadius: 10, fontSize: '0.9rem', cursor: 'pointer' }
const cancelBtnS = { background: '#f8fafc', color: '#475569', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '9px 20px', border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit' }
const saveBtnS   = { background: 'linear-gradient(135deg,var(--brand-dark),#1a5b80)', color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '9px 24px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }
const ikonKutu = (color, bg) => ({ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' })
const kartEtiket = (color) => ({ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.07em' })
