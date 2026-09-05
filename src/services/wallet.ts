/**
 * Payment orchestration: there is no prepaid wallet - every donation charges
 * the saved Kesher (קשר סליקה) card directly, for the exact amount tapped,
 * at the moment it is tapped. The Edge Function (`kesher-charge`) reads the
 * token from the caller's own profile and records the donation server-side
 * in the same call, so the client can neither pick someone else's card nor
 * invent a donation that was never actually charged.
 */

import { invokeEdgeFunction } from '@/lib/edge-functions';
import type { DonationRow } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/services/auth';
import { pullProfile } from '@/services/sync';
import { useAppStore, type DonationOutcome } from '@/store/app-store';
import type { CategoryId, Donation, DonationSource } from '@/types';

/** Hard ceiling for "צדקה ללא לחיצה" auto-pilot's daily amount - a manual
 *  coin tap has no such cap, since the user is actively choosing it each time. */
export const AUTO_PILOT_MAX_AMOUNT = 50;

export type DonationInput = {
  amount: number;
  categoryId: CategoryId;
  dedication?: string | null;
  source?: DonationSource;
};

/**
 * Removes the saved card, both locally and on the server. Clearing only the
 * local state would be a lie: the token would come right back on the next
 * profile sync, since it is Supabase's `profiles.kesher_token` that actually
 * lets a charge go through - not anything held on the device.
 */
export async function removeSavedCard(): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = await getCurrentUserId();

  if (supabase && userId) {
    const { error } = await supabase
      .from('profiles')
      .update({
        kesher_token: null,
        kesher_card_last4: null,
        kesher_card_brand: null,
        kesher_card_expiry: null,
      })
      .eq('id', userId);

    if (error) {
      return { ok: false, message: 'הסרת הכרטיס נכשלה. נסו שוב.' };
    }
  }

  useAppStore.getState().removeCard();
  return { ok: true };
}

type ChargeResponse = {
  transactionId?: string | null;
  donation?: DonationRow;
};

function toDonation(row: DonationRow): Donation {
  return {
    id: row.client_id ?? row.id,
    amount: Number(row.amount),
    categoryId: row.category_id,
    dedication: row.dedication,
    createdAt: row.created_at,
    status: row.status,
    source: row.source,
    receiptUrl: row.receipt_url,
    synced: true,
  };
}

/**
 * Charges the saved card for the exact donation amount and records it.
 * This is the only way a donation is ever created - there is no local/
 * offline path, since without a wallet there is nothing to debit locally.
 */
export async function donateWithFunds(input: DonationInput): Promise<DonationOutcome> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, reason: 'invalidAmount' };
  }

  const { card } = useAppStore.getState();
  if (!card || !supabase) {
    return {
      ok: false,
      reason: 'noCard',
      message: 'אין כרטיס אשראי שמור. הוסיפו כרטיס כדי לתרום.',
    };
  }

  const result = await invokeEdgeFunction<ChargeResponse>('kesher-charge', {
    amount: input.amount,
    category: input.categoryId,
    dedication: input.dedication ?? null,
    source: input.source ?? 'manual',
  });

  if (!result.ok || !result.data.donation) {
    return {
      ok: false,
      reason: 'chargeFailed',
      message: result.ok ? 'החיוב בוצע אך לא התקבל אישור. בדקו את ההיסטוריה.' : result.message,
    };
  }

  const previousStreak = useAppStore.getState().streak;
  const donation = toDonation(result.data.donation);

  // apply_direct_donation already advanced the streak server-side.
  await pullProfile();
  const streak = useAppStore.getState().streak;
  useAppStore.getState().recordExternalDonation(donation, streak);

  return {
    ok: true,
    donation,
    streak,
    isNewStreakDay: previousStreak.lastDonationDate !== streak.lastDonationDate,
  };
}
