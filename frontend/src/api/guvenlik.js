import api from './axios'

export const guvenlikApi = {
  // Aktif oturumlar
  oturumlar: () =>
    api.get('/guvenlik/oturumlar'),

  oturumSonlandir: (id) =>
    api.delete(`/guvenlik/oturumlar/${id}`),

  tumOturumlariSonlandir: () =>
    api.delete('/guvenlik/oturumlar/hepsi'),

  // Giriş geçmişi
  girisGecmisi: (params = {}) =>
    api.get('/guvenlik/giris-gecmisi', { params }),

  // Güvenlik ayarları
  ayarlarGetir: () =>
    api.get('/guvenlik/ayarlar'),

  ayarlarKaydet: (veri) =>
    api.put('/guvenlik/ayarlar', veri),

  // 2FA
  ikiFaktorBaslat: () =>
    api.post('/guvenlik/2fa/baslat'),

  ikiFaktorDogrula: (kod) =>
    api.post('/guvenlik/2fa/dogrula', { kod }),

  ikiFaktorDevreDisi: (sifre) =>
    api.delete('/guvenlik/2fa', { data: { sifre } }),

  // Sistem logları
  loglar: (params = {}) =>
    api.get('/guvenlik/log', { params }),

  // KVKK veri dışa aktarma
  veriDisaAktar: (sifre) =>
    api.post('/guvenlik/veri-disa-aktar', { sifre }),

  // App Store Guideline 5.1.1 — Hesap silme zorunluluğu
  hesapSil: (sifre) =>
    api.delete('/auth/hesap-sil', { data: { sifre } }),
}
