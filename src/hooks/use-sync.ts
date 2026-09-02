import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';
import { pushSettings, syncAll } from '@/services/sync';
import { useAppStore } from '@/store/app-store';

/**
 * Keeps the device and Supabase in step: a full reconcile on launch and on
 * every foreground, plus a push whenever the user changes a preference.
 *
 * A no-op when Supabase is not configured, which is what lets the app run
 * entirely offline.
 */
export function useSync(): void {
  const settings = useAppStore((state) => state.settings);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!supabase) return;

    void syncAll();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void syncAll();
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // Skip the initial render - that state came from disk, not from the user.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    void pushSettings();
  }, [settings]);
}
