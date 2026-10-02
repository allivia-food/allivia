import { IconButton } from '@/components/ui';
import { strings } from '@/constants/strings';
import type { Restaurant } from '@/features/restaurants/rules';
import { useSavedRestaurantIds, useToggleSaveRestaurant } from '@/hooks/useRestaurants';
import { sizes } from '@/theme';

export interface SaveRestaurantButtonProps {
  restaurant: Restaurant;
  onError?: (message: string) => void;
  onRemoved?: (restaurant: Restaurant) => void;
}

export function SaveRestaurantButton({
  restaurant,
  onError,
  onRemoved,
}: SaveRestaurantButtonProps) {
  const saved = useSavedRestaurantIds().has(restaurant.id);
  const toggle = useToggleSaveRestaurant();
  return (
    <IconButton
      icon={saved ? 'bookmarkSaved' : 'bookmark'}
      iconSize={sizes.icon}
      accessibilityLabel={saved ? strings.restaurants.unsave : strings.restaurants.save}
      testID={`save-restaurant-${restaurant.id}`}
      onPress={() => {
        if (saved) onRemoved?.(restaurant);
        toggle.mutate(
          { restaurant, save: !saved },
          { onError: () => onError?.(strings.restaurants.saveError) },
        );
      }}
    />
  );
}
