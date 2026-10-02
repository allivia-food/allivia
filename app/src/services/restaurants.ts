import type { AllergenId } from '@/constants/allergens';
import type { Cuisine, Restaurant } from '@/features/restaurants/rules';
import { withTimeout } from '@/utils/withTimeout';

import { getSupabase } from './supabase';

interface RestaurantRow {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  cuisine: Cuisine;
  allergen_friendly: AllergenId[] | null;
  rating: number | string | null;
  image: string | null;
}

const COLUMNS = 'id, name, address, lat, lng, cuisine, allergen_friendly, rating, image';

export function toRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    lat: Number(row.lat),
    lng: Number(row.lng),
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
