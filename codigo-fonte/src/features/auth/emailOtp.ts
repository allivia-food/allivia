export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 60;
const sentAt = new Map<string, number>();

export const isEmailOtp = (value: string) => /^\d{6}$/.test(value);
export const normalizeEmailOtp = (value: string) => value.replace(/\D/g, '').slice(0, OTP_LENGTH);
export const otpKey = (purpose: string, email: string) =>
  `${purpose}:${email.trim().toLowerCase()}`;
export function markOtpSent(key: string, now = Date.now()) {
  sentAt.set(key, now);
}
export function otpCooldownLeft(key: string, now = Date.now()) {
  const at = sentAt.get(key);
  return at === undefined
    ? 0
    : Math.max(0, Math.ceil((at + OTP_RESEND_SECONDS * 1000 - now) / 1000));
}
export function clearOtpCooldowns() {
  sentAt.clear();
}

export class EmailOtpError extends Error {
  constructor(
    public code:
      | 'invalid_code'
      | 'proof_expired'
      | 'account_changed'
      | 'current_password_invalid'
      | 'password_check_connection'
      | 'account_check_connection'
      | 'email_send_connection'
      | 'email_send_timeout',
  ) {
    super(code);
  }
}

export function emailOtpErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  if (code === 'password_check_connection')
    return 'Não foi possível conectar para validar sua senha atual. Tente novamente.';
  if (code === 'account_check_connection')
    return 'Não foi possível conectar para confirmar sua conta antes de enviar o código. Tente novamente.';
  if (code === 'email_send_connection')
    return 'A conexão falhou ao solicitar o código por e-mail. Aguarde um minuto antes de tentar novamente.';
  if (code === 'email_send_timeout')
    return 'O envio do código demorou mais que o esperado. Confira seu e-mail e aguarde um minuto antes de tentar novamente.';
  if (
    [
      'otp_expired',
      'otp_disabled',
      'invalid_credentials',
      'reauthentication_not_valid',
      'invalid_code',
    ].includes(String(code))
  )
    return 'Código inválido ou expirado. Confira os 6 dígitos ou solicite um novo código.';
  if (code === 'proof_expired')
    return 'A verificação expirou. Solicite um novo código para continuar.';
  if (code === 'account_changed')
    return 'A conta mudou durante a verificação. Entre novamente e tente de novo.';
  if (code === 'same_password') return 'Escolha uma senha diferente da senha atual.';
  if (code === 'current_password_invalid')
    return 'Senha atual incorreta. Feche a verificação e confira sua senha atual.';
  if (code === 'reauthentication_needed')
    return 'Sua sessão precisa ser confirmada novamente. Feche a verificação e tente salvar de novo.';
  if (code === 'email_not_confirmed') return 'Confirme seu e-mail antes de continuar.';
  if (code === 'email_address_not_authorized')
    return 'O envio de e-mails ainda não está configurado. Entre em contato com o suporte.';
  return '';
}
