import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryFilter } from '@/components/restaurants/CategoryFilter';
import { LocationSheet, messageFor } from '@/components/restaurants/LocationSheet';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { RestaurantDetail } from '@/components/restaurants/RestaurantDetail';
import { RestaurantMap } from '@/components/restaurants/RestaurantMap';
import { SearchPill } from '@/components/restaurants/SearchPill';
import { Banner, BottomSheet, Icon, StateView, Toast } from '@/components/ui';
import { strings } from '@/constants/strings';
import { authErrorKind } from '@/features/auth/authErrors';
import { getDeviceLocation } from '@/features/restaurants/location';
import {
  filterRestaurants,
  SEARCH_DEBOUNCE_MS,
  type CuisineFilter,
  type RankedRestaurant,
} from '@/features/restaurants/rules';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRankedRestaurants } from '@/hooks/useRestaurants';
import { useLocationStore } from '@/store/location';
import { useProfileStore } from '@/store/profile';
import { colors, layout, opacity, spacing, typography } from '@/theme';

const t = strings.restaurants;
const r = layout.restaurants;

export default function RestaurantsScreen() {
  const insets = useSafeAreaInsets();
  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const profile = useProfileStore((s) => s.profile);
  const { query, ranked } = useRankedRestaurants(location);

  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [cuisine, setCuisine] = useState<CuisineFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RankedRestaurant | null>(null);
  const [sheet, setSheet] = useState<{ message: string | null } | null>(null);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const list = useRef<FlatList<RankedRestaurant>>(null);
  const asked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (location || asked.current) return;
      asked.current = true;
      void (async () => {
        setLocating(true);
        try {
          setLocation(await getDeviceLocation(t.location.currentFallback));
        } catch (error) {
          setSheet({ message: messageFor(error) });
        } finally {
          setLocating(false);
        }
      })();
    }, [location, setLocation]),
  );

  const items = useMemo(
    () => filterRestaurants(ranked.items, debounced, cuisine, t.categories),
    [ranked.items, debounced, cuisine],
  );
  const hasAllergies = (profile?.allergies.length ?? 0) > 0;

  function selectFromMap(id: string) {
    setSelectedId(id);
    const index = items.findIndex((i) => i.restaurant.id === id);
    if (index >= 0) list.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
  }

  function openDetail(item: RankedRestaurant) {
    setSelectedId(item.restaurant.id);
    setDetail(item);
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={typography.screenTitle} accessibilityRole="header">
          {t.title}
        </Text>
        <Pressable
          onPress={() => setSheet({ message: null })}
          accessibilityRole="button"
          accessibilityLabel={`${location?.label ?? t.chooseAddress}. ${t.changeAddress}`}
          style={({ pressed }) => [styles.address, pressed && styles.pressed]}
          testID="address-row"
        >
          <Text style={typography.sectionTitle} numberOfLines={1}>
            {location?.label ?? t.chooseAddress}
          </Text>
          <Icon name="chevronDown" size={r.chevronSize} color={colors.textPrimary} />
        </Pressable>
        <SearchPill
          placeholder={t.searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          testID="restaurants-search"
        />
        <CategoryFilter value={cuisine} onChange={setCuisine} />
      </View>

      <View style={styles.body}>
        {!location ? (
          locating ? (
            <StateView variant="loading" message={t.location.locating} />
          ) : (
            <StateView
              variant="empty"
              message={t.needLocation}
              actionLabel={t.chooseAddress}
              onAction={() => setSheet({ message: null })}
            />
          )
        ) : (
          <>
            <RestaurantMap
              origin={location}
              items={items}
              selectedId={selectedId}
              onSelect={selectFromMap}
            />
            <BottomSheet minHeight={r.sheetMin} maxHeight={r.sheetMax}>
              <Text style={[typography.sectionTitle, styles.sheetTitle]}>{t.nearYou}</Text>
              {query.isPending ? (
                <StateView variant="loading" />
              ) : query.isError ? (
                <StateView
                  variant={authErrorKind(query.error) === 'network' ? 'offline' : 'error'}
                  onRetry={() => void query.refetch()}
                />
              ) : ranked.items.length === 0 ? (
                <StateView variant="empty" message={t.empty} />
              ) : (
                <FlatList
                  ref={list}
                  data={items}
                  keyExtractor={(i) => i.restaurant.id}
                  contentContainerStyle={styles.list}
                  ListHeaderComponent={
                    ranked.approximate ? (
                      <Banner
                        variant="warning"
                        title={t.approximate}
                        testID="restaurants-approximate"
                      />
                    ) : null
                  }
                  ListEmptyComponent={<StateView variant="empty" message={t.noResults} />}
                  onScrollToIndexFailed={({ index, averageItemLength }) =>
                    list.current?.scrollToOffset({ offset: index * averageItemLength })
                  }
                  renderItem={({ item }) => (
                    <RestaurantCard
                      item={item}
                      hasAllergies={hasAllergies}
                      selected={item.restaurant.id === selectedId}
                      onPress={() => openDetail(item)}
                      onSaveError={setToast}
                    />
                  )}
                  testID="restaurants-list"
                />
              )}
            </BottomSheet>
          </>
        )}
      </View>

      {sheet ? (
        <LocationSheet
          initialMessage={sheet.message}
          deviceLabel={location?.source === 'device' ? location.detail : null}
          onClose={() => setSheet(null)}
          onChoose={(chosen) => {
            setLocation(chosen);
            setSelectedId(null);
            setSheet(null);
          }}
        />
      ) : null}
      {detail ? (
        <RestaurantDetail
          item={detail}
          customAllergies={profile?.customAllergies ?? []}
          onClose={() => setDetail(null)}
          onSaveError={setToast}
        />
      ) : null}
      <Toast visible={toast !== null} message={toast ?? ''} onHide={() => setToast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  address: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start' },
  pressed: { opacity: opacity.pressed },
  body: { flex: 1 },
  sheetTitle: { paddingHorizontal: spacing.screenHorizontal, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.screenHorizontal, paddingBottom: spacing.xl, gap: spacing.md },
});
