/**
 * Terms-of-service acceptance - gates card entry (see src/app/add-card.tsx).
 *
 * The Supabase write happens BEFORE the local state is set, so the server
 * row - the actual legal record - is never behind what the UI already shows
 * as accepted. If Supabase is not configured, acceptance is local-only.
 */

import { TERMS_VERSION } from '@/constants/terms';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/services/auth';
import { useAppStore } from '@/store/app-store';

export async function acceptTerms(): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = await getCurrentUserId();

  if (supabase && userId) {
    const { error } = await supabase
      .from('profiles')
      .update({ terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION })
      .eq('id', userId);

    if (error) {
      return { ok: false, message: 'שמירת האישור נכשלה. נסו שוב.' };
    }
  }

  useAppStore.getState().acceptTerms(TERMS_VERSION);
  return { ok: true };
}

/** True once the user accepted the current wording - not an older one. */
export function hasAcceptedCurrentTerms(): boolean {
  const { termsAcceptedAt, termsVersion } = useAppStore.getState();
  return Boolean(termsAcceptedAt) && termsVersion === TERMS_VERSION;
}
