import { ALLERGENS, type AllergenId } from '@/constants/allergens';

import { normalizeForCompare } from './validators';

export type SafetyLevel = 'danger' | 'warning' | 'safe';

export interface SafetyInput {
  allergens: readonly AllergenId[];
  ingredients: readonly string[];
  allergensReviewed: boolean;
}

export interface SafetyProfile {
  allergies: readonly AllergenId[];
  customAllergies: readonly string[];
}

export interface SafetyResult {
  level: SafetyLevel;
  contains: AllergenId[];
  synonymHits: AllergenId[];
  customHits: string[];
  unverified: string[];
  labels: string[];
}

const labelOf = (id: AllergenId) => ALLERGENS.find((a) => a.id === id)?.label ?? id;

export function computeSafety(recipe: SafetyInput, profile: SafetyProfile): SafetyResult {
  const ingredients = recipe.ingredients.map(normalizeForCompare);
  const mentions = (term: string) => {
    const t = normalizeForCompare(term);
    return t.length > 0 && ingredients.some((i) => i.includes(t));
  };

  const contains = profile.allergies.filter((id) => recipe.allergens.includes(id));
  const synonymHits = profile.allergies.filter((id) => {
    const allergen = ALLERGENS.find((a) => a.id === id);
    return !!allergen && [allergen.label, ...allergen.synonyms].some(mentions);
  });
  const customHits = profile.customAllergies.filter(mentions);

  const unverified = [
    ...(recipe.allergensReviewed ? [] : profile.allergies.map(labelOf)),
    ...profile.customAllergies,
  ];

  const dangerLabels = unique([
    ...contains.map(labelOf),
    ...synonymHits.map(labelOf),
    ...customHits,
  ]);

  let level: SafetyLevel = 'safe';
  if (dangerLabels.length > 0) level = 'danger';
  else if (unverified.length > 0) level = 'warning';

  return {
    level,
    contains,
    synonymHits,
    customHits,
    unverified,
    labels: level === 'danger' ? dangerLabels : level === 'warning' ? unverified : [],
  };
}

function unique(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) === i);
}
