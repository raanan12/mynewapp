import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { uploadAsset } from '../lib/upload';
import { IconPicker } from './icon-picker';

const TABS: { key: string; label: string }[] = [
  { key: 'tab_icon_giving', label: 'נתינה' },
  { key: 'tab_icon_wallet', label: 'כרטיס' },
  { key: 'tab_icon_history', label: 'היסטוריה' },
  { key: 'tab_icon_trust', label: 'שקיפות' },
  { key: 'tab_icon_settings', label: 'הגדרות' },
];

/** Each tab's icon: either pick from the built-in set, or upload a custom
 *  image that replaces it entirely. Empty means "use the app's default". */
export function TabIconsEditor() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('app_texts')
        .select('id, value')
        .in('id', TABS.map((tab) => tab.key));
      if (data) setValues(Object.fromEntries(data.map((row) => [row.id, row.value])));
    })();
  }, []);

  function setValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save(key: string) {
    const { error: updateError } = await supabase
      .from('app_texts')
      .update({ value: values[key] ?? '' })
      .eq('id', key);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setSavedKey(key);
    setTimeout(() => setSavedKey((current) => (current === key ? null : current)), 1500);
  }

  async function uploadIcon(key: string, file: File) {
    setUploadingKey(key);
    setError(null);

    try {
      const url = await uploadAsset(file, 'tab-icons');
      setValue(key, url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'העלאת התמונה נכשלה.');
    } finally {
      setUploadingKey(null);
    }
  }

  return (
    <div>
      <div className="section-title">אייקוני התפריט התחתון</div>
      {error ? <p className="error">{error}</p> : null}
      {TABS.map(({ key, label }) => {
        const value = values[key] ?? '';
        const isImage = value.startsWith('http');

        return (
          <div className="card" key={key}>
            <div className="section-title" style={{ marginTop: 0 }}>
              {label}
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              השאירו ריק כדי להשתמש באייקון המובנה של האפליקציה.
            </p>
            <IconPicker value={isImage ? '' : value} onChange={(icon) => setValue(key, icon)} />
            <div className="field" style={{ marginTop: 10 }}>
              <label>או תמונה מותאמת</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {isImage ? (
                  <img src={value} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
                ) : null}
                <label className="btn secondary" style={{ cursor: 'pointer' }}>
                  {uploadingKey === key ? 'מעלה...' : 'העלאת תמונה'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadIcon(key, file);
                      event.target.value = '';
                    }}
                  />
                </label>
                {value ? (
                  <button className="btn danger" onClick={() => setValue(key, '')}>
                    איפוס לברירת מחדל
                  </button>
                ) : null}
              </div>
            </div>
            <button className="btn" style={{ marginTop: 10 }} onClick={() => void save(key)}>
              {savedKey === key ? 'נשמר ✓' : 'שמירה'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
