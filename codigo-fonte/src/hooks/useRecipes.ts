import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  defaultFilters,
  PAGE_SIZE,
  profileKey,
  type RecipeFilters,
} from '@/features/recipes/filters';
import {
  getRecipe,
  getSavedRecipes,
  saveRecipe,
  searchRecipes,
  unsaveRecipe,
  type Recipe,
  type SavedRecipe,
} from '@/services/recipes';
import { useProfileStore } from '@/store/profile';
import { useRecipeFiltersStore } from '@/store/recipeFilters';
import { isRecipeCompatible } from '@/utils/recipeSafety';

// Keep the legacy recipe hidden while the removal migration reaches the database.
const isInCatalog = (recipe: Recipe) =>
  recipe.title.trim().toLocaleLowerCase('pt-BR') !== 'frango com legumes';

export const recipeKeys = {
  all: ['recipes'] as const,
  search: (profile: string, filters: RecipeFilters) => ['recipes', profile, filters] as const,
  home: (profile: string) => ['recipes', profile, 'home'] as const,
  detail: (id: string, profile: string) => ['recipe', id, profile] as const,
  saved: (userId: string, profile: string) => ['saved-recipes', userId, profile] as const,
};

export function useRecipeFilters(): [RecipeFilters, (f: RecipeFilters | null) => void] {
  const profile = useProfileStore((s) => s.profile);
  const stored = useRecipeFiltersStore((s) => s.filters);
  const setFilters = useRecipeFiltersStore((s) => s.setFilters);
  return [stored ?? defaultFilters(profile?.preferences ?? []), setFilters];
}

export function useRecipes(filters: RecipeFilters) {
  const profile = useProfileStore((s) => s.profile);
  const key = profile ? `${profile.id}|${profileKey(profile)}` : 'none';
  return useInfiniteQuery({
    queryKey: recipeKeys.search(key, filters),
    queryFn: ({ pageParam }) => searchRecipes(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.length === PAGE_SIZE ? pages.length : undefined),
    enabled: !!profile,
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) =>
        page.filter((recipe) => isInCatalog(recipe) && isRecipeCompatible(recipe, profile)),
      ),
    }),
  });
}

export function useHomeRecipe() {
  const profile = useProfileStore((s) => s.profile);
  const key = profile ? `${profile.id}|${profileKey(profile)}` : 'none';
  return useQuery({
    queryKey: recipeKeys.home(key),
    queryFn: async () =>
      (await searchRecipes(defaultFilters(profile?.preferences ?? []), 0)).find(isInCatalog) ??
      null,
    enabled: !!profile,
    select: (recipe) =>
      recipe && isInCatalog(recipe) && isRecipeCompatible(recipe, profile) ? recipe : null,
  });
}

export function useRecipe(id: string) {
  const profile = useProfileStore((s) => s.profile);
  const key = profile ? `${profile.id}|${profileKey(profile)}` : 'none';
  return useQuery({
    queryKey: recipeKeys.detail(id, key),
    queryFn: () => getRecipe(id),
    enabled: !!profile && !!id,
    select: (recipe) =>
      recipe && isInCatalog(recipe) && isRecipeCompatible(recipe, profile) ? recipe : null,
  });
}

export function useSavedRecipes() {
  const profile = useProfileStore((s) => s.profile);
  const userId = profile?.id;
  return useQuery({
    queryKey: recipeKeys.saved(userId ?? 'none', profile ? profileKey(profile) : 'none'),
    queryFn: getSavedRecipes,
    enabled: !!userId,
    select: (saved) =>
      saved.filter(({ recipe }) => isInCatalog(recipe) && isRecipeCompatible(recipe, profile)),
  });
}

export function useSavedIds(): Set<string> {
  const { data } = useSavedRecipes();
  return new Set((data ?? []).map((s) => s.recipe.id));
}

export function useToggleSaveRecipe() {
  const queryClient = useQueryClient();
  const profile = useProfileStore((s) => s.profile);
  const userId = profile?.id;
  const key = recipeKeys.saved(userId ?? 'none', profile ? profileKey(profile) : 'none');

  return useMutation({
    mutationFn: ({ recipe, save }: { recipe: Recipe; save: boolean }) => {
      if (!userId) throw new Error('Not signed in');
      if (save && !isRecipeCompatible(recipe, profile)) throw new Error('Incompatible recipe');
      return save ? saveRecipe(userId, recipe.id) : unsaveRecipe(userId, recipe.id);
    },
    onMutate: async ({ recipe, save }) => {
      if (save && !isRecipeCompatible(recipe, profile)) throw new Error('Incompatible recipe');
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SavedRecipe[]>(key);
      queryClient.setQueryData<SavedRecipe[]>(key, (list = []) =>
        save
          ? [
              { recipe, savedAt: new Date().toISOString() },
              ...list.filter((s) => s.recipe.id !== recipe.id),
            ]
          : list.filter((s) => s.recipe.id !== recipe.id),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
