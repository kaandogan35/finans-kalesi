/**
 * Finans Kalesi — Abonelik API
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
}
