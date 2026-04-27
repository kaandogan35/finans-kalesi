/**
 * ParamGo — Capacitor Platform Entegrasyonu
 *
 * Status bar: overlaysWebView=false (layout entegre — safe area otomatik yönetilir)
 * Keyboard: body resize + scrollIntoView (input klavye arkasında kalmaz)
 * Back button: Android geri tuşu yönetimi
 * App state: foreground/background dinleme
 */

import { Capacitor } from '@capacitor/core'

export async function capacitorBaslat() {
  if (!Capacitor.isNativePlatform()) return

  // ─── Status Bar ───────────────────────────────────────
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setOverlaysWebView({ overlay: true })
    // window fonksiyonlarını hazırla — sayfalar bunları kullanır (race condition yok)
    // Başlangıç stili: native config'de DARK (capacitor.config.ts)
    window.__statusBarSetDark  = () => StatusBar.setStyle({ style: Style.Dark })
    window.__statusBarSetLight = () => StatusBar.setStyle({ style: Style.Light })
  } catch {}

  // ─── Splash Screen ────────────────────────────────────
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {}

  // ─── Keyboard — Modal'ı klavye üstüne taşı ───────────
  try {
    const { Keyboard } = await import('@capacitor/keyboard')

    Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => {
      document.body.classList.add('keyboard-open')
      document.documentElement.style.setProperty('--keyboard-h', `${keyboardHeight}px`)

      // RAF + 150ms: klavye animasyonu yerleştikten sonra layout oku
      setTimeout(() => requestAnimationFrame(() => {
        const el = document.activeElement
        if (!el || !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return

        // Fullscreen modallarda modal-box'ı hareket ettirme:
        // CSS max-height zaten küçülür, p-modal-body scroll eder → scrollIntoView yeterli
        if (el.closest('[class*="modal-fullscreen"]')) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          return
        }

        // Diğer modallarda (bottom sheet, ortalanmış) kutuyu yukarı kaydır
        const modalBox = el.closest('[class*="modal-box"], .sgm-box, .kum-box')
        if (!modalBox) return

        const rect = el.getBoundingClientRect()
        const keyboardTop = window.innerHeight - keyboardHeight
        const inputBottom = rect.bottom + 24

        if (inputBottom > keyboardTop) {
          const shift = Math.min(inputBottom - keyboardTop, keyboardHeight * 0.8)
          modalBox.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          modalBox.style.transform = `translate3d(0, -${shift}px, 0)`
        }
      }), 150)
    })

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open')
      document.documentElement.style.removeProperty('--keyboard-h')

      requestAnimationFrame(() => {
        document.querySelectorAll('[class*="modal-box"], .sgm-box, .kum-box').forEach(box => {
          box.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          box.style.transform = 'translate3d(0, 0, 0)'
        })
      })
    })
  } catch {}

  // ─── Push Notifications ───────────────────────────────
  // İzin ve kayıt — giriş sonrası window.registerPushToken tetiklenir
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const permResult = await PushNotifications.requestPermissions()
    if (permResult.receive === 'granted') {
      await PushNotifications.register()
    }
    PushNotifications.addListener('registration', ({ value: token }) => {
      // Token'ı global'e yaz — authStore girisYap/sosyalGiris sonrası okur
      window.__pushToken = token
      // Zaten giriş yapılmışsa anında gönder
      if (window.__pushTokenGonder) window.__pushTokenGonder(token)
    })
    PushNotifications.addListener('registrationError', () => {})
  } catch {}

  // ─── Android Back Button + App State ──────────────────
  try {
    const { App: CapApp } = await import('@capacitor/app')
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back()
      else CapApp.exitApp()
    })
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) window.dispatchEvent(new CustomEvent('app:resume'))
    })
  } catch {}
}


/**
 * RevenueCat SDK'yı başlat
 * Giriş yaptıktan sonra sirket_id ile çağrılır.
 * Müşteri ID: "sirket_{sirket_id}" formatı — backend ile eşleşmeli.
 * Aynı sirket_id ile tekrar çağrılırsa atlanır (double-configure önlemi).
 */
let _rcBaslatilmisSirketId = null
let _rcKuruldu = false  // O8: ilk configure yapıldı mı?

export async function revenueCatBaslat(sirketId) {
  if (!Capacitor.isNativePlatform()) return
  if (!sirketId) return
  // Aynı kullanıcı için zaten başlatıldıysa atla
  if (_rcBaslatilmisSirketId === sirketId) return
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const apiKey = import.meta.env.VITE_REVENUECAT_IOS_KEY
    if (!apiKey) {
      // K3: hata fırlat — sessizce dönme
      throw new Error('VITE_REVENUECAT_IOS_KEY tanımlı değil')
    }
    if (!_rcKuruldu) {
      // İlk başlatma — configure
      await Purchases.configure({
        apiKey,
        appUserID: `sirket_${sirketId}`,
      })
      _rcKuruldu = true
    } else {
      // O8: Hesap değişimi — configure yerine logIn kullan
      await Purchases.logIn({ appUserID: `sirket_${sirketId}` })
    }
    _rcBaslatilmisSirketId = sirketId
    console.log('RevenueCat başlatıldı, kullanıcı: sirket_' + sirketId)
  } catch (e) {
    // K3: guard'ı sıfırla ve hatayı çağırana ilet
    _rcBaslatilmisSirketId = null
    console.error('RevenueCat başlatma hatası:', e)
    throw e
  }
}
