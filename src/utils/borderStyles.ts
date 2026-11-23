import type { BorderItem } from '../types';

export type BorderEffectKey =
  | 'default'
  | 'pemula'
  | 'rajin_nongkrong'
  | 'semangat_bara'
  | 'setia_nongkrong'
  | 'garuda_nusantara'
  | 'lebaran'
  | 'tahun_baru'
  | 'natal'
  | 'halloween'
  | 'valentine'
  | 'kemerdekaan'
  | 'pinky_candy'
  | 'ungu_kawaii'
  | 'aurora_borealis'
  | 'kristal_es'
  | 'luar_angkasa'
  | 'cyber_blue'
  | 'galaxy'
  | 'legenda_nongkrong'
  | 'api_phoenix'
  | 'naga'
  | 'sultan'
  | 'faiz_owner'
  | 'faiz_spiderman'
  | 'ironman'
  | 'batman'
  | 'bola'
  | 'basket'
  | 'voli'
  | 'badminton'
  | 'tenis'
  | 'renang'
  | 'esport'
  | 'ml'
  | 'ff'
  | 'elegant_gold'
  | 'elegant_black'
  | 'aesthetic_pink'
  | 'aesthetic_blue'
  | 'aesthetic_sage'
  | 'lucu_bear'
  | 'lucu_cat'
  | 'lucu_bunny'
  | 'couple_king'
  | 'couple_queen'
  | 'couple_moon_cowo'
  | 'couple_moon_cewe'
  | 'kpop_lightstick'
  | 'kpop_pink'
  | 'gamers_neon'
  | 'gamers_pro';

export interface ResolvedBorderVisual {
  effectKey: BorderEffectKey;
  primaryColor: string;
  secondaryColor: string;
  conicGradient: string;
  outerRingColor: string;
  outerRingPattern: 'dashed' | 'dotted';
  dashed: boolean;
  spinClass: string;
  outerSpinClass: string;
  glowColor: string;
  ambientGlowBg: string;
  ringShadow: string;
  cardBgGradient: string;
  bokehTint: string;
  cardHoverShadow: string;
  isThickGlow: boolean;
  isFaizOwner: boolean;
  isOwnerBadge: boolean;
  isAurora: boolean;
  isHeartbeat: boolean;
  isGlitch: boolean;
}

