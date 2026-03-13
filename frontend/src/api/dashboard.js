import api from './axios'

export const dashboardApi = {
  tumOzet: () => api.get('/dashboard'),
}
