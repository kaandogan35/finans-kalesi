/**
 * CekPortfoy.jsx — Çek/Senet Portföy Raporu
 * Pie chart (durum dağılımı) + Bar chart (vade takvimi) + tablo
 * rpr- prefix
 */

import { useState, useEffect } from 'react'
import { raporlarApi } from '../../api/raporlar'
import { toast } from 'sonner'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

const DURUM_ETIKET = {
  portfoyde: 'Portföyde',
  tahsile_verildi: 'Tahsile Verildi',
  tahsil_edildi: 'Tahsil Edildi',
  odendi: 'Ödendi',
  karsiliksiz: 'Karşılıksız',
  protestolu: 'Protestolu',
  cirolandi: 'Cirolandı',
}

const DURUM_RENK = {
  portfoyde: '#6366F1',
  tahsile_verildi: '#F59E0B',
  tahsil_edildi: '#10B981',
  odendi: '#059669',
  karsiliksiz: '#DC2626',
  protestolu: '#F97316',
  cirolandi: '#8B5CF6',
}

const TUR_ETIKET = {
  alacak_ceki: 'Alacak Çeki',
  alacak_senedi: 'Alacak Senedi',
  borc_ceki: 'Borç Çeki',
  borc_senedi: 'Borç Senedi',
}

const AY_ADLARI = {
  '01': 'Oca', '02': 'Şub', '03': 'Mar', '04': 'Nis', '05': 'May', '06': 'Haz',
  '07': 'Tem', '08': 'Ağu', '09': 'Eyl', '10': 'Eki', '11': 'Kas', '12': 'Ara',
}

