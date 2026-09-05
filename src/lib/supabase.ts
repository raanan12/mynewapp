/**
 * Supabase client + typed schema for "החסד היומי".
 *
 * The client is created lazily and is `null` when env vars are missing, so the
 * app still runs fully offline against the Zustand store. Every call site must
 * handle a null client - see `src/services/sync.ts` for the pattern.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { env, isSupabaseConfigured } from '@/config/env';
import type { CategoryId, DonationSource, DonationStatus } from '@/types';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  /** Mirrors what was last pushed to Kesher's UpdateCustomer, purely for
   *  display - Kesher's own customer record is what actually drives receipt emails. */
  receipt_email: string | null;
  receipt_id_number: string | null;
  /** Prepaid wallet balance in shekels. */
  wallet_balance: number;
  /** Kesher card token - the app never stores a full card number. */
  kesher_token: string | null;
  kesher_card_last4: string | null;
  kesher_card_brand: string | null;
  kesher_card_expiry: string | null;
  streak_current: number;
  streak_longest: number;
  last_donation_date: string | null;
  auto_pilot_enabled: boolean;
  auto_pilot_amount: number;
  auto_reload_enabled: boolean;
  auto_reload_threshold: number;
  auto_reload_amount: number;
  is_admin: boolean;
  /** Legal record of terms-of-service acceptance - gates card entry. */
  terms_accepted_at: string | null;
  terms_version: string | null;
  created_at: string;
  last_seen_at: string;
};

export type DonationRow = {
  id: string;
  user_id: string;
  amount: number;
  category_id: CategoryId;
  charity_id: string | null;
  dedication: string | null;
  status: DonationStatus;
  source: DonationSource;
  receipt_url: string | null;
  /** Client-generated id; makes `apply_donation` idempotent across retries. */
  client_id: string | null;
  created_at: string;
};

/** Editable from the admin site - drives category chips and "what you can
 *  donate to" on the giving/trust screens. */
export type CategoryRow = {
  id: string;
  label: string;
  description: string;
  icon: string;
  icon_image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

/** Editable from the admin site - drives the coin buttons on the giving screen. */
export type GivingSettingsRow = {
  id: string;
  coin_amounts: number[];
};

export type CharityRow = {
  id: string;
  name: string;
  category_id: CategoryId;
  description: string;
  allocation: number;
  has_clause_46: boolean;
  is_active: boolean;
  long_description: string;
  website_url: string | null;
};

export type QuoteRow = {
  id: string;
  text: string;
  source: string;
  is_active: boolean;
};

export type ApprovalRow = {
  id: string;
  rabbi_name: string;
  title: string;
  image_url: string;
  year: string;
  sort_order: number;
  rabbi_photo_url: string | null;
  video_url: string | null;
};

export type WalletTransactionRow = {
  id: string;
  user_id: string;
  kind: 'topUp' | 'donation' | 'refund';
  amount: number;
  description: string;
  created_at: string;
};

/** Non-secret Kesher routing ids - the API username/password stay as Edge
 *  Function secrets and never appear in this table. */
export type KesherSettingsRow = {
  id: string;
  tokenization_page_id: string | null;
  project_number: string | null;
};

/** Free-form UI copy (tab labels, association/tax text, ...), editable from
 *  the admin site - see `defaultTexts` in src/constants/content.ts. */
export type AppTextRow = {
  id: string;
  value: string;
};

/** Terms of service sections, editable from the admin site - see
 *  `defaultTermsSections` in src/constants/content.ts. */
export type TermsSectionRow = {
  id: string;
  title: string;
  body: string;
  sort_order: number;
};

/** The optional "atmosphere sentence" on the giving screen - see
 *  `defaultHomeMessage` in src/constants/content.ts. */
export type HomeMessageRow = {
  id: string;
  text: string;
  image_url: string | null;
};

/** Admin-defined preset reminder/auto-pilot times - see
 *  `defaultReminderSlots` in src/constants/content.ts. */
export type ReminderSlotRow = {
  id: string;
  label: string;
  hour: number;
  minute: number;
  sort_order: number;
};

/** Opening popup shown once per day - see `defaultAppPopup` in
 *  src/constants/content.ts. */
export type AppPopupRow = {
  id: string;
  enabled: boolean;
  image_url: string | null;
  link_url: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      donations: {
        Row: DonationRow;
        Insert: Omit<DonationRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<DonationRow>;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: CategoryRow;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      giving_settings: {
        Row: GivingSettingsRow;
        Insert: GivingSettingsRow;
        Update: Partial<GivingSettingsRow>;
        Relationships: [];
      };
      charities: {
        Row: CharityRow;
        Insert: CharityRow;
        Update: Partial<CharityRow>;
        Relationships: [];
      };
      quotes: { Row: QuoteRow; Insert: QuoteRow; Update: Partial<QuoteRow>; Relationships: [] };
      approvals: {
        Row: ApprovalRow;
        Insert: ApprovalRow;
        Update: Partial<ApprovalRow>;
        Relationships: [];
      };
      wallet_transactions: {
        Row: WalletTransactionRow;
        Insert: Omit<WalletTransactionRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<WalletTransactionRow>;
        Relationships: [];
      };
      kesher_settings: {
        Row: KesherSettingsRow;
        Insert: KesherSettingsRow;
        Update: Partial<KesherSettingsRow>;
        Relationships: [];
      };
      app_texts: {
        Row: AppTextRow;
        Insert: AppTextRow;
        Update: Partial<AppTextRow>;
        Relationships: [];
      };
      terms_sections: {
        Row: TermsSectionRow;
        Insert: TermsSectionRow;
        Update: Partial<TermsSectionRow>;
        Relationships: [];
      };
      home_message: {
        Row: HomeMessageRow;
        Insert: HomeMessageRow;
        Update: Partial<HomeMessageRow>;
        Relationships: [];
      };
      reminder_slots: {
        Row: ReminderSlotRow;
        Insert: ReminderSlotRow;
        Update: Partial<ReminderSlotRow>;
        Relationships: [];
      };
      app_popup: {
        Row: AppPopupRow;
        Insert: AppPopupRow;
        Update: Partial<AppPopupRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    // Every RPC the app calls. Missing entries make `.rpc()` argue about
    // `never`, which is what happens when this block is left out entirely.
    Functions: {
      apply_donation: {
        Args: {
          p_amount: number;
          p_category: CategoryId;
          p_dedication: string | null;
          p_source: DonationSource;
          p_client_id: string | null;
        };
        Returns: DonationRow;
      };
      admin_stats: {
        Args: Record<never, never>;
        Returns: Json;
      };
      is_admin: {
        Args: Record<never, never>;
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type TypedSupabaseClient = SupabaseClient<Database>;

function createSupabaseClient(): TypedSupabaseClient | null {
  if (!isSupabaseConfigured) return null;

  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // React Native has no URL bar to parse an OAuth callback from.
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createSupabaseClient();
