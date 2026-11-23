import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeId =
  | 'hitam'
  | 'putih'
  | 'biru_hitam'
  | 'biru'
  | 'pink'
  | 'pink_ungu'
  | 'pink_hitam'
  | 'ungu_hitam'
  | 'pink_biru'
  | 'merah'
  | 'merah_biru';

export interface AppTheme {
  id: ThemeId;
  name: string;
  previewColors: [string, string];
  isLight: boolean;
  bg: string;
  bgSolid: string;
  card: string;
  elevated: string;
  modalBg: string;
  headerBg: string;
  border: string;
  text: string;
  textBody: string;
  textMuted: string;
  btnBg: string;
  btnText: string;
  borderCardBtnBg: string;
  borderCardBtnText: string;
  accent: string;
  accentText: string;
  brandNongkrong: string;
  brandZone: string;
  brandZoneGlow: string;
  bubbleOtherBg: string;
  bubbleOtherText: string;
  bubbleMineBg: string;
  bubbleMineText: string;
}

export const THEMES: AppTheme[] = [
  {
    id: 'hitam',
    name: 'HITAM',
    previewColors: ['#000000', '#FACC15'],
    isLight: false,
    bg: '#000000',
    bgSolid: '#000000',
    card: '#111111',
    elevated: '#1C1C21',
    modalBg: '#111111',
    headerBg: 'rgba(0, 0, 0, 0.92)',
    border: '#232328',
    text: '#FFFFFF',
    textBody: '#E5E5E7',
    textMuted: '#9CA3AF',
    btnBg: '#FACC15',
    btnText: '#000000',
    borderCardBtnBg: '#FACC15',
    borderCardBtnText: '#000000',
    accent: '#FACC15',
    accentText: '#FACC15',
    brandNongkrong: '#FFFFFF',
    brandZone: '#FACC15',
    brandZoneGlow: '0 0 12px rgba(250, 204, 21, 0.85), 0 0 24px rgba(255, 159, 10, 0.55)',
    bubbleOtherBg: '#1C1C21',
    bubbleOtherText: '#FFFFFF',
    bubbleMineBg: '#FACC15',
    bubbleMineText: '#000000',
  },
  {
    id: 'putih',
    name: 'PUTIH',
    previewColors: ['#FFFFFF', '#111111'],
    isLight: true,
    bg: '#FFFFFF',
    bgSolid: '#FFFFFF',
    card: '#F1F1F1',
    elevated: '#E4E4E7',
    modalBg: '#FFFFFF',
    headerBg: 'rgba(255, 255, 255, 0.95)',
    border: '#E4E4E7',
    text: '#111111',
    textBody: '#27272A',
    textMuted: '#52525B',
    btnBg: '#111111',
    btnText: '#FFFFFF',
    borderCardBtnBg: '#111111',
    borderCardBtnText: '#FFFFFF',
    accent: '#111111',
    accentText: '#EA580C',
    brandNongkrong: '#111111',
    brandZone: '#EA580C',
    brandZoneGlow: '0 0 10px rgba(245, 158, 11, 0.6)',
    bubbleOtherBg: '#F1F1F1',
    bubbleOtherText: '#111111',
    bubbleMineBg: '#111111',
    bubbleMineText: '#FFFFFF',
  },
  {
    id: 'biru_hitam',
    name: 'BIRU HITAM',
    previewColors: ['#020617', '#38BDF8'],
    isLight: false,
    bg: '#020617',
    bgSolid: '#020617',
    card: '#0F172A',
    elevated: '#1E293B',
    modalBg: '#0F172A',
    headerBg: 'rgba(2, 6, 23, 0.92)',
    border: '#1E293B',
    text: '#F8FAFC',
    textBody: '#E2E8F0',
    textMuted: '#94A3B8',
    btnBg: '#38BDF8',
    btnText: '#020617',
    borderCardBtnBg: '#0284C7',
    borderCardBtnText: '#FFFFFF',
    accent: '#38BDF8',
    accentText: '#38BDF8',
    brandNongkrong: '#F8FAFC',
    brandZone: '#38BDF8',
    brandZoneGlow: '0 0 12px rgba(56, 189, 248, 0.9)',
    bubbleOtherBg: '#0F172A',
    bubbleOtherText: '#F8FAFC',
    bubbleMineBg: '#38BDF8',
    bubbleMineText: '#020617',
  },
  {
    id: 'biru',
    name: 'BIRU',
    previewColors: ['#1E40AF', '#FACC15'],
    isLight: false,
    bg: '#1E40AF',
    bgSolid: '#1E40AF',
    card: '#2563EB',
    elevated: '#1D4ED8',
    modalBg: '#1E3A8A',
    headerBg: 'rgba(30, 64, 175, 0.94)',
    border: 'rgba(255, 255, 255, 0.2)',
    text: '#FFFFFF',
    textBody: '#EFF6FF',
    textMuted: '#BFDBFE',
    btnBg: '#FFFFFF',
    btnText: '#1E40AF',
    borderCardBtnBg: '#1E40AF',
    borderCardBtnText: '#FFFFFF',
    accent: '#FACC15',
    accentText: '#FEF08A',
    brandNongkrong: '#FFFFFF',
    brandZone: '#FACC15',
    brandZoneGlow: '0 0 12px rgba(250, 204, 21, 0.9)',
    bubbleOtherBg: '#2563EB',
    bubbleOtherText: '#FFFFFF',
    bubbleMineBg: '#FFFFFF',
    bubbleMineText: '#1E40AF',
  },
  {
    id: 'pink',
    name: 'PINK',
    previewColors: ['#FCE7F3', '#EC4899'],
    isLight: true,
    bg: '#FCE7F3',
    bgSolid: '#FCE7F3',
    card: '#FFFFFF',
    elevated: '#FDF2F8',
    modalBg: '#FFFFFF',
    headerBg: 'rgba(252, 231, 243, 0.94)',
    border: '#FBCFE8',
    text: '#4A042E',
    textBody: '#500724',
    textMuted: '#9D174D',
    btnBg: '#EC4899',
    btnText: '#FFFFFF',
    borderCardBtnBg: '#EC4899',
    borderCardBtnText: '#FFFFFF',
    accent: '#EC4899',
    accentText: '#DB2777',
    brandNongkrong: '#500724',
    brandZone: '#EC4899',
    brandZoneGlow: '0 0 10px rgba(236, 72, 153, 0.75)',
    bubbleOtherBg: '#FFFFFF',
    bubbleOtherText: '#4A042E',
    bubbleMineBg: '#EC4899',
    bubbleMineText: '#FFFFFF',
  },
  {
    id: 'pink_ungu',
    name: 'PINK UNGU',
    previewColors: ['#EC4899', '#8B5CF6'],
    isLight: false,
    bg: 'linear-gradient(160deg, #EC4899 0%, #8B5CF6 100%)',
    bgSolid: '#8B5CF6',
    card: 'rgba(255, 255, 255, 0.18)',
    elevated: 'rgba(255, 255, 255, 0.25)',
    modalBg: '#6D28D9',
    headerBg: 'rgba(139, 92, 246, 0.55)',
    border: 'rgba(255, 255, 255, 0.28)',
    text: '#FFFFFF',
    textBody: '#FDF4FF',
    textMuted: 'rgba(255, 255, 255, 0.85)',
    btnBg: '#FFFFFF',
    btnText: '#7C3AED',
    borderCardBtnBg: '#8B5CF6',
    borderCardBtnText: '#FFFFFF',
    accent: '#FEF08A',
    accentText: '#FEF08A',
    brandNongkrong: '#FFFFFF',
    brandZone: '#FEF08A',
    brandZoneGlow: '0 0 12px rgba(254, 240, 138, 0.9)',
    bubbleOtherBg: 'rgba(255, 255, 255, 0.22)',
    bubbleOtherText: '#FFFFFF',
    bubbleMineBg: '#FFFFFF',
    bubbleMineText: '#7C3AED',
  },
  {
    id: 'pink_hitam',
    name: 'PINK HITAM',
    previewColors: ['#0A0A0A', '#FF2D95'],
    isLight: false,
    bg: '#0A0A0A',
    bgSolid: '#0A0A0A',
    card: '#1A0A1A',
    elevated: '#291029',
    modalBg: '#1A0A1A',
    headerBg: 'rgba(10, 10, 10, 0.92)',
    border: 'rgba(255, 45, 149, 0.28)',
    text: '#FBCFE8',
    textBody: '#FCE7F3',
    textMuted: '#F472B6',
    btnBg: '#FF2D95',
    btnText: '#FFFFFF',
    borderCardBtnBg: '#FF2D95',
    borderCardBtnText: '#FFFFFF',
    accent: '#FF2D95',
    accentText: '#FF2D95',
    brandNongkrong: '#FCE7F3',
    brandZone: '#FF2D95',
    brandZoneGlow: '0 0 12px rgba(255, 45, 149, 0.9)',
    bubbleOtherBg: '#1A0A1A',
    bubbleOtherText: '#FBCFE8',
    bubbleMineBg: '#FF2D95',
    bubbleMineText: '#FFFFFF',
  },
  {
    id: 'ungu_hitam',
    name: 'UNGU HITAM',
    previewColors: ['#0B0014', '#A855F7'],
    isLight: false,
    bg: '#0B0014',
    bgSolid: '#0B0014',
    card: '#1E1033',
    elevated: '#2D194D',
    modalBg: '#1E1033',
    headerBg: 'rgba(11, 0, 20, 0.92)',
    border: 'rgba(168, 85, 247, 0.3)',
    text: '#F5F3FF',
    textBody: '#EDE9FE',
    textMuted: '#C4B5FD',
    btnBg: '#A855F7',
    btnText: '#FFFFFF',
    borderCardBtnBg: '#A855F7',
    borderCardBtnText: '#FFFFFF',
    accent: '#A855F7',
    accentText: '#C084FC',
    brandNongkrong: '#FFFFFF',
    brandZone: '#C084FC',
    brandZoneGlow: '0 0 12px rgba(168, 85, 247, 0.9)',
    bubbleOtherBg: '#1E1033',
    bubbleOtherText: '#F5F3FF',
    bubbleMineBg: '#A855F7',
    bubbleMineText: '#FFFFFF',
  },
  {
    id: 'pink_biru',
    name: 'PINK BIRU',
    previewColors: ['#EC4899', '#3B82F6'],
    isLight: false,
    bg: 'linear-gradient(160deg, #EC4899 0%, #3B82F6 100%)',
    bgSolid: '#3B82F6',
    card: 'rgba(255, 255, 255, 0.18)',
    elevated: 'rgba(255, 255, 255, 0.25)',
    modalBg: '#1E3A8A',
    headerBg: 'rgba(59, 130, 246, 0.5)',
    border: 'rgba(255, 255, 255, 0.28)',
    text: '#FFFFFF',
    textBody: '#EFF6FF',
    textMuted: 'rgba(255, 255, 255, 0.85)',
    btnBg: '#FFFFFF',
    btnText: '#2563EB',
    borderCardBtnBg: '#2563EB',
    borderCardBtnText: '#FFFFFF',
    accent: '#FEF08A',
    accentText: '#FEF08A',
    brandNongkrong: '#FFFFFF',
    brandZone: '#FEF08A',
    brandZoneGlow: '0 0 12px rgba(254, 240, 138, 0.9)',
    bubbleOtherBg: 'rgba(255, 255, 255, 0.22)',
    bubbleOtherText: '#FFFFFF',
    bubbleMineBg: '#FFFFFF',
    bubbleMineText: '#2563EB',
  },
  {
    id: 'merah',
    name: 'MERAH',
    previewColors: ['#7F1D1D', '#FACC15'],
    isLight: false,
    bg: '#7F1D1D',
    bgSolid: '#7F1D1D',
    card: '#B91C1C',
    elevated: '#991B1B',
    modalBg: '#7F1D1D',
    headerBg: 'rgba(127, 29, 29, 0.94)',
    border: 'rgba(255, 255, 255, 0.22)',
    text: '#FFFFFF',
    textBody: '#FEF2F2',
    textMuted: '#FECACA',
    btnBg: '#111111',
    btnText: '#FFFFFF',
    borderCardBtnBg: '#111111',
    borderCardBtnText: '#FFFFFF',
    accent: '#FACC15',
    accentText: '#FACC15',
    brandNongkrong: '#FFFFFF',
    brandZone: '#FACC15',
    brandZoneGlow: '0 0 12px rgba(250, 204, 21, 0.9)',
    bubbleOtherBg: '#B91C1C',
    bubbleOtherText: '#FFFFFF',
    bubbleMineBg: '#111111',
    bubbleMineText: '#FFFFFF',
  },
  {
    id: 'merah_biru',
    name: 'MERAH BIRU',
    previewColors: ['#DC2626', '#1D4ED8'],
    isLight: false,
    bg: 'linear-gradient(160deg, #DC2626 0%, #1D4ED8 100%)',
    bgSolid: '#1D4ED8',
    card: 'rgba(0, 0, 0, 0.36)',
    elevated: 'rgba(0, 0, 0, 0.48)',
    modalBg: '#111827',
    headerBg: 'rgba(0, 0, 0, 0.42)',
    border: 'rgba(255, 255, 255, 0.2)',
    text: '#FFFFFF',
    textBody: '#F8FAFC',
    textMuted: 'rgba(255, 255, 255, 0.82)',
    btnBg: '#FFFFFF',
    btnText: '#111111',
    borderCardBtnBg: '#111111',
    borderCardBtnText: '#FFFFFF',
    accent: '#FACC15',
    accentText: '#FACC15',
    brandNongkrong: '#FFFFFF',
    brandZone: '#FACC15',
    brandZoneGlow: '0 0 12px rgba(250, 204, 21, 0.9)',
    bubbleOtherBg: 'rgba(0, 0, 0, 0.42)',
    bubbleOtherText: '#FFFFFF',
    bubbleMineBg: '#FFFFFF',
    bubbleMineText: '#111111',
  },
];

