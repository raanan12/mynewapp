/**
 * Design tokens for "החסד היומי". Everything visual should read from here
 * instead of hard-coding colors, spacing or radii in components.
 *
 * The palette is a warm/luxury one: deep navy, warm gold, cream and charcoal.
 */

export const palette = {
  navy: '#1A2B4C',
  navyDeep: '#111C33',
  navySoft: '#24406E',
  gold: '#D4AF37',
  goldSoft: '#E7CC72',
  goldDeep: '#A8861F',
  cream: '#FDFBF7',
  creamDim: '#F1EBE0',
  charcoal: '#222222',
  charcoalSoft: '#4A4A4A',
  stone: '#8A8578',
  white: '#FFFFFF',
  success: '#2E7D5B',
  danger: '#B3261E',
} as const;

export const colors = {
  light: {
    background: palette.cream,
    surface: palette.white,
    surfaceAlt: palette.creamDim,
    border: '#E3DCCD',
    text: palette.charcoal,
    textMuted: palette.stone,
    primary: palette.navy,
    onPrimary: palette.cream,
    accent: palette.gold,
    onAccent: palette.navy,
    success: palette.success,
    danger: palette.danger,
  },
  dark: {
    background: palette.navyDeep,
    surface: palette.navy,
    surfaceAlt: palette.navySoft,
    border: '#33507F',
    text: palette.cream,
    textMuted: '#A9B6CC',
    primary: palette.gold,
    onPrimary: palette.navyDeep,
    accent: palette.gold,
    onAccent: palette.navyDeep,
    success: '#5FBF92',
    danger: '#F2837B',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 38,
} as const;

/** Reused elevation so cards look consistent across screens. */
export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = (typeof colors)[ColorScheme];
