/**
 * CariYaslandirma.jsx — Cari Yaşlandırma Raporu
 * Bar chart + tablo: vade grubuna göre cari bakiyeleri
 * rpr- prefix
 */

import { useState, useEffect } from 'react'
import { raporlarApi } from '../../api/raporlar'
import { bildirim as toast } from '../../components/ui/CenterAlert'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'
import PlanYukseltModal from '../../components/PlanYukseltModal'
import { DateRangePicker } from '../../components/ui/DateRangePicker'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'react-chartjs-2'
import { standardTooltip, standardAnimation, standardYScale, standardXScale } from '../../lib/chartConfig'
import { pdfIndir as pdfIndirUtil } from '../../lib/pdfExport'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

const CARI_TURLERI = [
  { value: '', label: 'Tümü' },
  { value: 'musteri', label: 'Müşteri' },
  { value: 'tedarikci', label: 'Tedarikçi' },
]

export default function CariYaslandirma() {
  const { izinVarMi, plan } = usePlanKontrol()
  const [modalGoster, setModalGoster] = useState(false)
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtre, setFiltre] = useState({ cari_turu: '', baslangic_tarihi: '', bitis_tarihi: '' })

  useEffect(() => { getir() }, [])

  const getir = async (f = filtre) => {
    setYukleniyor(true)
    try {
      const params = {}
      if (f.cari_turu) params.cari_turu = f.cari_turu
      if (f.baslangic_tarihi) params.baslangic_tarihi = f.baslangic_tarihi
      if (f.bitis_tarihi) params.bitis_tarihi = f.bitis_tarihi
      const { data } = await raporlarApi.cariYaslandirma(params)
      if (data.basarili) setVeri(data.veri)
    } catch {
      toast.error('Cari yaşlandırma raporu yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  const uygula = () => getir(filtre)

  // PDF export
  const pdfIndir = () => pdfIndirUtil('rpr-cari-yas-tablo', 'Cari Ya\u015fland\u0131rma Raporu', 'cari_yaslandirma')

  // Excel export
  const excelIndir = async () => {
    if (!veri?.cariler?.length) return
    const { utils, writeFile } = await import('xlsx')
    const satirlar = veri.cariler.map((c) => ({
      'Cari': c.unvan,
      'Tür': c.cari_turu === 'musteri' ? 'Müşteri' : 'Tedarikçi',
      '0-30 Gün': c.guncel,
      '31-60 Gün': c.otuz_altmis,
      '61-90 Gün': c.altmis_doksan,
      '90+ Gün': c.doksan_ustu,
      'Toplam': c.toplam,
    }))
    const ws = utils.json_to_sheet(satirlar)
    ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Cari Yaşlandırma')
    writeFile(wb, `cari_yaslandirma_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel indirildi')
  }

  // Chart data
  const chartData = veri?.ozet ? {
    labels: ['0-30 Gün', '31-60 Gün', '61-90 Gün', '90+ Gün'],
    datasets: [{
      label: 'Tutar (₺)',
      data: [veri.ozet.guncel, veri.ozet.otuz_altmis, veri.ozet.altmis_doksan, veri.ozet.doksan_ustu],
      backgroundColor: ['#10B981', '#F59E0B', '#F97316', '#DC2626'],
      borderRadius: 6,
      barPercentage: 0.6,
    }],
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: standardAnimation,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'top',
        formatter: (v) =>
          new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format(v) + ' \u20ba',
        font: { family: 'Plus Jakarta Sans', size: 10, weight: '700' },
        color: '#374151',
        offset: 4,
      },
      tooltip: {
        ...standardTooltip,
        callbacks: {
          label: (ctx) => {
            const toplam = ctx.dataset.data.reduce((a, b) => a + b, 0)
            const yuzde = toplam > 0 ? ((ctx.raw / toplam) * 100).toFixed(1) : 0
            return ` ${TL(ctx.raw)}  (%${yuzde})`
          },
        },
      },
    },
    scales: {
      y: { ...standardYScale, beginAtZero: true },
      x: {
        ...standardXScale,
        ticks: { font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 }, color: '#6B7280' },
      },
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
          <span className="p-rpr-filter-label">Cari T&#252;r&#252;</span>
          <select
            className="p-rpr-filter-input"
            value={filtre.cari_turu}
            onChange={(e) => setFiltre({ ...filtre, cari_turu: e.target.value })}
          >
            {CARI_TURLERI.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
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
      {veri?.ozet && (
        <div className="p-rpr-kpi-row">
          <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#10B981' }}>
            <div className="p-rpr-kpi-label">0-30 Gün (Güncel)</div>
            <div className="p-rpr-kpi-value financial-num">{TL(veri.ozet.guncel)}</div>
            <i className="bi bi-check-circle p-rpr-kpi-icon" />
          </div>
          <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#F59E0B' }}>
            <div className="p-rpr-kpi-label">31-60 Gün</div>
            <div className="p-rpr-kpi-value financial-num">{TL(veri.ozet.otuz_altmis)}</div>
            <i className="bi bi-clock p-rpr-kpi-icon" />
          </div>
          <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#F97316' }}>
            <div className="p-rpr-kpi-label">61-90 Gün</div>
            <div className="p-rpr-kpi-value financial-num">{TL(veri.ozet.altmis_doksan)}</div>
            <i className="bi bi-exclamation-triangle p-rpr-kpi-icon" />
          </div>
          <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#DC2626' }}>
            <div className="p-rpr-kpi-label">90+ Gün (Riskli)</div>
            <div className="p-rpr-kpi-value financial-num">{TL(veri.ozet.doksan_ustu)}</div>
            <i className="bi bi-exclamation-octagon p-rpr-kpi-icon" />
          </div>
        </div>
      )}

      {/* Grafik */}
      {chartData && (
        <div className="p-rpr-card">
          <div className="p-rpr-card-header">
            <h3 className="p-rpr-card-title"><i className="bi bi-bar-chart-fill" /> Vade Grubu Dağılımı</h3>
          </div>
          <div className="p-rpr-card-body">
            <div className="p-rpr-chart-wrap">
              <Bar data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
            </div>
          </div>
        </div>
      )}

      {/* Tablo */}
      <div className="p-rpr-card">
        <div className="p-rpr-card-header">
          <h3 className="p-rpr-card-title"><i className="bi bi-table" /> Cari Detay</h3>
          <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>
            {veri?.cariler?.length ?? 0} cari
          </span>
        </div>
        {/* Masaüstü Tablo */}
        <div className="table-responsive d-none d-md-block" id="rpr-cari-yas-tablo">
          <table className="table table-hover align-middle p-rpr-table mb-0">
            <thead>
              <tr>
                <th>Cari</th>
                <th>Tür</th>
                <th className="text-end">0-30 Gün</th>
                <th className="text-end">31-60 Gün</th>
                <th className="text-end">61-90 Gün</th>
                <th className="text-end">90+ Gün</th>
                <th className="text-end">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {(!veri?.cariler || veri.cariler.length === 0) ? (
                <tr><td colSpan={7} className="text-center py-5 text-muted">Veri bulunamadı</td></tr>
              ) : veri.cariler.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{c.unvan}</td>
                  <td>
                    <span className={`p-rpr-badge ${c.cari_turu === 'musteri' ? 'p-rpr-badge-emerald' : 'p-rpr-badge-blue'}`}>
                      {c.cari_turu === 'musteri' ? 'Müşteri' : 'Tedarikçi'}
                    </span>
                  </td>
                  <td className="text-end financial-num">{TL(c.guncel)}</td>
                  <td className="text-end financial-num">{TL(c.otuz_altmis)}</td>
                  <td className="text-end financial-num">{TL(c.altmis_doksan)}</td>
                  <td className="text-end financial-num" style={{ color: c.doksan_ustu > 0 ? '#DC2626' : undefined }}>
                    {TL(c.doksan_ustu)}
                  </td>
                  <td className="text-end financial-num" style={{ fontWeight: 700 }}>{TL(c.toplam)}</td>
                </tr>
              ))}
            </tbody>
            {veri?.cariler?.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 700, background: 'rgba(16,185,129,0.04)' }}>
                  <td colSpan={2}>Toplam</td>
                  <td className="text-end financial-num">{TL(veri.ozet.guncel)}</td>
                  <td className="text-end financial-num">{TL(veri.ozet.otuz_altmis)}</td>
                  <td className="text-end financial-num">{TL(veri.ozet.altmis_doksan)}</td>
                  <td className="text-end financial-num">{TL(veri.ozet.doksan_ustu)}</td>
                  <td className="text-end financial-num">{TL(veri.ozet.toplam)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobil Kart Listesi */}
        <div className="d-md-none">
          {(!veri?.cariler || veri.cariler.length === 0) ? (
            <div className="text-center py-5 text-muted" style={{ fontSize: 13 }}>Veri bulunamadı</div>
          ) : (
            <>
              {veri.cariler.map((c, i) => (
                <div key={i} className="p-gg-mcard">
                  <div className="p-gg-mcard-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <span className="p-gg-mcard-aciklama" style={{ fontWeight: 600, WebkitLineClamp: 1 }}>{c.unvan}</span>
                      <span className={`p-rpr-badge ${c.cari_turu === 'musteri' ? 'p-rpr-badge-emerald' : 'p-rpr-badge-blue'}`}
                            style={{ fontSize: 11, flexShrink: 0 }}>
                        {c.cari_turu === 'musteri' ? 'Müşteri' : 'Tedarikçi'}
                      </span>
                    </div>
                    <span className="p-gg-mcard-tutar financial-num" style={{ fontWeight: 700 }}>{TL(c.toplam)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', padding: '6px 12px 10px' }}>
                    <div style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>
                      0-30g: <span className="financial-num" style={{ color: '#10B981' }}>{TL(c.guncel)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>
                      31-60g: <span className="financial-num" style={{ color: '#F59E0B' }}>{TL(c.otuz_altmis)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>
                      61-90g: <span className="financial-num" style={{ color: '#F97316' }}>{TL(c.altmis_doksan)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>
                      90+g: <span className="financial-num" style={{ color: c.doksan_ustu > 0 ? '#DC2626' : 'var(--p-text-muted)' }}>{TL(c.doksan_ustu)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {veri?.ozet && (
                <div className="p-gg-mcard" style={{ background: 'rgba(16,185,129,0.06)', borderLeft: '3px solid #10B981' }}>
                  <div className="p-gg-mcard-top">
                    <span className="p-gg-mcard-kat" style={{ fontWeight: 700 }}>
                      <i className="bi bi-calculator me-1" />Toplam
                    </span>
                    <span className="p-gg-mcard-tutar financial-num" style={{ fontWeight: 700 }}>{TL(veri.ozet.toplam)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', padding: '6px 12px 10px' }}>
                    <div style={{ fontSize: 11 }}>0-30g: <span className="financial-num">{TL(veri.ozet.guncel)}</span></div>
                    <div style={{ fontSize: 11 }}>31-60g: <span className="financial-num">{TL(veri.ozet.otuz_altmis)}</span></div>
                    <div style={{ fontSize: 11 }}>61-90g: <span className="financial-num">{TL(veri.ozet.altmis_doksan)}</span></div>
                    <div style={{ fontSize: 11 }}>90+g: <span className="financial-num">{TL(veri.ozet.doksan_ustu)}</span></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
