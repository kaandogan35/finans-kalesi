/**
 * PlanSecim — Abonelik Yönetim Sayfası
 * Route: /abonelik
 * v2: 30 gün deneme + Standart 290₺ / Kurumsal 490₺
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import useAuthStore from '../../stores/authStore'
import { abonelikApi } from '../../api/abonelik'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'

const FIYATLAR = {
  standart: { aylik: 290.00, yillik: 2900.00 },
  kurumsal: { aylik: 490.00, yillik: 4900.00 },
}

const fmt = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(n)
const tarihFmt = (t) => t ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(t)) : '—'

const DURUM_MAP = {
  tamamlandi: { etiket: 'Tamamlandı', cls: 'abn-badge-success' },
  bekliyor:   { etiket: 'Bekliyor',   cls: 'abn-badge-warning' },
  iptal:      { etiket: 'İptal',      cls: 'abn-badge-danger'  },
  iade:       { etiket: 'İade',       cls: 'abn-badge-info'    },
}

const KANAL_MAP = { web: 'Web', apple: 'App Store', google: 'Google Play' }

export default function PlanSecim() {
  const p = 'p'
  const { plan: jwtPlan } = usePlanKontrol()

  const [yukleniyor, setYukleniyor] = useState(true)
  const [gecmisYukleniyor, setGecmisYukleniyor] = useState(true)
  const [durum, setDurum] = useState(null)
  const [gecmis, setGecmis] = useState([])
  const [yillik, setYillik] = useState(false)

  useEffect(() => {
    const durumAl = async () => {
      try {
        const res = await abonelikApi.durum()
        setDurum(res.data.veri)
      } catch {
        toast.error('Plan bilgisi yüklenemedi')
      } finally {
        setYukleniyor(false)
      }
    }
    const gecmisAl = async () => {
      try {
        const res = await abonelikApi.gecmis()
        setGecmis(res.data.veri.gecmis || [])
      } catch { /* sessiz */ } finally {
        setGecmisYukleniyor(false)
      }
    }
    durumAl()
    gecmisAl()
  }, [])

  // API'den gelen plan yetkili kaynak; yüklenene kadar JWT'deki plan kullanılır
  const plan = durum?.plan || jwtPlan
  const denemeDoldu = durum?.deneme_doldu || false
  const denemeKalanGun = durum?.deneme_kalan_gun ?? null
  const standartGosterilen = yillik
    ? Math.round(FIYATLAR.standart.yillik / 12 * 100) / 100
    : FIYATLAR.standart.aylik
  const kurumGosterilen = yillik
    ? Math.round(FIYATLAR.kurumsal.yillik / 12 * 100) / 100
    : FIYATLAR.kurumsal.aylik

  const planlar = [
    {
      id: 'deneme', ad: '30 Gün Deneme', ikon: 'bi-gift', btnSinif: 'pasif',
      aciklama: 'Tüm özellikleri 30 gün boyunca ücretsiz deneyin',
      ozellikler: [
        '30 gün tüm özellikler açık',
        '2 kullanıcıya kadar',
        'Sınırsız cari hesap',
        '50 çek/senet kaydı (aylık)',
        'Sınırsız kasa yönetimi',
        'PDF & Excel rapor',
      ],
      kisitlamalar: [
        '30 gün sonra plan seçimi gerekir',
      ],
    },
    {
      id: 'standart', ad: 'Standart', ikon: 'bi-star-fill', btnSinif: 'primary',
      aciklama: 'Büyüyen işletmeler için tam özellik seti',
      fiyat: standartGosterilen, fiyatYillik: FIYATLAR.standart.yillik,
      tasarruf: fmt(FIYATLAR.standart.aylik * 12 - FIYATLAR.standart.yillik),
      onerilen: true,
      ozellikler: [
        '2 kullanıcıya kadar',
        'Sınırsız cari hesap',
        '50 çek/senet kaydı (aylık, sıfırlanır)',
        'Sınırsız kasa yönetimi',
        'Ödeme takibi',
        'Vade hesaplayıcı',
        'PDF & Excel rapor',
        'Veri dışa aktarma',
        'WhatsApp desteği',
      ],
    },
    {
      id: 'kurumsal', ad: 'Kurumsal', ikon: 'bi-building-fill', btnSinif: 'mavi',
      aciklama: 'Büyük ekipler için tam kontrol ve öncelikli destek',
      fiyat: kurumGosterilen, fiyatYillik: FIYATLAR.kurumsal.yillik,
      tasarruf: fmt(FIYATLAR.kurumsal.aylik * 12 - FIYATLAR.kurumsal.yillik),
      ozellikler: [
        '10 kullanıcıya kadar',
        'Sınırsız her şey',
        'Tüm Standart özellikler',
        'Gelişmiş raporlama & analiz',
        'Özel entegrasyon desteği',
        'Şirket bazlı yetkilendirme',
        'Öncelikli 7/24 destek',
      ],
    },
  ]

  return (
    <div className="abn-page">

        {/* SAYFA BAŞLIĞI */}
        <div className="mb-4">
          <div className={`${p}-abn-page-title`}>
            <i className="bi bi-credit-card me-2" />
            Abonelik Yönetimi
          </div>
          <div className={`${p}-abn-page-sub`}>Planınızı yönetin, işletmenizi büyütün</div>
        </div>

        {/* DENEME SÜRESİ BANNER */}
        {plan === 'deneme' && !yukleniyor && (
          <div className={`abn-deneme-banner ${denemeDoldu ? 'doldu' : ''}`}>
            <i className={`bi ${denemeDoldu ? 'bi-exclamation-triangle-fill' : 'bi-clock-fill'}`}
               style={{ fontSize: 22, color: denemeDoldu ? '#dc2626' : '#d97706' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: denemeDoldu ? '#991b1b' : '#92400e', marginBottom: 2 }}>
                {denemeDoldu
                  ? 'Deneme süreniz doldu'
                  : `Deneme süreniz: ${denemeKalanGun} gün kaldı`
                }
              </div>
              <div style={{ fontSize: 12, color: denemeDoldu ? '#b91c1c' : '#a16207' }}>
                {denemeDoldu
                  ? 'Verileriniz güvende ancak yeni kayıt ekleyemezsiniz. Devam etmek için bir plan satın alın.'
                  : 'Tüm özellikler açık. Süre dolmadan bir plan seçerek kesintisiz devam edin.'
                }
              </div>
            </div>
            <span className={`abn-deneme-chip ${denemeDoldu ? 'doldu' : ''}`}>
              {denemeDoldu ? 'Süre Doldu' : `${denemeKalanGun} Gün`}
            </span>
          </div>
        )}

        {/* HERO — Satış odaklı */}
        <div className={`${p}-abn-hero`}>
          <div className="row align-items-center">
            <div className="col-12 col-md-8">
              <div style={{ fontSize: 11, fontWeight: 700, opacity: .75, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                ParamGo Premium
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, marginBottom: 8, color: '#fff' }}>
                Tüm finans süreçleriniz tek platformda — hiçbir şey gözden kaçmasın
              </div>
              <div style={{ fontSize: 13, opacity: .75, lineHeight: 1.6, color: '#fff' }}>
                Cari hesaplar, çek/senet, ödeme takibi, kasa ve daha fazlası.
              </div>
            </div>
            <div className="col-12 col-md-4 d-none d-md-flex justify-content-end align-items-center gap-4 mt-3 mt-md-0">
              <div className={`${p}-abn-hero-stat`} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#fff' }}>30 Gün</div>
                <div style={{ fontSize: 11, marginTop: 3, color: '#fff', opacity: .65 }}>Ücretsiz Deneme</div>
              </div>
              <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.2)' }} />
              <div className={`${p}-abn-hero-stat`} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#fff' }}>%99</div>
                <div style={{ fontSize: 11, marginTop: 3, color: '#fff', opacity: .65 }}>Memnuniyet</div>
              </div>
            </div>
          </div>
        </div>

        {/* MEVCUT PLAN */}
        <div className={`${p}-abn-current-card`}>
          {yukleniyor ? (
            <div className="d-flex gap-3 align-items-center">
              <div className={`${p}-abn-skel`} style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
              <div>
                <div className={`${p}-abn-skel`} style={{ width: 80, height: 12, marginBottom: 8 }} />
                <div className={`${p}-abn-skel`} style={{ width: 140, height: 20 }} />
              </div>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className={`${p}-abn-icon-box`} style={{ flexShrink: 0 }}>
                <i className="bi bi-award-fill" style={{ color: '#fff', fontSize: 20 }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className={`${p}-abn-current-label`}>Mevcut Plan</div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className={`${p}-abn-current-name`}>{durum?.plan_adi || '30 Gün Deneme'}</span>
                </div>
              </div>
              {(durum?.bitis_tarihi || durum?.odeme_kanali || durum?.deneme_bitis) && (
                <div className="d-flex gap-4 flex-wrap ms-auto">
                  {durum?.deneme && durum?.deneme_bitis && (
                    <div>
                      <div className={`${p}-abn-meta-label`}>DENEME BİTİŞ</div>
                      <div className={`${p}-abn-meta-value`}>{tarihFmt(durum.deneme_bitis)}</div>
                    </div>
                  )}
                  {!durum?.deneme && durum?.bitis_tarihi && (
                    <div>
                      <div className={`${p}-abn-meta-label`}>BİTİŞ TARİHİ</div>
                      <div className={`${p}-abn-meta-value`}>{tarihFmt(durum.bitis_tarihi)}</div>
                    </div>
                  )}
                  {durum?.odeme_kanali && (
                    <div>
                      <div className={`${p}-abn-meta-label`}>ÖDEME KANALI</div>
                      <div className={`${p}-abn-meta-value`}>{KANAL_MAP[durum.odeme_kanali] || durum.odeme_kanali}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PLAN SEÇİMİ */}
        <div className={`${p}-abn-section-title`}>Plan Seçin</div>

        {/* Dönem toggle */}
        <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
          <span
            className={`${p}-abn-toggle-label ${!yillik ? 'aktif' : ''}`}
            onClick={() => setYillik(false)}
          >Aylık</span>
          <div
            className={`abn-toggle-switch ${p}-abn-toggle-sw ${yillik ? 'on' : ''}`}
            onClick={() => setYillik(v => !v)}
          >
            <div className="abn-toggle-knob" />
          </div>
          <span
            className={`${p}-abn-toggle-label ${yillik ? 'aktif' : ''}`}
            onClick={() => setYillik(true)}
          >
            Yıllık
            <span className="abn-tasarruf-chip ms-2">%17 Tasarruf</span>
          </span>
        </div>

        <div className="row g-3 mb-4">
          {planlar.map((pl) => {
            const aktif = plan === pl.id
            const iconBoxCls = pl.id === 'deneme'
              ? `${p}-abn-icon-deneme`
              : `p-abn-icon-${pl.id}`
            const iconColor = pl.id === 'standart'
              ? 'var(--p-color-primary)'
              : pl.id === 'kurumsal'
              ? 'var(--p-color-primary-dark)'
              : undefined

            return (
              <div key={pl.id} className="col-12 col-md-4">
                <div className={`${p}-abn-plan-card ${aktif ? 'aktif-plan' : ''} ${pl.onerilen && !aktif ? 'onerilen' : ''}`}>

                  {/* Rozet satırı */}
                  <div className="d-flex align-items-center justify-content-between mb-3" style={{ minHeight: 24 }}>
                    <div className="d-flex gap-2">
                      {aktif && <span className={`${p}-abn-badge-active`}>✓ Aktif Plan</span>}
                      {pl.onerilen && !aktif && <span className={`${p}-abn-badge-rec`}>★ Önerilen</span>}
                    </div>
                  </div>

                  {/* İkon + Ad */}
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <div
                      className={iconBoxCls}
                      style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <i
                        className={`bi ${pl.ikon}`}
                        style={{ fontSize: 14, color: iconColor || 'var(--p-text-muted)' }}
                      />
                    </div>
                    <span className={`${p}-abn-plan-name`}>{pl.ad}</span>
                  </div>
                  {pl.aciklama && (
                    <div style={{ fontSize: 12, color: 'var(--p-text-muted)', marginBottom: 12 }}>{pl.aciklama}</div>
                  )}

                  {/* Fiyat */}
                  <div className="mb-2">
                    {pl.id === 'deneme' ? (
                      <div className={`${p}-abn-plan-price`}>Ücretsiz</div>
                    ) : (
                      <>
                        <div className="d-flex align-items-baseline gap-1">
                          <span className={`${p}-abn-plan-price`}>{fmt(pl.fiyat)}</span>
                          <span className={`${p}-abn-price-unit`}>₺/ay</span>
                        </div>
                        {yillik && pl.fiyatYillik && (
                          <div className={`${p}-abn-yearly-note`}>
                            Yılda {fmt(pl.fiyatYillik)}₺ —{' '}
                            <span className={`${p}-abn-savings`}>{pl.tasarruf}₺ tasarruf</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className={`${p}-abn-sep`} />

                  {/* Özellikler */}
                  <div>
                    {pl.ozellikler.map((oz) => (
                      <div key={oz} className={`${p}-abn-feature`}>
                        <i className="bi bi-check-circle-fill" />
                        <span>{oz}</span>
                      </div>
                    ))}
                    {pl.kisitlamalar?.map((k) => (
                      <div key={k} className={`${p}-abn-feature kisit`}>
                        <i className="bi bi-x-circle-fill" />
                        <span>{k}</span>
                      </div>
                    ))}
                  </div>

                  {/* Buton */}
                  {aktif ? (
                    <button className={`${p}-abn-btn-pasif`} disabled>✓ Mevcut Planınız</button>
                  ) : pl.id === 'deneme' ? (
                    <button className={`${p}-abn-btn-pasif`} disabled>Ücretsiz Deneme</button>
                  ) : (
                    <button
                      className={`abn-btn ${pl.id === 'standart' ? 'yesil-standart' : 'yesil-kurumsal'}`}
                      onClick={() => toast.info('Ödeme sistemi yakında entegre edilecek. Detaylar için bizimle iletişime geçin.')}
                    >
                      <i className="bi bi-arrow-up-circle me-2" />
                      {pl.ad}&#39;a Geç
                    </button>
                  )}

                </div>
              </div>
            )
          })}
        </div>

        {/* iOS/Android notu */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-color-primary)' }}>
            <i className="bi bi-phone-fill me-2" />
            Web'den aldığınız abonelik iOS ve Android uygulamasında da geçerlidir.
          </span>
        </div>

        {/* ÖDEME GEÇMİŞİ */}
        <div className={`${p}-abn-section-title mt-2`}>Ödeme Geçmişi</div>
        <div className={`${p}-abn-card`}>
          {gecmisYukleniyor ? (
            <div style={{ padding: 24 }}>
              {[60, 80, 50].map((w, i) => (
                <div key={i} className={`${p}-abn-skel`} style={{ height: 16, width: `${w}%`, marginBottom: i < 2 ? 10 : 0 }} />
              ))}
            </div>
          ) : gecmis.length === 0 ? (
            <div className={`${p}-empty-state`}>
              <i className="bi bi-receipt" />
              <h6>Henüz ödeme geçmişi yok</h6>
              <p>Abonelik aldığınızda burada görünecek</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle p-table mb-0">
                <thead>
                  <tr>
                    {['Tarih', 'Plan', 'Dönem', 'Tutar', 'Kanal', 'Durum'].map((h) => (
                      <th key={h} className={`${p}-abn-th`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gecmis.map((kayit) => {
                    const d = DURUM_MAP[kayit.durum] || { etiket: kayit.durum, cls: 'abn-badge-info' }
                    return (
                      <tr key={kayit.id}>
                        <td className={`${p}-abn-td`}>{tarihFmt(kayit.odeme_tarihi || kayit.olusturma_tarihi)}</td>
                        <td className={`${p}-abn-td-bold`}>{kayit.plan_adi === 'standart' ? 'Standart' : 'Kurumsal'}</td>
                        <td className={`${p}-abn-td`}>{kayit.odeme_donemi === 'yillik' ? 'Yıllık' : 'Aylık'}</td>
                        <td className={`${p}-abn-td`} style={{ color: `var(--${p}-color-success)`, fontWeight: 700 }}>{fmt(kayit.tutar)}₺</td>
                        <td className={`${p}-abn-td`}>{KANAL_MAP[kayit.odeme_kanali] || '—'}</td>
                        <td className={`${p}-abn-td`}><span className={d.cls}>{d.etiket}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
  )
}
