import { logout } from '@/services/auth';
import { queryClient } from '@/services/queryClient';
import { useLocationStore } from '@/store/location';
import { useProfileStore } from '@/store/profile';
import { useRecipeFiltersStore } from '@/store/recipeFilters';

export async function signOutAndClear(localOnly = false): Promise<void> {
  try {
    await logout(localOnly);
  } finally {
    useProfileStore.getState().setProfile(null);
    useRecipeFiltersStore.getState().setFilters(null);
    useLocationStore.getState().setLocation(null);
    queryClient.clear();
  }
}
