import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { uploadAsset } from '../lib/upload';

type SectionRow = {
  id: string;
  title: string;
  sort_order: number;
  is_visible: boolean;
};

/**
 * Order/title/visibility for the "לאן הכסף הולך" screen's sections, plus
 * the optional logo shown at the top of that screen. The data each section
 * renders (approvals, charities, ...) is edited in its own tab - this only
 * controls layout.
 */
export function TrustSectionsEditor() {
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void (async () => {
      const [{ data: sections }, { data: logoText }] = await Promise.all([
        supabase.from('trust_sections').select('*').order('sort_order'),
        supabase.from('app_texts').select('value').eq('id', 'trust_logo_url').maybeSingle(),
      ]);
      if (sections) setRows(sections);
      if (logoText) setLogoUrl(logoText.value);
    })();
  }, []);

  function updateField(id: string, field: keyof SectionRow, value: string | number | boolean) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  async function saveRow(row: SectionRow) {
    const { error: updateError } = await supabase
      .from('trust_sections')
      .update({ title: row.title, sort_order: row.sort_order, is_visible: row.is_visible })
      .eq('id', row.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setSavedRowId(row.id);
    setTimeout(() => setSavedRowId((current) => (current === row.id ? null : current)), 1500);
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

      <div className="section-title">סקשנים בעמוד</div>
      {rows.map((row) => (
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
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={row.is_visible}
              onChange={(event) => updateField(row.id, 'is_visible', event.target.checked)}
            />
            מוצג בעמוד
          </label>
          <div style={{ marginTop: 10 }}>
            <button className="btn secondary" onClick={() => void saveRow(row)}>
              {savedRowId === row.id ? 'נשמר ✓' : 'שמירה'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
