/**
 * TekrarlayanIslemler.jsx — v2 (ParamGo Tasarım Sistemi)
 *
 * Otomatik tekrar eden sabit gelir ve giderlerin yönetimi.
 * Gider/Gelir tab switcher ile tek sayfada görüntülenir.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import tekrarlayanIslemApi from '../../api/tekrarlayanIslem'
import useTemaStore from '../../stores/temaStore'
import { temaRenkleri, hexRgba } from '../../lib/temaRenkleri'
import { createPortal } from 'react-dom'
import SwipeCard from '../../components/SwipeCard'
import { DateInput } from '../../components/ui/DateInput'

/* ═══ YARDIMCI FONKSİYONLAR ═══ */

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n || 0)

const tarihKisa = (t) => {
  if (!t) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' })
    .format(new Date(t + 'T00:00:00'))
}

const bugunStr = () => new Date().toISOString().slice(0, 10)

const gunFarki = (t) => {
  if (!t) return null
  const b = new Date(); b.setHours(0, 0, 0, 0)
  return Math.floor((new Date(t + 'T00:00:00') - b) / 86400000)
}

const formatParaInput = (value) => {
  let v = value.replace(/[^0-9,]/g, '')
  const parts = v.split(',')
  if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = v.split(',')
  const formatted = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? formatted + ',' + kesir.slice(0, 2) : formatted
}
const parseParaInput = (f) => parseFloat(String(f).replace(/\./g, '').replace(',', '.')) || 0

/* ═══ SABİTLER ═══ */

const PERIYOTLAR = [
  { value: 'gunluk',   label: 'Günlük',  icon: 'bi-calendar-day' },
  { value: 'haftalik', label: 'Haftalık', icon: 'bi-calendar-week' },
  { value: 'aylik',    label: 'Aylık',    icon: 'bi-calendar-month' },
  { value: 'yillik',   label: 'Yıllık',   icon: 'bi-calendar-event' },
]

/* ── Gider kategorileri — 7 grup, tüm işletme türleri ── */
const GIDER_GRUPLARI = [
  {
    key: 'personel', label: 'Personel & İK', ikon: 'bi-people-fill',
    altlar: [
      { value: 'Personel Maaşı',          ikon: 'bi-person-badge' },
      { value: 'SGK / Prim Ödemesi',      ikon: 'bi-shield-plus' },
      { value: 'Yemek Kartı',             ikon: 'bi-cup-hot' },
      { value: 'Ulaşım / Servis',         ikon: 'bi-bus-front' },
      { value: 'Özel Sağlık Sigortası',   ikon: 'bi-heart-pulse' },
      { value: 'Muhasebeci / Mali Müşavir', ikon: 'bi-calculator' },
    ],
  },
  {
    key: 'kira', label: 'Kira & Mülk', ikon: 'bi-building',
    altlar: [
      { value: 'İşyeri Kirası',              ikon: 'bi-building' },
      { value: 'Depo / Ambar Kirası',        ikon: 'bi-box-seam' },
      { value: 'Aidat / Ortak Alan',         ikon: 'bi-people' },
      { value: 'Uzun Vadeli Araç Kiralama',  ikon: 'bi-truck' },
      { value: 'Ekipman / Makine Kiralama',  ikon: 'bi-gear' },
    ],
  },
  {
    key: 'faturalar', label: 'Faturalar & Abonelik', ikon: 'bi-receipt',
    altlar: [
      { value: 'Elektrik',                   ikon: 'bi-lightning-charge' },
      { value: 'Su',                          ikon: 'bi-droplet' },
      { value: 'Doğalgaz',                    ikon: 'bi-fire' },
      { value: 'İnternet',                    ikon: 'bi-wifi' },
      { value: 'Telefon / GSM',               ikon: 'bi-phone' },
      { value: 'Yazılım Aboneliği (SaaS)',    ikon: 'bi-cloud-check' },
      { value: 'Bulut / Depolama Hizmeti',    ikon: 'bi-cloud' },
    ],
  },
  {
    key: 'kredi', label: 'Kredi & Finansman', ikon: 'bi-credit-card-2-front',
    altlar: [
      { value: 'Banka Kredisi Taksidi',       ikon: 'bi-bank' },
      { value: 'Kredi Kartı Borcu',           ikon: 'bi-credit-card' },
      { value: 'Leasing Ödemesi',             ikon: 'bi-file-earmark-text' },
      { value: 'Faktoring / Finansman Gideri', ikon: 'bi-arrow-left-right' },
    ],
  },
  {
    key: 'sigorta', label: 'Sigorta & Vergi', ikon: 'bi-shield-check',
    altlar: [
      { value: 'İşyeri Sigortası',            ikon: 'bi-building-check' },
      { value: 'Araç Kasko / Trafik Sigortası', ikon: 'bi-car-front' },
      { value: 'Yangın / Hırsızlık Sigortası', ikon: 'bi-fire' },
      { value: 'KDV / Vergi Ödemesi',         ikon: 'bi-bank2' },
      { value: 'Belediye Hizmet Bedeli',       ikon: 'bi-geo-alt' },
    ],
  },
  {
    key: 'pazarlama', label: 'Pazarlama & Dijital', ikon: 'bi-megaphone',
    altlar: [
      { value: 'Google / Meta Reklam',         ikon: 'bi-google' },
      { value: 'Web Sitesi / Domain',          ikon: 'bi-globe' },
      { value: 'Sosyal Medya Yönetimi',        ikon: 'bi-instagram' },
      { value: 'E-ticaret Platform Ücreti',    ikon: 'bi-cart3' },
      { value: 'Dijital Ajans / SEO',          ikon: 'bi-graph-up' },
    ],
  },
  {
    key: 'bakim', label: 'Bakım & Hizmet', ikon: 'bi-tools',
    altlar: [
      { value: 'Temizlik Hizmeti',             ikon: 'bi-stars' },
      { value: 'Güvenlik / Alarm Sistemi',     ikon: 'bi-shield' },
      { value: 'Araç Bakım / Servis',          ikon: 'bi-wrench-adjustable' },
      { value: 'Makine Bakım Sözleşmesi',      ikon: 'bi-gear-wide-connected' },
      { value: 'IT / Teknik Destek',           ikon: 'bi-pc-display' },
      { value: 'Çay / Kırtasiye / Sarf',       ikon: 'bi-cup-hot' },
      { value: 'Diğer İşletme Gideri',         ikon: 'bi-three-dots' },
    ],
  },
]

