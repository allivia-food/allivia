import { ALLERGENS, type AllergenId } from '@/constants/allergens';
import type { PreferenceId } from '@/constants/preferences';
import {
  CUSTOM_ALLERGY_MAX,
  CUSTOM_ALLERGY_MIN,
  normalizeDisplayName,
  normalizeForCompare,
} from '@/utils/validators';

export const MAX_CUSTOM_ALLERGIES = 5;

export type CustomAllergyError = 'tooShort' | 'tooLong' | 'duplicate' | 'limit';

export function validateCustomAllergy(
  value: string,
  existingCustom: readonly string[],
): CustomAllergyError | null {
  const name = normalizeDisplayName(value);
  if (existingCustom.length >= MAX_CUSTOM_ALLERGIES) return 'limit';
  if (name.length < CUSTOM_ALLERGY_MIN) return 'tooShort';
  if (name.length > CUSTOM_ALLERGY_MAX) return 'tooLong';
  const key = normalizeForCompare(name);
  const taken = [...ALLERGENS.map((a) => a.label), ...existingCustom].map(normalizeForCompare);
  return taken.includes(key) ? 'duplicate' : null;
}

export function selectedAllergyCount(allergies: readonly AllergenId[], custom: readonly string[]) {
  return allergies.length + custom.length;
}

export function toggleAllergy(selected: readonly AllergenId[], id: AllergenId): AllergenId[] {
  const next = selected.includes(id) ? selected.filter((a) => a !== id) : [...selected, id];
  return ALLERGENS.map((a) => a.id).filter((a) => next.includes(a));
}

export type PreferenceOption = PreferenceId | 'none';

export function togglePreference(
  selected: readonly PreferenceOption[],
  option: PreferenceOption,
): PreferenceOption[] {
  if (selected.includes(option)) return selected.filter((o) => o !== option);
  if (option === 'none') return ['none'];
  let next = selected.filter((o) => o !== 'none');
  if (option === 'vegan') next = next.filter((o) => o !== 'vegetarian');
  if (option === 'vegetarian') next = next.filter((o) => o !== 'vegan');
  return [...next, option];
}

export function preferencesToSave(selected: readonly PreferenceOption[]): PreferenceId[] {
  return selected.filter((o): o is PreferenceId => o !== 'none');
}

export function preferencesToOptions(saved: readonly PreferenceId[]): PreferenceOption[] {
  return [...saved];
}

export interface RestrictionItem {
  key: string;
  label: string;
  allergenId?: AllergenId;
}

export function restrictionsSummary(
  allergies: readonly AllergenId[],
  custom: readonly string[],
  max = 3,
): { items: RestrictionItem[]; more: number } {
  const all: RestrictionItem[] = [
    ...ALLERGENS.filter((a) => allergies.includes(a.id)).map((a) => ({
      key: a.id,
      label: a.label,
      allergenId: a.id,
    })),
    ...custom.map((c) => ({ key: `custom:${c}`, label: c })),
  ];
  if (all.length <= max) return { items: all, more: 0 };
  return { items: all.slice(0, max - 1), more: all.length - (max - 1) };
}
