import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

type Stats = {
  totalUsers: number;
  newUsers7d: number;
  totalRaised: number;
  raisedToday: number;
  donationCount: number;
  averageDonation: number;
  activeDonorsToday: number;
  activeDonors7d: number;
  savedCards: number;
  autoPilotUsers: number;
  byCategory: { category_id: string; category_label: string; total: number; count: number }[];
  daily: { day: string; total: number; count: number; donors: number }[];
};

const currency = (value: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

export function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('admin_stats');
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setStats(data as Stats);
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <p className="muted">טוענים נתונים...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!stats) return null;

  const maxDaily = Math.max(...stats.daily.map((point) => Number(point.total)), 1);

  return (
    <div>
      <div className="grid">
        <StatTile label="סך הכל נתרם" value={currency(stats.totalRaised)} hint={`${currency(stats.raisedToday)} היום`} />
        <StatTile
          label="משתמשים רשומים"
          value={String(stats.totalUsers)}
          hint={`+${stats.newUsers7d} בשבוע האחרון`}
        />
        <StatTile
          label="תורמים פעילים היום"
          value={String(stats.activeDonorsToday)}
          hint={`${stats.activeDonors7d} ב-7 ימים`}
        />
        <StatTile label="מספר תרומות" value={String(stats.donationCount)} />
        <StatTile label="תרומה ממוצעת" value={currency(stats.averageDonation)} />
        <StatTile label="כרטיסים שמורים" value={String(stats.savedCards)} />
        <StatTile label="טייס אוטומטי" value={String(stats.autoPilotUsers)} />
      </div>

      <div className="section-title">30 הימים האחרונים</div>
      <div className="card">
        {stats.daily.length === 0 ? (
          <p className="muted">אין עדיין תרומות להצגה.</p>
        ) : (
          <div className="bars">
            {stats.daily.map((point) => (
              <div
                key={point.day}
                className="bar"
                title={`${point.day}: ${currency(Number(point.total))}`}
                style={{ height: `${Math.max((Number(point.total) / maxDaily) * 100, 2)}%` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="section-title">פילוח לפי קטגוריה</div>
      <div className="card">
        {stats.byCategory.length === 0 ? (
          <p className="muted">אין נתונים עדיין.</p>
        ) : (
          stats.byCategory.map((row) => (
            <div className="row" key={row.category_id}>
              <div className="row-main">
                <div className="row-title">{row.category_label}</div>
                <div className="row-meta">{row.count} תרומות</div>
              </div>
              <div style={{ fontWeight: 800 }}>{currency(Number(row.total))}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
