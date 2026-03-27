/**
 * DegisimBadge — Yüzde değişim rozeti (geçen aya göre)
 * Gösterge Paneli ve Bilanço sekmelerinde kullanılır.
 */

export default function DegisimBadge({ fark, tersCevirim = false, renkler }) {
  const pozitif = tersCevirim ? fark < 0 : fark > 0
  return (
    <span className="d-inline-flex align-items-center gap-1" style={{ fontSize:12, fontWeight:700, color: pozitif ? renkler.success : renkler.danger }}>
      <i className={`bi ${fark > 0 ? 'bi-arrow-up' : 'bi-arrow-down'}`} style={{ fontSize:11 }} />
      {Math.abs(fark).toFixed(1)}% geçen aya göre
    </span>
  )
}
