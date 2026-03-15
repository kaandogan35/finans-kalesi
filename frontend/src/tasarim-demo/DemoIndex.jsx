import { Link } from 'react-router-dom'

const demolar = [
  {
    path: '/demo/glass',
    no: '01',
    ad: 'Glassmorphism',
    aciklama: 'Buzlu cam yüzeyler, mor-indigo gradyan arka plan, Syne + DM Sans',
    renk1: '#6C5CE7',
    renk2: '#a29af0',
    bg: 'linear-gradient(135deg, #ece9f8, #d8e8f7)',
    textColor: '#2a2750',
  },
  {
    path: '/demo/banking',
    no: '02',
    ad: 'Banking',
    aciklama: 'Kurumsal güven, lacivert sidebar, Libre Baskerville serif başlıklar',
    renk1: '#0a2463',
    renk2: '#b8860b',
    bg: '#ffffff',
    textColor: '#1a1f36',
  },
  {
    path: '/demo/earthy',
    no: '03',
    ad: 'Earthy',
    aciklama: 'Toprak tonları, tuğla/hardal vurgu, Cormorant Garamond + Nunito',
    renk1: '#c0392b',
    renk2: '#d4920b',
    bg: '#faf7f2',
    textColor: '#3a2010',
  },
  {
    path: '/demo/minimal',
    no: '04',
    ad: 'Minimal',
    aciklama: 'Stripe/Linear estetiği, tek vurgu rengi, Figtree + DM Mono',
    renk1: '#0070f3',
    renk2: '#6b7280',
    bg: '#ffffff',
    textColor: '#111827',
  },
  {
    path: '/demo/dark',
    no: '05',
    ad: 'Deep Navy',
    aciklama: 'Koyu fintech terminali, cyan + altın vurgu, Manrope + JetBrains Mono',
    renk1: '#00d4ff',
    renk2: '#f4c542',
    bg: '#0d1b2a',
    textColor: '#e2eaf4',
  },
]

export default function DemoIndex() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Başlık */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '8px 16px',
          marginBottom: 20,
        }}>
          <i className="bi bi-palette2" style={{ color: '#60a5fa', fontSize: 16 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Tasarım Demoları
          </span>
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 800,
          color: '#f1f5f9', margin: '0 0 12px',
          letterSpacing: '-0.03em',
        }}>
          Finans Kalesi
        </h1>
        <p style={{
          fontSize: 15, color: '#64748b', margin: 0,
          maxWidth: 420, lineHeight: 1.6,
        }}>
          5 farklı tasarım konsepti — birini seçerek inceleyin.
          ESC tuşu ve modal çalışır, sidebar aktif.
        </p>
      </div>

      {/* Demo Kartları */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        width: '100%',
        maxWidth: 900,
      }}>
        {demolar.map((d) => (
          <Link
            key={d.path}
            to={d.path}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 20,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Mini önizleme */}
              <div style={{
                height: 80,
                borderRadius: 10,
                background: d.bg,
                border: '1px solid rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center',
                padding: '12px 14px',
                gap: 10,
                overflow: 'hidden',
                position: 'relative',
              }}>
                {/* Sahte sidebar */}
                <div style={{
                  width: 40, height: '100%',
                  borderRadius: 6,
                  background: d.no === '05' ? '#0a1628' : d.no === '02' ? '#0a2463' : 'rgba(0,0,0,0.07)',
                  flexShrink: 0,
                }} />
                {/* Sahte içerik */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{
                    height: 10, borderRadius: 3,
                    background: d.renk1 + '30', width: '60%',
                  }} />
                  <div style={{
                    display: 'flex', gap: 4,
                  }}>
                    {[d.renk1, d.renk2, '#888'].map((c, i) => (
                      <div key={i} style={{
                        flex: 1, height: 24, borderRadius: 5,
                        background: c + (i === 0 ? '25' : '15'),
                        border: `1px solid ${c}30`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bilgi */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: d.renk1,
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                  }}>{d.no}</span>
                  <span style={{
                    fontSize: 15, fontWeight: 700,
                    color: '#f1f5f9',
                  }}>{d.ad}</span>
                  <span style={{ marginLeft: 'auto' }}>
                    <i className="bi bi-arrow-right" style={{ color: '#475569', fontSize: 14 }} />
                  </span>
                </div>
                <p style={{
                  fontSize: 12, color: '#64748b',
                  margin: 0, lineHeight: 1.5,
                }}>{d.aciklama}</p>
              </div>

              {/* Renk çizgisi */}
              <div style={{
                height: 3, borderRadius: 2,
                background: `linear-gradient(90deg, ${d.renk1}, ${d.renk2})`,
              }} />
            </div>
          </Link>
        ))}
      </div>

      <p style={{ marginTop: 32, fontSize: 12, color: '#334155' }}>
        <Link to="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Uygulamaya dön
        </Link>
      </p>
    </div>
  )
}
