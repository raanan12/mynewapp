/**
 * Local daily reminders + the "צדקה ללא לחיצה" auto-pilot nudge.
 *
 * Local notifications work in Expo Go; remote push does not (SDK 53+ on
 * Android). Everything here is intentionally local-only.
 */

import * as Notifications from 'expo-notifications';

import { reminderSlots } from '@/constants/content';
import type { ReminderSlot, Settings } from '@/types';
import { formatCurrency } from '@/utils/format';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_TEXT: Record<ReminderSlot, { title: string; body: string }> = {
  morning: {
    title: 'רגע של חסד',
    body: 'פותחים את היום בצדקה - שקל אחד, עשר שניות.',
  },
  afternoon: {
    title: 'זמן מנחה',
    body: 'עוד לא נתתם היום. אל תשברו את הרצף.',
  },
  evening: {
    title: 'לפני שהיום נגמר',
    body: 'תרומה קטנה עכשיו שומרת על הרצף שלכם.',
  },
  preShabbat: {
    title: 'ערב שבת',
    body: 'נותנים צדקה לפני הדלקת נרות.',
  },
};

export async function requestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Rebuilds the whole schedule from settings. Cancelling everything first keeps
 * this idempotent - toggling a switch twice cannot leave duplicates behind.
 */
export async function syncSchedule(settings: Settings): Promise<boolean> {
  const wantsAnything =
    settings.autoPilot.enabled || Object.values(settings.reminders).some(Boolean);

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!wantsAnything) return true;

  if (!(await requestPermission())) return false;

  const slots = Object.keys(reminderSlots) as ReminderSlot[];

  for (const slot of slots) {
    if (!settings.reminders[slot]) continue;

    const { hour, minute } = reminderSlots[slot];
    await Notifications.scheduleNotificationAsync({
      identifier: `reminder-${slot}`,
      content: { ...REMINDER_TEXT[slot], data: { slot } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  }

  if (settings.autoPilot.enabled) {
    const { hour, minute } = reminderSlots[settings.autoPilot.slot];
    await Notifications.scheduleNotificationAsync({
      identifier: 'auto-pilot',
      content: {
        title: 'הצדקה היומית בוצעה',
        body: `${formatCurrency(settings.autoPilot.amount)} נתרמו מארנק החסד שלכם.`,
        data: { autoPilot: true },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  }

  return true;
}

/** One-off confirmation right after a donation completes. */
export async function notifyDonationCompleted(amount: number, streak: number): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'תודה על הנתינה',
        body: `${formatCurrency(amount)} נכנסו לקופה. רצף של ${streak} ימים.`,
      },
      trigger: null,
    });
  } catch {
    // Permission may be denied - the in-app confirmation already covered it.
  }
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
