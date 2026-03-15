import api from './axios'

export const temaGuncelle = (tema_adi) => api.put('/ayarlar/tema', { tema_adi })
