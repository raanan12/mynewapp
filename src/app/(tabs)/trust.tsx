import { Image } from 'expo-image';
import { Award, ExternalLink, PlayCircle, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { fontSize, palette, radius, spacing, TAB_BAR_CLEARANCE } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useApprovals, useAppText, useCategories, useCategoryTotals, useCharities, useTotals } from '@/store/app-store';
import type { RabbinicalApproval } from '@/types';
import { formatCurrency } from '@/utils/format';

/** Splits "**bold**" spans out of a plain line of text. */
function parseBoldSegments(line: string): { text: string; bold: boolean }[] {
  const parts: { text: string; bold: boolean }[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line))) {
    if (match.index > lastIndex) parts.push({ text: line.slice(lastIndex, match.index), bold: false });
    parts.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) parts.push({ text: line.slice(lastIndex), bold: false });

  return parts;
}

/** Light markdown subset for admin-written copy: "## " sub-headers, "**bold**" spans. */
function RichText({ text, color }: { text: string; color: string }) {
  return (
    <>
      {text
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line, index) =>
          line.startsWith('## ') ? (
            <Text key={index} style={[styles.richHeader, { color }]}>
              {line.slice(3)}
            </Text>
          ) : (
            <Text key={index} style={[styles.richParagraph, { color }]}>
              {parseBoldSegments(line).map((part, partIndex) => (
                <Text key={partIndex} style={part.bold ? styles.richBold : undefined}>
                  {part.text}
                </Text>
              ))}
            </Text>
          )
        )}
    </>
  );
}

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
  const screenTitle = useAppText('trust_title');
  const [preview, setPreview] = useState<RabbinicalApproval | null>(null);
  const [expandedCharity, setExpandedCharity] = useState<string | null>(null);

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>{screenTitle}</Text>

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
                  <View style={styles.approvalNameRow}>
                    {approval.rabbiPhotoUrl ? (
                      <Image source={{ uri: approval.rabbiPhotoUrl }} style={styles.rabbiAvatar} contentFit="cover" />
                    ) : null}
                    <Text style={[styles.approvalName, { color: colors.text }]} numberOfLines={1}>
                      {approval.rabbiName}
                    </Text>
                  </View>
                  <Text style={[styles.approvalTitle, { color: colors.textMuted }]} numberOfLines={2}>
                    {approval.title}
                  </Text>
                  <View style={styles.approvalFooterRow}>
                    <Text style={[styles.approvalYear, { color: colors.accent }]}>{approval.year}</Text>
                    {approval.videoUrl ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => approval.videoUrl && void Linking.openURL(approval.videoUrl)}>
                        <PlayCircle size={16} color={colors.accent} strokeWidth={1.75} />
                      </Pressable>
                    ) : null}
                  </View>
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
              .map((charity) => {
                const expanded = expandedCharity === charity.id;
                const hasMore = Boolean(charity.longDescription.trim());

                return (
                  <View key={charity.id} style={styles.charityBlock}>
                    <View style={styles.charityRow}>
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

                    {hasMore || charity.websiteUrl ? (
                      <View style={styles.charityActions}>
                        {hasMore ? (
                          <Pressable onPress={() => setExpandedCharity(expanded ? null : charity.id)}>
                            <Text style={[styles.charityLink, { color: colors.accent }]}>
                              {expanded ? 'פחות' : 'עוד'}
                            </Text>
                          </Pressable>
                        ) : null}
                        {charity.websiteUrl ? (
                          <Pressable
                            style={styles.charityWebsite}
                            onPress={() => charity.websiteUrl && void Linking.openURL(charity.websiteUrl)}>
                            <ExternalLink size={13} color={colors.accent} strokeWidth={1.75} />
                            <Text style={[styles.charityLink, { color: colors.accent }]}>לאתר הארגון</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}

                    {expanded && hasMore ? (
                      <View style={styles.charityLongDescription}>
                        <RichText text={charity.longDescription} color={colors.textMuted} />
                      </View>
                    ) : null}
                  </View>
                );
              })}
          </Card>
        ))}
      </ScrollView>

      <Modal visible={preview !== null} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreview(null)}>
          {preview ? (
            <>
              <Image source={{ uri: preview.imageUrl }} style={styles.previewImage} contentFit="contain" />
              <Text style={styles.previewCaption}>{preview.rabbiName}</Text>
              {preview.videoUrl ? (
                <Pressable
                  style={styles.previewVideoButton}
                  onPress={() => preview.videoUrl && void Linking.openURL(preview.videoUrl)}>
                  <PlayCircle size={18} color={palette.cream} strokeWidth={1.75} />
                  <Text style={styles.previewCaption}>צפייה בברכה</Text>
                </Pressable>
              ) : null}
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
  approvalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 20,
  },
  rabbiAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  approvalName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'right',
  },
  approvalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 18,
  },
  approvalTitle: {
    // Fixed to exactly 2 lines' worth of space (lineHeight * 2) so a
    // one-line title doesn't leave its card shorter than its neighbors -
    // cards sit in a horizontal ScrollView row, which in RN does not
    // stretch siblings to a shared height.
    height: 32,
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
  charityBlock: {
    paddingVertical: spacing.xs,
  },
  charityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
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
  charityActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  charityWebsite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  charityLink: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  charityLongDescription: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  richHeader: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  richParagraph: {
    fontSize: fontSize.xs,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 2,
  },
  richBold: {
    fontWeight: '800',
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
  previewVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
