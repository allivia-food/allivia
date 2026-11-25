import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryFilter } from '@/components/restaurants/CategoryFilter';
import { LocationSheet, messageFor } from '@/components/restaurants/LocationSheet';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { RestaurantDetail } from '@/components/restaurants/RestaurantDetail';
import { RestaurantMap } from '@/components/restaurants/RestaurantMap';
import { SearchPill } from '@/components/restaurants/SearchPill';
import { Banner, BottomSheet, Chip, HeaderLogo, Icon, StateView, Toast } from '@/components/ui';
import { PREFERENCES, type PreferenceId } from '@/constants/preferences';
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
  const preferenceKey = [profile?.id, ...(profile?.preferences ?? [])].join('|');
  const [dietOverride, setDietOverride] = useState<{ key: string; values: PreferenceId[] } | null>(
    null,
  );
  const diets = useMemo(
    () =>
      dietOverride?.key === preferenceKey ? dietOverride.values : (profile?.preferences ?? []),
    [dietOverride, preferenceKey, profile?.preferences],
  );
  const [cuisine, setCuisine] = useState<CuisineFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RankedRestaurant | null>(null);
  const [pendingDetail, setPendingDetail] = useState<RankedRestaurant | null>(null);
  const [centeredId, setCenteredId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ message: string | null } | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const list = useRef<FlatList<RankedRestaurant>>(null);
  const asked = useRef(false);

  useEffect(() => {
    if (!pendingDetail || (location && centeredId !== pendingDetail.restaurant.id)) return;
    const timer = setTimeout(() => {
      setDetail(pendingDetail);
      setPendingDetail(null);
    }, 5_000);
    return () => clearTimeout(timer);
  }, [pendingDetail, centeredId, location]);

  useFocusEffect(useCallback(() => () => setPendingDetail(null), []));

  useFocusEffect(
    useCallback(() => {
      if (location || asked.current) return;
      asked.current = true;
      void (async () => {
        try {
          setLocation(await getDeviceLocation(t.location.currentFallback));
        } catch (error) {
          setSheet({ message: messageFor(error) });
        }
      })();
    }, [location, setLocation]),
  );

  const items = useMemo(
    () => filterRestaurants(ranked.items, debounced, cuisine, t.categories, diets),
    [ranked.items, debounced, cuisine, diets],
  );
  const hasAllergies = (profile?.allergies.length ?? 0) > 0;

  function selectFromMap(id: string) {
    setPendingDetail(null);
    setSelectedId(id);
    const index = items.findIndex((i) => i.restaurant.id === id);
    if (index >= 0) list.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
  }

  function openDetail(item: RankedRestaurant) {
    setSelectedId(item.restaurant.id);
    setDetail(null);
    setPendingDetail(item);
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Text style={[typography.screenTitle, { flex: 1 }]} accessibilityRole="header">
            {t.title}
          </Text>
          <HeaderLogo />
        </View>
        <Pressable
          onPress={() => setSheet({ message: null })}
          accessibilityRole="button"
          accessibilityLabel={`${location?.label ?? t.chooseAddress}. ${t.changeAddress}`}
          style={({ pressed }) => [styles.address, pressed && styles.pressed]}
          testID="address-row"
        >
          <Text style={[typography.sectionTitle, { flexShrink: 1 }]} numberOfLines={1}>
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {PREFERENCES.map((p) => (
            <Chip
              key={p.id}
              label={p.label}
              variant="filter"
              scale={Platform.OS === 'android' ? 0.805 : 1}
              active={diets.includes(p.id)}
              onPress={() =>
                setDietOverride({
                  key: preferenceKey,
                  values: diets.includes(p.id) ? diets.filter((d) => d !== p.id) : [...diets, p.id],
                })
              }
            />
          ))}
        </View>
      </View>

      <View style={styles.body}>
        {location ? (
          <RestaurantMap
            origin={location}
            items={items}
            selectedId={selectedId}
            onSelect={selectFromMap}
            onCentered={setCenteredId}
          />
        ) : null}
        <BottomSheet minHeight={r.sheetMin} maxHeight={r.sheetMax}>
          <Text style={[typography.sectionTitle, styles.sheetTitle]}>
            {location ? t.nearYou : t.title}
          </Text>
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
                ) : undefined
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
      </View>

      {sheet ? (
        <LocationSheet
          initialMessage={sheet.message}
          deviceLabel={location?.source === 'device' ? location.detail : null}
          onClose={() => setSheet(null)}
          onChoose={(chosen) => {
            setLocation(chosen);
            setSelectedId(null);
            setPendingDetail(null);
            setCenteredId(null);
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