function detectEffectKey(
  border?: Pick<BorderItem, 'id' | 'name' | 'is_owner_only'> | null,
  forceOwner = false
): BorderEffectKey {
  const upperId = String(border?.id || '').toUpperCase();
  const upperName = String(border?.name || '').toUpperCase();

  if (
    upperId === 'FAIZ_SPIDERMAN' ||
    upperName === 'FAIZ SPIDERMAN' ||
    upperName.includes('SPIDERMAN')
  ) {
    return 'faiz_spiderman';
  }
  if (forceOwner || border?.is_owner_only || upperId === 'FAIZ_OWNER' || upperName === 'FAIZ GANTENG') {
    return 'faiz_owner';
  }
  if (!border) return 'default';

  if (upperName.includes('PEMULA') || upperId === 'PEMULA') return 'pemula';
  if (upperName.includes('RAJIN') || upperId.includes('RAJIN')) return 'rajin_nongkrong';
  if (upperName.includes('SEMANGAT') || upperId.includes('SEMANGAT')) return 'semangat_bara';
  if (upperName.includes('SETIA') || upperId.includes('SETIA')) return 'setia_nongkrong';
  if (upperName.includes('GARUDA') || upperId.includes('GARUDA')) return 'garuda_nusantara';
  if (upperName.includes('LEBARAN') || upperId.includes('LEBARAN')) return 'lebaran';
  if (upperName.includes('TAHUN BARU') || upperId.includes('TAHUN_BARU')) return 'tahun_baru';
  if (upperName.includes('NATAL') || upperId.includes('NATAL')) return 'natal';
  if (upperName.includes('HALLOWEEN') || upperId.includes('HALLOWEEN')) return 'halloween';
  if (upperName.includes('VALENTINE') || upperId.includes('VALENTINE')) return 'valentine';
  if (upperName.includes('KEMERDEKAAN') || upperId.includes('KEMERDEKAAN')) return 'kemerdekaan';
  if (upperName.includes('PINKY') || upperId.includes('PINKY')) return 'pinky_candy';
  if (upperName.includes('UNGU') || upperId.includes('UNGU')) return 'ungu_kawaii';
  if (upperName.includes('AURORA') || upperId.includes('AURORA')) return 'aurora_borealis';
  if (upperName.includes('KRISTAL') || upperId.includes('KRISTAL')) return 'kristal_es';
  if (upperName.includes('LUAR ANGKASA') || upperId.includes('LUAR_ANGKASA')) return 'luar_angkasa';
  if (upperName.includes('CYBER') || upperId.includes('CYBER')) return 'cyber_blue';
  if (upperName.includes('GALAXY') || upperId.includes('GALAXY')) return 'galaxy';
  if (upperName.includes('LEGENDA') || upperId.includes('LEGENDA')) return 'legenda_nongkrong';
  if (upperName.includes('PHOENIX') || upperId.includes('PHOENIX')) return 'api_phoenix';
  if (upperName.includes('NAGA') || upperId === 'NAGA') return 'naga';
  if (upperName.includes('SULTAN') || upperId === 'SULTAN') return 'sultan';
  if (upperId === 'IRONMAN' || upperName === 'IRONMAN') return 'ironman';
  if (upperId === 'BATMAN' || upperName === 'BATMAN') return 'batman';
  if (upperId === 'BOLA' || upperName === 'BOLA') return 'bola';
  if (upperId === 'BASKET' || upperName === 'BASKET') return 'basket';
  if (upperId === 'VOLI' || upperName === 'VOLI') return 'voli';
  if (upperId === 'BADMINTON' || upperName === 'BADMINTON') return 'badminton';
  if (upperId === 'TENIS' || upperName === 'TENIS') return 'tenis';
  if (upperId === 'RENANG' || upperName === 'RENANG') return 'renang';
  if (upperId === 'ESPORT' || upperName === 'E-SPORT' || upperName === 'ESPORT') return 'esport';
  if (upperId === 'ML' || upperName === 'ML') return 'ml';
  if (upperId === 'FF' || upperName === 'FF') return 'ff';

  if (upperId === 'ELEGANT_GOLD' || upperName === 'ELEGANT GOLD') return 'elegant_gold';
  if (upperId === 'ELEGANT_BLACK' || upperName === 'ELEGANT BLACK') return 'elegant_black';
  if (upperId === 'AESTHETIC_PINK' || upperName === 'AESTHETIC PINK') return 'aesthetic_pink';
  if (upperId === 'AESTHETIC_BLUE' || upperName === 'AESTHETIC BLUE') return 'aesthetic_blue';
  if (upperId === 'AESTHETIC_SAGE' || upperName === 'AESTHETIC SAGE') return 'aesthetic_sage';
  if (upperId === 'LUCU_BEAR' || upperName === 'LUCU BEAR') return 'lucu_bear';
  if (upperId === 'LUCU_CAT' || upperName === 'LUCU CAT') return 'lucu_cat';
  if (upperId === 'LUCU_BUNNY' || upperName === 'LUCU BUNNY') return 'lucu_bunny';
  if (upperId === 'COUPLE_KING' || upperName === 'COUPLE KING') return 'couple_king';
  if (upperId === 'COUPLE_QUEEN' || upperName === 'COUPLE QUEEN') return 'couple_queen';
  if (upperId === 'COUPLE_MOON_COWO' || upperName === 'COUPLE MOON COWO') return 'couple_moon_cowo';
  if (upperId === 'COUPLE_MOON_CEWE' || upperName === 'COUPLE MOON CEWE') return 'couple_moon_cewe';
  if (upperId === 'KPOP_LIGHTSTICK' || upperName === 'KPOP LIGHTSTICK') return 'kpop_lightstick';
  if (upperId === 'KPOP_PINK' || upperName === 'KPOP PINK') return 'kpop_pink';
  if (upperId === 'GAMERS_NEON' || upperName === 'GAMERS NEON') return 'gamers_neon';
  if (upperId === 'GAMERS_PRO' || upperName === 'GAMERS PRO') return 'gamers_pro';

  return 'default';
}

