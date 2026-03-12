/**
 * VarlikKasa.jsx — Varlık & Kasa Modülü
 * Havuz sistemi, SMM, Yatırım portföyü, Ortak Carisi
 * Açık tema · Premium CSS · Bootstrap 5
 */

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
const TL = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)
const tarihFmt = (s) => s ? new Date(s).toLocaleDateString('tr-TR') : '—'
const bugun = () => new Date().toISOString().slice(0, 10)

// ─── Modal (CariYonetimi ile aynı pattern) ────────────────────────────────────
function Modal({ open, onClose, children, size = '', scrollable = false, staticBackdrop = false }) {
  useEffect(() => { if (!open) return; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [open])
  useEffect(() => { if (!open) return; const h = (e) => { if (e.key === 'Escape' && !staticBackdrop) onClose() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [open, onClose, staticBackdrop])
  if (!open) return null
  const maxW = size === 'xl' ? 1100 : size === 'lg' ? 780 : size === 'sm' ? 400 : 520
  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', zIndex: 1040, animation: 'fadeIn 0.15s ease' }} onClick={staticBackdrop ? undefined : onClose} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'slideUp 0.2s ease' }}
        onClick={staticBackdrop ? undefined : (e) => { if (e.target === e.currentTarget) onClose() }}>
        <div style={{ width: '100%', maxWidth: maxW, maxHeight: scrollable ? '88vh' : 'auto', display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.28)', background: '#fff' }}>
          {children}
        </div>
      </div>
    </>, document.body)
}
function MHeader({ icon, baslik, altBaslik, onKapat, headerBg }) {
  return (
    <div style={{ background: headerBg || 'linear-gradient(135deg,var(--brand-dark),#1a5b80)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className={`bi ${icon}`} style={{ color: '#fff', fontSize: 20 }} />
        <div><div style={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>{baslik}</div>
          {altBaslik && <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 500 }}>{altBaslik}</div>}</div>
      </div>
      <button onClick={onKapat} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
      </button>
    </div>)
}
function MFooter({ onIptal, yukleniyor, kaydetLabel, kaydetStyle = {} }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
      <button type="button" onClick={onIptal} style={cancelBtnS}>İptal</button>
      <button type="submit" disabled={yukleniyor} style={{ ...saveBtnS, ...kaydetStyle }}>
        {yukleniyor ? <><i className="bi bi-arrow-repeat me-2" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />Kaydediliyor...</>
          : <><i className="bi bi-check-lg me-2" />{kaydetLabel}</>}
      </button>
    </div>)
}

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const BASLANGIC_KASA  = 45000
const BASLANGIC_BANKA = 285000
const CARI_ALACAK_MOCK = 126000.75  // CariYonetimi'den gelecek
const CARI_BORC_MOCK   = 65250.50

const GIRIS_KATEGORILERI = ['Günlük Hasılat', 'Tahsilat (Müşteri)', 'Banka Virman Giriş', 'Ortaktan Giriş', 'Diğer Giriş']
const CIKIS_KATEGORILERI = ['Tedarikçi Ödeme', 'Personel Maaş', 'Kira Gideri', 'Fatura / Aidat', 'Vergi / SGK', 'Ortağa Çıkış', 'Diğer Gider']
const HAVUZLAR = [
  { key: 'merkez_kasa',    label: 'Merkez Kasa',        icon: 'bi-safe',        renk: '#059669' },
  { key: 'banka_pos',      label: 'Banka / POS',        icon: 'bi-bank',        renk: 'var(--brand-dark)' },
  { key: 'gunluk_cekmece', label: 'Günlük Çekmece',     icon: 'bi-cash',        renk: '#d97706' },
  { key: 'mail_order',     label: 'Mail Order',         icon: 'bi-credit-card', renk: '#7c3aed' },
]

// ─── Mock Veriler ─────────────────────────────────────────────────────────────
const MOCK_ISLEMLER = [
  { id: 1, tarih: '2026-03-01', tur: 'giris', kategori: 'Günlük Hasılat',     aciklama: 'Perakende satış',        tutar: 12500,  havuz: 'merkez_kasa',    otomatik: false },
  { id: 2, tarih: '2026-03-01', tur: 'cikis', kategori: 'Personel Maaş',       aciklama: 'Mart ayı maaşlar',       tutar: 42000,  havuz: 'banka_pos',      otomatik: false },
  { id: 3, tarih: '2026-03-02', tur: 'giris', kategori: 'Tahsilat (Müşteri)',  aciklama: 'Akman İnşaat — fatura',  tutar: 28000,  havuz: 'banka_pos',      otomatik: false },
  { id: 4, tarih: '2026-03-03', tur: 'cikis', kategori: 'Tedarikçi Ödeme',    aciklama: 'Demir Elektrik — malzeme',tutar: 8500,   havuz: 'merkez_kasa',    otomatik: false },
  { id: 5, tarih: '2026-03-04', tur: 'cikis', kategori: 'Fatura / Aidat',     aciklama: 'Elektrik faturası',       tutar: 3200,   havuz: 'gunluk_cekmece', otomatik: false },
  { id: 6, tarih: '2026-03-04', tur: 'giris', kategori: 'Günlük Hasılat',     aciklama: '[OTO] Çekmece hasılat',   tutar: 3200,   havuz: 'gunluk_cekmece', otomatik: true  },
  { id: 7, tarih: '2026-03-05', tur: 'giris', kategori: 'Günlük Hasılat',     aciklama: 'Perakende satış',        tutar: 9800,   havuz: 'merkez_kasa',    otomatik: false },
  { id: 8, tarih: '2026-03-06', tur: 'cikis', kategori: 'Tedarikçi Ödeme',    aciklama: 'MetalTek — mail order',   tutar: 15000,  havuz: 'mail_order',     otomatik: false },
  { id: 9, tarih: '2026-03-06', tur: 'giris', kategori: 'Tahsilat (Müşteri)', aciklama: '[OTO] Mail order tahsilat',tutar: 15000,  havuz: 'mail_order',     otomatik: true  },
  { id: 10,tarih: '2026-03-07', tur: 'cikis', kategori: 'Kira Gideri',        aciklama: 'Mağaza kirası',          tutar: 18000,  havuz: 'banka_pos',      otomatik: false },
  { id: 11,tarih: '2026-03-08', tur: 'giris', kategori: 'Günlük Hasılat',     aciklama: 'Perakende satış',        tutar: 14200,  havuz: 'merkez_kasa',    otomatik: false },
  { id: 12,tarih: '2026-03-09', tur: 'cikis', kategori: 'Vergi / SGK',        aciklama: 'SGK prim ödemesi',       tutar: 22000,  havuz: 'banka_pos',      otomatik: false },
]

const MOCK_YATIRIMLAR = [
  { id: 1, varlikAdi: 'Altın (Gram)',  sembol: 'XAU',  miktar: 150,   birimMaliyet: 2850,    canliKur: 3050,    birim: 'gram' },
  { id: 2, varlikAdi: 'Amerikan Doları', sembol: 'USD', miktar: 5000,  birimMaliyet: 32.50,   canliKur: 34.20,   birim: 'adet' },
  { id: 3, varlikAdi: 'Euro',          sembol: 'EUR',  miktar: 3000,  birimMaliyet: 35.10,   canliKur: 37.80,   birim: 'adet' },
  { id: 4, varlikAdi: 'Bitcoin',       sembol: 'BTC',  miktar: 0.5,   birimMaliyet: 1850000, canliKur: 2100000,  birim: 'adet' },
]

const MOCK_AY_KAPANISLARI = [
  { id: 1, ay: '2026-01', devredenStok: 720000, kesilenFatura: 185000, gelenFatura: 95000,  karMarji: 25, smm: 148000,    yeniStok: 667000   },
  { id: 2, ay: '2026-02', devredenStok: 667000, kesilenFatura: 210000, gelenFatura: 120000, karMarji: 25, smm: 168000,    yeniStok: 619000   },
]

const MOCK_ORTAK_ISLEMLERI = [
  { id: 1, tarih: '2026-01-15', aciklama: 'Sermaye artırımı',    tutar: 100000, tur: 'giris' },
  { id: 2, tarih: '2026-02-01', aciklama: 'Kâr dağıtımı',       tutar: 25000,  tur: 'cikis' },
  { id: 3, tarih: '2026-03-05', aciklama: 'Ortaktan nakit giriş', tutar: 50000, tur: 'giris' },
]

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function VarlikKasa() {
  const [sekme, setSekme] = useState('dashboard')
  const [islemler, setIslemler]           = useState(MOCK_ISLEMLER)
  const [yatirimlar, setYatirimlar]       = useState(MOCK_YATIRIMLAR)
  const [ayKapanislari, setAyKapanislari] = useState(MOCK_AY_KAPANISLARI)
  const [ortakIslemleri, setOrtakIslemleri] = useState(MOCK_ORTAK_ISLEMLERI)

  // ─── Havuz Hesaplamaları ──────────────────────────────────────────────
  const hesaplar = useMemo(() => {
    const havuzToplam = (havuz) => islemler
      .filter(i => i.havuz === havuz)
      .reduce((s, i) => s + (i.tur === 'giris' ? i.tutar : -i.tutar), 0)

    const fizikiKasa = BASLANGIC_KASA + havuzToplam('merkez_kasa')
    const bankaNakdi = BASLANGIC_BANKA + havuzToplam('banka_pos')
    // Günlük çekmece ve mail order net etki = 0 (çift kayıt)

    const yatMaliyet = yatirimlar.reduce((s, y) => s + y.miktar * y.birimMaliyet, 0)
    const yatCanli   = yatirimlar.reduce((s, y) => s + y.miktar * y.canliKur, 0)
    const yatKarZarar = yatCanli - yatMaliyet

    const sonAy     = ayKapanislari[ayKapanislari.length - 1]
    const stokDeger = sonAy?.yeniStok ?? 0

    const netVarlik   = stokDeger + fizikiKasa + bankaNakdi + yatCanli + CARI_ALACAK_MOCK - CARI_BORC_MOCK
    const acilLikidite = fizikiKasa + bankaNakdi + yatCanli

    const toplamGiris = islemler.filter(i => i.tur === 'giris' && !i.otomatik).reduce((s, i) => s + i.tutar, 0)
    const toplamCikis = islemler.filter(i => i.tur === 'cikis' && !i.otomatik).reduce((s, i) => s + i.tutar, 0)

    const ortakBakiye = ortakIslemleri.reduce((s, i) => s + (i.tur === 'giris' ? i.tutar : -i.tutar), 0)

    return { fizikiKasa, bankaNakdi, yatMaliyet, yatCanli, yatKarZarar, stokDeger, netVarlik, acilLikidite, toplamGiris, toplamCikis, ortakBakiye }
  }, [islemler, yatirimlar, ayKapanislari, ortakIslemleri])

  // ─── Nakit İşlem Modalı ──────────────────────────────────────────────
  const [islemModalAcik, setIslemModalAcik] = useState(false)
  const bosIslem = { tarih: bugun(), tur: 'giris', havuz: 'merkez_kasa', kategori: 'Günlük Hasılat', tutar: '', aciklama: '' }
  const [islemForm, setIslemForm] = useState(bosIslem)

  const islemKaydet = (e) => {
    e.preventDefault()
    const tutar = parseFloat(islemForm.tutar)
    if (!tutar || tutar <= 0) { toast.error('Geçerli bir tutar girin.'); return }
    if (!islemForm.aciklama.trim()) { toast.error('Açıklama zorunludur.'); return }

    const yeniId = Date.now()
    const yeniIslemler = [{ ...islemForm, id: yeniId, tutar, otomatik: false }]

    // Günlük Çekmece — Çift Kayıt (gider ise)
    if (islemForm.havuz === 'gunluk_cekmece' && islemForm.tur === 'cikis') {
      yeniIslemler.push({
        id: yeniId + 1, tarih: islemForm.tarih, tur: 'giris',
        kategori: 'Günlük Hasılat', aciklama: `[OTO] Çekmece hasılat — ${islemForm.aciklama}`,
        tutar, havuz: 'gunluk_cekmece', otomatik: true,
      })
    }

    // Mail Order — Bakiye Nötrleme (gider ise)
    if (islemForm.havuz === 'mail_order' && islemForm.tur === 'cikis') {
      yeniIslemler.push({
        id: yeniId + 1, tarih: islemForm.tarih, tur: 'giris',
        kategori: 'Tahsilat (Müşteri)', aciklama: `[OTO] Mail order tahsilat — ${islemForm.aciklama}`,
        tutar, havuz: 'mail_order', otomatik: true,
      })
    }

    setIslemler(p => [...yeniIslemler, ...p])
    toast.success(islemForm.tur === 'giris' ? `${TL(tutar)} giriş kaydedildi.` : `${TL(tutar)} çıkış kaydedildi.`)
    if (islemForm.havuz === 'gunluk_cekmece' && islemForm.tur === 'cikis') toast.info('Çift kayıt oluşturuldu (Çekmece).')
    if (islemForm.havuz === 'mail_order' && islemForm.tur === 'cikis') toast.info('Bakiye nötrleme kaydı oluşturuldu (Mail Order).')
    setIslemModalAcik(false)
  }

  // ─── Ay Kapanışı Modalı ──────────────────────────────────────────────
  const [ayModalAcik, setAyModalAcik] = useState(false)
  const sonKapanisStok = ayKapanislari[ayKapanislari.length - 1]?.yeniStok ?? 0
  const [ayForm, setAyForm] = useState({ ay: '2026-03', devredenStok: sonKapanisStok, kesilenFatura: '', gelenFatura: '', karMarji: 25 })

  const hesaplananSMM = ayForm.kesilenFatura ? (parseFloat(ayForm.kesilenFatura) / (1 + (ayForm.karMarji / 100))) : 0
  const hesaplananYeniStok = (parseFloat(ayForm.devredenStok) || 0) + (parseFloat(ayForm.gelenFatura) || 0) - hesaplananSMM

  const ayKaydet = (e) => {
    e.preventDefault()
    if (!ayForm.kesilenFatura || !ayForm.gelenFatura) { toast.error('Fatura alanları zorunludur.'); return }
    setAyKapanislari(p => [...p, {
      id: Date.now(), ay: ayForm.ay,
      devredenStok: parseFloat(ayForm.devredenStok) || 0,
      kesilenFatura: parseFloat(ayForm.kesilenFatura),
      gelenFatura: parseFloat(ayForm.gelenFatura),
      karMarji: ayForm.karMarji, smm: Math.round(hesaplananSMM), yeniStok: Math.round(hesaplananYeniStok),
    }])
    toast.success(`${ayForm.ay} ay kapanışı kaydedildi.`)
    setAyModalAcik(false)
  }

  // ─── Yatırım Modalı ──────────────────────────────────────────────────
  const [yatModalAcik, setYatModalAcik] = useState(false)
  const [yatForm, setYatForm] = useState({ varlikAdi: '', sembol: '', miktar: '', birimMaliyet: '', canliKur: '', birim: 'adet' })
  const yatKaydet = (e) => {
    e.preventDefault()
    if (!yatForm.varlikAdi || !yatForm.miktar || !yatForm.birimMaliyet || !yatForm.canliKur) { toast.error('Tüm alanlar zorunludur.'); return }
    setYatirimlar(p => [...p, { ...yatForm, id: Date.now(), miktar: parseFloat(yatForm.miktar), birimMaliyet: parseFloat(yatForm.birimMaliyet), canliKur: parseFloat(yatForm.canliKur) }])
    toast.success('Yatırım eklendi.')
    setYatModalAcik(false)
  }

  // ─── Ortak İşlem Modalı ───────────────────────────────────────────────
  const [ortakModalAcik, setOrtakModalAcik] = useState(false)
  const [ortakForm, setOrtakForm] = useState({ tarih: bugun(), tur: 'giris', tutar: '', aciklama: '' })
  const ortakKaydet = (e) => {
    e.preventDefault()
    const tutar = parseFloat(ortakForm.tutar)
    if (!tutar || tutar <= 0) { toast.error('Geçerli bir tutar girin.'); return }
    setOrtakIslemleri(p => [...p, { ...ortakForm, id: Date.now(), tutar }])
    toast.success('Ortak işlemi kaydedildi.')
    setOrtakModalAcik(false)
  }

  // ─── Sekmeler ─────────────────────────────────────────────────────────
  const sekmeler = [
    { key: 'dashboard', label: 'Genel Bakış',   icon: 'bi-speedometer2' },
    { key: 'nakit',     label: 'Nakit Akışı',    icon: 'bi-cash-stack' },
    { key: 'bilanco',   label: 'Bilanço',        icon: 'bi-journal-bookmark' },
    { key: 'yatirim',   label: 'Yatırım Kalesi', icon: 'bi-graph-up-arrow' },
    { key: 'ortak',     label: 'Ortak Carisi',   icon: 'bi-people' },
  ]

  return (
    <>
      {/* Başlık */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 2 }}>
            Varlık & Kasa Yönetimi
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>Havuz sistemi · SMM · Portföy takibi</p>
        </div>
      </div>

      {/* Sekme Navigasyonu */}
      <div className="premium-card mb-4" style={{ padding: 0 }}>
        <div style={{ display: 'flex', gap: 2, padding: '4px', overflowX: 'auto' }}>
          {sekmeler.map(s => {
            const a = sekme === s.key
            return (
              <button key={s.key} onClick={() => setSekme(s.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                fontWeight: a ? 700 : 600, borderRadius: 12,
                background: a ? 'var(--brand-dark)' : 'transparent',
                color: a ? '#fff' : '#64748b', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
                <i className={`bi ${s.icon}`} style={{ fontSize: 14 }} />{s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ TAB 1: GENEL BAKIŞ ═══ */}
      {sekme === 'dashboard' && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6 col-xl-3">
              <StatKart etiket="Net Varlık" deger={TL(hesaplar.netVarlik)} renk="#0f172a" icon="bi-gem" tint="rgba(15,23,42,0.04)" borderTint="rgba(15,23,42,0.12)"
                alt="Stok + Kasa + Banka + Yatırım + Alacak - Borç" />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <StatKart etiket="Acil Likidite" deger={TL(hesaplar.acilLikidite)} renk="#059669" icon="bi-lightning-charge-fill" tint="rgba(5,150,105,0.05)" borderTint="rgba(5,150,105,0.2)"
                alt="Kasa + Banka + Yatırım canlı" />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <StatKart etiket="Merkez Kasa" deger={TL(hesaplar.fizikiKasa)} renk="var(--brand-dark)" icon="bi-safe-fill" tint="rgba(18,63,89,0.05)" borderTint="rgba(18,63,89,0.2)"
                alt="Fiziki nakit bakiye" />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <StatKart etiket="Banka Nakit" deger={TL(hesaplar.bankaNakdi)} renk="#7c3aed" icon="bi-bank2" tint="rgba(124,58,237,0.05)" borderTint="rgba(124,58,237,0.2)"
                alt={`Devreden: ${TL(BASLANGIC_BANKA)}`} />
            </div>
          </div>

          {/* Özet Bantları */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <div className="light-card tint-green d-flex align-items-center gap-3 p-3">
                <div style={ikonKutu('#059669', 'rgba(16,185,129,0.12)')}><i className="bi bi-arrow-down-circle-fill" style={{ color: '#059669', fontSize: 17 }} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Toplam Giriş (Bu Ay)</div>
                  <div className="financial-num" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>{TL(hesaplar.toplamGiris)}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="light-card tint-rose d-flex align-items-center gap-3 p-3">
                <div style={ikonKutu('#e11d48', 'rgba(244,63,94,0.1)')}><i className="bi bi-arrow-up-circle-fill" style={{ color: '#e11d48', fontSize: 17 }} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#e11d48', textTransform: 'uppercase' }}>Toplam Çıkış (Bu Ay)</div>
                  <div className="financial-num" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#9f1239' }}>{TL(hesaplar.toplamCikis)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Yatırım Özet */}
          <div className="light-card p-3 mb-4 d-flex align-items-center gap-3" style={{ borderColor: hesaplar.yatKarZarar >= 0 ? 'rgba(5,150,105,0.2)' : 'rgba(244,63,94,0.2)' }}>
            <i className="bi bi-graph-up-arrow" style={{ fontSize: 22, color: hesaplar.yatKarZarar >= 0 ? '#059669' : '#e11d48' }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Yatırım Portföyü: </span>
              <span className="financial-num" style={{ fontSize: 15, fontWeight: 800, color: 'var(--brand-dark)' }}>{TL(hesaplar.yatCanli)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}> (maliyet: {TL(hesaplar.yatMaliyet)})</span>
            </div>
            <span className="financial-num" style={{ fontSize: 15, fontWeight: 800, color: hesaplar.yatKarZarar >= 0 ? '#059669' : '#e11d48' }}>
              {hesaplar.yatKarZarar >= 0 ? '+' : ''}{TL(hesaplar.yatKarZarar)}
            </span>
          </div>

          {/* Stok Değeri */}
          <div className="light-card tint-amber p-3 d-flex align-items-center gap-3">
            <div style={ikonKutu('#d97706', 'rgba(217,119,6,0.12)')}><i className="bi bi-box-seam-fill" style={{ color: '#d97706', fontSize: 17 }} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Tahmini Stok Değeri</div>
              <div className="financial-num" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#92400e' }}>{TL(hesaplar.stokDeger)}</div>
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Son kapanış: {ayKapanislari[ayKapanislari.length - 1]?.ay || '—'}</span>
          </div>
        </>
      )}

      {/* ═══ TAB 2: NAKİT AKIŞI ═══ */}
      {sekme === 'nakit' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>Nakit Hareketleri</h5>
            <button onClick={() => { setIslemForm({ ...bosIslem }); setIslemModalAcik(true) }} style={ekleBtn}><i className="bi bi-plus-lg" /> Yeni İşlem</button>
          </div>
          <div className="premium-card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  <th style={thS}>Tarih</th><th style={thS}>Tür</th><th style={thS}>Havuz</th>
                  <th style={thS}>Kategori</th><th style={thS}>Açıklama</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Tutar</th>
                </tr></thead>
                <tbody>
                  {[...islemler].sort((a, b) => b.tarih.localeCompare(a.tarih) || b.id - a.id).map((isl, idx) => {
                    const giris = isl.tur === 'giris'
                    const havuzObj = HAVUZLAR.find(h => h.key === isl.havuz)
                    const bg = idx % 2 === 0 ? '#fff' : '#fafbfc'
                    return (
                      <tr key={isl.id} style={{ background: bg, opacity: isl.otomatik ? 0.65 : 1 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'} onMouseLeave={e => e.currentTarget.style.background = bg}>
                        <td style={tdS}><span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{tarihFmt(isl.tarih)}</span></td>
                        <td style={tdS}>
                          <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: giris ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.07)',
                            color: giris ? '#059669' : '#e11d48',
                            border: `1px solid ${giris ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.2)'}` }}>
                            {giris ? 'Giriş' : 'Çıkış'}{isl.otomatik ? ' (OTO)' : ''}
                          </span>
                        </td>
                        <td style={tdS}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: havuzObj?.renk || '#64748b' }}>
                            <i className={`bi ${havuzObj?.icon || 'bi-circle'}`} style={{ fontSize: 11 }} />{havuzObj?.label || isl.havuz}
                          </span>
                        </td>
                        <td style={tdS}><span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{isl.kategori}</span></td>
                        <td style={tdS}><span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>{isl.aciklama}</span></td>
                        <td style={{ ...tdS, textAlign: 'right' }}>
                          <span className="financial-num" style={{ fontSize: 14, fontWeight: 800, color: giris ? '#059669' : '#e11d48' }}>
                            {giris ? '+' : '-'}{TL(isl.tutar)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══ TAB 3: BİLANÇO ═══ */}
      {sekme === 'bilanco' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>SMM & Ay Kapanışı</h5>
            <button onClick={() => { setAyForm({ ay: '2026-03', devredenStok: ayKapanislari[ayKapanislari.length - 1]?.yeniStok ?? 0, kesilenFatura: '', gelenFatura: '', karMarji: 25 }); setAyModalAcik(true) }} style={ekleBtn}>
              <i className="bi bi-calendar-check" /> Ay Kapanışı Yap
            </button>
          </div>

          {/* Formül Açıklama */}
          <div className="light-card tint-blue p-3 mb-3">
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8' }}>
              <i className="bi bi-info-circle me-1" />
              <strong>SMM</strong> = Kesilen Fatura / (1 + Kar Marjı%) &nbsp;|&nbsp;
              <strong>Yeni Stok</strong> = (Devreden + Gelen Fatura) − SMM
            </div>
          </div>

          <div className="premium-card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  <th style={thS}>Ay</th><th style={{ ...thS, textAlign: 'right' }}>Devreden Stok</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Kesilen Fatura</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Gelen Fatura</th>
                  <th style={thS}>Marj %</th>
                  <th style={{ ...thS, textAlign: 'right' }}>SMM</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Yeni Stok</th>
                </tr></thead>
                <tbody>
                  {ayKapanislari.map((ay, idx) => (
                    <tr key={ay.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={tdS}><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand-dark)' }}>{ay.ay}</span></td>
                      <td style={{ ...tdS, textAlign: 'right' }}><span className="financial-num" style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{TL(ay.devredenStok)}</span></td>
                      <td style={{ ...tdS, textAlign: 'right' }}><span className="financial-num" style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{TL(ay.kesilenFatura)}</span></td>
                      <td style={{ ...tdS, textAlign: 'right' }}><span className="financial-num" style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>{TL(ay.gelenFatura)}</span></td>
                      <td style={tdS}><span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>%{ay.karMarji}</span></td>
                      <td style={{ ...tdS, textAlign: 'right' }}><span className="financial-num" style={{ fontSize: 13, fontWeight: 800, color: '#e11d48' }}>{TL(ay.smm)}</span></td>
                      <td style={{ ...tdS, textAlign: 'right' }}><span className="financial-num" style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{TL(ay.yeniStok)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══ TAB 4: YATIRIM KALESİ ═══ */}
      {sekme === 'yatirim' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>Portföy</h5>
            <button onClick={() => { setYatForm({ varlikAdi: '', sembol: '', miktar: '', birimMaliyet: '', canliKur: '', birim: 'adet' }); setYatModalAcik(true) }} style={ekleBtn}>
              <i className="bi bi-plus-lg" /> Varlık Ekle
            </button>
          </div>

          {/* Portföy Özet */}
          <div className="row g-3 mb-4">
            <div className="col-4"><StatKart etiket="Maliyet Değeri" deger={TL(hesaplar.yatMaliyet)} renk="var(--brand-dark)" icon="bi-tag-fill" tint="rgba(18,63,89,0.05)" borderTint="rgba(18,63,89,0.2)" /></div>
            <div className="col-4"><StatKart etiket="Canlı Değer" deger={TL(hesaplar.yatCanli)} renk="#059669" icon="bi-broadcast-pin" tint="rgba(5,150,105,0.05)" borderTint="rgba(5,150,105,0.2)" /></div>
            <div className="col-4"><StatKart etiket="Kar / Zarar" deger={`${hesaplar.yatKarZarar >= 0 ? '+' : ''}${TL(hesaplar.yatKarZarar)}`} renk={hesaplar.yatKarZarar >= 0 ? '#059669' : '#e11d48'} icon={hesaplar.yatKarZarar >= 0 ? 'bi-trending-up' : 'bi-trending-down'} tint={hesaplar.yatKarZarar >= 0 ? 'rgba(5,150,105,0.05)' : 'rgba(244,63,94,0.05)'} borderTint={hesaplar.yatKarZarar >= 0 ? 'rgba(5,150,105,0.2)' : 'rgba(244,63,94,0.2)'} /></div>
          </div>

          <div className="premium-card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  <th style={thS}>Varlık</th><th style={thS}>Miktar</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Birim Maliyet</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Maliyet Değeri</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Canlı Kur</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Canlı Değer</th>
                  <th style={{ ...thS, textAlign: 'right' }}>K/Z</th>
                </tr></thead>
                <tbody>
                  {yatirimlar.map((y, idx) => {
                    const maliyet = y.miktar * y.birimMaliyet
                    const canli   = y.miktar * y.canliKur
                    const kz      = canli - maliyet
                    return (
                      <tr key={y.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={tdS}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{y.varlikAdi}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{y.sembol}</div>
                        </td>
                        <td style={tdS}><span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{y.miktar.toLocaleString('tr-TR')} {y.birim}</span></td>
                        <td style={{ ...tdS, textAlign: 'right' }}><span className="financial-num" style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{TL(y.birimMaliyet)}</span></td>
                        <td style={{ ...tdS, textAlign: 'right' }}><span className="financial-num" style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{TL(maliyet)}</span></td>
                        <td style={{ ...tdS, textAlign: 'right' }}><span className="financial-num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-dark)' }}>{TL(y.canliKur)}</span></td>
                        <td style={{ ...tdS, textAlign: 'right' }}><span className="financial-num" style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{TL(canli)}</span></td>
                        <td style={{ ...tdS, textAlign: 'right' }}>
                          <span className="financial-num" style={{ fontSize: 14, fontWeight: 800, color: kz >= 0 ? '#059669' : '#e11d48' }}>
                            {kz >= 0 ? '+' : ''}{TL(kz)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══ TAB 5: ORTAK CARİSİ ═══ */}
      {sekme === 'ortak' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>Ortak Cari Hesabı</h5>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0', fontWeight: 500 }}>
                Bakiye: <span className="financial-num" style={{ fontWeight: 800, color: hesaplar.ortakBakiye >= 0 ? '#059669' : '#e11d48' }}>{TL(hesaplar.ortakBakiye)}</span>
              </p>
            </div>
            <button onClick={() => { setOrtakForm({ tarih: bugun(), tur: 'giris', tutar: '', aciklama: '' }); setOrtakModalAcik(true) }} style={ekleBtn}>
              <i className="bi bi-plus-lg" /> Yeni İşlem
            </button>
          </div>
          <div className="premium-card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  <th style={thS}>Tarih</th><th style={thS}>Tür</th><th style={thS}>Açıklama</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Tutar</th><th style={{ ...thS, textAlign: 'right' }}>Bakiye</th>
                </tr></thead>
                <tbody>
                  {(() => {
                    let cumBakiye = 0
                    return [...ortakIslemleri].sort((a, b) => a.tarih.localeCompare(b.tarih) || a.id - b.id).map((isl, idx) => {
                      cumBakiye += isl.tur === 'giris' ? isl.tutar : -isl.tutar
                      const giris = isl.tur === 'giris'
                      return (
                        <tr key={isl.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                          <td style={tdS}><span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{tarihFmt(isl.tarih)}</span></td>
                          <td style={tdS}>
                            <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                              background: giris ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.07)',
                              color: giris ? '#059669' : '#e11d48' }}>
                              {giris ? 'Giriş' : 'Çıkış'}
                            </span>
                          </td>
                          <td style={tdS}><span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{isl.aciklama}</span></td>
                          <td style={{ ...tdS, textAlign: 'right' }}>
                            <span className="financial-num" style={{ fontSize: 14, fontWeight: 800, color: giris ? '#059669' : '#e11d48' }}>
                              {giris ? '+' : '-'}{TL(isl.tutar)}
                            </span>
                          </td>
                          <td style={{ ...tdS, textAlign: 'right' }}>
                            <span className="financial-num" style={{ fontSize: 14, fontWeight: 800, color: cumBakiye >= 0 ? '#059669' : '#e11d48' }}>{TL(cumBakiye)}</span>
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════
          MODAL: Nakit İşlem Ekle
      ════════════════════════════════════════════ */}
      <Modal open={islemModalAcik} onClose={() => setIslemModalAcik(false)} staticBackdrop scrollable>
        <MHeader icon="bi-cash-stack" baslik="Nakit İşlem Ekle" onKapat={() => setIslemModalAcik(false)} />
        <form onSubmit={islemKaydet} noValidate>
          <div style={{ padding: 24, overflowY: 'auto' }}>

            {/* Tür Seçici */}
            <div className="mb-3">
              <label style={lblS}>İşlem Türü</label>
              <div className="d-flex gap-2">
                {[
                  { val: 'giris', label: 'Giriş (Tahsilat)', icon: 'bi-arrow-down-circle-fill', color: '#059669', bg: 'rgba(16,185,129,0.07)' },
                  { val: 'cikis', label: 'Çıkış (Gider)',     icon: 'bi-arrow-up-circle-fill',   color: '#e11d48', bg: 'rgba(244,63,94,0.06)' },
                ].map(t => (
                  <label key={t.val} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${islemForm.tur === t.val ? t.color : '#e2e8f0'}`,
                    background: islemForm.tur === t.val ? t.bg : '#fff', transition: 'all 0.15s' }}>
                    <input type="radio" name="tur" value={t.val} checked={islemForm.tur === t.val}
                      onChange={e => setIslemForm(p => ({ ...p, tur: e.target.value, kategori: e.target.value === 'giris' ? GIRIS_KATEGORILERI[0] : CIKIS_KATEGORILERI[0] }))}
                      style={{ display: 'none' }} />
                    <i className={`bi ${t.icon}`} style={{ fontSize: 20, color: t.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: islemForm.tur === t.val ? t.color : '#64748b' }}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Havuz Seçici */}
            <div className="mb-3">
              <label style={lblS}>Havuz (Bağlantı Türü)</label>
              <div className="d-flex gap-2 flex-wrap">
                {HAVUZLAR.map(h => {
                  const sel = islemForm.havuz === h.key
                  return (
                    <label key={h.key} style={{ flex: '1 1 45%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${sel ? h.renk : '#e2e8f0'}`,
                      background: sel ? `${h.renk}08` : '#fff', transition: 'all 0.15s' }}>
                      <input type="radio" name="havuz" value={h.key} checked={sel}
                        onChange={e => setIslemForm(p => ({ ...p, havuz: e.target.value }))} style={{ display: 'none' }} />
                      <i className={`bi ${h.icon}`} style={{ fontSize: 15, color: sel ? h.renk : '#94a3b8' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: sel ? h.renk : '#64748b' }}>{h.label}</span>
                    </label>
                  )
                })}
              </div>
              {/* Havuz açıklamaları */}
              {islemForm.havuz === 'gunluk_cekmece' && islemForm.tur === 'cikis' && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(217,119,6,0.06)', borderRadius: 8, fontSize: 11, color: '#d97706', fontWeight: 600 }}>
                  <i className="bi bi-info-circle me-1" />Çift kayıt: Otomatik hasılat girişi + gider çıkışı oluşturulacak. Kasa bakiyesi değişmez.
                </div>
              )}
              {islemForm.havuz === 'mail_order' && islemForm.tur === 'cikis' && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(124,58,237,0.06)', borderRadius: 8, fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                  <i className="bi bi-info-circle me-1" />Bakiye nötrleme: Otomatik tahsilat girişi oluşturulacak.
                </div>
              )}
            </div>

            <div className="row g-3">
              <div className="col-6">
                <label style={lblS}>Tarih</label>
                <input type="date" value={islemForm.tarih} onChange={e => setIslemForm(p => ({ ...p, tarih: e.target.value }))} className="form-control form-control-custom" />
              </div>
              <div className="col-6">
                <label style={lblS}>Kategori</label>
                <select value={islemForm.kategori} onChange={e => setIslemForm(p => ({ ...p, kategori: e.target.value }))} style={selS}>
                  {(islemForm.tur === 'giris' ? GIRIS_KATEGORILERI : CIKIS_KATEGORILERI).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label style={lblS}>Tutar (₺) *</label>
                <input type="number" value={islemForm.tutar} onChange={e => setIslemForm(p => ({ ...p, tutar: e.target.value }))}
                  placeholder="0,00" min="0.01" step="0.01" className="form-control form-control-custom" required />
              </div>
              <div className="col-12">
                <label style={lblS}>Açıklama *</label>
                <input type="text" value={islemForm.aciklama} onChange={e => setIslemForm(p => ({ ...p, aciklama: e.target.value }))}
                  placeholder="İşlem açıklaması..." className="form-control form-control-custom" required />
              </div>
            </div>
          </div>
          <MFooter onIptal={() => setIslemModalAcik(false)} kaydetLabel="İşlemi Kaydet" />
        </form>
      </Modal>

      {/* ════════════════════════════════════════════
          MODAL: Ay Kapanışı
      ════════════════════════════════════════════ */}
      <Modal open={ayModalAcik} onClose={() => setAyModalAcik(false)} size="lg" staticBackdrop>
        <MHeader icon="bi-calendar-check" baslik="Ay Kapanışı — SMM Hesaplama" onKapat={() => setAyModalAcik(false)} />
        <form onSubmit={ayKaydet} noValidate>
          <div style={{ padding: 24 }}>
            <div className="row g-3">
              <div className="col-6">
                <label style={lblS}>Ay</label>
                <input type="month" value={ayForm.ay} onChange={e => setAyForm(p => ({ ...p, ay: e.target.value }))} className="form-control form-control-custom" />
              </div>
              <div className="col-6">
                <label style={lblS}>Kar Marjı (%)</label>
                <input type="number" value={ayForm.karMarji} onChange={e => setAyForm(p => ({ ...p, karMarji: parseFloat(e.target.value) || 0 }))}
                  min="0" max="100" className="form-control form-control-custom" />
              </div>
              <div className="col-4">
                <label style={lblS}>Devreden Stok (₺)</label>
                <input type="number" value={ayForm.devredenStok} onChange={e => setAyForm(p => ({ ...p, devredenStok: e.target.value }))}
                  className="form-control form-control-custom" />
              </div>
              <div className="col-4">
                <label style={lblS}>Kesilen Fatura (₺) *</label>
                <input type="number" value={ayForm.kesilenFatura} onChange={e => setAyForm(p => ({ ...p, kesilenFatura: e.target.value }))}
                  placeholder="Satış faturaları toplamı" className="form-control form-control-custom" required />
              </div>
              <div className="col-4">
                <label style={lblS}>Gelen Fatura (₺) *</label>
                <input type="number" value={ayForm.gelenFatura} onChange={e => setAyForm(p => ({ ...p, gelenFatura: e.target.value }))}
                  placeholder="Alış faturaları toplamı" className="form-control form-control-custom" required />
              </div>
            </div>

            {/* Canlı Hesaplama Bandı */}
            <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>Canlı Hesaplama</div>
              <div className="row g-3">
                <div className="col-6">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', marginBottom: 4 }}>SMM (Satılan Malın Maliyeti)</div>
                  <div className="financial-num" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e11d48' }}>{TL(hesaplananSMM)}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                    = {TL(parseFloat(ayForm.kesilenFatura) || 0)} / (1 + {ayForm.karMarji}%)
                  </div>
                </div>
                <div className="col-6">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: 4 }}>Yeni Stok Değeri</div>
                  <div className="financial-num" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46' }}>{TL(hesaplananYeniStok)}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                    = ({TL(parseFloat(ayForm.devredenStok) || 0)} + {TL(parseFloat(ayForm.gelenFatura) || 0)}) − SMM
                  </div>
                </div>
              </div>
            </div>
          </div>
          <MFooter onIptal={() => setAyModalAcik(false)} kaydetLabel="Ay Kapanışını Kaydet" />
        </form>
      </Modal>

      {/* ════════════════════════════════════════════
          MODAL: Yatırım Ekle
      ════════════════════════════════════════════ */}
      <Modal open={yatModalAcik} onClose={() => setYatModalAcik(false)} staticBackdrop>
        <MHeader icon="bi-graph-up-arrow" baslik="Yeni Yatırım Varlığı" headerBg="linear-gradient(135deg,#059669,#047857)" onKapat={() => setYatModalAcik(false)} />
        <form onSubmit={yatKaydet} noValidate>
          <div style={{ padding: 24 }}>
            <div className="row g-3">
              <div className="col-8">
                <label style={lblS}>Varlık Adı *</label>
                <input type="text" value={yatForm.varlikAdi} onChange={e => setYatForm(p => ({ ...p, varlikAdi: e.target.value }))}
                  placeholder="Altın (Gram)" className="form-control form-control-custom" required />
              </div>
              <div className="col-4">
                <label style={lblS}>Sembol</label>
                <input type="text" value={yatForm.sembol} onChange={e => setYatForm(p => ({ ...p, sembol: e.target.value }))}
                  placeholder="XAU" className="form-control form-control-custom" />
              </div>
              <div className="col-6">
                <label style={lblS}>Miktar *</label>
                <input type="number" value={yatForm.miktar} onChange={e => setYatForm(p => ({ ...p, miktar: e.target.value }))}
                  placeholder="0" min="0.001" step="any" className="form-control form-control-custom" required />
              </div>
              <div className="col-6">
                <label style={lblS}>Birim</label>
                <select value={yatForm.birim} onChange={e => setYatForm(p => ({ ...p, birim: e.target.value }))} style={selS}>
                  <option value="adet">Adet</option><option value="gram">Gram</option><option value="lot">Lot</option>
                </select>
              </div>
              <div className="col-6">
                <label style={lblS}>Birim Maliyet (₺) *</label>
                <input type="number" value={yatForm.birimMaliyet} onChange={e => setYatForm(p => ({ ...p, birimMaliyet: e.target.value }))}
                  placeholder="0,00" step="any" className="form-control form-control-custom" required />
              </div>
              <div className="col-6">
                <label style={lblS}>Canlı Kur (₺) *</label>
                <input type="number" value={yatForm.canliKur} onChange={e => setYatForm(p => ({ ...p, canliKur: e.target.value }))}
                  placeholder="0,00" step="any" className="form-control form-control-custom" required />
              </div>
            </div>
            {/* Canlı K/Z */}
            {yatForm.miktar && yatForm.birimMaliyet && yatForm.canliKur && (() => {
              const m = parseFloat(yatForm.miktar) * parseFloat(yatForm.birimMaliyet)
              const c = parseFloat(yatForm.miktar) * parseFloat(yatForm.canliKur)
              const kz = c - m
              return (
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Tahmini K/Z:</span>
                  <span className="financial-num" style={{ fontSize: 15, fontWeight: 800, color: kz >= 0 ? '#059669' : '#e11d48' }}>{kz >= 0 ? '+' : ''}{TL(kz)}</span>
                </div>
              )
            })()}
          </div>
          <MFooter onIptal={() => setYatModalAcik(false)} kaydetLabel="Varlık Ekle" kaydetStyle={{ background: 'linear-gradient(135deg,#059669,#047857)' }} />
        </form>
      </Modal>

      {/* ════════════════════════════════════════════
          MODAL: Ortak İşlem Ekle
      ════════════════════════════════════════════ */}
      <Modal open={ortakModalAcik} onClose={() => setOrtakModalAcik(false)} staticBackdrop>
        <MHeader icon="bi-people-fill" baslik="Ortak Cari İşlemi" onKapat={() => setOrtakModalAcik(false)} />
        <form onSubmit={ortakKaydet} noValidate>
          <div style={{ padding: 24 }}>
            <div className="mb-3">
              <label style={lblS}>İşlem Türü</label>
              <div className="d-flex gap-2">
                {[
                  { val: 'giris', label: 'Ortaktan Giriş', icon: 'bi-arrow-down-circle-fill', color: '#059669' },
                  { val: 'cikis', label: 'Ortağa Çıkış',   icon: 'bi-arrow-up-circle-fill',   color: '#e11d48' },
                ].map(t => (
                  <label key={t.val} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${ortakForm.tur === t.val ? t.color : '#e2e8f0'}`,
                    background: ortakForm.tur === t.val ? `${t.color}08` : '#fff' }}>
                    <input type="radio" name="ortakTur" value={t.val} checked={ortakForm.tur === t.val}
                      onChange={e => setOrtakForm(p => ({ ...p, tur: e.target.value }))} style={{ display: 'none' }} />
                    <i className={`bi ${t.icon}`} style={{ fontSize: 20, color: t.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: ortakForm.tur === t.val ? t.color : '#64748b' }}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="row g-3">
              <div className="col-6">
                <label style={lblS}>Tarih</label>
                <input type="date" value={ortakForm.tarih} onChange={e => setOrtakForm(p => ({ ...p, tarih: e.target.value }))} className="form-control form-control-custom" />
              </div>
              <div className="col-6">
                <label style={lblS}>Tutar (₺) *</label>
                <input type="number" value={ortakForm.tutar} onChange={e => setOrtakForm(p => ({ ...p, tutar: e.target.value }))}
                  placeholder="0,00" min="0.01" step="0.01" className="form-control form-control-custom" required />
              </div>
              <div className="col-12">
                <label style={lblS}>Açıklama *</label>
                <input type="text" value={ortakForm.aciklama} onChange={e => setOrtakForm(p => ({ ...p, aciklama: e.target.value }))}
                  placeholder="Sermaye artırımı, kâr dağıtımı..." className="form-control form-control-custom" required />
              </div>
            </div>
          </div>
          <MFooter onIptal={() => setOrtakModalAcik(false)} kaydetLabel="İşlemi Kaydet" />
        </form>
      </Modal>
    </>
  )
}

// ─── Alt Bileşenler ───────────────────────────────────────────────────────────
function StatKart({ etiket, deger, renk, icon, tint, borderTint, alt }) {
  return (
    <div className="light-card p-4" style={{ background: tint, borderColor: borderTint }}>
      <i className={`bi ${icon} card-deco-icon`} style={{ color: renk }} />
      <div className="d-flex align-items-center gap-2 mb-2">
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${renk}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`bi ${icon}`} style={{ color: renk, fontSize: 16 }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: renk, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{etiket}</span>
      </div>
      <div className="financial-num" style={{ fontSize: '1.5rem', fontWeight: 800, color: renk, lineHeight: 1.1 }}>{deger}</div>
      {alt && <p style={{ fontSize: 11, color: '#94a3b8', margin: '5px 0 0', fontWeight: 600 }}>{alt}</p>}
    </div>
  )
}

// ─── Stil Sabitleri ───────────────────────────────────────────────────────────
const ekleBtn    = { background: 'linear-gradient(135deg,var(--brand-dark),#1a5b80)', color: '#fff', fontWeight: 700, fontSize: 13, borderRadius: 10, padding: '8px 18px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(18,63,89,0.25)', fontFamily: 'inherit' }
const thS        = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '11px 16px', whiteSpace: 'nowrap', borderBottom: '2px solid #f1f5f9', userSelect: 'none', background: '#f8fafc' }
const tdS        = { fontSize: 13, padding: '12px 16px', verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' }
const lblS       = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }
const selS       = { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.7rem 1rem', fontWeight: 600, color: 'var(--brand-dark)', fontFamily: "'Plus Jakarta Sans',sans-serif", borderRadius: 10, fontSize: '0.9rem', cursor: 'pointer' }
const cancelBtnS = { background: '#f8fafc', color: '#475569', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '9px 20px', border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit' }
const saveBtnS   = { background: 'linear-gradient(135deg,var(--brand-dark),#1a5b80)', color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '9px 24px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }
const ikonKutu = (color, bg) => ({ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' })
