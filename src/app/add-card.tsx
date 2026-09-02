import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { isSupabaseConfigured } from '@/config/env';
import { fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorFeedback, successFeedback } from '@/services/feedback';
import { KesherError, kesher, kesherMode } from '@/services/kesher';
import { startHostedCardEntry } from '@/services/kesher-hosted';
import { useAppStore } from '@/store/app-store';

/** Group the PAN into 4-digit blocks while typing. */
function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/**
 * One-time card entry.
 *
 * Preferred path: Kesher's hosted page, so the card number never reaches this
 * app or our servers and we stay out of PCI scope. The manual form below is the
 * fallback for local development and for the sandbox.
 */
export default function AddCardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const saveCard = useAppStore((state) => state.saveCard);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holderId, setHolderId] = useState('');
  const [holderName, setHolderName] = useState('');

  const canSubmit =
    number.replace(/\s/g, '').length >= 13 && expiry.length === 5 && cvv.length >= 3 && holderId.length >= 8;

  async function openHostedPage() {
    setBusy(true);
    setError(null);

    const result = await startHostedCardEntry();
    setBusy(false);

    if (result.ok) {
      successFeedback();
      router.back();
      return;
    }

    if (result.reason !== 'cancelled') {
      errorFeedback();
      setError(result.message);
    }
  }

  async function submitManual() {
    setBusy(true);
    setError(null);

    try {
      const token = await kesher.tokenizeCard({ number, expiry, cvv, holderId, holderName });
      saveCard(token);
      successFeedback();
      router.back();
    } catch (caught) {
      errorFeedback();
      setError(caught instanceof KesherError ? caught.message : 'שמירת הכרטיס נכשלה. נסו שוב.');
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = [
    styles.input,
    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
  ];

  if (isSupabaseConfigured) {
    return (
      <Screen>
        <View style={styles.hosted}>
          <Ionicons name="shield-checkmark-outline" size={54} color={colors.accent} />

          <Text style={[styles.hostedTitle, { color: colors.text }]}>הזנת כרטיס מאובטחת</Text>
          <Text style={[styles.hostedBody, { color: colors.textMuted }]}>
            פרטי הכרטיס מוזנים ישירות בדף המאובטח של קשר סליקה. הם אינם עוברים דרך האפליקציה ואינם
            נשמרים בשרתים שלנו — אנחנו מקבלים רק טוקן לחיובים עתידיים.
          </Text>

          <Card style={styles.steps}>
            {[
              'נפתח דף הסליקה של קשר',
              'מזינים את פרטי הכרטיס פעם אחת',
              'הטוקן חוזר אלינו אוטומטית',
              'מכאן והלאה — טעינה בלחיצה אחת',
            ].map((step, index) => (
              <View key={step} style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.stepNumberText, { color: colors.accent }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
              </View>
            ))}
          </Card>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <Button
            title={busy ? 'ממתינים לאישור...' : 'פתיחת דף הסליקה'}
            onPress={() => void openHostedPage()}
            loading={busy}
            style={styles.hostedButton}
          />

          {busy ? (
            <Text style={[styles.waiting, { color: colors.textMuted }]}>
              לאחר סיום ההזנה בדף של קשר, הכרטיס יופיע כאן אוטומטית.
            </Text>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card>
            <View style={styles.secureRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.success} />
              <Text style={[styles.secureText, { color: colors.textMuted }]}>
                הפרטים נשלחים ישירות לסליקה ומוחלפים בטוקן מאובטח. מספר הכרטיס אינו נשמר במכשיר ולא
                בשרתי האפליקציה.
              </Text>
            </View>
          </Card>

          <Text style={[styles.label, { color: colors.textMuted }]}>מספר כרטיס</Text>
          <TextInput
            value={number}
            onChangeText={(value) => setNumber(formatCardNumber(value))}
            keyboardType="number-pad"
            placeholder="0000 0000 0000 0000"
            placeholderTextColor={colors.textMuted}
            style={inputStyle}
            textAlign="left"
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={[styles.label, { color: colors.textMuted }]}>תוקף</Text>
              <TextInput
                value={expiry}
                onChangeText={(value) => setExpiry(formatExpiry(value))}
                keyboardType="number-pad"
                placeholder="MM/YY"
                placeholderTextColor={colors.textMuted}
                style={inputStyle}
                textAlign="left"
              />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.label, { color: colors.textMuted }]}>CVV</Text>
              <TextInput
                value={cvv}
                onChangeText={(value) => setCvv(value.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                placeholder="123"
                placeholderTextColor={colors.textMuted}
                style={inputStyle}
                textAlign="left"
                secureTextEntry
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>תעודת זהות של בעל הכרטיס</Text>
          <TextInput
            value={holderId}
            onChangeText={(value) => setHolderId(value.replace(/\D/g, '').slice(0, 9))}
            keyboardType="number-pad"
            placeholder="000000000"
            placeholderTextColor={colors.textMuted}
            style={inputStyle}
            textAlign="left"
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>שם בעל הכרטיס</Text>
          <TextInput
            value={holderName}
            onChangeText={setHolderName}
            placeholder="ישראל ישראלי"
            placeholderTextColor={colors.textMuted}
            style={inputStyle}
          />

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <Button
            title="שמירת הכרטיס"
            onPress={() => void submitManual()}
            loading={busy}
            disabled={!canSubmit}
            style={styles.submit}
          />

          {kesherMode === 'sandbox' ? (
            <Text style={[styles.sandbox, { color: colors.textMuted }]}>
              סביבת בדיקה: השתמשו בכרטיס לדוגמה 4580 0000 0000 0000 עם ת״ז תקינה.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  hosted: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  hostedTitle: {
    fontSize: fontSize.lg,
    fontWeight: '900',
    textAlign: 'center',
  },
  hostedBody: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    textAlign: 'center',
  },
  steps: {
    width: '100%',
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: fontSize.xs,
    fontWeight: '900',
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.sm,
    textAlign: 'right',
  },
  hostedButton: {
    width: '100%',
  },
  waiting: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  secureRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  secureText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: 18,
    textAlign: 'right',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    minHeight: 50,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  error: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.lg,
  },
  sandbox: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
