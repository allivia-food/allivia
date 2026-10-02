import {
  checkPasswordRules,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  passwordsMatch,
  validateConfirmation,
  validateEmailField,
  validateLoginPassword,
  validateNewPassword,
} from '@/utils/validators';

describe('e-mail', () => {
  it.each(['ana@exemplo.com', '  Ana@Exemplo.COM  ', 'a.b+c@sub.dominio.com.br'])(
    'accepts %p',
    (value) => expect(isValidEmail(value)).toBe(true),
  );

  it.each([
    '',
    'ana',
    'ana@',
    'ana@exemplo',
    '@exemplo.com',
    'ana @exemplo.com',
    'ana@ex ample.com',
  ])('rejects %p', (value) => expect(isValidEmail(value)).toBe(false));

  it('normalizes to trimmed lowercase', () => {
    expect(normalizeEmail('  Ana@Exemplo.COM ')).toBe('ana@exemplo.com');
  });

  it('distinguishes empty from invalid', () => {
    expect(validateEmailField('   ')).toBe('required');
    expect(validateEmailField('ana@')).toBe('invalidEmail');
    expect(validateEmailField('ana@exemplo.com')).toBeNull();
  });
});

describe('sign-up password', () => {
  it('requires 8+ characters with a letter and a number', () => {
    expect(isValidPassword('abc12345')).toBe(true);
    expect(isValidPassword('Senha2026')).toBe(true);
    expect(isValidPassword('ação1234')).toBe(true);
    expect(isValidPassword('abc1234')).toBe(false);
    expect(isValidPassword('abcdefgh')).toBe(false);
    expect(isValidPassword('12345678')).toBe(false);
  });

  it('reports each rule for the indicator', () => {
    expect(checkPasswordRules('')).toEqual({ minLength: false, letterAndNumber: false });
    expect(checkPasswordRules('abc1')).toEqual({ minLength: false, letterAndNumber: true });
    expect(checkPasswordRules('abcdefgh')).toEqual({ minLength: true, letterAndNumber: false });
  });

  it('distinguishes empty from weak', () => {
    expect(validateNewPassword('')).toBe('required');
    expect(validateNewPassword('fraca')).toBe('weakPassword');
    expect(validateNewPassword('forte123')).toBeNull();
  });
});

describe('login password', () => {
  it('only requires the field (no format rule)', () => {
    expect(validateLoginPassword('')).toBe('required');
    expect(validateLoginPassword('x')).toBeNull();
  });
});

describe('confirmation', () => {
  it('must match the password', () => {
    expect(passwordsMatch('abc12345', 'abc12345')).toBe(true);
    expect(passwordsMatch('abc12345', 'abc12346')).toBe(false);
    expect(passwordsMatch('', '')).toBe(false);
    expect(validateConfirmation('abc12345', '')).toBe('required');
    expect(validateConfirmation('abc12345', 'abc')).toBe('mismatch');
    expect(validateConfirmation('abc12345', 'abc12345')).toBeNull();
  });
});
