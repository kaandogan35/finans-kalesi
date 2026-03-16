/**
 * CariYonetimi.jsx — Cari & Finans Yönetimi
 * 3 Tema Sistemi (Banking / Earthy / Dark)
 * cym- prefix ile modüle özel CSS class'ları
 * Modallar: Saf React state + createPortal
 * Revizyon: Cari Kart (Netsis mantığı), Dinamik İşlem, PDF Ekstre
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { carilerApi } from '../../api/cariler'
import useTemaStore from '../../stores/temaStore'
import { temaRenkleri, hexRgba } from '../../lib/temaRenkleri'
import { useSinirler } from '../../hooks/useSinirler'
import useAuthStore from '../../stores/authStore'

const prefixMap = { banking: 'b', earthy: 'e', dark: 'd' }

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

function KopyalaBtn({ value, label, p }) {
  if (!value) return null
  return (
    <button
      title={`${label} kopyala`}
      onClick={() => kopyala(value, label)}
      className={`${p}-cym-copy-btn`}
    >
      <i className="bi bi-copy" />
    </button>
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
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'b'
  const renkler = temaRenkleri[aktifTema] || temaRenkleri.banking

  const { kullanici } = useAuthStore()
  const { sinirler, uyariDurum } = useSinirler()
  const cariDurum = uyariDurum('cari')
  const cariBilgi = sinirler?.cari
  const limitDolu = cariDurum === 'dolu'

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
  const [duzenHareket, setDuzenHareket]       = useState(null)
  const [duzenForm, setDuzenForm]             = useState({ tutar: '', aciklama: '', tarih: '', tur: '' })
  const [silHareketId, setSilHareketId]       = useState(null)

  // Silme modal
  const [silModalAcik, setSilModalAcik]       = useState(false)
  const [silCari, setSilCari]                 = useState(null)

  const [form, setForm]             = useState(bosForm)
  const [islem, setIslem]           = useState(bosIslem)
  const [yukleniyor, setYukleniyor] = useState(false)

  // ─── Modal body overflow yönetimi ─────────────────────────────────────────
  const acikModalSayisi = [cariModalAcik, islemModalAcik, kartModalAcik, silModalAcik].filter(Boolean).length
  useEffect(() => {
    if (acikModalSayisi > 0) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [acikModalSayisi])

  // ─── ESC tuşu ile modal kapatma ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Escape') return
      if (silModalAcik) { setSilModalAcik(false); return }
      if (islemModalAcik) { setIslemModalAcik(false); return }
      if (cariModalAcik) { setCariModalAcik(false); return }
      if (kartModalAcik) { setKartModalAcik(false); return }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [silModalAcik, islemModalAcik, cariModalAcik, kartModalAcik])

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

  // bakiye rengini tema renklerinden belirle
  const bakiyeRenk = (bakiye) => {
    if (bakiye > 0) return renkler.danger
    if (bakiye < 0) return renkler.success
    return renkler.textSec
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className={`${p}-page-root`}>

      {/* ─── Sayfa Başlığı ──────────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className={`${p}-page-title`}>Cari Hesaplar</h1>
          <p className={`${p}-cym-subtitle`}>
            {cariler.length} toplam cari · {cariler.filter(c => c.durum === 'aktif').length} aktif
          </p>
        </div>
        <div className="d-flex flex-column align-items-end gap-2">
          {kullanici?.plan === 'ucretsiz' && cariBilgi && !cariBilgi.sinirsiz && (cariDurum === 'uyari' || cariDurum === 'dolu') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600,
              color: cariDurum === 'dolu' ? renkler.danger : renkler.warning }}>
              <div style={{ width: 80, height: 4, borderRadius: 3, background: hexRgba(renkler.textSec, 0.15), overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(cariBilgi.yuzde, 100)}%`,
                  background: cariDurum === 'dolu' ? renkler.danger : renkler.warning, borderRadius: 3 }} />
              </div>
              {cariBilgi.mevcut}/{cariBilgi.sinir} cari
            </div>
          )}
          <button
            onClick={cariEkleAc}
            className={`${p}-cym-btn-new d-flex align-items-center gap-2`}
            disabled={limitDolu}
            title={limitDolu ? 'Cari limiti doldu. Planı yükseltin.' : 'Yeni cari ekle'}
            style={limitDolu ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            <i className="bi bi-plus-lg" /> Yeni Cari Ekle
          </button>
        </div>
      </div>

      {/* ═══ KPI Kartları ═══ */}
      <div className="row g-3 mb-4">
        {/* Toplam Alacak */}
        <div className="col-12 col-md-6">
          <div className={`${p}-kpi-card ${p}-cym-kpi-card`}>
            <i className={`bi bi-arrow-down-circle-fill ${p}-cym-kpi-deco ${p}-cym-kpi-deco-success`} />
            <div className={`${p}-cym-kpi-header`}>
              <div className={`${p}-cym-kpi-bar ${p}-cym-kpi-bar-success`} />
              <h6 className={`${p}-kpi-label`}>Toplam Alacak</h6>
            </div>
            <h2 className={`${p}-kpi-value ${p}-cym-kpi-value-success`}>
              {TL(stats.toplamAlacak)}
            </h2>
            <p className={`${p}-cym-kpi-desc`}>Müşterilerden toplanacak tutar</p>
          </div>
        </div>

        {/* Toplam Borç */}
        <div className="col-12 col-md-6">
          <div className={`${p}-kpi-card ${p}-cym-kpi-card`}>
            <i className={`bi bi-arrow-up-circle-fill ${p}-cym-kpi-deco ${p}-cym-kpi-deco-danger`} />
            <div className={`${p}-cym-kpi-header`}>
              <div className={`${p}-cym-kpi-bar ${p}-cym-kpi-bar-danger`} />
              <h6 className={`${p}-kpi-label`}>Toplam Borç</h6>
            </div>
            <h2 className={`${p}-kpi-value ${p}-cym-kpi-value-danger`}>
              {TL(stats.toplamBorc)}
            </h2>
            <p className={`${p}-cym-kpi-desc`}>Tedarikçilere ödenecek tutar</p>
          </div>
        </div>
      </div>

      {/* ═══ Tablo Kartı ═══ */}
      <div className={`${p}-cym-glass-card`}>

        {/* Sekmeler + Arama */}
        <div className={`${p}-cym-toolbar`}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex gap-2">
              {[
                { key: 'alici',  label: 'Müşteriler',  icon: 'bi-person-check-fill',  sayi: cariler.filter(c => c.cariTip === 'alici').length },
                { key: 'satici', label: 'Tedarikçiler', icon: 'bi-truck',             sayi: cariler.filter(c => c.cariTip === 'satici').length },
              ].map(s => {
                const a = aktifSekme === s.key
                return (
                  <button
                    key={s.key}
                    onClick={() => setAktifSekme(s.key)}
                    className={`${p}-cym-tab-btn ${a ? `${p}-cym-tab-active` : ''}`}
                  >
                    <i className={`bi ${s.icon}`} />
                    {s.label}
                    <span className={`${p}-cym-tab-badge ${a ? `${p}-cym-tab-badge-active` : ''}`}>
                      {s.sayi}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className={`${p}-cym-search-wrap`}>
              <i className={`bi bi-search ${p}-cym-search-icon`} />
              <input
                type="text"
                value={arama}
                onChange={e => setArama(e.target.value)}
                placeholder="Ara: ünvan, tel, vergi no..."
                className={`${p}-cym-search-input`}
              />
              {arama && (
                <button onClick={() => setArama('')} className={`${p}-cym-search-clear`}>
                  <i className="bi bi-x" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`${p}-cym-sort-info`}>
          <small>
            <i className="bi bi-sort-down me-1" />
            {aktifSekme === 'alici' ? 'Müşteriler bakiyeye göre büyükten küçüğe sıralı.' : 'Tedarikçiler borca göre büyükten küçüğe sıralı.'}
          </small>
        </div>

        {/* Yükleniyor */}
        {listYukleniyor && (
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className={`${p}-cym-spinner mb-3`} />
            <span className={`${p}-cym-loading-text`}>Cariler yükleniyor...</span>
          </div>
        )}

        {/* Hata */}
        {!listYukleniyor && listHata && (
          <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 px-3">
            <div className={`${p}-cym-error-icon`}>
              <i className="bi bi-exclamation-circle" />
            </div>
            <p className={`${p}-cym-error-text`}>{listHata}</p>
            <button onClick={veriYukle} className={`${p}-cym-retry-btn d-flex align-items-center gap-2`}>
              <i className="bi bi-arrow-clockwise" /> Tekrar Dene
            </button>
          </div>
        )}

        {/* Tablo */}
        {!listYukleniyor && !listHata && (
        <div className="table-responsive">
          <table className={`${p}-cym-table`}>
            <thead>
              <tr>
                <th className={`${p}-cym-th`}>Cari Ünvanı & İletişim</th>
                <th className={`${p}-cym-th`}>Son İşlem</th>
                <th className={`${p}-cym-th text-end`}>Alacak</th>
                <th className={`${p}-cym-th text-end`}>Borç</th>
                <th className={`${p}-cym-th text-end`}>Toplam Bakiye</th>
                <th className={`${p}-cym-th text-end`}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {sayfaliVeri.length === 0 ? (
                <tr><td colSpan={6} className={`${p}-cym-empty-state`}>
                  <i className="bi bi-inbox d-block mb-2" />
                  <span>
                    {arama ? 'Aramanızla eşleşen cari bulunamadı.' : 'Bu kategoride kayıt yok.'}
                  </span>
                </td></tr>
              ) : sayfaliVeri.map((cari, idx) => {
                const borc   = parseFloat(cari.toplam_borc ?? 0)
                const alacak = parseFloat(cari.toplam_alacak ?? 0)
                return (
                  <tr key={cari.id} className={`${p}-cym-tr ${idx % 2 !== 0 ? `${p}-cym-tr-alt` : ''}`}>

                    {/* Cari Ünvanı & İletişim */}
                    <td className={`${p}-cym-td`}>
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                        <div className={`${p}-cym-avatar flex-shrink-0`}>
                          <i className={`bi ${cari.tip === 'kurumsal' ? 'bi-buildings-fill' : 'bi-person-fill'}`} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            onClick={() => kartAc(cari)}
                            className={`${p}-cym-cari-link text-truncate`}
                            title="Cari kartını görüntüle"
                          >
                            {cari.unvan}
                          </div>
                          <div className={`${p}-cym-cari-meta d-flex align-items-center gap-1`}>
                            {cari.telefon ? (
                              <>
                                <i className="bi bi-telephone-fill" />
                                <span>{cari.telefon}</span>
                                <KopyalaBtn value={cari.telefon} label="Telefon" p={p} />
                              </>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Son İşlem Tarihi */}
                    <td className={`${p}-cym-td`}>
                      <span className={`${p}-cym-date-text`}>
                        {tarihFmt(cari.son_islem)}
                      </span>
                    </td>

                    {/* Alacak */}
                    <td className={`${p}-cym-td text-end`}>
                      <span className={`${p}-cym-amount-success`}>
                        {alacak > 0 ? TL(alacak) : '—'}
                      </span>
                    </td>

                    {/* Borç */}
                    <td className={`${p}-cym-td text-end`}>
                      <span className={`${p}-cym-amount-danger`}>
                        {borc > 0 ? TL(borc) : '—'}
                      </span>
                    </td>

                    {/* Toplam Bakiye */}
                    <td className={`${p}-cym-td text-end`}>
                      <div className={`${p}-cym-bakiye`} style={{ color: bakiyeRenk(cari.bakiye) }}>
                        {TL(cari.bakiye)}
                      </div>
                    </td>

                    {/* İşlemler */}
                    <td className={`${p}-cym-td text-end`}>
                      <div className="d-flex justify-content-end gap-1">
                        <button title="Finansal İşlem"  className={`${p}-cym-action-btn ${p}-cym-action-success`} onClick={() => islemAc(cari)}>
                          <i className="bi bi-currency-exchange" />
                        </button>
                        <button title="Cari Kart"       className={`${p}-cym-action-btn ${p}-cym-action-accent`} onClick={() => kartAc(cari)}>
                          <i className="bi bi-person-vcard" />
                        </button>
                        <button title="İşlem Geçmişi"   className={`${p}-cym-action-btn ${p}-cym-action-warning`} onClick={() => kartAc(cari, 'ekstre')}>
                          <i className="bi bi-clock-history" />
                        </button>
                        <button title="Sil / Pasife Al" className={`${p}-cym-action-btn ${p}-cym-action-danger`} onClick={() => { setSilCari(cari); setSilModalAcik(true) }}>
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

        {!listYukleniyor && !listHata && toplamSayfa > 1 && (
          <div className={`${p}-cym-pagination-bar`}>
            <small className={`${p}-cym-pagination-info`}>
              {filtrelendi.length} kayıttan {(sayfa - 1) * sayfaBasi + 1}–{Math.min(sayfa * sayfaBasi, filtrelendi.length)} gösteriliyor
            </small>
            <nav>
              <ul className={`pagination pagination-sm mb-0 gap-1 ${p}-cym-pagination`}>
                <li className={`page-item ${sayfa === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setSayfa(pr => pr - 1)}>
                    <i className="bi bi-chevron-left" />
                  </button>
                </li>
                {Array.from({ length: toplamSayfa }, (_, i) => i + 1).map(pg => (
                  <li key={pg} className={`page-item ${pg === sayfa ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setSayfa(pg)}>
                      {pg}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${sayfa === toplamSayfa ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setSayfa(pr => pr + 1)}>
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
      {cariModalAcik && createPortal(
        <>
          <div className={`${p}-modal-overlay`} />
          <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
            <div className={`${p}-modal-box`} style={{ maxWidth: 800 }}>
              {/* Header */}
              <div className={`${p}-cym-modal-header`}>
                <div className="d-flex align-items-center gap-2">
                  <i className={`bi ${cariMod === 'ekle' ? 'bi-person-plus-fill' : 'bi-pencil-square'} ${p}-cym-modal-header-icon`} />
                  <span className={`${p}-cym-modal-header-title`}>{cariMod === 'ekle' ? 'Yeni Cari Ekle' : 'Cari Düzenle'}</span>
                </div>
                <button onClick={() => setCariModalAcik(false)} className={`${p}-modal-close`}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <form onSubmit={cariKaydet} noValidate style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div className={`${p}-modal-body`} style={{ overflowY: 'auto', flex: 1 }}>
                  <div className="row g-3">
                    {/* Cari Rolü */}
                    <div className="col-12">
                      <label className={`${p}-cym-label`}>Cari Rolü</label>
                      <div className="d-flex gap-2">
                        {[
                          { val: 'alici',  label: 'Müşteri',    icon: 'bi-person-check-fill', cls: 'success' },
                          { val: 'satici', label: 'Tedarikçi',  icon: 'bi-truck',             cls: 'warning' },
                        ].map(t => {
                          const sel = form.cariTip === t.val
                          return (
                            <label key={t.val} className={`${p}-cym-radio-option ${sel ? `${p}-cym-radio-selected ${p}-cym-radio-${t.cls}` : ''}`}>
                              <input type="radio" name="cariTip" value={t.val} checked={sel}
                                onChange={e => setForm(prev => ({ ...prev, cariTip: e.target.value }))} style={{ display: 'none' }} />
                              <i className={`bi ${t.icon} ${p}-cym-radio-icon`} />
                              <span className={`${p}-cym-radio-label`}>{t.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                    <div className="col-6">
                      <label className={`${p}-cym-label`}>Hesap Türü</label>
                      <select value={form.tip} onChange={e => setForm(prev => ({ ...prev, tip: e.target.value }))} className={`${p}-cym-select`}>
                        <option value="kurumsal">Kurumsal (Şirket)</option>
                        <option value="bireysel">Bireysel (Şahıs)</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className={`${p}-cym-label`}>Durum</label>
                      <select value={form.durum} onChange={e => setForm(prev => ({ ...prev, durum: e.target.value }))} className={`${p}-cym-select`}>
                        <option value="aktif">Aktif</option>
                        <option value="pasif">Pasif</option>
                        <option value="askida">Askıda</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className={`${p}-cym-label`}>Cari Ünvanı *</label>
                      <input type="text" value={form.unvan} onChange={e => setForm(prev => ({ ...prev, unvan: e.target.value }))}
                        placeholder={form.tip === 'kurumsal' ? 'Şirket Adı A.Ş.' : 'Ad Soyad'}
                        className="form-control" required />
                    </div>
                    <div className="col-12">
                      <label className={`${p}-cym-label`}>Adres</label>
                      <textarea value={form.adres} onChange={e => setForm(prev => ({ ...prev, adres: e.target.value }))}
                        placeholder="Tam adres..." rows={2} className="form-control"
                        style={{ resize: 'none' }} />
                    </div>
                    <div className="col-6">
                      <label className={`${p}-cym-label`}>İlçe</label>
                      <input type="text" value={form.ilce} onChange={e => setForm(prev => ({ ...prev, ilce: e.target.value }))}
                        placeholder="Örn: Kadıköy" className="form-control" />
                    </div>
                    <div className="col-6">
                      <label className={`${p}-cym-label`}>İl</label>
                      <input type="text" value={form.il} onChange={e => setForm(prev => ({ ...prev, il: e.target.value }))}
                        placeholder="Örn: İstanbul" className="form-control" />
                    </div>
                    <div className="col-6">
                      <label className={`${p}-cym-label`}>{form.tip === 'kurumsal' ? 'Vergi Numarası' : 'TC Kimlik No'}</label>
                      <input type="text" value={form.vergi_no} onChange={e => setForm(prev => ({ ...prev, vergi_no: e.target.value }))}
                        placeholder={form.tip === 'kurumsal' ? '10 haneli' : '11 haneli'} className="form-control" />
                    </div>
                    <div className="col-6">
                      <label className={`${p}-cym-label`}>Telefon</label>
                      <input type="text" value={form.telefon} onChange={e => setForm(prev => ({ ...prev, telefon: e.target.value }))}
                        placeholder="0212 555 00 00" className="form-control" />
                    </div>
                  </div>
                </div>
                <div className={`${p}-modal-footer`}>
                  <button type="button" onClick={() => setCariModalAcik(false)} className={`${p}-btn-cancel`}>İptal</button>
                  <button type="submit" disabled={yukleniyor} className={`${p}-btn-save ${p}-btn-save-amber`}>
                    {yukleniyor
                      ? <><i className="bi bi-arrow-repeat me-2 ${p}-cym-spin" />Kaydediliyor...</>
                      : <><i className="bi bi-check-lg me-2" />{cariMod === 'ekle' ? 'Cari Ekle' : 'Güncelle'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ══════════════════════════════════════════════
          MODAL 2 — Finansal İşlem (Dinamik)
      ══════════════════════════════════════════════ */}
      {islemModalAcik && createPortal(
        <>
          <div className={`${p}-modal-overlay`} />
          <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
            <div className={`${p}-modal-box`} style={{ maxWidth: 520 }}>
              {(() => {
                const etiketler = islemEtiketleri(islemCari)
                return (
                  <>
                    {/* Header */}
                    <div className={`${p}-cym-modal-header`}>
                      <div className="d-flex align-items-center gap-2">
                        <i className={`bi bi-currency-exchange ${p}-cym-modal-header-icon`} />
                        <span className={`${p}-cym-modal-header-title`}>{etiketler.baslik}</span>
                      </div>
                      <button onClick={() => setIslemModalAcik(false)} className={`${p}-modal-close`}>
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>

                    <form onSubmit={islemKaydet} noValidate>
                      <div className={`${p}-modal-body`}>
                        {islemCari && (
                          <div className={`${p}-cym-bakiye-card mb-3`}>
                            <span className={`${p}-cym-bakiye-label`}>Güncel Bakiye</span>
                            <span className={`${p}-cym-bakiye-value`} style={{ color: bakiyeRenk(islemCari.bakiye) }}>
                              {TL(islemCari.bakiye)}
                            </span>
                          </div>
                        )}
                        <div className="mb-3">
                          <label className={`${p}-cym-label`}>İşlem Türü</label>
                          <div className="d-flex gap-2">
                            {[
                              { val: 'tahsilat',     label: etiketler.tahsilat, icon: 'bi-arrow-down-circle-fill', cls: 'success' },
                              { val: 'borclandirma', label: etiketler.borc,     icon: 'bi-arrow-up-circle-fill',   cls: 'danger' },
                            ].map(t => (
                              <label key={t.val} className={`${p}-cym-radio-option ${p}-cym-radio-col ${islem.tur === t.val ? `${p}-cym-radio-selected ${p}-cym-radio-${t.cls}` : ''}`}>
                                <input type="radio" name="islemTur" value={t.val} checked={islem.tur === t.val}
                                  onChange={e => setIslem(prev => ({ ...prev, tur: e.target.value }))} style={{ display: 'none' }} />
                                <i className={`bi ${t.icon} ${p}-cym-radio-icon-lg`} />
                                <span className={`${p}-cym-radio-label`}>{t.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className={`${p}-cym-label`}>Tutar (₺) *</label>
                          <input type="text" inputMode="decimal" value={islem.tutar}
                            onChange={e => setIslem(prev => ({ ...prev, tutar: formatParaInput(e.target.value) }))}
                            placeholder="0,00" className="form-control" required />
                        </div>
                        <div className="mb-3">
                          <label className={`${p}-cym-label`}>İşlem Tarihi</label>
                          <input type="date" value={islem.tarih} onChange={e => setIslem(prev => ({ ...prev, tarih: e.target.value }))}
                            className="form-control" />
                        </div>
                        <div>
                          <label className={`${p}-cym-label`}>Açıklama <span className={`${p}-cym-label-hint`}>(opsiyonel)</span></label>
                          <textarea value={islem.aciklama} onChange={e => setIslem(prev => ({ ...prev, aciklama: e.target.value }))}
                            placeholder="İşlem açıklaması..." rows={2} className="form-control"
                            style={{ resize: 'none' }} />
                        </div>
                      </div>
                      <div className={`${p}-modal-footer`}>
                        <button type="button" onClick={() => setIslemModalAcik(false)} className={`${p}-btn-cancel`}>İptal</button>
                        <button type="submit" disabled={yukleniyor}
                          className={`${p}-btn-save ${islem.tur === 'tahsilat' ? `${p}-btn-save-green` : `${p}-btn-save-red`}`}>
                          {yukleniyor
                            ? <><i className={`bi bi-arrow-repeat me-2 ${p}-cym-spin`} />Kaydediliyor...</>
                            : <><i className="bi bi-check-lg me-2" />{islem.tur === 'tahsilat' ? etiketler.tahsilat : etiketler.borc}</>}
                        </button>
                      </div>
                    </form>
                  </>
                )
              })()}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ══════════════════════════════════════════════
          MODAL 3 — Cari Kart (Netsis Mantığı)
      ══════════════════════════════════════════════ */}
      {kartModalAcik && createPortal(
        <>
          <div className={`${p}-modal-overlay`} />
          <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
            <div className={`${p}-modal-box`} style={{ maxWidth: 1140, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              {kartCari && (
                <>
                  {/* Header — Accent Gradient */}
                  <div className={`${p}-cym-kart-header`}>
                    <div className="d-flex align-items-center gap-3">
                      <div className={`${p}-cym-kart-header-icon`}>
                        <i className="bi bi-person-vcard-fill" />
                      </div>
                      <div>
                        <div className={`${p}-cym-kart-header-title`}>{kartCari.unvan}</div>
                        <div className={`${p}-cym-kart-header-sub`}>
                          {kartCari.cariTip === 'alici' ? 'Müşteri' : 'Tedarikçi'} · Bakiye: <span style={{ color: bakiyeRenk(kartCari.bakiye), fontWeight: 700 }}>{TL(kartCari.bakiye)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button onClick={() => { islemAc(kartCari) }} className={`${p}-cym-kart-header-btn`}>
                        <i className="bi bi-currency-exchange" /> Finansal İşlem
                      </button>
                      <button onClick={() => ekstrePdfIndir(kartCari, kartHareketler)} className={`${p}-cym-kart-header-btn`}>
                        <i className="bi bi-file-earmark-pdf" /> PDF İndir
                      </button>
                      <button onClick={() => setKartModalAcik(false)} className={`${p}-cym-kart-header-close`}>
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  </div>

                  {/* Nav Tabs */}
                  <div className={`${p}-cym-kart-nav`}>
                    <div className="d-flex gap-1" style={{ marginBottom: -1 }}>
                      {[
                        { key: 'bilgiler', label: 'Cari Bilgiler', icon: 'bi-info-circle-fill' },
                        { key: 'ekstre',   label: 'Hesap Ekstresi', icon: 'bi-list-ul' },
                      ].map(t => {
                        const a = kartSekme === t.key
                        return (
                          <button
                            key={t.key}
                            onClick={() => setKartSekme(t.key)}
                            className={`${p}-cym-kart-tab ${a ? `${p}-cym-kart-tab-active` : ''}`}
                          >
                            <i className={`bi ${t.icon}`} />
                            {t.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sekme İçeriği */}
                  <div className={`${p}-modal-body`} style={{ overflowY: 'auto', flex: 1 }}>
                    {/* ─── Sekme 1: Cari Bilgiler ─── */}
                    {kartSekme === 'bilgiler' && (
                      <>
                        {!kartDuzenleModu ? (
                          <>
                            {/* Okuma Modu */}
                            <div className="d-flex justify-content-end mb-3">
                              <button onClick={() => setKartDuzenleModu(true)}
                                className={`${p}-cym-edit-btn d-flex align-items-center gap-2`}>
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
                                  <div className={`${p}-cym-info-card`}>
                                    <div className={`${p}-cym-info-card-label d-flex align-items-center gap-2 mb-1`}>
                                      <i className={`bi ${item.icon}`} />
                                      <span>{item.label}</span>
                                    </div>
                                    <div className={`${p}-cym-info-card-value`}>{item.value}</div>
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
                                <label className={`${p}-cym-label`}>Cari Rolü</label>
                                <div className="d-flex gap-2">
                                  {[
                                    { val: 'alici',  label: 'Müşteri',   icon: 'bi-person-check-fill', cls: 'success' },
                                    { val: 'satici', label: 'Tedarikçi', icon: 'bi-truck',             cls: 'warning' },
                                  ].map(t => {
                                    const sel = kartForm.cariTip === t.val
                                    return (
                                      <label key={t.val} className={`${p}-cym-radio-option ${sel ? `${p}-cym-radio-selected ${p}-cym-radio-${t.cls}` : ''}`}>
                                        <input type="radio" name="kartCariTip" value={t.val} checked={sel}
                                          onChange={e => setKartForm(prev => ({ ...prev, cariTip: e.target.value }))} style={{ display: 'none' }} />
                                        <i className={`bi ${t.icon} ${p}-cym-radio-icon`} />
                                        <span className={`${p}-cym-radio-label`}>{t.label}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="col-12">
                                <label className={`${p}-cym-label`}>Cari Ünvanı *</label>
                                <input type="text" value={kartForm.unvan} onChange={e => setKartForm(prev => ({ ...prev, unvan: e.target.value }))}
                                  className="form-control" required />
                              </div>
                              <div className="col-12">
                                <label className={`${p}-cym-label`}>Adres</label>
                                <textarea value={kartForm.adres} onChange={e => setKartForm(prev => ({ ...prev, adres: e.target.value }))}
                                  rows={2} className="form-control" style={{ resize: 'none' }} />
                              </div>
                              <div className="col-6">
                                <label className={`${p}-cym-label`}>İlçe</label>
                                <input type="text" value={kartForm.ilce} onChange={e => setKartForm(prev => ({ ...prev, ilce: e.target.value }))}
                                  placeholder="Örn: Kadıköy" className="form-control" />
                              </div>
                              <div className="col-6">
                                <label className={`${p}-cym-label`}>İl</label>
                                <input type="text" value={kartForm.il} onChange={e => setKartForm(prev => ({ ...prev, il: e.target.value }))}
                                  placeholder="Örn: İstanbul" className="form-control" />
                              </div>
                              <div className="col-6">
                                <label className={`${p}-cym-label`}>Vergi Numarası</label>
                                <input type="text" value={kartForm.vergi_no} onChange={e => setKartForm(prev => ({ ...prev, vergi_no: e.target.value }))}
                                  className="form-control" />
                              </div>
                              <div className="col-6">
                                <label className={`${p}-cym-label`}>Telefon</label>
                                <input type="text" value={kartForm.telefon} onChange={e => setKartForm(prev => ({ ...prev, telefon: e.target.value }))}
                                  className="form-control" />
                              </div>
                              <div className="col-6">
                                <label className={`${p}-cym-label`}>Durum</label>
                                <select value={kartForm.durum} onChange={e => setKartForm(prev => ({ ...prev, durum: e.target.value }))} className={`${p}-cym-select`}>
                                  <option value="aktif">Aktif</option>
                                  <option value="pasif">Pasif</option>
                                </select>
                              </div>
                            </div>
                            <div className="d-flex justify-content-end gap-2 mt-4">
                              <button type="button" onClick={() => setKartDuzenleModu(false)} className={`${p}-btn-cancel`}>İptal</button>
                              <button type="submit" disabled={yukleniyor} className={`${p}-btn-save ${p}-btn-save-amber`}>
                                {yukleniyor ? <><i className={`bi bi-arrow-repeat me-2 ${p}-cym-spin`} />Kaydediliyor...</> : <><i className="bi bi-check-lg me-2" />Kaydet</>}
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
                            { label: 'Güncel Bakiye', val: TL(kartCari.bakiye),       renk: bakiyeRenk(kartCari.bakiye) },
                            { label: 'İşlem Sayısı', val: kartHareketYukleniyor ? '...' : kartHareketler.length, renk: null },
                            { label: 'Son İşlem',    val: tarihFmt(kartCari.son_islem), renk: null },
                          ].map((item, i) => (
                            <div key={i} className="col-6 col-md-4">
                              <div className={`${p}-cym-info-card`} style={{ textAlign: 'center' }}>
                                <div className={`${p}-cym-info-card-label`} style={{ marginBottom: 6 }}>{item.label}</div>
                                <div className={`${p}-cym-info-card-value`} style={item.renk ? { color: item.renk } : undefined}>{item.val}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {kartHareketYukleniyor ? (
                          <div className="d-flex flex-column align-items-center justify-content-center py-5">
                            <div className={`${p}-cym-spinner mb-2`} />
                            <span className={`${p}-cym-loading-text`}>Hareketler yükleniyor...</span>
                          </div>
                        ) : kartHareketler.length === 0 ? (
                          <div className={`${p}-cym-empty-state`} style={{ padding: '48px 24px' }}>
                            <i className="bi bi-inbox d-block mb-2" />
                            <p>Hareket kaydı bulunamadı.</p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className={`${p}-cym-table`}>
                              <thead><tr>
                                <th className={`${p}-cym-th`}>Tarih</th>
                                <th className={`${p}-cym-th`}>Açıklama</th>
                                <th className={`${p}-cym-th`}>Tür</th>
                                <th className={`${p}-cym-th text-end`}>Alacak</th>
                                <th className={`${p}-cym-th text-end`}>Borç</th>
                                <th className={`${p}-cym-th text-end`} style={{ width: 90 }}>İşlem</th>
                              </tr></thead>
                              <tbody>
                                {kartHareketler.map(h => {
                                  const borc = h.islem_tipi === 'borclandirma'
                                  const duzenlemede = duzenHareket === h.id

                                  if (duzenlemede) {
                                    const dBorc = duzenForm.tur === 'borclandirma'
                                    return (
                                      <tr key={h.id} className={`${p}-cym-tr-edit`}>
                                        <td className={`${p}-cym-td`}>
                                          <input type="date" value={duzenForm.tarih} onChange={e => setDuzenForm(prev => ({ ...prev, tarih: e.target.value }))}
                                            className="form-control form-control-sm" style={{ maxWidth: 150 }} />
                                        </td>
                                        <td className={`${p}-cym-td`}>
                                          <input type="text" value={duzenForm.aciklama} onChange={e => setDuzenForm(prev => ({ ...prev, aciklama: e.target.value }))}
                                            placeholder="Açıklama..." className="form-control form-control-sm" />
                                        </td>
                                        <td className={`${p}-cym-td`}>
                                          <select value={duzenForm.tur} onChange={e => setDuzenForm(prev => ({ ...prev, tur: e.target.value }))}
                                            className="form-select form-select-sm" style={{ maxWidth: 110 }}>
                                            <option value="tahsilat">Alacak</option>
                                            <option value="borclandirma">Borç</option>
                                          </select>
                                        </td>
                                        <td className={`${p}-cym-td text-end`}>
                                          {!dBorc && (
                                            <input type="text" inputMode="decimal" value={duzenForm.tutar}
                                              onChange={e => setDuzenForm(prev => ({ ...prev, tutar: formatParaInput(e.target.value) }))}
                                              className={`form-control form-control-sm text-end ${p}-cym-input-success`} style={{ maxWidth: 130 }} />
                                          )}
                                        </td>
                                        <td className={`${p}-cym-td text-end`}>
                                          {dBorc && (
                                            <input type="text" inputMode="decimal" value={duzenForm.tutar}
                                              onChange={e => setDuzenForm(prev => ({ ...prev, tutar: formatParaInput(e.target.value) }))}
                                              className={`form-control form-control-sm text-end ${p}-cym-input-danger`} style={{ maxWidth: 130 }} />
                                          )}
                                        </td>
                                        <td className={`${p}-cym-td text-end`}>
                                          <div className="d-flex justify-content-end gap-1">
                                            <button title="Kaydet" onClick={hareketDuzenleKaydet} disabled={yukleniyor}
                                              className={`${p}-cym-inline-btn ${p}-cym-inline-btn-save`}>
                                              <i className="bi bi-check-lg" />
                                            </button>
                                            <button title="Vazgeç" onClick={() => setDuzenHareket(null)}
                                              className={`${p}-cym-inline-btn ${p}-cym-inline-btn-cancel`}>
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
                                      <tr key={h.id} className={`${p}-cym-tr-delete`}>
                                        <td colSpan={5} className={`${p}-cym-td ${p}-cym-delete-msg`}>
                                          <i className="bi bi-exclamation-triangle me-2" />
                                          Bu işlemi silmek istediğinizden emin misiniz? <strong>{tarihFmt(h.islem_tarihi)}</strong> — {TL(h.tutar_tl)}
                                        </td>
                                        <td className={`${p}-cym-td text-end`}>
                                          <div className="d-flex justify-content-end gap-1">
                                            <button title="Sil" onClick={() => hareketSil(h.id)} disabled={yukleniyor}
                                              className={`${p}-cym-inline-btn ${p}-cym-inline-btn-delete`}>
                                              <i className="bi bi-trash" />
                                            </button>
                                            <button title="Vazgeç" onClick={() => setSilHareketId(null)}
                                              className={`${p}-cym-inline-btn ${p}-cym-inline-btn-cancel`}>
                                              <i className="bi bi-x-lg" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  }

                                  return (
                                    <tr key={h.id} className={`${p}-cym-tr`}>
                                      <td className={`${p}-cym-td`}><span className={`${p}-cym-date-text`}>{tarihFmt(h.islem_tarihi)}</span></td>
                                      <td className={`${p}-cym-td`}><span className={`${p}-cym-desc-text`}>{h.aciklama || '—'}</span></td>
                                      <td className={`${p}-cym-td`}>
                                        <span className={borc ? `${p}-cym-badge-borc` : `${p}-cym-badge-alacak`}>
                                          {borc ? 'Borç' : 'Alacak'}
                                        </span>
                                      </td>
                                      <td className={`${p}-cym-td text-end`}>
                                        <span className={`${p}-cym-amount-success`}>
                                          {!borc ? TL(h.tutar_tl) : ''}
                                        </span>
                                      </td>
                                      <td className={`${p}-cym-td text-end`}>
                                        <span className={`${p}-cym-amount-danger`}>
                                          {borc ? TL(h.tutar_tl) : ''}
                                        </span>
                                      </td>
                                      <td className={`${p}-cym-td text-end`}>
                                        <div className="d-flex justify-content-end gap-1">
                                          <button title="Düzenle" onClick={() => hareketDuzenleAc(h)}
                                            className={`${p}-cym-action-btn ${p}-cym-action-accent`}>
                                            <i className="bi bi-pencil" />
                                          </button>
                                          <button title="Sil" onClick={() => setSilHareketId(h.id)}
                                            className={`${p}-cym-action-btn ${p}-cym-action-danger`}>
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
                  <div className={`${p}-modal-footer`}>
                    <button onClick={() => setKartModalAcik(false)} className={`${p}-btn-cancel`}>Kapat</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ══════════════════════════════════════════════
          MODAL 4 — Silme Onayı
      ══════════════════════════════════════════════ */}
      {silModalAcik && createPortal(
        <>
          <div className={`${p}-modal-overlay`} />
          <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
            <div className={`${p}-modal-box`} style={{ maxWidth: 420 }}>
              <div className={`${p}-cym-delete-modal-body`}>
                <div className={`${p}-cym-delete-modal-icon`}>
                  <i className="bi bi-exclamation-triangle-fill" />
                </div>
                <h5 className={`${p}-cym-delete-modal-title`}>Cari Pasife Al</h5>
                <p className={`${p}-cym-delete-modal-desc`}>
                  <strong>{silCari?.unvan}</strong> cari kaydını pasife almak istediğinizden emin misiniz?
                </p>
              </div>
              <div className={`${p}-cym-delete-modal-footer`}>
                <button onClick={() => setSilModalAcik(false)} className={`${p}-btn-cancel`}>Vazgeç</button>
                <button onClick={silOnayla} disabled={yukleniyor} className={`${p}-btn-save ${p}-btn-save-red d-flex align-items-center justify-content-center gap-2`}>
                  {yukleniyor
                    ? <><i className={`bi bi-arrow-repeat ${p}-cym-spin`} /> İşleniyor...</>
                    : <><i className="bi bi-trash" /> Pasife Al</>}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
