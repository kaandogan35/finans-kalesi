import React, { useState, useEffect } from 'react';

export default function Tema1Lime() {
  const [modalAcik, setModalAcik] = useState(false);

  // ESC ile modal kapansın
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setModalAcik(false);
    };
    if (modalAcik) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [modalAcik]);

  const paraFormat = (tutar) =>
    new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(tutar);

  // ── Mock Data ──
  const kpiCards = [
    { baslik: 'Toplam Bakiye', tutar: 2450000, ikon: 'bi-wallet2', renk: '#b0d12a', chart: true },
    { baslik: 'Alacak', tutar: 1820000, ikon: 'bi-arrow-down-circle', renk: '#10b981' },
    { baslik: 'Borç', tutar: 630000, ikon: 'bi-arrow-up-circle', renk: '#ef4444' },
    { baslik: 'Kasa', tutar: 485000, ikon: 'bi-safe', renk: '#0891b2' },
  ];

  const cariHesaplar = [
    { ad: 'Yılmaz Demir Çelik A.Ş.', tip: 'Müşteri', bakiye: 324500, sonIslem: '12.03.2026', durum: 'Aktif' },
    { ad: 'Özkan Hırdavat Ltd. Şti.', tip: 'Tedarikçi', bakiye: -185200, sonIslem: '10.03.2026', durum: 'Aktif' },
    { ad: 'Anadolu İnşaat San. Tic.', tip: 'Müşteri', bakiye: 542000, sonIslem: '08.03.2026', durum: 'Aktif' },
    { ad: 'Kara Metal Sanayi A.Ş.', tip: 'Tedarikçi', bakiye: -97800, sonIslem: '05.03.2026', durum: 'Pasif' },
    { ad: 'Doğan Yapı Malzemeleri', tip: 'Müşteri', bakiye: 218750, sonIslem: '14.03.2026', durum: 'Aktif' },
  ];

  const kasaIslemler = [
    { aciklama: 'Yılmaz Demir Çelik tahsilat', tutar: 85000, tip: 'giris', tarih: '14.03.2026', ikon: 'bi-arrow-down-left' },
    { aciklama: 'Özkan Hırdavat ödeme', tutar: -42500, tip: 'cikis', tarih: '13.03.2026', ikon: 'bi-arrow-up-right' },
    { aciklama: 'Anadolu İnşaat tahsilat', tutar: 128000, tip: 'giris', tarih: '12.03.2026', ikon: 'bi-arrow-down-left' },
    { aciklama: 'Kira ödemesi', tutar: -18500, tip: 'cikis', tarih: '11.03.2026', ikon: 'bi-arrow-up-right' },
    { aciklama: 'Doğan Yapı tahsilat', tutar: 67200, tip: 'giris', tarih: '10.03.2026', ikon: 'bi-arrow-down-left' },
  ];

  const cekSenetler = [
    { belgeNo: 'ÇK-2026-0148', tur: 'Çek', tutar: 145000, vade: '25.04.2026', kisi: 'Yılmaz Demir Çelik', durum: 'Beklemede', yon: 'giris' },
    { belgeNo: 'SN-2026-0073', tur: 'Senet', tutar: 82000, vade: '18.03.2026', kisi: 'Özkan Hırdavat', durum: 'Tahsil Edildi', yon: 'cikis' },
    { belgeNo: 'ÇK-2026-0152', tur: 'Çek', tutar: 210000, vade: '30.05.2026', kisi: 'Anadolu İnşaat', durum: 'Ciro Edildi', yon: 'giris' },
    { belgeNo: 'SN-2026-0081', tur: 'Senet', tutar: 56000, vade: '10.04.2026', kisi: 'Kara Metal', durum: 'Protestolu', yon: 'cikis' },
    { belgeNo: 'ÇK-2026-0159', tur: 'Çek', tutar: 175000, vade: '15.06.2026', kisi: 'Doğan Yapı', durum: 'Beklemede', yon: 'giris' },
  ];

  const durumRenk = {
    'Beklemede': { bg: 'rgba(245,158,11,0.12)', renk: '#d97706' },
    'Tahsil Edildi': { bg: 'rgba(16,185,129,0.12)', renk: '#059669' },
    'Protestolu': { bg: 'rgba(239,68,68,0.12)', renk: '#dc2626' },
    'Ciro Edildi': { bg: 'rgba(59,130,246,0.12)', renk: '#2563eb' },
  };

  const turRenk = {
    'Çek': { bg: 'rgba(245,158,11,0.12)', renk: '#d97706' },
    'Senet': { bg: 'rgba(8,145,178,0.12)', renk: '#0891b2' },
  };

  // ── Mini SVG Bar Chart ──
  const MiniChart = () => {
    const bars = [40, 65, 50, 80, 60, 90, 75];
    const maxH = 28;
    return (
      <svg width="70" height="32" viewBox="0 0 70 32" style={{ display: 'block' }}>
        {bars.map((v, i) => (
          <rect
            key={i}
            x={i * 10}
            y={maxH - (v / 100) * maxH + 2}
            width="7"
            height={(v / 100) * maxH}
            rx="2"
            fill="#b0d12a"
            opacity={0.6 + (i / bars.length) * 0.4}
          />
        ))}
      </svg>
    );
  };

  // ── Section Header ──
  const SectionHeader = ({ icon, title }) => (
    <div className="tema1-section-header">
      <i className={`bi ${icon}`}></i>
      <span>{title}</span>
    </div>
  );

  return (
    <div className="tema1-page">

      {/* ════════════════ 1. DASHBOARD ════════════════ */}
      <SectionHeader icon="bi-grid-1x2" title="Dashboard" />
      <div className="row g-3 mb-4">
        {kpiCards.map((kpi, i) => (
          <div className="col-lg-3 col-md-6" key={i}>
            <div className="tema1-kpi-card">
              <div className="tema1-kpi-deco-icon">
                <i className={`bi ${kpi.ikon}`}></i>
              </div>
              <div className="tema1-kpi-label">{kpi.baslik}</div>
              <div className="tema1-kpi-value financial-num" style={{ color: kpi.renk }}>
                ₺{paraFormat(kpi.tutar)}
              </div>
              {kpi.chart && (
                <div style={{ marginTop: 8 }}>
                  <MiniChart />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════ 2. CARİ HESAPLAR ════════════════ */}
      <SectionHeader icon="bi-people" title="Cari Hesaplar" />
      <div className="tema1-glass-card mb-4">
        <div className="tema1-search-wrapper mb-3">
          <i className="bi bi-search tema1-search-icon"></i>
          <input
            type="text"
            className="tema1-search-input"
            placeholder="Cari hesap ara..."
            readOnly
          />
        </div>
        <div className="table-responsive">
          <table className="tema1-table">
            <thead>
              <tr>
                <th>Cari Adı</th>
                <th>Tip</th>
                <th>Bakiye</th>
                <th>Son İşlem</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {cariHesaplar.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#2e2e33' }}>{c.ad}</td>
                  <td>
                    <span
                      className="tema1-badge"
                      style={{
                        background: c.tip === 'Müşteri' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                        color: c.tip === 'Müşteri' ? '#059669' : '#2563eb',
                      }}
                    >
                      {c.tip}
                    </span>
                  </td>
                  <td>
                    <span
                      className="financial-num"
                      style={{ fontWeight: 700, color: c.bakiye >= 0 ? '#059669' : '#dc2626' }}
                    >
                      {c.bakiye >= 0 ? '' : '-'}₺{paraFormat(Math.abs(c.bakiye))}
                    </span>
                  </td>
                  <td style={{ color: 'rgba(0,0,0,0.5)' }}>{c.sonIslem}</td>
                  <td>
                    <span
                      className="tema1-badge"
                      style={{
                        background: c.durum === 'Aktif' ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.06)',
                        color: c.durum === 'Aktif' ? '#059669' : 'rgba(0,0,0,0.45)',
                      }}
                    >
                      {c.durum}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tema1-pagination">
          <button className="tema1-page-btn active">1</button>
          <button className="tema1-page-btn">2</button>
          <button className="tema1-page-btn">3</button>
          <button className="tema1-page-btn">
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* ════════════════ 3. KASA ════════════════ */}
      <SectionHeader icon="bi-safe" title="Kasa" />
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="tema1-summary-card tema1-summary-giris">
            <div className="tema1-summary-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <i className="bi bi-arrow-down-left" style={{ color: '#10b981' }}></i>
            </div>
            <div>
              <div className="tema1-summary-label">Toplam Giriş</div>
              <div className="tema1-summary-value financial-num" style={{ color: '#059669' }}>
                ₺{paraFormat(280200)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="tema1-summary-card tema1-summary-cikis">
            <div className="tema1-summary-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <i className="bi bi-arrow-up-right" style={{ color: '#ef4444' }}></i>
            </div>
            <div>
              <div className="tema1-summary-label">Toplam Çıkış</div>
              <div className="tema1-summary-value financial-num" style={{ color: '#dc2626' }}>
                ₺{paraFormat(61000)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="tema1-glass-card mb-4">
        {kasaIslemler.map((islem, i) => (
          <div className="tema1-tx-row" key={i}>
            <div className="tema1-tx-icon" style={{
              background: islem.tip === 'giris' ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
              color: islem.tip === 'giris' ? '#10b981' : '#ef4444',
            }}>
              <i className={`bi ${islem.ikon}`}></i>
            </div>
            <div className="tema1-tx-info">
              <div className="tema1-tx-desc">{islem.aciklama}</div>
              <div className="tema1-tx-date">{islem.tarih}</div>
            </div>
            <div
              className="tema1-tx-amount financial-num"
              style={{ color: islem.tip === 'giris' ? '#059669' : '#dc2626' }}
            >
              {islem.tip === 'giris' ? '+' : '-'}₺{paraFormat(Math.abs(islem.tutar))}
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════ 4. ÇEK / SENET ════════════════ */}
      <SectionHeader icon="bi-file-earmark-check" title="Çek / Senet" />
      <div className="tema1-glass-card mb-4">
        <div className="table-responsive">
          <table className="tema1-table">
            <thead>
              <tr>
                <th>Belge No</th>
                <th>Tür</th>
                <th>Tutar</th>
                <th>Vade Tarihi</th>
                <th>Kime/Kimden</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {cekSenetler.map((cs, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#2e2e33', fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                    {cs.belgeNo}
                  </td>
                  <td>
                    <span
                      className="tema1-badge"
                      style={{ background: turRenk[cs.tur].bg, color: turRenk[cs.tur].renk }}
                    >
                      {cs.tur}
                    </span>
                  </td>
                  <td>
                    <span
                      className="financial-num"
                      style={{ fontWeight: 700, color: cs.yon === 'giris' ? '#059669' : '#dc2626' }}
                    >
                      ₺{paraFormat(cs.tutar)}
                    </span>
                  </td>
                  <td style={{ color: 'rgba(0,0,0,0.5)' }}>{cs.vade}</td>
                  <td style={{ color: '#2e2e33' }}>{cs.kisi}</td>
                  <td>
                    <span
                      className="tema1-badge"
                      style={{ background: durumRenk[cs.durum].bg, color: durumRenk[cs.durum].renk }}
                    >
                      {cs.durum}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════ 5. VADE HESAPLAYICI ════════════════ */}
      <SectionHeader icon="bi-calculator" title="Vade Hesaplayıcı" />
      <div className="row g-3 mb-4">
        <div className="col-md-7">
          <div className="tema1-glass-card">
            <div className="mb-3">
              <label className="tema1-form-label">Tutar (₺)</label>
              <input type="text" className="tema1-form-input" defaultValue="500.000,00" readOnly />
            </div>
            <div className="mb-3">
              <label className="tema1-form-label">Faiz Oranı (%)</label>
              <input type="text" className="tema1-form-input" defaultValue="42" readOnly />
            </div>
            <div className="mb-3">
              <label className="tema1-form-label">Vade (Gün)</label>
              <input type="text" className="tema1-form-input" defaultValue="90" readOnly />
            </div>
            <div className="mb-3">
              <label className="tema1-form-label">Başlangıç Tarihi</label>
              <input type="text" className="tema1-form-input" defaultValue="15.03.2026" readOnly />
            </div>
            <button className="tema1-btn-primary" style={{ width: '100%', marginTop: 4 }}>
              <i className="bi bi-calculator me-2"></i>Hesapla
            </button>
          </div>
        </div>
        <div className="col-md-5">
          <div className="tema1-glass-card" style={{ background: 'linear-gradient(145deg, #ffffff, #f8f9fa)' }}>
            <div className="tema1-result-title">Hesaplama Sonucu</div>
            <div className="tema1-result-row">
              <span className="tema1-result-label">Ana Para</span>
              <span className="tema1-result-value financial-num">₺{paraFormat(500000)}</span>
            </div>
            <div className="tema1-result-row">
              <span className="tema1-result-label">Faiz Tutarı</span>
              <span className="tema1-result-value financial-num" style={{ color: '#d97706' }}>₺{paraFormat(51780.82)}</span>
            </div>
            <div className="tema1-result-divider"></div>
            <div className="tema1-result-row">
              <span className="tema1-result-label" style={{ fontWeight: 700, color: '#000' }}>Toplam</span>
              <span className="tema1-result-value financial-num" style={{ fontSize: 22, color: '#059669', fontWeight: 800 }}>
                ₺{paraFormat(551780.82)}
              </span>
            </div>
            <div className="tema1-result-meta">
              Vade Tarihi: 13.06.2026
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════ 6. MODAL DEMO ════════════════ */}
      <SectionHeader icon="bi-window-stack" title="Modal Demo" />
      <div className="tema1-glass-card mb-4" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <p style={{ color: 'rgba(0,0,0,0.5)', marginBottom: 20, fontSize: 14 }}>
          Premium modal tasarımını görmek için butona tıklayın
        </p>
        <button className="tema1-btn-primary" onClick={() => setModalAcik(true)}>
          <i className="bi bi-plus-lg me-2"></i>Yeni Kayıt Ekle
        </button>
      </div>

      {/* ── Modal ── */}
      {modalAcik && (
        <div className="tema1-modal-backdrop">
          <div className="tema1-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="tema1-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="tema1-modal-icon-box">
                  <i className="bi bi-plus-lg" style={{ color: '#fff', fontSize: 18 }}></i>
                </div>
                <div>
                  <div className="tema1-modal-title">Yeni Kayıt Ekle</div>
                  <div className="tema1-modal-subtitle">Sisteme yeni bir kayıt oluşturun</div>
                </div>
              </div>
              <button className="tema1-modal-close" onClick={() => setModalAcik(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Body */}
            <div className="tema1-modal-body">
              {/* Section 1 */}
              <div className="tema1-modal-section">
                <div className="tema1-modal-section-head">
                  <div className="tema1-modal-bar" style={{ background: '#b0d12a' }}></div>
                  <span>Temel Bilgiler</span>
                </div>
                <div className="mb-3">
                  <label className="tema1-form-label">Varlık Adı</label>
                  <input type="text" className="tema1-form-input" placeholder="Kayıt adını girin" readOnly />
                </div>
                <div className="mb-3">
                  <label className="tema1-form-label">Tür</label>
                  <select className="tema1-form-input" defaultValue="">
                    <option value="" disabled>Seçiniz</option>
                    <option>Müşteri</option>
                    <option>Tedarikçi</option>
                  </select>
                </div>
              </div>

              {/* Section 2 */}
              <div className="tema1-modal-section">
                <div className="tema1-modal-section-head">
                  <div className="tema1-modal-bar" style={{ background: '#3b82f6' }}></div>
                  <span>İşlem Detayları</span>
                </div>
                <div className="mb-3">
                  <label className="tema1-form-label">Tutar</label>
                  <div style={{ position: 'relative' }}>
                    <span className="tema1-input-prefix">₺</span>
                    <input
                      type="text"
                      className="tema1-form-input"
                      style={{ paddingLeft: 36 }}
                      placeholder="0,00"
                      readOnly
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="tema1-form-label">Tarih</label>
                  <input type="text" className="tema1-form-input" defaultValue="15.03.2026" readOnly />
                </div>
              </div>

              {/* Live Preview */}
              <div className="tema1-modal-preview">
                <div className="tema1-modal-preview-title">Kayıt Önizleme</div>
                <div className="tema1-modal-preview-row">
                  <span>Varlık Adı</span>
                  <span style={{ fontWeight: 600, color: '#2e2e33' }}>--</span>
                </div>
                <div className="tema1-modal-preview-row">
                  <span>Tür</span>
                  <span style={{ fontWeight: 600, color: '#2e2e33' }}>--</span>
                </div>
                <div className="tema1-modal-preview-row">
                  <span>Tutar</span>
                  <span className="financial-num" style={{ fontWeight: 700, color: '#059669' }}>₺0,00</span>
                </div>
                <div className="tema1-modal-preview-row">
                  <span>Tarih</span>
                  <span style={{ fontWeight: 600, color: '#2e2e33' }}>15.03.2026</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="tema1-modal-footer">
              <button className="tema1-modal-submit">
                <i className="bi bi-check-lg me-2"></i>Kaydı Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ STYLES ════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');

        .tema1-page {
          background: #ececed;
          min-height: 100vh;
          padding: 32px 24px;
          font-family: 'Outfit', sans-serif;
          color: #2e2e33;
          animation: tema1FadeIn 0.4s ease;
        }

        .financial-num {
          font-family: 'Inter', sans-serif !important;
        }

        /* ── Section Header ── */
        .tema1-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 700;
          color: #000;
        }
        .tema1-section-header i {
          font-size: 20px;
          color: #b0d12a;
        }

        /* ── KPI Cards ── */
        .tema1-kpi-card {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 16px;
          padding: 22px 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
          container-type: inline-size;
          animation: tema1SlideUp 0.5s ease both;
        }
        .tema1-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(0,0,0,0.15);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }
        .tema1-kpi-deco-icon {
          position: absolute;
          top: 12px;
          right: 14px;
          font-size: 48px;
          opacity: 0.06;
          color: #000;
          line-height: 1;
        }
        .tema1-kpi-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 700;
          color: rgba(0,0,0,0.5);
          margin-bottom: 6px;
        }
        .tema1-kpi-value {
          font-weight: 800;
          font-size: clamp(13px, 6.5cqw, 26px);
          line-height: 1.2;
        }

        /* ── Glass Card ── */
        .tema1-glass-card {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 16px;
          padding: 22px 24px;
          animation: tema1SlideUp 0.5s ease both;
        }

        /* ── Search ── */
        .tema1-search-wrapper {
          position: relative;
        }
        .tema1-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(0,0,0,0.35);
          font-size: 15px;
        }
        .tema1-search-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          background: rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: #000;
          outline: none;
          min-height: 44px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .tema1-search-input::placeholder {
          color: rgba(0,0,0,0.25);
        }
        .tema1-search-input:focus {
          border-color: #b0d12a;
          box-shadow: 0 0 0 3px rgba(176,209,42,0.15);
        }

        /* ── Table ── */
        .tema1-table {
          width: 100%;
          border-collapse: collapse;
        }
        .tema1-table thead th {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          color: rgba(0,0,0,0.5);
          padding: 10px 14px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          white-space: nowrap;
        }
        .tema1-table tbody td {
          padding: 13px 14px;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          font-size: 14px;
          vertical-align: middle;
        }
        .tema1-table tbody tr:hover {
          background: rgba(0,0,0,0.015);
        }
        .tema1-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* ── Badge ── */
        .tema1-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ── Pagination ── */
        .tema1-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 16px;
        }
        .tema1-page-btn {
          min-width: 44px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,0,0,0.12);
          background: rgba(0,0,0,0.04);
          color: rgba(0,0,0,0.7);
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tema1-page-btn:hover {
          background: rgba(0,0,0,0.08);
        }
        .tema1-page-btn.active {
          background: #b0d12a;
          color: #000;
          font-weight: 700;
          border-color: #b0d12a;
        }

        /* ── Summary Cards ── */
        .tema1-summary-card {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 16px;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.25s ease;
          animation: tema1SlideUp 0.5s ease both;
        }
        .tema1-summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }
        .tema1-summary-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .tema1-summary-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(0,0,0,0.5);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .tema1-summary-value {
          font-size: 22px;
          font-weight: 800;
          margin-top: 2px;
        }

        /* ── Transaction Row ── */
        .tema1-tx-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          transition: background 0.15s;
        }
        .tema1-tx-row:last-child {
          border-bottom: none;
        }
        .tema1-tx-row:hover {
          background: rgba(0,0,0,0.015);
          margin: 0 -24px;
          padding-left: 24px;
          padding-right: 24px;
        }
        .tema1-tx-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .tema1-tx-info {
          flex: 1;
          min-width: 0;
        }
        .tema1-tx-desc {
          font-size: 14px;
          font-weight: 600;
          color: #2e2e33;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tema1-tx-date {
          font-size: 12px;
          color: rgba(0,0,0,0.35);
          margin-top: 2px;
        }
        .tema1-tx-amount {
          font-weight: 700;
          font-size: 15px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Forms ── */
        .tema1-form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: rgba(0,0,0,0.7);
          margin-bottom: 6px;
        }
        .tema1-form-input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: #000;
          outline: none;
          min-height: 44px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .tema1-form-input::placeholder {
          color: rgba(0,0,0,0.25);
        }
        .tema1-form-input:focus {
          border-color: #b0d12a;
          box-shadow: 0 0 0 3px rgba(176,209,42,0.15);
        }
        .tema1-input-prefix {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(0,0,0,0.35);
          font-weight: 600;
          font-size: 15px;
        }

        /* ── Result Card ── */
        .tema1-result-title {
          font-size: 14px;
          font-weight: 700;
          color: #000;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .tema1-result-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
        }
        .tema1-result-label {
          font-size: 13px;
          color: rgba(0,0,0,0.5);
          font-weight: 500;
        }
        .tema1-result-value {
          font-weight: 700;
          font-size: 16px;
          color: #2e2e33;
        }
        .tema1-result-divider {
          height: 1px;
          background: rgba(0,0,0,0.08);
          margin: 6px 0;
        }
        .tema1-result-meta {
          text-align: center;
          font-size: 12px;
          color: rgba(0,0,0,0.35);
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(0,0,0,0.06);
        }

        /* ── Buttons ── */
        .tema1-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #000000;
          color: #ececed;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 14px;
          border: none;
          border-radius: 50px;
          padding: 10px 22px;
          min-height: 44px;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        .tema1-btn-primary:hover {
          background: #1a1a1a;
          box-shadow: 0 5px 16px rgba(0,0,0,0.28);
          transform: translateY(-1px);
        }
        .tema1-btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid rgba(176,209,42,0.5);
          color: #b0d12a;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 14px;
          border-radius: 50px;
          padding: 10px 22px;
          min-height: 44px;
          cursor: pointer;
          transition: all 0.2s;
        }

        /* ── Modal ── */
        .tema1-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: tema1FadeIn 0.25s ease;
        }
        .tema1-modal-box {
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 32px 80px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: tema1SlideUp 0.35s ease;
        }
        .tema1-modal-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, rgba(176,209,42,0.15), rgba(176,209,42,0.05));
          border-bottom: 2px solid rgba(176,209,42,0.5);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .tema1-modal-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #b0d12a, #8aaa10);
          box-shadow: 0 4px 12px rgba(176,209,42,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tema1-modal-title {
          font-size: 17px;
          font-weight: 800;
          color: #000;
        }
        .tema1-modal-subtitle {
          font-size: 11px;
          font-weight: 600;
          color: rgba(0,0,0,0.45);
          margin-top: 2px;
        }
        .tema1-modal-close {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(0,0,0,0.5);
          font-size: 14px;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .tema1-modal-close:hover {
          background: rgba(0,0,0,0.1);
          color: #000;
        }
        .tema1-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }
        .tema1-modal-section {
          margin-bottom: 20px;
        }
        .tema1-modal-section-head {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #2e2e33;
          margin-bottom: 14px;
        }
        .tema1-modal-bar {
          width: 4px;
          height: 18px;
          border-radius: 2px;
        }
        .tema1-modal-preview {
          background: linear-gradient(135deg, rgba(176,209,42,0.08), rgba(176,209,42,0.03));
          border: 1px solid rgba(176,209,42,0.2);
          border-radius: 14px;
          padding: 14px 18px;
        }
        .tema1-modal-preview-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 700;
          color: rgba(0,0,0,0.4);
          margin-bottom: 10px;
        }
        .tema1-modal-preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          font-size: 13px;
          color: rgba(0,0,0,0.45);
        }
        .tema1-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.98);
          flex-shrink: 0;
        }
        .tema1-modal-submit {
          width: 100%;
          background: #000;
          color: #ececed;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 15px;
          border: none;
          border-radius: 12px;
          padding: 13px;
          min-height: 44px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        }
        .tema1-modal-submit:hover {
          background: #1a1a1a;
          box-shadow: 0 5px 16px rgba(0,0,0,0.28);
        }

        /* ── Animations ── */
        @keyframes tema1FadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tema1SlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* ── Responsive ── */
        @media (max-width: 767.98px) {
          .tema1-page {
            padding: 20px 14px;
          }
          .tema1-glass-card {
            padding: 16px 14px;
          }
          .tema1-kpi-card {
            padding: 18px 16px;
          }
          .tema1-summary-value {
            font-size: 18px;
          }
          .tema1-modal-box {
            max-width: 100%;
            max-height: 95vh;
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
}
