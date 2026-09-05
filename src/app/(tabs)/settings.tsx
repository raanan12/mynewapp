import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { fontSize, palette, radius, spacing, TAB_BAR_CLEARANCE } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { kesherMode } from '@/services/kesher';
import { syncSchedule } from '@/services/notifications';
import { useAllReminderSlots, useAppStore, useCategories, useCoinAmounts } from '@/store/app-store';
import type { CategoryId } from '@/types';
import { formatCurrency, formatTime } from '@/utils/format';

const MINUTE_OPTIONS = [0, 15, 30, 45];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const settings = useAppStore((state) => state.settings);
  const card = useAppStore((state) => state.card);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const categories = useCategories();
  const coinAmounts = useCoinAmounts();
  const allSlots = useAllReminderSlots();

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [customHour, setCustomHour] = useState('20');
  const [customMinute, setCustomMinute] = useState(0);
  const [customLabel, setCustomLabel] = useState('');

  // Any change to reminders or auto-pilot rebuilds the whole local schedule.
  useEffect(() => {
    void syncSchedule(settings, allSlots).then((granted) => setPermissionDenied(!granted));
  }, [settings, allSlots]);

  function toggleReminder(slotId: string, enabled: boolean) {
    updateSettings({ reminders: { ...settings.reminders, [slotId]: enabled } });
  }

  function addCustomReminder() {
    const hour = Math.max(0, Math.min(23, Number(customHour) || 0));
    const id = `custom-${Date.now().toString(36)}`;
    const slot = { id, label: customLabel.trim() || 'תזכורת אישית', hour, minute: customMinute, isCustom: true };

    updateSettings({
      customReminders: [...settings.customReminders, slot],
      reminders: { ...settings.reminders, [id]: true },
    });
    setCustomLabel('');
  }

  function removeCustomReminder(id: string) {
    updateSettings({
      customReminders: settings.customReminders.filter((slot) => slot.id !== id),
      reminders: { ...settings.reminders, [id]: false },
    });
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
          {allSlots.map((slot, index) => (
            <View
              key={slot.id}
              style={[
                styles.row,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
              ]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{slot.label}</Text>
                <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                  {formatTime(slot.hour, slot.minute)}
                </Text>
              </View>
              {slot.isCustom ? (
                <Pressable accessibilityRole="button" onPress={() => removeCustomReminder(slot.id)}>
                  <Trash2 size={18} color={colors.danger} strokeWidth={1.75} />
                </Pressable>
              ) : null}
              <Switch
                value={settings.reminders[slot.id] ?? false}
                onValueChange={(enabled) => toggleReminder(slot.id, enabled)}
                trackColor={{ true: palette.gold, false: colors.border }}
              />
            </View>
          ))}

          <View style={[styles.customForm, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textMuted, marginTop: 0 }]}>הוספת תזכורת בשעה חופשית</Text>
            <View style={styles.customRow}>
              <TextInput
                value={customHour}
                onChangeText={setCustomHour}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="שעה"
                placeholderTextColor={colors.textMuted}
                style={[styles.hourInput, { color: colors.text, borderColor: colors.border }]}
              />
              <View style={styles.optionRow}>
                {MINUTE_OPTIONS.map((minute) => (
                  <Pressable
                    key={minute}
                    onPress={() => setCustomMinute(minute)}
                    style={[
                      styles.option,
                      {
                        borderColor: customMinute === minute ? palette.gold : colors.border,
                        backgroundColor: customMinute === minute ? 'rgba(197,160,89,0.14)' : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.optionText, { color: colors.text }]}>{String(minute).padStart(2, '0')}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <TextInput
              value={customLabel}
              onChangeText={setCustomLabel}
              placeholder="כיתוב אישי (אופציונלי)"
              placeholderTextColor={colors.textMuted}
              style={[styles.labelInput, { color: colors.text, borderColor: colors.border }]}
            />
            <Pressable
              onPress={addCustomReminder}
              style={[styles.addButton, { borderColor: palette.gold }]}
              accessibilityRole="button">
              <Plus size={16} color={palette.gold} strokeWidth={1.75} />
              <Text style={[styles.addButtonText, { color: palette.gold }]}>הוספה</Text>
            </Pressable>
          </View>
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
                          settings.autoPilot.amount === amount ? 'rgba(197,160,89,0.14)' : 'transparent',
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
                            ? 'rgba(197,160,89,0.14)'
                            : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.optionText, { color: colors.text }]}>{category.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textMuted }]}>שעה</Text>
              <View style={styles.optionRow}>
                {allSlots.map((slot) => (
                  <Pressable
                    key={slot.id}
                    onPress={() => updateSettings({ autoPilot: { ...settings.autoPilot, slotId: slot.id } })}
                    style={[
                      styles.option,
                      {
                        borderColor: settings.autoPilot.slotId === slot.id ? palette.gold : colors.border,
                        backgroundColor:
                          settings.autoPilot.slotId === slot.id ? 'rgba(197,160,89,0.14)' : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      {formatTime(slot.hour, slot.minute)}
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

        <Pressable onPress={() => router.push('/terms')} style={[styles.link, { borderColor: colors.border }]}>
          <FileText size={18} color={colors.textMuted} strokeWidth={1.75} />
          <Text style={[styles.linkText, { color: colors.text }]}>תקנון ותנאי שימוש</Text>
          <ChevronLeft size={18} color={colors.textMuted} strokeWidth={1.75} />
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
  customForm: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hourInput: {
    width: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  labelInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.sm,
    textAlign: 'right',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
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
