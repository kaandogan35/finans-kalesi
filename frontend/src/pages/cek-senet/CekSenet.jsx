/**
 * CekSenet.jsx — Çek & Senet Yönetimi
 * ParamGo v2 — Tek Tema
 * 5 Tab: Dashboard | Portföydeki | Tahsildeki | Kendi Çekimiz | Cirolanan
 * Bootstrap 5 + Saf React | ParamGo
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import cekSenetApi from '../../api/cekSenet'
import { carilerApi } from '../../api/cariler'
import useTemaStore from '../../stores/temaStore'
import { temaRenkleri } from '../../lib/temaRenkleri'
import { useSinirler } from '../../hooks/useSinirler'
import useAuthStore from '../../stores/authStore'
import SwipeCard, { DynamicAvatar } from '../../components/SwipeCard'
import { DateInput } from '../../components/ui/DateInput'

const prefixMap = { paramgo: 'p' }

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const BANKALAR = [
  'Ziraat Bankası', 'Garanti BBVA', 'İş Bankası', 'Yapı Kredi',
  'Halkbank', 'Vakıfbank', 'TEB', 'QNB Finansbank', 'Akbank', 'DenizBank',
]

// ─── Tür Eşlemeleri ──────────────────────────────────────────────────────────
const TUR_LABEL = {
  alacak_ceki:   'Müşteri Çeki',
  alacak_senedi: 'Müşteri Senedi',
  borc_ceki:     'Kendi Çekimiz',
  borc_senedi:   'Kendi Senedimiz',
}
const TUR_API = {
  'Müşteri Çeki':    'alacak_ceki',
  'Müşteri Senedi':  'alacak_senedi',
  'Kendi Çekimiz':   'borc_ceki',
  'Kendi Senedimiz': 'borc_senedi',
}

// ─── Hex → rgba dönüştürücü ───────────────────────────────────────────────────
function hexRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ─── Tür Badge Konfigürasyonu (tema renklerinden) ─────────────────────────────
function turBadgeCfg(tur, rnk) {
  const map = {
    'Müşteri Çeki':    { renk: rnk.primary,  icon: 'bi-file-earmark-check'  },
    'Müşteri Senedi':  { renk: rnk.success, icon: 'bi-file-earmark-text'   },
    'Kendi Çekimiz':   { renk: rnk.danger,  icon: 'bi-file-earmark-minus'  },
    'Kendi Senedimiz': { renk: rnk.danger,  icon: 'bi-file-earmark-minus'  },
  }
  const cfg = map[tur] || { renk: rnk.textSec, icon: 'bi-file-earmark' }
  return { ...cfg, bg: hexRgba(cfg.renk, 0.12) }
}

// ─── Arşiv Badge Konfigürasyonu (tema renklerinden) ───────────────────────────
function arsivBadgeCfg(kat, rnk) {
  const map = {
    tahsil_edildi:   { renk: rnk.success, label: 'Tahsil Edildi'   },
    kendi_odendi:    { renk: rnk.primary,  label: 'Kendi Ödendi'    },
    ciro_tamamlandi: { renk: rnk.primary, label: 'Devredildi' },
    iade_edildi:     { renk: rnk.info,    label: 'İade Edildi'     },
    karsiliksiz:     { renk: rnk.danger,  label: 'Karşılıksız'    },
    protestolu:      { renk: rnk.danger,  label: 'Protestolu'     },
  }
  const cfg = map[kat] || { renk: rnk.textSec, label: kat }
  return { ...cfg, bg: hexRgba(cfg.renk, 0.12) }
}

function normalize(item) {
  const durum = item.durum
  let tur_kategori = durum
  if (durum === 'odendi')      tur_kategori = 'kendi_odendi'
  if (durum === 'cirolandi')   tur_kategori = 'ciro_tamamlandi'
  return {
    id:                  item.id,
    tur:                 TUR_LABEL[item.tur] || item.tur,
    firma_adi:           item.cari_adi || '',
    cari_id:             item.cari_id  || null,
    asil_borclu:         item.aciklama || '',
    evrak_no:            item.seri_no  || '',
    banka:               item.banka_adi || '',
    vade_tarihi:         item.vade_tarihi      || '',
    islem_tarihi:        item.kesilme_tarihi   || '',
    tahsil_tarihi:       item.tahsil_tarihi    || '',
    ciro_tarihi:         item.ciro_tarihi      || '',
    asil_firma:          item.cari_adi         || '',
    teslim_yeri:         item.ciro_edilen_cari_adi || '',
    ciro_edilen_cari_id: item.ciro_edilen_cari_id  || null,
    tutar:               parseFloat(item.tutar_tl || item.tutar || 0),
    tur_kategori,
    kapanis_tarihi:      item.tahsil_tarihi || item.ciro_tarihi || '',
    serh_tarihi:         item.serh_tarihi         || '',
    karsiliksiz_not:     item.karsiliksiz_not     || '',
    karsiliksiz_aksiyon: item.karsiliksiz_aksiyon || '',
  }
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────
const TL  = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n ?? 0) + ' ₺'
const tarihFmt = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString('tr-TR') : '—'
const bugunStr = () => new Date().toISOString().split('T')[0]

const formatParaInput = (v) => {
  let s = (v || '').replace(/[^0-9,]/g, '')
  const parts = s.split(',')
  if (parts.length > 2) s = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = s.split(',')
  const fmt = (tam || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? fmt + ',' + kesir.slice(0, 2) : fmt
}
const parseParaInput = (f) => parseFloat((f || '').replace(/\./g, '').replace(',', '.')) || 0

function toplam(liste, alan = 'tutar') {
  return liste.reduce((s, i) => s + (i[alan] || 0), 0)
}

// ─── Form Başlangıç Durumları ─────────────────────────────────────────────────
const portfoyBosluk = () => ({
  tur: 'Müşteri Çeki', firma_adi: '', cari_id: null, asil_borclu: '',
  evrak_no: '', banka: '', vade_tarihi: '', islem_tarihi: bugunStr(), tutarStr: '',
})
const kendiBosluk = () => ({
  tur: 'Kendi Çekimiz', firma_adi: '', cari_id: null, asil_borclu: '',
  evrak_no: '', banka: '', vade_tarihi: '', islem_tarihi: bugunStr(), tutarStr: '',
})

// ─────────────────────────────────────────────────────────────────────────────
// Alt Bileşenler
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, children, size = '', scrollable = false, p = 'b', ariaId = '', confirm = false }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, onClose])

  if (!open) return null

  const maxW = size === 'lg' ? 800 : size === 'sm' ? 420 : 560

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center${confirm ? ` ${p}-modal-confirm` : ''}`}>
        <div className={`${p}-modal-box`} role="dialog" aria-labelledby={ariaId || undefined} aria-modal="true" style={{
          maxWidth: maxW,
          maxHeight: scrollable ? '90vh' : 'auto',
          overflow: scrollable ? 'auto' : 'hidden',
        }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}

function OnayModal({ open, onClose, onOnayla, baslik, mesaj, ikon, btnRenk, btnYazi = 'Evet, Devam Et', p = 'b' }) {
  const renk = btnRenk || '#DC2626'
  return (
    <Modal open={open} onClose={onClose} size="sm" p={p} ariaId="cek-onay-modal-title" confirm>
      <div className={`${p}-onay-wrap`}>
        {/* Kapat */}
        <button className={`${p}-onay-kapat`} onClick={onClose} aria-label="Kapat">
          <i className="bi bi-x-lg" />
        </button>
        {/* İkon */}
        <div className={`${p}-onay-ikon-halka`} style={{ background: hexRgba(renk, 0.08), border: `2px solid ${hexRgba(renk, 0.18)}` }}>
          <div className={`${p}-onay-ikon-daire`} style={{ background: renk, boxShadow: `0 6px 18px ${hexRgba(renk, 0.32)}` }}>
            <i className={`bi ${ikon || 'bi-question-circle-fill'}`} />
          </div>
        </div>
        {/* Metin */}
        <h2 id="cek-onay-modal-title" className={`${p}-onay-baslik`}>{baslik}</h2>
        <p className={`${p}-onay-aciklama`}>{mesaj}</p>
        {/* Butonlar — İptal önce ve autoFocus: yanlışlıkla Enter'a basma engeli */}
        <div className={`${p}-onay-butonlar`}>
          <button className={`${p}-onay-iptal`} onClick={onClose} autoFocus>İptal</button>
          <button
            className={`${p}-onay-onayla`}
            style={{ background: renk, boxShadow: `0 4px 14px ${hexRgba(renk, 0.3)}` }}
            onClick={onOnayla}
            tabIndex={-1}
          >
            {btnYazi}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Karşılıksız Çek Rehberlik Modalı ────────────────────────────────────────
