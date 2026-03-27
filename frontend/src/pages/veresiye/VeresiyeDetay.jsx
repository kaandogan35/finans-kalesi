/**
 * VeresiyeDetay.jsx — Müşteri Veresiye Hesabı
 * Bir carinin tüm veresiye işlemleri + satış/ödeme ekle
 * ParamGo teması — projenin p-modal-* sınıf sistemi kullanılıyor
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { veresiyeApi } from '../../api/veresiye'
import useTemaStore from '../../stores/temaStore'

const prefixMap = { paramgo: 'p' }

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

const tarihFmt = (s) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('tr-TR') : '—')
const bugunTarih = () => new Date().toISOString().split('T')[0]

// Para input masking
const formatParaInput = (value) => {
  let v = value.replace(/[^0-9,]/g, '')
  const parts = v.split(',')
  if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = v.split(',')
  const formatted = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? formatted + ',' + kesir.slice(0, 2) : formatted
}
const parseParaInput = (f) => parseFloat(String(f).replace(/\./g, '').replace(',', '.')) || 0

const bosIslemForm = { tutar: '', aciklama: '', tarih: bugunTarih() }

// ─── İşlem Ekleme Modali ─────────────────────────────────────────────────────
function IslemModal({ goster, tur, cariAdi, onKapat, onKaydet, yukleniyor, p }) {
  const [form, setForm] = useState(bosIslemForm)

  useEffect(() => {
    if (goster) setForm(bosIslemForm)
  }, [goster])

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onKapat() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onKapat])

  const handleKaydet = () => {
    const tutar = parseParaInput(form.tutar)
    if (!tutar || tutar <= 0) { toast.error('Tutar giriniz.'); return }
    onKaydet({ tur, tutar, aciklama: form.aciklama, tarih: form.tarih })
  }

  if (!goster) return null

  const isSatis   = tur === 'satis'
  const baslik    = isSatis ? 'Satış Ekle' : 'Ödeme Al'
  const ikon      = isSatis ? 'bi-bag-plus-fill' : 'bi-cash-coin'
  const headerCls = isSatis ? `${p}-mh-danger` : `${p}-mh-success`
  const ikonCls   = isSatis ? `${p}-modal-icon-red` : `${p}-modal-icon-green`
  const saveCls   = isSatis ? `${p}-btn-save ${p}-btn-save-red` : `${p}-btn-save ${p}-btn-save-green`

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
        <div className={`${p}-modal-box`} style={{ maxWidth: 440 }}>

          {/* Header */}
          <div className={`${p}-modal-header ${headerCls}`}>
            <div className="d-flex align-items-center gap-3">
              <div className={`${p}-modal-icon ${ikonCls}`} style={{ background: 'rgba(255,255,255,0.18)', boxShadow: 'none' }}>
                <i className={`bi ${ikon}`} />
              </div>
              <div>
                <h2 className={`${p}-modal-title`}>{baslik}</h2>
                <div className={`${p}-modal-sub`}>{cariAdi}</div>
              </div>
            </div>
            <button onClick={onKapat} className={`${p}-modal-close`} type="button" aria-label="Kapat">
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Body */}
          <div className={`${p}-modal-body`} style={{ padding: '24px' }}>

            {/* Tutar — büyük gösterim */}
            <div className="mb-4">
              <label className={`${p}-vry-form-label`}>
                Tutar <span className="text-danger">*</span>
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text" style={{ fontWeight: 800, fontSize: 16, minWidth: 48, justifyContent: 'center' }}>₺</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-control text-end"
                  style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}
                  placeholder="0,00"
                  value={form.tutar}
                  onChange={(e) => setForm(f => ({ ...f, tutar: formatParaInput(e.target.value) }))}
                  autoFocus
                />
              </div>
            </div>

            {/* Açıklama */}
            <div className="mb-3">
              <label className={`${p}-vry-form-label`}>
                {isSatis ? 'Ürün / Hizmet Açıklaması' : 'Ödeme Notu'}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={isSatis ? 'Örn: Demir boru 6m, profil kesim hizmeti...' : 'Örn: Nakit tahsilat, banka transferi...'}
                value={form.aciklama}
                onChange={(e) => setForm(f => ({ ...f, aciklama: e.target.value }))}
                maxLength={200}
              />
            </div>

            {/* Tarih */}
            <div>
              <label className={`${p}-vry-form-label`}>İşlem Tarihi</label>
              <input
                type="date"
                className="form-control"
                value={form.tarih}
                onChange={(e) => setForm(f => ({ ...f, tarih: e.target.value }))}
              />
            </div>

          </div>

          {/* Footer */}
          <div className={`${p}-modal-footer`}>
            <button type="button" className={`${p}-btn-cancel`} onClick={onKapat}>
              İptal
            </button>
            <button
              type="button"
              className={saveCls}
              onClick={handleKaydet}
              disabled={yukleniyor}
            >
              {yukleniyor
                ? <><span className="spinner-border spinner-border-sm me-2" />{baslik}...</>
                : <><i className={`bi ${ikon} me-2`} />{baslik}</>
              }
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Silme Onay Modali ───────────────────────────────────────────────────────
function SilModal({ goster, onKapat, onOnayla, yukleniyor, p }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onKapat() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onKapat])

  if (!goster) return null

  return createPortal(
    <>
      <div className={`${p}-modal-overlay`} />
      <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
        <div className={`${p}-modal-box`} style={{ maxWidth: 400 }}>

          <div className={`${p}-modal-header ${p}-mh-danger`}>
            <div className="d-flex align-items-center gap-3">
              <div className={`${p}-modal-icon`} style={{ background: 'rgba(255,255,255,0.18)', boxShadow: 'none', width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
                <i className="bi bi-exclamation-triangle-fill" />
              </div>
              <div>
                <h2 className={`${p}-modal-title`}>İşlemi Sil</h2>
                <div className={`${p}-modal-sub`}>Bu işlem geri alınamaz</div>
              </div>
            </div>
            <button onClick={onKapat} className={`${p}-modal-close`} type="button" aria-label="Kapat">
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className={`${p}-modal-body`} style={{ padding: '28px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--p-text-sec)', margin: 0, lineHeight: 1.6 }}>
              Bu veresiye kaydını silmek istediğinize<br />emin misiniz?
            </p>
          </div>

          <div className={`${p}-modal-footer`}>
            <button type="button" className={`${p}-btn-cancel`} onClick={onKapat}>İptal</button>
            <button
              type="button"
              className={`${p}-btn-save ${p}-btn-save-red`}
              onClick={onOnayla}
              disabled={yukleniyor}
            >
              {yukleniyor
                ? <><span className="spinner-border spinner-border-sm me-2" />Siliniyor...</>
                : <><i className="bi bi-trash3-fill me-2" />Kaydı Sil</>
              }
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function VeresiyeDetay() {
  const { cariId }  = useParams()
  const navigate    = useNavigate()
  const aktifTema   = useTemaStore((s) => s.aktifTema)
  const p           = prefixMap[aktifTema] || 'p'

  const [cari, setCari]                       = useState(null)
  const [islemler, setIslemler]               = useState([])
  const [yukleniyor, setYukleniyor]           = useState(true)
  const [islemModal, setIslemModal]           = useState(null)   // 'satis' | 'odeme' | null
  const [silModal, setSilModal]               = useState(null)   // islem_id | null
  const [islemYukleniyor, setIslemYukleniyor] = useState(false)

  // ─── Veri Yükle ─────────────────────────────────────────────────────────────
  const veriYukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const res = await veresiyeApi.cariDetay(cariId)
      setCari(res.data.veri?.cari ?? null)
      setIslemler(res.data.veri?.islemler ?? [])
    } catch {
      toast.error('Veriler yüklenemedi.')
    } finally {
      setYukleniyor(false)
    }
  }, [cariId])

  useEffect(() => { veriYukle() }, [veriYukle])

  // Modal açıkken body scroll kilitle
  useEffect(() => {
    document.body.style.overflow = (islemModal || silModal) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [islemModal, silModal])

  // ─── İşlem Kaydet ────────────────────────────────────────────────────────────
  const handleIslemKaydet = async (veri) => {
    setIslemYukleniyor(true)
    try {
      await veresiyeApi.islemEkle(cariId, veri)
      toast.success(veri.tur === 'satis' ? 'Satış kaydedildi.' : 'Ödeme kaydedildi.')
      setIslemModal(null)
      await veriYukle()
    } catch (err) {
      toast.error(err?.response?.data?.hata || 'İşlem kaydedilemedi.')
    } finally {
      setIslemYukleniyor(false)
    }
  }

  // ─── İşlem Sil ───────────────────────────────────────────────────────────────
  const handleIslemSil = async () => {
    if (!silModal) return
    setIslemYukleniyor(true)
    try {
      await veresiyeApi.islemSil(cariId, silModal)
      toast.success('İşlem silindi.')
      setSilModal(null)
      await veriYukle()
    } catch {
      toast.error('İşlem silinemedi.')
    } finally {
      setIslemYukleniyor(false)
    }
  }

  // ─── Yükleniyor ──────────────────────────────────────────────────────────────
  if (yukleniyor) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-success" role="status" />
      </div>
    )
  }

  if (!cari) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-person-x" style={{ fontSize: 40, opacity: 0.25 }} />
        <p className="mt-3" style={{ color: 'var(--p-text-muted)' }}>Cari bulunamadı.</p>
        <button className={`${p}-btn-outline`} onClick={() => navigate('/veresiye')}>Geri Dön</button>
      </div>
    )
  }

  const ozet   = cari.ozet ?? {}
  const bakiye = ozet.bakiye ?? 0

  return (
    <div className={`${p}-vry-sayfa`}>

      {/* ─── Breadcrumb ──────────────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <button type="button" className={`${p}-vry-geri-btn`} onClick={() => navigate('/veresiye')}>
          <i className="bi bi-arrow-left me-1" />
          Veresiye
        </button>
        <i className="bi bi-chevron-right" style={{ fontSize: 11, color: 'var(--p-text-muted)' }} />
        <span style={{ fontSize: 13, color: 'var(--p-text-sec)', fontWeight: 600 }}>{cari.cari_adi}</span>
      </div>

      {/* ─── Sayfa Header ────────────────────────────────────────────── */}
      <div className={`${p}-page-header`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon`}>
            <i className="bi bi-person-vcard-fill" />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>{cari.cari_adi}</h1>
            <p className={`${p}-page-sub`}>
              {cari.cari_turu === 'tedarikci' ? 'Tedarikçi' : 'Müşteri'} · Veresiye Hesabı
            </p>
          </div>
        </div>
        <div className={`${p}-page-header-right d-flex gap-2`}>
          <button type="button" className={`btn ${p}-vry-btn-odeme`} onClick={() => setIslemModal('odeme')}>
            <i className="bi bi-cash-coin me-2" />Ödeme Al
          </button>
          <button type="button" className={`btn ${p}-vry-btn-satis`} onClick={() => setIslemModal('satis')}>
            <i className="bi bi-bag-plus me-2" />Satış Ekle
          </button>
        </div>
      </div>

      {/* ─── KPI Kartları ────────────────────────────────────────────── */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-4">
          <div className={`${p}-kpi-card ${p}-vry-kpi`}>
            <i className={`bi bi-bag ${p}-vry-kpi-deco`} style={{ opacity: 0.35 }} />
            <div className={`${p}-vry-kpi-label`}>TOPLAM SATIŞ</div>
            <div className={`${p}-vry-kpi-value text-danger financial-num`}>{TL(ozet.toplam_satis ?? 0)}</div>
            <div className={`${p}-vry-kpi-desc`}>{ozet.toplam_islem ?? 0} işlem kaydı</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className={`${p}-kpi-card ${p}-vry-kpi`}>
            <i className={`bi bi-cash-stack ${p}-vry-kpi-deco`} style={{ opacity: 0.35 }} />
            <div className={`${p}-vry-kpi-label`}>TOPLAM ÖDEME</div>
            <div className={`${p}-vry-kpi-value text-success financial-num`}>{TL(ozet.toplam_odeme ?? 0)}</div>
            <div className={`${p}-vry-kpi-desc`}>tahsil edildi</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className={`${p}-kpi-card ${p}-vry-kpi ${p}-vry-kpi-highlight`}>
            <i className={`bi bi-wallet2 ${p}-vry-kpi-deco`} style={{ opacity: 0.35 }} />
            <div className={`${p}-vry-kpi-label`}>AÇIK BAKİYE</div>
            <div className={`${p}-vry-kpi-value financial-num ${bakiye > 0 ? 'text-danger' : bakiye < 0 ? 'text-success' : ''}`}>
              {TL(bakiye)}
            </div>
            <div className={`${p}-vry-kpi-desc`}>
              {bakiye > 0 ? 'borçlu' : bakiye < 0 ? 'alacaklı' : 'hesap kapalı'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── İşlem Tablosu ───────────────────────────────────────────── */}
      <div className={`${p}-cym-glass-card`}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--p-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            <i className="bi bi-clock-history me-2" style={{ color: 'var(--p-color-primary)' }} />
            İşlem Geçmişi
          </span>
          <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>{islemler.length} kayıt</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr className={`${p}-vry-thead-row`}>
                <th>TARİH</th>
                <th>TÜR</th>
                <th>AÇIKLAMA / NOT</th>
                <th className="text-end">TUTAR</th>
                <th className="text-end">KÜMÜLATİF BAKİYE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {islemler.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <i className="bi bi-journal-x" style={{ fontSize: 32, opacity: 0.25, display: 'block', marginBottom: 8 }} />
                    <span style={{ fontSize: 13, color: 'var(--p-text-muted)' }}>Henüz işlem kaydı yok.</span>
                    <br />
                    <button type="button" className={`btn ${p}-vry-btn-satis mt-3`} onClick={() => setIslemModal('satis')}>
                      <i className="bi bi-bag-plus me-2" />İlk Satışı Ekle
                    </button>
                  </td>
                </tr>
              ) : islemler.map((islem) => {
                const isSatis = islem.tur === 'satis'
                return (
                  <tr key={islem.id} className={`${p}-vry-tablo-satir`}>
                    <td style={{ fontSize: 13, color: 'var(--p-text-sec)', whiteSpace: 'nowrap' }}>
                      {tarihFmt(islem.tarih)}
                    </td>
                    <td>
                      <span className={`${p}-vry-islem-badge ${isSatis ? `${p}-vry-badge-satis` : `${p}-vry-badge-odeme`}`}>
                        <i className={`bi ${isSatis ? 'bi-bag' : 'bi-cash'} me-1`} />
                        {isSatis ? 'Satış' : 'Ödeme'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, maxWidth: 220 }}>
                      <span style={{ color: islem.aciklama ? 'var(--p-text)' : 'var(--p-text-muted)' }}>
                        {islem.aciklama || '—'}
                      </span>
                    </td>
                    <td className="text-end">
                      <span className={`fw-700 financial-num ${isSatis ? 'text-danger' : 'text-success'}`} style={{ fontSize: 14 }}>
                        {isSatis ? '+' : '-'}{TL(islem.tutar)}
                      </span>
                    </td>
                    <td className="text-end">
                      <span className={`fw-600 financial-num ${islem.kumulatif_bakiye > 0 ? 'text-danger' : islem.kumulatif_bakiye < 0 ? 'text-success' : 'text-muted'}`} style={{ fontSize: 13 }}>
                        {TL(islem.kumulatif_bakiye)}
                      </span>
                    </td>
                    <td>
                      <button type="button" className={`${p}-vry-sil-btn`} title="Kaydı sil" onClick={() => setSilModal(islem.id)}>
                        <i className="bi bi-trash3" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modaller ────────────────────────────────────────────────── */}
      <IslemModal
        goster={islemModal !== null}
        tur={islemModal}
        cariAdi={cari.cari_adi}
        onKapat={() => setIslemModal(null)}
        onKaydet={handleIslemKaydet}
        yukleniyor={islemYukleniyor}
        p={p}
      />
      <SilModal
        goster={silModal !== null}
        onKapat={() => setSilModal(null)}
        onOnayla={handleIslemSil}
        yukleniyor={islemYukleniyor}
        p={p}
      />

    </div>
  )
}
