import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { odemeApi } from '../../api/odeme'
import { carilerApi } from '../../api/cariler'
import useTemaStore from '../../stores/temaStore'
import { temaRenkleri, hexRgba } from '../../lib/temaRenkleri'

const prefixMap = { banking: 'b', earthy: 'e', dark: 'd' }

/* ═══════════════════════════════════════════════════════════════
   YARDIMCI FONKSİYONLAR
   ═══════════════════════════════════════════════════════════════ */

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'TRY', maximumFractionDigits: 0,
  }).format(n || 0)

const tarihStr = (t) => {
  if (!t) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date(t + 'T00:00:00'))
}

const gunFarki = (t) => {
  if (!t) return null
  const b = new Date(); b.setHours(0, 0, 0, 0)
  return Math.floor((new Date(t + 'T00:00:00') - b) / 86400000)
}

const bugunStr = (offset = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

/* ═══════════════════════════════════════════════════════════════
   SABİTLER
   ═══════════════════════════════════════════════════════════════ */

const ARAMA_SECENEKLERI = [
  { id: 'cevap_yok',  emoji: '📵', label: 'Cevap Vermedi' },
  { id: 'soz_alindi', emoji: '💬', label: 'Görüştüm — Söz Verdi' },
  { id: 'tamamlandi', emoji: '✅', label: 'Ödedi / Tahsil Ettim' },
  { id: 'ertelendi',  emoji: '⏰', label: 'Ertele (Tarih Seç)' },
]

const ONCELIK_SIRA = { kritik: 0, yuksek: 1, normal: 2, dusuk: 3 }

/* ═══════════════════════════════════════════════════════════════
   TABLO YARDIMCILARI
   ═══════════════════════════════════════════════════════════════ */

function kenariRenk(tarih, durum, renkler) {
  if (durum === 'tamamlandi') return renkler.success
  const fark = gunFarki(tarih)
  if (fark === null) return 'transparent'
  if (fark < 0)   return renkler.danger
  if (fark === 0) return renkler.warning
  if (fark <= 3)  return renkler.warning
  return 'transparent'
}

function vadeBadge(tarih, durum, p) {
  if (durum === 'tamamlandi') return { text: 'Tamamlandı', cls: `${p}-odm-badge-success` }
  const fark = gunFarki(tarih)
  if (fark === null) return null
  if (fark === 0)  return { text: 'Bugün',                    cls: `${p}-odm-badge-warning` }
  if (fark > 0)   return { text: `${fark} gün kaldı`,        cls: `${p}-odm-badge-success` }
  return                  { text: `${Math.abs(fark)} gün geçti`, cls: `${p}-odm-badge-danger` }
}

function isPulse(k) {
  return k.oncelik === 'kritik' && gunFarki(k.vade_tarihi) < 0 && k.arama_durumu === 'aranmadi'
}

/* ═══════════════════════════════════════════════════════════════
   ANA BİLEŞEN
   ═══════════════════════════════════════════════════════════════ */

export default function OdemeTakip() {
  const navigate = useNavigate()
  const location = useLocation()
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'b'
  const renkler = temaRenkleri[aktifTema] || temaRenkleri.banking

  const ONCELIK_META = {
    kritik: { label: 'Kritik',  cls: `${p}-odm-oncelik-kritik` },
    yuksek: { label: 'Yüksek',  cls: `${p}-odm-oncelik-yuksek` },
    normal: { label: 'Normal', cls: `${p}-odm-oncelik-normal` },
    dusuk:  { label: 'Düşük',  cls: `${p}-odm-oncelik-dusuk` },
  }

  const ARAMA_DURUM_META = {
    aranmadi:   { label: 'Aranmadı',   cls: `${p}-odm-arama-aranmadi`,   icon: 'bi-telephone' },
    cevap_yok:  { label: 'Cevap Yok',  cls: `${p}-odm-arama-cevapyok`,  icon: 'bi-telephone-x' },
    soz_alindi: { label: 'Söz Alındı', cls: `${p}-odm-arama-sozalindi`, icon: 'bi-check2' },
    tamamlandi: { label: 'Tamamlandı', cls: `${p}-odm-arama-tamamlandi`, icon: 'bi-check-circle-fill' },
  }

  const drawerRef = useRef(null)

  const [liste,            setListe]            = useState([])
  const [yukleniyor,       setYukleniyor]       = useState(true)
  const [apiHatasi,        setApiHatasi]        = useState(false)
  const [aktifFiltre,      setAktifFiltre]      = useState('bu_hafta')
  const [aramaTerm,        setAramaTerm]        = useState('')
  const [debouncedArama,   setDebouncedArama]   = useState('')
  const [secilenKayitId,   setSecilenKayitId]   = useState(null)
  const [aramaModaliId,    setAramaModaliId]    = useState(null)
  const [kpiVerisi,        setKpiVerisi]        = useState(null)
  const [filtrePaneli,     setFiltrePaneli]     = useState(false)
  const [oncelikFiltre,    setOncelikFiltre]    = useState('')
  const [baslangicTarihi,  setBaslangicTarihi]  = useState('')
  const [bitisTarihi,      setBitisTarihi]      = useState('')
  const [menuAcikId,       setMenuAcikId]       = useState(null)
  const [menuPos,          setMenuPos]          = useState({ top: 0, left: 0 })
  const [aramaSonucu,      setAramaSonucu]      = useState(null)
  const [aramaNotText,     setAramaNotText]     = useState('')
  const [hatirlaticiTarihi,setHatirlaticiTarihi]= useState('')

  // Düzenleme modu — null=yeni kayıt, sayı=mevcut kaydı düzenle
  const [duzenlemeId, setDuzenlemeId] = useState(null)

  // Silme onay modalı
  const [silOnayId, setSilOnayId] = useState(null)
  const [silYukleniyor, setSilYukleniyor] = useState(false)

  // Yeni Kayıt Ekle modal state'leri
  const BOSH_YENI_FORM = { firma_adi: '', ilgili_kisi: '', telefon: '', tutar: '', yon: 'tahsilat', soz_tarihi: bugunStr(0), oncelik: 'normal', cari_id: null, cari_sabit: false }
  const [showYeniModal,        setShowYeniModal]        = useState(false)
  const [yeniForm,             setYeniForm]             = useState(BOSH_YENI_FORM)
  const [yeniKaydetYukleniyor, setYeniKaydetYukleniyor] = useState(false)
  const [yeniFormHata,         setYeniFormHata]         = useState('')

  // Cari filtresi ve listesi
  const [cariFiltre,  setCariFiltre]  = useState('')
  const [cariListesi, setCariListesi] = useState([])

  const secilenKayit = useMemo(() => liste.find(k => k.id === secilenKayitId) || null, [liste, secilenKayitId])
  const aramaModali  = useMemo(() => liste.find(k => k.id === aramaModaliId)  || null, [liste, aramaModaliId])

  // Drawer açıldığında görünür alana kaydır
  useEffect(() => {
    if (secilenKayit && drawerRef.current) {
      setTimeout(() => {
        drawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [secilenKayitId])

  useEffect(() => {
    const veriGetir = async () => {
      try {
        const [listeRes, ozetRes, cariRes] = await Promise.all([
          odemeApi.listele(),
          odemeApi.ozet(),
          carilerApi.listele({ adet: 100 }),
        ])
        const kayitlar = listeRes.data?.veri?.kayitlar || listeRes.data?.veri || []
        setListe(kayitlar.map(k => ({ ...k, vade_tarihi: k.vade_tarihi || k.soz_tarihi, arama_gecmisi: Array.isArray(k.arama_gecmisi) ? k.arama_gecmisi : [] })))
        setKpiVerisi(ozetRes.data?.veri || null)
        setCariListesi(cariRes.data?.veri?.cariler || [])
      } catch {
        setApiHatasi(true)
      } finally {
        setYukleniyor(false)
      }
    }
    veriGetir()
  }, [])

  // Cari sayfasından yönlendirilince otomatik modal aç + cari bilgilerini doldur
  useEffect(() => {
    const state = location.state
    if (state?.onceden_cari_id && state?.onceden_cari_adi) {
      // Bakiyeyi input formatına çevir: 5000000 → "5.000.000"
      const bakiyeStr = state.onceden_bakiye > 0
        ? Math.round(state.onceden_bakiye).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        : ''
      setYeniForm({
        ...BOSH_YENI_FORM,
        firma_adi: state.onceden_cari_adi,
        cari_id: state.onceden_cari_id,
        cari_sabit: true,
        tutar: bakiyeStr,
      })
      setYeniFormHata('')
      setShowYeniModal(true)
      // State'i temizle (tekrar açılmasını önle)
      window.history.replaceState({}, '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedArama(aramaTerm), 300)
    return () => clearTimeout(t)
  }, [aramaTerm])

  useEffect(() => {
    const fn = (e) => {
      if (e.key !== 'Escape') return
      if (silOnayId) { setSilOnayId(null) }
      else if (showYeniModal) { setShowYeniModal(false); setYeniForm(BOSH_YENI_FORM); setYeniFormHata(''); setDuzenlemeId(null) }
      else if (aramaModaliId) { setAramaModaliId(null); resetModal() }
      else if (menuAcikId) setMenuAcikId(null)
      else if (secilenKayitId) setSecilenKayitId(null)
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [silOnayId, showYeniModal, aramaModaliId, menuAcikId, secilenKayitId])

  useEffect(() => {
    document.body.style.overflow = (aramaModaliId || showYeniModal || silOnayId) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aramaModaliId, showYeniModal, silOnayId])

  useEffect(() => {
    if (!menuAcikId) return
    const fn = () => setMenuAcikId(null)
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [menuAcikId])

  const filtreliListe = useMemo(() => {
    let s = [...liste]
    if (aktifFiltre === 'bu_hafta') {
      const bugun = new Date(); bugun.setHours(0,0,0,0)
      const gun = bugun.getDay()
      const pzt = new Date(bugun); pzt.setDate(bugun.getDate() - (gun === 0 ? 6 : gun - 1))
      const pzr = new Date(pzt);   pzr.setDate(pzt.getDate() + 6); pzr.setHours(23,59,59,999)
      s = s.filter(k => { const v = new Date(k.vade_tarihi + 'T00:00:00'); return v >= pzt && v <= pzr })
    } else if (aktifFiltre === 'gecikmus') {
      const bugun = new Date(); bugun.setHours(0,0,0,0)
      s = s.filter(k => new Date(k.vade_tarihi + 'T00:00:00') < bugun && k.durum !== 'tamamlandi')
    } else if (aktifFiltre === 'arandi')    { s = s.filter(k => k.arama_durumu !== 'aranmadi') }
    else if (aktifFiltre === 'soz_alindi') { s = s.filter(k => k.arama_durumu === 'soz_alindi') }
    if (debouncedArama.trim()) {
      const q = debouncedArama.toLowerCase()
      s = s.filter(k => k.firma_adi.toLowerCase().includes(q) || (k.cari_adi || '').toLowerCase().includes(q) || (k.telefon && k.telefon.includes(q)))
    }
    if (oncelikFiltre)   s = s.filter(k => k.oncelik === oncelikFiltre)
    if (baslangicTarihi) s = s.filter(k => k.vade_tarihi >= baslangicTarihi)
    if (bitisTarihi)     s = s.filter(k => k.vade_tarihi <= bitisTarihi)
    if (cariFiltre)      s = s.filter(k => String(k.cari_id) === cariFiltre)
    return s.sort((a, b) => {
      const d = ONCELIK_SIRA[a.oncelik] - ONCELIK_SIRA[b.oncelik]
      return d !== 0 ? d : a.vade_tarihi.localeCompare(b.vade_tarihi)
    })
  }, [liste, aktifFiltre, debouncedArama, oncelikFiltre, baslangicTarihi, bitisTarihi, cariFiltre])

  // Alacak Yaşlandırma — tahsilat kayıtlarından hesaplanır (her bucket: geçen gün)
  const yaslima = useMemo(() => {
    const bugun = new Date(); bugun.setHours(0,0,0,0)
    const alacaklar = liste.filter(k => k.yon === 'tahsilat' && k.durum !== 'tamamlandi' && k.durum !== 'iptal')
    const toplamTutar = alacaklar.reduce((s, k) => s + (parseFloat(k.tutar) || 0), 0)
    const buckets = [
      { aralik: '0 – 30 Gün',  min: 0,  max: 30,  cls: `${p}-odm-yas-0` },
      { aralik: '31 – 60 Gün', min: 31, max: 60,  cls: `${p}-odm-yas-1` },
      { aralik: '61 – 90 Gün', min: 61, max: 90,  cls: `${p}-odm-yas-2` },
      { aralik: '90+ Gün',     min: 91, max: Infinity, cls: `${p}-odm-yas-3` },
    ]
    return buckets.map(b => {
      const tutar = alacaklar
        .filter(k => {
          const vade = new Date((k.vade_tarihi || k.soz_tarihi) + 'T00:00:00')
          const gecenGun = Math.max(0, Math.floor((bugun - vade) / 86400000))
          return gecenGun >= b.min && gecenGun <= b.max
        })
        .reduce((s, k) => s + (parseFloat(k.tutar) || 0), 0)
      const oran = toplamTutar > 0 ? Math.round((tutar / toplamTutar) * 1000) / 10 : 0
      return { ...b, tutar, oran }
    })
  }, [liste, p])

  // Yaklaşan Giden Ödemeler — önümüzdeki 15 gün, yon=odeme
  const yaklasan = useMemo(() => {
    const bugun = new Date(); bugun.setHours(0,0,0,0)
    const sonGun = new Date(bugun); sonGun.setDate(bugun.getDate() + 15)
    return liste
      .filter(k => {
        if (k.yon !== 'odeme' || k.durum === 'tamamlandi' || k.durum === 'iptal') return false
        const v = new Date((k.vade_tarihi || k.soz_tarihi) + 'T00:00:00')
        return v >= bugun && v <= sonGun
      })
      .sort((a, b) => (a.vade_tarihi || a.soz_tarihi).localeCompare(b.vade_tarihi || b.soz_tarihi))
      .slice(0, 8)
      .map(k => ({
        id: k.id,
        firma: k.firma_adi,
        tur: 'Ödeme',
        tutar: parseFloat(k.tutar) || 0,
        tarih: k.vade_tarihi || k.soz_tarihi,
        ikon: 'bi-arrow-up-right-circle',
      }))
  }, [liste])

  const resetModal = () => { setAramaSonucu(null); setAramaNotText(''); setHatirlaticiTarihi('') }
  const modalAc    = (kayit) => { resetModal(); setAramaModaliId(kayit.id) }

  const yeniEkleKaydet = async () => {
    if (!yeniForm.firma_adi.trim()) { setYeniFormHata('Firma adı zorunludur.'); return }
    if (!yeniForm.soz_tarihi)       { setYeniFormHata('Vade tarihi zorunludur.'); return }
    setYeniFormHata('')
    setYeniKaydetYukleniyor(true)
    const tutar = parseFloat(yeniForm.tutar.replace(/\./g, '').replace(',', '.')) || 0
    try {
      const payload = { ...yeniForm, tutar }
      delete payload.cari_sabit // Backend'e gönderme
      const res   = await odemeApi.olustur(payload)
      const kayit = res.data?.veri || {}
      setListe(prev => [{ ...kayit, vade_tarihi: kayit.vade_tarihi || kayit.soz_tarihi || yeniForm.soz_tarihi, arama_gecmisi: [], arama_durumu: 'aranmadi' }, ...prev])
      setYeniKaydetYukleniyor(false)
      setShowYeniModal(false)
      setYeniForm(BOSH_YENI_FORM)
    } catch {
      setYeniKaydetYukleniyor(false)
      setYeniFormHata('Kayıt kaydedilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.')
    }
  }

  const aramaKaydet = async () => {
    if (!aramaSonucu || !aramaModaliId) return
    const yeniGecmis = { tarih: bugunStr(0), sonuc: aramaSonucu === 'ertelendi' ? 'soz_alindi' : aramaSonucu, not: aramaNotText }
    const yeniDurum  = aramaSonucu === 'tamamlandi' ? 'tamamlandi' : aramaSonucu === 'ertelendi' ? 'soz_alindi' : aramaSonucu
    const oncekiListe = liste
    setListe(prev => prev.map(k => {
      if (k.id !== aramaModaliId) return k
      return {
        ...k, arama_durumu: yeniDurum,
        ...(aramaSonucu === 'tamamlandi' ? { durum: 'tamamlandi' } : {}),
        ...(aramaSonucu === 'ertelendi'  ? { durum: 'ertelendi' }  : {}),
        son_arama_tarihi: bugunStr(0), son_not: aramaNotText || null,
        arama_gecmisi: [yeniGecmis, ...(k.arama_gecmisi || [])],
      }
    }))
    setAramaModaliId(null); resetModal()
    try {
      await odemeApi.guncelle(aramaModaliId, {
        arama_durumu: yeniDurum,
        ...(aramaSonucu === 'tamamlandi' ? { durum: 'tamamlandi' } : {}),
        ...(aramaSonucu === 'ertelendi'  ? { durum: 'ertelendi' }  : {}),
        son_arama_tarihi: bugunStr(0),
        son_not: aramaNotText || null,
      })
    } catch {
      setListe(oncekiListe)
    }
  }

  const tamamlaKayit = async (id, e) => {
    e.stopPropagation()
    const oncekiListe = liste
    setListe(prev => prev.map(k => k.id === id ? { ...k, durum: 'tamamlandi', arama_durumu: 'tamamlandi' } : k))
    try {
      await odemeApi.tamamla(id)
    } catch {
      setListe(oncekiListe)
    }
  }

  const kayitSil = (id, e) => {
    if (e) e.stopPropagation()
    setSilOnayId(id)
  }

  const silOnaylaVeSil = async () => {
    if (!silOnayId) return
    setSilYukleniyor(true)
    const oncekiListe = liste
    setListe(prev => prev.filter(k => k.id !== silOnayId))
    if (secilenKayitId === silOnayId) setSecilenKayitId(null)
    try {
      await odemeApi.sil(silOnayId)
    } catch {
      setListe(oncekiListe)
    } finally {
      setSilYukleniyor(false)
      setSilOnayId(null)
    }
  }

  const duzenlemeBasla = (kayit, e) => {
    if (e) e.stopPropagation()
    const tutarStr = kayit.tutar
      ? new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(kayit.tutar)
      : ''
    setYeniForm({
      firma_adi:   kayit.firma_adi   || '',
      ilgili_kisi: kayit.ilgili_kisi || '',
      telefon:     kayit.telefon     || '',
      tutar:       tutarStr,
      yon:         kayit.yon         || 'tahsilat',
      soz_tarihi:  kayit.vade_tarihi || kayit.soz_tarihi || bugunStr(0),
      oncelik:     kayit.oncelik     || 'normal',
      cari_id:     kayit.cari_id     || null,
      cari_sabit:  false,
    })
    setYeniFormHata('')
    setDuzenlemeId(kayit.id)
    setShowYeniModal(true)
  }

  const duzenlemeKaydet = async () => {
    if (!yeniForm.firma_adi.trim()) { setYeniFormHata('Firma adı zorunludur.'); return }
    if (!yeniForm.soz_tarihi)       { setYeniFormHata('Vade tarihi zorunludur.'); return }
    setYeniFormHata('')
    setYeniKaydetYukleniyor(true)
    const tutar = parseFloat(yeniForm.tutar.replace(/\./g, '').replace(',', '.')) || 0
    try {
      const payload = { ...yeniForm, tutar }
      delete payload.cari_sabit
      const res   = await odemeApi.guncelle(duzenlemeId, payload)
      const kayit = res.data?.veri || {}
      setListe(prev => prev.map(k => k.id === duzenlemeId
        ? { ...k, ...kayit, vade_tarihi: kayit.vade_tarihi || kayit.soz_tarihi || yeniForm.soz_tarihi }
        : k
      ))
      setYeniKaydetYukleniyor(false)
      setShowYeniModal(false)
      setYeniForm(BOSH_YENI_FORM)
      setDuzenlemeId(null)
    } catch {
      setYeniKaydetYukleniyor(false)
      setYeniFormHata('Kayıt güncellenemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.')
    }
  }

  const KPI_TANIM = [
    { key: 'bu_hafta_vadeli', label: 'Bu Hafta Vadeli',   icon: 'bi-calendar-week',        cls: `${p}-odm-kpi-amber` },
    { key: 'bekleyen_tutar',  label: 'Bekleyen Tahsilat', icon: 'bi-hourglass-split',      cls: `${p}-odm-kpi-info`, format: v => TL(v) },
    { key: 'bu_hafta_aranan', label: 'Bu Hafta Aranan',   icon: 'bi-telephone-outbound',   cls: `${p}-odm-kpi-success` },
    { key: 'gecikmus',        label: 'Gecikmiş Alacak',   icon: 'bi-exclamation-triangle', cls: `${p}-odm-kpi-danger` },
  ]

  const toplamYaslima  = yaslima.reduce((s, b) => s + b.tutar, 0)
  const toplamYaklasan = yaklasan.reduce((s, o) => s + o.tutar, 0)
  const donemAdi = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className={`${p}-odm-page`}>

      {/* ── API Hata Banner ── */}
      {apiHatasi && (
        <div className={`${p}-odm-hata-banner`}>
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 16, flexShrink: 0 }} />
          <span>Veriler sunucudan yüklenemedi. Lütfen sayfayı yenileyin.</span>
          <button onClick={() => navigate(0)} className={`${p}-odm-hata-btn`}>
            Yenile
          </button>
        </div>
      )}

      {/* ── Sayfa Başlığı ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 className={`${p}-odm-sayfa-baslik`}>
            <div className={`${p}-odm-baslik-ikon`}>
              <i className="bi bi-credit-card-2-fill" />
            </div>
            Ödeme Takip
          </h1>
          <p className={`${p}-odm-sayfa-alt`}>
            Tahsilat takibi · Alacak yaşlandırma · Yaklaşan ödemeler
          </p>
        </div>
        <button data-tur="odeme-ekle-btn" className={`${p}-btn-save ${p}-btn-save-amber ${p}-odm-yeni-btn`} onClick={() => { setYeniForm(BOSH_YENI_FORM); setYeniFormHata(''); setShowYeniModal(true) }}>
          <i className="bi bi-plus-lg" />
          Yeni Ekle
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 1 — KPI Bandı
          ═══════════════════════════════════════════════════════════ */}
      <div className={`${p}-odm-kpi-grid`} data-tur="odeme-listesi">
        {KPI_TANIM.map(kpi => {
          const ham = kpiVerisi?.[kpi.key] ?? 0
          const deger = yukleniyor ? '—' : kpi.format ? kpi.format(ham) : (kpi.key === 'bekleyen_tutar' ? TL(ham) : `${ham} ${kpi.key === 'bu_hafta_aranan' ? 'kişi' : 'kayıt'}`)
          return (
            <div key={kpi.key} className={`${p}-kpi-card ${p}-odm-kpi-card`}>
              <i className={`bi ${kpi.icon} ${p}-odm-kpi-deco ${kpi.cls}`} />
              <div className={`${p}-kpi-label`}>{kpi.label}</div>
              <div className={`${p}-kpi-value ${kpi.cls}`}>
                {deger}
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 2 — Bilanço Satırı
          ═══════════════════════════════════════════════════════════ */}
      <div className={`${p}-odm-analytics-row`}>

        {/* ── Sol: Alacak Yaşlandırma ── */}
        <div className={`${p}-odm-card`}>
          <div className={`${p}-odm-kart-header`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={`${p}-odm-kart-ikon ${p}-odm-kart-ikon-accent`}>
                <i className="bi bi-clock-history" />
              </div>
              <div>
                <div className={`${p}-odm-kart-baslik`}>Alacak Yaşlandırma</div>
                <div className={`${p}-odm-kart-aciklama`}>
                  Toplam: <strong className={`${p}-odm-accent-text ${p}-odm-mono`}>{TL(toplamYaslima)}</strong>
                </div>
              </div>
            </div>
            <span className={`${p}-odm-donem-badge`}>
              {donemAdi}
            </span>
          </div>

          {yaslima.map((y) => (
            <div key={y.aralik} className={`${p}-odm-yas-item`}>
              <div className={`${p}-odm-yas-header`}>
                <span className={`${p}-odm-yas-aralik`}>{y.aralik}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`${p}-odm-yas-tutar ${y.cls}`}>{TL(y.tutar)}</span>
                  <span className={`${p}-odm-yas-oran ${y.cls}`}>
                    %{y.oran}
                  </span>
                </div>
              </div>
              <div className={`${p}-odm-yas-bar-bg`}>
                <div className={`${p}-odm-yas-bar-fill ${y.cls}`} style={{ width: `${y.oran}%` }} />
              </div>
            </div>
          ))}

          {/* DSO Özet */}
          <div className={`${p}-odm-dso-box`}>
            <div className={`${p}-odm-dso-label`}>
              <i className="bi bi-graph-up me-2" />
              DSO — Ort. Tahsilat Süresi
            </div>
            <span className={`${p}-odm-dso-value`}>43 Gün</span>
          </div>
        </div>

        {/* ── Sağ: Yaklaşan Ödemeler ── */}
        <div className={`${p}-odm-card`}>
          <div className={`${p}-odm-kart-header`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={`${p}-odm-kart-ikon ${p}-odm-kart-ikon-danger`}>
                <i className="bi bi-calendar-x" />
              </div>
              <div>
                <div className={`${p}-odm-kart-baslik`}>Yaklaşan Ödemeler</div>
                <div className={`${p}-odm-kart-aciklama`}>Önümüzdeki 15 gün — giden</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className={`${p}-odm-yaklasan-toplam`}>{TL(toplamYaklasan)}</div>
              <div className={`${p}-odm-yaklasan-alt`}>{yaklasan.length} kalem</div>
            </div>
          </div>

          {yaklasan.length === 0 ? (
            <div className={`${p}-odm-bos-durum`}>
              <i className={`bi bi-check-circle ${p}-odm-bos-ikon-success`} />
              Önümüzdeki 15 günde giden ödeme yok.
            </div>
          ) : yaklasan.map((o) => {
            const fark = gunFarki(o.tarih)
            const acil = fark !== null && fark <= 3
            return (
              <div key={o.id} className={`${p}-odm-odeme-item`}>
                <div className={`${p}-odm-odeme-ikon ${p}-odm-odeme-ikon-danger`}>
                  <i className={`bi ${o.ikon}`} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={`${p}-odm-odeme-firma`}>{o.firma}</div>
                  <div className={`${p}-odm-odeme-tur`}>{o.tur}</div>
                </div>
                <span className={`${p}-odm-odeme-gun ${acil ? `${p}-odm-odeme-gun-acil` : ''}`}>
                  {fark === 0 ? 'Bugün' : `${fark}g`}
                </span>
                <span className={`${p}-odm-odeme-tutar`}>{TL(o.tutar)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 3 — Filtre + Arama
          ═══════════════════════════════════════════════════════════ */}
      <div className={`${p}-odm-filtre-bar`} data-tur="filtreler">
        <div className={`${p}-odm-arama-wrap`}>
          <i className={`bi bi-search ${p}-odm-arama-ikon`} />
          <input
            className={`${p}-odm-arama-input`}
            placeholder="Firma, müşteri veya telefon..."
            value={aramaTerm}
            onChange={e => setAramaTerm(e.target.value)}
          />
        </div>
        <div className={`${p}-odm-tab-wrap`}>
          {[
            { id: 'tumuu',       label: 'Tümü' },
            { id: 'bu_hafta',   label: 'Bu Hafta' },
            { id: 'gecikmus',   label: 'Gecikmiş' },
            { id: 'arandi',     label: 'Arandı' },
            { id: 'soz_alindi', label: 'Söz Alındı' },
          ].map(t => (
            <button key={t.id} className={`${p}-odm-tab${aktifFiltre === t.id ? ` ${p}-odm-tab-active` : ''}`} onClick={() => setAktifFiltre(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <button className={`${p}-odm-filtre-btn${filtrePaneli ? ` ${p}-odm-filtre-btn-aktif` : ''}`} onClick={() => setFiltrePaneli(prev => !prev)}>
          <i className="bi bi-funnel" />
          {filtrePaneli ? 'Kapat' : 'Filtrele'}
        </button>
      </div>

      {filtrePaneli && (
        <div className={`${p}-odm-filtre-panel`}>
          <div>
            <div className={`${p}-odm-filtre-label`}>Öncelik</div>
            <select className={`${p}-odm-select`} value={oncelikFiltre} onChange={e => setOncelikFiltre(e.target.value)}>
              <option value="">Tümü</option>
              <option value="kritik">Kritik</option>
              <option value="yuksek">Yüksek</option>
              <option value="normal">Normal</option>
              <option value="dusuk">Düşük</option>
            </select>
          </div>
          <div>
            <div className={`${p}-odm-filtre-label`}>Cari Hesap</div>
            <select className={`${p}-odm-select`} value={cariFiltre} onChange={e => setCariFiltre(e.target.value)}>
              <option value="">Tüm Cariler</option>
              {cariListesi.map(c => (
                <option key={c.id} value={String(c.id)}>{c.cari_adi}</option>
              ))}
            </select>
          </div>
          <div>
            <div className={`${p}-odm-filtre-label`}>Vade Başlangıç</div>
            <input type="date" className={`${p}-odm-date-input`} value={baslangicTarihi} onChange={e => setBaslangicTarihi(e.target.value)} />
          </div>
          <div>
            <div className={`${p}-odm-filtre-label`}>Vade Bitiş</div>
            <input type="date" className={`${p}-odm-date-input`} value={bitisTarihi} onChange={e => setBitisTarihi(e.target.value)} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 4 — Liste + Sağ Drawer
          ═══════════════════════════════════════════════════════════ */}
      <div className={`${p}-odm-layout`}>
        <div className={`${p}-odm-main`}>

          {yukleniyor ? (
            <div className={`${p}-odm-loading-box`}>
              <div className={`${p}-odm-spinner`} />
            </div>

          ) : filtreliListe.length === 0 ? (
            <div className={`${p}-odm-empty-state`}>
              <div className={`${p}-odm-empty-ikon`}>
                <i className="bi bi-inbox" />
              </div>
              <h3 className={`${p}-odm-empty-baslik`}>Kayıt bulunamadı</h3>
              <p className={`${p}-odm-empty-aciklama`}>Bu filtreye uyan tahsilat kaydı yok.</p>
            </div>

          ) : (
            <>
              {/* ── Desktop Tablo ── */}
              <div className="d-none d-md-block">
                <div className={`${p}-odm-tablo-wrap`}>
                  <div className="table-responsive">
                    <table className={`${p}-odm-table`}>
                      <thead>
                        <tr>
                          <th className={`${p}-odm-td-border`} />
                          <th>Firma / Müşteri</th>
                          <th>Tutar</th>
                          <th>Vade Tarihi</th>
                          <th>Öncelik</th>
                          <th>Arama Durumu</th>
                          <th style={{ width: 110 }}>İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtreliListe.map(k => {
                          const vb     = vadeBadge(k.vade_tarihi, k.durum, p)
                          const ad     = ARAMA_DURUM_META[k.arama_durumu] || ARAMA_DURUM_META.aranmadi
                          const om     = ONCELIK_META[k.oncelik]           || ONCELIK_META.normal
                          const kenari = kenariRenk(k.vade_tarihi, k.durum, renkler)
                          const pulse  = isPulse(k)
                          return (
                            <tr
                              key={k.id}
                              className={`${pulse ? `${p}-odm-kritik-pulse` : ''}${secilenKayitId === k.id ? ` ${p}-odm-tr-secili` : ''}`}
                              onClick={() => setSecilenKayitId(k.id === secilenKayitId ? null : k.id)}
                            >
                              <td className={`${p}-odm-td-border`} style={{ background: kenari }} />

                              <td>
                                <div className={`${p}-odm-firma`}>{k.firma_adi}</div>
                                <div className={`${p}-odm-cari`}>{k.cari_adi}</div>
                              </td>

                              <td>
                                <span className={`${p}-odm-tutar-cell ${k.durum === 'tamamlandi' ? `${p}-odm-tutar-done` : ''}`}>
                                  {TL(k.tutar)}
                                </span>
                              </td>

                              <td>
                                <div className={`${p}-odm-tarih-cell`}>{tarihStr(k.vade_tarihi)}</div>
                                {vb && <span className={`${p}-odm-badge ${vb.cls}`} style={{ marginTop: 4 }}>{vb.text}</span>}
                              </td>

                              <td>
                                <span className={`${p}-odm-badge ${om.cls}`}>
                                  <span className={`${p}-odm-oncelik-dot`} />
                                  {om.label}
                                </span>
                              </td>

                              <td>
                                <span className={`${p}-odm-badge ${ad.cls}`}>
                                  <i className={`bi ${ad.icon}`} style={{ fontSize: 11 }} />
                                  {ad.label}
                                </span>
                                {k.son_not && (
                                  <div className={`${p}-odm-son-not`}>
                                    {k.son_not}
                                  </div>
                                )}
                              </td>

                              <td onClick={e => e.stopPropagation()}>
                                <div className={`${p}-odm-aksiyon-grup`}>
                                  <button className={`${p}-odm-icon-btn ${p}-odm-icon-btn-accent`} title="Arama Kaydı" onClick={() => modalAc(k)}>
                                    <i className="bi bi-telephone" />
                                  </button>
                                  {k.durum !== 'tamamlandi' && (
                                    <button className={`${p}-odm-icon-btn ${p}-odm-icon-btn-success`} title="Tahsil Edildi" onClick={(e) => tamamlaKayit(k.id, e)}>
                                      <i className="bi bi-check-circle" />
                                    </button>
                                  )}
                                  <button className={`${p}-odm-icon-btn`} onClick={(e) => {
                                    e.stopPropagation()
                                    if (menuAcikId === k.id) { setMenuAcikId(null); return }
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setMenuPos({ top: rect.top, left: rect.right })
                                    setMenuAcikId(k.id)
                                  }}>
                                    <i className="bi bi-three-dots-vertical" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── Mobil Kart Görünümü ── */}
              <div className="d-md-none">
                {filtreliListe.map(k => {
                  const vb     = vadeBadge(k.vade_tarihi, k.durum, p)
                  const ad     = ARAMA_DURUM_META[k.arama_durumu] || ARAMA_DURUM_META.aranmadi
                  const om     = ONCELIK_META[k.oncelik]           || ONCELIK_META.normal
                  const kenari = kenariRenk(k.vade_tarihi, k.durum, renkler)
                  const pulse  = isPulse(k)
                  return (
                    <div
                      key={k.id}
                      className={`${p}-odm-mobil-kart${pulse ? ` ${p}-odm-kritik-pulse` : ''}`}
                      style={{ borderLeftColor: kenari }}
                      onClick={() => setSecilenKayitId(k.id === secilenKayitId ? null : k.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
                        <div>
                          <div className={`${p}-odm-firma`}>{k.firma_adi}</div>
                          <div className={`${p}-odm-cari`}>{k.cari_adi}</div>
                        </div>
                        <div className={`${p}-odm-tutar-cell ${k.durum === 'tamamlandi' ? `${p}-odm-tutar-done` : ''}`}>
                          {TL(k.tutar)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 11 }}>
                        {vb && <span className={`${p}-odm-badge ${vb.cls}`}>{vb.text}</span>}
                        <span className={`${p}-odm-badge ${om.cls}`}>{om.label}</span>
                        <span className={`${p}-odm-badge ${ad.cls}`}>
                          <i className={`bi ${ad.icon}`} style={{ fontSize: 11 }} />{ad.label}
                        </span>
                      </div>
                      <div className={`${p}-odm-aksiyon-grup`} onClick={e => e.stopPropagation()}>
                        <button className={`${p}-odm-icon-btn ${p}-odm-icon-btn-accent`} style={{ width: 44, height: 44 }} onClick={() => modalAc(k)}>
                          <i className="bi bi-telephone" />
                        </button>
                        {k.durum !== 'tamamlandi' && (
                          <button className={`${p}-odm-icon-btn ${p}-odm-icon-btn-success`} style={{ width: 44, height: 44 }} onClick={(e) => tamamlaKayit(k.id, e)}>
                            <i className="bi bi-check-circle" />
                          </button>
                        )}
                        <button className={`${p}-odm-icon-btn`} style={{ width: 44, height: 44 }} onClick={(e) => duzenlemeBasla(k, e)}>
                          <i className="bi bi-pencil" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            Context Menu (Fixed Position — tablo dışında)
            ═══════════════════════════════════════════════════════════ */}
        {menuAcikId && (() => {
          const kayit = liste.find(k => k.id === menuAcikId)
          if (!kayit) return null
          return (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setMenuAcikId(null)} />
              <div
                className={`${p}-odm-context-menu`}
                style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, transform: 'translate(-100%, -100%)', zIndex: 1000 }}
              >
                <button className={`${p}-odm-menu-item`} onClick={(e) => { setMenuAcikId(null); duzenlemeBasla(kayit, e) }}>
                  <i className="bi bi-pencil" />Düzenle
                </button>
                <button className={`${p}-odm-menu-item ${p}-odm-menu-danger`} onClick={(e) => { setMenuAcikId(null); kayitSil(kayit.id, e) }}>
                  <i className="bi bi-trash" />Sil
                </button>
              </div>
            </>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════
            BÖLÜM 5 — Sağ Drawer (Detay Paneli)
            ═══════════════════════════════════════════════════════════ */}
        {secilenKayit && (
          <>
            <div className={`${p}-odm-drawer-overlay`} onClick={() => setSecilenKayitId(null)} />
            <div ref={drawerRef} className={`${p}-odm-drawer`}>
              {/* Drawer Header */}
              <div className={`${p}-odm-drawer-header`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`${p}-odm-drawer-avatar`}>
                    <i className="bi bi-person-fill" />
                  </div>
                  <div>
                    <div className={`${p}-odm-drawer-firma`}>
                      {secilenKayit.firma_adi}
                    </div>
                    <div className={`${p}-odm-drawer-cari`}>{secilenKayit.cari_adi}</div>
                  </div>
                </div>
                <button className={`${p}-modal-close`} onClick={() => setSecilenKayitId(null)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div className={`${p}-odm-drawer-body`}>
                {/* Tutar Kutusu */}
                <div className={`${p}-odm-drawer-tutar-box`}>
                  <div className={`${p}-odm-drawer-tutar-label`}>
                    Bekleyen Tutar
                  </div>
                  <div className={`${p}-odm-drawer-tutar-value`}>
                    {TL(secilenKayit.tutar)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {(() => {
                      const vb = vadeBadge(secilenKayit.vade_tarihi, secilenKayit.durum, p)
                      const ad = ARAMA_DURUM_META[secilenKayit.arama_durumu] || ARAMA_DURUM_META.aranmadi
                      return (
                        <>
                          {vb && <span className={`${p}-odm-badge ${vb.cls}`}>{vb.text}</span>}
                          <span className={`${p}-odm-badge ${ad.cls}`}>
                            <i className={`bi ${ad.icon}`} style={{ fontSize: 11 }} />{ad.label}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Vade + Telefon */}
                <div className={`${p}-odm-drawer-info`}>
                  <i className={`bi bi-calendar3 ${p}-odm-drawer-info-ikon`} />
                  Vade: <strong className={`${p}-odm-drawer-info-strong`}>{tarihStr(secilenKayit.vade_tarihi)}</strong>
                </div>
                {secilenKayit.telefon && (
                  <div className={`${p}-odm-drawer-info`} style={{ marginBottom: 18 }}>
                    <i className={`bi bi-telephone ${p}-odm-drawer-info-ikon`} />
                    <a href={`tel:${secilenKayit.telefon}`} className={`${p}-odm-drawer-tel-link`}>
                      {secilenKayit.telefon}
                    </a>
                  </div>
                )}

                <button
                  className={`${p}-btn-save ${p}-btn-save-amber ${p}-odm-drawer-arama-btn`}
                  onClick={() => modalAc(secilenKayit)}
                >
                  <i className="bi bi-telephone-outbound" />
                  Arama Kaydı Ekle
                </button>

                {/* Arama Geçmişi */}
                <div className={`${p}-odm-section-header`}>
                  <div className={`${p}-odm-section-bar ${p}-odm-section-bar-info`} />
                  <span className={`${p}-odm-section-label ${p}-odm-section-label-info`}>Arama Geçmişi</span>
                </div>

                {(secilenKayit.arama_gecmisi || []).length === 0 ? (
                  <div className={`${p}-odm-empty-timeline`}>
                    <i className="bi bi-telephone-minus" style={{ fontSize: 22, display: 'block', marginBottom: 8 }} />
                    <div>Henüz arama yapılmadı</div>
                  </div>
                ) : (
                  <ul className={`${p}-odm-timeline`}>
                    {(secilenKayit.arama_gecmisi || []).map((a, i) => {
                      const meta = ARAMA_DURUM_META[a.sonuc] || ARAMA_DURUM_META.aranmadi
                      return (
                        <li key={i} className={`${p}-odm-tl-item`}>
                          <div className={`${p}-odm-tl-dot ${meta.cls}`}>
                            <i className={`bi ${meta.icon}`} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className={`${p}-odm-tl-sonuc ${meta.cls}`}>{meta.label}</span>
                              <span className={`${p}-odm-tl-tarih`}>{tarihStr(a.tarih)}</span>
                            </div>
                            {a.not && (
                              <div className={`${p}-odm-tl-not`}>
                                {a.not}
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 6 — "Aradım" Modalı
          ═══════════════════════════════════════════════════════════ */}
      {aramaModali && (
        <>
          <div className={`${p}-modal-overlay`} />
          <div className={`${p}-modal-center`}>
            <div className={`${p}-modal-box`} style={{ maxWidth: 500 }}>

              {/* Header */}
              <div className={`${p}-modal-header ${p}-mh-amber`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={`${p}-modal-icon ${p}-modal-icon-amber`}>
                    <i className="bi bi-telephone-outbound" />
                  </div>
                  <div>
                    <div className={`${p}-modal-title`}>Arama Kaydı</div>
                    <div className={`${p}-modal-sub`}>
                      {aramaModali.firma_adi} — {aramaModali.cari_adi}
                    </div>
                  </div>
                </div>
                <button className={`${p}-modal-close`} onClick={() => { setAramaModaliId(null); resetModal() }}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              {/* Gövde */}
              <div className={`${p}-modal-body`}>
                {/* Section: Arama Sonucu */}
                <div className={`${p}-odm-section-header`}>
                  <div className={`${p}-odm-section-bar ${p}-odm-section-bar-accent`} />
                  <span className={`${p}-odm-section-label ${p}-odm-section-label-accent`}>Arama Sonucu</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
                  {ARAMA_SECENEKLERI.map(s => (
                    <button key={s.id} className={`${p}-odm-radio-kart${aramaSonucu === s.id ? ` ${p}-odm-radio-selected` : ''}`} onClick={() => setAramaSonucu(s.id)}>
                      <span style={{ fontSize: 20 }}>{s.emoji}</span>
                      <span>{s.label}</span>
                      {aramaSonucu === s.id && <i className={`bi bi-check-circle-fill ms-auto ${p}-odm-radio-check`} />}
                    </button>
                  ))}
                </div>

                {aramaSonucu === 'ertelendi' && (
                  <div style={{ marginBottom: 20 }}>
                    <div className={`${p}-odm-section-header`}>
                      <div className={`${p}-odm-section-bar ${p}-odm-section-bar-info`} />
                      <span className={`${p}-odm-section-label ${p}-odm-section-label-info`}>Hatırlatıcı Tarihi</span>
                    </div>
                    <input type="date" className="form-control" value={hatirlaticiTarihi} onChange={e => setHatirlaticiTarihi(e.target.value)} min={bugunStr(1)} />
                  </div>
                )}

                {/* Section: Not */}
                <div className={`${p}-odm-section-header`}>
                  <div className={`${p}-odm-section-bar ${p}-odm-section-bar-info`} />
                  <span className={`${p}-odm-section-label ${p}-odm-section-label-info`}>
                    Not <span className={`${p}-odm-section-label-muted`}>(isteğe bağlı)</span>
                  </span>
                </div>
                <textarea
                  className="form-control"
                  style={{ minHeight: 80, resize: 'vertical' }}
                  placeholder="Söylediği şeyi buraya yaz..."
                  value={aramaNotText}
                  onChange={e => setAramaNotText(e.target.value)}
                />
              </div>

              {/* Footer */}
              <div className={`${p}-modal-footer`}>
                <button className={`${p}-btn-cancel`} onClick={() => { setAramaModaliId(null); resetModal() }}>İptal</button>
                <button
                  className={`${p}-btn-save ${p}-btn-save-amber`}
                  disabled={!aramaSonucu}
                  onClick={aramaKaydet}
                  style={{ opacity: !aramaSonucu ? 0.5 : 1 }}
                >
                  <i className="bi bi-check-lg" />
                  Kaydet
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 7 — Yeni Kayıt Ekle Modalı
          ═══════════════════════════════════════════════════════════ */}
      {showYeniModal && (
        <>
          <div className={`${p}-modal-overlay`} />
          <div className={`${p}-modal-center`}>
            <div className={`${p}-modal-box`} style={{ maxWidth: 520 }}>

              {/* Header */}
              <div className={`${p}-modal-header ${p}-mh-green`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={`${p}-modal-icon ${p}-modal-icon-green`}>
                    <i className={duzenlemeId ? 'bi bi-pencil-fill' : 'bi bi-plus-circle-fill'} />
                  </div>
                  <div>
                    <div className={`${p}-modal-title`}>{duzenlemeId ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}</div>
                    <div className={`${p}-modal-sub`}>Tahsilat veya ödeme takibi</div>
                  </div>
                </div>
                <button
                  onClick={() => { setShowYeniModal(false); setYeniForm(BOSH_YENI_FORM); setYeniFormHata(''); setDuzenlemeId(null) }}
                  className={`${p}-modal-close`}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              {/* Form Gövde */}
              <div className={`${p}-modal-body`}>

                {/* Hata mesajı */}
                {yeniFormHata && (
                  <div className={`${p}-odm-form-hata`}>
                    <i className="bi bi-exclamation-circle" />
                    {yeniFormHata}
                  </div>
                )}

                {/* Bölüm 1: Firma Bilgileri */}
                <div className={`${p}-odm-section-header`}>
                  <div className={`${p}-odm-section-bar ${p}-odm-section-bar-success`} />
                  <span className={`${p}-odm-section-label ${p}-odm-section-label-success`}>Firma Bilgileri</span>
                </div>

                {/* Cari Hesabına Bağla */}
                {!yeniForm.cari_sabit && (
                  <div style={{ marginBottom: 14 }}>
                    <label className={`${p}-odm-form-label`}>Cari Hesabına Bağla (Opsiyonel)</label>
                    <select
                      className="form-select"
                      value={yeniForm.cari_id ?? ''}
                      onChange={e => {
                        const id = e.target.value ? parseInt(e.target.value) : null
                        const cari = cariListesi.find(c => c.id === id)
                        setYeniForm(prev => ({
                          ...prev,
                          cari_id: id,
                          firma_adi: cari ? cari.cari_adi : prev.firma_adi,
                        }))
                      }}
                    >
                      <option value="">— Cari seçin (opsiyonel) —</option>
                      {cariListesi.map(c => (
                        <option key={c.id} value={c.id}>{c.cari_adi}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label className={`${p}-odm-form-label`}>
                    Firma Adı <span className={`${p}-odm-required`}>*</span>
                    {yeniForm.cari_sabit && <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.65 }}>(Cari kaydından)</span>}
                  </label>
                  <input
                    className="form-control"
                    value={yeniForm.firma_adi}
                    onChange={e => setYeniForm(prev => ({ ...prev, firma_adi: e.target.value }))}
                    placeholder="Firma veya kişi adı..."
                    readOnly={!!yeniForm.cari_sabit}
                    style={yeniForm.cari_sabit ? { opacity: 0.75, cursor: 'default' } : undefined}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className={`${p}-odm-form-label`}>İlgili Kişi</label>
                    <input
                      className="form-control"
                      value={yeniForm.ilgili_kisi}
                      onChange={e => setYeniForm(prev => ({ ...prev, ilgili_kisi: e.target.value }))}
                      placeholder="Ad Soyad..."
                    />
                  </div>
                  <div>
                    <label className={`${p}-odm-form-label`}>Telefon</label>
                    <input
                      className="form-control"
                      value={yeniForm.telefon}
                      onChange={e => setYeniForm(prev => ({ ...prev, telefon: e.target.value }))}
                      placeholder="05xx xxx xx xx"
                    />
                  </div>
                </div>

                {/* Bölüm 2: İşlem Detayları */}
                <div className={`${p}-odm-section-header`} style={{ marginTop: 6 }}>
                  <div className={`${p}-odm-section-bar ${p}-odm-section-bar-info`} />
                  <span className={`${p}-odm-section-label ${p}-odm-section-label-info`}>İşlem Detayları</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className={`${p}-odm-form-label`}>
                      Yön <span className={`${p}-odm-required`}>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={yeniForm.yon}
                      onChange={e => setYeniForm(prev => ({ ...prev, yon: e.target.value }))}
                    >
                      <option value="tahsilat">Tahsilat (Alacak)</option>
                      <option value="odeme">Ödeme (Borç)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`${p}-odm-form-label`}>Tutar (₺)</label>
                    <input
                      className="form-control"
                      value={yeniForm.tutar}
                      onChange={e => {
                        // Nokta sadece binlik ayraç — girişten çıkar, yeniden ekle
                        let v = e.target.value.replace(/[^0-9,]/g, '')
                        const parts = v.split(',')
                        if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')
                        const [tam, kesir] = v.split(',')
                        const fmt = (tam || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                        setYeniForm(prev => ({ ...prev, tutar: kesir !== undefined ? fmt + ',' + kesir.slice(0, 2) : fmt }))
                      }}
                      placeholder="0"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className={`${p}-odm-form-label`}>
                      Vade Tarihi <span className={`${p}-odm-required`}>*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={yeniForm.soz_tarihi}
                      onChange={e => setYeniForm(prev => ({ ...prev, soz_tarihi: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={`${p}-odm-form-label`}>Öncelik</label>
                    <select
                      className="form-select"
                      value={yeniForm.oncelik}
                      onChange={e => setYeniForm(prev => ({ ...prev, oncelik: e.target.value }))}
                    >
                      <option value="dusuk">Düşük</option>
                      <option value="normal">Normal</option>
                      <option value="yuksek">Yüksek</option>
                      <option value="kritik">Kritik</option>
                    </select>
                  </div>
                </div>

                {/* Önizleme */}
                {(yeniForm.firma_adi || yeniForm.tutar) && (
                  <div className={`${p}-odm-preview-box`}>
                    <div className={`${p}-odm-preview-label`}>Kayıt Önizleme</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className={`${p}-odm-preview-firma`}>{yeniForm.firma_adi || '—'}</div>
                        <div className={`${p}-odm-preview-detay`}>
                          {yeniForm.yon === 'tahsilat' ? 'Tahsilat' : 'Ödeme'} · Vade: {yeniForm.soz_tarihi || '—'}
                        </div>
                      </div>
                      {yeniForm.tutar && (
                        <div className={`${p}-odm-preview-tutar ${yeniForm.yon === 'tahsilat' ? `${p}-odm-preview-tutar-success` : `${p}-odm-preview-tutar-danger`}`}>
                          ₺{yeniForm.tutar}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`${p}-modal-footer`}>
                <button
                  onClick={() => { setShowYeniModal(false); setYeniForm(BOSH_YENI_FORM); setYeniFormHata(''); setDuzenlemeId(null) }}
                  className={`${p}-btn-cancel`}
                  style={{ flex: 1 }}
                >
                  İptal
                </button>
                <button
                  onClick={duzenlemeId ? duzenlemeKaydet : yeniEkleKaydet}
                  disabled={yeniKaydetYukleniyor || !yeniForm.firma_adi.trim()}
                  className={`${p}-btn-save ${p}-btn-save-green`}
                  style={{ flex: 2, opacity: (yeniKaydetYukleniyor || !yeniForm.firma_adi.trim()) ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {yeniKaydetYukleniyor
                    ? <><div className={`${p}-odm-spinner`} style={{ width: 16, height: 16, borderWidth: 2 }} />Kaydediliyor...</>
                    : duzenlemeId
                      ? <><i className="bi bi-check-lg" />Güncelle</>
                      : <><i className="bi bi-check-lg" />Kaydet</>
                  }
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          BÖLÜM 8 — Silme Onay Modalı
          ═══════════════════════════════════════════════════════════ */}
      {silOnayId && (() => {
        const silinecek = liste.find(k => k.id === silOnayId)
        return (
          <>
            <div className={`${p}-modal-overlay`} onClick={() => !silYukleniyor && setSilOnayId(null)} />
            <div className={`${p}-modal-center`}>
              <div className={`${p}-modal-box`} style={{ maxWidth: 420 }}>
                <div className={`${p}-modal-header ${p}-mh-red`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`${p}-modal-icon ${p}-modal-icon-red`}>
                      <i className="bi bi-trash3-fill" />
                    </div>
                    <div>
                      <div className={`${p}-modal-title`}>Kaydı Sil</div>
                      <div className={`${p}-modal-sub`}>Bu işlem geri alınamaz</div>
                    </div>
                  </div>
                  <button className={`${p}-modal-close`} onClick={() => !silYukleniyor && setSilOnayId(null)}>
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
                <div className={`${p}-modal-body`} style={{ textAlign: 'center', padding: '28px 24px' }}>
                  {silinecek && (
                    <div className={`${p}-odm-preview-box`} style={{ marginBottom: 0 }}>
                      <div className={`${p}-odm-preview-firma`} style={{ fontSize: 15 }}>{silinecek.firma_adi}</div>
                      <div className={`${p}-odm-preview-detay`}>
                        {silinecek.yon === 'tahsilat' ? 'Tahsilat' : 'Ödeme'} · {TL(silinecek.tutar)} · Vade: {tarihStr(silinecek.vade_tarihi)}
                      </div>
                    </div>
                  )}
                </div>
                <div className={`${p}-modal-footer`}>
                  <button
                    className={`${p}-btn-cancel`}
                    style={{ flex: 1 }}
                    onClick={() => setSilOnayId(null)}
                    disabled={silYukleniyor}
                  >
                    Vazgeç
                  </button>
                  <button
                    className={`${p}-btn-save ${p}-btn-save-red`}
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: silYukleniyor ? 0.6 : 1 }}
                    onClick={silOnaylaVeSil}
                    disabled={silYukleniyor}
                  >
                    {silYukleniyor
                      ? <><div className={`${p}-odm-spinner`} style={{ width: 16, height: 16, borderWidth: 2 }} />Siliniyor...</>
                      : <><i className="bi bi-trash3" />Evet, Sil</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
