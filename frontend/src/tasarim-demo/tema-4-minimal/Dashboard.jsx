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
    icon: 'bi-graph-up-arrow',
  },
  {
    label: 'Toplam Borç',
    value: 127320, sub: '-%3,2 geçen aya göre', dir: 'down',
    icon: 'bi-graph-down-arrow',
  },
  {
    label: 'Kasa Bakiyesi',
    value: 93450, sub: 'Net pozisyon', dir: 'neutral',
    icon: 'bi-safe',
  },
  {
    label: 'Vadesi Yaklaşan',
    value: null, count: 6, sub: '30 gün içinde', dir: 'neutral',
    icon: 'bi-calendar-event',
  },
]

function durumBadge(durum) {
  if (durum === 'ödendi')   return <span className="m-badge m-badge-success">Ödendi</span>
  if (durum === 'bekliyor') return <span className="m-badge m-badge-warning">Bekliyor</span>
  if (durum === 'gecikti')  return <span className="m-badge m-badge-danger">Gecikti</span>
  return null
}

function vadeDaysBadge(gunKaldi) {
  const style = gunKaldi <= 3
    ? { background: '#fff1f0', color: '#ef4444' }
    : gunKaldi <= 7
    ? { background: '#fffbeb', color: '#f59e0b' }
    : { background: '#ecfdf5', color: '#10b981' }
  return (
    <span className="m-vade-days" style={style}>
      {gunKaldi}g
    </span>
  )
}

export default function Dashboard() {
  return (
    <>
      {/* KPI Kartları */}
      <div className="m-kpi-grid">
        {kpilar.map((k) => (
          <div className="m-kpi-card" key={k.label}>
            <div className="m-kpi-top">
              <span className="m-kpi-label">{k.label}</span>
              <i className={`bi ${k.icon} m-kpi-icon`} aria-hidden="true" />
            </div>
            <div className="m-kpi-value">
              {k.value !== null
                ? `${para(k.value)} ₺`
                : <>{k.count} <span style={{ fontSize: 14, fontWeight: 400, fontFamily: 'var(--m-font-body)' }}>adet</span></>
              }
            </div>
            <div className={`m-kpi-sub ${k.dir}`}>
              {k.dir === 'up'   && <i className="bi bi-arrow-up-short" />}
              {k.dir === 'down' && <i className="bi bi-arrow-down-short" />}
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Son İşlemler + Yaklaşan Vadeler */}
      <div className="m-dash-grid">
        {/* Sol */}
        <div className="m-panel">
          <div className="m-panel-header">
            <h2 className="m-panel-title">
              <i className="bi bi-clock-history" />
              Son İşlemler
            </h2>
          </div>
          <div className="table-responsive">
            <table className="m-table" aria-label="Son işlemler">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Açıklama</th>
                  <th>Cari</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {sonIslemler.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--m-text-muted)', fontSize: 12, fontFamily: 'var(--m-font-mono)' }}>{row.tarih}</td>
                    <td style={{ fontWeight: 600, color: 'var(--m-text-primary)' }}>{row.aciklama}</td>
                    <td>{row.cari}</td>
                    <td className={row.tutar >= 0 ? 'm-amount-pos' : 'm-amount-neg'}>
                      {row.tutar >= 0 ? '+' : '–'}{para(row.tutar)} ₺
                    </td>
                    <td>{durumBadge(row.durum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sağ: Yaklaşan Vadeler */}
        <div className="m-panel">
          <div className="m-panel-header">
            <h2 className="m-panel-title">
              <i className="bi bi-alarm" />
              Yaklaşan Vadeler
            </h2>
          </div>
          <div className="m-vade-list">
            {yaklaşanVadeler.map((v, i) => (
              <div className="m-vade-item" key={i}>
                <span className="m-vade-num">{i + 1}</span>
                <div className="m-vade-info">
                  <div className="m-vade-name">{v.cari}</div>
                  <div className="m-vade-amount">{para(v.tutar)} ₺</div>
                </div>
                {vadeDaysBadge(v.gunKaldi)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Çek/Senet Özeti */}
      <div className="m-panel">
        <div className="m-panel-header">
          <h2 className="m-panel-title">
            <i className="bi bi-file-earmark-text" />
            Çek / Senet Özeti
          </h2>
        </div>
        <div className="m-cek-grid">
          {[
            { label: 'Portföyde',    adet: 42, tutar: 318500 },
            { label: 'Tahsilde',     adet: 18, tutar: 156200 },
            { label: 'Bu Ay Tahsil', adet: 11, tutar:  89750 },
          ].map((c) => (
            <div className="m-cek-metric" key={c.label}>
              <div className="m-cek-count">{c.adet}</div>
              <div className="m-cek-amount">{para(c.tutar)} ₺</div>
              <div className="m-cek-label">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
