import { sanitizeTextInput } from '@/utils/textInput';
import { isValidPassword, validateDisplayName } from '@/utils/validators';
import { validateCustomAllergy } from '@/features/onboarding/selection';
import { validateIngredient } from '@/features/recipes/filters';

it('blocks numbers, emojis and symbols in names while preserving accented names', () => {
  expect(sanitizeTextInput('João23 D’Ávila-😊!', 'name', 30)).toBe('João D’Ávila-');
  expect(sanitizeTextInput('Jose\u0301', 'name', 30)).toBe('José');
  expect(validateDisplayName('D’Ávila')).toBeNull();
  expect(validateDisplayName('--')).toBe('invalidChars');
  expect(validateDisplayName('João23')).toBe('invalidChars');
});

it('keeps leading zeros and applies numeric limits after filtering pasted content', () => {
  expect(sanitizeTextInput('0a12 34567', 'digits', 6)).toBe('012345');
  expect(sanitizeTextInput('789 1000 10010 3', 'digits', 14)).toBe('7891000100103');
});

it('removes whitespace and invisible characters from email without losing valid punctuation', () => {
  expect(sanitizeTextInput(' Ana.2+teste@exemplo.com\n\u200b', 'email', 254)).toBe(
    'Ana.2+teste@exemplo.com',
  );
});

it('preserves passwords exactly and rejects new passwords beyond the maximum', () => {
  const password = ' Ação123! ';
  expect(sanitizeTextInput(password, 'password', 1024)).toBe(password);
  expect(isValidPassword('a1'.repeat(513))).toBe(false);
});

it('allows food descriptors but rejects meaningless terms', () => {
  expect(validateIngredient('chocolate 70%', [])).toBeNull();
  expect(validateCustomAllergy('Vitamina B12', [])).toBeNull();
  for (const value of ['123', '---', '🍕🍕', '<script>']) {
    expect(validateIngredient(value, [])).toBe('invalidChars');
    expect(validateCustomAllergy(value, [])).toBe('invalidChars');
  }
});

it('bounds searches and removes pasted line breaks and invisible controls', () => {
  expect(sanitizeTextInput('Rua 25\nSão Paulo\u200b', 'text', 200)).toBe('Rua 25 São Paulo');
  expect(sanitizeTextInput('a'.repeat(201), 'text', 200)).toHaveLength(200);
});
