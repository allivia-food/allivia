import { strings } from '@/constants/strings';
import type { FieldError } from '@/utils/validators';

const t = strings.fieldErrors;

export type AuthField = 'email' | 'password' | 'newPassword' | 'confirmation';

export function fieldErrorMessage(field: AuthField, error: FieldError | null): string | undefined {
  if (!error) return undefined;
  if (field === 'email') return error === 'required' ? t.emailRequired : t.emailInvalid;
  if (field === 'confirmation') return error === 'required' ? t.confirmRequired : t.confirmMismatch;
  if (field === 'newPassword' && error === 'weakPassword') return t.passwordWeak;
  return t.passwordRequired;
}
