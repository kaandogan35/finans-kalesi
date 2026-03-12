/**
 * Dashboard — Ana Özet Paneli
 * PHP varlik_hesabi.php tasarım diline sadık, açık/soft tema
 * .light-card + .tint-* + .card-deco-icon yapısı
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../../api/dashboard'
import useAuthStore from '../../stores/authStore'

// ─── Para Formatlayıcı ────────────────────────────────────────────────────────
function paraBicimlendir(tutar) {
  if (tutar === null || tutar === undefined) return '—'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'TRY', maximumFractionDigits: 2,
  }).format(tutar)
}

// ─── Durum Badge ──────────────────────────────────────────────────────────────
function DurumBadge({ durum }) {
  const r = {
    portfoyde:   { bg: '#eff6ff', c: '#1d4ed8', l: 'Portföyde'   },
    odendi:      { bg: '#f0fdf4', c: '#15803d', l: 'Ödendi'      },
    tahsilde:    { bg: '#fefce8', c: '#a16207', l: 'Tahsilde'    },
    karsilıksız: { bg: '#fff1f2', c: '#be123c', l: 'Karşılıksız' },
  }
  const s = r[durum] || { bg: '#f1f5f9', c: '#475569', l: durum || '?' }
  return (
    <span style={{
      background: s.bg, color: s.c,
      fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20,
      border: `1px solid ${s.c}22`,
    }}>{s.l}</span>
  )
}

// ─── Metrik Paleti (PHP renklerinin açık karşılığı) ───────────────────────────
const metrikPaleti = {
  emerald: { tint: 'tint-green',  numColor: '#059669', iconColor: '#059669', iconClass: 'bi-arrow-up-circle-fill'    },
  rose:    { tint: 'tint-rose',   numColor: '#e11d48', iconColor: '#e11d48', iconClass: 'bi-arrow-down-circle-fill'  },
  navy:    { tint: 'tint-navy',   numColor: 'var(--brand-dark)', iconColor: 'var(--brand-dark)', iconClass: 'bi-file-earmark-text-fill' },
  amber:   { tint: 'tint-amber',  numColor: '#d97706', iconColor: '#d97706', iconClass: 'bi-credit-card-fill'        },
}

// ─── Metrik Kartı (PHP glass-card stili, açık tema) ───────────────────────────
function MetrikKarti({ baslik, deger, alt, iconClass, renk, link, yukleniyor }) {
  const p = metrikPaleti[renk] || metrikPaleti.navy

  return (
    <div className={`light-card h-100 ${p.tint}`} style={{ padding: '22px 24px' }}>
      {/* Büyük dekoratif arka plan ikonu (PHP glass-card köşe ikonu) */}
      <i className={`bi ${iconClass} card-deco-icon`} style={{ color: p.iconColor }} />

      <h6 style={{
        fontSize: 10, fontWeight: 800, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        margin: '0 0 12px', position: 'relative', zIndex: 1,
      }}>
        {baslik}
      </h6>

      {yukleniyor ? (
        <div className="animate-pulse" style={{
          height: 38, width: 150, background: 'rgba(0,0,0,0.06)',
          borderRadius: 8, marginBottom: 8,
        }} />
      ) : (
        <h2 className="financial-num" style={{
          fontSize: '2rem', fontWeight: 800,
          color: p.numColor, margin: 0, lineHeight: 1.1,
          position: 'relative', zIndex: 1,
          letterSpacing: '-0.02em',
        }}>
          {deger}
        </h2>
      )}

      {alt && (
        <p style={{
          fontSize: 12, color: '#94a3b8', fontWeight: 500,
          margin: '8px 0 0', position: 'relative', zIndex: 1,
        }}>
          {alt}
        </p>
      )}

      {link && (
        <Link
          to={link}
          className="d-inline-flex align-items-center gap-1 mt-3"
          style={{
            fontSize: 12, fontWeight: 700, color: '#94a3b8',
            textDecoration: 'none', position: 'relative', zIndex: 1,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = p.numColor}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
        >
          Detayları gör <i className="bi bi-arrow-up-right" style={{ fontSize: 11 }} />
        </Link>
      )}
    </div>
  )
}

// ─── Alt Panel Kart Başlığı ───────────────────────────────────────────────────
function KartBaslik({ iconClass, iconBg, iconColor, baslik, link }) {
  return (
    <div
      className="d-flex align-items-center justify-content-between"
      style={{ padding: '18px 22px', borderBottom: '1px solid rgba(18,63,89,0.06)' }}
    >
      <div className="d-flex align-items-center gap-2">
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`bi ${iconClass}`} style={{ fontSize: 15, color: iconColor }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{baslik}</span>
      </div>
      {link && (
        <Link to={link} style={{
          fontSize: 12, fontWeight: 700,
          color: 'var(--brand-dark)', textDecoration: 'none',
        }}>
          Tümünü gör →
        </Link>
      )}
    </div>
  )
}

