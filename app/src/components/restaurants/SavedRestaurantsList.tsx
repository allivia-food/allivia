import { useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { StateView, Toast } from '@/components/ui';
import { strings } from '@/constants/strings';
import { authErrorKind } from '@/features/auth/authErrors';
import {
  coverageOf,
  distanceMeters,
  type RankedRestaurant,
  type Restaurant,
} from '@/features/restaurants/rules';
import { useSavedRestaurants, useToggleSaveRestaurant } from '@/hooks/useRestaurants';
import { useLocationStore } from '@/store/location';
import { useProfileStore } from '@/store/profile';
import { spacing } from '@/theme';

import { RestaurantCard } from './RestaurantCard';
import { RestaurantDetail } from './RestaurantDetail';

const t = strings.saved;
const UNDO_MS = 5000;

export function SavedRestaurantsList() {
  const query = useSavedRestaurants();
  const toggle = useToggleSaveRestaurant();
  const location = useLocationStore((s) => s.location);
  const profile = useProfileStore((s) => s.profile);
  const [removed, setRemoved] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<RankedRestaurant | null>(null);

  const items = useMemo<RankedRestaurant[]>(
    () =>
      (query.data ?? []).map(({ restaurant }) => ({
        restaurant,
        distance: location ? distanceMeters(location, restaurant) : null,
        ...coverageOf(restaurant, profile?.allergies ?? []),
      })),
    [query.data, location, profile?.allergies],
  );

  let content: React.ReactNode;
  if (query.isPending) {
    content = <StateView variant="loading" />;
  } else if (query.isError && !query.data) {
    content = (
      <StateView
        variant={authErrorKind(query.error) === 'network' ? 'offline' : 'error'}
        onRetry={() => void query.refetch()}
      />
    );
  } else if (items.length === 0) {
    content = <StateView variant="empty" message={t.emptyRestaurants} />;
  } else {
    content = (
      <FlatList
        data={items}
        keyExtractor={(i) => i.restaurant.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RestaurantCard
            item={item}
            hasAllergies={(profile?.allergies.length ?? 0) > 0}
            onPress={() => setDetail(item)}
            onSaveError={setError}
            onRemoved={setRemoved}
          />
        )}
        testID="saved-restaurants-list"
      />
    );
  }

  return (
    <>
      {content}
      {detail ? (
        <RestaurantDetail
          item={detail}
          customAllergies={profile?.customAllergies ?? []}
          onClose={() => setDetail(null)}
          onSaveError={setError}
        />
      ) : null}
      <Toast
        visible={removed !== null}
        message={t.restaurantRemoved}
        actionLabel={t.undo}
        duration={UNDO_MS}
        onAction={() => {
          if (removed) toggle.mutate({ restaurant: removed, save: true });
          setRemoved(null);
        }}
        onHide={() => setRemoved(null)}
      />
      <Toast visible={error !== null} message={error ?? ''} onHide={() => setError(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
});
