/**
 * Finans Kalesi — Tema Layout Seçici
 *
 * temaStore'daki aktif temaya göre doğru AppLayout bileşenini render eder.
 * Yeni tema eklemek: harita nesnesine path + bileşen ekle.
 */

import useTemaStore from '../../stores/temaStore'
import AppLayoutBanking from './AppLayoutBanking'  // banking (kurumsal lacivert)
import AppLayoutEarthy  from './AppLayoutEarthy'   // earthy (toprak tonları)
import AppLayoutDark    from './AppLayoutDark'     // dark (fintech terminal)

const harita = {
  banking: AppLayoutBanking,
  earthy:  AppLayoutEarthy,
  dark:    AppLayoutDark,
}

export default function TemaLayout() {
  const aktifTema = useTemaStore((s) => s.aktifTema)
  const Layout = harita[aktifTema] || AppLayoutBanking
  return <Layout />
}
