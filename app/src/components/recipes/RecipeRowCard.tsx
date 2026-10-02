import { StyleSheet, Text, View } from 'react-native';

import { Card, Chip } from '@/components/ui';
import { strings } from '@/constants/strings';
import { MEAL_TYPES } from '@/features/recipes/filters';
import type { Recipe } from '@/services/recipes';
import { layout, sizes, spacing, typography } from '@/theme';

import { RecipeImage } from './RecipeImage';
import { SaveRecipeButton } from './SaveRecipeButton';

export interface RecipeRowCardProps {
  recipe: Recipe;
  onPress: () => void;
  onSaveError?: (message: string) => void;
  onRemoved?: (recipe: Recipe) => void;
}

const r = layout.recipes;

export function RecipeRowCard({ recipe, onPress, onSaveError, onRemoved }: RecipeRowCardProps) {
  const meal = MEAL_TYPES.find((m) => recipe.mealTypes.includes(m.id));
  const diet = recipe.diets[0];
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={recipe.title}
      style={styles.card}
      testID={`recipe-${recipe.id}`}
      action={<SaveRecipeButton recipe={recipe} onError={onSaveError} onRemoved={onRemoved} />}
    >
      <RecipeImage uri={recipe.imageUrl} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.texts}>
            <Text style={typography.sectionTitle} numberOfLines={2}>
              {recipe.title}
            </Text>
            <Text style={typography.bodySmall}>
              {strings.recipes.minutes(recipe.readyInMinutes)}
            </Text>
          </View>
          <View style={styles.actionSpace} />
        </View>
        <View style={styles.chips}>
          {meal ? <Chip label={meal.label} /> : null}
          {diet ? <Chip label={strings.recipes.diets[diet]} tone="orange" /> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', minHeight: r.rowCardHeight },
  image: { width: r.rowImageWidth, minHeight: r.rowImageHeight },
  body: { flex: 1, padding: spacing.md, justifyContent: 'space-between', gap: spacing.sm },
  top: { flexDirection: 'row', gap: spacing.sm },
  texts: { flex: 1, gap: spacing.xs },
  actionSpace: { width: sizes.icon },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
