import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecipeImage } from '@/components/recipes/RecipeImage';
import { SafetyBanner } from '@/components/recipes/SafetyBanner';
import { SaveRecipeButton } from '@/components/recipes/SaveRecipeButton';
import { Button, Chip, Icon, ScreenHeader, StateView, Toast } from '@/components/ui';
import type { IconName } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { authErrorKind } from '@/features/auth/authErrors';
import { useRecipe } from '@/hooks/useRecipes';
import type { Recipe } from '@/services/recipes';
import { useProfileStore } from '@/store/profile';
import { colors, layout, radius, shadows, sizes, spacing, typography } from '@/theme';
import { computeSafety } from '@/utils/recipeSafety';

const t = strings.recipe;
const r = layout.recipes;
const RICH_IN_PROTEIN_G = 25;

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useRecipe(id ?? '');
  const profile = useProfileStore((s) => s.profile);
  const [toast, setToast] = useState<string | null>(null);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/recipes'));

  if (query.isPending || query.isError || !query.data) {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ScreenHeader title={t.back} onBack={goBack} />
        {query.isPending ? (
          <StateView variant="loading" />
        ) : query.isError ? (
          <StateView
            variant={authErrorKind(query.error) === 'network' ? 'offline' : 'error'}
            onRetry={() => void query.refetch()}
          />
        ) : (
          <View style={styles.notFound}>
            <StateView variant="empty" message={t.notFound} />
            <Button label={strings.common.back} variant="secondary" onPress={goBack} />
          </View>
        )}
      </SafeAreaView>
    );
  }

  const recipe = query.data;
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <RecipeDetail recipe={recipe} profile={profile} />
      </ScrollView>
      <View style={styles.header} pointerEvents="box-none">
        <ScreenHeader
          title={t.back}
          tone="onImage"
          onBack={goBack}
          right={<SaveRecipeButton recipe={recipe} variant="circle" onError={setToast} />}
        />
      </View>
      <Toast visible={toast !== null} message={toast ?? ''} onHide={() => setToast(null)} />
    </View>
  );
}

function RecipeDetail({
  recipe,
  profile,
}: {
  recipe: Recipe;
  profile: ReturnType<typeof useProfileStore.getState>['profile'];
}) {
  const { width } = useWindowDimensions();
  const k = width / layout.frameWidth;
  const safety = computeSafety(recipe, {
    allergies: profile?.allergies ?? [],
    customAllergies: profile?.customAllergies ?? [],
  });
  const facts: { icon: IconName; value: string; label: string }[] = [
    { icon: 'clock', value: strings.recipes.minutes(recipe.readyInMinutes), label: t.totalTime },
    { icon: 'plate', value: t.servings(recipe.servings), label: t.serves },
  ];
  if (recipe.caloriesKcal !== null) {
    facts.push({ icon: 'flame', value: t.kcal(recipe.caloriesKcal), label: t.perServing });
  }
  const nutrition = [
    { value: recipe.caloriesKcal, label: t.calories, format: t.kcal },
    { value: recipe.proteinG, label: t.protein, format: t.grams },
    { value: recipe.carbsG, label: t.carbs, format: t.grams },
    { value: recipe.fatG, label: t.fat, format: t.grams },
  ];
  const hasNutrition = nutrition.some((n) => n.value !== null);

  return (
    <>
      <RecipeImage
        uri={recipe.imageUrl}
        style={[styles.image, { height: r.headerImageHeight * k }]}
      />
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          {recipe.title}
        </Text>
        <View style={styles.chips}>
          {recipe.diets.map((d) => (
            <Chip key={d} label={strings.recipes.diets[d]} tone="orange" />
          ))}
          {recipe.proteinG !== null && recipe.proteinG >= RICH_IN_PROTEIN_G ? (
            <Chip label={strings.recipes.richInProtein} tone="orange" />
          ) : null}
        </View>

        <View style={styles.facts}>
          {facts.map((f) => (
            <View key={f.label} style={styles.fact}>
              <Icon name={f.icon} size={sizes.iconButton} />
              <View>
                <Text style={styles.factValue}>{f.value}</Text>
                <Text style={styles.factLabel}>{f.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <SafetyBanner safety={safety} profileAllergies={profile?.allergies ?? []} />

        <Text style={typography.sectionTitle}>{t.ingredients}</Text>
        <View style={styles.list}>
          {recipe.ingredients.map((ing, i) => (
            <Text key={`${i}-${ing}`} style={typography.bodySmall}>
              • {ing}
            </Text>
          ))}
        </View>

        <View style={[styles.greenCard, styles.tip]}>
          <Icon name="lightbulb" size={sizes.iconBanner} />
          <View style={styles.flex}>
            <Text style={typography.bannerTitle}>{t.tipTitle}</Text>
            <Text style={typography.bodySmall}>{recipe.tip || t.tipDefault}</Text>
          </View>
        </View>

        <Text style={typography.sectionTitle}>{t.steps}</Text>
        <View style={styles.list}>
          {recipe.steps.map((step, i) => (
            <View key={`${i}-${step}`} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={[typography.bodySmall, styles.flex]}>{step}</Text>
            </View>
          ))}
        </View>

        {hasNutrition ? (
          <View style={styles.greenCard}>
            <Text style={typography.bannerTitle}>{t.nutrition}</Text>
            <View style={styles.nutrition}>
              {nutrition.map((n) =>
                n.value === null ? null : (
                  <View key={n.label}>
                    <Text style={styles.factValue}>{n.format(Math.round(n.value))}</Text>
                    <Text style={styles.factLabel}>{n.label}</Text>
                  </View>
                ),
              )}
            </View>
          </View>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  notFound: { flex: 1, gap: spacing.lg, padding: spacing.screenHorizontal },
  image: { borderRadius: 0 },
  card: {
    marginTop: -r.cardOverlap,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: sizes.border,
    borderColor: colors.border,
    borderRadius: radius.card,
    ...shadows.card,
  },
  title: { ...typography.headerTitle, color: colors.primary, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  fact: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  factValue: { ...typography.bannerTitle, color: colors.textPrimary },
  factLabel: { ...typography.caption, color: colors.textSecondary },
  list: { gap: spacing.sm },
  greenCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: sizes.border,
    borderColor: colors.secondary,
    backgroundColor: colors.surfaceGreen,
  },
  tip: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNumber: {
    width: r.stepCircle,
    height: r.stepCircle,
    borderRadius: r.stepCircle / 2,
    backgroundColor: colors.surfaceGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { ...typography.sectionTitle, color: colors.secondary },
  nutrition: { flexDirection: 'row', justifyContent: 'space-between' },
});
