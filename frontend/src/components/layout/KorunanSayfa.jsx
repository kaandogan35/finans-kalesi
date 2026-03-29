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
import ParamGoLogo from '../../logo/ParamGoLogo'

export default function KorunanSayfa() {
  const { girisYapildi, yukleniyor } = useAuthStore()

  // Token kontrol ediliyor — modern loading ekranı
  if (yukleniyor) {
    return (
      <div className="pm-loading-screen">
        <div className="pm-loading-logo">
          <ParamGoLogo size="md" />
        </div>
        <div className="pm-loading-spinner" />
      </div>
    )
  }

  if (!girisYapildi) {
    return <Navigate to="/giris" replace />
  }

  return <Outlet />
}
