/**
 * Demo 1 — Midnight Banking
 * Revolut / N26 tarzı: Tam siyah sidebar, saf beyaz içerik.
 * Yüksek kontrast, minimal noise, maksimum güven.
 */
import { useState } from 'react'

/* ─── Mock Veri ─────────────────────────────────────── */
const cekler = [
  { id: 1, firma: 'Demir-Çelik A.Ş.',    tutar: 85000,  vade: '18 Mar 2026', durum: 'Aktif'        },
  { id: 2, firma: 'İnşaat Malz. Ltd.',   tutar: 42500,  vade: '22 Mar 2026', durum: 'Tahsilde'     },
  { id: 3, firma: 'Çelik Boru San.',     tutar: 31200,  vade: '25 Mar 2026', durum: 'Aktif'        },
  { id: 4, firma: 'Yapı Malz. Tic.',     tutar: 18750,  vade: '10 Mar 2026', durum: 'Vadesi Geçti' },
  { id: 5, firma: 'Hırdavat Dünyası',   tutar: 10850,  vade: '05 Nis 2026', durum: 'Aktif'        },
]

const vadeler = [
  { tarih: '18 Mar', firma: 'Demir-Çelik A.Ş.',   tutar: 85000 },
  { tarih: '22 Mar', firma: 'İnşaat Malz. Ltd.',  tutar: 42500 },
  { tarih: '25 Mar', firma: 'Çelik Boru San.',    tutar: 31200 },
]

const menuler = [
  { ikon: 'bi-speedometer2',      etiket: 'Dashboard',      aktif: true  },
  { ikon: 'bi-people',            etiket: 'Cari Hesaplar',  aktif: false },
  { ikon: 'bi-file-earmark-text', etiket: 'Çek/Senet',      aktif: false },
  { ikon: 'bi-credit-card',       etiket: 'Ödemeler',       aktif: false },
  { ikon: 'bi-safe',              etiket: 'Varlık & Kasa',  aktif: false },
]

const TL = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

const durum_stiller = {
  'Aktif':        { bg: '#ecfdf5', renk: '#059669' },
  'Tahsilde':     { bg: '#eff6ff', renk: '#2563eb' },
  'Vadesi Geçti': { bg: '#fff1f2', renk: '#e11d48' },
}

const bugun = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

