import { useState, useMemo } from 'react'

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────
function tarihFormat(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
}
function paraFormat(n) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(Number(n)||0)
}
// Tutar input formatlama: kullanıcı yazarken "100.000,50" formatına dönüştürür
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
// Türkçe formatlı string'i hesaplama için sayıya çevirir: "100.000,50" → 100000.50
function parseTutar(str) {
  if (!str) return 0
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0
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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
  .vade-page * { box-sizing: border-box; font-family: 'Outfit', sans-serif; }

  .vade-tab-container {
    display: flex; gap: 4px; padding: 4px;
    background: rgba(255,255,255,0.04);
    border-radius: 12px; overflow-x: auto;
    border: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 24px; scrollbar-width: none;
  }
  .vade-tab-container::-webkit-scrollbar { display: none; }

  .vade-tab {
    padding: 10px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.45);
    background: transparent; border: 1px solid transparent;
    cursor: pointer; min-height: 44px; white-space: nowrap;
    display: flex; align-items: center; gap: 8px;
    transition: all 0.18s ease;
  }
  .vade-tab:hover { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.04); }
  .vade-tab.active { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.18); color: #f59e0b; font-weight: 600; }

  .vade-card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; overflow: hidden;
  }

  .vade-input, .vade-select {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; color: #fff; min-height: 44px;
    padding: 10px 14px; font-size: 14px; width: 100%;
    transition: all 0.15s;
  }
  .vade-input:focus, .vade-select:focus {
    outline: none; border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
    background: rgba(255,255,255,0.07);
  }
  .vade-input::placeholder { color: rgba(255,255,255,0.25); }
  .vade-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }

  .vade-input-sm {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px; color: #fff; min-height: 38px;
    padding: 6px 10px; font-size: 13px; width: 100%; transition: all 0.15s;
  }
  .vade-input-sm:focus { outline: none; border-color: rgba(245,158,11,0.5); background: rgba(255,255,255,0.07); }
  .vade-input-sm::placeholder { color: rgba(255,255,255,0.2); }
  .vade-input-sm[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }

  .vade-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 6px; display: block; }

  .vade-table { width: 100%; border-collapse: separate; border-spacing: 0; }
  .vade-table thead th {
    font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.4);
    text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left; white-space: nowrap;
  }
  .vade-table tbody td { font-size: 13px; color: rgba(255,255,255,0.7); padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
  .vade-table tbody tr:last-child td { border-bottom: none; }
  .vade-table tbody tr:hover { background: rgba(255,255,255,0.02); }
  .vade-table .num { font-family: 'Inter', sans-serif; font-weight: 600; }
  .vade-table tfoot td { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.55); padding: 9px 12px; border-top: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); }

  .vade-sil-btn {
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
    color: rgba(239,68,68,0.7); border-radius: 7px; width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; flex-shrink: 0;
  }
  .vade-sil-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }

  .vade-ekle-btn {
    background: rgba(245,158,11,0.06); border: 1px dashed rgba(245,158,11,0.25);
    color: rgba(245,158,11,0.7); border-radius: 10px;
    padding: 10px 16px; min-height: 44px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; gap: 8px; width: 100%;
  }
  .vade-ekle-btn:hover { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.4); color: #f59e0b; }

  .vade-result-main {
    background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05));
    border: 2px solid rgba(245,158,11,0.3); border-radius: 16px; padding: 20px 24px;
  }
  .vade-result-secondary {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px; padding: 14px 18px;
  }

  .vade-hata {
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 12px; padding: 14px 18px;
    display: flex; align-items: flex-start; gap: 10px;
    color: #f87171; font-size: 13px; font-weight: 500;
  }
  .vade-uyari {
    background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.2);
    border-radius: 12px; padding: 14px 18px;
    display: flex; align-items: flex-start; gap: 10px;
    color: #fbbf24; font-size: 13px; font-weight: 500;
  }
  .vade-uyari-yesil {
    background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.2);
    border-radius: 12px; padding: 14px 18px;
    display: flex; align-items: flex-start; gap: 10px;
    color: #34d399; font-size: 13px; font-weight: 500;
  }

  .vade-bekle { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 20px; text-align: center; color: rgba(255,255,255,0.25); }

  @keyframes vadeFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .vade-animate { animation: vadeFadeIn 0.22s ease; }

  @media (max-width: 768px) {
    .vade-tab-label { display: none; }
    .vade-tab { padding: 10px 14px; }
  }
  @media (max-width: 480px) {
    .vade-card { border-radius: 12px; }
  }
