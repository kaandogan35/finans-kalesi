import { useState, useMemo, useEffect } from 'react'
import useTemaStore from '../../stores/temaStore'
import { temaRenkleri, hexRgba } from '../../lib/temaRenkleri'

const prefixMap = { paramgo: 'p' }

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────
function tarihFormat(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
}
function paraFormat(n) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(Number(n)||0)
}
function formatTutarInput(input) {
  let val = String(input).replace(/[^\d,]/g, '')
  const commaIdx = val.indexOf(',')
  if (commaIdx !== -1) {
    const intPart = val.substring(0, commaIdx)
    const decPart = val.substring(commaIdx + 1).replace(/,/g, '').substring(0, 2)
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + decPart
  }
  return val.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
function parseTutar(str) {
  if (!str) return 0
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0
}

// Bugünün tarihini dd.mm.yyyy formatında döndürür
const bugunTarih = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
}

// dd.mm.yyyy → yyyy-mm-dd (hesaplamalar için)
function displayToIso(str) {
  if (!str || str.length < 10) return ''
  const parts = str.split('.')
  if (parts.length !== 3 || parts[2].length < 4) return ''
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

// Tarih inputu masklama: kullanıcı yazarken otomatik gg.aa.yyyy formatına dönüştürür
function formatTarihInput(val) {
  let digits = val.replace(/\D/g, '').slice(0, 8)
  if (digits.length > 4) return digits.slice(0,2) + '.' + digits.slice(2,4) + '.' + digits.slice(4)
  if (digits.length > 2) return digits.slice(0,2) + '.' + digits.slice(2)
  return digits
}

let _id = 0
const yeniId = () => String(++_id)
const yeniFatura = () => ({ id: yeniId(), no: '', tutar: '', tarih: '' })
const yeniCek    = () => ({ id: yeniId(), aciklama: '', tutar: '', vadeTarih: '' })
const yeniBorc   = () => ({ id: yeniId(), aciklama: '', tutar: '', gun: '' })

const SEKMELER = [
  { key: 'fatura-ort', label: 'Fatura Ort. Tarihi',  icon: 'bi-receipt'     },
  { key: 'fazla-cek',  label: 'Fazla Çek Vadesi',    icon: 'bi-calculator'  },
  { key: 'portfoy',    label: 'Portföy Ort. Vadesi',  icon: 'bi-collection'  },
  { key: 'tek-cek',    label: 'Tek Çeke Bağlama',    icon: 'bi-link-45deg'  },
]

// ─── Yardımcı Alt Bileşenler ──────────────────────────────────────────────────
function SectionTitle({ p, label }) {
  return (
    <div className={`${p}-vade-section-title`}>
      <div className={`${p}-vade-section-bar`} />
      <span className={`${p}-vade-section-text`}>{label}</span>
    </div>
  )
}

function SectionTitleAlt({ p, label }) {
  return (
    <div className={`${p}-vade-section-title`}>
      <div className={`${p}-vade-section-bar-alt`} />
      <span className={`${p}-vade-section-text-alt`}>{label}</span>
    </div>
  )
}

function SectionTitlePurple({ p, label }) {
  return (
    <div className={`${p}-vade-section-title`}>
      <div className={`${p}-vade-section-bar-purple`} />
      <span className={`${p}-vade-section-text-purple`}>{label}</span>
    </div>
  )
}

function BeklePanel({ p, icon, mesaj }) {
  return (
    <div className={`${p}-vade-bekle`}>
      <i className={`bi ${icon} ${p}-vade-bekle-icon`} />
      <div className={`${p}-vade-bekle-title`}>Hesaplama Bekleniyor</div>
      <div className={`${p}-vade-bekle-msg`}>{mesaj}</div>
    </div>
  )
}

function KartBaslik({ p, icon, baslik, alt, variant }) {
  const cls = variant === 'alt' ? `${p}-vade-kart-baslik-icon-alt`
            : variant === 'purple' ? `${p}-vade-kart-baslik-icon-purple`
            : `${p}-vade-kart-baslik-icon`
  return (
    <div className={`${p}-vade-kart-baslik`}>
      <div className={cls}>
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div className={`${p}-vade-kart-baslik-title`}>{baslik}</div>
        <div className={`${p}-vade-kart-baslik-sub`}>{alt}</div>
      </div>
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function VadeHesaplayici() {
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'p'
  const renkler = temaRenkleri[aktifTema] || temaRenkleri.paramgo

  const [aktifSekme, setAktifSekme] = useState('fatura-ort')

  // Sekme 1
  const [s1RefTarih, setS1RefTarih]   = useState(bugunTarih())
  const [s1Vade, setS1Vade]           = useState('')
  const [s1Faturalar, setS1Faturalar] = useState([yeniFatura()])

  // Sekme 2
  const [s2Borc, setS2Borc]               = useState('')
  const [s2AnlasmaVade, setS2AnlasmaVade] = useState('')
  const [s2CekTutar, setS2CekTutar]       = useState('')

  // Sekme 3
  const [s3RefTarih, setS3RefTarih] = useState(bugunTarih())
  const [s3Cekler, setS3Cekler]     = useState([yeniCek()])

  // Sekme 4
  const [s4RefTarih, setS4RefTarih] = useState(bugunTarih())
  const [s4Borclar, setS4Borclar]   = useState([yeniBorc()])

  // ─── Yeni satır eklendikten sonra ilk inputa otomatik fokus ─────────────
  const [fokusId, setFokusId] = useState(null)
  useEffect(() => {
    if (!fokusId) return
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-focus-id="${fokusId}"]`)
      if (el) { el.focus(); el.select() }
      setFokusId(null)
    })
  }, [fokusId])

  // Enter tuşu ile yeni satır ekleme
  const handleSatirEnter = (e, ekleFn) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      ekleFn()
    }
  }

  // ─── Hesaplamalar ─────────────────────────────────────────────────────────
  const s1Sonuc = useMemo(() => {
    const refIso = displayToIso(s1RefTarih)
    if (!refIso || !s1Vade || Number(s1Vade) <= 0) return null
    const dolular = s1Faturalar.filter(f => f.tutar && f.tarih && f.tarih.length >= 10 && parseTutar(f.tutar) > 0)
    if (dolular.length === 0) return null
    const ref = new Date(refIso)
    let toplamTutar = 0, toplamAgirlik = 0
    const satirlar = []
    for (const f of dolular) {
      const fIso = displayToIso(f.tarih)
      if (!fIso) continue
      const gun = Math.round((new Date(fIso) - ref) / 86400000)
      if (gun < 0) return { hata: `"${f.no || f.tarih}" faturası için negatif gün farkı — fatura tarihi referans tarihinden önce olamaz` }
      const tutar = parseTutar(f.tutar)
      const agirlik = tutar * gun
      toplamTutar += tutar; toplamAgirlik += agirlik
      satirlar.push({ ...f, gun, agirlik, tutar })
    }
    if (toplamTutar === 0) return null
    const ortGun = Math.round(toplamAgirlik / toplamTutar)
    const ortTarih = new Date(ref); ortTarih.setDate(ortTarih.getDate() + ortGun)
    const cekVade  = new Date(ortTarih); cekVade.setDate(cekVade.getDate() + Number(s1Vade))
    return { satirlar, toplamTutar, toplamAgirlik, ortGun, ortTarih, cekVade }
  }, [s1RefTarih, s1Vade, s1Faturalar])

  const s2Sonuc = useMemo(() => {
    const borc = parseTutar(s2Borc), cek = parseTutar(s2CekTutar), vade = Number(s2AnlasmaVade)
    if (!borc || !cek || !vade || borc <= 0 || cek <= 0 || vade <= 0) return null
    const adilVade = Math.round((cek * vade) / borc)
    const adilTarih = new Date(); adilTarih.setDate(adilTarih.getDate() + adilVade)
    const fark = cek - borc
    let uyari = null
    if (Math.abs(fark) < 0.01) uyari = 'esit'
    else if (fark < 0) uyari = 'eksik'
    return { adilVade, adilTarih, fark, uyari, borcVadeDegeri: borc * vade }
  }, [s2Borc, s2AnlasmaVade, s2CekTutar])

  const s3Sonuc = useMemo(() => {
    const refIso = displayToIso(s3RefTarih)
    if (!refIso) return null
    const dolular = s3Cekler.filter(c => c.tutar && c.vadeTarih && c.vadeTarih.length >= 10 && parseTutar(c.tutar) > 0)
    if (dolular.length === 0) return null
    const ref = new Date(refIso)
    let toplamTutar = 0, toplamAgirlik = 0
    const satirlar = []
    for (const c of dolular) {
      const cIso = displayToIso(c.vadeTarih)
      if (!cIso) continue
      const gun = Math.round((new Date(cIso) - ref) / 86400000)
      if (gun < 0) return { hata: 'Bir veya daha fazla çekin vade tarihi referans tarihinden önce — negatif gün farkı oluştu' }
      const tutar = parseTutar(c.tutar)
      const agirlik = tutar * gun
      toplamTutar += tutar; toplamAgirlik += agirlik
      satirlar.push({ ...c, gun, agirlik, tutar })
    }
    if (toplamTutar === 0) return null
    const basitOrt    = Math.round(satirlar.reduce((a, c) => a + c.gun, 0) / satirlar.length)
    const agirlikliOrt = Math.round(toplamAgirlik / toplamTutar)
    const ortVade     = new Date(ref); ortVade.setDate(ortVade.getDate() + agirlikliOrt)
    const tarihler    = dolular.map(c => new Date(displayToIso(c.vadeTarih)).getTime())
    const enErken     = new Date(Math.min(...tarihler))
    const enGec       = new Date(Math.max(...tarihler))
    return { satirlar, toplamTutar, toplamAgirlik, basitOrt, agirlikliOrt, ortVade, enErken, enGec }
  }, [s3RefTarih, s3Cekler])

  const s4Sonuc = useMemo(() => {
    const refIso = displayToIso(s4RefTarih)
    if (!refIso) return null
    const dolular = s4Borclar.filter(b => b.tutar && b.gun !== '' && parseTutar(b.tutar) > 0 && Number(b.gun) >= 0)
    if (dolular.length === 0) return null
    let toplamBorc = 0, toplamAgirlik = 0
    const satirlar = dolular.map(b => {
      const tutar = parseTutar(b.tutar), gun = Number(b.gun)
      const agirlik = tutar * gun
      toplamBorc += tutar; toplamAgirlik += agirlik
      return { ...b, tutar, gun, agirlik }
    })
    if (toplamBorc === 0) return null
    const adilVade  = Math.round(toplamAgirlik / toplamBorc)
    const vadeTarih = new Date(refIso); vadeTarih.setDate(vadeTarih.getDate() + adilVade)
    const gunler    = dolular.map(b => Number(b.gun))
    const enErkenGun = Math.min(...gunler), enGecGun = Math.max(...gunler)
    const enErken   = new Date(refIso); enErken.setDate(enErken.getDate() + enErkenGun)
    const enGec     = new Date(refIso); enGec.setDate(enGec.getDate() + enGecGun)
    return { satirlar, toplamBorc, toplamAgirlik, adilVade, vadeTarih, enErken, enGec, enErkenGun, enGecGun }
  }, [s4RefTarih, s4Borclar])

  // ─── Satır Yönetimi ───────────────────────────────────────────────────────
  const s1Ekle = () => { const y = yeniFatura(); setS1Faturalar(prev => [...prev, y]); setFokusId(y.id) }
  const s1Sil  = id  => setS1Faturalar(prev => prev.length > 1 ? prev.filter(f => f.id !== id) : prev)
  const s1Set  = (id,k,v) => setS1Faturalar(prev => prev.map(f => f.id===id ? {...f,[k]:v} : f))

  const s3Ekle = () => { const y = yeniCek(); setS3Cekler(prev => [...prev, y]); setFokusId(y.id) }
  const s3Sil  = id  => setS3Cekler(prev => prev.length > 1 ? prev.filter(c => c.id !== id) : prev)
  const s3Set  = (id,k,v) => setS3Cekler(prev => prev.map(c => c.id===id ? {...c,[k]:v} : c))

  const s4Ekle = () => { const y = yeniBorc(); setS4Borclar(prev => [...prev, y]); setFokusId(y.id) }
  const s4Sil  = id  => setS4Borclar(prev => prev.length > 1 ? prev.filter(b => b.id !== id) : prev)
  const s4Set  = (id,k,v) => setS4Borclar(prev => prev.map(b => b.id===id ? {...b,[k]:v} : b))

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`${p}-vade-page`}>

      {/* Sayfa Başlığı */}
      <div className={`${p}-page-header`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon`}>
            <i className="bi bi-calculator-fill" />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>Vade Hesaplayıcı</h1>
            <p className={`${p}-page-sub`}>Ağırlıklı ortalama vade ve çek tarihi hesaplamaları</p>
          </div>
        </div>
      </div>

      {/* Tab Sistemi */}
      <div className={`${p}-vade-tab-container`}>
        {SEKMELER.map(s => (
          <button key={s.key} className={`${p}-vade-tab${aktifSekme===s.key?' active':''}`} onClick={() => setAktifSekme(s.key)}>
            <i className={`bi ${s.icon}`} style={{ fontSize:14, flexShrink:0 }} />
            <span className={`${p}-vade-tab-label`}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SEKME 1 — Fatura Ortalama Tarihi & Çek Vadesi
      ══════════════════════════════════════════════════════════════════════ */}
      {aktifSekme === 'fatura-ort' && (
        <div className={`row g-3 ${p}-vade-animate`}>
          {/* Sol: Giriş */}
          <div className="col-lg-6">
            <div className={`${p}-vade-card h-100`}>
              <KartBaslik p={p} icon="bi-receipt" baslik="Fatura Bilgileri" alt="Ağırlıklı ortalama fatura tarihini hesapla" />
              <div style={{ padding:20 }}>
                <SectionTitle p={p} label="Referans Bilgileri" />
                <div className="row g-3 mb-4">
                  <div className="col-sm-6">
                    <label className={`${p}-vade-label`}>Referans Tarihi</label>
                    <input type="text" inputMode="numeric" className={`${p}-vade-input`} placeholder="gg.aa.yyyy" value={s1RefTarih} onChange={e => setS1RefTarih(formatTarihInput(e.target.value))} />
                  </div>
                  <div className="col-sm-6">
                    <label className={`${p}-vade-label`}>Anlaşma Vadesi (Gün)</label>
                    <input type="number" className={`${p}-vade-input`} placeholder="180" min="1" value={s1Vade} onChange={e => setS1Vade(e.target.value)} />
                  </div>
                </div>

                <SectionTitleAlt p={p} label={`Fatura Listesi (${s1Faturalar.length} adet)`} />
                <div className="table-responsive mb-3">
                  <table className={`${p}-vade-input-table`}>
                    <thead>
                      <tr>
                        <th className={`${p}-vade-th`} style={{ width:'30%' }}>Fatura No</th>
                        <th className={`${p}-vade-th`} style={{ width:'28%' }}>Tutar (₺)</th>
                        <th className={`${p}-vade-th`} style={{ width:'30%' }}>Tarih</th>
                        <th style={{ width:36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {s1Faturalar.map(f => (
                        <tr key={f.id}>
                          <td style={{ padding:'0 6px 4px 0' }}><input data-focus-id={f.id} type="text" className={`${p}-vade-input-sm`} placeholder="F-001" value={f.no} onChange={e => s1Set(f.id,'no',e.target.value)} onKeyDown={e => handleSatirEnter(e, s1Ekle)} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="text" inputMode="decimal" className={`${p}-vade-input-sm`} placeholder="0,00" value={f.tutar} onChange={e => s1Set(f.id,'tutar',formatTutarInput(e.target.value))} onKeyDown={e => handleSatirEnter(e, s1Ekle)} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="text" inputMode="numeric" className={`${p}-vade-input-sm`} placeholder="gg.aa.yyyy" value={f.tarih} onChange={e => s1Set(f.id,'tarih',formatTarihInput(e.target.value))} onKeyDown={e => handleSatirEnter(e, s1Ekle)} /></td>
                          <td style={{ padding:'0 0 4px 6px' }}>
                            <button className={`${p}-vade-sil-btn`} onClick={() => s1Sil(f.id)} title="Satırı sil">
                              <i className="bi bi-trash3" style={{ fontSize:12 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className={`${p}-vade-ekle-btn`} onClick={s1Ekle}>
                  <i className="bi bi-plus-circle" style={{ fontSize:15 }} />Satır Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Sağ: Sonuçlar */}
          <div className="col-lg-6">
            <div className={`${p}-vade-card h-100`}>
              <KartBaslik p={p} icon="bi-graph-up" baslik="Hesap Sonuçları" alt="Gerçek zamanlı hesaplama" />
              <div style={{ padding:20 }}>
                {!s1Sonuc && <BeklePanel p={p} icon="bi-receipt" mesaj="Referans tarihi, anlaşma vadesi ve en az 1 fatura girin" />}
                {s1Sonuc?.hata && (
                  <div className={`${p}-vade-hata`}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize:18, flexShrink:0, marginTop:1 }} />
                    <span>{s1Sonuc.hata}</span>
                  </div>
                )}
                {s1Sonuc && !s1Sonuc.hata && (
                  <>
                    <SectionTitleAlt p={p} label="Detay Tablosu" />
                    <div className="table-responsive mb-4">
                      <table className={`${p}-vade-table`} style={{ minWidth:420 }}>
                        <thead>
                          <tr>
                            <th>#</th><th>Fatura No</th>
                            <th style={{ textAlign:'right' }}>Tutar (₺)</th>
                            <th style={{ textAlign:'right' }}>Vade Gün</th>
                            <th style={{ textAlign:'right' }}>Tutar × Gün</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s1Sonuc.satirlar.map((f,i) => (
                            <tr key={f.id}>
                              <td className={`${p}-vade-td-muted`}>{i+1}</td>
                              <td className={`${p}-vade-td-sec`}>{f.no||'—'}</td>
                              <td className={`${p}-vade-num financial-num ${p}-vade-td-success`} style={{ textAlign:'right' }}>{paraFormat(f.tutar)}</td>
                              <td className={`${p}-vade-num`} style={{ textAlign:'right' }}>{f.gun}</td>
                              <td className={`${p}-vade-num financial-num ${p}-vade-td-accent`} style={{ textAlign:'right' }}>{paraFormat(f.agirlik)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={2} className={`${p}-vade-tfoot-label`}>TOPLAM</td>
                            <td className={`${p}-vade-num financial-num ${p}-vade-td-success`} style={{ textAlign:'right', fontWeight:700 }}>{paraFormat(s1Sonuc.toplamTutar)}</td>
                            <td></td>
                            <td className={`${p}-vade-num financial-num ${p}-vade-td-accent`} style={{ textAlign:'right', fontWeight:700 }}>{paraFormat(s1Sonuc.toplamAgirlik)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <SectionTitle p={p} label="Hesap Özeti" />
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>Ağırlıklı Ort. Gün</div>
                          <div className={`${p}-vade-result-big-num`}>{s1Sonuc.ortGun}</div>
                          <div className={`${p}-vade-result-unit`}>gün</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>Ort. Fatura Tarihi</div>
                          <div className={`${p}-vade-result-date`}>{tarihFormat(s1Sonuc.ortTarih)}</div>
                        </div>
                      </div>
                    </div>
                    <div className={`${p}-vade-result-main`}>
                      <div className={`${p}-vade-result-main-label`}>
                        <i className="bi bi-calendar-check me-1" />Çek Vade Tarihi
                      </div>
                      <div className={`${p}-vade-result-hero`}>{tarihFormat(s1Sonuc.cekVade)}</div>
                      <div className={`${p}-vade-result-hint`}>Ortalama fatura tarihi + {s1Vade} gün anlaşma vadesi</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SEKME 2 — Fazla Çek Verince Adil Vade
      ══════════════════════════════════════════════════════════════════════ */}
      {aktifSekme === 'fazla-cek' && (
        <div className={`row g-3 ${p}-vade-animate`}>
          {/* Sol: Giriş */}
          <div className="col-lg-5">
            <div className={`${p}-vade-card h-100`}>
              <KartBaslik p={p} icon="bi-calculator" baslik="Giriş Bilgileri" alt="Borç, vade ve çek tutarını girin" />
              <div style={{ padding:20 }}>
                <SectionTitle p={p} label="Borç & Çek Bilgileri" />
                <div className="mb-3">
                  <label className={`${p}-vade-label`}>Borç Tutarı (₺)</label>
                  <input type="text" inputMode="decimal" className={`${p}-vade-input`} placeholder="50.000,00" value={s2Borc} onChange={e => setS2Borc(formatTutarInput(e.target.value))} />
                </div>
                <div className="mb-3">
                  <label className={`${p}-vade-label`}>Anlaşma Vadesi (Gün)</label>
                  <input type="number" className={`${p}-vade-input`} placeholder="180" min="1" value={s2AnlasmaVade} onChange={e => setS2AnlasmaVade(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className={`${p}-vade-label`}>Verilecek Çek Tutarı (₺)</label>
                  <input type="text" inputMode="decimal" className={`${p}-vade-input`} placeholder="60.000,00" value={s2CekTutar} onChange={e => setS2CekTutar(formatTutarInput(e.target.value))} />
                </div>
                <div className={`${p}-vade-formul-box`}>
                  <div className={`${p}-vade-formul-label`}>
                    <i className="bi bi-info-circle me-1" />Formül
                  </div>
                  <div className={`${p}-vade-formul-text`}>
                    Adil Vade = (Çek Tutarı × Anlaşma Vadesi) ÷ Borç Tutarı
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: Sonuçlar */}
          <div className="col-lg-7">
            <div className={`${p}-vade-card h-100`}>
              <KartBaslik p={p} icon="bi-graph-up" baslik="Hesap Sonuçları" alt="Gerçek zamanlı hesaplama" />
              <div style={{ padding:20 }}>
                {!s2Sonuc && <BeklePanel p={p} icon="bi-calculator" mesaj="Borç tutarı, anlaşma vadesi ve çek tutarını girin" />}
                {s2Sonuc && (
                  <>
                    {s2Sonuc.uyari === 'esit' && (
                      <div className={`${p}-vade-uyari-yesil mb-3`}>
                        <i className="bi bi-check-circle-fill" style={{ fontSize:18, flexShrink:0, marginTop:1 }} />
                        <span>Çek tutarı borç tutarına eşit — anlaşma vadesi zaten adil vadedir, ek hesap gerekmez</span>
                      </div>
                    )}
                    {s2Sonuc.uyari === 'eksik' && (
                      <div className={`${p}-vade-uyari mb-3`}>
                        <i className="bi bi-exclamation-triangle-fill" style={{ fontSize:18, flexShrink:0, marginTop:1 }} />
                        <span>Eksik çek veriyorsunuz — hesaplanan vade kısalır, alacaklı için dezavantajlıdır</span>
                      </div>
                    )}

                    <SectionTitleAlt p={p} label="Hesaplama Detayı" />
                    <div className="row g-2 mb-4">
                      <div className="col-sm-4">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>Borç Tutarı</div>
                          <div className={`${p}-vade-result-date financial-num ${p}-vade-td-danger`}>₺{paraFormat(parseTutar(s2Borc))}</div>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>Çek Tutarı</div>
                          <div className={`${p}-vade-result-date financial-num ${p}-vade-td-success`}>₺{paraFormat(parseTutar(s2CekTutar))}</div>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>Fark</div>
                          <div className={`${p}-vade-result-date financial-num ${s2Sonuc.fark >= 0 ? `${p}-vade-td-success` : `${p}-vade-td-danger`}`}>
                            {s2Sonuc.fark >= 0 ? '+' : ''}₺{paraFormat(Math.abs(s2Sonuc.fark))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <SectionTitle p={p} label="Sonuç" />
                    <div className="row g-2">
                      <div className="col-sm-5">
                        <div className={`${p}-vade-result-main`} style={{ height:'100%' }}>
                          <div className={`${p}-vade-result-main-label`}>
                            <i className="bi bi-calendar-week me-1" />Adil Vade
                          </div>
                          <div className={`${p}-vade-result-hero-lg`}>{s2Sonuc.adilVade}</div>
                          <div className={`${p}-vade-result-hint`} style={{ fontSize:13 }}>gün</div>
                        </div>
                      </div>
                      <div className="col-sm-7">
                        <div className={`${p}-vade-result-secondary d-flex flex-column justify-content-center`} style={{ height:'100%' }}>
                          <div className={`${p}-vade-result-label`}>Adil Vade Tarihi</div>
                          <div className={`${p}-vade-result-date-lg`}>{tarihFormat(s2Sonuc.adilTarih)}</div>
                          <div className={`${p}-vade-result-hint`}>Bugünden {s2Sonuc.adilVade} gün sonra</div>
                          <div className={`${p}-vade-divider`} />
                          <div className={`${p}-vade-result-hint`}>
                            Borç × Vade değeri:{' '}
                            <span className={`${p}-vade-num financial-num ${p}-vade-inline-val`}>{paraFormat(s2Sonuc.borcVadeDegeri)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SEKME 3 — Çek Portföyü Ortalama Vadesi
      ══════════════════════════════════════════════════════════════════════ */}
      {aktifSekme === 'portfoy' && (
        <div className={`row g-3 ${p}-vade-animate`}>
          {/* Sol: Giriş */}
          <div className="col-lg-6">
            <div className={`${p}-vade-card h-100`}>
              <KartBaslik p={p} icon="bi-collection" baslik="Çek Portföyü" alt="Portföyün ağırlıklı ortalama vadesi" variant="alt" />
              <div style={{ padding:20 }}>
                <SectionTitle p={p} label="Referans Tarihi" />
                <div className="mb-4">
                  <label className={`${p}-vade-label`}>Referans Tarihi (genellikle bugün)</label>
                  <input type="text" inputMode="numeric" className={`${p}-vade-input`} placeholder="gg.aa.yyyy" value={s3RefTarih} onChange={e => setS3RefTarih(formatTarihInput(e.target.value))} />
                </div>

                <SectionTitleAlt p={p} label={`Çekler (${s3Cekler.length} adet)`} />
                <div className="table-responsive mb-3">
                  <table className={`${p}-vade-input-table`}>
                    <thead>
                      <tr>
                        <th className={`${p}-vade-th`} style={{ width:'30%' }}>Açıklama</th>
                        <th className={`${p}-vade-th`} style={{ width:'28%' }}>Tutar (₺)</th>
                        <th className={`${p}-vade-th`} style={{ width:'30%' }}>Vade Tarihi</th>
                        <th style={{ width:36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {s3Cekler.map(c => (
                        <tr key={c.id}>
                          <td style={{ padding:'0 6px 4px 0' }}><input data-focus-id={c.id} type="text" className={`${p}-vade-input-sm`} placeholder="Açıklama" value={c.aciklama} onChange={e => s3Set(c.id,'aciklama',e.target.value)} onKeyDown={e => handleSatirEnter(e, s3Ekle)} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="text" inputMode="decimal" className={`${p}-vade-input-sm`} placeholder="0,00" value={c.tutar} onChange={e => s3Set(c.id,'tutar',formatTutarInput(e.target.value))} onKeyDown={e => handleSatirEnter(e, s3Ekle)} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="text" inputMode="numeric" className={`${p}-vade-input-sm`} placeholder="gg.aa.yyyy" value={c.vadeTarih} onChange={e => s3Set(c.id,'vadeTarih',formatTarihInput(e.target.value))} onKeyDown={e => handleSatirEnter(e, s3Ekle)} /></td>
                          <td style={{ padding:'0 0 4px 6px' }}>
                            <button className={`${p}-vade-sil-btn`} onClick={() => s3Sil(c.id)} title="Satırı sil">
                              <i className="bi bi-trash3" style={{ fontSize:12 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className={`${p}-vade-ekle-btn`} onClick={s3Ekle}>
                  <i className="bi bi-plus-circle" style={{ fontSize:15 }} />Çek Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Sağ: Sonuçlar */}
          <div className="col-lg-6">
            <div className={`${p}-vade-card h-100`}>
              <KartBaslik p={p} icon="bi-graph-up" baslik="Portföy Analizi" alt="Gerçek zamanlı hesaplama" />
              <div style={{ padding:20 }}>
                {!s3Sonuc && <BeklePanel p={p} icon="bi-collection" mesaj="Referans tarihi ve en az 1 çek bilgisi girin" />}
                {s3Sonuc?.hata && (
                  <div className={`${p}-vade-hata`}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize:18, flexShrink:0, marginTop:1 }} />
                    <span>{s3Sonuc.hata}</span>
                  </div>
                )}
                {s3Sonuc && !s3Sonuc.hata && (
                  <>
                    <SectionTitleAlt p={p} label="Detay Tablosu" />
                    <div className="table-responsive mb-4">
                      <table className={`${p}-vade-table`} style={{ minWidth:380 }}>
                        <thead>
                          <tr>
                            <th>#</th><th>Açıklama</th>
                            <th style={{ textAlign:'right' }}>Tutar (₺)</th>
                            <th style={{ textAlign:'right' }}>Vade Gün</th>
                            <th style={{ textAlign:'right' }}>Tutar × Gün</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s3Sonuc.satirlar.map((c,i) => (
                            <tr key={c.id}>
                              <td className={`${p}-vade-td-muted`}>{i+1}</td>
                              <td className={`${p}-vade-td-sec`}>{c.aciklama||'—'}</td>
                              <td className={`${p}-vade-num financial-num ${p}-vade-td-success`} style={{ textAlign:'right' }}>{paraFormat(c.tutar)}</td>
                              <td className={`${p}-vade-num`} style={{ textAlign:'right' }}>{c.gun}</td>
                              <td className={`${p}-vade-num financial-num ${p}-vade-td-accent`} style={{ textAlign:'right' }}>{paraFormat(c.agirlik)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={2} className={`${p}-vade-tfoot-label`}>TOPLAM</td>
                            <td className={`${p}-vade-num financial-num ${p}-vade-td-success`} style={{ textAlign:'right', fontWeight:700 }}>{paraFormat(s3Sonuc.toplamTutar)}</td>
                            <td></td>
                            <td className={`${p}-vade-num financial-num ${p}-vade-td-accent`} style={{ textAlign:'right', fontWeight:700 }}>{paraFormat(s3Sonuc.toplamAgirlik)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>En Erken Vade</div>
                          <div className={`${p}-vade-result-date-sm ${p}-vade-td-success`}>{tarihFormat(s3Sonuc.enErken)}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>En Geç Vade</div>
                          <div className={`${p}-vade-result-date-sm ${p}-vade-td-danger`}>{tarihFormat(s3Sonuc.enGec)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>Basit Ort. (referans)</div>
                          <div className={`${p}-vade-result-big-num ${p}-vade-td-muted-num`}>{s3Sonuc.basitOrt}</div>
                          <div className={`${p}-vade-result-unit-muted`}>gün — yanlış yöntem</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>Ağırlıklı Ort. (doğru)</div>
                          <div className={`${p}-vade-result-big-num ${p}-vade-td-accent`}>{s3Sonuc.agirlikliOrt}</div>
                          <div className={`${p}-vade-result-unit`}>gün</div>
                        </div>
                      </div>
                    </div>

                    <div className={`${p}-vade-result-main`}>
                      <div className={`${p}-vade-result-main-label`}>
                        <i className="bi bi-calendar-check me-1" />Portföy Ortalama Vade Tarihi
                      </div>
                      <div className={`${p}-vade-result-hero`}>{tarihFormat(s3Sonuc.ortVade)}</div>
                      <div className={`${p}-vade-result-hint`}>Referans tarihi + {s3Sonuc.agirlikliOrt} gün ağırlıklı ortalama</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SEKME 4 — Birden Fazla Borcu Tek Çeke Bağlama
      ══════════════════════════════════════════════════════════════════════ */}
      {aktifSekme === 'tek-cek' && (
        <div className={`row g-3 ${p}-vade-animate`}>
          {/* Sol: Giriş */}
          <div className="col-lg-6">
            <div className={`${p}-vade-card h-100`}>
              <KartBaslik p={p} icon="bi-link-45deg" baslik="Borç Listesi" alt="Farklı vadelerdeki borçları tek çeke bağla" variant="purple" />
              <div style={{ padding:20 }}>
                <SectionTitle p={p} label="Referans Tarihi" />
                <div className="mb-4">
                  <label className={`${p}-vade-label`}>Referans Tarihi (genellikle bugün)</label>
                  <input type="text" inputMode="numeric" className={`${p}-vade-input`} placeholder="gg.aa.yyyy" value={s4RefTarih} onChange={e => setS4RefTarih(formatTarihInput(e.target.value))} />
                </div>

                <SectionTitlePurple p={p} label={`Borçlar (${s4Borclar.length} adet)`} />
                <div className="table-responsive mb-3">
                  <table className={`${p}-vade-input-table`}>
                    <thead>
                      <tr>
                        <th className={`${p}-vade-th`} style={{ width:'32%' }}>Açıklama</th>
                        <th className={`${p}-vade-th`} style={{ width:'30%' }}>Borç (₺)</th>
                        <th className={`${p}-vade-th`} style={{ width:'26%' }}>Kalan Gün</th>
                        <th style={{ width:36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {s4Borclar.map(b => (
                        <tr key={b.id}>
                          <td style={{ padding:'0 6px 4px 0' }}><input data-focus-id={b.id} type="text" className={`${p}-vade-input-sm`} placeholder="Tedarikçi A" value={b.aciklama} onChange={e => s4Set(b.id,'aciklama',e.target.value)} onKeyDown={e => handleSatirEnter(e, s4Ekle)} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="text" inputMode="decimal" className={`${p}-vade-input-sm`} placeholder="0,00" value={b.tutar} onChange={e => s4Set(b.id,'tutar',formatTutarInput(e.target.value))} onKeyDown={e => handleSatirEnter(e, s4Ekle)} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="number" className={`${p}-vade-input-sm`} placeholder="30" min="0" value={b.gun} onChange={e => s4Set(b.id,'gun',e.target.value)} onKeyDown={e => handleSatirEnter(e, s4Ekle)} /></td>
                          <td style={{ padding:'0 0 4px 6px' }}>
                            <button className={`${p}-vade-sil-btn`} onClick={() => s4Sil(b.id)} title="Satırı sil">
                              <i className="bi bi-trash3" style={{ fontSize:12 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className={`${p}-vade-ekle-btn`} onClick={s4Ekle}>
                  <i className="bi bi-plus-circle" style={{ fontSize:15 }} />Borç Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Sağ: Sonuçlar */}
          <div className="col-lg-6">
            <div className={`${p}-vade-card h-100`}>
              <KartBaslik p={p} icon="bi-graph-up" baslik="Tek Çek Hesabı" alt="Gerçek zamanlı hesaplama" />
              <div style={{ padding:20 }}>
                {!s4Sonuc && <BeklePanel p={p} icon="bi-link-45deg" mesaj="Referans tarihi ve en az 1 borç bilgisi girin" />}
                {s4Sonuc && (
                  <>
                    <SectionTitlePurple p={p} label="Detay Tablosu" />
                    <div className="table-responsive mb-4">
                      <table className={`${p}-vade-table`} style={{ minWidth:380 }}>
                        <thead>
                          <tr>
                            <th>#</th><th>Açıklama</th>
                            <th style={{ textAlign:'right' }}>Borç (₺)</th>
                            <th style={{ textAlign:'right' }}>Kalan Gün</th>
                            <th style={{ textAlign:'right' }}>Borç × Gün</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s4Sonuc.satirlar.map((b,i) => (
                            <tr key={b.id}>
                              <td className={`${p}-vade-td-muted`}>{i+1}</td>
                              <td className={`${p}-vade-td-sec`}>{b.aciklama||'—'}</td>
                              <td className={`${p}-vade-num financial-num ${p}-vade-td-danger`} style={{ textAlign:'right' }}>{paraFormat(b.tutar)}</td>
                              <td className={`${p}-vade-num`} style={{ textAlign:'right' }}>{b.gun}</td>
                              <td className={`${p}-vade-num financial-num ${p}-vade-td-accent`} style={{ textAlign:'right' }}>{paraFormat(b.agirlik)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={2} className={`${p}-vade-tfoot-label`}>TOPLAM</td>
                            <td className={`${p}-vade-num financial-num ${p}-vade-td-danger`} style={{ textAlign:'right', fontWeight:700 }}>{paraFormat(s4Sonuc.toplamBorc)}</td>
                            <td></td>
                            <td className={`${p}-vade-num financial-num ${p}-vade-td-accent`} style={{ textAlign:'right', fontWeight:700 }}>{paraFormat(s4Sonuc.toplamAgirlik)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>En Erken Vade</div>
                          <div className={`${p}-vade-result-date-sm ${p}-vade-td-success`}>{tarihFormat(s4Sonuc.enErken)}</div>
                          <div className={`${p}-vade-result-unit`}>{s4Sonuc.enErkenGun} gün</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className={`${p}-vade-result-secondary`}>
                          <div className={`${p}-vade-result-label`}>En Geç Vade</div>
                          <div className={`${p}-vade-result-date-sm ${p}-vade-td-danger`}>{tarihFormat(s4Sonuc.enGec)}</div>
                          <div className={`${p}-vade-result-unit`}>{s4Sonuc.enGecGun} gün</div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-sm-5">
                        <div className={`${p}-vade-result-main`} style={{ height:'100%' }}>
                          <div className={`${p}-vade-result-main-label`}>
                            <i className="bi bi-calendar-week me-1" />Adil Vade
                          </div>
                          <div className={`${p}-vade-result-hero-lg`}>{s4Sonuc.adilVade}</div>
                          <div className={`${p}-vade-result-hint`} style={{ fontSize:13 }}>gün</div>
                        </div>
                      </div>
                      <div className="col-sm-7">
                        <div className={`${p}-vade-result-secondary d-flex flex-column justify-content-center`} style={{ height:'100%' }}>
                          <div className={`${p}-vade-result-label`}>Tek Çek Vade Tarihi</div>
                          <div className={`${p}-vade-result-date-lg`}>{tarihFormat(s4Sonuc.vadeTarih)}</div>
                          <div className={`${p}-vade-result-hint`}>Referans tarihi + {s4Sonuc.adilVade} gün</div>
                          <div className={`${p}-vade-divider`} />
                          <div className={`${p}-vade-result-hint`}>
                            Toplam Borç:{' '}
                            <span className={`${p}-vade-num financial-num ${p}-vade-td-danger`} style={{ fontWeight:700 }}>₺{paraFormat(s4Sonuc.toplamBorc)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
