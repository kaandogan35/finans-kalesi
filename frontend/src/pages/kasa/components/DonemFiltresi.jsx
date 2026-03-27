/**
 * DonemFiltresi — Ay/Yıl seçici (tüm kasa sekmelerinde kullanılır)
 */
import { AY_ADLARI } from '../kasaUtils'

export default function DonemFiltresi({ secilenAy, secilenYil, setSecilenAy, setSecilenYil, tumZamanlar, setTumZamanlar, p, renkler }) {
  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
      <span className={`${p}-kasa-donem-label`}>
        Dönem:{' '}
        <span className={`${p}-kasa-donem-highlight`}>
          {tumZamanlar ? 'Tüm Zamanlar' : `${AY_ADLARI[secilenAy-1]} ${secilenYil}`}
        </span>
      </span>
      <div className="d-flex gap-2">
        <select value={tumZamanlar ? 0 : secilenAy} onChange={e => {
            const v = Number(e.target.value)
            if (v === 0) { setTumZamanlar(true) }
            else { setTumZamanlar(false); setSecilenAy(v) }
          }}
          className={`${p}-kasa-donem-select`} style={{ width:130 }}>
          <option value={0}>— Tüm Zamanlar —</option>
          {AY_ADLARI.map((ad,i) => <option key={i} value={i+1}>{ad}</option>)}
        </select>
        <select value={secilenYil} disabled={tumZamanlar}
          onChange={e => { setTumZamanlar(false); setSecilenYil(Number(e.target.value)) }}
          className={`${p}-kasa-donem-select`} style={{ width:80, opacity: tumZamanlar ? 0.5 : 1 }}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}
