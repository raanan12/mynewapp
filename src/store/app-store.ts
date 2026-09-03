/**
 * Global app state: card, streak, donation history and settings.
 *
 * There is no prepaid wallet - every donation charges the saved card
 * directly, in real time, for the exact amount tapped (see
 * `donateWithFunds` in src/services/wallet.ts). That call is the only way a
 * `Donation` gets created, so this store never mutates money on its own -
 * it only mirrors what the server already confirmed.
 *
 * Persisted to AsyncStorage so the giving screen renders instantly on cold
 * start. Supabase sync is fire-and-forget on top of this (see
 * `src/services/sync.ts`).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import {
  defaultApprovals,
  defaultCategories,
  defaultCharities,
  defaultCoinAmounts,
  defaultTexts,
} from '@/constants/content';
import type {
  CardToken,
  Category,
  CategoryId,
  Charity,
  Donation,
  RabbinicalApproval,
  Settings,
  Streak,
} from '@/types';
import { toDateKey } from '@/utils/format';

export type DonationOutcome =
  | { ok: true; donation: Donation; streak: Streak; isNewStreakDay: boolean }
  | { ok: false; reason: 'noCard' | 'invalidAmount' | 'chargeFailed'; message?: string };

/** Sent to Kesher's customer record so charge receipts get emailed automatically. */
export type ContactDetails = {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  idNumber: string | null;
};

const emptyContact: ContactDetails = { fullName: null, email: null, phone: null, idNumber: null };

type AppState = {
  card: CardToken | null;
  streak: Streak;
  donations: Donation[];
  settings: Settings;
  contact: ContactDetails;
  /** Categories, coin denominations, charities and approvals - all editable
   *  from the admin site. These start as the bundled defaults and are
   *  overridden once Supabase answers (see `pullContent` in src/services/sync.ts). */
  categories: Category[];
  coinAmounts: number[];
  charities: Charity[];
  approvals: RabbinicalApproval[];
  /** Free-form UI copy (tab labels, association/tax text, ...) - merged over
   *  `defaultTexts`, per-key, by whatever `app_texts` rows exist remotely. */
  texts: Record<string, string>;
  /** Legal record of terms-of-service acceptance - null until the user
   *  explicitly accepts on the terms screen, which gates card entry. */
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  /** Set once the intro/onboarding has been seen. */
  hasOnboarded: boolean;

  saveCard: (card: CardToken) => void;
  removeCard: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  attachReceipt: (donationId: string, receiptUrl: string) => void;
  /** Dedication is entered after the coin drops so the flow stays fast. */
  attachDedication: (donationId: string, dedication: string) => void;
  setContent: (content: {
    categories: Category[];
    coinAmounts: number[];
    charities: Charity[];
    approvals: RabbinicalApproval[];
    texts: Record<string, string>;
  }) => void;
  acceptTerms: (version: string) => void;
  markOnboarded: () => void;
  reset: () => void;

  /** Adopt the server's view of streak/card/contact. The server is authoritative. */
  hydrateFromRemote: (remote: {
    streak: Streak;
    card: CardToken | null;
    settings?: Partial<Settings>;
    contact?: ContactDetails;
    termsAcceptedAt?: string | null;
    termsVersion?: string | null;
  }) => void;
  /** Merge donations pulled from Supabase - every donation is server-created,
   *  so this is the only way the list grows besides `recordExternalDonation`. */
  mergeRemoteDonations: (remote: Donation[]) => void;
  /** A donation the server just confirmed - charged and recorded already,
   *  this only mirrors it locally for the immediate UI. */
  recordExternalDonation: (donation: Donation, streak: Streak) => void;
  setContact: (contact: ContactDetails) => void;
};

export const defaultSettings: Settings = {
  reminders: { morning: true, afternoon: false, evening: false, preShabbat: true },
  autoPilot: { enabled: false, amount: 5, categoryId: 'families', slot: 'morning' },
  soundEnabled: true,
  hapticsEnabled: true,
};

