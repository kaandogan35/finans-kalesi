import { useState } from 'react'
import useTemaStore from '../../stores/temaStore'
import useAuthStore from '../../stores/authStore'
import { temaGuncelle } from '../../api/ayarlar'

// ─── Tema Tanımları ───────────────────────────────────────────────────────────
const temalar = [
  {
    id: 'paramgo',
    ad: 'ParamGo',
    etiket: 'Modern Fintech',
    tanim: 'Temiz ve modern bir arayüz ile hızlı finansal yönetim deneyimi.',
    font: "'Inter', system-ui, sans-serif",
    onizleme: {
      sidebar:  '#FAFAF9',
      sidebarAksan: '#10B981',
      sayfa:    '#F5F5F4',
      kart:     '#ffffff',
      kart2:    '#ffffff',
      aksan:    '#10B981',
      aksan2:   '#059669',
      aksan3:   '#EF4444',
      metin:    '#1A1A1A',
      metinMuted: '#9CA3AF',
    },
    renkPaleti: [
      { renk: '#10B981', etiket: 'Yeşil' },
      { renk: '#059669', etiket: 'Koyu Yeşil' },
      { renk: '#F5F5F4', etiket: 'Zemin' },
      { renk: '#1A1A1A', etiket: 'Metin' },
    ],
  },
  // Yeni temalar buraya eklenecek
]

