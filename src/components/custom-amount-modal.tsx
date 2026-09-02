import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/format';

type CustomAmountModalProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  suggestions?: readonly number[];
  /** Sanity ceiling - Kesher's own Edge Functions reject anything above 5000. */
  maxAmount?: number;
  onCancel: () => void;
  onConfirm: (amount: number) => void;
};

const DEFAULT_SUGGESTIONS = [18, 26, 36, 52, 100];
const DEFAULT_MAX = 5000;

/** Shared "enter any amount" sheet - used for both donating and topping up. */
export function CustomAmountModal({
  visible,
  title = 'סכום אחר',
  subtitle,
  confirmLabel = 'תרומה',
  suggestions = DEFAULT_SUGGESTIONS,
  maxAmount = DEFAULT_MAX,
  onCancel,
  onConfirm,
}: CustomAmountModalProps) {
  const { colors } = useTheme();
  const [raw, setRaw] = useState('');

  const amount = Number(raw.replace(',', '.'));
  const isValid = Number.isFinite(amount) && amount > 0;
  const overMax = isValid && amount > maxAmount;

  function close() {
    setRaw('');
    onCancel();
  }

  function confirm() {
    if (!isValid || overMax) return;
    setRaw('');
    onConfirm(amount);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="סגירה" />

        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          ) : null}

          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.currency, { color: colors.textMuted }]}>₪</Text>
            <TextInput
              value={raw}
              onChangeText={setRaw}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text }]}
              autoFocus
              maxLength={7}
            />
          </View>

          <View style={styles.suggestions}>
            {suggestions.map((value) => (
              <Pressable
                key={value}
                onPress={() => setRaw(String(value))}
                style={[styles.suggestion, { borderColor: colors.border }]}>
                <Text style={[styles.suggestionText, { color: colors.text }]}>{value}</Text>
              </Pressable>
            ))}
          </View>

          {overMax ? (
            <Text style={[styles.error, { color: colors.danger }]}>
              הסכום המקסימלי הוא {formatCurrency(maxAmount)}.
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button title={confirmLabel} onPress={confirm} disabled={!isValid || overMax} style={styles.flex} />
            <Button title="ביטול" variant="ghost" onPress={close} style={styles.flex} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(10,16,30,0.55)',
  },
  sheet: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: fontSize.sm,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  currency: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '800',
    paddingVertical: spacing.sm,
    textAlign: 'right',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  suggestion: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  suggestionText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  error: {
    fontSize: fontSize.xs,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
