/**
 * Local content used as the offline source of truth. When Supabase is
 * configured these act as the fallback/seed so the app is never empty.
 *
 * `defaultCategories` and `defaultCoinAmounts` are the fallback shown before
 * (or without) Supabase - both are editable from the admin site afterwards
 * and override these at runtime (see `useAppStore().categories`/
 * `coinAmounts`/`charities`/`approvals`, hydrated by `pullContent` in
 * src/services/sync.ts).
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

export const defaultCharities: readonly Charity[] = [
  {
    id: 'yad-yesomim',
    name: 'יד ליתומים',
    categoryId: 'orphans',
    description: 'ליווי חודשי ליתומים עד גיל 18',
    allocation: 60,
    hasClause46: true,
    longDescription: '',
    websiteUrl: null,
  },
  {
    id: 'beit-almanot',
    name: 'בית האלמנות',
    categoryId: 'orphans',
    description: 'סיוע כלכלי ורגשי לאלמנות',
    allocation: 40,
    hasClause46: true,
    longDescription: '',
    websiteUrl: null,
  },
  {
    id: 'ezer-marpe',
    name: 'עזר מרפא',
    categoryId: 'medical',
    description: 'ציוד רפואי והסעות לטיפולים',
    allocation: 55,
    hasClause46: true,
    longDescription: '',
    websiteUrl: null,
  },
  {
    id: 'refuah-vechesed',
    name: 'רפואה וחסד',
    categoryId: 'medical',
    description: 'תמיכה במשפחות של חולים קשים',
    allocation: 45,
    hasClause46: true,
    longDescription: '',
    websiteUrl: null,
  },
  {
    id: 'keren-amelei-torah',
    name: 'קרן עמלי תורה',
    categoryId: 'torah',
    description: 'מלגות קיום לאברכים',
    allocation: 100,
    hasClause46: true,
    longDescription: '',
    websiteUrl: null,
  },
  {
    id: 'lechem-chukeinu',
    name: 'לחם חוקנו',
    categoryId: 'families',
    description: 'סלי מזון שבועיים למשפחות',
    allocation: 70,
    hasClause46: true,
    longDescription: '',
    websiteUrl: null,
  },
  {
    id: 'chesed-bakehila',
    name: 'חסד בקהילה',
    categoryId: 'families',
    description: 'תשלומי חשמל, מים וארנונה',
    allocation: 30,
    hasClause46: false,
    longDescription: '',
    websiteUrl: null,
  },
] as const;

export const defaultQuotes: readonly Quote[] = [
  { id: 'q1', text: 'וּצְדָקָה תַּצִּיל מִמָּוֶת', source: 'משלי י, ב' },
  { id: 'q2', text: 'גָּדוֹל הַמַּעֲשֶׂה יוֹתֵר מִן הָעוֹשֶׂה', source: 'בבא בתרא ט' },
  { id: 'q3', text: 'עוֹלָם חֶסֶד יִבָּנֶה', source: 'תהילים פט, ג' },
  { id: 'q4', text: 'כָּל הַמְקַיֵּים נֶפֶשׁ אַחַת, כְּאִילּוּ קִיֵּים עוֹלָם מָלֵא', source: 'סנהדרין ד, ה' },
  { id: 'q5', text: 'אֵין הַצְּדָקָה מִשְׁתַּלֶּמֶת אֶלָּא לְפִי חֶסֶד שֶׁבָּהּ', source: 'סוכה מט' },
  { id: 'q6', text: 'צֶדֶק צֶדֶק תִּרְדֹּף', source: 'דברים טז, כ' },
  { id: 'q7', text: 'מַתָּן בַּסֵּתֶר יִכְפֶּה אָף', source: 'משלי כא, יד' },
] as const;

export const defaultApprovals: readonly RabbinicalApproval[] = [
  {
    id: 'a1',
    rabbiName: 'הרב יצחק זילברשטיין שליט״א',
    title: 'מכתב ברכה והסכמה לפעילות הארגון',
    imageUrl: 'https://placehold.co/900x1200/1A2B4C/D4AF37/png?text=%D7%94%D7%A1%D7%9B%D7%9E%D7%94',
    year: 'תשפ״ה',
    rabbiPhotoUrl: null,
    videoUrl: null,
  },
  {
    id: 'a2',
    rabbiName: 'הרב שריאל רוזנברג שליט״א',
    title: 'אישור על ניהול כספי הצדקה כהלכה',
    imageUrl: 'https://placehold.co/900x1200/1A2B4C/D4AF37/png?text=%D7%90%D7%99%D7%A9%D7%95%D7%A8',
    year: 'תשפ״ד',
    rabbiPhotoUrl: null,
    videoUrl: null,
  },
  {
    id: 'a3',
    rabbiName: 'הרב משה שאול קליין שליט״א',
    title: 'הסכמה לגביית מעשר כספים דרך האפליקציה',
    imageUrl: 'https://placehold.co/900x1200/1A2B4C/D4AF37/png?text=%D7%9E%D7%9B%D7%AA%D7%91',
    year: 'תשפ״ד',
    rabbiPhotoUrl: null,
    videoUrl: null,
  },
] as const;

/** Coin denominations offered on the giving screen - fallback only. */
export const defaultCoinAmounts: readonly number[] = [1, 5, 10];

