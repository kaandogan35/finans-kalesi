import api from './axios'

export const sinirApi = {
  durum: () => api.get('/sinir/durum'),
}
