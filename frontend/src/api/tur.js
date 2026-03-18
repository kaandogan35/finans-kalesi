import api from './axios'

export const turApi = {
  durumGetir: ()          => api.get('/tur'),
  tamamla:    (turAdi)    => api.put(`/tur/${turAdi}`),
}
