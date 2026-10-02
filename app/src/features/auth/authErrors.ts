import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

import { strings } from '@/constants/strings';
import { TimeoutError } from '@/utils/withTimeout';

export type AuthErrorKind =
  | 'invalidCredentials'
  | 'invalidEmail'
  | 'emailTaken'
  | 'weakPassword'
  | 'rateLimited'
  | 'banned'
  | 'network'
  | 'unknown';

const KIND_BY_CODE: Record<string, AuthErrorKind> = {
  invalid_credentials: 'invalidCredentials',
  email_address_invalid: 'invalidEmail',
  user_already_exists: 'emailTaken',
  email_exists: 'emailTaken',
  weak_password: 'weakPassword',
  over_request_rate_limit: 'rateLimited',
  over_email_send_rate_limit: 'rateLimited',
  user_banned: 'banned',
};

export function authErrorKind(error: unknown): AuthErrorKind {
  if (error instanceof TimeoutError || isAuthRetryableFetchError(error)) return 'network';
  if (isAuthError(error) && error.code && KIND_BY_CODE[error.code]) return KIND_BY_CODE[error.code];
  if (error instanceof TypeError && /network|fetch/i.test(error.message)) return 'network';
  return 'unknown';
}

const t = strings.authErrors;

const MESSAGE_BY_KIND: Record<AuthErrorKind, string> = {
  invalidCredentials: t.invalidCredentials,
  invalidEmail: t.invalidEmail,
  emailTaken: t.emailTaken,
  weakPassword: t.weakPassword,
  rateLimited: t.rateLimited,
  banned: t.banned,
  network: strings.common.networkError,
  unknown: strings.common.unknownError,
};

export function authErrorMessage(error: unknown): string {
  return MESSAGE_BY_KIND[authErrorKind(error)];
}
