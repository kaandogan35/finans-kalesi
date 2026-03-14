/**
 * CariYonetimi.jsx — Cari & Finans Yönetimi
 * Bootstrap 5 + Premium CSS | Finans Kalesi
 * Modallar: Saf React state + createPortal
 * Revizyon: Cari Kart (Netsis mantığı), Dinamik İşlem, PDF Ekstre
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { carilerApi } from '../../api/cariler'

// ─── Para Formatı ─────────────────────────────────────────────────────────────
const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)
const tarihFmt = (s) => (s ? new Date(s).toLocaleDateString('tr-TR') : '—')
const bugunTarih = () => new Date().toISOString().split('T')[0]

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
        padding: '1px 4px', color: '#94a3b8', fontSize: 13,
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
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const maxW = size === 'xl' ? 1140 : size === 'lg' ? 800 : size === 'sm' ? 420 : 520

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

// ─── API ↔ UI Alan Dönüştürücüleri ──────────────────────────────────────────
function apiToUI(c) {
  return {
    ...c,
    unvan:    c.cari_adi ?? '',
    cariTip:  c.cari_turu === 'tedarikci' ? 'satici' : c.cari_turu === 'her_ikisi' ? 'her_ikisi' : 'alici',
    tip:      'kurumsal',
    durum:    c.aktif_mi ? 'aktif' : 'pasif',
    son_islem: c.son_islem_tarihi ?? null,
    il:       c.il ?? '',
    ilce:     c.ilce ?? '',
    bakiye:   parseFloat(c.bakiye ?? 0),
  }
}

function uiToAPI(form) {
  return {
    cari_adi:    form.unvan.trim(),
    cari_turu:   form.cariTip === 'satici' ? 'tedarikci' : 'musteri',
    telefon:     form.telefon   || null,
    adres:       form.adres     || null,
    il:          form.il        || null,
    ilce:        form.ilce      || null,
    vergi_no:    form.vergi_no  || null,
    aktif_mi:    form.durum === 'aktif' ? 1 : 0,
  }
}

// ─── PDF Oluşturucu ──────────────────────────────────────────────────────────
async function ekstrePdfIndir(cari, hareketler) {
  const html2pdf = (await import('html2pdf.js')).default

  let toplamBorc = 0, toplamAlacak = 0
  hareketler.forEach(h => {
    if (h.islem_tipi === 'borclandirma') toplamBorc += parseFloat(h.tutar_tl ?? 0)
    else toplamAlacak += parseFloat(h.tutar_tl ?? 0)
  })

  const satirlar = hareketler.map((h, i) => {
    const borc = h.islem_tipi === 'borclandirma'
    return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
      <td style="padding:10px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9">${tarihFmt(h.islem_tarihi)}</td>
      <td style="padding:10px 14px;font-size:13px;color:#1e293b;font-weight:600;border-bottom:1px solid #f1f5f9">${h.aciklama || '—'}</td>
      <td style="padding:10px 14px;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid #f1f5f9;color:${borc ? '#dc2626' : '#059669'}">
        ${borc ? '' : TL(h.tutar_tl)}
      </td>
      <td style="padding:10px 14px;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid #f1f5f9;color:${borc ? '#dc2626' : '#059669'}">
        ${borc ? TL(h.tutar_tl) : ''}
      </td>
    </tr>`
  }).join('')

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#1e293b">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:18px;border-bottom:2px solid #123F59">
        <div>
          <div style="font-size:22px;font-weight:800;color:#123F59;letter-spacing:-0.02em">Finans Kalesi</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">Hesap Ekstresi</div>
        </div>
        <div style="text-align:right;font-size:12px;color:#64748b">
          <div>Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
        </div>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 22px;margin-bottom:24px">
        <div style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:6px">${cari.unvan}</div>
        <div style="display:flex;gap:32px;font-size:12px;color:#64748b">
          ${cari.telefon ? `<span>Tel: ${cari.telefon}</span>` : ''}
          ${cari.vergi_no ? `<span>VN: ${cari.vergi_no}</span>` : ''}
          ${cari.vergi_dairesi ? `<span>VD: ${cari.vergi_dairesi}</span>` : ''}
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#123F59">
            <th style="padding:11px 14px;font-size:11px;font-weight:700;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:0.05em">Tarih</th>
            <th style="padding:11px 14px;font-size:11px;font-weight:700;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:0.05em">Açıklama</th>
            <th style="padding:11px 14px;font-size:11px;font-weight:700;color:#fff;text-align:right;text-transform:uppercase;letter-spacing:0.05em">Alacak</th>
            <th style="padding:11px 14px;font-size:11px;font-weight:700;color:#fff;text-align:right;text-transform:uppercase;letter-spacing:0.05em">Borç</th>
          </tr>
        </thead>
        <tbody>
          ${satirlar || '<tr><td colspan="4" style="padding:30px;text-align:center;color:#94a3b8">Hareket kaydı bulunamadı.</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background:#f1f5f9;border-top:2px solid #e2e8f0">
            <td colspan="2" style="padding:12px 14px;font-size:13px;font-weight:800;color:#0f172a">TOPLAM</td>
            <td style="padding:12px 14px;font-size:14px;font-weight:800;text-align:right;color:#059669">${TL(toplamAlacak)}</td>
            <td style="padding:12px 14px;font-size:14px;font-weight:800;text-align:right;color:#dc2626">${TL(toplamBorc)}</td>
          </tr>
          <tr style="background:#123F59">
            <td colspan="2" style="padding:12px 14px;font-size:13px;font-weight:800;color:#fff">BAKİYE</td>
            <td colspan="2" style="padding:12px 14px;font-size:16px;font-weight:800;text-align:right;color:${cari.bakiye > 0 ? '#fca5a5' : cari.bakiye < 0 ? '#6ee7b7' : 'rgba(255,255,255,0.7)'}">${TL(cari.bakiye)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8">
        Bu belge Finans Kalesi yazılımı tarafından otomatik oluşturulmuştur. · ${new Date().toLocaleDateString('tr-TR')}
      </div>
    </div>
  `

  const container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)

  try {
    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `ekstre_${cari.unvan.replace(/\s+/g, '_')}_${bugunTarih()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(container).save()
    toast.success('PDF başarıyla indirildi.')
  } catch {
    toast.error('PDF oluşturulamadı.')
  } finally {
    document.body.removeChild(container)
  }
}


// ─── Para Input Formatter (On-the-fly Masking: 100.000,50) ──────────────────
const formatParaInput = (value) => {
  let v = value.replace(/[^0-9,]/g, '')
  const parts = v.split(',')
  if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = v.split(',')
  const formatted = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? formatted + ',' + kesir.slice(0, 2) : formatted
}
const parseParaInput = (formatted) => parseFloat(String(formatted).replace(/\./g, '').replace(',', '.')) || 0

const bosForm  = { cariTip: 'alici', tip: 'kurumsal', unvan: '', telefon: '', adres: '', il: '', ilce: '', vergi_no: '', durum: 'aktif' }
const bosIslem = { tur: 'tahsilat', tutar: '', aciklama: '', tarih: bugunTarih() }

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function CariYonetimi() {
  const [cariler, setCariler]           = useState([])
  const [listYukleniyor, setListYukleniyor] = useState(true)
  const [listHata, setListHata]         = useState(null)
  const [ozetIstatistikler, setOzetIstatistikler] = useState({ toplam_alacaklar: 0, toplam_borclar: 0 })

  const [aktifSekme, setAktifSekme]   = useState('alici')
  const [arama, setArama]             = useState('')
  const [sayfa, setSayfa]             = useState(1)
  const sayfaBasi = 8

  // Cari Ekle/Düzenle modal
  const [cariModalAcik, setCariModalAcik]     = useState(false)
  const [cariMod, setCariMod]                 = useState('ekle')
  const [seciliCari, setSeciliCari]           = useState(null)

  // Finansal İşlem modal
  const [islemModalAcik, setIslemModalAcik]   = useState(false)
  const [islemCari, setIslemCari]             = useState(null)

  // Cari Kart modal (Netsis mantığı — Bilgiler + Ekstre)
  const [kartModalAcik, setKartModalAcik]     = useState(false)
  const [kartCari, setKartCari]               = useState(null)
  const [kartSekme, setKartSekme]             = useState('bilgiler')
  const [kartHareketler, setKartHareketler]   = useState([])
  const [kartHareketYukleniyor, setKartHareketYukleniyor] = useState(false)
  const [kartDuzenleModu, setKartDuzenleModu] = useState(false)
  const [kartForm, setKartForm]               = useState(bosForm)

  // İşlem düzenleme (ekstre içi)
  const [duzenHareket, setDuzenHareket]       = useState(null) // düzenlenen hareket id
  const [duzenForm, setDuzenForm]             = useState({ tutar: '', aciklama: '', tarih: '', tur: '' })
  const [silHareketId, setSilHareketId]       = useState(null)

  // Silme modal
  const [silModalAcik, setSilModalAcik]       = useState(false)
  const [silCari, setSilCari]                 = useState(null)

  const [form, setForm]             = useState(bosForm)
  const [islem, setIslem]           = useState(bosIslem)
  const [yukleniyor, setYukleniyor] = useState(false)

  // ─── Veri Yükleme ────────────────────────────────────────────────────────
  const veriYukle = useCallback(async () => {
    setListYukleniyor(true)
    setListHata(null)
    try {
      const [listYanit, ozetYanit] = await Promise.all([
        carilerApi.listele({ adet: 100 }),
        carilerApi.ozet(),
      ])
      const liste = listYanit.data.veri?.cariler || []
      setCariler(liste.map(apiToUI))
      setOzetIstatistikler(ozetYanit.data.veri ?? { toplam_alacaklar: 0, toplam_borclar: 0 })
    } catch (err) {
      setListHata(err.response?.data?.hata || 'Veriler yüklenemedi.')
    } finally {
      setListYukleniyor(false)
    }
  }, [])

  useEffect(() => { veriYukle() }, [veriYukle])

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
    else s.sort((a, b) => a.bakiye - b.bakiye)
    return s
  })()

  useEffect(() => { setSayfa(1) }, [aktifSekme, arama])

  const sayfaliVeri = filtrelendi.slice((sayfa - 1) * sayfaBasi, sayfa * sayfaBasi)
  const toplamSayfa = Math.ceil(filtrelendi.length / sayfaBasi)

  // ─── İstatistikler (2 kart: Toplam Alacak + Toplam Borç) ──────────────
  // /api/cariler/ozet endpoint'inden gelir — bakiye > 0 olanların toplamı (gerçek net rakamlar)
  const stats = {
    toplamAlacak: parseFloat(ozetIstatistikler.toplam_alacaklar ?? 0),
    toplamBorc:   parseFloat(ozetIstatistikler.toplam_borclar   ?? 0),
  }


  // ─── Cari Modal ─────────────────────────────────────────────────────────
  const cariEkleAc = () => {
    setForm({ ...bosForm, cariTip: aktifSekme === 'satici' ? 'satici' : 'alici' })
    setCariMod('ekle'); setSeciliCari(null); setCariModalAcik(true)
  }
  const cariKaydet = async (e) => {
    e.preventDefault()
    if (!form.unvan.trim()) { toast.error('Cari ünvanı zorunludur.'); return }
    setYukleniyor(true)
    try {
      if (cariMod === 'ekle') {
        const yanit = await carilerApi.olustur(uiToAPI(form))
        setCariler(p => [apiToUI(yanit.data.veri), ...p])
        toast.success('Cari başarıyla eklendi.')
      } else {
        const yanit = await carilerApi.guncelle(seciliCari.id, uiToAPI(form))
        setCariler(p => p.map(c => c.id === seciliCari.id ? apiToUI(yanit.data.veri) : c))
        toast.success('Cari güncellendi.')
      }
      setCariModalAcik(false)
    } catch (err) {
      toast.error(err.response?.data?.hata || 'İşlem sırasında hata oluştu.')
    } finally { setYukleniyor(false) }
  }

  // ─── Finansal İşlem ──────────────────────────────────────────────────────
  const islemAc = (cari) => {
    setIslem({ ...bosIslem, tarih: bugunTarih() })
    setIslemCari(cari)
    setIslemModalAcik(true)
  }
  const islemKaydet = async (e) => {
    e.preventDefault()
    const tutar = parseParaInput(islem.tutar)
    if (!tutar || tutar <= 0) { toast.error('Geçerli bir tutar girin.'); return }
    setYukleniyor(true)
    try {
      await carilerApi.hareket_olustur(islemCari.id, {
        islem_tipi: islem.tur,
        tutar,
        aciklama: islem.aciklama.trim() || null,
        islem_tarihi: islem.tarih || bugunTarih(),
      })
      const turLabel = islemCari.cariTip === 'alici'
        ? (islem.tur === 'tahsilat' ? 'Tahsilat' : 'Borç kaydı')
        : (islem.tur === 'tahsilat' ? 'Ödeme' : 'Borç kaydı')
      toast.success(`${TL(tutar)} ${turLabel.toLowerCase()} işlemi tamamlandı.`)
      setIslemModalAcik(false)
      veriYukle()
      // Eğer cari kart açıksa hareketleri de güncelle
      if (kartModalAcik && kartCari?.id === islemCari.id) {
        kartHareketleriYukle(islemCari)
      }
    } catch (err) {
      toast.error(err.response?.data?.hata || 'İşlem sırasında hata oluştu.')
    } finally { setYukleniyor(false) }
  }

  // ─── Cari Kart Modalı (Netsis) ─────────────────────────────────────────
  const kartHareketleriYukle = async (cari) => {
    setKartHareketYukleniyor(true)
    try {
      const yanit = await carilerApi.hareketler(cari.id)
      setKartHareketler(yanit.data.veri?.hareketler || [])
    } catch {
      setKartHareketler([])
    } finally {
      setKartHareketYukleniyor(false)
    }
  }

  const kartAc = async (cari, sekme = 'bilgiler') => {
    setKartCari(cari)
    setKartSekme(sekme)
    setKartDuzenleModu(false)
    setKartHareketler([])
    setKartForm({
      cariTip: cari.cariTip, tip: cari.tip, unvan: cari.unvan,
      telefon: cari.telefon || '', adres: cari.adres || '',
      il: cari.il || '', ilce: cari.ilce || '',
      vergi_no: cari.vergi_no || '',
      durum: cari.durum,
    })
    setKartModalAcik(true)
    kartHareketleriYukle(cari)
  }

  const kartCariGuncelle = async (e) => {
    e.preventDefault()
    if (!kartForm.unvan.trim()) { toast.error('Cari ünvanı zorunludur.'); return }
    setYukleniyor(true)
    try {
      const yanit = await carilerApi.guncelle(kartCari.id, uiToAPI(kartForm))
      const guncellenmis = apiToUI(yanit.data.veri)
      setCariler(p => p.map(c => c.id === kartCari.id ? guncellenmis : c))
      setKartCari(guncellenmis)
      setKartDuzenleModu(false)
      toast.success('Cari bilgileri güncellendi.')
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Güncelleme başarısız.')
    } finally { setYukleniyor(false) }
  }

  // ─── Hareket Düzenleme / Silme ──────────────────────────────────────────
  const hareketDuzenleAc = (h) => {
    setDuzenHareket(h.id)
    setDuzenForm({
      tutar: formatParaInput(String(parseFloat(h.tutar_tl ?? 0)).replace('.', ',')),
      aciklama: h.aciklama || '',
      tarih: h.islem_tarihi ? h.islem_tarihi.split('T')[0].split(' ')[0] : bugunTarih(),
      tur: h.islem_tipi,
    })
  }

  const hareketDuzenleKaydet = async () => {
    const tutar = parseParaInput(duzenForm.tutar)
    if (!tutar || tutar <= 0) { toast.error('Geçerli bir tutar girin.'); return }
    setYukleniyor(true)
    try {
      await carilerApi.hareket_guncelle(kartCari.id, duzenHareket, {
        islem_tipi: duzenForm.tur,
        tutar,
        aciklama: duzenForm.aciklama.trim() || null,
        islem_tarihi: duzenForm.tarih || bugunTarih(),
      })
      toast.success('İşlem güncellendi.')
      setDuzenHareket(null)
      kartHareketleriYukle(kartCari)
      veriYukle()
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Güncelleme başarısız.')
    } finally { setYukleniyor(false) }
  }

  const hareketSil = async (hId) => {
    setYukleniyor(true)
    try {
      await carilerApi.hareket_sil(kartCari.id, hId)
      toast.success('İşlem silindi.')
      setSilHareketId(null)
      kartHareketleriYukle(kartCari)
      veriYukle()
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Silme başarısız.')
    } finally { setYukleniyor(false) }
  }

  // ─── Silme ───────────────────────────────────────────────────────────────
  const silOnayla = async () => {
    setYukleniyor(true)
    try {
      await carilerApi.sil(silCari.id)
      setCariler(p => p.filter(c => c.id !== silCari.id))
      toast.success(`"${silCari.unvan}" pasife alındı.`)
      setSilModalAcik(false)
      if (kartModalAcik && kartCari?.id === silCari.id) setKartModalAcik(false)
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Silme işlemi başarısız.')
    } finally { setYukleniyor(false) }
  }

  // ─── Dinamik İşlem Etiketleri (Cari tipine göre) ──────────────────────
  const islemEtiketleri = (cari) => {
    if (!cari) return { tahsilat: 'Tahsilat Al', borc: 'Borç İşle', baslik: 'Finansal İşlem' }
    if (cari.cariTip === 'alici') {
      return { tahsilat: 'Tahsilat Al', borc: 'Borç İşle', baslik: `Müşteri İşlemi — ${cari.unvan}` }
    }
    return { tahsilat: 'Ödeme Yap', borc: 'Borç İşle', baslik: `Tedarikçi İşlemi — ${cari.unvan}` }
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Sayfa Başlığı */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', marginBottom: 2, letterSpacing: '-0.02em' }}>
            Cari & Finans Yönetimi
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: 14, fontWeight: 500 }}>
            {cariler.length} toplam cari · {cariler.filter(c => c.durum === 'aktif').length} aktif
          </p>
        </div>
        <button onClick={cariEkleAc} className="btn d-flex align-items-center gap-2" style={ekleBtn}>
          <i className="bi bi-plus-lg" /> Yeni Cari Ekle
        </button>
      </div>

      {/* ═══ Stat Kartları (2 Kart: Toplam Alacak + Toplam Borç) ═══ */}
      <div className="row g-3 mb-4">
        {/* Toplam Alacak — YEŞİL */}
        <div className="col-12 col-md-6">
          <div className="light-card tint-green p-4">
            <i className="bi bi-arrow-down-circle-fill card-deco-icon" style={{ color: '#059669' }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu('#059669', 'rgba(16,185,129,0.14)')}><i className="bi bi-wallet2" style={{ color: '#059669', fontSize: 18 }} /></div>
              <span style={kartEtiket('#059669')}>Toplam Alacak</span>
            </div>
            <div className="financial-num" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#065f46', lineHeight: 1.1 }}>{TL(stats.toplamAlacak)}</div>
            <p style={{ fontSize: 13, color: '#059669', margin: '5px 0 0', fontWeight: 600, opacity: 0.8 }}>
              Müşterilerden toplanacak tutar
            </p>
          </div>
        </div>

        {/* Toplam Borç — KIRMIZI */}
        <div className="col-12 col-md-6">
          <div className="light-card tint-rose p-4">
            <i className="bi bi-arrow-up-circle-fill card-deco-icon" style={{ color: '#dc2626' }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div style={ikonKutu('#dc2626', 'rgba(220,38,38,0.1)')}><i className="bi bi-cash-stack" style={{ color: '#dc2626', fontSize: 18 }} /></div>
              <span style={kartEtiket('#dc2626')}>Toplam Borç</span>
            </div>
            <div className="financial-num" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#991b1b', lineHeight: 1.1 }}>{TL(stats.toplamBorc)}</div>
            <p style={{ fontSize: 13, color: '#dc2626', margin: '5px 0 0', fontWeight: 600, opacity: 0.8 }}>
              Tedarikçilere ödenecek tutar
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Tablo Kartı ═══ */}
      <div className="premium-card" style={{ padding: 0 }}>

        {/* Sekmeler + Arama — Bootstrap nav-tabs */}
        <div className="px-3 pt-3 border-bottom">
          <div className="d-flex align-items-end justify-content-between flex-wrap gap-2">
            <ul className="nav nav-tabs border-0 gap-1" role="tablist">
              {[
                { key: 'alici',  label: 'Müşteriler',  icon: 'bi-person-check-fill',  sayi: cariler.filter(c => c.cariTip === 'alici').length },
                { key: 'satici', label: 'Tedarikçiler', icon: 'bi-truck',             sayi: cariler.filter(c => c.cariTip === 'satici').length },
              ].map(s => {
                const a = aktifSekme === s.key
                return (
                  <li key={s.key} className="nav-item" role="presentation">
                    <button
                      onClick={() => setAktifSekme(s.key)}
                      className={`nav-link d-flex align-items-center gap-2 ${a ? 'active' : ''}`}
                      role="tab"
                      style={{
                        fontSize: 14, fontWeight: a ? 700 : 600, border: 'none', borderRadius: '8px 8px 0 0',
                        borderBottom: a ? '2px solid var(--brand-dark)' : '2px solid transparent',
                        color: a ? 'var(--brand-dark)' : '#64748b', background: 'none',
                      }}
                    >
                      <i className={`bi ${s.icon}`} style={{ fontSize: 14 }} />
                      {s.label}
                      <span className="badge rounded-pill" style={{
                        background: a ? 'rgba(18,63,89,0.1)' : '#f1f5f9',
                        color: a ? 'var(--brand-dark)' : '#94a3b8',
                        fontSize: 11, fontWeight: 800,
                      }}>{s.sayi}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="pb-2">
              <div className="input-group" style={{ width: 280 }}>
                <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '10px 0 0 10px' }}>
                  <i className="bi bi-search" style={{ color: '#94a3b8', fontSize: 14 }} />
                </span>
                <input
                  type="text"
                  value={arama}
                  onChange={e => setArama(e.target.value)}
                  placeholder="Ara: ünvan, tel, vergi no..."
                  className="form-control bg-light border-start-0"
                  style={{ fontSize: 14, fontWeight: 600, borderRadius: '0 10px 10px 0' }}
                />
                {arama && (
                  <button onClick={() => setArama('')}
                    className="btn btn-sm position-absolute end-0 top-50 translate-middle-y"
                    style={{ zIndex: 5, color: '#94a3b8', fontSize: 17 }}>
                    <i className="bi bi-x" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-2 bg-light border-bottom">
          <small className="text-muted fw-semibold" style={{ fontSize: 13 }}>
            <i className="bi bi-sort-down me-1" />
            {aktifSekme === 'alici' ? 'Müşteriler bakiyeye göre büyükten küçüğe sıralı.' : 'Tedarikçiler borca göre büyükten küçüğe sıralı.'}
          </small>
        </div>

        {/* Yükleniyor */}
        {listYukleniyor && (
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="spinner-border text-secondary mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
            <span style={{ fontSize: 15, color: '#94a3b8', fontWeight: 600 }}>Cariler yükleniyor...</span>
          </div>
        )}

        {/* Hata */}
        {!listYukleniyor && listHata && (
          <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 px-3">
            <div className="rounded-3 d-flex align-items-center justify-content-center mb-3"
                 style={{ width: 52, height: 52, background: '#fff1f2', border: '1px solid #fecdd3' }}>
              <i className="bi bi-exclamation-circle text-danger" style={{ fontSize: 24 }} />
            </div>
            <p className="text-danger fw-semibold mb-3" style={{ fontSize: 14 }}>{listHata}</p>
            <button onClick={veriYukle} className="btn btn-outline-brand" style={{ borderRadius: 10, fontSize: 14, height: 40, padding: '0 18px' }}>
              <i className="bi bi-arrow-clockwise me-1" /> Tekrar Dene
            </button>
          </div>
        )}

        {/* Tablo */}
        {!listYukleniyor && !listHata && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thS}>Cari Ünvanı & İletişim</th>
                <th style={thS}>Son İşlem</th>
                <th style={{ ...thS, textAlign: 'right' }}>Alacak</th>
                <th style={{ ...thS, textAlign: 'right' }}>Borç</th>
                <th style={{ ...thS, textAlign: 'right' }}>Toplam Bakiye</th>
                <th style={{ ...thS, textAlign: 'right', cursor: 'default' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {sayfaliVeri.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-5 px-3">
                  <i className="bi bi-inbox d-block mb-2" style={{ fontSize: 40, color: '#cbd5e1' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>
                    {arama ? 'Aramanızla eşleşen cari bulunamadı.' : 'Bu kategoride kayıt yok.'}
                  </span>
                </td></tr>
              ) : sayfaliVeri.map((cari, idx) => {
                const bakR = cari.bakiye > 0 ? '#dc2626' : cari.bakiye < 0 ? '#059669' : '#64748b'
                const bg  = idx % 2 === 0 ? '#fff' : '#fafbfc'
                const borc   = parseFloat(cari.toplam_borc ?? 0)
                const alacak = parseFloat(cari.toplam_alacak ?? 0)
                return (
                  <tr key={cari.id} style={{ background: bg, transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                    onMouseLeave={e => e.currentTarget.style.background = bg}>

                    {/* Cari Ünvanı & İletişim */}
                    <td style={tdS}>
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                        <div className="flex-shrink-0 d-flex align-items-center justify-content-center" style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: cari.cariTip === 'alici' ? 'rgba(18,63,89,0.08)' : 'rgba(217,119,6,0.1)',
                          border: cari.cariTip === 'alici' ? '1px solid rgba(18,63,89,0.12)' : '1px solid rgba(217,119,6,0.2)',
                        }}>
                          <i className={`bi ${cari.tip === 'kurumsal' ? 'bi-buildings-fill' : 'bi-person-fill'}`}
                            style={{ fontSize: 16, color: cari.cariTip === 'alici' ? 'var(--brand-dark)' : '#d97706' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            onClick={() => kartAc(cari)}
                            className="text-truncate"
                            style={{ fontWeight: 700, fontSize: 14, color: cari.cariTip === 'alici' ? 'var(--brand-dark)' : '#d97706', cursor: 'pointer',
                              textDecoration: 'underline', textDecorationStyle: 'dotted', textDecorationColor: cari.cariTip === 'alici' ? 'rgba(18,63,89,0.3)' : 'rgba(217,119,6,0.3)' }}
                            title="Cari kartını görüntüle"
                          >
                            {cari.unvan}
                          </div>
                          <div className="d-flex align-items-center gap-1" style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                            {cari.telefon ? (
                              <>
                                <i className="bi bi-telephone-fill" style={{ fontSize: 10 }} />
                                <span>{cari.telefon}</span>
                                <KopyalaBtn value={cari.telefon} label="Telefon" />
                              </>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Son İşlem Tarihi */}
                    <td style={tdS}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                        {tarihFmt(cari.son_islem)}
                      </span>
                    </td>

                    {/* Alacak — YEŞİL (finansal standart) */}
                    <td className="text-end" style={tdS}>
                      <span className="financial-num" style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                        {alacak > 0 ? TL(alacak) : '—'}
                      </span>
                    </td>

                    {/* Borç — KIRMIZI (finansal standart) */}
                    <td className="text-end" style={tdS}>
                      <span className="financial-num" style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>
                        {borc > 0 ? TL(borc) : '—'}
                      </span>
                    </td>

                    {/* Toplam Bakiye */}
                    <td className="text-end" style={tdS}>
                      <div className="financial-num fw-bold" style={{ fontSize: 15, color: bakR }}>
                        {TL(cari.bakiye)}
                      </div>
                    </td>

                    {/* İşlemler */}
                    <td className="text-end" style={tdS}>
                      <div className="d-flex justify-content-end gap-1">
                        <AkBtn title="Finansal İşlem"  color="#10b981"           icon="bi-currency-exchange" onClick={() => islemAc(cari)} />
                        <AkBtn title="Cari Kart"       color="var(--brand-dark)" icon="bi-person-vcard"      onClick={() => kartAc(cari)} />
                        <AkBtn title="İşlem Geçmişi"   color="#f59e0b"           icon="bi-clock-history"      onClick={() => kartAc(cari, 'ekstre')} />
                        <AkBtn title="Sil / Pasife Al" color="#f43f5e"           icon="bi-trash"              onClick={() => { setSilCari(cari); setSilModalAcik(true) }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        )}

        {!listYukleniyor && !listHata && toplamSayfa > 1 && (
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-top bg-light">
            <small className="text-muted fw-semibold" style={{ fontSize: 13 }}>
              {filtrelendi.length} kayıttan {(sayfa - 1) * sayfaBasi + 1}–{Math.min(sayfa * sayfaBasi, filtrelendi.length)} gösteriliyor
            </small>
            <nav>
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li className={`page-item ${sayfa === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setSayfa(p => p - 1)} style={{ borderRadius: 8 }}>
                    <i className="bi bi-chevron-left" />
                  </button>
                </li>
                {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${p === sayfa ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setSayfa(p)}
                      style={{ borderRadius: 8, ...(p === sayfa ? { background: 'var(--brand-dark)', borderColor: 'var(--brand-dark)' } : {}) }}>
                      {p}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${sayfa === toplamSayfa ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setSayfa(p => p + 1)} style={{ borderRadius: 8 }}>
                    <i className="bi bi-chevron-right" />
                  </button>
                </li>
              </ul>
            </nav>
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
                    { val: 'alici',  label: 'Müşteri',    icon: 'bi-person-check-fill', color: '#059669', bg: 'rgba(16,185,129,0.07)'  },
                    { val: 'satici', label: 'Tedarikçi',  icon: 'bi-truck',             color: '#d97706', bg: 'rgba(245,158,11,0.07)' },
                  ].map(t => {
                    const sel = form.cariTip === t.val
                    return (
                      <label key={t.val} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                        border: `2px solid ${sel ? t.color : '#e2e8f0'}`, background: sel ? t.bg : '#fff', transition: 'all 0.15s' }}>
                        <input type="radio" name="cariTip" value={t.val} checked={sel}
                          onChange={e => setForm(p => ({ ...p, cariTip: e.target.value }))} style={{ display: 'none' }} />
                        <i className={`bi ${t.icon}`} style={{ fontSize: 20, color: sel ? t.color : '#94a3b8' }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: sel ? t.color : '#64748b' }}>{t.label}</span>
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
              <div className="col-12">
                <label style={lblS}>Adres</label>
                <textarea value={form.adres} onChange={e => setForm(p => ({ ...p, adres: e.target.value }))}
                  placeholder="Tam adres..." rows={2} className="form-control form-control-custom"
                  style={{ resize: 'none', borderRadius: 10 }} />
              </div>
              <div className="col-6">
                <label style={lblS}>İlçe</label>
                <input type="text" value={form.ilce} onChange={e => setForm(p => ({ ...p, ilce: e.target.value }))}
                  placeholder="Örn: Kadıköy" className="form-control form-control-custom" />
              </div>
              <div className="col-6">
                <label style={lblS}>İl</label>
                <input type="text" value={form.il} onChange={e => setForm(p => ({ ...p, il: e.target.value }))}
                  placeholder="Örn: İstanbul" className="form-control form-control-custom" />
              </div>
              <div className="col-6">
                <label style={lblS}>{form.tip === 'kurumsal' ? 'Vergi Numarası' : 'TC Kimlik No'}</label>
                <input type="text" value={form.vergi_no} onChange={e => setForm(p => ({ ...p, vergi_no: e.target.value }))}
                  placeholder={form.tip === 'kurumsal' ? '10 haneli' : '11 haneli'} className="form-control form-control-custom" />
              </div>
              <div className="col-6">
                <label style={lblS}>Telefon</label>
                <input type="text" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))}
                  placeholder="0212 555 00 00" className="form-control form-control-custom" />
              </div>
            </div>
          </div>
          <MFooter onIptal={() => setCariModalAcik(false)} yukleniyor={yukleniyor}
            kaydetLabel={cariMod === 'ekle' ? 'Cari Ekle' : 'Güncelle'} />
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL 2 — Finansal İşlem (Dinamik)
      ══════════════════════════════════════════════ */}
      <Modal open={islemModalAcik} onClose={() => setIslemModalAcik(false)} staticBackdrop>
        {(() => {
          const etiketler = islemEtiketleri(islemCari)
          return (
            <>
              <MHeader icon="bi-currency-exchange" baslik={etiketler.baslik}
                headerBg={islemCari?.cariTip === 'satici' ? 'linear-gradient(135deg,#d97706,#b45309)' : 'linear-gradient(135deg,#059669,#047857)'}
                onKapat={() => setIslemModalAcik(false)} />
              <form onSubmit={islemKaydet} noValidate>
                <div style={{ padding: 24 }}>
                  {islemCari && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>Güncel Bakiye</span>
                      <span className="financial-num" style={{ fontSize: 20, fontWeight: 800, color: islemCari.bakiye > 0 ? '#dc2626' : islemCari.bakiye < 0 ? '#059669' : '#64748b' }}>
                        {TL(islemCari.bakiye)}
                      </span>
                    </div>
                  )}
                  <div className="mb-3">
                    <label style={lblS}>İşlem Türü</label>
                    <div className="d-flex gap-2">
                      {[
                        { val: 'tahsilat',     label: etiketler.tahsilat, icon: 'bi-arrow-down-circle-fill', color: '#059669', bg: 'rgba(16,185,129,0.08)' },
                        { val: 'borclandirma', label: etiketler.borc,     icon: 'bi-arrow-up-circle-fill',   color: '#dc2626', bg: 'rgba(220,38,38,0.07)'  },
                      ].map(t => (
                        <label key={t.val} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          padding: '14px 10px', borderRadius: 12, cursor: 'pointer',
                          border: `2px solid ${islem.tur === t.val ? t.color : '#e2e8f0'}`,
                          background: islem.tur === t.val ? t.bg : '#fff', transition: 'all 0.15s' }}>
                          <input type="radio" name="islemTur" value={t.val} checked={islem.tur === t.val}
                            onChange={e => setIslem(p => ({ ...p, tur: e.target.value }))} style={{ display: 'none' }} />
                          <i className={`bi ${t.icon}`} style={{ fontSize: 26, color: t.color }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: islem.tur === t.val ? t.color : '#64748b' }}>{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label style={lblS}>Tutar (₺) *</label>
                    <input type="text" inputMode="decimal" value={islem.tutar}
                      onChange={e => setIslem(p => ({ ...p, tutar: formatParaInput(e.target.value) }))}
                      placeholder="0,00" className="form-control form-control-custom" required />
                  </div>
                  <div className="mb-3">
                    <label style={lblS}>İşlem Tarihi</label>
                    <input type="date" value={islem.tarih} onChange={e => setIslem(p => ({ ...p, tarih: e.target.value }))}
                      className="form-control form-control-custom" />
                  </div>
                  <div>
                    <label style={lblS}>Açıklama <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#94a3b8' }}>(opsiyonel)</span></label>
                    <textarea value={islem.aciklama} onChange={e => setIslem(p => ({ ...p, aciklama: e.target.value }))}
                      placeholder="İşlem açıklaması..." rows={2} className="form-control form-control-custom"
                      style={{ resize: 'none', borderRadius: 10 }} />
                  </div>
                </div>
                <MFooter onIptal={() => setIslemModalAcik(false)} yukleniyor={yukleniyor}
                  kaydetLabel={islem.tur === 'tahsilat' ? etiketler.tahsilat : etiketler.borc}
                  kaydetStyle={{ background: islem.tur === 'tahsilat' ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#dc2626,#991b1b)' }} />
              </form>
            </>
          )
        })()}
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL 3 — Cari Kart (Netsis Mantığı)
      ══════════════════════════════════════════════ */}
      <Modal open={kartModalAcik} onClose={() => setKartModalAcik(false)} size="xl" scrollable staticBackdrop>
        {kartCari && (
          <>
            {/* Header */}
            <div style={{
              background: kartCari.cariTip === 'satici' ? 'linear-gradient(135deg,#d97706,#b45309)' : 'linear-gradient(135deg,var(--brand-dark),#1a5b80)', padding: '18px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="bi bi-person-vcard-fill" style={{ color: '#fff', fontSize: 22 }} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>{kartCari.unvan}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, marginTop: 2 }}>
                    {kartCari.cariTip === 'alici' ? 'Müşteri' : 'Tedarikçi'} · Bakiye: <span className="financial-num" style={{ color: kartCari.bakiye > 0 ? '#fca5a5' : kartCari.bakiye < 0 ? '#6ee7b7' : 'rgba(255,255,255,0.7)' }}>{TL(kartCari.bakiye)}</span>
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                {/* Hızlı Aksiyon Butonları */}
                <button onClick={() => { islemAc(kartCari) }}
                  style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 10, color: '#fff',
                    padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                >
                  <i className="bi bi-currency-exchange" /> Finansal İşlem
                </button>
                <button onClick={() => ekstrePdfIndir(kartCari, kartHareketler)}
                  style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 10, color: '#fff',
                    padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                >
                  <i className="bi bi-file-earmark-pdf" /> PDF İndir
                </button>
                <button onClick={() => setKartModalAcik(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                  color: '#fff', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-x-lg" style={{ fontSize: 15 }} />
                </button>
              </div>
            </div>

            {/* Nav Tabs */}
            <div style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 24px', flexShrink: 0 }}>
              <ul className="nav nav-tabs border-0 gap-1" role="tablist" style={{ marginBottom: -1 }}>
                {[
                  { key: 'bilgiler', label: 'Cari Bilgiler', icon: 'bi-info-circle-fill' },
                  { key: 'ekstre',   label: 'Hesap Ekstresi', icon: 'bi-list-ul' },
                ].map(t => {
                  const a = kartSekme === t.key
                  return (
                    <li key={t.key} className="nav-item" role="presentation">
                      <button
                        onClick={() => setKartSekme(t.key)}
                        className={`nav-link d-flex align-items-center gap-2 ${a ? 'active' : ''}`}
                        role="tab"
                        style={{
                          fontSize: 14, fontWeight: a ? 700 : 600, border: 'none', borderRadius: '8px 8px 0 0',
                          borderBottom: a ? '2px solid var(--brand-dark)' : '2px solid transparent',
                          color: a ? 'var(--brand-dark)' : '#64748b', background: 'none', padding: '12px 18px',
                        }}
                      >
                        <i className={`bi ${t.icon}`} style={{ fontSize: 14 }} />
                        {t.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Sekme İçeriği */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {/* ─── Sekme 1: Cari Bilgiler ─── */}
              {kartSekme === 'bilgiler' && (
                <>
                  {!kartDuzenleModu ? (
                    <>
                      {/* Okuma Modu */}
                      <div className="d-flex justify-content-end mb-3">
                        <button onClick={() => setKartDuzenleModu(true)}
                          className="btn btn-outline-brand d-flex align-items-center gap-2"
                          style={{ borderRadius: 10, fontSize: 13, height: 38, padding: '0 16px' }}>
                          <i className="bi bi-pencil" /> Düzenle
                        </button>
                      </div>
                      <div className="row g-3">
                        {[
                          { label: 'Ünvan',         value: kartCari.unvan, icon: 'bi-building', col: 'col-12' },
                          { label: 'Adres',         value: kartCari.adres || 'Belirtilmedi', icon: 'bi-geo-alt', col: 'col-12' },
                          { label: 'İlçe',          value: kartCari.ilce || 'Belirtilmedi', icon: 'bi-pin-map', col: 'col-md-6' },
                          { label: 'İl',            value: kartCari.il || 'Belirtilmedi', icon: 'bi-geo', col: 'col-md-6' },
                          { label: 'Vergi No',      value: kartCari.vergi_no || 'Belirtilmedi', icon: 'bi-upc-scan', col: 'col-md-6' },
                          { label: 'Telefon',       value: kartCari.telefon || 'Belirtilmedi', icon: 'bi-telephone', col: 'col-md-6' },
                          { label: 'Durum',         value: kartCari.durum === 'aktif' ? 'Aktif' : 'Pasif', icon: 'bi-toggle-on', col: 'col-md-6' },
                        ].map((item, i) => (
                          <div key={i} className={`col-12 ${item.col}`}>
                            <div style={{ padding: '14px 18px', background: '#eef2f7', borderRadius: 12, border: '1px solid #dce3ed' }}>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <i className={`bi ${item.icon}`} style={{ fontSize: 13, color: '#7a8ba0' }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#7a8ba0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{item.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </>
                  ) : (
                    /* Düzenleme Modu */
                    <form onSubmit={kartCariGuncelle} noValidate>
                      <div className="row g-3">
                        <div className="col-12">
                          <label style={lblS}>Cari Rolü</label>
                          <div className="d-flex gap-2">
                            {[
                              { val: 'alici',  label: 'Müşteri',   icon: 'bi-person-check-fill', color: '#059669', bg: 'rgba(16,185,129,0.07)' },
                              { val: 'satici', label: 'Tedarikçi', icon: 'bi-truck',             color: '#d97706', bg: 'rgba(245,158,11,0.07)' },
                            ].map(t => {
                              const sel = kartForm.cariTip === t.val
                              return (
                                <label key={t.val} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                                  border: `2px solid ${sel ? t.color : '#e2e8f0'}`, background: sel ? t.bg : '#fff', transition: 'all 0.15s' }}>
                                  <input type="radio" name="kartCariTip" value={t.val} checked={sel}
                                    onChange={e => setKartForm(p => ({ ...p, cariTip: e.target.value }))} style={{ display: 'none' }} />
                                  <i className={`bi ${t.icon}`} style={{ fontSize: 20, color: sel ? t.color : '#94a3b8' }} />
                                  <span style={{ fontSize: 14, fontWeight: 700, color: sel ? t.color : '#64748b' }}>{t.label}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                        <div className="col-12">
                          <label style={lblS}>Cari Ünvanı *</label>
                          <input type="text" value={kartForm.unvan} onChange={e => setKartForm(p => ({ ...p, unvan: e.target.value }))}
                            className="form-control form-control-custom" required />
                        </div>
                        <div className="col-12">
                          <label style={lblS}>Adres</label>
                          <textarea value={kartForm.adres} onChange={e => setKartForm(p => ({ ...p, adres: e.target.value }))}
                            rows={2} className="form-control form-control-custom" style={{ resize: 'none', borderRadius: 10 }} />
                        </div>
                        <div className="col-6">
                          <label style={lblS}>İlçe</label>
                          <input type="text" value={kartForm.ilce} onChange={e => setKartForm(p => ({ ...p, ilce: e.target.value }))}
                            placeholder="Örn: Kadıköy" className="form-control form-control-custom" />
                        </div>
                        <div className="col-6">
                          <label style={lblS}>İl</label>
                          <input type="text" value={kartForm.il} onChange={e => setKartForm(p => ({ ...p, il: e.target.value }))}
                            placeholder="Örn: İstanbul" className="form-control form-control-custom" />
                        </div>
                        <div className="col-6">
                          <label style={lblS}>Vergi Numarası</label>
                          <input type="text" value={kartForm.vergi_no} onChange={e => setKartForm(p => ({ ...p, vergi_no: e.target.value }))}
                            className="form-control form-control-custom" />
                        </div>
                        <div className="col-6">
                          <label style={lblS}>Telefon</label>
                          <input type="text" value={kartForm.telefon} onChange={e => setKartForm(p => ({ ...p, telefon: e.target.value }))}
                            className="form-control form-control-custom" />
                        </div>
                        <div className="col-6">
                          <label style={lblS}>Durum</label>
                          <select value={kartForm.durum} onChange={e => setKartForm(p => ({ ...p, durum: e.target.value }))} style={selS}>
                            <option value="aktif">Aktif</option>
                            <option value="pasif">Pasif</option>
                          </select>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <button type="button" onClick={() => setKartDuzenleModu(false)} style={cancelBtnS}>İptal</button>
                        <button type="submit" disabled={yukleniyor} style={saveBtnS}>
                          {yukleniyor ? <><i className="bi bi-arrow-repeat me-2" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />Kaydediliyor...</> : <><i className="bi bi-check-lg me-2" />Kaydet</>}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* ─── Sekme 2: Hesap Ekstresi ─── */}
              {kartSekme === 'ekstre' && (
                <>
                  {/* Özet Kartları */}
                  <div className="row g-3 mb-4">
                    {[
                      { label: 'Güncel Bakiye', val: TL(kartCari.bakiye),       color: kartCari.bakiye > 0 ? '#dc2626' : kartCari.bakiye < 0 ? '#059669' : '#64748b' },
                      { label: 'İşlem Sayısı', val: kartHareketYukleniyor ? '…' : kartHareketler.length, color: '#0f172a' },
                      { label: 'Son İşlem',    val: tarihFmt(kartCari.son_islem), color: '#64748b' },
                    ].map((item, i) => (
                      <div key={i} className="col-6 col-md-4">
                        <div style={{ padding: '14px 16px', textAlign: 'center', background: '#eef2f7', borderRadius: 12, border: '1px solid #dce3ed' }}>
                          <div style={{ fontSize: 11, color: '#7a8ba0', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>{item.label}</div>
                          <div className="financial-num" style={{ fontSize: 17, fontWeight: 800, color: item.color }}>{item.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {kartHareketYukleniyor ? (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5">
                      <div className="spinner-border text-secondary mb-2" role="status" style={{ width: '2rem', height: '2rem' }}>
                        <span className="visually-hidden">Yükleniyor...</span>
                      </div>
                      <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>Hareketler yükleniyor...</span>
                    </div>
                  ) : kartHareketler.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <i className="bi bi-inbox" style={{ fontSize: 42, color: '#cbd5e1', display: 'block', marginBottom: 10 }} />
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#94a3b8' }}>Hareket kaydı bulunamadı.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: '#f8fafc' }}>
                          <th style={thS}>Tarih</th><th style={thS}>Açıklama</th><th style={thS}>Tür</th>
                          <th style={{ ...thS, textAlign: 'right' }}>Alacak</th>
                          <th style={{ ...thS, textAlign: 'right' }}>Borç</th>
                          <th style={{ ...thS, textAlign: 'right', width: 90 }}>İşlem</th>
                        </tr></thead>
                        <tbody>
                          {kartHareketler.map(h => {
                            const borc = h.islem_tipi === 'borclandirma'
                            const duzenlemede = duzenHareket === h.id

                            if (duzenlemede) {
                              const dBorc = duzenForm.tur === 'borclandirma'
                              return (
                                <tr key={h.id} style={{ background: '#fffbeb' }}>
                                  <td style={tdS}>
                                    <input type="date" value={duzenForm.tarih} onChange={e => setDuzenForm(p => ({ ...p, tarih: e.target.value }))}
                                      className="form-control form-control-sm" style={{ fontSize: 13, maxWidth: 150 }} />
                                  </td>
                                  <td style={tdS}>
                                    <input type="text" value={duzenForm.aciklama} onChange={e => setDuzenForm(p => ({ ...p, aciklama: e.target.value }))}
                                      placeholder="Açıklama..." className="form-control form-control-sm" style={{ fontSize: 13 }} />
                                  </td>
                                  <td style={tdS}>
                                    <select value={duzenForm.tur} onChange={e => setDuzenForm(p => ({ ...p, tur: e.target.value }))}
                                      className="form-select form-select-sm" style={{ fontSize: 12, maxWidth: 110 }}>
                                      <option value="tahsilat">Alacak</option>
                                      <option value="borclandirma">Borç</option>
                                    </select>
                                  </td>
                                  <td style={{ ...tdS, textAlign: 'right' }}>
                                    {!dBorc && (
                                      <input type="text" inputMode="decimal" value={duzenForm.tutar}
                                        onChange={e => setDuzenForm(p => ({ ...p, tutar: formatParaInput(e.target.value) }))}
                                        className="form-control form-control-sm text-end" style={{ fontSize: 13, maxWidth: 130, color: '#059669', fontWeight: 700 }} />
                                    )}
                                  </td>
                                  <td style={{ ...tdS, textAlign: 'right' }}>
                                    {dBorc && (
                                      <input type="text" inputMode="decimal" value={duzenForm.tutar}
                                        onChange={e => setDuzenForm(p => ({ ...p, tutar: formatParaInput(e.target.value) }))}
                                        className="form-control form-control-sm text-end" style={{ fontSize: 13, maxWidth: 130, color: '#dc2626', fontWeight: 700 }} />
                                    )}
                                  </td>
                                  <td style={{ ...tdS, textAlign: 'right' }}>
                                    <div className="d-flex justify-content-end gap-1">
                                      <button title="Kaydet" onClick={hareketDuzenleKaydet} disabled={yukleniyor}
                                        style={{ width: 30, height: 30, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer',
                                          background: 'rgba(5,150,105,0.12)', color: '#059669', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="bi bi-check-lg" />
                                      </button>
                                      <button title="Vazgeç" onClick={() => setDuzenHareket(null)}
                                        style={{ width: 30, height: 30, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer',
                                          background: 'rgba(100,116,139,0.1)', color: '#64748b', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="bi bi-x-lg" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            }

                            // Silme onayı satır içi
                            if (silHareketId === h.id) {
                              return (
                                <tr key={h.id} style={{ background: '#fff1f2' }}>
                                  <td colSpan={5} style={{ ...tdS, fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
                                    <i className="bi bi-exclamation-triangle me-2" />
                                    Bu işlemi silmek istediğinizden emin misiniz? <strong>{tarihFmt(h.islem_tarihi)}</strong> — {TL(h.tutar_tl)}
                                  </td>
                                  <td style={{ ...tdS, textAlign: 'right' }}>
                                    <div className="d-flex justify-content-end gap-1">
                                      <button title="Sil" onClick={() => hareketSil(h.id)} disabled={yukleniyor}
                                        style={{ width: 30, height: 30, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer',
                                          background: 'rgba(220,38,38,0.12)', color: '#dc2626', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="bi bi-trash" />
                                      </button>
                                      <button title="Vazgeç" onClick={() => setSilHareketId(null)}
                                        style={{ width: 30, height: 30, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer',
                                          background: 'rgba(100,116,139,0.1)', color: '#64748b', fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="bi bi-x-lg" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            }

                            return (
                              <tr key={h.id} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                <td style={tdS}><span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{tarihFmt(h.islem_tarihi)}</span></td>
                                <td style={tdS}><span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{h.aciklama || '—'}</span></td>
                                <td style={tdS}>
                                  <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                                    background: borc ? 'rgba(220,38,38,0.07)' : 'rgba(16,185,129,0.08)',
                                    color: borc ? '#dc2626' : '#059669',
                                    border: `1px solid ${borc ? 'rgba(220,38,38,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                                    {borc ? 'Borç' : 'Alacak'}
                                  </span>
                                </td>
                                <td style={{ ...tdS, textAlign: 'right' }}>
                                  <span className="financial-num" style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>
                                    {!borc ? TL(h.tutar_tl) : ''}
                                  </span>
                                </td>
                                <td style={{ ...tdS, textAlign: 'right' }}>
                                  <span className="financial-num" style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>
                                    {borc ? TL(h.tutar_tl) : ''}
                                  </span>
                                </td>
                                <td style={{ ...tdS, textAlign: 'right' }}>
                                  <div className="d-flex justify-content-end gap-1">
                                    <button title="Düzenle" onClick={() => hareketDuzenleAc(h)}
                                      style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer',
                                        background: 'rgba(245,158,11,0.1)', color: '#d97706', fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.15s' }}>
                                      <i className="bi bi-pencil" />
                                    </button>
                                    <button title="Sil" onClick={() => setSilHareketId(h.id)}
                                      style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer',
                                        background: 'rgba(244,63,94,0.08)', color: '#f43f5e', fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.15s' }}>
                                      <i className="bi bi-trash" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
              <button onClick={() => setKartModalAcik(false)} style={cancelBtnS}>Kapat</button>
            </div>
          </>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL 4 — Silme Onayı
      ══════════════════════════════════════════════ */}
      <Modal open={silModalAcik} onClose={() => setSilModalAcik(false)} size="sm" staticBackdrop>
        <div style={{ padding: '32px 28px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(244,63,94,0.09)', border: '1px solid rgba(244,63,94,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 28, color: '#f43f5e' }} />
          </div>
          <h5 style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, fontSize: 17 }}>Cari Pasife Al</h5>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 0 }}>
            <strong style={{ color: '#0f172a' }}>{silCari?.unvan}</strong> cari kaydını pasife almak istediğinizden emin misiniz?
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '0 28px 28px' }}>
          <button onClick={() => setSilModalAcik(false)} style={{ ...cancelBtnS, minWidth: 110 }}>Vazgeç</button>
          <button onClick={silOnayla} disabled={yukleniyor} style={{ minWidth: 110, background: 'linear-gradient(135deg,#f43f5e,#be123c)',
            color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 10, padding: '10px 22px',
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
      width: 34, height: 34, padding: 0, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 8, border: `1px solid ${color}28`, background: `${color}12`, color, fontSize: 15, transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}25`; e.currentTarget.style.transform = 'scale(1.12)' }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.transform = 'scale(1)' }}>
      <i className={`bi ${icon}`} />
    </button>
  )
}

function MHeader({ icon, baslik, altBaslik, onKapat, headerBg }) {
  return (
    <div style={{ background: headerBg || 'linear-gradient(135deg,var(--brand-dark),#1a5b80)', padding: '18px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className={`bi ${icon}`} style={{ color: '#fff', fontSize: 22 }} />
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{baslik}</div>
          {altBaslik && <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: 500 }}>{altBaslik}</div>}
        </div>
      </div>
      <button onClick={onKapat} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
        color: '#fff', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="bi bi-x-lg" style={{ fontSize: 15 }} />
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
const ekleBtn = { background: 'linear-gradient(135deg,var(--brand-dark),#1a5b80)', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 10, padding: '10px 22px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(18,63,89,0.25)', fontFamily: 'inherit' }
const thS     = { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '12px 18px', whiteSpace: 'nowrap', borderBottom: '2px solid #f1f5f9', userSelect: 'none', background: '#f8fafc' }
const tdS     = { fontSize: 14, padding: '14px 18px', verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' }
const lblS    = { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }
const selS    = { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.85rem 1.1rem', fontWeight: 600, color: 'var(--brand-dark)', fontFamily: "'Plus Jakarta Sans',sans-serif", borderRadius: 10, fontSize: '1rem', cursor: 'pointer' }
const cancelBtnS = { background: '#f8fafc', color: '#475569', fontWeight: 700, fontSize: 15, borderRadius: 10, padding: '10px 22px', border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit' }
const saveBtnS   = { background: 'linear-gradient(135deg,var(--brand-dark),#1a5b80)', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 10, padding: '10px 26px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }
const ikonKutu = (color, bg) => ({ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' })
const kartEtiket = (color) => ({ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.07em' })
