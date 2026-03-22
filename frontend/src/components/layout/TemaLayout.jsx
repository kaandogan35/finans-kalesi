/**
 * ParamGo — Tema Layout Seçici
 *
 * temaStore'daki aktif temaya göre doğru AppLayout bileşenini render eder.
 * Yeni tema eklemek: harita nesnesine path + bileşen ekle.
 */

import useTemaStore from '../../stores/temaStore'
import AppLayoutParamGo from './AppLayoutParamGo'  // paramgo (modern yeşil)

const harita = {
  paramgo: AppLayoutParamGo,
  // Yeni temalar buraya eklenecek
}

export default function TemaLayout() {
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const Layout = harita[aktifTema] || AppLayoutParamGo
  return <Layout />
}
