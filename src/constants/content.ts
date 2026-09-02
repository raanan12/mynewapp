/**
 * Local content used as the offline source of truth. When Supabase is
 * configured these act as the fallback/seed so the app is never empty.
 *
 * `defaultCategories` and `defaultCoinAmounts` are the fallback shown before
 * (or without) Supabase - both are editable from the admin site afterwards
 * and override these at runtime (see `useAppStore().categories`/
 * `coinAmounts`, hydrated by `pullGivingConfig` in src/services/sync.ts).
 */

import type { Category, Charity, Quote, RabbinicalApproval, ReminderSlot } from '@/types';

export const defaultCategories: readonly Category[] = [
  {
    id: 'orphans',
    label: 'יתומים',
    description: 'תמיכה ביתומים ואלמנות',
    icon: 'heart-outline',
  },
  {
    id: 'medical',
    label: 'רפואה',
    description: 'סיוע לחולים ולמשפחותיהם',
    icon: 'medkit-outline',
  },
  {
    id: 'torah',
    label: 'עמלי תורה',
    description: 'החזקת לומדי תורה',
    icon: 'book-outline',
  },
  {
    id: 'families',
    label: 'משפחות נזקקות',
    description: 'מזון וצרכי בית בסיסיים',
    icon: 'home-outline',
  },
] as const;

export const charities: readonly Charity[] = [
  {
    id: 'yad-yesomim',
    name: 'יד ליתומים',
    categoryId: 'orphans',
    description: 'ליווי חודשי ליתומים עד גיל 18',
    allocation: 60,
    hasClause46: true,
  },
  {
    id: 'beit-almanot',
    name: 'בית האלמנות',
    categoryId: 'orphans',
    description: 'סיוע כלכלי ורגשי לאלמנות',
    allocation: 40,
    hasClause46: true,
  },
  {
    id: 'ezer-marpe',
    name: 'עזר מרפא',
    categoryId: 'medical',
    description: 'ציוד רפואי והסעות לטיפולים',
    allocation: 55,
    hasClause46: true,
  },
  {
    id: 'refuah-vechesed',
    name: 'רפואה וחסד',
    categoryId: 'medical',
    description: 'תמיכה במשפחות של חולים קשים',
    allocation: 45,
    hasClause46: true,
  },
  {
    id: 'keren-amelei-torah',
    name: 'קרן עמלי תורה',
    categoryId: 'torah',
    description: 'מלגות קיום לאברכים',
    allocation: 100,
    hasClause46: true,
  },
  {
    id: 'lechem-chukeinu',
    name: 'לחם חוקנו',
    categoryId: 'families',
    description: 'סלי מזון שבועיים למשפחות',
    allocation: 70,
    hasClause46: true,
  },
  {
    id: 'chesed-bakehila',
    name: 'חסד בקהילה',
    categoryId: 'families',
    description: 'תשלומי חשמל, מים וארנונה',
    allocation: 30,
    hasClause46: false,
  },
] as const;

export const quotes: readonly Quote[] = [
  { id: 'q1', text: 'וּצְדָקָה תַּצִּיל מִמָּוֶת', source: 'משלי י, ב' },
  { id: 'q2', text: 'גָּדוֹל הַמַּעֲשֶׂה יוֹתֵר מִן הָעוֹשֶׂה', source: 'בבא בתרא ט' },
  { id: 'q3', text: 'עוֹלָם חֶסֶד יִבָּנֶה', source: 'תהילים פט, ג' },
  { id: 'q4', text: 'כָּל הַמְקַיֵּים נֶפֶשׁ אַחַת, כְּאִילּוּ קִיֵּים עוֹלָם מָלֵא', source: 'סנהדרין ד, ה' },
  { id: 'q5', text: 'אֵין הַצְּדָקָה מִשְׁתַּלֶּמֶת אֶלָּא לְפִי חֶסֶד שֶׁבָּהּ', source: 'סוכה מט' },
  { id: 'q6', text: 'צֶדֶק צֶדֶק תִּרְדֹּף', source: 'דברים טז, כ' },
  { id: 'q7', text: 'מַתָּן בַּסֵּתֶר יִכְפֶּה אָף', source: 'משלי כא, יד' },
] as const;

export const approvals: readonly RabbinicalApproval[] = [
  {
    id: 'a1',
    rabbiName: 'הרב יצחק זילברשטיין שליט״א',
    title: 'מכתב ברכה והסכמה לפעילות הארגון',
    imageUrl: 'https://placehold.co/900x1200/1A2B4C/D4AF37/png?text=%D7%94%D7%A1%D7%9B%D7%9E%D7%94',
    year: 'תשפ״ה',
  },
  {
    id: 'a2',
    rabbiName: 'הרב שריאל רוזנברג שליט״א',
    title: 'אישור על ניהול כספי הצדקה כהלכה',
    imageUrl: 'https://placehold.co/900x1200/1A2B4C/D4AF37/png?text=%D7%90%D7%99%D7%A9%D7%95%D7%A8',
    year: 'תשפ״ד',
  },
  {
    id: 'a3',
    rabbiName: 'הרב משה שאול קליין שליט״א',
    title: 'הסכמה לגביית מעשר כספים דרך האפליקציה',
    imageUrl: 'https://placehold.co/900x1200/1A2B4C/D4AF37/png?text=%D7%9E%D7%9B%D7%AA%D7%91',
    year: 'תשפ״ד',
  },
] as const;

/** Coin denominations offered on the giving screen - fallback only. */
export const defaultCoinAmounts: readonly number[] = [1, 5, 10];

export const reminderSlots: Record<ReminderSlot, { label: string; hour: number; minute: number }> = {
  morning: { label: 'בוקר (אחרי שחרית)', hour: 8, minute: 0 },
  afternoon: { label: 'צהריים (מנחה)', hour: 13, minute: 30 },
  evening: { label: 'ערב (לפני מעריב)', hour: 19, minute: 0 },
  preShabbat: { label: 'ערב שבת', hour: 14, minute: 0 },
};
