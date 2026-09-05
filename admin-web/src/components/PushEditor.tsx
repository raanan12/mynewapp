import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type PushRow = {
  id: string;
  title: string;
  body: string;
  link_url: string | null;
  scheduled_at: string;
  sent_at: string | null;
};

const emptyDraft = { title: '', body: '', link_url: '', scheduledAt: '' };

/**
 * Composes a broadcast push notification. Sending is handled entirely in
 * Postgres (see `dispatch_due_push` in supabase/schema.sql, run every minute
 * by pg_cron) - leaving "מתי לשלוח" empty sends on the very next tick, which
 * is what makes this a one-time "send now" instead of a scheduled push.
 */
export function PushEditor() {
  const [rows, setRows] = useState<PushRow[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from('push_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setRows(data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function send() {
    if (!draft.title.trim() || !draft.body.trim()) return;

    const { error: insertError } = await supabase.from('push_notifications').insert({
      title: draft.title.trim(),
      body: draft.body.trim(),
      link_url: draft.link_url.trim() || null,
      ...(draft.scheduledAt ? { scheduled_at: new Date(draft.scheduledAt).toISOString() } : {}),
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDraft(emptyDraft);
    setError(null);
    await load();
  }

  async function cancelPending(id: string) {
    if (!confirm('לבטל את ההתראה? היא תישלח אלא אם תמחקו אותה עכשיו.')) return;
    await supabase.from('push_notifications').delete().eq('id', id);
    await load();
  }

  return (
    <div>
      <div className="section-title">שליחת התראת Push</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          נשלחת לכל מי שהתקין את האפליקציה ואישר התראות. לא עובד ב-Expo Go - רק בבנייה (development/production).
        </p>
        <div className="field">
          <label>כותרת</label>
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </div>
        <div className="field">
          <label>טקסט</label>
          <textarea rows={3} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
        </div>
        <div className="field">
          <label>קישור (אופציונלי)</label>
          <input
            value={draft.link_url}
            onChange={(event) => setDraft({ ...draft, link_url: event.target.value })}
            placeholder="https://..."
            dir="ltr"
          />
        </div>
        <div className="field">
          <label>מתי לשלוח (השאירו ריק לשליחה מיידית)</label>
          <input
            type="datetime-local"
            value={draft.scheduledAt}
            onChange={(event) => setDraft({ ...draft, scheduledAt: event.target.value })}
          />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" onClick={() => void send()}>
          {draft.scheduledAt ? 'תזמון שליחה' : 'שליחה עכשיו'}
        </button>
      </div>

      <div className="section-title">היסטוריה</div>
      {rows.map((row) => (
        <div className="card" key={row.id}>
          <p style={{ margin: 0, fontWeight: 700 }}>{row.title}</p>
          <p className="muted" style={{ marginTop: 4 }}>
            {row.body}
          </p>
          <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>
            {row.sent_at
              ? `נשלח: ${new Date(row.sent_at).toLocaleString('he-IL')}`
              : `מתוזמן: ${new Date(row.scheduled_at).toLocaleString('he-IL')}`}
          </p>
          {!row.sent_at ? (
            <button className="btn danger" style={{ marginTop: 8 }} onClick={() => void cancelPending(row.id)}>
              ביטול
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
