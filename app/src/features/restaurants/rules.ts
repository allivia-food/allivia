import { ALLERGENS, type AllergenId } from '@/constants/allergens';

export type Cuisine = 'healthy' | 'vegetarian' | 'snacks' | 'other';
export type CuisineFilter = Cuisine | 'all';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Restaurant extends LatLng {
  id: string;
  name: string;
  address: string;
  cuisine: Cuisine;
  allergenFriendly: AllergenId[];
  rating: number | null;
  image: string | null;
}

export interface RankedRestaurant {
  restaurant: Restaurant;
  distance: number | null;
  covered: AllergenId[];
  missing: AllergenId[];
}

export interface RankResult {
  items: RankedRestaurant[];
  approximate: boolean;
}

export const DEFAULT_RADIUS_KM = 15;
export const SEARCH_DEBOUNCE_MS = 300;
const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(meters: number): string {
  const rounded = Math.round(meters / 10) * 10;
  if (rounded < 1000) return `${rounded} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function coverageOf(restaurant: Restaurant, allergies: readonly AllergenId[]) {
  const covered = allergies.filter((a) => restaurant.allergenFriendly.includes(a));
  const missing = allergies.filter((a) => !restaurant.allergenFriendly.includes(a));
  return { covered, missing };
}

export function rankRestaurants(
  restaurants: readonly Restaurant[],
  allergies: readonly AllergenId[],
  origin: LatLng | null,
  radiusKm = DEFAULT_RADIUS_KM,
): RankResult {
  const ranked: RankedRestaurant[] = restaurants
    .map((restaurant) => ({
      restaurant,
      distance: origin ? distanceMeters(origin, restaurant) : null,
      ...coverageOf(restaurant, allergies),
    }))
    .filter((r) => r.distance === null || r.distance <= radiusKm * 1000);

  const byDistance = (a: RankedRestaurant, b: RankedRestaurant) =>
    a.distance !== null && b.distance !== null
      ? a.distance - b.distance
      : a.restaurant.name.localeCompare(b.restaurant.name, 'pt-BR');

  const full = ranked.filter((r) => r.missing.length === 0);
  if (full.length > 0 || ranked.length === 0) {
    return { items: full.sort(byDistance), approximate: false };
  }
  return {
    items: ranked.sort((a, b) => b.covered.length - a.covered.length || byDistance(a, b)),
    approximate: true,
  };
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function filterRestaurants(
  items: readonly RankedRestaurant[],
  query: string,
  cuisine: CuisineFilter,
  cuisineLabels: Record<Cuisine, string>,
): RankedRestaurant[] {
  const q = normalize(query);
  return items.filter(({ restaurant }) => {
    if (cuisine !== 'all' && restaurant.cuisine !== cuisine) return false;
    if (!q) return true;
    return (
      normalize(restaurant.name).includes(q) ||
      normalize(cuisineLabels[restaurant.cuisine]).includes(q)
    );
  });
}

const allergenLabel = (id: AllergenId) =>
  (ALLERGENS.find((a) => a.id === id)?.label ?? id).toLowerCase();

export function allergenFreeText(covered: readonly AllergenId[]): string {
  if (covered.length === 0) return '';
  const parts = covered.slice(0, 2).map((id) => `sem ${allergenLabel(id)}`);
  const rest = covered.length - parts.length;
  if (rest > 0) return `Opções ${parts.join(', ')} e mais ${rest}`;
  return `Opções ${parts.join(' e ')}`;
}

export const routeUrl = ({ lat, lng }: LatLng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
