import type { AllergenId } from '@/constants/allergens';
import type { PreferenceId } from '@/constants/preferences';
import { buildSearchParams, type MealType, type RecipeFilters } from '@/features/recipes/filters';
import { withTimeout } from '@/utils/withTimeout';

import { getSupabase } from './supabase';

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  mealTypes: MealType[];
  readyInMinutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  allergens: AllergenId[];
  diets: PreferenceId[];
  caloriesKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  tip: string | null;
  allergensReviewed: boolean;
  featured: boolean;
}

interface RecipeRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  meal_types: MealType[];
  ready_in_minutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  allergens: AllergenId[];
  diets: PreferenceId[];
  calories_kcal: number | null;
  protein_g: number | string | null;
  carbs_g: number | string | null;
  fat_g: number | string | null;
  tip: string | null;
  allergens_reviewed: boolean;
  featured: boolean;
}

const COLUMNS =
  'id, title, description, image_url, meal_types, ready_in_minutes, servings, ingredients, steps, allergens, diets, calories_kcal, protein_g, carbs_g, fat_g, tip, allergens_reviewed, featured';

const num = (v: number | string | null) => (v === null ? null : Number(v));

export function toRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    mealTypes: row.meal_types ?? [],
    readyInMinutes: row.ready_in_minutes,
    servings: row.servings,
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
    allergens: row.allergens ?? [],
    diets: row.diets ?? [],
    caloriesKcal: row.calories_kcal,
    proteinG: num(row.protein_g),
    carbsG: num(row.carbs_g),
    fatG: num(row.fat_g),
    tip: row.tip,
    allergensReviewed: row.allergens_reviewed,
    featured: row.featured,
  };
}

export async function searchRecipes(filters: RecipeFilters, page: number): Promise<Recipe[]> {
  const { data, error } = await withTimeout(
    getSupabase().rpc('search_recipes', buildSearchParams(filters, page)),
  );
  if (error) throw error;
  return ((data ?? []) as RecipeRow[]).map(toRecipe);
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const { data, error } = await withTimeout(
    getSupabase().from('recipes').select(COLUMNS).eq('id', id).maybeSingle<RecipeRow>(),
  );
  if (error) throw error;
  return data ? toRecipe(data) : null;
}

export interface SavedRecipe {
  recipe: Recipe;
  savedAt: string;
}

export async function getSavedRecipes(): Promise<SavedRecipe[]> {
  const { data, error } = await withTimeout(
    getSupabase()
      .from('saved_recipes')
      .select(`saved_at, recipe:recipes(${COLUMNS})`)
      .order('saved_at', { ascending: false })
      .returns<{ saved_at: string; recipe: RecipeRow | null }[]>(),
  );
  if (error) throw error;
  return (data ?? [])
    .filter((row) => row.recipe !== null)
    .map((row) => ({ recipe: toRecipe(row.recipe as RecipeRow), savedAt: row.saved_at }));
}

export async function saveRecipe(userId: string, recipeId: string): Promise<void> {
  const { error } = await withTimeout(
    getSupabase()
      .from('saved_recipes')
      .upsert({ user_id: userId, recipe_id: recipeId }, { ignoreDuplicates: true }),
  );
  if (error) throw error;
}

export async function unsaveRecipe(userId: string, recipeId: string): Promise<void> {
  const { error } = await withTimeout(
    getSupabase().from('saved_recipes').delete().eq('user_id', userId).eq('recipe_id', recipeId),
  );
  if (error) throw error;
}
