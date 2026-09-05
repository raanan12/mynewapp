import { useState } from 'react';

import { Analytics } from '../components/Analytics';
import { ApprovalsEditor } from '../components/ApprovalsEditor';
import { CategoriesEditor } from '../components/CategoriesEditor';
import { CharitiesEditor } from '../components/CharitiesEditor';
import { CoinAmountsEditor } from '../components/CoinAmountsEditor';
import { HomeMessageEditor } from '../components/HomeMessageEditor';
import { QuotesEditor } from '../components/QuotesEditor';
import { TabIconsEditor } from '../components/TabIconsEditor';
import { TermsEditor } from '../components/TermsEditor';
import { TextsEditor } from '../components/TextsEditor';

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
  | 'tabIcons';

const TABS: { id: Tab; label: string }[] = [
  { id: 'analytics', label: 'נתונים' },
  { id: 'categories', label: 'קטגוריות תרומה' },
  { id: 'coins', label: 'סכומי מטבעות' },
  { id: 'charities', label: 'ארגונים' },
  { id: 'quotes', label: 'ציטוטים' },
  { id: 'approvals', label: 'הסכמות' },
  { id: 'texts', label: 'טקסטים באפליקציה' },
  { id: 'terms', label: 'תקנון' },
  { id: 'home', label: 'עמוד הבית' },
  { id: 'tabIcons', label: 'אייקוני תפריט' },
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

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            className={`tab ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

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
      </div>
    </div>
  );
}
