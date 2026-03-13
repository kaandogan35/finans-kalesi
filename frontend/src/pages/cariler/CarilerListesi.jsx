/**
 * CarilerListesi — Cari Hesaplar Ana Sayfası
 * Bootstrap 5 + Premium CSS — Login/Dashboard ile uyumlu kurumsal tasarım
 * Silme onayı: Bootstrap Modal (window.confirm yasak)
 */

import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { carilerApi } from '../../api/cariler'

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
function CariTipiRozeti({ tur }) {
  const harita = {
    musteri:              { etiket: 'Müşteri',     bg: '#eff6ff', color: '#1d4ed8' },
    tedarikci:            { etiket: 'Tedarikçi',   bg: '#fefce8', color: '#a16207' },
    musteri_tedarikci:    { etiket: 'Müşt./Ted.',  bg: '#f0fdf4', color: '#15803d' },
  }
  const d = harita[tur] || { etiket: tur || '—', bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{
      background: d.bg, color: d.color,
      fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20,
      border: `1px solid ${d.color}22`,
      whiteSpace: 'nowrap',
    }}>
      {d.etiket}
    </span>
  )
}

// ─── Sıralama Başlığı ─────────────────────────────────────────────────────────
function SiralamaBaslik({ label, alan, siralama, setSiralama }) {
  const aktif = siralama.alan === alan
  const yon   = aktif ? siralama.yon : null

  return (
    <button
      onClick={() => {
        if (!aktif) setSiralama({ alan, yon: 'asc' })
        else setSiralama({ alan, yon: yon === 'asc' ? 'desc' : 'asc' })
      }}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 800, letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: aktif ? 'var(--brand-dark)' : '#94a3b8',
      }}
    >
      {label}
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <i className="bi bi-caret-up-fill"
          style={{ fontSize: 8, opacity: aktif && yon === 'asc' ? 1 : 0.25 }} />
        <i className="bi bi-caret-down-fill"
          style={{ fontSize: 8, opacity: aktif && yon === 'desc' ? 1 : 0.25 }} />
      </span>
    </button>
  )
}

