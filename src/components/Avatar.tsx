import React from 'react';
import type { BorderItem, Player } from '../types';
import { useBorders } from '../context/BordersContext';
import { resolveBorderVisual } from '../utils/borderStyles';
import { getInitials, sanitizeMediaUrl } from '../utils/format';

interface AvatarProps {
  player?: Pick<Player, 'name' | 'username' | 'avatar_url' | 'is_owner' | 'border_id'> | null;
  size?: 28 | 32 | 36 | 44 | 56 | 64 | 72 | 80;
  storyRing?: 'unseen' | 'seen' | 'none';
  overrideBorder?: BorderItem | null;
  use3dFloat?: boolean;
  paused?: boolean;
  onClick?: () => void;
  className?: string;
}

const AvatarComponent: React.FC<AvatarProps> = ({
  player,
  size = 36,
  storyRing = 'none',
  overrideBorder,
  use3dFloat = false,
  paused = false,
  onClick,
  className = '',
}) => {
  const { bordersById } = useBorders();
  const safeSrc = sanitizeMediaUrl(player?.avatar_url);
  const isOwner = Boolean(player?.is_owner);
  const playerBorderId = player?.border_id;

  const activeBorder = React.useMemo(() => {
    if (overrideBorder !== undefined) return overrideBorder;
    if (playerBorderId) {
      return (
        bordersById.get(String(playerBorderId)) ||
        (isOwner && String(playerBorderId).toUpperCase() === 'FAIZ_SPIDERMAN'
          ? {
              id: 'FAIZ_SPIDERMAN',
              name: 'FAIZ SPIDERMAN',
              category: 'OWNER',
              price_coins: 0,
              is_owner_only: true,
              css_ring: null,
              icon_emoji: null,
            }
          : isOwner
            ? bordersById.get('FAIZ_OWNER') ||
              Array.from(bordersById.values()).find((b) => b.is_owner_only) ||
              null
            : null)
      );
    }
    return isOwner
      ? bordersById.get('FAIZ_OWNER') ||
        Array.from(bordersById.values()).find((b) => b.is_owner_only) ||
        null
      : null;
  }, [overrideBorder, playerBorderId, bordersById, isOwner]);

  const isPreviewMode = overrideBorder !== undefined;
  const visual = React.useMemo(
    () => resolveBorderVisual(activeBorder, !isPreviewMode && isOwner && !playerBorderId),
    [activeBorder, isPreviewMode, isOwner, playerBorderId]
  );

  const sizeStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
  };

  const fontSize =
    size >= 72
      ? 'text-lg'
      : size >= 64
        ? 'text-base'
        : size >= 56
          ? 'text-sm'
          : size >= 36
            ? 'text-xs'
            : 'text-[10px]';

  const useStoryRing = storyRing !== 'none';
  const storyRingClass =
    storyRing === 'unseen'
      ? isOwner
        ? 'ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#0B0B0D]'
        : 'ring-2 ring-[#8B5CF6] ring-offset-2 ring-offset-[#0B0B0D]'
      : storyRing === 'seen'
        ? 'ring-1 ring-[#232328] ring-offset-2 ring-offset-[#0B0B0D]'
        : '';

  const hasBorder = Boolean(activeBorder) || visual.isFaizOwner;

  const isSlimRing =
    visual.effectKey === 'elegant_gold' || visual.effectKey === 'elegant_black';

  // Thick 8-10px main ring on preview/large avatars, slim for Elegant, proportional on small avatars
  const ringThickness = !hasBorder
    ? 1
    : isSlimRing
      ? size >= 64
        ? 5.5
        : size >= 44
          ? 3.5
          : 2.5
      : size >= 64
        ? 9
        : size >= 44
          ? 5
          : 3;

  const outerSize = size + ringThickness * 2;
  const layer3Size = outerSize + (size >= 56 ? 12 : 6);

  const innerAvatar = (
    <div
      style={{
        ...sizeStyle,
        boxShadow:
          'inset 0 4px 10px rgba(0,0,0,0.95), inset 0 -2px 6px rgba(255,255,255,0.14)',
      }}
      className={`relative rounded-full overflow-hidden bg-[#0E0E11] flex items-center justify-center shrink-0 select-none z-[3] ${
        visual.isGlitch && !useStoryRing ? 'nz-glitch' : ''
      }`}
    >
      {safeSrc ? (
        <img
          src={safeSrc}
          alt={player?.name || 'Avatar'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={`font-display font-bold tracking-[-0.5px] text-[#F4F4F5] ${fontSize}`}>
          {getInitials(player?.name || player?.username)}
        </span>
      )}

      {/* VALENTINE / UNGU KAWAII: Blushing Pink Cheeks */}
      {(visual.effectKey === 'valentine' || visual.effectKey === 'ungu_kawaii') && size >= 56 && (
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <span
            className="absolute bottom-3 left-2.5 w-3 h-1.5 rounded-full bg-[#FF375F]/75 blur-[1.5px]"
            style={{ animation: 'pulse-glow 1.2s ease-in-out infinite' }}
          />
          <span
            className="absolute bottom-3 right-2.5 w-3 h-1.5 rounded-full bg-[#FF375F]/75 blur-[1.5px]"
            style={{ animation: 'pulse-glow 1.2s ease-in-out infinite' }}
          />
        </div>
      )}

      {/* CYBER BLUE 3D: Cyber Visor Glasses worn on Avatar */}
      {visual.effectKey === 'cyber_blue' && size >= 56 && (
        <div
          aria-hidden="true"
          className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[78%] h-3.5 rounded-[4px] bg-gradient-to-r from-[#00F0FF]/90 via-[#0A84FF]/95 to-[#00F0FF]/90 border border-white/70 flex items-center justify-center pointer-events-none"
          style={{ boxShadow: '0 0 10px #00F0FF' }}
        >
          <span className="w-[82%] h-[1.5px] bg-white/80 rounded-full" />
        </div>
      )}

      {/* CYBER BLUE 3D: Vertical Hologram Scanline on Avatar */}
      {visual.effectKey === 'cyber_blue' && size >= 44 && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-[2px] bg-[#00F0FF] pointer-events-none"
          style={{
            animation: 'holo-scan 1.8s ease-in-out infinite',
            boxShadow: '0 0 8px #00F0FF',
          }}
        />
      )}

      {/* Subtle 3D glass inner rim */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.85)' }}
      />
    </div>
  );

  const crownClass =
    size >= 64
      ? 'text-[24px] -top-6'
      : size >= 44
        ? 'text-[15px] -top-4'
        : 'text-[11px] -top-3';

  const renderedAvatar = useStoryRing ? (
    <div style={sizeStyle} className={`relative rounded-full shrink-0 ${storyRingClass} ${className}`}>
      {innerAvatar}
    </div>
  ) : !hasBorder ? (
    <div
      style={{ width: `${size + 2}px`, height: `${size + 2}px`, border: '1px solid #232328' }}
      className={`relative rounded-full inline-flex items-center justify-center shrink-0 ${className}`}
    >
      {innerAvatar}
    </div>
  ) : (
    <div
      style={{
        width: `${outerSize}px`,
        height: `${outerSize}px`,
      }}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
    >
      {/* Floating Elliptical Floor Shadow Under Avatar (gives 3D levitation depth) */}
      {use3dFloat && (
        <div
          aria-hidden="true"
          className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-[78%] h-3 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.42) 0%, transparent 72%)',
          }}
        />
      )}

      {/* RING DEPTH LAYER: Layer 1 Soft Radial Glow + Layer 2 Thick 8-10px Conic + Ring-Only Pattern + Layer 3 Thin Outer Spin */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation:
            !paused && visual.effectKey === 'basket'
              ? 'dribble-bounce 0.95s ease-in-out infinite'
              : !paused && visual.effectKey === 'voli'
                ? 'float-ring 2s ease-in-out infinite'
                : undefined,
        }}
        className="flex items-center justify-center pointer-events-none"
      >
        {/* LAYER 1: Soft Pre-Feathered Glow Behind (zero GPU blur pass) */}
        <div
          aria-hidden="true"
          className={`absolute -inset-3 rounded-full ${
            paused
              ? ''
              : visual.isHeartbeat
                ? 'nz-heartbeat'
                : visual.isAurora
                  ? 'nz-hue-rotate nz-pulse-glow'
                  : 'nz-pulse-glow'
          }`}
          style={{
            background: visual.ambientGlowBg,
            opacity: 0.78,
            animation:
              !paused && visual.effectKey === 'faiz_spiderman'
                ? 'glow-red-blue 2.6s ease-in-out infinite'
                : !paused && visual.effectKey === 'esport'
                  ? 'neon-blink 1.4s ease-in-out infinite'
                  : undefined,
          }}
        />

        {/* LAYER 3: Thin Outer Rotating Ring (dashed / dots) */}
        <div
          aria-hidden="true"
          style={{
            width: `${layer3Size}px`,
            height: `${layer3Size}px`,
            borderWidth: size >= 56 ? '2px' : '1.5px',
            borderStyle: visual.outerRingPattern,
            borderColor: visual.outerRingColor,
            filter: paused ? undefined : `drop-shadow(0 0 5px ${visual.primaryColor})`,
          }}
          className={`absolute rounded-full opacity-90 ${visual.outerSpinClass}`}
        />

        {/* LAYER 2: Main 8-10px 3D Conic-Gradient Ring */}
        {visual.dashed ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className={`absolute inset-0 w-full h-full ${visual.spinClass}`}
            style={{ filter: paused ? undefined : `drop-shadow(0 0 6px ${visual.primaryColor})` }}
          >
            <circle
              cx="50"
              cy="50"
              r="43"
              fill="none"
              stroke={visual.primaryColor}
              strokeWidth="10"
              strokeDasharray="14 9"
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r="43"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.65"
              strokeWidth="3.5"
              strokeDasharray="6 17"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <div
            aria-hidden="true"
            className={`absolute inset-0 rounded-full ${
              visual.isAurora ? `${visual.spinClass} nz-hue-rotate` : visual.spinClass
            }`}
            style={{
              background: visual.conicGradient,
              boxShadow: visual.ringShadow,
              animation:
                visual.effectKey === 'faiz_spiderman'
                  ? 'spin 6s linear infinite, glow-red-blue 2.6s ease-in-out infinite'
                  : undefined,
            }}
          />
        )}

        {/* RING-ONLY SVG PATTERNS FOR THE 12 NEW BORDERS (Avatar FG remains 100% plain) */}
        {visual.effectKey === 'faiz_spiderman' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-6s"
          >
            <circle cx="50" cy="50" r="45.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.82" strokeWidth="1" />
            <circle cx="50" cy="50" r="41.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="0.9" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
              const r = (deg * Math.PI) / 180;
              return (
                <line
                  key={deg}
                  x1={50 + Math.cos(r) * 39}
                  y1={50 + Math.sin(r) * 39}
                  x2={50 + Math.cos(r) * 49}
                  y2={50 + Math.sin(r) * 49}
                  stroke="#FFFFFF"
                  strokeOpacity="0.85"
                  strokeWidth="1"
                />
              );
            })}
            <path
              d="M50 3 A47 47 0 0 1 97 50"
              fill="none"
              stroke="#EF4444"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
            <path
              d="M50 97 A47 47 0 0 1 3 50"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
          </svg>
        )}

        {visual.effectKey === 'ironman' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-4s"
            style={{ filter: 'drop-shadow(0 0 6px #38BDF8)' }}
          >
            {[0, 90, 180, 270].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 44;
              const cy = 50 + Math.sin(rad) * 44;
              return (
                <g key={deg}>
                  <circle cx={cx} cy={cy} r="5.2" fill="#0EA5E9" stroke="#FFD60A" strokeWidth="1.2" />
                  <circle cx={cx} cy={cy} r="2.6" fill="#E0F2FE" />
                </g>
              );
            })}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#7DD3FC"
              strokeWidth="1.4"
              strokeDasharray="8 14"
            />
          </svg>
        )}

        {visual.effectKey === 'batman' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-4s"
            style={{ filter: 'drop-shadow(0 0 6px #FACC15)' }}
          >
            {[0, 90, 180, 270].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 6.5)`}>
                <path
                  d="M0 2.5 C-2 0.2 -5 0.5 -7 2.2 C-5.5 0 -4 -1.8 -2.5 -1.4 L-1.2 -2.6 L0 -1.2 L1.2 -2.6 L2.5 -1.4 C4 -1.8 5.5 0 7 2.2 C5 0.5 2 0.2 0 2.5 Z"
                  fill="#09090B"
                  stroke="#FACC15"
                  strokeWidth="0.7"
                />
              </g>
            ))}
          </svg>
        )}

        {visual.effectKey === 'bola' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-3s"
          >
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 6)`}>
                <polygon
                  points="0,-3.5 3.3,-1.1 2,2.8 -2,2.8 -3.3,-1.1"
                  fill="#111113"
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                />
              </g>
            ))}
          </svg>
        )}

        {visual.effectKey === 'basket' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-6s"
          >
            <circle cx="50" cy="50" r="44.5" fill="none" stroke="#18181B" strokeWidth="1.6" strokeDasharray="16 6" />
            <path d="M9 36 Q26 50 9 64" fill="none" stroke="#18181B" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M91 36 Q74 50 91 64" fill="none" stroke="#18181B" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M36 9 Q50 24 64 9" fill="none" stroke="#18181B" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M36 91 Q50 76 64 91" fill="none" stroke="#18181B" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}

        {visual.effectKey === 'voli' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-4s"
          >
            {[0, 120, 240].map((deg) => (
              <path
                key={deg}
                transform={`rotate(${deg} 50 50)`}
                d="M50 4 Q68 18 82 28"
                fill="none"
                stroke="#1E293B"
                strokeOpacity="0.55"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            ))}
          </svg>
        )}

        {visual.effectKey === 'badminton' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-4s"
            style={{ filter: 'drop-shadow(0 0 4px #22C55E)' }}
          >
            {[0, 120, 240].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 6.5)`}>
                <polygon points="-3.2,-3.5 3.2,-3.5 1.5,1.5 -1.5,1.5" fill="#FFFFFF" stroke="#16A34A" strokeWidth="0.7" />
                <circle cx="0" cy="2.3" r="1.6" fill="#16A34A" stroke="#FFFFFF" strokeWidth="0.5" />
              </g>
            ))}
          </svg>
        )}

        {visual.effectKey === 'tenis' && (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full z-[2] nz-spin-3s"
            >
              <path d="M16 20 Q34 50 16 80" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M84 20 Q66 50 84 80" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            {/* Bouncing mini tennis ball along the ring */}
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[3]"
              style={{ animation: 'ball-bounce-ring 2.6s linear infinite' }}
            >
              <span className="block w-3 h-3 rounded-full bg-[#BEF264] border border-white shadow-[0_0_6px_#84CC16]" />
            </div>
          </>
        )}

        {visual.effectKey === 'renang' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-4s"
            style={{ filter: 'drop-shadow(0 0 6px #38BDF8)' }}
          >
            <circle
              cx="50"
              cy="50"
              r="44.5"
              fill="none"
              stroke="#E0F2FE"
              strokeWidth="2.2"
              strokeDasharray="10 6 4 6"
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r="41.5"
              fill="none"
              stroke="#7DD3FC"
              strokeWidth="1.4"
              strokeDasharray="6 10"
              strokeLinecap="round"
            />
          </svg>
        )}

        {visual.effectKey === 'esport' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-3s"
            style={{ animation: 'spin 3s linear infinite, neon-blink 1.5s ease-in-out infinite' }}
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#F0ABFC"
              strokeWidth="1.5"
              strokeDasharray="12 5 3 5"
            />
            {[0, 90, 180, 270].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <circle
                  key={deg}
                  cx={50 + Math.cos(rad) * 44}
                  cy={50 + Math.sin(rad) * 44}
                  r="2.4"
                  fill="#EC4899"
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                />
              );
            })}
          </svg>
        )}

        {visual.effectKey === 'ml' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-3s"
            style={{ filter: 'drop-shadow(0 0 6px #FFD60A)' }}
          >
            {[0, 180].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 6.5)`}>
                <polygon points="0,-4.5 1.8,2 -1.8,2" fill="#FEF08A" stroke="#92400E" strokeWidth="0.7" />
                <line x1="-3.5" y1="2" x2="3.5" y2="2" stroke="#D4AF37" strokeWidth="1.4" />
              </g>
            ))}
            {[90, 270].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 6.5)`}>
                <path d="M-5 1 Q0 -3 5 1 Q0 -0.5 -5 1 Z" fill="#FFD60A" stroke="#1E3A8A" strokeWidth="0.6" />
              </g>
            ))}
          </svg>
        )}

        {visual.effectKey === 'ff' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-2s"
            style={{ filter: 'drop-shadow(0 0 6px #FF453A)' }}
          >
            {[0, 90, 180, 270].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <line x1="50" y1="1.5" x2="50" y2="10" stroke="#FEF08A" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="50" cy="6" r="2.6" fill="none" stroke="#FF453A" strokeWidth="1.2" />
              </g>
            ))}
          </svg>
        )}

        {/* RING-ONLY SVG PATTERNS FOR THE 16 NEW BORDERS (Avatar FG stays 100% plain) */}
        {visual.effectKey === 'elegant_gold' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-6s"
            style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.75))' }}
          >
            <circle cx="50" cy="50" r="46.5" fill="none" stroke="#FEF3C7" strokeWidth="1" strokeOpacity="0.9" />
            <circle cx="50" cy="50" r="43.5" fill="none" stroke="#D4AF37" strokeWidth="0.9" strokeDasharray="18 10" />
            {[0, 90, 180, 270].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 45.5;
              const cy = 50 + Math.sin(rad) * 45.5;
              return (
                <g key={deg} transform={`translate(${cx} ${cy}) rotate(${deg})`}>
                  <polygon points="0,-2.6 2.2,0 0,2.6 -2.2,0" fill="#FFFBEB" stroke="#B45309" strokeWidth="0.6" />
                </g>
              );
            })}
          </svg>
        )}

        {visual.effectKey === 'elegant_black' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-6s"
          >
            <circle cx="50" cy="50" r="46.5" fill="none" stroke="#E4E4E7" strokeWidth="1" strokeOpacity="0.85" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="#71717A" strokeWidth="0.8" strokeDasharray="14 8" />
            <path d="M50 3.2 A46.8 46.8 0 0 1 83 17" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}

        {visual.effectKey === 'aesthetic_pink' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-6s"
            style={{ filter: 'drop-shadow(0 0 4px rgba(244,114,182,0.55))' }}
          >
            {[0, 180].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 5.5)`}>
                <circle cx="-2.4" cy="0.5" r="2.2" fill="#FFFFFF" />
                <circle cx="0" cy="-0.8" r="2.7" fill="#FFFFFF" />
                <circle cx="2.5" cy="0.5" r="2.1" fill="#FFFFFF" />
                <rect x="-3.4" y="0.5" width="6.8" height="2.1" rx="1" fill="#FFFFFF" />
              </g>
            ))}
            {[90, 270].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 5.5)`}>
                {[0, 72, 144, 216, 288].map((a) => {
                  const r = (a * Math.PI) / 180;
                  return (
                    <circle
                      key={a}
                      cx={Math.cos(r) * 2.1}
                      cy={Math.sin(r) * 2.1}
                      r="1.4"
                      fill="#FBCFE8"
                    />
                  );
                })}
                <circle cx="0" cy="0" r="1.1" fill="#FDE047" />
              </g>
            ))}
          </svg>
        )}

        {visual.effectKey === 'aesthetic_blue' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-6s"
            style={{ filter: 'drop-shadow(0 0 4px rgba(96,165,250,0.6))' }}
          >
            {[45, 225].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 5.5)`}>
                <circle cx="-2.2" cy="0.5" r="2" fill="#FFFFFF" />
                <circle cx="0" cy="-0.8" r="2.5" fill="#FFFFFF" />
                <circle cx="2.3" cy="0.5" r="1.9" fill="#FFFFFF" />
                <rect x="-3.2" y="0.5" width="6.4" height="2" rx="1" fill="#FFFFFF" />
              </g>
            ))}
            {[135, 315].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 5.5)`}>
                <path
                  d="M0 -3.2 L0.8 -0.8 L3.2 0 L0.8 0.8 L0 3.2 L-0.8 0.8 L-3.2 0 L-0.8 -0.8 Z"
                  fill="#FEF08A"
                />
              </g>
            ))}
          </svg>
        )}

        {visual.effectKey === 'aesthetic_sage' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-6s"
          >
            <circle cx="50" cy="50" r="44.5" fill="none" stroke="#DDECE4" strokeWidth="1.2" strokeDasharray="10 6" />
            {[0, 72, 144, 216, 288].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 5.5)`}>
                <path
                  d="M0 -3.2 C2.2 -2 2.4 1.6 0 3.2 C-2.4 1.6 -2.2 -2 0 -3.2 Z"
                  fill="#6B9080"
                  stroke="#ECFDF5"
                  strokeWidth="0.6"
                />
              </g>
            ))}
          </svg>
        )}

        {visual.effectKey === 'lucu_bear' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] overflow-visible"
          >
            {/* Bear Ears perched on top rim of ring */}
            <g style={{ transformOrigin: '24px 12px', animation: 'ear-wiggle 2.2s ease-in-out infinite' }}>
              <circle cx="22" cy="11" r="8.2" fill="#B47B4C" stroke="#78350F" strokeWidth="1.2" />
              <circle cx="22" cy="11.5" r="4.4" fill="#FDE68A" />
            </g>
            <g style={{ transformOrigin: '76px 12px', animation: 'ear-wiggle 2.2s ease-in-out infinite reverse' }}>
              <circle cx="78" cy="11" r="8.2" fill="#B47B4C" stroke="#78350F" strokeWidth="1.2" />
              <circle cx="78" cy="11.5" r="4.4" fill="#FDE68A" />
            </g>
            {/* Blinking cute mini eyes & pink blush strictly on the top/side RING rim (not FG) */}
            <ellipse
              cx="42"
              cy="6.2"
              rx="1.5"
              ry="1.8"
              fill="#271408"
              style={{ transformOrigin: '42px 6.2px', animation: 'blink-eye 3.2s ease-in-out infinite' }}
            />
            <ellipse
              cx="58"
              cy="6.2"
              rx="1.5"
              ry="1.8"
              fill="#271408"
              style={{ transformOrigin: '58px 6.2px', animation: 'blink-eye 3.2s ease-in-out infinite' }}
            />
            <ellipse cx="35.5" cy="9.2" rx="2.7" ry="1.4" fill="#F472B6" fillOpacity="0.85" />
            <ellipse cx="64.5" cy="9.2" rx="2.7" ry="1.4" fill="#F472B6" fillOpacity="0.85" />
          </svg>
        )}

        {visual.effectKey === 'lucu_cat' && (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full z-[2] overflow-visible"
            >
              {/* Cat Ears on top rim of ring */}
              <g style={{ transformOrigin: '24px 12px', animation: 'ear-wiggle 2s ease-in-out infinite' }}>
                <polygon points="15,17 20,2 32,10" fill="#F472B6" stroke="#BE185D" strokeWidth="1.2" strokeLinejoin="round" />
                <polygon points="18,15 21,5.5 29,10.5" fill="#FCE7F3" />
              </g>
              <g style={{ transformOrigin: '76px 12px', animation: 'ear-wiggle 2s ease-in-out infinite reverse' }}>
                <polygon points="85,17 80,2 68,10" fill="#F472B6" stroke="#BE185D" strokeWidth="1.2" strokeLinejoin="round" />
                <polygon points="82,15 79,5.5 71,10.5" fill="#FCE7F3" />
              </g>
              {/* Tiny cat whiskers on left & right ring edges */}
              <line x1="-1" y1="47" x2="6.5" y2="48.5" stroke="#BE185D" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="-1.5" y1="51.5" x2="6.5" y2="51.5" stroke="#BE185D" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="101" y1="47" x2="93.5" y2="48.5" stroke="#BE185D" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="101.5" y1="51.5" x2="93.5" y2="51.5" stroke="#BE185D" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            {/* Spinning cat tail along ring */}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full z-[2] nz-spin-4s overflow-visible"
            >
              <path
                d="M50 94 Q61 97 65 89 Q68 84 63 82"
                fill="none"
                stroke="#EC4899"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
          </>
        )}

        {visual.effectKey === 'lucu_bunny' && (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full z-[2] overflow-visible"
            >
              {/* Tall Bunny Ears on top rim of ring */}
              <g style={{ transformOrigin: '34px 12px', animation: 'ear-wiggle 2.1s ease-in-out infinite' }}>
                <ellipse cx="32" cy="-2" rx="4.8" ry="12" transform="rotate(-12 32 -2)" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
                <ellipse cx="32" cy="-1.5" rx="2.4" ry="8" transform="rotate(-12 32 -1.5)" fill="#F9A8D4" />
              </g>
              <g style={{ transformOrigin: '66px 12px', animation: 'ear-wiggle 2.1s ease-in-out infinite reverse' }}>
                <ellipse cx="68" cy="-2" rx="4.8" ry="12" transform="rotate(12 68 -2)" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
                <ellipse cx="68" cy="-1.5" rx="2.4" ry="8" transform="rotate(12 68 -1.5)" fill="#F9A8D4" />
              </g>
            </svg>
            {/* Orbiting mini carrot along ring */}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full z-[2] nz-spin-4s overflow-visible"
            >
              <g transform="translate(50 94.5)">
                <polygon points="-2.5,-2 2.5,-2 0,4.5" fill="#F97316" stroke="#C2410C" strokeWidth="0.6" />
                <path d="M0 -2 L-2 -4.5 M0 -2 L0 -5 M0 -2 L2 -4.5" stroke="#22C55E" strokeWidth="1" strokeLinecap="round" />
              </g>
            </svg>
          </>
        )}

        {visual.effectKey === 'couple_king' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] overflow-visible"
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,214,10,0.8))' }}
          >
            {/* Matching Royal Crown on top rim of ring (paired with Couple Queen) */}
            <g transform="translate(50 -2)">
              <path
                d="M-11 7 L-13 -3 L-5.5 2 L0 -6 L5.5 2 L13 -3 L11 7 Z"
                fill="#FFD60A"
                stroke="#92400E"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <rect x="-11" y="6.2" width="22" height="2.6" rx="1" fill="#F59E0B" stroke="#92400E" strokeWidth="0.8" />
              <circle cx="0" cy="2.5" r="1.4" fill="#2563EB" />
            </g>
            {/* Symmetrical paired royal arcs on ring */}
            <path d="M12 36 A43 43 0 0 0 12 64" fill="none" stroke="#FFD60A" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M88 36 A43 43 0 0 1 88 64" fill="none" stroke="#FFD60A" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}

        {visual.effectKey === 'couple_queen' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] overflow-visible"
            style={{ filter: 'drop-shadow(0 0 6px rgba(236,72,153,0.75))' }}
          >
            {/* Matching Queen Tiara Crown on top rim of ring (paired with Couple King) */}
            <g transform="translate(50 -2)">
              <path
                d="M-11 7 L-13 -3 L-5.5 2 L0 -6 L5.5 2 L13 -3 L11 7 Z"
                fill="#F472B6"
                stroke="#9D174D"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <rect x="-11" y="6.2" width="22" height="2.6" rx="1" fill="#FFD60A" stroke="#9D174D" strokeWidth="0.8" />
              <circle cx="0" cy="2.5" r="1.4" fill="#FFF1F2" />
            </g>
            {/* Symmetrical paired arcs + tiny hearts on ring */}
            <path d="M12 36 A43 43 0 0 0 12 64" fill="none" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M88 36 A43 43 0 0 1 88 64" fill="none" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M50 97.5 C46 94 45 91.5 47.2 90 C48.7 89 50 90.4 50 90.4 C50 90.4 51.3 89 52.8 90 C55 91.5 54 94 50 97.5 Z" fill="#FF375F" />
          </svg>
        )}

        {visual.effectKey === 'couple_moon_cowo' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-6s overflow-visible"
            style={{ filter: 'drop-shadow(0 0 6px #FFD60A)' }}
          >
            {/* Crescent Moon on top rim (paired with Moon Cewe Stars) */}
            <g transform="translate(50 4)">
              <path
                d="M2 -4.5 A5.5 5.5 0 1 0 5.5 4.2 A4.2 4.2 0 1 1 2 -4.5 Z"
                fill="#FFD60A"
                stroke="#B45309"
                strokeWidth="0.6"
              />
            </g>
            <circle cx="50" cy="50" r="44" fill="none" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="10 12" />
          </svg>
        )}

        {visual.effectKey === 'couple_moon_cewe' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-6s overflow-visible"
            style={{ filter: 'drop-shadow(0 0 6px #E9D5FF)' }}
          >
            {/* Twinkling Stars matching Moon Cowo */}
            {[0, 90, 180, 270].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 4.5)`}>
                <path
                  d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z"
                  fill="#FEF08A"
                  stroke="#9333EA"
                  strokeWidth="0.5"
                />
              </g>
            ))}
            <circle cx="50" cy="50" r="44" fill="none" stroke="#E9D5FF" strokeWidth="1.1" strokeDasharray="6 14" />
          </svg>
        )}

        {visual.effectKey === 'kpop_lightstick' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] overflow-visible"
          >
            <circle cx="50" cy="50" r="44.5" fill="none" stroke="#FBCFE8" strokeWidth="1.2" strokeDasharray="12 6" />
            {/* Mini Glowing K-Pop Lightstick on top-right rim */}
            <g
              transform="translate(83 17) rotate(32)"
              style={{ animation: 'lightstick-rgb 2.2s linear infinite' }}
            >
              <rect x="-1.4" y="2" width="2.8" height="8" rx="1.2" fill="#FFFFFF" stroke="#EC4899" strokeWidth="0.7" />
              <circle cx="0" cy="-1.5" r="4.2" fill="#F472B6" stroke="#FFFFFF" strokeWidth="1" />
              <path d="M0 -4.2 L0.8 -2 L3 -1.5 L0.8 -0.8 L0 1.4 L-0.8 -0.8 L-3 -1.5 L-0.8 -2 Z" fill="#FFFFFF" />
            </g>
          </svg>
        )}

        {visual.effectKey === 'kpop_pink' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] nz-spin-4s"
            style={{ filter: 'drop-shadow(0 0 5px #EC4899)' }}
          >
            {[0, 180].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 5.5)`}>
                <path
                  d="M0 3.2 C-3.2 0.4 -4 -2 -2 -3.2 C-0.7 -4 0 -2.4 0 -2.4 C0 -2.4 0.7 -4 2 -3.2 C4 -2 3.2 0.4 0 3.2 Z"
                  fill="#FF375F"
                  stroke="#FFFFFF"
                  strokeWidth="0.6"
                />
              </g>
            ))}
            {[90, 270].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50) translate(50 5.5)`}>
                <path d="M0 -3.5 L0.9 -0.9 L3.5 0 L0.9 0.9 L0 3.5 L-0.9 0.9 L-3.5 0 L-0.9 -0.9 Z" fill="#FEF08A" />
              </g>
            ))}
          </svg>
        )}

        {visual.effectKey === 'gamers_neon' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2]"
          >
            {/* Sleek black keyboard keyframe chassis */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="#09090B" strokeWidth="4.2" />
            {/* Spinning RGB neon streak inside black ring */}
            <circle
              cx="50"
              cy="50"
              r="45.5"
              fill="none"
              stroke="url(#nzRgbGrad)"
              strokeWidth="2.2"
              strokeDasharray="24 10"
              strokeLinecap="round"
              className="origin-center nz-spin-2s"
            />
            <defs>
              <linearGradient id="nzRgbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF0055" />
                <stop offset="50%" stopColor="#00FF88" />
                <stop offset="100%" stopColor="#00AAFF" />
              </linearGradient>
            </defs>
          </svg>
        )}

        {visual.effectKey === 'gamers_pro' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full z-[2] overflow-visible"
            style={{ filter: 'drop-shadow(0 0 6px #DC2626)' }}
          >
            {/* Spinning red flame spikes around black-red ring */}
            <g className="origin-center nz-spin-3s">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <g key={deg} transform={`rotate(${deg} 50 50) translate(50 4.5)`}>
                  <path d="M-2.2 2 L0 -3.5 L2.2 2 Z" fill="#FF453A" stroke="#FF9F0A" strokeWidth="0.6" />
                </g>
              ))}
            </g>
            {/* Small golden pro trophy emblem on top rim */}
            <g transform="translate(50 2.5)">
              <path d="M-3.5 -3 L3.5 -3 L2.2 1.5 L-2.2 1.5 Z" fill="#FFD60A" stroke="#92400E" strokeWidth="0.6" />
              <rect x="-1" y="1.5" width="2" height="2.2" fill="#FFD60A" />
              <rect x="-2.6" y="3.5" width="5.2" height="1.3" rx="0.4" fill="#F59E0B" />
            </g>
          </svg>
        )}

        {/* White Glossy Specular Highlight on Top of Main Ring */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full z-[1]"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.12) 40%, rgba(0,0,0,0.28) 100%)',
            maskImage: 'radial-gradient(circle, transparent 58%, black 62%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 58%, black 62%)',
          }}
        />
      </div>

      {/* AVATAR FLOATING LAYER */}
      <div
        className={`relative rounded-full bg-[#0B0B0D] flex items-center justify-center z-[5] ${
          use3dFloat && !paused ? 'nz-avatar-float' : ''
        }`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: use3dFloat ? '0 8px 18px rgba(0,0,0,0.45)' : undefined,
        }}
      >
        {innerAvatar}

        {/* FAIZ GANTENG: Large 👑 3D Crown + Flapping Golden Wings */}
        {visual.effectKey === 'faiz_owner' && (
          <>
            <span
              aria-hidden="true"
              className={`absolute left-1/2 leading-none pointer-events-none select-none z-20 nz-crown-rock ${crownClass}`}
              style={{ filter: 'drop-shadow(0 0 10px rgba(255, 214, 10, 0.95))' }}
            >
              👑
            </span>
            {size >= 56 && (
              <>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 28 34"
                  className="absolute -left-6 top-1/2 -translate-y-1/2 w-7 h-8 z-20 pointer-events-none origin-right"
                  style={{
                    animation: 'flap-left 1.3s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 6px #D4AF37)',
                  }}
                >
                  <path
                    fill="#FFD60A"
                    stroke="#B45309"
                    strokeWidth="1"
                    d="M27 18C18 4 6 0 1 4c5 4 5 8 1 11 5 2 6 5 4 8 6-1 13-2 21-5z"
                  />
                </svg>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 28 34"
                  className="absolute -right-6 top-1/2 -translate-y-1/2 w-7 h-8 z-20 pointer-events-none origin-left"
                  style={{
                    animation: 'flap-right 1.3s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 6px #D4AF37)',
                  }}
                >
                  <path
                    fill="#FFD60A"
                    stroke="#B45309"
                    strokeWidth="1"
                    d="M1 18C10 4 22 0 27 4c-5 4-5 8-1 11-5 2-6 5-4 8-6-1-13-2-21-5z"
                  />
                </svg>
              </>
            )}
          </>
        )}

        {/* SETIA SUNKAT / NONGKRONG: Headset Attached Directly on Avatar */}
        {visual.effectKey === 'setia_nongkrong' && size >= 56 && (
          <svg
            aria-hidden="true"
            viewBox="0 0 88 64"
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-[84px] h-14 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(0 0 6px #0A84FF)' }}
          >
            <path d="M12 40v-6a32 32 0 0 1 64 0v6" fill="none" stroke="#0A84FF" strokeWidth="5" strokeLinecap="round" />
            <rect x="4" y="34" width="11" height="20" rx="5" fill="#1D4ED8" stroke="#64D2FF" strokeWidth="1.5" />
            <rect x="73" y="34" width="11" height="20" rx="5" fill="#1D4ED8" stroke="#64D2FF" strokeWidth="1.5" />
          </svg>
        )}

        {/* UNGU KAWAII: Wiggling Purple Cat Ears on Avatar */}
        {visual.effectKey === 'ungu_kawaii' && size >= 56 && (
          <div
            aria-hidden="true"
            className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 flex justify-between pointer-events-none z-20"
            style={{ animation: 'float 1.8s ease-in-out infinite' }}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 -rotate-12 drop-shadow-[0_0_5px_#A855F7]">
              <polygon points="4,22 10,2 22,18" fill="#A855F7" stroke="#7E22CE" strokeWidth="1.5" />
              <polygon points="8,19 11,7 18,17" fill="#FBCFE8" />
            </svg>
            <svg viewBox="0 0 24 24" className="w-6 h-6 rotate-12 drop-shadow-[0_0_5px_#A855F7]">
              <polygon points="20,22 14,2 2,18" fill="#A855F7" stroke="#7E22CE" strokeWidth="1.5" />
              <polygon points="16,19 13,7 6,17" fill="#FBCFE8" />
            </svg>
          </div>
        )}

        {/* NATAL: Santa Hat Perched on Avatar */}
        {visual.effectKey === 'natal' && size >= 56 && (
          <svg
            aria-hidden="true"
            viewBox="0 0 40 30"
            className="absolute -top-5 left-1/2 -translate-x-1/2 w-9 h-7 z-20 pointer-events-none"
            style={{
              animation: 'float 2s ease-in-out infinite',
              filter: 'drop-shadow(0 2px 5px rgba(220,38,38,0.65))',
            }}
          >
            <path d="M6 23C8 10 18 3 30 7l-6 16H6z" fill="#DC2626" />
            <circle cx="32" cy="8" r="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
            <rect x="4" y="21" width="24" height="6" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
          </svg>
        )}

        {/* GARUDA NUSANTARA: LARGE Flapping Red-White Garuda Wings + Shield */}
        {visual.effectKey === 'garuda_nusantara' && (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 30 36"
              className="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-9 z-20 pointer-events-none origin-right"
              style={{
                animation: 'flap-left 1.4s ease-in-out infinite',
                filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.75))',
              }}
            >
              <path fill="#DC2626" d="M29 18C20 4 7 0 1 4c5 4 5 8 1 11 5 2 6 5 4 8 6-1 14-2 23-5z" />
              <path fill="#FFFFFF" d="M27 19c-7-6-13-8-18-8 3 3 3 5 1 7 4 1 10 1 17 1z" />
            </svg>
            <svg
              aria-hidden="true"
              viewBox="0 0 30 36"
              className="absolute -right-6 top-1/2 -translate-y-1/2 w-8 h-9 z-20 pointer-events-none origin-left"
              style={{
                animation: 'flap-right 1.4s ease-in-out infinite',
                filter: 'drop-shadow(0 0 6px rgba(220,38,38,0.75))',
              }}
            >
              <path fill="#DC2626" d="M1 18C10 4 23 0 29 4c-5 4-5 8-1 11-5 2-6 5-4 8-6-1-14-2-23-5z" />
              <path fill="#FFFFFF" d="M3 19c7-6 13-8 18-8-3 3-3 5-1 7-4 1-10 1-17 1z" />
            </svg>
            {size >= 56 && (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 28"
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-7 z-20 pointer-events-none"
                style={{ filter: 'drop-shadow(0 2px 5px rgba(220,38,38,0.6))' }}
              >
                <path d="M12 2l9 4v8c0 6-4 10-9 12-5-2-9-6-9-12V6l9-4z" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.5" />
                <path d="M4 14h16c-.5 5-4 8.5-8 10-4-1.5-7.5-5-8-10z" fill="#FFFFFF" />
              </svg>
            )}
          </>
        )}

        {/* API PHOENIX 3D: Flapping Phoenix Bird + Long Fire Tail */}
        {visual.effectKey === 'api_phoenix' && (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 32 38"
              className="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-9 z-20 pointer-events-none origin-right"
              style={{
                animation: 'flap-left 1s ease-in-out infinite',
                filter: 'drop-shadow(0 0 8px #FF453A)',
              }}
            >
              <path fill="#FF453A" d="M31 20C21 4 7 0 1 5c5 4 5 8 0 12 6 2 7 5 4 9 7-1 16-2 26-6z" />
              <path fill="#FFD60A" d="M27 20c-7-9-13-11-18-8 3 3 3 5 0 8 4 1 11 1 18 0z" />
            </svg>
            <svg
              aria-hidden="true"
              viewBox="0 0 32 38"
              className="absolute -right-6 top-1/2 -translate-y-1/2 w-8 h-9 z-20 pointer-events-none origin-left"
              style={{
                animation: 'flap-right 1s ease-in-out infinite',
                filter: 'drop-shadow(0 0 8px #FF453A)',
              }}
            >
              <path fill="#FF453A" d="M1 20C11 4 25 0 31 5c-5 4-5 8 0 12-6 2-7 5-4 9-7-1-16-2-26-6z" />
              <path fill="#FFD60A" d="M5 20c7-9 13-11 18-8-3 3-3 5 0 8-4 1-11 1-18 0z" />
            </svg>
          </>
        )}

        {/* NAGA: Green Dragon Head with Glowing Eyes on Top */}
        {visual.effectKey === 'naga' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 36 26"
            className="absolute -top-5 left-1/2 -translate-x-1/2 w-9 h-7 z-20 pointer-events-none"
            style={{
              animation: 'float 2s ease-in-out infinite',
              filter: 'drop-shadow(0 0 7px #10B981)',
            }}
          >
            <path fill="#059669" stroke="#064E3B" strokeWidth="1" d="M8 22L4 8l7 4L18 3l7 9 7-4-4 14H8z" />
            <circle cx="13" cy="14" r="2.2" fill="#A3E635" />
            <circle cx="23" cy="14" r="2.2" fill="#A3E635" />
            <circle cx="13" cy="14" r="1" fill="#FEF08A" />
            <circle cx="23" cy="14" r="1" fill="#FEF08A" />
          </svg>
        )}

        {/* LEGENDA: Large Gold Crown */}
        {visual.effectKey === 'legenda_nongkrong' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 32 20"
            className="absolute -top-5 left-1/2 w-8 h-5 z-20 pointer-events-none nz-crown-rock"
            style={{ filter: 'drop-shadow(0 0 8px #D97706)' }}
          >
            <path fill="#FFD60A" stroke="#92400E" strokeWidth="1.2" d="M3 18L1 5l8 5.5L16 1l7 9.5L31 5l-2 13H3z" />
            <circle cx="16" cy="11" r="2" fill="#FFFBEB" />
          </svg>
        )}

        {/* SULTAN: Sultan Luxury Gold Crown */}
        {visual.effectKey === 'sultan' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 32 22"
            className="absolute -top-5 left-1/2 w-8 h-5 z-20 pointer-events-none nz-crown-rock"
            style={{ filter: 'drop-shadow(0 0 8px #D97706)' }}
          >
            <path fill="#F59E0B" stroke="#78350F" strokeWidth="1.2" d="M4 19C4 8 10 3 16 3s12 5 12 16H4z" />
            <rect x="3" y="16" width="26" height="4" rx="2" fill="#FFD60A" stroke="#78350F" strokeWidth="1" />
            <polygon points="16,6 19,10 16,14 13,10" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="0.8" />
          </svg>
        )}

        {/* KRISTAL ES 3D: Sparkling Ice Crown */}
        {visual.effectKey === 'kristal_es' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 32 20"
            className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-5 z-20 pointer-events-none"
            style={{
              animation: 'twinkle 1.8s ease-in-out infinite',
              filter: 'drop-shadow(0 0 7px #38BDF8)',
            }}
          >
            <polygon points="4,18 7,7 12,13 16,2 20,13 25,7 28,18" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.2" />
            <polygon points="16,2 18,13 16,18 14,13" fill="#FFFFFF" fillOpacity="0.7" />
          </svg>
        )}

        {/* LEBARAN: Spinning Ketupat */}
        {visual.effectKey === 'lebaran' && (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="absolute -top-5 left-1/2 -translate-x-1/2 w-6 h-6 z-20 pointer-events-none nz-spin-4s"
            style={{ filter: 'drop-shadow(0 0 6px #FFD60A)' }}
          >
            <polygon points="12,2 22,12 12,22 2,12" fill="#16A34A" stroke="#FFD60A" strokeWidth="1.8" />
            <line x1="7" y1="7" x2="17" y2="17" stroke="#FFD60A" strokeWidth="1.3" />
            <line x1="17" y1="7" x2="7" y2="17" stroke="#FFD60A" strokeWidth="1.3" />
          </svg>
        )}

        {/* KEMERDEKAAN: Waving Red-White Flag */}
        {visual.effectKey === 'kemerdekaan' && size >= 56 && (
          <svg
            aria-hidden="true"
            viewBox="0 0 32 22"
            className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-6 z-20 pointer-events-none"
            style={{
              animation: 'wave 1.2s ease-in-out infinite',
              filter: 'drop-shadow(0 2px 5px rgba(220,38,38,0.6))',
            }}
          >
            <rect x="3" y="2" width="2" height="19" fill="#9CA3AF" rx="1" />
            <rect x="5" y="3" width="23" height="7" fill="#DC2626" />
            <rect x="5" y="10" width="23" height="7" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="0.6" />
          </svg>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] active:scale-[0.97] transition-transform duration-150"
        aria-label={`Buka profil ${player?.username || 'pengguna'}`}
      >
        {renderedAvatar}
      </button>
    );
  }

  return renderedAvatar;
};

export const Avatar = React.memo(AvatarComponent);
