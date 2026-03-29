/**
 * DateInput.jsx — Tek tarih seçici
 * Native <input type="date"> yerine modern takvim popover
 * Klavyeden yazılabilir (GG.AA.YYYY) + takvimden seçilebilir
 * createPortal ile modal içinde kesilmez
 * G — Capacitor native platformda iOS/Android system date picker kullanılır
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { tr } from 'date-fns/locale'
import { format, parse, isValid } from 'date-fns'
import { Capacitor } from '@capacitor/core'
import 'react-day-picker/dist/style.css'

/**
 * Props:
 *   value: string "YYYY-MM-DD"
 *   onChange: (string "YYYY-MM-DD") => void
 *   className: string
 *   placeholder: string
 *   disabled: bool
 */

// G — Modül yüklendiğinde bir kez kontrol edilir (hook kuralı ihlali olmaz)
const isNative = Capacitor.isNativePlatform()

// G — Native (iOS/Android) için sistem date picker
function DateInputNative({ value, onChange, className = '', disabled }) {
  return (
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`p-date-input-native ${className}`}
    />
  )
}

// Web için takvim popover bileşeni (mevcut davranış korundu)
function DateInputDesktop({ value, onChange, className = '', placeholder = 'Tarih seçin', disabled }) {
  const [open, setOpen] = useState(false)
  const [typing, setTyping] = useState(false)
  const [textVal, setTextVal] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false })

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const isValidDate = selected && isValid(selected)

  const displayValue = isValidDate
    ? format(selected, 'dd.MM.yyyy')
    : ''

  // Popover pozisyon hesapla
  const calcPos = useCallback(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < 340
    setPos({
      top: openUp ? rect.top + window.scrollY : rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      openUp,
    })
  }, [])

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        const popover = document.getElementById('p-date-portal')
        if (popover && popover.contains(e.target)) return
        setOpen(false)
        setTyping(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Scroll/resize'da pozisyon güncelle
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

  const handleSelect = (date) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
      setOpen(false)
      setTyping(false)
    }
  }

  const startTyping = (e) => {
    e.stopPropagation()
    setTyping(true)
    setTextVal(displayValue)
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // GG.AA.YYYY formatında parse
  const commitText = () => {
    setTyping(false)
    if (!textVal.trim()) { onChange(''); return }
    const cleaned = textVal.replace(/\//g, '.')
    const parsed = parse(cleaned, 'dd.MM.yyyy', new Date())
    if (isValid(parsed) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
      onChange(format(parsed, 'yyyy-MM-dd'))
    }
  }

  // Otomatik nokta ekleme
  const handleTextChange = (e) => {
    let v = e.target.value.replace(/[^0-9.\/]/g, '')
    const digits = v.replace(/[^0-9]/g, '')
    if (digits.length >= 2 && !v.includes('.') && !v.includes('/')) {
      v = digits.slice(0, 2) + '.' + digits.slice(2)
    }
    if (digits.length >= 4) {
      const parts = v.split(/[.\/]/)
      if (parts.length === 2 && parts[1].length >= 2) {
        v = parts[0] + '.' + parts[1].slice(0, 2) + '.' + parts[1].slice(2)
      }
    }
    if (v.length > 10) v = v.slice(0, 10)
    setTextVal(v)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { commitText(); e.preventDefault() }
    if (e.key === 'Escape') { setTyping(false) }
  }

  const toggleCalendar = () => {
    if (disabled) return
    calcPos()
    setOpen(!open)
    setTyping(false)
  }

  const popover = open && createPortal(
    <div
      id="p-date-portal"
      className="p-date-popover"
      style={{
        position: 'absolute',
        top: pos.openUp ? 'auto' : pos.top,
        bottom: pos.openUp ? (window.innerHeight - pos.top + 4) : 'auto',
        left: pos.left,
      }}
    >
      <DayPicker
        mode="single"
        selected={isValidDate ? selected : undefined}
        onSelect={handleSelect}
        defaultMonth={isValidDate ? selected : new Date()}
        locale={tr}
        weekStartsOn={1}
        fixedWeeks
        showOutsideDays
      />
    </div>,
    document.body
  )

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {typing ? (
        <div className={`p-date-input-trigger ${className}`} style={{ padding: 0 }}>
          <input
            ref={inputRef}
            className="p-date-input-text"
            value={textVal}
            onChange={handleTextChange}
            onBlur={commitText}
            onKeyDown={handleKeyDown}
            placeholder="GG.AA.YYYY"
            maxLength={10}
            autoComplete="off"
          />
        </div>
      ) : (
        <div
          className={`p-date-input-trigger ${className}`}
          onClick={toggleCalendar}
          tabIndex={0}
          role="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onKeyDown={(e) => {
            if (e.key === 'Enter') toggleCalendar()
            if (/^[0-9]$/.test(e.key) && !disabled) {
              e.preventDefault()
              setTyping(true)
              setTextVal(e.key)
              setOpen(false)
              setTimeout(() => inputRef.current?.focus(), 0)
            }
          }}
        >
          <i className="bi bi-calendar3 p-date-input-icon" />
          <span
            className={displayValue ? 'p-date-input-value' : 'p-date-input-placeholder'}
            onDoubleClick={startTyping}
          >
            {displayValue || placeholder}
          </span>
          {value && !disabled && (
            <i
              className="bi bi-x p-date-input-clear"
              onClick={(e) => { e.stopPropagation(); onChange('') }}
            />
          )}
          {!disabled && (
            <i
              className="bi bi-pencil-square p-date-input-edit"
              onClick={startTyping}
              title="Klavyeden yaz"
            />
          )}
        </div>
      )}
      {popover}
    </div>
  )
}

// G — Ana dışa aktarım: native'de sistem seçici, web'de takvim popover
export function DateInput(props) {
  if (isNative) return <DateInputNative {...props} />
  return <DateInputDesktop {...props} />
}
