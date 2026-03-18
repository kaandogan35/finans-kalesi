import { create } from 'zustand'
import { turApi } from '../api/tur'

const useTurStore = create((set, get) => ({
  tamamlananTurlar: null,   // null = henüz yüklenmedi
  aktifTur:         null,   // { turAdi, adimlar, mevcutAdim }
  hosgeldinPrompt:  false,

  // Backend'den tamamlanan turları yükle
  yukleTurlar: async () => {
    try {
      const res = await turApi.durumGetir()
      const liste = res.data.veri?.tamamlanan_turlar ?? []
      set({ tamamlananTurlar: liste })

      // Hiç tur yoksa hoşgeldin promptunu hazırla
      if (liste.length === 0) {
        set({ hosgeldinPrompt: true })
      }
    } catch {
      set({ tamamlananTurlar: [] })
    }
  },

  // Turu başlat
  turBaslat: (turAdi, adimlar) => {
    set({ aktifTur: { turAdi, adimlar, mevcutAdim: 0 }, hosgeldinPrompt: false })
  },

  // Turu kapat (tamamlandı veya atlandı)
  turKapat: async () => {
    const { aktifTur, tamamlananTurlar } = get()
    if (!aktifTur) return

    const turAdi = aktifTur.turAdi
    set({ aktifTur: null })

    // Backend'de işaretle
    try {
      await turApi.tamamla(turAdi)
      const guncel = [...(tamamlananTurlar ?? []), turAdi]
      set({ tamamlananTurlar: [...new Set(guncel)] })
    } catch {
      // Sessizce geç
    }
  },

  // İleri git
  adimIleri: async () => {
    const { aktifTur } = get()
    if (!aktifTur) return

    const sonAdim = aktifTur.mevcutAdim >= aktifTur.adimlar.length - 1
    if (sonAdim) {
      await get().turKapat()
    } else {
      set({ aktifTur: { ...aktifTur, mevcutAdim: aktifTur.mevcutAdim + 1 } })
    }
  },

  // Geri git
  adimGeri: () => {
    const { aktifTur } = get()
    if (!aktifTur || aktifTur.mevcutAdim === 0) return
    set({ aktifTur: { ...aktifTur, mevcutAdim: aktifTur.mevcutAdim - 1 } })
  },

  // Hoşgeldin promptunu kapat (hayır)
  promptKapat: async () => {
    set({ hosgeldinPrompt: false })
    try {
      await turApi.tamamla('hosgeldin')
      const { tamamlananTurlar } = get()
      const guncel = [...(tamamlananTurlar ?? []), 'hosgeldin']
      set({ tamamlananTurlar: [...new Set(guncel)] })
    } catch {
      // Sessizce geç
    }
  },
}))

export default useTurStore
