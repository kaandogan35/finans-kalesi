/**
 * OdemeOzet.jsx — Ödeme Takip Özet Raporu
 * Bar chart (tahsilat vs ödeme) + durum dağılımı + tablo
 * rpr- prefix
 */

import { useState, useEffect } from 'react'
import { raporlarApi } from '../../api/raporlar'
import { toast } from 'sonner'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'
import PlanYukseltModal from '../../components/PlanYukseltModal'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { DateRangePicker } from '../../components/ui/DateRangePicker'
import { standardTooltip, standardAnimation, standardLegend, standardYScale, standardXScale } from '../../lib/chartConfig'
import { pdfIndir as pdfIndirUtil } from '../../lib/pdfExport'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

const DURUM_ETIKET = {
  bekliyor: 'Bekliyor',
  cevap_vermedi: 'Cevap Vermedi',
  soz_verildi: 'Söz Verildi',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal',
}
const DURUM_BADGE = {
  bekliyor: 'p-rpr-badge-amber',
  cevap_vermedi: 'p-rpr-badge-red',
  soz_verildi: 'p-rpr-badge-blue',
  tamamlandi: 'p-rpr-badge-emerald',
  iptal: 'p-rpr-badge-gray',
}
const YON_ETIKET = { tahsilat: 'Tahsilat', odeme: 'Ödeme' }

const AY_ADLARI = {
  '01': 'Oca', '02': 'Şub', '03': 'Mar', '04': 'Nis', '05': 'May', '06': 'Haz',
  '07': 'Tem', '08': 'Ağu', '09': 'Eyl', '10': 'Eki', '11': 'Kas', '12': 'Ara',
}

