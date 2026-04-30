/**
 * PlanSecim — Abonelik Yönetim Sayfası
 * Route: /abonelik
 * v2: 7 gün deneme + Standart 399₺ / Kurumsal 599₺
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import useAuthStore from '../../stores/authStore'
import api from '../../api/axios'
import { abonelikApi } from '../../api/abonelik'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'

const IOS_MU = Capacitor.isNativePlatform()
const PLATFORM = Capacitor.getPlatform() // 'ios' | 'android' | 'web'
const ANDROID_MU = PLATFORM === 'android'

// Platform'a göre fiyat — iOS App Store IAP / Web iyzico
const FIYATLAR_IOS = {
  standart: { aylik: 399.99, yillik: 3999.99 },
  kurumsal: { aylik: 599.99, yillik: 5999.99 },
}
const FIYATLAR_WEB = {
  standart: { aylik: 360, yillik: 3600 },
  kurumsal: { aylik: 540, yillik: 5400 },
}
const FIYATLAR = Capacitor.isNativePlatform() ? FIYATLAR_IOS : FIYATLAR_WEB

// App Store ürün ID'leri (RevenueCat'te tanımlı olanlarla aynı olmalı)
const URUN_IDS = {
  standart: {
    aylik:  'com.paramgo.app.standart.aylik',
    yillik: 'com.paramgo.app.standart.yillik',
  },
  kurumsal: {
    aylik:  'com.paramgo.app.kurumsal.aylik',
    yillik: 'com.paramgo.app.kurumsal.yillik',
  },
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
  const navigate = useNavigate()
  const { plan: jwtPlan } = usePlanKontrol()
  const { iapPlanGuncelle, kullanici } = useAuthStore()

  const [yukleniyor, setYukleniyor] = useState(true)
  const [gecmisYukleniyor, setGecmisYukleniyor] = useState(true)
  const [durum, setDurum] = useState(null)
  const [gecmis, setGecmis] = useState([])
  const [yillik, setYillik] = useState(false)
  const [iapYukleniyor, setIapYukleniyor] = useState(false)
  const [satinAlinanPlan, setSatinAlinanPlan] = useState(null)
  const [iptalOnayAcik, setIptalOnayAcik] = useState(false)
  const [iptalYukleniyor, setIptalYukleniyor] = useState(false)
  const [davetAcik, setDavetAcik] = useState(false)
  const [davetKodu, setDavetKodu] = useState('')
  const [davetYukleniyor, setDavetYukleniyor] = useState(false)
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
    // iyzico bekleyen ödeme tokenı varsa otomatik doğrulama yap
    const bekleyenToken = localStorage.getItem('iyzico_bekleyen_token')
    if (bekleyenToken) {
      ;(async () => {
        toast.info('Aboneliğiniz aktifleştiriliyor...')
        // 5 deneme x 4 sn bekle (iyzico'nun aboneliği oluşturması zaman alabilir)
        for (let i = 0; i < 5; i++) {
          try {
            const r = await abonelikApi.iyzicoDogrula(bekleyenToken)
            const { plan: yeniPlan, tokenlar } = r.data.veri
            iapPlanGuncelle(yeniPlan, tokenlar)
            localStorage.removeItem('iyzico_bekleyen_token')
            toast.success('Aboneliğiniz aktifleştirildi!')
            // Durumu yenile
            try {
              const res = await abonelikApi.durum()
              setDurum(res.data.veri)
            } catch { /* sessiz */ }
            return
          } catch (e) {
            const kod = e?.response?.status
            if (kod === 404) {
              await new Promise(r => setTimeout(r, 4000))
              continue
            }
            // Diğer hatalarda dur
            console.error('iyzico doğrulama hatası:', e?.response?.data || e?.message)
            break
          }
        }
        // 5 deneme sonunda hâlâ olmadıysa token'ı temizle
        localStorage.removeItem('iyzico_bekleyen_token')
      })()
    }

    durumAl()
    gecmisAl()
  }, [iapPlanGuncelle])

  // O9: Uygulama arka plandan ön plana gelince aktif abonelik kontrolü
  // iOS WebView satın alma sırasında öldürülebilir — geri dönüşte senkronize et
  useEffect(() => {
    if (!IOS_MU) return
    const resumeKontrol = async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        const { customerInfo } = await Purchases.getCustomerInfo()
        const aktifAbonelikler = customerInfo?.activeSubscriptions ?? []
        if (aktifAbonelikler.length === 0) return
        const res = await abonelikApi.iapDogrula()
        if (res?.data?.basarili) {
          const { plan: yeniPlan, tokenlar } = res.data.veri
          iapPlanGuncelle(yeniPlan, tokenlar)
          const durumRes = await abonelikApi.durum()
          setDurum(durumRes.data.veri)
        }
      } catch { /* sessiz — arka plan kontrolü kritik değil */ }
    }
    window.addEventListener('app:resume', resumeKontrol)
    return () => window.removeEventListener('app:resume', resumeKontrol)
  }, [iapPlanGuncelle])

  // Web iyzico aboneliğini iptal et — dönem sonunda iptal olur (iyzico standardı)
  const iyzicoIptalEt = async () => {
    if (iptalYukleniyor) return
    setIptalYukleniyor(true)
    try {
      await abonelikApi.iyzicoIptal()
      toast.success('Aboneliğiniz dönem sonunda iptal edilecek')
      setIptalOnayAcik(false)
      // Durumu yenile
      try {
        const durumRes = await abonelikApi.durum()
        setDurum(durumRes.data.veri)
      } catch { /* sessiz */ }
    } catch (e) {
      const hata = e?.response?.data?.hata || 'Abonelik iptal edilemedi, lütfen destek ile iletişime geçin'
      toast.error(hata)
    } finally {
      setIptalYukleniyor(false)
    }
  }

  // Davet kodu uygula
  const davetKoduUygula = async () => {
    if (!davetKodu.trim() || davetYukleniyor) return
    setDavetYukleniyor(true)
    try {
      const res = await abonelikApi.davetKullan(davetKodu.trim())
      const { tokenlar } = res.data.veri
      iapPlanGuncelle('kurumsal', tokenlar)
      toast.success('Davet kodunuz uygulandı! 1 yıllık Kurumsal plan aktif.')
      setDavetKodu('')
      setDavetAcik(false)
      const durumRes = await abonelikApi.durum()
      setDurum(durumRes.data.veri)
    } catch (e) {
      const hata = e?.response?.data?.hata || 'Geçersiz veya kullanılmış davet kodu'
      toast.error(hata)
    } finally {
      setDavetYukleniyor(false)
    }
  }

  // Web iyzico ödeme başlat
  const yukseltBaslat = useCallback(async (planId, donem) => {
    if (iapYukleniyor) return
    if (localStorage.getItem('iyzico_bekleyen_token')) {
      toast.info('Bekleyen bir ödeme var. Lütfen önce onu tamamlayın veya birkaç dakika bekleyip tekrar deneyin.')
      return
    }
    setIapYukleniyor(true)
    setSatinAlinanPlan(planId)
    try {
      const res = await abonelikApi.yukselt({ plan_adi: planId, odeme_donemi: donem })
      const formContent = res?.data?.veri?.form_content
      const odemeToken = res?.data?.veri?.token
      if (!formContent) {
        toast.error('Ödeme sayfası alınamadı, tekrar deneyin')
        return
      }
      if (odemeToken) localStorage.setItem('iyzico_bekleyen_token', odemeToken)
      const tutar = (donem === 'yillik'
        ? FIYATLAR[planId].yillik
        : FIYATLAR[planId].aylik
      ).toLocaleString('tr-TR')
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = '/odeme.php'
      form.target = '_blank'
      form.style.display = 'none'
      const ekle = (ad, deger) => {
        const i = document.createElement('input')
        i.type = 'hidden'
        i.name = ad
        i.value = deger
        form.appendChild(i)
      }
      ekle('form_content', formContent)
      ekle('plan_adi', planId === 'standart' ? 'Standart' : 'Kurumsal')
      ekle('tutar', tutar)
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    } catch (e) {
      const hata = e?.response?.data?.hata || ''
      toast.error(hata || ('HTTP ' + (e?.response?.status || '?') + ': ' + (e?.message || 'Bilinmeyen hata')))
    } finally {
      setIapYukleniyor(false)
      setSatinAlinanPlan(null)
    }
  }, [iapYukleniyor])

  // iOS IAP satın alma
  const iapSatinAl = useCallback(async (planId) => {
    if (iapYukleniyor) return
    setIapYukleniyor(true)
    setSatinAlinanPlan(planId)
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      // RC henüz başlatılmamışsa şimdi başlat (race condition önlemi)
      const { kullanici: k } = useAuthStore.getState()
      if (k?.sirket_id) {
        const { revenueCatBaslat: rcBaslat } = await import('../../lib/capacitorInit')
        await rcBaslat(k.sirket_id)
      }
      const donem = yillik ? 'yillik' : 'aylik'
      const paketIdentifier = `${planId}_${donem}` // örn: "standart_aylik"

      // RevenueCat offering'lerden paketi bul (platform bağımsız identifier ile)
      const offerings = await Purchases.getOfferings()
      console.log('RC offerings:', JSON.stringify({
        current: offerings.current?.identifier,
        paketSayisi: offerings.current?.availablePackages?.length ?? 0,
        paketler: offerings.current?.availablePackages?.map(p => p.identifier) ?? [],
      }))
      const paketler = offerings.current?.availablePackages ?? []
      const paket = paketler.find(p => p.identifier === paketIdentifier)

      if (!paket) {
        const mesaj = `Paket bulunamadı: ${paketIdentifier} (mevcut: ${paketler.map(p=>p.identifier).join(', ') || 'yok'})`
        console.warn(mesaj)
        toast.error(mesaj)
        return
      }

      // Apple ödeme ekranını aç
      const satinAlim = await Purchases.purchasePackage({ aPackage: paket })
      console.log('IAP satın alım sonucu:', JSON.stringify({
        urunId: satinAlim?.customerInfo?.activeSubscriptions,
        entitlements: Object.keys(satinAlim?.customerInfo?.entitlements?.active ?? {}),
      }))

      // Receipt'i RevenueCat'e sync et (403 döneminde kayıp kalan alımları kurtarır)
      await Purchases.syncPurchases()

      // Başarılı — backend'e bildir ve JWT'yi güncelle
      toast.info('Abonelik doğrulanıyor...')
      await new Promise(r => setTimeout(r, 3000))

      // K5: Token geçerliliğini kontrol et — IAP akışı uzun sürebilir (15+ sn)
      // 5 dakikadan az kaldıysa proaktif yenile, oturum kapanmasın
      try {
        const { accessToken: mevToken, refreshToken: mevRefresh, tokenlariAyarla } = useAuthStore.getState()
        if (mevToken && mevRefresh) {
          const payload = JSON.parse(atob(mevToken.split('.')[1]))
          const kalanSaniye = payload.exp - Math.floor(Date.now() / 1000)
          if (kalanSaniye < 300) {
            const refreshRes = await api.post('/auth/yenile', { refresh_token: mevRefresh })
            tokenlariAyarla(refreshRes.data.veri.tokenlar.access_token, mevRefresh)
          }
        }
      } catch { /* sessiz — interceptor 401'i halleder */ }

      // Backend doğrulama — RC'nin işlemesi için 3 deneme x 4s
      let res = null
      for (let deneme = 1; deneme <= 3; deneme++) {
        try {
          res = await abonelikApi.iapDogrula()
          break
        } catch (err) {
          const httpKod = err?.response?.status
          console.error(`iapDogrula deneme ${deneme} hata:`, httpKod, err?.response?.data || err?.message)
          if (deneme === 3) {
            if (!httpKod) {
              toast.error('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip "Satın Alımları Geri Yükle" butonuna basın.')
            } else {
              toast.error('Ödemeniz Apple tarafından onaylandı. Plan aktifleştirilemedi — lütfen "Satın Alımları Geri Yükle" butonuna basın.')
            }
            return
          }
          await new Promise(r => setTimeout(r, 4000))
        }
      }

      const { plan: yeniPlan, tokenlar } = res.data.veri
      iapPlanGuncelle(yeniPlan, tokenlar)

      // Sayfayı güncelle
      const durumRes = await abonelikApi.durum()
      setDurum(durumRes.data.veri)
      const gecmisRes = await abonelikApi.gecmis()
      setGecmis(gecmisRes.data.veri.gecmis || [])

      toast.success('Aboneliğiniz başarıyla aktifleştirildi!')
    } catch (e) {
      if (e?.userCancelled) {
        // Kullanıcı ödeme ekranını kapattı — hata gösterme
      } else {
        const detay = e?.message || e?.code || JSON.stringify(e) || 'bilinmeyen hata'
        console.error('IAP hata detayı:', detay, e)
        toast.error(`Satın alma hatası: ${detay}`)
      }
    } finally {
      setIapYukleniyor(false)
      setSatinAlinanPlan(null)
    }
  }, [iapYukleniyor, yillik, iapPlanGuncelle])

  // iOS'ta satın alımları geri yükle (Apple zorunlu kılar)
  const satinAlimlarıGeriYukle = useCallback(async () => {
    if (iapYukleniyor) return
    setIapYukleniyor(true)
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      await Purchases.restorePurchases()
      await Purchases.syncPurchases()
      toast.info('Abonelik doğrulanıyor...')
      await new Promise(r => setTimeout(r, 3000))
      // Backend'e doğrulat — 3 deneme x 4s
      let res = null
      for (let deneme = 1; deneme <= 3; deneme++) {
        try {
          res = await abonelikApi.iapDogrula()
          break
        } catch (err) {
          const httpKod = err?.response?.status
          console.error(`Geri yükle deneme ${deneme} hata:`, httpKod, err?.response?.data || err?.message)
          if (deneme === 3) {
            if (!httpKod) {
              throw new Error('network_hatasi')
            } else if (httpKod === 404) {
              throw new Error('abone_yok')
            } else {
              throw new Error('sunucu_hatasi')
            }
          }
          await new Promise(r => setTimeout(r, 4000))
        }
      }
      if (res?.data?.basarili) {
        const { plan: yeniPlan, tokenlar } = res.data.veri
        iapPlanGuncelle(yeniPlan, tokenlar)
        const durumRes = await abonelikApi.durum()
        setDurum(durumRes.data.veri)
        toast.success('Aboneliğiniz geri yüklendi!')
      } else {
        // O7: başarısız ama hata fırlatmadan döndü — kullanıcıya açıkla
        toast.error('Aktif abonelik bulunamadı. Daha önce satın aldıysanız App Store hesabınızın doğru olduğundan emin olun.')
      }
    } catch (e) {
      if (e?.message === 'network_hatasi') {
        toast.error('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.')
      } else if (e?.message === 'abone_yok') {
        toast.error('Apple hesabınızda aktif abonelik bulunamadı.')
      } else if (e?.userCancelled) {
        // Kullanıcı iptal etti — sessiz
      } else {
        toast.error('Geri yükleme başarısız. Lütfen tekrar deneyin.')
      }
    } finally {
      setIapYukleniyor(false)
    }
  }, [iapYukleniyor, iapPlanGuncelle])

  // API'den gelen plan yetkili kaynak; yüklenene kadar JWT'deki plan kullanılır
  const plan = durum?.plan || jwtPlan
  const denemeDoldu = durum?.deneme_doldu || false
  const denemeKalanGun = durum?.deneme_kalan_gun ?? null
  // Yeni model: kullanıcı henüz hiç abonelik almamış (deneme_bitis NULL).
  // Bu durumda "süreniz doldu" yerine davetkâr "Premium'a geçin" mesajı gösterilir.
  const henuzAbonelikYok = plan === 'deneme'
    && (durum?.deneme_bitis === null || durum?.deneme_bitis === undefined)
  const standartGosterilen = yillik
    ? Math.round(FIYATLAR.standart.yillik / 12 * 100) / 100
    : FIYATLAR.standart.aylik
  const kurumGosterilen = yillik
    ? Math.round(FIYATLAR.kurumsal.yillik / 12 * 100) / 100
    : FIYATLAR.kurumsal.aylik

  const planlar = [
    {
      id: 'deneme', ad: '7 Gün Deneme', ikon: 'bi-gift', btnSinif: 'pasif',
      aciklama: 'Tüm özellikleri 7 gün boyunca ücretsiz deneyin',
      ozellikler: [
        '7 gün tüm özellikler açık',
        '2 kullanıcıya kadar',
        'Sınırsız cari hesap',
        '50 çek/senet kaydı (aylık)',
        'Sınırsız kasa yönetimi',
        'PDF & Excel rapor',
      ],
      kisitlamalar: [
        '7 gün sonra plan seçimi gerekir',
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

        {/* DENEME SÜRESİ BANNER — 3 duruma göre */}
        {plan === 'deneme' && !yukleniyor && (
          henuzAbonelikYok ? (
            // Yeni kullanıcı, hiç abonelik almamış — davetkâr emerald banner
            <div className="abn-deneme-banner yeni" style={{
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
              borderLeft: '4px solid #10B981',
            }}>
              <i className="bi bi-stars" style={{ fontSize: 22, color: '#059669' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#065F46', marginBottom: 2 }}>
                  Premium'a geçin, hemen başlayın
                </div>
                <div style={{ fontSize: 12, color: '#047857' }}>
                  Tüm modüllere erişmek için bir plan seçin. İlk 7 gün ücretsiz — istediğiniz zaman iptal edebilirsiniz.
                </div>
              </div>
              <span className="abn-deneme-chip" style={{
                background: '#10B981',
                color: '#fff',
                fontWeight: 700,
              }}>
                7 Gün Ücretsiz
              </span>
            </div>
          ) : (
            // Eski kullanıcılar (geçiş): trial bitmiş veya devam ediyor
            <div className={`abn-deneme-banner ${denemeDoldu ? 'doldu' : ''}`}>
              <i className={`bi ${denemeDoldu ? 'bi-exclamation-triangle-fill' : 'bi-clock-fill'}`}
                 style={{ fontSize: 22, color: denemeDoldu ? '#dc2626' : '#d97706' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: denemeDoldu ? '#991b1b' : '#92400e', marginBottom: 2 }}>
                  {denemeDoldu
                    ? 'Ücretsiz erişim süreniz doldu'
                    : `Ücretsiz erişim: ${denemeKalanGun} gün kaldı`
                  }
                </div>
                <div style={{ fontSize: 12, color: denemeDoldu ? '#b91c1c' : '#a16207' }}>
                  {denemeDoldu
                    ? 'Verileriniz güvende ancak yeni kayıt ekleyemezsiniz. Devam etmek için Premium\'a geçin.'
                    : 'Tüm özellikler açık. Kesintisiz devam için Premium\'a geçin — ilk 7 gün ücretsiz.'
                  }
                </div>
              </div>
              <span className={`abn-deneme-chip ${denemeDoldu ? 'doldu' : ''}`}>
                {denemeDoldu ? 'Süre Doldu' : `${denemeKalanGun} Gün`}
              </span>
            </div>
          )
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
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#fff' }}>7 Gün</div>
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
                  <span className={`${p}-abn-current-name`}>{durum?.plan_adi || '7 Gün Deneme'}</span>
                </div>
              </div>
              {(durum?.bitis_tarihi || durum?.odeme_kanali || durum?.deneme_bitis) && (
                <div className="d-flex gap-4 flex-wrap ms-auto align-items-center">
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
                  {!IOS_MU && !durum?.deneme && durum?.odeme_kanali === 'iyzico' && !durum?.iptal_planlandi && (
                    <button
                      type="button"
                      onClick={() => setIptalOnayAcik(true)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: '1px solid #FCA5A5',
                        background: '#fff',
                        color: '#B91C1C',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                      title="Aboneliği dönem sonunda iptal et"
                    >
                      <i className="bi bi-x-circle me-1" />
                      Aboneliği İptal Et
                    </button>
                  )}
                  {!IOS_MU && durum?.iptal_planlandi && (
                    <div style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: '1px solid #FCD34D',
                      background: '#FFFBEB',
                      color: '#92400E',
                      fontSize: 12.5,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <i className="bi bi-info-circle-fill" />
                      İptal Edildi — {durum?.bitis_tarihi ? tarihFmt(durum.bitis_tarihi) : 'dönem sonu'} tarihine kadar geçerli
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* İPTAL ONAY MODAL */}
        {iptalOnayAcik && createPortal(
          <>
            <div className="p-modal-overlay" />
            <div className="p-modal-center">
            <div className="p-modal-box" style={{ maxWidth: 460 }}>
              <div className="p-modal-header p-mh-danger">
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 16, color: '#fff' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#ffffff' }}>Aboneliği İptal Et</p>
                    <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.85)' }}>Bu işlem geri alınamaz</p>
                  </div>
                </div>
              </div>
              <div className="p-modal-body">
                <p style={{ margin: 0, fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>
                  Aboneliğiniz <strong>{durum?.bitis_tarihi ? tarihFmt(durum.bitis_tarihi) : 'mevcut dönem sonunda'}</strong> tarihinde iptal edilecek.
                  Bu tarihe kadar tüm özellikleri kullanmaya devam edebilirsiniz. Sonrasında otomatik yenileme yapılmayacak.
                </p>
              </div>
              <div className="p-modal-footer d-flex justify-content-end gap-2">
                <button
                  onClick={() => setIptalOnayAcik(false)}
                  disabled={iptalYukleniyor}
                  style={{
                    padding: '9px 18px', borderRadius: 10,
                    border: '1px solid #E5E7EB', background: '#ffffff',
                    color: '#374151', fontWeight: 600, fontSize: 13,
                    cursor: iptalYukleniyor ? 'not-allowed' : 'pointer',
                  }}
                >Vazgeç</button>
                <button
                  onClick={iyzicoIptalEt}
                  disabled={iptalYukleniyor}
                  style={{
                    padding: '9px 18px', borderRadius: 10,
                    border: 'none',
                    background: '#DC2626',
                    color: '#fff',
                    fontWeight: 700, fontSize: 13,
                    cursor: iptalYukleniyor ? 'not-allowed' : 'pointer',
                  }}
                >
                  {iptalYukleniyor
                    ? <><span className="spinner-border spinner-border-sm me-1" />İptal ediliyor...</>
                    : <><i className="bi bi-x-circle me-1" />Aboneliği İptal Et</>
                  }
                </button>
              </div>
            </div>
            </div>
          </>,
          document.body
        )}

        {/* PLAN SEÇİMİ */}
        {IOS_MU ? (
          /* iOS: App Store In-App Purchase ile satın alma */
          <>
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

            {/* Deneme notu */}
            <div className={`${p}-abn-card`} style={{ marginBottom: 16, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12 }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-gift-fill" style={{ color: '#16a34a', fontSize: 16 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>
                  7 gün ücretsiz deneme — İstediğiniz zaman iptal edebilirsiniz
                </span>
              </div>
            </div>

            {/* Plan kartları (sadece standart + kurumsal) */}
            <div className="row g-3 mb-3">
              {[
                {
                  id: 'standart', ad: 'Standart', ikon: 'bi-star-fill',
                  aciklama: 'Büyüyen işletmeler için tam özellik seti',
                  fiyat: yillik ? Math.round(FIYATLAR.standart.yillik / 12 * 100) / 100 : FIYATLAR.standart.aylik,
                  fiyatYillik: FIYATLAR.standart.yillik,
                  onerilen: true,
                  ozellikler: ['2 kullanıcıya kadar', 'Sınırsız cari hesap', '50 çek/senet (aylık)', 'PDF & Excel rapor', 'WhatsApp desteği'],
                },
                {
                  id: 'kurumsal', ad: 'Kurumsal', ikon: 'bi-building-fill',
                  aciklama: 'Büyük ekipler için tam kontrol',
                  fiyat: yillik ? Math.round(FIYATLAR.kurumsal.yillik / 12 * 100) / 100 : FIYATLAR.kurumsal.aylik,
                  fiyatYillik: FIYATLAR.kurumsal.yillik,
                  ozellikler: ['10 kullanıcıya kadar', 'Sınırsız her şey', 'Gelişmiş raporlama', 'Öncelikli 7/24 destek'],
                },
              ].map((pl) => {
                // Hem plan adı hem dönem uyuşuyorsa "Aktif" — dönem bilinmiyorsa sadece plan adına bak
                const aktif = plan === pl.id && (
                  !durum?.odeme_donemi ||
                  (yillik ? durum.odeme_donemi === 'yillik' : durum.odeme_donemi === 'aylik')
                )
                const yukleniyor_bu = iapYukleniyor && satinAlinanPlan === pl.id
                return (
                  <div key={pl.id} className="col-12">
                    <div className={`${p}-abn-plan-card ${aktif ? 'aktif-plan' : ''} ${pl.onerilen && !aktif ? 'onerilen' : ''}`}>

                      <div className="d-flex align-items-center justify-content-between mb-3" style={{ minHeight: 24 }}>
                        <div className="d-flex gap-2">
                          {aktif && <span className={`${p}-abn-badge-active`}>✓ Aktif Plan</span>}
                          {pl.onerilen && !aktif && <span className={`${p}-abn-badge-rec`}>★ Önerilen</span>}
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <i className={`bi ${pl.ikon}`} style={{ fontSize: 16, color: pl.id === 'standart' ? 'var(--p-color-primary)' : 'var(--p-color-primary-dark)' }} />
                            <span className={`${p}-abn-plan-name`}>{pl.ad}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--p-text-muted)', marginBottom: 8 }}>{pl.aciklama}</div>
                          {yillik ? (
                            <>
                              <div className="d-flex align-items-baseline gap-1">
                                <span className={`${p}-abn-plan-price`}>{fmt(pl.fiyatYillik)}</span>
                                <span className={`${p}-abn-price-unit`}>₺/yıl</span>
                              </div>
                              <div className={`${p}-abn-yearly-note`}>{fmt(pl.fiyat)} ₺/ay olarak hesaplanır</div>
                            </>
                          ) : (
                            <div className="d-flex align-items-baseline gap-1">
                              <span className={`${p}-abn-plan-price`}>{fmt(pl.fiyat)}</span>
                              <span className={`${p}-abn-price-unit`}>₺/ay</span>
                            </div>
                          )}
                        </div>

                        {aktif ? (
                          <button className={`${p}-abn-btn-pasif`} disabled style={{ minWidth: 110 }}>✓ Aktif</button>
                        ) : (
                          <button
                            className={`abn-btn ${pl.id === 'standart' ? 'yesil-standart' : 'yesil-kurumsal'}`}
                            style={{ minWidth: 110 }}
                            onClick={() => iapSatinAl(pl.id)}
                            disabled={iapYukleniyor}
                          >
                            {yukleniyor_bu
                              ? <span className="spinner-border spinner-border-sm" />
                              : <><i className={`bi ${ANDROID_MU ? 'bi-google-play' : 'bi-apple'} me-1`} />{pl.ad}&#39;a Geç</>
                            }
                          </button>
                        )}
                      </div>

                      <div className={`${p}-abn-sep`} style={{ margin: '12px 0' }} />
                      <div className="d-flex flex-wrap gap-2">
                        {pl.ozellikler.map((oz) => (
                          <span key={oz} style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>
                            <i className="bi bi-check-circle-fill me-1" style={{ color: 'var(--p-color-primary)' }} />{oz}
                          </span>
                        ))}
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>

            {/* Geri yükle butonu */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <button
                className="btn btn-link"
                style={{ fontSize: 13, color: 'var(--p-text-muted)', textDecoration: 'none' }}
                onClick={satinAlimlarıGeriYukle}
                disabled={iapYukleniyor}
              >
                {iapYukleniyor && !satinAlinanPlan
                  ? <span className="spinner-border spinner-border-sm me-1" />
                  : <i className="bi bi-arrow-counterclockwise me-1" />
                }
                {ANDROID_MU ? 'Aboneliği Geri Yükle' : 'Satın Alımları Geri Yükle'}
              </button>
            </div>

            {/* Yasal uyarı — platforma göre */}
            <div style={{ fontSize: 11, color: 'var(--p-text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: 8, padding: '0 8px' }}>
              {ANDROID_MU ? (
                <>
                  Abonelik Google Play üzerinden tahsil edilir.
                  Mevcut dönem bitmeden en az 24 saat önce iptal edilmezse otomatik yenilenir.
                  Aboneliği Google Play → Abonelikler bölümünden yönetebilirsiniz.
                </>
              ) : (
                <>
                  Abonelik, onayladıktan sonra iTunes hesabınızdan tahsil edilir.
                  Abonelikler mevcut dönem bitiminden en az 24 saat önce iptal edilmezse otomatik yenilenir.
                  Aboneliği iPhone Ayarlar → Apple ID → Abonelikler bölümünden yönetebilirsiniz.
                </>
              )}
            </div>
            <div style={{ fontSize: 11, textAlign: 'center', marginBottom: 16 }}>
              <a
                href="https://paramgo.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--p-color-primary)', textDecoration: 'none', fontWeight: 500 }}
              >Gizlilik Politikası</a>
              <span style={{ color: 'var(--p-text-muted)', margin: '0 8px' }}>·</span>
              <a
                href="https://paramgo.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--p-color-primary)', textDecoration: 'none', fontWeight: 500 }}
              >Kullanım Koşulları</a>
            </div>
          </>
        ) : (
          <>
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
                            {yillik && pl.fiyatYillik ? (
                              <>
                                <div className="d-flex align-items-baseline gap-1">
                                  <span className={`${p}-abn-plan-price`}>{fmt(pl.fiyatYillik)}</span>
                                  <span className={`${p}-abn-price-unit`}>₺/yıl</span>
                                </div>
                                <div className={`${p}-abn-yearly-note`}>
                                  {fmt(pl.fiyat)} ₺/ay olarak hesaplanır —{' '}
                                  <span className={`${p}-abn-savings`}>{pl.tasarruf}₺ tasarruf</span>
                                </div>
                              </>
                            ) : (
                              <div className="d-flex align-items-baseline gap-1">
                                <span className={`${p}-abn-plan-price`}>{fmt(pl.fiyat)}</span>
                                <span className={`${p}-abn-price-unit`}>₺/ay</span>
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
                      {aktif && durum?.iptal_planlandi ? (
                        <button
                          className={`abn-btn ${pl.id === 'standart' ? 'yesil-standart' : 'yesil-kurumsal'}`}
                          disabled={iapYukleniyor}
                          onClick={() => yukseltBaslat(pl.id, yillik ? 'yillik' : 'aylik')}
                        >
                          {iapYukleniyor && satinAlinanPlan === pl.id ? (
                            <><span className="spinner-border spinner-border-sm me-2" />Yönlendiriliyor...</>
                          ) : (
                            <><i className="bi bi-arrow-clockwise me-2" />Yeniden Abone Ol</>
                          )}
                        </button>
                      ) : aktif ? (
                        <button className={`${p}-abn-btn-pasif`} disabled>✓ Mevcut Planınız</button>
                      ) : pl.id === 'deneme' ? (
                        <button className={`${p}-abn-btn-pasif`} disabled>Ücretsiz Deneme</button>
                      ) : (
                        <button
                          className={`abn-btn ${pl.id === 'standart' ? 'yesil-standart' : 'yesil-kurumsal'}`}
                          disabled={iapYukleniyor}
                          onClick={() => yukseltBaslat(pl.id, yillik ? 'yillik' : 'aylik')}
                        >
                          {iapYukleniyor && satinAlinanPlan === pl.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Yönlendiriliyor...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-arrow-up-circle me-2" />
                              {pl.ad}&#39;a Geç
                            </>
                          )}
                        </button>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>

            {/* Web notu */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-color-primary)' }}>
                <i className="bi bi-phone-fill me-2" />
                Web'den aldığınız abonelik mobil uygulamada da geçerlidir.
              </span>
            </div>
          </>
        )}

        {/* DAVET KODU — sadece web */}
        {PLATFORM === 'web' && <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {!davetAcik ? (
            <button
              type="button"
              onClick={() => setDavetAcik(true)}
              style={{ background: 'none', border: 'none', color: 'var(--p-text-muted)', fontSize: 13, cursor: 'pointer', padding: '4px 8px', fontFamily: 'inherit' }}
            >
              <i className="bi bi-ticket-perforated me-1" />
              Davet kodunuz var mı?
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, maxWidth: 360, margin: '0 auto', alignItems: 'center' }}>
              <input
                type="text"
                value={davetKodu}
                onChange={e => setDavetKodu(e.target.value.toUpperCase())}
                placeholder="PG-XXXXXX"
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 10,
                  border: '1px solid #E5E7EB', fontSize: 13,
                  fontFamily: 'monospace', letterSpacing: 1, outline: 'none',
                }}
                onKeyDown={e => e.key === 'Enter' && davetKoduUygula()}
                autoFocus
              />
              <button
                onClick={davetKoduUygula}
                disabled={davetYukleniyor || !davetKodu.trim()}
                style={{
                  padding: '9px 16px', borderRadius: 10,
                  background: 'var(--p-color-primary)', color: '#fff',
                  border: 'none', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                  cursor: davetYukleniyor || !davetKodu.trim() ? 'not-allowed' : 'pointer',
                  opacity: davetYukleniyor || !davetKodu.trim() ? 0.6 : 1,
                }}
              >
                {davetYukleniyor ? <span className="spinner-border spinner-border-sm" /> : 'Uygula'}
              </button>
              <button
                type="button"
                onClick={() => { setDavetAcik(false); setDavetKodu('') }}
                style={{ background: 'none', border: 'none', color: 'var(--p-text-muted)', cursor: 'pointer', padding: '4px', fontFamily: 'inherit' }}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}
        </div>}

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

