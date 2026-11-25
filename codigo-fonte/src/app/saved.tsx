import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecipeRowCard } from '@/components/recipes/RecipeRowCard';
import { RecipeSkeleton } from '@/components/recipes/RecipeSkeleton';
import { SavedRestaurantsList } from '@/components/restaurants/SavedRestaurantsList';
import { ScreenHeader, StateView, Toast } from '@/components/ui';
import { strings } from '@/constants/strings';
import { authErrorKind } from '@/features/auth/authErrors';
import { useSavedRecipes, useToggleSaveRecipe } from '@/hooks/useRecipes';
import type { Recipe } from '@/services/recipes';
import { colors, layout, opacity, spacing, typography } from '@/theme';

const t = strings.saved;
const r = layout.recipes;
const UNDO_MS = 5000;

type Tab = 'recipes' | 'restaurants';

export default function SavedScreen() {
  const [tab, setTab] = useState<Tab>('recipes');
  const query = useSavedRecipes();
  const toggle = useToggleSaveRecipe();
  const [removed, setRemoved] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  let content: React.ReactNode;
  if (tab === 'restaurants') {
    content = <SavedRestaurantsList />;
  } else if (query.isPending) {
    content = (
      <View style={styles.padded}>
        <RecipeSkeleton />
      </View>
    );
  } else if (query.isError && !query.data) {
    content = (
      <StateView
        variant={authErrorKind(query.error) === 'network' ? 'offline' : 'error'}
        onRetry={() => void query.refetch()}
      />
    );
  } else if ((query.data ?? []).length === 0) {
    content = <StateView variant="empty" message={t.emptyRecipes} />;
  } else {
    content = (
      <FlatList
        data={query.data}
        keyExtractor={(item) => item.recipe.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RecipeRowCard
            recipe={item.recipe}
            onPress={() => router.push(`/recipe/${item.recipe.id}`)}
            onSaveError={setError}
            onRemoved={setRemoved}
          />
        )}
        testID="saved-list"
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScreenHeader title={t.title} onBack={goBack} />
      <View style={styles.tabs} accessibilityRole="tablist">
        {(['recipes', 'restaurants'] as const).map((key) => {
          const selected = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.tab,
                selected && styles.tabActive,
                pressed && styles.pressed,
              ]}
              testID={`saved-tab-${key}`}
            >
              <Text
                style={[typography.sectionTitle, selected ? styles.tabTextActive : styles.tabText]}
              >
                {key === 'recipes' ? t.recipesTab : t.restaurantsTab}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.flex}>{content}</View>
      <Toast
        visible={removed !== null}
        message={t.removed}
        actionLabel={t.undo}
        duration={UNDO_MS}
        onAction={() => {
          if (removed) toggle.mutate({ recipe: removed, save: true });
          setRemoved(null);
        }}
        onHide={() => setRemoved(null)}
      />
      <Toast visible={error !== null} message={error ?? ''} onHide={() => setError(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.lg },
  list: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.screenHorizontal + spacing.xs,
    marginTop: spacing.lg,
    minHeight: r.tabsHeight,
    padding: spacing.xs,
    borderRadius: r.tabsRadius,
    backgroundColor: colors.chipInactive,
  },
  tab: {
    flex: 1,
    minHeight: r.tabHeight,
    borderRadius: r.tabsRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary },
  tabTextActive: { color: colors.textOnPrimary },
  pressed: { opacity: opacity.pressed },
});
