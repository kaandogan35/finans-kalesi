import api from './axios'

export const onboardingApi = {
  sirketGuncelle: (veri) =>
    api.post('/onboarding/sirket', veri),

  cariEkle: (veri) =>
    api.post('/onboarding/cari', veri),

  tamamla: (veri = {}) =>
    api.post('/onboarding/tamamla', veri),
}
