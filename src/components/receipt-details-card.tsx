import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { updateContactDetails } from '@/services/kesher-customer';
import { useAppStore } from '@/store/app-store';

/**
 * "פרטי קבלה" - optional contact details forwarded to Kesher's customer
 * record (UpdateCustomer), so every future charge on this customerRef gets
 * its receipt emailed automatically. Entirely optional and separate from
 * adding a card, so the card flow itself stays minimal.
 */
export function ReceiptDetailsCard() {
  const { colors } = useTheme();
  const contact = useAppStore((state) => state.contact);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(contact.fullName ?? '');
  const [email, setEmail] = useState(contact.email ?? '');
  const [phone, setPhone] = useState(contact.phone ?? '');
  const [idNumber, setIdNumber] = useState(contact.idNumber ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDetails = Boolean(contact.email);

  async function save() {
    setBusy(true);
    setError(null);

    const result = await updateContactDetails({
      fullName: fullName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      idNumber: idNumber.trim() || null,
    });

    setBusy(false);

    if (result.ok) {
      setEditing(false);
    } else {
      setError(result.message);
    }
  }

  const inputStyle = [
    styles.input,
    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
  ];

  return (
    <Card>
      <View style={styles.header}>
        <Mail size={18} color={colors.textMuted} strokeWidth={1.75} />
        <Text style={[styles.title, { color: colors.text }]}>פרטי קבלה</Text>
      </View>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        עם כתובת מייל, קבלה על כל תרומה או טעינה תישלח אליכם אוטומטית. אם עדיין לא הוספתם כרטיס,
        מלאו את הפרטים לפני כן - כך הם יישלחו כבר בעת יצירת הכרטיס.
      </Text>

      {editing ? (
        <>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="שם מלא"
            placeholderTextColor={colors.textMuted}
            style={inputStyle}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="כתובת מייל"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={inputStyle}
            textAlign="left"
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="טלפון"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            style={inputStyle}
            textAlign="left"
          />
          <TextInput
            value={idNumber}
            onChangeText={setIdNumber}
            placeholder="תעודת זהות (לצורך קבלה)"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={inputStyle}
            textAlign="left"
          />
          <Text style={[styles.idHint, { color: colors.textMuted }]}>
            לצורך קבלה המוכרת לצרכי מס
          </Text>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button title="שמירה" onPress={() => void save()} loading={busy} style={styles.flex} />
            <Button
              title="ביטול"
              variant="ghost"
              onPress={() => setEditing(false)}
              disabled={busy}
              style={styles.flex}
            />
          </View>
        </>
      ) : (
        <View style={styles.summaryRow}>
          <Text style={[styles.summary, { color: colors.text }]} numberOfLines={1}>
            {hasDetails ? contact.email : 'לא הוגדרה כתובת מייל'}
          </Text>
          <Button
            title={hasDetails ? 'עריכה' : 'הוספה'}
            variant="secondary"
            onPress={() => setEditing(true)}
            style={styles.editButton}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '700',
    textAlign: 'right',
  },
  body: {
    fontSize: fontSize.xs,
    lineHeight: 18,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    minHeight: 46,
    textAlign: 'right',
  },
  idHint: {
    fontSize: fontSize.xs,
    textAlign: 'right',
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  error: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summary: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
  editButton: {
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
});
