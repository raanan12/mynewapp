/**
 * Local daily reminders + the "צדקה ללא לחיצה" auto-pilot nudge.
 *
 * Local notifications work in Expo Go; remote push does not (SDK 53+ on
 * Android). Everything here is intentionally local-only.
 */

import * as Notifications from 'expo-notifications';

import { isShabbatOrYomTov } from '@/lib/jewish-calendar';
import { useAppStore } from '@/store/app-store';
import type { ReminderSlot, Settings } from '@/types';
import { formatCurrency } from '@/utils/format';

/** Substitutes `{token}` placeholders - the only templating these admin-
 *  edited push texts need. */
function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

/** A weekday-scoped slot (e.g. "ערב שבת") fires only that day; everything
 *  else fires every day, same as before weekday support existed. */
function triggerFor(slot: ReminderSlot): Notifications.SchedulableNotificationTriggerInput {
  if (slot.weekday) {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: slot.weekday,
      hour: slot.hour,
      minute: slot.minute,
    };
  }

  return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: slot.hour, minute: slot.minute };
}

Notifications.setNotificationHandler({
  // Reminders/auto-pilot are scheduled as recurring OS-level triggers, so a
  // day that happens to be Shabbat/Yom Tov can't be skipped when the
  // schedule is built - only suppressed here, at actual delivery time. This
  // only runs while the app process is alive (foreground or background);
  // a fully-killed app still shows the OS notification natively, which no
  // client-side check can prevent - the auto-pilot charge itself, unlike
  // the notification, IS fully guarded server-side (see kesher-charge).
  handleNotification: async () => {
    if (isShabbatOrYomTov()) {
      return { shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: false, shouldShowList: false };
    }

    return { shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true };
  },
});

export async function requestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Rebuilds the whole schedule from settings. Cancelling everything first keeps
 * this idempotent - toggling a switch twice cannot leave duplicates behind.
 * `allSlots` is the combined admin presets + the user's own custom slots.
 */
export async function syncSchedule(settings: Settings, allSlots: ReminderSlot[]): Promise<boolean> {
  const wantsAnything =
    settings.autoPilot.enabled || Object.values(settings.reminders).some(Boolean);

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!wantsAnything) return true;

  if (!(await requestPermission())) return false;

  const slotsById = new Map(allSlots.map((slot) => [slot.id, slot]));
  const texts = useAppStore.getState().texts;

  for (const [slotId, enabled] of Object.entries(settings.reminders)) {
    if (!enabled) continue;
    const slot = slotsById.get(slotId);
    if (!slot) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `reminder-${slotId}`,
      content: {
        title: texts.reminder_push_title,
        body: renderTemplate(texts.reminder_push_body, { label: slot.label }),
        data: { slotId },
      },
      trigger: triggerFor(slot),
    });
  }

  if (settings.autoPilot.enabled) {
    const slot =
      settings.autoPilot.slotId === 'custom'
        ? {
            id: 'custom',
            label: 'שעה חופשית',
            hour: settings.autoPilot.customHour ?? 20,
            minute: settings.autoPilot.customMinute ?? 0,
          }
        : slotsById.get(settings.autoPilot.slotId);

    if (slot) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'auto-pilot',
        content: {
          title: texts.autopilot_push_title,
          body: renderTemplate(texts.autopilot_push_body, {
            amount: formatCurrency(settings.autoPilot.amount),
          }),
          data: { autoPilot: true },
        },
        trigger: triggerFor(slot),
      });
    }
  }

  return true;
}

/** One-off confirmation right after a donation completes. */
export async function notifyDonationCompleted(amount: number, streak: number): Promise<void> {
  try {
    const texts = useAppStore.getState().texts;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: texts.donation_push_title,
        body: renderTemplate(texts.donation_push_body, {
          amount: formatCurrency(amount),
          streak: String(streak),
        }),
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
