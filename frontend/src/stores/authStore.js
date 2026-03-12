/**
 * Finans Kalesi — Auth Store (Zustand)
 *
 * Kullanıcı oturum bilgisi burada saklanır.
 * Uygulama genelinde useAuthStore() hook'u ile erişilir.
 */

import { create } from 'zustand'
import { authApi } from '../api/auth'

const useAuthStore = create((set, get) => ({
  // ─── State ───────────────────────────────────────────────────────────
  kullanici: null,
  yukleniyor: true,    // İlk yüklemede token kontrol sürüyor mu?
  girisYapildi: false,

  // ─── Actions ─────────────────────────────────────────────────────────

  /**
   * Uygulama başlarken mevcut token'dan kullanıcıyı yükle
   */
  baslat: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      set({ yukleniyor: false, girisYapildi: false })
      return
    }
    try {
      const yanit = await authApi.ben()
      set({
        kullanici: yanit.data.veri.kullanici,
        girisYapildi: true,
        yukleniyor: false,
      })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ yukleniyor: false, girisYapildi: false })
    }
  },

  /**
   * Giriş yap
   */
  girisYap: async (email, sifre) => {
    const yanit = await authApi.giris(email, sifre)
    const { kullanici, tokenlar } = yanit.data.veri

    localStorage.setItem('access_token', tokenlar.access_token)
    localStorage.setItem('refresh_token', tokenlar.refresh_token)

    set({ kullanici, girisYapildi: true })
    return kullanici
  },

  /**
   * Çıkış yap
   */
  cikisYap: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      await authApi.cikis(refreshToken)
    } catch {
      // Hata olsa da yerel state temizlenir
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ kullanici: null, girisYapildi: false })
    }
  },
}))

export default useAuthStore
