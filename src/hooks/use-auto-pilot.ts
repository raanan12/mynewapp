import { useEffect } from 'react';
import { AppState } from 'react-native';

import { isShabbatOrYomTov } from '@/lib/jewish-calendar';
import { notifyDonationCompleted } from '@/services/notifications';
import { AUTO_PILOT_MAX_AMOUNT, donateWithFunds } from '@/services/wallet';
import { useAppStore } from '@/store/app-store';
import { toDateKey } from '@/utils/format';

/**
 * "צדקה ללא לחיצה" - auto-pilot.
 *
 * Runs on launch and whenever the app comes to the foreground: if auto-pilot is
 * on, today's slot time has passed and nothing was given yet today, the daily
 * amount is charged directly to the saved card.
 *
 * This is deliberately client-side so it works in Expo Go without a backend.
 * For a true server-side charge at the exact minute, move this to a Supabase
 * scheduled function that reads the same profile fields.
 *
 * `running` guards against overlapping calls - `AppState` can fire "active"
 * more than once in quick succession (e.g. right after launch), and without
 * this, two calls both read the same stale `streak.lastDonationDate` before
 * either one's charge finishes and updates it, charging the card twice (or
 * more) for one day. This alone isn't a complete fix - see
 * `kesher-charge`'s own per-day guard for the part that holds even across
 * separate app launches.
 */
export function useAutoPilot(): void {
  useEffect(() => {
    let running = false;

    async function run() {
      if (running) return;
      running = true;

      try {
        const { settings, streak, reminderPresets } = useAppStore.getState();
        if (!settings.autoPilot.enabled) return;
        if (isShabbatOrYomTov()) return;

        const today = toDateKey();
        if (streak.lastDonationDate === today) return;

        let hour: number;
        let minute: number;
        let weekday: number | undefined;

        if (settings.autoPilot.slotId === 'custom') {
          hour = settings.autoPilot.customHour ?? 20;
          minute = settings.autoPilot.customMinute ?? 0;
        } else {
          const allSlots = [...reminderPresets, ...(settings.customReminders ?? [])];
          const slot = allSlots.find((candidate) => candidate.id === settings.autoPilot.slotId);
          if (!slot) return;
          hour = slot.hour;
          minute = slot.minute;
          weekday = slot.weekday;
        }

        const now = new Date();
        // weekday is 1-7/Sunday=1; Date#getDay() is 0-6/Sunday=0.
        if (weekday && now.getDay() + 1 !== weekday) return;

        const dueAt = new Date();
        dueAt.setHours(hour, minute, 0, 0);
        if (now < dueAt) return;

        const outcome = await donateWithFunds({
          amount: Math.min(settings.autoPilot.amount, AUTO_PILOT_MAX_AMOUNT),
          categoryId: settings.autoPilot.categoryId,
          source: 'auto',
        });

        if (outcome.ok) {
          await notifyDonationCompleted(outcome.donation.amount, outcome.streak.current);
        }
      } finally {
        running = false;
      }
    }

    void run();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void run();
    });

    return () => subscription.remove();
  }, []);
}
