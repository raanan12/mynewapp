import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { NotificationPreview } from './NotificationPreview';

type TextField = {
  key: string;
  label: string;
  hint: string;
  exampleVars: Record<string, string>;
};

const FIELDS: { title: TextField; body: TextField; heading: string }[] = [
  {
    heading: 'תזכורת יומית (קבועה או בשעה חופשית)',
    title: { key: 'reminder_push_title', label: 'כותרת', hint: '', exampleVars: {} },
    body: {
      key: 'reminder_push_body',
      label: 'טקסט',
      hint: 'אפשר להשתמש ב-{label} - שם התזכורת (למשל "בוקר" או "לפני השינה").',
      exampleVars: { label: 'בוקר' },
    },
  },
  {
    heading: 'טייס אוטומטי',
    title: { key: 'autopilot_push_title', label: 'כותרת', hint: '', exampleVars: {} },
    body: {
      key: 'autopilot_push_body',
      label: 'טקסט',
      hint: 'אפשר להשתמש ב-{amount} - הסכום שנתרם.',
      exampleVars: { amount: '5 ₪' },
    },
  },
  {
    heading: 'אישור תרומה',
    title: { key: 'donation_push_title', label: 'כותרת', hint: '', exampleVars: {} },
    body: {
      key: 'donation_push_body',
      label: 'טקסט',
      hint: 'אפשר להשתמש ב-{amount} - הסכום שנתרם, וב-{streak} - הרצף הנוכחי בימים.',
      exampleVars: { amount: '5 ₪', streak: '12' },
    },
  },
];

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

/** Texts for the app's own local notifications (reminders, auto-pilot,
 *  post-donation thanks) - these are never sent through the push broadcast
 *  tab, they're scheduled on-device, but they're still admin-editable copy. */
export function PushTextsEditor() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const keys = FIELDS.flatMap((group) => [group.title.key, group.body.key]);
      const { data } = await supabase.from('app_texts').select('id, value').in('id', keys);
      if (data) setValues(Object.fromEntries(data.map((row) => [row.id, row.value])));
    })();
  }, []);

  function setValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function saveAll() {
    const keys = FIELDS.flatMap((group) => [group.title.key, group.body.key]);
    const { error: updateError } = await supabase
      .from('app_texts')
      .upsert(keys.map((key) => ({ id: key, value: values[key] ?? '' })));

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div>
      <div className="section-title">טקסטי התראות מקומיות</div>
      {FIELDS.map((group) => {
        const title = values[group.title.key] ?? '';
        const body = values[group.body.key] ?? '';

        return (
          <div className="card" key={group.heading}>
            <div className="section-title" style={{ marginTop: 0 }}>
              {group.heading}
            </div>
            <div className="field">
              <label>{group.title.label}</label>
              <input value={title} onChange={(event) => setValue(group.title.key, event.target.value)} />
            </div>
            <div className="field">
              <label>{group.body.label}</label>
              <textarea rows={2} value={body} onChange={(event) => setValue(group.body.key, event.target.value)} />
              {group.body.hint ? <p className="muted">{group.body.hint}</p> : null}
            </div>
            <label>תצוגה מקדימה</label>
            <NotificationPreview
              title={fillTemplate(title, group.title.exampleVars)}
              body={fillTemplate(body, group.body.exampleVars)}
            />
          </div>
        );
      })}
      {error ? <p className="error">{error}</p> : null}
      <button className="btn" onClick={() => void saveAll()}>
        {saved ? 'נשמר ✓' : 'שמירת כל הטקסטים'}
      </button>
    </div>
  );
}
