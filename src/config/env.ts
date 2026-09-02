/**
 * Runtime configuration. Only `EXPO_PUBLIC_*` variables are inlined into the
 * client bundle, so never put secrets here.
 *
 * Kesher (קשר סליקה) credentials never live in the app:
 *   - `KESHER_API_USERNAME` / `KESHER_API_PASSWORD` are Edge Function secrets,
 *     used only by the `kesher-charge` function.
 *   - `tokenization_page_id` / `project_number` are read from the public
 *     `kesher_settings` table (see src/services/kesher-hosted.ts) rather than
 *     from env vars, so they can be changed without shipping a new build.
 */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  /** Base URL of the server that proxies Kesher charges, used only when
   *  Supabase itself is not configured (fully local/offline demo mode). */
  kesherProxyUrl: process.env.EXPO_PUBLIC_KESHER_PROXY_URL ?? '',
  kesherTerminalId: process.env.EXPO_PUBLIC_KESHER_TERMINAL_ID ?? '',
  isDev: __DEV__,
} as const;

/** When false the app runs fully on local state - useful for demos and E2E. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

/** When false the Kesher layer falls back to its simulated sandbox. */
export const isKesherConfigured = Boolean(env.kesherProxyUrl && env.kesherTerminalId);
