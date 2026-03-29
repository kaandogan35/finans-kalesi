/**
 * chartConfig.js — Tum Chart.js grafikleri icin ortak konfigurasyonlar
 * Tooltip, legend, animation, scale ayarlarini tek yerden yonetir
 */

const TL_COMPACT = (v) =>
  new Intl.NumberFormat('tr-TR', { notation: 'compact', compactDisplay: 'short' }).format(v) + ' \u20ba'

// ── Standart Tooltip ────────────────────────────────────
export const standardTooltip = {
  backgroundColor: 'rgba(17,24,39,0.92)',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  titleColor: 'rgba(255,255,255,0.6)',
  bodyColor: '#fff',
  padding: 12,
  cornerRadius: 10,
  titleFont: { family: 'Plus Jakarta Sans', size: 12 },
  bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
}

// ── Standart Legend ─────────────────────────────────────
export const standardLegend = {
  labels: {
    usePointStyle: true,
    pointStyle: 'circle',
    padding: 20,
    font: { family: 'Plus Jakarta Sans', size: 12, weight: '500' },
    color: '#6B7280',
  },
}

// ── Standart Animasyon ──────────────────────────────────
export const standardAnimation = {
  duration: 600,
  easing: 'easeInOutQuart',
}

// ── Standart Y Ekseni ───────────────────────────────────
export const standardYScale = {
  ticks: {
    callback: (v) => TL_COMPACT(v),
    font: { family: 'Plus Jakarta Sans', size: 11 },
    color: '#9CA3AF',
  },
  grid: { color: 'rgba(0,0,0,0.05)' },
  border: { dash: [4, 4] },
}

// ── Standart X Ekseni ───────────────────────────────────
export const standardXScale = {
  ticks: {
    font: { family: 'Plus Jakarta Sans', size: 11 },
    color: '#6B7280',
  },
  grid: { display: false },
}

// ── Gradyan Fill Helper ─────────────────────────────────
export const getGradient = (ctx, chartArea, colorRgb, maxOpacity = 0.25) => {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  gradient.addColorStop(0, `rgba(${colorRgb}, ${maxOpacity})`)
  gradient.addColorStop(0.7, `rgba(${colorRgb}, 0.04)`)
  gradient.addColorStop(1, `rgba(${colorRgb}, 0)`)
  return gradient
}
