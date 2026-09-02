import { Link } from 'expo-router';
import { AlertCircle, CreditCard, Plus } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { CategoryPicker } from '@/components/category-picker';
import { ChargeFailedModal } from '@/components/charge-failed-modal';
import { CustomAmountModal } from '@/components/custom-amount-modal';
import { DonationModal } from '@/components/donation-modal';
import { DraggableCoin } from '@/components/draggable-coin';
import { ProcessingBanner } from '@/components/processing-banner';
import { Screen } from '@/components/screen';
import { StreakBadge } from '@/components/streak-badge';
import { TzedakahBox, type TzedakahBoxHandle } from '@/components/tzedakah-box';
import { fontSize, radius, spacing, TAB_BAR_CLEARANCE } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorFeedback, playCoinSound, successFeedback } from '@/services/feedback';
import { shareReceipt } from '@/services/receipts';
import { donateWithFunds } from '@/services/wallet';
import { useAppStore, useCoinAmounts, useTotals } from '@/store/app-store';
import type { CategoryId, Donation } from '@/types';
import { formatCurrency } from '@/utils/format';

/** Where the slot sits inside the box, measured from the box's top edge. */
const SLOT_INSET_Y = 30;

export default function GivingScreen() {
  const { colors } = useTheme();

  const card = useAppStore((state) => state.card);
  const streak = useAppStore((state) => state.streak);
  const attachDedication = useAppStore((state) => state.attachDedication);
  const coinAmounts = useCoinAmounts();
  const totals = useTotals();

  const boxRef = useRef<TzedakahBoxHandle>(null);
  const [category, setCategory] = useState<CategoryId>('families');
  const [lastDonation, setLastDonation] = useState<Donation | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [charging, setCharging] = useState(false);
  const [lastAmount, setLastAmount] = useState<number | null>(null);

  // Coin flight geometry, filled in by onLayout.
  const [boxTop, setBoxTop] = useState(0);
  const [trayCenterY, setTrayCenterY] = useState(0);
  const [trayWidth, setTrayWidth] = useState(0);
  const [coinCenters, setCoinCenters] = useState<Record<number, number>>({});

  const flightY = boxTop + SLOT_INSET_Y - trayCenterY;

  const targetFor = useCallback(
    (amount: number) => ({
      x: trayWidth ? trayWidth / 2 - (coinCenters[amount] ?? trayWidth / 2) : 0,
      y: flightY || -220,
    }),
    [coinCenters, flightY, trayWidth]
  );

  const onBoxLayout = (event: LayoutChangeEvent) => setBoxTop(event.nativeEvent.layout.y);

  const onTrayLayout = (event: LayoutChangeEvent) => {
    const { y, height, width } = event.nativeEvent.layout;
    setTrayCenterY(y + height / 2);
    setTrayWidth(width);
  };

  const onCoinLayout = (amount: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setCoinCenters((current) => ({ ...current, [amount]: x + width / 2 }));
  };

  const handleDrop = useCallback(
    async (amount: number) => {
      if (charging) return;

      setHint(null);
      setLastAmount(amount);
      setCharging(true);
      boxRef.current?.receiveCoin();
      void playCoinSound();

      const outcome = await donateWithFunds({ amount, categoryId: category });
      setCharging(false);

      if (!outcome.ok) {
        errorFeedback();

        if (outcome.reason === 'noCard') {
          setHint(outcome.message ?? 'אין כרטיס אשראי שמור. הוסיפו כרטיס כדי לתרום.');
        } else {
          setChargeError(outcome.message ?? 'החיוב נכשל. נסו שוב.');
        }
        return;
      }

      successFeedback();
      setLastDonation(outcome.donation);
    },
    [category, charging]
  );

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.header}>
        <StreakBadge days={streak.current} active={totals.hasGivenToday} />

        <Link href={card ? '/(tabs)/wallet' : '/add-card'} asChild>
          <Pressable
            accessibilityRole="button"
            style={[styles.cardBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CreditCard size={16} color={colors.textMuted} strokeWidth={1.75} />
            <Text style={[styles.cardBadgeText, { color: colors.text }]}>
              {card ? `•••• ${card.last4}` : 'הוספת כרטיס'}
            </Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.stage}>
        <View onLayout={onBoxLayout} style={styles.boxWrap}>
          <TzedakahBox ref={boxRef} todayTotal={formatCurrency(totals.givenToday)} />
        </View>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {totals.hasGivenToday
            ? 'נתתם היום. אפשר להוסיף עוד.'
            : 'החליקו מטבע למעלה או הקישו עליו'}
        </Text>

        {charging ? <ProcessingBanner message="מבצעים את התרומה..." /> : null}

        {hint ? (
          <View style={[styles.hintBanner, { backgroundColor: colors.surfaceAlt }]}>
            <AlertCircle size={16} color={colors.danger} strokeWidth={1.75} />
            <Text style={[styles.hintText, { color: colors.danger }]}>{hint}</Text>
          </View>
        ) : null}
      </View>

      <CategoryPicker value={category} onChange={setCategory} />

      <View
        onLayout={onTrayLayout}
        style={[styles.tray, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {coinAmounts.map((amount) => (
          <View key={amount} onLayout={onCoinLayout(amount)}>
            <DraggableCoin
              amount={amount}
              target={targetFor(amount)}
              disabled={!card || charging}
              onDrop={handleDrop}
            />
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          disabled={!card || charging}
          onPress={() => setCustomOpen(true)}
          style={({ pressed }) => [
            styles.custom,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Plus size={22} color={colors.textMuted} strokeWidth={1.75} />
          <Text style={[styles.customText, { color: colors.textMuted }]}>סכום אחר</Text>
        </Pressable>
      </View>

      <CustomAmountModal
        visible={customOpen}
        subtitle="הסכום יחויב ישירות מהכרטיס השמור"
        onCancel={() => setCustomOpen(false)}
        onConfirm={(amount) => {
          setCustomOpen(false);
          void handleDrop(amount);
        }}
      />

      <DonationModal
        donation={lastDonation}
        streak={streak.current}
        onClose={() => setLastDonation(null)}
        onSaveDedication={attachDedication}
        onShareReceipt={(donation) => {
          void shareReceipt(donation).catch(() => setHint('לא הצלחנו להפיק קבלה כרגע.'));
        }}
      />

      <ChargeFailedModal
        message={chargeError}
        onDismiss={() => setChargeError(null)}
        onRetry={() => {
          setChargeError(null);
          if (lastAmount) void handleDrop(lastAmount);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  boxWrap: {
    alignItems: 'center',
  },
  hint: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  hintText: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
  },
  tray: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  custom: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  customText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
