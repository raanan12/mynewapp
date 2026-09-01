import { useColorScheme } from 'react-native';

import { colors, type ColorScheme, type ThemeColors } from '@/constants/theme';

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
};

/** Resolves the active color scheme into the token set components should use. */
export function useTheme(): Theme {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return {
    scheme,
    colors: colors[scheme],
    isDark: scheme === 'dark',
  };
}
