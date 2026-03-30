/**
 * GenelOzet.jsx — Genel Finansal Ozet Raporu
 * Tum modullerden KPI verilerini + hesaplama metriklerini gosterir
 * rpr- prefix
 */

import { useState, useEffect } from 'react'
import { raporlarApi } from '../../api/raporlar'
import { bildirim as toast } from '../../components/ui/CenterAlert'

const TL = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n ?? 0)

// DSO renk fonksiyonu
function dsoRenk(dso) {
  if (dso <= 30) return '#10B981'
  if (dso <= 60) return '#F59E0B'
  return '#DC2626'
}

// Tahsilat orani renk
function tahsilatRenk(oran) {
  if (oran >= 90) return '#10B981'
  if (oran >= 70) return '#F59E0B'
  return '#DC2626'
}

// Risk orani renk
function riskRenk(oran) {
  if (oran <= 3) return '#10B981'
  if (oran <= 5) return '#F59E0B'
  return '#DC2626'
}

// Kasa dayanma renk
function dayanmaRenk(ay) {
  if (ay > 3) return '#10B981'
  if (ay >= 1) return '#F59E0B'
  return '#DC2626'
}

export default function GenelOzet() {
  const [veri, setVeri] = useState(null)
  const [hesap, setHesap] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => { getir() }, [])

  const getir = async () => {
    setYukleniyor(true)
    try {
      const [ozet, hesaplamalar] = await Promise.all([
        raporlarApi.genelOzet(),
        raporlarApi.hesaplamalar(),
      ])
      if (ozet.data.basarili) setVeri(ozet.data.veri)
      if (hesaplamalar.data.basarili) setHesap(hesaplamalar.data.veri)
    } catch {
      toast.error('Genel ozet yuklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  if (yukleniyor) {
    return <div className="p-rpr-loading"><div className="p-rpr-spinner" /> Yukleniyor...</div>
  }

  if (!veri) {
    return (
      <div className="p-rpr-empty">
        <div className="p-rpr-empty-icon"><i className="bi bi-bar-chart-line" /></div>
        <div className="p-rpr-empty-text">Veri yuklenemedi</div>
        <div className="p-rpr-empty-sub">Lutfen sayfayi yenileyin</div>
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
        { etiket: 'Toplam Borc', deger: TL(cari.toplam_borc), renk: '#F59E0B' },
        { etiket: 'Toplam Alacak', deger: TL(cari.toplam_alacak), renk: '#10B981' },
        { etiket: 'Aktif Cari', deger: cari.aktif_cari, renk: '#6366F1' },
      ],
    },
    {
      baslik: 'Cek / Senet',
      ikon: 'bi-file-earmark-text-fill',
      renk: '#6366F1',
      kartlar: [
        { etiket: 'Alacak Portfoy', deger: TL(cek_senet.alacak_portfoy), renk: '#10B981' },
        { etiket: 'Borc Portfoy', deger: TL(cek_senet.borc_portfoy), renk: '#F59E0B' },
        { etiket: 'Karsiliksiz', deger: TL(cek_senet.karsiliksiz), renk: '#DC2626' },
      ],
    },
    {
      baslik: 'Odeme Takip',
      ikon: 'bi-credit-card-2-front-fill',
      renk: '#F59E0B',
      kartlar: [
        { etiket: 'Tahsilat', deger: TL(odeme.tahsilat_toplam), renk: '#10B981' },
        { etiket: 'Odeme', deger: TL(odeme.odeme_toplam), renk: '#6366F1' },
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
        { etiket: 'Toplam Giris', deger: TL(kasa.toplam_giris), renk: '#10B981' },
        { etiket: 'Toplam Cikis', deger: TL(kasa.toplam_cikis), renk: '#F59E0B' },
      ],
    },
  ]

  // Hesaplama metrikleri
  const hesapKartlari = hesap ? [
    {
      etiket: 'Ort. Tahsilat Suresi',
      deger: `${hesap.dso} gun`,
      renk: dsoRenk(hesap.dso),
      ikon: 'bi-clock-history',
      aciklama: hesap.dso <= 30 ? 'Iyi seviyede' : hesap.dso <= 60 ? 'Dikkat edilmeli' : 'Kritik — tahsilat yavas',
    },
    {
      etiket: 'Tahsilat Basari Orani',
      deger: `%${hesap.tahsilat_orani}`,
      renk: tahsilatRenk(hesap.tahsilat_orani),
      ikon: 'bi-check2-circle',
      aciklama: `100 TL'de ${Math.round(hesap.tahsilat_orani)} TL toplandi`,
    },
    {
      etiket: 'Cek Risk Orani',
      deger: `%${hesap.karsiliksiz_oran}`,
      renk: riskRenk(hesap.karsiliksiz_oran),
      ikon: 'bi-shield-exclamation',
      aciklama: hesap.karsiliksiz_oran <= 3 ? 'Dusuk risk' : hesap.karsiliksiz_oran <= 5 ? 'Dikkat' : 'Yuksek risk!',
    },
    {
      etiket: '30 Gun Nakit Tahmini',
      deger: TL(hesap.net30_tahmini),
      renk: hesap.net30_tahmini >= 0 ? '#10B981' : '#DC2626',
      ikon: 'bi-graph-up-arrow',
      aciklama: '30 gun sonraki tahmini kasa bakiyesi',
    },
    {
      etiket: 'Kasa Dayanma',
      deger: hesap.kasa_dayanma_ay >= 99 ? 'Pozitif' : `${hesap.kasa_dayanma_ay} ay`,
      renk: dayanmaRenk(hesap.kasa_dayanma_ay),
      ikon: 'bi-hourglass-split',
      aciklama: hesap.kasa_dayanma_ay >= 99 ? 'Gelir gideri karsilar' : `Hic para girmeseydi ${hesap.kasa_dayanma_ay} ay`,
    },
  ] : []

  // Aksiyon paneli
  const aksiyonlar = []
  if (hesap) {
    if (hesap.bu_hafta_dolan_cek_adet > 0) {
      aksiyonlar.push({
        renk: '#F59E0B',
        mesaj: `Bu hafta ${hesap.bu_hafta_dolan_cek_adet} cekin doluyor — ${TL(hesap.bu_hafta_dolan_cek_tutar)}`,
      })
    }
    if (hesap.karsiliksiz_oran > 5) {
      aksiyonlar.push({
        renk: '#DC2626',
        mesaj: `Cek risk orani %${hesap.karsiliksiz_oran} — portfoyunu kontrol et`,
      })
    }
    if (hesap.konsantrasyon_risk > 50) {
      aksiyonlar.push({
        renk: '#F59E0B',
        mesaj: `Alacaklarinin %${hesap.konsantrasyon_risk}'i 3 musteriden — riski dagit`,
      })
    }
    if (hesap.tahsilat_orani >= 85) {
      aksiyonlar.push({
        renk: '#10B981',
        mesaj: `Tahsilat oranin %${hesap.tahsilat_orani} — iyi gidiyorsun`,
      })
    }
    if (hesap.dso > 60) {
      aksiyonlar.push({
        renk: '#DC2626',
        mesaj: `Ortalama ${hesap.dso} gunde tahsil ediyorsun — hizlandirmaya calis`,
      })
    }
    if (hesap.ortalama_cek_vade > 0) {
      aksiyonlar.push({
        renk: '#6366F1',
        mesaj: `Portfoydeki cekler ortalama ${hesap.ortalama_cek_vade} gun sonra doluyor`,
      })
    }
  }

  return (
    <div>
      {/* Hesaplama Metrikleri */}
      {hesapKartlari.length > 0 && (
        <div className="p-rpr-hesap-grid">
          {hesapKartlari.map((k, i) => (
            <div className="p-rpr-hesap-kart" key={i}>
              <i className={`bi ${k.ikon} p-rpr-hesap-ikon`} style={{ color: k.renk }} />
              <div className="p-rpr-hesap-etiket">{k.etiket}</div>
              <div className="p-rpr-hesap-deger" style={{ color: k.renk }}>{k.deger}</div>
              <div className="p-rpr-hesap-aciklama">{k.aciklama}</div>
            </div>
          ))}
        </div>
      )}

      {/* Aksiyon Paneli */}
      {aksiyonlar.length > 0 && (
        <div className="p-rpr-aksiyon">
          <div className="p-rpr-aksiyon-baslik">
            <i className="bi bi-lightning-charge-fill" style={{ color: '#F59E0B' }} />
            Aksiyon Onerileri
          </div>
          {aksiyonlar.map((a, i) => (
            <div className="p-rpr-aksiyon-item" key={i}>
              <span className="p-rpr-aksiyon-dot" style={{ background: a.renk }} />
              {a.mesaj}
            </div>
          ))}
        </div>
      )}

      {/* Mevcut KPI Gruplari */}
      {kpiGruplari.map((grup, gi) => (
        <div key={gi} style={{ marginBottom: 24 }}>
          <div className="p-rpr-card">
            <div className="p-rpr-card-header">
              <h3 className="p-rpr-card-title">
                <i className={`bi ${grup.ikon}`} />
                {grup.baslik}
              </h3>
            </div>
            <div className="p-rpr-card-body">
              <div className="p-rpr-kpi-row" data-cols={grup.kartlar.length}>
                {grup.kartlar.map((k, ki) => (
                  <div className="p-rpr-kpi" key={ki} style={{ '--p-rpr-kpi-accent-color': k.renk }}>
                    <div className="p-rpr-kpi-label">{k.etiket}</div>
                    <div className="p-rpr-kpi-value financial-num" style={{ color: k.renk }}>{k.deger}</div>
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
