import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type SectionRow = {
  id: string;
  title: string;
  body: string;
  sort_order: number;
};

const emptyDraft = { title: '', body: '' };

/**
 * Terms-of-service wording. `terms_version` (stored in `app_texts`) gates
 * re-acceptance - a user who already accepted an older version is asked to
 * accept again before their next card entry. Editing a section's wording
 * here without bumping the version leaves existing acceptances valid, which
 * is usually NOT what you want for a substantive legal change.
 */
export function TermsEditor() {
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [version, setVersion] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function load() {
    const [{ data: sections }, { data: versionRow }] = await Promise.all([
      supabase.from('terms_sections').select('*').order('sort_order'),
      supabase.from('app_texts').select('value').eq('id', 'terms_version').maybeSingle(),
    ]);
    setRows(sections ?? []);
    setVersion(versionRow?.value ?? '1.0');
  }

  useEffect(() => {
    void load();
  }, []);

  function updateField(id: string, field: 'title' | 'body' | 'sort_order', value: string | number) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  async function saveVersion() {
    const { error: updateError } = await supabase
      .from('app_texts')
      .update({ value: version })
      .eq('id', 'terms_version');

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setSavedId('version');
    setTimeout(() => setSavedId((current) => (current === 'version' ? null : current)), 1500);
  }

  async function saveRow(row: SectionRow) {
    const { error: updateError } = await supabase
      .from('terms_sections')
      .update({ title: row.title, body: row.body, sort_order: row.sort_order })
      .eq('id', row.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setSavedId(row.id);
    setTimeout(() => setSavedId((current) => (current === row.id ? null : current)), 1500);
  }

  async function addSection() {
    if (!draft.title.trim() || !draft.body.trim()) return;

    const { error: insertError } = await supabase.from('terms_sections').insert({
      id: `t-${Date.now().toString(36)}`,
      title: draft.title.trim(),
      body: draft.body.trim(),
      sort_order: rows.length + 1,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDraft(emptyDraft);
    setError(null);
    await load();
  }

  async function deleteSection(id: string) {
    if (!confirm('למחוק את הסעיף?')) return;
    await supabase.from('terms_sections').delete().eq('id', id);
    await load();
  }

  return (
    <div>
      {error ? <p className="error">{error}</p> : null}

      <div className="section-title">גרסת תקנון</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          שינוי מהותי בנוסח למטה צריך לבוא עם עדכון הגרסה - כך כל משתמש, כולל מי שכבר אישר נוסח קודם,
          יתבקש לאשר מחדש לפני התרומה/הכרטיס הבאים שלו.
        </p>
        <div style={{ display: 'flex', gap: 8, maxWidth: 200 }}>
          <input value={version} onChange={(event) => setVersion(event.target.value)} />
          <button className="btn secondary" onClick={() => void saveVersion()}>
            {savedId === 'version' ? 'נשמר ✓' : 'שמירה'}
          </button>
        </div>
      </div>

      <div className="section-title">הוספת סעיף</div>
      <div className="card">
        <div className="field">
          <label>כותרת הסעיף</label>
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </div>
        <div className="field">
          <label>נוסח (שורה ריקה = פרגרף חדש)</label>
          <textarea rows={6} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
        </div>
        <button className="btn" onClick={() => void addSection()}>
          הוספה
        </button>
      </div>

      <div className="section-title">סעיפי התקנון</div>
      {rows.map((row) => (
        <div className="card" key={row.id}>
          <div className="field">
            <label>כותרת הסעיף</label>
            <input value={row.title} onChange={(event) => updateField(row.id, 'title', event.target.value)} />
          </div>
          <div className="field">
            <label>נוסח (שורה ריקה = פרגרף חדש)</label>
            <textarea
              rows={8}
              value={row.body}
              onChange={(event) => updateField(row.id, 'body', event.target.value)}
            />
          </div>
          <div className="field" style={{ maxWidth: 120 }}>
            <label>סדר</label>
            <input
              type="number"
              value={row.sort_order}
              onChange={(event) => updateField(row.id, 'sort_order', Number(event.target.value))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn secondary" onClick={() => void saveRow(row)}>
              {savedId === row.id ? 'נשמר ✓' : 'שמירה'}
            </button>
            <button className="btn danger" onClick={() => void deleteSection(row.id)}>
              מחיקה
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
