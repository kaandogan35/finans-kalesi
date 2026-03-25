/**
 * GenelOzet.jsx — Genel Finansal Özet Raporu
 * Tüm modüllerden KPI verilerini birleşik gösterir
 * rpr- prefix
 */

import { useState, useEffect } from 'react'
import { raporlarApi } from '../../api/raporlar'
import { toast } from 'sonner'

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

export default function GenelOzet() {
  const [veri, setVeri] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => { getir() }, [])

  const getir = async () => {
    setYukleniyor(true)
    try {
      const { data } = await raporlarApi.genelOzet()
      if (data.basarili) setVeri(data.veri)
    } catch {
      toast.error('Genel özet yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  if (yukleniyor) {
    return <div className="rpr-loading"><div className="rpr-spinner" /> Yükleniyor…</div>
  }

  if (!veri) {
    return (
      <div className="rpr-empty">
        <div className="rpr-empty-icon"><i className="bi bi-bar-chart-line" /></div>
        <div className="rpr-empty-text">Veri yüklenemedi</div>
        <div className="rpr-empty-sub">Lütfen sayfayı yenileyin</div>
      </div>
    )
  }

  const { cari, cek_senet, odeme, kasa } = veri

  const kpiGruplari = [
    {
      baslik: 'Cari Hesaplar',
      ikon: 'bi-people-fill',
      renk: '#10B981',
      kartlar: [
        { etiket: 'Net Bakiye', deger: TL(cari.net_bakiye), renk: cari.net_bakiye >= 0 ? '#10B981' : '#DC2626' },
        { etiket: 'Toplam Borç', deger: TL(cari.toplam_borc), renk: '#F59E0B' },
        { etiket: 'Toplam Alacak', deger: TL(cari.toplam_alacak), renk: '#10B981' },
        { etiket: 'Aktif Cari', deger: cari.aktif_cari, renk: '#6366F1' },
      ],
    },
    {
      baslik: 'Çek / Senet',
      ikon: 'bi-file-earmark-text-fill',
      renk: '#6366F1',
      kartlar: [
        { etiket: 'Alacak Portföy', deger: TL(cek_senet.alacak_portfoy), renk: '#10B981' },
        { etiket: 'Borç Portföy', deger: TL(cek_senet.borc_portfoy), renk: '#F59E0B' },
        { etiket: 'Karşılıksız', deger: TL(cek_senet.karsiliksiz), renk: '#DC2626' },
      ],
    },
    {
      baslik: 'Ödeme Takip',
      ikon: 'bi-credit-card-2-front-fill',
      renk: '#F59E0B',
      kartlar: [
        { etiket: 'Tahsilat', deger: TL(odeme.tahsilat_toplam), renk: '#10B981' },
        { etiket: 'Ödeme', deger: TL(odeme.odeme_toplam), renk: '#6366F1' },
        { etiket: 'Geciken', deger: TL(odeme.geciken_toplam), renk: '#DC2626' },
        { etiket: 'Geciken Adet', deger: odeme.geciken_adet, renk: '#DC2626' },
      ],
    },
    {
      baslik: 'Kasa',
      ikon: 'bi-safe-fill',
      renk: '#10B981',
      kartlar: [
        { etiket: 'Bakiye', deger: TL(kasa.bakiye), renk: kasa.bakiye >= 0 ? '#10B981' : '#DC2626' },
        { etiket: 'Toplam Giriş', deger: TL(kasa.toplam_giris), renk: '#10B981' },
        { etiket: 'Toplam Çıkış', deger: TL(kasa.toplam_cikis), renk: '#F59E0B' },
      ],
    },
  ]

  return (
    <div>
      {kpiGruplari.map((grup, gi) => (
        <div key={gi} style={{ marginBottom: 24 }}>
          <div className="rpr-card">
            <div className="rpr-card-header">
              <h3 className="rpr-card-title">
                <i className={`bi ${grup.ikon}`} />
                {grup.baslik}
              </h3>
            </div>
            <div className="rpr-card-body">
              <div className="rpr-kpi-row" style={{
                gridTemplateColumns: `repeat(${Math.min(grup.kartlar.length, 4)}, 1fr)`,
              }}>
                {grup.kartlar.map((k, ki) => (
                  <div className="rpr-kpi" key={ki}>
                    <div className="rpr-kpi-accent" style={{ background: k.renk }} />
                    <div className="rpr-kpi-label">{k.etiket}</div>
                    <div className="rpr-kpi-value financial-num" style={{ color: k.renk }}>{k.deger}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
