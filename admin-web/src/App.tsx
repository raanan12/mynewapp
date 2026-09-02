import { useEffect, useState } from 'react';

import { supabase } from './lib/supabase';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';

type AuthState = 'checking' | 'signedOut' | 'admin';

/**
 * Gate: only a signed-in user with `is_admin = true` on their profile ever
 * sees the Dashboard. A valid login that is not an admin gets signed out
 * immediately rather than left in limbo. The real enforcement is Postgres
 * RLS (`is_admin()` in every admin policy); this is just the UI reflecting it.
 */
export function App() {
  const [state, setState] = useState<AuthState>('checking');
  const [deniedMessage, setDeniedMessage] = useState<string | undefined>();

  async function checkSession() {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      setState('signedOut');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', auth.user.id)
      .maybeSingle();

    if (profile?.is_admin) {
      setState('admin');
      return;
    }

    await supabase.auth.signOut();
    setDeniedMessage('החשבון הזה אינו מוגדר כמנהל.');
    setState('signedOut');
  }

  useEffect(() => {
    void checkSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void checkSession();
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  if (state === 'checking') {
    return (
      <div className="login-screen">
        <p className="muted">בודקים הרשאות...</p>
      </div>
    );
  }

  if (state === 'admin') {
    return <Dashboard onSignOut={() => void supabase.auth.signOut()} />;
  }

  return <Login deniedMessage={deniedMessage} />;
}
