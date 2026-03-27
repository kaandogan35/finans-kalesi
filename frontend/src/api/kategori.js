import api from './axios'

export const kategorileriGetir = (params = {}) => api.get('/kategoriler', { params })
export const kategoriEkle      = (veri)        => api.post('/kategoriler', veri)
export const kategoriGuncelle  = (id, veri)    => api.put(`/kategoriler/${id}`, veri)
export const kategoriSil       = (id)          => api.delete(`/kategoriler/${id}`)
