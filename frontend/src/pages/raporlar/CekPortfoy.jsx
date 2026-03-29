/**
 * CekPortfoy.jsx — Çek/Senet Portföy Raporu
 * Pie chart (durum dağılımı) + Bar chart (vade takvimi) + tablo
 * rpr- prefix
 */

import { useState, useEffect } from 'react'
import { raporlarApi } from '../../api/raporlar'
import { toast } from 'sonner'
import { usePlanKontrol } from '../../hooks/usePlanKontrol'
import PlanYukseltModal from '../../components/PlanYukseltModal'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { standardTooltip, standardAnimation, standardLegend, standardYScale, standardXScale } from '../../lib/chartConfig'
import { pdfIndir as pdfIndirUtil } from '../../lib/pdfExport'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

const DURUM_ETIKET = {
  portfoyde: 'Elimde',
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
  const { izinVarMi, plan } = usePlanKontrol()
  const [modalGoster, setModalGoster] = useState(false)
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
  const pdfIndir = () => pdfIndirUtil('rpr-cek-tablo', '\u00c7ek/Senet Portf\u00f6y Raporu', 'cek_portfoy')

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
    cutout: '65%',
    animation: standardAnimation,
    plugins: {
      datalabels: { display: false },
      legend: {
        position: 'right',
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      tooltip: { ...standardTooltip, callbacks: { label: (ctx) => ` ${ctx.label}: ${TL(ctx.raw)}` } },
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

  const ozet = veri?.ozet || {}

  return (
    <div>
      {/* Filtre */}
      <div className="p-rpr-filter-bar">
        <div className="p-rpr-filter-group">
          <span className="p-rpr-filter-label">Tür</span>
          <select className="p-rpr-filter-input" value={filtre.tur}
            onChange={(e) => setFiltre({ ...filtre, tur: e.target.value })}>
            <option value="">Tümü</option>
            {Object.entries(TUR_ETIKET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
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
        <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#6366F1' }}>
          <div className="p-rpr-kpi-label">Toplam Adet</div>
          <div className="p-rpr-kpi-value">{ozet.toplam_adet ?? 0}</div>
          <i className="bi bi-file-earmark-text p-rpr-kpi-icon" />
        </div>
        <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#10B981' }}>
          <div className="p-rpr-kpi-label">Alacak Toplam</div>
          <div className="p-rpr-kpi-value financial-num">{TL(ozet.alacak_toplam)}</div>
          <i className="bi bi-arrow-down-circle p-rpr-kpi-icon" />
        </div>
        <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#F59E0B' }}>
          <div className="p-rpr-kpi-label">Borç Toplam</div>
          <div className="p-rpr-kpi-value financial-num">{TL(ozet.borc_toplam)}</div>
          <i className="bi bi-arrow-up-circle p-rpr-kpi-icon" />
        </div>
        <div className="p-rpr-kpi" style={{ '--p-rpr-kpi-accent-color': '#DC2626' }}>
          <div className="p-rpr-kpi-label">Karşılıksız</div>
          <div className="p-rpr-kpi-value financial-num" style={{ color: '#DC2626' }}>{TL(ozet.karsiliksiz_toplam)}</div>
          <i className="bi bi-exclamation-octagon p-rpr-kpi-icon" />
        </div>
      </div>

      {/* Grafikler */}
      <div style={{ display: 'grid', gridTemplateColumns: pieData && barData ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 20 }}>
        {pieData && (
          <div className="p-rpr-card">
            <div className="p-rpr-card-header">
              <h3 className="p-rpr-card-title"><i className="bi bi-pie-chart-fill" /> Durum Dağılımı</h3>
            </div>
            <div className="p-rpr-card-body">
              <div className="p-rpr-chart-wrap" style={{ height: 260 }}>
                <Doughnut data={pieData} options={pieOptions} />
              </div>
            </div>
          </div>
        )}
        {barData && (
          <div className="p-rpr-card">
            <div className="p-rpr-card-header">
              <h3 className="p-rpr-card-title"><i className="bi bi-calendar3" /> Vade Takvimi</h3>
            </div>
            <div className="p-rpr-card-body">
              <div className="p-rpr-chart-wrap" style={{ height: 260 }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tablo */}
      <div className="p-rpr-card">
        <div className="p-rpr-card-header">
          <h3 className="p-rpr-card-title"><i className="bi bi-table" /> Durum Detay</h3>
        </div>
        {/* Masaüstü Tablo */}
        <div className="table-responsive d-none d-md-block" id="rpr-cek-tablo">
          <table className="table table-hover align-middle p-rpr-table mb-0">
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

        {/* Mobil Kart Listesi */}
        <div className="d-md-none">
          {(!veri?.durum_dagilim || veri.durum_dagilim.length === 0) ? (
            <div className="text-center py-5 text-muted" style={{ fontSize: 13 }}>Veri bulunamadı</div>
          ) : veri.durum_dagilim.map((d, i) => (
            <div key={i} className="p-gg-mcard">
              <div className="p-gg-mcard-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: 2,
                    background: DURUM_RENK[d.durum] || '#9CA3AF', flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{DURUM_ETIKET[d.durum] || d.durum}</span>
                </div>
                <span className="p-gg-mcard-tutar financial-num" style={{ fontWeight: 600 }}>{TL(d.toplam_tutar)}</span>
              </div>
              <div className="p-gg-mcard-alt">
                <span style={{ fontSize: 11, color: 'var(--p-text-muted)' }}>{TUR_ETIKET[d.tur] || d.tur}</span>
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
