import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type TextRow = {
  id: string;
  value: string;
};

const SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: 'תפריט תחתון',
    keys: ['tab_giving', 'tab_wallet', 'tab_history', 'tab_trust', 'tab_settings'],
  },
  {
    title: 'פרטי עמותה וקבלת מס',
    keys: ['association_name', 'association_number', 'association_clause46', 'association_address'],
  },
  {
    title: 'מסך היסטוריה',
    keys: [
      'history_title',
      'history_total_label',
      'history_donations_label',
      'history_streak_label',
      'history_empty_title',
      'history_empty_body',
    ],
  },
  {
    title: 'כותרות מסך התקנון',
    keys: ['terms_header_title', 'terms_page_title'],
  },
];

const KEY_LABELS: Record<string, string> = {
  tab_giving: 'טאב נתינה',
  tab_wallet: 'טאב כרטיס',
  tab_history: 'טאב היסטוריה',
  tab_trust: 'טאב שקיפות',
  tab_settings: 'טאב הגדרות',
  association_name: 'שם העמותה',
  association_number: 'מספר עמותה (ע.ר.)',
  association_clause46: 'טקסט אישור מס (סעיף 46)',
  association_address: 'כתובת העמותה',
  history_title: 'כותרת המסך',
  history_total_label: 'תווית "סך הנתינה"',
  history_donations_label: 'תווית "תרומות"',
  history_streak_label: 'תווית "הרצף הארוך"',
  history_empty_title: 'כותרת מצב ריק',
  history_empty_body: 'טקסט מצב ריק',
  terms_header_title: 'כותרת חלון התקנון',
  terms_page_title: 'כותרת בתוך העמוד',
};

/** Free-form UI copy - tab bar labels and the association/tax-receipt
 *  details shown in the transparency screen and on generated receipts. */
export function TextsEditor() {
  const [rows, setRows] = useState<TextRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('app_texts').select('*');
    setRows(data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  function updateValue(id: string, value: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, value } : row)));
  }

  async function saveRow(id: string) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;

    const { error: updateError } = await supabase
      .from('app_texts')
      .update({ value: row.value })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setSavedKey(id);
    setTimeout(() => setSavedKey((current) => (current === id ? null : current)), 1500);
  }

  return (
    <div>
      {error ? <p className="error">{error}</p> : null}
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="section-title">{section.title}</div>
          <div className="card">
            {section.keys.map((key) => {
              const row = rows.find((item) => item.id === key);
              if (!row) return null;

              return (
                <div className="field" key={key}>
                  <label>{KEY_LABELS[key] ?? key}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ flex: 1 }}
                      value={row.value}
                      onChange={(event) => updateValue(key, event.target.value)}
                    />
                    <button className="btn secondary" onClick={() => void saveRow(key)}>
                      {savedKey === key ? 'נשמר ✓' : 'שמירה'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
