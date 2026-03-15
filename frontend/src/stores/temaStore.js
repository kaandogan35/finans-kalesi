/**
 * Finans Kalesi — Tema Store (Zustand)
 *
 * Aktif arayüz temasını tutar.
 * Tema bilgisi login sonrası backend'den gelir, buraya yazılır.
 * Kalıcılık backend'de — bu store sadece runtime state.
 */

import { create } from 'zustand'

const useTemaStore = create((set) => ({
  aktifTema: 'banking',

  temaAyarla: (tema) => set({ aktifTema: tema }),
}))

export default useTemaStore
