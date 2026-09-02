import { useEffect, useState } from 'react';

import { quotes as localQuotes } from '@/constants/content';
import { supabase } from '@/lib/supabase';
import type { Quote } from '@/types';
import { toDateKey } from '@/utils/format';

/** Same quote for everyone on a given day, so it can be talked about. */
function pickForToday(pool: readonly Quote[]): Quote {
  const key = toDateKey();
  const seed = Number(key.replace(/-/g, ''));
  return pool[seed % pool.length];
}

/**
 * Today's quote. Renders instantly from the bundled list and upgrades to the
 * Supabase-managed pool once it arrives - the modal must never block the flow.
 */
export function useDailyQuote(): Quote {
  const [quote, setQuote] = useState<Quote>(() => pickForToday(localQuotes));

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    void supabase
      .from('quotes')
      .select('id, text, source, is_active')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (!active || error || !data?.length) return;
        setQuote(pickForToday(data.map(({ id, text, source }) => ({ id, text, source }))));
      });

    return () => {
      active = false;
    };
  }, []);

  return quote;
}
