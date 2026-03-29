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
    await StatusBar.setStyle({ style: Style.Dark })
    // F, I — Sidebar/koyu ekranlar bu fonksiyonları window üzerinden çağırır
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

    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open')
      // D, E — Aktif input'u görünür alana kaydır (300ms: klavye tam açılana kadar bekle)
      setTimeout(() => {
        const el = document.activeElement
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 300)
    })

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open')
    })
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

export function platformBilgi() {
  return {
    native: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
  }
}
