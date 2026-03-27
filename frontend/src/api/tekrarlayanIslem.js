import api from './axios'

const tekrarlayanIslemApi = {
  listele:        (params) => api.get('/tekrarlayan-islemler',               { params }),
  ozet:           ()       => api.get('/tekrarlayan-islemler/ozet'),
  detay:          (id)     => api.get(`/tekrarlayan-islemler/${id}`),
  ekle:           (data)   => api.post('/tekrarlayan-islemler',              data),
  guncelle:       (id, data) => api.put(`/tekrarlayan-islemler/${id}`,       data),
  sil:            (id)     => api.delete(`/tekrarlayan-islemler/${id}`),
  durumDegistir:  (id, data) => api.put(`/tekrarlayan-islemler/${id}/durum`, data),
  calistir:       ()       => api.post('/tekrarlayan-islemler/calistir'),
}

export default tekrarlayanIslemApi
