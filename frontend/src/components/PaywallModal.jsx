/**
 * PaywallModal — Onboarding sonrası abonelik teklifi modalı
 *
 * Apple 3.1.2 uyumlu paywall bileşeni:
 *   - Tek paket: Standart Aylık 399 TL (com.paramgo.app.standart.aylik)
 *   - 7 gün ücretsiz deneme (Apple Introductory Offer)
 *   - Fiyat büyük ve net gösterilir (Apple zorunluluğu)
 *   - Gizlilik Politikası + Kullanım Şartları linki (Apple zorunluluğu)
 *   - Satın Alımları Geri Yükle butonu (Apple zorunluluğu)
 *   - "Şimdi değil, ilerle" linki ile kapatılabilir
 *
 * Kullanım:
 *   <PaywallModal goster={true} onKapat={...} onBasarili={...} />
 *
 * Referans: developer.apple.com/app-store/review/guidelines/#payments (3.1.2)
 */

import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import useAuthStore from '../stores/authStore'
import { abonelikApi } from '../api/abonelik'
import api from '../api/axios'
import { bildirim as toast } from './ui/CenterAlert'

const URUN_ID = 'com.paramgo.app.standart.aylik'
const STANDART_AYLIK_FIYAT = '399,99 ₺'

export default function PaywallModal({ goster, onKapat, onBasarili }) {
  const { iapPlanGuncelle } = useAuthStore()

  const [yukleniyor, setYukleniyor] = useState(true)
  const [satinAliniyor, setSatinAliniyor] = useState(false)
  const [geriYukleniyor, setGeriYukleniyor] = useState(false)
  const [paket, setPaket] = useState(null)
  const [trialUygun, setTrialUygun] = useState(false)  // Kullanıcı free trial almaya uygun mu?
  const [fiyatMetni, setFiyatMetni] = useState(STANDART_AYLIK_FIYAT)

  // Offering'i ve eligibility'yi yükle
  useEffect(() => {
    if (!goster) return
    if (!Capacitor.isNativePlatform()) {
      setYukleniyor(false)
      return
    }

    let iptal = false
    const yukle = async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')

        // RC'yi başlat (race condition önlemi)
        const { kullanici } = useAuthStore.getState()
        if (kullanici?.sirket_id) {
          const { revenueCatBaslat } = await import('../lib/capacitorInit')
          await revenueCatBaslat(kullanici.sirket_id)
        }

        const offerings = await Purchases.getOfferings()
        const paketler = offerings.current?.availablePackages ?? []
        const bulunan = paketler.find(p => p.product.identifier === URUN_ID)

        if (iptal) return

        if (!bulunan) {
          console.warn('Paywall: paket bulunamadı', URUN_ID)
          setYukleniyor(false)
          return
        }

        setPaket(bulunan)

        // Fiyatı App Store'dan al
        if (bulunan.product.priceString) {
          setFiyatMetni(bulunan.product.priceString)
        }

        // Trial eligibility kontrolü (iOS-only)
        try {
          const eligibility = await Purchases.checkTrialOrIntroDiscountEligibility({
            productIdentifiers: [URUN_ID],
          })
          const durum = eligibility?.[URUN_ID]?.status
          // 1 = INTRO_ELIGIBILITY_STATUS_ELIGIBLE
          // Dokümantasyon: https://www.revenuecat.com/docs/subscription-guidance/subscription-offers
          const uygun = durum === 1 || durum === 'INTRO_ELIGIBILITY_STATUS_ELIGIBLE'
          // introPrice alanı varsa ve ücretsizse → trial var
          const trialVarMi = bulunan.product.introPrice !== null && bulunan.product.introPrice !== undefined
          if (!iptal) setTrialUygun(uygun && trialVarMi)
        } catch (e) {
          console.warn('Eligibility kontrolü başarısız, güvenli taraf — trial gösterme:', e?.message)
          if (!iptal) setTrialUygun(false)
        }
      } catch (e) {
        console.error('Paywall yükleme hatası:', e?.message || e)
      } finally {
        if (!iptal) setYukleniyor(false)
      }
    }

    yukle()
    return () => { iptal = true }
  }, [goster])

  // Satın al
  const satinAl = useCallback(async () => {
    if (satinAliniyor || !paket) return
    setSatinAliniyor(true)
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')

      const satinAlim = await Purchases.purchasePackage({ aPackage: paket })
      console.log('Paywall satın alım:', JSON.stringify({
        aktif: satinAlim?.customerInfo?.activeSubscriptions,
      }))

      await Purchases.syncPurchases()

      toast.info('Abonelik doğrulanıyor...')
      await new Promise(r => setTimeout(r, 3000))

      // Token geçerliliğini kontrol et — uzun süren satın almada oturum düşmesin
      try {
        const { accessToken, refreshToken, tokenlariAyarla } = useAuthStore.getState()
        if (accessToken && refreshToken) {
          const payload = JSON.parse(atob(accessToken.split('.')[1]))
          const kalan = payload.exp - Math.floor(Date.now() / 1000)
          if (kalan < 300) {
            const yeni = await api.post('/auth/yenile', { refresh_token: refreshToken })
            tokenlariAyarla(yeni.data.veri.tokenlar.access_token, refreshToken)
          }
        }
      } catch { /* sessiz */ }

      // Backend'e doğrulat — 3 deneme x 4s
      let res = null
      for (let deneme = 1; deneme <= 3; deneme++) {
        try {
          res = await abonelikApi.iapDogrula()
          break
        } catch (err) {
          if (deneme === 3) {
            toast.error('Ödemeniz alındı ancak plan aktifleştirilemedi. Lütfen "Satın Alımları Geri Yükle" butonuna basın.')
            return
          }
          await new Promise(r => setTimeout(r, 4000))
        }
      }

      const { plan: yeniPlan, tokenlar } = res.data.veri
      iapPlanGuncelle(yeniPlan, tokenlar)

      toast.success('Aboneliğiniz aktifleştirildi!')
      onBasarili?.()
    } catch (e) {
      if (e?.userCancelled) {
        // Kullanıcı ödeme ekranını kapattı — sessiz
      } else {
        const detay = e?.message || 'bilinmeyen hata'
        console.error('Paywall satın alma hatası:', detay, e)
        toast.error(`Satın alma hatası: ${detay}`)
      }
    } finally {
      setSatinAliniyor(false)
    }
  }, [paket, satinAliniyor, iapPlanGuncelle, onBasarili])

  // Satın alımları geri yükle (Apple zorunlu)
  const geriYukle = useCallback(async () => {
    if (geriYukleniyor) return
    setGeriYukleniyor(true)
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      await Purchases.restorePurchases()
      await Purchases.syncPurchases()

      toast.info('Abonelik kontrol ediliyor...')
      await new Promise(r => setTimeout(r, 3000))

      const res = await abonelikApi.iapDogrula()
      if (res?.data?.basarili) {
        const { plan: yeniPlan, tokenlar } = res.data.veri
        iapPlanGuncelle(yeniPlan, tokenlar)
        toast.success('Aboneliğiniz geri yüklendi!')
        onBasarili?.()
      } else {
        toast.error('Aktif abonelik bulunamadı.')
      }
    } catch (e) {
      const kod = e?.response?.status
      if (kod === 404) {
        toast.error('Apple hesabınızda aktif abonelik bulunamadı.')
      } else if (e?.userCancelled) {
        // sessiz
      } else {
        toast.error('Geri yükleme başarısız. Lütfen tekrar deneyin.')
      }
    } finally {
      setGeriYukleniyor(false)
    }
  }, [geriYukleniyor, iapPlanGuncelle, onBasarili])

  if (!goster) return null

  return (
    <>
      <div className="p-modal-overlay" style={{ zIndex: 9998 }} />
      <div className="p-modal-center" style={{ zIndex: 9999 }}>
        <div className="p-modal-box" style={{ maxWidth: 440 }}>

          {/* Header — yeşil gradient (p-mh-success) */}
          <div className="p-modal-header p-mh-success">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                className="p-modal-icon p-modal-icon-green"
                style={{ background: 'rgba(255,255,255,0.18)', boxShadow: 'none' }}
              >
                <i className="bi bi-stars" style={{ fontSize: 18 }} />
              </div>
              <div>
                <h3 className="p-modal-title">Premium'a Geçin</h3>
                <div className="p-modal-sub">Tüm özellikler sınırsız</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 22px' }}>

            {/* Özellik listesi */}
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {[
                'Kaç para kazandığınızı anında görün',
                'Vadesi yaklaşan çeklerde otomatik hatırlatma',
                'Sınırsız müşteri ve tedarikçi takibi',
                'Kar/zarar analizi ve detaylı raporlar',
                'Verileriniz güvende — otomatik yedekleme',
              ].map((ozellik, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13.5,
                  color: '#374151',
                }}>
                  <i className="bi bi-check-circle-fill" style={{ color: '#10B981', fontSize: 15 }} />
                  <span>{ozellik}</span>
                </li>
              ))}
            </ul>

            {/* Fiyat bloğu — Apple 3.1.2: fiyat büyük ve net */}
            <div style={{
              textAlign: 'center',
              padding: '18px 16px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04))',
              border: '1.5px solid rgba(16,185,129,0.22)',
              borderRadius: 12,
              marginBottom: 18,
            }}>
              {/* Ana fiyat — büyük */}
              <div style={{
                fontSize: 32,
                fontWeight: 800,
                color: '#111827',
                lineHeight: 1.1,
                letterSpacing: '-0.5px',
              }}>
                {fiyatMetni}
                <span style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', marginLeft: 2 }}>
                  {' / ay'}
                </span>
              </div>

              {/* Trial bilgisi — alt metin */}
              {trialUygun && (
                <div style={{
                  fontSize: 12.5,
                  color: '#059669',
                  fontWeight: 600,
                  marginTop: 6,
                }}>
                  <i className="bi bi-gift-fill" style={{ marginRight: 5 }} />
                  İlk 7 gün ücretsiz — istediğiniz zaman iptal edebilirsiniz
                </div>
              )}
              {!trialUygun && !yukleniyor && (
                <div style={{
                  fontSize: 11.5,
                  color: '#6B7280',
                  marginTop: 6,
                }}>
                  Otomatik yenilenen abonelik — istediğiniz zaman iptal edebilirsiniz
                </div>
              )}
            </div>

            {/* Ana buton */}
            <button
              type="button"
              className="p-btn-save p-btn-save-green"
              onClick={satinAl}
              disabled={yukleniyor || satinAliniyor || geriYukleniyor || !paket}
              style={{ width: '100%', padding: '14px 18px', fontSize: 15, fontWeight: 700 }}
            >
              {satinAliniyor ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  İşleniyor...
                </>
              ) : yukleniyor ? (
                'Yükleniyor...'
              ) : trialUygun ? (
                <>
                  <i className="bi bi-gift me-2" />
                  7 Gün Ücretsiz Başlat
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-2" />
                  Abone Ol
                </>
              )}
            </button>

            {/* Geri yükle butonu */}
            <button
              type="button"
              onClick={geriYukle}
              disabled={satinAliniyor || geriYukleniyor}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '10px',
                background: 'transparent',
                border: 'none',
                color: '#6B7280',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {geriYukleniyor ? 'Yükleniyor...' : 'Satın Alımları Geri Yükle'}
            </button>

            {/* "Şimdi değil" linki */}
            <button
              type="button"
              onClick={onKapat}
              disabled={satinAliniyor}
              style={{
                width: '100%',
                marginTop: 4,
                padding: '8px',
                background: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                fontSize: 12,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Şimdi değil, daha sonra
            </button>

            {/* Legal linkler — Apple 3.1.2 zorunlu */}
            <div style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
              fontSize: 11,
            }}>
              <a
                href="https://paramgo.com/privacy"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#6B7280', textDecoration: 'none' }}
              >
                Gizlilik Politikası
              </a>
              <span style={{ color: '#D1D5DB' }}>•</span>
              <a
                href="https://paramgo.com/terms"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#6B7280', textDecoration: 'none' }}
              >
                Kullanım Şartları
              </a>
            </div>

            {/* Otomatik yenileme bilgilendirme metni */}
            <p style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 10.5,
              color: '#9CA3AF',
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              Abonelik otomatik olarak yenilenir. Yenilemeyi durdurmak için{' '}
              bitiş tarihinden en az 24 saat önce Apple ID ayarlarınızdan iptal edin.{' '}
              Ödeme, satın alma onayı sırasında Apple ID hesabınızdan tahsil edilir.
            </p>

          </div>
        </div>
      </div>
    </>
  )
}