// ─── Satır Aksiyon Menüsü ─────────────────────────────────────────────────────
function AksiyonMenusu({ cari, onSilIste, navigate }) {
  const [acik, setAcik] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setAcik(v => !v)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#94a3b8', padding: '4px 6px', borderRadius: 8,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }}
      >
        <i className="bi bi-three-dots-vertical" style={{ fontSize: 15 }} />
      </button>

      {acik && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setAcik(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: 32, zIndex: 20,
            width: 156, background: '#fff',
            border: '1px solid #e2e8f0', borderRadius: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => { setAcik(false); navigate(`/cariler/${cari.id}`) }}
              className="d-flex align-items-center gap-2 w-100"
              style={{ background: 'none', border: 'none', padding: '10px 14px', fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <i className="bi bi-eye" style={{ color: '#94a3b8', fontSize: 14 }} /> Detay
            </button>
            <button
              onClick={() => { setAcik(false); navigate(`/cariler/${cari.id}/duzenle`) }}
              className="d-flex align-items-center gap-2 w-100"
              style={{ background: 'none', border: 'none', padding: '10px 14px', fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <i className="bi bi-pencil" style={{ color: '#94a3b8', fontSize: 14 }} /> Düzenle
            </button>
            <div style={{ borderTop: '1px solid #f1f5f9' }} />
            <button
              onClick={() => { setAcik(false); onSilIste(cari) }}
              className="d-flex align-items-center gap-2 w-100"
              style={{ background: 'none', border: 'none', padding: '10px 14px', fontSize: 13, color: '#f43f5e', cursor: 'pointer', fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <i className="bi bi-trash3" style={{ fontSize: 14 }} /> Sil
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Silme Onay Modalı ────────────────────────────────────────────────────────
function SilmeOnayModal({ cari, onOnayla, onIptal, yukleniyor }) {
  useEffect(() => {
    if (!cari) return
    const handler = (e) => { if (e.key === 'Escape') onIptal() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [cari, onIptal])

  if (!cari) return null
  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          background: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(3px)',
        }}
        onClick={onIptal}
      />
      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1055, width: '100%', maxWidth: 420,
        padding: '0 16px',
      }}>
        <div className="premium-card" style={{ padding: '32px 28px' }}>
          {/* İkon */}
          <div className="text-center mb-3">
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: '#fff1f2',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <i className="bi bi-trash3-fill" style={{ fontSize: 24, color: '#f43f5e' }} />
            </div>
            <h5 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Cariyi Sil
            </h5>
            <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>{cari.cari_adi}</strong> adlı cari
              kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </p>
          </div>

          {/* Butonlar */}
          <div className="d-flex gap-2 mt-4">
            <button
              onClick={onIptal}
              disabled={yukleniyor}
              className="btn btn-outline-brand flex-fill"
              style={{ borderRadius: 12, height: 44, fontWeight: 700, fontSize: 14 }}
            >
              İptal
            </button>
            <button
              onClick={onOnayla}
              disabled={yukleniyor}
              style={{
                flex: 1, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                border: 'none', color: '#fff',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                opacity: yukleniyor ? 0.7 : 1,
              }}
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
  const [silAday, setSilAday]           = useState(null)
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
      setHata(err.response?.data?.mesaj || 'Veriler yüklenemedi.')
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
      toast.error(err.response?.data?.mesaj || 'Silme işlemi başarısız.')
    } finally {
      setSilYukleniyor(false)
    }
  }

  const toplamSayfa = Math.ceil(toplam / sayfaBasi)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Silme Onay Modalı */}
      <SilmeOnayModal
        cari={silAday}
        onOnayla={handleSilOnayla}
        onIptal={() => setSilAday(null)}
        yukleniyor={silYukleniyor}
      />

      {/* ─── Başlık ─────────────────────────────────────────────────── */}
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Cari Hesaplar
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
            {toplam > 0 ? `${toplam} kayıt` : 'Müşteri ve tedarikçi hesaplarınız'}
          </p>
        </div>

        <button
          onClick={() => navigate('/cariler/yeni')}
          className="btn btn-brand d-flex align-items-center gap-2"
          style={{ borderRadius: 12, fontSize: 13, height: 40, padding: '0 18px' }}
        >
          <i className="bi bi-plus-lg" style={{ fontSize: 14 }} />
          Yeni Cari
        </button>
      </div>

      {/* ─── Arama ──────────────────────────────────────────────────── */}
      <div className="mb-3">
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <i className="bi bi-search" style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8', fontSize: 14, pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Cari adı, vergi no, telefon..."
            value={aramaInput}
            onChange={e => setAramaInput(e.target.value)}
            style={{
              width: '100%', height: 40,
              paddingLeft: 38, paddingRight: 14,
              background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: 12, fontSize: 13, fontWeight: 500,
              color: '#374151', fontFamily: 'inherit',
              outline: 'none', transition: 'all 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--brand-dark)'
              e.target.style.boxShadow = '0 0 0 3px rgba(18,63,89,0.1)'
            }}
            onBlur={e => {
              e.target.style.borderColor = '#e2e8f0'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>
      </div>

      {/* ─── Tablo Kartı ────────────────────────────────────────────── */}
      <div className="premium-card overflow-hidden" style={{ padding: 0 }}>

        {/* Tablo Başlık Satırı */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 130px 155px 155px 48px',
          gap: 16,
          padding: '12px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <SiralamaBaslik label="Cari Adı"  alan="cari_adi"      siralama={siralama} setSiralama={setSiralama} />
          <SiralamaBaslik label="Tür"       alan="cari_turu"     siralama={siralama} setSiralama={setSiralama} />
          <SiralamaBaslik label="Alacak"    alan="toplam_alacak" siralama={siralama} setSiralama={setSiralama} />
          <SiralamaBaslik label="Borç"      alan="toplam_borc"   siralama={siralama} setSiralama={setSiralama} />
          <span />
        </div>

        {/* ── Yükleniyor ── */}
        {yukleniyor && (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 130px 155px 155px 48px',
                gap: 16, padding: '14px 20px',
                borderBottom: '1px solid #f1f5f9',
              }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="animate-pulse" style={{ width: 38, height: 38, borderRadius: 12, background: '#f1f5f9', flexShrink: 0 }} />
                  <div>
                    <div className="animate-pulse" style={{ height: 13, width: 140, background: '#f1f5f9', borderRadius: 6, marginBottom: 6 }} />
                    <div className="animate-pulse" style={{ height: 11, width: 90, background: '#f1f5f9', borderRadius: 6 }} />
                  </div>
                </div>
                <div className="animate-pulse" style={{ height: 22, width: 70, background: '#f1f5f9', borderRadius: 20, alignSelf: 'center' }} />
                <div className="animate-pulse" style={{ height: 13, width: 100, background: '#f1f5f9', borderRadius: 6, alignSelf: 'center' }} />
                <div className="animate-pulse" style={{ height: 13, width: 100, background: '#f1f5f9', borderRadius: 6, alignSelf: 'center' }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Hata ── */}
        {!yukleniyor && hata && (
          <div className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{ padding: '60px 24px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: '#fff1f2', border: '1px solid #fecdd3',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <i className="bi bi-exclamation-circle" style={{ fontSize: 22, color: '#f43f5e' }} />
            </div>
            <p style={{ fontSize: 13, color: '#f43f5e', fontWeight: 600, margin: '0 0 12px' }}>{hata}</p>
            <button
              onClick={veriYukle}
              className="btn btn-outline-brand"
              style={{ borderRadius: 10, fontSize: 13, height: 36, padding: '0 16px' }}
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* ── Boş Durum ── */}
        {!yukleniyor && !hata && cariler.length === 0 && (
          <div className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{ padding: '60px 24px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <i className="bi bi-people" style={{ fontSize: 24, color: '#cbd5e1' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>
              {arama ? 'Arama sonucu bulunamadı' : 'Henüz cari kaydı yok'}
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }}>
              {arama ? `"${arama}" için eşleşen kayıt yok.` : 'İlk müşteri veya tedarikçinizi ekleyin.'}
            </p>
            {!arama && (
              <button
                onClick={() => navigate('/cariler/yeni')}
                className="btn btn-brand d-flex align-items-center gap-2"
                style={{ borderRadius: 12, fontSize: 13, height: 38, padding: '0 18px' }}
              >
                <i className="bi bi-plus-lg" /> İlk Cariyi Ekle
              </button>
            )}
          </div>
        )}

        {/* ── Tablo Satırları ── */}
        {!yukleniyor && !hata && cariler.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {cariler.map((cari) => {
              const bakiye = parseFloat(cari.bakiye ?? 0)
              return (
                <li
                  key={cari.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 130px 155px 155px 48px',
                    gap: 16, padding: '13px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    alignItems: 'center',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Cari Adı */}
                  <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'var(--brand-dark)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 3px 10px rgba(18,63,89,0.22)',
                    }}>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>
                        {cari.cari_adi?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <Link
                        to={`/cariler/${cari.id}`}
                        style={{
                          fontSize: 14, fontWeight: 700, color: '#1e293b',
                          textDecoration: 'none', display: 'block',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-dark)'}
                        onMouseLeave={e => e.currentTarget.style.color = '#1e293b'}
                      >
                        {cari.cari_adi}
                      </Link>
                      {cari.vergi_no && (
                        <p style={{
                          margin: '2px 0 0', fontSize: 12, color: '#94a3b8',
                          fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {cari.vergi_no}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tür */}
                  <div>
                    <CariTipiRozeti tur={cari.cari_turu} />
                  </div>

                  {/* Alacak — YEŞİL (finansal standart) */}
                  <div className="d-flex align-items-center gap-1">
                    <i className="bi bi-arrow-down-circle-fill" style={{ fontSize: 14, color: '#059669' }} />
                    <span className="financial-num" style={{ fontSize: 14, color: '#059669' }}>
                      {paraBicimlendir(cari.toplam_alacak)}
                    </span>
                  </div>

                  {/* Borç — KIRMIZI (finansal standart) */}
                  <div className="d-flex align-items-center gap-1">
                    <i className="bi bi-arrow-up-circle-fill" style={{ fontSize: 14, color: '#dc2626' }} />
                    <span className="financial-num" style={{
                      fontSize: 14,
                      color: '#dc2626',
                    }}>
                      {paraBicimlendir(cari.toplam_borc)}
                    </span>
                  </div>

                  {/* Aksiyon */}
                  <div className="d-flex justify-content-center">
                    <AksiyonMenusu cari={cari} onSilIste={setSilAday} navigate={navigate} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* ── Sayfalama ── */}
        {!yukleniyor && toplamSayfa > 1 && (
          <div className="d-flex align-items-center justify-content-between"
            style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#fafbfc' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
              {(sayfa - 1) * sayfaBasi + 1}–{Math.min(sayfa * sayfaBasi, toplam)} / {toplam} kayıt
            </p>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-brand"
                style={{ borderRadius: 10, fontSize: 12, height: 34, padding: '0 14px' }}
                disabled={sayfa <= 1}
                onClick={() => setSayfa(s => s - 1)}
              >
                <i className="bi bi-chevron-left me-1" /> Önceki
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', padding: '0 8px' }}>
                {sayfa} / {toplamSayfa}
              </span>
              <button
                className="btn btn-outline-brand"
                style={{ borderRadius: 10, fontSize: 12, height: 34, padding: '0 14px' }}
                disabled={sayfa >= toplamSayfa}
                onClick={() => setSayfa(s => s + 1)}
              >
                Sonraki <i className="bi bi-chevron-right ms-1" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
