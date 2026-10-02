import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterSheet } from '@/components/recipes/FilterSheet';
import { RecipeFeaturedCard } from '@/components/recipes/RecipeFeaturedCard';
import { RecipeRowCard } from '@/components/recipes/RecipeRowCard';
import { RecipeSkeleton } from '@/components/recipes/RecipeSkeleton';
import {
  Banner,
  Chip,
  ChipGroup,
  IconButton,
  LargeTitleHeader,
  StateView,
  Toast,
} from '@/components/ui';
import { ALLERGENS } from '@/constants/allergens';
import { strings } from '@/constants/strings';
import { authErrorKind } from '@/features/auth/authErrors';
import {
  countActiveFilters,
  defaultFilters,
  isInTimeRange,
  MEAL_TYPES,
} from '@/features/recipes/filters';
import { useRecipeFilters, useRecipes } from '@/hooks/useRecipes';
import type { Recipe } from '@/services/recipes';
import { useProfileStore } from '@/store/profile';
import { colors, layout, spacing, typography } from '@/theme';

const t = strings.recipes;

export default function RecipesScreen() {
  const profile = useProfileStore((s) => s.profile);
  const [filters, setFilters] = useRecipeFilters();
  const query = useRecipes(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const preferences = profile?.preferences ?? [];
  const recipes = useMemo(
    () =>
      (query.data?.pages.flat() ?? []).filter((r) => isInTimeRange(r.readyInMinutes, filters.time)),
    [query.data, filters.time],
  );
  const [featured, ...rest] = recipes;
  const activeCount = countActiveFilters(filters, preferences);
  const withoutText = t.without(
    ALLERGENS.filter((a) => profile?.allergies.includes(a.id)).map((a) => a.label),
  );
  const offline = query.isError && recipes.length > 0;
  const open = (recipe: Recipe) => router.push(`/recipe/${recipe.id}`);

  const header = (
    <View>
      <LargeTitleHeader
        title={t.title}
        subtitle={t.subtitle}
        right={
          <IconButton
            icon="filter"
            variant="circle"
            badge={activeCount}
            onPress={() => setFiltersOpen(true)}
            accessibilityLabel={t.filters}
            testID="recipes-filter"
          />
        }
      />
      <View style={styles.chips}>
        <ChipGroup>
          <Chip
            variant="filter"
            label={t.all}
            active={filters.mealType === null}
            onPress={() => setFilters({ ...filters, mealType: null })}
            testID="meal-all"
          />
          {MEAL_TYPES.map((m) => (
            <Chip
              key={m.id}
              variant="filter"
              label={m.label}
              active={filters.mealType === m.id}
              onPress={() => setFilters({ ...filters, mealType: m.id })}
              testID={`meal-${m.id}`}
            />
          ))}
        </ChipGroup>
      </View>
      {offline ? (
        <View style={styles.padded}>
          <Banner variant="info" title={t.offline} />
        </View>
      ) : null}
      {featured ? (
        <View style={styles.padded}>
          <Text style={[typography.sectionTitle, styles.section]}>{t.featured}</Text>
          <RecipeFeaturedCard
            recipe={featured}
            withoutText={withoutText}
            onPress={() => open(featured)}
            onSaveError={setToast}
          />
          {rest.length > 0 ? (
            <Text style={[typography.sectionTitle, styles.section]}>{t.more}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  let body: React.ReactNode = null;
  if (query.isPending) {
    body = (
      <View style={styles.padded}>
        <RecipeSkeleton />
      </View>
    );
  } else if (query.isError && recipes.length === 0) {
    body = (
      <StateView
        variant={authErrorKind(query.error) === 'network' ? 'offline' : 'error'}
        message={authErrorKind(query.error) === 'network' ? undefined : t.loadError}
        onRetry={() => void query.refetch()}
      />
    );
  } else if (recipes.length === 0) {
    body = (
      <StateView
        variant="empty"
        message={t.empty}
        actionLabel={t.clearFilters}
        onAction={() => setFilters(defaultFilters(preferences))}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <FlatList
        data={body ? [] : rest}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={body ? <View style={styles.state}>{body}</View> : null}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <RecipeRowCard recipe={item} onPress={() => open(item)} onSaveError={setToast} />
          </View>
        )}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        testID="recipes-list"
      />
      {filtersOpen ? (
        <FilterSheet
          filters={filters}
          profilePreferences={preferences}
          onClose={() => setFiltersOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setFiltersOpen(false);
          }}
        />
      ) : null}
      <Toast visible={toast !== null} message={toast ?? ''} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  chips: { marginTop: spacing.xl },
  padded: { paddingHorizontal: spacing.screenHorizontal, marginTop: spacing.md },
  section: { marginTop: spacing.lg, marginBottom: spacing.md },
  item: { paddingHorizontal: spacing.screenHorizontal, marginBottom: spacing.md },
  state: { minHeight: layout.recipes.stateMinHeight, paddingTop: spacing.xl },
  footer: { marginVertical: spacing.lg },
});
