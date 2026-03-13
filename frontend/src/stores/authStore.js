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
  accessToken: null,
  refreshToken: null,

  // ─── Actions ─────────────────────────────────────────────────────────

  /**
   * İki token'ı da store'a yazar
   */
  tokenlariAyarla: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken })
  },

  /**
   * İki token'ı da null yapar
   */
  tokenlarıTemizle: () => {
    set({ accessToken: null, refreshToken: null })
  },

  /**
   * Uygulama başlarken mevcut token'dan kullanıcıyı yükle
   */
  baslat: async () => {
    const { accessToken } = get()
    if (!accessToken) {
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
      get().tokenlarıTemizle()
      set({ yukleniyor: false, girisYapildi: false })
    }
  },

  /**
   * Giriş yap
   */
  girisYap: async (email, sifre) => {
    const yanit = await authApi.giris(email, sifre)
    const { kullanici, tokenlar } = yanit.data.veri

    get().tokenlariAyarla(tokenlar.access_token, tokenlar.refresh_token)

    set({ kullanici, girisYapildi: true })
    return kullanici
  },

  /**
   * Çıkış yap
   */
  cikisYap: async () => {
    try {
      const refreshToken = get().refreshToken
      await authApi.cikis(refreshToken)
    } catch {
      // Hata olsa da yerel state temizlenir
    } finally {
      get().tokenlarıTemizle()
      set({ kullanici: null, girisYapildi: false })
    }
  },
}))

export default useAuthStore
