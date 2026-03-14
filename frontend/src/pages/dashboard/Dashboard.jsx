/**
 * Dashboard — Obsidian Vault Koyu Premium Tema
 * Glassmorphism KPI kartları, neon glow değerler, koyu tablolar
 * dash- prefix ile self-contained stiller
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

// ─── Durum Badge (Obsidian Vault — dot + metin) ─────────────────────────────
function DurumBadge({ durum }) {
  const r = {
    portfoyde:   { c: '#f59e0b', l: 'Portföyde'   },
    odendi:      { c: '#10b981', l: 'Ödendi'      },
    tahsilde:    { c: '#d97706', l: 'Tahsilde'    },
    karsilıksız: { c: '#ef4444', l: 'Karşılıksız' },
  }
  const s = r[durum] || { c: 'rgba(255,255,255,0.4)', l: durum || '?' }
  return (
    <span className="d-inline-flex align-items-center gap-1">
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: s.c,
        boxShadow: `0 0 6px ${s.c}66`,
        display: 'inline-block',
      }} />
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500, textShadow: '0 0 10px rgba(255,255,255,0.05)' }}>
        {s.l}
      </span>
    </span>
  )
}

// ─── Metrik Paleti (Obsidian Vault renkleri) ─────────────────────────────────
const metrikPaleti = {
  emerald: { numColor: '#10b981', glowColor: 'rgba(16,185,129,0.3)',  iconClass: 'bi-arrow-up-circle-fill'    },
  rose:    { numColor: '#ef4444', glowColor: 'rgba(239,68,68,0.3)',   iconClass: 'bi-arrow-down-circle-fill'  },
  navy:    { numColor: '#f59e0b', glowColor: 'rgba(245,158,11,0.3)',  iconClass: 'bi-file-earmark-text-fill' },
  amber:   { numColor: '#d97706', glowColor: 'rgba(217,119,6,0.3)',   iconClass: 'bi-credit-card-fill'       },
}

// ─── Metrik Kartı (Obsidian Vault glassmorphism + neon glow) ─────────────────
function MetrikKarti({ baslik, deger, alt, iconClass, renk, link, yukleniyor }) {
  const p = metrikPaleti[renk] || metrikPaleti.navy

  return (
    <div className="dash-kpi-card" style={{ padding: '22px 24px' }}>
      {/* Büyük dekoratif arka plan ikonu — kartın vurgu rengiyle */}
      <i className={`bi ${iconClass}`} style={{
        position: 'absolute', top: 16, right: 16,
        fontSize: 60, opacity: 0.20, color: p.numColor,
        pointerEvents: 'none',
      }} />

      <h6 className="dash-kpi-label">{baslik}</h6>

      {yukleniyor ? (
        <div className="animate-pulse" style={{
          height: 38, width: 150, background: 'rgba(255,255,255,0.06)',
          borderRadius: 8, marginBottom: 8,
        }} />
      ) : (
        <h2 className="dash-kpi-value" style={{
          color: p.numColor,
          textShadow: `0 0 20px ${p.glowColor}`,
        }}>
          {deger}
        </h2>
      )}

      {alt && (
        <p style={{
          fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500,
          margin: '8px 0 0', position: 'relative', zIndex: 1,
          textShadow: '0 0 12px rgba(255,255,255,0.06)',
        }}>
          {alt}
        </p>
      )}

      {link && (
        <Link to={link} className="dash-detail-link">
          Detayları gör <i className="bi bi-arrow-up-right" style={{ fontSize: 11 }} />
        </Link>
      )}
    </div>
  )
}

