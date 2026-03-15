/**
 * CarilerListesi — Cari Hesaplar Ana Sayfası
 * Obsidian Vault Koyu Glassmorphism Tema
 * Silme onayı: Saf React state (Bootstrap JS yasak)
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
    musteri:           { etiket: 'Müşteri',    bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6',  border: 'rgba(59,130,246,0.25)' },
    tedarikci:         { etiket: 'Tedarikçi',  bg: 'rgba(245,158,11,0.12)', color: '#f59e0b',  border: 'rgba(245,158,11,0.25)' },
    musteri_tedarikci: { etiket: 'Müşt./Ted.', bg: 'rgba(16,185,129,0.12)', color: '#10b981',  border: 'rgba(16,185,129,0.25)' },
  }
  const d = harita[tur] || { etiket: tur || '—', bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' }
  return (
    <span style={{
      background: d.bg, color: d.color,
      fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20,
      border: `1px solid ${d.border}`,
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
        color: aktif ? '#f59e0b' : 'rgba(255,255,255,0.4)',
        transition: 'color 0.15s',
      }}
    >
      {label}
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <i className="bi bi-caret-up-fill"
          style={{ fontSize: 8, opacity: aktif && yon === 'asc' ? 1 : 0.3 }} />
        <i className="bi bi-caret-down-fill"
          style={{ fontSize: 8, opacity: aktif && yon === 'desc' ? 1 : 0.3 }} />
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
          color: 'rgba(255,255,255,0.35)', padding: '4px 6px', borderRadius: 8,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
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
            width: 160,
            background: 'rgba(10,22,40,0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => { setAcik(false); navigate(`/cariler/${cari.id}`) }}
              className="d-flex align-items-center gap-2 w-100"
              style={{
                background: 'none', border: 'none', padding: '10px 14px',
                fontSize: 13, color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
            >
              <i className="bi bi-eye" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }} /> Detay
            </button>
            <button
              onClick={() => { setAcik(false); navigate(`/cariler/${cari.id}/duzenle`) }}
              className="d-flex align-items-center gap-2 w-100"
              style={{
                background: 'none', border: 'none', padding: '10px 14px',
                fontSize: 13, color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
            >
              <i className="bi bi-pencil" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }} /> Düzenle
            </button>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            <button
              onClick={() => { setAcik(false); onSilIste(cari) }}
              className="d-flex align-items-center gap-2 w-100"
              style={{
                background: 'none', border: 'none', padding: '10px 14px',
                fontSize: 13, color: '#ef4444', cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
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
      {/* Backdrop — tıklamayla kapanmaz, sadece ESC ve İptal butonu */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }} />
      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1055,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px',
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(13,27,46,0.97)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.06))',
            borderBottom: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
            }}>
              <i className="bi bi-trash3-fill" style={{ fontSize: 18, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Cariyi Sil</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>Bu işlem geri alınamaz</div>
            </div>
          </div>

          {/* Gövde */}
          <div style={{ padding: '24px' }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: '#fff', fontWeight: 700 }}>{cari.cari_adi}</strong> adlı cari
              kalıcı olarak silinecektir.
            </p>
          </div>

          {/* Footer */}
          <div style={{
            padding: '0 24px 24px',
            display: 'flex', gap: 10,
          }}>
            <button
              onClick={onIptal}
              disabled={yukleniyor}
              style={{
                flex: 1, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            >
              İptal
            </button>
            <button
              onClick={onOnayla}
              disabled={yukleniyor}
              style={{
                flex: 1, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none', color: '#fff',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                opacity: yukleniyor ? 0.7 : 1,
                boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                transition: 'all 0.15s',
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
    <div className="page-container" style={{ maxWidth: 1280, margin: '0 auto' }}>

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
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Cari Hesaplar
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', fontWeight: 500 }}>
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
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.3)', fontSize: 14, pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Cari adı, vergi no, telefon..."
            value={aramaInput}
            onChange={e => setAramaInput(e.target.value)}
            style={{
              width: '100%', height: 40,
              paddingLeft: 36, paddingRight: 14,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, fontSize: 13, fontWeight: 500,
              color: '#ffffff', fontFamily: 'inherit',
              outline: 'none', transition: 'all 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#f59e0b'
              e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'
              e.target.style.background = 'rgba(255,255,255,0.07)'
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255,255,255,0.1)'
              e.target.style.boxShadow = 'none'
              e.target.style.background = 'rgba(255,255,255,0.05)'
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
          padding: '11px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
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
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="animate-pulse" style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                  <div>
                    <div className="animate-pulse" style={{ height: 13, width: 140, background: 'rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 6 }} />
                    <div className="animate-pulse" style={{ height: 11, width: 90, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
                  </div>
                </div>
                <div className="animate-pulse" style={{ height: 22, width: 70, background: 'rgba(255,255,255,0.06)', borderRadius: 20, alignSelf: 'center' }} />
                <div className="animate-pulse" style={{ height: 13, width: 100, background: 'rgba(255,255,255,0.06)', borderRadius: 6, alignSelf: 'center' }} />
                <div className="animate-pulse" style={{ height: 13, width: 100, background: 'rgba(255,255,255,0.06)', borderRadius: 6, alignSelf: 'center' }} />
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
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <i className="bi bi-exclamation-circle" style={{ fontSize: 22, color: '#ef4444' }} />
            </div>
            <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, margin: '0 0 12px' }}>{hata}</p>
            <button
              onClick={veriYukle}
              style={{
                background: 'transparent', border: '1px solid rgba(245,158,11,0.4)',
                color: '#f59e0b', fontWeight: 700, fontSize: 13,
                borderRadius: 10, height: 36, padding: '0 16px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; e.currentTarget.style.borderColor = '#f59e0b' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)' }}
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
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <i className="bi bi-people" style={{ fontSize: 24, color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>
              {arama ? 'Arama sonucu bulunamadı' : 'Henüz cari kaydı yok'}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>
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
            {cariler.map((cari) => (
              <li
                key={cari.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 130px 155px 155px 48px',
                  gap: 16, padding: '13px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  alignItems: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Cari Adı */}
                <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: '#f59e0b', fontSize: 14, fontWeight: 800 }}>
                      {cari.cari_adi?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Link
                      to={`/cariler/${cari.id}`}
                      style={{
                        fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                        textDecoration: 'none', display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                    >
                      {cari.cari_adi}
                    </Link>
                    {cari.vergi_no && (
                      <p style={{
                        margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)',
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

                {/* Alacak */}
                <div className="d-flex align-items-center gap-1">
                  <i className="bi bi-arrow-down-circle-fill" style={{ fontSize: 14, color: '#059669' }} />
                  <span className="financial-num" style={{ fontSize: 14, color: '#059669' }}>
                    {paraBicimlendir(cari.toplam_alacak)}
                  </span>
                </div>

                {/* Borç */}
                <div className="d-flex align-items-center gap-1">
                  <i className="bi bi-arrow-up-circle-fill" style={{ fontSize: 14, color: '#dc2626' }} />
                  <span className="financial-num" style={{ fontSize: 14, color: '#dc2626' }}>
                    {paraBicimlendir(cari.toplam_borc)}
                  </span>
                </div>

                {/* Aksiyon */}
                <div className="d-flex justify-content-center">
                  <AksiyonMenusu cari={cari} onSilIste={setSilAday} navigate={navigate} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* ── Sayfalama ── */}
        {!yukleniyor && toplamSayfa > 1 && (
          <div className="d-flex align-items-center justify-content-between"
            style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              {(sayfa - 1) * sayfaBasi + 1}–{Math.min(sayfa * sayfaBasi, toplam)} / {toplam} kayıt
            </p>
            <div className="d-flex align-items-center gap-2">
              <button
                style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, fontSize: 12, height: 34, padding: '0 14px',
                  color: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.15s',
                  opacity: sayfa <= 1 ? 0.4 : 1,
                }}
                disabled={sayfa <= 1}
                onClick={() => setSayfa(s => s - 1)}
                onMouseEnter={e => { if (sayfa > 1) { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'; e.currentTarget.style.color = '#f59e0b' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >
                <i className="bi bi-chevron-left me-1" /> Önceki
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', padding: '0 8px' }}>
                {sayfa} / {toplamSayfa}
              </span>
              <button
                style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, fontSize: 12, height: 34, padding: '0 14px',
                  color: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.15s',
                  opacity: sayfa >= toplamSayfa ? 0.4 : 1,
                }}
                disabled={sayfa >= toplamSayfa}
                onClick={() => setSayfa(s => s + 1)}
                onMouseEnter={e => { if (sayfa < toplamSayfa) { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'; e.currentTarget.style.color = '#f59e0b' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
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