// ─── Mini Önizleme Bileşeni ────────────────────────────────────────────────────
function MiniOnizleme({ onizleme, aktif }) {
  const { sidebar, sidebarAksan, sayfa, kart, kart2, aksan, aksan2, aksan3, metin } = onizleme

  return (
    <div style={{
      width: '100%',
      height: 164,
      borderRadius: '6px 6px 0 0',
      background: sayfa,
      display: 'flex',
      overflow: 'hidden',
      position: 'relative',
      border: aktif ? `2px solid #10B981` : '2px solid transparent',
      borderBottom: 'none',
      transition: 'all 0.2s ease',
    }}>

      {/* Sidebar Şeridi */}
      <div style={{
        width: 44,
        background: sidebar,
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 6px',
        gap: 3,
        flexShrink: 0,
        borderRight: `2px solid ${sidebarAksan}22`,
      }}>
        {/* Logo noktası */}
        <div style={{
          width: 22, height: 22,
          borderRadius: 4,
          background: `${sidebarAksan}30`,
          border: `1px solid ${sidebarAksan}60`,
          marginBottom: 6,
        }} />
        {/* Nav öğeleri */}
        {[sidebarAksan, `${sidebarAksan}55`, `${sidebarAksan}55`, `${sidebarAksan}55`, `${sidebarAksan}55`].map((bg, i) => (
          <div key={i} style={{
            width: '100%', height: 8,
            borderRadius: 2,
            background: i === 0 ? `${sidebarAksan}40` : `${sidebarAksan}18`,
            borderLeft: i === 0 ? `2px solid ${sidebarAksan}` : '2px solid transparent',
          }} />
        ))}
        {/* Kullanıcı */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${sidebarAksan}30` }} />
        </div>
      </div>

      {/* Ana İçerik */}
      <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Topbar */}
        <div style={{
          height: 22,
          background: kart,
          borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          marginBottom: 2,
        }}>
          <div style={{ width: 40, height: 6, borderRadius: 1, background: `${metin}22` }} />
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: aksan + '40' }} />
        </div>

        {/* KPI Kartları */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { aksan: aksan2,  borderColor: aksan2 },
            { aksan: aksan3,  borderColor: aksan3 },
            { aksan: aksan,   borderColor: aksan },
            { aksan: '#D97706', borderColor: '#D97706' },
          ].map((k, i) => (
            <div key={i} style={{
              flex: 1,
              background: kart,
              borderRadius: 3,
              padding: '5px 5px 5px 7px',
              borderLeft: `2px solid ${k.borderColor}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ width: '70%', height: 4, borderRadius: 1, background: `${metin}18`, marginBottom: 3 }} />
              <div style={{ width: '50%', height: 7, borderRadius: 1, background: `${metin}30` }} />
            </div>
          ))}
        </div>

        {/* İçerik paneli */}
        <div style={{
          flex: 1,
          background: kart2,
          borderRadius: 3,
          padding: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column', gap: 3,
        }}>
          <div style={{ width: '60%', height: 5, borderRadius: 1, background: `${metin}20` }} />
          {[1, 2, 3].map((r) => (
            <div key={r} style={{
              display: 'flex', gap: 4, alignItems: 'center',
              paddingBottom: 3, borderBottom: `1px solid ${metin}08`,
            }}>
              <div style={{ flex: 1, height: 4, borderRadius: 1, background: `${metin}14` }} />
              <div style={{ width: 20, height: 4, borderRadius: 1, background: `${aksan}40` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Renk Paleti ──────────────────────────────────────────────────────────────
function RenkPaleti({ renkler }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {renkler.map(({ renk, etiket }) => (
        <div key={renk} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{
            width: 24, height: 24,
            borderRadius: 4,
            background: renk,
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }} />
          <span style={{
            fontSize: 9,
            color: 'var(--p-text-muted)',
            fontFamily: 'var(--p-font-body)',
            letterSpacing: '0.03em',
          }}>
            {etiket}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function TemaSecimi() {
  const { aktifTema, temaAyarla } = useTemaStore()
  const kullanici = useAuthStore((s) => s.kullanici)

  const [yukleniyor, setYukleniyor] = useState(false)
  const [seciliTema, setSeciliTema] = useState(null)
  const [hata, setHata] = useState(null)
  const [basari, setBasari] = useState(null)

  const yetkiVar = kullanici?.rol === 'sahip' || kullanici?.rol === 'admin'

  const handleTemaSecim = async (temaId) => {
    if (!yetkiVar || yukleniyor || temaId === aktifTema) return

    setYukleniyor(true)
    setSeciliTema(temaId)
    setHata(null)
    setBasari(null)

    try {
      await temaGuncelle(temaId)
      temaAyarla(temaId)
      setBasari(`Tema başarıyla "${temalar.find(t => t.id === temaId)?.ad}" olarak güncellendi.`)
    } catch (err) {
      const mesaj = err?.response?.data?.hata || 'Tema güncellenirken bir hata oluştu.'
      setHata(mesaj)
    } finally {
      setYukleniyor(false)
      setSeciliTema(null)
    }
  }

  return (
    <div style={{
      maxWidth: 960,
      margin: '0 auto',
      padding: 28,
      background: 'var(--p-bg-page)',
      minHeight: '100%',
      borderRadius: 0,
    }}>

      {/* ── Başlık Paneli ──────────────────────────────────────────────────── */}
      <div className="p-panel" style={{ marginBottom: 24 }}>
        <div className="p-panel-header">
          <h2 className="p-panel-title">
            <i className="bi bi-palette" />
            Tema Seçimi
          </h2>
          <span className="p-badge p-badge-success">
            <i className="bi bi-circle-fill" style={{ fontSize: 7 }} />
            {temalar.find(t => t.id === aktifTema)?.ad || 'ParamGo'} Aktif
          </span>
        </div>
        <div className="p-panel-body-padded" style={{ borderBottom: '1px solid var(--p-border)' }}>
          <p style={{
            margin: 0,
            fontSize: 13.5,
            color: 'var(--p-text-secondary)',
            fontFamily: 'var(--p-font-body)',
            lineHeight: 1.6,
          }}>
            Şirketiniz için arayüz teması seçin. Seçilen tema tüm kullanıcılara uygulanır.
            Tema değişikliği anlık geçerli olur — sayfa yenilemenize gerek yoktur.
          </p>
        </div>

        {/* Yetkisiz uyarı */}
        {!yetkiVar && (
          <div className="p-panel-body-padded">
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px',
              background: 'var(--p-bg-badge-warning)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 'var(--p-radius-card)',
              fontSize: 13,
              color: 'var(--p-color-warning)',
              fontFamily: 'var(--p-font-body)',
            }}>
              <i className="bi bi-info-circle-fill" style={{ marginTop: 1, flexShrink: 0 }} />
              <span>
                Tema değiştirme yetkisi yalnızca <strong>Şirket Sahibi</strong> ve{' '}
                <strong>Yöneticiye</strong> aittir. Mevcut temanızı görüntüleyebilirsiniz.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Durum Mesajları ─────────────────────────────────────────────────── */}
      {basari && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', marginBottom: 20,
          background: 'var(--p-bg-badge-success)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 'var(--p-radius-card)',
          fontSize: 13, color: 'var(--p-color-success)',
          fontFamily: 'var(--p-font-body)',
        }}>
          <i className="bi bi-check-circle-fill" />
          <span>{basari}</span>
          <button
            onClick={() => setBasari(null)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--p-color-success)',
              minWidth: 24, minHeight: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Kapat"
          >
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {hata && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', marginBottom: 20,
          background: 'var(--p-bg-badge-danger)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--p-radius-card)',
          fontSize: 13, color: 'var(--p-color-danger)',
          fontFamily: 'var(--p-font-body)',
        }}>
          <i className="bi bi-exclamation-circle-fill" />
          <span>{hata}</span>
          <button
            onClick={() => setHata(null)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--p-color-danger)',
              minWidth: 24, minHeight: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Kapat"
          >
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {/* ── Tema Kartları ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 20,
      }}
        className="tema-grid"
      >
        {temalar.map((tema) => {
          const aktif = aktifTema === tema.id
          const yukleniyor_bu = yukleniyor && seciliTema === tema.id

          return (
            <div
              key={tema.id}
              style={{
                background: 'var(--p-bg-card)',
                border: aktif
                  ? '2px solid #10B981'
                  : '2px solid var(--p-border)',
                borderRadius: 'var(--p-radius-card)',
                boxShadow: aktif
                  ? '0 4px 20px rgba(16,185,129,0.12), 0 2px 6px rgba(16,185,129,0.07)'
                  : 'var(--p-shadow-card)',
                overflow: 'hidden',
                transition: 'all 0.22s ease',
                cursor: yetkiVar && !aktif && !yukleniyor ? 'pointer' : 'default',
                position: 'relative',
              }}
              onClick={() => !aktif && handleTemaSecim(tema.id)}
            >

              {/* Aktif rozeti */}
              {aktif && (
                <div style={{
                  position: 'absolute',
                  top: 10, right: 10,
                  zIndex: 10,
                  background: '#10B981',
                  color: 'white',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 10.5,
                  fontWeight: 700,
                  fontFamily: 'var(--p-font-body)',
                  letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', gap: 5,
                  boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                }}>
                  <i className="bi bi-check-circle-fill" style={{ fontSize: 10, color: '#FFFFFF' }} />
                  AKTİF TEMA
                </div>
              )}

              {/* Mini önizleme */}
              <MiniOnizleme onizleme={tema.onizleme} aktif={aktif} />

              {/* Kart içeriği */}
              <div style={{ padding: '16px 18px 18px' }}>

                {/* Başlık */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                    <span style={{
                      fontFamily: tema.font,
                      fontSize: 18, fontWeight: 700,
                      color: 'var(--p-text-primary)',
                    }}>
                      {tema.ad}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: 'var(--p-text-muted)',
                      fontFamily: 'var(--p-font-body)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>
                      {tema.etiket}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: 12.5,
                    color: 'var(--p-text-secondary)',
                    fontFamily: 'var(--p-font-body)',
                    lineHeight: 1.55,
                  }}>
                    {tema.tanim}
                  </p>
                </div>

                {/* Renk paleti */}
                <div style={{ marginBottom: 14 }}>
                  <RenkPaleti renkler={tema.renkPaleti} />
                </div>

                {/* Seç butonu */}
                {aktif ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 14px', minHeight: 44,
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: 'var(--p-radius-btn)',
                    fontSize: 13, fontWeight: 600,
                    color: '#059669',
                    fontFamily: 'var(--p-font-body)',
                    justifyContent: 'center',
                  }}>
                    <i className="bi bi-check2-circle" />
                    Kullanılıyor
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTemaSecim(tema.id) }}
                    disabled={!yetkiVar || yukleniyor}
                    type="button"
                    style={{
                      width: '100%', minHeight: 44,
                      padding: '9px 14px',
                      background: yetkiVar ? '#10B981' : 'transparent',
                      border: `1px solid ${yetkiVar ? '#10B981' : 'var(--p-border)'}`,
                      borderRadius: 'var(--p-radius-btn)',
                      color: yetkiVar ? 'white' : 'var(--p-text-muted)',
                      fontSize: 13.5, fontWeight: 600,
                      fontFamily: 'var(--p-font-body)',
                      cursor: yetkiVar && !yukleniyor ? 'pointer' : 'not-allowed',
                      transition: 'all 0.18s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      opacity: yukleniyor && seciliTema !== tema.id ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (yetkiVar && !yukleniyor) {
                        e.currentTarget.style.background = '#059669'
                        e.currentTarget.style.borderColor = '#059669'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (yetkiVar && !yukleniyor) {
                        e.currentTarget.style.background = '#10B981'
                        e.currentTarget.style.borderColor = '#10B981'
                      }
                    }}
                  >
                    {yukleniyor_bu ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                          style={{ width: 14, height: 14, borderWidth: 2 }}
                        />
                        Uygulanıyor…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-palette" />
                        {yetkiVar ? 'Bu Temayı Seç' : 'Yetki Yok'}
                      </>
                    )}
                  </button>
                )}

              </div>
            </div>
          )
        })}
      </div>

      {/* ── Responsive CSS ──────────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 860px) {
          .tema-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 560px) {
          .tema-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}
