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
  | 'emailDelivery'
  | 'server'
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
  if (isAuthError(error)) {
    if (
      /error sending (?:confirmation|recovery|magic link|email|reset password|reauthentication)/i.test(
        error.message,
      )
    )
      return 'emailDelivery';
    if (error.status && error.status >= 500) return 'server';
  }
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
  emailDelivery:
    'Não foi possível enviar o e-mail de verificação. Tente novamente mais tarde ou entre em contato com o suporte.',
  server: 'O serviço de autenticação está indisponível no momento. Tente novamente em instantes.',
  unknown: strings.common.unknownError,
};

export function authErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'email_not_confirmed')
    return 'Confirme seu e-mail para entrar na conta.';
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'email_address_not_authorized'
  )
    return 'O envio de e-mails ainda não está configurado. Entre em contato com o suporte.';
  return MESSAGE_BY_KIND[authErrorKind(error)];
}
