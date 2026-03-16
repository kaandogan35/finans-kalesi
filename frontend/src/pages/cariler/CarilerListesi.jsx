/**
 * CarilerListesi — Cari Hesaplar Ana Sayfası
 * 3 Tema Sistemi (Banking / Earthy / Dark)
 * Silme onayı: Saf React state (Bootstrap JS yasak)
 */

import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { carilerApi } from '../../api/cariler'
import useTemaStore from '../../stores/temaStore'

const prefixMap = { banking: 'b', earthy: 'e', dark: 'd' }

// ─── Para Formatlayıcı ────────────────────────────────────────────────────────
function paraBicimlendir(tutar) {
  if (tutar === null || tutar === undefined || tutar === '') return '—'
  const sayi = parseFloat(tutar)
  if (isNaN(sayi)) return '—'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'TRY', maximumFractionDigits: 2,
  }).format(sayi)
}

// ─── Cari Tipi Rozeti ─────────────────────────────────────────────────────────
function CariTipiRozeti({ tur, p }) {
  const harita = {
    musteri:           { etiket: 'Müşteri',    cls: 'musteri' },
    tedarikci:         { etiket: 'Tedarikçi',  cls: 'tedarikci' },
    musteri_tedarikci: { etiket: 'Müşt./Ted.', cls: 'karma' },
  }
  const d = harita[tur] || { etiket: tur || '—', cls: 'musteri' }
  return (
    <span className={`${p}-cari-badge ${p}-cari-badge-${d.cls}`}>
      {d.etiket}
    </span>
  )
}

// ─── Sıralama Başlığı ─────────────────────────────────────────────────────────
function SiralamaBaslik({ label, alan, siralama, setSiralama, p }) {
  const aktif = siralama.alan === alan
  const yon   = aktif ? siralama.yon : null

  return (
    <button
      className={`${p}-cari-sort-btn ${aktif ? `${p}-cari-sort-active` : ''}`}
      onClick={() => {
        if (!aktif) setSiralama({ alan, yon: 'asc' })
        else setSiralama({ alan, yon: yon === 'asc' ? 'desc' : 'asc' })
      }}
    >
      {label}
      <span className={`${p}-cari-sort-arrow`}>
        <i className={`bi bi-caret-up-fill ${aktif && yon === 'asc' ? `${p}-cari-sort-arrow-lit` : `${p}-cari-sort-arrow-dim`}`} />
        <i className={`bi bi-caret-down-fill ${aktif && yon === 'desc' ? `${p}-cari-sort-arrow-lit` : `${p}-cari-sort-arrow-dim`}`} />
      </span>
    </button>
  )
}

