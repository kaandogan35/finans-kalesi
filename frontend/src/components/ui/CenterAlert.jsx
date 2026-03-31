import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

let showFn = null
const queue = []
function processQueue() { if (queue.length && showFn) showFn(queue.shift()) }

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

const CONF = {
  success: { ikon: 'bi-check-circle-fill' },
  error:   { ikon: 'bi-exclamation-circle-fill' },
  info:    { ikon: 'bi-info-circle-fill' },
  warning: { ikon: 'bi-exclamation-triangle-fill' },
}

export default function CenterAlert() {
  const [item, setItem]       = useState(null)
  const [leaving, setLeaving] = useState(false)
  const timerRef              = useRef(null)
  const leaveRef              = useRef(null)

  useEffect(() => {
    showFn = (data) => {
      clearTimeout(timerRef.current)
      clearTimeout(leaveRef.current)
      setLeaving(false)
      setItem(data)
      timerRef.current = setTimeout(() => {
        setLeaving(true)
        leaveRef.current = setTimeout(() => {
          setItem(null)
          setLeaving(false)
          setTimeout(processQueue, 60)
        }, 220)
      }, 2200)
    }
    processQueue()
    return () => {
      showFn = null
      clearTimeout(timerRef.current)
      clearTimeout(leaveRef.current)
    }
  }, [])

  if (!item) return null
  const c = CONF[item.tip] || CONF.info

  function kapat() {
    clearTimeout(timerRef.current)
    clearTimeout(leaveRef.current)
    setLeaving(true)
    leaveRef.current = setTimeout(() => {
      setItem(null)
      setLeaving(false)
    }, 220)
  }

  return createPortal(
    <div className="p-center-alert-overlay">
      <div
        className={`p-center-alert-box${leaving ? ' p-alert-leaving' : ''}`}
        onClick={kapat}
      >
        <div className={`p-center-alert-icon ${item.tip}`}>
          <i className={`bi ${c.ikon}`} />
        </div>
        <p className="p-center-alert-msg">{item.mesaj}</p>
      </div>
    </div>,
    document.body
  )
}
