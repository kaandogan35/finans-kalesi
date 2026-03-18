/**
 * HosgeldinPrompt — İlk girişte 2.5 sn sonra görünen tur daveti
 * tamamlanan_turlar boşsa (uzunluk 0) gösterilir.
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import useTurStore from '../../stores/turStore'
import { TUR_ADIMLAR } from './turlar'

export default function HosgeldinPrompt() {
  const hosgeldinPrompt = useTurStore((s) => s.hosgeldinPrompt)
  const tamamlananTurlar = useTurStore((s) => s.tamamlananTurlar)
  const turBaslat       = useTurStore((s) => s.turBaslat)
  const promptKapat     = useTurStore((s) => s.promptKapat)

  const [gorunsun, setGorunsun] = useState(false)

  useEffect(() => {
    // Sadece hosgeldinPrompt true ise ve tamamlananlar boşsa göster
    if (!hosgeldinPrompt || tamamlananTurlar === null) return

    const t = setTimeout(() => setGorunsun(true), 2500)
    return () => clearTimeout(t)
  }, [hosgeldinPrompt, tamamlananTurlar])

  if (!gorunsun) return null

  const handleEvet = () => {
    setGorunsun(false)
    turBaslat('hosgeldin', TUR_ADIMLAR.hosgeldin)
  }

  const handleHayir = async () => {
    setGorunsun(false)
    await promptKapat()
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9990,
      }} onClick={handleHayir} />

      {/* Kart */}
      <div style={{
        position: 'fixed',
        bottom: 90, right: 24,
        zIndex: 9991,
        width: 340,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        animation: 'turSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Header şerit */}
        <div style={{
          background: 'linear-gradient(135deg, #0a2463 0%, #1a3a7a 100%)',
          padding: '20px 20px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(184,134,11,0.25)',
              border: '1.5px solid #b8860b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <i className="bi bi-map" style={{ color: '#f0c040', fontSize: 20 }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                Hoş geldiniz!
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>
                Finans Kalesi'ne ilk adımınız
              </div>
            </div>
          </div>
        </div>

        {/* Gövde */}
        <div style={{ padding: '16px 20px 20px' }}>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 16px' }}>
            Uygulamayı hızla öğrenmek için kısa bir tanıtım turu ister misiniz?
            Tüm modülleri adım adım anlatır, <strong>2 dakika</strong> sürer.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleEvet}
              style={{
                background: '#0a2463',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '11px 0',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <i className="bi bi-play-circle-fill" />
              Evet, turu başlat
            </button>

            <button
              onClick={handleHayir}
              style={{
                background: '#f1f5f9',
                color: '#6b7280',
                border: 'none',
                borderRadius: 10,
                padding: '10px 0',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Hayır, kendi keşfedeyim
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes turSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>,
    document.body
  )
}
