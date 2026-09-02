/**
 * Supabase client for the admin site.
 *
 * Uses the public anon key only - every read/write here is bound by the same
 * RLS policies as the app (see supabase/schema.sql: the "admin writes ..."
 * and "admin reads ..." policies, all gated by `is_admin()`). There is no
 * service_role key here and no code path that touches `kesher_token` or
 * calls `kesher-charge` - this site cannot charge anyone or see card tokens,
 * by construction, not just by convention.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set - copy .env.example to .env.local');
}

export const supabase = createClient(url, anonKey);
