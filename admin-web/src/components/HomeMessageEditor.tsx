import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import { uploadAsset } from '../lib/upload';

type HomeMessageRow = {
  text: string;
  image_url: string | null;
};

/** The optional "atmosphere sentence" and the tzedakah-box logo, both shown
 *  on the giving screen. */
export function HomeMessageEditor() {
  const [row, setRow] = useState<HomeMessageRow>({ text: '', image_url: null });
  const [boxLogoUrl, setBoxLogoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedLogo, setSavedLogo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    void (async () => {
      const [{ data: message }, { data: logoText }] = await Promise.all([
        supabase.from('home_message').select('text, image_url').eq('id', 'default').maybeSingle(),
        supabase.from('app_texts').select('value').eq('id', 'box_logo_url').maybeSingle(),
      ]);
      if (message) setRow(message);
      if (logoText) setBoxLogoUrl(logoText.value);
    })();
  }, []);

  async function save() {
    const { error: upsertError } = await supabase
      .from('home_message')
      .upsert({ id: 'default', text: row.text, image_url: row.image_url });

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    setError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function saveBoxLogo() {
    const { error: updateError } = await supabase
      .from('app_texts')
      .update({ value: boxLogoUrl })
      .eq('id', 'box_logo_url');

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError(null);
    setSavedLogo(true);
    setTimeout(() => setSavedLogo(false), 1500);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);

    try {
      const url = await uploadAsset(file, 'home-message');
      setRow({ ...row, image_url: url });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'העלאת התמונה נכשלה.');
    } finally {
      setUploading(false);
    }
  }

  async function uploadBoxLogo(file: File) {
    setUploadingLogo(true);
    setError(null);

    try {
      const url = await uploadAsset(file, 'box-logo');
      setBoxLogoUrl(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'העלאת הלוגו נכשלה.');
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <div>
      <div className="section-title">משפט אווירה בעמוד הבית</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          מוצג בעמוד הנתינה, מתחת לקופה. השאירו את הטקסט ריק כדי שלא יוצג כלל.
        </p>
        <div className="field">
          <label>טקסט</label>
          <textarea rows={3} value={row.text} onChange={(event) => setRow({ ...row, text: event.target.value })} />
        </div>
        <div className="field">
          <label>תמונה (אופציונלי)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {row.image_url ? (
              <img src={row.image_url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
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
                הסרת תמונה
              </button>
            ) : null}
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" onClick={() => void save()}>
          {saved ? 'נשמר ✓' : 'שמירה'}
        </button>
      </div>

      <div className="section-title">לוגו על קופת הצדקה</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          מוצג על הלוח שבחזית הקופה. השאירו ריק כדי להשתמש באייקון המובנה של האפליקציה.
        </p>
        <div className="field">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {boxLogoUrl ? (
              <img src={boxLogoUrl} alt="" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8 }} />
            ) : null}
            <label className="btn secondary" style={{ cursor: 'pointer' }}>
              {uploadingLogo ? 'מעלה...' : 'העלאת לוגו'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadBoxLogo(file);
                  event.target.value = '';
                }}
              />
            </label>
            {boxLogoUrl ? (
              <button className="btn danger" onClick={() => setBoxLogoUrl('')}>
                הסרה
              </button>
            ) : null}
          </div>
        </div>
        <button className="btn" onClick={() => void saveBoxLogo()}>
          {savedLogo ? 'נשמר ✓' : 'שמירה'}
        </button>
      </div>
    </div>
  );
}