export type HomeMessage = {
  text: string;
  imageUrl: string | null;
};

/** The optional "atmosphere sentence" on the giving screen - empty text
 *  means nothing is shown. */
export const defaultHomeMessage: HomeMessage = { text: '', imageUrl: null };

/** Free-form UI copy (tab bar labels, association/tax-receipt details, ...)
 *  - fallback only, overridden by the `app_texts` table once Supabase
 *  answers (see `useAppText`/`appText` in src/store/app-store.ts). */
export const defaultTexts: Record<string, string> = {
  tab_giving: 'נתינה',
  tab_wallet: 'כרטיס',
  tab_history: 'היסטוריה',
  tab_trust: 'שקיפות',
  tab_settings: 'הגדרות',
  association_name: 'עמותת החסד היומי',
  association_number: '58-0000000',
  association_clause46: 'אישור מס הכנסה לפי סעיף 46 לפקודה',
  association_address: 'רחוב הרב קוק 1, ירושלים',
  history_title: 'ההיסטוריה שלי',
  history_total_label: 'סך הנתינה',
  history_donations_label: 'תרומות',
  history_streak_label: 'הרצף הארוך',
  history_empty_title: 'עוד לא נתרם דבר',
  history_empty_body: 'כל תרומה תופיע כאן יחד עם הקבלה שלה.',
  terms_header_title: 'תקנון ותנאי שימוש',
  terms_page_title: 'תקנון, תנאי שימוש ומדיניות פרטיות',
  trust_title: 'לאן הכסף הולך',
  wallet_title: 'כרטיס אשראי',
  /** Empty means "use the bundled app icon" - see TzedakahBox's `logoUrl` prop. */
  box_logo_url: '',
  /** Gates re-acceptance: bump this whenever a terms_sections paragraph
   *  changes materially, and every user - including ones who already
   *  accepted an older wording - is asked to accept again before their
   *  next card entry (see add-card.tsx / services/terms.ts). */
  terms_version: '1.0',
};

export type TermsSection = {
  id: string;
  title: string;
  /** Paragraphs separated by a blank line. */
  body: string;
};