// ─── Alt Panel Kart Başlığı (Obsidian Vault) ────────────────────────────────
function KartBaslik({ iconClass, iconColor, baslik, link }) {
  return (
    <div className="dash-card-header">
      <div className="d-flex align-items-center gap-2">
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `${iconColor}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`bi ${iconClass}`} style={{ fontSize: 15, color: iconColor }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>{baslik}</span>
      </div>
      {link && (
        <Link to={link} className="dash-link-amber">
          Tümünü gör →
        </Link>
      )}
    </div>
  )
}

// ─── Boş Durum ──────────────────────────────────────────────────────────────
function BosKart({ iconClass, mesaj, link, linkMetin }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center"
      style={{ padding: '44px 24px' }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      }}>
        <i className={`bi ${iconClass}`} style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }} />
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500, margin: '0 0 8px', textShadow: '0 0 12px rgba(255,255,255,0.06)' }}>{mesaj}</p>
      {link && (
        <Link to={link} className="dash-link-amber" style={{ fontSize: 12 }}>
          {linkMetin}
        </Link>
      )}
    </div>
  )
}

// ─── Ana Bileşen ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { kullanici } = useAuthStore()
  const [veri, setVeri]               = useState({ cari: null, cekSenet: null, odeme: null })
  const [yukleniyor, setYukleniyor]   = useState(true)
  const [sonGuncelleme, setSonGuncelleme] = useState(null)

  const verileriYukle = async () => {
    setYukleniyor(true)
    try {
      const yanit = await dashboardApi.tumOzet()
      const d = yanit.data.veri ?? {}
      setVeri({
        cari:     d.cari     ?? null,
        cekSenet: d.cekSenet ?? null,
        odeme:    d.odeme    ?? null,
      })
      setSonGuncelleme(new Date())
    } catch {
      // Veri alınamazsa kartlar boş gösterilir (null-safe erişimler kullanılıyor)
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => { verileriYukle() }, [])

  const saat = new Date().getHours() < 12 ? 'Günaydın'
    : new Date().getHours() < 18 ? 'İyi günler'
    : 'İyi akşamlar'

  // Net pozisyon hesabı
  const toplam_alacak = veri.cari?.toplam_alacak ?? 0
  const toplam_borc   = veri.cari?.toplam_borc   ?? 0
  const net_pozisyon  = toplam_alacak - toplam_borc

  return (
    <div className="dash-root">
      <style>{`
        /* ═══ Dashboard — Obsidian Vault ═══ */

        .dash-root {
          position: relative;
          z-index: 1;
        }

        /* ─── KPI Kart ─── */
        .dash-kpi-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          height: 100%;
        }
        .dash-kpi-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-2px);
        }
        .dash-kpi-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin: 0 0 12px;
          position: relative;
          z-index: 1;
          text-shadow: 0 0 14px rgba(255,255,255,0.08);
        }
        .dash-kpi-value {
          font-family: 'Inter', sans-serif;
          font-size: 26px;
          font-weight: 500;
          margin: 0;
          line-height: 1.15;
          position: relative;
          z-index: 1;
          letter-spacing: 0.01em;
          word-break: break-word;
          font-variant-numeric: tabular-nums;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .dash-detail-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #f59e0b;
          text-decoration: none;
          position: relative;
          z-index: 1;
          transition: all 0.15s;
          opacity: 0.8;
          text-shadow: 0 0 10px rgba(245,158,11,0.2);
        }
        .dash-detail-link:hover {
          color: #f59e0b;
          opacity: 1;
          text-shadow: 0 0 16px rgba(245,158,11,0.35);
        }

        /* ─── Glass Card (alt paneller) ─── */
        .dash-glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .dash-glass-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
        }

        /* ─── Kart Header ─── */
        .dash-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        /* ─── Liste Satırları ─── */
        .dash-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .dash-list-item:hover {
          background: rgba(255,255,255,0.03);
        }
        .dash-list-item:last-child {
          border-bottom: none;
        }

        /* ─── Linkler ─── */
        .dash-link-amber {
          font-size: 12px;
          font-weight: 700;
          color: #f59e0b;
          text-decoration: none;
          transition: all 0.15s;
          text-shadow: 0 0 10px rgba(245,158,11,0.15);
        }
        .dash-link-amber:hover {
          color: #d97706;
          text-shadow: 0 0 14px rgba(245,158,11,0.3);
        }

        /* ─── Net Pozisyon Bandı ─── */
        .dash-pozisyon-bandi {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 16px 22px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* ─── Yenile Butonu (amber outline) ─── */
        .dash-btn-yenile {
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.3);
          color: #f59e0b;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          height: 40px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Outfit', sans-serif;
          min-height: 44px;
        }
        .dash-btn-yenile:hover {
          background: rgba(245,158,11,0.15);
          border-color: rgba(245,158,11,0.5);
          color: #f59e0b;
        }
        .dash-btn-yenile:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
          .dash-kpi-value { font-size: 20px; }
          .dash-card-header { padding: 14px 16px; }
          .dash-list-item { padding: 10px 16px; }
        }
        @media (max-width: 480px) {
          .dash-kpi-value { font-size: 18px; }
          .dash-kpi-card { padding: 14px !important; border-radius: 12px; }
          .dash-glass-card { border-radius: 12px; }
        }
      `}</style>

      {/* ─── Sayfa Başlığı ──────────────────────────────────────────── */}
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
            {saat}{kullanici?.ad_soyad ? `, ${kullanici.ad_soyad.split(' ')[0]}` : ''} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', fontWeight: 400, textShadow: '0 0 12px rgba(255,255,255,0.05)' }}>
            Finansal durumunuzun güncel özeti
          </p>
        </div>
        <button
          onClick={verileriYukle}
          disabled={yukleniyor}
          className="dash-btn-yenile"
        >
          <i
            className="bi bi-arrow-clockwise"
            style={{
              fontSize: 15,
              display: 'inline-block',
              animation: yukleniyor ? 'spin 1s linear infinite' : 'none',
            }}
          />
          Yenile
        </button>
      </div>

      {/* ─── 4'lü KPI Kartları (glassmorphism + neon glow) ─────────── */}
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

      {/* ─── Piyasa Net Pozisyon Bandı ──────────────────────────────── */}
      {!yukleniyor && veri.cari && (
        <div className="dash-pozisyon-bandi mb-4"
             style={{ borderColor: net_pozisyon < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)' }}>
          <i
            className={`bi ${net_pozisyon < 0 ? 'bi-exclamation-triangle-fill' : 'bi-graph-up-arrow'}`}
            style={{
              fontSize: 22,
              color: net_pozisyon < 0 ? '#ef4444' : '#10b981',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
              Piyasa Net Pozisyonu:&nbsp;
            </span>
            <span className="financial-num" style={{
              fontSize: 15, fontWeight: 500,
              color: net_pozisyon < 0 ? '#ef4444' : '#10b981',
              textShadow: `0 0 14px ${net_pozisyon < 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }}>
              {net_pozisyon > 0 ? '+' : ''}{paraBicimlendir(net_pozisyon)}
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500, textShadow: '0 0 10px rgba(255,255,255,0.05)' }}>
            Alacaklar − Borçlar
          </span>
        </div>
      )}

      {/* ─── Alt 2 Kolon ────────────────────────────────────────────── */}
      <div className="row g-3">

        {/* Yaklaşan Vadeler */}
        <div className="col-12 col-lg-6">
          <div className="dash-glass-card h-100">
            <KartBaslik
              iconClass="bi-clock-fill"
              iconColor="#d97706"
              baslik="Yaklaşan Vadeler"
              link="/cek-senet"
            />
            {yukleniyor ? (
              <div style={{ padding: '16px 22px' }}>
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse" style={{
                    height: 54, background: 'rgba(255,255,255,0.04)',
                    borderRadius: 12, marginBottom: 8,
                  }} />
                ))}
              </div>
            ) : veri.cekSenet?.yaklasan_vadeler?.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {veri.cekSenet.yaklasan_vadeler.slice(0, 5).map((cek) => (
                  <li key={cek.id} className="dash-list-item">
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                        {cek.seri_no || 'Seri no yok'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 400, textShadow: '0 0 10px rgba(255,255,255,0.05)' }}>
                        <i className="bi bi-calendar-event me-1" />
                        {cek.vade_tarihi}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="financial-num" style={{
                        margin: 0, fontSize: 13, fontWeight: 500,
                        color: 'rgba(255,255,255,0.85)',
                        fontFamily: "'Inter', sans-serif",
                      }}>
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
          <div className="dash-glass-card h-100">
            <KartBaslik
              iconClass="bi-person-lines-fill"
              iconColor="#ef4444"
              baslik="Yüksek Bakiyeli Cariler"
              link="/cariler"
            />
            {yukleniyor ? (
              <div style={{ padding: '16px 22px' }}>
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse" style={{
                    height: 54, background: 'rgba(255,255,255,0.04)',
                    borderRadius: 12, marginBottom: 8,
                  }} />
                ))}
              </div>
            ) : veri.cari?.en_yuksek_bakiyeli?.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {veri.cari.en_yuksek_bakiyeli.slice(0, 5).map((cari) => (
                  <li key={cari.id} className="dash-list-item">
                    <div className="d-flex align-items-center gap-3">
                      {/* Avatar — Amber gradient badge */}
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 3px 10px rgba(245,158,11,0.25)',
                      }}>
                        <span style={{ color: '#0d1b2e', fontSize: 14, fontWeight: 800 }}>
                          {cari.cari_adi?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                          {cari.cari_adi}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 400, textTransform: 'capitalize', textShadow: '0 0 10px rgba(255,255,255,0.05)' }}>
                          <i className="bi bi-circle-fill me-1" style={{ fontSize: 6 }} />
                          {cari.cari_turu?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <p className="financial-num" style={{
                      margin: 0, fontSize: 13, fontWeight: 500,
                      color: parseFloat(cari.bakiye) >= 0 ? '#10b981' : '#ef4444',
                      fontFamily: "'Inter', sans-serif",
                      textShadow: `0 0 12px ${parseFloat(cari.bakiye) >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
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
        <p className="text-end mt-3" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
          <i className="bi bi-clock-history me-1" />
          Son güncelleme: {sonGuncelleme.toLocaleTimeString('tr-TR')}
        </p>
      )}
    </div>
  )
}
