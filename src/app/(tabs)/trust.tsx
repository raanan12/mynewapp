import { Image } from 'expo-image';
import { Award, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { fontSize, palette, radius, spacing, TAB_BAR_CLEARANCE } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApprovals, useAppText, useCategories, useCategoryTotals, useCharities, useTotals } from '@/store/app-store';
import type { RabbinicalApproval } from '@/types';
import { formatCurrency } from '@/utils/format';

/** "לאן הכסף הולך" - approvals, allocation breakdown and receipt info. */
export default function TrustScreen() {
  const { colors } = useTheme();
  const categories = useCategories();
  const charities = useCharities();
  const approvals = useApprovals();
  const byCategory = useCategoryTotals();
  const totals = useTotals();
  const associationName = useAppText('association_name');
  const associationNumber = useAppText('association_number');
  const associationClause46 = useAppText('association_clause46');
  const [preview, setPreview] = useState<RabbinicalApproval | null>(null);

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>לאן הכסף הולך</Text>

        <Card elevated>
          <View style={styles.badgeRow}>
            <ShieldCheck size={20} color={palette.gold} strokeWidth={1.75} />
            <Text style={[styles.badgeText, { color: colors.text }]}>{associationClause46}</Text>
          </View>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {associationName} · ע.ר. {associationNumber}. כל תרומה מזכה בקבלה דיגיטלית המוכרת
            לצורכי החזר מס, ונשלחת אוטומטית עם השלמת התרומה.
          </Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>הסכמות רבנים</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {approvals.map((approval) => (
            <Pressable key={approval.id} onPress={() => setPreview(approval)}>
              <Card padded={false} elevated style={styles.approvalCard}>
                <Image
                  source={{ uri: approval.imageUrl }}
                  style={styles.approvalImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.approvalMeta}>
                  <Text style={[styles.approvalName, { color: colors.text }]} numberOfLines={1}>
                    {approval.rabbiName}
                  </Text>
                  <Text style={[styles.approvalTitle, { color: colors.textMuted }]} numberOfLines={2}>
                    {approval.title}
                  </Text>
                  <Text style={[styles.approvalYear, { color: colors.accent }]}>{approval.year}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>פילוח הנתינה שלכם</Text>
        <Card>
          {categories.map((category) => {
            const amount = byCategory[category.id];
            const share = totals.total > 0 ? (amount / totals.total) * 100 : 0;

            return (
              <View key={category.id} style={styles.breakdownRow}>
                <View style={styles.breakdownHead}>
                  <Text style={[styles.breakdownLabel, { color: colors.text }]}>{category.label}</Text>
                  <Text style={[styles.breakdownValue, { color: colors.textMuted }]}>
                    {formatCurrency(amount)}
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
                  <View
                    style={[styles.fill, { width: `${Math.max(share, 2)}%`, backgroundColor: palette.gold }]}
                  />
                </View>
              </View>
            );
          })}
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>הארגונים הנתמכים</Text>
        {categories.map((category) => (
          <Card key={category.id}>
            <Text style={[styles.categoryName, { color: colors.text }]}>{category.label}</Text>
            {charities
              .filter((charity) => charity.categoryId === category.id)
              .map((charity) => (
                <View key={charity.id} style={styles.charityRow}>
                  <View style={styles.charityInfo}>
                    <Text style={[styles.charityName, { color: colors.text }]}>{charity.name}</Text>
                    <Text style={[styles.charityDesc, { color: colors.textMuted }]}>
                      {charity.description}
                    </Text>
                  </View>
                  <View style={styles.charityTags}>
                    <Text style={[styles.allocation, { color: colors.accent }]}>
                      {charity.allocation}%
                    </Text>
                    {charity.hasClause46 ? (
                      <Award size={14} color={colors.success} strokeWidth={1.75} />
                    ) : null}
                  </View>
                </View>
              ))}
          </Card>
        ))}
      </ScrollView>

      <Modal visible={preview !== null} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreview(null)}>
          {preview ? (
            <>
              <Image source={{ uri: preview.imageUrl }} style={styles.previewImage} contentFit="contain" />
              <Text style={styles.previewCaption}>{preview.rabbiName}</Text>
            </>
          ) : null}
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  screenTitle: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'right',
  },
  body: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  gallery: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  approvalCard: {
    width: 168,
  },
  approvalImage: {
    width: '100%',
    height: 200,
  },
  approvalMeta: {
    padding: spacing.sm,
    gap: 2,
  },
  approvalName: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'right',
  },
  approvalTitle: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    textAlign: 'right',
  },
  approvalYear: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textAlign: 'right',
  },
  breakdownRow: {
    marginBottom: spacing.md,
  },
  breakdownHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  breakdownLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  breakdownValue: {
    fontSize: fontSize.sm,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  charityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  charityInfo: {
    flex: 1,
  },
  charityName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'right',
  },
  charityDesc: {
    fontSize: fontSize.xs,
    textAlign: 'right',
    marginTop: 2,
  },
  charityTags: {
    alignItems: 'center',
    gap: 2,
  },
  allocation: {
    fontSize: fontSize.sm,
    fontWeight: '900',
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  previewCaption: {
    color: palette.cream,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
