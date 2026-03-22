import React from 'react';

/**
 * ParamGo Logo - Konsept 02: P Harfi + İleri Ok
 * Renk Paleti: #10B981 (Primary), #059669 (Deep), #34D399 (Light)
 * 
 * Kullanım:
 *   <ParamGoLogo />                         → Tam logo (ikon + yazı), açık zemin
 *   <ParamGoLogo variant="dark" />           → Koyu zemin versiyonu
 *   <ParamGoLogo variant="icon" />           → Sadece ikon (mobil/favicon)
 *   <ParamGoLogo variant="icon-dark" />      → Koyu zemin ikon
 *   <ParamGoLogo variant="white" />          → Tamamen beyaz (koyu arka plan overlay)
 *   <ParamGoLogo size="sm" />                → Küçük (sidebar vb.)
 *   <ParamGoLogo size="lg" />                → Büyük (login ekranı vb.)
 */

const sizes = {
  xs: { icon: 28, fontSize: 16, gap: 6 },
  sm: { icon: 32, fontSize: 18, gap: 8 },
  md: { icon: 40, fontSize: 24, gap: 10 },
  lg: { icon: 52, fontSize: 32, gap: 14 },
  xl: { icon: 64, fontSize: 40, gap: 16 },
};

// Sadece ikon SVG
const LogoIcon = ({ size = 40, variant = 'light' }) => {
  const isWhite = variant === 'white' || variant === 'icon-white';
  const bgFill = isWhite ? '#FFFFFF' : 'url(#paramgo-gradient)';
  const fgColor = isWhite ? '#10B981' : '#FFFFFF';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ParamGo Logo"
    >
      <defs>
        <linearGradient id="paramgo-gradient" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="120" height="120" rx="28" fill={bgFill} />
      {/* P harfi */}
      <path
        d="M38 88V36H62C70.837 36 78 43.163 78 52C78 60.837 70.837 68 62 68H38"
        stroke={fgColor}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* İleri ok (Go sembolü) */}
      <path
        d="M68 62L82 48M82 48L68 34M82 48H56"
        stroke={fgColor}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
};

// Tam logo (ikon + yazı)
const ParamGoLogo = ({ variant = 'light', size = 'md', className = '' }) => {
  const s = sizes[size] || sizes.md;
  const isIcon = variant === 'icon' || variant === 'icon-dark' || variant === 'icon-white';

  if (isIcon) {
    return (
      <div className={className} style={{ display: 'inline-flex' }}>
        <LogoIcon size={s.icon} variant={variant} />
      </div>
    );
  }

  const isDark = variant === 'dark';
  const isWhite = variant === 'white';
  const textColor = isWhite ? '#FFFFFF' : isDark ? '#F8FAFB' : '#1A1A1A';
  const goColor = isWhite ? '#FFFFFF' : '#10B981';

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${s.gap}px`,
      }}
    >
      <LogoIcon size={s.icon} variant={isWhite ? 'white' : 'light'} />
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', 'Sora', sans-serif",
          fontWeight: 800,
          fontSize: `${s.fontSize}px`,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: textColor,
        }}
      >
        Param
        <span style={{ color: goColor, fontWeight: 700 }}>Go</span>
      </span>
    </div>
  );
};

// Favicon için minimal SVG (16x16 / 32x32)
export const ParamGoFavicon = () => (
  <svg width="32" height="32" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fav-grad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="28" fill="url(#fav-grad)" />
    <path d="M38 88V36H62C70.837 36 78 43.163 78 52C78 60.837 70.837 68 62 68H38" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M68 62L82 48M82 48L68 34M82 48H56" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
  </svg>
);

export { LogoIcon };
export default ParamGoLogo;
