import React from 'react';
import { ArrowLeft, Gamepad2, Tv } from 'lucide-react';

interface ComingSoonViewProps {
  mode: 'nobar' | 'game';
  onBack: () => void;
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({ mode, onBack }) => {
  const isNobar = mode === 'nobar';
  const title = isNobar ? 'NOBAR' : 'GAME';
  const subtitle = isNobar ? 'Nonton Bareng' : 'Main Bareng';
  const buttonLabel = isNobar
    ? 'Nanti Bisa Nonton Bareng Disini'
    : 'Nanti Bisa Main Game Disini';

  const glowColor = isNobar ? 'rgba(250, 204, 21, 0.85)' : 'rgba(168, 85, 247, 0.9)';
  const softGlowBg = isNobar ? 'rgba(250, 204, 21, 0.22)' : 'rgba(168, 85, 247, 0.28)';
  const iconColor = isNobar ? '#FACC15' : '#C084FC';
  const titleGlow = isNobar
    ? '0 0 14px rgba(250, 204, 21, 0.85), 0 0 28px rgba(249, 115, 22, 0.45)'
    : '0 0 16px rgba(168, 85, 247, 0.95), 0 0 32px rgba(139, 92, 246, 0.55)';

  return (
    <div className="w-full min-h-[calc(100dvh-102px)] flex flex-col pb-20">
      {/* Sub-header with Back to Home & Title + Subtitle */}
      <div
        className="px-3 py-2.5 border-b flex items-center gap-2.5"
        style={{ borderColor: 'var(--nz-border)', background: 'var(--nz-header-bg)' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="min-w-[38px] min-h-[38px] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ color: 'var(--nz-text)' }}
          aria-label="Kembali ke Home"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        </button>

        <div className="leading-tight">
          <h1
            className="font-brand text-[17px] font-extrabold uppercase tracking-tight"
            style={{ color: 'var(--nz-text)' }}
          >
            {title}
          </h1>
          <p className="text-[11.5px] font-medium" style={{ color: 'var(--nz-text-muted)' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Centered Big Coming Soon Card */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div
          className="relative w-full max-w-[380px] rounded-3xl border px-6 py-10 flex flex-col items-center text-center overflow-hidden shadow-2xl"
          style={{
            background: 'var(--nz-card)',
            borderColor: 'var(--nz-border)',
          }}
        >
          {/* Ambient Glow Backdrop */}
          <div
            aria-hidden="true"
            className="absolute -top-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{
              background: softGlowBg,
              animation: 'pulse-glow 2.6s ease-in-out infinite',
            }}
          />

          {/* Large Glowing Icon */}
          <div className="relative mb-5 flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full blur-xl scale-125"
              style={{
                background: softGlowBg,
                animation: 'pulse-glow 2.2s ease-in-out infinite',
              }}
            />
            <div
              className="relative w-24 h-24 rounded-3xl border flex items-center justify-center"
              style={{
                background: 'var(--nz-elevated)',
                borderColor: 'var(--nz-border)',
                boxShadow: `0 0 26px ${softGlowBg}`,
              }}
            >
              {isNobar ? (
                <Tv
                  className="w-12 h-12"
                  strokeWidth={1.75}
                  style={{
                    color: iconColor,
                    filter: `drop-shadow(0 0 12px ${glowColor})`,
                  }}
                />
              ) : (
                <Gamepad2
                  className="w-12 h-12"
                  strokeWidth={1.75}
                  style={{
                    color: iconColor,
                    filter: `drop-shadow(0 0 14px ${glowColor})`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Big Bold Glowing COMING SOON */}
          <h2
            className="relative font-brand text-[30px] font-extrabold uppercase tracking-wide leading-none"
            style={{
              color: 'var(--nz-text)',
              textShadow: titleGlow,
            }}
          >
            COMING SOON
          </h2>

          {/* Exact Lowercase Text */}
          <p
            className="relative mt-3 text-[13.5px] font-medium"
            style={{ color: 'var(--nz-text-muted)' }}
          >
            masi proses pembuatan oleh faiz
          </p>

          {/* Animated Loading Dots "..." */}
          <div
            aria-label="Sedang dalam proses"
            className="relative mt-4 flex items-center justify-center gap-1.5 h-5"
          >
            {[0, 1, 2].map((dotIdx) => (
              <span
                key={dotIdx}
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{
                  backgroundColor: iconColor,
                  boxShadow: `0 0 8px ${glowColor}`,
                  animation: 'dot-pulse 1.2s ease-in-out infinite',
                  animationDelay: `${dotIdx * 0.2}s`,
                }}
              />
            ))}
          </div>

          {/* Disabled Grey Button */}
          <button
            type="button"
            disabled
            className="relative mt-7 w-full h-11 px-4 rounded-2xl bg-[#6B7280]/25 border border-[#6B7280]/35 text-[#9CA3AF] text-[12.5px] font-semibold cursor-not-allowed select-none"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
