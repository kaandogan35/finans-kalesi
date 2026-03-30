/**
 * YatirimKalesi.jsx — Yatırım Kalesi sekmesi
 * Altın, döviz ve diğer varlıkların takibi
 * İçerir: YatirimModal, FiyatGuncelleModal, YatirimKalesi
 */
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import useTemaStore from '../../stores/temaStore'
import { temaRenkleri, hexRgba } from '../../lib/temaRenkleri'
import {
  yatirimEkle, yatirimGuncelle as yatirimGuncelleApi, yatirimSil,
  guncelFiyatlariKaydet,
} from '../../api/kasa'
import { prefixMap, TL, tarihFmt, bugunTarih, formatParaInput, parseParaInput } from './kasaUtils'
import { DateInput } from '../../components/ui/DateInput'
import DonemFiltresi from './components/DonemFiltresi'

// ─── Sabitler ────────────────────────────────────────────────────────────────
const VARLIK_TIPI_CFG = {
  Altin: { icon:'bi-coin',      color:'#d97706', label:'Altın' },
  Doviz: { icon:'bi-cash-coin', color:'#0891b2', label:'Döviz' },
  Diger: { icon:'bi-box-seam',  color:'rgba(255,255,255,0.5)', label:'Diğer' },
}
const ALTIN_TURLERI = ['Çeyrek Altın', 'Yarım Altın', 'Gram Altın', 'Ata Altın', 'Külçe Altın']
const DOVIZ_TURLERI = ['Dolar ($)', 'Euro (€)', 'Sterlin (£)', 'İsviçre Frangı (CHF)']
const GRUP_SIRASI   = ['Altin', 'Doviz', 'Diger']
const BOSH_VARLIK_FORM = { varlık_tipi:'Altin', tur:'', miktar:'', alis_tarihi:'', birim_fiyat:'' }

