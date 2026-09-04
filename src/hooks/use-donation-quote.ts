import { useEffect, useRef, useState } from 'react';

import { defaultQuotes as localQuotes } from '@/constants/content';
import { supabase } from '@/lib/supabase';
import type { Quote } from '@/types';

/** Random, but never the same one twice in a row. */
function pickNext(pool: readonly Quote[], excludeId: string | null): Quote {
  if (pool.length === 1) return pool[0];
  let next = pool[Math.floor(Math.random() * pool.length)];
  while (next.id === excludeId) {
    next = pool[Math.floor(Math.random() * pool.length)];
  }
  return next;
}

/**
 * A fresh quote for each donation - renders instantly from the bundled list
 * and upgrades to the Supabase-managed pool once it arrives. Never repeats
 * the immediately-previous quote back to back.
 */
export function useDonationQuote(donationId: string | null): Quote {
  const [pool, setPool] = useState<readonly Quote[]>(localQuotes);
  const [quote, setQuote] = useState<Quote>(() => pickNext(localQuotes, null));
  const lastDonationId = useRef<string | null>(null);
  const lastQuoteId = useRef<string | null>(quote.id);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    void supabase
      .from('quotes')
      .select('id, text, source, is_active')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (!active || error || !data?.length) return;
        setPool(data.map(({ id, text, source }) => ({ id, text, source })));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!donationId || donationId === lastDonationId.current) return;
    lastDonationId.current = donationId;
    const next = pickNext(pool, lastQuoteId.current);
    lastQuoteId.current = next.id;
    setQuote(next);
  }, [donationId, pool]);

  return quote;
}
