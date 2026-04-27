/**
 * ParamGo — Abonelik API
 */

import api from './axios'

export const abonelikApi = {
  /** Tüm planları fiyatlarıyla döndür (JWT gereksiz) */
  planlar: () => api.get('/abonelik/planlar'),

  /** Şirketin aktif planını döndür */
  durum: () => api.get('/abonelik/durum'),

  /** Ödeme geçmişini döndür */
  gecmis: () => api.get('/abonelik/gecmis'),

  /** Plan yükseltme talebi */
  yukselt: (veri) => api.post('/abonelik/yukselt', veri),

  /**
   * iOS IAP satın alımı doğrula ve planı aktifleştir
   * RevenueCat SDK'dan başarılı satın alım sonrası çağrılır.
   * Yanıt: { plan, tokenlar: { access_token, refresh_token } }
   */
  iapDogrula: () => api.post('/abonelik/iap-dogrula'),

  /** Web — iyzico aboneliği iptal et */
  iyzicoIptal: () => api.post('/abonelik/iyzico-iptal'),

  /** Web — Manuel doğrulama: token ile iyzico'dan abonelik durumunu çek ve plan'ı aktive et */
  iyzicoDogrula: (token) => api.post('/abonelik/iyzico-dogrula', { token }),

  /** Web — Abonelik referans kodu ile manuel aktivasyon (kullanıcı iyzico panelden kopyalar) */
  iyzicoAktive: (abonelik_ref) => api.post('/abonelik/iyzico-aktive', { abonelik_ref }),
}
