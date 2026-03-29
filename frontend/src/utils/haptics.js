/**
 * haptics.js — Capacitor Haptics Yardımcı Fonksiyonları
 *
 * Kullanım:
 *   import { hapticBasari, hapticHata, hapticHafif } from '../utils/haptics'
 *
 *   // Form kaydetme başarılı
 *   await hapticBasari()
 *
 *   // Hata durumu
 *   await hapticHata()
 *
 *   // Hafif dokunuş (buton, sekme değiştirme)
 *   await hapticHafif()
 *
 * Web tarayıcısında (native olmayan platform) sessizce görmezden gelinir.
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

const native = Capacitor.isNativePlatform()

/**
 * Başarı geri bildirimi — form kayıt, işlem tamamlandı
 */
export async function hapticBasari() {
  if (!native) return
  try {
    await Haptics.notification({ type: NotificationType.Success })
  } catch { /* sessizce geç */ }
}

/**
 * Hata geri bildirimi — validation hatası, API hatası
 */
export async function hapticHata() {
  if (!native) return
  try {
    await Haptics.notification({ type: NotificationType.Error })
  } catch { /* sessizce geç */ }
}

/**
 * Uyarı geri bildirimi — dikkat gerektiren durum
 */
export async function hapticUyari() {
  if (!native) return
  try {
    await Haptics.notification({ type: NotificationType.Warning })
  } catch { /* sessizce geç */ }
}

/**
 * Hafif dokunuş — buton tıklama, sekme değiştirme
 */
export async function hapticHafif() {
  if (!native) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch { /* sessizce geç */ }
}

/**
 * Orta dokunuş — önemli eylem onayı
 */
export async function hapticOrta() {
  if (!native) return
  try {
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch { /* sessizce geç */ }
}

/**
 * Güçlü dokunuş — silme, kritik eylem
 */
export async function hapticGuclu() {
  if (!native) return
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy })
  } catch { /* sessizce geç */ }
}
