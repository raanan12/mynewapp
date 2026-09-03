import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorFeedback, successFeedback } from '@/services/feedback';
import { acceptTerms } from '@/services/terms';
import { useAppStore, useAppText, useTermsSections } from '@/store/app-store';

/**
 * Terms of service / privacy policy.
 *
 * Doubles as the acceptance gate that blocks card entry (see add-card.tsx,
 * which redirects here whenever `termsAcceptedAt`/`termsVersion` do not match
 * the current version) and as a plain read-only view from Settings once
 * already accepted. Both the wording and the version are admin-editable
 * (see `app_texts`/`terms_sections` in supabase/schema.sql).
 */
export default function TermsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const termsSections = useTermsSections();
  const currentVersion = useAppText('terms_version');
  const pageTitle = useAppText('terms_page_title');

  const alreadyAccepted = useAppStore(
    (state) => Boolean(state.termsAcceptedAt) && state.termsVersion === currentVersion
  );
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);

    const result = await acceptTerms();
    setBusy(false);

    if (!result.ok) {
      errorFeedback();
      setError(result.message);
      return;
    }

    successFeedback();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  return (
    <Screen padded={false} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{pageTitle}</Text>

        {termsSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            {section.body.split(/\n{2,}/).map((paragraph) => (
              <Text key={paragraph} style={[styles.paragraph, { color: colors.textMuted }]}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>

      {!alreadyAccepted ? (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => setChecked((value) => !value)}
            style={styles.checkboxRow}>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: checked ? colors.accent : colors.surface,
                  borderColor: checked ? colors.accent : colors.border,
                },
              ]}>
              {checked ? <Check size={18} color={colors.onAccent} strokeWidth={2.5} /> : null}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              קראתי ואני מסכים/ה לכל תנאי התקנון לעיל
            </Text>
          </Pressable>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <Button
            title="אישור והמשך"
            onPress={() => void confirm()}
            loading={busy}
            disabled={!checked}
            style={styles.confirmButton}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
  error: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
  },
  confirmButton: {
    marginTop: spacing.xs,
  },
});
