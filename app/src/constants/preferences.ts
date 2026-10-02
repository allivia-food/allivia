export type PreferenceId = 'lactose_free' | 'gluten_free' | 'vegetarian' | 'vegan';

export const PREFERENCES: readonly { id: PreferenceId; label: string }[] = [
  { id: 'lactose_free', label: 'Sem lactose' },
  { id: 'gluten_free', label: 'Sem glúten' },
  { id: 'vegetarian', label: 'Vegetariano' },
  { id: 'vegan', label: 'Vegano' },
];

export const NO_PREFERENCE_LABEL = 'Nenhuma';