const THEME_STORAGE_KEY = 'nz_theme_id';

interface ThemeContextValue {
  theme: AppTheme;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES[0],
  setThemeId: () => {},
});

function readStoredThemeId(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved as ThemeId;
    }
  } catch {
    // ignore storage failures
  }
  return 'hitam';
}

function applyThemeToDocument(theme: AppTheme) {
  const root = document.documentElement;
  const s = root.style;
  s.setProperty('--nz-bg', theme.bg);
  s.setProperty('--nz-bg-solid', theme.bgSolid);
  s.setProperty('--nz-card', theme.card);
  s.setProperty('--nz-elevated', theme.elevated);
  s.setProperty('--nz-modal-bg', theme.modalBg);
  s.setProperty('--nz-header-bg', theme.headerBg);
  s.setProperty('--nz-border', theme.border);
  s.setProperty('--nz-text', theme.text);
  s.setProperty('--nz-text-body', theme.textBody);
  s.setProperty('--nz-text-muted', theme.textMuted);
  s.setProperty('--nz-btn-bg', theme.btnBg);
  s.setProperty('--nz-btn-text', theme.btnText);
  s.setProperty('--nz-border-btn-bg', theme.borderCardBtnBg);
  s.setProperty('--nz-border-btn-text', theme.borderCardBtnText);
  s.setProperty('--nz-accent', theme.accent);
  s.setProperty('--nz-accent-text', theme.accentText);
  s.setProperty('--nz-brand-nongkrong', theme.brandNongkrong);
  s.setProperty('--nz-brand-zone', theme.brandZone);
  s.setProperty('--nz-brand-zone-glow', theme.brandZoneGlow);
  s.setProperty('--nz-bubble-other-bg', theme.bubbleOtherBg);
  s.setProperty('--nz-bubble-other-text', theme.bubbleOtherText);
  s.setProperty('--nz-bubble-mine-bg', theme.bubbleMineBg);
  s.setProperty('--nz-bubble-mine-text', theme.bubbleMineText);

  if (theme.isLight) {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme.bgSolid);
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(readStoredThemeId);
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // ignore storage errors
    }
    const next = THEMES.find((t) => t.id === id);
    if (next) applyThemeToDocument(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setThemeId }}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  return useContext(ThemeContext);
}
