import api from './axios'

export const odemeApi = {
  listele:  (params = {}) => api.get('/odemeler',                { params }),
  ozet:     ()             => api.get('/odemeler/ozet'),
  getir:    (id)           => api.get(`/odemeler/${id}`),
  olustur:  (veri)         => api.post('/odemeler',               veri),
  guncelle: (id, veri)     => api.put(`/odemeler/${id}`,          veri),
  tamamla:  (id, veri = {})=> api.put(`/odemeler/${id}/tamamla`,  veri),
  sil:      (id)           => api.delete(`/odemeler/${id}`),
}
