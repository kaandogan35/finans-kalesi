/**
 * PlanSecim — Abonelik Yönetim Sayfası
 * Route: /abonelik
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import useAuthStore from '../../stores/authStore'
import { abonelikApi } from '../../api/abonelik'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'

const FIYATLAR = {
  standart: { aylik: 399.90, yillik: 3499.00 },
  kurumsal: { aylik: 749.90, yillik: 6490.00 },
}
const KAMPANYA_FIYAT = 99.90

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
  const { plan } = usePlanKontrol()

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

  const kampanyaAktif = durum?.kampanya_kullanici || false
  const standartGosterilen = yillik
    ? Math.round(FIYATLAR.standart.yillik / 12 * 100) / 100
    : (kampanyaAktif ? KAMPANYA_FIYAT : FIYATLAR.standart.aylik)
  const kurumGosterilen = yillik
    ? Math.round(FIYATLAR.kurumsal.yillik / 12 * 100) / 100
    : FIYATLAR.kurumsal.aylik

  const planlar = [
    {
      id: 'ucretsiz', ad: 'Başlangıç', ikon: 'bi-gift', btnSinif: 'pasif',
      aciklama: 'Yeni başlayanlar için temel özellikler',
      ozellikler: [
        '1 kullanıcı',
        '30 cari hesap',
        '10 çek/senet kaydı (aylık, sıfırlanır)',
        'Kasa yönetimi (1 yıl ücretsiz deneme)',
        'Ödeme takibi',
        'Vade hesaplayıcı',
      ],
      kisitlamalar: [
        'PDF & Excel rapor (Standart\'ta mevcut)',
        'Çoklu kullanıcı (Standart\'ta mevcut)',
      ],
    },
    {
      id: 'standart', ad: 'Standart', ikon: 'bi-star-fill', btnSinif: 'primary',
      aciklama: 'Büyüyen işletmeler için tam özellik seti',
      fiyat: standartGosterilen, fiyatYillik: FIYATLAR.standart.yillik,
      tasarruf: fmt(FIYATLAR.standart.aylik * 12 - FIYATLAR.standart.yillik),
      onerilen: true, kampanya: kampanyaAktif && !yillik,
      ozellikler: [
        '2 kullanıcıya kadar',
        'Sınırsız cari hesap',
        '50 çek/senet kaydı (aylık, sıfırlanır)',
        'Sınırsız kasa yönetimi',
        'Ödeme takibi',
        'Vade hesaplayıcı',
        'PDF & Excel rapor',
        'Veri dışa aktarma',
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
        'Öncelikli destek',
      ],
    },
  ]

  return (
    <>
      <style>{`
        /* ── SHARED ─────────────────────────────────────────────── */
        .abn-page { padding: 28px 24px; max-width: 1100px; }
        .abn-btn {
          display: block; width: 100%; min-height: 44px; border-radius: 10px;
          border: none; cursor: pointer; font-size: 13px; font-weight: 700;
          margin-top: 16px; transition: all 0.15s;
        }
        .abn-btn.primary { background: linear-gradient(135deg,#10B981,#059669); color:#fff; box-shadow:0 4px 14px rgba(16,185,129,0.3); }
        .abn-btn.primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(16,185,129,0.4); }
        .abn-btn.mavi  { background: linear-gradient(135deg,#3b82f6,#2563eb); color:#fff; box-shadow:0 4px 14px rgba(59,130,246,0.3); }
        .abn-btn.mavi:hover  { transform:translateY(-1px); box-shadow:0 6px 18px rgba(59,130,246,0.4); }
        /* ParamGo tema butonları — yeşil tonları */
        .abn-btn.yesil-standart { background: linear-gradient(135deg, var(--p-color-primary), var(--p-color-primary-dark)); color:var(--p-text-on-primary); box-shadow:0 4px 14px rgba(16,185,129,0.3); }
        .abn-btn.yesil-standart:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(16,185,129,0.4); }
        .abn-btn.yesil-kurumsal { background: linear-gradient(135deg, var(--p-color-primary-dark), var(--p-color-accent)); color:var(--p-text-on-primary); box-shadow:0 4px 14px rgba(5,150,105,0.3); }
        .abn-btn.yesil-kurumsal:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(5,150,105,0.4); }
        .abn-toggle-switch {
          position:relative; width:44px; height:24px;
          border-radius:50px; cursor:pointer; transition:background 0.2s;
        }
        .abn-toggle-knob {
          position:absolute; top:3px; left:3px; width:16px; height:16px;
          border-radius:50%; background:#fff; transition:transform 0.2s;
          box-shadow:0 1px 3px rgba(0,0,0,0.2);
        }
        .abn-toggle-switch.on .abn-toggle-knob { transform:translateX(20px); }
        .abn-kampanya-chip {
          background:linear-gradient(135deg,#10B981,#059669);
          color:#fff; font-size:10px; font-weight:800; padding:3px 10px;
          border-radius:20px; white-space:nowrap;
        }
        .abn-tasarruf-chip {
          font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px;
          background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.2);
        }
        /* Semantic status badges */
        .abn-badge-success { background:rgba(5,150,105,0.1);  color:#059669; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
        .abn-badge-warning { background:rgba(217,119,6,0.1);  color:#d97706; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
        .abn-badge-danger  { background:rgba(220,38,38,0.1);  color:#dc2626; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
        .abn-badge-info    { background:rgba(99,102,241,0.1); color:#6366f1; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
        /* Plan icon boxes */
        .abn-icon-standart { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); }
        .abn-icon-kurumsal { background:rgba(59,130,246,0.1);  border:1px solid rgba(59,130,246,0.22); }
        /* ParamGo: ikon kutuları primary renk tonlarında */
        .p-abn-icon-standart { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); }
        .p-abn-icon-kurumsal { background:rgba(5,150,105,0.1); border:1px solid rgba(5,150,105,0.2); }
        @keyframes abnSkel { from{opacity:.45} to{opacity:1} }

        /* ── PARAMGO (p) ─────────────────────────────────────────── */
        .p-abn-page-title { font-size:20px; font-weight:700; color:var(--p-text-primary); font-family:var(--p-font-display); margin-bottom:4px; }
        .p-abn-page-sub   { font-size:13px; color:var(--p-text-muted); }
        .p-abn-hero {
          background:linear-gradient(135deg, var(--p-color-primary) 0%, var(--p-color-primary-dark) 100%);
          border-radius:16px; padding:28px 32px; margin-bottom:28px; color:var(--p-text-on-primary);
        }
        .p-abn-current-card {
          background:var(--p-bg-card); border:1px solid var(--p-border);
          border-left:4px solid var(--p-color-primary);
          border-radius:var(--p-radius-card); padding:20px 24px;
          margin-bottom:28px; box-shadow:var(--p-shadow-card);
        }
        .p-abn-current-label { font-size:11px; font-weight:600; color:var(--p-text-label); text-transform:uppercase; letter-spacing:.08em; }
        .p-abn-current-name  { font-size:18px; font-weight:800; color:var(--p-text-primary); font-family:var(--p-font-display); }
        .p-abn-meta-label    { font-size:11px; font-weight:600; color:var(--p-text-label); text-transform:uppercase; letter-spacing:.06em; }
        .p-abn-meta-value    { font-size:14px; font-weight:700; color:var(--p-text-primary); }
        .p-abn-section-title {
          font-size:13px; font-weight:700; color:var(--p-text-primary); text-transform:uppercase;
          letter-spacing:.06em; margin-bottom:16px; display:flex; align-items:center; gap:8px;
        }
        .p-abn-section-title::before { content:''; display:block; width:4px; height:16px; border-radius:2px; background:var(--p-color-primary); }
        .p-abn-toggle-label { font-size:13px; font-weight:600; color:var(--p-text-muted); cursor:pointer; transition:color .15s; }
        .p-abn-toggle-label.aktif { color:var(--p-text-primary); }
        .p-abn-toggle-sw { background:var(--p-border); border:1px solid var(--p-border-strong); }
        .p-abn-toggle-sw.on { background:var(--p-color-primary); }
        .p-abn-plan-card {
          background:var(--p-bg-card); border:1px solid var(--p-border);
          box-shadow:var(--p-shadow-card); border-radius:16px; padding:22px;
          transition:all .2s; position:relative; overflow:hidden; height:100%;
        }
        .p-abn-plan-card:hover { box-shadow:var(--p-shadow-card-hover); transform:translateY(-2px); background:var(--p-bg-card-hover); }
        .p-abn-plan-card.aktif-plan  { border:2px solid var(--p-color-primary); }
        .p-abn-plan-card.onerilen    { border:2px solid var(--p-color-primary-dark); box-shadow:var(--p-shadow-card-hover); }
        .p-abn-plan-price  { font-size:30px; font-weight:800; color:var(--p-text-primary); font-family:var(--p-font-display); line-height:1; }
        .p-abn-price-unit  { font-size:13px; font-weight:600; color:var(--p-text-muted); }
        .p-abn-plan-name   { font-size:16px; font-weight:800; color:var(--p-text-primary); }
        .p-abn-feature     { font-size:12px; color:var(--p-text-secondary); display:flex; align-items:flex-start; gap:7px; margin-bottom:8px; line-height:1.4; }
        .p-abn-feature i   { color:var(--p-color-success); font-size:12px; flex-shrink:0; margin-top:1px; }
        .p-abn-feature.kisit     { color:var(--p-text-muted); }
        .p-abn-feature.kisit i   { color:var(--p-color-danger); }
        .p-abn-sep         { height:1px; background:var(--p-border); margin:14px 0; }
        .p-abn-btn-pasif   { display:block; width:100%; min-height:44px; border-radius:10px; border:1px solid var(--p-border); background:var(--p-border); color:var(--p-text-muted); font-size:13px; font-weight:600; margin-top:16px; cursor:default; }
        .p-abn-card        { background:var(--p-bg-card); border:1px solid var(--p-border); box-shadow:var(--p-shadow-card); border-radius:var(--p-radius-card); overflow:hidden; }
        .p-abn-th          { font-size:11px; font-weight:700; color:var(--p-text-label); text-transform:uppercase; letter-spacing:.05em; padding:12px 16px; background:var(--p-bg-card-hover); border:none !important; border-bottom:1px solid var(--p-border) !important; }
        .p-abn-td          { padding:11px 16px; font-size:13px; color:var(--p-text-secondary); border:none !important; border-bottom:1px solid var(--p-border) !important; }
        .p-abn-td-bold     { padding:11px 16px; font-size:13px; font-weight:700; color:var(--p-text-primary); border:none !important; border-bottom:1px solid var(--p-border) !important; }
        .p-abn-empty       { color:var(--p-text-muted); }
        .p-abn-savings     { font-size:11px; color:var(--p-color-success); font-weight:700; }
        .p-abn-yearly-note { font-size:11px; color:var(--p-text-muted); margin-top:3px; }
        .p-abn-strike      { font-size:11px; color:var(--p-text-muted); text-decoration:line-through; }
        .p-abn-icon-box    { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg, var(--p-color-primary), var(--p-color-primary-dark)); display:flex; align-items:center; justify-content:center; }
        .p-abn-icon-ucretsiz { background:rgba(16,185,129,0.07); border:1px solid rgba(16,185,129,0.14); }
        .p-abn-badge-active { font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.06em; background:rgba(16,185,129,0.1); color:var(--p-color-primary); }
        .p-abn-badge-rec    { font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.06em; background:rgba(5,150,105,0.12); color:var(--p-color-primary-dark); }
        .p-abn-skel        { background:var(--p-border); border-radius:6px; animation:abnSkel 1.4s ease infinite alternate; }
        .p-abn-hero-stat   { color:var(--p-text-on-primary); opacity:.9; }

        @media (max-width: 767px) {
          .abn-page { padding: 16px; }
          .p-abn-plan-price { font-size: 24px; }
          .p-abn-hero { padding: 20px 18px; }
        }
      `}</style>

      <div className="abn-page">

        {/* SAYFA BAŞLIĞI */}
        <div className="mb-4">
          <div className={`${p}-abn-page-title`}>
            <i className="bi bi-credit-card me-2" />
            Abonelik Yönetimi
          </div>
          <div className={`${p}-abn-page-sub`}>Planınızı yönetin, işletmenizi büyütün</div>
        </div>

        {/* HERO — Satış odaklı */}
        <div className={`${p}-abn-hero`}>
          <div className="row align-items-center">
            <div className="col-12 col-md-8">
              <div style={{ fontSize: 11, fontWeight: 700, opacity: .75, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                {kampanyaAktif ? '🎉 Lansman Kampanyası Aktif' : 'ParamGo Premium'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, marginBottom: 8, color: '#fff' }}>
                Tüm finans süreçleriniz tek platformda — hiçbir şey gözden kaçmasın
              </div>
              <div style={{ fontSize: 13, opacity: .75, lineHeight: 1.6, color: '#fff' }}>
                Cari hesaplar, çek/senet, ödeme takibi, kasa ve daha fazlası.
              </div>
              {kampanyaAktif && (
                <div style={{ marginTop: 12 }}>
                  <span className="abn-kampanya-chip">🎉 Standart Plan — İlk 3 Ay 99,90₺ Lansman Fiyatı</span>
                </div>
              )}
            </div>
            <div className="col-12 col-md-4 d-none d-md-flex justify-content-end align-items-center gap-4 mt-3 mt-md-0">
              <div className={`${p}-abn-hero-stat`} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#fff' }}>500+</div>
                <div style={{ fontSize: 11, marginTop: 3, color: '#fff', opacity: .65 }}>İşletme</div>
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
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className={`${p}-abn-icon-box`}>
                  <i className="bi bi-award-fill" style={{ color: '#fff', fontSize: 20 }} />
                </div>
                <div>
                  <div className={`${p}-abn-current-label`}>Mevcut Plan</div>
                  <div className={`${p}-abn-current-name`}>{durum?.plan_adi || 'Ücretsiz'}</div>
                </div>
                {durum?.kampanya_kullanici && (
                  <span className="abn-kampanya-chip">🎉 Kampanya Fiyatı — 99,90₺/ay</span>
                )}
              </div>
              <div className="d-flex gap-4 flex-wrap">
                {durum?.bitis_tarihi && (
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
            <span className="abn-tasarruf-chip ms-2">%27 Tasarruf</span>
          </span>
        </div>

        <div className="row g-3 mb-4">
          {planlar.map((pl) => {
            const aktif = plan === pl.id
            const iconBoxCls = pl.id === 'ucretsiz'
              ? `${p}-abn-icon-ucretsiz`
              : (p === 'p' ? `p-abn-icon-${pl.id}` : `abn-icon-${pl.id}`)
            const iconColor = p === 'p'
              ? (pl.id === 'standart' ? 'var(--p-color-primary)' : pl.id === 'kurumsal' ? 'var(--p-color-primary-dark)' : undefined)
              : (pl.id === 'standart' ? '#10B981' : pl.id === 'kurumsal' ? '#3b82f6' : undefined)

            return (
              <div key={pl.id} className="col-12 col-md-4">
                <div className={`${p}-abn-plan-card ${aktif ? 'aktif-plan' : ''} ${pl.onerilen && !aktif ? 'onerilen' : ''}`}>

                  {/* Rozet satırı */}
                  <div className="d-flex align-items-center justify-content-between mb-3" style={{ minHeight: 24 }}>
                    <div className="d-flex gap-2">
                      {aktif && <span className={`${p}-abn-badge-active`}>✓ Aktif Plan</span>}
                      {pl.onerilen && !aktif && <span className={`${p}-abn-badge-rec`}>★ Önerilen</span>}
                    </div>
                    {pl.kampanya && <span className="abn-kampanya-chip">🎉 Kampanya</span>}
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
                    {pl.id === 'ucretsiz' ? (
                      <div className={`${p}-abn-plan-price`}>Ücretsiz</div>
                    ) : (
                      <>
                        {pl.kampanya && (
                          <div className={`${p}-abn-strike`}>{fmt(FIYATLAR.standart.aylik)}₺/ay</div>
                        )}
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
                  ) : pl.id === 'ucretsiz' ? (
                    <button className={`${p}-abn-btn-pasif`} disabled>Ücretsiz Kullan</button>
                  ) : (
                    <button
                      className={`abn-btn ${p === 'p' ? (pl.id === 'standart' ? 'yesil-standart' : 'yesil-kurumsal') : pl.btnSinif}`}
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
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <i className={`bi bi-receipt ${p}-abn-empty`} style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: .5 }} />
              <div className={`${p}-abn-empty`} style={{ fontSize: 14, fontWeight: 600 }}>Henüz ödeme geçmişi yok</div>
              <div className={`${p}-abn-empty`} style={{ fontSize: 12, marginTop: 4 }}>Abonelik aldığınızda burada görünecek</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
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
    </>
  )
}
