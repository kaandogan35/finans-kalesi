/**
 * VeresiyeListesi.jsx — Veresiye Defteri Ana Sayfası
 * Tüm cariler + veresiye bakiyeleri listelenir
 * ParamGo teması, .p-vry- prefix
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import { veresiyeApi } from '../../api/veresiye'
import { carilerApi } from '../../api/cariler'
import useTemaStore from '../../stores/temaStore'
import { DynamicAvatar } from '../../components/SwipeCard'

const prefixMap = { paramgo: 'p' }

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

const tarihFmt = (s) => (s ? new Date(s).toLocaleDateString('tr-TR') : '—')

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function VeresiyeListesi() {
  const navigate    = useNavigate()
  const aktifTema   = useTemaStore((s) => s.aktifTema)
  const p           = prefixMap[aktifTema] || 'p'

  const [cariler, setCariler]         = useState([])
  const [ozet, setOzet]               = useState({})
  const [yukleniyor, setYukleniyor]   = useState(true)
  const [arama, setArama]             = useState('')
  const [sadeceBorclu, setSadeceBorclu] = useState(false)

  // Yeni Müşteri modalı
  const [yeniModalAcik, setYeniModalAcik] = useState(false)
  const [yeniAdi, setYeniAdi]             = useState('')
  const [yeniKaydediyor, setYeniKaydediyor] = useState(false)

  const yeniMusteriKaydet = async () => {
    const ad = yeniAdi.trim()
    if (!ad) { toast.error('Müşteri adı zorunludur.'); return }
    setYeniKaydediyor(true)
    try {
      const r = await carilerApi.olustur({ cari_adi: ad, cari_turu: 'musteri' })
      const yeniId = r?.data?.veri?.id
      setYeniModalAcik(false)
      setYeniAdi('')
      if (yeniId) navigate(`/veresiye/${yeniId}`)
      else { toast.success('Müşteri oluşturuldu.'); veriYukle() }
    } catch (e) {
      // 403 PLAN_GEREKLI → axios interceptor zaten paywall açar, sessiz kal
      if (e?.response?.status !== 403) toast.error('Müşteri oluşturulamadı.')
    } finally {
      setYeniKaydediyor(false)
    }
  }

  // ─── Veri Yükle ─────────────────────────────────────────────────────────────
  const veriYukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const params = {}
      if (arama.trim())     params.arama = arama.trim()
      if (sadeceBorclu)     params.sadece_borclular = 1

      const res = await veresiyeApi.listele(params)
      setCariler(res.data.veri?.cariler ?? [])
      setOzet(res.data.veri?.ozet ?? {})
    } catch {
      toast.error('Veriler yüklenemedi.')
    } finally {
      setYukleniyor(false)
    }
  }, [arama, sadeceBorclu])

  useEffect(() => { veriYukle() }, [veriYukle])

  // ─── Arama gecikmeli tetikle ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => { veriYukle() }, 350)
    return () => clearTimeout(timer)
  }, [arama]) // eslint-disable-line

  const cariTurEtiketi = (tur) => {
    if (tur === 'tedarikci') return 'Tedarikçi'
    if (tur === 'her_ikisi') return 'Müşteri / Tedarikçi'
    return 'Müşteri'
  }

  return (
    <div className={`${p}-vry-sayfa`}>

      {/* ─── Sayfa Header ─────────────────────────────────────────────── */}
      <div className={`${p}-page-header`}>
        <div className={`${p}-page-header-left`}>
          <div className={`${p}-page-header-icon`}>
            <i className="bi bi-journal-bookmark-fill" />
          </div>
          <div>
            <h1 className={`${p}-page-title`}>Veresiye Defteri</h1>
            <p className={`${p}-page-sub`}>Veresiye satışlarını ve borçları takip et</p>
          </div>
        </div>
        <div className={`${p}-page-header-right`}>
          <button
            type="button"
            onClick={() => setYeniModalAcik(true)}
            className={`${p}-cym-btn-new d-flex align-items-center gap-2`}
            title="Yeni müşteri ekle"
          >
            <i className="bi bi-plus-lg" />
            <span className="d-none d-md-inline">Yeni Müşteri</span>
          </button>
        </div>
      </div>

      {/* ─── KPI Kartları ─────────────────────────────────────────────── */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-4">
          <div className={`${p}-kpi-card ${p}-vry-kpi`}>
            <i className={`bi bi-wallet2 ${p}-vry-kpi-deco`} style={{ opacity: 0.35 }} />
            <div className={`${p}-vry-kpi-label`}>TOPLAM AÇIK ALACAK</div>
            <div className={`${p}-vry-kpi-value financial-num ${(ozet.toplam_acik_bakiye ?? 0) > 0 ? 'text-danger' : 'text-success'}`}>
              {TL(ozet.toplam_acik_bakiye ?? 0)}
            </div>
            <div className={`${p}-vry-kpi-desc`}>{ozet.borclu_musteri ?? 0} borçlu müşteri</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className={`${p}-kpi-card ${p}-vry-kpi`}>
            <i className={`bi bi-people ${p}-vry-kpi-deco`} style={{ opacity: 0.35 }} />
            <div className={`${p}-vry-kpi-label`}>KAYITLI MÜŞTERİ</div>
            <div className={`${p}-vry-kpi-value`}>{ozet.toplam_musteri ?? 0}</div>
            <div className={`${p}-vry-kpi-desc`}>veresiye hesabı olan</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className={`${p}-kpi-card ${p}-vry-kpi`}>
            <i className={`bi bi-bag-check ${p}-vry-kpi-deco`} style={{ opacity: 0.35 }} />
            <div className={`${p}-vry-kpi-label`}>BUGÜN SATIŞ</div>
            <div className={`${p}-vry-kpi-value financial-num`}>{TL(ozet.bugun_satis ?? 0)}</div>
            <div className={`${p}-vry-kpi-desc`}>{ozet.bugun_islem_sayisi ?? 0} işlem kaydedildi</div>
          </div>
        </div>
      </div>

      {/* ─── Tablo Kartı ──────────────────────────────────────────────── */}
      <div className={`${p}-cym-glass-card`}>

        {/* Toolbar */}
        <div className={`${p}-cym-toolbar d-flex flex-wrap align-items-center gap-2`}>
          {/* Arama */}
          <div className={`${p}-cym-search-wrap`}>
            <i className={`bi bi-search ${p}-cym-search-icon`} />
            <input
              type="text"
              className={`${p}-cym-search-input`}
              placeholder="Müşteri ara..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
            />
            {arama && (
              <button className={`${p}-cym-search-clear`} onClick={() => setArama('')}>
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          {/* Sadece Borçlular Toggle */}
          <button
            type="button"
            onClick={() => setSadeceBorclu(v => !v)}
            className={`${p}-cym-tab-btn ${sadeceBorclu ? `${p}-cym-tab-active` : ''}`}
            style={{ minHeight: 44 }}
          >
            <i className="bi bi-funnel me-1" />
            Sadece Borçlular
            {sadeceBorclu && <span className={`${p}-cym-tab-badge ${p}-cym-tab-badge-active ms-1`}>{cariler.length}</span>}
          </button>

          <div className="ms-auto">
            <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>
              {cariler.length} kayıt
            </span>
          </div>
        </div>

        {/* ─── Masaüstü Tablo (md ve üzeri) ───────────────────────── */}
        <div className="table-responsive d-none d-md-block">
          <table className="table table-hover align-middle p-table mb-0">
            <thead>
              <tr className={`${p}-vry-thead-row`}>
                <th>MÜŞTERİ</th>
                <th>TÜR</th>
                <th className="text-end">TOPLAM SATIŞ</th>
                <th className="text-end">TOPLAM ÖDEME</th>
                <th className="text-end">AÇIK BAKİYE</th>
                <th>SON İŞLEM</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {yukleniyor ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-success me-2" role="status" />
                    <span style={{ fontSize: 13, color: 'var(--p-text-muted)' }}>Yükleniyor...</span>
                  </td>
                </tr>
              ) : cariler.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`${p}-empty-state`}>
                    <i className="bi bi-journal-x" />
                    <h6>{arama ? 'Arama sonucu bulunamadı' : 'Henüz veresiye kaydı yok'}</h6>
                    <p>{arama ? 'Farklı bir arama deneyin' : 'İlk veresiye kaydınızı ekleyin'}</p>
                  </td>
                </tr>
              ) : cariler.map((c) => (
                <tr key={c.cari_id} className={`${p}-vry-tablo-satir`}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <DynamicAvatar isim={c.cari_adi} boyut={32} />
                      <span className="fw-600" style={{ fontSize: 14 }}>{c.cari_adi}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${p}-vry-tur-badge`}>{cariTurEtiketi(c.cari_turu)}</span>
                  </td>
                  <td className="text-end financial-num" style={{ fontSize: 13, color: 'var(--p-color-danger)' }}>
                    {TL(c.toplam_satis)}
                  </td>
                  <td className="text-end financial-num" style={{ fontSize: 13, color: 'var(--p-color-success)' }}>
                    {TL(c.toplam_odeme)}
                  </td>
                  <td className="text-end">
                    <span className={`fw-700 financial-num ${c.bakiye > 0 ? 'text-danger' : c.bakiye < 0 ? 'text-success' : ''}`}
                          style={{ fontSize: 14 }}>
                      {TL(c.bakiye)}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>
                    {tarihFmt(c.son_islem_tarihi)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${p}-cym-btn-outline`}
                      style={{ fontSize: 12, padding: '0 14px', minHeight: 34 }}
                      onClick={() => navigate(`/veresiye/${c.cari_id}`)}
                    >
                      <i className="bi bi-arrow-right me-1" />
                      Detay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Mobil Kart Listesi (md altı) ────────────────────────── */}
        <div className="d-md-none">
          {yukleniyor ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-success me-2" role="status" />
              <span style={{ fontSize: 13, color: 'var(--p-text-muted)' }}>Yükleniyor...</span>
            </div>
          ) : cariler.length === 0 ? (
            <div className={`${p}-empty-state`}>
              <i className="bi bi-journal-x" />
              <h6>{arama ? 'Arama sonucu bulunamadı' : 'Henüz veresiye kaydı yok'}</h6>
              <p>{arama ? 'Farklı bir arama deneyin' : 'İlk veresiye kaydınızı ekleyin'}</p>
            </div>
          ) : (
            <div className={`${p}-vry-mobil-liste`}>
              {cariler.map((c) => (
                <button
                  key={c.cari_id}
                  type="button"
                  className={`${p}-vry-mobil-kart`}
                  onClick={() => navigate(`/veresiye/${c.cari_id}`)}
                >
                  {/* Üst Satır: Avatar + İsim + Tür + Chevron */}
                  <div className={`${p}-vry-mk-ust`}>
                    <DynamicAvatar isim={c.cari_adi} boyut={36} />
                    <div className={`${p}-vry-mk-isim-grup`}>
                      <span className={`${p}-vry-mk-isim`}>{c.cari_adi}</span>
                      <span className={`${p}-vry-tur-badge`}>{cariTurEtiketi(c.cari_turu)}</span>
                    </div>
                    <i className={`bi bi-chevron-right ${p}-vry-mk-chevron`} />
                  </div>

                  {/* Orta Satır: Satış + Ödeme */}
                  <div className={`${p}-vry-mk-orta`}>
                    <div className={`${p}-vry-mk-kalem`}>
                      <span className={`${p}-vry-mk-kalem-etiket`}>Satış</span>
                      <span className={`${p}-vry-mk-kalem-deger financial-num ${p}-vry-mk-satis`}>{TL(c.toplam_satis)}</span>
                    </div>
                    <div className={`${p}-vry-mk-ayrac`} />
                    <div className={`${p}-vry-mk-kalem`}>
                      <span className={`${p}-vry-mk-kalem-etiket`}>Ödeme</span>
                      <span className={`${p}-vry-mk-kalem-deger financial-num ${p}-vry-mk-odeme`}>{TL(c.toplam_odeme)}</span>
                    </div>
                    <div className={`${p}-vry-mk-ayrac`} />
                    <div className={`${p}-vry-mk-kalem ${p}-vry-mk-kalem-bakiye`}>
                      <span className={`${p}-vry-mk-kalem-etiket`}>Bakiye</span>
                      <span className={`${p}-vry-mk-kalem-deger ${p}-vry-mk-bakiye-deger financial-num ${c.bakiye > 0 ? `${p}-vry-mk-borclu` : c.bakiye < 0 ? `${p}-vry-mk-alacakli` : ''}`}>
                        {TL(c.bakiye)}
                      </span>
                    </div>
                  </div>

                  {/* Alt Satır: Son işlem tarihi */}
                  {c.son_islem_tarihi && (
                    <div className={`${p}-vry-mk-alt`}>
                      <i className="bi bi-clock me-1" />
                      Son işlem: {tarihFmt(c.son_islem_tarihi)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ─── Yeni Müşteri Modalı (createPortal ile body'ye render) ────── */}
      {yeniModalAcik && createPortal(
        <>
          <div className={`${p}-modal-overlay`} onClick={() => !yeniKaydediyor && setYeniModalAcik(false)} />
          <div className={`${p}-modal-center`} role="dialog" aria-modal="true">
            <div className={`${p}-modal-box`} style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>

              {/* Başlık */}
              <div className={`${p}-modal-header ${p}-mh-default`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`${p}-modal-icon ${p}-modal-icon-green`}>
                    <i className="bi bi-person-plus" />
                  </div>
                  <div>
                    <h2 className={`${p}-modal-title`}>Yeni Müşteri</h2>
                    <p className={`${p}-modal-sub`}>Veresiye defterine yeni müşteri ekle</p>
                  </div>
                </div>
                <button type="button" onClick={() => !yeniKaydediyor && setYeniModalAcik(false)} className={`${p}-modal-close`} aria-label="Kapat">
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); yeniMusteriKaydet() }} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                <div className={`${p}-modal-body`}>
                  <label className={`${p}-kasa-input-label`}>Müşteri Adı *</label>
                  <input
                    type="text"
                    className={`${p}-kasa-input`}
                    placeholder="Örn: Ahmet Yılmaz"
                    value={yeniAdi}
                    onChange={(e) => setYeniAdi(e.target.value)}
                    autoFocus
                  />
                  <p style={{ fontSize: 12, color: 'var(--p-text-muted)', marginTop: 8 }}>
                    Müşteri eklenince detay sayfasına yönlendirileceksin. Oradan satış veya ödeme ekleyebilirsin.
                  </p>
                </div>
                <div className={`${p}-modal-footer`}>
                  <button type="button" className={`${p}-btn-cancel`} onClick={() => setYeniModalAcik(false)} disabled={yeniKaydediyor}>
                    İptal
                  </button>
                  <button type="submit" className={`${p}-btn-save`} disabled={yeniKaydediyor}>
                    {yeniKaydediyor ? 'Kaydediliyor...' : 'Kaydet & Aç'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>,
        document.body
      )}

    </div>
  )
}
