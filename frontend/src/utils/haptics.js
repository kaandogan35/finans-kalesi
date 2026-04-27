/**
 * haptics.js — Capacitor Haptics Yardımcı Fonksiyonları
 * Web tarayıcısında (native olmayan platform) sessizce görmezden gelinir.
 */

import { Haptics, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

const native = Capacitor.isNativePlatform()

export async function hapticBasari() {
  if (!native) return
  try {
    await Haptics.notification({ type: NotificationType.Success })
  } catch { /* sessizce geç */ }
}

export async function hapticHata() {
  if (!native) return
  try {
    await Haptics.notification({ type: NotificationType.Error })
  } catch { /* sessizce geç */ }
}
