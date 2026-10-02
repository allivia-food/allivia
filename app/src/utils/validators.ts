const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export interface PasswordRules {
  minLength: boolean;
  letterAndNumber: boolean;
}

export function checkPasswordRules(password: string): PasswordRules {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    letterAndNumber: /\p{L}/u.test(password) && /\d/.test(password),
  };
}

export function isValidPassword(password: string): boolean {
  const rules = checkPasswordRules(password);
  return rules.minLength && rules.letterAndNumber;
}

export function passwordsMatch(password: string, confirmation: string): boolean {
  return confirmation.length > 0 && password === confirmation;
}

export type FieldError = 'required' | 'invalidEmail' | 'weakPassword' | 'mismatch';

export function validateEmailField(value: string): FieldError | null {
  if (normalizeEmail(value) === '') return 'required';
  return isValidEmail(value) ? null : 'invalidEmail';
}

export function validateLoginPassword(value: string): FieldError | null {
  return value.length > 0 ? null : 'required';
}

export function validateNewPassword(value: string): FieldError | null {
  if (value.length === 0) return 'required';
  return isValidPassword(value) ? null : 'weakPassword';
}

export function validateConfirmation(password: string, confirmation: string): FieldError | null {
  if (confirmation.length === 0) return 'required';
  return passwordsMatch(password, confirmation) ? null : 'mismatch';
}

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 30;
export const CUSTOM_ALLERGY_MIN = 2;
export const CUSTOM_ALLERGY_MAX = 40;

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export type DisplayNameError = 'required' | 'tooShort' | 'tooLong' | 'invalidChars';

export function validateDisplayName(value: string): DisplayNameError | null {
  const name = normalizeDisplayName(value);
  if (name === '') return 'required';
  if (name.length < DISPLAY_NAME_MIN) return 'tooShort';
  if (name.length > DISPLAY_NAME_MAX) return 'tooLong';
  return /^[\p{L}\p{M}' -]+$/u.test(name) ? null : 'invalidChars';
}

export function normalizeForCompare(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();
}
