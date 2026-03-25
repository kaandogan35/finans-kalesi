import api from './axios'

export const bildirimApi = {
  // Bildirim listesi (sayfalı)
  listele: (params = {}) =>
    api.get('/bildirimler', { params }),

  // Okunmamış bildirim sayısı (badge için)
  okunmamisSayisi: () =>
    api.get('/bildirimler/okunmamis-sayisi'),

  // Tek bildirimi okundu yap
  okunduYap: (id) =>
    api.put(`/bildirimler/${id}/oku`),

  // Tümünü okundu yap
  tumunuOkunduYap: () =>
    api.put('/bildirimler/tumunu-oku'),

  // Bildirim sil
  sil: (id) =>
    api.delete(`/bildirimler/${id}`),

  // Tercihler
  tercihlerGetir: () =>
    api.get('/bildirimler/tercihler'),

  tercihlerKaydet: (tercihler) =>
    api.put('/bildirimler/tercihler', tercihler),
}
