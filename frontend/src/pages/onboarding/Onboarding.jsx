/**
 * Onboarding — Yeni Kullanıcı Kurulum Sihirbazı
 *
 * 3 adımlı süreç:
 *   Adım 1 — İşletmeni tanıyalım  (sektor, calisan_sayisi)
 *   Adım 2 — İlk müşterini ekle   (cari — atlanabilir)
 *   Adım 3 — İlk çekini gir       (çek   — atlanabilir)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import useAuthStore from '../../stores/authStore'
import { onboardingApi } from '../../api/onboarding'
import ParamGoLogo from '../../logo/ParamGoLogo'
import { DateInput } from '../../components/ui/DateInput'

// Projedeki standart Türkçe para formatı (CekSenet.jsx ile aynı)
const formatParaInput = (v) => {
  let s = (v || '').replace(/[^0-9,]/g, '')
  const parts = s.split(',')
  if (parts.length > 2) s = parts[0] + ',' + parts.slice(1).join('')
  const [tam, kesir] = s.split(',')
  const fmt = (tam || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return kesir !== undefined ? fmt + ',' + kesir.slice(0, 2) : fmt
}
const parseParaInput = (f) => parseFloat((f || '').replace(/\./g, '').replace(',', '.')) || 0

const ADIMLAR = [
  { no: 1, etiket: 'İşletme' },
  { no: 2, etiket: 'Müşteri' },
  { no: 3, etiket: 'Çek'     },
]

const SEKTORLER = [
  { deger: 'tekstil',  emoji: '🧵', ad: 'Tekstil'  },
  { deger: 'insaat',   emoji: '🏗️', ad: 'İnşaat'   },
  { deger: 'hirdavat', emoji: '🔧', ad: 'Hırdavat' },
  { deger: 'gida',     emoji: '🛒', ad: 'Gıda'     },
  { deger: 'otomotiv', emoji: '🚗', ad: 'Otomotiv' },
  { deger: 'diger',    emoji: '📦', ad: 'Diğer'    },
]

const CALISAN_SECENEKLERI = [
  { deger: '1',  etiket: 'Sadece ben' },
  { deger: '5',  etiket: '2–5 kişi'  },
  { deger: '15', etiket: '6–15'      },
  { deger: '50', etiket: '16–50'     },
  { deger: '99', etiket: '50+'       },
]

const CARI_TURLERI = [
  { deger: 'musteri',   ad: 'Müşteri',   ikon: 'bi-person-fill'  },
  { deger: 'tedarikci', ad: 'Tedarikçi', ikon: 'bi-truck'        },
  { deger: 'her_ikisi', ad: 'Her İkisi', ikon: 'bi-people-fill'  },
]

export default function Onboarding() {
  const navigate          = useNavigate()
  const kullanici         = useAuthStore((s) => s.kullanici)
  const onboardingTamamla = useAuthStore((s) => s.onboardingTamamla)

  const [adim, setAdim]             = useState(1)
  const [yukleniyor, setYukleniyor] = useState(false)

  // Adım 1
  const [sektor, setSektor]               = useState('')
  const [calisanSayisi, setCalisanSayisi] = useState('')

  // Adım 2 — Cari
  const [cariAdi, setCariAdi]   = useState('')
  const [cariTel, setCariTel]   = useState('')
  const [cariTuru, setCariTuru] = useState('musteri')

  // Adım 3 — Çek
  const [cekTur, setCekTur]       = useState('alacak_ceki')
  const [cekTutar, setCekTutar]   = useState('')
  const [cekVade, setCekVade]     = useState('')
  const [cekSeriNo, setCekSeriNo] = useState('')
  const [cekBanka, setCekBanka]   = useState('')

  // ── Adım 1: İşletme bilgileri ──
  const adim1Kaydet = async () => {
    setYukleniyor(true)
    try {
      await onboardingApi.sirketGuncelle({
        sektor:         sektor || null,
        calisan_sayisi: calisanSayisi || null,
      })
      setAdim(2)
    } catch {
      toast.error('Bilgiler kaydedilemedi, tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  // ── Adım 2: Cari ekle ──
  const adim2Kaydet = async () => {
    if (!cariAdi.trim()) { toast.error('Müşteri adı zorunludur.'); return }
    setYukleniyor(true)
    try {
      await onboardingApi.cariEkle({
        cari_adi:  cariAdi.trim(),
        cari_turu: cariTuru,
        telefon:   cariTel || null,
      })
      toast.success('Müşteri eklendi!')
      setAdim(3)
    } catch (err) {
      const mesaj = err.response?.data?.hata
      toast.error(mesaj || 'Müşteri eklenemedi.')
    } finally {
      setYukleniyor(false)
    }
  }

  // ── Adım 3: Çek ekle + tamamla ──
  const adim3Tamamla = async (cekEkle = true) => {
    if (cekEkle && (!parseParaInput(cekTutar) || !cekVade)) {
      toast.error('Tutar ve vade tarihi zorunludur.')
      return
    }
    setYukleniyor(true)
    try {
      const veri = cekEkle ? {
        tur:         cekTur,
        tutar:       parseParaInput(cekTutar),
        vade_tarihi: cekVade,
        seri_no:     cekSeriNo || null,
        banka_adi:   cekBanka  || null,
      } : {}
      await onboardingApi.tamamla(veri)
      onboardingTamamla()
      setAdim(4)
    } catch {
      toast.error('Bir hata oluştu, tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  const isimParcala = () => {
    const ad = kullanici?.ad_soyad || ''
    return ad.split(' ')[0] || 'Merhaba'
  }

  const stepDurumu = (no) => {
    if (no < adim) return 'tamamlandi'
    if (no === adim) return 'aktif'
    return 'bekliyor'
  }

  const spinStyle = { animation: 'spin 1s linear infinite' }

  return (
    <div className="p-ob-root">

      {/* ── Hero ── */}
      <div className="p-ob-hero">
        <div className="p-ob-hero-blob-1" />
        <div className="p-ob-hero-blob-2" />
        <div className="p-ob-hero-blob-3" />

        <div className="p-ob-hero-logo">
          <ParamGoLogo size="sm" variant="white" />
        </div>

        {adim < 4 ? (
          <>
            <p className="p-ob-hero-greeting">Kurulum Sihirbazı 🚀</p>
            <h1 className="p-ob-hero-title">
              Merhaba {isimParcala()},<br />
              kasanı kontrol almaya hazır mısın?
            </h1>
            <p className="p-ob-hero-sub">3 kolay adımda sistemi kuruyoruz — 2 dakika sürer.</p>
          </>
        ) : (
          <>
            <p className="p-ob-hero-greeting">Kurulum Tamamlandı 🎉</p>
            <h1 className="p-ob-hero-title">
              Harika iş, {isimParcala()}!<br />
              Sisteme hoş geldin.
            </h1>
            <p className="p-ob-hero-sub">Dashboard'un hazır. Hadi başlayalım!</p>
          </>
        )}
      </div>

      <div className="p-ob-content">

        {/* ── Stepper ── */}
        {adim < 4 && (
          <div className="p-ob-stepper">
            {ADIMLAR.map((a, i) => {
              const durum = stepDurumu(a.no)
              return (
                <div key={a.no} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div className="p-ob-step-item">
                    <div className={`p-ob-step-circle ${durum}`}>
                      {durum === 'tamamlandi' ? <i className="bi bi-check2" /> : a.no}
                    </div>
                    <span className={`p-ob-step-label ${durum}`}>{a.etiket}</span>
                  </div>
                  {i < ADIMLAR.length - 1 && (
                    <div className={`p-ob-step-line ${durum === 'tamamlandi' ? 'tamamlandi' : ''}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ════════════════════════════════
            ADIM 1 — İşletme bilgileri
        ════════════════════════════════ */}
        {adim === 1 && (
          <div className="p-ob-card">
            <div className="p-ob-step-badge">
              <i className="bi bi-1-circle" /> Adım 1 / 3
            </div>
            <div className="p-ob-card-icon-wrap">
              <i className="bi bi-building" />
            </div>
            <h2 className="p-ob-card-title">İşletmeni tanıyalım</h2>
            <p className="p-ob-card-sub">
              Bu bilgiler sana daha uygun öneriler sunmamıza yardımcı olur.
              Dilersen adımı atlayabilirsin.
            </p>

            {/* Sektör — kart grid */}
            <div className="p-ob-field">
              <label className="p-ob-label">Sektörün nedir?</label>
              <div className="p-ob-sektor-grid">
                {SEKTORLER.map((s) => (
                  <button
                    key={s.deger}
                    type="button"
                    className={`p-ob-sektor-kart ${sektor === s.deger ? 'secili' : ''}`}
                    onClick={() => setSektor(sektor === s.deger ? '' : s.deger)}
                  >
                    <span className="p-ob-sektor-emoji">{s.emoji}</span>
                    <span className="p-ob-sektor-ad">{s.ad}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Çalışan sayısı — pill toggle */}
            <div className="p-ob-field">
              <label className="p-ob-label">Kaç kişiyle çalışıyorsunuz?</label>
              <div className="p-ob-calisan-grup">
                {CALISAN_SECENEKLERI.map((c) => (
                  <button
                    key={c.deger}
                    type="button"
                    className={`p-ob-calisan-pill ${calisanSayisi === c.deger ? 'secili' : ''}`}
                    onClick={() => setCalisanSayisi(calisanSayisi === c.deger ? '' : c.deger)}
                  >
                    {c.etiket}
                  </button>
                ))}
              </div>
            </div>

            <button className="p-ob-btn-next" onClick={adim1Kaydet} disabled={yukleniyor}>
              {yukleniyor
                ? <><i className="bi bi-arrow-repeat" style={spinStyle} /> Kaydediliyor...</>
                : <><i className="bi bi-arrow-right" /> Devam Et</>
              }
            </button>
            <button className="p-ob-btn-skip" onClick={() => setAdim(2)} disabled={yukleniyor}>
              <i className="bi bi-skip-forward" /> Sonra Doldururum
            </button>
          </div>
        )}

        {/* ════════════════════════════════
            ADIM 2 — İlk müşteri
        ════════════════════════════════ */}
        {adim === 2 && (
          <div className="p-ob-card">
            <div className="p-ob-step-badge">
              <i className="bi bi-2-circle" /> Adım 2 / 3
            </div>
            <div className="p-ob-card-icon-wrap">
              <i className="bi bi-person-plus" />
            </div>
            <h2 className="p-ob-card-title">İlk müşterini ekle</h2>
            <p className="p-ob-card-sub">
              Cari hesap takibine hemen başla. Bir müşteri veya tedarikçi ekle.
              Atlayabilirsin — istediğin zaman ekleyebilirsin.
            </p>

            <div className="p-ob-field">
              <label className="p-ob-label">
                Müşteri / Tedarikçi Adı <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                className="p-ob-input"
                type="text"
                placeholder="Örn: Ahmet Yılmaz veya ABC Ltd."
                value={cariAdi}
                onChange={(e) => setCariAdi(e.target.value)}
                autoFocus
              />
            </div>

            {/* Cari türü — 3 yatay kart */}
            <div className="p-ob-field">
              <label className="p-ob-label">Cari Türü</label>
              <div className="p-ob-tur-kart-grup">
                {CARI_TURLERI.map((t) => (
                  <button
                    key={t.deger}
                    type="button"
                    className={`p-ob-tur-kart ${cariTuru === t.deger ? 'secili' : ''}`}
                    onClick={() => setCariTuru(t.deger)}
                  >
                    <i
                      className={`bi ${t.ikon} p-ob-tur-kart-ikon`}
                      style={{ color: cariTuru === t.deger ? '#10B981' : '#9CA3AF' }}
                    />
                    <span className="p-ob-tur-kart-ad">{t.ad}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-ob-field">
              <label className="p-ob-label">Telefon (opsiyonel)</label>
              <input
                className="p-ob-input"
                type="tel"
                placeholder="0532 000 00 00"
                value={cariTel}
                onChange={(e) => setCariTel(e.target.value)}
              />
            </div>

            <button className="p-ob-btn-next" onClick={adim2Kaydet} disabled={yukleniyor}>
              {yukleniyor
                ? <><i className="bi bi-arrow-repeat" style={spinStyle} /> Kaydediliyor...</>
                : <><i className="bi bi-person-check" /> Müşteriyi Ekle</>
              }
            </button>
            <button className="p-ob-btn-skip" onClick={() => adim3Tamamla(false)} disabled={yukleniyor}>
              <i className="bi bi-skip-forward" /> Sonra Eklerim — Kurulumu Tamamla
            </button>
          </div>
        )}

        {/* ════════════════════════════════
            ADIM 3 — İlk çek
        ════════════════════════════════ */}
        {adim === 3 && (
          <div className="p-ob-card">
            <div className="p-ob-step-badge">
              <i className="bi bi-3-circle" /> Adım 3 / 3
            </div>
            <div className="p-ob-card-icon-wrap">
              <i className="bi bi-file-earmark-text" />
            </div>
            <h2 className="p-ob-card-title">İlk çekini gir</h2>
            <p className="p-ob-card-sub">
              Portföyündeki veya tahsile gönderdiğin bir çeki ekle.
              İstersen atlayıp sonra ekleyebilirsin.
            </p>

            {/* Çek türü — 2 büyük kart */}
            <div className="p-ob-field">
              <label className="p-ob-label">Çek Türü</label>
              <div className="p-ob-cek-tur-grup">
                <button
                  type="button"
                  className={`p-ob-cek-kart ${cekTur === 'alacak_ceki' ? 'secili-yesil' : ''}`}
                  onClick={() => setCekTur('alacak_ceki')}
                >
                  <i
                    className="bi bi-arrow-down-circle-fill p-ob-cek-kart-ikon"
                    style={{ color: cekTur === 'alacak_ceki' ? '#10B981' : '#9CA3AF' }}
                  />
                  <span className="p-ob-cek-kart-baslik">Müşteriden Aldım</span>
                  <span className="p-ob-cek-kart-aciklama">Alacak çeki</span>
                </button>
                <button
                  type="button"
                  className={`p-ob-cek-kart ${cekTur === 'borc_ceki' ? 'secili-kirmizi' : ''}`}
                  onClick={() => setCekTur('borc_ceki')}
                >
                  <i
                    className="bi bi-arrow-up-circle-fill p-ob-cek-kart-ikon"
                    style={{ color: cekTur === 'borc_ceki' ? '#EF4444' : '#9CA3AF' }}
                  />
                  <span className="p-ob-cek-kart-baslik">Ben Verdim</span>
                  <span className="p-ob-cek-kart-aciklama">Borç çeki</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="p-ob-field">
                <label className="p-ob-label">
                  Tutar (₺) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  className="p-ob-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="25.000,00"
                  value={cekTutar}
                  onChange={(e) => setCekTutar(formatParaInput(e.target.value))}
                  autoFocus
                />
              </div>
              <div className="p-ob-field">
                <label className="p-ob-label">
                  Vade Tarihi <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <DateInput value={cekVade}
                  onChange={(val) => setCekVade(val)}
                  placeholder="Vade tarihi" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="p-ob-field">
                <label className="p-ob-label">Seri No (opsiyonel)</label>
                <input
                  className="p-ob-input"
                  type="text"
                  placeholder="A001234"
                  value={cekSeriNo}
                  onChange={(e) => setCekSeriNo(e.target.value)}
                />
              </div>
              <div className="p-ob-field">
                <label className="p-ob-label">Banka (opsiyonel)</label>
                <input
                  className="p-ob-input"
                  type="text"
                  placeholder="Ziraat Bankası"
                  value={cekBanka}
                  onChange={(e) => setCekBanka(e.target.value)}
                />
              </div>
            </div>

            <button
              className="p-ob-btn-next"
              onClick={() => adim3Tamamla(true)}
              disabled={yukleniyor}
            >
              {yukleniyor
                ? <><i className="bi bi-arrow-repeat" style={spinStyle} /> Kaydediliyor...</>
                : <><i className="bi bi-rocket-takeoff" /> Çeki Ekle ve Başla!</>
              }
            </button>
            <button
              className="p-ob-btn-skip"
              onClick={() => adim3Tamamla(false)}
              disabled={yukleniyor}
            >
              <i className="bi bi-skip-forward" /> Sonra Eklerim — Kurulumu Tamamla
            </button>
          </div>
        )}

        {/* ════════════════════════════════
            ADIM 4 — Tamamlandı
        ════════════════════════════════ */}
        {adim === 4 && (
          <div className="p-ob-card">
            <div className="p-ob-success-wrap">
              <div className="p-ob-success-circle">
                <i className="bi bi-check2-all" />
              </div>
              <h2 className="p-ob-success-title">Kurulum tamamlandı! 🎉</h2>
              <p className="p-ob-success-sub">
                Sisteme hoş geldin. Dashboard'un hazır —<br />
                nakit akışını takip etmeye başlayabilirsin.
              </p>

              <div className="p-ob-success-features">
                <div className="p-ob-success-feat">
                  <i className="bi bi-people-fill" /> Cari Hesaplar
                </div>
                <div className="p-ob-success-feat">
                  <i className="bi bi-file-earmark-text-fill" /> Çek / Senet
                </div>
                <div className="p-ob-success-feat">
                  <i className="bi bi-cash-stack" /> Kasa Takibi
                </div>
                <div className="p-ob-success-feat">
                  <i className="bi bi-graph-up-arrow" /> Raporlar
                </div>
              </div>

              <button className="p-ob-btn-next" onClick={() => navigate('/dashboard')}>
                <i className="bi bi-speedometer2" /> Dashboard'a Git
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
