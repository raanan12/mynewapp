/**
 * Runtime configuration. Only `EXPO_PUBLIC_*` variables are inlined into the
 * client bundle, so never put secrets here.
 */
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://example.com/api',
  isDev: __DEV__,
} as const;
