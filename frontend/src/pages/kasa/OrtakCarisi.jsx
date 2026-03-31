/**
 * OrtakCarisi.jsx — Ortak Cari Hesapları sekmesi
 * Ortakların para giriş/çıkış takibi
 * İçerir: OrtakModal, OrtakCarisi
 */
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import { hexRgba } from '../../lib/temaRenkleri'
import { ortakHareketEkle, ortakHareketSil } from '../../api/kasa'
import { TL, tarihFmt, bugunTarih, formatParaInput, parseParaInput, ORTAK_RENKLERI } from './kasaUtils'
import DonemFiltresi from './components/DonemFiltresi'
import SwipeCard, { DynamicAvatar } from '../../components/SwipeCard'
import { DateInput } from '../../components/ui/DateInput'

// ─── Ortak İşlem Ekleme Modalı ──────────────────────────────────────────────
function OrtakModal({ open, onClose, mevcutOrtaklar, onKaydet, p, renkler }) {
  const [ortakAdi,  setOrtakAdi]  = useState('')
  const [tur,       setTur]       = useState('para_girisi')
  const [tarih,     setTarih]     = useState(bugunTarih())
  const [tutar,     setTutar]     = useState('')
  const [aciklama,  setAciklama]  = useState('')

  useEffect(() => {
    if (open) { setOrtakAdi(''); setTur('para_girisi'); setTarih(bugunTarih()); setTutar(''); setAciklama('') }
  }, [open])

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

  const kaydet = () => {
    if (!ortakAdi.trim()) { toast.error('Ortak adı zorunludur.'); return }
    const tutarSayi = parseParaInput(tutar)
    if (tutarSayi <= 0) { toast.error('Tutar sıfırdan büyük olmalı.'); return }
    onKaydet({ id: Date.now(), tarih, ortak_adi: ortakAdi.trim(), islem_tipi: tur, tutar: tutarSayi, aciklama })
    onClose()
  }

  const giris = tur === 'para_girisi'
  const acikRenk = giris ? renkler.success : renkler.danger
  const tutarSayi = parseParaInput(tutar)
  const basHarfler = ortakAdi.trim() ? ortakAdi.trim().split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : '?'

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center`}>
        <div className={`${p}-modal-box`} style={{ maxWidth:540 }} aria-labelledby="ortak-modal-title">

          <div className={`${p}-modal-header ${p}-mh-default`}>
            <div className="d-flex align-items-center gap-3">
              <div className={`${p}-kasa-modal-icon-accent`}>
                <i className="bi bi-people-fill" style={{ fontSize:18 }} />
              </div>
              <div>
                <h2 id="ortak-modal-title" className={`${p}-modal-title`}>Kullanım / Çekim Ekle</h2>
                <div className={`${p}-modal-sub`}>Ortak cari hareketi kaydı</div>
              </div>
            </div>
            <button onClick={onClose} className={`${p}-modal-close`}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>
            <div className={`${p}-kasa-section-bar`}>
              <div className={`${p}-kasa-section-mark`} style={{ background:renkler.primary }} />
              <span className={`${p}-kasa-section-label`} style={{ color:renkler.primary }}>Ortak Bilgisi</span>
            </div>

            <div className="mb-4">
              <label className={`${p}-kasa-input-label`}>Ortak Adı</label>
              <input
                list="ortak-list" value={ortakAdi} onChange={e => setOrtakAdi(e.target.value)}
                placeholder="Ortak adı yazın veya seçin..." className={`${p}-kasa-input`}
              />
              <datalist id="ortak-list">
                {mevcutOrtaklar.map(ad => <option key={ad} value={ad} />)}
              </datalist>
            </div>

            <div className={`${p}-kasa-section-bar`}>
              <div className={`${p}-kasa-section-mark`} style={{ background:renkler.info }} />
              <span className={`${p}-kasa-section-label`} style={{ color:renkler.info }}>İşlem Detayları</span>
            </div>

            <div className="row g-2 mb-3">
              {[
                { key:'para_girisi', label:'Ortaktan Giriş', desc:'Ortağın şirkete koyduğu para', icon:'bi-arrow-down-circle-fill', renk:renkler.success, bg:hexRgba(renkler.success, 0.08) },
                { key:'para_cikisi', label:'Ortağa Çıkış', desc:'Şirketten ortağa çekilen para', icon:'bi-arrow-up-circle-fill', renk:renkler.danger, bg:hexRgba(renkler.danger, 0.08) },
              ].map(t => (
                <div key={t.key} className="col-6">
                  <button
                    onClick={() => setTur(t.key)}
                    style={{ width:'100%', padding:'14px 12px', border:`2px solid ${tur===t.key ? t.renk : hexRgba(renkler.text, 0.1)}`, borderRadius:10, background: tur===t.key ? t.bg : hexRgba(renkler.text, 0.04), cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className={`bi ${t.icon}`} style={{ color:t.renk, fontSize:18 }} />
                      <span style={{ fontWeight:700, fontSize:14, color: tur===t.key ? t.renk : renkler.textSec }}>{t.label}</span>
                    </div>
                    <div className={`${p}-kasa-text-muted`} style={{ fontSize:10, paddingLeft:26 }}>{t.desc}</div>
                  </button>
                </div>
              ))}
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className={`${p}-kasa-input-label`}>Tarih</label>
                <DateInput value={tarih} onChange={val => setTarih(val)} placeholder="Tarih seçin" />
              </div>
              <div className="col-12 col-sm-6">
                <label className={`${p}-kasa-input-label`}>Tutar (₺)</label>
                <input type="text" inputMode="decimal" value={tutar} onChange={e => setTutar(formatParaInput(e.target.value))}
                  placeholder="0,00" className={`${p}-kasa-input ${p}-kasa-fin-num`} style={{ color:acikRenk, fontWeight:700 }} />
              </div>
            </div>

            <div className="mb-4">
              <label className={`${p}-kasa-input-label`}>Açıklama <span className={`${p}-kasa-text-muted`} style={{ fontWeight:400 }}>(opsiyonel)</span></label>
              <input type="text" value={aciklama} onChange={e => setAciklama(e.target.value)}
                placeholder="Sermaye artırımı, kâr dağıtımı, cari hesap..." className={`${p}-kasa-input`} />
            </div>

            {(ortakAdi.trim() || tutarSayi > 0) && (
              <div style={{ background:`linear-gradient(135deg, ${hexRgba(renkler.accent, 0.06)}, ${hexRgba(renkler.accent, 0.03)})`, border:`1px solid ${hexRgba(renkler.accent, 0.15)}`, borderRadius:14, padding:'14px 18px', marginBottom:8 }}>
                <div className={`${p}-kasa-text-label`} style={{ marginBottom:10 }}>Kayıt Önizleme</div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ width:38, height:38, borderRadius:10, background: giris ? hexRgba(renkler.success, 0.15) : hexRgba(renkler.danger, 0.12), border:`1px solid ${giris ? hexRgba(renkler.success, 0.3) : hexRgba(renkler.danger, 0.25)}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:14, fontWeight:800, color: acikRenk }}>{basHarfler}</span>
                    </div>
                    <div>
                      <div className={`${p}-kasa-text-primary`} style={{ fontWeight:700, fontSize:14, lineHeight:1.2 }}>{ortakAdi.trim() || 'Ortak Adı'}</div>
                      <div className={`${p}-kasa-text-muted`} style={{ fontSize:11 }}>{giris ? 'Ortaktan Giriş' : 'Ortağa Çıkış'} · {tarihFmt(tarih)}</div>
                    </div>
                  </div>
                  <div className="financial-num" style={{ fontSize:18, fontWeight:800, color: acikRenk }}>
                    {giris ? '+' : '-'}{tutarSayi > 0 ? TL(tutarSayi) : '₺0,00'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding:'16px 24px', borderTop:`1px solid ${hexRgba(renkler.text, 0.08)}`, background:hexRgba(renkler.bg, 0.98), flexShrink:0 }}>
            <button onClick={kaydet} className={`${p}-kasa-btn-accent w-100`}
              style={{ borderRadius:10, padding:'13px', fontSize:15, boxShadow:`0 4px 16px ${hexRgba(renkler.accent, 0.3)}` }}>
              <i className="bi bi-shield-lock-fill me-2" />Kaydet & Şifrele
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Ortak Carisi Ana Bileşen ───────────────────────────────────────────────
export default function OrtakCarisi({ ortakHareketler, setOrtakHareketler, p, renkler }) {
  const [modalAcik, setModalAcik] = useState(false)
  const [arama,     setArama]     = useState('')
  const [silOnayId, setSilOnayId] = useState(null)
  const [sayfa,     setSayfa]     = useState(1)
  const bugunO = new Date()
  const [ocAy,   setOcAy]   = useState(bugunO.getMonth() + 1)
  const [ocYil,  setOcYil]  = useState(bugunO.getFullYear())
  const [ocTum,  setOcTum]  = useState(true)
  const sayfaBasi = 10

  const tarihliHareketler = useMemo(() => {
    if (ocTum) return ortakHareketler
    return ortakHareketler.filter(h => {
      const d = new Date(h.tarih + 'T00:00:00')
      return d.getMonth() + 1 === ocAy && d.getFullYear() === ocYil
    })
  }, [ortakHareketler, ocAy, ocYil, ocTum])

  const ortaklar = useMemo(() => {
    const seen = new Set()
    return ortakHareketler.reduce((acc, h) => {
      if (!seen.has(h.ortak_adi)) { seen.add(h.ortak_adi); acc.push(h.ortak_adi) }
      return acc
    }, [])
  }, [ortakHareketler])

  const ortakRenk = (ad) => ORTAK_RENKLERI[ortaklar.indexOf(ad) % ORTAK_RENKLERI.length]

  const ortakBakiye = useMemo(() => {
    return ortaklar.map(ad => {
      const giris = tarihliHareketler.filter(h => h.ortak_adi===ad && h.islem_tipi==='para_girisi').reduce((s,h)=>s+(h.tutar ?? 0),0)
      const cikis  = tarihliHareketler.filter(h => h.ortak_adi===ad && h.islem_tipi==='para_cikisi').reduce((s,h) =>s+(h.tutar ?? 0),0)
      return { ad, bakiye: giris - cikis }
    })
  }, [ortaklar, tarihliHareketler])

  const filtrelendi = useMemo(() => {
    const sirali = [...tarihliHareketler].sort((a,b) => b.tarih.localeCompare(a.tarih) || b.id-a.id)
    if (!arama.trim()) return sirali
    return sirali.filter(h => h.ortak_adi.toLowerCase().includes(arama.toLowerCase()))
  }, [tarihliHareketler, arama])

  const toplamSayfa = Math.ceil(filtrelendi.length / sayfaBasi)
  const sayfaliVeri = filtrelendi.slice((sayfa-1)*sayfaBasi, sayfa*sayfaBasi)

  const islemEkle = async (yeni) => {
    try {
      const res = await ortakHareketEkle(yeni)
      if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt eklenemedi.'); return }
      setOrtakHareketler(prev => [...prev, { ...yeni, id: res.data.veri.id }])
    } catch {
      toast.error('Kayıt eklenemedi.')
    }
  }

  const islemSil = async (id) => {
    try {
      const res = await ortakHareketSil(id)
      if (!res.data.basarili) { toast.error(res.data.hata || 'Kayıt silinemedi.'); return }
      setOrtakHareketler(prev => prev.filter(h => h.id !== id))
      setSilOnayId(null)
    } catch {
      toast.error('Kayıt silinemedi.')
    }
  }

  const BasHarf = ({ ad, renk }) => (
    <div style={{ width:44, height:44, borderRadius:14, background:renk, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <span style={{ fontSize:16, fontWeight:800, color:'#fff', lineHeight:1 }}>
        {ad.split(' ').map(s=>s[0]).slice(0,2).join('')}
      </span>
    </div>
  )

  const toplamGiris = useMemo(() => tarihliHareketler.filter(h => h.islem_tipi==='para_girisi').reduce((s,h) => s+(h.tutar??0), 0), [tarihliHareketler])
  const toplamCikis = useMemo(() => tarihliHareketler.filter(h => h.islem_tipi==='para_cikisi').reduce((s,h) => s+(h.tutar??0), 0), [tarihliHareketler])
  const toplamNet = toplamGiris - toplamCikis

  return (
    <div>
      <DonemFiltresi secilenAy={ocAy} secilenYil={ocYil} setSecilenAy={setOcAy} setSecilenYil={setOcYil} tumZamanlar={ocTum} setTumZamanlar={setOcTum} p={p} renkler={renkler} />

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className={`${p}-kasa-text-primary`} style={{ fontSize:'1.1rem', fontWeight:800, margin:0, opacity:0.9 }}>Ortak Cari Hesapları</h2>
          <p className={`mb-0 ${p}-kasa-text-muted`} style={{ fontSize:13 }}>{ortaklar.length} ortak · {tarihliHareketler.length} işlem</p>
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <div style={{ width:220, position:'relative' }}>
            <i className="bi bi-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:renkler.textSec, fontSize:13, pointerEvents:'none' }} />
            <input type="text" value={arama} onChange={e => { setArama(e.target.value); setSayfa(1) }}
              placeholder="Ortak adı filtrele..." className={`${p}-kasa-search`} />
          </div>
          <button onClick={() => setModalAcik(true)}
            className={`${p}-kasa-btn-accent d-flex align-items-center gap-2`}
            style={{ borderRadius:50, padding:'10px 22px', boxShadow:`0 3px 10px ${hexRgba(renkler.accent, 0.3)}` }}>
            <i className="bi bi-plus-lg" /><span className="d-none d-md-inline">Kullanım / Çekim Ekle</span>
          </button>
        </div>
      </div>

      {ortakHareketler.length > 0 && (
        <div className="row g-3 mb-4">
          {[
            { label:'Toplam Giriş', deger:toplamGiris, renk:renkler.success, ikon:'bi-arrow-down-circle-fill', alt:'Seçili dönemde ortaktan gelen toplam' },
            { label:'Toplam Çıkış', deger:toplamCikis, renk:renkler.danger, ikon:'bi-arrow-up-circle-fill', alt:'Seçili dönemde ortağa çıkan toplam' },
            { label:'Net Bakiye', deger:toplamNet, renk: toplamNet >= 0 ? renkler.success : renkler.danger, ikon:'bi-wallet2', alt:'Giriş − Çıkış farkı' },
          ].map((k,i) => (
            <div key={i} className="col-12 col-md-4">
              <div className={`${p}-kasa-kpi-card`}>
                <i className={`bi ${k.ikon} ${p}-kasa-kpi-deco`} style={{ color:k.renk }} />
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className={`${p}-kasa-icon-box`} style={{ background:hexRgba(k.renk, 0.12) }}><i className={`bi ${k.ikon}`} style={{ color:k.renk, fontSize:17 }} /></div>
                  <span className={`${p}-kasa-kpi-label`}>{k.label}</span>
                </div>
                <div className={`financial-num ${p}-kasa-kpi-val`} style={{ textShadow:`0 0 20px ${hexRgba(k.renk, 0.2)}` }}>
                  {k.label === 'Net Bakiye' && toplamNet >= 0 ? '+' : ''}{k.label === 'Toplam Çıkış' ? '-' : ''}{TL(k.deger)}
                </div>
                <p className={`${p}-kasa-text-muted`} style={{ fontSize:11, margin:'8px 0 0', fontWeight:500 }}>{k.alt}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {ortakBakiye.length > 0 && (
        <div className="row g-3 mb-4">
          {ortakBakiye.map(({ ad, bakiye }) => {
            const renk = ortakRenk(ad)
            const pozitif = bakiye >= 0
            const oGiris = ortakHareketler.filter(h => h.ortak_adi===ad && h.islem_tipi==='para_girisi').reduce((s,h) => s+(h.tutar??0), 0)
            const oCikis = ortakHareketler.filter(h => h.ortak_adi===ad && h.islem_tipi==='para_cikisi').reduce((s,h) => s+(h.tutar??0), 0)
            const oToplam = oGiris + oCikis
            const girisYuzde = oToplam > 0 ? (oGiris / oToplam) * 100 : 50
            return (
              <div key={ad} className="col-12 col-sm-6 col-md-4 col-xl-3">
                <div className={`${p}-kasa-kpi-card`} style={{ position:'relative', overflow:'hidden' }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <BasHarf ad={ad} renk={renk} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className={`${p}-kasa-text-primary`} style={{ fontWeight:800, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ad}</div>
                      <div style={{ fontSize:11, fontWeight:700, color: pozitif ? renkler.success : renkler.danger, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                        {pozitif ? 'Şirkette alacak' : 'Şirkete borç'}
                      </div>
                    </div>
                  </div>
                  <div className="financial-num" style={{ fontSize:'1.4rem', fontWeight:800, lineHeight:1.1, color: pozitif ? renkler.success : renkler.danger, marginBottom:10 }}>
                    {pozitif ? '+' : ''}{TL(bakiye)}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ flex:1, height:4, borderRadius:2, background:hexRgba(renkler.danger, 0.25), overflow:'hidden' }}>
                      <div style={{ width:`${girisYuzde}%`, height:'100%', borderRadius:2, background:renkler.success, transition:'width 0.4s ease' }} />
                    </div>
                    <span className={`${p}-kasa-text-muted`} style={{ fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
                      {Math.round(girisYuzde)}G / {Math.round(100-girisYuzde)}Ç
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className={`${p}-kasa-glass-card`} style={{ padding:0 }}>
        <div className="px-4 pt-4 pb-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ borderBottom:`1px solid ${hexRgba(renkler.text, 0.06)}` }}>
          <div>
            <span className={`${p}-kasa-text-primary`} style={{ fontSize:15, fontWeight:700 }}>Kullanım Dökümü</span>
            <p className={`mb-0 ${p}-kasa-text-muted`} style={{ fontSize:12 }}>
              {filtrelendi.length} kayıt{arama ? ` · "${arama}" filtresi` : ''}
            </p>
          </div>
        </div>
        {/* Desktop Tablo */}
        <div className="table-responsive d-none d-md-block">
          <table className={`${p}-kasa-table`}>
            <thead>
              <tr style={{ background:hexRgba(renkler.text, 0.03) }}>
                {['Tarih','Ortak Adı','İşlem Türü','Açıklama','Tutar',''].map((h,i) => (
                  <th key={i} style={{ fontWeight:700, color:renkler.textSec, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', padding:'10px 16px', textAlign: i===4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sayfaliVeri.map(h => {
                const giris = h.islem_tipi === 'para_girisi'
                return (
                  <tr key={h.id}>
                    <td style={{ fontSize:13, color:renkler.textSec, padding:'10px 16px', whiteSpace:'nowrap' }}>{tarihFmt(h.tarih)}</td>
                    <td style={{ padding:'10px 16px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <DynamicAvatar isim={h.ortak_adi} boyut={28} />
                        <span style={{ fontWeight:700, fontSize:13, color: 'var(--p-text)' }}>{h.ortak_adi}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 16px' }}>
                      <span className={`${p}-kasa-badge`} style={{ background: giris ? hexRgba(renkler.success, 0.12) : hexRgba(renkler.danger, 0.1), color: giris ? renkler.success : renkler.danger }}>
                        <i className={`bi ${giris ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'} me-1`} style={{ fontSize:10 }} />
                        {giris ? 'Ortaktan Giriş' : 'Ortağa Çıkış'}
                      </span>
                    </td>
                    <td style={{ fontSize:13, color:renkler.textSec, padding:'10px 16px' }}>{h.aciklama || '—'}</td>
                    <td className="financial-num" style={{ textAlign:'right', fontWeight:800, fontSize:14, padding:'10px 16px', color: giris ? renkler.success : renkler.danger, whiteSpace:'nowrap' }}>
                      {giris ? '+' : '-'}{TL(h.tutar)}
                    </td>
                    <td style={{ padding:'10px 16px', textAlign:'right', whiteSpace:'nowrap' }}>
                      {silOnayId === h.id ? (
                        <span className="d-inline-flex align-items-center gap-1">
                          <span className={`${p}-kasa-text-sec`} style={{ fontSize:12, fontWeight:600, marginRight:2 }}>Emin misiniz?</span>
                          <button onClick={() => islemSil(h.id)} className={`${p}-kasa-sil-btn`}>Sil</button>
                          <button onClick={() => setSilOnayId(null)} className={`${p}-kasa-vazgec-btn`}>Vazgeç</button>
                        </span>
                      ) : (
                        <button onClick={() => setSilOnayId(h.id)}
                          style={{ background:'none', border:`1px solid ${hexRgba(renkler.text, 0.1)}`, borderRadius:10, padding:'4px 8px', cursor:'pointer', color:renkler.textSec, fontSize:14, transition:'all 0.15s', minWidth:44, minHeight:44, display:'inline-flex', alignItems:'center', justifyContent:'center' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor=renkler.danger; e.currentTarget.style.color=renkler.danger }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor=hexRgba(renkler.text, 0.1); e.currentTarget.style.color=renkler.textSec }}>
                          <i className="bi bi-trash3" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {sayfaliVeri.length === 0 && (
                <tr><td colSpan={6} className={`${p}-empty-state`}>
                  <i className="bi bi-people" />
                  <h6>{arama ? `"${arama}" için kayıt bulunamadı` : 'Henüz işlem yok'}</h6>
                  <p>{arama ? 'Farklı bir arama deneyin' : 'Ortak cari hesabınıza ilk işlemi ekleyin'}</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobil Kart Listesi */}
        <div className="d-md-none" style={{ padding: '0 0 8px' }}>
          {sayfaliVeri.length === 0 ? (
            <div className={`${p}-empty-state`} style={{ padding: '40px 16px', textAlign: 'center' }}>
              <i className="bi bi-people" style={{ fontSize: 36, color: renkler.textSec, opacity: 0.4, display: 'block', marginBottom: 8 }} />
              <h6 style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text)' }}>{arama ? `"${arama}" için kayıt bulunamadı` : 'Henüz işlem yok'}</h6>
            </div>
          ) : <>
            <div className="p-swipe-hint"><i className="bi bi-arrow-left-right" /> Sola kaydırarak silebilirsiniz</div>
            {sayfaliVeri.map(h => {
              const giris = h.islem_tipi === 'para_girisi'
              return (
                <SwipeCard key={h.id} aksiyonlar={[
                  { icon: 'bi-trash3', label: 'Sil', renk: 'danger', onClick: () => setSilOnayId(h.id) },
                ]}>
                  <div className="p-gg-mcard">
                    <div className="p-gg-mcard-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <DynamicAvatar isim={h.ortak_adi} boyut={36} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--p-text)' }}>{h.ortak_adi}</div>
                          <span className={`${p}-kasa-badge`} style={{ background: giris ? hexRgba(renkler.success, 0.12) : hexRgba(renkler.danger, 0.1), color: giris ? renkler.success : renkler.danger, fontSize: 10, padding: '1px 6px' }}>
                            <i className={`bi ${giris ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'} me-1`} style={{ fontSize: 12 }} />
                            {giris ? 'Giriş' : 'Çıkış'}
                          </span>
                        </div>
                      </div>
                      <span className="p-gg-mcard-tutar financial-num" style={{ color: giris ? renkler.success : renkler.danger }}>
                        {giris ? '+' : '-'}{TL(h.tutar)}
                      </span>
                    </div>
                    {h.aciklama && <div className="p-gg-mcard-aciklama">{h.aciklama}</div>}
                    <div className="p-gg-mcard-alt">
                      <span className="p-gg-mcard-tarih"><i className="bi bi-calendar3" /> {tarihFmt(h.tarih)}</span>
                    </div>
                  </div>
                </SwipeCard>
              )
            })}
          </>}
        </div>

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

      <OrtakModal
        open={modalAcik} onClose={() => setModalAcik(false)}
        mevcutOrtaklar={ortaklar} onKaydet={islemEkle}
        p={p} renkler={renkler}
      />

    </div>
  )
}
