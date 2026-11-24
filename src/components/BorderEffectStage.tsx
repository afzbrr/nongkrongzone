import React from 'react';
import type { ResolvedBorderVisual } from '../utils/borderStyles';

interface BorderEffectStageProps {
  visual: ResolvedBorderVisual;
  paused?: boolean;
  children: React.ReactNode;
}

const PARTICLE_SLOTS = Array.from({ length: 16 }, (_, idx) => ({
  idx,
  left: `${6 + ((idx * 19 + 7) % 88)}%`,
  top: `${4 + ((idx * 23 + 11) % 84)}%`,
  delay: `${((idx * 0.27) % 2.1).toFixed(2)}s`,
  dur: `${(1.6 + ((idx * 0.19) % 1.4)).toFixed(2)}s`,
  size: 4 + (idx % 4) * 1.5,
}));

const StarSvg: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-2.5 h-2.5',
  color = '#FFD60A',
}) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
    <path fill={color} d="M8 0l1.9 5.6L16 8l-6.1 2.4L8 16l-1.9-5.6L0 8l6.1-2.4z" />
  </svg>
);

const HeartSvg: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-3 h-3',
  color = '#FF375F',
}) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
    <path
      fill={color}
      d="M8 14.2S1.5 10 1.5 5.3A3.5 3.5 0 0 1 8 3.3a3.5 3.5 0 0 1 6.5 2C14.5 10 8 14.2 8 14.2z"
    />
  </svg>
);

const DiamondSvg: React.FC<{ className?: string; color?: string; stroke?: string }> = ({
  className = 'w-6 h-6',
  color = '#38BDF8',
  stroke = '#0284C7',
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <polygon points="12,2 22,9 12,22 2,9" fill={color} stroke={stroke} strokeWidth="1.2" />
    <polygon points="12,2 17,9 12,22 7,9" fill="#FFFFFF" fillOpacity="0.6" />
    <line x1="2" y1="9" x2="22" y2="9" stroke="#E0F2FE" strokeWidth="1" />
  </svg>
);

const FootprintSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <ellipse cx="10" cy="14" rx="4.2" ry="6.2" fill="#71717A" stroke="#D4D4D8" strokeWidth="1" />
    <circle cx="6.5" cy="6" r="1.4" fill="#71717A" />
    <circle cx="9.6" cy="4.8" r="1.5" fill="#71717A" />
    <circle cx="12.8" cy="5.5" r="1.4" fill="#71717A" />
    <circle cx="15.2" cy="7.4" r="1.2" fill="#71717A" />
  </svg>
);

const GamepadSvg: React.FC<{ className?: string }> = ({ className = 'w-8 h-6' }) => (
  <svg viewBox="0 0 36 24" className={className} aria-hidden="true">
    <path
      fill="#15803D"
      stroke="#86EFAC"
      strokeWidth="1.4"
      d="M8 5h20a6 6 0 0 1 6 6l-1.5 7.5a3 3 0 0 1-5.2 1.4L24 16H12l-3.3 3.9a3 3 0 0 1-5.2-1.4L2 11a6 6 0 0 1 6-6z"
    />
    <rect x="7" y="9" width="6" height="2" rx="1" fill="#DCFCE7" />
    <rect x="9" y="7" width="2" height="6" rx="1" fill="#DCFCE7" />
    <circle cx="24" cy="9" r="1.5" fill="#FFD60A" />
    <circle cx="27" cy="11.5" r="1.5" fill="#FF453A" />
    <circle cx="22" cy="12" r="1.5" fill="#38BDF8" />
  </svg>
);

const CheeringFistSvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
    <path
      fill="#FF9F0A"
      stroke="#9A3412"
      strokeWidth="1.3"
      d="M8 13V8a2 2 0 0 1 4 0v4h1V7a2 2 0 0 1 4 0v5h1V8.5a2 2 0 0 1 4 0V16a6 6 0 0 1-6 6h-3a5 5 0 0 1-5-5v-4z"
    />
    <path fill="#FEF08A" d="M7 14h10v3H7z" opacity="0.55" />
  </svg>
);

const ChainLinkSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect
      x="3"
      y="8"
      width="10"
      height="6"
      rx="3"
      fill="none"
      stroke="#0A84FF"
      strokeWidth="2.4"
      transform="rotate(-25 8 11)"
    />
    <rect
      x="11"
      y="10"
      width="10"
      height="6"
      rx="3"
      fill="none"
      stroke="#64D2FF"
      strokeWidth="2.4"
      transform="rotate(-25 16 13)"
    />
  </svg>
);

const CrescentMoonSvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#FFD60A"
      stroke="#B45309"
      strokeWidth="1"
      d="M15 3a9 9 0 1 0 6 15.7A7.2 7.2 0 0 1 15 3z"
    />
    <path fill="#F59E0B" d="M18.5 6l.7 1.8L21 8.5l-1.8.7-.7 1.8-.7-1.8L16 8.5l1.8-.7z" />
  </svg>
);

const ChristmasTreeSvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-8' }) => (
  <svg viewBox="0 0 26 30" className={className} aria-hidden="true">
    <rect x="11" y="23" width="4" height="5" fill="#78350F" />
    <polygon points="13,2 21,12 5,12" fill="#16A34A" />
    <polygon points="13,8 23,18 3,18" fill="#15803D" />
    <polygon points="13,14 25,24 1,24" fill="#166534" />
    <circle cx="13" cy="2.5" r="2" fill="#FFD60A" />
    <circle cx="10" cy="11" r="1.4" fill="#FF453A" />
    <circle cx="16" cy="15" r="1.4" fill="#FFD60A" />
    <circle cx="9" cy="20" r="1.4" fill="#38BDF8" />
    <circle cx="17" cy="21" r="1.4" fill="#FF453A" />
  </svg>
);

const PumpkinSvg: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 28 26" className={className} aria-hidden="true">
    <path fill="#16A34A" d="M12.5 2h3v4h-3z" />
    <ellipse cx="14" cy="15.5" rx="10.5" ry="7.8" fill="#FF9F0A" stroke="#9A3412" strokeWidth="1.2" />
    <ellipse cx="14" cy="15.5" rx="5" ry="7.8" fill="#EA580C" fillOpacity="0.42" />
    <polygon points="8.5,13 12,13 10.2,15.8" fill="#FEF08A" />
    <polygon points="16,13 19.5,13 17.8,15.8" fill="#FEF08A" />
    <path d="M9 18.5q5 2.8 10 0" stroke="#1F102E" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </svg>
);

const BatSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-4' }) => (
  <svg viewBox="0 0 24 14" className={className} aria-hidden="true">
    <path
      fill="#3B0764"
      stroke="#A855F7"
      strokeWidth="0.9"
      d="M12 10c-2 0-3-2-4-2s-4 2-7 1c2-4 5-6 8-5l1.5-2L12 4l1.5-2L15 4c3-1 6 1 8 5-3 1-6-1-7-1s-2 2-4 2z"
    />
  </svg>
);

const CupidArrowSvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-5' }) => (
  <svg viewBox="0 0 28 16" className={className} aria-hidden="true">
    <line x1="3" y1="8" x2="22" y2="8" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" />
    <polygon points="21,4 27,8 21,12" fill="#FF375F" />
    <path fill="#FDA4AF" d="M2 5l4 3-4 3 1.5-3z" />
  </svg>
);

const LollipopSvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-8' }) => (
  <svg viewBox="0 0 24 30" className={className} aria-hidden="true">
    <rect x="11" y="16" width="2.2" height="12" rx="1" fill="#CBD5E1" />
    <circle cx="12" cy="10" r="8" fill="#F472B6" stroke="#FFFFFF" strokeWidth="1.4" />
    <path
      d="M12 10a2 2 0 0 1 2 2 4 4 0 0 1-4-4 6 6 0 0 1 6 6"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const CloudSvg: React.FC<{ className?: string }> = ({ className = 'w-8 h-6' }) => (
  <svg viewBox="0 0 28 18" className={className} aria-hidden="true">
    <path
      fill="#EDE9FE"
      stroke="#A855F7"
      strokeWidth="1.3"
      d="M7 15h14a4 4 0 0 0 .5-7.96A5.5 5.5 0 0 0 10.5 5 4.2 4.2 0 0 0 7 15z"
    />
  </svg>
);

const RocketSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#0A84FF" stroke="#FFFFFF" strokeWidth="0.9" d="M12 2c3.8 3.6 5 8.4 5 13l-5-2.5L7 15c0-4.6 1.2-9.4 5-13z" />
    <circle cx="12" cy="10" r="2" fill="#E0F2FE" />
    <path fill="#FF9F0A" d="M9.5 15.5h5L12 21.5z" />
  </svg>
);

const LightningSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 20 24" className={className} aria-hidden="true">
    <polygon
      points="11,1 3,13 10,13 8,23 18,10 11,10"
      fill="#00F0FF"
      stroke="#FFFFFF"
      strokeWidth="0.9"
    />
  </svg>
);

const TrophySvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#FFD60A"
      stroke="#92400E"
      strokeWidth="1.2"
      d="M6 4h12v5a6 6 0 0 1-12 0V4zm-3 1h3v4a2.5 2.5 0 0 1-3-2.5V5zm18 0h-3v4a2.5 2.5 0 0 0 3-2.5V5zM10 15h4v4h-4zm-3 4h10v2.5H7z"
    />
  </svg>
);

const SwordSvg: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <polygon points="19,2 21,4 11,15 9,13" fill="#FEF08A" stroke="#D97706" strokeWidth="1" />
    <line x1="6" y1="12" x2="12" y2="18" stroke="#B45309" strokeWidth="2.4" strokeLinecap="round" />
    <line x1="5" y1="19" x2="9" y2="15" stroke="#78350F" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

const BalloonSvg: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-7',
  color = '#DC2626',
}) => (
  <svg viewBox="0 0 20 28" className={className} aria-hidden="true">
    <ellipse cx="10" cy="9.5" rx="7" ry="8.5" fill={color} stroke="#CBD5E1" strokeWidth="0.8" />
    <ellipse cx="7.5" cy="6.5" rx="1.8" ry="2.8" fill="#FFFFFF" fillOpacity="0.45" />
    <path d="M10 18v8" stroke="#9CA3AF" strokeWidth="1" />
  </svg>
);

const ThrEnvelopeSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-4' }) => (
  <svg viewBox="0 0 20 14" className={className} aria-hidden="true">
    <rect x="1" y="1" width="18" height="12" rx="2" fill="#16A34A" stroke="#FFD60A" strokeWidth="1" />
    <path d="M1 2l9 6 9-6" fill="none" stroke="#FEF08A" strokeWidth="1.2" />
  </svg>
);

const MoneyBillSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-4' }) => (
  <svg viewBox="0 0 24 14" className={className} aria-hidden="true">
    <rect x="1" y="1" width="22" height="12" rx="2" fill="#22C55E" stroke="#14532D" strokeWidth="1" />
    <circle cx="12" cy="7" r="3" fill="#DCFCE7" />
  </svg>
);

