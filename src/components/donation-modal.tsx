import { CheckCircle2, Flame } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { fontSize, palette, radius, spacing } from '@/constants/theme';
import { useDailyQuote } from '@/hooks/use-daily-quote';
import { useTheme } from '@/hooks/use-theme';
import { categoryLabel } from '@/store/app-store';
import type { Donation } from '@/types';
import { formatCurrency } from '@/utils/format';

type DonationModalProps = {
  donation: Donation | null;
  streak: number;
  onClose: () => void;
  onSaveDedication: (donationId: string, dedication: string) => void;
  onShareReceipt: (donation: Donation) => void;
};

const DEDICATION_PRESETS = ['לרפואת ', 'לעילוי נשמת ', 'להצלחת ', 'לזיווג הגון ל'];

/** Confirmation shown right after a coin drops: quote, streak and dedication. */
export function DonationModal({
  donation,
  streak,
  onClose,
  onSaveDedication,
  onShareReceipt,
}: DonationModalProps) {
  const { colors } = useTheme();
  const quote = useDailyQuote();
  const [dedication, setDedication] = useState('');

  function close() {
    if (donation && dedication.trim()) {
      onSaveDedication(donation.id, dedication);
    }
    setDedication('');
    onClose();
  }

  return (
    <Modal visible={donation !== null} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="סגירה" />

        {donation ? (
          <Animated.View
            entering={FadeInDown.springify().damping(18)}
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Animated.View entering={FadeIn.delay(120)} style={styles.checkWrap}>
              <View style={[styles.checkCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                <CheckCircle2 size={40} color={colors.success} strokeWidth={2} />
              </View>
              <Text style={[styles.checkLabel, { color: colors.success }]}>התרומה נקלטה בהצלחה</Text>
            </Animated.View>

            <Text style={[styles.amount, { color: colors.text }]}>
              {formatCurrency(donation.amount)}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              נתרם ל{categoryLabel(donation.categoryId)}
            </Text>

            <View style={[styles.streakRow, { backgroundColor: colors.surfaceAlt }]}>
              <Flame size={18} color={palette.gold} fill={palette.gold} strokeWidth={1.75} />
              <Text style={[styles.streakText, { color: colors.text }]}>
                רצף של {streak} {streak === 1 ? 'יום' : 'ימים'}
              </Text>
            </View>

            <View style={[styles.quote, { borderColor: colors.border }]}>
              <Text style={[styles.quoteText, { color: colors.text }]}>״{quote.text}״</Text>
              <Text style={[styles.quoteSource, { color: colors.textMuted }]}>{quote.source}</Text>
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>הקדשה (לא חובה)</Text>
            <TextInput
              value={dedication}
              onChangeText={setDedication}
              placeholder="לרפואת... / לעילוי נשמת..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
              maxLength={80}
              returnKeyType="done"
            />

            <View style={styles.presets}>
              {DEDICATION_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => setDedication(preset)}
                  style={[styles.preset, { borderColor: colors.border }]}>
                  <Text style={[styles.presetText, { color: colors.textMuted }]}>{preset.trim()}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.actions}>
              <Button title="סיום" onPress={close} style={styles.flex} />
              <Button
                title="קבלה"
                variant="secondary"
                onPress={() => onShareReceipt(donation)}
                style={styles.flex}
              />
            </View>
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(28,25,23,0.4)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  checkWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  amount: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
  meta: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  streakText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  quote: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  quoteText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  quoteSource: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textAlign: 'right',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    textAlign: 'right',
    minHeight: 48,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  preset: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
  },
  presetText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
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
