import React from 'react';

interface SplashScreenProps {
  fadingOut: boolean;
}

const NONGKRONG_CHARS = 'NONGKRONG'.split('');
const ZONE_CHARS = 'ZONE'.split('');

const CoffeeSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#FACC15"
      d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8zm12 1h2a2.5 2.5 0 0 1 0 5h-2v-2h2a.5.5 0 0 0 0-1h-2V9z"
    />
    <path
      d="M7 3c0 1.2 1 1.8 1 3M11 2.5c0 1.2 1 1.8 1 3M14.5 3.5c0 1 1 1.6 1 2.5"
      stroke="#FF9F0A"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const StarSparkSvg: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-4 h-4',
  color = '#FACC15',
}) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
    <path fill={color} d="M8 0l1.9 5.6L16 8l-6.1 2.4L8 16l-1.9-5.6L0 8l6.1-2.4z" />
  </svg>
);

const FlameSparkSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-5' }) => (
  <svg viewBox="0 0 16 20" className={className} aria-hidden="true">
    <path
      fill="#FF9F0A"
      d="M8 1c2.5 3 5 5.8 5 9.5A5 5 0 0 1 3 10.5C3 7.5 5 5.2 6.5 3.5c.3 1.4 1 2.2 1.8 2.5C7.6 4.2 7.5 2.5 8 1z"
    />
    <path fill="#FEF08A" d="M8 9.5c1.2 1.4 2 2.4 2 3.8a2 2 0 1 1-4 0c0-1.3.8-2.4 2-3.8z" />
  </svg>
);

export const SplashScreen: React.FC<SplashScreenProps> = ({ fadingOut }) => {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'var(--nz-bg)',
        color: 'var(--nz-text)',
      }}
    >
      {/* Blurred Blinking City / Cafe Lights Background */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <span
          className="absolute top-[14%] left-[12%] w-36 h-36 rounded-full bg-[#FACC15]/25 blur-3xl"
          style={{ animation: 'city-light-blink 2.2s ease-in-out infinite' }}
        />
        <span
          className="absolute top-[22%] right-[10%] w-40 h-40 rounded-full bg-[#FF9F0A]/20 blur-3xl"
          style={{ animation: 'city-light-blink 2.8s ease-in-out infinite', animationDelay: '0.6s' }}
        />
        <span
          className="absolute bottom-[18%] left-[18%] w-44 h-44 rounded-full bg-[#8B5CF6]/25 blur-3xl"
          style={{ animation: 'city-light-blink 2.5s ease-in-out infinite', animationDelay: '1.1s' }}
        />
        <span
          className="absolute bottom-[14%] right-[14%] w-36 h-36 rounded-full bg-[#38BDF8]/20 blur-3xl"
          style={{ animation: 'city-light-blink 2.4s ease-in-out infinite', animationDelay: '0.3s' }}
        />
      </div>

      {/* Center Content */}
      <div className="relative z-10 w-full max-w-[420px] px-6 flex flex-col items-center text-center">
        {/* Floating Coffee / Star / Flame Particles Around Logo */}
        <div aria-hidden="true" className="relative w-full h-14 pointer-events-none">
          <div
            className="absolute left-[10%] top-2"
            style={{ animation: 'splash-particle 2s ease-in-out infinite' }}
          >
            <CoffeeSvg className="w-6 h-6 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
          </div>
          <div
            className="absolute left-[32%] top-0"
            style={{ animation: 'splash-particle 1.7s ease-in-out infinite', animationDelay: '0.3s' }}
          >
            <StarSparkSvg className="w-4 h-4 drop-shadow-[0_0_6px_#FACC15]" color="#FACC15" />
          </div>
          <div
            className="absolute right-[30%] top-1"
            style={{ animation: 'splash-particle 1.9s ease-in-out infinite', animationDelay: '0.7s' }}
          >
            <FlameSparkSvg className="w-4 h-5 drop-shadow-[0_0_8px_#FF9F0A]" />
          </div>
          <div
            className="absolute right-[10%] top-3"
            style={{ animation: 'splash-particle 2.1s ease-in-out infinite', animationDelay: '0.45s' }}
          >
            <StarSparkSvg className="w-5 h-5 drop-shadow-[0_0_8px_#FF9F0A]" color="#FF9F0A" />
          </div>
        </div>

        {/* Big Animated NONGKRONG ZONE Letters (Pop one-by-one from bottom) */}
        <div
          className="font-brand font-extrabold italic uppercase tracking-tight leading-none flex flex-col items-center gap-1 select-none"
          style={{ transform: 'skewX(-6deg)' }}
        >
          <div className="flex items-center justify-center gap-[1px] text-[34px] sm:text-[38px]">
            {NONGKRONG_CHARS.map((ch, idx) => (
              <span
                key={`n-${idx}`}
                className="inline-block"
                style={{
                  color: 'var(--nz-brand-nongkrong)',
                  animation: 'letter-pop 0.48s cubic-bezier(0.16, 1, 0.3, 1) both',
                  animationDelay: `${idx * 45}ms`,
                }}
              >
                {ch}
              </span>
            ))}
          </div>

          <div className="relative flex items-center justify-center gap-1 text-[42px] sm:text-[46px]">
            {ZONE_CHARS.map((ch, idx) => (
              <span
                key={`z-${idx}`}
                className="inline-block bg-gradient-to-b from-[#FEF08A] via-[#FACC15] to-[#F97316] bg-clip-text text-transparent"
                style={{
                  filter: 'drop-shadow(0 0 14px rgba(250, 204, 21, 0.85))',
                  animation: 'letter-pop 0.52s cubic-bezier(0.16, 1, 0.3, 1) both',
                  animationDelay: `${(NONGKRONG_CHARS.length + idx) * 55}ms`,
                }}
              >
                {ch}
              </span>
            ))}
          </div>
        </div>

        {/* Floating Lower Particles */}
        <div aria-hidden="true" className="relative w-full h-7 pointer-events-none">
          <div
            className="absolute left-[18%] top-2"
            style={{ animation: 'splash-particle 1.8s ease-in-out infinite', animationDelay: '0.5s' }}
          >
            <FlameSparkSvg className="w-3.5 h-4 drop-shadow-[0_0_6px_#FF9F0A]" />
          </div>
          <div
            className="absolute right-[18%] top-1"
            style={{ animation: 'splash-particle 2.2s ease-in-out infinite', animationDelay: '0.2s' }}
          >
            <CoffeeSvg className="w-5 h-5 drop-shadow-[0_0_6px_#FACC15]" />
          </div>
        </div>

        {/* Yellow Loading Bar 0% -> 100% */}
        <div
          className="mt-2 w-56 h-2 rounded-full overflow-hidden border"
          style={{
            background: 'var(--nz-elevated)',
            borderColor: 'var(--nz-border)',
          }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FACC15] via-[#FF9F0A] to-[#FEF08A]"
            style={{
              boxShadow: '0 0 12px rgba(250, 204, 21, 0.9)',
              animation: 'loading-bar-fill 2.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}
          />
        </div>

        <p
          className="mt-3 text-[12.5px] font-medium tracking-wide"
          style={{ color: 'var(--nz-text-muted)' }}
        >
          Lagi nyiapin tempat nongkrong lo...
        </p>
      </div>
    </div>
  );
};
