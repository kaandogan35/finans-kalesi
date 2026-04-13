/**
 * ParamGo — Axios yapılandırması
 *
 * Tüm API istekleri bu dosyadan geçer.
 * JWT token otomatik eklenir, 401 gelince token yenilenir.
 */

import axios from 'axios'
import { Capacitor } from '@capacitor/core'
import useAuthStore from '../stores/authStore'
import { bildirim } from '../components/ui/CenterAlert'

// Mobilde tam URL gerekli — web'de relative /api yeterli
const isNative = Capacitor.isNativePlatform()
const baseURL = isNative
  ? 'https://paramgo.com/api'
  : '/api'

// Platform etiketi — backend PlanKontrol middleware'i bu header'ı okur
// ve iOS/Web için ayrı kurallar uygular (iOS: deneme planı yazma yasağı)
const platformEtiketi = isNative ? (Capacitor.getPlatform() === 'android' ? 'android' : 'ios') : 'web'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': platformEtiketi,
  },
  timeout: 30000,
})

// ─── İstek interceptor: Her isteğe JWT token ekle ──────────────────────────
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  // Platform header'ı her istekte (default'tan override oluyorsa diye)
  if (!config.headers['X-Platform']) {
    config.headers['X-Platform'] = platformEtiketi
  }
  return config
})

// ─── Yanıt interceptor: 401 gelince token yenile ───────────────────────────
let tokenYenileniyor = false
let bekleyenIstekler = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 403 Plan gerekli → Paywall event'i yayınla (PaywallKoruyucu dinler)
    // Backend iOS'ta deneme planındaki kullanıcıya yazma yasağı uygular.
    // Modal'ların kendi generic "sistem hatası" toast'larını bastırmak için
    // bildirim.bastirSonraki() çağrılıyor — kullanıcı sadece paywall görür.
    if (error.response?.status === 403) {
      const kod = error.response?.data?.kod
      if (kod === 'PLAN_GEREKLI' || kod === 'DENEME_SURESI_DOLDU') {
        // Önce toast'ları bastır (1.5 saniye), sonra paywall aç
        bildirim.bastirSonraki(1500)
        window.dispatchEvent(new CustomEvent('paywall:ac', {
          detail: { kod, mesaj: error.response?.data?.hata },
        }))
      }
    }

    // 401 Yetkisiz + daha önce denenmediyse
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (tokenYenileniyor) {
        // Başka bir yenileme sürüyorsa, bu isteği sıraya al
        return new Promise((resolve, reject) => {
          bekleyenIstekler.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      tokenYenileniyor = true

      try {
        const { refreshToken, tokenlariAyarla } = useAuthStore.getState()
        if (!refreshToken) throw new Error('Refresh token yok')

        const yanit = await axios.post(`${baseURL}/auth/yenile`, {
          refresh_token: refreshToken,
        })

        const yeniToken = yanit.data.veri.tokenlar.access_token
        tokenlariAyarla(yeniToken, refreshToken)

        // Sıradaki bekleyen istekleri çöz
        bekleyenIstekler.forEach((p) => p.resolve(yeniToken))
        bekleyenIstekler = []

        originalRequest.headers.Authorization = `Bearer ${yeniToken}`
        return api(originalRequest)
      } catch {
        // Yenileme başarısız → çıkış olayı yayınla
        bekleyenIstekler.forEach((p) => p.reject(error))
        bekleyenIstekler = []
        useAuthStore.getState().tokenlarıTemizle()
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(error)
      } finally {
        tokenYenileniyor = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
