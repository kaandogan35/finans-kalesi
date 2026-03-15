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
    value: 284750, sub: '+%12,4 geçen aya göre', dir: 'up',
    icon: 'bi-arrow-up-right-circle',
    iconBg: '#edf7f0', iconColor: '#2d8050',
  },
  {
    label: 'Toplam Borç',
    value: 127320, sub: '-%3,2 geçen aya göre', dir: 'down',
    icon: 'bi-arrow-down-left-circle',
    iconBg: '#fdf0ee', iconColor: '#c0392b',
  },
  {
    label: 'Kasa Bakiyesi',
    value: 93450, sub: 'Net pozisyon', dir: 'neutral',
    icon: 'bi-safe',
    iconBg: '#fdf5ea', iconColor: '#a06040',
  },
  {
    label: 'Vadesi Yaklaşan',
    value: null, count: 6, sub: '30 gün içinde', dir: 'neutral',
    icon: 'bi-calendar-event',
    iconBg: '#fef9ec', iconColor: '#c47f0a',
  },
]

function durumBadge(durum) {
  if (durum === 'ödendi')   return <span className="e-badge e-badge-success"><i className="bi bi-check-circle" />Ödendi</span>
  if (durum === 'bekliyor') return <span className="e-badge e-badge-warning"><i className="bi bi-clock" />Bekliyor</span>
  if (durum === 'gecikti')  return <span className="e-badge e-badge-danger"><i className="bi bi-exclamation-circle" />Gecikti</span>
  return null
}

function vadeDaysBadge(gunKaldi) {
  const style = gunKaldi <= 3
    ? { background: '#fdf0ee', color: '#c0392b' }
    : gunKaldi <= 7
    ? { background: '#fef9ec', color: '#c47f0a' }
    : { background: '#edf7f0', color: '#2d8050' }
  return <span className="e-vade-days" style={style}>{gunKaldi} gün</span>
}

export default function Dashboard() {
  return (
    <>
      {/* KPI Kartları */}
      <div className="e-kpi-grid">
        {kpilar.map((k) => (
          <div className="e-kpi-card" key={k.label}>
            <div className="e-kpi-top">
              <span className="e-kpi-label">{k.label}</span>
              <div
                className="e-kpi-icon"
                style={{ background: k.iconBg, color: k.iconColor }}
                aria-hidden="true"
              >
                <i className={`bi ${k.icon}`} />
              </div>
            </div>
            <div className="e-kpi-value">
              {k.value !== null
                ? `${para(k.value)} ₺`
                : <>{k.count} <span style={{ fontSize: 16, fontWeight: 400 }}>adet</span></>
              }
            </div>
            <div className={`e-kpi-sub ${k.dir}`}>
              {k.dir === 'up'      && <i className="bi bi-arrow-up-short" />}
              {k.dir === 'down'    && <i className="bi bi-arrow-down-short" />}
              {k.dir === 'neutral' && <i className="bi bi-dash" />}
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Son İşlemler + Yaklaşan Vadeler */}
      <div className="e-dash-grid">
        {/* Sol */}
        <div className="e-panel">
          <div className="e-panel-header">
            <h2 className="e-panel-title">
              <i className="bi bi-clock-history" />
              Son İşlemler
            </h2>
          </div>
          <div className="table-responsive">
            <table className="e-table" aria-label="Son işlemler">
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
                    <td style={{ color: 'var(--e-text-muted)', fontSize: 12 }}>{row.tarih}</td>
                    <td style={{ fontWeight: 600 }}>{row.aciklama}</td>
                    <td style={{ color: 'var(--e-text-secondary)' }}>{row.cari}</td>
                    <td className={row.tutar >= 0 ? 'e-amount-pos' : 'e-amount-neg'}>
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
        <div className="e-panel">
          <div className="e-panel-header">
            <h2 className="e-panel-title">
              <i className="bi bi-alarm" />
              Yaklaşan Vadeler
            </h2>
          </div>
          <div className="e-vade-list">
            {yaklaşanVadeler.map((v, i) => {
              const dotColor = v.gunKaldi <= 3 ? '#c0392b' : v.gunKaldi <= 7 ? '#c47f0a' : '#2d8050'
              return (
                <div className="e-vade-item" key={i}>
                  <div className="e-vade-dot" style={{ background: dotColor }} aria-hidden="true" />
                  <div className="e-vade-info">
                    <div className="e-vade-name">{v.cari}</div>
                    <div className="e-vade-amount">{para(v.tutar)} ₺</div>
                  </div>
                  {vadeDaysBadge(v.gunKaldi)}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Çek/Senet Özeti */}
      <div className="e-panel">
        <div className="e-panel-header">
          <h2 className="e-panel-title">
            <i className="bi bi-file-earmark-text" />
            Çek / Senet Özeti
          </h2>
        </div>
        <div className="e-cek-grid">
          {[
            { label: 'Portföyde',    adet: 42, tutar: 318500 },
            { label: 'Tahsilde',     adet: 18, tutar: 156200 },
            { label: 'Bu Ay Tahsil', adet: 11, tutar:  89750 },
          ].map((c) => (
            <div className="e-cek-metric" key={c.label}>
              <div className="e-cek-count">{c.adet}</div>
              <div className="e-cek-amount">{para(c.tutar)} ₺</div>
              <div className="e-cek-label">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
