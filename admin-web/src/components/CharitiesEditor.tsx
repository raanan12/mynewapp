import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type CharityRow = {
  id: string;
  name: string;
  category_id: string;
  description: string;
  allocation: number;
  has_clause_46: boolean;
  is_active: boolean;
  long_description: string;
  website_url: string | null;
};

type CategoryOption = { id: string; label: string };

const emptyDraft = { id: '', name: '', category_id: '', description: '', allocation: 100 };

export function CharitiesEditor() {
  const [rows, setRows] = useState<CharityRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function load() {
    const [{ data: charities }, { data: cats }] = await Promise.all([
      supabase.from('charities').select('*').order('category_id'),
      supabase.from('categories').select('id, label').order('sort_order'),
    ]);
    setRows(charities ?? []);
    setCategories(cats ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addCharity() {
    if (!draft.id.trim() || !draft.name.trim() || !draft.category_id) return;

    const { error: insertError } = await supabase.from('charities').insert({
      id: draft.id.trim(),
      name: draft.name.trim(),
      category_id: draft.category_id,
      description: draft.description.trim(),
      allocation: draft.allocation,
      has_clause_46: false,
      is_active: true,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDraft(emptyDraft);
    setError(null);
    await load();
  }

  function updateField(id: string, field: keyof CharityRow, value: string | boolean | number | null) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  async function saveRow(row: CharityRow) {
    const { error: updateError } = await supabase
      .from('charities')
      .update({
        name: row.name,
        category_id: row.category_id,
        description: row.description,
        allocation: row.allocation,
        has_clause_46: row.has_clause_46,
        is_active: row.is_active,
        long_description: row.long_description,
        website_url: row.website_url?.trim() || null,
      })
      .eq('id', row.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setSavedId(row.id);
    setTimeout(() => setSavedId((current) => (current === row.id ? null : current)), 1500);
  }

  async function deleteCharity(id: string) {
    if (!confirm('להסיר את הארגון?')) return;
    const { error: deleteError } = await supabase.from('charities').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="section-title">הוספת ארגון</div>
      <div className="card">
        <div className="form-grid">
          <div>
            <label>מזהה (אנגלית, קבוע)</label>
            <input value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value.trim() })} />
          </div>
          <div>
            <label>שם הארגון</label>
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>
          <div>
            <label>קטגוריה</label>
            <select value={draft.category_id} onChange={(event) => setDraft({ ...draft, category_id: event.target.value })}>
              <option value="">בחרו קטגוריה</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>אחוז הקצאה בקטגוריה</label>
            <input
              type="number"
              value={draft.allocation}
              onChange={(event) => setDraft({ ...draft, allocation: Number(event.target.value) })}
            />
          </div>
          <div>
            <label>תיאור</label>
            <input
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" onClick={() => void addCharity()}>
          הוספה
        </button>
      </div>

      <div className="section-title">ארגונים קיימים</div>
      {rows.map((row) => (
        <div className="card" key={row.id}>
          <div className="form-grid">
            <div>
              <label>שם הארגון</label>
              <input value={row.name} onChange={(event) => updateField(row.id, 'name', event.target.value)} />
            </div>
            <div>
              <label>קטגוריה</label>
              <select
                value={row.category_id}
                onChange={(event) => updateField(row.id, 'category_id', event.target.value)}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>אחוז הקצאה</label>
              <input
                type="number"
                value={row.allocation}
                onChange={(event) => updateField(row.id, 'allocation', Number(event.target.value))}
              />
            </div>
            <div>
              <label>תיאור</label>
              <input
                value={row.description}
                onChange={(event) => updateField(row.id, 'description', event.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>קישור לאתר הארגון (אופציונלי)</label>
            <input
              value={row.website_url ?? ''}
              onChange={(event) => updateField(row.id, 'website_url', event.target.value)}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <div className="field">
            <label>תיאור מורחב (אופציונלי) - שורה שמתחילה ב-## הופכת לכותרת, **טקסט** יודגש</label>
            <textarea
              rows={5}
              value={row.long_description}
              onChange={(event) => updateField(row.id, 'long_description', event.target.value)}
            />
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={row.has_clause_46}
              onChange={(event) => updateField(row.id, 'has_clause_46', event.target.checked)}
            />
            מוכר לפי סעיף 46
          </label>
          <br />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={row.is_active}
              onChange={(event) => updateField(row.id, 'is_active', event.target.checked)}
            />
            פעיל
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn secondary" onClick={() => void saveRow(row)}>
              {savedId === row.id ? 'נשמר ✓' : 'שמירה'}
            </button>
            <button className="btn danger" onClick={() => void deleteCharity(row.id)}>
              מחיקה
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
