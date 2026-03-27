/**
 * PerformansKarti — Performans karşılaştırma kartı (Aylık Bilanço sekmesinde)
 */
import { TL } from '../kasaUtils'
import DegisimBadge from './DegisimBadge'

export default function PerformansKarti({ label, yeni, eski, renk, bg, ikon, tersCevirim = false, p, renkler }) {
  const f = (eski != null && eski > 0) ? ((yeni - eski) / eski) * 100 : null
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className={`${p}-kasa-kpi-card`}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <div className={`${p}-kasa-icon-box`} style={{ background:bg }}><i className={`bi ${ikon}`} style={{ color:renk, fontSize:17 }} /></div>
          <span className={`${p}-kasa-kpi-label`}>{label}</span>
        </div>
        <div className={`financial-num ${p}-kasa-text-primary`} style={{ fontSize:'1.45rem', fontWeight:800, lineHeight:1.1 }}>{TL(yeni)}</div>
        {f != null ? (
          <div style={{ marginTop:5 }}><DegisimBadge fark={f} tersCevirim={tersCevirim} renkler={renkler} /></div>
        ) : (
          <p className={`${p}-kasa-text-muted`} style={{ margin:'5px 0 0' }}>Kıyaslanacak geçmiş veri yok.</p>
        )}
      </div>
    </div>
  )
}
