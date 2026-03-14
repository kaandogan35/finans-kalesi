/**
 * Demo 2 — Vibrant Fintech
 * Papara / Wise tarzı: Solid renkli KPI kartlar, açık gri sidebar,
 * güçlü renk hiyerarşisi, enerjik ama düzenli.
 */
import { useState } from 'react'

/* ─── Mock Veri ─────────────────────────────────────── */
const cekler = [
  { id: 1, firma: 'Demir-Çelik A.Ş.',   tutar: 85000,  vade: '18 Mar 2026', durum: 'Aktif'        },
  { id: 2, firma: 'İnşaat Malz. Ltd.',  tutar: 42500,  vade: '22 Mar 2026', durum: 'Tahsilde'     },
  { id: 3, firma: 'Çelik Boru San.',    tutar: 31200,  vade: '25 Mar 2026', durum: 'Aktif'        },
  { id: 4, firma: 'Yapı Malz. Tic.',    tutar: 18750,  vade: '10 Mar 2026', durum: 'Vadesi Geçti' },
  { id: 5, firma: 'Hırdavat Dünyası',  tutar: 10850,  vade: '05 Nis 2026', durum: 'Aktif'        },
]

const son_islemler = [
  { tip: 'giris',  aciklama: 'Çek Tahsilat — Demir-Çelik',   tutar: 85000,  zaman: '2 saat önce'   },
  { tip: 'cikis', aciklama: 'Tedarikçi Ödemesi — Boru San.', tutar: -31200, zaman: '5 saat önce'   },
  { tip: 'giris',  aciklama: 'POS Hasılatı — Gün sonu',       tutar: 12450,  zaman: 'dün, 18:30'    },
  { tip: 'cikis', aciklama: 'Personel Bordrosu — Mart',       tutar: -48000, zaman: 'dün, 09:00'    },
]

const menuler = [
  { ikon: 'bi-speedometer2',      etiket: 'Dashboard',      aktif: true  },
  { ikon: 'bi-people',            etiket: 'Cari Hesaplar',  aktif: false },
  { ikon: 'bi-file-earmark-text', etiket: 'Çek/Senet',      aktif: false },
  { ikon: 'bi-credit-card',       etiket: 'Ödemeler',       aktif: false },
  { ikon: 'bi-safe',              etiket: 'Varlık & Kasa',  aktif: false },
]

const TL = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Math.abs(n))
const bugun = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

const durum_stiller = {
  'Aktif':        { bg: '#d1fae5', renk: '#065f46', dot: '#10b981' },
  'Tahsilde':     { bg: '#dbeafe', renk: '#1e40af', dot: '#3b82f6' },
  'Vadesi Geçti': { bg: '#fee2e2', renk: '#991b1b', dot: '#ef4444' },
}