const initialStreak: Streak = { current: 0, longest: 0, lastDonationDate: null };

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      card: null,
      streak: initialStreak,
      donations: [],
      settings: defaultSettings,
      contact: emptyContact,
      categories: [...defaultCategories],
      coinAmounts: [...defaultCoinAmounts],
      charities: [...defaultCharities],
      approvals: [...defaultApprovals],
      texts: { ...defaultTexts },
      termsAcceptedAt: null,
      termsVersion: null,
      hasOnboarded: false,

      saveCard: (card) => set({ card }),

      removeCard: () => set({ card: null }),

      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

      attachReceipt: (donationId, receiptUrl) =>
        set((state) => ({
          donations: state.donations.map((donation) =>
            donation.id === donationId ? { ...donation, receiptUrl } : donation
          ),
        })),

      attachDedication: (donationId, dedication) =>
        set((state) => ({
          donations: state.donations.map((donation) =>
            donation.id === donationId
              ? { ...donation, dedication: dedication.trim() || null }
              : donation
          ),
        })),

      setContent: ({ categories, coinAmounts, charities, approvals, texts }) =>
        set({ categories, coinAmounts, charities, approvals, texts }),

      acceptTerms: (version) => set({ termsAcceptedAt: new Date().toISOString(), termsVersion: version }),

      markOnboarded: () => set({ hasOnboarded: true }),

      reset: () =>
        set({
          card: null,
          streak: initialStreak,
          donations: [],
          settings: defaultSettings,
          contact: emptyContact,
          categories: [...defaultCategories],
          coinAmounts: [...defaultCoinAmounts],
          charities: [...defaultCharities],
          approvals: [...defaultApprovals],
          texts: { ...defaultTexts },
          termsAcceptedAt: null,
          termsVersion: null,
          hasOnboarded: false,
        }),

      hydrateFromRemote: ({ streak, card, settings, contact, termsAcceptedAt, termsVersion }) =>
        set((state) => ({
          streak,
          card,
          settings: settings ? { ...state.settings, ...settings } : state.settings,
          contact: contact ?? state.contact,
          // Additive, not authoritative: once accepted locally, a server read
          // that hasn't caught up yet (or a transient null) must never
          // un-accept the user - the accept action always writes the server
          // row before setting this locally, so the two converge either way.
          termsAcceptedAt: state.termsAcceptedAt ?? termsAcceptedAt ?? null,
          termsVersion: state.termsVersion ?? termsVersion ?? null,
        })),

      setContact: (contact) => set({ contact }),

      mergeRemoteDonations: (remote) =>
        set((state) => {
          const known = new Set(remote.map((donation) => donation.id));
          const localOnly = state.donations.filter((donation) => !known.has(donation.id));

          return {
            donations: [...localOnly, ...remote].sort(
              (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
            ),
          };
        }),

      recordExternalDonation: (donation, streak) =>
        set((state) => ({
          donations: [donation, ...state.donations],
          streak,
        })),
    }),
    {
      name: 'daily-chesed/v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Bumped: v1 shipped with a prepaid wallet (balance/transactions), which
      // no longer exists - every donation charges the card directly instead.
      version: 2,
    }
  )
);

/**
 * Aggregates for the history and admin screens.
 *
 * These build a new object on every call, so they must always be consumed
 * through the `useShallow`-wrapped hooks below - passing them straight to
 * `useAppStore` re-renders forever under Zustand v5.
 */
function selectTotals(state: AppState) {
  const completed = state.donations.filter((donation) => donation.status === 'completed');
  const total = completed.reduce((sum, donation) => sum + donation.amount, 0);
  const today = toDateKey();
  const givenToday = completed
    .filter((donation) => toDateKey(donation.createdAt) === today)
    .reduce((sum, donation) => sum + donation.amount, 0);

  return {
    total,
    count: completed.length,
    average: completed.length ? total / completed.length : 0,
    givenToday,
    hasGivenToday: givenToday > 0,
  };
}

/** Built from the current category list, not a fixed set of keys - it grows
 *  or shrinks as categories are added/removed from the admin site. */
function selectByCategory(state: AppState): Record<CategoryId, number> {
  const totals: Record<CategoryId, number> = {};
  for (const category of state.categories) totals[category.id] = 0;

  for (const donation of state.donations) {
    totals[donation.categoryId] = (totals[donation.categoryId] ?? 0) + donation.amount;
  }

  return totals;
}

export const useTotals = () => useAppStore(useShallow(selectTotals));

export const useCategoryTotals = () => useAppStore(useShallow(selectByCategory));

/** Non-reactive lookup for use outside render (e.g. inside plain functions
 *  like receipt generation) - reads whatever the store currently holds. */
export function categoryLabel(id: CategoryId): string {
  return useAppStore.getState().categories.find((category) => category.id === id)?.label ?? id;
}

export const useCategories = () => useAppStore((state) => state.categories);

export const useCoinAmounts = () => useAppStore((state) => state.coinAmounts);

export const useCharities = () => useAppStore((state) => state.charities);

export const useApprovals = () => useAppStore((state) => state.approvals);

export const useAppText = (key: string) => useAppStore((state) => state.texts[key] ?? key);

/** Non-reactive lookup for use outside render (e.g. receipt HTML generation). */
export function appText(key: string): string {
  return useAppStore.getState().texts[key] ?? key;
}
