import axios from './axios'

export const raporlarApi = {
  // Cari yaşlandırma
  cariYaslandirma: (params = {}) =>
    axios.get('/raporlar/cari-yaslandirma', { params }),

  // Nakit akış
  nakitAkis: (params = {}) =>
    axios.get('/raporlar/nakit-akis', { params }),

  // Çek/senet portföy
  cekPortfoy: (params = {}) =>
    axios.get('/raporlar/cek-portfoy', { params }),

  // Ödeme özet
  odemeOzet: (params = {}) =>
    axios.get('/raporlar/odeme-ozet', { params }),

  // Genel özet
  genelOzet: () =>
    axios.get('/raporlar/genel-ozet'),

  // Rapor geçmişi
  gecmis: (params = {}) =>
    axios.get('/raporlar/gecmis', { params }),
}
