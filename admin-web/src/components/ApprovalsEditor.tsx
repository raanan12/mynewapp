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
        <div className="row" key={row.id}>
          <img src={row.image_url} alt={row.rabbi_name} style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 6 }} />
          <div className="row-main">
            <div className="row-title">{row.rabbi_name}</div>
            <div className="row-meta">
              {row.title} · {row.year}
            </div>
          </div>
          <button className="btn danger" onClick={() => void deleteApproval(row.id)}>
            מחיקה
          </button>
        </div>
      ))}
    </div>
  );
}
