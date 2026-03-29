/**
 * ParamGo — Capacitor Platform Entegrasyonu
 *
 * Native platform (iOS/Android) algılandığında:
 * - Android back button yönetimi
 * - Status bar stil ayarı
 * - Splash screen gizleme
 * - App state (background/foreground) dinleme
 *
 * Web'de çalışırken hiçbir şey yapmaz (güvenli import).
 */

import { Capacitor } from '@capacitor/core'

export async function capacitorBaslat() {
  // Web'de çalışıyorsak Capacitor pluginlerini yüklemeye gerek yok
  if (!Capacitor.isNativePlatform()) return

  try {
    // Status Bar
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Light })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#10B981' })
    }
  } catch {
    // Plugin yüklü değilse sessizce geç
  }

  try {
    // Splash Screen
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    // Plugin yüklü değilse sessizce geç
  }

  try {
    // Android Back Button
    const { App: CapApp } = await import('@capacitor/app')
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        CapApp.exitApp()
      }
    })

    // App state: foreground'a dönünce token kontrolü
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // Foreground'a döndü — token yenileme tetikle
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
    platform: Capacitor.getPlatform(), // 'web' | 'ios' | 'android'
  }
}
