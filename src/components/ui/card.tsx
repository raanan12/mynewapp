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

/**
 * Floating white surface used by every list row, panel and stat tile - a
 * soft diffuse shadow is the default look, `elevated` just makes it deeper.
 *
 * The shadow lives on the outer view and the rounded-corner clipping on an
 * inner one - `overflow: hidden` on the same view as the shadow would clip
 * the shadow itself, since it renders outside the view's own bounds.
 */
export function Card({ children, padded = true, elevated = false, style }: CardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.shadowWrap, elevated ? shadow.raised : shadow.card, style]}>
      <View
        style={[
          styles.base,
          { backgroundColor: colors.surface, borderColor: colors.border },
          padded && styles.padded,
        ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: radius.lg,
  },
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.md,
  },
});
