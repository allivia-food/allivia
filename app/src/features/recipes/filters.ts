import type { PreferenceId } from '@/constants/preferences';
import { normalizeForCompare } from '@/utils/validators';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
export type TimeRange = 'upTo15' | 'from15to30' | 'over30';

export const MEAL_TYPES: readonly { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Café da manhã' },
  { id: 'lunch', label: 'Almoço' },
  { id: 'dinner', label: 'Jantar' },
  { id: 'snack', label: 'Lanche' },
  { id: 'dessert', label: 'Sobremesa' },
];

export const TIME_RANGES: readonly { id: TimeRange; label: string }[] = [
  { id: 'upTo15', label: 'Até 15 min' },
  { id: 'from15to30', label: '15-30 min' },
  { id: 'over30', label: 'Mais de 30 min' },
];

export const DIET_FILTERS: readonly { id: PreferenceId; label: string }[] = [
  { id: 'vegetarian', label: 'Vegetariano' },
  { id: 'vegan', label: 'Vegano' },
  { id: 'lactose_free', label: 'Sem lactose' },
  { id: 'gluten_free', label: 'Sem glúten' },
];

export const MAX_INGREDIENT_FILTERS = 5;
export const INGREDIENT_MIN = 2;
export const INGREDIENT_MAX = 30;
export const PAGE_SIZE = 10;

export interface RecipeFilters {
  mealType: MealType | null;
  time: TimeRange | null;
  diets: PreferenceId[];
  include: string[];
  exclude: string[];
}

export function defaultFilters(profilePreferences: readonly PreferenceId[]): RecipeFilters {
  return { mealType: null, time: null, diets: [...profilePreferences], include: [], exclude: [] };
}

export interface SearchParams {
  p_meal_type: MealType | null;
  p_min_minutes: number | null;
  p_max_minutes: number | null;
  p_diets: PreferenceId[];
  p_include: string[];
  p_exclude: string[];
  p_limit: number;
  p_offset: number;
}

const TIME_PARAMS: Record<TimeRange, { min: number | null; max: number | null }> = {
  upTo15: { min: null, max: 15 },
  from15to30: { min: 15, max: 30 },
  over30: { min: 30, max: null },
};

export function buildSearchParams(filters: RecipeFilters, page: number): SearchParams {
  const time = filters.time ? TIME_PARAMS[filters.time] : { min: null, max: null };
  return {
    p_meal_type: filters.mealType,
    p_min_minutes: time.min,
    p_max_minutes: time.max,
    p_diets: [...filters.diets],
    p_include: filters.include.map(normalizeForCompare),
    p_exclude: filters.exclude.map(normalizeForCompare),
    p_limit: PAGE_SIZE,
    p_offset: page * PAGE_SIZE,
  };
}

export function isInTimeRange(minutes: number, range: TimeRange | null): boolean {
  if (!range) return true;
  const { min, max } = TIME_PARAMS[range];
  return (min === null || minutes > min) && (max === null || minutes <= max);
}

export function countActiveFilters(
  filters: RecipeFilters,
  profilePreferences: readonly PreferenceId[],
): number {
  const dietsChanged =
    filters.diets.length !== profilePreferences.length ||
    filters.diets.some((d) => !profilePreferences.includes(d));
  return (
    (filters.mealType ? 1 : 0) +
    (filters.time ? 1 : 0) +
    (dietsChanged ? 1 : 0) +
    filters.include.length +
    filters.exclude.length
  );
}

export function toggleDiet(diets: readonly PreferenceId[], id: PreferenceId): PreferenceId[] {
  if (diets.includes(id)) return diets.filter((d) => d !== id);
  let next = [...diets];
  if (id === 'vegan') next = next.filter((d) => d !== 'vegetarian');
  if (id === 'vegetarian') next = next.filter((d) => d !== 'vegan');
  return [...next, id];
}

export type IngredientError = 'tooShort' | 'tooLong' | 'duplicate' | 'limit';

export function validateIngredient(
  value: string,
  existing: readonly string[],
): IngredientError | null {
  const term = value.trim().replace(/\s+/g, ' ');
  if (existing.length >= MAX_INGREDIENT_FILTERS) return 'limit';
  if (term.length < INGREDIENT_MIN) return 'tooShort';
  if (term.length > INGREDIENT_MAX) return 'tooLong';
  const key = normalizeForCompare(term);
  return existing.some((e) => normalizeForCompare(e) === key) ? 'duplicate' : null;
}

export function profileKey(profile: {
  allergies: readonly string[];
  customAllergies: readonly string[];
  preferences: readonly string[];
}): string {
  return [
    [...profile.allergies].sort().join(','),
    [...profile.customAllergies].map(normalizeForCompare).sort().join(','),
    [...profile.preferences].sort().join(','),
  ].join('|');
}
