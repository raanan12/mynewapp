import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type ApprovalRow = {
  id: string;
  rabbi_name: string;
  title: string;
  image_url: string;
  year: string;
  sort_order: number;
};

const emptyDraft = { rabbiName: '', title: '', imageUrl: '', year: '' };

/**
 * Rabbinical approval letters. `image_url` must be a link to an already
 * hosted image (e.g. uploaded to Supabase Storage from its dashboard) - this
 * screen does not upload files itself.
 */
export function ApprovalsEditor() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('approvals').select('*').order('sort_order');
    setRows(data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addApproval() {
    if (!draft.rabbiName.trim() || !draft.imageUrl.trim()) return;

    const { error: insertError } = await supabase.from('approvals').insert({
      id: `a-${Date.now().toString(36)}`,
      rabbi_name: draft.rabbiName.trim(),
      title: draft.title.trim(),
      image_url: draft.imageUrl.trim(),
      year: draft.year.trim(),
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

  function updateField(id: string, field: keyof ApprovalRow, value: string | number) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  async function saveRow(row: ApprovalRow) {
    const { error: updateError } = await supabase
      .from('approvals')
      .update({
        rabbi_name: row.rabbi_name,
        title: row.title,
        image_url: row.image_url,
        year: row.year,
        sort_order: row.sort_order,
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

  async function deleteApproval(id: string) {
    if (!confirm('למחוק את ההסכמה?')) return;
    await supabase.from('approvals').delete().eq('id', id);
    await load();
  }

  return (
    <div>
      <div className="section-title">הוספת הסכמה</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          יש להעלות את תמונת המכתב לאחסון (Supabase Storage) ולהדביק כאן את הקישור הציבורי אליה.
        </p>
        <div className="form-grid">
          <div>
            <label>שם הרב</label>
            <input value={draft.rabbiName} onChange={(event) => setDraft({ ...draft, rabbiName: event.target.value })} />
          </div>
          <div>
            <label>כותרת</label>
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </div>
          <div>
            <label>שנה</label>
            <input value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })} />
          </div>
          <div>
            <label>קישור לתמונה</label>
            <input value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} />
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" onClick={() => void addApproval()}>
          הוספה
        </button>
      </div>

      <div className="section-title">הסכמות קיימות</div>
      {rows.map((row) => (
        <div className="card" key={row.id}>
          <div style={{ display: 'flex', gap: 12 }}>
            <img
              src={row.image_url}
              alt={row.rabbi_name}
              style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
            />
            <div className="form-grid" style={{ flex: 1 }}>
              <div>
                <label>שם הרב</label>
                <input value={row.rabbi_name} onChange={(event) => updateField(row.id, 'rabbi_name', event.target.value)} />
              </div>
              <div>
                <label>כותרת</label>
                <input value={row.title} onChange={(event) => updateField(row.id, 'title', event.target.value)} />
              </div>
              <div>
                <label>שנה</label>
                <input value={row.year} onChange={(event) => updateField(row.id, 'year', event.target.value)} />
              </div>
              <div>
                <label>קישור לתמונה</label>
                <input value={row.image_url} onChange={(event) => updateField(row.id, 'image_url', event.target.value)} />
              </div>
              <div>
                <label>סדר תצוגה</label>
                <input
                  type="number"
                  value={row.sort_order}
                  onChange={(event) => updateField(row.id, 'sort_order', Number(event.target.value))}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn secondary" onClick={() => void saveRow(row)}>
              {savedId === row.id ? 'נשמר ✓' : 'שמירה'}
            </button>
            <button className="btn danger" onClick={() => void deleteApproval(row.id)}>
              מחיקה
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
