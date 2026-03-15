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
    iconBg: 'rgba(0,214,143,0.12)', iconColor: '#00d68f',
  },
  {
    label: 'Toplam Borç',
    value: 127320, sub: '-%3,2 geçen aya göre', dir: 'down',
    icon: 'bi-arrow-down-left-circle',
    iconBg: 'rgba(255,91,91,0.12)', iconColor: '#ff5b5b',
  },
  {
    label: 'Kasa Bakiyesi',
    value: 93450, sub: 'Net pozisyon', dir: 'neutral',
    icon: 'bi-safe',
    iconBg: 'rgba(0,212,255,0.12)', iconColor: '#00d4ff',
  },
  {
    label: 'Vadesi Yaklaşan',
    value: null, count: 6, sub: '30 gün içinde', dir: 'neutral',
    icon: 'bi-calendar-event',
    iconBg: 'rgba(244,197,66,0.12)', iconColor: '#f4c542',
  },
]

function durumBadge(durum) {
  if (durum === 'ödendi')   return <span className="d-badge d-badge-success">ÖDENDI</span>
  if (durum === 'bekliyor') return <span className="d-badge d-badge-warning">BEKL.</span>
  if (durum === 'gecikti')  return <span className="d-badge d-badge-danger">GECİKTİ</span>
  return null
}

function vadeDaysBadge(gunKaldi) {
  const style = gunKaldi <= 3
    ? { background: 'rgba(255,91,91,0.12)', color: '#ff5b5b' }
    : gunKaldi <= 7
    ? { background: 'rgba(244,197,66,0.12)', color: '#f4c542' }
    : { background: 'rgba(0,214,143,0.1)',   color: '#00d68f' }
  return <span className="d-vade-days" style={style}>{gunKaldi}g</span>
}

function vadeBarColor(gunKaldi) {
  if (gunKaldi <= 3) return '#ff5b5b'
  if (gunKaldi <= 7) return '#f4c542'
  return '#00d68f'
}

export default function Dashboard() {
  return (
    <>
      {/* KPI Kartları */}
      <div className="d-kpi-grid">
        {kpilar.map((k) => (
          <div className="d-kpi-card" key={k.label}>
            <div className="d-kpi-top">
              <span className="d-kpi-label">{k.label}</span>
              <div
                className="d-kpi-icon"
                style={{ background: k.iconBg, color: k.iconColor }}
                aria-hidden="true"
              >
                <i className={`bi ${k.icon}`} />
              </div>
            </div>
            <div className="d-kpi-value">
              {k.value !== null
                ? `${para(k.value)} ₺`
                : <>{k.count} <span style={{ fontSize: 14, fontWeight: 400 }}>adet</span></>
              }
            </div>
            <div className={`d-kpi-sub ${k.dir}`}>
              {k.dir === 'up'   && <i className="bi bi-arrow-up-short" />}
              {k.dir === 'down' && <i className="bi bi-arrow-down-short" />}
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Son İşlemler + Yaklaşan Vadeler */}
      <div className="d-dash-grid">
        {/* Sol */}
        <div className="d-panel">
          <div className="d-panel-header">
            <h2 className="d-panel-title">
              <i className="bi bi-activity" />
              Son İşlemler
            </h2>
          </div>
          <div className="table-responsive">
            <table className="d-table" aria-label="Son işlemler">
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
                    <td style={{ color: 'var(--d-text-muted)', fontSize: 11.5, fontFamily: 'var(--d-font-mono)' }}>
                      {row.tarih}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--d-text-primary)' }}>{row.aciklama}</td>
                    <td>{row.cari}</td>
                    <td className={row.tutar >= 0 ? 'd-amount-pos' : 'd-amount-neg'}>
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
        <div className="d-panel">
          <div className="d-panel-header">
            <h2 className="d-panel-title">
              <i className="bi bi-alarm" />
              Yaklaşan Vadeler
            </h2>
          </div>
          <div className="d-vade-list">
            {yaklaşanVadeler.map((v, i) => (
              <div className="d-vade-item" key={i}>
                <div
                  className="d-vade-bar"
                  style={{ background: vadeBarColor(v.gunKaldi) }}
                  aria-hidden="true"
                />
                <div className="d-vade-info">
                  <div className="d-vade-name">{v.cari}</div>
                  <div className="d-vade-amount">{para(v.tutar)} ₺</div>
                </div>
                {vadeDaysBadge(v.gunKaldi)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Çek/Senet Özeti */}
      <div className="d-panel">
        <div className="d-panel-header">
          <h2 className="d-panel-title">
            <i className="bi bi-file-earmark-text" />
            Çek / Senet Özeti
          </h2>
        </div>
        <div className="d-cek-grid">
          {[
            { label: 'Portföyde',    adet: 42, tutar: 318500 },
            { label: 'Tahsilde',     adet: 18, tutar: 156200 },
            { label: 'Bu Ay Tahsil', adet: 11, tutar:  89750 },
          ].map((c) => (
            <div className="d-cek-metric" key={c.label}>
              <div className="d-cek-count">{c.adet}</div>
              <div className="d-cek-amount">{para(c.tutar)} ₺</div>
              <div className="d-cek-label">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
