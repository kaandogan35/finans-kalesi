/**
 * Finans Kalesi — Axios yapılandırması
 *
 * Tüm API istekleri bu dosyadan geçer.
 * JWT token otomatik eklenir, 401 gelince token yenilenir.
 */

import axios from 'axios'

// Backend URL — Vite proxy /api isteklerini PHP sunucusuna yönlendirir
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── İstek interceptor: Her isteğe JWT token ekle ──────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) throw new Error('Refresh token yok')

        const yanit = await axios.post('/api/auth/yenile', {
          refresh_token: refreshToken,
        })

        const yeniToken = yanit.data.veri.tokenlar.access_token
        localStorage.setItem('access_token', yeniToken)

        // Sıradaki bekleyen istekleri çöz
        bekleyenIstekler.forEach((p) => p.resolve(yeniToken))
        bekleyenIstekler = []

        originalRequest.headers.Authorization = `Bearer ${yeniToken}`
        return api(originalRequest)
      } catch {
        // Yenileme başarısız → çıkış yap
        bekleyenIstekler.forEach((p) => p.reject(error))
        bekleyenIstekler = []
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/giris'
        return Promise.reject(error)
      } finally {
        tokenYenileniyor = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
