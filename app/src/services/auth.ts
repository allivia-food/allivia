import type { Session, User } from '@supabase/supabase-js';

import { PRIVACY_VERSION, TERMS_VERSION } from '@/constants/legal';
import { isValidPassword, normalizeEmail } from '@/utils/validators';
import { EmailOtpError, isEmailOtp, markOtpSent, otpKey } from '@/features/auth/emailOtp';
import { withTimeout } from '@/utils/withTimeout';

import { createPasswordAuthClient, getSupabase } from './supabase';

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
  confirmationRequired?: boolean;
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
  if (!data.user) throw new Error('Sign-up returned no user');
  if (!data.session) {
    markOtpSent(otpKey('signup', email));
    return { profileSaved: false, confirmationRequired: true };
  }
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

export async function requestPasswordReset(email: string): Promise<void> {
  clearPasswordProof();
  const { error } = await withTimeout(
    getSupabase().auth.resetPasswordForEmail(normalizeEmail(email)),
  );
  if (error) throw error;
  markOtpSent(otpKey('recovery', email));
}

export async function confirmSignupCode(email: string, token: string): Promise<void> {
  if (!isEmailOtp(token)) throw new EmailOtpError('invalid_code');
  const { data, error } = await withTimeout(
    getSupabase().auth.verifyOtp({ email: normalizeEmail(email), token, type: 'email' }),
  );
  if (error) throw error;
  if (!data.session) throw new EmailOtpError('invalid_code');
}

export async function resendSignupCode(email: string): Promise<void> {
  const { error } = await withTimeout(
    getSupabase().auth.resend({ type: 'signup', email: normalizeEmail(email) }),
  );
  if (error) throw error;
  markOtpSent(otpKey('signup', email));
}

type PasswordPurpose = 'recovery' | 'change';
interface PasswordProof {
  client: ReturnType<typeof createPasswordAuthClient>;
  purpose: PasswordPurpose;
  email: string;
  userId?: string;
  verifiedAt?: number;
}
let passwordProof: PasswordProof | null = null;
const PROOF_LIFETIME_MS = 10 * 60 * 1000;

export function clearPasswordProof(): void {
  const previous = passwordProof;
  passwordProof = null;
  if (previous) void withTimeout(previous.client.auth.signOut({ scope: 'local' })).catch(() => {});
}

function currentProof(purpose: PasswordPurpose): PasswordProof {
  if (!passwordProof || passwordProof.purpose !== purpose) throw new EmailOtpError('proof_expired');
  return passwordProof;
}

export function hasRecoveryProof(): boolean {
  return (
    passwordProof?.purpose === 'recovery' &&
    !!passwordProof.verifiedAt &&
    Date.now() - passwordProof.verifiedAt < PROOF_LIFETIME_MS
  );
}

export async function verifyRecoveryCode(email: string, token: string): Promise<void> {
  if (!isEmailOtp(token)) throw new EmailOtpError('invalid_code');
  clearPasswordProof();
  const proof: PasswordProof = {
    client: createPasswordAuthClient(),
    purpose: 'recovery',
    email: normalizeEmail(email),
  };
  passwordProof = proof;
  const { data, error } = await withTimeout(
    proof.client.auth.verifyOtp({ email: proof.email, token, type: 'recovery' }),
  );
  if (passwordProof !== proof) throw new EmailOtpError('proof_expired');
  if (error) throw error;
  if (!data.session || !data.user) throw new EmailOtpError('invalid_code');
  proof.verifiedAt = Date.now();
}

export async function completePasswordRecovery(newPassword: string): Promise<void> {
  const proof = currentProof('recovery');
  if (!hasRecoveryProof()) {
    clearPasswordProof();
    throw new EmailOtpError('proof_expired');
  }
  if (!isValidPassword(newPassword)) throw new Error('Invalid new password');
  const { error } = await withTimeout(proof.client.auth.updateUser({ password: newPassword }));
  if (error) throw error;
  clearPasswordProof();
}

export async function requestPasswordChangeCode(): Promise<string> {
  const { data, error } = await withTimeout(getSupabase().auth.getUser());
  if (error) throw error;
  if (!data.user?.email || !data.user.email_confirmed_at)
    throw new EmailOtpError('account_changed');
  clearPasswordProof();
  const proof: PasswordProof = {
    client: createPasswordAuthClient(),
    purpose: 'change',
    email: normalizeEmail(data.user.email),
    userId: data.user.id,
  };
  passwordProof = proof;
  const { error: sendError } = await withTimeout(
    proof.client.auth.signInWithOtp({ email: proof.email, options: { shouldCreateUser: false } }),
  );
  if (sendError) throw sendError;
  if (passwordProof !== proof) throw new EmailOtpError('proof_expired');
  markOtpSent(otpKey('change', proof.email));
  return proof.email;
}

export async function confirmPasswordChange(
  token: string,
  newPassword: string,
  currentPassword: string,
): Promise<void> {
  if (!isEmailOtp(token)) throw new EmailOtpError('invalid_code');
  if (!isValidPassword(newPassword)) throw new Error('Invalid new password');
  const proof = currentProof('change');
  const current = await withTimeout(getSupabase().auth.getUser());
  if (current.error) throw current.error;
  if (
    current.data.user?.id !== proof.userId ||
    normalizeEmail(current.data.user.email ?? '') !== proof.email
  ) {
    clearPasswordProof();
    throw new EmailOtpError('account_changed');
  }
  const { data, error } = await withTimeout(
    proof.client.auth.verifyOtp({ email: proof.email, token, type: 'email' }),
  );
  if (passwordProof !== proof) throw new EmailOtpError('proof_expired');
  if (error) throw error;
  if (!data.session || data.user?.id !== proof.userId) {
    clearPasswordProof();
    throw new EmailOtpError('account_changed');
  }
  const result = await withTimeout(
    getSupabase().auth.updateUser({ password: newPassword, current_password: currentPassword }),
  );
  if (result.error?.code === 'invalid_credentials')
    throw new EmailOtpError('current_password_invalid');
  if (result.error) throw result.error;
  clearPasswordProof();
}
