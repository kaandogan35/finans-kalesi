/**
 * ParamGo — Capacitor Platform Entegrasyonu
 *
 * Status bar: overlaysWebView=true (TEB/Papara tarzı — arka plan rengi uzanır)
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

  // ─── Keyboard — Input'u görünür tut ───────────────────
  try {
    const { Keyboard } = await import('@capacitor/keyboard')

    Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => {
      document.body.classList.add('keyboard-open')
      // resize:'none' olduğu için viewport küçülmez.
      // keyboardHeight kullanarak input klavye arkasında kalıyorsa scroll yap.
      setTimeout(() => {
        const el = document.activeElement
        if (!el || !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return

        const rect = el.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const keyboardTop = viewportHeight - keyboardHeight
        const inputBottom = rect.bottom + 16 // 16px nefes boşluğu

        if (inputBottom > keyboardTop) {
          // Modal içindeyse modal-body scroll edilir, yoksa p-content
          const scrollParent = encontrarScrollParent(el)
          if (scrollParent) {
            scrollParent.scrollTop += (inputBottom - keyboardTop)
          }
        }
      }, 300)
    })

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open')
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

// En yakın scroll edilebilir üst elementi bulur (modal-body, p-content, vb.)
function encontrarScrollParent(el) {
  let node = el.parentElement
  while (node) {
    const { overflowY } = window.getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node
    }
    node = node.parentElement
  }
  return document.documentElement
}

export function platformBilgi() {
  return {
    native: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
  }
}
