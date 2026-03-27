/**
 * NakitAkis.jsx — Nakit Akış Raporu
 * Line chart + tablo: aylık giriş/çıkış/net
 * rpr- prefix
 */

import { useState, useEffect } from 'react'
import { raporlarApi } from '../../api/raporlar'
import { toast } from 'sonner'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'
import PlanYukseltModal from '../../components/PlanYukseltModal'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

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
  const pdfIndir = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    const el = document.getElementById('rpr-nakit-tablo')
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
        <h2 style="color:#10B981;margin:12px 0 4px">Nakit Akış Raporu</h2>
        <p style="color:#6B7280;font-size:12px;margin-bottom:16px">${new Date().toLocaleDateString('tr-TR')} tarihli rapor</p>
        ${el.outerHTML}
      </div>`
    document.body.appendChild(wrapper)
    try {
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `nakit_akis_${new Date().toISOString().split('T')[0]}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      }).from(wrapper).save()
      toast.success('PDF indirildi')
    } catch { toast.error('PDF oluşturulamadı') }
    finally { document.body.removeChild(wrapper) }
  }

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
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10B981',
      },
      {
        label: 'Çıkış',
        data: veri.aylar.map((a) => a.cikis),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245,158,11,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#F59E0B',
      },
      {
        label: 'Net',
        data: veri.aylar.map((a) => a.net),
        borderColor: '#6366F1',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#6366F1',
      },
    ],
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } },
      },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${TL(ctx.raw)}` },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v) => new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format(v),
          font: { size: 11 }, color: '#9CA3AF',
        },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: {
        ticks: { font: { size: 11 }, color: '#6B7280' },
        grid: { display: false },
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
          <span className="p-rpr-filter-label">Başlangıç</span>
          <input
            type="date"
            className="p-rpr-filter-input"
            value={filtre.baslangic_tarihi}
            onChange={(e) => setFiltre({ ...filtre, baslangic_tarihi: e.target.value })}
          />
        </div>
        <div className="p-rpr-filter-group">
          <span className="p-rpr-filter-label">Bitiş</span>
          <input
            type="date"
            className="p-rpr-filter-input"
            value={filtre.bitis_tarihi}
            onChange={(e) => setFiltre({ ...filtre, bitis_tarihi: e.target.value })}
          />
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
      {veri?.ozet && (
        <div className="p-rpr-kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="p-rpr-kpi">
            <div className="p-rpr-kpi-accent" style={{ background: '#10B981' }} />
            <div className="p-rpr-kpi-label">Toplam Giriş</div>
            <div className="p-rpr-kpi-value financial-num">{TL(veri.ozet.toplam_giris)}</div>
            <i className="bi bi-arrow-down-circle p-rpr-kpi-icon" />
          </div>
          <div className="p-rpr-kpi">
            <div className="p-rpr-kpi-accent" style={{ background: '#F59E0B' }} />
            <div className="p-rpr-kpi-label">Toplam Çıkış</div>
            <div className="p-rpr-kpi-value financial-num">{TL(veri.ozet.toplam_cikis)}</div>
            <i className="bi bi-arrow-up-circle p-rpr-kpi-icon" />
          </div>
          <div className="p-rpr-kpi">
            <div className="p-rpr-kpi-accent" style={{ background: veri.ozet.net >= 0 ? '#10B981' : '#DC2626' }} />
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
        <div className="table-responsive" id="rpr-nakit-tablo">
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
      </div>
    </div>
  )
}
