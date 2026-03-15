import './tema.css'

const para = (n) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(Math.abs(n))

const sonIslemler = [
  { tarih: '15.03.2026', aciklama: 'Mal Alımı',      cari: 'Demir Çelik A.Ş.',  tutar: -48200,  durum: 'ödendi'   },
  { tarih: '14.03.2026', aciklama: 'Satış',           cari: 'Yıldız Hırdavat',   tutar:  32500,  durum: 'ödendi'   },
  { tarih: '13.03.2026', aciklama: 'Vadeli Çek',      cari: 'Kartal İnşaat',     tutar:  75000,  durum: 'bekliyor' },
  { tarih: '12.03.2026', aciklama: 'Senet Ödemesi',   cari: 'Aydın Ticaret',     tutar: -18700,  durum: 'gecikti'  },
  { tarih: '11.03.2026', aciklama: 'Hizmet Bedeli',   cari: 'Güneş Yapı',        tutar:  12300,  durum: 'ödendi'   },
  { tarih: '10.03.2026', aciklama: 'Mal Alımı',       cari: 'Sistem Demir Ltd.', tutar: -55000,  durum: 'bekliyor' },
]

const yaklaşanVadeler = [
  { cari: 'Demir Çelik A.Ş.',  tutar: 85000, gunKaldi: 2  },
  { cari: 'Kartal İnşaat',     tutar: 42500, gunKaldi: 5  },
  { cari: 'Yıldız Hırdavat',   tutar: 28700, gunKaldi: 8  },
  { cari: 'Aydın Ticaret',     tutar: 63200, gunKaldi: 12 },
  { cari: 'Güneş Yapı Ltd.',   tutar: 18400, gunKaldi: 15 },
]

const kpilar = [
  {
    label: 'Toplam Alacak',
    value: 284750,
    sub: '+%12,4 geçen aya göre',
    dir: 'up',
    icon: 'bi-arrow-up-right-circle',
    iconBg: 'rgba(0,184,148,0.14)',
    iconColor: '#00b894',
  },
  {
    label: 'Toplam Borç',
    value: 127320,
    sub: '-%3,2 geçen aya göre',
    dir: 'down',
    icon: 'bi-arrow-down-left-circle',
    iconBg: 'rgba(225,112,85,0.14)',
    iconColor: '#e17055',
  },
  {
    label: 'Kasa Bakiyesi',
    value: 93450,
    sub: 'Net pozisyon',
    dir: 'neutral',
    icon: 'bi-safe',
    iconBg: 'rgba(108,92,231,0.14)',
    iconColor: '#6C5CE7',
  },
  {
    label: 'Vadesi Yaklaşan',
    value: null,
    count: 6,
    sub: '30 gün içinde',
    dir: 'neutral',
    icon: 'bi-calendar-event',
    iconBg: 'rgba(214,145,11,0.14)',
    iconColor: '#d6910b',
  },
]

function durumBadge(durum) {
  if (durum === 'ödendi')   return <span className="g-badge g-badge-success"><i className="bi bi-check-circle" />Ödendi</span>
  if (durum === 'bekliyor') return <span className="g-badge g-badge-warning"><i className="bi bi-clock" />Bekliyor</span>
  if (durum === 'gecikti')  return <span className="g-badge g-badge-danger"><i className="bi bi-exclamation-circle" />Gecikti</span>
  return null
}

function vadeDot(gunKaldi) {
  if (gunKaldi <= 3)  return { bg: '#e17055' }
  if (gunKaldi <= 7)  return { bg: '#d6910b' }
  return { bg: '#00b894' }
}

function vadeDaysBadge(gunKaldi) {
  const style = gunKaldi <= 3
    ? { background: 'rgba(225,112,85,0.14)', color: '#e17055' }
    : gunKaldi <= 7
    ? { background: 'rgba(214,145,11,0.14)', color: '#d6910b' }
    : { background: 'rgba(0,184,148,0.14)', color: '#00b894' }
  return <span className="g-vade-days" style={style}>{gunKaldi} gün</span>
}

export default function Dashboard() {
  return (
    <>
      {/* KPI Kartları */}
      <div className="g-kpi-grid">
        {kpilar.map((k) => (
          <div className="g-kpi-card" key={k.label}>
            <div className="g-kpi-top">
              <span className="g-kpi-label">{k.label}</span>
              <div
                className="g-kpi-icon"
                style={{ background: k.iconBg, color: k.iconColor }}
                aria-hidden="true"
              >
                <i className={`bi ${k.icon}`} />
              </div>
            </div>
            <div className="g-kpi-value">
              {k.value !== null
                ? `${para(k.value)} ₺`
                : <>{k.count} <span style={{ fontSize: 16, fontWeight: 500 }}>adet</span></>
              }
            </div>
            <div className={`g-kpi-sub ${k.dir}`}>
              {k.dir === 'up'   && <i className="bi bi-arrow-up-short" />}
              {k.dir === 'down' && <i className="bi bi-arrow-down-short" />}
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Son İşlemler + Yaklaşan Vadeler */}
      <div className="g-dash-grid">
        {/* Sol: Son İşlemler */}
        <div className="g-panel">
          <div className="g-panel-header">
            <h2 className="g-panel-title">
              <i className="bi bi-clock-history" />
              Son İşlemler
            </h2>
          </div>
          <div className="table-responsive g-table-wrapper">
            <table className="g-table" aria-label="Son işlemler">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Açıklama</th>
                  <th>Cari Adı</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {sonIslemler.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--g-text-muted)', fontSize: 12 }}>{row.tarih}</td>
                    <td style={{ fontWeight: 500 }}>{row.aciklama}</td>
                    <td style={{ color: 'var(--g-text-secondary)' }}>{row.cari}</td>
                    <td className={row.tutar >= 0 ? 'g-amount-pos' : 'g-amount-neg'}>
                      {row.tutar >= 0 ? '+' : '-'}{para(row.tutar)} ₺
                    </td>
                    <td>{durumBadge(row.durum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sağ: Yaklaşan Vadeler */}
        <div className="g-panel">
          <div className="g-panel-header">
            <h2 className="g-panel-title">
              <i className="bi bi-alarm" />
              Yaklaşan Vadeler
            </h2>
          </div>
          <div className="g-vade-list">
            {yaklaşanVadeler.map((v, i) => (
              <div className="g-vade-item" key={i}>
                <div
                  className="g-vade-dot"
                  style={{ background: vadeDot(v.gunKaldi).bg }}
                  aria-hidden="true"
                />
                <div className="g-vade-info">
                  <div className="g-vade-name">{v.cari}</div>
                  <div className="g-vade-amount">{para(v.tutar)} ₺</div>
                </div>
                {vadeDaysBadge(v.gunKaldi)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Çek/Senet Özeti */}
      <div className="g-panel">
        <div className="g-panel-header">
          <h2 className="g-panel-title">
            <i className="bi bi-file-earmark-text" />
            Çek / Senet Özeti
          </h2>
        </div>
        <div className="g-cek-grid">
          {[
            { label: 'Portföyde',       adet: 42, tutar: 318500 },
            { label: 'Tahsilde',        adet: 18, tutar: 156200 },
            { label: 'Bu Ay Tahsil',    adet: 11, tutar:  89750 },
          ].map((c) => (
            <div className="g-cek-metric" key={c.label}>
              <div className="g-cek-count">{c.adet}</div>
              <div className="g-cek-amount">{para(c.tutar)} ₺</div>
              <div className="g-cek-label">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
