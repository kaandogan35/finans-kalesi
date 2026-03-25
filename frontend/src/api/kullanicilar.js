import api from './axios'

export const kullanicilarApi = {
  listele: () =>
    api.get('/kullanicilar'),

  getir: (id) =>
    api.get(`/kullanicilar/${id}`),

  olustur: (veri) =>
    api.post('/kullanicilar', veri),

  guncelle: (id, veri) =>
    api.put(`/kullanicilar/${id}`, veri),

  sil: (id) =>
    api.delete(`/kullanicilar/${id}`),

  sifreGuncelle: (id, yeni_sifre) =>
    api.put(`/kullanicilar/${id}/sifre`, { yeni_sifre }),
}
