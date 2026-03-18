/**
 * TanitimTuru — Spotlight tabanlı adım adım rehber
 * Hedef elementi çerçeve içine alır, backdrop delik efektiyle vurgular.
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useTurStore from '../../stores/turStore'

const OFFSET = 10  // Spotlight etrafındaki boşluk (px)
const BALON_GENISLIK = 460

export default function TanitimTuru() {
  const aktifTur   = useTurStore((s) => s.aktifTur)
  const adimIleri  = useTurStore((s) => s.adimIleri)
  const adimGeri   = useTurStore((s) => s.adimGeri)
  const turKapat   = useTurStore((s) => s.turKapat)

  const [hedefRect, setHedefRect] = useState(null)
  const balonRef = useRef(null)

  // Hedef elementi bul ve konumunu al
  useEffect(() => {
    if (!aktifTur) { setHedefRect(null); return }

    const adim = aktifTur.adimlar[aktifTur.mevcutAdim]
    if (!adim?.hedef) { setHedefRect(null); return }

    const el = document.querySelector(adim.hedef)
    if (!el) { setHedefRect(null); return }

    // instant scroll senkron — hemen ardından rect alınabilir
    el.scrollIntoView({ behavior: 'instant', block: 'center' })

    const hesapla = (element) => {
      const rect = element.getBoundingClientRect()
      return {
        top:    rect.top    - OFFSET,
        left:   rect.left   - OFFSET,
        width:  rect.width  + OFFSET * 2,
        height: rect.height + OFFSET * 2,
      }
    }

    // Scroll senkron, rect hemen hazır
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 || rect.height > 0) {
      setHedefRect(hesapla(el))
    } else {
      // Nadir: layout henüz oturmadı, 1 frame bekle
      const raf = requestAnimationFrame(() => setHedefRect(hesapla(el)))
      return () => cancelAnimationFrame(raf)
    }

    const onResize = () => setHedefRect(hesapla(el))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [aktifTur])

  // ESC ile kapat
  useEffect(() => {
    if (!aktifTur) return
    const handler = (e) => { if (e.key === 'Escape') turKapat() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [aktifTur, turKapat])

  if (!aktifTur) return null

  const adim        = aktifTur.adimlar[aktifTur.mevcutAdim]
  const toplamAdim  = aktifTur.adimlar.length
  const mevcutAdim  = aktifTur.mevcutAdim
  const sonAdimMi   = mevcutAdim === toplamAdim - 1

  // Balon konumunu hesapla
  const ekranGen     = window.innerWidth
  const ekranYuk     = window.innerHeight
  const gercekGenislik = Math.min(BALON_GENISLIK, ekranGen - 32)

  let balonStil = {
    position: 'fixed',
    width: gercekGenislik,
    zIndex: 10001,
  }

  if (hedefRect) {
    const balonYuk  = 240  // yaklaşık

    // Önce altına koy, sığmazsa üstüne
    const altBoşluk = ekranYuk - (hedefRect.top + hedefRect.height)
    const ustuBosluk = hedefRect.top

    if (altBoşluk >= balonYuk + 20) {
      balonStil.top = hedefRect.top + hedefRect.height + 16
    } else if (ustuBosluk >= balonYuk + 20) {
      balonStil.bottom = ekranYuk - hedefRect.top + 16
    } else {
      balonStil.top = Math.max(16, hedefRect.top)
    }

    // Yatay hizala
    let sol = hedefRect.left
    if (sol + gercekGenislik > ekranGen - 16) {
      sol = ekranGen - gercekGenislik - 16
    }
    if (sol < 16) sol = 16
    balonStil.left = sol
  } else {
    // Hedef yok → ortala
    balonStil.top  = '50%'
    balonStil.left = '50%'
    balonStil.transform = 'translate(-50%, -50%)'
  }

  return createPortal(
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      {hedefRect ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {/* Üst band */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: Math.max(0, hedefRect.top),
            background: 'rgba(0,0,0,0.72)',
          }} />
          {/* Sol band */}
          <div style={{
            position: 'absolute',
            top: Math.max(0, hedefRect.top),
            left: 0,
            width: Math.max(0, hedefRect.left),
            height: hedefRect.height,
            background: 'rgba(0,0,0,0.72)',
          }} />
          {/* Sağ band */}
          <div style={{
            position: 'absolute',
            top: Math.max(0, hedefRect.top),
            left: hedefRect.left + hedefRect.width,
            right: 0,
            height: hedefRect.height,
            background: 'rgba(0,0,0,0.72)',
          }} />
          {/* Alt band */}
          <div style={{
            position: 'absolute',
            top: hedefRect.top + hedefRect.height,
            left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.72)',
          }} />

          {/* Spotlight çerçevesi */}
          <div style={{
            position: 'absolute',
            top:    hedefRect.top,
            left:   hedefRect.left,
            width:  hedefRect.width,
            height: hedefRect.height,
            borderRadius: 10,
            boxShadow: '0 0 0 3px #b8860b, 0 0 24px rgba(184,134,11,0.6)',
            pointerEvents: 'none',
          }} />
        </div>
      ) : (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.72)',
          zIndex: 10000,
        }} />
      )}

      {/* Tıklama yakalama (backdrop'a tıklanınca atla) */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
        onClick={turKapat}
      />

      {/* ── Balon ─────────────────────────────────────────────────────────── */}
      <div
        ref={balonRef}
        style={balonStil}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.32)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #0a2463 0%, #153a7a 100%)',
            padding: '18px 22px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    background: '#b8860b',
                    color: '#fff',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 12px',
                    letterSpacing: 0.5,
                  }}>
                    {mevcutAdim + 1} / {toplamAdim}
                  </span>
                </div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 17, lineHeight: 1.3 }}>
                  {adim.baslik}
                </span>
              </div>
              <button
                onClick={turKapat}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.8)',
                  width: 32, height: 32,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, flexShrink: 0,
                }}
                aria-label="Turu kapat"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            {/* Progress bar */}
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 4, height: 4 }}>
              <div style={{
                background: '#b8860b',
                borderRadius: 4,
                height: '100%',
                width: `${((mevcutAdim + 1) / toplamAdim) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Gövde */}
          <div style={{ padding: '20px 22px' }}>
            <p style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.65,
              color: '#374151',
              fontWeight: 400,
            }}>
              {adim.aciklama}
            </p>
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 22px 18px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}>
            <button
              onClick={turKapat}
              style={{
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                color: '#9ca3af',
                fontSize: 13,
                cursor: 'pointer',
                padding: '8px 14px',
              }}
            >
              Turu Atla
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {mevcutAdim > 0 && (
                <button
                  onClick={adimGeri}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: 8,
                    color: '#374151',
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '10px 18px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <i className="bi bi-arrow-left" />
                  Geri
                </button>
              )}
              <button
                onClick={adimIleri}
                style={{
                  background: '#0a2463',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  padding: '10px 22px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  boxShadow: '0 2px 8px rgba(10,36,99,0.3)',
                }}
              >
                {sonAdimMi ? (
                  <><i className="bi bi-check-circle-fill" /> Tamamla</>
                ) : (
                  <>İleri <i className="bi bi-arrow-right" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
