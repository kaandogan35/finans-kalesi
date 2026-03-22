export const temaRenkleri = {
  paramgo: { success: '#10B981', danger: '#EF4444', primary: '#10B981', accent: '#059669', warning: '#F59E0B', info: '#3B82F6', text: '#111827', textSec: '#6B7280', bg: '#F8F9FA' },
}

/** Hex renk kodunu rgba string'e çevirir. Örn: hexRgba('#ff0000', 0.5) → 'rgba(255,0,0,0.5)' */
export function hexRgba(hex, alpha = 1) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
