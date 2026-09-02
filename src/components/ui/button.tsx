import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { radius, spacing, fontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/services/feedback';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'gold' | 'secondary' | 'ghost';
  loading?: boolean;
  /** Skip the haptic tick, e.g. for destructive confirmations. */
  silent?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  silent = false,
  disabled,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const background = {
    primary: colors.primary,
    gold: colors.accent,
    secondary: colors.surfaceAlt,
    ghost: 'transparent',
  }[variant];

  const foreground = {
    primary: colors.onPrimary,
    gold: colors.onAccent,
    secondary: colors.text,
    ghost: colors.text,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={(event) => {
        if (!silent) tapFeedback();
        onPress?.(event);
      }}
      style={(state) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor: variant === 'ghost' ? colors.border : background,
          opacity: isDisabled ? 0.45 : state.pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <Text style={[styles.label, { color: foreground }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '700',
    textAlign: 'center',
  },
});
