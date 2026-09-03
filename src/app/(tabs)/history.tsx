import { FileText, Gift, Heart, Zap } from 'lucide-react-native';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { StreakBadge } from '@/components/streak-badge';
import { Card } from '@/components/ui/card';
import { fontSize, palette, radius, spacing, TAB_BAR_CLEARANCE } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { shareReceipt } from '@/services/receipts';
import { categoryLabel, useAppStore, useAppText, useTotals } from '@/store/app-store';
import type { Donation } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

type Section = { title: string; data: Donation[] };

/** Group by calendar day so the streak is visible in the list itself. */
function groupByDay(donations: Donation[]): Section[] {
  const groups = new Map<string, Donation[]>();

  for (const donation of donations) {
    const key = formatDate(donation.createdAt);
    const bucket = groups.get(key);
    if (bucket) bucket.push(donation);
    else groups.set(key, [donation]);
  }

  return [...groups.entries()].map(([title, data]) => ({ title, data }));
}

export default function HistoryScreen() {
  const { colors } = useTheme();

  const donations = useAppStore((state) => state.donations);
  const streak = useAppStore((state) => state.streak);
  const totals = useTotals();
  const titleText = useAppText('history_title');
  const totalLabel = useAppText('history_total_label');
  const donationsLabel = useAppText('history_donations_label');
  const streakLabel = useAppText('history_streak_label');
  const emptyTitle = useAppText('history_empty_title');
  const emptyBody = useAppText('history_empty_body');

  const sections = groupByDay(donations);

  return (
    <Screen padded={false} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>{titleText}</Text>

            <View style={styles.stats}>
              <Card style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatCurrency(totals.total)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{totalLabel}</Text>
              </Card>
              <Card style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{totals.count}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{donationsLabel}</Text>
              </Card>
              <Card style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{streak.longest}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{streakLabel}</Text>
              </Card>
            </View>

            <View style={styles.streakRow}>
              <StreakBadge days={streak.current} active={totals.hasGivenToday} />
              <Text style={[styles.streakHint, { color: colors.textMuted }]}>
                {totals.hasGivenToday ? 'הרצף נשמר להיום' : 'עוד לא נתתם היום'}
              </Text>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.rowMain}>
              <View style={[styles.iconWrap, { backgroundColor: colors.surfaceAlt }]}>
                {item.source === 'auto' ? (
                  <Zap size={18} color={palette.gold} strokeWidth={1.75} />
                ) : (
                  <Heart size={18} color={palette.gold} fill={palette.gold} strokeWidth={1.5} />
                )}
              </View>

              <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {categoryLabel(item.categoryId)}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                  {formatDateTime(item.createdAt)}
                  {item.source === 'auto' ? ' · אוטומטי' : ''}
                </Text>
                {item.dedication ? (
                  <Text style={[styles.dedication, { color: colors.accent }]} numberOfLines={2}>
                    {item.dedication}
                  </Text>
                ) : null}
              </View>

              <Text style={[styles.rowAmount, { color: colors.text }]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => void shareReceipt(item).catch(() => {})}
              style={[styles.receipt, { borderColor: colors.border }]}>
              <FileText size={14} color={colors.textMuted} strokeWidth={1.75} />
              <Text style={[styles.receiptText, { color: colors.textMuted }]}>קבלה סעיף 46</Text>
            </Pressable>
          </Card>
        )}
        ListEmptyComponent={
          <Card style={styles.empty}>
            <Gift size={32} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{emptyTitle}</Text>
            <Text style={[styles.emptyBody, { color: colors.textMuted }]}>{emptyBody}</Text>
          </Card>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  screenTitle: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    textAlign: 'right',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakHint: {
    fontSize: fontSize.xs,
  },
  sectionHeader: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    gap: spacing.sm,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'right',
  },
  rowMeta: {
    fontSize: fontSize.xs,
    textAlign: 'right',
    marginTop: 2,
  },
  dedication: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
  rowAmount: {
    fontSize: fontSize.md,
    fontWeight: '900',
  },
  receipt: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
  },
  receiptText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  emptyBody: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
