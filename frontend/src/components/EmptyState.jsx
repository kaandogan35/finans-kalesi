/**
 * EmptyState.jsx — Ortak boş durum bileşeni
 * Tüm sayfalarda tutarlı boş veri gösterimi
 */

export default function EmptyState({ ikon = 'bi-bar-chart-line', baslik, aciklama, aksiyon }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: 12,
      textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'var(--p-bg-badge-success)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
      }}>
        <i className={`bi ${ikon}`} style={{ fontSize: 24, color: 'var(--p-color-primary)' }} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--p-text-primary)', margin: 0 }}>{baslik}</p>
      {aciklama && (
        <p style={{ fontSize: 13, color: 'var(--p-text-muted)', margin: 0, maxWidth: 280 }}>{aciklama}</p>
      )}
      {aksiyon && (
        <button
          className="p-cym-btn-outline"
          style={{ marginTop: 8, fontSize: 13, padding: '8px 20px' }}
          onClick={aksiyon.onClick}
        >
          {aksiyon.label}
        </button>
      )}
    </div>
  )
}
