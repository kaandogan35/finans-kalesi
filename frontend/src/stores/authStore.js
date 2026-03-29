/**
 * ParamGo — Auth Store (Zustand)
 *
 * Kullanıcı oturum bilgisi burada saklanır.
 * Uygulama genelinde useAuthStore() hook'u ile erişilir.
 *
 * Token'lar @capacitor/preferences ile persist edilir:
 *   - Native (iOS): iOS Keychain (şifreli, sistem korumalı)
 *   - Native (Android): EncryptedSharedPreferences (AES-256 şifreli)
 *   - Web (tarayıcı): localStorage (geliştirme ortamı fallback)
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Preferences } from '@capacitor/preferences'
import { authApi } from '../api/auth'
import useTemaStore from './temaStore'

// Capacitor Preferences tabanlı güvenli storage adapter
// Native'de şifreli depolama, web'de localStorage fallback kullanır
const guvenliStorage = createJSONStorage(() => ({
  getItem: async (name) => {
    const { value } = await Preferences.get({ key: name })
    return value ?? null
  },
  setItem: async (name, value) => {
    await Preferences.set({ key: name, value })
  },
  removeItem: async (name) => {
    await Preferences.remove({ key: name })
  },
}))

const useAuthStore = create(
  persist(
    (set, get) => ({
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
          const kullanici = yanit.data.veri.kullanici
          set({ kullanici, girisYapildi: true, yukleniyor: false })
          // Tema store'u güncelle
          useTemaStore.getState().temaAyarla(kullanici.tema_adi || 'paramgo')
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
        // Tema store'u güncelle
        useTemaStore.getState().temaAyarla(kullanici.tema_adi || 'paramgo')
        return kullanici
      },

      /**
       * Onboarding tamamlandığında kullanici state'ini güncelle
       */
      onboardingTamamla: () => {
        const { kullanici } = get()
        if (kullanici) {
          set({ kullanici: { ...kullanici, onboarding_tamamlandi: 1 } })
        }
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
          useTemaStore.getState().temaAyarla('paramgo')
        }
      },
    }),
    {
      name: 'fk-auth',
      storage: guvenliStorage,
      // Sadece token'ları persist et — kullanıcı bilgisi baslat() ile yeniden yüklenir
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

export default useAuthStore
