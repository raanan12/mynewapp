/**
 * Supabase sync.
 *
 * The app stays local-first for streak/history display, but money itself is
 * never mutated locally: every donation is charged and recorded server-side
 * in one call (see `donateWithFunds` in src/services/wallet.ts), so there is
 * nothing to replay or reconcile here - just pull down whatever the server
 * already has.
 */

import { supabase, type DonationRow, type ProfileRow } from '@/lib/supabase';
import { ensureProfile, ensureSession } from '@/services/auth';
import { useAppStore } from '@/store/app-store';
import type { CardToken, Donation, Streak } from '@/types';

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

function toCard(profile: ProfileRow): CardToken | null {
  if (!profile.kesher_token) return null;

  return {
    token: profile.kesher_token,
    last4: profile.kesher_card_last4 ?? '****',
    brand: profile.kesher_card_brand ?? 'כרטיס אשראי',
    expiry: profile.kesher_card_expiry ?? '',
    createdAt: profile.created_at,
  };
}

function toStreak(profile: ProfileRow): Streak {
  return {
    current: profile.streak_current,
    longest: profile.streak_longest,
    lastDonationDate: profile.last_donation_date,
  };
}

/** Pulls the profile and adopts the server's streak, saved card and contact info. */
export async function pullProfile(): Promise<ProfileRow | null> {
  if (!supabase) return null;

  const session = await ensureSession();
  if (!session) return null;

  const profile = await ensureProfile(session.user.id);
  if (!profile) return null;

  useAppStore.getState().hydrateFromRemote({
    streak: toStreak(profile),
    card: toCard(profile),
    settings: {
      autoPilot: {
        ...useAppStore.getState().settings.autoPilot,
        enabled: profile.auto_pilot_enabled,
        amount: Number(profile.auto_pilot_amount),
      },
    },
    contact: {
      fullName: profile.full_name,
      email: profile.receipt_email,
      phone: profile.phone,
      idNumber: profile.receipt_id_number,
    },
    termsAcceptedAt: profile.terms_accepted_at,
    termsVersion: profile.terms_version,
  });

  return profile;
}

export async function pullDonations(limit = 100): Promise<void> {
  if (!supabase) return;

  const session = await ensureSession();
  if (!session) return;

  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return;

  useAppStore.getState().mergeRemoteDonations(data.map(toDonation));
}

/**
 * Pulls categories, coin amounts, charities and approvals - all editable
 * from the admin site. Falls back silently to whatever the store already
 * has (the bundled defaults) if a table is empty or unreachable.
 */
export async function pullContent(): Promise<void> {
  if (!supabase) return;

  const [
    { data: categoryRows },
    { data: settingsRow },
    { data: charityRows },
    { data: approvalRows },
    { data: textRows },
    { data: termsRows },
    { data: homeMessageRow },
  ] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('giving_settings').select('coin_amounts').eq('id', 'default').maybeSingle(),
    supabase.from('charities').select('*').eq('is_active', true).order('category_id'),
    supabase.from('approvals').select('*').order('sort_order'),
    supabase.from('app_texts').select('id, value'),
    supabase.from('terms_sections').select('*').order('sort_order'),
    supabase.from('home_message').select('text, image_url').eq('id', 'default').maybeSingle(),
  ]);

  const current = useAppStore.getState();

  useAppStore.getState().setContent({
    categories: categoryRows?.length
      ? categoryRows.map((row) => ({
          id: row.id,
          label: row.label,
          description: row.description,
          icon: row.icon,
        }))
      : current.categories,
    coinAmounts: settingsRow?.coin_amounts?.length ? settingsRow.coin_amounts : current.coinAmounts,
    charities: charityRows?.length
      ? charityRows.map((row) => ({
          id: row.id,
          name: row.name,
          categoryId: row.category_id,
          description: row.description,
          allocation: row.allocation,
          hasClause46: row.has_clause_46,
          longDescription: row.long_description,
          websiteUrl: row.website_url,
        }))
      : current.charities,
    approvals: approvalRows?.length
      ? approvalRows.map((row) => ({
          id: row.id,
          rabbiName: row.rabbi_name,
          title: row.title,
          imageUrl: row.image_url,
          rabbiPhotoUrl: row.rabbi_photo_url,
          videoUrl: row.video_url,
          year: row.year,
        }))
      : current.approvals,
    texts: textRows?.length
      ? { ...current.texts, ...Object.fromEntries(textRows.map((row) => [row.id, row.value])) }
      : current.texts,
    termsSections: termsRows?.length
      ? termsRows.map((row) => ({ id: row.id, title: row.title, body: row.body }))
      : current.termsSections,
    homeMessage: homeMessageRow
      ? { text: homeMessageRow.text, imageUrl: homeMessageRow.image_url }
      : current.homeMessage,
  });
}

/** Writes the locally-toggled preferences onto the profile. */
export async function pushSettings(): Promise<void> {
  if (!supabase) return;

  const session = await ensureSession();
  if (!session) return;

  const { autoPilot } = useAppStore.getState().settings;

  await supabase
    .from('profiles')
    .update({
      auto_pilot_enabled: autoPilot.enabled,
      auto_pilot_amount: autoPilot.amount,
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', session.user.id);
}

/** Full reconcile: run on launch and on every foreground. */
export async function syncAll(): Promise<void> {
  if (!supabase) return;

  try {
    await pullProfile();
    await pullDonations();
    await pullContent();
  } catch (error) {
    console.warn('sync failed', error);
  }
}
