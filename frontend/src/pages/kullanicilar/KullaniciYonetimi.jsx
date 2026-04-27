/**
 * KullaniciYonetimi.jsx — Alt Kullanıcı Yönetimi
 * ParamGo v2 tasarım sistemi
 * kuy- prefix ile modüle özel CSS class'ları
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import { kullanicilarApi } from '../../api/kullanicilar'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'
import { useSinirler } from '../../hooks/useSinirler'
import useAuthStore from '../../stores/authStore'
import KullaniciModal from './KullaniciModal'
import SifreGuncelleModal from './SifreGuncelleModal'

// ─── Yardımcı ─────────────────────────────────────────────────────────────────
const tarihFmt = (s) =>
  s ? new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const ROL_ETIKET = {
  sahip:      { label: 'Sahip',      renk: '#7C3AED', bg: 'rgba(124,58,237,0.09)' },
  admin:      { label: 'Admin',      renk: '#0EA5E9', bg: 'rgba(14,165,233,0.09)' },
  muhasebeci: { label: 'Muhasebeci', renk: '#F59E0B', bg: 'rgba(245,158,11,0.09)' },
  personel:   { label: 'Personel',   renk: '#6B7280', bg: 'rgba(107,114,128,0.09)' },
}

const MODUL_ETIKETI = {
  dashboard:        { label: 'Dashboard',       icon: 'bi-speedometer2' },
  cari:             { label: 'Cari Hesaplar',    icon: 'bi-people-fill' },
  cek_senet:        { label: 'Çek/Senet',        icon: 'bi-file-earmark-text-fill' },
  odemeler:         { label: 'Ödemeler',         icon: 'bi-credit-card-2-front-fill' },
  kasa:             { label: 'Varlık & Kasa',    icon: 'bi-safe-fill' },
  vade_hesaplayici: { label: 'Vade Hesap.',      icon: 'bi-calculator-fill' },
}


// ─── Silme Onay Modalı ────────────────────────────────────────────────────────
function SilOnayModal({ kullanici, onOnayla, onIptal }) {
  return createPortal(
    <div className="kuy-confirm-overlay" onClick={onIptal}>
      <div className="kuy-confirm-box" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-3">
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <i className="bi bi-person-x-fill" style={{ fontSize: 22, color: '#ef4444' }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 6px', fontFamily: 'Outfit, sans-serif' }}>
            Kullanıcıyı sil?
          </p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            <strong>{kullanici.ad_soyad}</strong> adlı kullanıcı devre dışı bırakılacak.
            Giriş yapamaz hale gelir.
          </p>
        </div>
        <div className="d-flex gap-2 mt-4">
          <button onClick={onIptal} style={{
            flex: 1, padding: '9px', borderRadius: 10, border: '1px solid #E5E7EB',
            background: '#F9FAFB', color: '#374151', fontWeight: 600,
            fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          }}>
            İptal
          </button>
          <button onClick={onOnayla} style={{
            flex: 1, padding: '9px', borderRadius: 10, border: 'none',
            background: '#ef4444', color: '#fff', fontWeight: 700,
            fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          }}>
            Evet, Sil
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function KullaniciYonetimi({ embedded = false }) {
  const { kullanici: mevcutKullanici } = useAuthStore()
  const { izinVarMi, planAdi } = usePlanKontrol()
  const { sinirler, yenidenYukle: sinirYukle } = useSinirler()

  const [kullanicilar, setKullanicilar] = useState([])
  const [yukleniyor, setYukleniyor]   = useState(true)
  const [ekleModalAcik, setEkleModalAcik]       = useState(false)
  const [duzenleHedef, setDuzenleHedef]         = useState(null)
  const [sifreHedef, setSifreHedef]             = useState(null)
  const [silHedef, setSilHedef]                 = useState(null)
  const [planModalAcik, setPlanModalAcik]       = useState(false)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const res = await kullanicilarApi.listele()
      setKullanicilar(res.data.veri.kullanicilar || [])
    } catch (e) {
      toast.error(e?.response?.data?.hata || 'Kullanıcılar yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => { yukle() }, [yukle])

  const handleEkleClick = () => {
    if (!izinVarMi('cok_kullanici')) {
      setPlanModalAcik(true)
      return
    }
    setEkleModalAcik(true)
  }

  const handleSil = async () => {
    if (!silHedef) return
    try {
      await kullanicilarApi.sil(silHedef.id)
      toast.success(`${silHedef.ad_soyad} silindi`)
      setSilHedef(null)
      yukle()
      sinirYukle()
    } catch (e) {
      toast.error(e?.response?.data?.hata || 'Silinemedi')
      setSilHedef(null)
    }
  }

  const handleKaydet = () => {
    setEkleModalAcik(false)
    setDuzenleHedef(null)
    yukle()
    sinirYukle()
  }

  // Limit bilgisi
  const kSinir = sinirler?.kullanici
  const limitDolu = kSinir ? kSinir.mevcut >= kSinir.sinir : false

  return (
    <div className="kuy-wrap">
      {/* ── Sayfa Başlığı ── */}
      {!embedded && (
        <div className="kuy-header-card">
          <div className="d-flex align-items-center gap-3">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="bi bi-people-fill" style={{ fontSize: 20, color: '#10B981', opacity: 0.35 }} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 2px', letterSpacing: '-0.4px', fontFamily: 'Outfit, sans-serif' }}>
                Kullanıcı Yönetimi
              </h1>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                Şirketinize erişim verebileceğiniz çalışanları buradan yönetin
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Buton + limit — embedded modda da görünür */}
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-3">
        <div>
          {kSinir && (
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>Kullanıcı Kapasitesi</span>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: limitDolu ? '#ef4444' : '#059669' }}>
                  {kSinir.mevcut} / {kSinir.sinir}
                </span>
              </div>
              <div className="kuy-limit-bar" style={{ maxWidth: 200 }}>
                <div className="kuy-limit-fill" style={{
                  width: `${Math.min(kSinir.yuzde, 100)}%`,
                  background: limitDolu ? 'linear-gradient(90deg, #ef4444, #f87171)' : kSinir.yuzde >= 80 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #10B981, #34d399)',
                }} />
              </div>
              {limitDolu && (
                <p style={{ fontSize: 10.5, color: '#ef4444', margin: '4px 0 0', fontFamily: 'Outfit, sans-serif' }}>
                  Limit doldu.{' '}
                  <button onClick={() => setPlanModalAcik(true)} style={{ background: 'none', border: 'none', color: '#10B981', fontWeight: 700, cursor: 'pointer', fontSize: 10.5, fontFamily: 'Outfit, sans-serif', padding: 0 }}>
                    Plan Yükselt →
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
        <button className="kuy-add-btn" onClick={handleEkleClick} disabled={limitDolu && izinVarMi('cok_kullanici')}>
          <i className="bi bi-person-plus-fill" style={{ fontSize: 14 }} />
          Yeni Kullanıcı
        </button>
      </div>

      {/* ── Ücretsiz Plan Uyarısı ── */}
      {!izinVarMi('cok_kullanici') && (
        <div style={{
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 12, padding: '12px 16px',
          marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <i className="bi bi-lock-fill" style={{ color: '#f59e0b', fontSize: 16, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e', fontFamily: 'Outfit, sans-serif' }}>
              Çoklu kullanıcı özelliği <strong>Standart</strong> ve üstü planlarda kullanılabilir.
            </span>
          </div>
          <button
            onClick={() => setPlanModalAcik(true)}
            className="kuy-add-btn"
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            Plan Yükselt
          </button>
        </div>
      )}

      {/* ── Kullanıcı Listesi ── */}
      {yukleniyor ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#10B981', width: 28, height: 28 }} />
        </div>
      ) : kullanicilar.length === 0 ? (
        <div className="kuy-empty">
          <i className="bi bi-people" style={{ fontSize: 36, color: '#D1D5DB', display: 'block', marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px', fontFamily: 'Outfit, sans-serif' }}>
            Henüz kullanıcı yok
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Şirketinize çalışanlarınızı ekleyin
          </p>
        </div>
      ) : (
        <div>
          {kullanicilar.map((k) => {
            const rolBilgi = ROL_ETIKET[k.rol] || ROL_ETIKET.personel
            const isSahip  = k.rol === 'sahip'
            const benimim  = k.id === mevcutKullanici?.id
            const moduller = k.yetkiler?.moduller || []
            const ilk = k.ad_soyad?.charAt(0)?.toUpperCase() || '?'

            const avatarRenk = isSahip
              ? 'linear-gradient(135deg, #7C3AED, #5B21B6)'
              : 'linear-gradient(135deg, #10B981, #059669)'

            return (
              <div key={k.id} className={`kuy-row${isSahip ? ' kuy-sahip' : ''}`}>
                <div className="d-flex align-items-start gap-3 flex-wrap">

                  {/* Avatar */}
                  <div className="kuy-avatar" style={{ background: avatarRenk }}>
                    {ilk}
                  </div>

                  {/* Bilgi */}
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'Outfit, sans-serif' }}>
                        {k.ad_soyad}
                        {benimim && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', marginLeft: 6 }}>(siz)</span>
                        )}
                      </span>

                      {/* Rol badge */}
                      <span className="kuy-rol-badge" style={{ color: rolBilgi.renk, background: rolBilgi.bg }}>
                        {isSahip && <i className="bi bi-crown-fill" style={{ fontSize: 12 }} />}
                        {rolBilgi.label}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Outfit, sans-serif', marginBottom: 8 }}>
                      {k.email}
                      {k.telefon && <span style={{ marginLeft: 10 }}><i className="bi bi-telephone-fill" style={{ fontSize: 10 }} /> {k.telefon}</span>}
                      <span style={{ marginLeft: 10 }}>
                        <i className="bi bi-clock-history" style={{ fontSize: 10 }} /> {tarihFmt(k.son_giris) !== '—' ? tarihFmt(k.son_giris) : 'Hiç giriş yapmadı'}
                      </span>
                    </div>

                    {/* Modüller */}
                    {isSahip ? (
                      <div className="d-flex flex-wrap gap-1">
                        {Object.keys(MODUL_ETIKETI).map(m => (
                          <span key={m} className="kuy-modul-chip">
                            <i className={`bi ${MODUL_ETIKETI[m].icon}`} style={{ fontSize: 10 }} />
                            {MODUL_ETIKETI[m].label}
                          </span>
                        ))}
                        <span style={{ fontSize: 10.5, color: '#9CA3AF', alignSelf: 'center', marginLeft: 2, fontFamily: 'Outfit, sans-serif' }}>
                          (tam erişim)
                        </span>
                      </div>
                    ) : moduller.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {moduller.map(m => MODUL_ETIKETI[m] && (
                          <span key={m} className="kuy-modul-chip">
                            <i className={`bi ${MODUL_ETIKETI[m].icon}`} style={{ fontSize: 10 }} />
                            {MODUL_ETIKETI[m].label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Outfit, sans-serif' }}>
                        Modül izni atanmamış
                      </span>
                    )}
                  </div>

                  {/* Butonlar */}
                  <div className="d-flex align-items-center gap-1 flex-shrink-0">
                    <button
                      className="kuy-icon-btn key"
                      title="Şifre sıfırla"
                      onClick={() => setSifreHedef(k)}
                      disabled={isSahip && benimim}
                    >
                      <i className="bi bi-key-fill" />
                    </button>
                    <button
                      className="kuy-icon-btn"
                      title="Düzenle"
                      onClick={() => setDuzenleHedef(k)}
                      disabled={isSahip}
                    >
                      <i className="bi bi-pencil-fill" />
                    </button>
                    <button
                      className="kuy-icon-btn danger"
                      title="Sil"
                      onClick={() => setSilHedef(k)}
                      disabled={isSahip}
                    >
                      <i className="bi bi-trash-fill" />
                    </button>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modallar ── */}
      {ekleModalAcik && (
        <KullaniciModal
          mod="ekle"
          onKaydet={handleKaydet}
          onKapat={() => setEkleModalAcik(false)}
        />
      )}

      {duzenleHedef && (
        <KullaniciModal
          mod="duzenle"
          hedef={duzenleHedef}
          onKaydet={handleKaydet}
          onKapat={() => setDuzenleHedef(null)}
        />
      )}

      {sifreHedef && (
        <SifreGuncelleModal
          hedef={sifreHedef}
          onKapat={() => setSifreHedef(null)}
        />
      )}

      {silHedef && (
        <SilOnayModal
          kullanici={silHedef}
          onOnayla={handleSil}
          onIptal={() => setSilHedef(null)}
        />
      )}

      {/* Plan yükselt modal — PlanYukseltModal bileşeni varsa kullan */}
      {planModalAcik && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 1060,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setPlanModalAcik(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 18,
              padding: '32px 28px',
              maxWidth: 420, width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
              textAlign: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <i className="bi bi-people-fill" style={{ fontSize: 24, color: '#10B981', opacity: 0.7 }} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 8px', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.4px' }}>
              Çoklu Kullanıcı Özelliği
            </p>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px', fontFamily: 'Outfit, sans-serif', lineHeight: 1.6 }}>
              Mevcut planınız (<strong>{planAdi}</strong>) yalnızca 1 kullanıcı destekliyor.
              Çalışanlarınızı eklemek için planınızı yükseltin.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button onClick={() => setPlanModalAcik(false)} style={{
                padding: '9px 20px', borderRadius: 10, border: '1px solid #E5E7EB',
                background: '#F9FAFB', color: '#374151', fontWeight: 600,
                fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              }}>
                Kapat
              </button>
              <a href="/abonelik" style={{
                padding: '9px 20px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff', fontWeight: 700,
                fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                boxShadow: '0 2px 12px rgba(16,185,129,0.3)',
              }}>
                <i className="bi bi-arrow-up-circle-fill me-2" />
                Planları Gör
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
