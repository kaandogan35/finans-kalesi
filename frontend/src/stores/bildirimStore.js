import { create } from 'zustand'
import { bildirimApi } from '../api/bildirimler'

const useBildirimStore = create((set, get) => ({
  okunmamisSayisi: 0,
  bildirimler: [],
  yukleniyor: false,
  pollingInterval: null,

  // Okunmamış sayıyı getir (header badge için)
  okunmamisGetir: async () => {
    try {
      const { data } = await bildirimApi.okunmamisSayisi()
      if (data.basarili) {
        set({ okunmamisSayisi: data.veri.sayi })
      }
    } catch {
      // Sessiz hata — polling'de hata vermesin
    }
  },

  // Polling başlat (60 saniyede bir)
  pollingBaslat: () => {
    const mevcut = get().pollingInterval
    if (mevcut) return // Zaten çalışıyor

    // İlk çağrı hemen
    get().okunmamisGetir()

    const interval = setInterval(() => {
      get().okunmamisGetir()
    }, 60000) // 60 saniye

    set({ pollingInterval: interval })
  },

  // Polling durdur
  pollingDurdur: () => {
    const interval = get().pollingInterval
    if (interval) {
      clearInterval(interval)
      set({ pollingInterval: null })
    }
  },

  // Bildirim listesini getir
  listeleGetir: async (params = {}) => {
    set({ yukleniyor: true })
    try {
      const { data } = await bildirimApi.listele(params)
      if (data.basarili) {
        set({ bildirimler: data.veri.kayitlar || [] })
        return data.veri
      }
    } catch {
      // Hata
    } finally {
      set({ yukleniyor: false })
    }
    return null
  },

  // Okundu yap
  okunduYap: async (id) => {
    try {
      const { data } = await bildirimApi.okunduYap(id)
      if (data.basarili) {
        set((state) => ({
          bildirimler: state.bildirimler.map((b) =>
            b.id === id ? { ...b, okundu_mu: 1 } : b
          ),
          okunmamisSayisi: Math.max(0, state.okunmamisSayisi - 1),
        }))
      }
    } catch {
      // Hata
    }
  },

  // Tümünü okundu yap
  tumunuOkunduYap: async () => {
    try {
      const { data } = await bildirimApi.tumunuOkunduYap()
      if (data.basarili) {
        set((state) => ({
          bildirimler: state.bildirimler.map((b) => ({ ...b, okundu_mu: 1 })),
          okunmamisSayisi: 0,
        }))
      }
    } catch {
      // Hata
    }
  },

  // Bildirim sil
  bildirimSil: async (id) => {
    try {
      const { data } = await bildirimApi.sil(id)
      if (data.basarili) {
        set((state) => ({
          bildirimler: state.bildirimler.filter((b) => b.id !== id),
        }))
        // Sayıyı yenile
        get().okunmamisGetir()
      }
    } catch {
      // Hata
    }
  },
}))

export default useBildirimStore
