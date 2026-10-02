import { create } from 'zustand';

import type { RecipeFilters } from '@/features/recipes/filters';

interface RecipeFiltersStore {
  filters: RecipeFilters | null;
  setFilters: (filters: RecipeFilters | null) => void;
}

export const useRecipeFiltersStore = create<RecipeFiltersStore>((set) => ({
  filters: null,
  setFilters: (filters) => set({ filters }),
}));
