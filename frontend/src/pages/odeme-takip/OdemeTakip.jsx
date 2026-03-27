import { useState, useEffect, useCallback } from 'react'
import { odemeApi } from '../../api/odeme'
import { carilerApi } from '../../api/cariler'
import useTemaStore from '../../stores/temaStore'
import { temaRenkleri } from '../../lib/temaRenkleri'

const prefixMap = { paramgo: 'p' }

/* ═══ YARDIMCI FONKSİYONLAR ═══ */

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0) + ' ₺'

const tarihStr = (t) => {
  if (!t) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(t + 'T00:00:00'))
}

const tarihKisa = (t) => {
  if (!t) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: 'short',
  }).format(new Date(t + 'T00:00:00'))
}

const bugunStr = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

const gunFarki = (t) => {
  if (!t) return null
  const b = new Date(); b.setHours(0, 0, 0, 0)
  return Math.floor((new Date(t + 'T00:00:00') - b) / 86400000)
}

/* ═══ TABS ═══ */
const TABS = [
  { id: 'aranmasi_gerekenler', label: 'Aranması Gerekenler', icon: 'bi-telephone-fill' },
  { id: 'arandi',              label: 'Arandı',               icon: 'bi-telephone-outbound' },
  { id: 'soz_alinanlar',       label: 'Söz Alınanlar',        icon: 'bi-calendar-check' },
  { id: 'tamamlandi',          label: 'Tamamlandı',           icon: 'bi-check-circle-fill' },
]

/* ═══ ANA BİLEŞEN ═══ */

