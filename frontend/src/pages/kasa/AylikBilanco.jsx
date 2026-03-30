/**
 * AylikBilanco — Aylık Bilanço sekmesi
 * BilancoGrafik + AyKapanisModal + AylikBilanco
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import { hexRgba } from '../../lib/temaRenkleri'
import { bilancoKaydet, bilancoGuncelle, bilancoSil } from '../../api/kasa'
import { TL, donemNormalize, donemFmt, formatParaInput, parseParaInput, bugunTarih } from './kasaUtils'
import PerformansKarti from './components/PerformansKarti'

// ─── SVG Bilanço Büyüme Grafiği ───────────────────────────────────────────────
function BilancoGrafik({ kapanislar, renkler, p }) {
  const [tooltip, setTooltip] = useState(null)
  const wrapRef = useRef(null)

  if (kapanislar.length < 1) return (
    <div style={{ padding:'24px', textAlign:'center', color:renkler.textSec, fontSize:13 }}>Henüz kapanış kaydı yok</div>
  )

  const sirali = [...kapanislar].sort((a,b) => donemNormalize(a.donem).localeCompare(donemNormalize(b.donem)))

  if (sirali.length === 1) {
    const k = sirali[0]
    return (
      <div style={{ textAlign:'center', padding:'24px' }}>
        <div className={`financial-num ${p}-kasa-fin-num`} style={{ fontSize:16, fontWeight:800, color:renkler.primary }}>
          {donemFmt(k.donem)}: {TL(k.net_varlik)}
        </div>
        <p style={{ fontSize:12, color:renkler.textSec, marginTop:6 }}>Grafik için en az 2 kapanış gerekli</p>
      </div>
    )
  }

  const svgW=700, svgH=180, mL=72, mR=16, mT=20, mB=40
  const chartW=svgW-mL-mR, chartH=svgH-mT-mB
  const vals   = sirali.map(k => k.net_varlik)
  const minV   = Math.min(...vals), maxV = Math.max(...vals)
  const pad    = (maxV-minV)*0.2 || 500000
  const yMin=minV-pad, yMax=maxV+pad, yRange=yMax-yMin
  const xS = (i) => mL + (i/(sirali.length-1))*chartW
  const yS = (v) => mT + chartH - ((v-yMin)/yRange)*(chartH-4)
  const pts = sirali.map((k,i) => `${xS(i)},${yS(k.net_varlik)}`).join(' ')
  const area = `${mL},${mT+chartH} ${pts} ${xS(sirali.length-1)},${mT+chartH}`
  const yTicks = [0,0.25,0.5,0.75,1].map(r => ({ y:mT+chartH-r*(chartH-4), val:Math.round(yMin+r*yRange) }))

  const handleEnter = (e, k, i) => {
    if (!wrapRef.current) return
    const wrap = wrapRef.current.getBoundingClientRect()
    const svg  = wrapRef.current.querySelector('svg').getBoundingClientRect()
    const scX  = svg.width / svgW
    const scY  = svg.height / svgH
    setTooltip({ x: xS(i)*scX, y: yS(k.net_varlik)*scY - 12, donem: donemFmt(k.donem), val: k.net_varlik })
  }

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      {tooltip && (
        <div style={{ position:'absolute', left:tooltip.x, top:tooltip.y, transform:'translate(-50%,-100%)', background:'rgba(13,27,46,0.95)', backdropFilter:'blur(12px)', color:'#fff', borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:700, pointerEvents:'none', zIndex:10, whiteSpace:'nowrap', boxShadow:'0 8px 24px rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ opacity:0.7, marginBottom:2, fontSize:11 }}>{tooltip.donem}</div>
          <div className="financial-num" style={{ color:renkler.accent }}>{TL(tooltip.val)}</div>
        </div>
      )}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width:'100%', height:'auto', display:'block' }}>
        {yTicks.map((t,i) => (
          <g key={i}>
            <line x1={mL} y1={t.y} x2={svgW-mR} y2={t.y} stroke={hexRgba(renkler.textSec, 0.1)} strokeWidth="1" />
            <text x={mL-5} y={t.y+4} textAnchor="end" fontSize="10" fill={hexRgba(renkler.textSec, 0.5)}>
              {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(t.val)}
            </text>
          </g>
        ))}
        <line x1={mL} y1={mT} x2={mL} y2={mT+chartH} stroke={hexRgba(renkler.textSec, 0.15)} strokeWidth="1" />
        <polygon points={area} fill={hexRgba(renkler.accent, 0.08)} />
        <polyline points={pts} fill="none" stroke={renkler.accent} strokeWidth="2.5" strokeLinejoin="round" />
        {sirali.map((k,i) => (
          <g key={k.id}
            onMouseEnter={(e) => handleEnter(e, k, i)}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor:'pointer' }}
          >
            <circle cx={xS(i)} cy={yS(k.net_varlik)} r="10" fill="transparent" />
            <circle cx={xS(i)} cy={yS(k.net_varlik)} r="5" fill={renkler.accent} stroke="#fff" strokeWidth="2" />
            <text x={xS(i)} y={svgH-8} textAnchor="middle" fontSize="10" fill={hexRgba(renkler.textSec, 0.45)}>{donemFmt(k.donem)}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Ay Kapanış Modalı ────────────────────────────────────────────────────────
function AyKapanisModal({ open, onClose, kapanislar, onKaydet, yatirimGuncelDeger = 0, bankaBakiye = 0, duzenlenen = null, p, renkler }) {
  const siraliKap  = [...kapanislar].sort((a,b) => donemNormalize(a.donem).localeCompare(donemNormalize(b.donem)))
  const sonKapanis = siraliKap[siraliKap.length - 1] || null

  const sonraPeriod = () => {
    if (!sonKapanis) {
      const bugun = new Date()
      return `${bugun.getFullYear()}-${String(bugun.getMonth()+1).padStart(2,'0')}`
    }
    const parts = sonKapanis.donem.split('-')
    let yil, ay
    if (parts[0].length === 4) { yil = parseInt(parts[0]); ay = parseInt(parts[1]) }
    else                        { ay  = parseInt(parts[0]); yil = parseInt(parts[1]) }
    let nextAy  = ay + 1
    let nextYil = yil
    if (nextAy > 12) { nextAy = 1; nextYil++ }
    return `${nextYil}-${String(nextAy).padStart(2,'0')}`
  }

  const [form, setForm] = useState({
    donem: '', devredenStok: '', kesilenFatura: '',
    karMarji: '35', gelenAlis: '', alacaklar: '', borclar: '', bankaKasaNakdi: '',
  })

  useEffect(() => {
    if (open) {
      if (duzenlenen) {
        setForm({
          donem:          duzenlenen.donem,
          devredenStok:   formatParaInput(String(duzenlenen.donem_basi_stok ?? 0).replace('.', ',')),
          kesilenFatura:  formatParaInput(String(duzenlenen.kesilen_fatura ?? 0).replace('.', ',')),
          karMarji:       String(duzenlenen.kar_marji ?? 35),
          gelenAlis:      formatParaInput(String(duzenlenen.gelen_alis ?? 0).replace('.', ',')),
          alacaklar:      formatParaInput(String(duzenlenen.alacaklar ?? 0).replace('.', ',')),
          borclar:        formatParaInput(String(duzenlenen.borclar ?? 0).replace('.', ',')),
          bankaKasaNakdi: formatParaInput(String(duzenlenen.banka_nakdi ?? 0).replace('.', ',')),
        })
        return
      }
      setForm({
        donem: sonraPeriod(),
        devredenStok:  sonKapanis ? formatParaInput(String(sonKapanis.sanal_stok ?? 0).replace('.', ',')) : '',
        kesilenFatura: '', karMarji: '35',
        gelenAlis: '', alacaklar: '', borclar: '',
        bankaKasaNakdi: bankaBakiye ? formatParaInput(String(bankaBakiye).replace('.', ',')) : '',
      })
    }
  }, [open, sonKapanis])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const pv  = (v) => parseParaInput(v)
  const smm       = form.kesilenFatura ? pv(form.kesilenFatura) / (1 + pv(form.karMarji) / 100) : 0
  const sanaiStok = pv(form.devredenStok) + pv(form.gelenAlis) - smm
  const netVarlik = sanaiStok + pv(form.bankaKasaNakdi) + yatirimGuncelDeger + pv(form.alacaklar) - pv(form.borclar)

  const set  = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const setP = (k) => (e) => set(k, formatParaInput(e.target.value))

  const kaydet = () => {
    if (!form.donem.trim()) { toast.error('Dönem alanı zorunludur.'); return }
    const yeniDonemNorm = donemNormalize(form.donem.trim())
    if (kapanislar.some(k => donemNormalize(k.donem) === yeniDonemNorm && k.id !== duzenlenen?.id)) {
      toast.warning(`${donemFmt(form.donem)} dönemi zaten kayıtlı.`)
      return
    }
    onKaydet({
      id:              Date.now(),
      donem:           form.donem.trim(),
      kesilen_fatura:  pv(form.kesilenFatura),
      gelen_alis:      pv(form.gelenAlis),
      kar_marji:       pv(form.karMarji),
      donem_basi_stok: pv(form.devredenStok),
      alacaklar:       pv(form.alacaklar),
      borclar:         pv(form.borclar),
      banka_nakdi:     pv(form.bankaKasaNakdi),
      yatirim_birikimi: yatirimGuncelDeger,
      smm,
      sanal_stok:      sanaiStok,
      net_varlik:      netVarlik,
    })
    onClose()
  }

  const lbl = (txt, ikon) => (
    <label className={`${p}-kasa-input-label d-flex align-items-center gap-2`} style={{ marginBottom:8, fontWeight:700 }}>
      {ikon && <i className={`bi ${ikon}`} style={{ fontSize:13, opacity:0.5 }} />}
      {txt}
    </label>
  )

  return createPortal(
    <>
      {/* Backdrop */}
      <div className={`${p}-modal-overlay`} />

      {/* Modal Wrapper */}
      <div className={`${p}-modal-center`}>
        <div className={`${p}-modal-box`} style={{ maxWidth:720 }} aria-labelledby="aykapanis-modal-title">

          {/* ── Header — Lacivert dolu ── */}
          <div className={`${p}-modal-header ${p}-mh-default`}>
            <div className="d-flex align-items-center gap-3">
              <div className={`${p}-kasa-modal-icon-accent`}>
                <i className={`bi ${duzenlenen ? 'bi-pencil-square' : 'bi-calculator-fill'}`} style={{ fontSize:18 }} />
              </div>
              <div>
                <h2 id="aykapanis-modal-title" className={`${p}-modal-title`}>
                  {duzenlenen ? 'Kayıt Düzenle' : 'SMM Motoru & Ay Kapanışı'}
                </h2>
                <div className={`${p}-modal-sub`}>
                  {duzenlenen ? `${donemFmt(duzenlenen.donem)} dönemini güncelliyorsunuz` : 'Dönemi hesapla ve varlığını kaydet'}
                </div>
              </div>
            </div>
            <button onClick={onClose} className={`${p}-modal-close`}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className={`${p}-modal-body`} style={{ padding:'24px' }}>

            {/* Bilgi kutusu */}
            <div className={`${p}-kasa-info-box`} style={{ marginBottom:20 }}>
              <i className="bi bi-lightbulb-fill" style={{ color:renkler.accent, fontSize:15, flexShrink:0, marginTop:2 }} />
              <span className={`${p}-kasa-text-sec`} style={{ fontSize:13, fontWeight:500, lineHeight:1.55 }}>
                Sistem; kestiğiniz fatura ve kâr marjınızdan yola çıkarak maliyeti bulur ve yeni tahmini deponuzu hesaplayıp net varlığınıza ekler.
              </span>
            </div>

            {/* ── Bölüm 1: Dönem Bilgileri ── */}
            <div style={{ marginBottom:20 }}>
              <div className={`${p}-kasa-section-bar`}>
                <div className={`${p}-kasa-section-mark`} style={{ background:renkler.accent }} />
                <span className={`${p}-kasa-section-label`} style={{ color:renkler.accent }}>Dönem Bilgileri</span>
              </div>
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  {lbl('Dönem (AA-YYYY)', 'bi-calendar3')}
                  <input type="text" value={form.donem} onChange={e => set('donem', e.target.value)}
                    placeholder="03-2026" className={`${p}-kasa-input`} />
                </div>
                <div className="col-12 col-sm-6">
                  {lbl('Dönem Başı Devreden Stok (₺)', 'bi-box-seam')}
                  <input type="text" inputMode="decimal" value={form.devredenStok} onChange={setP('devredenStok')}
                    placeholder="0,00" className={`${p}-kasa-input`} />
                </div>
              </div>
            </div>

            {/* ── Bölüm 2: Ciro & Maliyet ── */}
            <div style={{ marginBottom:20 }}>
              <div className={`${p}-kasa-section-bar`}>
                <div className={`${p}-kasa-section-mark`} style={{ background:renkler.success }} />
                <span className={`${p}-kasa-section-label`} style={{ color:renkler.success }}>Ciro & Maliyet</span>
              </div>
              <div className="row g-3">
                <div className="col-12 col-sm-4">
                  {lbl('Kestiğimiz Fatura (₺)', 'bi-receipt')}
                  <input type="text" inputMode="decimal" value={form.kesilenFatura} onChange={setP('kesilenFatura')}
                    placeholder="0,00" className={`${p}-kasa-input`} />
                </div>
                <div className="col-12 col-sm-4">
                  {lbl('Kâr Marjı (%)', 'bi-percent')}
                  <input type="text" inputMode="decimal" value={form.karMarji} onChange={e => set('karMarji', e.target.value)}
                    placeholder="0" className={`${p}-kasa-input`} />
                </div>
                <div className="col-12 col-sm-4">
                  {lbl('Gelen Alış Faturaları (₺)', 'bi-truck')}
                  <input type="text" inputMode="decimal" value={form.gelenAlis} onChange={setP('gelenAlis')}
                    placeholder="0,00" className={`${p}-kasa-input`} />
                </div>
              </div>
            </div>

            {/* ── Bölüm 3: Piyasa Durumu ── */}
            <div style={{ marginBottom:24 }}>
              <div className={`${p}-kasa-section-bar`}>
                <div className={`${p}-kasa-section-mark`} style={{ background:renkler.info }} />
                <span className={`${p}-kasa-section-label`} style={{ color:renkler.info }}>Piyasa Durumu</span>
              </div>
              <div className="row g-3">
                <div className="col-12 col-sm-4">
                  {lbl('Toplam Alacağımız (₺)', 'bi-arrow-down-circle')}
                  <input type="text" inputMode="decimal" value={form.alacaklar} onChange={setP('alacaklar')}
                    placeholder="0,00" className={`${p}-kasa-input`} style={{ color:renkler.success }} />
                </div>
                <div className="col-12 col-sm-4">
                  {lbl('Toplam Borcumuz (₺)', 'bi-arrow-up-circle')}
                  <input type="text" inputMode="decimal" value={form.borclar} onChange={setP('borclar')}
                    placeholder="0,00" className={`${p}-kasa-input`} style={{ color:renkler.danger }} />
                </div>
                <div className="col-12 col-sm-4">
                  {lbl('Banka Ticari Nakdi (₺)', 'bi-bank')}
                  <input type="text" inputMode="decimal" value={form.bankaKasaNakdi} onChange={setP('bankaKasaNakdi')}
                    placeholder="0,00" className={`${p}-kasa-input`} />
                </div>
              </div>
            </div>

            {/* ── Canlı Önizleme — Premium Panel ── */}
            <div style={{
              background:`linear-gradient(135deg, ${hexRgba(renkler.accent, 0.06)} 0%, ${hexRgba(renkler.bg, 0.4)} 100%)`,
              border:`1px solid ${hexRgba(renkler.accent, 0.15)}`,
              borderRadius:14, padding:'18px 20px', marginBottom:20
            }}>
              <div className={`${p}-kasa-section-bar`} style={{ marginBottom:14 }}>
                <i className="bi bi-eye-fill" style={{ fontSize:12, color:renkler.accent }} />
                <span className={`${p}-kasa-section-label`} style={{ color:renkler.accent }}>Canlı Önizleme</span>
              </div>

              {/* SMM hesabı */}
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ padding:'8px 12px', background:hexRgba(renkler.text, 0.03), borderRadius:10 }}>
                <span className={`${p}-kasa-text-sec`} style={{ fontSize:12, fontWeight:600 }}>
                  SMM = {TL(pv(form.kesilenFatura))} / (1 + %{pv(form.karMarji)})
                </span>
                <span className={`financial-num ${p}-kasa-fin-num ${p}-kasa-text-primary`} style={{ fontSize:13, fontWeight:800, opacity:0.85 }}>{TL(smm)}</span>
              </div>

              {/* Sanal Stok */}
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ padding:'8px 12px', background:hexRgba(renkler.text, 0.03), borderRadius:10 }}>
                <span className={`${p}-kasa-text-sec`} style={{ fontSize:12, fontWeight:600 }}>Sanal Stok</span>
                <span className={`financial-num ${p}-kasa-fin-num ${p}-kasa-text-accent`} style={{ fontSize:13, fontWeight:800 }}>{TL(sanaiStok)}</span>
              </div>

              {/* Yatırım Birikimi */}
              <div className="d-flex justify-content-between align-items-center mb-3" style={{ padding:'8px 12px', background:hexRgba(renkler.text, 0.03), borderRadius:10 }}>
                <span className={`${p}-kasa-text-sec`} style={{ fontSize:12, fontWeight:600 }}>Yatırım Birikimi</span>
                {yatirimGuncelDeger > 0
                  ? <span className={`financial-num ${p}-kasa-fin-num`} style={{ fontSize:13, fontWeight:800, color:renkler.success }}>{TL(yatirimGuncelDeger)}</span>
                  : <span className={`${p}-kasa-text-muted`} style={{ fontSize:12, fontWeight:600 }}>Henüz fiyat girilmedi</span>
                }
              </div>

              {/* Net Varlık — büyük sonuç */}
              <div style={{ borderTop:`2px solid ${hexRgba(renkler.accent, 0.2)}`, paddingTop:14, textAlign:'center' }}>
                <div className={`${p}-kasa-text-muted`} style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>
                  <i className="bi bi-trophy-fill me-1" style={{ color:renkler.accent }} />Net Varlık
                </div>
                <div className={`financial-num ${p}-kasa-fin-num`} style={{
                  fontSize:28, fontWeight:900,
                  color:renkler.primary, lineHeight:1,
                  textShadow:`0 0 24px ${hexRgba(renkler.primary, 0.25)}`
                }}>
                  {TL(netVarlik)}
                </div>
              </div>
            </div>

          </div>

          {/* ── Footer — Sticky buton alanı ── */}
          <div style={{
            padding:'16px 24px', flexShrink:0,
            borderTop:`1px solid ${hexRgba(renkler.text, 0.08)}`,
            background:hexRgba(renkler.bg, 0.6)
          }}>
            <button onClick={kaydet}
              className={`${p}-kasa-btn-accent`}
              style={{
                width:'100%', borderRadius:10, padding:'14px',
                fontSize:16, fontWeight:700,
                boxShadow:`0 4px 20px ${hexRgba(renkler.accent, 0.3)}, 0 0 40px ${hexRgba(renkler.accent, 0.1)}`
              }}>
              <i className={`bi ${duzenlenen ? 'bi-floppy' : 'bi-calculator-fill'} me-2`} style={{ fontSize:18 }} />
              {duzenlenen ? 'Güncelle & Kaydet' : 'Hesapla & Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Aylık Bilanço ────────────────────────────────────────────────────────────
export default function AylikBilanco({ kapanislar, setKapanislar, yatirimGuncelDeger = 0, bankaBakiye = 0, p, renkler }) {
  const [modalAcik,        setModalAcik]        = useState(false)
  const [duzenlenenKapanis, setDuzenlenenKapanis] = useState(null)
  const [arama,            setArama]            = useState('')
  const [silOnayId,        setSilOnayId]        = useState(null)
  const [sayfa,            setSayfa]            = useState(1)
  const sayfaBasi = 10

  const sirali     = [...kapanislar].sort((a,b) => donemNormalize(a.donem).localeCompare(donemNormalize(b.donem)))
  const sonKapanis = sirali[sirali.length - 1] || null
  const onceki     = sirali[sirali.length - 2] || null

  const filtrelendi = [...sirali]
    .reverse()
    .filter(k => k.donem.includes(arama) || donemFmt(k.donem).toLowerCase().includes(arama.toLowerCase()))

  const toplamSayfa = Math.ceil(filtrelendi.length / sayfaBasi)
  const sayfaliVeri = filtrelendi.slice((sayfa-1)*sayfaBasi, sayfa*sayfaBasi)

  const acEkle     = () => { setDuzenlenenKapanis(null); setModalAcik(true) }
  const acDuzenle  = (k) => { setDuzenlenenKapanis(k);   setModalAcik(true) }

  const kaydet = async (yeni) => {
    if (duzenlenenKapanis) {
      const onceki = kapanislar.find(k => k.id === duzenlenenKapanis.id)
      setKapanislar(prev => prev.map(k => k.id === duzenlenenKapanis.id ? { ...yeni, id: duzenlenenKapanis.id } : k))
      setDuzenlenenKapanis(null)
      try {
        await bilancoGuncelle(duzenlenenKapanis.id, yeni)
        toast.success('Kayıt güncellendi.')
      } catch (err) {
        if (onceki) setKapanislar(prev => prev.map(k => k.id === duzenlenenKapanis.id ? onceki : k))
        toast.error(err?.response?.data?.hata || 'Güncelleme kaydedilemedi.')
      }
    } else {
      const geciciId = Date.now()
      setKapanislar(prev => [...prev, { ...yeni, id: geciciId }])
      setSayfa(1)
      setDuzenlenenKapanis(null)
      try {
        const res = await bilancoKaydet(yeni)
        const gercekId = res.data?.veri?.id
        if (gercekId) setKapanislar(prev => prev.map(k => k.id === geciciId ? { ...k, id: gercekId } : k))
        toast.success('Ay kapanışı kaydedildi.')
      } catch (err) {
        setKapanislar(prev => prev.filter(k => k.id !== geciciId))
        toast.error(err?.response?.data?.hata || 'Kayıt kaydedilemedi.')
      }
    }
  }
  const sil = async (id) => {
    const yedek = kapanislar.find(k => k.id === id)
    setKapanislar(prev => prev.filter(k => k.id !== id))
    setSilOnayId(null)
    try {
      await bilancoSil(id)
      toast.success('Kayıt silindi.')
    } catch (err) {
      if (yedek) setKapanislar(prev => [...prev, yedek])
      toast.error(err?.response?.data?.hata || 'Kayıt silinemedi.')
    }
  }

  return (
    <div>

      {/* ─── Sağ Üst Aksiyon Butonu ─── */}
      <div className="d-flex justify-content-end mb-3">
        <button
          onClick={acEkle}
          className={`${p}-cym-btn-new d-flex align-items-center gap-2`}
        >
          <i className="bi bi-calculator-fill" /> Ay Kapanışı Yap
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ÜST SATIR — Varlıklar (3'lü Grid)
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3 mb-4">

        {/* Kart 1 — Güncel Net Varlık */}
        <div className="col-12 col-md-4">
          <div className={`${p}-kasa-kpi-card`}>
            <i className={`bi bi-bank ${p}-kasa-kpi-deco`} style={{ color:renkler.info }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className={`${p}-kasa-icon-box`} style={{ background:hexRgba(renkler.info, 0.12) }}><i className="bi bi-bank" style={{ color:renkler.info, fontSize:17 }} /></div>
              <span className={`${p}-kasa-kpi-label`}>Güncel Net Varlık</span>
            </div>
            {sonKapanis ? (
              <div className={`financial-num ${p}-kasa-kpi-val`} style={{ textShadow:`0 0 20px ${hexRgba(renkler.info, 0.2)}` }}>
                {TL(sonKapanis.net_varlik)}
              </div>
            ) : (
              <div className={`${p}-kasa-text-muted`} style={{ fontSize:20, fontWeight:800 }}>—</div>
            )}
            <p className={`${p}-kasa-text-muted`} style={{ fontSize:11, margin:'8px 0 0', fontWeight:500 }}>
              Stok + Kasa + Yatırımlar + Alacaklar − Borçlar
            </p>
          </div>
        </div>

        {/* Kart 2 — Sanal Stok */}
        <div className="col-12 col-md-4">
          <div className={`${p}-kasa-kpi-card`}>
            <i className={`bi bi-box-seam ${p}-kasa-kpi-deco`} style={{ color:renkler.accent }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className={`${p}-kasa-icon-box`} style={{ background:hexRgba(renkler.accent, 0.12) }}><i className="bi bi-box-seam" style={{ color:renkler.accent, fontSize:17 }} /></div>
              <span className={`${p}-kasa-kpi-label`}>Hesaplanan Sanal Stok</span>
            </div>
            {sonKapanis ? (
              <div className={`financial-num ${p}-kasa-kpi-val`} style={{ textShadow:`0 0 20px ${hexRgba(renkler.accent, 0.2)}` }}>
                {TL(sonKapanis.sanal_stok)}
              </div>
            ) : (
              <div className={`${p}-kasa-text-muted`} style={{ fontSize:20, fontWeight:800 }}>—</div>
            )}
            <p className={`${p}-kasa-text-muted`} style={{ fontSize:11, margin:'8px 0 0', fontWeight:500 }}>
              Kâr marjı formülü ile hesaplanan tahmini depo
            </p>
          </div>
        </div>

        {/* Kart 3 — Yatırım Birikimi */}
        <div className="col-12 col-md-4">
          <div className={`${p}-kasa-kpi-card`}>
            <i className={`bi bi-safe2 ${p}-kasa-kpi-deco`} style={{ color:renkler.success }} />
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className={`${p}-kasa-icon-box`} style={{ background:hexRgba(renkler.success, 0.12) }}><i className="bi bi-safe2" style={{ color:renkler.success, fontSize:17 }} /></div>
              <span className={`${p}-kasa-kpi-label`}>Kenardaki Yatırım Birikimi</span>
            </div>
            {yatirimGuncelDeger > 0 ? (
              <div className={`financial-num ${p}-kasa-kpi-val`} style={{ textShadow:`0 0 20px ${hexRgba(renkler.success, 0.2)}` }}>
                {TL(yatirimGuncelDeger)}
              </div>
            ) : (
              <div className={`d-flex align-items-center gap-2 mt-1 ${p}-kasa-text-muted`}>
                <i className="bi bi-info-circle" style={{ fontSize:14 }} />
                <span style={{ fontSize:13, fontWeight:600 }}>Henüz fiyat girilmedi</span>
              </div>
            )}
            <p className={`${p}-kasa-text-muted`} style={{ fontSize:11, margin:'8px 0 0', fontWeight:500 }}>
              Döviz ve altın kasanızın güncel TL karşılığı
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          İKİNCİ SATIR — Ticaret (4'lü Grid)
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3 mb-4">
        <PerformansKarti label="Bu Ay Kestiğimiz" yeni={sonKapanis?.kesilen_fatura ?? 0} eski={onceki?.kesilen_fatura}
          renk={renkler.success} bg={hexRgba(renkler.success, 0.1)} ikon="bi-receipt" p={p} renkler={renkler} />
        <PerformansKarti label="Bu Ay Gelen Alış" yeni={sonKapanis?.gelen_alis ?? 0} eski={onceki?.gelen_alis}
          renk={renkler.accent} bg={hexRgba(renkler.accent, 0.1)} ikon="bi-truck" p={p} renkler={renkler} />
        <PerformansKarti label="Toplam Alacağımız" yeni={sonKapanis?.alacaklar ?? 0} eski={onceki?.alacaklar}
          renk={renkler.accent} bg={hexRgba(renkler.accent, 0.1)} ikon="bi-arrow-down-circle" p={p} renkler={renkler} />
        <PerformansKarti label="Toplam Borcumuz" yeni={sonKapanis?.borclar ?? 0} eski={onceki?.borclar}
          renk={renkler.danger} bg={hexRgba(renkler.danger, 0.1)} ikon="bi-arrow-up-circle" tersCevirim p={p} renkler={renkler} />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ÜÇÜNCÜ ALAN — Aksiyon Butonu + Aylık Büyüme Grafiği
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3 mb-4">

        {/* ── Aylık Büyüme Grafiği ── */}
        <div className="col-12">
          <div className={`${p}-kasa-glass-card`} style={{ padding:'20px 22px', height:'100%' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className={`${p}-kasa-icon-box-sm`} style={{ background:hexRgba(renkler.accent, 0.1) }}>
                <i className="bi bi-graph-up" style={{ color:renkler.accent, fontSize:14 }} />
              </div>
              <div>
                <span className={`${p}-kasa-text-primary`} style={{ fontSize:14, fontWeight:700 }}>Aylık Büyüme Grafiği</span>
                <p className={`mb-0 ${p}-kasa-text-muted`} style={{ fontSize:11 }}>Ay kapanışlarından hesaplanır</p>
              </div>
            </div>
            <BilancoGrafik kapanislar={kapanislar} renkler={renkler} p={p} />
          </div>
        </div>
      </div>

      {/* ─── Geçmiş Dönem Tablosu ─── */}
      <div className={`${p}-kasa-glass-card`} style={{ padding:0 }}>
        <div className="px-4 pt-4 pb-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ borderBottom:`1px solid ${hexRgba(renkler.text, 0.06)}` }}>
          <div>
            <span className={`${p}-kasa-text-primary`} style={{ fontSize:15, fontWeight:700 }}>Geçmiş Dönem Bilanço Kayıtları</span>
            <p className={`mb-0 ${p}-kasa-text-muted`} style={{ fontSize:12 }}>{filtrelendi.length} kayıt</p>
          </div>
          <div style={{ width:220, position:'relative' }}>
            <i className="bi bi-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:renkler.textSec, fontSize:13, pointerEvents:'none' }} />
            <input type="text" value={arama} onChange={e => { setArama(e.target.value); setSayfa(1) }}
              placeholder="Dönem filtrele..." className={`${p}-kasa-search`} />
          </div>
        </div>
        {/* ── Masaüstü Tablo ── */}
        <div className="table-responsive d-none d-md-block">
          <table className={`${p}-kasa-table`}>
            <thead>
              <tr style={{ background:hexRgba(renkler.text, 0.03) }}>
                {['Dönem (Ay)','Aylık Ciro','Kar Marjı','Sanal Stok','Net Varlık','İşlemler'].map((h,i) => (
                  <th key={i} style={{ fontWeight:700, color:renkler.textSec, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 16px', textAlign: (i===1||i===3||i===4) ? 'right' : (i===5 ? 'right' : 'left') }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sayfaliVeri.map(k => (
                <tr key={k.id}>
                  <td style={{ padding:'11px 16px' }}>
                    <span style={{ fontWeight:700, color:renkler.primary, fontSize:14 }}>{donemFmt(k.donem)}</span>
                    <span className={`${p}-kasa-text-muted`} style={{ fontSize:11, marginLeft:6 }}>{k.donem}</span>
                  </td>
                  <td className={`financial-num ${p}-kasa-text-primary`} style={{ textAlign:'right', fontWeight:700, fontSize:13, padding:'11px 16px', opacity:0.9 }}>{TL(k.kesilen_fatura)}</td>
                  <td style={{ padding:'11px 16px' }}>
                    <span className={`${p}-kasa-badge`} style={{ color:renkler.primary }}>
                      %{k.kar_marji}
                    </span>
                  </td>
                  <td className={`financial-num ${p}-kasa-text-accent`} style={{ textAlign:'right', fontWeight:700, fontSize:13, padding:'11px 16px' }}>{TL(k.sanal_stok)}</td>
                  <td className={`financial-num ${p}-kasa-text-accent`} style={{ textAlign:'right', fontWeight:800, fontSize:14, padding:'11px 16px' }}>{TL(k.net_varlik)}</td>
                  <td style={{ padding:'11px 16px', textAlign:'right', whiteSpace:'nowrap' }}>
                    {silOnayId === k.id ? (
                      <span className="d-inline-flex align-items-center gap-1">
                        <span style={{ fontSize:12, fontWeight:600, color:renkler.textSec, marginRight:2 }}>Emin misiniz?</span>
                        <button onClick={() => sil(k.id)} className={`${p}-kasa-sil-btn`}>Sil</button>
                        <button onClick={() => setSilOnayId(null)} className={`${p}-kasa-vazgec-btn`}>Vazgeç</button>
                      </span>
                    ) : (
                      <div className="d-flex gap-1 justify-content-end">
                        <button onClick={() => acDuzenle(k)}
                          style={{ background:'none', border:`1px solid ${hexRgba(renkler.text, 0.1)}`, borderRadius:10, width:44, height:44, padding:0, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor=renkler.accent; e.currentTarget.style.background=hexRgba(renkler.accent, 0.1) }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor=hexRgba(renkler.text, 0.1); e.currentTarget.style.background='none' }}>
                          <i className="bi bi-pencil" style={{ fontSize:13, color:renkler.accent }} />
                        </button>
                        <button onClick={() => setSilOnayId(k.id)}
                          style={{ background:hexRgba(renkler.danger, 0.08), border:`1px solid ${hexRgba(renkler.danger, 0.2)}`, borderRadius:10, width:44, height:44, padding:0, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'border-color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor=renkler.danger }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor=hexRgba(renkler.danger, 0.2) }}>
                          <i className="bi bi-trash3" style={{ fontSize:13, color:renkler.danger }} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {sayfaliVeri.length === 0 && (
                <tr><td colSpan={6} className={`${p}-kasa-text-muted`} style={{ textAlign:'center', padding:'32px', fontSize:14 }}>Kayıt bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobil Kart Listesi ── */}
        <div className="d-md-none">
          {sayfaliVeri.length === 0 && (
            <div className={`${p}-kasa-text-muted`} style={{ textAlign:'center', padding:'32px', fontSize:14 }}>Kayıt bulunamadı</div>
          )}
          {sayfaliVeri.map(k => (
            <div key={k.id} className="p-gg-mcard" style={{ borderBottom:`1px solid var(--p-border)` }}>
              {/* Üst: dönem adı + kar marjı */}
              <div className="p-gg-mcard-top mb-2">
                <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                  <span style={{ fontWeight:700, fontSize:15, color:renkler.primary }}>{donemFmt(k.donem)}</span>
                  <span style={{ fontSize:11, color:'var(--p-text-muted)' }}>{k.donem}</span>
                </div>
                <span className={`${p}-kasa-badge`} style={{ color:renkler.primary, flexShrink:0 }}>%{k.kar_marji}</span>
              </div>
              {/* Metrikler */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px', marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--p-text-muted)', marginBottom:1 }}>Aylık Ciro</div>
                  <div className="financial-num" style={{ fontSize:14, fontWeight:700, color:renkler.primary }}>{TL(k.kesilen_fatura)}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--p-text-muted)', marginBottom:1 }}>Net Varlık</div>
                  <div className="financial-num" style={{ fontSize:14, fontWeight:800, color:renkler.accent }}>{TL(k.net_varlik)}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--p-text-muted)', marginBottom:1 }}>Sanal Stok</div>
                  <div className="financial-num" style={{ fontSize:13, fontWeight:700, color:'var(--p-text-sec)' }}>{TL(k.sanal_stok)}</div>
                </div>
              </div>
              {/* Aksiyonlar */}
              <div className="p-gg-mcard-alt" style={{ paddingTop:10, marginTop:0 }}>
                {silOnayId === k.id ? (
                  <div className="d-flex align-items-center gap-2 w-100">
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--p-text-sec)', flex:1 }}>Emin misiniz?</span>
                    <button onClick={() => sil(k.id)} className={`${p}-kasa-sil-btn`}>Sil</button>
                    <button onClick={() => setSilOnayId(null)} className={`${p}-kasa-vazgec-btn`}>Vazgeç</button>
                  </div>
                ) : (
                  <div className="d-flex gap-2 w-100">
                    <button onClick={() => acDuzenle(k)}
                      style={{ flex:1, height:36, background:'none', border:`1.5px solid ${hexRgba(renkler.accent, 0.3)}`, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontSize:12, fontWeight:600, color:renkler.accent }}>
                      <i className="bi bi-pencil" style={{ fontSize:11 }} /> Düzenle
                    </button>
                    <button onClick={() => setSilOnayId(k.id)}
                      style={{ width:36, height:36, background:'none', border:`1.5px solid ${hexRgba(renkler.danger, 0.25)}`, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <i className="bi bi-trash3" style={{ fontSize:12, color:renkler.danger }} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sayfalama */}
        {toplamSayfa > 1 && (
          <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ borderTop:`1px solid ${hexRgba(renkler.text, 0.06)}` }}>
            <span className={`${p}-kasa-text-sec`} style={{ fontSize:13, fontWeight:600 }}>
              {(sayfa-1)*sayfaBasi+1}–{Math.min(sayfa*sayfaBasi, filtrelendi.length)} / {filtrelendi.length} kayıt
            </span>
            <div className="d-flex gap-2">
              <button onClick={() => setSayfa(s => Math.max(1,s-1))} disabled={sayfa===1}
                className={`${p}-kasa-sayfa-btn`}>
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: toplamSayfa }, (_,i) => i+1).map(pg => (
                <button key={pg} onClick={() => setSayfa(pg)}
                  className={`${p}-kasa-sayfa-btn`} style={{ background: pg===sayfa ? renkler.primary : 'transparent', color: pg===sayfa ? '#fff' : renkler.textSec, borderColor: pg===sayfa ? renkler.primary : hexRgba(renkler.text, 0.1) }}>
                  {pg}
                </button>
              ))}
              <button onClick={() => setSayfa(s => Math.min(toplamSayfa,s+1))} disabled={sayfa===toplamSayfa}
                className={`${p}-kasa-sayfa-btn`}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AyKapanisModal
        open={modalAcik} onClose={() => { setModalAcik(false); setDuzenlenenKapanis(null) }}
        kapanislar={kapanislar} onKaydet={kaydet}
        yatirimGuncelDeger={yatirimGuncelDeger}
        bankaBakiye={bankaBakiye}
        duzenlenen={duzenlenenKapanis}
        p={p} renkler={renkler}
      />

      {/* ── Mobil FAB ── */}
      <div className="p-fab-wrap">
        <button
          className="p-fab-btn"
          onClick={acEkle}
          type="button"
          aria-label="Ay kapanışı yap"
        >
          <span className="p-fab-btn-icon"><i className="bi bi-plus-lg" /></span>
        </button>
      </div>
    </div>
  )
}
