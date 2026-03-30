/**
 * NakitAkis.jsx — Nakit Akış Raporu
 * Line chart + tablo: aylık giriş/çıkış/net
 * rpr- prefix
 */

import { useState, useEffect, useRef } from 'react'
import { raporlarApi } from '../../api/raporlar'
import { toast } from 'sonner'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'
import PlanYukseltModal from '../../components/PlanYukseltModal'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { DateRangePicker } from '../../components/ui/DateRangePicker'
import { standardTooltip, standardLegend, standardAnimation, standardYScale, standardXScale, getGradient } from '../../lib/chartConfig'
import { pdfIndir as pdfIndirUtil } from '../../lib/pdfExport'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

const AY_ADLARI = {
  '01': 'Oca', '02': 'Şub', '03': 'Mar', '04': 'Nis', '05': 'May', '06': 'Haz',
  '07': 'Tem', '08': 'Ağu', '09': 'Eyl', '10': 'Eki', '11': 'Kas', '12': 'Ara',
}

function ayEtiket(ayStr) {
  const [yil, ay] = ayStr.split('-')
  return `${AY_ADLARI[ay] || ay} ${yil}`
}

export default function NakitAkis() {
  const { izinVarMi, plan } = usePlanKontrol()
  const [modalGoster, setModalGoster] = useState(false)
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const yil = new Date().getFullYear()
  const [filtre, setFiltre] = useState({
    baslangic_tarihi: `${yil}-01-01`,
    bitis_tarihi: `${yil}-12-31`,
  })

  useEffect(() => { getir() }, [])

  const getir = async (f = filtre) => {
    setYukleniyor(true)
    try {
      const { data } = await raporlarApi.nakitAkis(f)
      if (data.basarili) setVeri(data.veri)
    } catch {
      toast.error('Nakit akış raporu yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  const uygula = () => getir(filtre)

  // PDF
  const pdfIndir = () => pdfIndirUtil('rpr-nakit-tablo', 'Nakit Ak\u0131\u015f Raporu', 'nakit_akis')

  // Excel
  const excelIndir = async () => {
    if (!veri?.aylar?.length) return
    const { utils, writeFile } = await import('xlsx')
    const satirlar = veri.aylar.map((a) => ({
      'Dönem': ayEtiket(a.ay),
      'Giriş (₺)': a.giris,
      'Çıkış (₺)': a.cikis,
      'Net (₺)': a.net,
    }))
    const ws = utils.json_to_sheet(satirlar)
    ws['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Nakit Akış')
    writeFile(wb, `nakit_akis_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel indirildi')
  }

  // Chart
  const chartData = veri?.aylar ? {
    labels: veri.aylar.map((a) => ayEtiket(a.ay)),
    datasets: [
      {
        label: 'Giriş',
        data: veri.aylar.map((a) => a.giris),
        borderColor: '#10B981',
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart
          if (!chartArea) return 'transparent'
          return getGradient(ctx, chartArea, '16,185,129', 0.3)
        },
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
      {
        label: 'Çıkış',
        data: veri.aylar.map((a) => a.cikis),
        borderColor: '#F59E0B',
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart
          if (!chartArea) return 'transparent'
          return getGradient(ctx, chartArea, '245,158,11', 0.2)
        },
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
      {
        label: 'Net',
        data: veri.aylar.map((a) => a.net),
        borderColor: '#6366F1',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#6366F1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: standardAnimation,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      datalabels: { display: false },
      legend: { position: 'top', ...standardLegend },
      tooltip: {
        ...standardTooltip,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${TL(ctx.raw)}` },
      },
    },
    scales: { y: standardYScale, x: standardXScale },
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
        <div className="p-rpr-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#10B981' }}>
            <div className="p-rpr-kpi-label">Toplam Giriş</div>
            <div className="p-rpr-kpi-value financial-num">{TL(veri.ozet.toplam_giris)}</div>
            <i className="bi bi-arrow-down-circle p-rpr-kpi-icon" />
          </div>
          <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#F59E0B' }}>
            <div className="p-rpr-kpi-label">Toplam Çıkış</div>
            <div className="p-rpr-kpi-value financial-num">{TL(veri.ozet.toplam_cikis)}</div>
            <i className="bi bi-arrow-up-circle p-rpr-kpi-icon" />
          </div>
          <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': veri.ozet.net >= 0 ? '#10B981' : '#DC2626' }}>
            <div className="p-rpr-kpi-label">Net Akış</div>
            <div className="p-rpr-kpi-value financial-num" style={{ color: veri.ozet.net >= 0 ? '#10B981' : '#DC2626' }}>
              {TL(veri.ozet.net)}
            </div>
            <i className="bi bi-graph-up-arrow p-rpr-kpi-icon" />
          </div>
        </div>
      )}

      {/* Grafik */}
      {chartData && (
        <div className="p-rpr-card">
          <div className="p-rpr-card-header">
            <h3 className="p-rpr-card-title"><i className="bi bi-graph-up" /> Aylık Nakit Akış</h3>
          </div>
          <div className="p-rpr-card-body">
            <div className="p-rpr-chart-wrap">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Tablo */}
      <div className="p-rpr-card">
        <div className="p-rpr-card-header">
          <h3 className="p-rpr-card-title"><i className="bi bi-table" /> Aylık Detay</h3>
        </div>
        {/* Masaüstü Tablo */}
        <div className="table-responsive d-none d-md-block" id="rpr-nakit-tablo">
          <table className="table table-hover align-middle p-rpr-table mb-0">
            <thead>
              <tr>
                <th>Dönem</th>
                <th className="text-end">Giriş</th>
                <th className="text-end">Çıkış</th>
                <th className="text-end">Net</th>
              </tr>
            </thead>
            <tbody>
              {(!veri?.aylar || veri.aylar.length === 0) ? (
                <tr><td colSpan={4} className="text-center py-5 text-muted">Veri bulunamadı</td></tr>
              ) : veri.aylar.map((a, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{ayEtiket(a.ay)}</td>
                  <td className="text-end financial-num" style={{ color: '#10B981' }}>{TL(a.giris)}</td>
                  <td className="text-end financial-num" style={{ color: '#F59E0B' }}>{TL(a.cikis)}</td>
                  <td className="text-end financial-num" style={{ fontWeight: 700, color: a.net >= 0 ? '#10B981' : '#DC2626' }}>
                    {TL(a.net)}
                  </td>
                </tr>
              ))}
            </tbody>
            {veri?.aylar?.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 700, background: 'rgba(16,185,129,0.04)' }}>
                  <td>Toplam</td>
                  <td className="text-end financial-num">{TL(veri.ozet.toplam_giris)}</td>
                  <td className="text-end financial-num">{TL(veri.ozet.toplam_cikis)}</td>
                  <td className="text-end financial-num">{TL(veri.ozet.net)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobil Kart Listesi */}
        <div className="d-md-none">
          {(!veri?.aylar || veri.aylar.length === 0) ? (
            <div className="text-center py-5 text-muted" style={{ fontSize: 13 }}>Veri bulunamadı</div>
          ) : (
            <>
              {veri.aylar.map((a, i) => (
                <div key={i} className="p-gg-mcard">
                  <div className="p-gg-mcard-top">
                    <span className="p-gg-mcard-kat">
                      <i className="bi bi-calendar3 me-1" />{ayEtiket(a.ay)}
                    </span>
                    <span className="p-gg-mcard-tutar financial-num" style={{ color: a.net >= 0 ? '#10B981' : '#DC2626' }}>
                      {TL(a.net)}
                    </span>
                  </div>
                  <div className="p-gg-mcard-alt">
                    <span style={{ fontSize: 11, color: '#10B981' }}>
                      <i className="bi bi-arrow-down-circle me-1" />Giriş: <span className="financial-num">{TL(a.giris)}</span>
                    </span>
                    <span style={{ fontSize: 11, color: '#F59E0B' }}>
                      <i className="bi bi-arrow-up-circle me-1" />Çıkış: <span className="financial-num">{TL(a.cikis)}</span>
                    </span>
                  </div>
                </div>
              ))}
              {veri?.ozet && (
                <div className="p-gg-mcard" style={{ background: 'rgba(16,185,129,0.06)', borderLeft: '3px solid #10B981' }}>
                  <div className="p-gg-mcard-top">
                    <span className="p-gg-mcard-kat" style={{ fontWeight: 700 }}>
                      <i className="bi bi-calculator me-1" />Toplam
                    </span>
                    <span className="p-gg-mcard-tutar financial-num" style={{ fontWeight: 700, color: veri.ozet.net >= 0 ? '#10B981' : '#DC2626' }}>
                      {TL(veri.ozet.net)}
                    </span>
                  </div>
                  <div className="p-gg-mcard-alt">
                    <span style={{ fontSize: 11, color: '#10B981' }}>
                      Giriş: <span className="financial-num">{TL(veri.ozet.toplam_giris)}</span>
                    </span>
                    <span style={{ fontSize: 11, color: '#F59E0B' }}>
                      Çıkış: <span className="financial-num">{TL(veri.ozet.toplam_cikis)}</span>
                    </span>
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