`

// ─── Yardımcı Alt Bileşenler ──────────────────────────────────────────────────
function SectionTitle({ renk, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
      <div style={{ width:4, height:18, borderRadius:2, background:renk, flexShrink:0 }} />
      <span style={{ fontSize:11, fontWeight:700, color:renk, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
    </div>
  )
}

function BeklePanel({ icon, mesaj }) {
  return (
    <div className="vade-bekle">
      <i className={`bi ${icon}`} style={{ fontSize:40, marginBottom:12, opacity:0.3 }} />
      <div style={{ fontSize:13, fontWeight:600 }}>Hesaplama Bekleniyor</div>
      <div style={{ fontSize:12, marginTop:4 }}>{mesaj}</div>
    </div>
  )
}

function KartBaslik({ icon, renk, rgb, baslik, alt }) {
  return (
    <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:32, height:32, borderRadius:9, background:`rgba(${rgb},0.1)`, border:`1px solid rgba(${rgb},0.2)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <i className={`bi ${icon}`} style={{ color:renk, fontSize:14 }} />
      </div>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{baslik}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{alt}</div>
      </div>
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function VadeHesaplayici() {
  const [aktifSekme, setAktifSekme] = useState('fatura-ort')

  // Sekme 1
  const [s1RefTarih, setS1RefTarih]   = useState('')
  const [s1Vade, setS1Vade]           = useState('')
  const [s1Faturalar, setS1Faturalar] = useState([yeniFatura()])

  // Sekme 2
  const [s2Borc, setS2Borc]               = useState('')
  const [s2AnlasmaVade, setS2AnlasmaVade] = useState('')
  const [s2CekTutar, setS2CekTutar]       = useState('')

  // Sekme 3
  const [s3RefTarih, setS3RefTarih] = useState('')
  const [s3Cekler, setS3Cekler]     = useState([yeniCek()])

  // Sekme 4
  const [s4RefTarih, setS4RefTarih] = useState('')
  const [s4Borclar, setS4Borclar]   = useState([yeniBorc()])

  // ─── Hesaplamalar ─────────────────────────────────────────────────────────
  const s1Sonuc = useMemo(() => {
    if (!s1RefTarih || !s1Vade || Number(s1Vade) <= 0) return null
    const dolular = s1Faturalar.filter(f => f.tutar && f.tarih && parseTutar(f.tutar) > 0)
    if (dolular.length === 0) return null
    const ref = new Date(s1RefTarih)
    let toplamTutar = 0, toplamAgirlik = 0
    const satirlar = []
    for (const f of dolular) {
      const gun = Math.round((new Date(f.tarih) - ref) / 86400000)
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
    if (!s3RefTarih) return null
    const dolular = s3Cekler.filter(c => c.tutar && c.vadeTarih && parseTutar(c.tutar) > 0)
    if (dolular.length === 0) return null
    const ref = new Date(s3RefTarih)
    let toplamTutar = 0, toplamAgirlik = 0
    const satirlar = []
    for (const c of dolular) {
      const gun = Math.round((new Date(c.vadeTarih) - ref) / 86400000)
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
    const tarihler    = dolular.map(c => new Date(c.vadeTarih).getTime())
    const enErken     = new Date(Math.min(...tarihler))
    const enGec       = new Date(Math.max(...tarihler))
    return { satirlar, toplamTutar, toplamAgirlik, basitOrt, agirlikliOrt, ortVade, enErken, enGec }
  }, [s3RefTarih, s3Cekler])

  const s4Sonuc = useMemo(() => {
    if (!s4RefTarih) return null
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
    const vadeTarih = new Date(s4RefTarih); vadeTarih.setDate(vadeTarih.getDate() + adilVade)
    const gunler    = dolular.map(b => Number(b.gun))
    const enErkenGun = Math.min(...gunler), enGecGun = Math.max(...gunler)
    const enErken   = new Date(s4RefTarih); enErken.setDate(enErken.getDate() + enErkenGun)
    const enGec     = new Date(s4RefTarih); enGec.setDate(enGec.getDate() + enGecGun)
    return { satirlar, toplamBorc, toplamAgirlik, adilVade, vadeTarih, enErken, enGec, enErkenGun, enGecGun }
  }, [s4RefTarih, s4Borclar])

  // ─── Satır Yönetimi ───────────────────────────────────────────────────────
  const s1Ekle = () => setS1Faturalar(p => [...p, yeniFatura()])
  const s1Sil  = id  => setS1Faturalar(p => p.length > 1 ? p.filter(f => f.id !== id) : p)
  const s1Set  = (id,k,v) => setS1Faturalar(p => p.map(f => f.id===id ? {...f,[k]:v} : f))

  const s3Ekle = () => setS3Cekler(p => [...p, yeniCek()])
  const s3Sil  = id  => setS3Cekler(p => p.length > 1 ? p.filter(c => c.id !== id) : p)
  const s3Set  = (id,k,v) => setS3Cekler(p => p.map(c => c.id===id ? {...c,[k]:v} : c))

  const s4Ekle = () => setS4Borclar(p => [...p, yeniBorc()])
  const s4Sil  = id  => setS4Borclar(p => p.length > 1 ? p.filter(b => b.id !== id) : p)
  const s4Set  = (id,k,v) => setS4Borclar(p => p.map(b => b.id===id ? {...b,[k]:v} : b))

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="vade-page">
      <style>{CSS}</style>

      {/* Sayfa Başlığı */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{ width:42, height:42, borderRadius:12, flexShrink:0, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(245,158,11,0.35)' }}>
          <i className="bi bi-calculator-fill" style={{ color:'#fff', fontSize:18 }} />
        </div>
        <div>
          <h1 style={{ fontSize:'1.1rem', fontWeight:800, color:'#fff', margin:0, lineHeight:1.2 }}>Vade Hesaplayıcı</h1>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Ağırlıklı ortalama vade ve çek tarihi hesaplamaları</div>
        </div>
      </div>

      {/* Tab Sistemi */}
      <div className="vade-tab-container">
        {SEKMELER.map(s => (
          <button key={s.key} className={`vade-tab${aktifSekme===s.key?' active':''}`} onClick={() => setAktifSekme(s.key)}>
            <i className={`bi ${s.icon}`} style={{ fontSize:14, flexShrink:0 }} />
            <span className="vade-tab-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SEKME 1 — Fatura Ortalama Tarihi & Çek Vadesi
      ══════════════════════════════════════════════════════════════════════ */}
      {aktifSekme === 'fatura-ort' && (
        <div className="row g-3 vade-animate">
          {/* Sol: Giriş */}
          <div className="col-lg-6">
            <div className="vade-card h-100">
              <KartBaslik icon="bi-receipt" renk="#f59e0b" rgb="245,158,11" baslik="Fatura Bilgileri" alt="Ağırlıklı ortalama fatura tarihini hesapla" />
              <div style={{ padding:20 }}>
                <SectionTitle renk="#f59e0b" label="Referans Bilgileri" />
                <div className="row g-3 mb-4">
                  <div className="col-sm-6">
                    <label className="vade-label">Referans Tarihi</label>
                    <input type="date" className="vade-input" value={s1RefTarih} onChange={e => setS1RefTarih(e.target.value)} />
                  </div>
                  <div className="col-sm-6">
                    <label className="vade-label">Anlaşma Vadesi (Gün)</label>
                    <input type="number" className="vade-input" placeholder="180" min="1" value={s1Vade} onChange={e => setS1Vade(e.target.value)} />
                  </div>
                </div>

                <SectionTitle renk="#3b82f6" label={`Fatura Listesi (${s1Faturalar.length} adet)`} />
                <div className="table-responsive mb-3">
                  <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 4px', minWidth:380 }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 6px 8px', width:'30%' }}>Fatura No</th>
                        <th style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 6px 8px', width:'28%' }}>Tutar (₺)</th>
                        <th style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 6px 8px', width:'30%' }}>Tarih</th>
                        <th style={{ width:36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {s1Faturalar.map(f => (
                        <tr key={f.id}>
                          <td style={{ padding:'0 6px 4px 0' }}><input type="text" className="vade-input-sm" placeholder="F-001" value={f.no} onChange={e => s1Set(f.id,'no',e.target.value)} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="text" inputMode="decimal" className="vade-input-sm" placeholder="0,00" value={f.tutar} onChange={e => s1Set(f.id,'tutar',formatTutarInput(e.target.value))} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="date" className="vade-input-sm" value={f.tarih} onChange={e => s1Set(f.id,'tarih',e.target.value)} /></td>
                          <td style={{ padding:'0 0 4px 6px' }}>
                            <button className="vade-sil-btn" onClick={() => s1Sil(f.id)} title="Satırı sil">
                              <i className="bi bi-trash3" style={{ fontSize:12 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="vade-ekle-btn" onClick={s1Ekle}>
                  <i className="bi bi-plus-circle" style={{ fontSize:15 }} />Satır Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Sağ: Sonuçlar */}
          <div className="col-lg-6">
            <div className="vade-card h-100">
              <KartBaslik icon="bi-graph-up" renk="#f59e0b" rgb="245,158,11" baslik="Hesap Sonuçları" alt="Gerçek zamanlı hesaplama" />
              <div style={{ padding:20 }}>
                {!s1Sonuc && <BeklePanel icon="bi-receipt" mesaj="Referans tarihi, anlaşma vadesi ve en az 1 fatura girin" />}
                {s1Sonuc?.hata && (
                  <div className="vade-hata">
                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize:18, flexShrink:0, marginTop:1 }} />
                    <span>{s1Sonuc.hata}</span>
                  </div>
                )}
                {s1Sonuc && !s1Sonuc.hata && (
                  <>
                    <SectionTitle renk="#3b82f6" label="Detay Tablosu" />
                    <div className="table-responsive mb-4">
                      <table className="vade-table" style={{ minWidth:420 }}>
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
                              <td style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>{i+1}</td>
                              <td style={{ color:'rgba(255,255,255,0.6)' }}>{f.no||'—'}</td>
                              <td className="num" style={{ textAlign:'right', color:'#10b981' }}>{paraFormat(f.tutar)}</td>
                              <td className="num" style={{ textAlign:'right' }}>{f.gun}</td>
                              <td className="num" style={{ textAlign:'right', color:'#f59e0b' }}>{paraFormat(f.agirlik)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={2} style={{ fontWeight:700, color:'rgba(255,255,255,0.6)' }}>TOPLAM</td>
                            <td className="num" style={{ textAlign:'right', color:'#10b981', fontWeight:700 }}>{paraFormat(s1Sonuc.toplamTutar)}</td>
                            <td></td>
                            <td className="num" style={{ textAlign:'right', color:'#f59e0b', fontWeight:700 }}>{paraFormat(s1Sonuc.toplamAgirlik)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <SectionTitle renk="#f59e0b" label="Hesap Özeti" />
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Ağırlıklı Ort. Gün</div>
                          <div style={{ fontSize:24, fontWeight:800, color:'#fff', fontFamily:'Inter,sans-serif' }}>{s1Sonuc.ortGun}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>gün</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Ort. Fatura Tarihi</div>
                          <div style={{ fontSize:16, fontWeight:800, color:'#fff', fontFamily:'Inter,sans-serif' }}>{tarihFormat(s1Sonuc.ortTarih)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="vade-result-main">
                      <div style={{ fontSize:10, fontWeight:700, color:'rgba(245,158,11,0.7)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                        <i className="bi bi-calendar-check me-1" />Çek Vade Tarihi
                      </div>
                      <div style={{ fontSize:34, fontWeight:800, color:'#f59e0b', fontFamily:'Inter,sans-serif', letterSpacing:'-0.5px' }}>{tarihFormat(s1Sonuc.cekVade)}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4 }}>Ortalama fatura tarihi + {s1Vade} gün anlaşma vadesi</div>
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
        <div className="row g-3 vade-animate">
          {/* Sol: Giriş */}
          <div className="col-lg-5">
            <div className="vade-card h-100">
              <KartBaslik icon="bi-calculator" renk="#f59e0b" rgb="245,158,11" baslik="Giriş Bilgileri" alt="Borç, vade ve çek tutarını girin" />
              <div style={{ padding:20 }}>
                <SectionTitle renk="#f59e0b" label="Borç & Çek Bilgileri" />
                <div className="mb-3">
                  <label className="vade-label">Borç Tutarı (₺)</label>
                  <input type="text" inputMode="decimal" className="vade-input" placeholder="50.000,00" value={s2Borc} onChange={e => setS2Borc(formatTutarInput(e.target.value))} />
                </div>
                <div className="mb-3">
                  <label className="vade-label">Anlaşma Vadesi (Gün)</label>
                  <input type="number" className="vade-input" placeholder="180" min="1" value={s2AnlasmaVade} onChange={e => setS2AnlasmaVade(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="vade-label">Verilecek Çek Tutarı (₺)</label>
                  <input type="text" inputMode="decimal" className="vade-input" placeholder="60.000,00" value={s2CekTutar} onChange={e => setS2CekTutar(formatTutarInput(e.target.value))} />
                </div>
                <div style={{ padding:'14px 16px', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'rgba(59,130,246,0.8)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                    <i className="bi bi-info-circle me-1" />Formül
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.7, fontFamily:'Inter,sans-serif' }}>
                    Adil Vade = (Çek Tutarı × Anlaşma Vadesi) ÷ Borç Tutarı
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: Sonuçlar */}
          <div className="col-lg-7">
            <div className="vade-card h-100">
              <KartBaslik icon="bi-graph-up" renk="#f59e0b" rgb="245,158,11" baslik="Hesap Sonuçları" alt="Gerçek zamanlı hesaplama" />
              <div style={{ padding:20 }}>
                {!s2Sonuc && <BeklePanel icon="bi-calculator" mesaj="Borç tutarı, anlaşma vadesi ve çek tutarını girin" />}
                {s2Sonuc && (
                  <>
                    {s2Sonuc.uyari === 'esit' && (
                      <div className="vade-uyari-yesil mb-3">
                        <i className="bi bi-check-circle-fill" style={{ fontSize:18, flexShrink:0, marginTop:1 }} />
                        <span>Çek tutarı borç tutarına eşit — anlaşma vadesi zaten adil vadedir, ek hesap gerekmez</span>
                      </div>
                    )}
                    {s2Sonuc.uyari === 'eksik' && (
                      <div className="vade-uyari mb-3">
                        <i className="bi bi-exclamation-triangle-fill" style={{ fontSize:18, flexShrink:0, marginTop:1 }} />
                        <span>Eksik çek veriyorsunuz — hesaplanan vade kısalır, alacaklı için dezavantajlıdır</span>
                      </div>
                    )}

                    <SectionTitle renk="#3b82f6" label="Hesaplama Detayı" />
                    <div className="row g-2 mb-4">
                      <div className="col-sm-4">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Borç Tutarı</div>
                          <div style={{ fontSize:16, fontWeight:800, color:'#ef4444', fontFamily:'Inter,sans-serif' }}>₺{paraFormat(parseTutar(s2Borc))}</div>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Çek Tutarı</div>
                          <div style={{ fontSize:16, fontWeight:800, color:'#10b981', fontFamily:'Inter,sans-serif' }}>₺{paraFormat(parseTutar(s2CekTutar))}</div>
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Fark</div>
                          <div style={{ fontSize:16, fontWeight:800, fontFamily:'Inter,sans-serif', color: s2Sonuc.fark >= 0 ? '#10b981' : '#ef4444' }}>
                            {s2Sonuc.fark >= 0 ? '+' : ''}₺{paraFormat(Math.abs(s2Sonuc.fark))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <SectionTitle renk="#f59e0b" label="Sonuç" />
                    <div className="row g-2">
                      <div className="col-sm-5">
                        <div className="vade-result-main" style={{ height:'100%' }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(245,158,11,0.7)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                            <i className="bi bi-calendar-week me-1" />Adil Vade
                          </div>
                          <div style={{ fontSize:40, fontWeight:800, color:'#f59e0b', fontFamily:'Inter,sans-serif', letterSpacing:'-0.5px' }}>{s2Sonuc.adilVade}</div>
                          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2 }}>gün</div>
                        </div>
                      </div>
                      <div className="col-sm-7">
                        <div className="vade-result-secondary d-flex flex-column justify-content-center" style={{ height:'100%' }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Adil Vade Tarihi</div>
                          <div style={{ fontSize:22, fontWeight:800, color:'#fff', fontFamily:'Inter,sans-serif' }}>{tarihFormat(s2Sonuc.adilTarih)}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>Bugünden {s2Sonuc.adilVade} gün sonra</div>
                          <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'10px 0' }} />
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                            Borç × Vade değeri:{' '}
                            <span style={{ color:'rgba(255,255,255,0.65)', fontFamily:'Inter', fontWeight:600 }}>{paraFormat(s2Sonuc.borcVadeDegeri)}</span>
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
        <div className="row g-3 vade-animate">
          {/* Sol: Giriş */}
          <div className="col-lg-6">
            <div className="vade-card h-100">
              <KartBaslik icon="bi-collection" renk="#3b82f6" rgb="59,130,246" baslik="Çek Portföyü" alt="Portföyün ağırlıklı ortalama vadesi" />
              <div style={{ padding:20 }}>
                <SectionTitle renk="#f59e0b" label="Referans Tarihi" />
                <div className="mb-4">
                  <label className="vade-label">Referans Tarihi (genellikle bugün)</label>
                  <input type="date" className="vade-input" value={s3RefTarih} onChange={e => setS3RefTarih(e.target.value)} />
                </div>

                <SectionTitle renk="#3b82f6" label={`Çekler (${s3Cekler.length} adet)`} />
                <div className="table-responsive mb-3">
                  <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 4px', minWidth:360 }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 6px 8px', width:'30%' }}>Açıklama</th>
                        <th style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 6px 8px', width:'28%' }}>Tutar (₺)</th>
                        <th style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 6px 8px', width:'30%' }}>Vade Tarihi</th>
                        <th style={{ width:36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {s3Cekler.map(c => (
                        <tr key={c.id}>
                          <td style={{ padding:'0 6px 4px 0' }}><input type="text" className="vade-input-sm" placeholder="Açıklama" value={c.aciklama} onChange={e => s3Set(c.id,'aciklama',e.target.value)} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="text" inputMode="decimal" className="vade-input-sm" placeholder="0,00" value={c.tutar} onChange={e => s3Set(c.id,'tutar',formatTutarInput(e.target.value))} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="date" className="vade-input-sm" value={c.vadeTarih} onChange={e => s3Set(c.id,'vadeTarih',e.target.value)} /></td>
                          <td style={{ padding:'0 0 4px 6px' }}>
                            <button className="vade-sil-btn" onClick={() => s3Sil(c.id)} title="Satırı sil">
                              <i className="bi bi-trash3" style={{ fontSize:12 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="vade-ekle-btn" onClick={s3Ekle}>
                  <i className="bi bi-plus-circle" style={{ fontSize:15 }} />Çek Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Sağ: Sonuçlar */}
          <div className="col-lg-6">
            <div className="vade-card h-100">
              <KartBaslik icon="bi-graph-up" renk="#f59e0b" rgb="245,158,11" baslik="Portföy Analizi" alt="Gerçek zamanlı hesaplama" />
              <div style={{ padding:20 }}>
                {!s3Sonuc && <BeklePanel icon="bi-collection" mesaj="Referans tarihi ve en az 1 çek bilgisi girin" />}
                {s3Sonuc?.hata && (
                  <div className="vade-hata">
                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize:18, flexShrink:0, marginTop:1 }} />
                    <span>{s3Sonuc.hata}</span>
                  </div>
                )}
                {s3Sonuc && !s3Sonuc.hata && (
                  <>
                    <SectionTitle renk="#3b82f6" label="Detay Tablosu" />
                    <div className="table-responsive mb-4">
                      <table className="vade-table" style={{ minWidth:380 }}>
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
                              <td style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>{i+1}</td>
                              <td style={{ color:'rgba(255,255,255,0.6)' }}>{c.aciklama||'—'}</td>
                              <td className="num" style={{ textAlign:'right', color:'#10b981' }}>{paraFormat(c.tutar)}</td>
                              <td className="num" style={{ textAlign:'right' }}>{c.gun}</td>
                              <td className="num" style={{ textAlign:'right', color:'#f59e0b' }}>{paraFormat(c.agirlik)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={2} style={{ fontWeight:700, color:'rgba(255,255,255,0.6)' }}>TOPLAM</td>
                            <td className="num" style={{ textAlign:'right', color:'#10b981', fontWeight:700 }}>{paraFormat(s3Sonuc.toplamTutar)}</td>
                            <td></td>
                            <td className="num" style={{ textAlign:'right', color:'#f59e0b', fontWeight:700 }}>{paraFormat(s3Sonuc.toplamAgirlik)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>En Erken Vade</div>
                          <div style={{ fontSize:15, fontWeight:700, color:'#10b981', fontFamily:'Inter,sans-serif' }}>{tarihFormat(s3Sonuc.enErken)}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>En Geç Vade</div>
                          <div style={{ fontSize:15, fontWeight:700, color:'#ef4444', fontFamily:'Inter,sans-serif' }}>{tarihFormat(s3Sonuc.enGec)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Basit Ort. (referans)</div>
                          <div style={{ fontSize:22, fontWeight:800, color:'rgba(255,255,255,0.4)', fontFamily:'Inter,sans-serif' }}>{s3Sonuc.basitOrt}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:2 }}>gün — yanlış yöntem</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Ağırlıklı Ort. (doğru)</div>
                          <div style={{ fontSize:22, fontWeight:800, color:'#f59e0b', fontFamily:'Inter,sans-serif' }}>{s3Sonuc.agirlikliOrt}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>gün</div>
                        </div>
                      </div>
                    </div>

                    <div className="vade-result-main">
                      <div style={{ fontSize:10, fontWeight:700, color:'rgba(245,158,11,0.7)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                        <i className="bi bi-calendar-check me-1" />Portföy Ortalama Vade Tarihi
                      </div>
                      <div style={{ fontSize:34, fontWeight:800, color:'#f59e0b', fontFamily:'Inter,sans-serif', letterSpacing:'-0.5px' }}>{tarihFormat(s3Sonuc.ortVade)}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4 }}>Referans tarihi + {s3Sonuc.agirlikliOrt} gün ağırlıklı ortalama</div>
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
        <div className="row g-3 vade-animate">
          {/* Sol: Giriş */}
          <div className="col-lg-6">
            <div className="vade-card h-100">
              <KartBaslik icon="bi-link-45deg" renk="#a78bfa" rgb="167,139,250" baslik="Borç Listesi" alt="Farklı vadelerdeki borçları tek çeke bağla" />
              <div style={{ padding:20 }}>
                <SectionTitle renk="#f59e0b" label="Referans Tarihi" />
                <div className="mb-4">
                  <label className="vade-label">Referans Tarihi (genellikle bugün)</label>
                  <input type="date" className="vade-input" value={s4RefTarih} onChange={e => setS4RefTarih(e.target.value)} />
                </div>

                <SectionTitle renk="#a78bfa" label={`Borçlar (${s4Borclar.length} adet)`} />
                <div className="table-responsive mb-3">
                  <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 4px', minWidth:360 }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 6px 8px', width:'32%' }}>Açıklama</th>
                        <th style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 6px 8px', width:'30%' }}>Borç (₺)</th>
                        <th style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 6px 8px', width:'26%' }}>Kalan Gün</th>
                        <th style={{ width:36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {s4Borclar.map(b => (
                        <tr key={b.id}>
                          <td style={{ padding:'0 6px 4px 0' }}><input type="text" className="vade-input-sm" placeholder="Tedarikçi A" value={b.aciklama} onChange={e => s4Set(b.id,'aciklama',e.target.value)} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="text" inputMode="decimal" className="vade-input-sm" placeholder="0,00" value={b.tutar} onChange={e => s4Set(b.id,'tutar',formatTutarInput(e.target.value))} /></td>
                          <td style={{ padding:'0 6px 4px' }}><input type="number" className="vade-input-sm" placeholder="30" min="0" value={b.gun} onChange={e => s4Set(b.id,'gun',e.target.value)} /></td>
                          <td style={{ padding:'0 0 4px 6px' }}>
                            <button className="vade-sil-btn" onClick={() => s4Sil(b.id)} title="Satırı sil">
                              <i className="bi bi-trash3" style={{ fontSize:12 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="vade-ekle-btn" onClick={s4Ekle}>
                  <i className="bi bi-plus-circle" style={{ fontSize:15 }} />Borç Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Sağ: Sonuçlar */}
          <div className="col-lg-6">
            <div className="vade-card h-100">
              <KartBaslik icon="bi-graph-up" renk="#f59e0b" rgb="245,158,11" baslik="Tek Çek Hesabı" alt="Gerçek zamanlı hesaplama" />
              <div style={{ padding:20 }}>
                {!s4Sonuc && <BeklePanel icon="bi-link-45deg" mesaj="Referans tarihi ve en az 1 borç bilgisi girin" />}
                {s4Sonuc && (
                  <>
                    <SectionTitle renk="#a78bfa" label="Detay Tablosu" />
                    <div className="table-responsive mb-4">
                      <table className="vade-table" style={{ minWidth:380 }}>
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
                              <td style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>{i+1}</td>
                              <td style={{ color:'rgba(255,255,255,0.6)' }}>{b.aciklama||'—'}</td>
                              <td className="num" style={{ textAlign:'right', color:'#ef4444' }}>{paraFormat(b.tutar)}</td>
                              <td className="num" style={{ textAlign:'right' }}>{b.gun}</td>
                              <td className="num" style={{ textAlign:'right', color:'#f59e0b' }}>{paraFormat(b.agirlik)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={2} style={{ fontWeight:700, color:'rgba(255,255,255,0.6)' }}>TOPLAM</td>
                            <td className="num" style={{ textAlign:'right', color:'#ef4444', fontWeight:700 }}>{paraFormat(s4Sonuc.toplamBorc)}</td>
                            <td></td>
                            <td className="num" style={{ textAlign:'right', color:'#f59e0b', fontWeight:700 }}>{paraFormat(s4Sonuc.toplamAgirlik)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>En Erken Vade</div>
                          <div style={{ fontSize:15, fontWeight:700, color:'#10b981', fontFamily:'Inter,sans-serif' }}>{tarihFormat(s4Sonuc.enErken)}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{s4Sonuc.enErkenGun} gün</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="vade-result-secondary">
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>En Geç Vade</div>
                          <div style={{ fontSize:15, fontWeight:700, color:'#ef4444', fontFamily:'Inter,sans-serif' }}>{tarihFormat(s4Sonuc.enGec)}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{s4Sonuc.enGecGun} gün</div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-sm-5">
                        <div className="vade-result-main" style={{ height:'100%' }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(245,158,11,0.7)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                            <i className="bi bi-calendar-week me-1" />Adil Vade
                          </div>
                          <div style={{ fontSize:40, fontWeight:800, color:'#f59e0b', fontFamily:'Inter,sans-serif', letterSpacing:'-0.5px' }}>{s4Sonuc.adilVade}</div>
                          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2 }}>gün</div>
                        </div>
                      </div>
                      <div className="col-sm-7">
                        <div className="vade-result-secondary d-flex flex-column justify-content-center" style={{ height:'100%' }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Tek Çek Vade Tarihi</div>
                          <div style={{ fontSize:22, fontWeight:800, color:'#fff', fontFamily:'Inter,sans-serif' }}>{tarihFormat(s4Sonuc.vadeTarih)}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>Referans tarihi + {s4Sonuc.adilVade} gün</div>
                          <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'10px 0' }} />
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                            Toplam Borç:{' '}
                            <span style={{ color:'#ef4444', fontFamily:'Inter', fontWeight:700 }}>₺{paraFormat(s4Sonuc.toplamBorc)}</span>
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
