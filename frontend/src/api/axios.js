/**
 * ParamGo — Axios yapılandırması
 *
 * Tüm API istekleri bu dosyadan geçer.
 * JWT token otomatik eklenir, 401 gelince token yenilenir.
 */

import axios from 'axios'
import { Capacitor } from '@capacitor/core'
import useAuthStore from '../stores/authStore'

// Mobilde tam URL gerekli — web'de relative /api yeterli
const isNative = Capacitor.isNativePlatform()
const baseURL = isNative
  ? 'https://paramgo.com/api'
  : '/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ─── İstek interceptor: Her isteğe JWT token ekle ──────────────────────────
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
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
