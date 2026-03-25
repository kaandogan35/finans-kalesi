/**
 * ModulKoruma.jsx — Route Seviyesi Modül Erişim Guard'ı
 *
 * URL'e direkt yazarak yetkisiz modüle erişmeyi engeller.
 * Sahip rolü her modüle erişebilir.
 * Alt kullanıcılar: yetkiler.moduller listesinde yoksa /dashboard'a yönlenir.
 *
 * Kullanım (App.jsx):
 *   <Route element={<ModulKoruma modul="cari" />}>
 *     <Route path="/cariler" element={<CariYonetimi />} />
 *   </Route>
 */

import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'

export default function ModulKoruma({ modul }) {
  const { kullanici } = useAuthStore()

  if (!kullanici) return null

  // Sahip tam erişim
  if (kullanici.rol === 'sahip') return <Outlet />

  // yetkiler henüz yüklenmemişse (eski token) erişime izin ver
  if (!kullanici.yetkiler) return <Outlet />

  let izinliModuller = []
  try {
    const parsed = typeof kullanici.yetkiler === 'string'
      ? JSON.parse(kullanici.yetkiler)
      : kullanici.yetkiler
    izinliModuller = parsed?.moduller || []
  } catch {
    return <Navigate to="/dashboard" replace />
  }

  if (!izinliModuller.includes(modul)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
