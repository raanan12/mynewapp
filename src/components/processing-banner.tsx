import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProcessingBannerProps = {
  message: string;
};

/** Shown while waiting on a network round trip (charge/top-up) so the wait is never silent. */
export function ProcessingBanner({ message }: ProcessingBannerProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <ActivityIndicator size="small" color={colors.accent} />
      <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
});
