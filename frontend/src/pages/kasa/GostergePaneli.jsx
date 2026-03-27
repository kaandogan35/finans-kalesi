/**
 * GostergePaneli — Varlık & Kasa Gösterge Paneli (v2)
 * Patronun en sevdiği modül — Executive Financial Dashboard
 * 6 KPI Kart: Merkez Kasa | Giriş | Çıkış | Banka | Net Değer | Nakit Tamponu
 */
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { hexRgba } from '../../lib/temaRenkleri'
import { TL, tarihFmt, donemNormalize } from './kasaUtils'
import DegisimBadge from './components/DegisimBadge'

// ─── Kategori Detay Modalı ────────────────────────────────────────────────────
export function KategoriDetayModal({ show, onClose, kategori, tip, hareketler, p, renkler }) {
  const [siralamaAlan,  setSiralamaAlan]  = useState('tarih')
  const [siralamaYon,   setSiralamaYon]   = useState('azalan')

  useEffect(() => {
    if (!show) return
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [show, onClose])

  useEffect(() => {
    if (!show) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [show])

  if (!show || !kategori) return null

  const filtreli = hareketler.filter(h => h.kategori === kategori && h.islem_tipi === tip)

  const sirali = [...filtreli].sort((a, b) => {
    let fark = 0
    if (siralamaAlan === 'tarih')         fark = a.tarih.localeCompare(b.tarih)
    else if (siralamaAlan === 'baglanti') fark = (a.baglanti_turu || '').localeCompare(b.baglanti_turu || '')
    else if (siralamaAlan === 'tutar')    fark = (a.tutar ?? 0) - (b.tutar ?? 0)
    return siralamaYon === 'azalan' ? -fark : fark
  })

  const toplam = sirali.reduce((s, h) => s + (h.tutar ?? 0), 0)

  const sutunTikla = (alan) => {
    if (siralamaAlan === alan) setSiralamaYon(y => y === 'azalan' ? 'artan' : 'azalan')
    else { setSiralamaAlan(alan); setSiralamaYon('azalan') }
  }

  const SiralamaIkon = ({ alan }) => {
    if (siralamaAlan !== alan) return null
    return <i className={`bi bi-arrow-${siralamaYon === 'azalan' ? 'down' : 'up'}`} style={{ fontSize:11, marginLeft:3 }} />
  }

  const girismi = tip === 'giris'
  const tipRenk = girismi ? renkler.success : renkler.danger
  const tipBg   = girismi ? hexRgba(renkler.success, 0.12) : hexRgba(renkler.danger, 0.1)

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center`}>
        <div className={`${p}-modal-box`} style={{ maxWidth:600, maxHeight:'88vh' }} aria-labelledby="kategori-detay-modal-title">

          <div className={`${p}-modal-header ${p}-mh-default`}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h2 id="kategori-detay-modal-title" className={`${p}-modal-title`}>{kategori}</h2>
              <span className="badge" style={{ background:tipBg, color:tipRenk, fontWeight:700, fontSize:12 }}>
                {girismi ? 'Giriş' : 'Çıkış'}
              </span>
            </div>
            <button onClick={onClose} className={`${p}-modal-close`}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className={`${p}-modal-body`} style={{ padding:0 }}>
            {sirali.length === 0 ? (
              <div className={`${p}-kasa-text-muted`} style={{ textAlign:'center', padding:'40px', fontSize:14 }}>
                Bu kategoriye ait işlem bulunamadı.
              </div>
            ) : (
              <div className="table-responsive">
                <table className={`${p}-kasa-table`}>
                  <thead>
                    <tr>
                      <th onClick={() => sutunTikla('tarih')} style={{ cursor:'pointer', userSelect:'none' }}>
                        Tarih <SiralamaIkon alan="tarih" />
                      </th>
                      <th onClick={() => sutunTikla('baglanti')} style={{ cursor:'pointer', userSelect:'none' }}>
                        Bağlantı Türü <SiralamaIkon alan="baglanti" />
                      </th>
                      <th onClick={() => sutunTikla('tutar')} style={{ textAlign:'right', cursor:'pointer', userSelect:'none' }}>
                        Tutar <SiralamaIkon alan="tutar" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sirali.map(h => (
                      <tr key={h.id}>
                        <td className={`${p}-kasa-text-muted`} style={{ whiteSpace:'nowrap' }}>{tarihFmt(h.tarih)}</td>
                        <td className={`${p}-kasa-text-primary`} style={{ fontWeight:600 }}>{h.baglanti_turu || '—'}</td>
                        <td className="financial-num" style={{ textAlign:'right', fontWeight:800, color:tipRenk, whiteSpace:'nowrap' }}>
                          {TL(h.tutar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className={`${p}-kasa-text-sec`} style={{ fontWeight:700 }}>Toplam</td>
                      <td className="financial-num" style={{ textAlign:'right', fontWeight:900, fontSize:14, color:tipRenk }}>
                        {TL(toplam)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Gösterge Paneli ──────────────────────────────────────────────────────────
export default function GostergePaneli({ hareketler, kapanislar, yatirimGuncelDeger, secilenAy, secilenYil, p, renkler, kasaOzet }) {

  // ─── Hesaplamalar ────────────────────────────────────────────────────────
  const hesap = useMemo(() => {
    const siraliKap = [...kapanislar].sort((a,b) => donemNormalize(a.donem).localeCompare(donemNormalize(b.donem)))
    const sonKapanis = siraliKap[siraliKap.length - 1] || null

    // Kasa özet verileri — backend kümülatif + kalibrasyon bakiyeleri
    const merkezKasa     = kasaOzet?.merkez_kasa_bakiye ?? 0
    const bankaBakiye    = kasaOzet?.banka_bakiye ?? 0
    const gecenAyGiris   = kasaOzet?.gecen_ay_giris ?? 0
    const gecenAyCikis   = kasaOzet?.gecen_ay_cikis ?? 0
    const odenecekCekler = kasaOzet?.bu_ay_odenecek_cekler ?? 0
    const tahsilCekler   = kasaOzet?.bu_ay_tahsil_cekler ?? 0

    // Bilançodan gelen değerler (stok, alacak, borç)
    const sanalStok = sonKapanis ? sonKapanis.sanal_stok : 0
    const alacaklar = sonKapanis ? sonKapanis.alacaklar : 0
    const borclar   = sonKapanis ? sonKapanis.borclar : 0

    // Şirketin Net Değeri = tüm varlıklar toplamı − borçlar
    // Merkez Kasa + Banka: Gelir/Gider kümülatifinden (canlı)
    // Yatırım: Yatırım kasası güncel değerden
    // Stok, Alacak, Borç: Son bilançodan
    const netDeger = merkezKasa + bankaBakiye + yatirimGuncelDeger + sanalStok + alacaklar - borclar

    // Aylık giriş/çıkış hareketlerden (bu ay toplam ciro / toplam gider)
    const aylikGiris = hareketler.filter(h => h.islem_tipi === 'giris').reduce((s,h) => s+(h.tutar ?? 0), 0)
    const aylikCikis = hareketler.filter(h => h.islem_tipi === 'cikis').reduce((s,h) => s+(h.tutar ?? 0), 0)

    // Sabit giderler — birden fazla sabit kategori toplanır
    const SABIT_KATEGORILER = [
      'Personel Maaşı', 'Personel SGK / Prim', 'Personel Yemek',
      'Kira / Aidat', 'Faturalar', 'Kredi / Taksit Ödemesi'
    ]
    const aylikSabitGider = hareketler
      .filter(h => h.islem_tipi === 'cikis' && SABIT_KATEGORILER.includes(h.kategori))
      .reduce((s,h) => s + (h.tutar ?? 0), 0)

    // Trend yüzdeleri (geçen aya göre)
    const girisTrend = gecenAyGiris > 0 ? ((aylikGiris - gecenAyGiris) / gecenAyGiris) * 100 : null
    const cikisTrend = gecenAyCikis > 0 ? ((aylikCikis - gecenAyCikis) / gecenAyCikis) * 100 : null

    // Nakit Tamponu = (hazır nakit + tahsildeki çekler) − (sabit giderler + borç çekleri)
    const tampon = (merkezKasa + bankaBakiye + tahsilCekler) - (aylikSabitGider + odenecekCekler)
    const tamponDurum = tampon > 0
      ? { label:'Güvenli', renk:renkler.success, ikon:'bi-shield-check', bg:hexRgba(renkler.success, 0.1) }
      : tampon >= -5000
        ? { label:'Dikkat', renk:renkler.accent, ikon:'bi-exclamation-triangle', bg:hexRgba(renkler.accent, 0.1) }
        : { label:'Riskli', renk:renkler.danger, ikon:'bi-x-circle', bg:hexRgba(renkler.danger, 0.1) }

    return {
      sonKapanis, netDeger, sanalStok, alacaklar, borclar,
      merkezKasa, bankaBakiye, aylikGiris, aylikCikis,
      gecenAyGiris, gecenAyCikis, girisTrend, cikisTrend,
      aylikSabitGider, odenecekCekler, tahsilCekler, tampon, tamponDurum,
    }
  }, [kapanislar, hareketler, yatirimGuncelDeger, kasaOzet, renkler])

  const {
    sonKapanis, netDeger, sanalStok, alacaklar, borclar,
    merkezKasa, bankaBakiye, aylikGiris, aylikCikis,
    girisTrend, cikisTrend,
    aylikSabitGider, odenecekCekler, tahsilCekler, tampon, tamponDurum,
  } = hesap

  return (
    <div>

      {/* ══════════════════════════════════════════════════════════════
          SATIR 1 — ANA KPI KARTLARI (3'lü Grid)
          ══════════════════════════════════════════════════════════════ */}
      <div className={`${p}-kpi-grid-3`} style={{ marginBottom:16 }}>

        {/* ── 1. Merkez Kasa Bakiyemiz ── */}
        <div className={`${p}-kpi-card`}>
          <i className="bi bi-safe2 p-kpi-deco" style={{ color: renkler.info }} />
          <h6 className={`${p}-kpi-label`}>Merkez Kasa Bakiyemiz</h6>
          <div className={`${p}-kpi-value financial-num`}>
            {TL(merkezKasa)}
          </div>
          <p className={`${p}-kpi-sub neutral`}>Güncel bakiye</p>
        </div>

        {/* ── 2. Bu Ay Toplam Giren Para ── */}
        <div className={`${p}-kpi-card`}>
          <i className="bi bi-arrow-down-circle-fill p-kpi-deco" style={{ color: renkler.success }} />
          <h6 className={`${p}-kpi-label`}>Bu Ay Toplam Giren</h6>
          <div className={`${p}-kpi-value financial-num`} style={{ color: renkler.success }}>
            +{TL(aylikGiris)}
          </div>
          {girisTrend !== null ? (
            <div style={{ marginTop:6 }}>
              <DegisimBadge fark={girisTrend} renkler={renkler} />
            </div>
          ) : (
            <p className={`${p}-kpi-sub neutral`}>İlk ay verisi</p>
          )}
        </div>

        {/* ── 3. Bu Ay Toplam Çıkan Para ── */}
        <div className={`${p}-kpi-card`}>
          <i className="bi bi-arrow-up-circle-fill p-kpi-deco" style={{ color: renkler.danger }} />
          <h6 className={`${p}-kpi-label`}>Bu Ay Toplam Çıkan</h6>
          <div className={`${p}-kpi-value financial-num`} style={{ color: renkler.danger }}>
            −{TL(aylikCikis)}
          </div>
          {cikisTrend !== null ? (
            <div style={{ marginTop:6 }}>
              <DegisimBadge fark={cikisTrend} tersCevirim={true} renkler={renkler} />
            </div>
          ) : (
            <p className={`${p}-kpi-sub neutral`}>İlk ay verisi</p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SATIR 2 — İKİNCİL KPI KARTLARI (3'lü Grid)
          ══════════════════════════════════════════════════════════════ */}
      <div className="row g-3">

        {/* ── 4. Güncel Banka Bakiyesi ── */}
        <div className="col-12 col-md-4">
          <div className={`${p}-kpi-card`} style={{ height:'100%' }}>
            <i className="bi bi-bank2 p-kpi-deco" style={{ color: renkler.info }} />
            <h6 className={`${p}-kpi-label`}>Güncel Banka Bakiyesi</h6>
            <div className={`${p}-kpi-value financial-num`}>
              {TL(bankaBakiye)}
            </div>
            <p className={`${p}-kpi-sub neutral`}>Güncel bakiye</p>
          </div>
        </div>

        {/* ── 5. Şirketin Net Değeri (Detaylı) ── */}
        <div className="col-12 col-md-4">
          <div className={`${p}-kasa-gp-hero`} style={{ height:'100%' }}>
            <div className={`${p}-kasa-gp-hero-header`}>
              <div className={`${p}-kasa-icon-box-sm`} style={{ background: hexRgba(renkler.info, 0.12) }}>
                <i className="bi bi-building" style={{ color: renkler.info, fontSize:16 }} />
              </div>
              <span className={`${p}-kasa-text-label`} style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.9px' }}>Şirketin Net Değeri</span>
            </div>

            <div className={`${p}-kasa-gp-hero-body`}>
              <div className={`${p}-kasa-text-muted`} style={{ fontSize:10, fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.7px' }}>
                Kasa + Banka + Yatırım + Stok + Alacak − Borç
              </div>
              <div className={`financial-num ${p}-kasa-fin-num`} style={{
                fontSize:'clamp(20px, 4vw, 32px)', fontWeight:800,
                color: renkler.text, letterSpacing:'-0.02em', lineHeight:1, marginBottom:14,
                textShadow: `0 0 28px ${hexRgba(renkler.info, 0.18)}`
              }}>
                {TL(netDeger)}
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <div className={`${p}-kasa-gp-tile`}>
                    <div className={`${p}-kasa-text-muted`} style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Merkez Kasa</div>
                    <div className={`financial-num ${p}-kasa-fin-num`} style={{ fontSize:11, fontWeight:700, color: renkler.success }}>{TL(merkezKasa)}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`${p}-kasa-gp-tile`}>
                    <div className={`${p}-kasa-text-muted`} style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Banka</div>
                    <div className={`financial-num ${p}-kasa-fin-num`} style={{ fontSize:11, fontWeight:700, color: renkler.success }}>{TL(bankaBakiye)}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`${p}-kasa-gp-tile`}>
                    <div className={`${p}-kasa-text-muted`} style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Yatırım</div>
                    <div className={`financial-num ${p}-kasa-fin-num`} style={{ fontSize:11, fontWeight:700, color: renkler.primary }}>{TL(yatirimGuncelDeger)}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`${p}-kasa-gp-tile`}>
                    <div className={`${p}-kasa-text-muted`} style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Sanal Stok</div>
                    <div className={`financial-num ${p}-kasa-fin-num`} style={{ fontSize:11, fontWeight:700, color: renkler.primary }}>{TL(sanalStok)}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`${p}-kasa-gp-tile`} style={{ background: hexRgba(renkler.success, 0.06), borderColor: hexRgba(renkler.success, 0.12) }}>
                    <div style={{ fontSize:9, fontWeight:700, color: hexRgba(renkler.success, 0.6), textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Alacaklar</div>
                    <div className={`financial-num ${p}-kasa-fin-num`} style={{ fontSize:11, fontWeight:700, color: renkler.success }}>{TL(alacaklar)}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`${p}-kasa-gp-tile`} style={{ background: hexRgba(renkler.danger, 0.06), borderColor: hexRgba(renkler.danger, 0.12) }}>
                    <div style={{ fontSize:9, fontWeight:700, color: hexRgba(renkler.danger, 0.6), textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Borçlar</div>
                    <div className={`financial-num ${p}-kasa-fin-num`} style={{ fontSize:11, fontWeight:700, color: renkler.danger }}>−{TL(borclar)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 6. Operasyonel Nakit Tamponu ── */}
        <div className="col-12 col-md-4">
          <div className={`${p}-kasa-gp-hero`} style={{ height:'100%' }}>
            <div className={`${p}-kasa-gp-hero-header`}>
              <div className={`${p}-kasa-icon-box-sm`} style={{ background: tamponDurum.bg }}>
                <i className={`bi ${tamponDurum.ikon}`} style={{ color: tamponDurum.renk, fontSize:16 }} />
              </div>
              <span className={`${p}-kasa-text-label`} style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.9px' }}>Nakit Tamponu</span>
              <span style={{
                marginLeft:'auto', fontSize:11, fontWeight:700, padding:'4px 11px', borderRadius:10,
                background: tamponDurum.bg, color: tamponDurum.renk, whiteSpace:'nowrap', flexShrink:0
              }}>
                <i className={`bi ${tamponDurum.ikon} me-1`} style={{ fontSize:10 }} />{tamponDurum.label}
              </span>
            </div>

            <div className={`${p}-kasa-gp-hero-body`}>
              <div className={`${p}-kasa-text-muted`} style={{ fontSize:10, fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.7px' }}>
                (Nakit + Tahsil Çek) − (Sabit Gider + Borç Çek)
              </div>
              <div className={`financial-num ${p}-kasa-fin-num`} style={{
                fontSize:'clamp(20px, 4vw, 32px)', fontWeight:800,
                color: tamponDurum.renk, letterSpacing:'-0.02em', lineHeight:1, marginBottom:14,
                textShadow: `0 0 28px ${hexRgba(tamponDurum.renk, 0.2)}`
              }}>
                {tampon >= 0 ? '+' : ''}{TL(tampon)}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div className="d-flex justify-content-between align-items-center" style={{ padding:'6px 0', borderTop: `1px solid ${hexRgba(renkler.text, 0.06)}` }}>
                  <span className={`${p}-kasa-text-muted`} style={{ fontSize:11, fontWeight:600 }}>
                    <i className="bi bi-plus-circle me-1" style={{ color: renkler.success, fontSize:10 }} />Hazır Nakit
                  </span>
                  <span className={`financial-num ${p}-kasa-text-sec`} style={{ fontSize:12, fontWeight:700 }}>
                    {TL(merkezKasa + bankaBakiye)}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className={`${p}-kasa-text-muted`} style={{ fontSize:11, fontWeight:600 }}>
                    <i className="bi bi-plus-circle me-1" style={{ color: renkler.success, fontSize:10 }} />Tahsildeki Çekler
                  </span>
                  <span className={`financial-num ${p}-kasa-text-sec`} style={{ fontSize:12, fontWeight:700 }}>
                    {TL(tahsilCekler)}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className={`${p}-kasa-text-muted`} style={{ fontSize:11, fontWeight:600 }}>
                    <i className="bi bi-dash-circle me-1" style={{ color: renkler.danger, fontSize:10 }} />Sabit Giderler
                  </span>
                  <span className={`financial-num ${p}-kasa-text-sec`} style={{ fontSize:12, fontWeight:700 }}>
                    {TL(aylikSabitGider)}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className={`${p}-kasa-text-muted`} style={{ fontSize:11, fontWeight:600 }}>
                    <i className="bi bi-dash-circle me-1" style={{ color: renkler.danger, fontSize:10 }} />Borç Çekleri
                  </span>
                  <span className={`financial-num ${p}-kasa-text-sec`} style={{ fontSize:12, fontWeight:700 }}>
                    {TL(odenecekCekler)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
