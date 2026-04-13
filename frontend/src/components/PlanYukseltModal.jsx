/**
 * PlanYukseltModal — Kısıtlı Özellik Yükseltme Modalı
 *
 * Props:
 *   goster      (bool)     — modal görünür mü
 *   kapat       (function) — kapatma callback'i
 *   ozellikAdi  (string)   — "PDF Rapor" gibi kısıtlanan özellik
 *   mevcutPlan  (string)   — 'deneme' | 'standart' | 'kurumsal'
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
const FIYATLAR = {
  standart: { aylik: 290, yillik: 2900 },
  kurumsal: { aylik: 490, yillik: 4900 },
}

const fmt = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n)

export default function PlanYukseltModal({ goster, kapat, ozellikAdi = 'Bu özellik', mevcutPlan = 'deneme' }) {
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
    ? Math.round(FIYATLAR.standart.yillik / 12 * 100) / 100
    : FIYATLAR.standart.aylik

  const kurumFiyat = yillik
    ? Math.round(FIYATLAR.kurumsal.yillik / 12 * 100) / 100
    : FIYATLAR.kurumsal.aylik

  const standartTasarruf = fmt(FIYATLAR.standart.aylik * 12 - FIYATLAR.standart.yillik)
  const kurumTasarruf = fmt(FIYATLAR.kurumsal.aylik * 12 - FIYATLAR.kurumsal.yillik)

  const planlar = [
    {
      id: 'deneme',
      ad: '7 Gün Deneme',
      ikon: 'bi-clock-history',
      fiyat: 0,
      birim: '7 gün',
      ozellikler: ['Sınırsız cari hesap', 'Çek/Senet takibi (50)', 'Kasa yönetimi', 'Ödeme takibi', 'Vade hesaplayıcı'],
      kisit: ['PDF/Excel rapor yok', '2 kullanıcıya kadar', 'Veri dışa aktarma yok'],
      renk: '#9CA3AF',
    },
    {
      id: 'standart',
      ad: 'Standart',
      ikon: 'bi-star-fill',
      fiyat: standartFiyat,
      fiyatYillik: FIYATLAR.standart.yillik,
      birim: '/ay',
      ozellikler: ['Denemede olan her şey', 'Sınırsız cari hesap', 'PDF ve Excel raporlar', 'Veri dışa aktarma', '2 kullanıcıya kadar', 'WhatsApp desteği'],
      renk: '#10B981',
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
      ozellikler: ['Her şey standartta', '10 kullanıcıya kadar', 'Gelişmiş raporlama & analiz', 'Özel entegrasyon desteği', 'Şirket bazlı yetkilendirme', 'Öncelikli 7/24 destek'],
      renk: '#3b82f6',
      tasarruf: kurumTasarruf,
    },
  ]

  return (
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
                        {plan.id === 'deneme' ? (
                          <div className="abn-plan-price-val">Ücretsiz</div>
                        ) : (
                          <>
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
                      {plan.id === 'deneme' ? (
                        <button className="abn-btn-abone pasif" disabled>
                          {aktif ? 'Mevcut Planınız' : 'Deneme'}
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
  )
}
