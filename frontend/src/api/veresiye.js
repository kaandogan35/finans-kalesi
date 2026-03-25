import api from './axios'

export const veresiyeApi = {
  // Ana liste: tüm cariler + genel özet
  listele: (params = {}) => api.get('/veresiye', { params }),

  // Cari detay: bilgi + islemler
  cariDetay: (cariId) => api.get(`/veresiye/${cariId}`),

  // Yeni satış veya ödeme ekle
  islemEkle: (cariId, veri) => api.post(`/veresiye/${cariId}/islemler`, veri),

  // İşlem sil
  islemSil: (cariId, islemId) => api.delete(`/veresiye/${cariId}/islemler/${islemId}`),
}
