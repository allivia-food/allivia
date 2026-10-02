import type { Session, User } from '@supabase/supabase-js';

import { PRIVACY_VERSION, TERMS_VERSION } from '@/constants/legal';
import { normalizeEmail } from '@/utils/validators';
import { withTimeout } from '@/utils/withTimeout';

import { getSupabase } from './supabase';

interface ConsentMetadata {
  terms_version?: string;
  privacy_version?: string;
  consent_accepted_at?: string;
}

export async function login(email: string, password: string): Promise<Session> {
  const { data, error } = await withTimeout(
    getSupabase().auth.signInWithPassword({ email: normalizeEmail(email), password }),
  );
  if (error) throw error;
  if (!data.session) throw new Error('No session returned');
  return data.session;
}

export async function logout(localOnly = false): Promise<void> {
  const { error } = await getSupabase().auth.signOut(localOnly ? { scope: 'local' } : undefined);
  if (error) throw error;
}

export interface RegisterResult {
  profileSaved: boolean;
}

export async function register(email: string, password: string): Promise<RegisterResult> {
  const consent: ConsentMetadata = {
    terms_version: TERMS_VERSION,
    privacy_version: PRIVACY_VERSION,
    consent_accepted_at: new Date().toISOString(),
  };
  const { data, error } = await withTimeout(
    getSupabase().auth.signUp({
      email: normalizeEmail(email),
      password,
      options: { data: consent },
    }),
  );
  if (error) throw error;
  if (!data.user || !data.session) throw new Error('Sign-up returned no session');
  try {
    return { profileSaved: await ensureProfile(data.user) };
  } catch (profileError) {
    if (__DEV__) console.warn('[auth] profiles insert failed after sign-up', profileError);
    return { profileSaved: false };
  }
}

export async function ensureProfile(user: User): Promise<boolean> {
  const meta = (user.user_metadata ?? {}) as ConsentMetadata;
  if (!meta.terms_version || !meta.privacy_version || !user.email) return false;
  const { error } = await withTimeout(
    getSupabase()
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: normalizeEmail(user.email),
          terms_version: meta.terms_version,
          privacy_version: meta.privacy_version,
          consent_accepted_at: meta.consent_accepted_at ?? new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: true },
      ),
  );
  if (error) throw error;
  return true;
}

export async function reauthenticate(currentEmail: string, password: string): Promise<void> {
  await login(currentEmail, password);
}

export async function changeEmail(newEmail: string): Promise<void> {
  const { error } = await withTimeout(
    getSupabase().auth.updateUser({ email: normalizeEmail(newEmail) }),
  );
  if (error) throw error;
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await withTimeout(getSupabase().auth.updateUser({ password: newPassword }));
  if (error) throw error;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await withTimeout(
    getSupabase().auth.resetPasswordForEmail(normalizeEmail(email)),
  );
  if (error) throw error;
}
