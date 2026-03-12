import api from './axios'

export const dashboardApi = {
  cariOzet:      () => api.get('/cariler/ozet'),
  cekSenetOzet:  () => api.get('/cek-senet/ozet'),
  odemeOzet:     () => api.get('/odemeler/ozet'),
}
