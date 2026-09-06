import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type SlotRow = {
  id: string;
  label: string;
  hour: number;
  minute: number;
  weekday: number | null;
  sort_order: number;
};

const WEEKDAYS = [
  { value: 0, label: 'כל יום' },
  { value: 1, label: 'יום ראשון' },
  { value: 2, label: 'יום שני' },
  { value: 3, label: 'יום שלישי' },
  { value: 4, label: 'יום רביעי' },
  { value: 5, label: 'יום חמישי' },
  { value: 6, label: 'יום שישי' },
  { value: 7, label: 'שבת' },
];

const emptyDraft = { label: '', hour: 8, minute: 0, weekday: 0 };

/**
 * Preset reminder/auto-pilot times shared by everyone - the app also lets
 * each user add their own free-hour slots, which never appear here.
 */
export function ReminderSlotsEditor() {
  const [rows, setRows] = useState<SlotRow[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('reminder_slots').select('*').order('sort_order');
    setRows(data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addSlot() {
    if (!draft.label.trim()) return;

    const { error: insertError } = await supabase.from('reminder_slots').insert({
      id: `slot-${Date.now().toString(36)}`,
      label: draft.label.trim(),
      hour: draft.hour,
      minute: draft.minute,
      weekday: draft.weekday || null,
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

  function updateField(id: string, field: keyof SlotRow, value: string | number | null) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  async function saveRow(row: SlotRow) {
    const { error: updateError } = await supabase
      .from('reminder_slots')
      .update({
        label: row.label,
        hour: row.hour,
        minute: row.minute,
        weekday: row.weekday || null,
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

  async function deleteSlot(id: string) {
    if (!confirm('להסיר את השעה? משתמשים שהפעילו תזכורת זו יאבדו אותה.')) return;

    const { error: deleteError } = await supabase.from('reminder_slots').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="section-title">הוספת שעה</div>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          שעות אלה מוצעות לכל המשתמשים כתזכורת יומית וכשעה לטייס האוטומטי. הכיתוב הוא טקסט ההסבר, למשל
          "8:00 - שחרית". "יום בשבוע" משאירים על "כל יום" לתזכורת שחוזרת יומית - למשל "ערב שבת" צריך להיות
          מוגבל ליום שישי בלבד.
        </p>
        <div className="form-grid">
          <div>
            <label>כיתוב (הסבר)</label>
            <input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
          </div>
          <div>
            <label>שעה (0-23)</label>
            <input
              type="number"
              min={0}
              max={23}
              value={draft.hour}
              onChange={(event) => setDraft({ ...draft, hour: Number(event.target.value) })}
            />
          </div>
          <div>
            <label>דקה</label>
            <input
              type="number"
              min={0}
              max={59}
              value={draft.minute}
              onChange={(event) => setDraft({ ...draft, minute: Number(event.target.value) })}
            />
          </div>
          <div>
            <label>יום בשבוע</label>
            <select
              value={draft.weekday}
              onChange={(event) => setDraft({ ...draft, weekday: Number(event.target.value) })}>
              {WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" onClick={() => void addSlot()}>
          הוספה
        </button>
      </div>

      <div className="section-title">שעות קיימות</div>
      {rows.map((row) => (
        <div className="card" key={row.id}>
          <div className="form-grid">
            <div>
              <label>כיתוב (הסבר)</label>
              <input value={row.label} onChange={(event) => updateField(row.id, 'label', event.target.value)} />
            </div>
            <div>
              <label>שעה (0-23)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={row.hour}
                onChange={(event) => updateField(row.id, 'hour', Number(event.target.value))}
              />
            </div>
            <div>
              <label>דקה</label>
              <input
                type="number"
                min={0}
                max={59}
                value={row.minute}
                onChange={(event) => updateField(row.id, 'minute', Number(event.target.value))}
              />
            </div>
            <div>
              <label>יום בשבוע</label>
              <select
                value={row.weekday ?? 0}
                onChange={(event) => updateField(row.id, 'weekday', Number(event.target.value))}>
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
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
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn secondary" onClick={() => void saveRow(row)}>
              {savedId === row.id ? 'נשמר ✓' : 'שמירה'}
            </button>
            <button className="btn danger" onClick={() => void deleteSlot(row.id)}>
              מחיקה
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