/* ── Gelir kategorileri — 5 grup, tüm işletme türleri ── */
const GELIR_GRUPLARI = [
  {
    key: 'tahsilat', label: 'Müşteri Tahsilatları', ikon: 'bi-people-fill',
    altlar: [
      { value: 'Taksitli Satış Tahsilatı',    ikon: 'bi-cash-coin' },
      { value: 'Müşteri Borç Tahsilatı',        ikon: 'bi-person-check' },
      { value: 'Abonelik / Üyelik Tahsilatı', ikon: 'bi-collection' },
      { value: 'E-ticaret Tahsilatı',          ikon: 'bi-cart-check' },
      { value: 'Sipariş Avansı / Kaparo',      ikon: 'bi-cash-stack' },
    ],
  },
  {
    key: 'kira', label: 'Kira & Lisans', ikon: 'bi-building',
    altlar: [
      { value: 'Kira Geliri',                  ikon: 'bi-building' },
      { value: 'Depo / Alan Kiralama Geliri',  ikon: 'bi-box-seam' },
      { value: 'Araç / Ekipman Kiralama Geliri', ikon: 'bi-truck' },
      { value: 'Franchise / Lisans Geliri',    ikon: 'bi-file-earmark-check' },
    ],
  },
  {
    key: 'finansal', label: 'Finansal Gelirler', ikon: 'bi-bank2',
    altlar: [
      { value: 'Mevduat / Repo Faizi',         ikon: 'bi-percent' },
      { value: 'Temettü / Kâr Payı',           ikon: 'bi-graph-up-arrow' },
      { value: 'Kur Farkı Geliri',             ikon: 'bi-currency-exchange' },
      { value: 'Yatırım Getirisi',             ikon: 'bi-gem' },
      { value: 'Komisyon / Aracılık Geliri',   ikon: 'bi-award' },
    ],
  },
  {
    key: 'hizmet', label: 'Hizmet & Sözleşme', ikon: 'bi-briefcase',
    altlar: [
      { value: 'Danışmanlık Ücreti',           ikon: 'bi-person-badge' },
      { value: 'Servis / Bakım Sözleşmesi',    ikon: 'bi-tools' },
      { value: 'Proje / Hakediş Ödemesi',      ikon: 'bi-file-earmark-ruled' },
      { value: 'Teknik Destek Sözleşmesi',     ikon: 'bi-pc-display' },
      { value: 'Eğitim / Kurs Geliri',         ikon: 'bi-mortarboard' },
    ],
  },
  {
    key: 'dijital', label: 'Dijital & Platform', ikon: 'bi-globe',
    altlar: [
      { value: 'Platform / Marketplace Payı',  ikon: 'bi-shop' },
      { value: 'Reklam / Sponsorluk Geliri',   ikon: 'bi-megaphone' },
      { value: 'Affiliate / Ortaklık Komisyonu', ikon: 'bi-link-45deg' },
      { value: 'İçerik / Telif Geliri',        ikon: 'bi-camera-video' },
      { value: 'Diğer Düzenli Gelir',          ikon: 'bi-three-dots' },
    ],
  },
]

const ODEME_KAYNAKLARI = [
  { key: 'banka',       label: 'Banka Havalesi', ikon: 'bi-bank' },
  { key: 'merkez_kasa', label: 'Merkez Kasa',    ikon: 'bi-safe2' },
]

const GIRIS_KAYNAKLARI = [
  { key: 'banka',       label: 'Banka / Havale', ikon: 'bi-bank2' },
  { key: 'merkez_kasa', label: 'Merkez Kasa',    ikon: 'bi-safe2' },
]

const BOS_FORM = {
  baslik: '', kategori: '', tutarStr: '', odeme_kaynagi: 'banka',
  periyot: 'aylik', tekrar_gunu: '', baslangic_tarihi: bugunStr(),
  bitis_tarihi: '', aciklama: '',
}

const grupBul = (gruplari, kategori) =>
  gruplari.find(g => g.altlar.some(a => a.value === kategori))

/* ═══ TEKRARLAYAN İŞLEM MODALI ═══ */

