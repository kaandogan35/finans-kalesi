/**
 * PaywallKoruyucu — Global Paywall Yöneticisi
 *
 * 2 görevi var:
 *
 *  1. Oturum başına 1 kez otomatik paywall:
 *     - Kullanıcı iOS'ta ve plan = 'deneme' ise
 *     - Dashboard'a ilk girişte PaywallModal açılır
 *     - SessionStorage ile oturum başına 1 kez gösterilir
 *
 *  2. Backend 403 PLAN_GEREKLI event'i dinle:
 *     - axios.js 403 aldığında 'paywall:ac' event'i fırlatır
 *     - Bu bileşen event'i yakalar ve PaywallModal'i açar
 *     - Kullanıcı yazma işlemi yapmaya çalıştığında otomatik tetiklenir
 *
 * TemaLayout içinde render edilir, böylece tüm korumalı sayfalarda aktif olur.
 */

import { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import useAuthStore from '../stores/authStore'
import PaywallModal from './PaywallModal'

const PAYWALL_OTURUM_KEY = 'paramgo_paywall_gosterildi'

export default function PaywallKoruyucu() {
  const kullanici = useAuthStore((s) => s.kullanici)
  const [acik, setAcik] = useState(false)
  const tetikRef = useRef(false)

  // 1) Oturum başına 1 kez otomatik göster
  //    Koşul: iOS + deneme plan + YENİ SİSTEM kullanıcısı
  //    Eski kullanıcılar eski mantıkla devam eder (paywall zorlanmaz)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (!kullanici) return
    if (kullanici.plan !== 'deneme') return
    if (kullanici.yeni_sistem_kullanici !== true) return  // eski kullanıcıya dokunma
    if (tetikRef.current) return

    // Oturum başına 1 kez göster
    const gosterildi = sessionStorage.getItem(PAYWALL_OTURUM_KEY)
    if (gosterildi === '1') return

    // 1.2 saniye gecikme — dashboard render olsun, ani açılma rahatsız etmesin
    const t = setTimeout(() => {
      setAcik(true)
      sessionStorage.setItem(PAYWALL_OTURUM_KEY, '1')
      tetikRef.current = true
    }, 1200)

    return () => clearTimeout(t)
  }, [kullanici])

  // 2) 403 PLAN_GEREKLI / DENEME_SURESI_DOLDU event dinleyicisi
  useEffect(() => {
    const handleAc = (e) => {
      if (!Capacitor.isNativePlatform()) return
      if (kullanici?.plan !== 'deneme') return
      const kod = e?.detail?.kod
      // Yeni kullanıcı (PLAN_GEREKLI) veya süresi dolmuş eski kullanıcı (DENEME_SURESI_DOLDU)
      if (kullanici?.yeni_sistem_kullanici !== true && kod !== 'DENEME_SURESI_DOLDU') return
      setAcik(true)
      sessionStorage.setItem(PAYWALL_OTURUM_KEY, '1')
    }
    window.addEventListener('paywall:ac', handleAc)
    return () => window.removeEventListener('paywall:ac', handleAc)
  }, [kullanici])

  const kapat = () => setAcik(false)

  const basarili = () => {
    setAcik(false)
    // Plan aktifleştiğinde sessionStorage işaretini temizle (artık deneme değil)
    sessionStorage.removeItem(PAYWALL_OTURUM_KEY)
  }

  return (
    <PaywallModal
      goster={acik}
      onKapat={kapat}
      onBasarili={basarili}
    />
  )
}
