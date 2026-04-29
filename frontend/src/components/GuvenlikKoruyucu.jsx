/**
 * GuvenlikKoruyucu — Biyometrik Kilit + Jailbreak Tespiti
 *
 * Görevler:
 *   1. Uygulama başlarken jailbreak/root kontrolü (native platformda)
 *   2. Kullanıcı giriş yapmışsa biyometrik kimlik doğrulama
 *   3. Uygulama arka plandan öne gelince biyometrik kilit açma isteği
 *
 * Yalnızca native Capacitor uygulamasında aktif —
 * tarayıcı (web) ortamında children doğrudan render edilir.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import useAuthStore from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { hapticBasari, hapticHata } from '../utils/haptics'

// Lazy import — native platformda yükle
let NativeBiometric = null
let JailbreakRootDetection = null

async function pluginleriYukle() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const biometrik = await import('capacitor-native-biometric')
    NativeBiometric = biometrik.NativeBiometric
  } catch { /* Plugin yoksa sessizce geç */ }
  try {
    const jailbreak = await import('@basecom-gmbh/capacitor-jailbreak-root-detection')
    JailbreakRootDetection = jailbreak.JailbreakRootDetection
  } catch { /* Plugin yoksa sessizce geç */ }
}

export default function GuvenlikKoruyucu({ children }) {
  const { girisYapildi, cikisYap } = useAuthStore()
  const navigate = useNavigate()

  const [kilitli, setKilitli] = useState(false)
  const [jailbreakUyarisi, setJailbreakUyarisi] = useState(false)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const biyometrikAktifRef = useRef(false)

  // Web ortamında hiçbir şey yapma
  const nativeMi = Capacitor.isNativePlatform()

  const biyometrikKontrol = useCallback(async () => {
    if (!NativeBiometric || !girisYapildi) return
    // Android'de capacitor-native-biometric uyumsuz, devre dışı
    if (Capacitor.getPlatform() === 'android') return

    try {
      const { isAvailable } = await NativeBiometric.isAvailable()
      if (!isAvailable) return // Cihaz desteklemiyorsa kilit gösterme

      setKilitli(true)
      setHata('')
    } catch {
      // Biyometrik kontrol başarısız → kilidi kaldır, normal devam
      setKilitli(false)
    }
  }, [girisYapildi])

  const biyometrikAc = useCallback(async () => {
    if (!NativeBiometric) return
    setYukleniyor(true)
    setHata('')
    biyometrikAktifRef.current = true

    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Hesabınıza güvenli erişim',
        title: 'ParamGo Kimlik Doğrulama',
        subtitle: 'Face ID veya Touch ID ile devam edin',
        description: 'Finansal verilerinizi korumak için kimliğinizi doğrulayın',
        negativeButtonText: 'İptal',
        maxAttempts: 3,
      })
      await hapticBasari()
      setKilitli(false)
      setHata('')
    } catch (err) {
      await hapticHata()
      const mesaj = err?.message || ''
      if (mesaj.includes('cancel') || mesaj.includes('Cancel')) {
        setHata('Kimlik doğrulama iptal edildi.')
      } else {
        setHata('Kimlik doğrulama başarısız. Tekrar deneyin.')
      }
    } finally {
      setYukleniyor(false)
      biyometrikAktifRef.current = false
    }
  }, [])

  // Şifreyle giriş fallback → çıkış yap ve login'e yönlendir
  const sifreyeGit = useCallback(async () => {
    await cikisYap()
    navigate('/giris')
  }, [cikisYap, navigate])

  useEffect(() => {
    if (!nativeMi) return

    let listener = null

    ;(async () => {
      await pluginleriYukle()

      // 1. Jailbreak/root kontrolü
      if (JailbreakRootDetection) {
        try {
          const { isJailbroken } = await JailbreakRootDetection.isJailbrokenOrRooted()
          if (isJailbroken) setJailbreakUyarisi(true)
        } catch { /* kontrol başarısız → sessizce devam */ }
      }

      // 2. İlk açılışta biyometrik kilit
      if (girisYapildi) {
        await biyometrikKontrol()
      }

      // 3. Uygulama öne gelince biyometrik kilit (dialog açıkken tetiklenmesin)
      listener = await CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
        if (isActive && girisYapildi && !biyometrikAktifRef.current) {
          await biyometrikKontrol()
        }
      })
    })()

    return () => {
      listener?.remove()
    }
  }, [nativeMi, girisYapildi, biyometrikKontrol])

  // Web platformunda veya kilit yoksa direkt children
  if (!nativeMi || !kilitli) {
    return (
      <>
        {jailbreakUyarisi && (
          <div className="p-bio-uyari-kart" style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9998 }}>
            <i className="bi bi-shield-exclamation me-2" />
            Bu cihaz jailbreak/root tespit edildi. Verileriniz risk altında olabilir.
          </div>
        )}
        {children}
      </>
    )
  }

  // Biyometrik kilit ekranı
  return (
    <div className="p-bio-overlay">
      <div className="p-bio-logo-wrap">
        <i className="bi bi-currency-exchange p-bio-logo-icon" />
      </div>

      <p className="p-bio-baslik">ParamGo</p>
      <p className="p-bio-altyazi">
        Finansal verilerinize erişmek için<br />
        kimliğinizi doğrulayın
      </p>

      {jailbreakUyarisi && (
        <div className="p-bio-uyari-kart">
          <i className="bi bi-shield-exclamation me-1" />
          Cihazınızda güvenlik riski tespit edildi. Dikkatli olun.
        </div>
      )}

      {hata && (
        <div className="p-bio-hata-kart">
          <i className="bi bi-exclamation-circle me-1" />
          {hata}
        </div>
      )}

      <button
        className="p-bio-btn"
        onClick={biyometrikAc}
        disabled={yukleniyor}
        title="Biyometrik doğrulama"
      >
        <i className={yukleniyor ? 'bi bi-arrow-repeat' : 'bi bi-fingerprint'} />
      </button>
      <p className="p-bio-btn-yazi">Face ID / Touch ID ile aç</p>

      <button className="p-bio-fallback" onClick={sifreyeGit}>
        Şifreyle giriş yap
      </button>
    </div>
  )
}