export default function CekPortfoy() {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtre, setFiltre] = useState({ tur: '', durum: '' })

  useEffect(() => { getir() }, [])

  const getir = async (f = filtre) => {
    setYukleniyor(true)
    try {
      const params = {}
      if (f.tur) params.tur = f.tur
      if (f.durum) params.durum = f.durum
      const { data } = await raporlarApi.cekPortfoy(params)
      if (data.basarili) setVeri(data.veri)
    } catch {
      toast.error('Çek portföy raporu yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  const uygula = () => getir(filtre)

  // PDF
  const pdfIndir = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    const el = document.getElementById('rpr-cek-tablo')
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
        <h2 style="color:#10B981;margin:12px 0 4px">Çek/Senet Portföy Raporu</h2>
        <p style="color:#6B7280;font-size:12px;margin-bottom:16px">${new Date().toLocaleDateString('tr-TR')} tarihli rapor</p>
        ${el.outerHTML}
      </div>`
    document.body.appendChild(wrapper)
    try {
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `cek_portfoy_${new Date().toISOString().split('T')[0]}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      }).from(wrapper).save()
      toast.success('PDF indirildi')
    } catch { toast.error('PDF oluşturulamadı') }
    finally { document.body.removeChild(wrapper) }
  }

  // Excel
  const excelIndir = async () => {
    if (!veri?.durum_dagilim?.length) return
    const { utils, writeFile } = await import('xlsx')
    const satirlar = veri.durum_dagilim.map((d) => ({
      'Durum': DURUM_ETIKET[d.durum] || d.durum,
      'Tür': TUR_ETIKET[d.tur] || d.tur,
      'Adet': d.adet,
      'Toplam Tutar (₺)': d.toplam_tutar,
    }))
    const ws = utils.json_to_sheet(satirlar)
    ws['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 18 }]
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Çek Portföy')
    writeFile(wb, `cek_portfoy_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel indirildi')
  }

  // Pie chart — durum bazlı
  const durumGruplari = {}
  ;(veri?.durum_dagilim || []).forEach((d) => {
    if (!durumGruplari[d.durum]) durumGruplari[d.durum] = 0
    durumGruplari[d.durum] += parseFloat(d.toplam_tutar || 0)
  })

  const pieData = Object.keys(durumGruplari).length > 0 ? {
    labels: Object.keys(durumGruplari).map((k) => DURUM_ETIKET[k] || k),
    datasets: [{
      data: Object.values(durumGruplari),
      backgroundColor: Object.keys(durumGruplari).map((k) => DURUM_RENK[k] || '#9CA3AF'),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  } : null

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } },
      },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.label}: ${TL(ctx.raw)}` },
      },
    },
  }

  // Bar chart — vade takvimi
  const vadeAylar = [...new Set((veri?.vade_takvimi || []).map((v) => v.ay))].sort()
  const alacakData = vadeAylar.map((ay) => {
    const rows = (veri?.vade_takvimi || []).filter(
      (v) => v.ay === ay && (v.tur === 'alacak_ceki' || v.tur === 'alacak_senedi')
    )
    return rows.reduce((sum, r) => sum + parseFloat(r.toplam_tutar || 0), 0)
  })
  const borcData = vadeAylar.map((ay) => {
    const rows = (veri?.vade_takvimi || []).filter(
      (v) => v.ay === ay && (v.tur === 'borc_ceki' || v.tur === 'borc_senedi')
    )
    return rows.reduce((sum, r) => sum + parseFloat(r.toplam_tutar || 0), 0)
  })

  const barData = vadeAylar.length > 0 ? {
    labels: vadeAylar.map((ay) => {
      const [y, m] = ay.split('-')
      return `${AY_ADLARI[m] || m} ${y}`
    }),
    datasets: [
      { label: 'Alacak', data: alacakData, backgroundColor: '#10B981', borderRadius: 6, barPercentage: 0.5 },
      { label: 'Borç', data: borcData, backgroundColor: '#F59E0B', borderRadius: 6, barPercentage: 0.5 },
    ],
  } : null

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } },
      },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${TL(ctx.raw)}` } },
    },
    scales: {
      y: {
        ticks: {
          callback: (v) => new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format(v),
          font: { size: 11 }, color: '#9CA3AF',
        },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: { ticks: { font: { size: 11 }, color: '#6B7280' }, grid: { display: false } },
    },
  }

  if (yukleniyor) {
    return <div className="rpr-loading"><div className="rpr-spinner" /> Yükleniyor…</div>
  }

  const ozet = veri?.ozet || {}

  return (
    <div>
      {/* Filtre */}
      <div className="rpr-filter-bar">
        <div className="rpr-filter-group">
          <span className="rpr-filter-label">Tür</span>
          <select className="rpr-filter-input" value={filtre.tur}
            onChange={(e) => setFiltre({ ...filtre, tur: e.target.value })}>
            <option value="">Tümü</option>
            {Object.entries(TUR_ETIKET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="rpr-filter-group">
          <span className="rpr-filter-label">Durum</span>
          <select className="rpr-filter-input" value={filtre.durum}
            onChange={(e) => setFiltre({ ...filtre, durum: e.target.value })}>
            <option value="">Tümü</option>
            {Object.entries(DURUM_ETIKET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
      <div className="rpr-kpi-row">
        <div className="rpr-kpi">
          <div className="rpr-kpi-accent" style={{ background: '#6366F1' }} />
          <div className="rpr-kpi-label">Toplam Adet</div>
          <div className="rpr-kpi-value">{ozet.toplam_adet ?? 0}</div>
          <i className="bi bi-file-earmark-text rpr-kpi-icon" />
        </div>
        <div className="rpr-kpi">
          <div className="rpr-kpi-accent" style={{ background: '#10B981' }} />
          <div className="rpr-kpi-label">Alacak Toplam</div>
          <div className="rpr-kpi-value financial-num">{TL(ozet.alacak_toplam)}</div>
          <i className="bi bi-arrow-down-circle rpr-kpi-icon" />
        </div>
        <div className="rpr-kpi">
          <div className="rpr-kpi-accent" style={{ background: '#F59E0B' }} />
          <div className="rpr-kpi-label">Borç Toplam</div>
          <div className="rpr-kpi-value financial-num">{TL(ozet.borc_toplam)}</div>
          <i className="bi bi-arrow-up-circle rpr-kpi-icon" />
        </div>
        <div className="rpr-kpi">
          <div className="rpr-kpi-accent" style={{ background: '#DC2626' }} />
          <div className="rpr-kpi-label">Karşılıksız</div>
          <div className="rpr-kpi-value financial-num" style={{ color: '#DC2626' }}>{TL(ozet.karsiliksiz_toplam)}</div>
          <i className="bi bi-exclamation-octagon rpr-kpi-icon" />
        </div>
      </div>

      {/* Grafikler */}
      <div style={{ display: 'grid', gridTemplateColumns: pieData && barData ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 20 }}>
        {pieData && (
          <div className="rpr-card">
            <div className="rpr-card-header">
              <h3 className="rpr-card-title"><i className="bi bi-pie-chart-fill" /> Durum Dağılımı</h3>
            </div>
            <div className="rpr-card-body">
              <div className="rpr-chart-wrap" style={{ height: 260 }}>
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          </div>
        )}
        {barData && (
          <div className="rpr-card">
            <div className="rpr-card-header">
              <h3 className="rpr-card-title"><i className="bi bi-calendar3" /> Vade Takvimi</h3>
            </div>
            <div className="rpr-card-body">
              <div className="rpr-chart-wrap" style={{ height: 260 }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tablo */}
      <div className="rpr-card">
        <div className="rpr-card-header">
          <h3 className="rpr-card-title"><i className="bi bi-table" /> Durum Detay</h3>
        </div>
        <div className="table-responsive" id="rpr-cek-tablo">
          <table className="table table-hover align-middle rpr-table mb-0">
            <thead>
              <tr>
                <th>Durum</th>
                <th>Tür</th>
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
                    <span style={{
                      display: 'inline-block', width: 8, height: 8, borderRadius: 2,
                      background: DURUM_RENK[d.durum] || '#9CA3AF', marginRight: 8,
                    }} />
                    {DURUM_ETIKET[d.durum] || d.durum}
                  </td>
                  <td>{TUR_ETIKET[d.tur] || d.tur}</td>
                  <td className="text-end">{d.adet}</td>
                  <td className="text-end financial-num" style={{ fontWeight: 600 }}>{TL(d.toplam_tutar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .rpr-card-body .rpr-chart-wrap { height: 200px !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
