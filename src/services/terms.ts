/**
 * Terms-of-service acceptance - gates card entry (see src/app/add-card.tsx).
 *
 * The Supabase write happens BEFORE the local state is set, so the server
 * row - the actual legal record - is never behind what the UI already shows
 * as accepted. If Supabase is not configured, acceptance is local-only.
 */

import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/services/auth';
import { appText, useAppStore } from '@/store/app-store';

export async function acceptTerms(): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = await getCurrentUserId();
  const currentVersion = appText('terms_version');

  if (supabase && userId) {
    const { error } = await supabase
      .from('profiles')
      .update({ terms_accepted_at: new Date().toISOString(), terms_version: currentVersion })
      .eq('id', userId);

    if (error) {
      return { ok: false, message: 'שמירת האישור נכשלה. נסו שוב.' };
    }
  }

  useAppStore.getState().acceptTerms(currentVersion);
  return { ok: true };
}

/** True once the user accepted the current wording - not an older one. */
export function hasAcceptedCurrentTerms(): boolean {
  const { termsAcceptedAt, termsVersion } = useAppStore.getState();
  return Boolean(termsAcceptedAt) && termsVersion === appText('terms_version');
}