const BorderEffectStageComponent: React.FC<BorderEffectStageProps> = ({
  visual,
  paused = false,
  children,
}) => {
  const k = visual.effectKey;

  return (
    <div className="relative w-full h-[124px] flex items-center justify-center overflow-visible">
      {/* AVATAR + 3-LAYER RING */}
      <div className="relative z-10 flex items-center justify-center">{children}</div>

      {/* FOREGROUND DEPTH LAYER: Particles + Named Mascots (rendered only when near/in viewport) */}
      {!paused && (
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-30 overflow-visible"
      >
        {/* 1. FAIZ GANTENG: Radial Golden Rays + 16 Dense Falling Gold & Purple Particles */}
        {k === 'faiz_owner' && (
          <>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full opacity-55 nz-spin-6s"
              style={{
                background:
                  'conic-gradient(from 0deg, rgba(255,214,10,0.65) 0deg 20deg, transparent 20deg 45deg, rgba(139,92,246,0.55) 45deg 65deg, transparent 65deg 90deg, rgba(255,214,10,0.65) 90deg 110deg, transparent 110deg 135deg, rgba(139,92,246,0.55) 135deg 155deg, transparent 155deg 180deg, rgba(255,214,10,0.65) 180deg 200deg, transparent 200deg 225deg, rgba(139,92,246,0.55) 225deg 245deg, transparent 245deg 270deg, rgba(255,214,10,0.65) 270deg 290deg, transparent 290deg 315deg, rgba(139,92,246,0.55) 315deg 335deg, transparent 335deg 360deg)',
                filter: 'blur(2px)',
              }}
            />
            {PARTICLE_SLOTS.map((p, idx) => (
              <span
                key={idx}
                className="absolute top-1 rounded-full"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  backgroundColor: idx % 2 === 0 ? '#FFD60A' : '#8B5CF6',
                  boxShadow: `0 0 8px ${idx % 2 === 0 ? '#FFD60A' : '#8B5CF6'}`,
                  animation: `fall ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 2. PEMULA: Rotating Footprints (>=24px) + 14 Popping Stars */}
        {k === 'pemula' && (
          <>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'orbit 4.5s linear infinite' }}
            >
              <FootprintSvg className="w-6 h-6 drop-shadow-[0_0_5px_#71717A]" />
            </div>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'orbit 4.5s linear infinite', animationDelay: '-2.25s' }}
            >
              <FootprintSvg className="w-6 h-6 drop-shadow-[0_0_5px_#71717A]" />
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: p.top,
                  left: p.left,
                  animation: `pop-star ${p.dur} ease-in-out infinite`,
                  animationDelay: p.delay,
                }}
              >
                <StarSvg className="w-2.5 h-2.5" color={idx % 2 === 0 ? '#71717A' : '#D4D4D8'} />
              </div>
            ))}
          </>
        )}

        {/* 3. RAJIN SUNKAT / NONGKRONG: 32px Gamepad + Wiggling Joystick + 14 Rising Game Coins */}
        {k === 'rajin_nongkrong' && (
          <>
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2"
              style={{ animation: 'float 1.8s ease-in-out infinite' }}
            >
              <GamepadSvg className="w-9 h-6 drop-shadow-[0_0_8px_#30D158]" />
            </div>
            <div
              className="absolute top-4 right-2"
              style={{ animation: 'wave 1.5s ease-in-out infinite' }}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-[0_0_5px_#16A34A]">
                <rect x="4" y="17" width="16" height="4" rx="2" fill="#15803D" />
                <line x1="12" y1="7" x2="12" y2="17" stroke="#86EFAC" strokeWidth="2.5" />
                <circle cx="12" cy="6" r="4" fill="#FF453A" stroke="#FFFFFF" strokeWidth="1" />
              </svg>
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-2 rounded-full border border-[#15803D]"
                style={{
                  left: p.left,
                  width: p.size + 1,
                  height: p.size + 1,
                  backgroundColor: idx % 2 === 0 ? '#FFD60A' : '#30D158',
                  boxShadow: `0 0 6px ${idx % 2 === 0 ? '#FFD60A' : '#30D158'}`,
                  animation: `float-up ${p.dur} ease-in infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 4. SEMANGAT BARA / SUNKAT: Waving Cheering Fist + Roaring Flames + 14 Orange Bursts */}
        {k === 'semangat_bara' && (
          <>
            <div
              className="absolute top-1 right-2"
              style={{ animation: 'wave 1.1s ease-in-out infinite' }}
            >
              <CheeringFistSvg className="w-7 h-7 drop-shadow-[0_0_8px_#FF9F0A]" />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-1">
              {[18, 24, 28, 24, 18].map((h, i) => (
                <span
                  key={i}
                  className="w-3 rounded-full bg-gradient-to-t from-[#FF453A] via-[#FF9F0A] to-[#FEF08A]"
                  style={{
                    height: `${h}px`,
                    animation: 'flicker 0.7s ease-in-out infinite',
                    animationDelay: `${i * 0.12}s`,
                    boxShadow: '0 0 8px #FF9F0A',
                  }}
                />
              ))}
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-3 rounded-full bg-[#FF9F0A]"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  boxShadow: '0 0 7px #FF453A',
                  animation: `float-up ${p.dur} ease-in infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 5. SETIA SUNKAT / NONGKRONG: Beating Blue Heart + Rotating Chain Links + 14 Blue Sparks */}
        {k === 'setia_nongkrong' && (
          <>
            <div
              className="absolute top-2 left-2.5"
              style={{ animation: 'heartbeat 1s ease-in-out infinite' }}
            >
              <HeartSvg className="w-7 h-7 drop-shadow-[0_0_8px_#0A84FF]" color="#0A84FF" />
            </div>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'orbit 4.5s linear infinite' }}
            >
              <ChainLinkSvg className="w-6 h-6 drop-shadow-[0_0_6px_#64D2FF]" />
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-2 rounded-full bg-[#38BDF8]"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  boxShadow: '0 0 6px #0A84FF',
                  animation: `float-up ${p.dur} ease-in infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 6. GARUDA NUSANTARA: 14 Blinking Gold Stars + Red-White Sparkle Rain */}
        {k === 'garuda_nusantara' && (
          <>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: p.top,
                  left: p.left,
                  animation: idx % 2 === 0 ? `twinkle ${p.dur} ease-in-out infinite` : `fall ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              >
                <StarSvg
                  className="w-3 h-3 drop-shadow-[0_0_4px_#F59E0B]"
                  color={idx % 3 === 0 ? '#DC2626' : '#F59E0B'}
                />
              </div>
            ))}
          </>
        )}

        {/* 7. LEBARAN: Crescent Moon & Star + 14 Falling Green THR Envelopes & Sparkles */}
        {k === 'lebaran' && (
          <>
            <div
              className="absolute top-1 right-2.5"
              style={{ animation: 'float 2.2s ease-in-out infinite' }}
            >
              <CrescentMoonSvg className="w-7 h-7 drop-shadow-[0_0_7px_#FFD60A]" />
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) =>
              idx % 3 === 0 ? (
                <div
                  key={idx}
                  className="absolute top-1"
                  style={{
                    left: p.left,
                    animation: `fall ${p.dur} linear infinite`,
                    animationDelay: p.delay,
                  }}
                >
                  <ThrEnvelopeSvg className="w-5 h-3.5 drop-shadow-[0_0_4px_#16A34A]" />
                </div>
              ) : (
                <div
                  key={idx}
                  className="absolute top-1"
                  style={{
                    left: p.left,
                    animation: `fall ${p.dur} linear infinite`,
                    animationDelay: p.delay,
                  }}
                >
                  <StarSvg className="w-2.5 h-2.5" color="#F59E0B" />
                </div>
              )
            )}
          </>
        )}

        {/* 8. TAHUN BARU: 6-Dot Bursting Fireworks + 14 Falling Gold Confetti */}
        {k === 'tahun_baru' && (
          <>
            {[
              { top: '6px', left: '10%', color: '#D97706', delay: '0s' },
              { top: '8px', left: '72%', color: '#0A84FF', delay: '0.9s' },
              { top: '76px', left: '14%', color: '#FF375F', delay: '0.45s' },
            ].map((fw, idx) => (
              <div
                key={idx}
                className="absolute w-7 h-7"
                style={{
                  top: fw.top,
                  left: fw.left,
                  animation: 'burst 2s ease-out infinite',
                  animationDelay: fw.delay,
                }}
              >
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const cx = 12 + Math.cos(rad) * 8;
                    const cy = 12 + Math.sin(rad) * 8;
                    return <circle key={deg} cx={cx} cy={cy} r="2.2" fill={fw.color} />;
                  })}
                </svg>
              </div>
            ))}
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute top-1 w-2.5 h-1.5 rounded-[1px]"
                style={{
                  left: p.left,
                  backgroundColor: idx % 3 === 0 ? '#F59E0B' : idx % 3 === 1 ? '#FF375F' : '#0A84FF',
                  animation: `fall ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 9. NATAL: 30px Blinking Christmas Tree + 14 Falling Snowflakes */}
        {k === 'natal' && (
          <>
            <div
              className="absolute top-1 right-2"
              style={{ animation: 'float 2.2s ease-in-out infinite' }}
            >
              <ChristmasTreeSvg className="w-7 h-8 drop-shadow-[0_0_6px_#16A34A]" />
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute top-1 rounded-full bg-[#E0F2FE] border border-[#0284C7]/45"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  boxShadow: '0 1px 4px rgba(2,132,199,0.5)',
                  animation: `fall ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 10. HALLOWEEN: 32px Glowing Pumpkin + Orbiting Bats + Purple Fog + 14 Sparks */}
        {k === 'halloween' && (
          <>
            <div
              className="absolute top-1 right-2"
              style={{ animation: 'float 2.1s ease-in-out infinite' }}
            >
              <PumpkinSvg className="w-8 h-8 drop-shadow-[0_0_8px_#FF9F0A]" />
            </div>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'orbit-wide 4.2s linear infinite' }}
            >
              <BatSvg className="w-6 h-4 drop-shadow-[0_0_5px_#9333EA]" />
            </div>
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-[#9333EA]/45 blur-md"
              style={{ animation: 'mist-drift 2.6s ease-in-out infinite' }}
            />
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-2 rounded-full"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  backgroundColor: idx % 2 === 0 ? '#FF9F0A' : '#9333EA',
                  boxShadow: `0 0 6px ${idx % 2 === 0 ? '#FF9F0A' : '#9333EA'}`,
                  animation: `float-up ${p.dur} ease-in infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 11. VALENTINE: Flying Cupid Arrow every 3s + 16 Rising Pink Hearts */}
        {k === 'valentine' && (
          <>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'cupid-3s 3s ease-in-out infinite' }}
            >
              <CupidArrowSvg className="w-7 h-5 drop-shadow-[0_0_6px_#FF375F]" />
            </div>
            {PARTICLE_SLOTS.map((p, idx) => (
              <div
                key={idx}
                className="absolute bottom-2"
                style={{
                  left: p.left,
                  animation: `float-up ${p.dur} ease-in infinite`,
                  animationDelay: p.delay,
                }}
              >
                <HeartSvg
                  className="w-3.5 h-3.5 drop-shadow-[0_0_4px_#FF375F]"
                  color={idx % 2 === 0 ? '#FF375F' : '#FB7185'}
                />
              </div>
            ))}
          </>
        )}

        {/* 12. KEMERDEKAAN: Rising Red-White Balloons + 14 Falling Confetti */}
        {k === 'kemerdekaan' && (
          <>
            <div
              className="absolute bottom-2 left-2"
              style={{ animation: 'float-up 2.6s ease-in infinite' }}
            >
              <BalloonSvg className="w-6 h-7" color="#DC2626" />
            </div>
            <div
              className="absolute bottom-2 right-2"
              style={{ animation: 'float-up 2.9s ease-in infinite', animationDelay: '1.1s' }}
            >
              <BalloonSvg className="w-6 h-7" color="#FFFFFF" />
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute top-1 w-2.5 h-1.5 rounded-[1px] border border-black/15"
                style={{
                  left: p.left,
                  backgroundColor: idx % 2 === 0 ? '#DC2626' : '#FFFFFF',
                  animation: `fall ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 13. PINKY CANDY: Spinning 28px Swirl Lollipop + 14 Bubbles & Sprinkles */}
        {k === 'pinky_candy' && (
          <>
            <div
              className="absolute top-1 right-2"
              style={{ animation: 'float 2.2s ease-in-out infinite' }}
            >
              <div className="nz-spin-4s">
                <LollipopSvg className="w-7 h-8 drop-shadow-[0_0_6px_#EC4899]" />
              </div>
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) =>
              idx % 2 === 0 ? (
                <span
                  key={idx}
                  className="absolute bottom-2 rounded-full border border-[#EC4899] bg-[#FBCFE8]"
                  style={{
                    left: p.left,
                    width: p.size + 1,
                    height: p.size + 1,
                    animation: `float-up ${p.dur} ease-in infinite`,
                    animationDelay: p.delay,
                  }}
                />
              ) : (
                <span
                  key={idx}
                  className="absolute top-1 w-2 h-1 rounded-full"
                  style={{
                    left: p.left,
                    backgroundColor: idx % 3 === 0 ? '#EC4899' : '#38BDF8',
                    animation: `fall ${p.dur} linear infinite`,
                    animationDelay: p.delay,
                  }}
                />
              )
            )}
          </>
        )}

        {/* 14. UNGU KAWAII: Floating Purple Cloud + 14 Twinkling Stars */}
        {k === 'ungu_kawaii' && (
          <>
            <div
              className="absolute top-1 left-2"
              style={{ animation: 'float 2.4s ease-in-out infinite' }}
            >
              <CloudSvg className="w-8 h-6 drop-shadow-[0_0_6px_#A855F7]" />
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: p.top,
                  left: p.left,
                  animation: `twinkle ${p.dur} ease-in-out infinite`,
                  animationDelay: p.delay,
                }}
              >
                <StarSvg className="w-3 h-3 drop-shadow-[0_0_4px_#A855F7]" color="#A855F7" />
              </div>
            ))}
          </>
        )}

        {/* 15. AURORA BOREALIS: Curved Aurora Ribbon + 14 Polar Particles */}
        {k === 'aurora_borealis' && (
          <>
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-32 h-9 rounded-t-full opacity-85 blur-[2.5px] nz-hue-rotate"
              style={{
                background: 'linear-gradient(90deg, #34D399, #06B6D4, #BF5AF2, #34D399)',
                backgroundSize: '200% 200%',
                animation: 'aurora-bg 3.2s ease infinite, wave 2.5s ease-in-out infinite',
              }}
            />
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute rounded-full"
                style={{
                  top: p.top,
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  backgroundColor: idx % 2 === 0 ? '#34D399' : '#BF5AF2',
                  boxShadow: `0 0 7px ${idx % 2 === 0 ? '#34D399' : '#06B6D4'}`,
                  animation: `float-up ${p.dur} ease-in infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 16. KRISTAL ES 3D: Orbiting Ice Shards + Cold Mist + 14 Snow Particles */}
        {k === 'kristal_es' && (
          <>
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-[#BAE6FD]/55 blur-md"
              style={{ animation: 'mist-drift 2.6s ease-in-out infinite' }}
            />
            {[0, 120, 240].map((deg, idx) => (
              <div
                key={deg}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  animation: 'orbit 4s linear infinite',
                  animationDelay: `${-idx * 1.33}s`,
                }}
              >
                <DiamondSvg className="w-6 h-6 drop-shadow-[0_0_6px_#38BDF8]" />
              </div>
            ))}
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute top-1 rounded-full bg-[#E0F2FE] border border-[#0284C7]/45"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  animation: `fall ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 17. LUAR ANGKASA: Orbiting Ringed Planet + Rocket every 4s + 16 Stars */}
        {k === 'luar_angkasa' && (
          <>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'orbit-wide 4.8s linear infinite' }}
            >
              <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-[#64D2FF] to-[#4F46E5] shadow-[0_0_8px_#0A84FF]">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-2 rounded-full border-2 border-[#38BDF8] -rotate-12" />
              </div>
            </div>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'rocket-4s 4s ease-in-out infinite' }}
            >
              <RocketSvg className="w-6 h-6 drop-shadow-[0_0_6px_#0A84FF]" />
            </div>
            {PARTICLE_SLOTS.map((p, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: p.top,
                  left: p.left,
                  animation: `twinkle ${p.dur} ease-in-out infinite`,
                  animationDelay: p.delay,
                }}
              >
                <StarSvg className="w-2.5 h-2.5" color={idx % 2 === 0 ? '#4F46E5' : '#0A84FF'} />
              </div>
            ))}
          </>
        )}

        {/* 18. CYBER BLUE 3D: Orbiting Lightning Bolts + Rising 0101 Binary + Sparks */}
        {k === 'cyber_blue' && (
          <>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'orbit 3.6s linear infinite' }}
            >
              <LightningSvg className="w-6 h-6 drop-shadow-[0_0_8px_#00F0FF]" />
            </div>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'orbit 3.6s linear infinite', animationDelay: '-1.8s' }}
            >
              <LightningSvg className="w-6 h-6 drop-shadow-[0_0_8px_#00F0FF]" />
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-2 font-mono text-[9px] font-bold text-[#0284C7]"
                style={{
                  left: p.left,
                  textShadow: '0 0 6px #00F0FF',
                  animation: `float-up ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              >
                {idx % 2 === 0 ? '01' : '10'}
              </span>
            ))}
          </>
        )}

        {/* 19. GALAXY: Nebula Mist + Orbiting Mini Planet + 16 Galaxy Stars */}
        {k === 'galaxy' && (
          <>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-20 rounded-full blur-lg opacity-55"
              style={{
                background: 'linear-gradient(120deg, #7C3AED, #EC4899, #3B82F6)',
                animation: 'mist-drift 3.4s ease-in-out infinite',
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'orbit-wide 5s linear infinite' }}
            >
              <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-[#F472B6] to-[#7C3AED] shadow-[0_0_8px_#A855F7]">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-2 rounded-full border border-[#FBCFE8] -rotate-12" />
              </div>
            </div>
            {PARTICLE_SLOTS.map((p, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: p.top,
                  left: p.left,
                  animation: `twinkle ${p.dur} ease-in-out infinite`,
                  animationDelay: p.delay,
                }}
              >
                <StarSvg className="w-2.5 h-2.5" color={idx % 2 === 0 ? '#A855F7' : '#EC4899'} />
              </div>
            ))}
          </>
        )}

        {/* 20. LEGENDA: Gold Trophy + Glowing Game Sword + 16 Falling Gold Particles */}
        {k === 'legenda_nongkrong' && (
          <>
            <div
              className="absolute top-1 right-2"
              style={{ animation: 'float 2s ease-in-out infinite' }}
            >
              <TrophySvg className="w-7 h-7 drop-shadow-[0_0_7px_#D97706]" />
            </div>
            <div
              className="absolute top-1 left-2"
              style={{ animation: 'float 2.3s ease-in-out infinite', animationDelay: '0.5s' }}
            >
              <SwordSvg className="w-7 h-7 drop-shadow-[0_0_7px_#F59E0B]" />
            </div>
            {PARTICLE_SLOTS.map((p, idx) => (
              <span
                key={idx}
                className="absolute top-1 rounded-full bg-[#FFD60A] border border-[#92400E]/45"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  boxShadow: '0 0 7px #FFD60A',
                  animation: `fall ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 21. API PHOENIX 3D: Long Fire Tail + Blazing Flames + 16 Flying Embers */}
        {k === 'api_phoenix' && (
          <>
            <svg
              viewBox="0 0 60 28"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-7"
              style={{ animation: 'flicker 0.8s ease-in-out infinite' }}
            >
              <path
                fill="#DC2626"
                d="M6 20C14 10 22 6 30 14c8-8 16-4 24 6-10 4-18 6-24 2-6 4-14 2-24-2z"
              />
              <path
                fill="#FF9F0A"
                d="M14 20c5-6 11-8 16-3 5-5 11-3 16 3-7 3-12 3-16 1-4 2-9 2-16-1z"
              />
            </svg>
            {PARTICLE_SLOTS.map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-2 rounded-full"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  backgroundColor: idx % 2 === 0 ? '#FF453A' : '#FF9F0A',
                  boxShadow: '0 0 8px #FF453A',
                  animation: `float-up ${p.dur} ease-in infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 22. NAGA: Circling Green Dragon Tail + 16 Green Dragon Smoke & Scale Sparks */}
        {k === 'naga' && (
          <>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'orbit-wide 4s linear infinite' }}
            >
              <svg viewBox="0 0 28 18" className="w-7 h-5 drop-shadow-[0_0_6px_#10B981]">
                <path fill="#059669" stroke="#A3E635" strokeWidth="1.2" d="M2 12c6-8 14-8 24-2-6 4-12 5-18 3l-4 3z" />
              </svg>
            </div>
            {PARTICLE_SLOTS.map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-2 rounded-full"
                style={{
                  left: p.left,
                  width: idx % 2 === 0 ? 12 : p.size,
                  height: idx % 2 === 0 ? 12 : p.size,
                  backgroundColor: idx % 2 === 0 ? 'rgba(48,209,88,0.45)' : '#A3E635',
                  filter: idx % 2 === 0 ? 'blur(3px)' : undefined,
                  animation: `float-up ${p.dur} ease-out infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 23. SULTAN: Large 28px Sparkling Diamond + Falling Gold Coins + Flying Paper Bills */}
        {k === 'sultan' && (
          <>
            <div
              className="absolute top-1 right-2"
              style={{ animation: 'twinkle 1.4s ease-in-out infinite' }}
            >
              <DiamondSvg className="w-7 h-7 drop-shadow-[0_0_8px_#38BDF8]" />
            </div>
            {PARTICLE_SLOTS.map((p, idx) =>
              idx % 3 === 0 ? (
                <div
                  key={idx}
                  className="absolute top-1"
                  style={{
                    left: p.left,
                    animation: `fall ${p.dur} linear infinite`,
                    animationDelay: p.delay,
                  }}
                >
                  <MoneyBillSvg className="w-6 h-3.5 drop-shadow-[0_0_4px_#16A34A]" />
                </div>
              ) : (
                <span
                  key={idx}
                  className="absolute top-1 rounded-full bg-gradient-to-br from-[#FEF08A] to-[#D97706] border border-[#92400E]/50"
                  style={{
                    left: p.left,
                    width: p.size + 2,
                    height: p.size + 2,
                    boxShadow: '0 0 6px #FFD60A',
                    animation: `fall ${p.dur} linear infinite`,
                    animationDelay: p.delay,
                  }}
                />
              )
            )}
          </>
        )}

        {/* 24. IRONMAN: Moving Gold Gleam Across Ring + Pulsing Cyan Arc Sparks */}
        {k === 'ironman' && (
          <div
            aria-hidden="true"
            className="absolute w-[92px] h-[92px] rounded-full overflow-hidden pointer-events-none"
          >
            <div
              className="w-10 h-full bg-gradient-to-r from-transparent via-[#FEF08A]/70 to-transparent"
              style={{ animation: 'shine 2s linear infinite' }}
            />
          </div>
        )}

        {/* 25. BATMAN: Blinking Yellow Bat-Signal Glow */}
        {k === 'batman' && (
          <div
            aria-hidden="true"
            className="absolute w-24 h-24 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(250,204,21,0.38) 45%, transparent 72%)',
              animation: 'twinkle 1.6s ease-in-out infinite',
            }}
          />
        )}

        {/* 26. VOLI: Falling Sand Particles Around Ring */}
        {k === 'voli' && (
          <>
            {PARTICLE_SLOTS.slice(0, 12).map((p, idx) => (
              <span
                key={idx}
                className="absolute top-2 rounded-full bg-[#F59E0B]"
                style={{
                  left: p.left,
                  width: 3 + (idx % 2),
                  height: 3 + (idx % 2),
                  boxShadow: '0 0 4px #FDE68A',
                  animation: `fall ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 27. BADMINTON: Flying White Feathers Around Ring */}
        {k === 'badminton' && (
          <>
            {PARTICLE_SLOTS.slice(0, 8).map((p, idx) => (
              <svg
                key={idx}
                viewBox="0 0 12 18"
                className="absolute bottom-3 w-3 h-4 drop-shadow-[0_0_3px_#16A34A]"
                style={{
                  left: p.left,
                  animation: `feather-drift ${p.dur} ease-out infinite`,
                  animationDelay: p.delay,
                }}
              >
                <path fill="#FFFFFF" stroke="#16A34A" strokeWidth="0.7" d="M6 1C9 4 10 9 7 15L6 17 5 15C2 9 3 4 6 1z" />
              </svg>
            ))}
          </>
        )}

        {/* 28. RENANG: Rising Water Bubbles Around Ring */}
        {k === 'renang' && (
          <>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-2 rounded-full border border-[#38BDF8] bg-[#E0F2FE]/80"
                style={{
                  left: p.left,
                  width: p.size + 1,
                  height: p.size + 1,
                  boxShadow: '0 0 5px #38BDF8',
                  animation: `float-up ${p.dur} ease-in infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 29. E-SPORT: Purple Shimmer Sweep + Pixel Square Particles */}
        {k === 'esport' && (
          <>
            <div
              aria-hidden="true"
              className="absolute w-[92px] h-[92px] rounded-full overflow-hidden pointer-events-none"
            >
              <div
                className="w-10 h-full bg-gradient-to-r from-transparent via-[#F0ABFC]/75 to-transparent"
                style={{ animation: 'shine 1.8s linear infinite' }}
              />
            </div>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-2 rounded-[1px]"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  backgroundColor: idx % 2 === 0 ? '#A855F7' : '#EC4899',
                  boxShadow: `0 0 6px ${idx % 2 === 0 ? '#A855F7' : '#EC4899'}`,
                  animation: `float-up ${p.dur} steps(6, end) infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 30. ML: Golden Star Particles Around Ring */}
        {k === 'ml' && (
          <>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: p.top,
                  left: p.left,
                  animation: `twinkle ${p.dur} ease-in-out infinite`,
                  animationDelay: p.delay,
                }}
              >
                <StarSvg className="w-3 h-3 drop-shadow-[0_0_5px_#FFD60A]" color="#FFD60A" />
              </div>
            ))}
          </>
        )}

        {/* 31. FF: Blinking Orange Glow + Rising Fire Embers */}
        {k === 'ff' && (
          <>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-2 rounded-full"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  backgroundColor: idx % 2 === 0 ? '#FF453A' : '#FF9F0A',
                  boxShadow: '0 0 8px #FF453A',
                  animation: `float-up ${p.dur} ease-in infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 32. ELEGANT GOLD: Slow Gold Gleam Sweep + Subtle Corner Sparkles */}
        {k === 'elegant_gold' && (
          <>
            <div
              aria-hidden="true"
              className="absolute w-[94px] h-[94px] rounded-full overflow-hidden pointer-events-none"
            >
              <div
                className="w-9 h-full bg-gradient-to-r from-transparent via-[#FEF3C7]/75 to-transparent"
                style={{ animation: 'shine 3.4s linear infinite' }}
              />
            </div>
            {[
              { top: '6%', left: '16%', delay: '0s' },
              { top: '12%', left: '80%', delay: '0.9s' },
              { top: '82%', left: '18%', delay: '1.6s' },
              { top: '80%', left: '78%', delay: '2.2s' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: s.top,
                  left: s.left,
                  animation: 'twinkle 2.6s ease-in-out infinite',
                  animationDelay: s.delay,
                }}
              >
                <StarSvg className="w-2.5 h-2.5 drop-shadow-[0_0_4px_#D4AF37]" color="#FDE68A" />
              </div>
            ))}
          </>
        )}

        {/* 33. ELEGANT BLACK: Slow Silver Gleam Sweep */}
        {k === 'elegant_black' && (
          <>
            <div
              aria-hidden="true"
              className="absolute w-[94px] h-[94px] rounded-full overflow-hidden pointer-events-none"
            >
              <div
                className="w-8 h-full bg-gradient-to-r from-transparent via-white/65 to-transparent"
                style={{ animation: 'shine 3.6s linear infinite' }}
              />
            </div>
            {[
              { top: '10%', left: '16%', delay: '0.2s' },
              { top: '82%', left: '80%', delay: '1.5s' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: s.top,
                  left: s.left,
                  animation: 'twinkle 2.8s ease-in-out infinite',
                  animationDelay: s.delay,
                }}
              >
                <StarSvg className="w-2.5 h-2.5 drop-shadow-[0_0_4px_#E4E4E7]" color="#E4E4E7" />
              </div>
            ))}
          </>
        )}

        {/* 34. AESTHETIC PINK: Soft Drifting Clouds + Mini Sakura Sparkles */}
        {k === 'aesthetic_pink' && (
          <>
            <div
              aria-hidden="true"
              className="absolute top-1 left-2 w-8 h-4 rounded-full bg-white/85 blur-[1px]"
              style={{ animation: 'mist-drift 4.2s ease-in-out infinite' }}
            />
            <div
              aria-hidden="true"
              className="absolute bottom-2 right-2 w-9 h-4 rounded-full bg-[#FCE7F3]/90 blur-[1px]"
              style={{ animation: 'mist-drift 4.8s ease-in-out infinite reverse' }}
            />
            {PARTICLE_SLOTS.slice(0, 6).map((p, idx) => (
              <span
                key={idx}
                className="absolute top-0 rounded-full"
                style={{
                  left: p.left,
                  width: 4,
                  height: 4,
                  backgroundColor: '#F9A8D4',
                  boxShadow: '0 0 6px #F472B6',
                  animation: `fall ${Number(p.dur) + 0.8}s linear infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 35. AESTHETIC BLUE: Drifting Clouds + Slow Twinkling Stars */}
        {k === 'aesthetic_blue' && (
          <>
            <div
              aria-hidden="true"
              className="absolute top-1 right-2 w-8 h-4 rounded-full bg-white/85 blur-[1px]"
              style={{ animation: 'mist-drift 4.5s ease-in-out infinite' }}
            />
            {PARTICLE_SLOTS.slice(0, 8).map((p, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: p.top,
                  left: p.left,
                  animation: `twinkle ${Number(p.dur) + 0.8}s ease-in-out infinite`,
                  animationDelay: p.delay,
                }}
              >
                <StarSvg className="w-2.5 h-2.5 drop-shadow-[0_0_4px_#93C5FD]" color="#BAE6FD" />
              </div>
            ))}
          </>
        )}

        {/* 36. AESTHETIC SAGE: Gentle Falling Sage Leaves */}
        {k === 'aesthetic_sage' && (
          <>
            {PARTICLE_SLOTS.slice(0, 8).map((p, idx) => (
              <svg
                key={idx}
                viewBox="0 0 12 12"
                className="absolute top-0 w-3 h-3"
                style={{
                  left: p.left,
                  animation: `fall ${Number(p.dur) + 0.9}s linear infinite`,
                  animationDelay: p.delay,
                }}
              >
                <path
                  d="M6 1C9 2.5 10 7 6 11C2 7 3 2.5 6 1Z"
                  fill={idx % 2 === 0 ? '#6B9080' : '#A4C3B2'}
                />
              </svg>
            ))}
          </>
        )}

        {/* 37. LUCU BEAR: Soft Honey Sparkles Around Ring */}
        {k === 'lucu_bear' && (
          <>
            {[
              { top: '8%', left: '12%', delay: '0s' },
              { top: '12%', left: '84%', delay: '0.7s' },
              { top: '80%', left: '14%', delay: '1.3s' },
              { top: '82%', left: '82%', delay: '1.9s' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: s.top,
                  left: s.left,
                  animation: 'twinkle 2s ease-in-out infinite',
                  animationDelay: s.delay,
                }}
              >
                <StarSvg className="w-2.5 h-2.5" color="#D4A373" />
              </div>
            ))}
          </>
        )}

        {/* 38. LUCU CAT: Cute Pink Heart Sparks Around Ring */}
        {k === 'lucu_cat' && (
          <>
            {[
              { top: '10%', left: '12%', delay: '0s' },
              { top: '76%', left: '84%', delay: '0.8s' },
              { top: '80%', left: '14%', delay: '1.4s' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: s.top,
                  left: s.left,
                  animation: 'heart-bounce 2s ease-in-out infinite',
                  animationDelay: s.delay,
                }}
              >
                <HeartSvg className="w-2.5 h-2.5" color="#F472B6" />
              </div>
            ))}
          </>
        )}

        {/* 39. LUCU BUNNY: Pastel Sparkles & Gentle Floating Dots */}
        {k === 'lucu_bunny' && (
          <>
            {PARTICLE_SLOTS.slice(0, 6).map((p, idx) => (
              <span
                key={idx}
                className="absolute rounded-full"
                style={{
                  top: p.top,
                  left: p.left,
                  width: 4,
                  height: 4,
                  backgroundColor: idx % 2 === 0 ? '#F9A8D4' : '#FDE68A',
                  animation: `twinkle ${p.dur} ease-in-out infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 40. COUPLE KING: Golden Crown Glow Sparkles */}
        {k === 'couple_king' && (
          <>
            {[
              { top: '4%', left: '22%', delay: '0s' },
              { top: '4%', left: '76%', delay: '0.6s' },
              { top: '78%', left: '14%', delay: '1.1s' },
              { top: '78%', left: '84%', delay: '1.7s' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: s.top,
                  left: s.left,
                  animation: 'twinkle 1.8s ease-in-out infinite',
                  animationDelay: s.delay,
                }}
              >
                <StarSvg className="w-3 h-3 drop-shadow-[0_0_5px_#FFD60A]" color="#FFD60A" />
              </div>
            ))}
          </>
        )}

        {/* 41. COUPLE QUEEN: Bouncing Hearts Around Ring (Paired with King) */}
        {k === 'couple_queen' && (
          <>
            {[
              { top: '6%', left: '20%', delay: '0s' },
              { top: '6%', left: '78%', delay: '0.5s' },
              { top: '76%', left: '14%', delay: '1s' },
              { top: '76%', left: '84%', delay: '1.5s' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: s.top,
                  left: s.left,
                  animation: 'heart-bounce 1.7s ease-in-out infinite',
                  animationDelay: s.delay,
                }}
              >
                <HeartSvg className="w-3 h-3 drop-shadow-[0_0_5px_#EC4899]" color="#FF375F" />
              </div>
            ))}
          </>
        )}

        {/* 42. COUPLE MOON COWO: Golden Moon Aura + Deep Night Stars */}
        {k === 'couple_moon_cowo' && (
          <>
            {[
              { top: '8%', left: '14%', delay: '0.2s' },
              { top: '80%', left: '82%', delay: '1.1s' },
              { top: '78%', left: '16%', delay: '1.8s' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: s.top,
                  left: s.left,
                  animation: 'twinkle 2.2s ease-in-out infinite',
                  animationDelay: s.delay,
                }}
              >
                <StarSvg className="w-2.5 h-2.5 drop-shadow-[0_0_4px_#FFD60A]" color="#FFD60A" />
              </div>
            ))}
          </>
        )}

        {/* 43. COUPLE MOON CEWE: Twinkling Violet-Gold Stars (Paired with Moon Cowo) */}
        {k === 'couple_moon_cewe' && (
          <>
            {PARTICLE_SLOTS.slice(0, 10).map((p, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: p.top,
                  left: p.left,
                  animation: `twinkle ${p.dur} ease-in-out infinite`,
                  animationDelay: p.delay,
                }}
              >
                <StarSvg
                  className="w-2.5 h-2.5 drop-shadow-[0_0_5px_#E9D5FF]"
                  color={idx % 2 === 0 ? '#FEF08A' : '#E9D5FF'}
                />
              </div>
            ))}
          </>
        )}

        {/* 44. KPOP LIGHTSTICK: Falling Multicolor Concert Confetti */}
        {k === 'kpop_lightstick' && (
          <>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => {
              const colors = ['#EC4899', '#38BDF8', '#A855F7', '#FACC15', '#FFFFFF'];
              const c = colors[idx % colors.length];
              return (
                <span
                  key={idx}
                  className="absolute top-0 rounded-[1px]"
                  style={{
                    left: p.left,
                    width: 4,
                    height: 7,
                    backgroundColor: c,
                    boxShadow: `0 0 5px ${c}`,
                    animation: `fall ${p.dur} linear infinite`,
                    animationDelay: p.delay,
                  }}
                />
              );
            })}
          </>
        )}

        {/* 45. KPOP PINK: Bouncing Hearts + Falling Pink Glitter */}
        {k === 'kpop_pink' && (
          <>
            {[
              { top: '8%', left: '16%', delay: '0s' },
              { top: '10%', left: '82%', delay: '0.7s' },
              { top: '80%', left: '20%', delay: '1.2s' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  top: s.top,
                  left: s.left,
                  animation: 'heart-bounce 1.6s ease-in-out infinite',
                  animationDelay: s.delay,
                }}
              >
                <HeartSvg className="w-3 h-3 drop-shadow-[0_0_5px_#EC4899]" color="#FF375F" />
              </div>
            ))}
            {PARTICLE_SLOTS.slice(0, 10).map((p, idx) => (
              <span
                key={idx}
                className="absolute top-0 rounded-full"
                style={{
                  left: p.left,
                  width: 3.5,
                  height: 3.5,
                  backgroundColor: idx % 2 === 0 ? '#F472B6' : '#E879F9',
                  boxShadow: '0 0 6px #EC4899',
                  animation: `fall ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 46. GAMERS NEON: RGB Corner Sparks */}
        {k === 'gamers_neon' && (
          <>
            {PARTICLE_SLOTS.slice(0, 10).map((p, idx) => {
              const rgb = ['#FF0055', '#00FF88', '#00AAFF'];
              const c = rgb[idx % rgb.length];
              return (
                <span
                  key={idx}
                  className="absolute rounded-[1px]"
                  style={{
                    top: p.top,
                    left: p.left,
                    width: 4.5,
                    height: 4.5,
                    backgroundColor: c,
                    boxShadow: `0 0 8px ${c}`,
                    animation: `twinkle ${p.dur} steps(3, end) infinite`,
                    animationDelay: p.delay,
                  }}
                />
              );
            })}
          </>
        )}

        {/* 47. GAMERS PRO: Flickering Red Flame Embers Around Outer Ring */}
        {k === 'gamers_pro' && (
          <>
            {PARTICLE_SLOTS.slice(0, 14).map((p, idx) => (
              <span
                key={idx}
                className="absolute bottom-2 rounded-full"
                style={{
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  backgroundColor: idx % 2 === 0 ? '#DC2626' : '#FF9F0A',
                  boxShadow: '0 0 8px #DC2626',
                  animation: `float-up ${p.dur} ease-in infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </>
        )}
      </div>
      )}
    </div>
  );
};

export const BorderEffectStage = React.memo(BorderEffectStageComponent);

