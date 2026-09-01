import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  /** Which safe-area edges to pad. Screens under a header usually skip 'top'. */
  edges?: readonly Edge[];
  padded?: boolean;
  style?: ViewStyle;
};

/** Themed page container: background color + safe-area padding in one place. */
export function Screen({
  children,
  edges = ['top', 'bottom'],
  padded = true,
  style,
}: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.content, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  padded: {
    padding: spacing.lg,
  },
});
