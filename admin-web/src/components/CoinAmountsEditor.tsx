import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

/** Drives the coin buttons on the giving screen ("הכפתורים בנתינה"). */
export function CoinAmountsEditor() {
  const [amounts, setAmounts] = useState<number[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from('giving_settings').select('coin_amounts').eq('id', 'default').maybeSingle();
    setAmounts(data?.coin_amounts ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(next: number[]) {
    setSaving(true);
    setError(null);

    const { error: upsertError } = await supabase
      .from('giving_settings')
      .upsert({ id: 'default', coin_amounts: next });

    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setAmounts(next);
  }

  function addAmount() {
    const value = Number(draft);
    if (!Number.isFinite(value) || value <= 0 || amounts.includes(value)) return;

    void save([...amounts, value].sort((a, b) => a - b));
    setDraft('');
  }

  function removeAmount(value: number) {
    void save(amounts.filter((amount) => amount !== value));
  }

  return (
    <div>
      <div className="section-title">סכומי המטבעות במסך הנתינה</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          אלה הסכומים הקבועים שמוצגים כמטבעות לתרומה מהירה. משתמשים יכולים גם להזין סכום חופשי בנוסף.
        </p>

        <div className="pill-list">
          {amounts.map((amount) => (
            <span className="pill" key={amount}>
              {amount} ₪<button onClick={() => removeAmount(amount)}>×</button>
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="סכום חדש, למשל 20"
            style={{ maxWidth: 160 }}
          />
          <button className="btn" disabled={saving} onClick={addAmount}>
            הוספה
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}
      </div>
    </div>
  );
}
