import { useEffect } from 'react';
import { AppState } from 'react-native';

import { notifyDonationCompleted } from '@/services/notifications';
import { donateWithFunds } from '@/services/wallet';
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
 */
export function useAutoPilot(): void {
  useEffect(() => {
    async function run() {
      const { settings, streak, reminderPresets } = useAppStore.getState();
      if (!settings.autoPilot.enabled) return;

      const today = toDateKey();
      if (streak.lastDonationDate === today) return;

      const allSlots = [...reminderPresets, ...settings.customReminders];
      const slot = allSlots.find((candidate) => candidate.id === settings.autoPilot.slotId);
      if (!slot) return;
      const { hour, minute } = slot;
      const now = new Date();
      const dueAt = new Date();
      dueAt.setHours(hour, minute, 0, 0);
      if (now < dueAt) return;

      const outcome = await donateWithFunds({
        amount: settings.autoPilot.amount,
        categoryId: settings.autoPilot.categoryId,
        source: 'auto',
      });

      if (outcome.ok) {
        await notifyDonationCompleted(outcome.donation.amount, outcome.streak.current);
      }
    }

    void run();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void run();
    });

    return () => subscription.remove();
  }, []);
}