// ─── Varlık Ekleme / Düzenleme Modalı ──────────────────────────────────────
function YatirimModal({ open, onClose, onKaydet, duzenlenen, p, renkler }) {
  const [form, setForm] = useState(BOSH_VARLIK_FORM)

  useEffect(() => {
    if (!open) return
    if (duzenlenen) {
      setForm({
        varlık_tipi: duzenlenen.varlık_tipi,
        tur:         duzenlenen.tur,
        miktar:      String(duzenlenen.miktar),
        alis_tarihi: duzenlenen.alis_tarihi,
        birim_fiyat: formatParaInput(String(duzenlenen.birim_fiyat).replace('.', ',')),
      })
    } else {
      setForm({ ...BOSH_VARLIK_FORM, alis_tarihi: bugunTarih() })
    }
  }, [open, duzenlenen])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const miktar      = parseFloat(String(form.miktar).replace(',', '.')) || 0
  const birimFiyat  = parseParaInput(form.birim_fiyat)
  const toplamDeger = miktar * birimFiyat
  const turSecenekleri = form.varlık_tipi === 'Altin' ? ALTIN_TURLERI
                       : form.varlık_tipi === 'Doviz' ? DOVIZ_TURLERI
                       : null

  const kaydet = () => {
    if (!form.tur.trim())            { toast.error('Tür zorunludur.'); return }
    if (!form.miktar || miktar <= 0) { toast.error("Miktar 0'dan büyük olmalı."); return }
    if (!form.alis_tarihi)           { toast.error('Alış tarihi zorunludur.'); return }
    if (birimFiyat <= 0)             { toast.error('Birim fiyat zorunludur.'); return }
    onKaydet({
      varlık_tipi:  form.varlık_tipi,
      tur:          form.tur.trim(),
      miktar,
      alis_tarihi:  form.alis_tarihi,
      birim_fiyat:  birimFiyat,
      guncel_fiyat: duzenlenen?.guncel_fiyat ?? null,
    })
    onClose()
  }

  const tipCfg = VARLIK_TIPI_CFG[form.varlık_tipi] || VARLIK_TIPI_CFG['Diger']

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center`}>
        <div className={`${p}-modal-box`} style={{ maxWidth:540 }} aria-labelledby="yatirim-modal-title">

          <div className={`${p}-modal-header ${p}-mh-default`}>
            <div className="d-flex align-items-center gap-3">
              <div className={`${p}-kasa-modal-icon-accent`}>
                <i className={`bi ${duzenlenen ? 'bi-pencil-square' : 'bi-safe2'}`} style={{ fontSize:18 }} />
              </div>
              <div>
                <h2 id="yatirim-modal-title" className={`${p}-modal-title`}>
                  {duzenlenen ? 'Varlık Düzenle' : 'Yeni Varlık Ekle'}
                </h2>
                <div className={`${p}-modal-sub`}>Döviz, altın ve diğer birikimler</div>
              </div>
            </div>
            <button onClick={onClose} className={`${p}-modal-close`}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className={`${p}-modal-body`}>
            <div className={`${p}-kasa-section-bar`} style={{ '--bar-color': tipCfg.color }}>
              <div className={`${p}-kasa-section-mark`} style={{ background: tipCfg.color }} />
              <span className={`${p}-kasa-section-label`} style={{ color: tipCfg.color }}>Varlık Bilgisi</span>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6">
                <label className={`${p}-kasa-input-label`}>Varlık Tipi</label>
                <select className={`${p}-kasa-select`} value={form.varlık_tipi}
                  onChange={e => setForm(f => ({ ...f, varlık_tipi: e.target.value, tur: '' }))}>
                  <option value="Altin">Altın</option>
                  <option value="Doviz">Döviz</option>
                  <option value="Diger">Diğer</option>
                </select>
              </div>
              <div className="col-12 col-sm-6">
                <label className={`${p}-kasa-input-label`}>Tür</label>
                {turSecenekleri ? (
                  <select className={`${p}-kasa-select`} value={form.tur}
                    onChange={e => set('tur', e.target.value)}>
                    <option value="">— Seçiniz —</option>
                    {turSecenekleri.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <input type="text" className={`${p}-kasa-input`} placeholder="Tür adı girin..."
                    value={form.tur} onChange={e => set('tur', e.target.value)} />
                )}
              </div>
            </div>

            <div className={`${p}-kasa-section-bar`}>
              <div className={`${p}-kasa-section-mark`} style={{ background: renkler.info }} />
              <span className={`${p}-kasa-section-label`} style={{ color: renkler.info }}>Alış Detayları</span>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-4">
                <label className={`${p}-kasa-input-label`}>Miktar</label>
                <input type="text" inputMode="decimal" className={`${p}-kasa-input`} placeholder="0"
                  value={form.miktar} onChange={e => set('miktar', e.target.value)} />
              </div>
              <div className="col-12 col-sm-4">
                <label className={`${p}-kasa-input-label`}>Alış Tarihi</label>
                <DateInput value={form.alis_tarihi} onChange={val => set('alis_tarihi', val)} placeholder="Alış tarihi" />
              </div>
              <div className="col-12 col-sm-4">
                <label className={`${p}-kasa-input-label`}>Birim Fiyat (₺)</label>
                <input type="text" className={`${p}-kasa-input ${p}-kasa-fin-num`} placeholder="0,00" inputMode="decimal"
                  value={form.birim_fiyat} onChange={e => set('birim_fiyat', formatParaInput(e.target.value))} />
              </div>
            </div>

            {(form.tur.trim() || toplamDeger > 0) && (
              <div className={`${p}-kasa-preview-box`} style={{ background: hexRgba(renkler.accent, 0.06), border: `1px solid ${hexRgba(renkler.accent, 0.15)}` }}>
                <div className={`${p}-kasa-text-label`} style={{ color: hexRgba(renkler.accent, 0.7), marginBottom:10 }}>Kayıt Önizleme</div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className={`${p}-kasa-icon-box-sm`} style={{ width:38, height:38, borderRadius:10, background:`${tipCfg.color}18`, border:`1px solid ${tipCfg.color}40` }}>
                      <i className={`bi ${tipCfg.icon}`} style={{ fontSize:16, color:tipCfg.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color: renkler.text, lineHeight:1.2 }}>{form.tur.trim() || tipCfg.label}</div>
                      <div className={`${p}-kasa-text-muted`}>{miktar > 0 ? `${miktar} adet` : '—'} · {tarihFmt(form.alis_tarihi)}</div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className={`financial-num ${p}-kasa-fin-num`} style={{ fontSize:18, fontWeight:800, color: renkler.success }}>
                      {toplamDeger > 0 ? TL(toplamDeger) : '₺0,00'}
                    </div>
                    {birimFiyat > 0 && <div className={`financial-num ${p}-kasa-text-muted`} style={{ fontSize:10 }}>birim: {TL(birimFiyat)}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`${p}-kasa-modal-footer`}>
            <button onClick={kaydet} className={`${p}-kasa-btn-accent w-100`}>
              <i className="bi bi-floppy me-2" />{duzenlenen ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Fiyatları Güncelle Modalı ──────────────────────────────────────────────
function FiyatGuncelleModal({ open, onClose, yatirimlar, onGuncelle, p, renkler }) {
  const [fiyatlar, setFiyatlar] = useState({})

  const benzersizTurler = useMemo(() => {
    const seen = new Set()
    return GRUP_SIRASI.flatMap(tip =>
      yatirimlar.filter(y => y.varlık_tipi === tip && !seen.has(y.tur) && (seen.add(y.tur) || true))
    )
  }, [yatirimlar])

  useEffect(() => {
    if (!open) return
    const init = {}
    benzersizTurler.forEach(y => {
      init[y.tur] = y.guncel_fiyat != null
        ? formatParaInput(String(y.guncel_fiyat).replace('.', ','))
        : ''
    })
    setFiyatlar(init)
  }, [open, benzersizTurler])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  const kaydet = () => { onGuncelle(fiyatlar); onClose() }

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center`}>
        <div className={`${p}-modal-box`} style={{ maxWidth:520 }} aria-labelledby="fiyat-modal-title">

          <div className={`${p}-modal-header ${p}-mh-default`}>
            <div className="d-flex align-items-center gap-3">
              <div className={`${p}-kasa-modal-icon-cyan`}>
                <i className="bi bi-graph-up-arrow" style={{ fontSize:18 }} />
              </div>
              <div>
                <h2 id="fiyat-modal-title" className={`${p}-modal-title`}>Güncel Piyasa Fiyatları</h2>
                <div className={`${p}-modal-sub`}>Kâr/zarar hesabı için güncel fiyatları girin</div>
              </div>
            </div>
            <button onClick={onClose} className={`${p}-modal-close`}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className={`${p}-modal-body`}>
            <div className={`${p}-kasa-text-muted`} style={{ marginBottom:16 }}>
              <i className="bi bi-info-circle me-1" />Boş bırakılan alanlar hesaba katılmaz.
            </div>
            {benzersizTurler.map(y => {
              const cfg = VARLIK_TIPI_CFG[y.varlık_tipi] || VARLIK_TIPI_CFG['Diger']
              const deger = fiyatlar[y.tur] ? parseParaInput(fiyatlar[y.tur]) : null
              const fark = (deger !== null && y.birim_fiyat > 0) ? ((deger - y.birim_fiyat) / y.birim_fiyat) * 100 : null
              return (
                <div key={y.tur} className={`${p}-kasa-list-item`} style={{ borderRadius:14, padding:'12px 16px', marginBottom:10, border: `1px solid ${hexRgba(renkler.text, 0.06)}` }}>
                  <div className="d-flex align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-2" style={{ flex:1 }}>
                      <div className={`${p}-kasa-icon-box-sm`} style={{ width:30, height:30, borderRadius:10, background:`${cfg.color}18` }}>
                        <i className={`bi ${cfg.icon}`} style={{ fontSize:13, color:cfg.color }} />
                      </div>
                      <div>
                        <span style={{ fontSize:13, fontWeight:700, color: renkler.text }}>{y.tur}</span>
                        <div className={`financial-num ${p}-kasa-text-muted`} style={{ fontSize:10 }}>Alış: {TL(y.birim_fiyat)}</div>
                      </div>
                    </div>
                    <div style={{ width:160 }}>
                      <input type="text" inputMode="decimal" className={`${p}-kasa-input ${p}-kasa-fin-num`} placeholder="Güncel fiyat (₺)"
                        value={fiyatlar[y.tur] || ''}
                        onChange={e => setFiyatlar(prev => ({ ...prev, [y.tur]: formatParaInput(e.target.value) }))}
                        style={{ textAlign:'right' }} />
                    </div>
                  </div>
                  {fark !== null && (
                    <div className="text-end" style={{ marginTop:4 }}>
                      <span style={{ fontSize:10, fontWeight:700, color: fark >= 0 ? renkler.success : renkler.danger }}>
                        {fark >= 0 ? '+' : ''}{fark.toFixed(1)}% {fark >= 0 ? 'kar' : 'zarar'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className={`${p}-kasa-modal-footer`}>
            <button onClick={kaydet} className={`${p}-kasa-btn-cyan w-100`}>
              <i className="bi bi-floppy me-2" />Fiyatları Kaydet
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Yatırım Kalesi Ana Bileşen ────────────────────────────────────────────
export default function YatirimKalesi({ yatirimlar, setYatirimlar, p, renkler }) {
  const [modalAcik,      setModalAcik]      = useState(false)
  const [duzenlenen,     setDuzenlenen]     = useState(null)
  const [silOnayId,      setSilOnayId]      = useState(null)
  const [showFiyatModal, setShowFiyatModal] = useState(false)
  const bugunY = new Date()
  const [ykAy,  setYkAy]  = useState(bugunY.getMonth() + 1)
  const [ykYil, setYkYil] = useState(bugunY.getFullYear())
  const [ykTum, setYkTum] = useState(true)

  const tarihliYatirimlar = useMemo(() => {
    if (ykTum) return yatirimlar
    return yatirimlar.filter(y => {
      const d = new Date((y.alis_tarihi || '') + 'T00:00:00')
      return d.getMonth() + 1 === ykAy && d.getFullYear() === ykYil
    })
  }, [yatirimlar, ykAy, ykYil, ykTum])

  const ozet = useMemo(() => {
    const bilancoMaliyet = tarihliYatirimlar.reduce((s, y) => s + y.miktar * y.birim_fiyat, 0)
    const guncelKayitlar = tarihliYatirimlar.filter(y => y.guncel_fiyat !== null)
    const guncelDeger    = guncelKayitlar.reduce((s, y) => s + y.miktar * y.guncel_fiyat, 0)
    const alisMaliyeti   = guncelKayitlar.reduce((s, y) => s + y.miktar * y.birim_fiyat, 0)
    const kz             = guncelKayitlar.length > 0 ? guncelDeger - alisMaliyeti : null
    const kzYuzde        = (kz !== null && alisMaliyeti > 0) ? (kz / alisMaliyeti) * 100 : null
    return { bilancoMaliyet, guncelDeger, kz, kzYuzde, hicGuncel: guncelKayitlar.length === 0 }
  }, [tarihliYatirimlar])

  const grupluVeri = useMemo(() =>
    GRUP_SIRASI
      .map(tip => ({ tip, kayitlar: tarihliYatirimlar.filter(y => y.varlık_tipi === tip) }))
      .filter(g => g.kayitlar.length > 0),
    [tarihliYatirimlar]
  )

  const acEkle    = () => { setDuzenlenen(null); setModalAcik(true) }
  const acDuzenle = (y) => { setDuzenlenen(y);   setModalAcik(true) }

  const kaydet = async (form) => {
    if (duzenlenen) {
      try {
        const res = await yatirimGuncelleApi(duzenlenen.id, form)
        if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt güncellenemedi.'); return }
        setYatirimlar(prev => prev.map(y => y.id === duzenlenen.id ? { ...y, ...form } : y))
      } catch {
        toast.error('Kayıt güncellenemedi.')
      }
    } else {
      try {
        const mevcutFiyat = yatirimlar.find(y => y.tur === form.tur && y.guncel_fiyat !== null)?.guncel_fiyat ?? null
        const gonderilen = { ...form, guncel_fiyat: mevcutFiyat }
        const res = await yatirimEkle(gonderilen)
        if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt eklenemedi.'); return }
        setYatirimlar(prev => [...prev, { ...gonderilen, id: res.data.veri.id }])
      } catch {
        toast.error('Kayıt eklenemedi.')
      }
    }
  }

  const sil = async (id) => {
    try {
      const res = await yatirimSil(id)
      if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt silinemedi.'); return }
      setYatirimlar(prev => prev.filter(y => y.id !== id))
      setSilOnayId(null)
    } catch {
      toast.error('Kayıt silinemedi.')
    }
  }

  const fiyatGuncelle = async (fiyatlar) => {
    setYatirimlar(prev => prev.map(y => {
      const deger = fiyatlar[y.tur]
      if (deger === undefined || deger === '') return { ...y, guncel_fiyat: null }
      return { ...y, guncel_fiyat: parseParaInput(deger) }
    }))

    const apiPayload = {}
    for (const [tur, deger] of Object.entries(fiyatlar)) {
      apiPayload[tur] = (deger === undefined || deger === '') ? null : parseParaInput(deger)
    }
    try {
      await guncelFiyatlariKaydet(apiPayload)
      toast.success('Güncel fiyatlar kaydedildi.')
    } catch {
      toast.error('Fiyatlar veritabanına kaydedilemedi.')
    }
  }

  const kzRenk = ozet.kz === null ? renkler.textSec : ozet.kz >= 0 ? renkler.success : renkler.danger
  const kzBg   = ozet.kz === null ? hexRgba(renkler.text, 0.06) : ozet.kz >= 0 ? hexRgba(renkler.success, 0.1) : hexRgba(renkler.danger, 0.1)
  const kzIkon = ozet.kz === null ? 'bi-dash-circle' : ozet.kz >= 0 ? 'bi-arrow-up-circle-fill' : 'bi-arrow-down-circle-fill'

  const dagılım = useMemo(() => {
    return GRUP_SIRASI.map(tip => {
      const topTutar = tarihliYatirimlar.filter(y => y.varlık_tipi === tip).reduce((s,y) => s + y.miktar * y.birim_fiyat, 0)
      return { tip, tutar: topTutar }
    }).filter(d => d.tutar > 0)
  }, [yatirimlar])
  const dagılımToplam = dagılım.reduce((s,d) => s + d.tutar, 0)

  return (
    <div>
      <DonemFiltresi secilenAy={ykAy} secilenYil={ykYil} setSecilenAy={setYkAy} setSecilenYil={setYkYil} tumZamanlar={ykTum} setTumZamanlar={setYkTum} p={p} renkler={renkler} />

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className={`${p}-kasa-section-title`} style={{ fontSize:'1.1rem', margin:0 }}>
            <i className="bi bi-safe2 me-2" style={{ color: renkler.accent }} />Yatırım Kalesi
          </h2>
          <p className={`${p}-kasa-text-muted mb-0`}>Döviz, altın ve birikimleriniz · {tarihliYatirimlar.length} varlık</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {yatirimlar.length > 0 && (
            <button onClick={() => setShowFiyatModal(true)}
              className={`${p}-kasa-btn-outline-accent`}>
              <i className="bi bi-graph-up-arrow me-1" style={{ fontSize:13 }} />Fiyatları Güncelle
            </button>
          )}
          <button onClick={acEkle} className={`${p}-kasa-btn-accent d-none d-md-flex align-items-center gap-2`} style={{ borderRadius:50 }}>
            <i className="bi bi-plus-lg" />Varlık Ekle
          </button>
        </div>
      </div>

      {/* ── 3 Hero KPI Kartı ── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-4">
          <div className={`${p}-kasa-kpi-card`}>
            <i className={`bi bi-wallet2 ${p}-kasa-kpi-deco`} style={{ color:renkler.accent }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className={`${p}-kasa-icon-box`} style={{ background:hexRgba(renkler.accent, 0.12) }}><i className="bi bi-wallet2" style={{ color:renkler.accent, fontSize:17 }} /></div>
              <span className={`${p}-kasa-kpi-label`}>Bilanço (Sabit) Değeri</span>
            </div>
            <div className={`financial-num ${p}-kasa-kpi-val`} style={{ textShadow:`0 0 20px ${hexRgba(renkler.accent, 0.2)}` }}>{TL(ozet.bilancoMaliyet)}</div>
            <p className={`${p}-kasa-text-muted`} style={{ fontSize:11, margin:'8px 0 0', fontWeight:500 }}>Kayıtlı alış maliyetlerinizin toplamı</p>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className={`${p}-kasa-kpi-card`}>
            <i className={`bi bi-graph-up ${p}-kasa-kpi-deco`} style={{ color:renkler.info }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className={`${p}-kasa-icon-box`} style={{ background:hexRgba(renkler.info, 0.12) }}><i className="bi bi-graph-up" style={{ color:renkler.info, fontSize:17 }} /></div>
              <span className={`${p}-kasa-kpi-label`}>Güncel Piyasa Karşılığı</span>
            </div>
            {ozet.hicGuncel ? (
              <div className={`d-flex align-items-center gap-2 mt-1 ${p}-kasa-text-muted`}>
                <i className="bi bi-info-circle" style={{ fontSize:14 }} />
                <span style={{ fontSize:13, fontWeight:600 }}>Henüz fiyat girilmedi</span>
              </div>
            ) : (
              <div className={`financial-num ${p}-kasa-kpi-val`} style={{ textShadow:`0 0 20px ${hexRgba(renkler.info, 0.2)}` }}>{TL(ozet.guncelDeger)}</div>
            )}
            <p className={`${p}-kasa-text-muted`} style={{ fontSize:11, margin:'8px 0 0', fontWeight:500 }}>Şu an bozarsanız elde edeceğiniz nakit</p>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className={`${p}-kasa-kpi-card`}>
            <i className={`bi ${kzIkon} ${p}-kasa-kpi-deco`} style={{ color:kzRenk }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className={`${p}-kasa-icon-box`} style={{ background:kzBg }}><i className={`bi ${kzIkon}`} style={{ color:kzRenk, fontSize:17 }} /></div>
              <span className={`${p}-kasa-kpi-label`}>Potansiyel Kâr / Zarar</span>
            </div>
            {ozet.kz === null ? (
              <div className={`${p}-kasa-text-muted`} style={{ fontSize:20, fontWeight:800 }}>—</div>
            ) : (
              <div className="d-flex align-items-baseline gap-3">
                <div className={`financial-num ${p}-kasa-kpi-val`} style={{ textShadow:`0 0 20px ${hexRgba(kzRenk, 0.2)}` }}>
                  {ozet.kz >= 0 ? '+' : ''}{TL(ozet.kz)}
                </div>
                {ozet.kzYuzde !== null && (
                  <span className="badge" style={{ background: kzBg, color:kzRenk, fontWeight:700, fontSize:12, padding:'4px 10px', borderRadius:10 }}>
                    {ozet.kz >= 0 ? '+' : ''}{ozet.kzYuzde.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
            <p className={`${p}-kasa-text-muted`} style={{ fontSize:11, margin:'8px 0 0', fontWeight:500 }}>Reel piyasaya göre net fark</p>
          </div>
        </div>
      </div>

      {/* ── Portföy Dağılımı + Envanter ── */}
      {yatirimlar.length === 0 ? (
        <div className={`${p}-kasa-glass-card text-center py-5`}>
          <i className="bi bi-safe2" style={{ fontSize:52, opacity:0.35, color: renkler.accent }} />
          <p className="mt-3 mb-1" style={{ fontSize:16, fontWeight:700, color: hexRgba(renkler.text, 0.5) }}>Henüz varlık eklenmedi</p>
          <p style={{ fontSize:13, margin:0 }} className={`${p}-kasa-text-muted`}>Altın, döviz veya diğer birikimlerinizi buradan takip edin.</p>
        </div>
      ) : (
        <>
          {dagılım.length > 1 && (
            <div className={`${p}-kasa-glass-card`} style={{ padding:0, marginBottom:'1rem' }}>
              <div className="px-4 pt-4 pb-3 d-flex align-items-center gap-2" style={{ borderBottom:`1px solid ${hexRgba(renkler.text, 0.06)}` }}>
                <div className={`${p}-kasa-icon-box-sm`} style={{ background:hexRgba(renkler.accent, 0.1) }}>
                  <i className="bi bi-pie-chart" style={{ color:renkler.accent, fontSize:14 }} />
                </div>
                <div>
                  <span className={`${p}-kasa-text-primary`} style={{ fontSize:14, fontWeight:700 }}>Varlık Dağılımı</span>
                  <p className={`mb-0 ${p}-kasa-text-muted`} style={{ fontSize:11 }}>Alış maliyetine göre ağırlıklar</p>
                </div>
              </div>
              <div className="row g-0">
                {dagılım.map((d, idx) => {
                  const cfg = VARLIK_TIPI_CFG[d.tip] || VARLIK_TIPI_CFG['Diger']
                  const yuzde = dagılımToplam > 0 ? (d.tutar / dagılımToplam) * 100 : 0
                  return (
                    <div key={d.tip} className={`col-12 col-sm`} style={{ borderRight: idx < dagılım.length - 1 ? `1px solid ${hexRgba(renkler.text, 0.06)}` : 'none' }}>
                      <div style={{ padding:'18px 22px' }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <div style={{ width:10, height:10, borderRadius:'50%', background:cfg.color, flexShrink:0, boxShadow:`0 0 8px ${cfg.color}55` }} />
                          <span className={`${p}-kasa-text-sec`} style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{cfg.label}</span>
                          <span className={`${p}-kasa-text-muted`} style={{ fontSize:11, fontWeight:700, marginLeft:'auto' }}>{yuzde.toFixed(0)}%</span>
                        </div>
                        <div style={{ height:6, borderRadius:3, background:hexRgba(renkler.text, 0.06), overflow:'hidden', marginBottom:8 }}>
                          <div style={{ width:`${yuzde}%`, height:'100%', borderRadius:3, background:`linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`, transition:'width 0.4s ease', boxShadow:`0 0 8px ${cfg.color}33` }} />
                        </div>
                        <div className={`financial-num ${p}-kasa-text-primary`} style={{ fontSize:15, fontWeight:800 }}>{TL(d.tutar)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {grupluVeri.map(({ tip, kayitlar }) => {
            const cfg = VARLIK_TIPI_CFG[tip] || VARLIK_TIPI_CFG['Diger']
            return (
              <div key={tip} className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className={`${p}-kasa-icon-box-sm`} style={{ background:`${cfg.color}18` }}>
                    <i className={`bi ${cfg.icon}`} style={{ fontSize:14, color:cfg.color }} />
                  </div>
                  <span style={{ fontSize:14, fontWeight:800, color:cfg.color, letterSpacing:'0.02em' }}>{cfg.label}</span>
                  <span className={`${p}-kasa-text-muted`}>· {kayitlar.length} varlık</span>
                </div>

                <div className="row g-3">
                  {kayitlar.map(y => {
                    const alisMaliyet = y.miktar * y.birim_fiyat
                    const guncelDeger = y.guncel_fiyat !== null ? y.miktar * y.guncel_fiyat : null
                    const kz          = guncelDeger !== null ? guncelDeger - alisMaliyet : null
                    const kzYuzde     = (kz !== null && alisMaliyet > 0) ? (kz / alisMaliyet) * 100 : null
                    const kzR         = kz === null ? renkler.textSec : kz >= 0 ? renkler.success : renkler.danger
                    return (
                      <div key={y.id} className="col-12 col-sm-6 col-xl-4">
                        <div className={`${p}-kasa-kpi-card`} style={{ position:'relative', overflow:'hidden' }}>
                          <i className={`bi ${cfg.icon}`} style={{ position:'absolute', right:14, bottom:14, fontSize:44, opacity:0.35, color:cfg.color, pointerEvents:'none' }} />

                          <div className="d-flex align-items-center gap-3 mb-3">
                            <div style={{
                              width:46, height:46, borderRadius:14, flexShrink:0,
                              background:`linear-gradient(135deg, ${cfg.color}22, ${cfg.color}0a)`,
                              border:`1px solid ${cfg.color}30`,
                              display:'flex', alignItems:'center', justifyContent:'center'
                            }}>
                              <i className={`bi ${cfg.icon}`} style={{ fontSize:20, color:cfg.color }} />
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div className={`${p}-kasa-text-primary`} style={{ fontWeight:800, fontSize:15, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{y.tur}</div>
                              <div className={`${p}-kasa-text-muted`} style={{ fontSize:12, marginTop:2 }}>
                                <span style={{ fontWeight:700 }}>{y.miktar}</span> Adet · {tarihFmt(y.alis_tarihi)}
                              </div>
                            </div>
                            {silOnayId === y.id ? (
                              <div className="d-flex align-items-center gap-1" style={{ flexShrink:0 }}>
                                <button onClick={() => sil(y.id)} className={`${p}-kasa-sil-btn`}>Sil</button>
                                <button onClick={() => setSilOnayId(null)} className={`${p}-kasa-vazgec-btn`}>Vazgeç</button>
                              </div>
                            ) : (
                              <div className="d-flex gap-1" style={{ flexShrink:0 }}>
                                <button onClick={() => acDuzenle(y)}
                                  style={{ background:'none', border:`1px solid ${hexRgba(renkler.text, 0.1)}`, borderRadius:10, width:36, height:36, padding:0, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor=renkler.accent; e.currentTarget.style.background=hexRgba(renkler.accent, 0.08) }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor=hexRgba(renkler.text, 0.1); e.currentTarget.style.background='none' }}>
                                  <i className="bi bi-pencil" style={{ fontSize:12, color:renkler.accent }} />
                                </button>
                                <button onClick={() => setSilOnayId(y.id)}
                                  style={{ background:hexRgba(renkler.danger, 0.06), border:`1px solid ${hexRgba(renkler.danger, 0.15)}`, borderRadius:10, width:36, height:36, padding:0, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'border-color 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor=renkler.danger }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor=hexRgba(renkler.danger, 0.15) }}>
                                  <i className="bi bi-trash3" style={{ fontSize:12, color:renkler.danger }} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="row g-2 mb-3">
                            <div className="col-6">
                              <div style={{ background:hexRgba(renkler.text, 0.03), border:`1px solid ${hexRgba(renkler.text, 0.06)}`, borderRadius:10, padding:'10px 12px' }}>
                                <div className={`${p}-kasa-text-muted`} style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Alış Maliyeti</div>
                                <div className={`financial-num ${p}-kasa-text-primary`} style={{ fontSize:14, fontWeight:700 }}>{TL(alisMaliyet)}</div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div style={{ background: guncelDeger !== null ? hexRgba(renkler.info, 0.04) : hexRgba(renkler.text, 0.03), border:`1px solid ${guncelDeger !== null ? hexRgba(renkler.info, 0.1) : hexRgba(renkler.text, 0.06)}`, borderRadius:10, padding:'10px 12px' }}>
                                <div className={`${p}-kasa-text-muted`} style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Güncel Değer</div>
                                <div className={`financial-num`} style={{ fontSize:14, fontWeight:700, color: guncelDeger !== null ? renkler.text : hexRgba(renkler.text, 0.3) }}>
                                  {guncelDeger !== null ? TL(guncelDeger) : '—'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {kz !== null ? (
                            <div style={{
                              background:`linear-gradient(135deg, ${hexRgba(kzR, 0.08)}, ${hexRgba(kzR, 0.03)})`,
                              border:`1px solid ${hexRgba(kzR, 0.15)}`,
                              borderRadius:10, padding:'10px 14px',
                              display:'flex', alignItems:'center', justifyContent:'space-between'
                            }}>
                              <div className="d-flex align-items-center gap-2">
                                <i className={`bi ${kz >= 0 ? 'bi-arrow-up-circle-fill' : 'bi-arrow-down-circle-fill'}`} style={{ fontSize:16, color:kzR }} />
                                <span style={{ fontSize:12, fontWeight:700, color:kzR }}>{kz >= 0 ? 'Kâr' : 'Zarar'}</span>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <span className="financial-num" style={{ fontSize:15, fontWeight:800, color:kzR }}>
                                  {kz >= 0 ? '+' : ''}{TL(kz)}
                                </span>
                                <span style={{ background:hexRgba(kzR, 0.12), color:kzR, fontWeight:700, fontSize:11, padding:'3px 8px', borderRadius:10 }}>
                                  {kz >= 0 ? '+' : ''}{kzYuzde?.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              background:hexRgba(renkler.text, 0.03),
                              border:`1px solid ${hexRgba(renkler.text, 0.06)}`,
                              borderRadius:10, padding:'10px 14px',
                              display:'flex', alignItems:'center', justifyContent:'center', gap:8
                            }}>
                              <i className="bi bi-info-circle" style={{ fontSize:13, color:hexRgba(renkler.text, 0.3) }} />
                              <span className={`${p}-kasa-text-muted`} style={{ fontSize:12, fontWeight:600 }}>Güncel fiyat girilmedi</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}

      <YatirimModal
        open={modalAcik}
        onClose={() => setModalAcik(false)}
        onKaydet={kaydet}
        duzenlenen={duzenlenen}
        p={p}
        renkler={renkler}
      />

      <FiyatGuncelleModal
        open={showFiyatModal}
        onClose={() => setShowFiyatModal(false)}
        yatirimlar={yatirimlar}
        onGuncelle={fiyatGuncelle}
        p={p}
        renkler={renkler}
      />

      {/* ── Mobil FAB ── */}
      <div className="p-fab-wrap">
        <button
          className="p-fab-btn"
          onClick={acEkle}
          type="button"
          aria-label="Varlık ekle"
        >
          <span className="p-fab-btn-icon"><i className="bi bi-plus-lg" /></span>
        </button>
      </div>
    </div>
  )
}
