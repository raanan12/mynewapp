/**
 * Expo push token registration.
 *
 * Remote push (unlike the local reminders in notifications.ts) does not
 * work in Expo Go from SDK 53 onward on either platform - this silently
 * no-ops there and only actually registers in a development or production
 * build. See admin-web's push tab for composing/sending a broadcast, and
 * `dispatch_due_push` in supabase/schema.sql for how it's delivered.
 */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/services/auth';

export async function registerPushToken(): Promise<void> {
  if (!supabase) return;

  try {
    const permission = await Notifications.getPermissionsAsync();
    const granted = permission.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    const userId = await getCurrentUserId();
    if (!userId) return;

    await supabase.from('push_tokens').upsert({ user_id: userId, token, updated_at: new Date().toISOString() });
  } catch {
    // Expo Go without a dev build, simulator without push capability, or a
    // denied permission - none of these should ever crash app startup.
  }
}
