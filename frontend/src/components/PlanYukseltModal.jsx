/**
 * PlanYukseltModal — Kısıtlı Özellik Yükseltme Modalı
 *
 * Props:
 *   goster      (bool)     — modal görünür mü
 *   kapat       (function) — kapatma callback'i
 *   ozellikAdi  (string)   — "PDF Rapor" gibi kısıtlanan özellik
 *   kampanyaAktif (bool)   — lansman kampanyası devam ediyor mu
 *   mevcutPlan  (string)   — 'ucretsiz' | 'standart' | 'kurumsal'
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
const FIYATLAR = {
  standart: { aylik: 399.90, yillik: 3499.00 },
  kurumsal: { aylik: 749.90, yillik: 6490.00 },
}
const KAMPANYA_FIYAT = 99.90

const fmt = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n)

export default function PlanYukseltModal({ goster, kapat, ozellikAdi = 'Bu özellik', kampanyaAktif = false, mevcutPlan = 'ucretsiz' }) {
  const navigate = useNavigate()
  const p = 'p'

  const [yillik, setYillik] = useState(false)

  // ESC ile kapat
  useEffect(() => {
    if (!goster) return
    const handler = (e) => { if (e.key === 'Escape') kapat() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [goster, kapat])

  if (!goster) return null

  const standartFiyat = yillik
    ? (kampanyaAktif ? KAMPANYA_FIYAT : Math.round(FIYATLAR.standart.yillik / 12 * 100) / 100)
    : (kampanyaAktif ? KAMPANYA_FIYAT : FIYATLAR.standart.aylik)

  const kurumFiyat = yillik
    ? Math.round(FIYATLAR.kurumsal.yillik / 12 * 100) / 100
    : FIYATLAR.kurumsal.aylik

  const standartTasarruf = fmt(FIYATLAR.standart.aylik * 12 - FIYATLAR.standart.yillik)
  const kurumTasarruf = fmt(FIYATLAR.kurumsal.aylik * 12 - FIYATLAR.kurumsal.yillik)

  const planlar = [
    {
      id: 'ucretsiz',
      ad: 'Ücretsiz',
      ikon: 'bi-gift',
      fiyat: 0,
      birim: 'sonsuza kadar',
      ozellikler: ['Cari yönetimi', 'Çek/Senet takibi', 'Kasa yönetimi', 'Ödeme takibi', 'Vade hesaplayıcı'],
      kisit: ['PDF/Excel rapor yok', 'Tek kullanıcı'],
      renk: '#9CA3AF',
    },
    {
      id: 'standart',
      ad: 'Standart',
      ikon: 'bi-star-fill',
      fiyat: standartFiyat,
      fiyatYillik: FIYATLAR.standart.yillik,
      birim: '/ay',
      ozellikler: ['Her şey ücretsizde', 'PDF ve Excel raporlar', 'Veri dışa aktarma', '3 kullanıcıya kadar'],
      renk: '#10B981',
      kampanya: kampanyaAktif,
      tasarruf: standartTasarruf,
      onerilen: true,
    },
    {
      id: 'kurumsal',
      ad: 'Kurumsal',
      ikon: 'bi-building-fill',
      fiyat: kurumFiyat,
      fiyatYillik: FIYATLAR.kurumsal.yillik,
      birim: '/ay',
      ozellikler: ['Her şey standartta', 'Sınırsız kullanıcı', 'Yapay zeka asistanı', 'API erişimi', 'Öncelikli destek'],
      renk: '#3b82f6',
      tasarruf: kurumTasarruf,
    },
  ]

  return (
    <>
      <style>{`
        .abn-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 1050;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: abnFadeIn 0.15s ease;
        }
        .abn-modal-box {
          width: 100%; max-width: 780px; max-height: 90vh;
          display: flex; flex-direction: column;
          border-radius: 20px; overflow: hidden;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          box-shadow: 0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(16,185,129,0.08);
          animation: abnSlideUp 0.25s ease;
        }
        .abn-modal-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04));
          border-bottom: 1px solid rgba(16,185,129,0.2);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .abn-modal-body {
          padding: 24px; overflow-y: auto; flex: 1;
        }
        .abn-modal-footer {
          padding: 14px 24px;
          border-top: 1px solid #E5E7EB;
          background: #F9FAFB;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .abn-close-btn {
          background: #F3F4F6;
          border: 1px solid #E5E7EB;
          width: 36px; height: 36px; border-radius: 10px;
          color: #6B7280; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .abn-close-btn:hover { background: #E5E7EB; color: #111827; }
        .abn-toggle-row {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          margin-bottom: 20px;
        }
        .abn-toggle-label {
          font-size: 13px; font-weight: 600;
          color: #9CA3AF; cursor: pointer; transition: color 0.15s;
        }
        .abn-toggle-label.aktif { color: #111827; }
        .abn-toggle-switch {
          position: relative; width: 44px; height: 24px;
          background: #E5E7EB;
          border-radius: 50px; cursor: pointer;
          border: 1px solid #D1D5DB;
          transition: background 0.2s;
        }
        .abn-toggle-switch.on { background: #10B981; }
        .abn-toggle-knob {
          position: absolute; top: 3px; left: 3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; transition: transform 0.2s;
        }
        .abn-toggle-switch.on .abn-toggle-knob { transform: translateX(20px); }
        .abn-plan-card {
          border-radius: 16px; padding: 20px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          transition: all 0.2s;
          position: relative; overflow: hidden;
          height: 100%;
        }
        .abn-plan-card:hover {
          border-color: #D1D5DB;
          background: #F9FAFB;
        }
        .abn-plan-card.aktif-plan {
          border-color: #10B981;
          background: rgba(16,185,129,0.03);
        }
        .abn-plan-card.onerilen {
          border-color: rgba(16,185,129,0.4);
          background: rgba(16,185,129,0.03);
        }
        .abn-plan-badge {
          font-size: 10px; font-weight: 700; padding: 3px 8px;
          border-radius: 20px; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .abn-plan-price-val {
          font-family: 'Inter', sans-serif;
          font-size: 28px; font-weight: 800; color: #111827; line-height: 1;
        }
        .abn-plan-feature {
          font-size: 12px; color: #374151;
          display: flex; align-items: flex-start; gap: 7px;
          margin-bottom: 7px; line-height: 1.4;
        }
        .abn-plan-feature i { color: #10b981; font-size: 12px; margin-top: 1px; flex-shrink: 0; }
        .abn-plan-feature.kisit i { color: #D1D5DB; }
        .abn-plan-feature.kisit { color: #9CA3AF; }
        .abn-btn-abone {
          display: block; width: 100%; min-height: 44px;
          border-radius: 10px; border: none; cursor: pointer;
          font-size: 13px; font-weight: 700;
          transition: all 0.15s; margin-top: 16px;
        }
        .abn-btn-abone.primary {
          background: linear-gradient(135deg, #10B981, #059669);
          color: #fff;
          box-shadow: 0 4px 14px rgba(16,185,129,0.3);
        }
        .abn-btn-abone.primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(16,185,129,0.4); }
        .abn-btn-abone.mavi {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #fff;
          box-shadow: 0 4px 14px rgba(59,130,246,0.3);
        }
        .abn-btn-abone.mavi:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(59,130,246,0.4); }
        .abn-btn-abone.pasif {
          background: #F3F4F6;
          border: 1px solid #E5E7EB;
          color: #9CA3AF; cursor: default;
        }
        .abn-kampanya-rozet {
          background: linear-gradient(135deg, #10B981, #059669);
          color: #fff; font-size: 10px; font-weight: 800;
          padding: 4px 10px; border-radius: 20px;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .abn-tasarruf-chip {
          background: rgba(16,185,129,0.12);
          color: #10b981; font-size: 10px; font-weight: 700;
          padding: 3px 8px; border-radius: 20px;
          border: 1px solid rgba(16,185,129,0.2);
        }
        @keyframes abnFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes abnSlideUp {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (max-width: 767px) {
          .abn-modal-box { border-radius: 20px 20px 0 0; max-height: 90vh; }
          .abn-modal-backdrop { align-items: flex-end; padding: 0; }
          .abn-modal-body { padding: 16px; }
        }
      `}</style>

      <div className="abn-modal-backdrop" onClick={kapat}>
        <div className="abn-modal-box" onClick={(e) => e.stopPropagation()}>

          {/* HEADER */}
          <div className="abn-modal-header">
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'linear-gradient(135deg,#10B981,#059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
              }}>
                <i className="bi bi-lock-fill" style={{ color: '#fff', fontSize: 18 }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                  {ozellikAdi} ücretli planlara açık
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  Planınızı yükseltin, bu özelliği hemen kullanın
                </div>
              </div>
            </div>
            <button className="abn-close-btn" onClick={kapat}>
              <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
            </button>
          </div>

          {/* BODY */}
          <div className="abn-modal-body">

            {/* Dönem Toggle */}
            <div className="abn-toggle-row">
              <span className={`abn-toggle-label ${!yillik ? 'aktif' : ''}`} onClick={() => setYillik(false)}>Aylık</span>
              <div className={`abn-toggle-switch ${yillik ? 'on' : ''}`} onClick={() => setYillik(!yillik)}>
                <div className="abn-toggle-knob" />
              </div>
              <span className={`abn-toggle-label ${yillik ? 'aktif' : ''}`} onClick={() => setYillik(true)}>
                Yıllık
                <span className="abn-tasarruf-chip ms-2">Tasarruf et</span>
              </span>
            </div>

            {/* Plan Kartları */}
            <div className="row g-3">
              {planlar.map((plan) => {
                const aktif = mevcutPlan === plan.id
                return (
                  <div key={plan.id} className="col-12 col-md-4">
                    <div className={`abn-plan-card ${aktif ? 'aktif-plan' : ''} ${plan.onerilen ? 'onerilen' : ''}`}>

                      {/* Rozet satırı */}
                      <div className="d-flex align-items-center justify-content-between mb-3" style={{ minHeight: 22 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {aktif && (
                            <span className="abn-plan-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                              Aktif Plan
                            </span>
                          )}
                          {plan.onerilen && !aktif && (
                            <span className="abn-plan-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                              Önerilen
                            </span>
                          )}
                        </div>
                        {plan.kampanya && !yillik && (
                          <span className="abn-kampanya-rozet">🎉 Kampanya</span>
                        )}
                      </div>

                      {/* Plan adı + ikon */}
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: `${plan.renk}20`,
                          border: `1px solid ${plan.renk}35`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className={`bi ${plan.ikon}`} style={{ color: plan.renk, fontSize: 14 }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{plan.ad}</span>
                      </div>

                      {/* Fiyat */}
                      <div className="mb-1">
                        {plan.id === 'ucretsiz' ? (
                          <div className="abn-plan-price-val">Ücretsiz</div>
                        ) : (
                          <>
                            {plan.kampanya && !yillik && (
                              <div style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through', fontFamily: 'Inter' }}>
                                {fmt(FIYATLAR.standart.aylik)}₺/ay
                              </div>
                            )}
                            <div className="d-flex align-items-baseline gap-1">
                              <span className="abn-plan-price-val">{fmt(plan.fiyat)}</span>
                              <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>₺{plan.birim}</span>
                            </div>
                            {yillik && (
                              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                                Yıllık {fmt(plan.fiyatYillik)}₺ — <span style={{ color: '#10b981' }}>{plan.tasarruf}₺ tasarruf</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div style={{ height: 1, background: '#E5E7EB', margin: '14px 0' }} />

                      {/* Özellik listesi */}
                      <div>
                        {plan.ozellikler.map((oz) => (
                          <div key={oz} className="abn-plan-feature">
                            <i className="bi bi-check-circle-fill" />
                            <span>{oz}</span>
                          </div>
                        ))}
                        {plan.kisit?.map((k) => (
                          <div key={k} className="abn-plan-feature kisit">
                            <i className="bi bi-x-circle-fill" />
                            <span>{k}</span>
                          </div>
                        ))}
                      </div>

                      {/* Buton */}
                      {plan.id === 'ucretsiz' ? (
                        <button className="abn-btn-abone pasif" disabled>
                          {aktif ? 'Mevcut Planınız' : 'Ücretsiz'}
                        </button>
                      ) : plan.id === 'standart' ? (
                        <button
                          className="abn-btn-abone primary"
                          onClick={() => { kapat(); navigate('/abonelik') }}
                        >
                          <i className="bi bi-arrow-up-circle me-2" />
                          {aktif ? 'Planı Yönet' : 'Standart\'a Geç'}
                        </button>
                      ) : (
                        <button
                          className="abn-btn-abone mavi"
                          onClick={() => { kapat(); navigate('/abonelik') }}
                        >
                          <i className="bi bi-building me-2" />
                          {aktif ? 'Planı Yönet' : 'Kurumsal\'a Geç'}
                        </button>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>

          </div>

          {/* FOOTER */}
          <div className="abn-modal-footer">
            <button
              onClick={kapat}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9CA3AF', fontSize: 13, fontWeight: 500,
              }}
            >
              <i className="bi bi-x me-1" />
              Şimdi değil
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
