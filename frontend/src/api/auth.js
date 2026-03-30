import api from './axios'

export const authApi = {
  giris: (email, sifre) =>
    api.post('/auth/giris', { email, sifre }),

  kayit: (veri) =>
    api.post('/auth/kayit', veri),

  cikis: (refreshToken) =>
    api.post('/auth/cikis', { refresh_token: refreshToken }),

  ben: () =>
    api.get('/auth/ben'),

  sifreSifirlaIste: (email) =>
    api.post('/auth/sifre-sifirla-iste', { email }),

  sifreSifirla: (token, yeni_sifre) =>
    api.post('/auth/sifre-sifirla', { token, yeni_sifre }),

  appleGiris: (identity_token, ad, soyad, email) =>
    api.post('/auth/apple-giris', { identity_token, ad, soyad, email }),

  googleGiris: (id_token) =>
    api.post('/auth/google-giris', { id_token }),

  pushTokenKaydet: (token, platform) =>
    api.post('/push-tokens/kaydet', { token, platform }),
}