// ─── Boş Durum ────────────────────────────────────────────────────────────────
function BosKart({ iconClass, mesaj, link, linkMetin }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center"
      style={{ padding: '44px 24px' }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'rgba(18,63,89,0.05)',
        border: '1px solid rgba(18,63,89,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      }}>
        <i className={`bi ${iconClass}`} style={{ fontSize: 22, color: 'rgba(18,63,89,0.2)' }} />
      </div>
      <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, margin: '0 0 8px' }}>{mesaj}</p>
      {link && (
        <Link to={link} style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-dark)', textDecoration: 'none' }}>
          {linkMetin}
        </Link>
      )}
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { kullanici } = useAuthStore()
  const [veri, setVeri]               = useState({ cari: null, cekSenet: null, odeme: null })
  const [yukleniyor, setYukleniyor]   = useState(true)
  const [sonGuncelleme, setSonGuncelleme] = useState(null)

  const verileriYukle = async () => {
    setYukleniyor(true)
    try {
      const [cariYanit, cekYanit, odemeYanit] = await Promise.allSettled([
        dashboardApi.cariOzet(),
        dashboardApi.cekSenetOzet(),
        dashboardApi.odemeOzet(),
      ])
      setVeri({
        cari:     cariYanit.status    === 'fulfilled' ? cariYanit.value.data.veri    : null,
        cekSenet: cekYanit.status     === 'fulfilled' ? cekYanit.value.data.veri     : null,
        odeme:    odemeYanit.status   === 'fulfilled' ? odemeYanit.value.data.veri   : null,
      })
      setSonGuncelleme(new Date())
    } finally { setYukleniyor(false) }
  }

  useEffect(() => { verileriYukle() }, [])

  const saat = new Date().getHours() < 12 ? 'Günaydın'
    : new Date().getHours() < 18 ? 'İyi günler'
    : 'İyi akşamlar'

  // Net pozisyon hesabı (PHP'deki piyasa pozisyonu mantığı)
  const toplam_alacak = veri.cari?.toplam_alacak ?? 0
  const toplam_borc   = veri.cari?.toplam_borc   ?? 0
  const net_pozisyon  = toplam_alacak - toplam_borc

  return (
    <div>

      {/* ─── Sayfa Başlığı ────────────────────────────────────────────── */}
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {saat}{kullanici?.ad_soyad ? `, ${kullanici.ad_soyad.split(' ')[0]}` : ''} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
            Finansal durumunuzun güncel özeti
          </p>
        </div>
        <button
          onClick={verileriYukle}
          disabled={yukleniyor}
          className="btn btn-outline-brand d-flex align-items-center gap-2"
          style={{ borderRadius: 12, fontSize: 13, height: 38, padding: '0 16px' }}
        >
          <i
            className="bi bi-arrow-clockwise"
            style={{
              fontSize: 15,
              color: yukleniyor ? 'var(--brand-dark)' : '#94a3b8',
              display: 'inline-block',
              animation: yukleniyor ? 'spin 1s linear infinite' : 'none',
            }}
          />
          Yenile
        </button>
      </div>

      {/* ─── 4'lü Metrik Kartları (PHP glass-card stili) ─────────────── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <MetrikKarti
            baslik="Toplam Alacak"
            deger={paraBicimlendir(veri.cari?.toplam_alacak)}
            alt={`${veri.cari?.aktif_cari_sayisi ?? '—'} aktif cari`}
            iconClass="bi-arrow-up-circle-fill"
            renk="emerald"
            link="/cariler"
            yukleniyor={yukleniyor}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetrikKarti
            baslik="Toplam Borç"
            deger={paraBicimlendir(veri.cari?.toplam_borc)}
            alt={`Net: ${paraBicimlendir(net_pozisyon)}`}
            iconClass="bi-arrow-down-circle-fill"
            renk="rose"
            link="/cariler"
            yukleniyor={yukleniyor}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetrikKarti
            baslik="Portföydeki Çekler"
            deger={paraBicimlendir(veri.cekSenet?.portfoyde_toplam)}
            alt={`${veri.cekSenet?.portfoyde_adet ?? '—'} adet`}
            iconClass="bi-file-earmark-text-fill"
            renk="navy"
            link="/cek-senet"
            yukleniyor={yukleniyor}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetrikKarti
            baslik="Bekleyen Ödemeler"
            deger={paraBicimlendir(veri.odeme?.bekleyen_toplam)}
            alt={`${veri.odeme?.bekleyen_adet ?? '—'} işlem`}
            iconClass="bi-credit-card-fill"
            renk="amber"
            link="/odemeler"
            yukleniyor={yukleniyor}
          />
        </div>
      </div>

      {/* ─── Piyasa Net Pozisyon Bandı (PHP'deki analiz kartına benzer) ─ */}
      {!yukleniyor && veri.cari && (
        <div
          className={`light-card mb-4 d-flex align-items-center gap-3 ${net_pozisyon < 0 ? 'tint-rose' : 'tint-green'}`}
          style={{ padding: '16px 22px' }}
        >
          <i
            className={`bi ${net_pozisyon < 0 ? 'bi-exclamation-triangle-fill' : 'bi-graph-up-arrow'}`}
            style={{
              fontSize: 22,
              color: net_pozisyon < 0 ? '#e11d48' : '#059669',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
              Piyasa Net Pozisyonu:&nbsp;
            </span>
            <span className="financial-num" style={{
              fontSize: 15, fontWeight: 800,
              color: net_pozisyon < 0 ? '#e11d48' : '#059669',
            }}>
              {net_pozisyon > 0 ? '+' : ''}{paraBicimlendir(net_pozisyon)}
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
            Alacaklar − Borçlar
          </span>
        </div>
      )}

      {/* ─── Alt 2 Kolon ──────────────────────────────────────────────── */}
      <div className="row g-3">

        {/* Yaklaşan Vadeler */}
        <div className="col-12 col-lg-6">
          <div className="light-card overflow-hidden h-100" style={{ padding: 0 }}>
            <KartBaslik
              iconClass="bi-clock-fill"
              iconBg="rgba(217,119,6,0.1)"
              iconColor="#d97706"
              baslik="Yaklaşan Vadeler"
              link="/cek-senet"
            />
            {yukleniyor ? (
              <div style={{ padding: '16px 22px' }}>
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse" style={{
                    height: 54, background: 'rgba(0,0,0,0.04)',
                    borderRadius: 12, marginBottom: 8,
                  }} />
                ))}
              </div>
            ) : veri.cekSenet?.yaklasan_vadeler?.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {veri.cekSenet.yaklasan_vadeler.slice(0, 5).map((cek) => (
                  <li key={cek.id}
                    className="d-flex align-items-center justify-content-between"
                    style={{
                      padding: '13px 22px',
                      borderBottom: '1px solid rgba(18,63,89,0.05)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(18,63,89,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                        {cek.seri_no || 'Seri no yok'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                        <i className="bi bi-calendar-event me-1" />
                        {cek.vade_tarihi}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="financial-num" style={{ margin: 0, fontSize: 14, color: '#1e293b', fontWeight: 800 }}>
                        {paraBicimlendir(cek.tutar_tl)}
                      </p>
                      <div style={{ marginTop: 4 }}>
                        <DurumBadge durum={cek.durum} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <BosKart iconClass="bi-file-earmark-text" mesaj="Yaklaşan vade bulunmuyor" />
            )}
          </div>
        </div>

        {/* Yüksek Bakiyeli Cariler */}
        <div className="col-12 col-lg-6">
          <div className="light-card overflow-hidden h-100" style={{ padding: 0 }}>
            <KartBaslik
              iconClass="bi-person-lines-fill"
              iconBg="rgba(244,63,94,0.08)"
              iconColor="#e11d48"
              baslik="Yüksek Bakiyeli Cariler"
              link="/cariler"
            />
            {yukleniyor ? (
              <div style={{ padding: '16px 22px' }}>
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse" style={{
                    height: 54, background: 'rgba(0,0,0,0.04)',
                    borderRadius: 12, marginBottom: 8,
                  }} />
                ))}
              </div>
            ) : veri.cari?.en_yuksek_bakiyeli?.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {veri.cari.en_yuksek_bakiyeli.slice(0, 5).map((cari) => (
                  <li key={cari.id}
                    className="d-flex align-items-center justify-content-between"
                    style={{
                      padding: '13px 22px',
                      borderBottom: '1px solid rgba(18,63,89,0.05)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(18,63,89,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="d-flex align-items-center gap-3">
                      {/* Avatar — PHP'deki rounded-circle icon badge */}
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'linear-gradient(135deg, var(--brand-dark), #1a5b80)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 3px 10px rgba(18,63,89,0.25)',
                      }}>
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>
                          {cari.cari_adi?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                          {cari.cari_adi}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', fontWeight: 500, textTransform: 'capitalize' }}>
                          <i className="bi bi-circle-fill me-1" style={{ fontSize: 6 }} />
                          {cari.cari_turu?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <p className="financial-num" style={{
                      margin: 0, fontSize: 14, fontWeight: 800,
                      color: parseFloat(cari.bakiye) >= 0 ? '#059669' : '#e11d48',
                    }}>
                      {paraBicimlendir(cari.bakiye)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <BosKart
                iconClass="bi-people"
                mesaj="Henüz cari kaydı yok"
                link="/cariler"
                linkMetin="İlk cariyi ekle →"
              />
            )}
          </div>
        </div>

      </div>

      {/* Son Güncelleme */}
      {sonGuncelleme && (
        <p className="text-end mt-3" style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 500 }}>
          <i className="bi bi-clock-history me-1" />
          Son güncelleme: {sonGuncelleme.toLocaleTimeString('tr-TR')}
        </p>
      )}
    </div>
  )
}
