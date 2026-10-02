import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecipeImage } from '@/components/recipes/RecipeImage';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { Button, Card, Icon, IconBadge, StateView } from '@/components/ui';
import { FEATURES } from '@/constants/features';
import { allergenIcons, CUSTOM_ALLERGY_ICON, images } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { restrictionsSummary } from '@/features/onboarding/selection';
import { useHomeRecipe, useSavedRecipes } from '@/hooks/useRecipes';
import { useHomeRestaurant } from '@/hooks/useRestaurants';
import { useProfileStore } from '@/store/profile';
import { colors, layout, opacity, radius, sizes, spacing, typography } from '@/theme';
import { computeSafety } from '@/utils/recipeSafety';

const t = strings.home;
const r = layout.recipes;

export default function HomeScreen() {
  const profile = useProfileStore((s) => s.profile);
  const insets = useSafeAreaInsets();
  const recipe = useHomeRecipe();
  const saved = useSavedRecipes();
  const homeRestaurant = useHomeRestaurant();
  const summary = restrictionsSummary(profile?.allergies ?? [], profile?.customAllergies ?? []);
  const safety =
    recipe.data && profile
      ? computeSafety(recipe.data, {
          allergies: profile.allergies,
          customAllergies: profile.customAllergies,
        })
      : null;

  return (
    <View style={styles.screen}>
      <Image
        source={images.splashBackground}
        style={[StyleSheet.absoluteFill, styles.pattern]}
        contentFit="cover"
        accessible={false}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
        refreshControl={
          <RefreshControl
            refreshing={recipe.isRefetching}
            onRefresh={() => {
              void recipe.refetch();
              void saved.refetch();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View>
          <Text style={typography.screenTitle} accessibilityRole="header" testID="home-greeting">
            {t.greeting(profile?.displayName ?? '')}
          </Text>
          <Text style={typography.subtitle}>{t.welcome}</Text>
        </View>

        <Card variant="orange" style={styles.scanner}>
          <View style={styles.flex}>
            <Text style={[typography.buttonLarge, styles.scannerTitle]}>{t.scannerTitle}</Text>
            <Text style={typography.bodySmall}>{t.scannerText}</Text>
            <Pressable
              onPress={() => router.navigate('/scanner')}
              accessibilityRole="button"
              accessibilityLabel={`${t.scannerButton} (${t.premium})`}
              style={({ pressed }) => [styles.scannerButton, pressed && styles.pressed]}
              testID="home-scanner"
            >
              <Text style={[typography.buttonSmall, styles.scannerButtonText]}>
                {t.scannerButton}
              </Text>
              <Icon name="premium" size={sizes.iconTab} />
            </Pressable>
          </View>
          <IconBadge icon="barcodeLarge" size="large" />
        </Card>

        <Card variant="green" style={styles.restrictions}>
          <View style={styles.row}>
            <Text style={[typography.sectionTitle, styles.flex]}>{t.restrictions}</Text>
            <Text
              style={styles.edit}
              onPress={() => router.push('/profile/edit-preferences')}
              accessibilityRole="button"
              testID="home-edit-restrictions"
            >
              {t.edit}
            </Text>
          </View>
          <View style={styles.badges}>
            {summary.items.map((item) => (
              <View key={item.key} style={styles.badge}>
                <IconBadge
                  icon={item.allergenId ? allergenIcons[item.allergenId] : CUSTOM_ALLERGY_ICON}
                  color={colors.primary}
                />
                <Text style={[typography.subtitle, styles.center]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            ))}
            {summary.more > 0 ? (
              <View style={styles.badge}>
                <View style={styles.more}>
                  <Text style={[typography.buttonLarge, styles.moreText]}>+{summary.more}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </Card>

        <View>
          <Text style={typography.sectionTitle}>{t.recipesTitle}</Text>
          <Text style={typography.body}>{t.recipesSubtitle}</Text>
        </View>
        {recipe.isPending ? (
          <View style={[styles.recipeCard, styles.placeholder]} />
        ) : recipe.isError ? (
          <View style={styles.block}>
            <StateView variant="error" onRetry={() => void recipe.refetch()} />
          </View>
        ) : recipe.data ? (
          <Card style={styles.recipeCard} testID="home-recipe">
            <RecipeImage uri={recipe.data.imageUrl} style={styles.recipeImage} />
            <View style={styles.recipeBody}>
              <Text style={typography.sectionTitle} numberOfLines={2}>
                {recipe.data.title}
              </Text>
              <Text style={typography.bodySmall}>
                {safety?.level === 'safe' ? t.safeDescription : t.checkDescription}
              </Text>
              <Button
                label={t.seeRecipe}
                variant="accent"
                size="small"
                rightIcon="chevronRightWhite"
                onPress={() => router.push(`/recipe/${recipe.data?.id}`)}
                testID="home-see-recipe"
              />
            </View>
          </Card>
        ) : (
          <Text style={[typography.bodySmall, styles.noRecipe]}>{t.noRecipe}</Text>
        )}

        {FEATURES.restaurants && homeRestaurant ? (
          <View style={styles.restaurants} testID="home-restaurants">
            <View>
              <Text style={typography.sectionTitle}>{t.restaurantsTitle}</Text>
              <Text style={typography.body}>{t.restaurantsSubtitle}</Text>
            </View>
            <RestaurantCard
              item={homeRestaurant}
              hasAllergies={(profile?.allergies.length ?? 0) > 0}
              showSave={false}
              onPress={() => router.navigate('/restaurants')}
            />
          </View>
        ) : null}

        <Card
          variant="green"
          style={styles.shortcut}
          onPress={() => router.push('/saved')}
          accessibilityLabel={t.savedTitle}
          testID="home-saved"
        >
          <View style={styles.shortcutIcon}>
            <Icon name="bookmarkFilled" size={sizes.iconBanner} />
          </View>
          <View style={styles.flex}>
            <Text style={typography.sectionTitle}>{t.savedTitle}</Text>
            <Text style={typography.caption}>{t.savedText}</Text>
          </View>
          <Icon name="chevronRight" size={sizes.icon} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  restaurants: { gap: spacing.md },
  screen: { flex: 1, backgroundColor: colors.background },
  pattern: { opacity: opacity.backgroundPatternLight },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { textAlign: 'center' },
  pressed: { opacity: opacity.pressed },
  scanner: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  scannerTitle: { color: colors.primary },
  scannerButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: sizes.buttonSmallHeight,
    paddingHorizontal: spacing.lg,
    borderRadius: sizes.buttonSmallHeight / 2,
    backgroundColor: colors.surface,
  },
  scannerButtonText: { color: colors.primary },
  restrictions: { padding: spacing.md, gap: spacing.md },
  edit: { ...typography.link, fontSize: typography.sectionTitle.fontSize, color: colors.secondary },
  badges: { flexDirection: 'row', justifyContent: 'space-around' },
  badge: { flex: 1, alignItems: 'center', gap: spacing.xs },
  more: {
    width: sizes.iconBadgeMedium,
    height: sizes.iconBadgeMedium,
    borderRadius: sizes.iconBadgeMedium / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { color: colors.primary },
  block: { minHeight: r.homeCardHeight },
  recipeCard: { flexDirection: 'row', minHeight: r.homeCardHeight },
  placeholder: { backgroundColor: colors.chipInactive, borderRadius: radius.card },
  recipeImage: { width: r.homeImageWidth },
  recipeBody: { flex: 1, padding: spacing.md, gap: spacing.sm, justifyContent: 'space-between' },
  noRecipe: { color: colors.textSecondary },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  shortcutIcon: {
    width: r.shortcutCircle,
    height: r.shortcutCircle,
    borderRadius: r.shortcutCircle / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
