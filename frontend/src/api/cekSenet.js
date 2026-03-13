import api from './axios'

const cekSenetApi = {
  listele:        (params) => api.get('/cek-senet',             { params }),
  ozet:           (params) => api.get('/cek-senet/ozet',        { params }),
  ekle:           (data)   => api.post('/cek-senet',            data),
  detay:          (id)     => api.get(`/cek-senet/${id}`),
  guncelle:       (id, data) => api.put(`/cek-senet/${id}`,     data),
  sil:            (id)     => api.delete(`/cek-senet/${id}`),
  durumGuncelle:  (id, data) => api.put(`/cek-senet/${id}/durum`, data),
}

export default cekSenetApi