export default function OdemeTakip() {
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'p'
  const renkler = temaRenkleri[aktifTema] || temaRenkleri.paramgo

  /* ── State ── */
  const [liste,           setListe]           = useState([])
  const [toplam,          setToplam]          = useState(0)
  const [yukleniyor,      setYukleniyor]      = useState(true)
  const [apiHatasi,       setApiHatasi]       = useState(false)
  const [aktifTab,        setAktifTab]        = useState('aranmasi_gerekenler')
  const [ozet,            setOzet]            = useState(null)
  const [tabSayilari,     setTabSayilari]     = useState({})
  const [arama,           setArama]           = useState('')
  const [cariListesi,     setCariListesi]      = useState([])

  // Arama Kaydı Modal
  const [aramaModalId,    setAramaModalId]    = useState(null)
  const [aramaAksiyon,    setAramaAksiyon]    = useState('') // cevap_vermedi | soz_verildi | tamamlandi
  const [aramaNot,        setAramaNot]        = useState('')
  const [aramaHatTarihi,  setAramaHatTarihi]  = useState('')
  const [aramaSozTarihi,  setAramaSozTarihi]  = useState('')
  const [aramaGun,        setAramaGun]        = useState('30')
  const [aramaYukleniyor, setAramaYukleniyor] = useState(false)
  const [aramaHata,       setAramaHata]       = useState('')

  // Sil modal
  const [silId,           setSilId]           = useState(null)
  const [silYukleniyor,   setSilYukleniyor]   = useState(false)

  // Yeni kayıt modal
  const [showEkle,        setShowEkle]        = useState(false)
  const [ekleForm,        setEkleForm]        = useState({ cari_id: '', yon: 'tahsilat', oncelik: 'normal' })
  const [ekleYukleniyor,  setEkleYukleniyor]  = useState(false)
  const [ekleHata,        setEkleHata]        = useState('')

  /* ── ESC kapatma ── */
  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') {
        setAramaModalId(null)
        setSilId(null)
        setShowEkle(false)
      }
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  /* ── Veri yükleme ── */
  const veriGetir = useCallback(async (tab = aktifTab) => {
    setYukleniyor(true)
    setApiHatasi(false)
    try {
      const params = { tab, adet: 100 }
      if (arama.trim()) params.arama = arama.trim()

      const [listeRes, ozetRes] = await Promise.all([
        odemeApi.listele(params),
        odemeApi.ozet(),
      ])

      const kayitlar = listeRes.data?.veri?.kayitlar || []
      setListe(kayitlar)
      setToplam(listeRes.data?.veri?.toplam || kayitlar.length)

      const ozetVeri = ozetRes.data?.veri || {}
      setOzet(ozetVeri)
      setTabSayilari(ozetVeri.tab_sayilari || {})
    } catch {
      setApiHatasi(true)
    } finally {
      setYukleniyor(false)
    }
  }, [aktifTab, arama])

  useEffect(() => {
    veriGetir(aktifTab)
  }, [aktifTab])

  useEffect(() => {
    const t = setTimeout(() => veriGetir(aktifTab), 350)
    return () => clearTimeout(t)
  }, [arama])

  // Cari listesi (bir kez yükle)
  useEffect(() => {
    carilerApi.listele({ adet: 500, siralama: 'ad_asc' })
      .then(r => setCariListesi(r.data?.veri?.cariler || []))
      .catch(() => {})
  }, [])

  /* ── Tab değiştir ── */
  const tabDegistir = (tabId) => {
    setAktifTab(tabId)
    setArama('')
  }

  /* ── Arama kaydı submit ── */
  const aramaKaydiGonder = async () => {
    if (!aramaAksiyon) { setAramaHata('Bir seçenek seçin'); return }
    if (aramaAksiyon === 'cevap_vermedi' && !aramaHatTarihi) {
      setAramaHata('Tekrar arama tarihi zorunludur')
      return
    }
    if (aramaAksiyon === 'soz_verildi' && !aramaSozTarihi) {
      setAramaHata('Söz tarihi zorunludur')
      return
    }

    setAramaYukleniyor(true)
    setAramaHata('')
    try {
      const payload = { aksiyon: aramaAksiyon, not: aramaNot || undefined }
      if (aramaAksiyon === 'cevap_vermedi')  payload.hatirlatma_tarihi = aramaHatTarihi
      if (aramaAksiyon === 'soz_verildi')    payload.soz_tarihi = aramaSozTarihi
      if (aramaAksiyon === 'tamamlandi')     payload.hatirlatma_gun = parseInt(aramaGun) || 30

      await odemeApi.aramaKaydi(aramaModalId, payload)
      setAramaModalId(null)
      resetAramaModal()
      await veriGetir(aktifTab)
    } catch (err) {
      setAramaHata(err.response?.data?.hata || 'Bir hata oluştu')
    } finally {
      setAramaYukleniyor(false)
    }
  }

  const resetAramaModal = () => {
    setAramaAksiyon('')
    setAramaNot('')
    setAramaHatTarihi('')
    setAramaSozTarihi('')
    setAramaGun('30')
    setAramaHata('')
  }

  /* ── Sil ── */
  const silOnaylaVeSil = async () => {
    setSilYukleniyor(true)
    try {
      await odemeApi.sil(silId)
      setSilId(null)
      await veriGetir(aktifTab)
    } catch {
      /* hata */
    } finally {
      setSilYukleniyor(false)
    }
  }

  /* ── Yeni Ekle ── */
  const ekleKaydet = async () => {
    if (!ekleForm.cari_id) { setEkleHata('Cari seçimi zorunludur'); return }
    setEkleYukleniyor(true)
    setEkleHata('')
    try {
      await odemeApi.olustur({
        cari_id: ekleForm.cari_id,
        yon: ekleForm.yon,
        oncelik: ekleForm.oncelik,
        durum: 'bekliyor',
      })
      setShowEkle(false)
      setEkleForm({ cari_id: '', yon: 'tahsilat', oncelik: 'normal' })
      setAktifTab('aranmasi_gerekenler')
      await veriGetir('aranmasi_gerekenler')
    } catch (err) {
      setEkleHata(err.response?.data?.hata || 'Eklenemedi')
    } finally {
      setEkleYukleniyor(false)
    }
  }

  /* ── Aralanacak kaydı bul ── */
  const aramaModalKayit = aramaModalId ? liste.find(k => k.id === aramaModalId) : null
  const silKayit        = silId        ? liste.find(k => k.id === silId)        : null

  /* ── Görünen ad (cari_id varsa cari_adi, yoksa firma_adi) ── */
  const gorununAd = (k) => k.cari_adi || k.firma_adi || '—'

  /* ── Söz tarihi badge rengi ── */
  const sozBadge = (tarih) => {
    if (!tarih) return null
    const fark = gunFarki(tarih)
    if (fark === null) return null
    if (fark < 0)  return { cls: 'danger',  text: `${Math.abs(fark)} gün geçti` }
    if (fark === 0) return { cls: 'warning', text: 'Bugün' }
    if (fark <= 3)  return { cls: 'warning', text: `${fark} gün kaldı` }
    return { cls: 'success', text: `${fark} gün kaldı` }
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div className={`${p}-page-root`}>

      {/* ─── SAYFA HEADER ──────────────────────────────────── */}
      <div className={`${p}-page-header`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon`}>
            <i className="bi bi-credit-card-2-front-fill" />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>Ödeme Takip</h1>
            <p className={`${p}-page-sub`}>Tahsilat ve ödeme süreçlerini takip edin</p>
          </div>
        </div>
        <div className={`${p}-page-header-right`}>
          <button
            onClick={() => setShowEkle(true)}
            className={`${p}-cym-btn-new d-flex align-items-center gap-2`}
          >
            <i className="bi bi-plus-lg" /> Takibe Al
          </button>
        </div>
      </div>

      {/* ─── DASHBOARD KARTLARI ───────────────────────────── */}
      <div className="row g-3 mb-4">
        {[
          {
            label: 'Aranması Gereken',
            value: ozet?.bugun_aranmasi_gereken ?? '—',
            icon:  'bi-telephone-fill',
            renk:  renkler.danger,
            tab:   'aranmasi_gerekenler',
            desc:  'Bugün aranması gereken',
          },
          {
            label: 'Söz Tarihi Geçmiş',
            value: ozet?.soz_tarihi_gecmis ?? '—',
            icon:  'bi-exclamation-triangle-fill',
            renk:  renkler.warning,
            tab:   'soz_alinanlar',
            desc:  'Ödeme yapılmamış sözler',
          },
          {
            label: 'Bekleyen Söz',
            value: ozet?.bekleyen_soz ?? '—',
            icon:  'bi-calendar-event-fill',
            renk:  renkler.info,
            tab:   'soz_alinanlar',
            desc:  'Tarihi gelmemiş sözler',
          },
          {
            label: 'Bu Ay Tamamlanan',
            value: ozet?.bu_ay_tamamlanan ?? '—',
            icon:  'bi-check-circle-fill',
            renk:  renkler.success,
            tab:   'tamamlandi',
            desc:  'Bu ay tahsil edildi',
          },
        ].map((kpi, i) => (
          <div key={i} className="col-12 col-sm-6 col-xl-3">
            <div className={`${p}-cek-kpi`} onClick={() => tabDegistir(kpi.tab)} style={{ cursor: 'pointer' }}>
              <i className={`bi ${kpi.icon} ${p}-kpi-deco`} style={{ color: kpi.renk }} />
              <h6 style={{
                fontSize: 11, fontWeight: 600, color: renkler.textSec,
                textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 10px',
              }}>
                {kpi.label}
              </h6>
              <div className="financial-num" style={{ fontSize: 28, fontWeight: 800, color: kpi.renk, lineHeight: 1 }}>
                {kpi.value}
              </div>
              <p style={{ fontSize: 12, color: renkler.textSec, fontWeight: 500, margin: '8px 0 0' }}>
                {kpi.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── TABS + ARAMA + İÇERİK ──────────────────────── */}
      <div className={`${p}-cym-glass-card`}>

        {/* Tab bar + Arama */}
        <div className={`${p}-cym-toolbar`}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex gap-2 flex-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {TABS.map(tab => {
                const sayi = tabSayilari[tab.id]
                const aktif = aktifTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => tabDegistir(tab.id)}
                    className={`${p}-cym-tab-btn ${aktif ? `${p}-cym-tab-active` : ''}`}
                  >
                    <i className={`bi ${tab.icon}`} />
                    {tab.label}
                    {sayi > 0 && (
                      <span className={`${p}-cym-tab-badge ${aktif ? `${p}-cym-tab-badge-active` : ''}`}>
                        {sayi}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className={`${p}-cym-search-wrap`}>
              <i className={`bi bi-search ${p}-cym-search-icon`} />
              <input
                type="text"
                placeholder="Cari adı veya telefon ara..."
                value={arama}
                onChange={e => setArama(e.target.value)}
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

        {/* İçerik */}
        {yukleniyor ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className={`${p}-cym-spinner mb-3`} />
            <span className={`${p}-cym-loading-text`}>Yükleniyor...</span>
          </div>
        ) : apiHatasi ? (
          <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 px-3">
            <div className={`${p}-cym-error-icon`}>
              <i className="bi bi-exclamation-circle" />
            </div>
            <p className={`${p}-cym-error-text`}>Veriler yüklenemedi.</p>
            <button onClick={() => veriGetir(aktifTab)} className={`${p}-cym-retry-btn d-flex align-items-center gap-2`}>
              <i className="bi bi-arrow-clockwise" /> Tekrar Dene
            </button>
          </div>
        ) : liste.length === 0 ? (
          <BosList tab={aktifTab} p={p} />
        ) : (
          <div>
            {liste.map(kayit => (
              <KayitKart
                key={kayit.id}
                kayit={kayit}
                p={p}
                aktifTab={aktifTab}
                gorununAd={gorununAd}
                tarihStr={tarihStr}
                tarihKisa={tarihKisa}
                sozBadge={sozBadge}
                TL={TL}
                onAramaKaydi={() => {
                  setAramaModalId(kayit.id)
                  resetAramaModal()
                }}
                onSil={() => setSilId(kayit.id)}
              />
            ))}
            {toplam > liste.length && (
              <div className={`${p}-cym-pagination-bar`}>
                <small className={`${p}-cym-pagination-info`}>
                  {liste.length} / {toplam} kayıt gösteriliyor
                </small>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL — ARAMA KAYDI
          ═══════════════════════════════════════════════════════════ */}
      {aramaModalId && (
        <>
          <div
            className={`${p}-modal-overlay`}
            onClick={() => { setAramaModalId(null); resetAramaModal() }}
          />
          <div className={`${p}-modal-center`}>
            <div className={`${p}-modal-box`} style={{ maxWidth: 480 }}>

              {/* Header */}
              <div className={`${p}-modal-header ${p}-mh-default`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={`${p}-modal-icon`} style={{
                    width: 36, height: 36, background: 'rgba(16,185,129,0.1)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-telephone-fill" style={{ color: 'var(--p-color-primary)', fontSize: 16 }} />
                  </div>
                  <div>
                    <h2 className={`${p}-modal-title`}>Arama Kaydı</h2>
                    {aramaModalKayit && (
                      <div className={`${p}-modal-sub`}>{gorununAd(aramaModalKayit)}</div>
                    )}
                  </div>
                </div>
                <button
                  className={`${p}-modal-close`}
                  onClick={() => { setAramaModalId(null); resetAramaModal() }}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              {/* Body */}
              <div className={`${p}-modal-body`}>

                {/* Seçenekler */}
                {[
                  {
                    id: 'cevap_vermedi',
                    icon: 'bi-telephone-x-fill',
                    color: '#EF4444',
                    bg: '#fef2f2',
                    label: 'Cevap Vermedi',
                    desc: 'Tekrar aranacak tarih belirle',
                  },
                  {
                    id: 'soz_verildi',
                    icon: 'bi-chat-square-dots-fill',
                    color: '#3B82F6',
                    bg: '#eff6ff',
                    label: 'Söz Verdi',
                    desc: 'Ödeme tarihi gir, Söz Alınanlar\'a düşer',
                  },
                  {
                    id: 'tamamlandi',
                    icon: 'bi-check-circle-fill',
                    color: '#10B981',
                    bg: '#ecfdf5',
                    label: 'Tahsilat Alındı',
                    desc: 'X gün sonra tekrar hatırlatılır',
                  },
                ].map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setAramaAksiyon(opt.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 14px',
                      border: `2px solid ${aramaAksiyon === opt.id ? opt.color : 'var(--p-border)'}`,
                      borderRadius: 10, marginBottom: 8, cursor: 'pointer',
                      background: aramaAksiyon === opt.id ? opt.bg : 'transparent',
                      transition: 'var(--p-transition)',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: opt.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`bi ${opt.icon}`} style={{ color: opt.color, fontSize: 16 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--p-text)' }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>{opt.desc}</div>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${aramaAksiyon === opt.id ? opt.color : 'var(--p-border-strong)'}`,
                      background: aramaAksiyon === opt.id ? opt.color : 'transparent',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {aramaAksiyon === opt.id && (
                        <i className="bi bi-check" style={{ color: '#fff', fontSize: 10, fontWeight: 900 }} />
                      )}
                    </div>
                  </div>
                ))}

                {/* Dinamik ek alanlar */}
                {aramaAksiyon === 'cevap_vermedi' && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-label)', display: 'block', marginBottom: 6 }}>
                      Tekrar Arama Tarihi *
                    </label>
                    <input
                      type="date"
                      min={bugunStr(1)}
                      value={aramaHatTarihi}
                      onChange={e => setAramaHatTarihi(e.target.value)}
                      style={{
                        width: '100%', height: 42, padding: '0 12px',
                        border: '1px solid var(--p-border)', borderRadius: 10,
                        background: 'var(--p-bg-input)', color: 'var(--p-text)',
                        fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>
                )}

                {aramaAksiyon === 'soz_verildi' && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-label)', display: 'block', marginBottom: 6 }}>
                      Söz Verilen Tarih *
                    </label>
                    <input
                      type="date"
                      min={bugunStr(0)}
                      value={aramaSozTarihi}
                      onChange={e => setAramaSozTarihi(e.target.value)}
                      style={{
                        width: '100%', height: 42, padding: '0 12px',
                        border: '1px solid var(--p-border)', borderRadius: 10,
                        background: 'var(--p-bg-input)', color: 'var(--p-text)',
                        fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>
                )}

                {aramaAksiyon === 'tamamlandi' && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-label)', display: 'block', marginBottom: 6 }}>
                      Kaç Gün Sonra Tekrar Hatırlat?
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['15', '30', '45', '60', '90'].map(g => (
                        <button
                          key={g}
                          onClick={() => setAramaGun(g)}
                          style={{
                            flex: 1, height: 38, border: `2px solid ${aramaGun === g ? 'var(--p-color-primary)' : 'var(--p-border)'}`,
                            borderRadius: 10, background: aramaGun === g ? 'rgba(16,185,129,0.08)' : 'transparent',
                            color: aramaGun === g ? 'var(--p-color-primary)' : 'var(--p-text-muted)',
                            fontWeight: aramaGun === g ? 700 : 500, fontSize: 12, cursor: 'pointer',
                            transition: 'var(--p-transition)',
                          }}
                        >
                          {g} gün
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={aramaGun}
                        onChange={e => setAramaGun(e.target.value)}
                        placeholder="Özel"
                        style={{
                          width: 72, height: 38, padding: '0 8px',
                          border: '1px solid var(--p-border)', borderRadius: 10,
                          background: 'var(--p-bg-input)', color: 'var(--p-text)',
                          fontSize: 13, textAlign: 'center', outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Not alanı */}
                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-label)', display: 'block', marginBottom: 6 }}>
                    Görüşme Notu (opsiyonel)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Görüşme hakkında not..."
                    value={aramaNot}
                    onChange={e => setAramaNot(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px',
                      border: '1px solid var(--p-border)', borderRadius: 10,
                      background: 'var(--p-bg-input)', color: 'var(--p-text)',
                      fontSize: 13, resize: 'none', outline: 'none',
                    }}
                  />
                </div>

                {aramaHata && (
                  <div style={{
                    marginTop: 10, padding: '8px 12px',
                    background: 'var(--p-bg-badge-danger)',
                    border: '1px solid #fecaca', borderRadius: 8,
                    color: 'var(--p-color-danger)', fontSize: 12,
                  }}>
                    <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />
                    {aramaHata}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`${p}-modal-footer`}>
                <button
                  onClick={() => { setAramaModalId(null); resetAramaModal() }}
                  className={`${p}-btn-cancel`}
                  style={{ flex: 1 }}
                >
                  İptal
                </button>
                <button
                  onClick={aramaKaydiGonder}
                  disabled={aramaYukleniyor || !aramaAksiyon}
                  className={`${p}-btn-save ${p}-btn-save-default`}
                  style={{
                    flex: 2,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: (aramaYukleniyor || !aramaAksiyon) ? 0.5 : 1,
                  }}
                >
                  {aramaYukleniyor
                    ? <><Spinner />Kaydediliyor...</>
                    : <><i className="bi bi-check-lg" />Kaydet</>
                  }
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL — SİLME ONAY
          ═══════════════════════════════════════════════════════════ */}
      {silId && (
        <>
          <div className={`${p}-modal-overlay`} onClick={() => !silYukleniyor && setSilId(null)} />
          <div className={`${p}-modal-center`}>
            <div className={`${p}-modal-box`} style={{ maxWidth: 420 }}>
              <div className={`${p}-modal-header ${p}-mh-danger`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={`${p}-modal-icon ${p}-modal-icon-red`}>
                    <i className="bi bi-trash3-fill" />
                  </div>
                  <div>
                    <h2 className={`${p}-modal-title`}>Kaydı Sil</h2>
                    <div className={`${p}-modal-sub`}>Bu işlem geri alınamaz</div>
                  </div>
                </div>
                <button className={`${p}-modal-close`} onClick={() => !silYukleniyor && setSilId(null)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              <div className={`${p}-modal-body`} style={{ textAlign: 'center', padding: '24px' }}>
                {silKayit && (
                  <div style={{
                    padding: '12px 16px', background: 'var(--p-bg-badge-danger)',
                    border: '1px solid #fecaca', borderRadius: 10,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--p-text)' }}>
                      {gorununAd(silKayit)}
                    </div>
                    {silKayit.cari_bakiye != null && (
                      <div style={{ fontSize: 13, color: 'var(--p-text-muted)', marginTop: 2 }} className="financial-num">
                        Bakiye: {TL(silKayit.cari_bakiye)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className={`${p}-modal-footer`}>
                <button className={`${p}-btn-cancel`} style={{ flex: 1 }} onClick={() => setSilId(null)} disabled={silYukleniyor}>
                  Vazgeç
                </button>
                <button
                  className={`${p}-btn-save ${p}-btn-save-red`}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: silYukleniyor ? 0.6 : 1 }}
                  onClick={silOnaylaVeSil}
                  disabled={silYukleniyor}
                >
                  {silYukleniyor
                    ? <><Spinner />Siliniyor...</>
                    : <><i className="bi bi-trash3" />Evet, Sil</>
                  }
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL — YENİ TAKIBE AL
          ═══════════════════════════════════════════════════════════ */}
      {showEkle && (
        <>
          <div className={`${p}-modal-overlay`} onClick={() => setShowEkle(false)} />
          <div className={`${p}-modal-center`}>
            <div className={`${p}-modal-box`} style={{ maxWidth: 460 }}>
              <div className={`${p}-modal-header ${p}-mh-default`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(16,185,129,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-person-plus-fill" style={{ color: 'var(--p-color-primary)', fontSize: 16 }} />
                  </div>
                  <div>
                    <h2 className={`${p}-modal-title`}>Ödeme Takibine Al</h2>
                    <div className={`${p}-modal-sub`}>Seçilen cari Aranması Gerekenler\'e düşer</div>
                  </div>
                </div>
                <button className={`${p}-modal-close`} onClick={() => setShowEkle(false)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              <div className={`${p}-modal-body`}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-label)', display: 'block', marginBottom: 6 }}>
                    Cari *
                  </label>
                  <select
                    value={ekleForm.cari_id}
                    onChange={e => setEkleForm(f => ({ ...f, cari_id: e.target.value }))}
                    style={{
                      width: '100%', height: 42, padding: '0 12px',
                      border: '1px solid var(--p-border)', borderRadius: 10,
                      background: 'var(--p-bg-input)', color: 'var(--p-text)',
                      fontSize: 13, outline: 'none',
                    }}
                  >
                    <option value="">— Cari seçin —</option>
                    {cariListesi.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.cari_adi} {c.bakiye > 0 ? `(${TL(c.bakiye)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-label)', display: 'block', marginBottom: 6 }}>
                      Yön
                    </label>
                    <select
                      value={ekleForm.yon}
                      onChange={e => setEkleForm(f => ({ ...f, yon: e.target.value }))}
                      style={{
                        width: '100%', height: 42, padding: '0 12px',
                        border: '1px solid var(--p-border)', borderRadius: 10,
                        background: 'var(--p-bg-input)', color: 'var(--p-text)',
                        fontSize: 13, outline: 'none',
                      }}
                    >
                      <option value="tahsilat">Tahsilat (Alacak)</option>
                      <option value="odeme">Ödeme (Borç)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-label)', display: 'block', marginBottom: 6 }}>
                      Öncelik
                    </label>
                    <select
                      value={ekleForm.oncelik}
                      onChange={e => setEkleForm(f => ({ ...f, oncelik: e.target.value }))}
                      style={{
                        width: '100%', height: 42, padding: '0 12px',
                        border: '1px solid var(--p-border)', borderRadius: 10,
                        background: 'var(--p-bg-input)', color: 'var(--p-text)',
                        fontSize: 13, outline: 'none',
                      }}
                    >
                      <option value="dusuk">Düşük</option>
                      <option value="normal">Normal</option>
                      <option value="yuksek">Yüksek</option>
                      <option value="kritik">Kritik</option>
                    </select>
                  </div>
                </div>

                {ekleHata && (
                  <div style={{
                    marginTop: 12, padding: '8px 12px',
                    background: 'var(--p-bg-badge-danger)',
                    border: '1px solid #fecaca', borderRadius: 8,
                    color: 'var(--p-color-danger)', fontSize: 12,
                  }}>
                    <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />
                    {ekleHata}
                  </div>
                )}
              </div>
              <div className={`${p}-modal-footer`}>
                <button className={`${p}-btn-cancel`} style={{ flex: 1 }} onClick={() => setShowEkle(false)}>
                  İptal
                </button>
                <button
                  onClick={ekleKaydet}
                  disabled={ekleYukleniyor || !ekleForm.cari_id}
                  className={`${p}-btn-save ${p}-btn-save-default`}
                  style={{
                    flex: 2,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: (ekleYukleniyor || !ekleForm.cari_id) ? 0.5 : 1,
                  }}
                >
                  {ekleYukleniyor
                    ? <><Spinner />Ekleniyor...</>
                    : <><i className="bi bi-plus-lg" />Takibe Al</>
                  }
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}

/* ═══ KAYIT KART BİLEŞENİ ═══ */

function KayitKart({ kayit, p, aktifTab, gorununAd, tarihStr, tarihKisa, sozBadge, TL, onAramaKaydi, onSil }) {
  const [expand, setExpand] = useState(false)

  const ad = gorununAd(kayit)
  const badge = sozBadge(kayit.soz_tarihi)
  const hatBadge = sozBadge(kayit.hatirlatma_tarihi)

  const ONCELIK_RENK = {
    kritik: '#EF4444', yuksek: '#F59E0B', normal: '#10B981', dusuk: '#6B7280',
  }

  const DURUM_LABEL = {
    bekliyor:      'Bekliyor',
    cevap_vermedi: 'Cevap Vermedi',
    soz_verildi:   'Söz Verildi',
    tamamlandi:    'Tamamlandı',
  }

  const renk = ONCELIK_RENK[kayit.oncelik] || '#6B7280'

  return (
    <div style={{
      borderBottom: '1px solid var(--p-border)',
      padding: '14px 16px',
      transition: 'background var(--p-transition)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--p-bg-table-row-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Öncelik çizgisi */}
        <div style={{ width: 4, borderRadius: 2, background: renk, alignSelf: 'stretch', minHeight: 48, flexShrink: 0 }} />

        {/* Ana bilgi */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--p-text)' }}>{ad}</span>
            {kayit.cari_telefon && (
              <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>
                <i className="bi bi-telephone" style={{ marginRight: 3 }} />
                {kayit.cari_telefon}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            {/* Bakiye */}
            {kayit.cari_bakiye != null && (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-muted)' }} className="financial-num">
                {TL(kayit.cari_bakiye)}
              </span>
            )}

            {/* Yön */}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 7px',
              borderRadius: 10,
              background: kayit.yon === 'tahsilat' ? 'var(--p-bg-badge-success)' : 'var(--p-bg-badge-danger)',
              color: kayit.yon === 'tahsilat' ? 'var(--p-color-success)' : 'var(--p-color-danger)',
            }}>
              {kayit.yon === 'tahsilat' ? 'Tahsilat' : 'Ödeme'}
            </span>

            {/* Söz tarihi */}
            {kayit.soz_tarihi && badge && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                background: badge.cls === 'danger' ? 'var(--p-bg-badge-danger)'
                  : badge.cls === 'warning' ? 'var(--p-bg-badge-warning)'
                  : 'var(--p-bg-badge-success)',
                color: badge.cls === 'danger' ? 'var(--p-color-danger)'
                  : badge.cls === 'warning' ? 'var(--p-color-warning)'
                  : 'var(--p-color-success)',
              }}>
                <i className="bi bi-calendar3" style={{ marginRight: 4 }} />
                {tarihKisa(kayit.soz_tarihi)} · {badge.text}
              </span>
            )}

            {/* Hatırlatma tarihi (arandı tab için) */}
            {aktifTab === 'arandi' && kayit.hatirlatma_tarihi && (
              <>
                {kayit.durum === 'bekliyor' && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                    background: '#eff6ff', color: '#3B82F6',
                  }}>
                    <i className="bi bi-clock" style={{ marginRight: 3 }} />
                    Planlanmış Hatırlatma
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>
                  <i className="bi bi-bell" style={{ marginRight: 3 }} />
                  {tarihKisa(kayit.hatirlatma_tarihi)} arancak
                </span>
              </>
            )}

            {/* Son arama tarihi */}
            {kayit.son_arama_tarihi && (
              <span style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>
                <i className="bi bi-clock-history" style={{ marginRight: 3 }} />
                Son: {tarihKisa(kayit.son_arama_tarihi)}
              </span>
            )}
          </div>
        </div>

        {/* Aksiyon butonları */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Arama Kaydı (tamamlandi tab'ında gösterme) */}
          {aktifTab !== 'tamamlandi' && (
            <button
              onClick={onAramaKaydi}
              title="Arama Kaydı"
              style={{
                width: 36, height: 36, borderRadius: 10, border: '1px solid var(--p-border)',
                background: 'var(--p-bg-card)', color: 'var(--p-color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'var(--p-transition)', fontSize: 14,
              }}
            >
              <i className="bi bi-telephone-fill" />
            </button>
          )}
          {/* Sil */}
          <button
            onClick={onSil}
            title="Sil"
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--p-border)',
              background: 'var(--p-bg-card)', color: 'var(--p-color-danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'var(--p-transition)', fontSize: 14,
            }}
          >
            <i className="bi bi-trash3" />
          </button>
          {/* Genişlet */}
          {kayit.gorusme_notu && (
            <button
              onClick={() => setExpand(x => !x)}
              title="Not göster"
              style={{
                width: 36, height: 36, borderRadius: 10, border: '1px solid var(--p-border)',
                background: 'var(--p-bg-card)', color: 'var(--p-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'var(--p-transition)', fontSize: 14,
              }}
            >
              <i className={`bi bi-chevron-${expand ? 'up' : 'down'}`} />
            </button>
          )}
        </div>
      </div>

      {/* Görüşme notu */}
      {expand && kayit.gorusme_notu && (
        <div style={{
          marginTop: 10, marginLeft: 16,
          padding: '8px 12px',
          background: 'var(--p-bg-badge-warning)',
          borderRadius: 8, fontSize: 12,
          color: 'var(--p-text-secondary)',
          borderLeft: '3px solid var(--p-color-warning)',
        }}>
          <i className="bi bi-chat-square-text" style={{ marginRight: 6 }} />
          {kayit.gorusme_notu}
        </div>
      )}
    </div>
  )
}

/* ═══ BOŞ LİSTE ═══ */

function BosList({ tab, p }) {
  const meta = {
    aranmasi_gerekenler: { icon: 'bi-telephone-fill', text: 'Aranması gereken kayıt yok', sub: 'Cari listesinden "Takibe Al" diyerek buraya ekleyebilirsiniz' },
    arandi:              { icon: 'bi-telephone-outbound', text: 'Arandı kaydı yok', sub: 'Cevap vermedi olarak işaretlenen ve tarihi henüz gelmeyenler burada görünür' },
    soz_alinanlar:       { icon: 'bi-calendar-check', text: 'Söz alınan kayıt yok', sub: 'Müşteriden söz tarihi alındığında bu sekmeye düşer' },
    tamamlandi:          { icon: 'bi-check-circle-fill', text: 'Tamamlanan kayıt yok', sub: 'Tahsilat tamamlandığında bu sekmeye düşer' },
  }
  const m = meta[tab] || meta.aranmasi_gerekenler

  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
        background: 'var(--p-bg-table-header)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={`bi ${m.icon}`} style={{ fontSize: 22, color: 'var(--p-text-muted)', opacity: 0.35 }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--p-text)', marginBottom: 6 }}>{m.text}</div>
      <div style={{ fontSize: 12, color: 'var(--p-text-muted)', maxWidth: 320, margin: '0 auto' }}>{m.sub}</div>
    </div>
  )
}

/* ═══ SPINNER ═══ */

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}
