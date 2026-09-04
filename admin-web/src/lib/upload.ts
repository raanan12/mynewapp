import { supabase } from './supabase';

/**
 * Uploads a file to the public `app-assets` bucket (see supabase/schema.sql)
 * and returns its public URL. Writes are RLS-gated to admins, same as every
 * other table here.
 */
export async function uploadAsset(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('app-assets').upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from('app-assets').getPublicUrl(path);
  return data.publicUrl;
}
