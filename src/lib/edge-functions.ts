/**
 * Shared wrapper around `supabase.functions.invoke(...)`.
 *
 * supabase-js does NOT put the function's JSON body into `data` when it
 * returns a non-2xx status - it only sets `error` to a generic
 * `FunctionsHttpError` ("Edge Function returned a non-2xx status code").
 * The actual `{ error: "..." }` body our functions send back has to be read
 * from `error.context` (the raw Response) instead, or every failure looks
 * like the same unhelpful message no matter what really went wrong
 * server-side. Every Edge Function call in the app should go through this.
 */

import { FunctionsHttpError } from '@supabase/functions-js';

import { supabase } from '@/lib/supabase';

export type EdgeFunctionResult<T> = { ok: true; data: T } | { ok: false; message: string };

export async function invokeEdgeFunction<T>(
  name: string,
  body: Record<string, unknown>
): Promise<EdgeFunctionResult<T>> {
  if (!supabase) {
    return { ok: false, message: 'Supabase לא מוגדר בבנייה הזו.' };
  }

  const { data, error } = await supabase.functions.invoke<T>(name, { body });

  if (!error) {
    return { ok: true, data: (data ?? {}) as T };
  }

  if (error instanceof FunctionsHttpError) {
    try {
      const errorBody = (await error.context.json()) as { error?: string };
      if (errorBody.error) return { ok: false, message: errorBody.error };
    } catch {
      // Response wasn't JSON - fall through to the generic message below.
    }
  }

  return { ok: false, message: 'הפעולה נכשלה. נסו שוב בעוד רגע.' };
}
