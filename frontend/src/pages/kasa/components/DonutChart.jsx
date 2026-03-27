/**
 * DonutChart — SVG pasta grafiği (Gösterge Paneli + Yatırım Kalesi)
 */
import { hexRgba } from '../../../lib/temaRenkleri'

export default function DonutChart({ parcalar, renk, boyut = 100, renkler: temaR }) {
  const cx = boyut / 2, cy = boyut / 2, r = (boyut / 2) - 8, sw = 14
  const toplam = parcalar.reduce((s, p) => s + p.tutar, 0)
  const baseSuccess = temaR?.success ?? '#10b981'
  const baseDanger  = temaR?.danger ?? '#ef4444'
  if (toplam === 0) {
    return (
      <svg width={boyut} height={boyut} viewBox={`0 0 ${boyut} ${boyut}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={temaR ? hexRgba(temaR.textSec, 0.06) : 'rgba(255,255,255,0.06)'} strokeWidth={sw} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill={temaR ? hexRgba(temaR.textSec, 0.25) : 'rgba(255,255,255,0.25)'} fontSize="11" fontWeight="600">Veri Yok</text>
      </svg>
    )
  }
  const donutRenkler = renk === 'giris'
    ? [baseSuccess, hexRgba(baseSuccess, 0.8), hexRgba(baseSuccess, 0.6), hexRgba(baseSuccess, 0.45)]
    : [baseDanger, hexRgba(baseDanger, 0.8), hexRgba(baseDanger, 0.6), hexRgba(baseDanger, 0.45)]
  const circumference = 2 * Math.PI * r
  let offset = -circumference / 4 // 12 o'clock başlangıç

  return (
    <svg width={boyut} height={boyut} viewBox={`0 0 ${boyut} ${boyut}`}>
      {parcalar.map((p, i) => {
        const pct = p.tutar / toplam
        const dashLen = pct * circumference
        const dashGap = circumference - dashLen
        const currentOffset = offset
        offset += dashLen
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={donutRenkler[i % donutRenkler.length]} strokeWidth={sw}
            strokeDasharray={`${dashLen} ${dashGap}`}
            strokeDashoffset={-currentOffset}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        )
      })}
      {/* Ortadaki toplam */}
      <text x={cx} y={cy - 2} textAnchor="middle" fill={temaR ? hexRgba(temaR.text, 0.7) : 'rgba(255,255,255,0.7)'} fontSize="10" fontWeight="700" letterSpacing="0.5">TOPLAM</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill={renk === 'giris' ? baseSuccess : baseDanger} fontSize="11" fontWeight="800" fontFamily="Inter, sans-serif">
        {toplam >= 1000000 ? `${(toplam/1000000).toFixed(1)}M` : toplam >= 1000 ? `${(toplam/1000).toFixed(0)}K` : toplam.toFixed(0)}
      </text>
    </svg>
  )
}
