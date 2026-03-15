import React, { useState } from 'react';
import Tema1Lime from './Tema1Lime';
import Tema2Ocean from './Tema2Ocean';
import Tema3Rose from './Tema3Rose';
import Tema4Sage from './Tema4Sage';
import Tema5Violet from './Tema5Violet';

const TEMALAR = [
  { id: 1, ad: 'Lime Corporate', renk: '#b0d12a', bg: '#ececed', tip: 'Açık' },
  { id: 2, ad: 'Ocean Mist', renk: '#0ea5e9', bg: '#f0f9ff', tip: 'Açık' },
  { id: 3, ad: 'Rose Quartz', renk: '#e11d48', bg: '#fff1f2', tip: 'Açık' },
  { id: 4, ad: 'Sage Garden', renk: '#059669', bg: '#f0fdf4', tip: 'Açık' },
  { id: 5, ad: 'Midnight Violet', renk: '#8b5cf6', bg: '#0c0a1d', tip: 'Koyu' },
];

export default function TemaDemo() {
  const [aktifTema, setAktifTema] = useState(1);

  const renderTema = () => {
    switch (aktifTema) {
      case 1: return <Tema1Lime />;
      case 2: return <Tema2Ocean />;
      case 3: return <Tema3Rose />;
      case 4: return <Tema4Sage />;
      case 5: return <Tema5Violet />;
      default: return <Tema1Lime />;
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Tema Seçici Bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 9999,
        background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
      }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: "'Outfit', sans-serif", marginRight: 8 }}>
          <i className="bi bi-palette me-2" />TEMA DEMO
        </span>
        {TEMALAR.map(t => (
          <button
            key={t.id}
            onClick={() => setAktifTema(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 10, border: 'none',
              cursor: 'pointer', transition: 'all 0.2s',
              background: aktifTema === t.id ? t.renk : 'rgba(255,255,255,0.06)',
              color: aktifTema === t.id
                ? (t.tip === 'Koyu' ? '#fff' : (t.id === 1 ? '#000' : '#fff'))
                : 'rgba(255,255,255,0.6)',
              fontWeight: 700, fontSize: 13, fontFamily: "'Outfit', sans-serif",
              boxShadow: aktifTema === t.id ? `0 2px 12px ${t.renk}40` : 'none',
            }}
          >
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              background: t.renk, border: '2px solid rgba(255,255,255,0.3)',
              flexShrink: 0
            }} />
            {t.ad}
            <span style={{
              fontSize: 10, opacity: 0.7,
              background: 'rgba(0,0,0,0.2)', borderRadius: 4,
              padding: '1px 6px'
            }}>{t.tip}</span>
          </button>
        ))}
      </div>

      {/* Aktif Tema */}
      {renderTema()}
    </div>
  );
}