function extractPrimaryHex(input?: string | null): string | null {
  if (!input) return null;
  const match = input.match(/#[0-9a-fA-F]{3,8}/);
  return match ? match[0] : null;
}

function buildVisual(
  effectKey: BorderEffectKey,
  primary: string,
  secondary: string,
  conicGradient: string,
  cardTintHex: string,
  opts: {
    outerRingColor?: string;
    outerRingPattern?: 'dashed' | 'dotted';
    dashed?: boolean;
    spinClass?: string;
    outerSpinClass?: string;
    isThickGlow?: boolean;
    isFaizOwner?: boolean;
    isOwnerBadge?: boolean;
    isAurora?: boolean;
    isHeartbeat?: boolean;
    isGlitch?: boolean;
  } = {}
): ResolvedBorderVisual {
  const isThickGlow = Boolean(opts.isThickGlow);
  const outerGlow = isThickGlow
    ? `0 0 18px ${primary}DD, 0 0 32px ${primary}77, 0 0 10px ${secondary}AA`
    : `0 0 14px ${primary}CC, 0 0 24px ${primary}66, 0 0 8px ${secondary}88`;

  return {
    effectKey,
    primaryColor: primary,
    secondaryColor: secondary,
    conicGradient,
    outerRingColor: opts.outerRingColor || primary,
    outerRingPattern: opts.outerRingPattern || 'dashed',
    dashed: Boolean(opts.dashed),
    spinClass: opts.spinClass || 'nz-spin-3s',
    outerSpinClass: opts.outerSpinClass || 'nz-spin-reverse',
    glowColor: primary,
    ambientGlowBg: `radial-gradient(circle, ${primary}DD 0%, ${secondary}88 45%, transparent 74%)`,
    ringShadow: `inset 0 3px 5px rgba(255,255,255,0.85), inset 0 -3px 5px rgba(0,0,0,0.45), ${outerGlow}`,
    cardBgGradient: `linear-gradient(155deg, #FFFFFF 0%, #FFFFFF 45%, ${cardTintHex} 100%)`,
    bokehTint: `${primary}22`,
    cardHoverShadow: `0 18px 36px -4px ${primary}77, 0 8px 20px rgba(0,0,0,0.25)`,
    isThickGlow,
    isFaizOwner: Boolean(opts.isFaizOwner),
    isOwnerBadge: Boolean(opts.isOwnerBadge ?? opts.isFaizOwner),
    isAurora: Boolean(opts.isAurora),
    isHeartbeat: Boolean(opts.isHeartbeat),
    isGlitch: Boolean(opts.isGlitch),
  };
}

export function resolveBorderVisual(
  border?: Pick<BorderItem, 'id' | 'name' | 'css_ring' | 'price_coins' | 'is_owner_only'> | null,
  forceOwner = false
): ResolvedBorderVisual {
  const effectKey = detectEffectKey(border, forceOwner);
  const price = Number(border?.price_coins || 0);
  const hexFromDb = extractPrimaryHex(border?.css_ring);

  switch (effectKey) {
    case 'faiz_owner':
      return buildVisual(
        'faiz_owner',
        '#D4AF37',
        '#8B5CF6',
        'conic-gradient(from 0deg, #D4AF37, #FF9F0A, #FEF08A, #8B5CF6, #FF9F0A, #D4AF37)',
        '#FEF3C7',
        {
          outerRingColor: '#FFD60A',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-2s',
          outerSpinClass: 'nz-spin-reverse',
          isThickGlow: true,
          isFaizOwner: true,
        }
      );

    case 'pemula':
      return buildVisual(
        'pemula',
        '#71717A',
        '#E4E4E7',
        'conic-gradient(from 0deg, #52525B, #E4E4E7, #FFFFFF, #71717A, #D4D4D8, #52525B)',
        '#F4F4F5',
        {
          outerRingColor: '#A1A1AA',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-4s',
          outerSpinClass: 'nz-spin-6s',
        }
      );

    case 'rajin_nongkrong':
      return buildVisual(
        'rajin_nongkrong',
        '#16A34A',
        '#86EFAC',
        'conic-gradient(from 0deg, #15803D, #30D158, #DCFCE7, #22C55E, #15803D)',
        '#ECFDF5',
        {
          outerRingColor: '#30D158',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-3s',
          isThickGlow: true,
        }
      );

    case 'semangat_bara':
      return buildVisual(
        'semangat_bara',
        '#FF9F0A',
        '#FF453A',
        'conic-gradient(from 0deg, #EA580C, #FF9F0A, #FEF08A, #FF453A, #EA580C)',
        '#FFF7ED',
        {
          outerRingColor: '#FF453A',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-2s',
        }
      );

    case 'setia_nongkrong':
      return buildVisual(
        'setia_nongkrong',
        '#0A84FF',
        '#64D2FF',
        'conic-gradient(from 0deg, #0A84FF, #64D2FF, #1D4ED8, #38BDF8, #0A84FF)',
        '#EFF6FF',
        {
          outerRingColor: '#0A84FF',
          outerRingPattern: 'dotted',
          dashed: true,
          spinClass: 'nz-spin-4s',
        }
      );

    case 'garuda_nusantara':
      return buildVisual(
        'garuda_nusantara',
        '#FF453A',
        '#E5E7EB',
        'conic-gradient(from 0deg, #FF453A 0deg 90deg, #FFFFFF 90deg 180deg, #DC2626 180deg 270deg, #FFFFFF 270deg 360deg)',
        '#FEF2F2',
        {
          outerRingColor: '#FF453A',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-4s',
        }
      );

    case 'lebaran':
      return buildVisual(
        'lebaran',
        '#16A34A',
        '#FFD60A',
        'conic-gradient(from 0deg, #15803D, #30D158, #FFD60A, #4ADE80, #FFD60A, #15803D)',
        '#F0FDF4',
        {
          outerRingColor: '#FFD60A',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-4s',
        }
      );

    case 'tahun_baru':
      return buildVisual(
        'tahun_baru',
        '#D97706',
        '#FFD60A',
        'conic-gradient(from 0deg, #B45309, #FFD60A, #FEF08A, #F59E0B, #B45309)',
        '#FEFCE8',
        {
          outerRingColor: '#F59E0B',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-3s',
        }
      );

    case 'natal':
      return buildVisual(
        'natal',
        '#DC2626',
        '#16A34A',
        'conic-gradient(from 0deg, #FF453A 0deg 60deg, #30D158 60deg 120deg, #FFFFFF 120deg 180deg, #FF453A 180deg 240deg, #30D158 240deg 300deg, #FFD60A 300deg 360deg)',
        '#FEF2F2',
        {
          outerRingColor: '#16A34A',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-4s',
        }
      );

    case 'halloween':
      return buildVisual(
        'halloween',
        '#EA580C',
        '#9333EA',
        'conic-gradient(from 0deg, #FF9F0A, #EA580C, #BF5AF2, #6B21A8, #FF9F0A)',
        '#FAF5FF',
        {
          outerRingColor: '#9333EA',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-3s',
        }
      );

    case 'valentine':
      return buildVisual(
        'valentine',
        '#FF375F',
        '#FB7185',
        'conic-gradient(from 0deg, #FF375F, #FDA4AF, #E11D48, #FF85A1, #FF375F)',
        '#FFF1F2',
        {
          outerRingColor: '#FF375F',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-3s',
          isHeartbeat: true,
        }
      );

    case 'kemerdekaan':
      return buildVisual(
        'kemerdekaan',
        '#DC2626',
        '#E5E7EB',
        'conic-gradient(from 0deg, #FF453A, #FFFFFF, #DC2626, #FFFFFF, #FF453A)',
        '#FEF2F2',
        {
          outerRingColor: '#DC2626',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-3s',
        }
      );

    case 'pinky_candy':
      return buildVisual(
        'pinky_candy',
        '#EC4899',
        '#F9A8D4',
        'conic-gradient(from 0deg, #FF375F, #FBCFE8, #FF6B9D, #FFFFFF, #FF375F)',
        '#FDF2F8',
        {
          outerRingColor: '#F472B6',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-3s',
        }
      );

    case 'ungu_kawaii':
      return buildVisual(
        'ungu_kawaii',
        '#A855F7',
        '#DDD6FE',
        'conic-gradient(from 0deg, #A855F7, #F5D0FE, #C084FC, #EDE9FE, #A855F7)',
        '#F5F3FF',
        {
          outerRingColor: '#C084FC',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-4s',
        }
      );

    case 'aurora_borealis':
      return buildVisual(
        'aurora_borealis',
        '#06B6D4',
        '#BF5AF2',
        'conic-gradient(from 0deg, #64D2FF, #34D399, #BF5AF2, #FF375F, #64D2FF)',
        '#ECFEFF',
        {
          outerRingColor: '#34D399',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-3s',
          isAurora: true,
        }
      );

    case 'kristal_es':
      return buildVisual(
        'kristal_es',
        '#0284C7',
        '#5E5CE6',
        'conic-gradient(from 0deg, #38BDF8, #E0F2FE, #5E5CE6, #BAE6FD, #38BDF8)',
        '#F0F9FF',
        {
          outerRingColor: '#38BDF8',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-3s',
        }
      );

    case 'luar_angkasa':
      return buildVisual(
        'luar_angkasa',
        '#4F46E5',
        '#0A84FF',
        'conic-gradient(from 0deg, #312E81, #5E5CE6, #0A84FF, #BF5AF2, #312E81)',
        '#EEF2FF',
        {
          outerRingColor: '#0A84FF',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-4s',
        }
      );

    case 'cyber_blue':
      return buildVisual(
        'cyber_blue',
        '#0284C7',
        '#00F0FF',
        'conic-gradient(from 0deg, #0A84FF, #00F0FF, #1D4ED8, #64D2FF, #0A84FF)',
        '#ECFEFF',
        {
          outerRingColor: '#00F0FF',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-2s',
          isGlitch: true,
        }
      );

    case 'galaxy':
      return buildVisual(
        'galaxy',
        '#9333EA',
        '#5E5CE6',
        'conic-gradient(from 0deg, #6D28D9, #BF5AF2, #EC4899, #3B82F6, #6D28D9)',
        '#F5EDFF',
        {
          outerRingColor: '#A855F7',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-6s',
          isThickGlow: true,
        }
      );

    case 'legenda_nongkrong':
      return buildVisual(
        'legenda_nongkrong',
        '#D97706',
        '#FFD60A',
        'conic-gradient(from 0deg, #92400E, #FFD60A, #FEF08A, #F59E0B, #92400E)',
        '#FEF9C3',
        {
          outerRingColor: '#FFD60A',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-3s',
          outerSpinClass: 'nz-spin-reverse',
          isThickGlow: true,
        }
      );

    case 'api_phoenix':
      return buildVisual(
        'api_phoenix',
        '#DC2626',
        '#FF9F0A',
        'conic-gradient(from 0deg, #DC2626, #FF453A, #FF9F0A, #FDE047, #DC2626)',
        '#FFF4ED',
        {
          outerRingColor: '#FF453A',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-2s',
          isThickGlow: true,
        }
      );

    case 'naga':
      return buildVisual(
        'naga',
        '#059669',
        '#A3E635',
        'conic-gradient(from 0deg, #065F46, #30D158, #A3E635, #10B981, #065F46)',
        '#ECFDF5',
        {
          outerRingColor: '#10B981',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-3s',
          isThickGlow: true,
        }
      );

    case 'sultan':
      return buildVisual(
        'sultan',
        '#D97706',
        '#FFD60A',
        'conic-gradient(from 0deg, #78350F, #FFD60A, #FFFBEB, #F59E0B, #D4AF37, #78350F)',
        '#FEF3C7',
        {
          outerRingColor: '#F59E0B',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-2s',
          isThickGlow: true,
        }
      );

    case 'faiz_spiderman':
      return buildVisual(
        'faiz_spiderman',
        '#EF4444',
        '#2563EB',
        'conic-gradient(from 0deg, #DC2626 0deg 172deg, #2563EB 180deg 352deg, #DC2626 360deg)',
        '#EFF6FF',
        {
          outerRingColor: '#3B82F6',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-6s',
          outerSpinClass: 'nz-spin-reverse',
          isThickGlow: true,
          isOwnerBadge: true,
        }
      );

    case 'ironman':
      return buildVisual(
        'ironman',
        '#DC2626',
        '#FFD60A',
        'conic-gradient(from 0deg, #B91C1C, #FFD60A, #DC2626, #38BDF8, #FFD60A, #B91C1C)',
        '#FEF2F2',
        {
          outerRingColor: '#38BDF8',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-3s',
          isThickGlow: true,
        }
      );

    case 'batman':
      return buildVisual(
        'batman',
        '#FACC15',
        '#18181B',
        'conic-gradient(from 0deg, #111113, #FACC15, #27272A, #EAB308, #111113)',
        '#FEFCE8',
        {
          outerRingColor: '#FACC15',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-4s',
          isThickGlow: true,
        }
      );

    case 'bola':
      return buildVisual(
        'bola',
        '#111113',
        '#E4E4E7',
        'conic-gradient(from 0deg, #FFFFFF 0deg 60deg, #111113 60deg 120deg, #FFFFFF 120deg 180deg, #111113 180deg 240deg, #FFFFFF 240deg 300deg, #111113 300deg 360deg)',
        '#F4F4F5',
        {
          outerRingColor: '#27272A',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-3s',
        }
      );

    case 'basket':
      return buildVisual(
        'basket',
        '#F97316',
        '#18181B',
        'conic-gradient(from 0deg, #EA580C, #FB923C, #18181B, #F97316, #EA580C)',
        '#FFF7ED',
        {
          outerRingColor: '#EA580C',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-4s',
        }
      );

    case 'voli':
      return buildVisual(
        'voli',
        '#2563EB',
        '#FACC15',
        'conic-gradient(from 0deg, #FFFFFF 0deg 120deg, #FACC15 120deg 240deg, #2563EB 240deg 360deg)',
        '#FEFCE8',
        {
          outerRingColor: '#2563EB',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-4s',
        }
      );

    case 'badminton':
      return buildVisual(
        'badminton',
        '#16A34A',
        '#DCFCE7',
        'conic-gradient(from 0deg, #FFFFFF, #22C55E, #DCFCE7, #16A34A, #FFFFFF)',
        '#F0FDF4',
        {
          outerRingColor: '#22C55E',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-4s',
        }
      );

    case 'tenis':
      return buildVisual(
        'tenis',
        '#84CC16',
        '#FEF08A',
        'conic-gradient(from 0deg, #65A30D, #BEF264, #FFFFFF, #A3E635, #65A30D)',
        '#F7FEE7',
        {
          outerRingColor: '#65A30D',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-3s',
        }
      );

    case 'renang':
      return buildVisual(
        'renang',
        '#0284C7',
        '#7DD3FC',
        'conic-gradient(from 0deg, #0369A1, #38BDF8, #BAE6FD, #0284C7, #0369A1)',
        '#F0F9FF',
        {
          outerRingColor: '#38BDF8',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-4s',
        }
      );

    case 'esport':
      return buildVisual(
        'esport',
        '#A855F7',
        '#EC4899',
        'conic-gradient(from 0deg, #7C3AED, #EC4899, #C084FC, #F472B6, #7C3AED)',
        '#FAF5FF',
        {
          outerRingColor: '#EC4899',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-2s',
          isThickGlow: true,
        }
      );

    case 'ml':
      return buildVisual(
        'ml',
        '#D4AF37',
        '#1E3A8A',
        'conic-gradient(from 0deg, #1E3A8A, #FFD60A, #1D4ED8, #F59E0B, #1E3A8A)',
        '#EFF6FF',
        {
          outerRingColor: '#FFD60A',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-3s',
          isThickGlow: true,
        }
      );

    case 'ff':
      return buildVisual(
        'ff',
        '#FF453A',
        '#FF9F0A',
        'conic-gradient(from 0deg, #DC2626, #FF9F0A, #FACC15, #FF453A, #DC2626)',
        '#FFF7ED',
        {
          outerRingColor: '#FF9F0A',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-2s',
          isThickGlow: true,
        }
      );

    case 'elegant_gold':
      return buildVisual(
        'elegant_gold',
        '#D4AF37',
        '#FEF3C7',
        'conic-gradient(from 0deg, #92400E, #FDE68A, #D4AF37, #FFFBEB, #B45309, #FDE68A, #92400E)',
        '#FFFBEB',
        {
          outerRingColor: '#D4AF37',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-6s',
          outerSpinClass: 'nz-spin-reverse',
        }
      );

    case 'elegant_black':
      return buildVisual(
        'elegant_black',
        '#52525B',
        '#E4E4E7',
        'conic-gradient(from 0deg, #09090B, #27272A, #E4E4E7, #18181B, #A1A1AA, #09090B)',
        '#F4F4F5',
        {
          outerRingColor: '#A1A1AA',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-6s',
          outerSpinClass: 'nz-spin-reverse',
        }
      );

    case 'aesthetic_pink':
      return buildVisual(
        'aesthetic_pink',
        '#F472B6',
        '#FBCFE8',
        'conic-gradient(from 0deg, #F9A8D4, #FCE7F3, #F472B6, #FFF1F2, #F9A8D4)',
        '#FDF2F8',
        {
          outerRingColor: '#F9A8D4',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-6s',
        }
      );

    case 'aesthetic_blue':
      return buildVisual(
        'aesthetic_blue',
        '#60A5FA',
        '#BAE6FD',
        'conic-gradient(from 0deg, #93C5FD, #E0F2FE, #60A5FA, #F0F9FF, #93C5FD)',
        '#EFF6FF',
        {
          outerRingColor: '#93C5FD',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-6s',
        }
      );

    case 'aesthetic_sage':
      return buildVisual(
        'aesthetic_sage',
        '#6B9080',
        '#CCE3DE',
        'conic-gradient(from 0deg, #6B9080, #A4C3B2, #EAF4F4, #84A98C, #6B9080)',
        '#ECFDF5',
        {
          outerRingColor: '#84A98C',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-6s',
        }
      );

    case 'lucu_bear':
      return buildVisual(
        'lucu_bear',
        '#B47B4C',
        '#E6B89C',
        'conic-gradient(from 0deg, #A47148, #D4A373, #FAEDCD, #C68B59, #A47148)',
        '#FEF3C7',
        {
          outerRingColor: '#D4A373',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-6s',
        }
      );

    case 'lucu_cat':
      return buildVisual(
        'lucu_cat',
        '#F472B6',
        '#FBCFE8',
        'conic-gradient(from 0deg, #EC4899, #FBCFE8, #FFFFFF, #F472B6, #EC4899)',
        '#FDF2F8',
        {
          outerRingColor: '#F472B6',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-4s',
        }
      );

    case 'lucu_bunny':
      return buildVisual(
        'lucu_bunny',
        '#E5E7EB',
        '#FBCFE8',
        'conic-gradient(from 0deg, #FFFFFF, #FCE7F3, #E5E7EB, #FFFFFF, #FDE68A, #FFFFFF)',
        '#FFF1F2',
        {
          outerRingColor: '#F9A8D4',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-6s',
        }
      );

    case 'couple_king':
      return buildVisual(
        'couple_king',
        '#1D4ED8',
        '#FFD60A',
        'conic-gradient(from 0deg, #1E3A8A, #2563EB, #FFD60A, #3B82F6, #1E40AF, #1E3A8A)',
        '#EFF6FF',
        {
          outerRingColor: '#FFD60A',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-4s',
          isThickGlow: true,
        }
      );

    case 'couple_queen':
      return buildVisual(
        'couple_queen',
        '#EC4899',
        '#FFD60A',
        'conic-gradient(from 0deg, #DB2777, #F472B6, #FFD60A, #F9A8D4, #EC4899, #DB2777)',
        '#FDF2F8',
        {
          outerRingColor: '#FFD60A',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-4s',
          isThickGlow: true,
        }
      );

    case 'couple_moon_cowo':
      return buildVisual(
        'couple_moon_cowo',
        '#1E3A8A',
        '#38BDF8',
        'conic-gradient(from 0deg, #0F172A, #1E3A8A, #38BDF8, #1D4ED8, #0F172A)',
        '#EFF6FF',
        {
          outerRingColor: '#38BDF8',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-6s',
          isThickGlow: true,
        }
      );

    case 'couple_moon_cewe':
      return buildVisual(
        'couple_moon_cewe',
        '#A855F7',
        '#E9D5FF',
        'conic-gradient(from 0deg, #9333EA, #D8B4FE, #F5D0FE, #A855F7, #9333EA)',
        '#FAF5FF',
        {
          outerRingColor: '#C084FC',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-6s',
          isThickGlow: true,
        }
      );

    case 'kpop_lightstick':
      return buildVisual(
        'kpop_lightstick',
        '#EC4899',
        '#FFFFFF',
        'conic-gradient(from 0deg, #FFFFFF, #F472B6, #38BDF8, #A855F7, #FFFFFF, #EC4899)',
        '#FDF2F8',
        {
          outerRingColor: '#F472B6',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-3s',
          isThickGlow: true,
        }
      );

    case 'kpop_pink':
      return buildVisual(
        'kpop_pink',
        '#EC4899',
        '#A855F7',
        'conic-gradient(from 0deg, #EC4899, #A855F7, #F9A8D4, #C084FC, #EC4899)',
        '#FAF5FF',
        {
          outerRingColor: '#C084FC',
          outerRingPattern: 'dotted',
          spinClass: 'nz-spin-3s',
          isThickGlow: true,
        }
      );

    case 'gamers_neon':
      return buildVisual(
        'gamers_neon',
        '#00FF88',
        '#FF0055',
        'conic-gradient(from 0deg, #FF0055, #FF9F0A, #00FF88, #00AAFF, #BF5AF2, #FF0055)',
        '#ECFDF5',
        {
          outerRingColor: '#00AAFF',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-2s',
          isThickGlow: true,
        }
      );

    case 'gamers_pro':
      return buildVisual(
        'gamers_pro',
        '#DC2626',
        '#18181B',
        'conic-gradient(from 0deg, #111113, #DC2626, #FF453A, #18181B, #FF9F0A, #DC2626, #111113)',
        '#FEF2F2',
        {
          outerRingColor: '#FF453A',
          outerRingPattern: 'dashed',
          spinClass: 'nz-spin-2s',
          isThickGlow: true,
        }
      );

    default: {
      const fallbackHex = hexFromDb || '#232328';
      return {
        effectKey: 'default',
        primaryColor: fallbackHex,
        secondaryColor: fallbackHex,
        conicGradient: border
          ? `conic-gradient(from 0deg, ${fallbackHex}, #FFFFFF, ${fallbackHex})`
          : 'none',
        outerRingColor: fallbackHex,
        outerRingPattern: 'dashed',
        dashed: false,
        spinClass: 'nz-spin-4s',
        outerSpinClass: 'nz-spin-reverse',
        glowColor: fallbackHex,
        ambientGlowBg: 'none',
        ringShadow: border ? `0 0 10px ${fallbackHex}66` : 'none',
        cardBgGradient: 'linear-gradient(155deg, #FFFFFF 0%, #F4F4F5 100%)',
        bokehTint: 'rgba(139, 92, 246, 0.1)',
        cardHoverShadow: '0 14px 28px rgba(0,0,0,0.22)',
        isThickGlow: price >= 200,
        isFaizOwner: false,
        isOwnerBadge: false,
        isAurora: false,
        isHeartbeat: false,
        isGlitch: false,
      };
    }
  }
}
