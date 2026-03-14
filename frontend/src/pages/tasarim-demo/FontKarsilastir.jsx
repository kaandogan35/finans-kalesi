/**
 * FontKarsilastir — Inter'e yakın sans-serif fontları yan yana karşılaştırma
 * Kullanım: /tasarim-demo/font-karsilastir rotasına git
 */
export default function FontKarsilastir() {
  const ornekTutarlar = [
    '₺1.234.567,89',
    '₺89.450,00',
    '₺3.750,25',
    '-₺456.123,50',
  ]

  const fontlar = [
    { no: 1,  ad: 'Inter',            family: "'Inter', sans-serif" },
    { no: 2,  ad: 'DM Sans',          family: "'DM Sans', sans-serif" },
    { no: 3,  ad: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
    { no: 4,  ad: 'Manrope',          family: "'Manrope', sans-serif" },
    { no: 5,  ad: 'Nunito Sans',      family: "'Nunito Sans', sans-serif" },
    { no: 6,  ad: 'Work Sans',        family: "'Work Sans', sans-serif" },
    { no: 7,  ad: 'Lexend',           family: "'Lexend', sans-serif" },
    { no: 8,  ad: 'Sora',             family: "'Sora', sans-serif" },
    { no: 9,  ad: 'Figtree',          family: "'Figtree', sans-serif" },
    { no: 10, ad: 'Geist Sans (system-ui)', family: "system-ui, -apple-system, sans-serif" },
  ]

  return (
    <div style={{ padding: 32 }}>
      {/* Google Fonts — 10 fontu aynı anda yükle */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&family=Lexend:wght@400;500;600;700&family=Sora:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
        Inter'e Yakın Sans-Serif Font Karşılaştırma
      </h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
        Finansal rakamlar için — beğendiğinin numarasını söyle, hemen uygulayayım.
      </p>

      <div style={{ display: 'grid', gap: 20 }}>
        {fontlar.map((f) => (
          <div
            key={f.ad}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '20px 24px',
            }}
          >
            <div style={{
              fontSize: 12, fontWeight: 700, color: '#f59e0b',
              textTransform: 'uppercase', letterSpacing: 1,
              marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{
                background: 'rgba(245,158,11,0.15)',
                borderRadius: 8, width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800,
              }}>
                {f.no}
              </span>
              {f.ad}
            </div>

            {/* KPI boyutunda (26px) */}
            <div style={{
              fontFamily: f.family,
              fontSize: 26,
              fontWeight: 600,
              color: '#10b981',
              textShadow: '0 0 20px rgba(16,185,129,0.3)',
              marginBottom: 12,
              fontVariantNumeric: 'tabular-nums',
            }}>
              ₺1.234.567,89
            </div>

            {/* Liste boyutunda (13-15px) */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {ornekTutarlar.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: f.family,
                    fontSize: 14,
                    fontWeight: 500,
                    color: t.startsWith('-') ? '#ef4444' : 'rgba(255,255,255,0.85)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