export default function OdemeOzet() {
  const { izinVarMi, plan } = usePlanKontrol()
  const [modalGoster, setModalGoster] = useState(false)
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const yil = new Date().getFullYear()
  const [filtre, setFiltre] = useState({
    baslangic_tarihi: `${yil}-01-01`,
    bitis_tarihi: `${yil}-12-31`,
    durum: '',
  })

  useEffect(() => { getir() }, [])

  const getir = async (f = filtre) => {
    setYukleniyor(true)
    try {
      const params = {}
      if (f.baslangic_tarihi) params.baslangic_tarihi = f.baslangic_tarihi
      if (f.bitis_tarihi) params.bitis_tarihi = f.bitis_tarihi
      if (f.durum) params.durum = f.durum
      const { data } = await raporlarApi.odemeOzet(params)
      if (data.basarili) setVeri(data.veri)
    } catch {
      toast.error('Ödeme özet raporu yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  const uygula = () => getir(filtre)

  // PDF
  const pdfIndir = () => pdfIndirUtil('rpr-odeme-tablo', '\u00d6deme \u00d6zet Raporu', 'odeme_ozet')

  // Excel
  const excelIndir = async () => {
    if (!veri?.durum_dagilim?.length) return
    const { utils, writeFile } = await import('xlsx')
    const satirlar = veri.durum_dagilim.map((d) => ({
      'Durum': DURUM_ETIKET[d.durum] || d.durum,
      'Yön': YON_ETIKET[d.yon] || d.yon,
      'Adet': d.adet,
      'Toplam Tutar (₺)': d.toplam_tutar,
    }))
    const ws = utils.json_to_sheet(satirlar)
    ws['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 18 }]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Ödeme Özet')
    writeFile(wb, `odeme_ozet_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel indirildi')
  }

  // KPI verisi
  const tahsilatOzet = (veri?.yon_ozet || []).find((y) => y.yon === 'tahsilat') || {}
  const odemeOzet = (veri?.yon_ozet || []).find((y) => y.yon === 'odeme') || {}
  const geciken = veri?.geciken || {}

  // Aylık trend chart
  const aylar = [...new Set((veri?.aylik_trend || []).map((t) => t.ay))].sort()
  const tahsilatAylik = aylar.map((ay) => {
    const row = (veri?.aylik_trend || []).find((t) => t.ay === ay && t.yon === 'tahsilat')
    return parseFloat(row?.toplam_tutar || 0)
  })
  const odemeAylik = aylar.map((ay) => {
    const row = (veri?.aylik_trend || []).find((t) => t.ay === ay && t.yon === 'odeme')
    return parseFloat(row?.toplam_tutar || 0)
  })

  const barData = aylar.length > 0 ? {
    labels: aylar.map((ay) => {
      const [y, m] = ay.split('-')
      return `${AY_ADLARI[m] || m} ${y}`
    }),
    datasets: [
      { label: 'Tahsilat', data: tahsilatAylik, backgroundColor: '#10B981', borderRadius: 6, barPercentage: 0.5 },
      { label: 'Ödeme', data: odemeAylik, backgroundColor: '#6366F1', borderRadius: 6, barPercentage: 0.5 },
    ],
  } : null

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: standardAnimation,
    plugins: {
      datalabels: { display: false },
      legend: { position: 'top', ...standardLegend },
      tooltip: {
        ...standardTooltip,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${TL(ctx.raw)}` },
      },
    },
    scales: {
      y: standardYScale,
      x: standardXScale,
    },
  }

  if (yukleniyor) {
    return <div className="p-rpr-loading"><div className="p-rpr-spinner" /> Yükleniyor…</div>
  }

  return (
    <div>
      {/* Filtre */}
      <div className="p-rpr-filter-bar">
        <div className="p-rpr-filter-group">
          <DateRangePicker
            from={filtre.baslangic_tarihi}
            to={filtre.bitis_tarihi}
            onApply={({ from, to }) => {
              const yeniFiltre = { ...filtre, baslangic_tarihi: from, bitis_tarihi: to }
              setFiltre(yeniFiltre)
              getir(yeniFiltre)
            }}
          />
        </div>
        <div className="p-rpr-filter-group">
          <span className="p-rpr-filter-label">Durum</span>
          <select className="p-rpr-filter-input" value={filtre.durum}
            onChange={(e) => setFiltre({ ...filtre, durum: e.target.value })}>
            <option value="">Tümü</option>
            {Object.entries(DURUM_ETIKET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button className="p-rpr-filter-btn p-rpr-filter-btn-primary" onClick={uygula}>
          <i className="bi bi-funnel-fill" /> Filtrele
        </button>
        <div className="p-rpr-export-bar">
          <button className="p-rpr-export-btn" onClick={() => izinVarMi('pdf_rapor') ? pdfIndir() : setModalGoster(true)}>
            <i className="bi bi-file-earmark-pdf-fill" /> PDF
            {!izinVarMi('pdf_rapor') && <i className="bi bi-lock-fill" style={{ fontSize: 10, opacity: 0.5 }} />}
          </button>
          <button className="p-rpr-export-btn" onClick={() => izinVarMi('excel_rapor') ? excelIndir() : setModalGoster(true)}>
            <i className="bi bi-file-earmark-excel-fill" /> Excel
            {!izinVarMi('excel_rapor') && <i className="bi bi-lock-fill" style={{ fontSize: 10, opacity: 0.5 }} />}
          </button>
        </div>
      </div>

      <PlanYukseltModal goster={modalGoster} kapat={() => setModalGoster(false)} ozellikAdi="PDF & Excel Rapor" mevcutPlan={plan} />

      {/* KPI */}
      <div className="p-rpr-kpi-row">
        <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#10B981' }}>
          <div className="p-rpr-kpi-label">Tahsilat</div>
          <div className="p-rpr-kpi-value financial-num">{TL(tahsilatOzet.toplam_tutar)}</div>
          <i className="bi bi-arrow-down-circle p-rpr-kpi-icon" />
        </div>
        <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#6366F1' }}>
          <div className="p-rpr-kpi-label">Ödeme</div>
          <div className="p-rpr-kpi-value financial-num">{TL(odemeOzet.toplam_tutar)}</div>
          <i className="bi bi-arrow-up-circle p-rpr-kpi-icon" />
        </div>
        <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#F59E0B' }}>
          <div className="p-rpr-kpi-label">Bekleyen Tahsilat</div>
          <div className="p-rpr-kpi-value financial-num">{TL(tahsilatOzet.bekleyen_tutar)}</div>
          <i className="bi bi-hourglass-split p-rpr-kpi-icon" />
        </div>
        <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#DC2626' }}>
          <div className="p-rpr-kpi-label">Geciken ({geciken.adet ?? 0} adet)</div>
          <div className="p-rpr-kpi-value financial-num" style={{ color: '#DC2626' }}>{TL(geciken.toplam_tutar)}</div>
          <i className="bi bi-exclamation-triangle p-rpr-kpi-icon" />
        </div>
      </div>

      {/* Grafik */}
      {barData && (
        <div className="p-rpr-card">
          <div className="p-rpr-card-header">
            <h3 className="p-rpr-card-title"><i className="bi bi-bar-chart-fill" /> Aylık Tahsilat vs Ödeme</h3>
          </div>
          <div className="p-rpr-card-body">
            <div className="p-rpr-chart-wrap">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Tablo */}
      <div className="p-rpr-card">
        <div className="p-rpr-card-header">
          <h3 className="p-rpr-card-title"><i className="bi bi-table" /> Durum Dağılımı</h3>
        </div>
        {/* Masaüstü Tablo */}
        <div className="table-responsive d-none d-md-block" id="rpr-odeme-tablo">
          <table className="table table-hover align-middle p-rpr-table mb-0">
            <thead>
              <tr>
                <th>Durum</th>
                <th>Yön</th>
                <th className="text-end">Adet</th>
                <th className="text-end">Toplam Tutar</th>
              </tr>
            </thead>
            <tbody>
              {(!veri?.durum_dagilim || veri.durum_dagilim.length === 0) ? (
                <tr><td colSpan={4} className="text-center py-5 text-muted">Veri bulunamadı</td></tr>
              ) : veri.durum_dagilim.map((d, i) => (
                <tr key={i}>
                  <td>
                    <span className={`p-rpr-badge ${DURUM_BADGE[d.durum] || 'p-rpr-badge-gray'}`}>
                      {DURUM_ETIKET[d.durum] || d.durum}
                    </span>
                  </td>
                  <td>{YON_ETIKET[d.yon] || d.yon}</td>
                  <td className="text-end">{d.adet}</td>
                  <td className="text-end financial-num" style={{ fontWeight: 600 }}>{TL(d.toplam_tutar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobil Kart Listesi */}
        <div className="d-md-none">
          {(!veri?.durum_dagilim || veri.durum_dagilim.length === 0) ? (
            <div className="text-center py-5 text-muted" style={{ fontSize: 13 }}>Veri bulunamadı</div>
          ) : veri.durum_dagilim.map((d, i) => (
            <div key={i} className="p-gg-mcard">
              <div className="p-gg-mcard-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <span className={`p-rpr-badge ${DURUM_BADGE[d.durum] || 'p-rpr-badge-gray'}`}>
                    {DURUM_ETIKET[d.durum] || d.durum}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>{YON_ETIKET[d.yon] || d.yon}</span>
                </div>
                <span className="p-gg-mcard-tutar financial-num" style={{ fontWeight: 600 }}>{TL(d.toplam_tutar)}</span>
              </div>
              <div className="p-gg-mcard-alt">
                <span style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>
                  <i className="bi bi-hash me-1" />{d.adet} adet
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
