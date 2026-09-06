import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { uploadAsset } from '../lib/upload';

const FIXED_IDS = ['approvals', 'breakdown', 'charities'];

type SectionRow = {
  id: string;
  title: string;
  sort_order: number;
  is_visible: boolean;
  body: string | null;
};

const emptyDraft = { title: '', body: '' };

/**
 * Order/title/visibility for the "לאן הכסף הולך" screen's sections, plus
 * the optional logo shown at the top of that screen. The three fixed
 * sections' data (approvals, breakdown, charities) is edited in its own
 * tab - only their title/order/visibility live here. Admins can also add
 * fully custom sections (title + free text, same light markdown as a
 * charity's long description).
 */
export function TrustSectionsEditor() {
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const { data } = await supabase.from('trust_sections').select('*').order('sort_order');
    setRows(data ?? []);
  }

  useEffect(() => {
    void load();
    void (async () => {
      const { data } = await supabase.from('app_texts').select('value').eq('id', 'trust_logo_url').maybeSingle();
      if (data) setLogoUrl(data.value);
    })();
  }, []);

  function updateField(id: string, field: keyof SectionRow, value: string | number | boolean | null) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  async function addSection() {
    if (!draft.title.trim()) return;

    const { error: insertError } = await supabase.from('trust_sections').insert({
      id: `custom-${Date.now().toString(36)}`,
      title: draft.title.trim(),
      body: draft.body.trim(),
      sort_order: rows.length + 1,
      is_visible: true,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDraft(emptyDraft);
    setError(null);
    await load();
  }

  async function saveRow(row: SectionRow) {
    const { error: updateError } = await supabase
      .from('trust_sections')
      .update({ title: row.title, sort_order: row.sort_order, is_visible: row.is_visible, body: row.body })
      .eq('id', row.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setSavedRowId(row.id);
    setTimeout(() => setSavedRowId((current) => (current === row.id ? null : current)), 1500);
  }

  async function deleteSection(id: string) {
    if (!confirm('להסיר את הסקשן?')) return;

    const { error: deleteError } = await supabase.from('trust_sections').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
  }

  async function saveLogo() {
    const { error: updateError } = await supabase
      .from('app_texts')
      .update({ value: logoUrl })
      .eq('id', 'trust_logo_url');

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    setError(null);

    try {
      const url = await uploadAsset(file, 'trust-logo');
      setLogoUrl(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'העלאת התמונה נכשלה.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="section-title">לוגו בראש עמוד "לאן הכסף הולך"</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          השאירו ריק כדי שלא יוצג לוגו כלל.
        </p>
        <div className="field">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8 }} />
            ) : null}
            <label className="btn secondary" style={{ cursor: 'pointer' }}>
              {uploading ? 'מעלה...' : 'העלאת לוגו'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadLogo(file);
                  event.target.value = '';
                }}
              />
            </label>
            {logoUrl ? (
              <button className="btn danger" onClick={() => setLogoUrl('')}>
                הסרה
              </button>
            ) : null}
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" onClick={() => void saveLogo()}>
          {saved ? 'נשמר ✓' : 'שמירה'}
        </button>
      </div>

      <div className="section-title">הוספת סקשן מותאם</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          סקשן חופשי עם כותרת וטקסט - בשונה מ"הסכמות רבנים"/"פילוח הנתינה"/"הארגונים הנתמכים", שהתוכן
          שלהם נערך בטאבים משלהם. שורה שמתחילה ב-## הופכת לכותרת משנה, **טקסט** יודגש.
        </p>
        <div className="field">
          <label>כותרת</label>
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </div>
        <div className="field">
          <label>טקסט</label>
          <textarea rows={5} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
        </div>
        <button className="btn" onClick={() => void addSection()}>
          הוספה
        </button>
      </div>

      <div className="section-title">סקשנים בעמוד</div>
      {rows.map((row) => {
        const isCustom = !FIXED_IDS.includes(row.id);

        return (
          <div className="card" key={row.id}>
            <div className="form-grid">
              <div>
                <label>כותרת</label>
                <input value={row.title} onChange={(event) => updateField(row.id, 'title', event.target.value)} />
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
            {isCustom ? (
              <div className="field">
                <label>טקסט</label>
                <textarea
                  rows={4}
                  value={row.body ?? ''}
                  onChange={(event) => updateField(row.id, 'body', event.target.value)}
                />
              </div>
            ) : null}
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={row.is_visible}
                onChange={(event) => updateField(row.id, 'is_visible', event.target.checked)}
              />
              מוצג בעמוד
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn secondary" onClick={() => void saveRow(row)}>
                {savedRowId === row.id ? 'נשמר ✓' : 'שמירה'}
              </button>
              {isCustom ? (
                <button className="btn danger" onClick={() => void deleteSection(row.id)}>
                  מחיקה
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
