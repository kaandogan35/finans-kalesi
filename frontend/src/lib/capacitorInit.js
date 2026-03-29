/**
 * ParamGo — Capacitor Platform Entegrasyonu
 *
 * Native platform (iOS/Android) algılandığında:
 * - Status bar konfigürasyonu (iOS + Android)
 * - Splash screen gizleme
 * - Android back button yönetimi
 * - App state (background/foreground) dinleme
 *
 * Web'de çalışırken hiçbir şey yapmaz (güvenli import).
 */

import { Capacitor } from '@capacitor/core'

export async function capacitorBaslat() {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    // iOS + Android: Status bar stilini ayarla
    await StatusBar.setStyle({ style: Style.Dark })
    // Status bar WebView'ın üstüne binmesin
    await StatusBar.setOverlaysWebView({ overlay: false })

    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#FFFFFF' })
    }
  } catch {
    // Plugin yüklü değilse sessizce geç
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    // Plugin yüklü değilse sessizce geç
  }

  try {
    const { App: CapApp } = await import('@capacitor/app')
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        CapApp.exitApp()
      }
    })

    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        window.dispatchEvent(new CustomEvent('app:resume'))
      }
    })
  } catch {
    // Plugin yüklü değilse sessizce geç
  }
}

/**
 * Platform bilgisi
 */
export function platformBilgi() {
  return {
    native: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
  }
}
