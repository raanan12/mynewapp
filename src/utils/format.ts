/** Small, pure helpers. Anything that touches React or native APIs is a hook, not a util. */

const HE = 'he-IL';

/** "12 ₪" - no decimals for whole shekels, two otherwise. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(HE, {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(HE, { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(HE, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Local date key (YYYY-MM-DD). Used for streak math, so it must not be UTC-shifted. */
export function toDateKey(value: Date | string = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Whole days between two date keys. Positive when `later` is after `earlier`. */
export function daysBetween(earlier: string, later: string): number {
  const start = new Date(`${earlier}T00:00:00`).getTime();
  const end = new Date(`${later}T00:00:00`).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}
