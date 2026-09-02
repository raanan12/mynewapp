import { useState } from 'react';

import { supabase } from '../lib/supabase';

type LoginProps = {
  deniedMessage?: string;
};

export function Login({ deniedMessage }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setBusy(false);
    if (signInError) setError(signInError.message);
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <h1>כניסת בעלים</h1>
        <p>לוח הניהול של החסד היומי. הגישה מוגבלת למנהלים בלבד.</p>

        {deniedMessage ? <p className="error">{deniedMessage}</p> : null}

        <div className="field">
          <label htmlFor="email">אימייל</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">סיסמה</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" className="btn" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'מתחברים...' : 'כניסה'}
        </button>
      </form>
    </div>
  );
}
