import { useState } from 'react';

import { Analytics } from '../components/Analytics';
import { ApprovalsEditor } from '../components/ApprovalsEditor';
import { CategoriesEditor } from '../components/CategoriesEditor';
import { CharitiesEditor } from '../components/CharitiesEditor';
import { CoinAmountsEditor } from '../components/CoinAmountsEditor';
import { HomeMessageEditor } from '../components/HomeMessageEditor';
import { PopupEditor } from '../components/PopupEditor';
import { PushEditor } from '../components/PushEditor';
import { PushTextsEditor } from '../components/PushTextsEditor';
import { QuotesEditor } from '../components/QuotesEditor';
import { ReminderSlotsEditor } from '../components/ReminderSlotsEditor';
import { TabIconsEditor } from '../components/TabIconsEditor';
import { TermsEditor } from '../components/TermsEditor';
import { TextsEditor } from '../components/TextsEditor';
import { TrustSectionsEditor } from '../components/TrustSectionsEditor';

type Tab =
  | 'analytics'
  | 'categories'
  | 'coins'
  | 'charities'
  | 'quotes'
  | 'approvals'
  | 'texts'
  | 'terms'
  | 'home'
  | 'tabIcons'
  | 'reminders'
  | 'popup'
  | 'push'
  | 'trustLayout';

/** Grouped so the sidebar reads as a hierarchy, not a flat wall of tabs -
 *  every tab belongs to exactly one group. */
const GROUPS: { title: string; tabs: { id: Tab; label: string }[] }[] = [
  {
    title: 'דף הבית ותוכן ראשי',
    tabs: [
      { id: 'home', label: 'עמוד הבית' },
      { id: 'categories', label: 'קטגוריות תרומה' },
      { id: 'coins', label: 'סכומי מטבעות' },
      { id: 'tabIcons', label: 'אייקוני תפריט' },
      { id: 'quotes', label: 'ציטוטים' },
    ],
  },
  {
    title: 'הודעות ושיווק',
    tabs: [
      { id: 'popup', label: 'פופ-אפ פתיחה' },
      { id: 'push', label: 'הודעות פוש' },
    ],
  },
  {
    title: 'אודות ותוכן תדמיתי',
    tabs: [
      { id: 'trustLayout', label: 'עמוד שקיפות' },
      { id: 'approvals', label: 'הסכמות' },
      { id: 'charities', label: 'ארגונים' },
    ],
  },
  {
    title: 'הגדרות מערכת',
    tabs: [
      { id: 'reminders', label: 'תזכורות ושעות' },
      { id: 'terms', label: 'תקנון' },
      { id: 'texts', label: 'טקסטים באפליקציה' },
    ],
  },
  {
    title: 'דאטה וניטור',
    tabs: [{ id: 'analytics', label: 'נתונים' }],
  },
];

type DashboardProps = {
  onSignOut: () => void;
};

export function Dashboard({ onSignOut }: DashboardProps) {
  const [tab, setTab] = useState<Tab>('analytics');

  return (
    <div className="app-shell">
      <div className="topbar">
        <h1>ניהול · החסד היומי</h1>
        <button className="btn secondary" style={{ color: '#fdfbf7', borderColor: '#fdfbf7' }} onClick={onSignOut}>
          יציאה
        </button>
      </div>

      <div className="layout">
        <nav className="sidebar">
          {GROUPS.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-group-title">{group.title}</div>
              {group.tabs.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${tab === item.id ? 'active' : ''}`}
                  onClick={() => setTab(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="content">
          {tab === 'analytics' ? <Analytics /> : null}
          {tab === 'categories' ? <CategoriesEditor /> : null}
          {tab === 'coins' ? <CoinAmountsEditor /> : null}
          {tab === 'charities' ? <CharitiesEditor /> : null}
          {tab === 'quotes' ? <QuotesEditor /> : null}
          {tab === 'approvals' ? <ApprovalsEditor /> : null}
          {tab === 'texts' ? <TextsEditor /> : null}
          {tab === 'terms' ? <TermsEditor /> : null}
          {tab === 'home' ? <HomeMessageEditor /> : null}
          {tab === 'tabIcons' ? <TabIconsEditor /> : null}
          {tab === 'reminders' ? (
            <>
              <ReminderSlotsEditor />
              <PushTextsEditor />
            </>
          ) : null}
          {tab === 'popup' ? <PopupEditor /> : null}
          {tab === 'push' ? <PushEditor /> : null}
          {tab === 'trustLayout' ? <TrustSectionsEditor /> : null}
        </div>
      </div>
    </div>
  );
}
