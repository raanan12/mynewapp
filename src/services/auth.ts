/**
 * Authentication.
 *
 * Donors sign in anonymously - the sub-10-second flow cannot start with a
 * signup form. The anonymous user is a real `auth.users` row, so it owns a
 * profile, donations and a card token, and can be upgraded to email/phone
 * later without losing history.
 *
 * There is no admin sign-in here - that lives entirely in the separate admin
 * web app, not in this app's bundle.
 */

import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/lib/supabase';

/** Signs in anonymously when there is no session yet. Safe to call repeatedly. */
export async function ensureSession(): Promise<Session | null> {
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  const { data: created, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('anonymous sign-in failed', error.message);
    return null;
  }

  return created.session;
}

/**
 * The `on_auth_user_created` trigger creates the profile, but a project that
 * was set up before the trigger existed would not have one - so we heal it.
 */
export async function ensureProfile(userId: string): Promise<ProfileRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    console.warn('profile fetch failed', error.message);
    return null;
  }
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: userId })
    .select('*')
    .single();

  if (insertError) {
    console.warn('profile create failed', insertError.message);
    return null;
  }

  return created;
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
