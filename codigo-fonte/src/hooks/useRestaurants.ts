import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { rankRestaurants, type LatLng, type Restaurant } from '@/features/restaurants/rules';
import {
  getRestaurants,
  getSavedRestaurants,
  saveRestaurant,
  unsaveRestaurant,
  type SavedRestaurant,
} from '@/services/restaurants';
import { useLocationStore } from '@/store/location';
import { useProfileStore } from '@/store/profile';

export const restaurantKeys = {
  all: ['restaurants'] as const,
  saved: (userId: string) => ['saved-restaurants', userId] as const,
};

export function useRestaurants() {
  const signedIn = useProfileStore((s) => !!s.profile);
  return useQuery({
    queryKey: restaurantKeys.all,
    queryFn: getRestaurants,
    staleTime: Infinity,
    enabled: signedIn,
  });
}

export function useRankedRestaurants(origin: LatLng | null) {
  const query = useRestaurants();
  const allergies = useProfileStore((s) => s.profile?.allergies);
  const ranked = useMemo(
    () => rankRestaurants(query.data ?? [], allergies ?? [], origin),
    [query.data, allergies, origin],
  );
  return { query, ranked };
}

export function useHomeRestaurant() {
  const location = useLocationStore((s) => s.location);
  const { ranked } = useRankedRestaurants(location);
  return location ? (ranked.items[0] ?? null) : null;
}

export function useSavedRestaurants() {
  const userId = useProfileStore((s) => s.profile?.id);
  return useQuery({
    queryKey: restaurantKeys.saved(userId ?? 'none'),
    queryFn: getSavedRestaurants,
    enabled: !!userId,
  });
}

export function useSavedRestaurantIds(): Set<string> {
  const { data } = useSavedRestaurants();
  return new Set((data ?? []).map((s) => s.restaurant.id));
}

export function useToggleSaveRestaurant() {
  const queryClient = useQueryClient();
  const userId = useProfileStore((s) => s.profile?.id);
  const key = restaurantKeys.saved(userId ?? 'none');

  return useMutation({
    mutationFn: ({ restaurant, save }: { restaurant: Restaurant; save: boolean }) => {
      if (!userId) throw new Error('Not signed in');
      return save ? saveRestaurant(userId, restaurant.id) : unsaveRestaurant(userId, restaurant.id);
    },
    onMutate: async ({ restaurant, save }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SavedRestaurant[]>(key);
      queryClient.setQueryData<SavedRestaurant[]>(key, (list = []) =>
        save
          ? [
              { restaurant, savedAt: new Date().toISOString() },
              ...list.filter((s) => s.restaurant.id !== restaurant.id),
            ]
          : list.filter((s) => s.restaurant.id !== restaurant.id),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
