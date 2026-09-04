import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { IconPicker } from './icon-picker';

type CategoryRow = {
  id: string;
  label: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

const emptyDraft = { id: '', label: '', description: '', icon: 'heart-outline' };

/**
 * "למה אפשר לתרום" - this drives the category chips on the giving screen and
 * the breakdown on the transparency screen. `id` becomes a permanent database
 * key (donations reference it) so it cannot be edited after creation - only
 * label/description/icon/order can.
 */
export function CategoriesEditor() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setRows(data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addCategory() {
    if (!draft.id.trim() || !draft.label.trim()) return;

    const { error: insertError } = await supabase.from('categories').insert({
      id: draft.id.trim(),
      label: draft.label.trim(),
      description: draft.description.trim(),
      icon: draft.icon.trim() || 'heart-outline',
      sort_order: rows.length + 1,
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

  async function updateField(id: string, field: keyof CategoryRow, value: string | boolean | number) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  async function saveRow(row: CategoryRow) {
    const { error: updateError } = await supabase
      .from('categories')
      .update({
        label: row.label,
        description: row.description,
        icon: row.icon,
        sort_order: row.sort_order,
        is_active: row.is_active,
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

  async function deleteCategory(id: string) {
    if (!confirm('להסיר את הקטגוריה? תרומות עם ייעוד קיים ישמרו כמו שהן.')) return;

    const { error: deleteError } = await supabase.from('categories').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="section-title">הוספת קטגוריה</div>
      <div className="card">
        <div className="form-grid">
          <div>
            <label>מזהה (אנגלית, קבוע)</label>
            <input
              value={draft.id}
              onChange={(event) => setDraft({ ...draft, id: event.target.value.trim() })}
              placeholder="e.g. education"
            />
          </div>
          <div>
            <label>שם בעברית</label>
            <input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
          </div>
          <div>
            <label>תיאור</label>
            <input
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>אייקון</label>
          <IconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" onClick={() => void addCategory()}>
          הוספה
        </button>
      </div>

      <div className="section-title">קטגוריות קיימות</div>
      {rows.map((row) => (
        <div className="card" key={row.id}>
          <div className="form-grid">
            <div>
              <label>מזהה</label>
              <input value={row.id} disabled />
            </div>
            <div>
              <label>שם בעברית</label>
              <input value={row.label} onChange={(event) => void updateField(row.id, 'label', event.target.value)} />
            </div>
            <div>
              <label>תיאור</label>
              <input
                value={row.description}
                onChange={(event) => void updateField(row.id, 'description', event.target.value)}
              />
            </div>
            <div>
              <label>סדר הופעה</label>
              <input
                type="number"
                value={row.sort_order}
                onChange={(event) => void updateField(row.id, 'sort_order', Number(event.target.value))}
              />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>אייקון</label>
            <IconPicker value={row.icon} onChange={(icon) => void updateField(row.id, 'icon', icon)} />
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={row.is_active}
              onChange={(event) => void updateField(row.id, 'is_active', event.target.checked)}
            />
            פעילה (מוצגת באפליקציה)
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn secondary" onClick={() => void saveRow(row)}>
              {savedId === row.id ? 'נשמר ✓' : 'שמירה'}
            </button>
            <button className="btn danger" onClick={() => void deleteCategory(row.id)}>
              מחיקה
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
