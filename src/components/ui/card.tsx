import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { radius, shadow, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = {
  children: ReactNode;
  padded?: boolean;
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
};

/** Themed surface used by every list row, panel and stat tile. */
export function Card({ children, padded = true, elevated = false, style }: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.surface, borderColor: colors.border },
        padded && styles.padded,
        elevated && shadow.card,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.md,
  },
});
