/**
 * Design tokens for "החסד היומי" - "Light Minimalist Luxury".
 *
 * Deliberately light-only (see `useTheme`): warm off-white, frosted acrylic
 * glass, soft diffuse shadows, brushed-gold accents. Everything visual should
 * read from here instead of hard-coding colors, spacing or radii.
 */

export const palette = {
  /** Warm off-white app background. */
  cream: '#FAF8F5',
  /** Slightly deeper warm tone for secondary surfaces/section backgrounds. */
  sand: '#F8F6F0',
  /** Muted warm sand - secondary accent, unselected chip fills. */
  sandDeep: '#E5DFD3',
  white: '#FFFFFF',
  /** Brushed gold - primary interactive accent (buttons, active states). */
  gold: '#C5A059',
  /** Richer gold - decorative use only (coin metal, box trim). */
  goldRich: '#D4AF37',
  goldDeep: '#A8861F',
  /** Bright highlight for the metal-frame bevel on the tzedakah box. */
  goldLight: '#F3DFA3',
  /** Pearl/silver - the "custom amount" coin, so it reads as distinct from
   *  the fixed-amount gold coins rather than as one more denomination. */
  silver: '#E7E5E2',
  silverRich: '#F4F3F1',
  silverDeep: '#B9B6B0',
  charcoal: '#1C1917',
  taupe: '#78716C',
  border: 'rgba(28, 25, 23, 0.08)',
  success: '#10B981',
  danger: '#E11D48',
  /** Kept for the two spots (coin, box) that still lean on the deeper navy
   *  metallic look rather than the light palette. */
  navy: '#1A2B4C',
} as const;

export const colors = {
  light: {
    background: palette.cream,
    surface: palette.white,
    surfaceAlt: palette.sand,
    border: palette.border,
    text: palette.charcoal,
    textMuted: palette.taupe,
    primary: palette.charcoal,
    onPrimary: palette.white,
    accent: palette.gold,
    onAccent: palette.white,
    success: palette.success,
    danger: palette.danger,
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
  sm: 8,
  md: 16,
  lg: 22,
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

/** Soft, diffuse - the "floating white card" look, not a hard drop shadow. */
export const shadow = {
  card: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  raised: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = (typeof colors)[ColorScheme];

/** The tab bar floats over content (absolute position) - every tab screen's
 *  scrollable content needs at least this much bottom padding so its last
 *  item isn't hidden underneath the bar. */
export const TAB_BAR_CLEARANCE = 110;
