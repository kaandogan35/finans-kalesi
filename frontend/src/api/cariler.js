import api from './axios'

export const carilerApi = {
  listele:  (params = {}) => api.get('/cariler',         { params }),
  getir:    (id)          => api.get(`/cariler/${id}`),
  olustur:  (veri)        => api.post('/cariler',         veri),
  guncelle: (id, veri)    => api.put(`/cariler/${id}`,    veri),
  sil:      (id)          => api.delete(`/cariler/${id}`),

  // Hareketler
  hareketler:       (id, params = {}) => api.get(`/cariler/${id}/hareketler`, { params }),
  hareket_olustur:  (id, veri)        => api.post(`/cariler/${id}/hareketler`, veri),
  hareket_sil:      (cariId, hId)     => api.delete(`/cariler/${cariId}/hareketler/${hId}`),
}
