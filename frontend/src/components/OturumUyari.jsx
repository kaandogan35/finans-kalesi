/**
 * OturumUyari — Hareketsiz kalınca oturum uyarısı gösterir
 *
 * Kullanıcı 13 dakika hareketsiz kalırsa (mouse, klavye, dokunma yok)
 * son 2 dakikalık geri sayım başlar.
 * Herhangi bir hareket → sayaç sıfırlanır, uyarı kapanır.
 * "Oturumu Uzat" → refresh token ile yeniler.
 * Süre biterse → otomatik çıkış.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import useAuthStore from '../stores/authStore'
import { authApi } from '../api/auth'

// JWT payload'ını decode et (base64url → JSON)
function jwtPayloadOku(token) {
  try {
    const parcalar = token.split('.')
    if (parcalar.length !== 3) return null
    const payload = parcalar[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

const HAREKETSIZ_SURE = 13 * 60 // 13 dakika hareketsizlik sonrası uyarı (saniye)
const UYARI_SURESI = 120        // Son 2 dakika geri sayım (saniye)
const AKTIVITE_OLAYLARI = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']

export default function OturumUyari() {
  const [kalanSaniye, setKalanSaniye] = useState(null)
  const [goster, setGoster] = useState(false)
  const [uzatiliyor, setUzatiliyor] = useState(false)
  const timerRef = useRef(null)
  const sonAktiviteRef = useRef(Date.now())

  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const tokenlariAyarla = useAuthStore((s) => s.tokenlariAyarla)
  const tokenlarıTemizle = useAuthStore((s) => s.tokenlarıTemizle)

  // Kullanıcı aktivitesini dinle — hareketsizlik sayacını sıfırla
  useEffect(() => {
    if (!accessToken) return

    const aktiviteAlgilandi = () => {
      sonAktiviteRef.current = Date.now()
      // Uyarı gösteriliyorsa ve kullanıcı hareket ettiyse — uyarıyı kapat
      if (goster) {
        setGoster(false)
        setKalanSaniye(null)
      }
    }

    AKTIVITE_OLAYLARI.forEach(olay =>
      window.addEventListener(olay, aktiviteAlgilandi, { passive: true })
    )
    return () => {
      AKTIVITE_OLAYLARI.forEach(olay =>
        window.removeEventListener(olay, aktiviteAlgilandi)
      )
    }
  }, [accessToken, goster])

  // Hareketsizlik kontrolü
  useEffect(() => {
    if (!accessToken) {
      setGoster(false)
      setKalanSaniye(null)
      return
    }

    const kontrol = () => {
      const simdi = Date.now()
      const hareketsizSaniye = Math.floor((simdi - sonAktiviteRef.current) / 1000)

      // NOT: Access token süresi burada kontrol edilmez.
      // Token dolunca axios interceptor 401'i yakalar ve refresh yapar.
      // Burada logout yapmak refresh fırsatını engelliyor.

      // Hareketsizlik süresi eşiği geçtiyse — geri sayım göster
      if (hareketsizSaniye >= HAREKETSIZ_SURE) {
        const toplam = HAREKETSIZ_SURE + UYARI_SURESI
        const kalan = toplam - hareketsizSaniye

        if (kalan <= 0) {
          // Süre doldu — otomatik çıkış
          setGoster(false)
          tokenlarıTemizle()
          window.dispatchEvent(new CustomEvent('auth:logout'))
          return
        }

        setKalanSaniye(kalan)
        setGoster(true)
      } else {
        setGoster(false)
        setKalanSaniye(null)
      }
    }

    kontrol()
    timerRef.current = setInterval(kontrol, 1000)
    return () => clearInterval(timerRef.current)
  }, [accessToken, tokenlarıTemizle])

  // Oturumu uzat
  const oturumuUzat = useCallback(async () => {
    if (uzatiliyor || !refreshToken) return
    setUzatiliyor(true)
    try {
      const yanit = await authApi.ben() // Interceptor otomatik yenileyecek
      // Interceptor zaten token'ı yeniledi — ek bir şey yapmamıza gerek yok
      // Ama güvenli olsun diye doğrudan yenile endpointini de çağırabiliriz
      const { refreshToken: rt, tokenlariAyarla: ta } = useAuthStore.getState()
      if (rt) {
        const yeniYanit = await fetch('/api/auth/yenile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        })
        const data = await yeniYanit.json()
        if (data.basarili && data.veri?.tokenlar) {
          ta(data.veri.tokenlar.access_token, data.veri.tokenlar.refresh_token)
        }
      }
      sonAktiviteRef.current = Date.now()
      setGoster(false)
      setKalanSaniye(null)
    } catch {
      // Yenileme başarısız — çıkış
      tokenlarıTemizle()
      window.dispatchEvent(new CustomEvent('auth:logout'))
    } finally {
      setUzatiliyor(false)
    }
  }, [refreshToken, uzatiliyor, tokenlarıTemizle])

  if (!goster || kalanSaniye === null) return null

  const dakika = Math.floor(kalanSaniye / 60)
  const saniye = kalanSaniye % 60
  const zamanStr = `${dakika}:${String(saniye).padStart(2, '0')}`

  return (
    <>
    <div className="p-modal-overlay" style={{ zIndex: 9998 }} />
    <div className="p-modal-center p-modal-confirm" style={{ zIndex: 9999 }}>
      <div className="p-modal-box" style={{ maxWidth: 420 }}>

        {/* Header */}
        <div className="p-modal-header p-mh-warning">
          <h3 className="p-modal-title">
            <i className="bi bi-clock-history" />
            Oturum Süresi Doluyor
          </h3>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          {/* Geri sayım */}
          <div style={{
            fontSize: 40,
            fontWeight: 800,
            color: kalanSaniye <= 30 ? '#DC2626' : '#D97706',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.2,
            marginBottom: 8,
            transition: 'color 0.3s ease',
          }}>
            {zamanStr}
          </div>

          <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px', lineHeight: 1.5 }}>
            Oturumunuz kısa süre sonra sona erecek.<br />
            Devam etmek için oturumunuzu uzatın.
          </p>

          {/* Butonlar */}
          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="p-btn-cancel"
              onClick={() => {
                setGoster(false)
                tokenlarıTemizle()
                window.dispatchEvent(new CustomEvent('auth:logout'))
              }}
            >
              Çıkış Yap
            </button>
            <button
              type="button"
              className="p-btn-save p-btn-save-green"
              onClick={oturumuUzat}
              disabled={uzatiliyor}
            >
              {uzatiliyor ? 'Uzatılıyor...' : 'Oturumu Uzat'}
            </button>
          </div>
        </div>

      </div>
    </div>
    </>
  )
}