// ─── Satır Aksiyon Menüsü ─────────────────────────────────────────────────────
function AksiyonMenusu({ cari, onSilIste, navigate, p }) {
  const [acik, setAcik] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        className={`${p}-cari-menu-trigger`}
        onClick={() => setAcik(v => !v)}
      >
        <i className="bi bi-three-dots-vertical" />
      </button>

      {acik && (
        <>
          <div
            className={`${p}-cari-menu-backdrop`}
            onClick={() => setAcik(false)}
          />
          <div className={`${p}-cari-menu-dropdown`}>
            <button
              className={`${p}-cari-menu-item`}
              onClick={() => { setAcik(false); navigate(`/cariler/${cari.id}`) }}
            >
              <i className="bi bi-eye" /> Detay
            </button>
            <button
              className={`${p}-cari-menu-item`}
              onClick={() => { setAcik(false); navigate(`/cariler/${cari.id}/duzenle`) }}
            >
              <i className="bi bi-pencil" /> Düzenle
            </button>
            <div className={`${p}-cari-menu-divider`} />
            <button
              className={`${p}-cari-menu-item ${p}-cari-menu-item-danger`}
              onClick={() => { setAcik(false); onSilIste(cari) }}
            >
              <i className="bi bi-trash3" /> Sil
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Silme Onay Modalı ────────────────────────────────────────────────────────
function SilmeOnayModal({ cari, onOnayla, onIptal, yukleniyor, p }) {
  useEffect(() => {
    if (!cari) return
    const handler = (e) => { if (e.key === 'Escape') onIptal() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [cari, onIptal])

  if (!cari) return null
  return (
    <>
      {/* Backdrop — tıklamayla kapanmaz, sadece ESC ve İptal butonu */}
      <div className={`${p}-modal-overlay`} />
      {/* Modal */}
      <div className={`${p}-modal-center`}>
        <div className={`${p}-modal-box`} style={{ maxWidth: 420 }}>
          {/* Header */}
          <div className={`${p}-cari-modal-header-danger`}>
            <div className={`${p}-cari-modal-icon-danger`}>
              <i className="bi bi-trash3-fill" style={{ fontSize: 18, color: '#fff' }} />
            </div>
            <div>
              <div className={`${p}-modal-title`}>Cariyi Sil</div>
              <div className={`${p}-modal-sub`}>Bu işlem geri alınamaz</div>
            </div>
          </div>

          {/* Gövde */}
          <div className={`${p}-modal-body`}>
            <p className={`${p}-cari-modal-body-text`}>
              <strong>{cari.cari_adi}</strong> adlı cari
              kalıcı olarak silinecektir.
            </p>
          </div>

          {/* Footer */}
          <div className={`${p}-cari-modal-footer`}>
            <button
              className={`${p}-cari-btn-cancel-modal`}
              onClick={onIptal}
              disabled={yukleniyor}
            >
              İptal
            </button>
            <button
              className={`${p}-cari-btn-delete-modal`}
              onClick={onOnayla}
              disabled={yukleniyor}
            >
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

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function CarilerListesi() {
  const navigate = useNavigate()
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const p = prefixMap[aktifTema] || 'b'

  const [cariler, setCariler]       = useState([])
  const [toplam, setToplam]         = useState(0)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata]             = useState(null)

  const [aramaInput, setAramaInput] = useState('')
  const [arama, setArama]           = useState('')
  const [siralama, setSiralama]     = useState({ alan: 'olusturma_tarihi', yon: 'desc' })
  const [sayfa, setSayfa]           = useState(1)
  const sayfaBasi = 20

  // Silme modal state
  const [silAday, setSilAday]             = useState(null)
  const [silYukleniyor, setSilYukleniyor] = useState(false)

  const veriYukle = useCallback(async () => {
    setYukleniyor(true)
    setHata(null)
    try {
      const params = {
        sayfa, limit: sayfaBasi,
        siralama: `${siralama.alan}_${siralama.yon}`,
      }
      if (arama) params.arama = arama
      const yanit = await carilerApi.listele(params)
      setCariler(yanit.data.veri?.liste || [])
      setToplam(yanit.data.veri?.toplam || 0)
    } catch (err) {
      setHata(err.response?.data?.hata || 'Veriler yüklenemedi.')
    } finally {
      setYukleniyor(false)
    }
  }, [sayfa, siralama, arama])

  useEffect(() => { veriYukle() }, [veriYukle])

  // Debounce arama
  useEffect(() => {
    const t = setTimeout(() => { setArama(aramaInput); setSayfa(1) }, 400)
    return () => clearTimeout(t)
  }, [aramaInput])

  const handleSilOnayla = async () => {
    if (!silAday) return
    setSilYukleniyor(true)
    try {
      await carilerApi.sil(silAday.id)
      toast.success(`"${silAday.cari_adi}" başarıyla silindi.`)
      setSilAday(null)
      veriYukle()
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Silme işlemi başarısız.')
    } finally {
      setSilYukleniyor(false)
    }
  }

  const toplamSayfa = Math.ceil(toplam / sayfaBasi)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`${p}-page-root`}>

      {/* Silme Onay Modalı */}
      <SilmeOnayModal
        cari={silAday}
        onOnayla={handleSilOnayla}
        onIptal={() => setSilAday(null)}
        yukleniyor={silYukleniyor}
        p={p}
      />

      {/* ─── Başlık ─────────────────────────────────────────────────── */}
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div>
          <h1 className={`${p}-cari-title`}>Cari Hesaplar</h1>
          <p className={`${p}-cari-subtitle`}>
            {toplam > 0 ? `${toplam} kayıt` : 'Müşteri ve tedarikçi hesaplarınız'}
          </p>
        </div>

        <button
          className={`${p}-cari-btn-new`}
          onClick={() => navigate('/cariler/yeni')}
        >
          <i className="bi bi-plus-lg" />
          Yeni Cari
        </button>
      </div>

      {/* ─── Arama ──────────────────────────────────────────────────── */}
      <div className="mb-3">
        <div className={`${p}-cari-search-wrap`}>
          <i className={`bi bi-search ${p}-cari-search-icon`} />
          <input
            type="text"
            className={`${p}-cari-search-input`}
            placeholder="Cari adı, vergi no, telefon..."
            value={aramaInput}
            onChange={e => setAramaInput(e.target.value)}
          />
        </div>
      </div>

      {/* ─── Tablo Kartı ────────────────────────────────────────────── */}
      <div className={`${p}-panel`} style={{ padding: 0, overflow: 'hidden' }}>

        {/* Tablo Başlık Satırı */}
        <div className={`${p}-cari-grid-header`}>
          <SiralamaBaslik label="Cari Adı"  alan="cari_adi"      siralama={siralama} setSiralama={setSiralama} p={p} />
          <SiralamaBaslik label="Tür"       alan="cari_turu"     siralama={siralama} setSiralama={setSiralama} p={p} />
          <SiralamaBaslik label="Alacak"    alan="toplam_alacak" siralama={siralama} setSiralama={setSiralama} p={p} />
          <SiralamaBaslik label="Borç"      alan="toplam_borc"   siralama={siralama} setSiralama={setSiralama} p={p} />
          <span />
        </div>

        {/* ── Yükleniyor ── */}
        {yukleniyor && (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${p}-cari-skel-row`}>
                <div className="d-flex align-items-center gap-3">
                  <div className={`${p}-cari-skel-avatar`} />
                  <div>
                    <div className={`${p}-cari-skel`} style={{ height: 13, width: 140, marginBottom: 6 }} />
                    <div className={`${p}-cari-skel`} style={{ height: 11, width: 90 }} />
                  </div>
                </div>
                <div className={`${p}-cari-skel`} style={{ height: 22, width: 70, borderRadius: 20, alignSelf: 'center' }} />
                <div className={`${p}-cari-skel`} style={{ height: 13, width: 100, alignSelf: 'center' }} />
                <div className={`${p}-cari-skel`} style={{ height: 13, width: 100, alignSelf: 'center' }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Hata ── */}
        {!yukleniyor && hata && (
          <div className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{ padding: '60px 24px' }}>
            <div className={`${p}-cari-error-icon`}>
              <i className="bi bi-exclamation-circle" />
            </div>
            <p className={`${p}-cari-error-text`}>{hata}</p>
            <button className={`${p}-cari-retry-btn`} onClick={veriYukle}>
              Tekrar Dene
            </button>
          </div>
        )}

        {/* ── Boş Durum ── */}
        {!yukleniyor && !hata && cariler.length === 0 && (
          <div className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{ padding: '60px 24px' }}>
            <div className={`${p}-cari-empty-icon`}>
              <i className="bi bi-people" />
            </div>
            <p className={`${p}-cari-empty-title`}>
              {arama ? 'Arama sonucu bulunamadı' : 'Henüz cari kaydı yok'}
            </p>
            <p className={`${p}-cari-empty-desc`}>
              {arama ? `"${arama}" için eşleşen kayıt yok.` : 'İlk müşteri veya tedarikçinizi ekleyin.'}
            </p>
            {!arama && (
              <button
                className={`${p}-cari-btn-new`}
                onClick={() => navigate('/cariler/yeni')}
              >
                <i className="bi bi-plus-lg" /> İlk Cariyi Ekle
              </button>
            )}
          </div>
        )}

        {/* ── Tablo Satırları ── */}
        {!yukleniyor && !hata && cariler.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {cariler.map((cari) => (
              <li key={cari.id} className={`${p}-cari-grid-row`}>
                {/* Cari Adı */}
                <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                  <div className={`${p}-cari-avatar`}>
                    <span>{cari.cari_adi?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/cariler/${cari.id}`} className={`${p}-cari-link`}>
                      {cari.cari_adi}
                    </Link>
                    {cari.vergi_no && (
                      <p className={`${p}-cari-vergi`}>{cari.vergi_no}</p>
                    )}
                  </div>
                </div>

                {/* Tür */}
                <div>
                  <CariTipiRozeti tur={cari.cari_turu} p={p} />
                </div>

                {/* Alacak */}
                <div className={`${p}-cari-amount ${p}-cari-amount-pos`}>
                  <i className="bi bi-arrow-down-circle-fill" />
                  <span>{paraBicimlendir(cari.toplam_alacak)}</span>
                </div>

                {/* Borç */}
                <div className={`${p}-cari-amount ${p}-cari-amount-neg`}>
                  <i className="bi bi-arrow-up-circle-fill" />
                  <span>{paraBicimlendir(cari.toplam_borc)}</span>
                </div>

                {/* Aksiyon */}
                <div className="d-flex justify-content-center">
                  <AksiyonMenusu cari={cari} onSilIste={setSilAday} navigate={navigate} p={p} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* ── Sayfalama ── */}
        {!yukleniyor && toplamSayfa > 1 && (
          <div className={`${p}-cari-pagination`}>
            <p className={`${p}-cari-page-info`}>
              {(sayfa - 1) * sayfaBasi + 1}–{Math.min(sayfa * sayfaBasi, toplam)} / {toplam} kayıt
            </p>
            <div className="d-flex align-items-center gap-2">
              <button
                className={`${p}-cari-page-btn`}
                disabled={sayfa <= 1}
                onClick={() => setSayfa(s => s - 1)}
              >
                <i className="bi bi-chevron-left" /> Önceki
              </button>
              <span className={`${p}-cari-page-current`}>
                {sayfa} / {toplamSayfa}
              </span>
              <button
                className={`${p}-cari-page-btn`}
                disabled={sayfa >= toplamSayfa}
                onClick={() => setSayfa(s => s + 1)}
              >
                Sonraki <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
