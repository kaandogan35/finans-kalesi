/**
 * DateRangePicker.jsx — Tarih aralığı seçici
 * Rapor filtreleri için: preset butonlar + takvim
 * createPortal ile modal içinde kesilmez
 * Mobilde tek ay + dikey layout
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { tr } from 'date-fns/locale'
import {
  format, parse, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  addDays, subMonths,
} from 'date-fns'
import 'react-day-picker/dist/style.css'

const PRESETS = [
  {
    label: 'Bu Hafta',
    range: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to:   endOfWeek(new Date(),   { weekStartsOn: 1 }),
    }),
  },
  {
    label: 'Bu Ay',
    range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: 'Bu Yıl',
    range: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
  },
  {
    label: 'Son 30 Gün',
    range: () => ({ from: addDays(new Date(), -30), to: new Date() }),
  },
  {
    label: 'Geçen Ay',
    range: () => {
      const prev = subMonths(new Date(), 1)
      return { from: startOfMonth(prev), to: endOfMonth(prev) }
    },
  },
]

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

/**
 * Props:
 *   from: string "YYYY-MM-DD"
 *   to: string "YYYY-MM-DD"
 *   onApply: ({ from: string, to: string }) => void
 */
export function DateRangePicker({ from, to, onApply }) {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState({
    from: from ? parse(from, 'yyyy-MM-dd', new Date()) : undefined,
    to:   to   ? parse(to,   'yyyy-MM-dd', new Date()) : undefined,
  })
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const isMobile = useIsMobile()

  const calcPos = useCallback(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + window.scrollY + 4,
      left: Math.max(8, Math.min(rect.left + window.scrollX, window.innerWidth - (isMobile ? 320 : 580))),
    })
  }, [isMobile])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && ref.current.contains(e.target)) return
      const portal = document.getElementById('p-daterange-portal')
      if (portal && portal.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    calcPos()
    const update = () => calcPos()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, calcPos])

  const displayText = (() => {
    const f = range?.from
    const t = range?.to
    if (!f) return 'Tarih aralığı seçin'
    if (!t) return format(f, 'd MMM yyyy', { locale: tr })
    return `${format(f, 'd MMM', { locale: tr })} – ${format(t, 'd MMM yyyy', { locale: tr })}`
  })()

  const applyRange = (r) => {
    if (r?.from && r?.to) {
      onApply({
        from: format(r.from, 'yyyy-MM-dd'),
        to:   format(r.to,   'yyyy-MM-dd'),
      })
      setOpen(false)
    }
  }

  const applyPreset = (preset) => {
    const r = preset.range()
    setRange(r)
    applyRange(r)
  }

  const toggleOpen = () => {
    if (!open) calcPos()
    setOpen(!open)
  }

  const popover = open && createPortal(
    <div
      id="p-daterange-portal"
      className="p-date-range-popover"
      style={{
        position: 'absolute',
        top: pos.top,
        left: isMobile ? 8 : pos.left,
        right: isMobile ? 8 : 'auto',
        maxWidth: isMobile ? 'calc(100vw - 16px)' : 'none',
      }}
    >
      {/* Preset Butonlar */}
      <div className="p-date-range-presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="p-date-range-preset-btn"
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Takvim */}
      <div className="p-date-range-cal">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          locale={tr}
          weekStartsOn={1}
          numberOfMonths={isMobile ? 1 : 2}
          fixedWeeks
          showOutsideDays
        />
        <div className="p-date-range-footer">
          <button
            type="button"
            className="p-date-range-apply-btn"
            disabled={!range?.from || !range?.to}
            onClick={() => applyRange(range)}
          >
            Uygula
          </button>
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="p-date-range-trigger"
        onClick={toggleOpen}
        aria-expanded={open}
      >
        <i className="bi bi-calendar-range" />
        <span>{displayText}</span>
        <i className="bi bi-chevron-down p-date-range-chevron" />
      </button>
      {popover}
    </div>
  )
}