export const defaultTermsSections: readonly TermsSection[] = [
  {
    id: 't1',
    title: '1. כללי ואישור התקנון',
    body: [
      '1.1. שימוש באפליקציה, הרשמה אליה, הזנת פרטים אישיים ו/או ביצוע תרומה מותנים בהסכמה מלאה, מפורשת ובלתי חוזרת לכל תנאי תקנון זה.',
      '1.2. אישור התקנון באמצעות סימון תיבת הסימון ו/או לחיצה על כפתור ההמשך/אישור מהווה חוזה משפטי מחייב בין המשתמש לבין מפעיל האפליקציה.',
      '1.3. אם אינך מסכים לתנאי מתנאי תקנון זה, אינך מורשה לעשות כל שימוש באפליקציה או למסור בה פרטים כלשהם.',
    ].join('\n\n'),
  },
  {
    id: 't2',
    title: '2. עיבוד תשלומים, אשראי ושמירת אסימונים (Tokens)',
    body: [
      '2.1. פרטי כרטיס האשראי המלאים של המשתמש (מספר כרטיס, תוקף, קוד CVV) אינם נשמרים, אינם מעובדים ואינם מאוחסנים בשרתי האפליקציה או אצל מפעילה.',
      '2.2. כל פעולות הסליקה, אבטחת נתוני התשלום המוצפנים ויצירת מפתח הזיהוי המוצפן ("Token") מבוצעות באופן ישיר ובלעדי על ידי ספק סליקה חיצוני מורשה בעל תקן אבטחה בינלאומי PCI-DSS (להלן: "ספק הסליקה").',
      '2.3. המשתמש מסכים ומאשר באופן מפורש את שמירת ה-Token אצל ספק הסליקה לצורך ביצוע תרומות עתידיות או חוזרות בהתאם להוראותיו באפליקציה.',
    ].join('\n\n'),
  },
  {
    id: 't3',
    title: '3. אבטחת מידע והסרת אחריות גורפת מאירועי אבטחה/דליפות מידע',
    body: [
      '3.1. מפעיל האפליקציה יישם אמצעי אבטחת מידע סבירים ומקובלים. עם זאת, בסביבה טכנולוגית ומקוונת (אינטרנט, שרתי ענן, אפליקציות ניידות) לא ניתן להבטיח אבטחה מוחלטת או חסינות הרמטית מפני חדירות, פריצות, כשלים טכניים או מתקפות סייבר.',
      '3.2. הסרת אחריות מוחלטת מכל דליפת מידע: מפעיל האפליקציה, מנהליו, עובדיו, שותפיו או מי מטעמו לא יישאו בכל אחריות, ישירה, עקיפה, תוצאתית או מיוחדת, לכל נזק, הפסד, עוגמת נפש, פגיעה בפרטיות, הוצאה או כפל חיוב שיגרמו למשתמש או למי מטעמו כתוצאה מ: א. דליפה, זליגה, חשיפה, או גישה בלתי מורשית לכל פרטי המשתמש שמורים במערכת (לרבות אך לא רק: שם מלא, כתובת דוא"ל, מספר טלפון, תעודת זהות, כתובת מגורים, היסטוריית תרומות, כתובות IP ונתוני שימוש). ב. דליפה, פריצה או שימוש לרעה בנתוני אשראי או ב-Token שאירעו אצל ספק הסליקה החיצוני או בתווך התקשורת אליו. ג. מתקפות סייבר, נוזקות, סוסים טרויאניים, פריצות לשרתים/בסיסי נתונים, תקשורת לקויה או כוח עליון.',
      '3.3. המשתמש מצהיר ומאשר כי הזנת כל פיסת מידע אישי באפליקציה, כמו גם ביצוע התשלום ושמירת ה-Token, נעשים על אחריותו הבלעדית והמלאה. המשתמש מוותר באופן סופי ובלתי חוזר על כל טענה, דרישה או תביעה כנגד מפעיל האפליקציה בגין אירועי אבטחת מידע כאמור.',
    ].join('\n\n'),
  },
  {
    id: 't4',
    title: '4. ברירת דין ופנייה לגורמים המוסמכים',
    body: [
      '4.1. בכל מקרה של טענה או דרישה הנוגעת למעילת אשראי, חיוב כפול, כשל בסליקה או שימוש לרעה ב-Token, תהיה פניית המשתמש מופנית בראש ובראשונה לחברת הסליקה החיצונית ו/או לחברת האשראי המנפיקה, בהתאם להוראות חוק שירותי תשלום, תשע"ט-2019.',
      '4.2. על תקנון זה יחולו אך ורק דיני מדינת ישראל, וסמכות השיפוט הבלעדית בכל עניין הנובע ממנו תהיה מסורה לבתי המשפט המוסמכים במחוז הראשי של מפעיל האפליקציה.',
    ].join('\n\n'),
  },
] as const;

export const reminderSlots: Record<ReminderSlot, { label: string; hour: number; minute: number }> = {
  morning: { label: 'בוקר (אחרי שחרית)', hour: 8, minute: 0 },
  afternoon: { label: 'צהריים (מנחה)', hour: 13, minute: 30 },
  evening: { label: 'ערב (לפני מעריב)', hour: 19, minute: 0 },
  preShabbat: { label: 'ערב שבת', hour: 14, minute: 0 },
};