/* ─── Ana Bileşen ───────────────────────────────────── */
export default function Demo2() {
  const [sidebarAcik, setSidebarAcik] = useState(false)
  const [hoveredRow, setHoveredRow]   = useState(null)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

        .d2-root * { box-sizing: border-box; }
        .d2-root { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }

        .d2-nav-item {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 14px; border-radius: 10px; cursor: pointer;
          font-size: 14px; font-weight: 500; color: #475569;
          transition: all 0.16s ease; text-decoration: none;
          border: none; background: none; width: 100%; text-align: left;
        }
        .d2-nav-item:hover { background: #edf2fc; color: #123F59; }
        .d2-nav-item.aktif { background: #123F59; color: #ffffff !important; }
        .d2-nav-item.aktif i { color: #ffffff !important; }

        .d2-kpi-kart {
          border-radius: 16px; padding: 24px 22px;
          position: relative; overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .d2-kpi-kart:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.18) !important; }

        .d2-kart {
          background: #fff; border-radius: 14px;
          border: 1px solid #e8edf5;
          box-shadow: 0 2px 8px rgba(18,63,89,0.06);
        }

        .d2-table { width: 100%; border-collapse: collapse; }
        .d2-table th { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; font-weight: 700; padding: 12px 16px; border-bottom: 2px solid #f1f5f9; }
        .d2-table td { padding: 13px 16px; vertical-align: middle; border-bottom: 1px solid #f8fafc; font-size: 14px; }
        .d2-table tbody tr:nth-child(odd) { background: #fafbfd; }
        .d2-table tbody tr { transition: background 0.13s ease; }
        .d2-table tbody tr:hover { background: #f0f7ff !important; }

        .d2-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 20px; font-size: 0.71rem; font-weight: 700;
        }
        .d2-pill::before {
          content: ''; width: 6px; height: 6px; border-radius: 50%;
          background: currentColor; display: inline-block;
        }

        .d2-islem-satir {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 20px; border-bottom: 1px solid #f8fafc;
          transition: background 0.13s ease; cursor: default;
        }
        .d2-islem-satir:last-child { border-bottom: none; }
        .d2-islem-satir:hover { background: #f8fafc; }

        .d2-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 40; display: none;
        }
        .d2-overlay.acik { display: block; }
        .d2-mobile-sidebar {
          position: fixed; top: 0; left: 0; height: 100vh; width: 260px;
          background: #f4f7fc; z-index: 50; transform: translateX(-100%);
          transition: transform 0.25s ease; overflow-y: auto; padding: 24px 16px;
          border-right: 1px solid #e2e8f2;
        }
        .d2-mobile-sidebar.acik { transform: translateX(0); }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .d2-animate { animation: slideUp 0.4s ease both; }
        .d2-animate:nth-child(1) { animation-delay: 0.05s; }
        .d2-animate:nth-child(2) { animation-delay: 0.1s; }
        .d2-animate:nth-child(3) { animation-delay: 0.15s; }
        .d2-animate:nth-child(4) { animation-delay: 0.2s; }

        @media (min-width: 992px) {
          .d2-mob-header { display: none !important; }
          .d2-desk-sidebar { display: flex !important; }
          .d2-mobile-sidebar, .d2-overlay { display: none !important; }
        }
        @media (max-width: 991px) {
          .d2-desk-sidebar { display: none !important; }
          .d2-mob-header { display: flex !important; }
        }
      `}</style>

      <div className="d2-root" style={{ display: 'flex', minHeight: '100vh', background: '#f0f4fa' }}>

        {/* ─── Desktop Sidebar ─────────────────────────────── */}
        <aside
          className="d2-desk-sidebar"
          style={{
            width: 260, background: '#f4f7fc',
            borderRight: '1px solid #e2e8f2',
            flexDirection: 'column', flexShrink: 0,
            position: 'sticky', top: 0, height: '100vh',
            overflowY: 'auto', padding: '24px 16px',
          }}
        >
          <SidebarIcerik2 />
        </aside>

        {/* ─── Mobile ──────────────────────────────────────── */}
        <div className={`d2-overlay ${sidebarAcik ? 'acik' : ''}`} onClick={() => setSidebarAcik(false)} />
        <div className={`d2-mobile-sidebar ${sidebarAcik ? 'acik' : ''}`}>
          <SidebarIcerik2 />
        </div>

        {/* ─── Ana İçerik ───────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Mobile Header */}
          <header
            className="d2-mob-header"
            style={{
              background: '#f4f7fc', borderBottom: '1px solid #e2e8f2',
              height: 60, padding: '0 20px',
              alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#123F59', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#fff',
              }}>FK</div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#123F59' }}>Finans Kalesi</span>
            </div>
            <button onClick={() => setSidebarAcik(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#123F59' }}>
              <i className="bi bi-list" />
            </button>
          </header>

          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 40px' }}>

            {/* Sayfa Başlığı */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Genel Bakış</h1>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, marginTop: 2 }}>{bugun}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{
                  background: '#fff', border: '1px solid #e2e8f2', borderRadius: 10,
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#475569',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <i className="bi bi-download" style={{ fontSize: 13 }} /> Rapor
                </button>
                <button style={{
                  background: '#123F59', border: 'none', borderRadius: 10,
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <i className="bi bi-plus-lg" style={{ fontSize: 13 }} /> Yeni Kayıt
                </button>
              </div>
            </div>

            {/* KPI Kartlar — Solid Renk */}
            <div className="row g-3 mb-4">
              {[
                {
                  etiket: 'Toplam Alacak', tutar: 342800,
                  bg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  ikon: 'bi-arrow-down-circle-fill',
                  trend: '↑ %8,4', trendBg: 'rgba(255,255,255,0.18)',
                  sub: 'geçen aya göre',
                },
                {
                  etiket: 'Toplam Borç', tutar: 127450,
                  bg: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
                  ikon: 'bi-arrow-up-circle-fill',
                  trend: '↓ %2,1', trendBg: 'rgba(255,255,255,0.18)',
                  sub: 'geçen aya göre',
                },
                {
                  etiket: 'Portföy Çek', tutar: 188300,
                  bg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                  ikon: 'bi-file-earmark-text-fill',
                  trend: '14 adet', trendBg: 'rgba(255,255,255,0.18)',
                  sub: 'aktif çek',
                },
                {
                  etiket: 'Kasa Bakiyesi', tutar: 54200,
                  bg: 'linear-gradient(135deg, #0f3358 0%, #123F59 100%)',
                  ikon: 'bi-safe-fill',
                  trend: 'Bugün', trendBg: 'rgba(255,255,255,0.18)',
                  sub: 'güncellendi',
                },
              ].map((k, i) => (
                <div key={i} className={`col-12 col-sm-6 col-xl-3 d2-animate`}>
                  <div className="d2-kpi-kart" style={{ background: k.bg, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                    {/* Dekoratif daire */}
                    <div style={{
                      position: 'absolute', right: -20, top: -20,
                      width: 100, height: 100, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                    }} />
                    <div style={{
                      position: 'absolute', right: 16, bottom: -30,
                      width: 80, height: 80, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                    }} />

                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                          {k.etiket}
                        </span>
                        <i className={`bi ${k.ikon}`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }} />
                      </div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1, marginBottom: 14 }}>
                        {TL(k.tutar)}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          background: k.trendBg, backdropFilter: 'blur(4px)',
                          borderRadius: 20, padding: '3px 10px',
                          fontSize: 12, fontWeight: 700, color: '#fff',
                        }}>{k.trend}</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{k.sub}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablo + Son İşlemler */}
            <div className="row g-3">
              {/* Tablo */}
              <div className="col-12 col-xl-7">
                <div className="d2-kart" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Son Çek & Senetler</span>
                      <span style={{
                        marginLeft: 10, background: '#f0f4fa', borderRadius: 20,
                        padding: '2px 9px', fontSize: 11, fontWeight: 700, color: '#123F59',
                      }}>5 kayıt</span>
                    </div>
                    <a href="#" style={{ fontSize: 13, fontWeight: 600, color: '#123F59', textDecoration: 'none' }}>
                      Tümü →
                    </a>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="d2-table">
                      <thead>
                        <tr>
                          <th>Firma</th>
                          <th style={{ textAlign: 'right' }}>Tutar</th>
                          <th>Vade</th>
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
                            >
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: 34, height: 34, borderRadius: 10,
                                    background: '#f0f4fa', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: 13, color: '#123F59', flexShrink: 0,
                                  }}>
                                    {c.firma.charAt(0)}
                                  </div>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c.firma}</span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                                {TL(c.tutar)}
                              </td>
                              <td style={{ color: '#64748b', fontSize: 13 }}>{c.vade}</td>
                              <td>
                                <span className="d2-pill" style={{ background: ds.bg, color: ds.renk }}>
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
              </div>

              {/* Son İşlemler */}
              <div className="col-12 col-xl-5">
                <div className="d2-kart" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                      <i className="bi bi-activity" style={{ marginRight: 8, color: '#123F59' }} />
                      Son İşlemler
                    </span>
                  </div>
                  {son_islemler.map((s, i) => (
                    <div key={i} className="d2-islem-satir">
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: s.tip === 'giris' ? '#d1fae5' : '#fee2e2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i
                          className={`bi ${s.tip === 'giris' ? 'bi-arrow-down' : 'bi-arrow-up'}`}
                          style={{ color: s.tip === 'giris' ? '#059669' : '#e11d48', fontSize: 18, fontWeight: 700 }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.aciklama}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.zaman}</div>
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 700,
                        color: s.tip === 'giris' ? '#059669' : '#e11d48',
                        flexShrink: 0,
                      }}>
                        {s.tip === 'giris' ? '+' : '-'}{TL(s.tutar)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Sidebar ────────────────────────────────────────── */
function SidebarIcerik2() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 48px)' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingLeft: 4 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, #0f3358, #1a5b80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 14, color: '#fff', flexShrink: 0,
        }}>FK</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', lineHeight: 1.2 }}>Finans Kalesi</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Yönetim Paneli</div>
        </div>
      </div>

      {/* Özet chip'ler */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f2', borderRadius: 12,
        padding: '14px 16px', marginBottom: 20,
      }}>
        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700, marginBottom: 10 }}>
          Net Durum
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.5px' }}>
          +₺215.350
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Alacak − Borç farkı</div>
      </div>

      {/* Menü */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {menuler.map((m) => (
          <button key={m.etiket} className={`d2-nav-item ${m.aktif ? 'aktif' : ''}`}>
            <i className={`bi ${m.ikon}`} style={{ fontSize: 16, width: 18, textAlign: 'center' }} />
            <span>{m.etiket}</span>
            {m.aktif && (
              <span style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
                borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700,
              }}>•</span>
            )}
          </button>
        ))}
      </nav>

      {/* Kullanıcı */}
      <div style={{
        marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #e2e8f2',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #123F59, #1a5b80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0,
        }}>KD</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Kaan Doğan
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Yönetici</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: 4 }}
          title="Çıkış">
          <i className="bi bi-box-arrow-right" />
        </button>
      </div>
    </div>
  )
}
