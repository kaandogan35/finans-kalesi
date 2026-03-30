import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

/* ── Kuyruk ve gösterim state'i ───────────────────────────────── */
let showFn = null
const queue = []

function processQueue() {
  if (queue.length && showFn) {
    showFn(queue.shift())
  }
}

/* ── Dışarıdan çağrılan API (toast.success/error yerine) ──── */
export const bildirim = {
  success: (mesaj) => bildirim._push('success', mesaj),
  error:   (mesaj) => bildirim._push('error', mesaj),
  info:    (mesaj) => bildirim._push('info', mesaj),
  warning: (mesaj) => bildirim._push('warning', mesaj),
  _push(tip, mesaj) {
    const item = { tip, mesaj, id: Date.now() + Math.random() }
    if (showFn) showFn(item)
    else queue.push(item)
  },
}

/* ── İkon + renk haritası ──────────────────────────────────── */
const CONF = {
  success: { ikon: 'bi-check-circle-fill', bg: '#ECFDF5', renk: '#059669', ring: '#10B981' },
  error:   { ikon: 'bi-exclamation-circle-fill', bg: '#FEF2F2', renk: '#DC2626', ring: '#EF4444' },
  info:    { ikon: 'bi-info-circle-fill', bg: '#EFF6FF', renk: '#2563EB', ring: '#3B82F6' },
  warning: { ikon: 'bi-exclamation-triangle-fill', bg: '#FFFBEB', renk: '#D97706', ring: '#F59E0B' },
}

/* ── React bileşeni — App seviyesinde bir kez mount edilir ── */
export default function CenterAlert() {
  const [item, setItem] = useState(null)
  const timerRef = useRef(null)

  const show = useCallback((data) => {
    setItem(data)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setItem(null)
      setTimeout(processQueue, 100)
    }, 2200)
  }, [])

  useEffect(() => {
    showFn = show
    processQueue()
    return () => { showFn = null }
  }, [show])

  if (!item) return null
  const c = CONF[item.tip] || CONF.info

  return createPortal(
    <div className="p-center-alert-overlay" onClick={() => { clearTimeout(timerRef.current); setItem(null) }}>
      <div className="p-center-alert-box" onClick={e => e.stopPropagation()}>
        <div className="p-center-alert-icon-wrap" style={{ background: c.bg }}>
          <i className={`bi ${c.ikon}`} style={{ fontSize: 32, color: c.renk }} />
        </div>
        <p className="p-center-alert-msg">{item.mesaj}</p>
      </div>
    </div>,
    document.body
  )
}
