/**
 * Design tokens for the app. Everything visual should read from here
 * instead of hard-coding colors, spacing or radii in components.
 */

export const palette = {
  blue: '#208AEF',
  blueDark: '#1668B8',
  white: '#FFFFFF',
  black: '#0B0B0F',
  gray100: '#F2F4F7',
  gray300: '#D0D5DD',
  gray500: '#667085',
  gray700: '#344054',
  gray900: '#101828',
  red: '#D92D20',
} as const;

export const colors = {
  light: {
    background: palette.white,
    surface: palette.gray100,
    border: palette.gray300,
    text: palette.gray900,
    textMuted: palette.gray500,
    primary: palette.blue,
    onPrimary: palette.white,
    danger: palette.red,
  },
  dark: {
    background: palette.black,
    surface: palette.gray900,
    border: palette.gray700,
    text: palette.white,
    textMuted: palette.gray300,
    primary: palette.blue,
    onPrimary: palette.white,
    danger: palette.red,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const fontSize = {
  sm: 13,
  md: 16,
  lg: 20,
  xl: 28,
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = (typeof colors)[ColorScheme];