/* ─── Ana Bileşen ───────────────────────────────────── */
export default function Demo1() {
  const [sidebarAcik, setSidebarAcik] = useState(false)
  const [hoveredMenu, setHoveredMenu] = useState(null)
  const [hoveredRow, setHoveredRow]   = useState(null)
  const [hoveredBtn, setHoveredBtn]   = useState(null)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');

        .d1-root * { box-sizing: border-box; }
        .d1-root { font-family: 'Sora', -apple-system, sans-serif; }

        .d1-sidebar-link {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px; border-radius: 8px; cursor: pointer;
          color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500;
          transition: all 0.18s ease; text-decoration: none; border: none; background: none; width: 100%;
        }
        .d1-sidebar-link:hover { color: rgba(255,255,255,0.88); background: rgba(255,255,255,0.06); }
        .d1-sidebar-link.aktif { background: #1f1f1f; color: #ffffff; }
        .d1-sidebar-link.aktif i { color: #f59e0b !important; }

        .d1-kpi {
          background: #fff; border-radius: 12px; padding: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          transition: box-shadow 0.18s ease, transform 0.18s ease;
        }
        .d1-kpi:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); transform: translateY(-2px); }

        .d1-table tbody tr { transition: background 0.13s ease; cursor: default; }
        .d1-table tbody tr:hover { background: #fafafa; }
        .d1-table td, .d1-table th { padding: 13px 16px; vertical-align: middle; border: none !important; }
        .d1-table thead th { font-size: 0.69rem; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; font-weight: 600; border-bottom: 2px solid #f1f5f9 !important; }

        .d1-quick-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border-radius: 10px; width: 100%;
          border: 1px solid #f1f5f9; background: #fff; cursor: pointer;
          font-size: 14px; font-weight: 500; color: #1e293b;
          transition: all 0.15s ease; text-align: left;
        }
        .d1-quick-btn:hover { border-color: #0a0a0a; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transform: translateY(-1px); }

        .d1-pill {
          display: inline-block; padding: 3px 10px; border-radius: 20px;
          font-size: 0.72rem; font-weight: 600;
        }

        .d1-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          z-index: 40; display: none;
        }
        .d1-overlay.acik { display: block; }

        .d1-mobile-sidebar {
          position: fixed; top: 0; left: 0; height: 100vh; width: 260px;
          background: #0a0a0a; z-index: 50; transform: translateX(-100%);
          transition: transform 0.25s ease; overflow-y: auto;
        }
        .d1-mobile-sidebar.acik { transform: translateX(0); }

        @media (min-width: 992px) {
          .d1-mobile-header { display: none !important; }
          .d1-desktop-sidebar { display: flex !important; }
          .d1-mobile-sidebar { display: none !important; }
          .d1-overlay { display: none !important; }
        }
        @media (max-width: 991px) {
          .d1-desktop-sidebar { display: none !important; }
          .d1-mobile-header { display: flex !important; }
        }
      `}</style>

      <div className="d1-root" style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>

        {/* ─── Desktop Sidebar ─────────────────────────────── */}
        <aside
          className="d1-desktop-sidebar"
          style={{
            width: 260, minHeight: '100vh', background: '#0a0a0a',
            flexDirection: 'column', flexShrink: 0,
            position: 'sticky', top: 0, height: '100vh',
            overflowY: 'auto', padding: '24px 16px',
          }}
        >
          <SidebarIcerik />
        </aside>

        {/* ─── Mobile Overlay & Sidebar ──────────────────────── */}
        <div className={`d1-overlay ${sidebarAcik ? 'acik' : ''}`} onClick={() => setSidebarAcik(false)} />
        <div className={`d1-mobile-sidebar ${sidebarAcik ? 'acik' : ''}`} style={{ padding: '24px 16px' }}>
          <SidebarIcerik />
        </div>

        {/* ─── Ana İçerik ───────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Mobile Header */}
          <header
            className="d1-mobile-header"
            style={{
              background: '#0a0a0a', height: 60, padding: '0 20px',
              alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, background: '#fff', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 14, color: '#0a0a0a',
              }}>FK</div>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Finans Kalesi</span>
            </div>
            <button
              onClick={() => setSidebarAcik(true)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 4 }}
            >
              <i className="bi bi-list" />
            </button>
          </header>

          {/* Content Header */}
          <div style={{
            borderBottom: '1px solid #f1f5f9', padding: '20px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#fff', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#0a0a0a' }}>Dashboard</span>
              <span style={{ color: '#cbd5e1', fontSize: 16 }}>/</span>
              <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 400 }}>Genel Bakış</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: '#f8fafc', border: '1px solid #f1f5f9',
                borderRadius: 8, padding: '6px 14px',
                fontSize: 13, color: '#64748b', fontWeight: 500,
              }}>
                <i className="bi bi-calendar3" style={{ marginRight: 6, fontSize: 12 }} />
                {bugun}
              </div>
              <button style={{
                width: 36, height: 36, borderRadius: 8,
                background: '#f8fafc', border: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748b', fontSize: 16,
              }}>
                <i className="bi bi-bell" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

            {/* KPI Grid */}
            <div className="row g-3 mb-4">
              {[
                { etiket: 'Toplam Alacak',   tutar: 342800, renk: '#10b981', ikon: 'bi-arrow-down-circle', trend: '↑ %8,4 geçen aya göre', trendRenk: '#059669' },
                { etiket: 'Toplam Borç',     tutar: 127450, renk: '#f43f5e', ikon: 'bi-arrow-up-circle',   trend: '↓ %2,1 geçen aya göre', trendRenk: '#e11d48' },
                { etiket: 'Portföy Çek',     tutar: 188300, renk: '#f59e0b', ikon: 'bi-file-earmark-text', trend: '14 adet aktif çek',       trendRenk: '#94a3b8' },
                { etiket: 'Kasa Bakiyesi',   tutar: 54200,  renk: '#0a0a0a', ikon: 'bi-safe',              trend: 'Güncellendi: bugün',       trendRenk: '#94a3b8' },
              ].map((k) => (
                <div key={k.etiket} className="col-12 col-sm-6 col-xl-3">
                  <div
                    className="d1-kpi"
                    style={{ borderLeft: `4px solid ${k.renk}` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{
                        fontSize: '0.69rem', textTransform: 'uppercase',
                        letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 600,
                      }}>{k.etiket}</span>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: k.renk + '14',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className={`bi ${k.ikon}`} style={{ color: k.renk, fontSize: 16 }} />
                      </div>
                    </div>
                    <div style={{
                      fontSize: '2.15rem', fontWeight: 700,
                      color: '#0a0a0a', letterSpacing: '-0.5px',
                      lineHeight: 1.1, marginBottom: 8,
                    }}>
                      {TL(k.tutar)}
                    </div>
                    <span style={{ fontSize: 12, color: k.trendRenk, fontWeight: 500 }}>{k.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Çek/Senet Tablosu */}
            <div style={{
              background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 24, overflow: 'hidden',
            }}>
              <div style={{
                padding: '18px 20px', borderBottom: '1px solid #f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0a0a0a' }}>Son Çek & Senetler</span>
                <a href="#" style={{
                  fontSize: 13, color: '#94a3b8', textDecoration: 'none', fontWeight: 500,
                  transition: 'color 0.15s',
                }}
                  onMouseEnter={e => e.target.style.color = '#0a0a0a'}
                  onMouseLeave={e => e.target.style.color = '#94a3b8'}
                >
                  Tümünü Gör →
                </a>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="d1-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>Firma</th>
                      <th style={{ textAlign: 'right' }}>Tutar</th>
                      <th>Vade Tarihi</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cekler.map((c) => {
                      const ds = durum_stiller[c.durum]
                      return (
                        <tr key={c.id}
                          onMouseEnter={() => setHoveredRow(c.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{ background: hoveredRow === c.id ? '#fafafa' : '#fff' }}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: '#f8fafc', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700, color: '#64748b', flexShrink: 0,
                              }}>
                                {c.firma.charAt(0)}
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{c.firma}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#0a0a0a', fontSize: 14 }}>
                            {TL(c.tutar)}
                          </td>
                          <td style={{ color: '#64748b', fontSize: 13 }}>
                            <i className="bi bi-calendar3" style={{ marginRight: 6, fontSize: 11 }} />
                            {c.vade}
                          </td>
                          <td>
                            <span className="d1-pill" style={{ background: ds.bg, color: ds.renk }}>
                              {c.durum}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alt İki Kolon */}
            <div className="row g-3">
              {/* Yaklaşan Vadeler */}
              <div className="col-12 col-lg-6">
                <div style={{
                  background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0a0a0a' }}>
                      <i className="bi bi-clock" style={{ marginRight: 8, color: '#f59e0b' }} />
                      Yaklaşan Vadeler
                    </span>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    {vadeler.map((v, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center',
                        padding: '12px 20px', gap: 12,
                        borderBottom: i < vadeler.length - 1 ? '1px solid #f8fafc' : 'none',
                      }}>
                        <div style={{
                          minWidth: 44, height: 44, borderRadius: 10,
                          background: '#f8fafc', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#1e293b', lineHeight: 1.2,
                        }}>
                          {v.tarih.split(' ')[0]}
                          <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>{v.tarih.split(' ')[1]}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{v.firma}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>{TL(v.tutar)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hızlı İşlem */}
              <div className="col-12 col-lg-6">
                <div style={{
                  background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0a0a0a' }}>
                      <i className="bi bi-lightning-charge" style={{ marginRight: 8, color: '#f59e0b' }} />
                      Hızlı İşlem
                    </span>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { ikon: 'bi-plus-circle', etiket: 'Yeni Çek / Senet Ekle', renk: '#10b981' },
                      { ikon: 'bi-arrow-left-right', etiket: 'Kasa Hareketi Gir', renk: '#2563eb' },
                      { ikon: 'bi-download', etiket: 'Rapor İndir', renk: '#8b5cf6' },
                    ].map((b, i) => (
                      <button
                        key={i}
                        className="d1-quick-btn"
                        onMouseEnter={() => setHoveredBtn(i)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          borderColor: hoveredBtn === i ? '#0a0a0a' : '#f1f5f9',
                          boxShadow: hoveredBtn === i ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                          transform: hoveredBtn === i ? 'translateY(-1px)' : 'none',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: b.renk + '14',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <i className={`bi ${b.ikon}`} style={{ color: b.renk, fontSize: 16 }} />
                        </div>
                        <span>{b.etiket}</span>
                        <i className="bi bi-chevron-right" style={{ marginLeft: 'auto', color: '#cbd5e1', fontSize: 12 }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>{/* /scrollable */}
        </div>{/* /ana içerik */}
      </div>
    </>
  )
}

/* ─── Sidebar İçerik Bileşeni ───────────────────────── */
function SidebarIcerik() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 48px)' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, paddingLeft: 4 }}>
        <div style={{
          width: 36, height: 36, background: '#fff', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 14, color: '#0a0a0a', flexShrink: 0,
        }}>FK</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Finans Kalesi</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>v1.0 — Demo</div>
        </div>
      </div>

      {/* Menü */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', fontWeight: 600, padding: '0 16px 8px' }}>
          Menü
        </div>
        {menuler.map((m) => (
          <button key={m.etiket} className={`d1-sidebar-link ${m.aktif ? 'aktif' : ''}`}>
            <i className={`bi ${m.ikon}`} style={{ fontSize: 16, width: 18, textAlign: 'center' }} />
            {m.etiket}
            {m.aktif && (
              <div style={{
                marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b',
              }} />
            )}
          </button>
        ))}
      </nav>

      {/* Kullanıcı */}
      <div style={{
        marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0,
        }}>KD</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Kaan Doğan</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Yönetici</div>
        </div>
        <button style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', fontSize: 16, padding: 4,
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.target.style.color = '#f43f5e'}
          onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
          title="Çıkış"
        >
          <i className="bi bi-box-arrow-right" />
        </button>
      </div>
    </div>
  )
}
