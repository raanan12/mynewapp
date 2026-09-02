import { colors, type ColorScheme, type ThemeColors } from '@/constants/theme';

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
};

/**
 * The "Light Minimalist Luxury" design is a single deliberate light palette,
 * not a light/dark pair - so this ignores the system color scheme rather
 * than switching to a mismatched dark theme.
 */
export function useTheme(): Theme {
  return {
    scheme: 'light',
    colors: colors.light,
    isDark: false,
  };
}