function TekrarlayanModal({
  open, onClose, form, setForm, duzenleId, onKaydet,
  p, renkler, islemTipi,
}) {
  const isGider = islemTipi === 'cikis'
  const gruplari = isGider ? GIDER_GRUPLARI : GELIR_GRUPLARI
  const kaynaklari = isGider ? ODEME_KAYNAKLARI : GIRIS_KAYNAKLARI
  const accentColor = isGider ? renkler.danger : renkler.success
  const kaynakLabel = isGider ? 'Çıkış Yeri' : 'Giriş Yeri'

  const [acikGrup, setAcikGrup] = useState(null)
  const [modalYukleniyor, setModalYukleniyor] = useState(false)
  const [modalHata, setModalHata] = useState('')

  useEffect(() => {
    if (open) {
      setModalHata('')
      setModalYukleniyor(false)
      if (form.kategori) {
        const g = grupBul(gruplari, form.kategori)
        setAcikGrup(g?.key || null)
      } else {
        setAcikGrup(null)
      }
    }
  }, [open, form.kategori, gruplari])

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

  const kaydet = async (e) => {
    e.preventDefault()
    if (!form.kategori) { setModalHata('Kategori seçiniz'); return }
    const tutar = parseParaInput(form.tutarStr)
    if (tutar <= 0) { setModalHata('Tutar sıfırdan büyük olmalıdır'); return }

    setModalYukleniyor(true)
    setModalHata('')

    const veri = {
      baslik: form.baslik.trim(),
      islem_tipi: islemTipi,
      kategori: form.kategori,
      tutar,
      odeme_kaynagi: form.odeme_kaynagi,
      periyot: form.periyot,
      tekrar_gunu: form.tekrar_gunu ? parseInt(form.tekrar_gunu) : null,
      baslangic_tarihi: form.baslangic_tarihi,
      bitis_tarihi: form.bitis_tarihi || null,
      aciklama: form.aciklama.trim() || null,
    }

    try {
      await onKaydet(veri)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.hata || err.response?.data?.mesaj || 'Bir hata oluştu'
      setModalHata(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setModalYukleniyor(false)
    }
  }

  const seciliGrup = grupBul(gruplari, form.kategori)
  const hazirMi = form.kategori && parseParaInput(form.tutarStr) > 0

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
        <div className={`${p}-modal-box`} style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>

          {/* Başlık */}
          <div className={`${p}-modal-header ${p}-mh-default`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={`${p}-modal-icon ${isGider ? `${p}-modal-icon-red` : `${p}-modal-icon-green`}`}>
                <i className={`bi ${isGider ? 'bi-arrow-up-circle-fill' : 'bi-arrow-down-circle-fill'}`} />
              </div>
              <div>
                <h2 className={`${p}-modal-title`}>
                  {duzenleId
                    ? (isGider ? 'Tekrarlayan Gideri Düzenle' : 'Tekrarlayan Geliri Düzenle')
                    : (isGider ? 'Yeni Tekrarlayan Gider' : 'Yeni Tekrarlayan Gelir')
                  }
                </h2>
                <p className={`${p}-modal-sub`}>
                  {isGider ? 'Otomatik tekrar eden gider tanımı' : 'Otomatik tekrar eden gelir tanımı'}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className={`${p}-modal-close`}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <form onSubmit={kaydet}>
            <div className={`${p}-modal-body`}>

              {modalHata && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 12, fontWeight: 600,
                  background: hexRgba(renkler.danger, 0.08), color: renkler.danger,
                  border: `1px solid ${hexRgba(renkler.danger, 0.2)}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <i className="bi bi-exclamation-triangle" />
                  {modalHata}
                </div>
              )}

              {/* İşlem Adı */}
              <div className="mb-3">
                <label className={`${p}-kasa-input-label`}>
                  İşlem Adı <span style={{ color: 'var(--p-color-danger)' }}>*</span>
                </label>
                <input
                  type="text" required
                  placeholder={isGider ? 'Örn: Dükkan Kirası, Personel Maaşı...' : 'Örn: Kira Geliri, Müşteri Taksiti...'}
                  value={form.baslik}
                  onChange={(e) => setForm({ ...form, baslik: e.target.value })}
                  className={`${p}-kasa-input`}
                  style={{ borderRadius: 10 }}
                />
              </div>

              {/* Kategori — Accordion Gruplar */}
              <div className="mb-3">
                <label className={`${p}-kasa-input-label`}>
                  Kategori <span style={{ color: 'var(--p-color-danger)' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {gruplari.map(grup => {
                    const aktifGrup = acikGrup === grup.key
                    const grubuSecili = seciliGrup?.key === grup.key
                    return (
                      <div key={grup.key} style={{
                        border: `1.5px solid ${grubuSecili ? accentColor : 'var(--p-border)'}`,
                        borderRadius: 14, overflow: 'hidden',
                        background: grubuSecili ? hexRgba(accentColor, 0.02) : 'transparent',
                        transition: 'all 0.15s ease',
                      }}>
                        <button
                          type="button"
                          onClick={() => setAcikGrup(aktifGrup ? null : grup.key)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '11px 16px', border: 'none', minHeight: 44,
                            background: grubuSecili ? hexRgba(accentColor, 0.06) : 'var(--p-bg-card)',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                        >
                          <i className={`bi ${grup.ikon}`} style={{
                            fontSize: 16, color: grubuSecili ? accentColor : 'var(--p-text-muted)', flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: 13, fontWeight: grubuSecili ? 700 : 600, flex: 1, textAlign: 'left',
                            color: grubuSecili ? accentColor : 'var(--p-text)',
                          }}>
                            {grup.label}
                            {grubuSecili && (
                              <span style={{ fontSize: 11, marginLeft: 8, fontWeight: 500, opacity: 0.8 }}>
                                — {form.kategori}
                              </span>
                            )}
                          </span>
                          <i className="bi bi-chevron-down" style={{
                            fontSize: 11, color: 'var(--p-text-muted)', flexShrink: 0,
                            transition: 'transform 0.2s ease',
                            transform: aktifGrup ? 'rotate(180deg)' : 'rotate(0deg)',
                          }} />
                        </button>

                        <div style={{ maxHeight: aktifGrup ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
                          <div className="row g-2" style={{ padding: '8px 12px 12px' }}>
                            {grup.altlar.map(alt => {
                              const secili = form.kategori === alt.value
                              return (
                                <div key={alt.value} className="col-6">
                                  <button
                                    type="button"
                                    onClick={() => setForm({ ...form, kategori: alt.value })}
                                    style={{
                                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                      padding: '10px 12px', borderRadius: 10, minHeight: 44,
                                      border: secili ? `2px solid ${accentColor}` : '1.5px solid var(--p-border)',
                                      background: secili ? hexRgba(accentColor, 0.06) : 'var(--p-bg-card)',
                                      cursor: 'pointer', transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <i className={`bi ${alt.ikon}`} style={{
                                      fontSize: 15, color: secili ? accentColor : 'var(--p-text-muted)', flexShrink: 0,
                                    }} />
                                    <span style={{
                                      fontSize: 12, fontWeight: secili ? 700 : 500, lineHeight: 1.3,
                                      color: secili ? accentColor : 'var(--p-text)', textAlign: 'left',
                                    }}>
                                      {alt.value}
                                    </span>
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Giriş / Çıkış Yeri */}
              <div className="mb-3">
                <label className={`${p}-kasa-input-label`}>{kaynakLabel}</label>
                <div className="row g-2 mt-1">
                  {kaynaklari.map(ok => {
                    const secili = form.odeme_kaynagi === ok.key
                    return (
                      <div key={ok.key} className="col-4">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, odeme_kaynagi: ok.key })}
                          style={{
                            width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                            padding: '10px 6px', borderRadius: 14, minHeight: 60,
                            border: secili ? `2px solid ${accentColor}` : '1.5px solid var(--p-border)',
                            background: secili ? hexRgba(accentColor, 0.06) : 'var(--p-bg-card)',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                          }}
                        >
                          <i className={`bi ${ok.ikon}`} style={{ fontSize: 18, color: secili ? accentColor : 'var(--p-text-muted)' }} />
                          <span style={{
                            fontSize: 11, fontWeight: secili ? 700 : 500, lineHeight: 1.3,
                            color: secili ? accentColor : 'var(--p-text)', textAlign: 'center',
                          }}>
                            {ok.label}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tutar + Periyot */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className={`${p}-kasa-input-label`}>
                    Tutar (₺) <span style={{ color: 'var(--p-color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text" required
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.tutarStr}
                    onChange={(e) => setForm({ ...form, tutarStr: formatParaInput(e.target.value) })}
                    className={`${p}-kasa-input`}
                    style={{ color: accentColor, fontWeight: 700, fontSize: 15, borderRadius: 10 }}
                  />
                </div>
                <div className="col-6">
                  <label className={`${p}-kasa-input-label`}>
                    Periyot <span style={{ color: 'var(--p-color-danger)' }}>*</span>
                  </label>
                  <select
                    value={form.periyot}
                    onChange={(e) => setForm({ ...form, periyot: e.target.value })}
                    className={`${p}-kasa-select`}
                    style={{ borderRadius: 10 }}
                  >
                    {PERIYOTLAR.map(pr => <option key={pr.value} value={pr.value}>{pr.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Ayın Günü + Başlangıç */}
              <div className="row g-3 mb-3">
                {form.periyot === 'aylik' && (
                  <div className="col-6">
                    <label className={`${p}-kasa-input-label`}>Ayın Kaçında?</label>
                    <input
                      type="number" min="1" max="31"
                      placeholder="Örn: 1, 15, 28..."
                      value={form.tekrar_gunu}
                      onChange={(e) => setForm({ ...form, tekrar_gunu: e.target.value })}
                      className={`${p}-kasa-input`}
                      style={{ borderRadius: 10 }}
                    />
                  </div>
                )}
                <div className={form.periyot === 'aylik' ? 'col-6' : 'col-12'}>
                  <label className={`${p}-kasa-input-label`}>
                    Başlangıç <span style={{ color: 'var(--p-color-danger)' }}>*</span>
                  </label>
                  <DateInput value={form.baslangic_tarihi}
                    onChange={(val) => setForm({ ...form, baslangic_tarihi: val })}
                    placeholder="Başlangıç tarihi" />
                </div>
              </div>

              {/* Bitiş + Açıklama */}
              <div className="row g-3">
                <div className="col-6">
                  <label className={`${p}-kasa-input-label`}>
                    Bitiş <span style={{ color: 'var(--p-text-muted)', fontWeight: 400, fontSize: 11 }}>(opsiyonel)</span>
                  </label>
                  <DateInput value={form.bitis_tarihi}
                    onChange={(val) => setForm({ ...form, bitis_tarihi: val })}
                    placeholder="Bitiş tarihi" />
                </div>
                <div className="col-6">
                  <label className={`${p}-kasa-input-label`}>Açıklama</label>
                  <input
                    type="text"
                    placeholder="İsteğe bağlı not..."
                    value={form.aciklama}
                    onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                    className={`${p}-kasa-input`}
                    style={{ borderRadius: 10 }}
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className={`${p}-modal-footer`}>
              <button type="button" className={`${p}-btn-cancel`} onClick={onClose} disabled={modalYukleniyor}>
                İptal
              </button>
              <button
                type="submit"
                className={`${p}-btn-save ${p}-btn-save-default`}
                disabled={modalYukleniyor || !hazirMi}
              >
                {modalYukleniyor
                  ? <><i className="bi bi-hourglass-split me-2" />Kaydediliyor...</>
                  : <><i className="bi bi-check-lg me-2" />{duzenleId ? 'Güncelle' : 'Kaydet'}</>
                }
              </button>
            </div>

          </form>
        </div>
      </div>
    </>,
    document.body
  )
}

/* ═══ SİLME ONAY MODALI ═══ */

function SilOnayModal({ silId, onSil, onIptal, yukleniyor, isGider, p }) {
  useEffect(() => {
    if (!silId) return
    const h = (e) => { if (e.key === 'Escape') onIptal() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [silId, onIptal])

  if (!silId) return null

  return (
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center ${p}-modal-confirm`} role="dialog" aria-modal="true">
        <div className={`${p}-modal-box`} style={{ maxWidth: 420 }}>
          <div className={`${p}-modal-header ${p}-mh-danger`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={`${p}-modal-icon ${p}-modal-icon-red`}>
                <i className="bi bi-trash3-fill" />
              </div>
              <div>
                <h2 className={`${p}-modal-title`}>
                  {isGider ? 'Gideri Sil' : 'Geliri Sil'}
                </h2>
                <p className={`${p}-modal-sub`}>Bu işlem geri alınamaz</p>
              </div>
            </div>
            <button type="button" onClick={onIptal} className={`${p}-modal-close`}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
          <div className={`${p}-modal-body`}>
            <p style={{ color: 'var(--p-text)', fontSize: 14 }}>
              Bu tekrarlayan {isGider ? 'gider' : 'gelir'} tanımı kalıcı olarak silinecek. Daha önce oluşturulmuş kasa kayıtları etkilenmez.
            </p>
          </div>
          <div className={`${p}-modal-footer`}>
            <button className={`${p}-btn-cancel`} onClick={onIptal} disabled={yukleniyor}>
              Vazgeç
            </button>
            <button className={`${p}-btn-save ${p}-btn-save-red`} onClick={onSil} disabled={yukleniyor}>
              {yukleniyor
                ? <><i className="bi bi-hourglass-split me-2" />Siliniyor...</>
                : <><i className="bi bi-trash3 me-2" />Evet, Sil</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══ ANA BİLEŞEN ═══ */

export default function TekrarlayanIslemler() {
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = { paramgo: 'p' }[aktifTema] || 'p'
  const renkler = temaRenkleri[aktifTema] || temaRenkleri.paramgo

  /* ── Tab: 'gider' | 'gelir' ── */
  const [aktifTab, setAktifTab] = useState('gider')
  const isGider = aktifTab === 'gider'

  const [liste,         setListe]         = useState([])
  const [yukleniyor,    setYukleniyor]    = useState(true)
  const [apiHatasi,     setApiHatasi]     = useState(false)
  const [arama,         setArama]         = useState('')
  const [filtreAktif,   setFiltreAktif]   = useState('')

  const [showModal,     setShowModal]     = useState(false)
  const [form,          setForm]          = useState({ ...BOS_FORM })
  const [duzenleId,     setDuzenleId]     = useState(null)

  const [silId,         setSilId]         = useState(null)
  const [silYukleniyor, setSilYukleniyor] = useState(false)

  /* ── Veri yükleme ── */
  const veriGetir = useCallback(async () => {
    setYukleniyor(true)
    setApiHatasi(false)
    try {
      const params = { adet: 200, islem_tipi: aktifTab === 'gider' ? 'cikis' : 'giris' }
      if (filtreAktif !== '') params.aktif_mi = filtreAktif
      const res = await tekrarlayanIslemApi.listele(params)
      setListe(res.data?.veri?.islemler || [])
    } catch {
      setApiHatasi(true)
    } finally {
      setYukleniyor(false)
    }
  }, [aktifTab, filtreAktif])

  useEffect(() => { veriGetir() }, [veriGetir])
  useEffect(() => { setArama(''); setFiltreAktif('') }, [aktifTab])

  /* ── KPI ── */
  const kpiStats = useMemo(() => {
    const aktif = liste.filter(i => i.aktif_mi)
    const pasif = liste.filter(i => !i.aktif_mi)

    // Tüm periyotları aylığa normalize et: günlük×30, haftalık×4.3, aylık×1, yıllık÷12
    const normalizeToplam = aktif.reduce((sum, i) => {
      const t = i.tutar || 0
      switch (i.periyot) {
        case 'gunluk':   return sum + t * 30
        case 'haftalik': return sum + t * 4.3
        case 'yillik':   return sum + t / 12
        default:         return sum + t // 'aylik'
      }
    }, 0)

    // Yaklaşan: bugün dahil 3 gün içinde (negatif değil)
    const bekleyen = aktif.filter(i => {
      const fark = gunFarki(i.sonraki_calistirma)
      return fark !== null && fark >= 0 && fark <= 3
    }).length

    // Gecikmiş: sonraki_calistirma geçmiş (negatif fark)
    const gecikmisSayi = aktif.filter(i => {
      const fark = gunFarki(i.sonraki_calistirma)
      return fark !== null && fark < 0
    }).length

    return { aktifSayi: aktif.length, pasifSayi: pasif.length, normalizeToplam, bekleyen, gecikmisSayi }
  }, [liste])

  /* ── Arama filtresi ── */
  const filtrelenmis = liste.filter((item) => {
    if (!arama.trim()) return true
    const q = arama.trim().toLowerCase()
    return (
      (item.baslik || '').toLowerCase().includes(q) ||
      (item.kategori || '').toLowerCase().includes(q)
    )
  })

  /* ── Modal aç ── */
  const yeniAc = () => {
    setForm({ ...BOS_FORM })
    setDuzenleId(null)
    setShowModal(true)
  }

  const duzenleAc = (item) => {
    setForm({
      baslik: item.baslik || '',
      kategori: item.kategori || '',
      tutarStr: item.tutar ? formatParaInput(String(item.tutar).replace('.', ',')) : '',
      odeme_kaynagi: item.odeme_kaynagi || 'banka',
      periyot: item.periyot || 'aylik',
      tekrar_gunu: item.tekrar_gunu ? String(item.tekrar_gunu) : '',
      baslangic_tarihi: item.baslangic_tarihi || bugunStr(),
      bitis_tarihi: item.bitis_tarihi || '',
      aciklama: item.aciklama || '',
    })
    setDuzenleId(item.id)
    setShowModal(true)
  }

  /* ── Kaydet / Durum / Sil ── */
  const handleKaydet = async (veri) => {
    if (duzenleId) {
      await tekrarlayanIslemApi.guncelle(duzenleId, veri)
    } else {
      await tekrarlayanIslemApi.ekle(veri)
    }
    veriGetir()
  }

  const durumDegistir = async (item) => {
    try {
      await tekrarlayanIslemApi.durumDegistir(item.id, { aktif_mi: item.aktif_mi ? 0 : 1 })
      veriGetir()
    } catch { /* sessiz */ }
  }

  const silOnayla = async () => {
    setSilYukleniyor(true)
    try {
      await tekrarlayanIslemApi.sil(silId)
      setSilId(null)
      veriGetir()
    } catch { /* sessiz */ }
    finally { setSilYukleniyor(false) }
  }

  /* ── Yardımcı badge'ler ── */
  const periyotBadge = (periyot) => {
    const map = {
      gunluk:   `${p}-badge ${p}-badge-info`,
      haftalik: `${p}-badge ${p}-badge-warning`,
      aylik:    `${p}-badge ${p}-badge-success`,
      yillik:   `${p}-badge ${p}-badge-success`,
    }
    const cls = map[periyot] || map.aylik
    const label = PERIYOTLAR.find(pr => pr.value === periyot)?.label || periyot
    return <span className={cls}>{label}</span>
  }

  const sonrakiBadge = (tarih, aktif) => {
    if (!aktif) return <span style={{ color: 'var(--p-text-muted)', fontSize: 12 }}>Duraklatıldı</span>
    const fark = gunFarki(tarih)
    if (fark === null) return '—'
    if (fark < 0) return <span style={{ color: 'var(--p-color-danger)', fontWeight: 600, fontSize: 12 }}>{Math.abs(fark)} gün gecikmiş</span>
    if (fark === 0) return <span style={{ color: 'var(--p-color-warning)', fontWeight: 600, fontSize: 12 }}>Bugün</span>
    if (fark <= 3) return <span style={{ color: 'var(--p-color-warning)', fontSize: 12 }}>{fark} gün kaldı</span>
    return <span style={{ color: 'var(--p-text-muted)', fontSize: 12 }}>{tarihKisa(tarih)}</span>
  }

  const kaynakEtiketi = (kaynak) => {
    const havuz = isGider ? ODEME_KAYNAKLARI : GIRIS_KAYNAKLARI
    const ok = havuz.find(o => o.key === kaynak)
    if (!ok) return <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>—</span>
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--p-text-secondary)' }}>
        <i className={`bi ${ok.ikon}`} style={{ fontSize: 11 }} />{ok.label}
      </span>
    )
  }

  /* ═══ RENDER ═══ */
  return (
    <div className={`${p}-page-root`}>

      {/* ── Sayfa Başlığı ── */}
      <div className={`${p}-page-header`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon${isGider ? ` ${p}-page-header-icon-danger` : ''}`}>
            <i className="bi bi-arrow-repeat" />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>Tekrarlayan İşlemler</h1>
            <p className={`${p}-page-sub`}>Otomatik tekrar eden sabit gelir ve giderlerinizi yönetin</p>
          </div>
        </div>
        <div className={`${p}-page-header-right`}>
          <button onClick={yeniAc} className={`${p}-${isGider ? 'cym-btn-danger' : 'cym-btn-new'} d-none d-md-flex align-items-center gap-2`}>
            <i className="bi bi-plus-lg" />
            {isGider ? 'Gider Tanımla' : 'Gelir Tanımla'}
          </button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div style={{
        display: 'inline-flex', background: 'var(--p-bg-card)',
        border: '1.5px solid var(--p-border)', borderRadius: 14, padding: 4,
        marginBottom: 20, gap: 2,
      }}>
        {[
          { key: 'gider', label: 'Giderler', ikon: 'bi-arrow-up-circle-fill', renk: renkler.danger },
          { key: 'gelir', label: 'Gelirler',  ikon: 'bi-arrow-down-circle-fill', renk: renkler.success },
        ].map(tab => {
          const secili = aktifTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setAktifTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: secili ? 700 : 600, minHeight: 38,
                background: secili ? tab.renk : 'transparent',
                color: secili ? '#fff' : 'var(--p-text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              <i className={`bi ${tab.ikon}`} style={{ fontSize: 14 }} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── KPI Kartları ── */}
      <div className="row g-3 mb-4">

        {/* Kart 1 — Aktif İşlem */}
        <div className="col-12 col-md-4">
          <div className={`${p}-kpi-card ${p}-cym-kpi-card`}>
            <i className={`bi bi-play-circle-fill ${p}-cym-kpi-deco ${p}-cym-kpi-deco-success`} />
            <div className={`${p}-cym-kpi-header`}>
              <div className={`${p}-cym-kpi-bar ${p}-cym-kpi-bar-success`} />
              <h6 className={`${p}-kpi-label`}>Aktif İşlem</h6>
            </div>
            <h2 className={`${p}-kpi-value`}>{kpiStats.aktifSayi}</h2>
            <p className={`${p}-cym-kpi-desc`}>
              {kpiStats.pasifSayi > 0 && (
                <span style={{ marginRight: 6 }}>
                  <i className="bi bi-pause-circle" style={{ marginRight: 3 }} />
                  {kpiStats.pasifSayi} duraklatılmış
                </span>
              )}
              tanımlı tekrarlayan
            </p>
          </div>
        </div>

        {/* Kart 2 — Normalize Aylık Toplam */}
        <div className="col-12 col-md-4">
          <div className={`${p}-kpi-card ${p}-cym-kpi-card`}>
            <i className={`bi ${isGider ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle'} ${p}-cym-kpi-deco ${isGider ? `${p}-cym-kpi-deco-danger` : `${p}-cym-kpi-deco-success`}`} />
            <div className={`${p}-cym-kpi-header`}>
              <div className={`${p}-cym-kpi-bar ${isGider ? `${p}-cym-kpi-bar-danger` : `${p}-cym-kpi-bar-success`}`} />
              <h6 className={`${p}-kpi-label`}>{isGider ? 'Tahmini Aylık Gider' : 'Tahmini Aylık Gelir'}</h6>
            </div>
            <h2 className={`${p}-kpi-value ${isGider ? `${p}-cym-kpi-value-danger` : `${p}-cym-kpi-value-success`} financial-num`}>
              {TL(kpiStats.normalizeToplam)} ₺
            </h2>
            <p className={`${p}-cym-kpi-desc`}>tüm periyotlar aylığa çevrildi</p>
          </div>
        </div>

        {/* Kart 3 — Yaklaşan (3 Gün) */}
        <div className="col-12 col-md-4">
          <div className={`${p}-kpi-card ${p}-cym-kpi-card`}>
            <i className={`bi bi-clock-fill ${p}-cym-kpi-deco`} style={{ color: 'var(--p-color-warning)', opacity: 0.35 }} />
            <div className={`${p}-cym-kpi-header`}>
              <div className={`${p}-cym-kpi-bar`} style={{ background: 'var(--p-color-warning)' }} />
              <h6 className={`${p}-kpi-label`}>Yaklaşan (3 Gün)</h6>
            </div>
            <h2 className={`${p}-kpi-value`} style={{ color: kpiStats.bekleyen > 0 ? renkler.warning : 'var(--p-text)' }}>
              {kpiStats.bekleyen}
            </h2>
            <p className={`${p}-cym-kpi-desc`}>yaklaşan tetikleme</p>
          </div>
        </div>

        {/* Kart 4 — Gecikmiş */}
        <div className="col-6 col-md-4">
          <div className={`${p}-kpi-card ${p}-cym-kpi-card`}>
            <i className={`bi bi-exclamation-triangle-fill ${p}-cym-kpi-deco`} style={{ color: 'var(--p-color-danger)', opacity: 0.35 }} />
            <div className={`${p}-cym-kpi-header`}>
              <div className={`${p}-cym-kpi-bar ${p}-cym-kpi-bar-danger`} />
              <h6 className={`${p}-kpi-label`}>Gecikmiş</h6>
            </div>
            <h2 className={`${p}-kpi-value`} style={{ color: kpiStats.gecikmisSayi > 0 ? 'var(--p-color-danger)' : 'var(--p-text)' }}>
              {kpiStats.gecikmisSayi}
            </h2>
            <p className={`${p}-cym-kpi-desc`}>
              {kpiStats.gecikmisSayi > 0 ? 'tetiklenmemiş işlem' : 'her şey güncel'}
            </p>
          </div>
        </div>

        {/* Kart 5 — Duraklatılmış */}
        <div className="col-6 col-md-4">
          <div className={`${p}-kpi-card ${p}-cym-kpi-card`}>
            <i className={`bi bi-pause-circle-fill ${p}-cym-kpi-deco`} style={{ color: 'var(--p-text-muted)', opacity: 0.35 }} />
            <div className={`${p}-cym-kpi-header`}>
              <div className={`${p}-cym-kpi-bar`} style={{ background: 'var(--p-border)' }} />
              <h6 className={`${p}-kpi-label`}>Duraklatılmış</h6>
            </div>
            <h2 className={`${p}-kpi-value`} style={{ color: kpiStats.pasifSayi > 0 ? 'var(--p-text-muted)' : 'var(--p-text)' }}>
              {kpiStats.pasifSayi}
            </h2>
            <p className={`${p}-cym-kpi-desc`}>pasif tanım</p>
          </div>
        </div>

      </div>

      {/* ── Tablo Paneli ── */}
      <div className={`${p}-cym-glass-card`}>

        {/* Toolbar — Arama + Filtre */}
        <div className={`${p}-cym-toolbar`}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className={`${p}-panel-title`}>
              <i className="bi bi-arrow-repeat" />
              {isGider ? 'Tekrarlayan Giderler' : 'Tekrarlayan Gelirler'}
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className={`${p}-cym-search-wrap`}>
                <i className={`bi bi-search ${p}-cym-search-icon`} />
                <input
                  type="text"
                  placeholder="İsim, kategori ara..."
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                  className={`${p}-cym-search-input`}
                />
              </div>
              <select
                value={filtreAktif}
                onChange={(e) => setFiltreAktif(e.target.value)}
                className={`${p}-kasa-donem-select`}
                style={{ minWidth: 120 }}
              >
                <option value="">Tüm Durum</option>
                <option value="1">Aktif</option>
                <option value="0">Pasif</option>
              </select>
            </div>
          </div>
        </div>

        {/* İçerik */}
        {yukleniyor ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className={`${p}-kasa-spinner`} />
          </div>
        ) : apiHatasi ? (
          <div className={`${p}-empty-state`} style={{ padding: '48px 24px' }}>
            <i className="bi bi-exclamation-triangle" style={{ fontSize: 32, color: 'var(--p-color-danger)' }} />
            <p className="mt-2" style={{ color: 'var(--p-text-muted)', fontSize: 13 }}>Veriler yüklenemedi</p>
            <button onClick={veriGetir} className={`${p}-cym-btn-outline`} style={{ marginTop: 12 }}>
              <i className="bi bi-arrow-clockwise" /> Tekrar Dene
            </button>
          </div>
        ) : filtrelenmis.length === 0 ? (
          <div className={`${p}-empty-state`}>
            <i className="bi bi-arrow-repeat" />
            <h6>
              {arama
                ? 'Arama sonucu bulunamadı'
                : isGider
                  ? 'Henüz tekrarlayan gider tanımlanmamış'
                  : 'Henüz tekrarlayan gelir tanımlanmamış'
              }
            </h6>
            <p>{arama ? 'Farklı bir arama deneyin' : 'Otomatik tekrarlanan işlemlerinizi buradan yönetin'}</p>
            {!arama && (
              <button onClick={yeniAc} className="p-empty-cta">
                <i className="bi bi-plus-lg" />
                <span>{isGider ? 'İlk Gideri Tanımla' : 'İlk Geliri Tanımla'}</span>
              </button>
            )}
          </div>
        ) : (
          <>
          {/* Desktop Tablo */}
          <div className="table-responsive d-none d-md-block">
            <table className={`${p}-cym-table`} style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th className={`${p}-cym-th`} style={{ width: '20%' }}>İşlem Adı</th>
                  <th className={`${p}-cym-th`} style={{ width: '14%' }}>Kategori</th>
                  <th className={`${p}-cym-th text-end`} style={{ width: '13%' }}>Tutar</th>
                  <th className={`${p}-cym-th`} style={{ width: '15%' }}>{isGider ? 'Çıkış Yeri' : 'Giriş Yeri'}</th>
                  <th className={`${p}-cym-th`} style={{ width: '10%' }}>Periyot</th>
                  <th className={`${p}-cym-th`} style={{ width: '12%' }}>Sonraki</th>
                  <th className={`${p}-cym-th text-center`} style={{ width: '9%' }}>Durum</th>
                  <th className={`${p}-cym-th`} style={{ width: '7%' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmis.map((item, idx) => (
                  <tr key={item.id} className={`${p}-cym-tr ${idx % 2 !== 0 ? `${p}-cym-tr-alt` : ''}`} style={{ opacity: item.aktif_mi ? 1 : 0.55 }}>
                    <td className={`${p}-cym-td`}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--p-text)' }}>{item.baslik}</div>
                      {item.aciklama && (
                        <div style={{ fontSize: 11, color: 'var(--p-text-muted)', marginTop: 2 }}>{item.aciklama}</div>
                      )}
                    </td>
                    <td className={`${p}-cym-td`} style={{ color: 'var(--p-text-muted)', fontSize: 12 }}>{item.kategori || '—'}</td>
                    <td className={`${p}-cym-td text-end`}>
                      {isGider
                        ? <span className={`${p}-amount-neg financial-num`}>−{TL(item.tutar)} ₺</span>
                        : <span className={`${p}-amount-pos financial-num`}>+{TL(item.tutar)} ₺</span>
                      }
                    </td>
                    <td className={`${p}-cym-td`}>{kaynakEtiketi(item.odeme_kaynagi)}</td>
                    <td className={`${p}-cym-td`}>{periyotBadge(item.periyot)}</td>
                    <td className={`${p}-cym-td`}>{sonrakiBadge(item.sonraki_calistirma, item.aktif_mi)}</td>
                    <td className={`${p}-cym-td text-center`}>
                      <button
                        onClick={() => durumDegistir(item)}
                        title={item.aktif_mi ? 'Duraklatmak için tıkla' : 'Aktifleştirmek için tıkla'}
                        className={`${p}-kasa-badge ${item.aktif_mi ? `${p}-kasa-badge-giris` : `${p}-kasa-badge-cikis`}`}
                        style={{ border: 'none', cursor: 'pointer', minHeight: 30, fontSize: 11, fontWeight: 600 }}
                      >
                        <i className={`bi ${item.aktif_mi ? 'bi-check-circle-fill' : 'bi-pause-circle'} me-1`} />
                        {item.aktif_mi ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className={`${p}-cym-td`}>
                      <div className="d-flex justify-content-end gap-1">
                        <button
                          className={`${p}-cym-action-btn ${p}-cym-action-accent`}
                          onClick={() => duzenleAc(item)}
                          title="Düzenle"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className={`${p}-cym-action-btn ${p}-cym-action-danger`}
                          onClick={() => setSilId(item.id)}
                          title="Sil"
                        >
                          <i className="bi bi-trash3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobil Kart Listesi */}
          <div className="d-md-none">
            <div className="p-swipe-hint"><i className="bi bi-arrow-left-right" /> Sola kaydırarak işlem yapabilirsiniz</div>
            {filtrelenmis.map((item) => (
              <SwipeCard key={item.id} aksiyonlar={[
                { icon: item.aktif_mi ? 'bi-pause-circle' : 'bi-play-circle', label: item.aktif_mi ? 'Duraklat' : 'Aktif', renk: item.aktif_mi ? 'warning' : 'success', onClick: () => durumDegistir(item) },
                { icon: 'bi-pencil', label: 'Düzenle', renk: 'info', onClick: () => duzenleAc(item) },
                { icon: 'bi-trash3', label: 'Sil', renk: 'danger', onClick: () => setSilId(item.id) },
              ]}>
                <div className="p-gg-mcard" style={{ opacity: item.aktif_mi ? 1 : 0.55 }}>
                  <div className="p-gg-mcard-top">
                    <div className="p-gg-mcard-kat" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--p-text)' }}>{item.baslik}</span>
                      <span style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>{item.kategori || '—'}</span>
                    </div>
                    {isGider
                      ? <span className="p-gg-mcard-tutar financial-num" style={{ color: 'var(--p-color-danger)' }}>−{TL(item.tutar)} ₺</span>
                      : <span className="p-gg-mcard-tutar financial-num" style={{ color: 'var(--p-color-success)' }}>+{TL(item.tutar)} ₺</span>
                    }
                  </div>
                  <div className="p-gg-mcard-alt">
                    {periyotBadge(item.periyot)}
                    {sonrakiBadge(item.sonraki_calistirma, item.aktif_mi)}
                    <span style={{ marginLeft: 'auto' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); durumDegistir(item) }}
                        className={`${p}-kasa-badge ${item.aktif_mi ? `${p}-kasa-badge-giris` : `${p}-kasa-badge-cikis`}`}
                        style={{ border: 'none', cursor: 'pointer', minHeight: 26, fontSize: 10, fontWeight: 600, padding: '2px 8px' }}
                      >
                        <i className={`bi ${item.aktif_mi ? 'bi-check-circle-fill' : 'bi-pause-circle'} me-1`} />
                        {item.aktif_mi ? 'Aktif' : 'Pasif'}
                      </button>
                    </span>
                  </div>
                </div>
              </SwipeCard>
            ))}
          </div>
          </>
        )}

      </div>

      {/* ─── Mobil FAB Buton ─────────────────────────────────────────────── */}
      <button
        onClick={yeniAc}
        className={`${p}-${isGider ? 'cym-btn-danger' : 'cym-btn-new'} d-md-none`}
        style={{
          position: 'fixed', bottom: 88, right: 20, zIndex: 1040,
          width: 56, height: 56, borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isGider ? '0 4px 14px rgba(239,68,68,0.3)' : '0 4px 14px rgba(16,185,129,0.3)',
        }}
      >
        <i className="bi bi-plus-lg" style={{ fontSize: 22 }} />
      </button>

      {/* ═══ MODALLER ═══ */}
      <TekrarlayanModal
        open={showModal}
        onClose={() => setShowModal(false)}
        form={form}
        setForm={setForm}
        duzenleId={duzenleId}
        onKaydet={handleKaydet}
        p={p}
        renkler={renkler}
        islemTipi={isGider ? 'cikis' : 'giris'}
      />

      <SilOnayModal
        silId={silId}
        onSil={silOnayla}
        onIptal={() => setSilId(null)}
        yukleniyor={silYukleniyor}
        isGider={isGider}
        p={p}
      />

    </div>
  )
}
