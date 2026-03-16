export const temaRenkleri = {
  banking: { success: '#1a7a55', danger: '#c0392b', primary: '#0a2463', accent: '#b8860b', warning: '#946d0a', info: '#1565c0', text: '#1a1f36', textSec: '#5a6175', bg: '#f2f4f7' },
  earthy:  { success: '#2d8050', danger: '#c0392b', primary: '#7a4a2a', accent: '#d4920b', warning: '#b37d08', info: '#2c6fbb', text: '#3d2c1e', textSec: '#7a6b5a', bg: '#faf7f2' },
  dark:    { success: '#00d68f', danger: '#ff5b5b', primary: '#00d4ff', accent: '#f4c542', warning: '#d4a017', info: '#4fc3f7', text: '#e2eaf4', textSec: '#8ba4be', bg: '#0d1b2e' },
}

/** Hex renk kodunu rgba string'e çevirir. Örn: hexRgba('#ff0000', 0.5) → 'rgba(255,0,0,0.5)' */
export function hexRgba(hex, alpha = 1) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
