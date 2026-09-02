import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { fontSize, palette, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StreakBadgeProps = {
  days: number;
  /** Dimmed until today's donation lands. */
  active: boolean;
  compact?: boolean;
};

export function StreakBadge({ days, active, compact = false }: StreakBadgeProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`רצף של ${days} ימים`}
      style={[
        styles.root,
        compact && styles.compact,
        {
          backgroundColor: active ? 'rgba(212,175,55,0.16)' : colors.surfaceAlt,
          borderColor: active ? palette.gold : colors.border,
        },
      ]}>
      <Ionicons name="flame" size={compact ? 15 : 18} color={active ? palette.gold : colors.textMuted} />
      <Text style={[styles.value, { color: colors.text, fontSize: compact ? fontSize.sm : fontSize.md }]}>
        {days}
      </Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>
        {days === 1 ? 'יום' : 'ימי רצף'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  compact: {
    paddingVertical: spacing.xs,
  },
  value: {
    fontWeight: '900',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
