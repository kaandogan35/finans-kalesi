/**
 * CariYonetimi.jsx — Cari & Finans Yönetimi
 * Tek Tema: ParamGo
 * cym- prefix ile modüle özel CSS class'ları
 * Modallar: Saf React state + createPortal
 * Revizyon: Cari Kart (Netsis mantığı), Dinamik İşlem, PDF Ekstre
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import { carilerApi } from '../../api/cariler'
import SwipeCard, { DynamicAvatar } from '../../components/SwipeCard'
import { odemeApi } from '../../api/odeme'
import useTemaStore from '../../stores/temaStore'
import { temaRenkleri, hexRgba } from '../../lib/temaRenkleri'
import { useSinirler } from '../../hooks/useSinirler'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'
import PlanYukseltModal from '../../components/PlanYukseltModal'
import { DateInput } from '../../components/ui/DateInput'
import useAuthStore from '../../stores/authStore'

const prefixMap = { paramgo: 'p' }

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
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:18px;border-bottom:2px solid #10B981">
        <div>
          <div style="font-size:22px;font-weight:800;color:#10B981;letter-spacing:-0.02em">ParamGo</div>
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
          <tr style="background:#10B981">
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
          <tr style="background:#10B981">
            <td colspan="2" style="padding:12px 14px;font-size:13px;font-weight:800;color:#fff">BAKİYE</td>
            <td colspan="2" style="padding:12px 14px;font-size:16px;font-weight:800;text-align:right;color:${cari.bakiye > 0 ? '#fca5a5' : cari.bakiye < 0 ? '#6ee7b7' : 'rgba(255,255,255,0.7)'}">${TL(cari.bakiye)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8">
        Bu belge ParamGo yazılımı tarafından otomatik oluşturulmuştur. · ${new Date().toLocaleDateString('tr-TR')}
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

// ─── Modal Bileşeni (CekSenet ile aynı yapı) ─────────────────────────────────
function Modal({ open, onClose, children, size = '', scrollable = false, p = 'b', ariaId = '', confirm = false, style: boxStyleOverride = {} }) {
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

  const maxW = size === 'xl' ? 1140 : size === 'lg' ? 800 : size === 'sm' ? 420 : 560

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center${confirm ? ` ${p}-modal-confirm` : ''}`}>
        <div
          className={`${p}-modal-box`}
          role="dialog"
          aria-labelledby={ariaId || undefined}
          aria-modal="true"
          style={{
            maxWidth: maxW,
            maxHeight: scrollable ? '90vh' : 'auto',
            overflow: scrollable ? 'auto' : 'hidden',
            ...boxStyleOverride,
          }}
        >
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function CariYonetimi() {
  const navigate = useNavigate()
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'p'
  const renkler = temaRenkleri[aktifTema] || temaRenkleri.paramgo

  const { kullanici } = useAuthStore()
  const { sinirler, uyariDurum } = useSinirler()
  const { izinVarMi, plan } = usePlanKontrol()
  const [planModalGoster, setPlanModalGoster] = useState(false)
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

  // Toplu Yükle modal
  const [topluModalAcik, setTopluModalAcik]     = useState(false)
  const [topluDosya, setTopluDosya]             = useState(null)
  const [topluOnizleme, setTopluOnizleme]       = useState(null) // { satirlar, toplam }
  const [topluYukleniyor, setTopluYukleniyor]   = useState(false)
  const [topluSonuc, setTopluSonuc]             = useState(null)
  const [topluDragOver, setTopluDragOver]       = useState(false)

  // Cari Ekle/Düzenle modal
  const [cariModalAcik, setCariModalAcik]     = useState(false)
  const [cariMod, setCariMod]                 = useState('ekle')
  const [seciliCari, setSeciliCari]           = useState(null)

  // Finansal İşlem modal
  const [islemModalAcik, setIslemModalAcik]   = useState(false)
  const [islemCari, setIslemCari]             = useState(null)

  // Cari Kart modal (4 sekme: Bilgiler, Finansal Özet, Hareket Geçmişi, Yaşlandırma)
  const [kartModalAcik, setKartModalAcik]     = useState(false)
  const [kartCari, setKartCari]               = useState(null)
  const [kartSekme, setKartSekme]             = useState('bilgiler')
  const [kartHareketler, setKartHareketler]   = useState([])
  const [kartHareketYukleniyor, setKartHareketYukleniyor] = useState(false)
  const [kartDuzenleModu, setKartDuzenleModu] = useState(false)
  const [kartForm, setKartForm]               = useState(bosForm)
  const [kartFinansalOzet, setKartFinansalOzet]   = useState(null)
  const [kartFinansalYukleniyor, setKartFinansalYukleniyor] = useState(false)
  const [kartYaslandirma, setKartYaslandirma]     = useState(null)
  const [kartYaslanYukleniyor, setKartYaslanYukleniyor] = useState(false)

  // İşlem düzenleme (ekstre içi)
  const [duzenHareket, setDuzenHareket]       = useState(null)
  const [duzenForm, setDuzenForm]             = useState({ tutar: '', aciklama: '', tarih: '', tur: '' })
  const [silHareketId, setSilHareketId]       = useState(null)

  // Silme modal
  const [silModalAcik, setSilModalAcik]       = useState(false)
  const [silCari, setSilCari]                 = useState(null)

  // Çoklu seçim — ödeme takibe al
  const [secilenCariler,    setSecilenCariler]    = useState(new Set())
  const [odemeEkleYukleniyor, setOdemeEkleYukleniyor] = useState(false)

  // Toplu yükleme kolon eşleştirme
  const [topluKolonlar,     setTopluKolonlar]     = useState([]) // CSV'deki kolon başlıkları
  const [topluKolonEslesme, setTopluKolonEslesme] = useState({}) // { csvKolon: sistemAlani }

  const [form, setForm]             = useState(bosForm)
  const [islem, setIslem]           = useState(bosIslem)
  const [yukleniyor, setYukleniyor] = useState(false)

  // Modal ESC ve overflow yönetimi Modal bileşeni tarafından yapılıyor

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

  // ─── Vadesi geçmiş cariler (backend'den, ayrı yükleme) ──────────────────
  const [vadesiGecmisCariler, setVadesiGecmisCariler] = useState([])
  const [vadesiGecmisYukleniyor, setVadesiGecmisYukleniyor] = useState(false)

  const vadesiGecmisYukle = useCallback(async () => {
    if (aktifSekme !== 'vadesi_gecmis') return
    setVadesiGecmisYukleniyor(true)
    try {
      const yanit = await carilerApi.listele({ sadece_vadesi_gecmis: 1, adet: 100 })
      setVadesiGecmisCariler((yanit.data.veri?.cariler || []).map(apiToUI))
    } catch {
      setVadesiGecmisCariler([])
    } finally {
      setVadesiGecmisYukleniyor(false)
    }
  }, [aktifSekme])

  useEffect(() => { vadesiGecmisYukle() }, [vadesiGecmisYukle])

  // ─── Filtrelenmiş + Sıralanmış Liste ────────────────────────────────────
  const filtrelendi = (() => {
    if (aktifSekme === 'vadesi_gecmis') {
      if (arama.trim()) {
        const q = arama.toLowerCase()
        return vadesiGecmisCariler.filter(c => c.unvan.toLowerCase().includes(q) || c.telefon?.includes(q) || c.vergi_no?.includes(q))
      }
      return vadesiGecmisCariler
    }
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

  const finansalOzetYukle = async (cari) => {
    setKartFinansalYukleniyor(true)
    try {
      const yanit = await carilerApi.getir(cari.id)
      setKartFinansalOzet(yanit.data.veri?.finansal_ozet ?? null)
    } catch {
      setKartFinansalOzet(null)
    } finally {
      setKartFinansalYukleniyor(false)
    }
  }

  const yaslandirmaYukle = async (cari) => {
    setKartYaslanYukleniyor(true)
    try {
      const yanit = await carilerApi.yaslandirma(cari.id)
      setKartYaslandirma(yanit.data.veri ?? null)
    } catch {
      setKartYaslandirma(null)
    } finally {
      setKartYaslanYukleniyor(false)
    }
  }

  const kartAc = async (cari, sekme = 'bilgiler') => {
    setKartCari(cari)
    setKartSekme(sekme)
    setKartDuzenleModu(false)
    setKartHareketler([])
    setKartFinansalOzet(null)
    setKartYaslandirma(null)
    setKartForm({
      cariTip: cari.cariTip, tip: cari.tip, unvan: cari.unvan,
      telefon: cari.telefon || '', adres: cari.adres || '',
      il: cari.il || '', ilce: cari.ilce || '',
      vergi_no: cari.vergi_no || '',
      durum: cari.durum,
    })
    setKartModalAcik(true)
    kartHareketleriYukle(cari)
    finansalOzetYukle(cari)
  }

  const kartSekmeChange = (yeniSekme) => {
    setKartSekme(yeniSekme)
    if (yeniSekme === 'yaslandirma' && !kartYaslandirma && kartCari) {
      yaslandirmaYukle(kartCari)
    }
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

  // ─── Toplu Yükle ─────────────────────────────────────────────────────────
  const topluSablonIndir = async () => {
    try {
      const { utils, writeFile } = await import('xlsx')
      const satirlar = [
        ['cari_adi', 'cari_turu', 'vergi_no', 'telefon', 'email', 'adres', 'yetkili_kisi', 'bakiye'],
        ['Ahmet Demir Ltd. Şti.', 'musteri', '1234567890', '0532 111 22 33', 'info@ahmet.com', 'İstanbul, Kadıköy', 'Ahmet Demir', '15000'],
        ['Çelik Yapı A.Ş.', 'tedarikci', '9876543210', '0212 444 55 66', 'satis@celikyapi.com', 'Ankara, Çankaya', 'Mehmet Yılmaz', '0'],
      ]
      const ws = utils.aoa_to_sheet(satirlar)
      ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 24 }, { wch: 24 }, { wch: 20 }, { wch: 12 }]
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Cariler')
      writeFile(wb, 'cari-sablonu.xlsx')
    } catch {
      toast.error('Şablon oluşturulamadı.')
    }
  }

  const topluDosyaIsle = async (dosya) => {
    if (!dosya) return
    if (!/\.xlsx?$/i.test(dosya.name)) {
      toast.error('Lütfen Excel (.xlsx) formatında dosya yükleyin.')
      return
    }
    setTopluSonuc(null)
    setTopluKolonlar([])
    setTopluKolonEslesme({})
    try {
      const { read, utils } = await import('xlsx')
      const ab = await dosya.arrayBuffer()
      const wb = read(ab)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const csvMetin = utils.sheet_to_csv(ws)
      const csvBlob = new Blob([csvMetin], { type: 'text/csv;charset=utf-8;' })
      const csvDosya = new File([csvBlob], dosya.name.replace(/\.xlsx?$/i, '.csv'), { type: 'text/csv' })
      setTopluDosya(csvDosya)
      const satirlar = csvMetin.split('\n').filter(s => s.trim())
      setTopluOnizleme({ satirlar: satirlar.slice(0, 4), toplam: Math.max(0, satirlar.length - 1) })

      // Kolon başlıklarını çek
      if (satirlar.length > 0) {
        const basliklar = satirlar[0].split(',').map(b => b.trim().replace(/^"|"$/g, ''))
        setTopluKolonlar(basliklar)
        // Bilinen sistem alanlarıyla otomatik eşleştir (harf duyarsız)
        const SISTEM_ALANLARI = ['cari_adi', 'bakiye', 'telefon', 'vergi_no', 'email', 'adres', 'cari_turu', 'yetkili_kisi']
        const eslesme = {}
        basliklar.forEach(b => {
          const kucuk = b.toLowerCase().trim()
          if (SISTEM_ALANLARI.includes(kucuk)) eslesme[b] = kucuk
          else eslesme[b] = 'atla' // bilinmeyen kolon
        })
        setTopluKolonEslesme(eslesme)
      }
    } catch {
      toast.error('Excel dosyası okunamadı. Dosyanın bozuk olmadığından emin olun.')
    }
  }

  const topluDosyaSec = (e) => topluDosyaIsle(e.target.files[0])

  const topluGonder = async () => {
    if (!topluDosya) return
    setTopluYukleniyor(true)
    try {
      const formData = new FormData()
      formData.append('dosya', topluDosya)
      // Kolon eşleştirmesini gönder (atla olarak işaretlenenleri dahil etme)
      const aktifEslesme = {}
      Object.entries(topluKolonEslesme).forEach(([csv, sistem]) => {
        if (sistem && sistem !== 'atla') aktifEslesme[csv] = sistem
      })
      formData.append('kolon_eslesme', JSON.stringify(aktifEslesme))

      const yanit = await carilerApi.topluYukle(formData)
      const veri = yanit.data.veri
      setTopluSonuc(veri)
      const yeniSayisi = veri.basarili_sayisi || 0
      const guncelSayisi = veri.guncellenen_sayisi || 0
      if (yeniSayisi > 0 || guncelSayisi > 0) {
        const mesaj = [
          yeniSayisi > 0 ? `${yeniSayisi} yeni cari eklendi` : '',
          guncelSayisi > 0 ? `${guncelSayisi} cari bakiyesi güncellendi` : '',
        ].filter(Boolean).join(', ')
        toast.success(mesaj)
        veriYukle()
      }
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Yükleme başarısız.')
    } finally {
      setTopluYukleniyor(false)
    }
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

  // ─── Ödeme Takibine Al (Tekli) ──────────────────────────────────────────
  const tekliOdemeEkle = async (cariId) => {
    try {
      await odemeApi.olustur({ cari_id: cariId, yon: 'tahsilat', durum: 'bekliyor' })
      toast.success('Cari ödeme takibine eklendi.')
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Ödeme takibine eklenemedi.')
    }
  }

  // ─── Ödeme Takibine Al (Toplu) ─────────────────────────────────────────
  const odemeEkleGonder = async () => {
    if (secilenCariler.size === 0) return
    setOdemeEkleYukleniyor(true)
    let basarili = 0, hatali = 0
    for (const cariId of secilenCariler) {
      try {
        await odemeApi.olustur({ cari_id: cariId, yon: 'tahsilat', durum: 'bekliyor' })
        basarili++
      } catch { hatali++ }
    }
    setOdemeEkleYukleniyor(false)
    setSecilenCariler(new Set())
    if (basarili > 0) toast.success(`${basarili} cari ödeme takibine eklendi.`)
    if (hatali > 0) toast.error(`${hatali} cari eklenemedi.`)
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
      <div className={`${p}-page-header`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon`}>
            <i className="bi bi-people-fill" />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>Cari Hesaplar</h1>
            <p className={`${p}-page-sub`}>
              {cariler.length} toplam cari · {cariler.filter(c => c.durum === 'aktif').length} aktif
            </p>
          </div>
        </div>
        <div className={`${p}-page-header-right`}>
          {kullanici?.plan === 'deneme' && cariBilgi && !cariBilgi.sinirsiz && (cariDurum === 'uyari' || cariDurum === 'dolu') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600,
              color: cariDurum === 'dolu' ? renkler.danger : renkler.warning }}>
              <div style={{ width: 80, height: 4, borderRadius: 2, background: hexRgba(renkler.textSec, 0.15), overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(cariBilgi.yuzde, 100)}%`,
                  background: cariDurum === 'dolu' ? renkler.danger : renkler.warning, borderRadius: 2 }} />
              </div>
              {cariBilgi.mevcut}/{cariBilgi.sinir} cari
            </div>
          )}
          <button
            onClick={() => izinVarMi('veri_aktarma') ? (setTopluModalAcik(true), setTopluDosya(null), setTopluOnizleme(null), setTopluSonuc(null)) : setPlanModalGoster(true)}
            className={`${p}-cym-btn-outline d-none d-md-flex align-items-center gap-2`}
            title={izinVarMi('veri_aktarma') ? 'Excel ile toplu cari yükle' : 'Veri aktarma — Standart plandan itibaren'}
          >
            <i className="bi bi-upload" /> Toplu Yükle
            {!izinVarMi('veri_aktarma') && <i className="bi bi-lock-fill" style={{ fontSize: 10, opacity: 0.5 }} />}
          </button>
          <button
            data-tur="yeni-cari-btn"
            onClick={cariEkleAc}
            className={`${p}-cym-btn-new d-flex align-items-center gap-2`}
            disabled={limitDolu}
            title={limitDolu ? 'Cari limiti doldu. Planı yükseltin.' : 'Yeni cari ekle'}
            style={limitDolu ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            <i className="bi bi-plus-lg" /> <span className="d-none d-md-inline">Yeni Cari Ekle</span>
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
            <div className="d-flex gap-2 flex-wrap">
              {[
                { key: 'alici',         label: 'Müşteriler',    icon: 'bi-person-check-fill', sayi: cariler.filter(c => c.cariTip === 'alici').length },
                { key: 'satici',        label: 'Tedarikçiler',  icon: 'bi-truck',             sayi: cariler.filter(c => c.cariTip === 'satici').length },
                { key: 'vadesi_gecmis', label: 'Vadesi Geçmiş', icon: 'bi-exclamation-circle-fill', sayi: vadesiGecmisCariler.length },
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
            <div className={`${p}-cym-search-wrap`} data-tur="cari-arama">
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
        {(listYukleniyor || (aktifSekme === 'vadesi_gecmis' && vadesiGecmisYukleniyor)) && (
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
        {!(listYukleniyor || (aktifSekme === 'vadesi_gecmis' && vadesiGecmisYukleniyor)) && !listHata && (
        <>
        {/* ── Desktop Tablo ── */}
        <div className={`${p}-cym-desktop-table table-responsive`} data-tur="cari-listesi">
          <table className={`${p}-cym-table`}>
            <thead>
              <tr>
                <th className={`${p}-cym-th`} style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                    checked={sayfaliVeri.length > 0 && sayfaliVeri.every(c => secilenCariler.has(c.id))}
                    onChange={e => {
                      const yeni = new Set(secilenCariler)
                      sayfaliVeri.forEach(c => e.target.checked ? yeni.add(c.id) : yeni.delete(c.id))
                      setSecilenCariler(yeni)
                    }}
                  />
                </th>
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
                <tr><td colSpan={7} className={`${p}-cym-empty-state`}>
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

                    {/* Checkbox */}
                    <td className={`${p}-cym-td`} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                        checked={secilenCariler.has(cari.id)}
                        onChange={e => {
                          const yeni = new Set(secilenCariler)
                          e.target.checked ? yeni.add(cari.id) : yeni.delete(cari.id)
                          setSecilenCariler(yeni)
                        }}
                      />
                    </td>

                    {/* Cari Ünvanı & İletişim */}
                    <td className={`${p}-cym-td`}>
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                        <DynamicAvatar isim={cari.unvan || cari.cari_adi} />
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
                        {cari.bakiye > 0 && (
                          <button
                            title={`Ödeme Takibine Al — Bakiye: ${TL(cari.bakiye)}`}
                            className={`${p}-cym-action-btn ${p}-cym-action-odeme`}
                            onClick={() => tekliOdemeEkle(cari.id)}
                          >
                            <i className="bi bi-calendar-plus-fill" />
                          </button>
                        )}
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

        {/* ── Mobil Kart Listesi ── */}
        <div className={`${p}-cym-mobile-list`}>
          {sayfaliVeri.length === 0 ? (
            <div className={`${p}-cym-empty-state`} style={{ padding: '48px 24px', textAlign: 'center' }}>
              <i className="bi bi-inbox d-block mb-2" style={{ fontSize: 40, color: 'var(--p-text-muted)', opacity: 0.5 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text-muted)' }}>
                {arama ? 'Aramanızla eşleşen cari bulunamadı.' : 'Bu kategoride kayıt yok.'}
              </span>
            </div>
          ) : (
            <>
              <div className="p-swipe-hint">
                <i className="bi bi-arrow-left-right" /> Sola kaydırarak işlem yapabilirsiniz
              </div>
              {sayfaliVeri.map((cari) => {
                const borc   = parseFloat(cari.toplam_borc ?? 0)
                const alacak = parseFloat(cari.toplam_alacak ?? 0)
                return (
                  <SwipeCard
                    key={cari.id}
                    aksiyonlar={[
                      { icon: 'bi-currency-exchange', label: 'İşlem', renk: 'success', onClick: () => islemAc(cari) },
                      { icon: 'bi-person-vcard', label: 'Kart', renk: 'warning', onClick: () => kartAc(cari) },
                      { icon: 'bi-clock-history', label: 'Geçmiş', renk: 'info', onClick: () => kartAc(cari, 'ekstre') },
                      { icon: 'bi-trash', label: 'Sil', renk: 'danger', onClick: () => { setSilCari(cari); setSilModalAcik(true) } },
                    ]}
                  >
                    <div className={`${p}-cym-mcard`} onClick={() => kartAc(cari)}>
                      <div className={`${p}-cym-mcard-top`}>
                        <DynamicAvatar isim={cari.unvan || cari.cari_adi} />
                        <div className={`${p}-cym-mcard-info`}>
                          <div className={`${p}-cym-mcard-name`}>{cari.unvan}</div>
                          {cari.telefon && (
                            <div className={`${p}-cym-mcard-phone`}>
                              <i className="bi bi-telephone-fill" /> {cari.telefon}
                            </div>
                          )}
                        </div>
                        <div className={`${p}-cym-mcard-bakiye`} style={{ color: bakiyeRenk(cari.bakiye) }}>
                          {TL(cari.bakiye)}
                        </div>
                      </div>
                      <div className={`${p}-cym-mcard-bottom`}>
                        <div className={`${p}-cym-mcard-stat`}>
                          <span className={`${p}-cym-mcard-stat-label`}>Alacak</span>
                          <span className={`${p}-cym-mcard-stat-val`} style={{ color: 'var(--p-color-success)' }}>
                            {alacak > 0 ? TL(alacak) : '—'}
                          </span>
                        </div>
                        <div className={`${p}-cym-mcard-divider`} />
                        <div className={`${p}-cym-mcard-stat`}>
                          <span className={`${p}-cym-mcard-stat-label`}>Borç</span>
                          <span className={`${p}-cym-mcard-stat-val`} style={{ color: 'var(--p-color-danger)' }}>
                            {borc > 0 ? TL(borc) : '—'}
                          </span>
                        </div>
                        <div className={`${p}-cym-mcard-divider`} />
                        <div className={`${p}-cym-mcard-stat`}>
                          <span className={`${p}-cym-mcard-stat-label`}>Son İşlem</span>
                          <span className={`${p}-cym-mcard-stat-val`}>{tarihFmt(cari.son_islem)}</span>
                        </div>
                      </div>
                    </div>
                  </SwipeCard>
                )
              })}
            </>
          )}
        </div>
        </>
        )}

        {!(listYukleniyor || (aktifSekme === 'vadesi_gecmis' && vadesiGecmisYukleniyor)) && !listHata && toplamSayfa > 1 && (
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
      <Modal open={cariModalAcik} onClose={() => setCariModalAcik(false)} size="lg" p={p} ariaId="cari-modal-title" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div className={`${p}-modal-header ${p}-mh-default`}>
                <h2 className={`${p}-modal-title`} id="cari-modal-title">
                  <i className={`bi ${cariMod === 'ekle' ? 'bi-person-plus-fill' : 'bi-pencil-square'}`} aria-hidden="true" />
                  {cariMod === 'ekle' ? 'Yeni Cari Ekle' : 'Cari Düzenle'}
                </h2>
                <button onClick={() => setCariModalAcik(false)} className={`${p}-modal-close`} type="button" aria-label="Kapat">
                  <i className="bi bi-x-lg" aria-hidden="true" />
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
                          { val: 'satici', label: 'Tedarikçi',  icon: 'bi-truck',             cls: 'danger' },
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
                      <div className="p-input-icon">
                        <i className="bi bi-building" />
                        <input type="text" value={form.unvan} onChange={e => setForm(prev => ({ ...prev, unvan: e.target.value }))}
                          placeholder={form.tip === 'kurumsal' ? 'Şirket Adı A.Ş.' : 'Ad Soyad'}
                          className="form-control" required />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className={`${p}-cym-label`}>Adres</label>
                      <div className="p-input-icon">
                        <i className="bi bi-geo-alt p-input-icon-top" />
                        <textarea value={form.adres} onChange={e => setForm(prev => ({ ...prev, adres: e.target.value }))}
                          placeholder="Tam adres..." rows={2} className="form-control"
                          style={{ resize: 'none' }} />
                      </div>
                    </div>
                    <div className="col-6">
                      <label className={`${p}-cym-label`}>İlçe</label>
                      <div className="p-input-icon">
                        <i className="bi bi-pin-map" />
                        <input type="text" value={form.ilce} onChange={e => setForm(prev => ({ ...prev, ilce: e.target.value }))}
                          placeholder="Örn: Kadıköy" className="form-control" />
                      </div>
                    </div>
                    <div className="col-6">
                      <label className={`${p}-cym-label`}>İl</label>
                      <div className="p-input-icon">
                        <i className="bi bi-map" />
                        <input type="text" value={form.il} onChange={e => setForm(prev => ({ ...prev, il: e.target.value }))}
                          placeholder="Örn: İstanbul" className="form-control" />
                      </div>
                    </div>
                    <div className="col-6">
                      <label className={`${p}-cym-label`}>{form.tip === 'kurumsal' ? 'Vergi Numarası' : 'TC Kimlik No'}</label>
                      <div className="p-input-icon">
                        <i className="bi bi-hash" />
                        <input type="text" value={form.vergi_no} onChange={e => setForm(prev => ({ ...prev, vergi_no: e.target.value }))}
                          placeholder={form.tip === 'kurumsal' ? '10 haneli' : '11 haneli'} className="form-control" />
                      </div>
                    </div>
                    <div className="col-6">
                      <label className={`${p}-cym-label`}>Telefon</label>
                      <div className="p-input-icon">
                        <i className="bi bi-telephone" />
                        <input type="text" value={form.telefon} onChange={e => setForm(prev => ({ ...prev, telefon: e.target.value }))}
                          placeholder="0212 555 00 00" className="form-control" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`${p}-modal-footer`}>
                  <button type="button" onClick={() => setCariModalAcik(false)} className={`${p}-btn-cancel`}>İptal</button>
                  <button type="submit" disabled={yukleniyor} className={`${p}-btn-save ${p}-btn-save-default`}>
                    {yukleniyor
                      ? <><i className="bi bi-arrow-repeat me-2 ${p}-cym-spin" />Kaydediliyor...</>
                      : <><i className="bi bi-check-lg me-2" />{cariMod === 'ekle' ? 'Cari Ekle' : 'Güncelle'}</>}
                  </button>
                </div>
              </form>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL 2 — Finansal İşlem (Dinamik)
      ══════════════════════════════════════════════ */}
      <Modal open={islemModalAcik} onClose={() => setIslemModalAcik(false)} p={p} ariaId="islem-modal-title" style={{ display: 'flex', flexDirection: 'column' }}>
              {(() => {
                const etiketler = islemEtiketleri(islemCari)
                return (
                  <>
                    {/* Header */}
                    <div className={`${p}-modal-header ${p}-mh-default`}>
                      <h2 className={`${p}-modal-title`} id="islem-modal-title">
                        <i className="bi bi-currency-exchange" aria-hidden="true" />
                        {etiketler.baslik}
                      </h2>
                      <button onClick={() => setIslemModalAcik(false)} className={`${p}-modal-close`} type="button" aria-label="Kapat">
                        <i className="bi bi-x-lg" aria-hidden="true" />
                      </button>
                    </div>

                    <form onSubmit={islemKaydet} noValidate style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                      <div className={`${p}-modal-body`} style={{ overflowY: 'auto', flex: 1 }}>
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
                          <div className="p-input-icon">
                            <i className="bi bi-currency-exchange" />
                            <input type="text" inputMode="decimal" value={islem.tutar}
                              onChange={e => setIslem(prev => ({ ...prev, tutar: formatParaInput(e.target.value) }))}
                              placeholder="0,00" className="form-control p-tutar-input" required />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className={`${p}-cym-label`}>İşlem Tarihi</label>
                          <DateInput value={islem.tarih} onChange={val => setIslem(prev => ({ ...prev, tarih: val }))}
                            placeholder="İşlem tarihi" />
                        </div>
                        <div>
                          <label className={`${p}-cym-label`}>Açıklama <span className={`${p}-cym-label-hint`}>(opsiyonel)</span></label>
                          <div className="p-input-icon">
                            <i className="bi bi-chat-left p-input-icon-top" />
                            <textarea value={islem.aciklama} onChange={e => setIslem(prev => ({ ...prev, aciklama: e.target.value }))}
                              placeholder="İşlem açıklaması..." rows={2} className="form-control"
                              style={{ resize: 'none' }} />
                          </div>
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
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL 3 — Cari Kart (Netsis Mantığı)
      ══════════════════════════════════════════════ */}
      <Modal open={kartModalAcik} onClose={() => setKartModalAcik(false)} size="xl" p={p} style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
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
                          {kartCari.cariTip === 'alici' ? 'Müşteri' : 'Tedarikçi'} · Bakiye: <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>{TL(kartCari.bakiye)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button onClick={() => { islemAc(kartCari) }} className={`${p}-cym-kart-header-btn`}>
                        <i className="bi bi-currency-exchange" /> Finansal İşlem
                      </button>
                      <button onClick={() => izinVarMi('pdf_rapor') ? ekstrePdfIndir(kartCari, kartHareketler) : setPlanModalGoster(true)} className={`${p}-cym-kart-header-btn`}>
                        <i className="bi bi-file-earmark-pdf" /> PDF İndir
                        {!izinVarMi('pdf_rapor') && <i className="bi bi-lock-fill" style={{ fontSize: 10, opacity: 0.5, marginLeft: 4 }} />}
                      </button>
                      <button onClick={() => setKartModalAcik(false)} className={`${p}-cym-kart-header-close`}>
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  </div>

                  {/* Nav Tabs */}
                  <div className={`${p}-cym-kart-nav`}>
                    <div className="d-flex gap-1 flex-wrap" style={{ marginBottom: -1 }}>
                      {[
                        { key: 'bilgiler',      label: 'Cari Bilgiler',    icon: 'bi-info-circle-fill' },
                        { key: 'finansal_ozet', label: 'Finansal Özet',    icon: 'bi-bar-chart-fill' },
                        { key: 'ekstre',        label: 'Hareket Geçmişi',  icon: 'bi-list-ul' },
                        { key: 'yaslandirma',   label: 'Yaşlandırma',      icon: 'bi-clock-history' },
                      ].map(t => {
                        const a = kartSekme === t.key
                        return (
                          <button
                            key={t.key}
                            onClick={() => kartSekmeChange(t.key)}
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
                  <div className={`${p}-modal-body`} style={{ overflowY: 'auto', flex: 1, minHeight: 440 }}>
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
                                    { val: 'satici', label: 'Tedarikçi', icon: 'bi-truck',             cls: 'danger' },
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
                              <button type="submit" disabled={yukleniyor} className={`${p}-btn-save ${p}-btn-save-default`}>
                                {yukleniyor ? <><i className={`bi bi-arrow-repeat me-2 ${p}-cym-spin`} />Kaydediliyor...</> : <><i className="bi bi-check-lg me-2" />Kaydet</>}
                              </button>
                            </div>
                          </form>
                        )}
                      </>
                    )}

                    {/* ─── Sekme 2: Finansal Özet ─── */}
                    {kartSekme === 'finansal_ozet' && (
                      <>
                        {kartFinansalYukleniyor ? (
                          <div className="d-flex flex-column align-items-center justify-content-center py-5">
                            <div className={`${p}-cym-spinner mb-2`} />
                            <span className={`${p}-cym-loading-text`}>Finansal veriler yükleniyor...</span>
                          </div>
                        ) : !kartFinansalOzet ? (
                          <div className={`${p}-cym-empty-state`} style={{ padding: '48px 24px' }}>
                            <i className="bi bi-bar-chart d-block mb-2" />
                            <p>Finansal özet alınamadı.</p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {[
                              { label: 'Toplam Alacak',       val: TL(kartFinansalOzet.toplam_alacak),  renk: renkler.success,  icon: 'bi-arrow-down-circle-fill' },
                              { label: 'Toplam Borç',         val: TL(kartFinansalOzet.toplam_borc),    renk: renkler.danger,   icon: 'bi-arrow-up-circle-fill' },
                              { label: 'Net Bakiye',          val: TL(kartFinansalOzet.net_bakiye),     renk: bakiyeRenk(kartFinansalOzet.net_bakiye), icon: 'bi-wallet2' },
                              { label: 'Açık Ödeme',          val: `${kartFinansalOzet.acik_odeme_sayisi} kayıt`,          renk: null,             icon: 'bi-hourglass-split' },
                              { label: 'Vadesi Geçmiş',       val: `${kartFinansalOzet.vadesi_gecmis_odeme_sayisi} kayıt`,  renk: kartFinansalOzet.vadesi_gecmis_odeme_sayisi > 0 ? renkler.danger : null, icon: 'bi-exclamation-circle' },
                            ].map((item, i) => (
                              <div key={i} className="col-12 col-md-4">
                                <div className={`${p}-cym-info-card`} style={{ textAlign: 'center' }}>
                                  <div className={`${p}-cym-info-card-label d-flex align-items-center justify-content-center gap-2`} style={{ marginBottom: 8 }}>
                                    <i className={`bi ${item.icon}`} />
                                    {item.label}
                                  </div>
                                  <div className={`${p}-cym-info-card-value`} style={item.renk ? { color: item.renk } : undefined}>
                                    {item.val}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* ─── Sekme 3: Hareket Geçmişi ─── */}
                    {kartSekme === 'ekstre' && (
                      <>
                        {/* Özet Kartları + Yeni Ödeme Butonu */}
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                          <div className="d-flex gap-3">
                            {[
                              { label: 'Güncel Bakiye', val: TL(kartCari.bakiye),       renk: bakiyeRenk(kartCari.bakiye) },
                              { label: 'İşlem Sayısı', val: kartHareketYukleniyor ? '...' : kartHareketler.length, renk: null },
                              { label: 'Son İşlem',    val: tarihFmt(kartCari.son_islem), renk: null },
                            ].map((item, i) => (
                              <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 2 }}>{item.label}</div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: item.renk || 'inherit' }}>{item.val}</div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              setKartModalAcik(false)
                              tekliOdemeEkle(kartCari.id)
                            }}
                            className={`${p}-cym-btn-outline d-flex align-items-center gap-2`}
                            style={{ fontSize: 13 }}
                          >
                            <i className="bi bi-calendar-plus" /> Ödeme Takibine Al
                          </button>
                        </div>
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
                                          <DateInput value={duzenForm.tarih} onChange={val => setDuzenForm(prev => ({ ...prev, tarih: val }))}
                                            placeholder="Tarih" />
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

                    {/* ─── Sekme 4: Yaşlandırma ─── */}
                    {kartSekme === 'yaslandirma' && (
                      <>
                        {kartYaslanYukleniyor ? (
                          <div className="d-flex flex-column align-items-center justify-content-center py-5">
                            <div className={`${p}-cym-spinner mb-2`} />
                            <span className={`${p}-cym-loading-text`}>Yaşlandırma hesaplanıyor...</span>
                          </div>
                        ) : !kartYaslandirma ? (
                          <div className={`${p}-cym-empty-state`} style={{ padding: '48px 24px' }}>
                            <i className="bi bi-clock d-block mb-2" />
                            <p>Yaşlandırma verisi alınamadı.</p>
                          </div>
                        ) : (
                          <>
                            {(kartYaslandirma.g0_30.sayi + kartYaslandirma.g31_60.sayi + kartYaslandirma.g61_90.sayi + kartYaslandirma.g90p.sayi) === 0 ? (
                              <div className={`${p}-cym-empty-state`} style={{ padding: '48px 24px' }}>
                                <i className="bi bi-check-circle d-block mb-2" style={{ color: renkler.success }} />
                                <p style={{ color: renkler.success }}>Vadesi geçmiş alacak bulunmuyor.</p>
                              </div>
                            ) : (
                              <div className="row g-3">
                                {[
                                  { label: '0–30 Gün',  data: kartYaslandirma.g0_30,  band: 1 },
                                  { label: '31–60 Gün', data: kartYaslandirma.g31_60, band: 2 },
                                  { label: '61–90 Gün', data: kartYaslandirma.g61_90, band: 3 },
                                  { label: '90+ Gün',   data: kartYaslandirma.g90p,   band: 4 },
                                ].map((grup, i) => (
                                  <div key={i} className="col-12 col-md-6">
                                    <div className={`${p}-cym-info-card ${p}-cym-yas-band ${p}-cym-yas-band-${grup.band}`}>
                                      <div className={`${p}-cym-yas-label ${p}-cym-yas-label-${grup.band}`}>
                                        <i className="bi bi-clock me-2" />{grup.label}
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                          <div className={`${p}-cym-yas-sublabel`}>Kayıt Sayısı</div>
                                          <div className={`${p}-cym-yas-value`}>{grup.data.sayi}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                          <div className={`${p}-cym-yas-sublabel`}>Toplam Tutar</div>
                                          <div className={`${p}-cym-yas-value ${p}-cym-yas-tutar-${grup.band} financial-num`}>{TL(grup.data.tutar)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
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
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL 4 — Toplu Yükle (CSV + Excel)
      ══════════════════════════════════════════════ */}
      <Modal open={topluModalAcik} onClose={() => setTopluModalAcik(false)} p={p} ariaId="toplu-modal-title" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div className={`${p}-modal-header ${p}-mh-default`}>
                <h2 className={`${p}-modal-title`} id="toplu-modal-title">
                  <i className="bi bi-cloud-upload-fill" aria-hidden="true" />
                  Toplu Cari İçeri Aktar
                </h2>
                <button onClick={() => setTopluModalAcik(false)} className={`${p}-modal-close`} type="button" aria-label="Kapat">
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>

              <div className={`${p}-modal-body`} style={{ overflowY: 'auto', maxHeight: '70vh' }}>

                {/* ─── Adım 1 ─── */}
                <div className="d-flex gap-3 mb-3">
                  <span className={`${p}-cym-toplu-step-num`}>1</span>
                  <div style={{ flex: 1 }}>
                    <div className={`${p}-cym-toplu-step-title`}>Excel Şablonunu İndirin ve Doldurun</div>
                    <p className={`${p}-cym-toplu-step-desc`}>
                      Aşağıdaki Excel şablonunu indirin, carilerinizi ekleyin, kaydedin ve buradan yükleyin.
                    </p>
                    <button onClick={topluSablonIndir} className={`${p}-cym-toplu-dl-btn mt-2`}>
                      <i className="bi bi-file-earmark-excel-fill" /> Excel Şablonu İndir (.xlsx)
                    </button>
                  </div>
                </div>

                <hr className={`${p}-cym-toplu-divider`} />

                {/* ─── Sütun Açıklamaları ─── */}
                <div className="d-flex gap-3 mb-3">
                  <span className={`${p}-cym-toplu-step-num`}>2</span>
                  <div style={{ flex: 1 }}>
                    <div className={`${p}-cym-toplu-step-title mb-2`}>Dosya Sütunları</div>
                    {/* Başlık */}
                    <div className={`${p}-cym-toplu-col-row`} style={{ opacity: 0.55, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <div>Sütun Adı</div><div>Durum</div><div>Örnek Değer</div>
                    </div>
                    {[
                      { ad: 'cari_adi',     zorunlu: true,  ornek: 'Test Firması A.Ş.' },
                      { ad: 'cari_turu',    zorunlu: false, ornek: 'musteri · tedarikci · her_ikisi' },
                      { ad: 'vergi_no',     zorunlu: false, ornek: '1234567890' },
                      { ad: 'telefon',      zorunlu: false, ornek: '0532 111 22 33' },
                      { ad: 'email',        zorunlu: false, ornek: 'info@firma.com' },
                      { ad: 'adres',        zorunlu: false, ornek: 'İstanbul, Kadıköy' },
                      { ad: 'yetkili_kisi', zorunlu: false, ornek: 'Ahmet Yılmaz' },
                      { ad: 'bakiye',       zorunlu: false, ornek: '15000.50' },
                    ].map(s => (
                      <div key={s.ad} className={`${p}-cym-toplu-col-row`}>
                        <span className={`${p}-cym-toplu-col-name`}>{s.ad}</span>
                        <span className={s.zorunlu ? `${p}-cym-toplu-badge-req` : `${p}-cym-toplu-badge-opt`}>
                          {s.zorunlu ? 'Zorunlu' : 'Opsiyonel'}
                        </span>
                        <span className={`${p}-cym-toplu-col-example`}>{s.ornek}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className={`${p}-cym-toplu-divider`} />

                {/* ─── Adım 3: Dosya Yükle ─── */}
                <div className="d-flex gap-3">
                  <span className={`${p}-cym-toplu-step-num`}>3</span>
                  <div style={{ flex: 1 }}>
                    <div className={`${p}-cym-toplu-step-title mb-2`}>Dosyanızı Seçin</div>

                    {/* Drag & Drop veya seçilmiş dosya */}
                    {!topluDosya ? (
                      <div
                        className={`${p}-cym-toplu-drop-zone ${topluDragOver ? `${p}-cym-toplu-drop-active` : ''}`}
                        onClick={() => document.getElementById('topluDosyaInput').click()}
                        onDragOver={e => { e.preventDefault(); setTopluDragOver(true) }}
                        onDragLeave={() => setTopluDragOver(false)}
                        onDrop={e => { e.preventDefault(); setTopluDragOver(false); topluDosyaIsle(e.dataTransfer.files[0]) }}
                      >
                        <i className={`bi bi-cloud-upload ${p}-cym-toplu-drop-icon`} />
                        <div className={`${p}-cym-toplu-drop-text`}>Dosyayı buraya sürükleyin veya tıklayın</div>
                        <div className={`${p}-cym-toplu-drop-sub`}>Yalnızca Excel (.xlsx) — Maks. 5 MB</div>
                      </div>
                    ) : (
                      <div className={`${p}-cym-toplu-file-ok`}>
                        <i className={`bi ${/\.xlsx?$/i.test(topluDosya.name) ? 'bi-file-earmark-excel-fill' : 'bi-file-earmark-text-fill'} ${p}-cym-toplu-file-icon`} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className={`${p}-cym-toplu-file-name text-truncate`}>{topluDosya.name}</div>
                          <div className={`${p}-cym-toplu-file-meta`}>
                            {topluOnizleme ? `${topluOnizleme.toplam} kayıt okundu` : 'İşleniyor...'}
                          </div>
                        </div>
                        <button
                          onClick={() => { setTopluDosya(null); setTopluOnizleme(null); setTopluSonuc(null) }}
                          className={`${p}-modal-close`} title="Kaldır"
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    )}

                    {/* Önizleme */}
                    {topluOnizleme && topluOnizleme.satirlar.length > 1 && (
                      <div className={`${p}-cym-info-card mt-2`} style={{ padding: '8px 12px' }}>
                        <div className={`${p}-cym-info-card-label mb-1`}>
                          <i className="bi bi-table me-1" />Önizleme (ilk 3 satır)
                        </div>
                        {topluOnizleme.satirlar.slice(1, 4).map((s, i) => (
                          <div key={i} style={{ fontFamily: 'monospace', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.75 }}>
                            {i + 1}. {s}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Kolon Eşleştirme */}
                    {topluDosya && topluKolonlar.length > 0 && (
                      <div className={`${p}-cym-info-card mt-3`} style={{ padding: '12px 16px' }}>
                        <div className={`${p}-cym-info-card-label mb-2`} style={{ fontWeight: 700 }}>
                          <i className="bi bi-arrow-left-right me-1" /> Kolon Eşleştirme
                          <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 8, opacity: 0.6 }}>
                            Dosyadaki her sütunu sistem alanıyla eşleştirin
                          </span>
                        </div>
                        {topluKolonlar.map(kolon => (
                          <div key={kolon} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, flex: '0 0 140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>{kolon}</span>
                            <i className="bi bi-arrow-right" style={{ opacity: 0.4, fontSize: 12 }} />
                            <select
                              value={topluKolonEslesme[kolon] ?? 'atla'}
                              onChange={e => setTopluKolonEslesme(prev => ({ ...prev, [kolon]: e.target.value }))}
                              className={`${p}-cym-select`}
                              style={{ flex: 1, fontSize: 12, padding: '4px 8px' }}
                            >
                              <option value="atla">— Atla —</option>
                              <option value="cari_adi">cari_adi</option>
                              <option value="bakiye">bakiye</option>
                              <option value="telefon">telefon</option>
                              <option value="vergi_no">vergi_no</option>
                              <option value="email">email</option>
                              <option value="adres">adres</option>
                              <option value="cari_turu">cari_turu</option>
                              <option value="yetkili_kisi">yetkili_kisi</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sonuç */}
                    {topluSonuc && (
                      <div className={`${p}-cym-toplu-result ${(topluSonuc.basarili_sayisi > 0 || topluSonuc.guncellenen_sayisi > 0) ? `${p}-cym-toplu-result-ok` : `${p}-cym-toplu-result-warn`}`}>
                        <div className={`${p}-cym-toplu-result-title`}>
                          <i className={`bi ${(topluSonuc.basarili_sayisi > 0 || topluSonuc.guncellenen_sayisi > 0) ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2`} />
                          {topluSonuc.basarili_sayisi > 0 && `${topluSonuc.basarili_sayisi} yeni cari eklendi`}
                          {topluSonuc.basarili_sayisi > 0 && topluSonuc.guncellenen_sayisi > 0 && ' · '}
                          {topluSonuc.guncellenen_sayisi > 0 && `${topluSonuc.guncellenen_sayisi} cari bakiyesi güncellendi`}
                          {topluSonuc.hatali_sayisi > 0 && ` · ${topluSonuc.hatali_sayisi} satırda hata`}
                        </div>
                        {topluSonuc.hatali_satirlar?.map((h, i) => (
                          <div key={i} className={`${p}-cym-toplu-result-row`}>
                            <i className="bi bi-exclamation-triangle me-1" />Satır {h.satir}: {h.hata}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gizli file input */}
              <input
                id="topluDosyaInput"
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={topluDosyaSec}
              />

              <div className={`${p}-modal-footer`}>
                <button onClick={() => setTopluModalAcik(false)} className={`${p}-btn-cancel`}>Kapat</button>
                <button
                  onClick={topluGonder}
                  disabled={!topluDosya || topluYukleniyor}
                  className={`${p}-btn-save ${p}-btn-save-default d-flex align-items-center gap-2`}
                  style={{ opacity: (!topluDosya || topluYukleniyor) ? 0.5 : 1 }}
                >
                  {topluYukleniyor
                    ? <><i className={`bi bi-arrow-repeat ${p}-cym-spin`} />Yükleniyor...</>
                    : <><i className="bi bi-cloud-upload" />{topluOnizleme ? `${topluOnizleme.toplam} Cari Yükle` : 'Yükle'}</>}
                </button>
              </div>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL 5 — Silme Onayı
      ══════════════════════════════════════════════ */}
      <Modal open={silModalAcik} onClose={() => setSilModalAcik(false)} size="sm" confirm p={p} ariaId="sil-modal-title">
              <div className={`${p}-modal-header ${p}-mh-danger`}>
                <h2 className={`${p}-modal-title`} id="sil-modal-title">
                  <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                  Cari Pasife Al
                </h2>
                <button onClick={() => setSilModalAcik(false)} className={`${p}-modal-close`} type="button" aria-label="Kapat">
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>
              <div className={`${p}-modal-body`}>
                <p style={{ margin: 0 }}>
                  <strong>{silCari?.unvan}</strong> cari kaydını pasife almak istediğinizden emin misiniz?
                </p>
              </div>
              <div className={`${p}-modal-footer`}>
                <button onClick={() => setSilModalAcik(false)} className={`${p}-btn-cancel`}>Vazgeç</button>
                <button onClick={silOnayla} disabled={yukleniyor} className={`${p}-btn-save ${p}-btn-save-red d-flex align-items-center justify-content-center gap-2`}>
                  {yukleniyor
                    ? <><i className={`bi bi-arrow-repeat ${p}-cym-spin`} /> İşleniyor...</>
                    : <><i className="bi bi-trash" /> Pasife Al</>}
                </button>
              </div>
      </Modal>
      {/* ─── Floating Action Bar — Toplu Ödeme Takibe Al ─────────────────── */}
      {secilenCariler.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))', left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', borderRadius: 14, padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 16, zIndex: 1040,
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)', minWidth: 320,
        }}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
            <i className="bi bi-check2-square me-2" style={{ color: '#10B981' }} />
            {secilenCariler.size} cari seçili
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setSecilenCariler(new Set())}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
          >
            İptal
          </button>
          <button
            onClick={odemeEkleGonder}
            disabled={odemeEkleYukleniyor}
            style={{
              background: '#10B981', border: 'none', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              padding: '8px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
              opacity: odemeEkleYukleniyor ? 0.6 : 1,
            }}
          >
            {odemeEkleYukleniyor
              ? <><i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }} />İşleniyor...</>
              : <><i className="bi bi-calendar-plus-fill" />Ödeme Takibine Al</>}
          </button>
        </div>
      )}


      <PlanYukseltModal goster={planModalGoster} kapat={() => setPlanModalGoster(false)} ozellikAdi="PDF Ekstre İndirme" mevcutPlan={plan} />
    </div>
  )
}
