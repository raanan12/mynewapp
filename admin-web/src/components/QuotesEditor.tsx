import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type QuoteRow = {
  id: string;
  text: string;
  source: string;
  is_active: boolean;
};

export function QuotesEditor() {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('quotes').select('*').order('id');
    setRows(data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addQuote() {
    if (!text.trim()) return;

    const { error: insertError } = await supabase.from('quotes').insert({
      id: `q-${Date.now().toString(36)}`,
      text: text.trim(),
      source: source.trim(),
      is_active: true,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setText('');
    setSource('');
    setError(null);
    await load();
  }

  async function toggleActive(row: QuoteRow) {
    await supabase.from('quotes').update({ is_active: !row.is_active }).eq('id', row.id);
    await load();
  }

  async function deleteQuote(id: string) {
    if (!confirm('למחוק את הציטוט?')) return;
    await supabase.from('quotes').delete().eq('id', id);
    await load();
  }

  return (
    <div>
      <div className="section-title">הוספת ציטוט</div>
      <div className="card">
        <div className="field">
          <label>נוסח הציטוט</label>
          <textarea rows={2} value={text} onChange={(event) => setText(event.target.value)} />
        </div>
        <div className="field">
          <label>מקור (למשל: משלי י, ב)</label>
          <input value={source} onChange={(event) => setSource(event.target.value)} />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" onClick={() => void addQuote()}>
          הוספה
        </button>
      </div>

      <div className="section-title">ציטוטים קיימים</div>
      {rows.map((row) => (
        <div className="row" key={row.id}>
          <div className="row-main">
            <div className="row-title">{row.text}</div>
            <div className="row-meta">
              {row.source} {row.is_active ? '' : '· לא פעיל'}
            </div>
          </div>
          <button className="btn secondary" onClick={() => void toggleActive(row)}>
            {row.is_active ? 'הסתרה' : 'הפעלה'}
          </button>
          <button className="btn danger" onClick={() => void deleteQuote(row.id)}>
            מחיקה
          </button>
        </div>
      ))}
    </div>
  );
}
