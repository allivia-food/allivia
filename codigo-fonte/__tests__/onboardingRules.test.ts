import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import {
  preferencesToSave,
  restrictionsSummary,
  selectedAllergyCount,
  toggleAllergy,
  togglePreference,
  validateCustomAllergy,
} from '@/features/onboarding/selection';
import { profileErrorMessage } from '@/features/profile/profileErrors';
import { normalizeDisplayName, normalizeForCompare, validateDisplayName } from '@/utils/validators';

describe('display name (Passo 01)', () => {
  it.each(['Ana', 'Jo', "D'Ávila", 'Maria-Clara', 'José  da   Silva', 'Ângela'])(
    'accepts %p',
    (v) => expect(validateDisplayName(v)).toBeNull(),
  );

  it('reports each problem', () => {
    expect(validateDisplayName('   ')).toBe('required');
    expect(validateDisplayName('A')).toBe('tooShort');
    expect(validateDisplayName('A'.repeat(31))).toBe('tooLong');
    expect(validateDisplayName('Ana2')).toBe('invalidChars');
    expect(validateDisplayName('Ana!')).toBe('invalidChars');
  });

  it('trims and collapses spaces', () => {
    expect(normalizeDisplayName('  José   da  Silva ')).toBe('José da Silva');
  });
});

describe('custom allergy (Passo 02)', () => {
  it('ignores accents and case when comparing', () => {
    expect(normalizeForCompare('  GLÚTEN ')).toBe('gluten');
  });

  it('rejects duplicates of the catalog and of existing custom allergies', () => {
    expect(validateCustomAllergy('gluten', [])).toBe('duplicate');
    expect(validateCustomAllergy('LEITE', [])).toBe('duplicate');
    expect(validateCustomAllergy('mostarda', ['Mostarda'])).toBe('duplicate');
    expect(validateCustomAllergy('Mostarda', ['Gergelim'])).toBeNull();
  });

  it('checks length and the limit of 5', () => {
    expect(validateCustomAllergy('a', [])).toBe('tooShort');
    expect(validateCustomAllergy('x'.repeat(41), [])).toBe('tooLong');
    expect(validateCustomAllergy('Kiwi', ['a1', 'a2', 'a3', 'a4', 'a5'])).toBe('limit');
  });

  it('counts catalog and custom allergies', () => {
    expect(selectedAllergyCount([], [])).toBe(0);
    expect(selectedAllergyCount(['milk', 'egg'], ['Kiwi'])).toBe(3);
  });

  it('keeps the catalog order when toggling', () => {
    expect(toggleAllergy(['egg'], 'milk')).toEqual(['milk', 'egg']);
    expect(toggleAllergy(['milk', 'egg'], 'milk')).toEqual(['egg']);
  });
});

describe('preferences (Passo 03)', () => {
  it('"Nenhuma" is exclusive both ways', () => {
    expect(togglePreference(['lactose_free', 'vegan'], 'none')).toEqual(['none']);
    expect(togglePreference(['none'], 'gluten_free')).toEqual(['gluten_free']);
  });

  it('Vegano unchecks Vegetariano and vice versa', () => {
    expect(togglePreference(['vegetarian', 'lactose_free'], 'vegan')).toEqual([
      'lactose_free',
      'vegan',
    ]);
    expect(togglePreference(['vegan'], 'vegetarian')).toEqual(['vegetarian']);
  });

  it('toggles off a selected option', () => {
    expect(togglePreference(['gluten_free'], 'gluten_free')).toEqual([]);
  });

  it('saves "Nenhuma" and an empty selection as no preferences', () => {
    expect(preferencesToSave(['none'])).toEqual([]);
    expect(preferencesToSave([])).toEqual([]);
    expect(preferencesToSave(['vegan', 'gluten_free'])).toEqual(['vegan', 'gluten_free']);
  });
});

describe('restrictions summary (Perfil)', () => {
  it('shows up to 3 in catalog order', () => {
    const { items, more } = restrictionsSummary(['gluten', 'milk'], ['Kiwi']);
    expect(items.map((i) => i.label)).toEqual(['Leite', 'Glúten', 'Kiwi']);
    expect(more).toBe(0);
  });

  it('turns the third into "+N" when there are more', () => {
    const { items, more } = restrictionsSummary(['milk', 'egg', 'peanut', 'soy'], ['Kiwi']);
    expect(items.map((i) => i.label)).toEqual(['Leite', 'Ovo']);
    expect(more).toBe(3);
  });

  it('is empty without allergies', () => {
    expect(restrictionsSummary([], [])).toEqual({ items: [], more: 0 });
  });
});

describe('profileErrorMessage (section 5)', () => {
  const api = (code: string) => new AuthApiError('technical', 400, code);

  it.each([
    ['invalid_credentials', 'Senha atual incorreta.'],
    ['reauthentication_needed', 'Por segurança, confirme sua senha para continuar.'],
    ['email_exists', 'Este e-mail já está em uso.'],
    ['weak_password', 'Escolha uma senha mais forte (mínimo 8 caracteres, com letra e número).'],
  ])('maps %s', (code, message) => {
    expect(profileErrorMessage(api(code), 'account')).toBe(message);
  });

  it('uses the context message for other failures', () => {
    expect(profileErrorMessage(new Error('db'), 'save')).toBe(
      'Não foi possível salvar. Tente novamente.',
    );
    expect(profileErrorMessage(new Error('db'), 'delete')).toBe(
      'Não foi possível excluir sua conta agora. Tente novamente.',
    );
    expect(profileErrorMessage(new Error('x'), 'account')).toBe(
      'Algo deu errado. Tente novamente em instantes.',
    );
  });

  it('maps network failures to the connection message', () => {
    expect(profileErrorMessage(new AuthRetryableFetchError('fetch', 0), 'save')).toBe(
      'Não foi possível conectar. Verifique sua internet e tente novamente.',
    );
  });
});
