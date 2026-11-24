import type { PreferenceId } from '@/constants/preferences';
import type { AllergenId } from '@/constants/allergens';
import type { Cuisine, Restaurant } from '@/features/restaurants/rules';
import { withTimeout } from '@/utils/withTimeout';

import { getSupabase } from './supabase';

interface RestaurantRow {
  description: string | null;
  phone: string | null;
  diets: PreferenceId[] | null;
  allergen_source: string | null;
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  cuisine: Cuisine;
  allergen_friendly: AllergenId[] | null;
  rating: number | string | null;
  image: string | null;
}

const COLUMNS =
  'id, name, address, lat, lng, cuisine, allergen_friendly, rating, image, description, phone, diets, allergen_source';

export function toRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    phone: row.phone,
    diets: row.diets ?? [],
    allergenSource: row.allergen_source,
    address: row.address,
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    cuisine: row.cuisine,
    allergenFriendly: row.allergen_friendly ?? [],
    rating: row.rating === null ? null : Number(row.rating),
    image: row.image,
  };
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await withTimeout(
    getSupabase().from('restaurants').select(COLUMNS).returns<RestaurantRow[]>(),
  );
  if (error) throw error;
  return (data ?? []).map(toRestaurant);
}

export interface SavedRestaurant {
  restaurant: Restaurant;
  savedAt: string;
}

export async function getSavedRestaurants(): Promise<SavedRestaurant[]> {
  const { data, error } = await withTimeout(
    getSupabase()
      .from('saved_restaurants')
      .select(`saved_at, restaurant:restaurants(${COLUMNS})`)
      .order('saved_at', { ascending: false })
      .returns<{ saved_at: string; restaurant: RestaurantRow | null }[]>(),
  );
  if (error) throw error;
  return (data ?? [])
    .filter((row) => row.restaurant !== null)
    .map((row) => ({
      restaurant: toRestaurant(row.restaurant as RestaurantRow),
      savedAt: row.saved_at,
    }));
}

export async function saveRestaurant(userId: string, restaurantId: string): Promise<void> {
  const { error } = await withTimeout(
    getSupabase()
      .from('saved_restaurants')
      .upsert({ user_id: userId, restaurant_id: restaurantId }, { ignoreDuplicates: true }),
  );
  if (error) throw error;
}

export async function unsaveRestaurant(userId: string, restaurantId: string): Promise<void> {
  const { error } = await withTimeout(
    getSupabase()
      .from('saved_restaurants')
      .delete()
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId),
  );
  if (error) throw error;
}
