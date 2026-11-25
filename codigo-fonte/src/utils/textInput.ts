export const SEARCH_MAX_LENGTH = 200;

export type TextInputKind = 'text' | 'name' | 'email' | 'digits' | 'food' | 'password';

// Apply before updating state, including pasted text and hardware keyboards.
export function sanitizeTextInput(value: string, kind: TextInputKind, maxLength: number): string {
  if (kind === 'password') return value.slice(0, maxLength);
  let text = value.normalize('NFC');
  if (kind === 'digits') text = text.replace(/[^0-9]/g, '');
  else if (kind === 'name') text = text.replace(/\s/g, ' ').replace(/[^\p{L}\p{M} '\u2019-]/gu, '');
  else if (kind === 'email') text = text.replace(/[\s\p{Cc}\p{Cf}]/gu, '');
  else {
    text = text.replace(/\s/g, ' ').replace(/[\p{Cc}\p{Cf}]/gu, '');
    if (kind === 'food') text = text.replace(/[^\p{L}\p{M}\p{N} '’()/%.,-]/gu, '');
  }
  return text.slice(0, maxLength);
}

export function isValidFoodTerm(value: string): boolean {
  return /\p{L}/u.test(value) && /^[\p{L}\p{M}\p{N} '’()/%.,-]+$/u.test(value);
}
