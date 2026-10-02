import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthWeakPasswordError,
} from '@supabase/supabase-js';

import { authErrorKind, authErrorMessage } from '@/features/auth/authErrors';
import { fieldErrorMessage } from '@/features/auth/fieldErrors';
import { TimeoutError } from '@/utils/withTimeout';

const api = (code: string, status = 400) => new AuthApiError('technical message', status, code);

describe('authErrorMessage', () => {
  it.each([
    ['invalid_credentials', 'E-mail ou senha incorretos.'],
    ['email_address_invalid', 'Informe um e-mail válido.'],
    ['user_already_exists', 'Já existe uma conta com este e-mail.'],
    ['email_exists', 'Já existe uma conta com este e-mail.'],
    ['weak_password', 'Escolha uma senha mais forte (mínimo 8 caracteres, com letra e número).'],
    ['over_request_rate_limit', 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'],
    ['over_email_send_rate_limit', 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'],
    ['user_banned', 'Esta conta foi desativada. Fale com o suporte.'],
  ])('maps %s', (code, message) => {
    expect(authErrorMessage(api(code))).toBe(message);
  });

  it('maps the weak password error class', () => {
    expect(authErrorKind(new AuthWeakPasswordError('weak', 422, ['length']))).toBe('weakPassword');
  });

  it('maps network failures and timeouts to the connection message', () => {
    const msg = 'Não foi possível conectar. Verifique sua internet e tente novamente.';
    expect(authErrorMessage(new AuthRetryableFetchError('Failed to fetch', 0))).toBe(msg);
    expect(authErrorMessage(new TimeoutError())).toBe(msg);
    expect(authErrorMessage(new TypeError('Network request failed'))).toBe(msg);
  });

  it('maps anything else to the generic message, never the technical text', () => {
    const generic = 'Algo deu errado. Tente novamente em instantes.';
    expect(authErrorMessage(api('unexpected_failure', 500))).toBe(generic);
    expect(authErrorMessage(new Error('boom'))).toBe(generic);
    expect(authErrorMessage('string error')).toBe(generic);
    expect(authErrorMessage(api('invalid_credentials'))).not.toContain('technical');
  });

  it('flags a duplicated e-mail so the screen can offer the login shortcut', () => {
    expect(authErrorKind(api('user_already_exists'))).toBe('emailTaken');
  });
});

describe('fieldErrorMessage', () => {
  it('returns the message of each field error', () => {
    expect(fieldErrorMessage('email', 'required')).toBe('Informe seu e-mail.');
    expect(fieldErrorMessage('email', 'invalidEmail')).toBe('Informe um e-mail válido.');
    expect(fieldErrorMessage('password', 'required')).toBe('Informe sua senha.');
    expect(fieldErrorMessage('newPassword', 'weakPassword')).toBe(
      'A senha precisa ter 8 ou mais caracteres, com letra e número.',
    );
    expect(fieldErrorMessage('confirmation', 'mismatch')).toBe('As senhas não são iguais.');
    expect(fieldErrorMessage('confirmation', 'required')).toBe('Confirme sua senha.');
    expect(fieldErrorMessage('email', null)).toBeUndefined();
  });
});
