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
}
