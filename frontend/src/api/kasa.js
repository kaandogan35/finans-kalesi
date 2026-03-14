import api from './axios'
// UYARI: X-Kasa-Sifre header GÖNDERİLMEYECEK — sadece JWT yeterli

export const kasaOzeti           = ()          => api.get('/kasa/ozet')
export const hareketleriGetir    = (params={}) => api.get('/kasa/hareketler', { params })
export const hareketEkle         = (veri)      => api.post('/kasa/hareketler', veri)
export const hareketSil          = (id)        => api.delete(`/kasa/hareketler/${id}`)
export const yatirimlariGetir    = ()          => api.get('/kasa/yatirimlar')
export const yatirimEkle         = (veri)      => api.post('/kasa/yatirimlar', veri)
export const yatirimGuncelle     = (id, veri)  => api.put(`/kasa/yatirimlar/${id}`, veri)
export const yatirimSil          = (id)        => api.delete(`/kasa/yatirimlar/${id}`)
export const ortaklariGetir      = (params={}) => api.get('/kasa/ortaklar', { params })
export const ortakHareketEkle    = (veri)      => api.post('/kasa/ortaklar', veri)
export const ortakHareketSil     = (id)        => api.delete(`/kasa/ortaklar/${id}`)
