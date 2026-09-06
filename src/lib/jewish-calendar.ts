/**
 * Shabbat/Yom Tov detection for suppressing reminders and auto-pilot
 * charges - both should never happen on a day money shouldn't be handled.
 *
 * Shabbat is trivial (Saturday); Yom Tov shifts every year on the Gregorian
 * calendar, so it needs a real Hebrew-calendar lookup rather than a fixed
 * date table. Uses Israel's one-day Yom Tov schedule (this app's audience
 * and `Asia/Jerusalem` timezone throughout the codebase), which also
 * correctly excludes Chol HaMoed and minor holidays (Chanukah, Purim, ...)
 * via hebcal's `CHAG` flag - only real "no melacha" days count.
 *
 * IMPORTANT: this same check is duplicated in
 * supabase/functions/kesher-charge/index.ts for the auto-pilot charge -
 * that server-side copy is the one that actually can't be bypassed by a
 * stale or offline client. Keep the two in sync.
 */
import { HDate, HebrewCalendar, flags } from '@hebcal/core';

/**
 * Reduces an instant to Israel's calendar day, independent of whatever
 * timezone the JS runtime itself is in (a UTC-based server is the common
 * case, and near midnight in Israel that's a different calendar day than
 * UTC's). `Intl.DateTimeFormat` does the timezone-aware extraction; the
 * plain-number `Date` constructor that follows has no timezone semantics
 * of its own, so the result reflects exactly that calendar day everywhere.
 */
function israelCalendarDay(date: Date): Date {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day);
}

export function isShabbatOrYomTov(date: Date = new Date()): boolean {
  const israelDate = israelCalendarDay(date);
  if (israelDate.getDay() === 6) return true;

  const events = HebrewCalendar.getHolidaysOnDate(new HDate(israelDate), true) ?? [];
  return events.some((event) => (event.getFlags() & flags.CHAG) !== 0);
}
