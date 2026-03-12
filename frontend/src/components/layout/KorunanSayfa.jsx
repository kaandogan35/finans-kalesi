/**
 * KorunanSayfa — Giriş yapılmamışsa login'e yönlendir
 *
 * Kullanım:
 *   <Route element={<KorunanSayfa />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 */

import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'

export default function KorunanSayfa() {
  const { girisYapildi, yukleniyor } = useAuthStore()

  // Token kontrol ediliyor — beyaz ekran yerine spinner göster
  if (yukleniyor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!girisYapildi) {
    return <Navigate to="/giris" replace />
  }

  return <Outlet />
}
