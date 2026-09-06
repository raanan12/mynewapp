/** Shared domain types for "החסד היומי". Feature-local types live next to their feature. */

export type Id = string;

/**
 * Donation category id. Not a fixed union: categories are admin-editable
 * (see the `categories` table and `useAppStore().categories`), so new ids
 * can be added without an app update.
 */
export type CategoryId = string;

export type Category = {
  id: CategoryId;
  /** Hebrew label shown in the UI. */
  label: string;
  description: string;
  /** Icon key resolved by `resolveCategoryIcon` to a Lucide component. */
  icon: string;
  /** Admin-uploaded image that replaces the Lucide icon entirely when set. */
  iconImageUrl: string | null;
};

export type Charity = {
  id: Id;
  name: string;
  categoryId: CategoryId;
  description: string;
  /** Percentage of the category pool routed to this organization (0-100). */
  allocation: number;
  /** Whether the org holds a Clause 46 (סעיף 46) tax-deduction approval. */
  hasClause46: boolean;
  /** Longer write-up shown on the transparency screen. Supports a light
   *  markdown subset: "## " lines become sub-headers, "**text**" becomes bold. */
  longDescription: string;
  /** External site for this organization - shown as a link button when set. */
  websiteUrl: string | null;
};

export type DonationStatus = 'completed' | 'pending' | 'failed';

/** How the donation was initiated - manual tap/swipe or the auto-pilot scheduler. */
export type DonationSource = 'manual' | 'auto';

export type Donation = {
  /** Client-generated, and sent to the server as `client_id` so replaying an
   *  offline donation cannot charge twice. */
  id: Id;
  amount: number;
  categoryId: CategoryId;
  /** Free text such as "לרפואת..." / "לעילוי נשמת...". */
  dedication: string | null;
  createdAt: string;
  status: DonationStatus;
  source: DonationSource;
  receiptUrl: string | null;
  /** False while the donation exists only on this device. */
  synced: boolean;
};

/**
 * Display-only record of a saved card, persisted on-device so the wallet
 * screen can render instantly. Deliberately does NOT hold the actual Kesher
 * token: nothing on the client ever needs it - every charge is made by the
 * `kesher-charge` Edge Function, which looks the real token up server-side
 * by user id, never from anything the client sends. Keeping it out of
 * AsyncStorage means there is no sensitive value to leak from the device.
 */
export type CardToken = {
  last4: string;
  brand: string;
  expiry: string;
  createdAt: string;
};

export type Streak = {
  current: number;
  longest: number;
  /** Date key (YYYY-MM-DD) of the most recent donation, or null when never donated. */
  lastDonationDate: string | null;
};

/**
 * A daily reminder/auto-pilot time. Admin-defined slots (synced from the
 * `reminder_slots` table) are shared by everyone; a user can also add their
 * own free-hour slots, kept only on their device (`isCustom: true`).
 */
export type ReminderSlot = {
  id: Id;
  /** Explanation text shown next to the time, e.g. "שחרית". */
  label: string;
  hour: number;
  minute: number;
  /** 1-7, Sunday=1 (matches expo-notifications' WEEKLY trigger) - fires
   *  every day when unset, e.g. "ערב שבת" is weekday 6 (Friday), not daily. */
  weekday?: number;
  isCustom?: boolean;
};

/** The three fixed sections' data comes from elsewhere (approvals,
 *  category breakdown, charity list); anything else is a fully
 *  admin-authored section - title + free text, nothing more. */
export const FIXED_TRUST_SECTION_IDS = ['approvals', 'breakdown', 'charities'] as const;

/**
 * One reorderable, hideable, title-editable section of the transparency
 * ("לאן הכסף הולך") screen.
 */
export type TrustSection = {
  id: string;
  title: string;
  sortOrder: number;
  visible: boolean;
  /** Only rendered for custom sections (id not one of FIXED_TRUST_SECTION_IDS) -
   *  same light markdown as a charity's long description ("## " sub-headers,
   *  "**bold**" spans). */
  body?: string | null;
};

export type AutoPilotSettings = {
  enabled: boolean;
  amount: number;
  categoryId: CategoryId;
  slotId: string;
};

export type Settings = {
  /** Enabled state per reminder slot id (preset or custom). */
  reminders: Record<string, boolean>;
  /** Slots the user added themselves - device-local, not synced. */
  customReminders: ReminderSlot[];
  autoPilot: AutoPilotSettings;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

export type Quote = {
  id: Id;
  text: string;
  source: string;
};

export type RabbinicalApproval = {
  id: Id;
  rabbiName: string;
  title: string;
  /** Remote or bundled image of the endorsement letter. */
  imageUrl: string;
  year: string;
  /** Small photo of the rabbi shown next to the blessing. */
  rabbiPhotoUrl: string | null;
  /** Link to a video of the blessing, opened externally. */
  videoUrl: string | null;
};

/** Standard envelope for async UI state. */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
