/**
 * Kesher (קשר סליקה) integration layer - tokenized payments.
 *
 * Design rules:
 * 1. The Kesher secret key never ships in the app. Every call goes to our own
 *    proxy (`EXPO_PUBLIC_KESHER_PROXY_URL`, e.g. a Supabase Edge Function)
 *    which adds the secret server-side.
 * 2. The card is tokenized ONCE. Afterwards only the token is charged, which is
 *    what lets us top the wallet up in a single tap.
 * 3. When the proxy is not configured the sandbox adapter runs instead, so the
 *    whole flow is demoable without a merchant account.
 *
 * NOTE: `tokenizeCard` below posts raw card fields to the proxy. That puts the
 * proxy in PCI-DSS scope. For production prefer Kesher's hosted payment page /
 * iframe and call `tokenizeFromHostedPage` with the token it returns - the card
 * number then never touches our servers.
 */

import { env, isKesherConfigured } from '@/config/env';
import type { CardToken } from '@/types';

export type CardInput = {
  /** Digits only. */
  number: string;
  /** MM/YY. */
  expiry: string;
  cvv: string;
  /** Israeli ID number, required by Israeli clearing providers. */
  holderId: string;
  holderName: string;
};

export type ChargeRequest = {
  token: string;
  amount: number;
  description: string;
  /** Issue a Clause 46 (סעיף 46) receipt for this charge. */
  withReceipt?: boolean;
};

export type ChargeResult = {
  success: boolean;
  transactionId: string;
  /** URL of the PDF receipt when one was issued. */
  receiptUrl: string | null;
  /** Hebrew, user-facing. */
  message: string;
};

export class KesherError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
    this.name = 'KesherError';
  }
}

export type KesherAdapter = {
  tokenizeCard(card: CardInput): Promise<CardToken>;
  chargeToken(request: ChargeRequest): Promise<ChargeResult>;
  fetchReceiptUrl(transactionId: string): Promise<string | null>;
};

const CARD_BRANDS: readonly { prefix: RegExp; name: string }[] = [
  { prefix: /^4/, name: 'Visa' },
  { prefix: /^5[1-5]/, name: 'Mastercard' },
  { prefix: /^3[47]/, name: 'American Express' },
  { prefix: /^(2014|2149|36|38)/, name: 'Diners' },
  { prefix: /^62/, name: 'Isracard' },
];

export function detectCardBrand(cardNumber: string): string {
  return CARD_BRANDS.find((brand) => brand.prefix.test(cardNumber))?.name ?? 'כרטיס אשראי';
}

/** Luhn check - catches typos before we bother the clearing provider. */
export function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Israeli ID checksum (ת"ז) - Kesher rejects charges with a malformed id. */
export function isValidIsraeliId(id: string): boolean {
  const digits = id.replace(/\D/g, '').padStart(9, '0');
  if (digits.length !== 9) return false;

  const sum = digits.split('').reduce((total, char, index) => {
    const step = Number(char) * ((index % 2) + 1);
    return total + (step > 9 ? step - 9 : step);
  }, 0);
  return sum % 10 === 0;
}

export function isValidExpiry(expiry: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry.trim());
  if (!match) return false;

  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const year = 2000 + Number(match[2]);
  // Cards stay valid through the last day of the printed month.
  return new Date(year, month, 1).getTime() > now.getTime();
}

async function callProxy<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${env.kesherProxyUrl}${path}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ terminalId: env.kesherTerminalId, ...(body as object) }),
    });

    const payload = (await response.json()) as T & { error?: string; code?: string };
    if (!response.ok || payload.error) {
      throw new KesherError(payload.error ?? 'הסליקה נכשלה', payload.code ?? String(response.status));
    }
    return payload;
  } catch (error) {
    if (error instanceof KesherError) throw error;
    throw new KesherError('לא הצלחנו להתחבר לשרת הסליקה. נסו שוב.', 'network');
  } finally {
    clearTimeout(timeout);
  }
}

const httpAdapter: KesherAdapter = {
  async tokenizeCard(card) {
    const digits = card.number.replace(/\D/g, '');
    const result = await callProxy<{ token: string }>('/tokenize', {
      cardNumber: digits,
      expiry: card.expiry,
      cvv: card.cvv,
      holderId: card.holderId.replace(/\D/g, ''),
      holderName: card.holderName,
    });

    return {
      token: result.token,
      last4: digits.slice(-4),
      brand: detectCardBrand(digits),
      expiry: card.expiry,
      createdAt: new Date().toISOString(),
    };
  },

  async chargeToken(request) {
    const result = await callProxy<{ transactionId: string; receiptUrl: string | null }>('/charge', {
      token: request.token,
      amount: request.amount,
      description: request.description,
      issueReceipt: request.withReceipt ?? true,
    });

    return {
      success: true,
      transactionId: result.transactionId,
      receiptUrl: result.receiptUrl,
      message: 'החיוב בוצע בהצלחה',
    };
  },

  async fetchReceiptUrl(transactionId) {
    const result = await callProxy<{ receiptUrl: string | null }>('/receipt', { transactionId });
    return result.receiptUrl;
  },
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const randomId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Simulated provider used until real Kesher credentials are wired in. */
const sandboxAdapter: KesherAdapter = {
  async tokenizeCard(card) {
    await delay(900);
    const digits = card.number.replace(/\D/g, '');

    if (!isValidCardNumber(digits)) {
      throw new KesherError('מספר הכרטיס אינו תקין', 'invalid_card');
    }
    if (!isValidExpiry(card.expiry)) {
      throw new KesherError('תוקף הכרטיס אינו תקין', 'invalid_expiry');
    }
    if (!isValidIsraeliId(card.holderId)) {
      throw new KesherError('מספר תעודת הזהות אינו תקין', 'invalid_id');
    }

    return {
      token: randomId('tok'),
      last4: digits.slice(-4),
      brand: detectCardBrand(digits),
      expiry: card.expiry,
      createdAt: new Date().toISOString(),
    };
  },

  async chargeToken(request) {
    await delay(700);
    if (request.amount <= 0) {
      throw new KesherError('סכום החיוב חייב להיות גדול מאפס', 'invalid_amount');
    }

    const transactionId = randomId('txn');
    return {
      success: true,
      transactionId,
      receiptUrl: request.withReceipt === false ? null : `local://receipt/${transactionId}`,
      message: 'החיוב בוצע בהצלחה (סביבת בדיקה)',
    };
  },

  async fetchReceiptUrl(transactionId) {
    await delay(200);
    return `local://receipt/${transactionId}`;
  },
};

export const kesher: KesherAdapter = isKesherConfigured ? httpAdapter : sandboxAdapter;

/** Surfaced in Settings so it is obvious which mode the build is running in. */
export const kesherMode: 'live' | 'sandbox' = isKesherConfigured ? 'live' : 'sandbox';
