/**
 * Hosted card entry (קשר סליקה) - tokenization.
 *
 * The card number never touches this app or our servers:
 *
 *   1. We send the user's browser to
 *      https://ultra.kesherhk.info/external/paymentPage/{tokenization_page_id}
 *      ?customerRef={userId}&successurl=...&failedurl=...
 *      (`tokenization_page_id` comes from the public `kesher_settings` table,
 *      not from a build-time env var, so it can change without a new build).
 *   2. The user types their card there - Kesher, not us, sees it.
 *   3. Kesher's SERVER calls our `token-callback` Edge Function directly with
 *      POST - independently of the user's browser. That URL is registered
 *      once in Kesher's merchant admin panel ("נתיב לקבלת טוקן" on the token
 *      page's settings), not passed per-request, and saves the token onto the
 *      profile.
 *   4. In parallel, Kesher's page redirects the user's own browser to
 *      `successurl`/`failedurl`, which is what lets
 *      `WebBrowser.openAuthSessionAsync` below detect completion and close the
 *      browser. That redirect carries no card data - it is a separate channel
 *      from step 3 - so we still wait (Realtime + poll) for the profile write
 *      rather than trusting the redirect alone.
 */

import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';
import { ensureSession } from '@/services/auth';
import { useAppStore } from '@/store/app-store';
import type { CardToken } from '@/types';

export type HostedEntryResult =
  | { ok: true; card: CardToken }
  | { ok: false; reason: 'cancelled' | 'timeout' | 'unconfigured' | 'error'; message: string };

const RETURN_URL = 'dailychesed://add-card/done';
const SUCCESS_URL = `${RETURN_URL}?status=success`;
const FAILED_URL = `${RETURN_URL}?status=error`;

/** How long to wait for the callback after the browser closes without a clear result. */
const TOKEN_TIMEOUT_MS = 90_000;
/** Grace period when the browser was cancelled/dismissed - the user may have
 *  actually finished just before closing it. */
const GRACE_PERIOD_MS = 8_000;

async function fetchTokenizationPageId(): Promise<string | null> {
  if (!supabase) return null;

  const { data } = await supabase
    .from('kesher_settings')
    .select('tokenization_page_id')
    .eq('id', 'default')
    .maybeSingle();

  return data?.tokenization_page_id ?? null;
}

/**
 * `name`/`tel`/`mail` are documented as generic "default value" params any
 * Kesher payment page accepts via the URL. The token page's UI only shows
 * card number + expiry, but it is untested whether it still attaches these
 * defaults to the customer record it creates behind the scenes - worth
 * trying, since we already have this contact info locally when the user
 * filled in "פרטי קבלה" before adding a card.
 */
function buildHostedUrl(pageId: string, userId: string): string {
  const url = new URL(`https://ultra.kesherhk.info/external/paymentPage/${pageId}`);
  url.searchParams.set('customerRef', userId);
  url.searchParams.set('successurl', SUCCESS_URL);
  url.searchParams.set('failedurl', FAILED_URL);

  const { contact } = useAppStore.getState();
  if (contact.fullName) url.searchParams.set('name', contact.fullName);
  if (contact.phone) url.searchParams.set('tel', contact.phone);
  if (contact.email) url.searchParams.set('mail', contact.email);

  return url.toString();
}

async function fetchCard(userId: string): Promise<CardToken | null> {
  if (!supabase) return null;

  const { data } = await supabase
    .from('profiles')
    .select('kesher_token, kesher_card_last4, kesher_card_brand, kesher_card_expiry')
    .eq('id', userId)
    .maybeSingle();

  if (!data?.kesher_token) return null;

  return {
    token: data.kesher_token,
    last4: data.kesher_card_last4 ?? '****',
    brand: data.kesher_card_brand ?? 'כרטיס אשראי',
    expiry: data.kesher_card_expiry ?? '',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Resolves as soon as the profile row gains a Kesher token.
 * Realtime is the fast path; the poll is the safety net for projects where
 * Realtime is not enabled on the `profiles` table.
 */
function waitForToken(userId: string, signal: { cancelled: boolean }): Promise<CardToken | null> {
  if (!supabase) return Promise.resolve(null);
  const client = supabase;

  return new Promise((resolve) => {
    let settled = false;

    const finish = (card: CardToken | null) => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      clearTimeout(timeout);
      void client.removeChannel(channel);
      resolve(card);
    };

    const channel = client
      .channel(`profile-token-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => {
          void fetchCard(userId).then((card) => card && finish(card));
        }
      )
      .subscribe();

    const poll = setInterval(async () => {
      if (signal.cancelled) return finish(null);
      const card = await fetchCard(userId);
      if (card) finish(card);
    }, 2500);

    const timeout = setTimeout(() => finish(null), TOKEN_TIMEOUT_MS);
  });
}

/** Opens the hosted page and resolves once the token is confirmed. */
export async function startHostedCardEntry(): Promise<HostedEntryResult> {
  const pageId = await fetchTokenizationPageId();
  if (!pageId) {
    return {
      ok: false,
      reason: 'unconfigured',
      message: 'דף הסליקה של קשר לא הוגדר (kesher_settings.tokenization_page_id).',
    };
  }

  const session = await ensureSession();
  if (!session) {
    return { ok: false, reason: 'error', message: 'נדרש חיבור לשרת כדי לשמור כרטיס.' };
  }

  const userId = session.user.id;
  const signal = { cancelled: false };

  // Start listening before opening the browser - Kesher's server-to-server
  // call to token-callback can land before the browser even finishes closing.
  const tokenPromise = waitForToken(userId, signal);

  let browserFailed = false;

  try {
    const result = await WebBrowser.openAuthSessionAsync(buildHostedUrl(pageId, userId), RETURN_URL);

    if (result.type === 'success') {
      const status = new URL(result.url).searchParams.get('status');
      browserFailed = status === 'error';
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      // The user may have actually finished just before dismissing the
      // browser, so give the callback a short grace period rather than
      // bailing immediately.
      const card = await Promise.race([
        tokenPromise,
        new Promise<null>((resolve) => setTimeout(resolve, GRACE_PERIOD_MS, null)),
      ]);

      if (card) {
        useAppStore.getState().saveCard(card);
        return { ok: true, card };
      }

      signal.cancelled = true;
      return { ok: false, reason: 'cancelled', message: 'הזנת הכרטיס בוטלה.' };
    }
  } catch (error) {
    signal.cancelled = true;
    console.warn('hosted card entry failed', error);
    return { ok: false, reason: 'error', message: 'לא הצלחנו לפתוח את דף הסליקה.' };
  }

  if (browserFailed) {
    signal.cancelled = true;
    return { ok: false, reason: 'error', message: 'קשר דיווחה שהזנת הכרטיס נכשלה.' };
  }

  const card = await tokenPromise;

  if (!card) {
    return {
      ok: false,
      reason: 'timeout',
      message: 'הכרטיס לא אושר בזמן. אם החיוב עבר, הוא יופיע בארנק בעוד רגע.',
    };
  }

  useAppStore.getState().saveCard(card);
  return { ok: true, card };
}
