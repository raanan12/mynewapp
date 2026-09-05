import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { uploadAsset } from '../lib/upload';

type PopupRow = {
  enabled: boolean;
  image_url: string | null;
  link_url: string | null;
};

/** Opening popup shown at most once per day on the giving screen. */
export function PopupEditor() {
  const [row, setRow] = useState<PopupRow>({ enabled: false, image_url: null, link_url: null });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('app_popup')
        .select('enabled, image_url, link_url')
        .eq('id', 'default')
        .maybeSingle();
      if (data) setRow(data);
    })();
  }, []);

  async function save() {
    const { error: upsertError } = await supabase.from('app_popup').upsert({ id: 'default', ...row });

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);

    try {
      const url = await uploadAsset(file, 'popup');
      setRow({ ...row, image_url: url });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'העלאת התמונה נכשלה.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="section-title">פופ-אפ פתיחה</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          מוצג פעם ביום לכל היותר, בפתיחת האפליקציה. לחיצה על התמונה פותחת את הקישור (אם הוגדר), או פשוט
          מסגירה את הפופ-אפ ומעבירה למסך הנתינה.
        </p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(event) => setRow({ ...row, enabled: event.target.checked })}
          />
          מופעל
        </label>
        <div className="field" style={{ marginTop: 10 }}>
          <label>תמונה</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {row.image_url ? (
              <img
                src={row.image_url}
                alt=""
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }}
              />
            ) : null}
            <label className="btn secondary" style={{ cursor: 'pointer' }}>
              {uploading ? 'מעלה...' : 'העלאת תמונה'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage(file);
                  event.target.value = '';
                }}
              />
            </label>
            {row.image_url ? (
              <button className="btn danger" onClick={() => setRow({ ...row, image_url: null })}>
                הסרה
              </button>
            ) : null}
          </div>
        </div>
        <div className="field">
          <label>קישור (אופציונלי)</label>
          <input
            value={row.link_url ?? ''}
            onChange={(event) => setRow({ ...row, link_url: event.target.value || null })}
            placeholder="https://..."
            dir="ltr"
          />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" onClick={() => void save()}>
          {saved ? 'נשמר ✓' : 'שמירה'}
        </button>
      </div>
    </div>
  );
}
