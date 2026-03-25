/**
 * CariYaslandirma.jsx — Cari Yaşlandırma Raporu
 * Bar chart + tablo: vade grubuna göre cari bakiyeleri
 * rpr- prefix
 */

import { useState, useEffect } from 'react'
import { raporlarApi } from '../../api/raporlar'
import { toast } from 'sonner'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

const CARI_TURLERI = [
  { value: '', label: 'Tümü' },
  { value: 'musteri', label: 'Müşteri' },
  { value: 'tedarikci', label: 'Tedarikçi' },
]

export default function CariYaslandirma() {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtre, setFiltre] = useState({ cari_turu: '' })

  useEffect(() => { getir() }, [])

  const getir = async (f = filtre) => {
    setYukleniyor(true)
    try {
      const params = {}
      if (f.cari_turu) params.cari_turu = f.cari_turu
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
  const pdfIndir = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    const el = document.getElementById('rpr-cari-yas-tablo')
    if (!el) return
    toast.info('PDF hazırlanıyor…')
    const wrapper = document.createElement('div')
    wrapper.innerHTML = `
      <div style="padding:20px;font-family:Arial,sans-serif">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <svg width="36" height="36" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="pg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs>
            <rect width="120" height="120" rx="28" fill="url(#pg)"/>
            <path d="M38 88V36H62C70.837 36 78 43.163 78 52C78 60.837 70.837 68 62 68H38" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M68 62L82 48M82 48L68 34M82 48H56" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
          </svg>
          <div>
            <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-weight:800;font-size:18px;color:#1A1A1A;letter-spacing:-0.04em">Param<span style="color:#10B981;font-weight:700">Go</span></div>
          </div>
        </div>
        <h2 style="color:#10B981;margin:12px 0 4px">Cari Yaşlandırma Raporu</h2>
        <p style="color:#6B7280;font-size:12px;margin-bottom:16px">${new Date().toLocaleDateString('tr-TR')} tarihli rapor</p>
        ${el.outerHTML}
      </div>`
    document.body.appendChild(wrapper)
    try {
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `cari_yaslandirma_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      }).from(wrapper).save()
      toast.success('PDF indirildi')
    } catch { toast.error('PDF oluşturulamadı') }
    finally { document.body.removeChild(wrapper) }
  }

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
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => TL(ctx.raw),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => new Intl.NumberFormat('tr-TR', { notation: 'compact', compactDisplay: 'short' }).format(v),
          font: { size: 11 },
          color: '#9CA3AF',
        },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: {
        ticks: { font: { size: 12, weight: 600 }, color: '#6B7280' },
        grid: { display: false },
      },
    },
  }

  if (yukleniyor) {
    return <div className="rpr-loading"><div className="rpr-spinner" /> Yükleniyor…</div>
  }

  return (
    <div>
      {/* Filtre */}
      <div className="rpr-filter-bar">
        <div className="rpr-filter-group">
          <span className="rpr-filter-label">Cari Türü</span>
          <select
            className="rpr-filter-input"
            value={filtre.cari_turu}
            onChange={(e) => setFiltre({ ...filtre, cari_turu: e.target.value })}
          >
            {CARI_TURLERI.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <button className="rpr-filter-btn rpr-filter-btn-primary" onClick={uygula}>
          <i className="bi bi-funnel-fill" /> Filtrele
        </button>
        <div className="rpr-export-bar">
          <button className="rpr-export-btn" onClick={pdfIndir}>
            <i className="bi bi-file-earmark-pdf-fill" /> PDF
          </button>
          <button className="rpr-export-btn" onClick={excelIndir}>
            <i className="bi bi-file-earmark-excel-fill" /> Excel
          </button>
        </div>
      </div>

      {/* KPI */}
      {veri?.ozet && (
        <div className="rpr-kpi-row">
          <div className="rpr-kpi">
            <div className="rpr-kpi-accent" style={{ background: '#10B981' }} />
            <div className="rpr-kpi-label">0-30 Gün (Güncel)</div>
            <div className="rpr-kpi-value financial-num">{TL(veri.ozet.guncel)}</div>
            <i className="bi bi-check-circle rpr-kpi-icon" />
          </div>
          <div className="rpr-kpi">
            <div className="rpr-kpi-accent" style={{ background: '#F59E0B' }} />
            <div className="rpr-kpi-label">31-60 Gün</div>
            <div className="rpr-kpi-value financial-num">{TL(veri.ozet.otuz_altmis)}</div>
            <i className="bi bi-clock rpr-kpi-icon" />
          </div>
          <div className="rpr-kpi">
            <div className="rpr-kpi-accent" style={{ background: '#F97316' }} />
            <div className="rpr-kpi-label">61-90 Gün</div>
            <div className="rpr-kpi-value financial-num">{TL(veri.ozet.altmis_doksan)}</div>
            <i className="bi bi-exclamation-triangle rpr-kpi-icon" />
          </div>
          <div className="rpr-kpi">
            <div className="rpr-kpi-accent" style={{ background: '#DC2626' }} />
            <div className="rpr-kpi-label">90+ Gün (Riskli)</div>
            <div className="rpr-kpi-value financial-num">{TL(veri.ozet.doksan_ustu)}</div>
            <i className="bi bi-exclamation-octagon rpr-kpi-icon" />
          </div>
        </div>
      )}

      {/* Grafik */}
      {chartData && (
        <div className="rpr-card">
          <div className="rpr-card-header">
            <h3 className="rpr-card-title"><i className="bi bi-bar-chart-fill" /> Vade Grubu Dağılımı</h3>
          </div>
          <div className="rpr-card-body">
            <div className="rpr-chart-wrap">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Tablo */}
      <div className="rpr-card">
        <div className="rpr-card-header">
          <h3 className="rpr-card-title"><i className="bi bi-table" /> Cari Detay</h3>
          <span style={{ fontSize: 12, color: 'var(--p-text-muted)' }}>
            {veri?.cariler?.length ?? 0} cari
          </span>
        </div>
        <div className="table-responsive" id="rpr-cari-yas-tablo">
          <table className="table table-hover align-middle rpr-table mb-0">
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
                    <span className={`rpr-badge ${c.cari_turu === 'musteri' ? 'rpr-badge-emerald' : 'rpr-badge-blue'}`}>
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
      </div>
    </div>
  )
}
