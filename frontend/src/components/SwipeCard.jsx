/**
 * SwipeCard.jsx — Ortak Swipe-to-Action Bileşeni
 * Tüm modüllerde mobil kartlarda kullanılır
 * Sola kaydırınca arkadaki aksiyon butonları görünür
 */

import { useState, useEffect, useRef } from 'react'

const SWIPE_SNAP = 208 // maks 4 buton × 52px

function useSwipe(ref, { onSwipeLeft, threshold = 60 } = {}) {
  const startX = useRef(0)
  const currentX = useRef(0)
  const swiping = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onTouchStart = (e) => {
      startX.current = e.touches[0].clientX
      currentX.current = startX.current
      swiping.current = true
      el.style.transition = 'none'
    }
    const onTouchMove = (e) => {
      if (!swiping.current) return
      currentX.current = e.touches[0].clientX
      const diff = startX.current - currentX.current
      if (diff > 0) {
        el.style.transform = `translate3d(-${Math.min(diff, SWIPE_SNAP + 20)}px, 0, 0)`
      } else {
        el.style.transform = 'translate3d(0, 0, 0)'
      }
    }
    const onTouchEnd = () => {
      swiping.current = false
      const diff = startX.current - currentX.current
      el.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      if (diff > threshold) {
        el.style.transform = `translate3d(-${SWIPE_SNAP}px, 0, 0)`
        onSwipeLeft?.()
      } else {
        el.style.transform = 'translate3d(0, 0, 0)'
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [ref, onSwipeLeft, threshold])
}

/**
 * aksiyonlar: [{ icon, label, renk, onClick }]
 * renk: 'success' | 'warning' | 'info' | 'danger' | hex color
 */
const RENK_MAP = {
  success: '#059669',
  warning: '#d97706',
  info:    '#0284c7',
  danger:  '#dc2626',
  primary: '#10B981',
  accent:  '#d97706',
}

export default function SwipeCard({ aksiyonlar = [], children, className = '', onCardClick }) {
  const contentRef = useRef(null)
  const [acik, setAcik] = useState(false)

  useSwipe(contentRef, {
    onSwipeLeft: () => setAcik(true),
  })

  const kapat = () => {
    if (contentRef.current) {
      contentRef.current.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      contentRef.current.style.transform = 'translate3d(0, 0, 0)'
    }
    setAcik(false)
  }

  return (
    <div className={`p-swipe-wrapper ${className}`}>
      <div className="p-swipe-actions">
        {aksiyonlar.map((a, i) => (
          <button
            key={i}
            className="p-swipe-btn"
            style={{ background: RENK_MAP[a.renk] || a.renk }}
            onClick={() => { kapat(); a.onClick?.() }}
          >
            <i className={`bi ${a.icon}`} />
            <span>{a.label}</span>
          </button>
        ))}
      </div>
      <div ref={contentRef} className="p-swipe-content" onClick={() => { if (acik) kapat(); else onCardClick?.() }}>
        {children}
      </div>
    </div>
  )
}

// ─── Dinamik Avatar ──────────────────────────────────────────────────────────
const AVATAR_PALETI = [
  { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  { bg: '#ede9fe', border: '#c4b5fd', text: '#5b21b6' },
  { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' },
  { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },
  { bg: '#ccfbf1', border: '#5eead4', text: '#115e59' },
  { bg: '#fecdd3', border: '#fda4af', text: '#9f1239' },
  { bg: '#e0f2fe', border: '#7dd3fc', text: '#0c4a6e' },
]

function stringToColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETI[Math.abs(hash) % AVATAR_PALETI.length]
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].substring(0, 2).toUpperCase()
}

export function DynamicAvatar({ isim, boyut = 40 }) {
  const renk = stringToColor(isim || '')
  return (
    <div
      className="p-dynamic-avatar"
      style={{
        width: boyut, height: boyut,
        background: renk.bg, borderColor: renk.border, color: renk.text,
      }}
    >
      <span className="p-dynamic-avatar-text">{getInitials(isim)}</span>
    </div>
  )
}
