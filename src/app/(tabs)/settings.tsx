import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { reminderSlots } from '@/constants/content';
import { fontSize, palette, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { kesherMode } from '@/services/kesher';
import { syncSchedule } from '@/services/notifications';
import { useAppStore, useCategories, useCoinAmounts } from '@/store/app-store';
import type { CategoryId, ReminderSlot } from '@/types';
import { formatCurrency, formatTime } from '@/utils/format';

export default function SettingsScreen() {
  const { colors } = useTheme();

  const settings = useAppStore((state) => state.settings);
  const card = useAppStore((state) => state.card);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const reset = useAppStore((state) => state.reset);
  const categories = useCategories();
  const coinAmounts = useCoinAmounts();

  const [permissionDenied, setPermissionDenied] = useState(false);

  // Any change to reminders or auto-pilot rebuilds the whole local schedule.
  useEffect(() => {
    void syncSchedule(settings).then((granted) => setPermissionDenied(!granted));
  }, [settings]);

  function toggleReminder(slot: ReminderSlot, enabled: boolean) {
    updateSettings({ reminders: { ...settings.reminders, [slot]: enabled } });
  }

  function confirmReset() {
    Alert.alert('איפוס נתונים', 'כל ההיסטוריה והרצף יימחקו מהמכשיר.', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'איפוס', style: 'destructive', onPress: reset },
    ]);
  }

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>הגדרות</Text>

        {permissionDenied ? (
          <Card style={{ borderColor: colors.danger }}>
            <Text style={[styles.warning, { color: colors.danger }]}>
              ההתראות חסומות. אפשרו התראות בהגדרות המכשיר כדי לקבל תזכורות.
            </Text>
          </Card>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>תזכורות יומיות</Text>
        <Card padded={false}>
          {(Object.keys(reminderSlots) as ReminderSlot[]).map((slot, index) => (
            <View
              key={slot}
              style={[
                styles.row,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
              ]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{reminderSlots[slot].label}</Text>
                <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                  {formatTime(reminderSlots[slot].hour, reminderSlots[slot].minute)}
                </Text>
              </View>
              <Switch
                value={settings.reminders[slot]}
                onValueChange={(enabled) => toggleReminder(slot, enabled)}
                trackColor={{ true: palette.gold, false: colors.border }}
              />
            </View>
          ))}
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>צדקה ללא לחיצה</Text>
        <Card>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>טייס אוטומטי</Text>
              <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                תרומה יומית שמחויבת אוטומטית מהכרטיס השמור בשעה שנקבעה.
              </Text>
            </View>
            <Switch
              value={settings.autoPilot.enabled}
              onValueChange={(enabled) =>
                updateSettings({ autoPilot: { ...settings.autoPilot, enabled } })
              }
              trackColor={{ true: palette.gold, false: colors.border }}
            />
          </View>

          {settings.autoPilot.enabled ? (
            <View style={styles.autoPilotBody}>
              <Text style={[styles.label, { color: colors.textMuted }]}>סכום יומי</Text>
              <View style={styles.optionRow}>
                {coinAmounts.map((amount) => (
                  <Pressable
                    key={amount}
                    onPress={() => updateSettings({ autoPilot: { ...settings.autoPilot, amount } })}
                    style={[
                      styles.option,
                      {
                        borderColor: settings.autoPilot.amount === amount ? palette.gold : colors.border,
                        backgroundColor:
                          settings.autoPilot.amount === amount ? 'rgba(212,175,55,0.14)' : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      {formatCurrency(amount)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textMuted }]}>ייעוד</Text>
              <View style={styles.optionRow}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() =>
                      updateSettings({
                        autoPilot: { ...settings.autoPilot, categoryId: category.id as CategoryId },
                      })
                    }
                    style={[
                      styles.option,
                      {
                        borderColor:
                          settings.autoPilot.categoryId === category.id ? palette.gold : colors.border,
                        backgroundColor:
                          settings.autoPilot.categoryId === category.id
                            ? 'rgba(212,175,55,0.14)'
                            : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.optionText, { color: colors.text }]}>{category.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textMuted }]}>שעה</Text>
              <View style={styles.optionRow}>
                {(Object.keys(reminderSlots) as ReminderSlot[]).map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() => updateSettings({ autoPilot: { ...settings.autoPilot, slot } })}
                    style={[
                      styles.option,
                      {
                        borderColor: settings.autoPilot.slot === slot ? palette.gold : colors.border,
                        backgroundColor:
                          settings.autoPilot.slot === slot ? 'rgba(212,175,55,0.14)' : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      {formatTime(reminderSlots[slot].hour, reminderSlots[slot].minute)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {!card ? (
                <Text style={[styles.rowMeta, { color: colors.danger }]}>
                  נדרש כרטיס שמור כדי להפעיל את הטייס האוטומטי.
                </Text>
              ) : null}
            </View>
          ) : null}
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>חוויית שימוש</Text>
        <Card padded={false}>
          <View style={styles.row}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>צליל מטבע</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(soundEnabled) => updateSettings({ soundEnabled })}
              trackColor={{ true: palette.gold, false: colors.border }}
            />
          </View>
          <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>רטט</Text>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(hapticsEnabled) => updateSettings({ hapticsEnabled })}
              trackColor={{ true: palette.gold, false: colors.border }}
            />
          </View>
        </Card>

        <Pressable onPress={confirmReset} style={[styles.link, { borderColor: colors.border }]}>
          <Ionicons name="refresh-outline" size={18} color={colors.danger} />
          <Text style={[styles.linkText, { color: colors.danger }]}>איפוס נתוני הדגמה</Text>
        </Pressable>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          סליקה: {kesherMode === 'live' ? 'קשר סליקה (חי)' : 'סביבת בדיקה'}
        </Text>
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
  warning: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'right',
  },
  rowMeta: {
    fontSize: fontSize.xs,
    lineHeight: 18,
    textAlign: 'right',
    marginTop: 2,
  },
  autoPilotBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  option: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  optionText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  linkText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'right',
  },
  footer: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
