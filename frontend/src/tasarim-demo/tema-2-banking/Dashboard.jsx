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
    icon: 'bi-graph-up-arrow',
  },
  {
    label: 'Toplam Borç',
    value: 127320,
    sub: '-%3,2 geçen aya göre',
    dir: 'down',
    icon: 'bi-graph-down-arrow',
  },
  {
    label: 'Kasa Bakiyesi',
    value: 93450,
    sub: 'Net pozisyon',
    dir: 'neutral',
    icon: 'bi-safe',
  },
  {
    label: 'Vadesi Yaklaşan',
    value: null,
    count: 6,
    sub: '30 gün içinde',
    dir: 'neutral',
    icon: 'bi-calendar-event',
  },
]

function durumBadge(durum) {
  if (durum === 'ödendi')   return <span className="b-badge b-badge-success"><i className="bi bi-check-circle" />Ödendi</span>
  if (durum === 'bekliyor') return <span className="b-badge b-badge-warning"><i className="bi bi-clock" />Bekliyor</span>
  if (durum === 'gecikti')  return <span className="b-badge b-badge-danger"><i className="bi bi-exclamation-circle" />Gecikti</span>
  return null
}

function vadeDaysBadge(gunKaldi) {
  const style = gunKaldi <= 3
    ? { background: '#fdf0ee', color: '#c0392b' }
    : gunKaldi <= 7
    ? { background: '#fef8ec', color: '#b8860b' }
    : { background: '#e8f7f3', color: '#1a7a55' }
  return <span className="b-vade-days" style={style}>{gunKaldi} gün kaldı</span>
}

export default function Dashboard() {
  return (
    <>
      {/* KPI Kartları */}
      <div className="b-kpi-grid">
        {kpilar.map((k) => (
          <div className="b-kpi-card" key={k.label}>
            <div className="b-kpi-top">
              <span className="b-kpi-label">{k.label}</span>
              <i className={`bi ${k.icon} b-kpi-icon`} aria-hidden="true" />
            </div>
            <div className="b-kpi-value" style={{ fontFamily: 'var(--b-font-display)' }}>
              {k.value !== null
                ? `${para(k.value)} ₺`
                : <>{k.count} <span style={{ fontSize: 15, fontWeight: 400 }}>adet</span></>
              }
            </div>
            <div className={`b-kpi-sub ${k.dir}`}>
              {k.dir === 'up'   && <i className="bi bi-arrow-up-short" />}
              {k.dir === 'down' && <i className="bi bi-arrow-down-short" />}
              {k.dir === 'neutral' && <i className="bi bi-dash" />}
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Son İşlemler + Yaklaşan Vadeler */}
      <div className="b-dash-grid">
        {/* Sol: Son İşlemler */}
        <div className="b-panel">
          <div className="b-panel-header">
            <h2 className="b-panel-title">
              <i className="bi bi-clock-history" />
              Son İşlemler
            </h2>
          </div>
          <div className="b-panel-body">
            <div className="table-responsive">
              <table className="b-table" aria-label="Son işlemler">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Açıklama</th>
                    <th>Cari Adı</th>
                    <th>Tutar (₺)</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {sonIslemler.map((row, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--b-text-muted)', fontSize: 12 }}>{row.tarih}</td>
                      <td style={{ fontWeight: 600 }}>{row.aciklama}</td>
                      <td style={{ color: 'var(--b-text-secondary)' }}>{row.cari}</td>
                      <td className={row.tutar >= 0 ? 'b-amount-pos' : 'b-amount-neg'}>
                        {row.tutar >= 0 ? '+' : '-'}{para(row.tutar)}
                      </td>
                      <td>{durumBadge(row.durum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sağ: Yaklaşan Vadeler */}
        <div className="b-panel">
          <div className="b-panel-header">
            <h2 className="b-panel-title">
              <i className="bi bi-alarm" />
              Yaklaşan Vadeler
            </h2>
          </div>
          <div className="b-vade-list">
            {yaklaşanVadeler.map((v, i) => (
              <div className="b-vade-item" key={i}>
                <span className="b-vade-rank">{String(i + 1).padStart(2, '0')}</span>
                <div className="b-vade-info">
                  <div className="b-vade-name">{v.cari}</div>
                  <div className="b-vade-amount">{para(v.tutar)} ₺</div>
                </div>
                {vadeDaysBadge(v.gunKaldi)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Çek/Senet Özeti */}
      <div className="b-panel">
        <div className="b-panel-header">
          <h2 className="b-panel-title">
            <i className="bi bi-file-earmark-text" />
            Çek / Senet Özeti
          </h2>
        </div>
        <div className="b-cek-grid">
          {[
            { label: 'Portföyde',    adet: 42, tutar: 318500 },
            { label: 'Tahsilde',     adet: 18, tutar: 156200 },
            { label: 'Bu Ay Tahsil', adet: 11, tutar:  89750 },
          ].map((c) => (
            <div className="b-cek-metric" key={c.label}>
              <div className="b-cek-count" style={{ fontFamily: 'var(--b-font-display)' }}>
                {c.adet}
              </div>
              <div className="b-cek-amount">{para(c.tutar)} ₺</div>
              <div className="b-cek-label">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
