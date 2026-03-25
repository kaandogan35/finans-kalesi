/**
 * RaporGecmisi.jsx — Rapor Geçmişi Listesi
 * Kullanıcının daha önce görüntülediği raporları listeler
 * rpr- prefix
 */

import { useState, useEffect } from 'react'
import { raporlarApi } from '../../api/raporlar'
import { toast } from 'sonner'

const RAPOR_IKON = {
  cari_yaslandirma: 'bi-people-fill',
  nakit_akis: 'bi-graph-up-arrow',
  cek_portfoy: 'bi-file-earmark-text-fill',
  odeme_ozet: 'bi-credit-card-2-front-fill',
  genel_ozet: 'bi-bar-chart-line-fill',
}

const RAPOR_BADGE = {
  cari_yaslandirma: 'rpr-badge-emerald',
  nakit_akis: 'rpr-badge-blue',
  cek_portfoy: 'rpr-badge-purple',
  odeme_ozet: 'rpr-badge-amber',
  genel_ozet: 'rpr-badge-emerald',
}

const FORMAT_ETIKET = {
  ekran: 'Ekran',
  pdf: 'PDF',
  excel: 'Excel',
}

function zamanOnce(tarih) {
  if (!tarih) return ''
  const simdi = new Date()
  const t = new Date(tarih)
  const fark = Math.floor((simdi - t) / 1000)
  if (fark < 60) return 'Az önce'
  if (fark < 3600) return `${Math.floor(fark / 60)} dk önce`
  if (fark < 86400) return `${Math.floor(fark / 3600)} saat önce`
  if (fark < 604800) return `${Math.floor(fark / 86400)} gün önce`
  return t.toLocaleDateString('tr-TR')
}

export default function RaporGecmisi() {
  const [gecmis, setGecmis] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => { getir() }, [])

  const getir = async () => {
    setYukleniyor(true)
    try {
      const { data } = await raporlarApi.gecmis({ limit: 50 })
      if (data.basarili) setGecmis(data.veri || [])
    } catch {
      toast.error('Rapor geçmişi yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  if (yukleniyor) {
    return <div className="rpr-loading"><div className="rpr-spinner" /> Yükleniyor…</div>
  }

  if (!gecmis.length) {
    return (
      <div className="rpr-empty">
        <div className="rpr-empty-icon"><i className="bi bi-clock-history" /></div>
        <div className="rpr-empty-text">Henüz rapor geçmişi yok</div>
        <div className="rpr-empty-sub">Rapor görüntülediğinizde burada listelenecek</div>
      </div>
    )
  }

  return (
    <div className="rpr-card">
      <div className="rpr-card-header">
        <h3 className="rpr-card-title"><i className="bi bi-clock-history" /> Son Raporlar</h3>
        <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>{gecmis.length} kayıt</span>
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle rpr-table mb-0">
          <thead>
            <tr>
              <th>Rapor</th>
              <th>Tür</th>
              <th>Format</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {gecmis.map((g) => (
              <tr key={g.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className={`bi ${RAPOR_IKON[g.rapor_turu] || 'bi-file-text'}`}
                      style={{ fontSize: 16, color: 'var(--p-primary)' }} />
                    <span style={{ fontWeight: 600 }}>{g.rapor_adi}</span>
                  </div>
                </td>
                <td>
                  <span className={`rpr-badge ${RAPOR_BADGE[g.rapor_turu] || 'rpr-badge-gray'}`}>
                    {g.rapor_turu?.replace(/_/g, ' ') || '—'}
                  </span>
                </td>
                <td>
                  <span className="rpr-badge rpr-badge-gray">
                    {FORMAT_ETIKET[g.format] || g.format}
                  </span>
                </td>
                <td style={{ color: 'var(--p-text-muted)', fontSize: 12 }}>
                  {zamanOnce(g.olusturma_tarihi)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