function KarsiliksizModal({ open, onClose, item, form, setForm, onKaydet, kayitIyor, p = 'b', renkler }) {
  if (!open || !item) return null

  const serhTarihiVar = !!form.serh_tarihi
  const deadline = serhTarihiVar
    ? (() => {
        const d = new Date(form.serh_tarihi + 'T00:00:00')
        d.setFullYear(d.getFullYear() + 3)
        return d
      })()
    : null

  const bugunMs = new Date().setHours(0, 0, 0, 0)
  const kalanGun = deadline ? Math.ceil((deadline.getTime() - bugunMs) / 86400000) : null
  const kritikMi = kalanGun !== null && kalanGun < 180

  const aksiyonlar = [
    {
      v: 'anlasacagim',
      icon: 'bi-handshake',
      label: 'Anlaşacağım',
      alt: 'Not & ödeme planı',
      renk: 'success',
    },
    {
      v: 'bekleyecegim',
      icon: 'bi-hourglass-split',
      label: 'Bekleyeceğim',
      alt: 'Takibe alındı',
      renk: 'warning',
    },
    {
      v: 'kapatildi',
      icon: 'bi-check-circle-fill',
      label: 'Kapatıldı',
      alt: 'Çözüme kavuştu',
      renk: 'success',
    },
  ]

  const aksiyonRenkMap = {
    success: { cls: `${p}-cym-radio-success`, renk: renkler?.success || '#059669' },
    warning: { cls: `${p}-cym-radio-warning`, renk: renkler?.accent  || '#D97706' },
  }

  return (
    <Modal open={open} onClose={onClose} size="sm" scrollable p={p} ariaId="karsiliksiz-modal-title">
      {/* ── Başlık ─── */}
      <div className={`${p}-modal-header ${p}-mh-danger`}>
        <div className="d-flex align-items-center gap-3">
          <div className={`${p}-modal-icon`} style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.25)' }}>
            <i className="bi bi-exclamation-triangle-fill" />
          </div>
          <div>
            <h2 id="karsiliksiz-modal-title" className={`${p}-modal-title`}>Karşılıksız Çek</h2>
            <div className={`${p}-modal-sub`}>{item.firma_adi} — <span className="financial-num">{new Intl.NumberFormat('tr-TR',{minimumFractionDigits:2}).format(item.tutar??0)+' ₺'}</span></div>
          </div>
        </div>
        <button className={`${p}-modal-close`} onClick={onClose} aria-label="Kapat">
          <i className="bi bi-x-lg" />
        </button>
      </div>

      {/* ── Gövde ─── */}
      <div className={`${p}-modal-body`}>

        {/* Şerh Tarihi */}
        <div className="mb-3">
          <label className={`form-label ${p}-form-label`}>
            <i className="bi bi-calendar-x me-1" style={{ color: renkler?.danger }} />
            Bankadan şerh tarihi neydi?
          </label>
          <DateInput
            value={form.serh_tarihi}
            onChange={(val) => setForm({ ...form, serh_tarihi: val })}
            placeholder="Şerh tarihi"
          />
        </div>

        {/* 3 Yıl Uyarı Kutusu */}
        <div className={`${p}-karsiliksiz-uyari${kritikMi ? ` ${p}-karsiliksiz-uyari-kritik` : ''}`}>
          <i className={`bi ${kritikMi ? 'bi-clock-history' : 'bi-info-circle-fill'}`} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              {kritikMi ? '⚡ Acil — Süre daralıyor!' : '3 Yıllık Hak Kaybı Uyarısı'}
            </div>
            <div style={{ fontSize: 13 }}>
              Karşılıksız çekte <strong>yasal takip hakkı şerh tarihinden itibaren 3 yıl</strong> içinde kullanılmalıdır.
            </div>
            {deadline && (
              <div className={`${p}-karsiliksiz-deadline`} style={{ color: kritikMi ? '#B91C1C' : renkler?.danger }}>
                <i className="bi bi-calendar-event me-1" />
                Son tarih: <strong>{deadline.toLocaleDateString('tr-TR')}</strong>
                {kalanGun !== null && <span style={{ marginLeft: 8, opacity: 0.8 }}>({kalanGun} gün kaldı)</span>}
              </div>
            )}
          </div>
        </div>

        {/* 3 Aksiyon */}
        <div className="mb-3">
          <div className={`${p}-cym-label mb-2`}>Ne yapmayı düşünüyorsunuz?</div>
          <div className="d-flex gap-2">
            {aksiyonlar.map(a => {
              const rc = aksiyonRenkMap[a.renk]
              const secili = form.karsiliksiz_aksiyon === a.v
              return (
                <div
                  key={a.v}
                  className={`${p}-cym-radio-option ${p}-cym-radio-col ${rc.cls} ${secili ? `${p}-cym-radio-selected` : ''}`}
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => setForm({ ...form, karsiliksiz_aksiyon: a.v })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setForm({ ...form, karsiliksiz_aksiyon: a.v })}
                >
                  <i className={`bi ${a.icon} ${p}-cym-radio-icon-lg`} />
                  <span className={`${p}-cym-radio-label`} style={{ textAlign: 'center' }}>{a.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--p-text-muted)', textAlign: 'center' }}>{a.alt}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Not Alanı — seçim yapılınca göster */}
        {form.karsiliksiz_aksiyon && (
          <div className="mb-1">
            <label className={`form-label ${p}-form-label`}>
              {form.karsiliksiz_aksiyon === 'anlasacagim' && 'Anlaşma Planı / Not'}
              {form.karsiliksiz_aksiyon === 'bekleyecegim' && 'Takip Notu'}
              {form.karsiliksiz_aksiyon === 'kapatildi' && 'Kapanış Notu (opsiyonel)'}
            </label>
            <textarea
              className="form-control"
              rows={3}
              style={{ resize: 'vertical', fontSize: 14 }}
              placeholder={
                form.karsiliksiz_aksiyon === 'anlasacagim' ? 'Ör: 3 taksit anlaştık, ilk ödeme 15 Nisan...' :
                form.karsiliksiz_aksiyon === 'bekleyecegim' ? 'Ör: Avukata vereceğim, 30 gün bekleyeceğim...' :
                'Ör: Nakit tahsil edildi, çek iade alındı...'
              }
              value={form.karsiliksiz_not}
              onChange={e => setForm({ ...form, karsiliksiz_not: e.target.value })}
            />
          </div>
        )}

      </div>

      {/* ── Footer ─── */}
      <div className={`${p}-modal-footer`}>
        <button className={`${p}-btn-cancel`} onClick={onClose}>Kapat</button>
        <button
          className={`${p}-btn-save ${p}-btn-save-red`}
          disabled={kayitIyor}
          onClick={onKaydet}
        >
          {kayitIyor
            ? <><i className={`bi bi-hourglass-split ${p}-cym-spin me-2`} />Kaydediliyor...</>
            : <><i className="bi bi-floppy me-2" />Kaydet</>
          }
        </button>
      </div>
    </Modal>
  )
}

function AutoComplete({ value, onChange, options, placeholder, id, required, p = 'b' }) {
  const [acik, setAcik] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setAcik(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filtered = (options || []).filter(o => o.toLowerCase().includes((value || '').toLowerCase()))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        id={id}
        className="form-control"
        value={value || ''}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        style={{ minHeight: 44 }}
        onChange={(e) => { onChange(e.target.value); setAcik(true) }}
        onFocus={() => setAcik(true)}
      />
      {acik && filtered.length > 0 && (
        <ul className={`${p}-autocomplete-list`}>
          {filtered.map(o => (
            <li key={o} className={`${p}-autocomplete-item`}
              onMouseDown={() => { onChange(o); setAcik(false) }}
            >{o}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FiltreSatiri({ filtre, setFiltre, p = 'b' }) {
  const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  const YILLAR = [2024, 2025, 2026, 2027]
  return (
    <div className="d-flex gap-2 align-items-center flex-wrap">
      <select
        className={`form-select form-select-sm ${p}-filter-select`}
        style={{ width: 140, minHeight: 38 }}
        value={filtre.tumZamanlar ? 0 : filtre.ay}
        onChange={(e) => {
          const v = +e.target.value
          if (v === 0) setFiltre({ ...filtre, tumZamanlar: true })
          else setFiltre({ ...filtre, ay: v, tumZamanlar: false })
        }}
      >
        <option value={0}>— Tüm Zamanlar —</option>
        {AYLAR.map((a, i) => <option key={i} value={i + 1}>{a}</option>)}
      </select>
      <select
        className={`form-select form-select-sm ${p}-filter-select`}
        style={{ width: 90, minHeight: 38 }}
        value={filtre.yil}
        disabled={filtre.tumZamanlar}
        onChange={(e) => setFiltre({ ...filtre, yil: +e.target.value, tumZamanlar: false })}
      >
        {YILLAR.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}

function AylikTakvim({ ay, yil, tahsilEvents, odemeEvents, p = 'b', renkler }) {
  const [tooltip, setTooltip] = useState(null)
  const GUN = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

  const ilk   = new Date(yil, ay - 1, 1)
  const sonGun = new Date(yil, ay, 0).getDate()
  const bosluk = ilk.getDay() === 0 ? 6 : ilk.getDay() - 1
  const gunler = [...Array(bosluk).fill(null), ...Array.from({ length: sonGun }, (_, i) => i + 1)]

  const olaylar = (gun) => {
    if (!gun) return { t: [], o: [] }
    const d = `${yil}-${String(ay).padStart(2,'0')}-${String(gun).padStart(2,'0')}`
    return { t: tahsilEvents.filter(e => e.tarih === d), o: odemeEvents.filter(e => e.tarih === d) }
  }

  const now = new Date(); now.setHours(0, 0, 0, 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {GUN.map(g => (
          <div key={g} className={`${p}-cal-header`}>{g}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {gunler.map((gun, i) => {
          const evt    = olaylar(gun)
          const isBugun = gun && new Date(yil, ay - 1, gun).getTime() === now.getTime()
          const hasEvt  = evt.t.length > 0 || evt.o.length > 0
          return (
            <div
              key={i}
              className={gun ? (isBugun ? `${p}-cal-day ${p}-cal-today` : `${p}-cal-day`) : undefined}
              style={{ cursor: hasEvt ? 'pointer' : 'default', position: 'relative' }}
              onMouseEnter={(e) => {
                if (!gun || !hasEvt) return
                const r = e.currentTarget.getBoundingClientRect()
                setTooltip({ x: Math.min(r.left, window.innerWidth - 230), y: r.bottom + 6, evt })
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {gun && <span className={isBugun ? `${p}-cal-num` : undefined} style={{ fontSize: 12 }}>{gun}</span>}
              {gun && hasEvt && (
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  {evt.t.length > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: renkler.success }} />}
                  {evt.o.length > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: renkler.danger }} />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {tooltip && createPortal(
        <div className={`${p}-cal-tooltip`}>
          {tooltip.evt.t.map((e, idx) => (
            <div key={idx}><span style={{ color: renkler.success }}>↑</span> {e.firma} — <span className="financial-num">{TL(e.tutar)}</span></div>
          ))}
          {tooltip.evt.o.map((e, idx) => (
            <div key={idx}><span style={{ color: renkler.danger }}>↓</span> {e.firma} — <span className="financial-num">{TL(e.tutar)}</span></div>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Tür Badge ────────────────────────────────────────────────────────────────
function TurBadge({ tur, renkler }) {
  const cfg = turBadgeCfg(tur, renkler)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.bg, color: cfg.renk,
      fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '3px 8px',
      border: `1px solid ${hexRgba(cfg.renk, 0.18)}`, whiteSpace: 'nowrap',
    }}>
      <i className={`bi ${cfg.icon}`} style={{ fontSize: 10 }} />
      {tur}
    </span>
  )
}

// ─── Vade Badge ───────────────────────────────────────────────────────────────
function VadeBadge({ tarih, p = 'b' }) {
  if (!tarih) return <span className={`${p}-vade-empty`}>—</span>
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const vd  = new Date(tarih + 'T00:00:00')
  const gun = Math.ceil((vd - now) / 86400000)
  if (gun < 0) return (
    <span>
      <span className={`${p}-vade-late`}>{tarihFmt(tarih)}</span>
      <span className={`${p}-vade-sub-late`}>+{Math.abs(gun)} gün gecikti</span>
    </span>
  )
  if (gun <= 3) return (
    <span>
      <span className={`${p}-vade-warn`}>{tarihFmt(tarih)}</span>
      <span className={`${p}-vade-sub-warn`}>{gun === 0 ? 'Bugün!' : `${gun} gün kaldı`}</span>
    </span>
  )
  return <span className={`${p}-vade-normal`}>{tarihFmt(tarih)}</span>
}

// ─── Form Grubu ───────────────────────────────────────────────────────────────
function FG({ label, zorunlu, kritik, children, p = 'b', renkler }) {
  return (
    <div className="mb-3">
      <label className={`form-label ${p}-form-label`}>
        {label}
        {zorunlu && <span style={{ color: renkler?.danger || '#DC2626' }} className="ms-1">*</span>}
        {kritik  && <span style={{ color: renkler?.danger || '#DC2626', fontSize: 11 }} className="ms-1">(Kritik Alan)</span>}
      </label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana Bileşen
// ─────────────────────────────────────────────────────────────────────────────
export default function CekSenet() {
  // ─ Tema ─────────────────────────────────────────────────────────────────────
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'p'
  const renkler = temaRenkleri[aktifTema] || temaRenkleri.paramgo

  // ─ Kullanım Sınırları ───────────────────────────────────────────────────────
  const { kullanici } = useAuthStore()
  const { sinirler, uyariDurum } = useSinirler()
  const cekDurum  = uyariDurum('cek_aylik')
  const cekBilgi  = sinirler?.cek_aylik
  const cekLimitDolu = cekDurum === 'dolu'

  // ─ FAB ───────────────────────────────────────────────────────────────────────
  const [fabAcik, setFabAcik] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && fabAcik) setFabAcik(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [fabAcik])

  // ─ Tab & Filtre ─────────────────────────────────────────────────────────────
  const [aktifTab, setAktifTab] = useState(0)
  const [filtre, setFiltre] = useState({
    ay: new Date().getMonth() + 1,
    yil: new Date().getFullYear(),
    tumZamanlar: false,
  })

  // ─ Arama ────────────────────────────────────────────────────────────────────
  const [aramaMetni, setAramaMetni] = useState('')
  const [arsivKategori, setArsivKategori] = useState('tumu')

  const tabDegistir = (i) => { setAktifTab(i); setAramaMetni('') }

  const aramaFiltrele = (liste, alanlar) => {
    if (!aramaMetni.trim()) return liste
    const q = aramaMetni.toLowerCase()
    return liste.filter(item => alanlar.some(alan => (item[alan] || '').toLowerCase().includes(q)))
  }

  // ─ Veri ─────────────────────────────────────────────────────────────────────
  const [yuklenIyor, setYuklenIyor] = useState(true)
  const [portfoy, setPortfoy] = useState([])
  const [tahsil,  setTahsil]  = useState([])
  const [kendi,   setKendi]   = useState([])
  const [ciro,    setCiro]    = useState([])
  const [arsiv,   setArsiv]   = useState([])
  const [cariler, setCariler] = useState([])

  // ─ Generic Onay Modalı ───────────────────────────────────────────────────────
  const [onay, setOnay] = useState(null)

  // ─ Portföy Modalleri ─────────────────────────────────────────────────────────
  const [portfoyModal,    setPortfoyModal]    = useState(false)
  const [portfoyForm,     setPortfoyForm]     = useState(portfoyBosluk())
  const [portfoyDzlId,    setPortfoyDzlId]    = useState(null)

  const [tahsileModal,    setTahsileModal]    = useState(false)
  const [tahsileForm,     setTahsileForm]     = useState({ banka: '', tarih: bugunStr() })
  const [tahsileId,       setTahsileId]       = useState(null)

  const [cirolaModal,     setCirolaModal]     = useState(false)
  const [cirolaForm,      setCirolaForm]      = useState({ firma: '', cari_id: null, tarih: bugunStr() })
  const [cirolaId,        setCirolaId]        = useState(null)

  // ─ Kaydetme durumu (loading butonu için) ─────────────────────────────────────
  const [kaydediyor, setKaydediyor] = useState(false)

  // ─ Kendi Modalleri ───────────────────────────────────────────────────────────
  const [kendiModal,      setKendiModal]      = useState(false)
  const [kendiForm,       setKendiForm]       = useState(kendiBosluk())
  const [kendiDzlId,      setKendiDzlId]      = useState(null)

  // ─ Tahsil Düzenle ────────────────────────────────────────────────────────────
  const [tahsilDzlModal,  setTahsilDzlModal]  = useState(false)
  const [tahsilDzlForm,   setTahsilDzlForm]   = useState({})
  const [tahsilDzlId,     setTahsilDzlId]     = useState(null)

  // ─ Ciro Düzenle ──────────────────────────────────────────────────────────────
  const [ciroDzlModal,    setCiroDzlModal]    = useState(false)
  const [ciroDzlForm,     setCiroDzlForm]     = useState({})
  const [ciroDzlId,       setCiroDzlId]       = useState(null)

  // ─ Karşılıksız Modal ─────────────────────────────────────────────────────────
  const [karsiliksizModal,      setKarsiliksizModal]      = useState(false)
  const [karsiliksizItem,       setKarsiliksizItem]       = useState(null)
  const [karsiliksizForm,       setKarsiliksizForm]       = useState({ serh_tarihi: '', karsiliksiz_not: '', karsiliksiz_aksiyon: '' })
  const [karsiliksizKayitIyor,  setKarsiliksizKayitIyor]  = useState(false)


  // ─ Veri Yükleme ─────────────────────────────────────────────────────────────
  const veriYukle = useCallback(async () => {
    try {
      setYuklenIyor(true)
      const [cekR, cariR] = await Promise.all([
        cekSenetApi.listele({ adet: 500 }),
        carilerApi.listele({ adet: 500 }),
      ])
      const liste     = cekR.data.veri?.cek_senetler || []
      const alacak    = ['alacak_ceki', 'alacak_senedi']
      const borc      = ['borc_ceki', 'borc_senedi']
      const arsivDur  = ['tahsil_edildi', 'odendi', 'iade_edildi', 'karsiliksiz', 'protestolu']
      setPortfoy(liste.filter(i => alacak.includes(i.tur) && i.durum === 'portfoyde').map(normalize))
      setTahsil(liste.filter(i => alacak.includes(i.tur) && i.durum === 'tahsile_verildi').map(normalize))
      setKendi(liste.filter(i => borc.includes(i.tur) && i.durum === 'portfoyde').map(normalize))
      setCiro(liste.filter(i => i.durum === 'cirolandi').map(normalize))
      setArsiv(liste.filter(i => arsivDur.includes(i.durum)).map(normalize))
      setCariler((cariR.data.veri?.cariler || []).map(c => ({ id: c.id, adi: c.cari_adi || '' })))
    } catch {
      toast.error('Veriler yüklenemedi.')
    } finally {
      setYuklenIyor(false)
    }
  }, [])

  useEffect(() => { veriYukle() }, [veriYukle])

  // ─ Cari Yardımcıları ─────────────────────────────────────────────────────────
  const cariSecenekleri = cariler.map(c => c.adi)
  const cariIdBul = (adi) => cariler.find(c => c.adi === adi)?.id || null

  // ─ Filtre Uygulama ───────────────────────────────────────────────────────────
  const filtrele = (liste, alan = 'vade_tarihi') => {
    if (filtre.tumZamanlar) return liste
    return liste.filter(r => {
      const d = new Date((r[alan] || '') + 'T00:00:00')
      return d.getMonth() + 1 === filtre.ay && d.getFullYear() === filtre.yil
    })
  }

  // ─ Dashboard Hesaplamaları ───────────────────────────────────────────────────
  const TODAY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d })()

  const gecmis = (tarih) => new Date(tarih + 'T00:00:00') < TODAY

  const fP = aramaFiltrele(filtrele(portfoy), ['firma_adi', 'asil_borclu', 'evrak_no', 'vade_tarihi'])
  const fT = aramaFiltrele(filtrele(tahsil), ['firma_adi', 'asil_borclu', 'evrak_no', 'vade_tarihi'])
  const fK = aramaFiltrele(filtrele(kendi),  ['firma_adi', 'evrak_no', 'vade_tarihi', 'banka'])
  const fC = aramaFiltrele(filtrele(ciro),   ['asil_firma', 'teslim_yeri', 'evrak_no', 'vade_tarihi'])
  const fA = aramaFiltrele(
    arsivKategori === 'tumu' ? arsiv : arsiv.filter(i => i.tur_kategori === arsivKategori),
    ['firma_adi', 'evrak_no', 'vade_tarihi', 'asil_borclu']
  )

  const tahsilToplam   = toplam(fT)
  const kendiToplam    = toplam(fK)
  const portfoyToplam  = toplam(fP)
  const ciroToplam     = toplam(fC)
  const netDurum       = tahsilToplam - kendiToplam

  const tahsilBekleyen = fT.filter(i => !gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const tahsilGecmis   = fT.filter(i =>  gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const kendiBekleyen  = fK.filter(i => !gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const kendiGecmis    = fK.filter(i =>  gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const ciroBekleyen   = fC.filter(i => !gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)
  const ciroGecmis     = fC.filter(i =>  gecmis(i.vade_tarihi)).reduce((s, i) => s + i.tutar, 0)

  const gecikenKendi  = kendi.filter(i => gecmis(i.vade_tarihi))
  const gecikenTahsil = tahsil.filter(i => gecmis(i.vade_tarihi))

  const gunFark = (tarih) => Math.ceil((TODAY - new Date(tarih + 'T00:00:00')) / 86400000)

  const takvimTahsil = tahsil.map(i => ({ tarih: i.vade_tarihi, firma: i.firma_adi,  tutar: i.tutar }))
  const takvimOdeme  = kendi.map(i  => ({ tarih: i.vade_tarihi, firma: i.firma_adi,  tutar: i.tutar }))

  // ─ Son 6 Ay Verisi (arşivden hesaplanır) ─────────────────────────────────────
  const son6AyVeri = (() => {
    const sonuc = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ay  = d.getMonth() + 1
      const yil = d.getFullYear()
      const ayStr = d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })
      const ayFiltre = (liste, alan) => liste.filter(r => {
        const rd = new Date((r[alan] || '') + 'T00:00:00')
        return rd.getMonth() + 1 === ay && rd.getFullYear() === yil
      })
      const tahsilAy = ayFiltre(arsiv.filter(r => r.tur_kategori === 'tahsil_edildi'), 'kapanis_tarihi').reduce((s, r) => s + r.tutar, 0)
      const odemeAy  = ayFiltre(arsiv.filter(r => r.tur_kategori === 'kendi_odendi'),  'kapanis_tarihi').reduce((s, r) => s + r.tutar, 0)
      sonuc.push({ ay: ayStr, tahsil: tahsilAy, odeme: odemeAy })
    }
    return sonuc
  })()

  // ─ Tab Sayıları ──────────────────────────────────────────────────────────────
  const TABS = [
    { label: 'Özet',          renk: renkler.primary,  count: null,           icon: 'bi-speedometer2'          },
    { label: 'Elimdeki',      renk: renkler.primary,  count: portfoy.length, icon: 'bi-collection-fill'       },
    { label: 'Bankada / Tahsilatta', renk: renkler.success, count: tahsil.length,  icon: 'bi-bank'           },
    { label: 'Kendi Çekimiz', renk: renkler.danger,  count: kendi.length,   icon: 'bi-arrow-up-circle-fill'  },
    { label: 'Cirolanan',     renk: renkler.primary, count: ciro.length,    icon: 'bi-arrow-left-right'      },
    { label: 'Arşiv',         renk: renkler.textSec, count: arsiv.length,   icon: 'bi-archive-fill'          },
  ]

  // ─ Portföy İşlem Fonksiyonları ───────────────────────────────────────────────
  const portfoyKaydet = async () => {
    if (!portfoyForm.cari_id) { toast.error('Lütfen listeden bir cari seçin.'); return }
    if (!portfoyForm.vade_tarihi) { toast.error('Vade tarihi zorunludur.'); return }
    const tutar = parseParaInput(portfoyForm.tutarStr)
    if (tutar <= 0) { toast.error('Geçerli bir tutar giriniz.'); return }
    const veri = {
      cari_id:        portfoyForm.cari_id,
      seri_no:        portfoyForm.evrak_no    || undefined,
      banka_adi:      portfoyForm.banka        || undefined,
      kesilme_tarihi: portfoyForm.islem_tarihi || undefined,
      vade_tarihi:    portfoyForm.vade_tarihi,
      tutar,
      aciklama:       portfoyForm.asil_borclu  || undefined,
    }
    setKaydediyor(true)
    try {
      if (portfoyDzlId) {
        const r = await cekSenetApi.guncelle(portfoyDzlId, veri)
        setPortfoy(p => p.map(i => i.id === portfoyDzlId ? normalize(r.data.veri) : i))
        toast.success('Evrak güncellendi.')
      } else {
        const r = await cekSenetApi.ekle({ ...veri, tur: TUR_API[portfoyForm.tur] })
        setPortfoy(p => [normalize(r.data.veri), ...p])
        toast.success('Evrak portföye eklendi.')
      }
      setPortfoyModal(false); setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null)
    } catch {
      toast.error('İşlem başarısız, lütfen tekrar deneyin.')
    } finally {
      setKaydediyor(false)
    }
  }

  const portfoyDzlAc = (item) => {
    setPortfoyForm({
      tur: item.tur, firma_adi: item.firma_adi, cari_id: item.cari_id,
      asil_borclu: item.asil_borclu, evrak_no: item.evrak_no, banka: item.banka || '',
      vade_tarihi: item.vade_tarihi, islem_tarihi: item.islem_tarihi,
      tutarStr: formatParaInput(String(item.tutar ?? 0).replace('.', ',')),
    })
    setPortfoyDzlId(item.id); setPortfoyModal(true)
  }

  const portfoySil = (id) => setOnay({
    baslik: 'Evrak Silinsin mi?', mesaj: 'Bu evrak kalıcı olarak silinecektir.', ikon: 'bi-trash3',
    btnRenk: renkler.danger, btnYazi: 'Evet, Sil',
    islem: async () => {
      try {
        await cekSenetApi.sil(id)
        setPortfoy(p => p.filter(i => i.id !== id))
        toast.success('Evrak silindi.')
      } catch { toast.error('Silme başarısız.') }
      setOnay(null)
    },
  })

  const tahsileVer = async () => {
    if (!tahsileForm.tarih) { toast.error('Tarih zorunludur.'); return }
    setKaydediyor(true)
    try {
      if (tahsileForm.banka) {
        await cekSenetApi.guncelle(tahsileId, { banka_adi: tahsileForm.banka })
      }
      const r = await cekSenetApi.durumGuncelle(tahsileId, { durum: 'tahsile_verildi' })
      const item = normalize(r.data.veri)
      setPortfoy(p => p.filter(i => i.id !== tahsileId))
      setTahsil(p => [{ ...item, tahsil_tarihi: tahsileForm.tarih }, ...p])
      setTahsileModal(false); setTahsileForm({ banka: '', tarih: bugunStr() })
      toast.success('Evrak tahsile verildi.')
    } catch { toast.error('İşlem başarısız.') } finally { setKaydediyor(false) }
  }

  const cirolaKaydet = async () => {
    if (!cirolaForm.cari_id) { toast.error('Lütfen listeden teslim edilecek cariyi seçin.'); return }
    if (!cirolaForm.tarih) { toast.error('Ciro tarihi zorunludur.'); return }
    setKaydediyor(true)
    try {
      const r = await cekSenetApi.durumGuncelle(cirolaId, {
        durum: 'cirolandi',
        ciro_edilen_cari_id: cirolaForm.cari_id,
        ciro_tarihi: cirolaForm.tarih,
      })
      setPortfoy(p => p.filter(i => i.id !== cirolaId))
      setCiro(p => [normalize(r.data.veri), ...p])
      setCirolaModal(false); setCirolaForm({ firma: '', cari_id: null, tarih: bugunStr() })
      toast.success('Evrak cirolandı.')
    } catch { toast.error('İşlem başarısız.') } finally { setKaydediyor(false) }
  }

  // ─ Tahsil İşlem Fonksiyonları ─────────────────────────────────────────────
  const tahsilOdendi = (id) => setOnay({
    baslik: 'Ödendi Olarak İşaretlensin mi?',
    mesaj: 'Bu evrak tahsil edilmiş sayılacak ve arşive taşınacaktır.', ikon: 'bi-check-circle-fill',
    btnRenk: renkler.success, btnYazi: 'Evet, Ödendi!',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'tahsil_edildi', tahsil_tarihi: bugunStr() })
        setTahsil(p => p.filter(i => i.id !== id))
        setArsiv(p => [normalize(r.data.veri), ...p])
        toast.success('Evrak tahsil edildi, arşive taşındı. Kasaya gelir kaydı otomatik oluşturuldu.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const tahsilIade = (id) => setOnay({
    baslik: 'Portföye İade Edilsin mi?', mesaj: 'Bu evrak portföydeki listeye geri taşınacaktır.', ikon: 'bi-arrow-counterclockwise',
    btnRenk: renkler.warning, btnYazi: 'Evet, İade Et',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'portfoyde' })
        setTahsil(p => p.filter(i => i.id !== id))
        setPortfoy(p => [normalize(r.data.veri), ...p])
        toast.success('Evrak portföye iade edildi.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const tahsilKarsiliksiz = (id) => setOnay({
    baslik: 'Karşılıksız Olarak İşaretle?',
    mesaj: 'Bu çek karşılıksız olarak işaretlenecek ve arşive taşınacaktır. E-posta bildirimi gönderilecek.',
    ikon: 'bi-exclamation-triangle-fill',
    btnRenk: renkler.danger, btnYazi: 'Evet, Karşılıksız!',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'karsiliksiz' })
        setTahsil(p => p.filter(i => i.id !== id))
        setArsiv(p => [normalize(r.data.veri), ...p])
        toast.error('Çek karşılıksız olarak işaretlendi, arşive taşındı.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const tahsilDzlAc = (item) => {
    setTahsilDzlForm({
      tur: item.tur, firma_adi: item.firma_adi, cari_id: item.cari_id,
      asil_borclu: item.asil_borclu, evrak_no: item.evrak_no, banka: item.banka || '',
      vade_tarihi: item.vade_tarihi, tahsil_tarihi: item.tahsil_tarihi,
      tutarStr: formatParaInput(String(item.tutar ?? 0).replace('.', ',')),
    })
    setTahsilDzlId(item.id); setTahsilDzlModal(true)
  }

  const tahsilDzlKaydet = async () => {
    const tutar = parseParaInput(tahsilDzlForm.tutarStr)
    if (!tahsilDzlForm.vade_tarihi || tutar <= 0) {
      toast.error('Vade tarihi ve tutar zorunludur.'); return
    }
    setKaydediyor(true)
    try {
      const r = await cekSenetApi.guncelle(tahsilDzlId, {
        cari_id:     tahsilDzlForm.cari_id   || undefined,
        seri_no:     tahsilDzlForm.evrak_no   || undefined,
        banka_adi:   tahsilDzlForm.banka       || undefined,
        vade_tarihi: tahsilDzlForm.vade_tarihi,
        tutar,
        aciklama:    tahsilDzlForm.asil_borclu || undefined,
      })
      setTahsil(p => p.map(i => i.id === tahsilDzlId ? normalize(r.data.veri) : i))
      setTahsilDzlModal(false); toast.success('Evrak güncellendi.')
    } catch { toast.error('Güncelleme başarısız.') } finally { setKaydediyor(false) }
  }

  // ─ Kendi İşlem Fonksiyonları ──────────────────────────────────────────────
  const kendiKaydet = async () => {
    if (!kendiForm.cari_id) { toast.error('Lütfen listeden bir cari seçin.'); return }
    if (!kendiForm.vade_tarihi || !kendiForm.banka) {
      toast.error('Vade tarihi ve banka zorunludur.'); return
    }
    const tutar = parseParaInput(kendiForm.tutarStr)
    if (tutar <= 0) { toast.error('Geçerli bir tutar giriniz.'); return }
    const veri = {
      cari_id:        kendiForm.cari_id,
      seri_no:        kendiForm.evrak_no    || undefined,
      banka_adi:      kendiForm.banka,
      kesilme_tarihi: kendiForm.islem_tarihi || undefined,
      vade_tarihi:    kendiForm.vade_tarihi,
      tutar,
      aciklama:       kendiForm.asil_borclu  || undefined,
    }
    setKaydediyor(true)
    try {
      if (kendiDzlId) {
        const r = await cekSenetApi.guncelle(kendiDzlId, veri)
        setKendi(p => p.map(i => i.id === kendiDzlId ? normalize(r.data.veri) : i))
        toast.success('Evrak güncellendi.')
      } else {
        const r = await cekSenetApi.ekle({ ...veri, tur: TUR_API[kendiForm.tur] })
        setKendi(p => [normalize(r.data.veri), ...p])
        toast.success('Borç evrakı eklendi.')
      }
      setKendiModal(false); setKendiForm(kendiBosluk()); setKendiDzlId(null)
    } catch { toast.error('İşlem başarısız.') } finally { setKaydediyor(false) }
  }

  const kendiDzlAc = (item) => {
    setKendiForm({
      tur: item.tur, firma_adi: item.firma_adi, cari_id: item.cari_id,
      asil_borclu: item.asil_borclu || '', evrak_no: item.evrak_no, banka: item.banka,
      vade_tarihi: item.vade_tarihi, islem_tarihi: item.islem_tarihi,
      tutarStr: formatParaInput(String(item.tutar ?? 0).replace('.', ',')),
    })
    setKendiDzlId(item.id); setKendiModal(true)
  }

  const kendiOdendi = (id) => setOnay({
    baslik: 'Ödendi Olarak İşaretlensin mi?', mesaj: 'Bu evrak ödenmiş/kapanmış olarak işaretlenecektir.', ikon: 'bi-check-circle-fill',
    btnRenk: renkler.success, btnYazi: 'Evet, Ödendi!',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'odendi', tahsil_tarihi: bugunStr() })
        setKendi(p => p.filter(i => i.id !== id))
        setArsiv(p => [normalize(r.data.veri), ...p])
        toast.success('Evrak ödendi olarak kapatıldı, arşive taşındı. Kasadan gider kaydı otomatik oluşturuldu.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const kendiSil = (id) => setOnay({
    baslik: 'Evrak Silinsin mi?', mesaj: 'Bu evrak kalıcı olarak silinecektir.', ikon: 'bi-trash3',
    btnRenk: renkler.danger, btnYazi: 'Evet, Sil',
    islem: async () => {
      try {
        await cekSenetApi.sil(id)
        setKendi(p => p.filter(i => i.id !== id))
        toast.success('Evrak silindi.')
      } catch { toast.error('Silme başarısız.') }
      setOnay(null)
    },
  })

  // ─ Ciro İşlem Fonksiyonları ───────────────────────────────────────────────
  const ciroTamamlandi = (id) => setOnay({
    baslik: 'Ciro Tamamlandı mı?', mesaj: 'Bu evrak tahsil edilmiş sayılacak ve arşive taşınacaktır.', ikon: 'bi-check-circle-fill',
    btnRenk: renkler.success, btnYazi: 'Evet, Tamamlandı!',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'tahsil_edildi', tahsil_tarihi: bugunStr() })
        setCiro(p => p.filter(i => i.id !== id))
        setArsiv(p => [normalize(r.data.veri), ...p])
        toast.success('Ciro tamamlandı, arşive taşındı. Kasaya gelir kaydı otomatik oluşturuldu.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const ciroIade = (id) => setOnay({
    baslik: 'Portföye İade Edilsin mi?', mesaj: 'Bu evrak portföydeki listeye geri taşınacaktır.', ikon: 'bi-arrow-counterclockwise',
    btnRenk: renkler.warning, btnYazi: 'Evet, İade Et',
    islem: async () => {
      try {
        const r = await cekSenetApi.durumGuncelle(id, { durum: 'portfoyde' })
        setCiro(p => p.filter(i => i.id !== id))
        setPortfoy(p => [normalize(r.data.veri), ...p])
        toast.success('Evrak portföye iade edildi.')
      } catch { toast.error('İşlem başarısız.') }
      setOnay(null)
    },
  })

  const ciroSil = (id) => setOnay({
    baslik: 'Evrak Silinsin mi?', mesaj: 'Bu cirolanan evrak kalıcı olarak silinecektir.', ikon: 'bi-trash3',
    btnRenk: renkler.danger, btnYazi: 'Evet, Sil',
    islem: async () => {
      try {
        await cekSenetApi.sil(id)
        setCiro(p => p.filter(i => i.id !== id))
        toast.success('Evrak silindi.')
      } catch { toast.error('Silme başarısız.') }
      setOnay(null)
    },
  })

  const ciroDzlAc = (item) => {
    setCiroDzlForm({
      vade_tarihi: item.vade_tarihi, ciro_tarihi: item.ciro_tarihi,
      tutarStr: formatParaInput(String(item.tutar ?? 0).replace('.', ',')),
      asil_firma: item.asil_firma, teslim_yeri: item.teslim_yeri,
      cari_id: item.cari_id, ciro_edilen_cari_id: item.ciro_edilen_cari_id,
      evrak_no: item.evrak_no, tur: item.tur,
    })
    setCiroDzlId(item.id); setCiroDzlModal(true)
  }

  const ciroDzlKaydet = async () => {
    const tutar = parseParaInput(ciroDzlForm.tutarStr)
    if (!ciroDzlForm.vade_tarihi || tutar <= 0) {
      toast.error('Vade tarihi ve tutar zorunludur.'); return
    }
    setKaydediyor(true)
    try {
      const r = await cekSenetApi.guncelle(ciroDzlId, {
        seri_no:     ciroDzlForm.evrak_no   || undefined,
        vade_tarihi: ciroDzlForm.vade_tarihi,
        tutar,
      })
      setCiro(p => p.map(i => i.id === ciroDzlId ? normalize(r.data.veri) : i))
      setCiroDzlModal(false); toast.success('Evrak güncellendi.')
    } catch { toast.error('Güncelleme başarısız.') } finally { setKaydediyor(false) }
  }

  // ─ Karşılıksız İşlem Fonksiyonları ───────────────────────────────────────────
  const karsiliksizAc = (item) => {
    setKarsiliksizItem(item)
    setKarsiliksizForm({
      serh_tarihi:         item.serh_tarihi         || '',
      karsiliksiz_not:     item.karsiliksiz_not     || '',
      karsiliksiz_aksiyon: item.karsiliksiz_aksiyon || '',
    })
    setKarsiliksizModal(true)
  }

  const karsiliksizKaydet = async () => {
    if (!karsiliksizItem) return
    setKarsiliksizKayitIyor(true)
    try {
      const r = await cekSenetApi.guncelle(karsiliksizItem.id, {
        serh_tarihi:         karsiliksizForm.serh_tarihi         || null,
        karsiliksiz_not:     karsiliksizForm.karsiliksiz_not     || null,
        karsiliksiz_aksiyon: karsiliksizForm.karsiliksiz_aksiyon || null,
      })
      const guncellendi = normalize(r.data.veri)
      setArsiv(p => p.map(i => i.id === karsiliksizItem.id ? guncellendi : i))
      setKarsiliksizModal(false)
      toast.success('Karşılıksız çek bilgileri kaydedildi.')
    } catch { toast.error('Kayıt başarısız.') }
    finally { setKarsiliksizKayitIyor(false) }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  if (yuklenIyor) return (
    <div className={`${p}-page-root`}>
      {/* Skeleton Header */}
      <div className={`${p}-cek-header mb-4`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className={`${p}-cek-sk`} style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0 }} />
          <div>
            <div className={`${p}-cek-sk`} style={{ width: 200, height: 22, marginBottom: 8 }} />
            <div className={`${p}-cek-sk`} style={{ width: 280, height: 14 }} />
          </div>
        </div>
        <div className="d-flex gap-2">
          <div className={`${p}-cek-sk`} style={{ width: 100, height: 44, borderRadius: 10 }} />
          <div className={`${p}-cek-sk`} style={{ width: 100, height: 44, borderRadius: 10 }} />
          <div className={`${p}-cek-sk`} style={{ width: 100, height: 44, borderRadius: 10 }} />
        </div>
      </div>
      {/* Skeleton Tab Bar */}
      <div className={`${p}-tab-bar`} style={{ marginBottom: 24 }}>
        {[120, 100, 110, 130, 100, 80].map((w, i) => (
          <div key={i} className={`${p}-cek-sk`} style={{ width: w, height: 40, borderRadius: 10, flexShrink: 0 }} />
        ))}
      </div>
      {/* Skeleton KPI Cards */}
      <div className="row g-3 mb-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="col-12 col-sm-6 col-xl-3">
            <div className={`${p}-cek-kpi`} style={{ padding: 24 }}>
              <div className={`${p}-cek-sk`} style={{ width: '60%', height: 11, marginBottom: 18 }} />
              <div className={`${p}-cek-sk`} style={{ width: '80%', height: 28, marginBottom: 10 }} />
              <div className={`${p}-cek-sk`} style={{ width: '50%', height: 12 }} />
            </div>
          </div>
        ))}
      </div>
      {/* Skeleton Table Rows */}
      <div className={`${p}-panel`} style={{ padding: '16px 20px' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`${p}-cek-sk`} style={{ height: 40, borderRadius: 14, marginBottom: i < 4 ? 8 : 0, opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className={`${p}-page-root`}>
      {/* STYLE BLOCK REMOVED — tema CSS dosyalarında */}
      {/* ─── Sayfa Başlığı ──────────────────────────────────────────────────── */}
      <div className={`${p}-page-header mb-4`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon`}>
            <i className="bi bi-file-earmark-text-fill" />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>Çek &amp; Senet Yönetimi</h1>
            <p className={`${p}-page-sub`}>Portföy takibi · Tahsilat · Borç evrakları · Ciro yönetimi</p>
          </div>
        </div>

      </div>

      {/* ─── Ana Kart ───────────────────────────────────────────────────────── */}
      <div className={`${p}-panel`} style={{ padding: 0, overflow: 'hidden' }}>

        {/* Tab Başlıkları */}
        <div className={`${p}-tab-bar`} data-tur="cek-tablar">
          {TABS.map((tab, i) => {
            const isActive = aktifTab === i
            return (
              <button
                key={i}
                data-tur={i === 1 ? 'portfoy-tab' : undefined}
                className={`${p}-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => tabDegistir(i)}
                style={isActive ? { color: tab.renk, borderColor: hexRgba(tab.renk, 0.25), background: hexRgba(tab.renk, 0.1) } : undefined}
              >
                {tab.icon && <i className={`bi ${tab.icon}`} style={{ fontSize: 13 }} />}
                <span className={`${p}-tab-label`}>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`${p}-tab-count`} style={isActive ? { background: hexRgba(tab.renk, 0.15), color: tab.renk } : undefined}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab İçerikleri */}
        <div style={{ padding: '20px 20px 24px' }}>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 0 — DASHBOARD
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 0 && (
            <div>

              {/* Üst Filtre + Başlık */}
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                <span style={{ fontSize: 14, fontWeight: 700, color: renkler.text }}>
                  <i className="bi bi-speedometer2 me-2" style={{ color: renkler.primary }} />
                  Portföy Özeti
                </span>
                <FiltreSatiri filtre={filtre} setFiltre={setFiltre} p={p} />
              </div>

              {/* 4 KPI Kartı */}
              <div className="row g-3 mb-4">

                {/* Kart 1 — Elimdeki */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className={`${p}-cek-kpi`} onClick={() => tabDegistir(1)}>
                    <i className={`bi bi-collection-fill ${p}-kpi-deco`} style={{ color: renkler.primary }} />
                    <h6 style={{ fontSize: 11, fontWeight: 600, color: renkler.textSec, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
                      Elimdeki Toplam
                    </h6>
                    <div className={`${p}-td-amount financial-num`} style={{ fontSize: 26, color: renkler.primary }}>
                      {TL(portfoyToplam)}
                    </div>
                    <p style={{ fontSize: 12, color: renkler.textSec, fontWeight: 500, margin: '8px 0 0' }}>
                      {portfoy.length} adet evrak
                    </p>
                  </div>
                </div>

                {/* Kart 2 — Bankada / Tahsilatta */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className={`${p}-cek-kpi`} onClick={() => tabDegistir(2)}>
                    <i className={`bi bi-bank ${p}-kpi-deco`} style={{ color: renkler.success }} />
                    <h6 style={{ fontSize: 11, fontWeight: 600, color: renkler.textSec, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
                      Bankada / Tahsilatta
                    </h6>
                    <div className={`${p}-td-amount financial-num`} style={{ fontSize: 26, color: renkler.success }}>
                      {TL(tahsilToplam)}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: renkler.success, fontWeight: 500 }}>● <span className="financial-num">{TL(tahsilBekleyen)}</span> Bekleyen</span>
                      <span style={{ fontSize: 11, color: renkler.danger, fontWeight: 700 }}>● <span className="financial-num">{TL(tahsilGecmis)}</span> Gecikmiş</span>
                    </div>
                  </div>
                </div>

                {/* Kart 3 — Kendi Çekimiz */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className={`${p}-cek-kpi`} onClick={() => tabDegistir(3)}>
                    <i className={`bi bi-arrow-up-circle-fill ${p}-kpi-deco`} style={{ color: renkler.danger }} />
                    <h6 style={{ fontSize: 11, fontWeight: 600, color: renkler.textSec, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
                      Kendi Çekimiz
                    </h6>
                    <div className={`${p}-td-amount financial-num`} style={{ fontSize: 26, color: renkler.danger }}>
                      {TL(kendiToplam)}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: renkler.success, fontWeight: 500 }}>● <span className="financial-num">{TL(kendiBekleyen)}</span> Bekleyen</span>
                      <span style={{ fontSize: 11, color: renkler.danger, fontWeight: 700 }}>● <span className="financial-num">{TL(kendiGecmis)}</span> Gecikmiş</span>
                    </div>
                  </div>
                </div>

                {/* Kart 4 — Net Durum */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className={`${p}-cek-kpi`}>
                    <i
                      className={`bi ${netDurum >= 0 ? 'bi-graph-up-arrow' : 'bi-exclamation-triangle-fill'} ${p}-kpi-deco`}
                      style={{ color: netDurum >= 0 ? renkler.success : renkler.danger }}
                    />
                    <h6 style={{ fontSize: 11, fontWeight: 600, color: renkler.textSec, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>
                      Net Durum
                    </h6>
                    <div className={`${p}-td-amount financial-num`} style={{ fontSize: 26, color: netDurum >= 0 ? renkler.success : renkler.danger }}>
                      {TL(netDurum)}
                    </div>
                    <p style={{ fontSize: 12, color: renkler.textSec, fontWeight: 500, margin: '8px 0 0' }}>
                      Alacak − Borç farkı
                    </p>
                  </div>
                </div>

              </div>

              {/* Risk Uyarı Kartları */}
              {(gecikenTahsil.length > 0 || gecikenKendi.length > 0) ? (
                <div className="row g-3 mb-4">

                  {/* Blok A — Gecikmiş Tahsilat */}
                  {gecikenTahsil.length > 0 && (
                    <div className="col-md-6">
                      <div className={`${p}-panel p-3 h-100`} style={{ background: hexRgba(renkler.danger, 0.06) }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <i className="bi bi-exclamation-triangle-fill" style={{ color: renkler.danger, fontSize: 14 }} />
                          <span style={{ fontWeight: 700, fontSize: 13, color: renkler.danger }}>Gecikmiş Tahsilat</span>
                          <span style={{ background: hexRgba(renkler.danger, 0.15), color: renkler.danger, fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '2px 8px' }}>
                            {gecikenTahsil.length} evrak
                          </span>
                        </div>
                        {gecikenTahsil.slice(0, 5).map(item => (
                          <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: `1px solid ${hexRgba(renkler.textSec, 0.1)}` }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: renkler.text }}>{item.firma_adi}</div>
                              <div style={{ fontSize: 11, color: renkler.textSec }}>{tarihFmt(item.vade_tarihi)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div className="financial-num" style={{ fontSize: 13, fontWeight: 700, color: renkler.danger }}>{TL(item.tutar)}</div>
                              <span style={{ fontSize: 10, background: hexRgba(renkler.danger, 0.12), color: renkler.danger, borderRadius: 10, padding: '1px 6px' }}>+{gunFark(item.vade_tarihi)} gün</span>
                            </div>
                          </div>
                        ))}
                        {gecikenTahsil.length > 5 && (
                          <button onClick={() => tabDegistir(2)} style={{ background: 'none', border: 'none', color: renkler.danger, fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 4 }}>
                            Tümünü gör ({gecikenTahsil.length}) <i className="bi bi-arrow-right" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Blok B — Gecikmiş Ödemelerimiz */}
                  {gecikenKendi.length > 0 && (
                    <div className="col-md-6">
                      <div className={`${p}-panel p-3 h-100`} style={{ background: hexRgba(renkler.danger, 0.06) }}>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <i className="bi bi-exclamation-triangle-fill" style={{ color: renkler.danger, fontSize: 14 }} />
                          <span style={{ fontWeight: 700, fontSize: 13, color: renkler.danger }}>Gecikmiş Ödemelerimiz</span>
                          <span style={{ background: hexRgba(renkler.danger, 0.15), color: renkler.danger, fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '2px 8px' }}>
                            {gecikenKendi.length} evrak
                          </span>
                        </div>
                        {gecikenKendi.slice(0, 5).map(item => (
                          <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: `1px solid ${hexRgba(renkler.textSec, 0.1)}` }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: renkler.text }}>{item.firma_adi}</div>
                              <div style={{ fontSize: 11, color: renkler.textSec }}>{tarihFmt(item.vade_tarihi)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div className="financial-num" style={{ fontSize: 13, fontWeight: 700, color: renkler.danger }}>{TL(item.tutar)}</div>
                              <span style={{ fontSize: 10, background: hexRgba(renkler.danger, 0.12), color: renkler.danger, borderRadius: 10, padding: '1px 6px' }}>+{gunFark(item.vade_tarihi)} gün</span>
                            </div>
                          </div>
                        ))}
                        {gecikenKendi.length > 5 && (
                          <button onClick={() => tabDegistir(3)} style={{ background: 'none', border: 'none', color: renkler.danger, fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 4 }}>
                            Tümünü gör ({gecikenKendi.length}) <i className="bi bi-arrow-right" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* Yeşil Onay Banner */
                <div className={`${p}-panel d-flex align-items-center gap-3 p-3 mb-4`} style={{ borderColor: hexRgba(renkler.success, 0.25), background: hexRgba(renkler.success, 0.05) }}>
                  <i className="bi bi-check-circle-fill" style={{ color: renkler.success, fontSize: 24, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: renkler.success }}>Tüm evraklar vadeli</div>
                    <div style={{ fontSize: 12, color: renkler.textSec }}>Gecikmiş tahsilat veya ödeme bulunmuyor</div>
                  </div>
                </div>
              )}

              {/* Takvim + Son 6 Ay Grafik */}
              <div className="row g-3">

                {/* Vade Takvimi */}
                <div className="col-lg-6">
                  <div className={`${p}-panel p-3 h-100`}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: renkler.text, marginBottom: 14 }}>
                      <i className="bi bi-calendar3 me-2" style={{ color: renkler.primary }} />
                      Vade Takvimi
                    </div>
                    <AylikTakvim ay={filtre.ay} yil={filtre.yil} tahsilEvents={takvimTahsil} odemeEvents={takvimOdeme} p={p} renkler={renkler} />
                    <div className="d-flex gap-4 mt-3">
                      <span style={{ fontSize: 12, color: renkler.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: renkler.success, display: 'inline-block' }} />
                        Tahsil Vadesi
                      </span>
                      <span style={{ fontSize: 12, color: renkler.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: renkler.danger, display: 'inline-block' }} />
                        Ödeme Vadesi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Son 6 Ay SVG Grafiği */}
                <div className="col-lg-6">
                  <div className={`${p}-panel p-3 h-100`}>
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <span style={{ fontSize: 14, fontWeight: 700, color: renkler.text }}>
                        <i className="bi bi-bar-chart-line me-2" style={{ color: renkler.primary }} />
                        Son 6 Ay Özeti
                      </span>
                      <div className="d-flex gap-3">
                        <span style={{ fontSize: 11, color: renkler.textSec, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: renkler.success, display: 'inline-block' }} /> Tahsil
                        </span>
                        <span style={{ fontSize: 11, color: renkler.textSec, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: renkler.danger, display: 'inline-block' }} /> Ödeme
                        </span>
                      </div>
                    </div>
                    {(() => {
                      const maxVal = Math.max(...son6AyVeri.flatMap(r => [r.tahsil, r.odeme]), 1)
                      const chartH = 140
                      const barW = 20
                      const intraGap = 8
                      const groupW = barW * 2 + intraGap
                      const groupGap = 22
                      const padX = 10
                      const totalW = son6AyVeri.length * (groupW + groupGap) - groupGap + padX * 2
                      const fmtK = (v) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(v))
                      return (
                        <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 36}`} style={{ overflow: 'visible', display: 'block' }}>
                          {son6AyVeri.map((r, i) => {
                            const x = padX + i * (groupW + groupGap)
                            const th = Math.max((r.tahsil / maxVal) * chartH, r.tahsil > 0 ? 4 : 0)
                            const oh = Math.max((r.odeme  / maxVal) * chartH, r.odeme  > 0 ? 4 : 0)
                            return (
                              <g key={i}>
                                {/* Tahsil bar */}
                                <rect x={x} y={chartH - th} width={barW} height={th} rx={4} fill={renkler.success} opacity={0.85} />
                                {r.tahsil > 0 && (
                                  <text x={x + barW / 2} y={chartH - th - 4} textAnchor="middle" fontSize={9} fill={renkler.success}>
                                    {fmtK(r.tahsil)}
                                  </text>
                                )}
                                {/* Ödeme bar */}
                                <rect x={x + barW + intraGap} y={chartH - oh} width={barW} height={oh} rx={4} fill={renkler.danger} opacity={0.85} />
                                {r.odeme > 0 && (
                                  <text x={x + barW + intraGap + barW / 2} y={chartH - oh - 4} textAnchor="middle" fontSize={9} fill={renkler.danger}>
                                    {fmtK(r.odeme)}
                                  </text>
                                )}
                                {/* Ay etiketi */}
                                <text x={x + groupW / 2} y={chartH + 18} textAnchor="middle" fontSize={10} fill={renkler.textSec}>
                                  {r.ay.split(' ')[0]}
                                </text>
                              </g>
                            )
                          })}
                          <line x1={padX} y1={chartH} x2={totalW - padX} y2={chartH} stroke={hexRgba(renkler.textSec, 0.15)} strokeWidth={1} />
                        </svg>
                      )
                    })()}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1 — PORTFÖYDEKİ EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 1 && (
            <div>
              {/* Gradient Banner */}
              <div className={`${p}-banner ${p}-banner-warning`}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <div className={`${p}-banner-label`}>Toplam Portföy</div>
                    <div className={`${p}-banner-value-lg financial-num`} style={{ color: renkler.primary }}>{TL(portfoyToplam)}</div>
                    <div className={`${p}-banner-hint`}>
                      <i className="bi bi-collection-fill me-1" style={{ color: renkler.primary }} />
                      {portfoy.length} adet evrak
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} p={p} />
                </div>
              </div>

              {/* Arama + Yeni Buton */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <div className={`input-group flex-grow-1 ${p}-search`} style={{ minWidth: 220 }}>
                  <span className="input-group-text"><i className="bi bi-search" /></span>
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="Müşteri, evrak no veya vade tarihi ara..."
                    value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                  {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
                </div>
                <div className="d-flex flex-column align-items-end gap-1">
                  {kullanici?.plan === 'deneme' && cekBilgi && !cekBilgi.sinirsiz && (cekDurum === 'uyari' || cekDurum === 'dolu') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
                      color: cekLimitDolu ? renkler.danger : renkler.warning }}>
                      <div style={{ width: 60, height: 3, borderRadius: 2, background: hexRgba(renkler.textSec, 0.15), overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(cekBilgi.yuzde, 100)}%`,
                          background: cekLimitDolu ? renkler.danger : renkler.warning, borderRadius: 2 }} />
                      </div>
                      {cekBilgi.mevcut}/{cekBilgi.sinir} bu ay
                    </div>
                  )}
                  <button className={`${p}-btn-accent d-none d-md-flex align-items-center`}
                    data-tur="cek-ekle-btn"
                    onClick={() => { setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null); setPortfoyModal(true) }}
                    disabled={cekLimitDolu}
                    title={cekLimitDolu ? 'Aylık çek/senet limiti doldu. Planı yükseltin.' : 'Yeni evrak ekle'}
                    style={cekLimitDolu ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
                    <i className="bi bi-plus-lg me-2" /> Yeni Evrak
                  </button>
                </div>
              </div>

              {/* Tablo */}
              <div className="table-responsive d-none d-md-block" data-tur="durum-rengi">
                <table className={`table table-hover align-middle ${p}-table`}>
                  <thead>
                    <tr>
                      <th>Vade Tarihi</th>
                      <th>İşlem Tarihi</th>
                      <th>Tutar</th>
                      <th>Çeki Kesen Kişi / Firma</th>
                      <th>Tür / Banka</th>
                      <th>Evrak No</th>
                      <th style={{ textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fP.length === 0 && (
                      <tr>
                        <td colSpan={7} className={`${p}-empty-state`}>
                          <i className="bi bi-file-earmark-x" />
                          <h6>Bu dönemde evrak bulunamadı</h6>
                          <p>Filtre değiştirin veya yeni evrak ekleyin</p>
                          <button className="p-empty-cta" onClick={() => { setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null); setPortfoyModal(true) }}>
                            <i className="bi bi-plus-lg" /> Yeni Evrak Ekle
                          </button>
                        </td>
                      </tr>
                    )}
                    {fP.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px' }}><VadeBadge tarih={item.vade_tarihi} p={p} /></td>
                        <td className={`${p}-td-muted`} style={{ padding: '12px' }}>{tarihFmt(item.islem_tarihi)}</td>
                        <td className={`${p}-td-amount financial-num`} style={{ padding: '12px', color: renkler.primary }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px' }}>
                          <div className={`${p}-td-firma`}>{item.firma_adi}</div>
                          {item.asil_borclu && <div className={`${p}-td-firma-sub`}>{item.asil_borclu}</div>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <TurBadge tur={item.tur} renkler={renkler} />
                          {item.banka && <div className={`${p}-td-firma-sub`} style={{ marginTop: 4 }}><i className="bi bi-bank me-1" />{item.banka}</div>}
                        </td>
                        <td className={`${p}-td-mono`} style={{ padding: '12px' }}>{item.evrak_no || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 justify-content-end p-row-actions">
                            <button className={`${p}-act ${p}-act-success`} title="Tahsile Ver"
                              onClick={() => { setTahsileId(item.id); setTahsileForm({ banka: '', tarih: bugunStr() }); setTahsileModal(true) }}>
                              <i className="bi bi-bank" />
                            </button>
                            <button className={`${p}-act ${p}-act-warning`} title="Cirola"
                              onClick={() => { setCirolaId(item.id); setCirolaForm({ firma: '', tarih: bugunStr() }); setCirolaModal(true) }}>
                              <i className="bi bi-arrow-left-right" />
                            </button>
                            <button className={`${p}-act`} title="Düzenle" onClick={() => portfoyDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className={`${p}-act ${p}-act-danger`} title="Sil" onClick={() => portfoySil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* ─── Mobil Kart Listesi ─── */}
              <div className="d-md-none">
                {fP.length === 0 ? (
                  <div className={`${p}-empty-state`}>
                    <i className="bi bi-file-earmark-x" />
                    <h6>Bu dönemde evrak bulunamadı</h6>
                    <p>Yeni evrak eklemek için butona tıklayın</p>
                    <button className="p-empty-cta" onClick={() => { setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null); setPortfoyModal(true) }}>
                      <i className="bi bi-plus-lg" /> Yeni Evrak Ekle
                    </button>
                  </div>
                ) : <>
                  <div className="p-swipe-hint"><i className="bi bi-arrow-left-right" /> Sola kaydırarak işlem yapabilirsiniz</div>
                  {fP.map(item => (
                    <SwipeCard key={item.id} aksiyonlar={[
                      { icon: 'bi-bank', label: 'Tahsil', renk: 'success', onClick: () => { setTahsileId(item.id); setTahsileForm({ banka: '', tarih: bugunStr() }); setTahsileModal(true) } },
                      { icon: 'bi-arrow-left-right', label: 'Cirola', renk: 'warning', onClick: () => { setCirolaId(item.id); setCirolaForm({ firma: '', tarih: bugunStr() }); setCirolaModal(true) } },
                      { icon: 'bi-pencil', label: 'Düzenle', renk: 'info', onClick: () => portfoyDzlAc(item) },
                      { icon: 'bi-trash', label: 'Sil', renk: 'danger', onClick: () => portfoySil(item.id) },
                    ]}>
                      <div className="p-cek-mk">
                        <div className="p-cek-mk-ust">
                          <DynamicAvatar isim={item.firma_adi} boyut={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="p-cek-mk-firma" style={{ margin: 0 }}>{item.firma_adi}</div>
                            {item.banka && <div className="p-cek-mk-banka"><i className="bi bi-bank me-1" />{item.banka}</div>}
                          </div>
                          <span className="p-cek-mk-tutar financial-num" style={{ color: renkler.primary }}>{TL(item.tutar)}</span>
                        </div>
                        <div className="p-cek-mk-alt">
                          <TurBadge tur={item.tur} renkler={renkler} />
                          {item.evrak_no && <span className="p-cek-mk-evrak-no">{item.evrak_no}</span>}
                          <span style={{ marginLeft: 'auto' }}><VadeBadge tarih={item.vade_tarihi} p={p} /></span>
                        </div>
                      </div>
                    </SwipeCard>
                  ))}
                </>}
              </div>
              {fP.length > 0 && (
                <div className={`${p}-list-footer ${p}-list-footer-warning`}>
                  <span className={`${p}-list-footer-count`}>{fP.length} evrak listeleniyor</span>
                  <span className={`${p}-list-footer-total financial-num`} style={{ color: renkler.primary }}>Toplam: {TL(portfoyToplam)}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2 — TAHSİLDEKİ EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 2 && (
            <div>
              {/* Gradient Banner */}
              <div className={`${p}-banner ${p}-banner-green`}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div className={`${p}-banner-label`}>Bekleyen Vade</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.success }}>{TL(tahsilBekleyen)}</div>
                    </div>
                    <div>
                      <div className={`${p}-banner-label`}>Vadesi Geçen</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.danger }}>{TL(tahsilGecmis)}</div>
                    </div>
                    <div>
                      <div className={`${p}-banner-label`}>Toplam Bankada / Tahsilatta</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.text }}>{TL(tahsilToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} p={p} />
                </div>
              </div>

              {/* Arama */}
              <div className={`input-group mb-3 ${p}-search`}>
                <span className="input-group-text"><i className="bi bi-search" /></span>
                <input className="form-control" style={{ minHeight: 44 }} placeholder="Müşteri, evrak no veya vade tarihi ara..."
                  value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
              </div>

              <div className="table-responsive d-none d-md-block">
                <table className={`table table-hover align-middle ${p}-table`}>
                  <thead>
                    <tr>
                      <th>Ödeme Tarihi (Vade)</th>
                      <th>Tahsile Veriş</th>
                      <th>Tutar</th>
                      <th>Çeki Kesen Kişi / Firma</th>
                      <th>Tür / Banka</th>
                      <th>Evrak No</th>
                      <th style={{ textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fT.length === 0 && (
                      <tr>
                        <td colSpan={7} className={`${p}-empty-state`}>
                          <i className="bi bi-bank" />
                          <h6>Bu dönemde tahsildeki evrak bulunamadı</h6>
                          <p>Portföyden evrak tahsile gönderin</p>
                        </td>
                      </tr>
                    )}
                    {fT.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px' }}><VadeBadge tarih={item.vade_tarihi} p={p} /></td>
                        <td className={`${p}-td-muted`} style={{ padding: '12px' }}>{tarihFmt(item.tahsil_tarihi)}</td>
                        <td className={`${p}-td-amount financial-num`} style={{ padding: '12px', color: renkler.success }}>{TL(item.tutar)}</td>
                        <td style={{ padding: '12px' }}>
                          <div className={`${p}-td-firma`}>{item.firma_adi}</div>
                          {item.asil_borclu && <div className={`${p}-td-firma-sub`}>{item.asil_borclu}</div>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <TurBadge tur={item.tur} renkler={renkler} />
                          {item.banka && <div className={`${p}-td-firma-sub`} style={{ marginTop: 4 }}><i className="bi bi-bank me-1" />{item.banka}</div>}
                        </td>
                        <td className={`${p}-td-mono`} style={{ padding: '12px' }}>{item.evrak_no || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 justify-content-end p-row-actions">
                            <button className={`${p}-act ${p}-act-success`} title="Ödendi" onClick={() => tahsilOdendi(item.id)}>
                              <i className="bi bi-check-lg" />
                            </button>
                            <button className={`${p}-act`} title="Portföye İade Et" onClick={() => tahsilIade(item.id)}>
                              <i className="bi bi-arrow-counterclockwise" />
                            </button>
                            <button className={`${p}-act ${p}-act-danger`} title="Karşılıksız" onClick={() => tahsilKarsiliksiz(item.id)}>
                              <i className="bi bi-exclamation-triangle" />
                            </button>
                            <button className={`${p}-act`} title="Düzenle" onClick={() => tahsilDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* ─── Mobil Kart Listesi ─── */}
              <div className="d-md-none">
                {fT.length === 0 ? (
                  <div className={`${p}-empty-state`}>
                    <i className="bi bi-bank" />
                    <h6>Bu dönemde tahsildeki evrak bulunamadı</h6>
                    <p>Portföyden evrak tahsile gönderin</p>
                  </div>
                ) : <>
                  <div className="p-swipe-hint"><i className="bi bi-arrow-left-right" /> Sola kaydırarak işlem yapabilirsiniz</div>
                  {fT.map(item => (
                    <SwipeCard key={item.id} aksiyonlar={[
                      { icon: 'bi-check-lg', label: 'Ödendi', renk: 'success', onClick: () => tahsilOdendi(item.id) },
                      { icon: 'bi-arrow-counterclockwise', label: 'İade', renk: 'info', onClick: () => tahsilIade(item.id) },
                      { icon: 'bi-exclamation-triangle', label: 'Karşılıksız', renk: 'danger', onClick: () => tahsilKarsiliksiz(item.id) },
                      { icon: 'bi-pencil', label: 'Düzenle', renk: 'warning', onClick: () => tahsilDzlAc(item) },
                    ]}>
                      <div className="p-cek-mk">
                        <div className="p-cek-mk-ust">
                          <DynamicAvatar isim={item.firma_adi} boyut={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="p-cek-mk-firma" style={{ margin: 0 }}>{item.firma_adi}</div>
                            {item.banka && <div className="p-cek-mk-banka"><i className="bi bi-bank me-1" />{item.banka}</div>}
                          </div>
                          <span className="p-cek-mk-tutar financial-num" style={{ color: renkler.success }}>{TL(item.tutar)}</span>
                        </div>
                        <div className="p-cek-mk-alt">
                          <TurBadge tur={item.tur} renkler={renkler} />
                          {item.evrak_no && <span className="p-cek-mk-evrak-no">{item.evrak_no}</span>}
                          <span style={{ marginLeft: 'auto' }}><VadeBadge tarih={item.vade_tarihi} p={p} /></span>
                        </div>
                      </div>
                    </SwipeCard>
                  ))}
                </>}
              </div>
              {fT.length > 0 && (
                <div className={`${p}-list-footer ${p}-list-footer-green`}>
                  <span className={`${p}-list-footer-count`}>{fT.length} evrak listeleniyor</span>
                  <span className={`${p}-list-footer-total financial-num`} style={{ color: renkler.success }}>Toplam: {TL(tahsilToplam)}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3 — ÖDENECEK KENDİ EVRAKLARIMız
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 3 && (
            <div>
              {/* Gradient Banner */}
              <div className={`${p}-banner ${p}-banner-red`}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div className={`${p}-banner-label`}>Bekleyen Borç</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.danger }}>{TL(kendiBekleyen)}</div>
                    </div>
                    <div>
                      <div className={`${p}-banner-label`}>Vadesi Geçen</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.danger }}>{TL(kendiGecmis)}</div>
                    </div>
                    <div>
                      <div className={`${p}-banner-label`}>Toplam Çıkış</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.text }}>{TL(kendiToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} p={p} />
                </div>
              </div>

              {/* Arama + Yeni Buton */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <div className={`input-group flex-grow-1 ${p}-search`} style={{ minWidth: 220 }}>
                  <span className="input-group-text"><i className="bi bi-search" /></span>
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="Firma, evrak no, banka veya vade tarihi ara..."
                    value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                  {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
                </div>
                <div className="d-flex flex-column align-items-end gap-1">
                  {kullanici?.plan === 'deneme' && cekBilgi && !cekBilgi.sinirsiz && (cekDurum === 'uyari' || cekDurum === 'dolu') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
                      color: cekLimitDolu ? renkler.danger : renkler.warning }}>
                      <div style={{ width: 60, height: 3, borderRadius: 2, background: hexRgba(renkler.textSec, 0.15), overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(cekBilgi.yuzde, 100)}%`,
                          background: cekLimitDolu ? renkler.danger : renkler.warning, borderRadius: 2 }} />
                      </div>
                      {cekBilgi.mevcut}/{cekBilgi.sinir} bu ay
                    </div>
                  )}
                  <button className={`${p}-btn-accent d-none d-md-flex align-items-center`}
                    onClick={() => { setKendiForm(kendiBosluk()); setKendiDzlId(null); setKendiModal(true) }}
                    disabled={cekLimitDolu}
                    title={cekLimitDolu ? 'Aylık çek/senet limiti doldu. Planı yükseltin.' : 'Yeni borç evrakı ekle'}
                    style={cekLimitDolu ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
                    <i className="bi bi-plus-lg me-2" /> Yeni Borç Ekle
                  </button>
                </div>
              </div>

              <div className="table-responsive d-none d-md-block">
                <table className={`table table-hover align-middle ${p}-table`}>
                  <thead>
                    <tr>
                      <th>Ödeme Tarihi (Vade)</th>
                      <th>İşlem Tarihi</th>
                      <th>Tutar</th>
                      <th>Firma (Ödeme Yapılan)</th>
                      <th>Tür / Banka</th>
                      <th>Evrak No</th>
                      <th style={{ textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fK.length === 0 && (
                      <tr>
                        <td colSpan={7} className={`${p}-empty-state`}>
                          <i className="bi bi-arrow-up-circle" />
                          <h6>Bu dönemde borç evrakı bulunamadı</h6>
                          <p>Yeni borç evrakı ekleyin</p>
                          <button className="p-empty-cta" onClick={() => { setKendiForm(kendiBosluk()); setKendiDzlId(null); setKendiModal(true) }}>
                            <i className="bi bi-plus-lg" /> Borç Evrakı Ekle
                          </button>
                        </td>
                      </tr>
                    )}
                    {fK.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px' }}><VadeBadge tarih={item.vade_tarihi} p={p} /></td>
                        <td className={`${p}-td-muted`} style={{ padding: '12px' }}>{tarihFmt(item.islem_tarihi)}</td>
                        <td className={`${p}-td-amount financial-num`} style={{ padding: '12px', color: renkler.danger }}>{TL(item.tutar)}</td>
                        <td className={`${p}-td-firma`} style={{ padding: '12px' }}>{item.firma_adi}</td>
                        <td style={{ padding: '12px' }}>
                          <TurBadge tur={item.tur} renkler={renkler} />
                          {item.banka && <div className={`${p}-td-firma-sub`} style={{ marginTop: 4 }}><i className="bi bi-bank me-1" />{item.banka}</div>}
                        </td>
                        <td className={`${p}-td-mono`} style={{ padding: '12px' }}>{item.evrak_no || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 justify-content-end p-row-actions">
                            <button className={`${p}-act ${p}-act-success`} title="Ödendi" onClick={() => kendiOdendi(item.id)}>
                              <i className="bi bi-check-lg" />
                            </button>
                            <button className={`${p}-act`} title="Düzenle" onClick={() => kendiDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className={`${p}-act ${p}-act-danger`} title="Sil" onClick={() => kendiSil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* ─── Mobil Kart Listesi ─── */}
              <div className="d-md-none">
                {fK.length === 0 ? (
                  <div className={`${p}-empty-state`}>
                    <i className="bi bi-arrow-up-circle" />
                    <h6>Bu dönemde borç evrakı bulunamadı</h6>
                    <p>Yeni borç evrakı eklemek için butona tıklayın</p>
                    <button className="p-empty-cta" onClick={() => { setKendiForm(kendiBosluk()); setKendiDzlId(null); setKendiModal(true) }}>
                      <i className="bi bi-plus-lg" /> Borç Evrakı Ekle
                    </button>
                  </div>
                ) : <>
                  <div className="p-swipe-hint"><i className="bi bi-arrow-left-right" /> Sola kaydırarak işlem yapabilirsiniz</div>
                  {fK.map(item => (
                    <SwipeCard key={item.id} aksiyonlar={[
                      { icon: 'bi-check-lg', label: 'Ödendi', renk: 'success', onClick: () => kendiOdendi(item.id) },
                      { icon: 'bi-pencil', label: 'Düzenle', renk: 'info', onClick: () => kendiDzlAc(item) },
                      { icon: 'bi-trash', label: 'Sil', renk: 'danger', onClick: () => kendiSil(item.id) },
                    ]}>
                      <div className="p-cek-mk">
                        <div className="p-cek-mk-ust">
                          <DynamicAvatar isim={item.firma_adi} boyut={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="p-cek-mk-firma" style={{ margin: 0 }}>{item.firma_adi}</div>
                            {item.banka && <div className="p-cek-mk-banka"><i className="bi bi-bank me-1" />{item.banka}</div>}
                          </div>
                          <span className="p-cek-mk-tutar financial-num" style={{ color: renkler.danger }}>{TL(item.tutar)}</span>
                        </div>
                        <div className="p-cek-mk-alt">
                          <TurBadge tur={item.tur} renkler={renkler} />
                          {item.evrak_no && <span className="p-cek-mk-evrak-no">{item.evrak_no}</span>}
                          <span style={{ marginLeft: 'auto' }}><VadeBadge tarih={item.vade_tarihi} p={p} /></span>
                        </div>
                      </div>
                    </SwipeCard>
                  ))}
                </>}
              </div>
              {fK.length > 0 && (
                <div className={`${p}-list-footer ${p}-list-footer-red`}>
                  <span className={`${p}-list-footer-count`}>{fK.length} evrak listeleniyor</span>
                  <span className={`${p}-list-footer-total financial-num`} style={{ color: renkler.danger }}>Toplam: {TL(kendiToplam)}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4 — CİROLANAN EVRAKLAR
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 4 && (
            <div>
              {/* Gradient Banner */}
              <div className={`${p}-banner ${p}-banner-warning-alt`}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div className={`${p}-banner-label`}>Bekleyen Vade</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.primary }}>{TL(ciroBekleyen)}</div>
                    </div>
                    <div>
                      <div className={`${p}-banner-label`}>Vadesi Geçen</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.danger }}>{TL(ciroGecmis)}</div>
                    </div>
                    <div>
                      <div className={`${p}-banner-label`}>Toplam Cirolanan</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.text }}>{TL(ciroToplam)}</div>
                    </div>
                  </div>
                  <FiltreSatiri filtre={filtre} setFiltre={setFiltre} p={p} />
                </div>
              </div>

              {/* Arama */}
              <div className={`input-group mb-3 ${p}-search`}>
                <span className="input-group-text"><i className="bi bi-search" /></span>
                <input className="form-control" style={{ minHeight: 44 }} placeholder="Firma, teslim yeri, evrak no veya vade tarihi ara..."
                  value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
              </div>

              <div className="table-responsive d-none d-md-block">
                <table className={`table table-hover align-middle ${p}-table`}>
                  <thead>
                    <tr>
                      <th>Ödeme Tarihi (Vade)</th>
                      <th>Ciro Tarihi</th>
                      <th>Tutar</th>
                      <th>Asıl Firma (Müşteri)</th>
                      <th>Teslim Edilen Yer</th>
                      <th>Tür / Evrak No</th>
                      <th style={{ textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fC.length === 0 && (
                      <tr>
                        <td colSpan={7} className={`${p}-empty-state`}>
                          <i className="bi bi-arrow-left-right" />
                          <h6>Bu dönemde cirolanan evrak bulunamadı</h6>
                          <p>Portföyden evrak cirolandığında burada görünür</p>
                        </td>
                      </tr>
                    )}
                    {fC.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px' }}><VadeBadge tarih={item.vade_tarihi} p={p} /></td>
                        <td className={`${p}-td-muted`} style={{ padding: '12px' }}>{tarihFmt(item.ciro_tarihi)}</td>
                        <td className={`${p}-td-amount financial-num`} style={{ padding: '12px', color: renkler.primary }}>{TL(item.tutar)}</td>
                        <td className={`${p}-td-firma`} style={{ padding: '12px' }}>{item.asil_firma}</td>
                        <td style={{ padding: '12px' }} className={`${p}-td-muted`}>
                          {item.teslim_yeri ? (
                            <span><i className="bi bi-arrow-right me-1" style={{ color: renkler.primary }} />{item.teslim_yeri}</span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <TurBadge tur={item.tur} renkler={renkler} />
                          {item.evrak_no && <div className={`${p}-td-mono`} style={{ marginTop: 4 }}>{item.evrak_no}</div>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div className="d-flex gap-1 justify-content-end p-row-actions">
                            <button className={`${p}-act ${p}-act-success`} title="Tamamlandı" onClick={() => ciroTamamlandi(item.id)}>
                              <i className="bi bi-check-lg" />
                            </button>
                            <button className={`${p}-act`} title="Portföye İade Et" onClick={() => ciroIade(item.id)}>
                              <i className="bi bi-arrow-counterclockwise" />
                            </button>
                            <button className={`${p}-act`} title="Düzenle" onClick={() => ciroDzlAc(item)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className={`${p}-act ${p}-act-danger`} title="Sil" onClick={() => ciroSil(item.id)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* ─── Mobil Kart Listesi ─── */}
              <div className="d-md-none">
                {fC.length === 0 ? (
                  <div className={`${p}-empty-state`}>
                    <i className="bi bi-arrow-left-right" />
                    <h6>Bu dönemde cirolanan evrak bulunamadı</h6>
                    <p>Portföyden evrak cirolandığında burada görünür</p>
                  </div>
                ) : <>
                  <div className="p-swipe-hint"><i className="bi bi-arrow-left-right" /> Sola kaydırarak işlem yapabilirsiniz</div>
                  {fC.map(item => (
                    <SwipeCard key={item.id} aksiyonlar={[
                      { icon: 'bi-check-lg', label: 'Tamam', renk: 'success', onClick: () => ciroTamamlandi(item.id) },
                      { icon: 'bi-arrow-counterclockwise', label: 'İade', renk: 'info', onClick: () => ciroIade(item.id) },
                      { icon: 'bi-pencil', label: 'Düzenle', renk: 'warning', onClick: () => ciroDzlAc(item) },
                      { icon: 'bi-trash', label: 'Sil', renk: 'danger', onClick: () => ciroSil(item.id) },
                    ]}>
                      <div className="p-cek-mk">
                        <div className="p-cek-mk-ust">
                          <DynamicAvatar isim={item.asil_firma} boyut={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="p-cek-mk-firma" style={{ margin: 0 }}>{item.asil_firma}</div>
                            {item.teslim_yeri && <div className="p-cek-mk-banka"><i className="bi bi-arrow-right me-1" />{item.teslim_yeri}</div>}
                          </div>
                          <span className="p-cek-mk-tutar financial-num" style={{ color: renkler.primary }}>{TL(item.tutar)}</span>
                        </div>
                        <div className="p-cek-mk-alt">
                          <TurBadge tur={item.tur} renkler={renkler} />
                          {item.evrak_no && <span className="p-cek-mk-evrak-no">{item.evrak_no}</span>}
                          <span style={{ marginLeft: 'auto' }}><VadeBadge tarih={item.vade_tarihi} p={p} /></span>
                        </div>
                      </div>
                    </SwipeCard>
                  ))}
                </>}
              </div>
              {fC.length > 0 && (
                <div className={`${p}-list-footer ${p}-list-footer-warning-alt`}>
                  <span className={`${p}-list-footer-count`}>{fC.length} evrak listeleniyor</span>
                  <span className={`${p}-list-footer-total financial-num`} style={{ color: renkler.primary }}>Toplam: {TL(ciroToplam)}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 5 — ARŞİV
          ═══════════════════════════════════════════════════════════════════ */}
          {aktifTab === 5 && (
            <div>
              {/* Banner */}
              <div className={`${p}-banner ${p}-banner-neutral`}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div className="d-flex gap-4 flex-wrap">
                    <div>
                      <div className={`${p}-banner-label`}>Tahsil Edilen</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.success }}>{TL(arsiv.filter(i => i.tur_kategori === 'tahsil_edildi').reduce((s, i) => s + i.tutar, 0))}</div>
                    </div>
                    <div>
                      <div className={`${p}-banner-label`}>Kendi Ödenen</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.primary }}>{TL(arsiv.filter(i => i.tur_kategori === 'kendi_odendi').reduce((s, i) => s + i.tutar, 0))}</div>
                    </div>
                    <div>
                      <div className={`${p}-banner-label`}>Ciro Tamamlanan</div>
                      <div className={`${p}-banner-value financial-num`} style={{ color: renkler.primary }}>{TL(arsiv.filter(i => i.tur_kategori === 'ciro_tamamlandi').reduce((s, i) => s + i.tutar, 0))}</div>
                    </div>
                  </div>
                  <div className={`${p}-banner-hint`}>
                    <i className="bi bi-archive-fill" style={{ color: renkler.textSec }} />
                    Toplam {arsiv.length} kayıt
                  </div>
                </div>
              </div>

              {/* Arama + 6 Kategori Pill */}
              <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                <div className={`input-group flex-grow-1 ${p}-search`} style={{ minWidth: 220 }}>
                  <span className="input-group-text"><i className="bi bi-search" /></span>
                  <input className="form-control" style={{ minHeight: 44 }} placeholder="Firma, evrak no veya vade tarihi ara..."
                    value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
                  {aramaMetni && <button className="btn btn-outline-secondary" onClick={() => setAramaMetni('')}><i className="bi bi-x" /></button>}
                </div>
                <div className="d-flex gap-1 flex-wrap">
                  {[
                    { v: 'tumu',            label: 'Tümü' },
                    { v: 'tahsil_edildi',   label: 'Tahsil Edilen' },
                    { v: 'kendi_odendi',    label: 'Kendi Ödenen' },
                    { v: 'ciro_tamamlandi', label: 'Ciro Tamamlanan' },
                    { v: 'iade_edildi',     label: 'İade Edildi' },
                    { v: 'karsiliksiz',     label: 'Karşılıksız' },
                    { v: 'protestolu',      label: 'Protestolu' },
                  ].map(({ v, label }) => (
                    <button
                      key={v}
                      className={`btn btn-sm ${p}-arsiv-pill ${arsivKategori === v ? 'active' : ''}`}
                      onClick={() => setArsivKategori(v)}
                    >{label}</button>
                  ))}
                </div>
              </div>

              <div className="table-responsive d-none d-md-block">
                <table className={`table table-hover align-middle ${p}-table`}>
                  <thead>
                    <tr>
                      <th>Kapatma Tarihi</th>
                      <th>Vade Tarihi</th>
                      <th>Tutar</th>
                      <th>Firma</th>
                      <th>Tür / Evrak No</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fA.length === 0 && (
                      <tr>
                        <td colSpan={6} className={`${p}-empty-state`}>
                          <i className="bi bi-archive" />
                          <h6>Arşivde kayıt bulunamadı</h6>
                          <p>Tamamlanan evraklar burada görünür</p>
                        </td>
                      </tr>
                    )}
                    {fA.map(item => {
                      const cfg = arsivBadgeCfg(item.tur_kategori, renkler)
                      const isKarsiliksiz = item.tur_kategori === 'karsiliksiz'
                      const aksiyonIcon = {
                        anlasacagim:  'bi-handshake',
                        bekleyecegim: 'bi-hourglass-split',
                        kapatildi:    'bi-check-circle-fill',
                      }[item.karsiliksiz_aksiyon]
                      return (
                        <tr
                          key={item.id}
                          className={isKarsiliksiz ? `${p}-cek-tr-karsiliksiz` : ''}
                          onClick={isKarsiliksiz ? () => karsiliksizAc(item) : undefined}
                          style={isKarsiliksiz ? { cursor: 'pointer' } : undefined}
                          title={isKarsiliksiz ? 'Detay / Not ekle' : undefined}
                        >
                          <td className={`${p}-td-muted`} style={{ padding: '12px' }}>{tarihFmt(item.kapanis_tarihi)}</td>
                          <td className={`${p}-td-muted`} style={{ padding: '12px' }}>{tarihFmt(item.vade_tarihi)}</td>
                          <td className={`${p}-td-amount financial-num`} style={{ padding: '12px', color: cfg.renk }}>{TL(item.tutar)}</td>
                          <td style={{ padding: '12px' }}>
                            <div className={`${p}-td-firma`}>{item.firma_adi}</div>
                            {item.asil_borclu && <div className={`${p}-td-firma-sub`}>{item.asil_borclu}</div>}
                            {item.teslim_yeri && <div className={`${p}-td-firma-sub`}><i className="bi bi-arrow-right me-1" />{item.teslim_yeri}</div>}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <TurBadge tur={item.tur} renkler={renkler} />
                            {item.evrak_no && <div className={`${p}-td-mono`} style={{ marginTop: 4 }}>{item.evrak_no}</div>}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: cfg.bg, color: cfg.renk,
                              fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '4px 10px',
                              border: `1px solid ${hexRgba(cfg.renk, 0.18)}`,
                            }}>
                              <span className="cek-dot" style={{ background: cfg.renk, boxShadow: `0 0 6px ${hexRgba(cfg.renk, 0.5)}` }} />
                              {cfg.label}
                            </span>
                            {isKarsiliksiz && (
                              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                {item.karsiliksiz_aksiyon && (
                                  <span className={`${p}-karsiliksiz-aksiyon-badge`}>
                                    <i className={`bi ${aksiyonIcon}`} />
                                    {item.karsiliksiz_aksiyon === 'anlasacagim' && 'Anlaşılıyor'}
                                    {item.karsiliksiz_aksiyon === 'bekleyecegim' && 'Takipte'}
                                    {item.karsiliksiz_aksiyon === 'kapatildi' && 'Kapatıldı'}
                                  </span>
                                )}
                                <span className={`${p}-karsiliksiz-tikla`}>
                                  <i className="bi bi-pencil-square" /> Detay
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* ─── Mobil Kart Listesi ─── */}
              <div className="d-md-none">
                {fA.length === 0 ? (
                  <div className={`${p}-empty-state`}>
                    <i className="bi bi-archive" />
                    <h6>Arşivde kayıt bulunamadı</h6>
                    <p>Tamamlanan evraklar burada görünür</p>
                  </div>
                ) : fA.map(item => {
                  const cfg = arsivBadgeCfg(item.tur_kategori, renkler)
                  const isKarsiliksiz = item.tur_kategori === 'karsiliksiz'
                  return (
                    <div
                      key={item.id}
                      className={`p-cek-mk${isKarsiliksiz ? ` ${p}-cek-mk-karsiliksiz` : ''}`}
                      onClick={isKarsiliksiz ? () => karsiliksizAc(item) : undefined}
                      style={isKarsiliksiz ? { cursor: 'pointer' } : undefined}
                    >
                      <div className="p-cek-mk-ust">
                        <DynamicAvatar isim={item.firma_adi || item.asil_firma} boyut={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="p-cek-mk-firma" style={{ margin: 0 }}>{item.firma_adi || item.asil_firma}</div>
                          {item.evrak_no && <div className="p-cek-mk-banka">{item.evrak_no}</div>}
                        </div>
                        <span className="p-cek-mk-tutar financial-num" style={{ color: cfg.renk }}>{TL(item.tutar)}</span>
                      </div>
                      <div className="p-cek-mk-alt">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: cfg.bg, color: cfg.renk,
                          fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '2px 7px',
                          border: `1px solid ${hexRgba(cfg.renk, 0.18)}`,
                        }}>
                          <span className="cek-dot" style={{ background: cfg.renk }} />
                          {cfg.label}
                        </span>
                        <TurBadge tur={item.tur} renkler={renkler} />
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: renkler.textSec }}>
                          {tarihFmt(item.vade_tarihi)}
                        </span>
                      </div>
                      {isKarsiliksiz && (
                        <div className={`${p}-karsiliksiz-mobil-hint`}>
                          <i className="bi bi-pencil-square me-1" />
                          {item.karsiliksiz_aksiyon
                            ? (item.karsiliksiz_aksiyon === 'anlasacagim' ? 'Anlaşılıyor' : item.karsiliksiz_aksiyon === 'bekleyecegim' ? 'Takipte' : 'Kapatıldı')
                            : 'Detay eklemek için dokun'
                          }
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {fA.length > 0 && (
                <div className={`${p}-list-footer ${p}-list-footer-neutral`}>
                  <span className={`${p}-list-footer-count`}>{fA.length} kayıt gösteriliyor</span>
                  <span className={`${p}-list-footer-total financial-num`} style={{ color: renkler.textSec }}>Toplam: {TL(fA.reduce((s, i) => s + i.tutar, 0))}</span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALLER
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ─── Karşılıksız Çek Rehberi ────────────────────────────────────────── */}
      <KarsiliksizModal
        open={karsiliksizModal}
        onClose={() => setKarsiliksizModal(false)}
        item={karsiliksizItem}
        form={karsiliksizForm}
        setForm={setKarsiliksizForm}
        onKaydet={karsiliksizKaydet}
        kayitIyor={karsiliksizKayitIyor}
        p={p}
        renkler={renkler}
      />

      {/* ─── Generic Onay ───────────────────────────────────────────────────── */}
      <OnayModal
        open={!!onay}
        onClose={() => setOnay(null)}
        onOnayla={() => onay?.islem?.()}
        baslik={onay?.baslik}
        mesaj={onay?.mesaj}
        ikon={onay?.ikon}
        btnRenk={onay?.btnRenk}
        btnYazi={onay?.btnYazi}
        p={p}
      />

      {/* ─── Portföy: Yeni / Düzenle ────────────────────────────────────────── */}
      <Modal open={portfoyModal} onClose={() => { setPortfoyModal(false); setPortfoyDzlId(null) }} scrollable p={p} ariaId="cek-portfoy-modal-title">
        <div className={`${p}-modal-header ${p}-mh-default`}>
          <div className="d-flex align-items-center gap-3">
            <div className={`${p}-modal-icon ${p}-modal-icon-default`}>
              <i className={`bi ${portfoyDzlId ? 'bi-pencil-square' : 'bi-file-earmark-plus'}`} />
            </div>
            <div>
              <h2 id="cek-portfoy-modal-title" className={`${p}-modal-title`}>{portfoyDzlId ? 'Evrak Düzenle' : 'Yeni Evrak — Portföy'}</h2>
              <div className={`${p}-modal-sub`}>Müşteri çeki veya senedi</div>
            </div>
          </div>
          <button className={`${p}-modal-close`} onClick={() => { setPortfoyModal(false); setPortfoyDzlId(null) }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={`${p}-modal-body`}>
          {/* Bölüm: Evrak Bilgileri */}
          <div className={`${p}-section-bar`}>
            <div className={`${p}-section-mark`} />
            <span className={`${p}-section-label`}>Cari & Evrak Bilgileri</span>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <FG label="Evrak Tipi" zorunlu p={p} renkler={renkler}>
                <select className="form-select"
                  value={portfoyForm.tur} onChange={(e) => setPortfoyForm({ ...portfoyForm, tur: e.target.value })}>
                  <option>Müşteri Çeki</option>
                  <option>Müşteri Senedi</option>
                </select>
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Firma / Müşteri" zorunlu p={p} renkler={renkler}>
                <AutoComplete value={portfoyForm.firma_adi}
                  onChange={(v) => setPortfoyForm({ ...portfoyForm, firma_adi: v, cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Cari seç..." id="pf-firma" required p={p} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Çeki Kesen Kişi / Firma" p={p} renkler={renkler}>
                <input className="form-control" value={portfoyForm.asil_borclu}
                  placeholder="Asıl borçlu adı (opsiyonel)"
                  onChange={(e) => setPortfoyForm({ ...portfoyForm, asil_borclu: e.target.value })} />
              </FG>
            </div>
          </div>
          {/* Bölüm: Evrak Detayları */}
          <div className={`${p}-section-bar`}>
            <div className={`${p}-section-mark`} />
            <span className={`${p}-section-label`}>Evrak Detayları</span>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <FG label="Evrak / Çek No" p={p} renkler={renkler}>
                <input className="form-control" value={portfoyForm.evrak_no}
                  placeholder="Evrak numarası"
                  onChange={(e) => setPortfoyForm({ ...portfoyForm, evrak_no: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Tutar" zorunlu p={p} renkler={renkler}>
                <div className="input-group">
                  <input className="form-control p-tutar-input" placeholder="0,00" inputMode="decimal"
                    value={portfoyForm.tutarStr}
                    onChange={(e) => setPortfoyForm({ ...portfoyForm, tutarStr: formatParaInput(e.target.value) })} />
                  <span className="input-group-text">₺</span>
                </div>
              </FG>
            </div>
            {portfoyForm.tur === 'Müşteri Çeki' && (
            <div className="col-md-6">
              <FG label="Banka Adı" p={p} renkler={renkler}>
                <AutoComplete value={portfoyForm.banka} onChange={(v) => setPortfoyForm({ ...portfoyForm, banka: v })}
                  options={BANKALAR} placeholder="Banka seç veya yaz..." id="pf-banka" p={p} />
              </FG>
            </div>
            )}
            <div className="col-md-6">
              <FG label="Vade Tarihi" zorunlu kritik p={p} renkler={renkler}>
                <DateInput value={portfoyForm.vade_tarihi}
                  onChange={(val) => setPortfoyForm({ ...portfoyForm, vade_tarihi: val })}
                  placeholder="Vade tarihi" />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Düzenlenme / Alınma Tarihi" p={p} renkler={renkler}>
                <DateInput value={portfoyForm.islem_tarihi}
                  onChange={(val) => setPortfoyForm({ ...portfoyForm, islem_tarihi: val })}
                  placeholder="İşlem tarihi" />
              </FG>
            </div>
          </div>
        </div>
        <div className={`${p}-modal-footer`}>
          <button className={`${p}-btn-cancel`}
            onClick={() => { setPortfoyModal(false); setPortfoyDzlId(null) }}>İptal</button>
          <button className={`${p}-btn-save ${p}-btn-save-default${kaydediyor ? ' p-btn-loading' : ''}`}
            onClick={portfoyKaydet} disabled={kaydediyor}>
            {kaydediyor ? <><span className="p-btn-spinner" />Kaydediliyor...</> : <><i className="bi bi-floppy me-2" />Kaydet</>}
          </button>
        </div>
      </Modal>

      {/* ─── Tahsile Ver Modalı ─────────────────────────────────────────────── */}
      <Modal open={tahsileModal} onClose={() => setTahsileModal(false)} size="sm" confirm p={p} ariaId="cek-tahsile-modal-title">
        <div className={`${p}-modal-header ${p}-mh-green`}>
          <div className="d-flex align-items-center gap-3">
            <div className={`${p}-modal-icon ${p}-modal-icon-green`}>
              <i className="bi bi-bank" />
            </div>
            <div>
              <h2 id="cek-tahsile-modal-title" className={`${p}-modal-title`}>Tahsile Ver</h2>
              <div className={`${p}-modal-sub`}>Banka tahsilatına gönder</div>
            </div>
          </div>
          <button className={`${p}-modal-close`} onClick={() => setTahsileModal(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={`${p}-modal-body`}>
          <FG label="Banka Adı" zorunlu p={p} renkler={renkler}>
            <AutoComplete value={tahsileForm.banka} onChange={(v) => setTahsileForm({ ...tahsileForm, banka: v })}
              options={BANKALAR} placeholder="Banka seç veya yaz..." id="tv-banka" required p={p} />
          </FG>
          <FG label="Tahsile Veriş Tarihi" zorunlu p={p} renkler={renkler}>
            <DateInput value={tahsileForm.tarih}
              onChange={(val) => setTahsileForm({ ...tahsileForm, tarih: val })}
              placeholder="Tahsile veriş tarihi" />
          </FG>
        </div>
        <div className={`${p}-modal-footer`}>
          <button className={`${p}-btn-cancel`} onClick={() => setTahsileModal(false)}>İptal</button>
          <button className={`${p}-btn-save ${p}-btn-save-green${kaydediyor ? ' p-btn-loading' : ''}`} onClick={tahsileVer} disabled={kaydediyor}>
            <i className="bi bi-check-circle me-2" />İşlemi Tamamla
          </button>
        </div>
      </Modal>

      {/* ─── Cirola Modalı ──────────────────────────────────────────────────── */}
      <Modal open={cirolaModal} onClose={() => setCirolaModal(false)} size="sm" confirm p={p} ariaId="cek-cirola-modal-title">
        <div className={`${p}-modal-header ${p}-mh-warning-alt`}>
          <div className="d-flex align-items-center gap-3">
            <div className={`${p}-modal-icon ${p}-modal-icon-warning-alt`}>
              <i className="bi bi-arrow-left-right" />
            </div>
            <div>
              <h2 id="cek-cirola-modal-title" className={`${p}-modal-title`}>Evrakı Ciroyla</h2>
              <div className={`${p}-modal-sub`}>Başka firmaya devret</div>
            </div>
          </div>
          <button className={`${p}-modal-close`} onClick={() => setCirolaModal(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={`${p}-modal-body`}>
          <FG label="Teslim Edilecek Firma (Cari)" zorunlu p={p} renkler={renkler}>
            <AutoComplete value={cirolaForm.firma}
              onChange={(v) => setCirolaForm({ ...cirolaForm, firma: v, cari_id: cariIdBul(v) })}
              options={cariSecenekleri} placeholder="Cari seç..." id="ci-firma" required p={p} />
          </FG>
          <FG label="Ciro Tarihi" zorunlu p={p} renkler={renkler}>
            <DateInput value={cirolaForm.tarih}
              onChange={(val) => setCirolaForm({ ...cirolaForm, tarih: val })}
              placeholder="Ciro tarihi" />
          </FG>
        </div>
        <div className={`${p}-modal-footer`}>
          <button className={`${p}-btn-cancel`} onClick={() => setCirolaModal(false)}>İptal</button>
          <button className={`${p}-btn-save ${p}-btn-save-warning-alt${kaydediyor ? ' p-btn-loading' : ''}`} onClick={cirolaKaydet} disabled={kaydediyor}>
            <i className="bi bi-arrow-left-right me-2" />Ciroyu Tamamla
          </button>
        </div>
      </Modal>

      {/* ─── Kendi Çekimiz: Yeni / Düzenle ─────────────────────────────────── */}
      <Modal open={kendiModal} onClose={() => { setKendiModal(false); setKendiDzlId(null) }} scrollable p={p} ariaId="cek-kendi-modal-title">
        <div className={`${p}-modal-header ${p}-mh-red`}>
          <div className="d-flex align-items-center gap-3">
            <div className={`${p}-modal-icon ${p}-modal-icon-red`}>
              <i className={`bi ${kendiDzlId ? 'bi-pencil-square' : 'bi-file-earmark-minus'}`} />
            </div>
            <div>
              <h2 id="cek-kendi-modal-title" className={`${p}-modal-title`}>{kendiDzlId ? 'Borç Evrakı Düzenle' : 'Yeni Borç Evrakı'}</h2>
              <div className={`${p}-modal-sub`}>Kendi çekimiz / senedimiz</div>
            </div>
          </div>
          <button className={`${p}-modal-close`} onClick={() => { setKendiModal(false); setKendiDzlId(null) }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={`${p}-modal-body`}>
          {/* Bölüm: Cari & Evrak Bilgileri */}
          <div className={`${p}-section-bar`}>
            <div className={`${p}-section-mark`} />
            <span className={`${p}-section-label`}>Cari & Evrak Bilgileri</span>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <FG label="Evrak Tipi" zorunlu p={p} renkler={renkler}>
                <select className="form-select"
                  value={kendiForm.tur} onChange={(e) => setKendiForm({ ...kendiForm, tur: e.target.value })}>
                  <option>Kendi Çekimiz</option>
                  <option>Kendi Senedimiz</option>
                </select>
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Firma / Tedarikçi" zorunlu p={p} renkler={renkler}>
                <AutoComplete value={kendiForm.firma_adi}
                  onChange={(v) => setKendiForm({ ...kendiForm, firma_adi: v, cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Cari seç..." id="ke-firma" required p={p} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Çeki Kesen Kişi / Firma" p={p} renkler={renkler}>
                <input className="form-control" value={kendiForm.asil_borclu}
                  placeholder="İsteğe bağlı"
                  onChange={(e) => setKendiForm({ ...kendiForm, asil_borclu: e.target.value })} />
              </FG>
            </div>
          </div>
          {/* Bölüm: Ödeme Detayları */}
          <div className={`${p}-section-bar`}>
            <div className={`${p}-section-mark`} />
            <span className={`${p}-section-label`}>Ödeme Detayları</span>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <FG label="Evrak / Çek No" p={p} renkler={renkler}>
                <input className="form-control" value={kendiForm.evrak_no}
                  placeholder="Evrak numarası"
                  onChange={(e) => setKendiForm({ ...kendiForm, evrak_no: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Tutar" zorunlu p={p} renkler={renkler}>
                <div className="input-group">
                  <input className="form-control p-tutar-input" placeholder="0,00" inputMode="decimal"
                    value={kendiForm.tutarStr}
                    onChange={(e) => setKendiForm({ ...kendiForm, tutarStr: formatParaInput(e.target.value) })} />
                  <span className="input-group-text">₺</span>
                </div>
              </FG>
            </div>
            {kendiForm.tur === 'Kendi Çekimiz' && (
            <div className="col-md-6">
              <FG label="Banka Adı" zorunlu p={p} renkler={renkler}>
                <AutoComplete value={kendiForm.banka} onChange={(v) => setKendiForm({ ...kendiForm, banka: v })}
                  options={BANKALAR} placeholder="Banka seç..." id="ke-banka" required p={p} />
              </FG>
            </div>
            )}
            <div className="col-md-6">
              <FG label="Vade Tarihi" zorunlu kritik p={p} renkler={renkler}>
                <DateInput value={kendiForm.vade_tarihi}
                  onChange={(val) => setKendiForm({ ...kendiForm, vade_tarihi: val })}
                  placeholder="Vade tarihi" />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Düzenlenme / Veriliş Tarihi" p={p} renkler={renkler}>
                <DateInput value={kendiForm.islem_tarihi}
                  onChange={(val) => setKendiForm({ ...kendiForm, islem_tarihi: val })}
                  placeholder="Veriliş tarihi" />
              </FG>
            </div>
          </div>
        </div>
        <div className={`${p}-modal-footer`}>
          <button className={`${p}-btn-cancel`}
            onClick={() => { setKendiModal(false); setKendiDzlId(null) }}>İptal</button>
          <button className={`${p}-btn-save ${p}-btn-save-red${kaydediyor ? ' p-btn-loading' : ''}`}
            onClick={kendiKaydet} disabled={kaydediyor}>
            {kaydediyor ? <><span className="p-btn-spinner" />Kaydediliyor...</> : <><i className="bi bi-floppy me-2" />Kaydet</>}
          </button>
        </div>
      </Modal>

      {/* ─── Tahsil Düzenle Modalı ──────────────────────────────────────────── */}
      <Modal open={tahsilDzlModal} onClose={() => setTahsilDzlModal(false)} scrollable p={p} ariaId="cek-tahsilduzle-modal-title">
        <div className={`${p}-modal-header ${p}-mh-green`}>
          <div className="d-flex align-items-center gap-3">
            <div className={`${p}-modal-icon ${p}-modal-icon-green`}>
              <i className="bi bi-pencil-square" />
            </div>
            <div>
              <h2 id="cek-tahsilduzle-modal-title" className={`${p}-modal-title`}>Bankada / Tahsilattaki Evrak Düzenle</h2>
              <div className={`${p}-modal-sub`}>Tahsil bilgilerini güncelle</div>
            </div>
          </div>
          <button className={`${p}-modal-close`} onClick={() => setTahsilDzlModal(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={`${p}-modal-body`}>
          <div className="row g-3">
            <div className="col-md-6">
              <FG label="Firma / Müşteri" zorunlu p={p} renkler={renkler}>
                <AutoComplete value={tahsilDzlForm.firma_adi || ''}
                  onChange={(v) => setTahsilDzlForm({ ...tahsilDzlForm, firma_adi: v, cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Cari seç..." id="td-firma" p={p} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Çeki Kesen Kişi / Firma" p={p} renkler={renkler}>
                <input className="form-control" value={tahsilDzlForm.asil_borclu || ''}
                  onChange={(e) => setTahsilDzlForm({ ...tahsilDzlForm, asil_borclu: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Evrak No" p={p} renkler={renkler}>
                <input className="form-control" value={tahsilDzlForm.evrak_no || ''}
                  onChange={(e) => setTahsilDzlForm({ ...tahsilDzlForm, evrak_no: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Banka Adı" p={p} renkler={renkler}>
                <AutoComplete value={tahsilDzlForm.banka || ''} onChange={(v) => setTahsilDzlForm({ ...tahsilDzlForm, banka: v })}
                  options={BANKALAR} placeholder="Banka seç..." id="td-banka" p={p} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Vade Tarihi" zorunlu p={p} renkler={renkler}>
                <DateInput value={tahsilDzlForm.vade_tarihi || ''}
                  onChange={(val) => setTahsilDzlForm({ ...tahsilDzlForm, vade_tarihi: val })}
                  placeholder="Vade tarihi" />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Tahsile Veriş Tarihi" p={p} renkler={renkler}>
                <DateInput value={tahsilDzlForm.tahsil_tarihi || ''}
                  onChange={(val) => setTahsilDzlForm({ ...tahsilDzlForm, tahsil_tarihi: val })}
                  placeholder="Tahsile veriş tarihi" />
              </FG>
            </div>
            <div className="col-12">
              <FG label="Tutar" zorunlu p={p} renkler={renkler}>
                <div className="input-group">
                  <input className="form-control p-tutar-input" placeholder="0,00" inputMode="decimal"
                    value={tahsilDzlForm.tutarStr || ''}
                    onChange={(e) => setTahsilDzlForm({ ...tahsilDzlForm, tutarStr: formatParaInput(e.target.value) })} />
                  <span className="input-group-text">₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        <div className={`${p}-modal-footer`}>
          <button className={`${p}-btn-cancel`} onClick={() => setTahsilDzlModal(false)}>İptal</button>
          <button className={`${p}-btn-save ${p}-btn-save-green${kaydediyor ? ' p-btn-loading' : ''}`}
            onClick={tahsilDzlKaydet} disabled={kaydediyor}>
            {kaydediyor ? <><span className="p-btn-spinner" />Kaydediliyor...</> : <><i className="bi bi-floppy me-2" />Güncelle</>}
          </button>
        </div>
      </Modal>

      {/* ─── Ciro Düzenle Modalı ────────────────────────────────────────────── */}
      <Modal open={ciroDzlModal} onClose={() => setCiroDzlModal(false)} scrollable p={p} ariaId="cek-ciroduzle-modal-title">
        <div className={`${p}-modal-header ${p}-mh-warning-alt`}>
          <div className="d-flex align-items-center gap-3">
            <div className={`${p}-modal-icon ${p}-modal-icon-warning-alt`}>
              <i className="bi bi-pencil-square" />
            </div>
            <div>
              <h2 id="cek-ciroduzle-modal-title" className={`${p}-modal-title`}>Cirolanan Evrak Düzenle</h2>
              <div className={`${p}-modal-sub`}>Ciro bilgilerini güncelle</div>
            </div>
          </div>
          <button className={`${p}-modal-close`} onClick={() => setCiroDzlModal(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className={`${p}-modal-body`}>
          <div className="row g-3">
            <div className="col-md-6">
              <FG label="Asıl Firma (Müşteri)" zorunlu p={p} renkler={renkler}>
                <AutoComplete value={ciroDzlForm.asil_firma || ''}
                  onChange={(v) => setCiroDzlForm({ ...ciroDzlForm, asil_firma: v, cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Müşteri firması..." id="cd-firma" p={p} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Teslim Edilen Yer" p={p} renkler={renkler}>
                <AutoComplete value={ciroDzlForm.teslim_yeri || ''}
                  onChange={(v) => setCiroDzlForm({ ...ciroDzlForm, teslim_yeri: v, ciro_edilen_cari_id: cariIdBul(v) })}
                  options={cariSecenekleri} placeholder="Teslim edilen firma..." id="cd-teslim" p={p} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Evrak No" p={p} renkler={renkler}>
                <input className="form-control" value={ciroDzlForm.evrak_no || ''}
                  onChange={(e) => setCiroDzlForm({ ...ciroDzlForm, evrak_no: e.target.value })} />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Evrak Tipi" p={p} renkler={renkler}>
                <select className="form-select" value={ciroDzlForm.tur || 'Müşteri Çeki'}
                  onChange={(e) => setCiroDzlForm({ ...ciroDzlForm, tur: e.target.value })}>
                  <option>Müşteri Çeki</option>
                  <option>Müşteri Senedi</option>
                </select>
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Vade Tarihi" zorunlu p={p} renkler={renkler}>
                <DateInput value={ciroDzlForm.vade_tarihi || ''}
                  onChange={(val) => setCiroDzlForm({ ...ciroDzlForm, vade_tarihi: val })}
                  placeholder="Vade tarihi" />
              </FG>
            </div>
            <div className="col-md-6">
              <FG label="Ciro Tarihi" p={p} renkler={renkler}>
                <DateInput value={ciroDzlForm.ciro_tarihi || ''}
                  onChange={(val) => setCiroDzlForm({ ...ciroDzlForm, ciro_tarihi: val })}
                  placeholder="Ciro tarihi" />
              </FG>
            </div>
            <div className="col-12">
              <FG label="Tutar" zorunlu p={p} renkler={renkler}>
                <div className="input-group">
                  <input className="form-control p-tutar-input" placeholder="0,00" inputMode="decimal"
                    value={ciroDzlForm.tutarStr || ''}
                    onChange={(e) => setCiroDzlForm({ ...ciroDzlForm, tutarStr: formatParaInput(e.target.value) })} />
                  <span className="input-group-text">₺</span>
                </div>
              </FG>
            </div>
          </div>
        </div>
        <div className={`${p}-modal-footer`}>
          <button className={`${p}-btn-cancel`} onClick={() => setCiroDzlModal(false)}>İptal</button>
          <button className={`${p}-btn-save ${p}-btn-save-warning-alt${kaydediyor ? ' p-btn-loading' : ''}`}
            onClick={ciroDzlKaydet} disabled={kaydediyor}>
            {kaydediyor ? <><span className="p-btn-spinner" />Kaydediliyor...</> : <><i className="bi bi-floppy me-2" />Güncelle</>}
          </button>
        </div>
      </Modal>

      {/* ─── FAB — Hızlı İşlem ──────────────────────────────────────────── */}
      {fabAcik && <div className="p-fab-backdrop" onClick={() => setFabAcik(false)} />}
      <div className="p-fab-wrap">
        {fabAcik && (
          <div className="p-fab-menu">
            <button
              className="p-fab-item"
              onClick={() => { setFabAcik(false); setKendiForm(kendiBosluk()); setKendiDzlId(null); setKendiModal(true) }}
              disabled={cekLimitDolu}
              type="button"
            >
              <span className="p-fab-item-label">Yeni Borç Evrakı</span>
              <span className="p-fab-item-icon" style={cekLimitDolu ? { opacity: 0.45 } : undefined}>
                <i className="bi bi-arrow-up-circle-fill" />
              </span>
            </button>
            <button
              className="p-fab-item"
              onClick={() => { setFabAcik(false); setPortfoyForm(portfoyBosluk()); setPortfoyDzlId(null); setPortfoyModal(true) }}
              disabled={cekLimitDolu}
              type="button"
            >
              <span className="p-fab-item-label">Yeni Portföy Evrakı</span>
              <span className="p-fab-item-icon" style={cekLimitDolu ? { opacity: 0.45 } : undefined}>
                <i className="bi bi-file-earmark-plus-fill" />
              </span>
            </button>
          </div>
        )}
        <button
          className="p-fab-btn"
          onClick={() => setFabAcik(v => !v)}
          type="button"
          aria-label="Hızlı işlem"
        >
          <span className={`p-fab-btn-icon${fabAcik ? ' p-fab-open' : ''}`}>
            <i className="bi bi-plus-lg" />
          </span>
        </button>
      </div>

    </div>
  )
}
