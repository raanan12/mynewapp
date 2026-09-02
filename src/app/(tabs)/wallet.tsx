import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ReceiptDetailsCard } from '@/components/receipt-details-card';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { kesherMode } from '@/services/kesher';
import { removeSavedCard } from '@/services/wallet';
import { useAppStore } from '@/store/app-store';

export default function WalletScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const card = useAppStore((state) => state.card);
  const [removingCard, setRemovingCard] = useState(false);

  function confirmRemoveCard() {
    Alert.alert('הסרת כרטיס', 'הטוקן יימחק לגמרי ותצטרכו להזין את הכרטיס מחדש בפעם הבאה.', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'הסרה',
        style: 'destructive',
        onPress: async () => {
          setRemovingCard(true);
          const result = await removeSavedCard();
          setRemovingCard(false);

          if (!result.ok) {
            Alert.alert('הסרת הכרטיס נכשלה', result.message);
          }
        },
      },
    ]);
  }

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>כרטיס אשראי</Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>אמצעי תשלום</Text>
        {card ? (
          <Card>
            <View style={styles.cardRow}>
              <Ionicons name="card-outline" size={22} color={colors.textMuted} />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardBrand, { color: colors.text }]}>
                  {card.brand} •••• {card.last4}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                  תוקף {card.expiry} · נשמר כטוקן מאובטח
                </Text>
              </View>
              <Pressable
                onPress={confirmRemoveCard}
                disabled={removingCard}
                accessibilityRole="button">
                {removingCard ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                )}
              </Pressable>
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>עדיין לא הוזן כרטיס</Text>
            <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
              מזינים פרטי אשראי פעם אחת בלבד. לאחר מכן כל תרומה מחייבת את הכרטיס ישירות, בלחיצה
              אחת, ופרטי הכרטיס לא נשמרים במכשיר.
            </Text>
            <Button title="הוספת כרטיס" onPress={() => router.push('/add-card')} style={styles.addCard} />
          </Card>
        )}

        <ReceiptDetailsCard />

        {kesherMode === 'sandbox' ? (
          <Text style={[styles.sandbox, { color: colors.textMuted }]}>
            מצב בדיקה: הסליקה מדומה. חיבור לקשר סליקה מופעל דרך משתני הסביבה.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: fontSize.md,
    fontWeight: '700',
    textAlign: 'right',
  },
  cardMeta: {
    fontSize: fontSize.xs,
    textAlign: 'right',
    marginTop: 2,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyBody: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  addCard: {
    marginTop: spacing.md,
  },
  sandbox: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
