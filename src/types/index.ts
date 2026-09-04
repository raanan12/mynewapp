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

/** Tokenized card returned by the clearing provider. Never holds a full PAN. */
export type CardToken = {
  token: string;
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

export type ReminderSlot = 'morning' | 'afternoon' | 'evening' | 'preShabbat';

export type AutoPilotSettings = {
  enabled: boolean;
  amount: number;
  categoryId: CategoryId;
  slot: ReminderSlot;
};

export type Settings = {
  reminders: Record<ReminderSlot, boolean>;
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
