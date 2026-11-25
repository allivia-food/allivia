import { getSupabase } from './supabase';
import { updateAvatar } from './profile';
export async function saveAvatar(userId: string, uri: string, oldPath?: string | null) {
  const storage = getSupabase().storage.from('avatars');
  const bytes = await (await fetch(uri)).arrayBuffer();
  const png = new Uint8Array(bytes)[0] === 137;
  const path =
    userId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + (png ? '.png' : '.jpg');
  const { error } = await storage.upload(path, bytes, {
    contentType: png ? 'image/png' : 'image/jpeg',
  });
  if (error) throw error;
  let profile;
  try {
    profile = await updateAvatar(userId, path);
  } catch (error) {
    await storage.remove([path]).catch(() => undefined);
    throw error;
  }
  if (oldPath) await storage.remove([oldPath]).catch(() => undefined);
  return profile;
}
export async function avatarUrl(path: string) {
  const { data, error } = await getSupabase().storage.from('avatars').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
