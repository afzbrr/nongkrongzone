import React from 'react';
import { Coins, Crown } from 'lucide-react';
import { formatNumber } from '../utils/format';

export const OwnerBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <span
    className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[#FFD60A] border border-[#D4AF37]/60 bg-[#D4AF37]/15 rounded-[5px] shrink-0 ${
      compact ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5'
    }`}
    style={{ boxShadow: '0 0 8px rgba(255, 214, 10, 0.28)' }}
  >
    <Crown
      className={compact ? 'w-2.5 h-2.5 text-[#FFD60A]' : 'w-3 h-3 text-[#FFD60A]'}
      strokeWidth={2.2}
      style={{ filter: 'drop-shadow(0 0 4px rgba(255, 214, 10, 0.85))' }}
    />
    <span>OWNER</span>
  </span>
);

export const CoinDisplay: React.FC<{
  coins?: number | null;
  isOwner?: boolean;
  className?: string;
  iconSize?: 'sm' | 'md';
}> = ({ coins, isOwner, className = '', iconSize = 'md' }) => {
  const iconCls = iconSize === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (isOwner) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold text-[#FFD60A] ${className}`}
        style={{ textShadow: '0 0 10px rgba(255, 214, 10, 0.85)' }}
      >
        <Coins
          className={`${iconCls} text-[#FFD60A] shrink-0`}
          strokeWidth={1.75}
          style={{ filter: 'drop-shadow(0 0 5px rgba(255, 214, 10, 0.85))' }}
        />
        <span className="text-[1.05em] leading-none">∞</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 tabular-nums text-[#FACC15] font-medium ${className}`}>
      <Coins className={`${iconCls} text-[#FACC15] shrink-0`} strokeWidth={1.6} />
      <span>{formatNumber(coins)} Coin</span>
    </span>
  );
};
