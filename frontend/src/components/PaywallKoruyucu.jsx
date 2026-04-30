/**
 * PaywallKoruyucu — Global Paywall Yöneticisi
 *
 * YENİ MODEL (2026-04-30 sonrası):
 *  - Yeni kullanıcılar kayıt anında trial almaz → deneme planında ve modüllerde paywall
 *  - Hem iOS/Android (RevenueCat/Apple) hem Web (iyzico) için paywall açılır
 *  - Eski kullanıcılar geçiş süresi olarak deneme süreleri bitene kadar mevcut akış
 *
 * 2 görevi var:
 *  1. Oturum başına 1 kez otomatik paywall:
 *     - Plan='deneme' + yeni sistem kullanıcısı → dashboard'a ilk girişte modal
 *  2. Backend 403 PLAN_GEREKLI / DENEME_SURESI_DOLDU event'i dinle
 */

import { useState, useEffect, useRef } from 'react'
import useAuthStore from '../stores/authStore'
import PaywallModal from './PaywallModal'

// Anahtar kullanıcı bazlı — aynı tab'da çıkış+yeni kayıt yapılınca yeni id ile yeni anahtar olur
const oturumAnahtari = (kullaniciId) => `paramgo_paywall_gosterildi_${kullaniciId ?? 'anon'}`

export default function PaywallKoruyucu() {
  const kullanici = useAuthStore((s) => s.kullanici)
  const [acik, setAcik] = useState(false)
  const tetikRef = useRef(false)
  const sonUserIdRef = useRef(null)

  // Kullanıcı id değişince tetik bayrağını sıfırla — yeni kullanıcıya yeniden açılabilsin
  useEffect(() => {
    if (!kullanici) {
      tetikRef.current = false
      sonUserIdRef.current = null
      return
    }
    if (sonUserIdRef.current !== kullanici.id) {
      tetikRef.current = false
      sonUserIdRef.current = kullanici.id
    }
  }, [kullanici])

  // 1) Oturum başına 1 kez otomatik göster (Web + Native, yeni sistem)
  //    Koşul: deneme plan + YENİ SİSTEM kullanıcısı
  //    Eski kullanıcılar eski mantıkla devam eder (paywall zorlanmaz)
  useEffect(() => {
    if (!kullanici) return
    if (kullanici.plan !== 'deneme') return
    if (kullanici.yeni_sistem_kullanici !== true) return  // eski kullanıcıya dokunma
    if (tetikRef.current) return

    // Oturum başına 1 kez göster (kullanıcı bazlı)
    const anahtar = oturumAnahtari(kullanici.id)
    const gosterildi = sessionStorage.getItem(anahtar)
    if (gosterildi === '1') return

    // 1.2 saniye gecikme — dashboard render olsun, ani açılma rahatsız etmesin
    const t = setTimeout(() => {
      setAcik(true)
      sessionStorage.setItem(anahtar, '1')
      tetikRef.current = true
    }, 1200)

    return () => clearTimeout(t)
  }, [kullanici])

  // 2) 403 PLAN_GEREKLI / DENEME_SURESI_DOLDU event dinleyicisi (Web + Native)
  useEffect(() => {
    const handleAc = (e) => {
      if (kullanici?.plan !== 'deneme') return
      const kod = e?.detail?.kod
      // Yeni kullanıcı (PLAN_GEREKLI) veya süresi dolmuş eski kullanıcı (DENEME_SURESI_DOLDU)
      if (kullanici?.yeni_sistem_kullanici !== true && kod !== 'DENEME_SURESI_DOLDU') return
      setAcik(true)
      sessionStorage.setItem(oturumAnahtari(kullanici?.id), '1')
    }
    window.addEventListener('paywall:ac', handleAc)
    return () => window.removeEventListener('paywall:ac', handleAc)
  }, [kullanici])

  const kapat = () => setAcik(false)

  const basarili = () => {
    setAcik(false)
    // Plan aktifleştiğinde sessionStorage işaretini temizle (artık deneme değil)
    if (kullanici?.id) sessionStorage.removeItem(oturumAnahtari(kullanici.id))
  }

  return (
    <PaywallModal
      goster={acik}
      onKapat={kapat}
      onBasarili={basarili}
    />
  )
}
