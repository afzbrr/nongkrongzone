import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'sm' }) => {
  const textSize = size === 'md' ? 'text-[18px]' : 'text-[15.5px]';

  return (
    <span
      className={`font-brand font-extrabold italic uppercase tracking-tight inline-flex items-baseline gap-1.5 select-none leading-none ${textSize}`}
      style={{ transform: 'skewX(-6deg)' }}
    >
      <span style={{ color: 'var(--nz-brand-nongkrong)' }}>NONGKRONG</span>
      <span className="relative inline-flex items-baseline">
        <span
          style={{
            color: 'var(--nz-brand-zone)',
            textShadow: 'var(--nz-brand-zone-glow)',
          }}
        >
          ZONE.
        </span>
        <span
          aria-hidden="true"
          className="absolute left-0 right-1 -bottom-1 h-[2.5px] rounded-full"
          style={{
            background: 'var(--nz-brand-zone)',
            boxShadow: 'var(--nz-brand-zone-glow)',
          }}
        />
      </span>
    </span>
  );
};
