import { StyleSheet, Text, View } from 'react-native';

import { Card, Chip } from '@/components/ui';
import { strings } from '@/constants/strings';
import { MEAL_TYPES } from '@/features/recipes/filters';
import type { Recipe } from '@/services/recipes';
import { layout, sizes, spacing, typography } from '@/theme';

import { RecipeImage } from './RecipeImage';
import { SaveRecipeButton } from './SaveRecipeButton';

export interface RecipeFeaturedCardProps {
  recipe: Recipe;
  withoutText: string;
  onPress: () => void;
  onSaveError?: (message: string) => void;
}

const r = layout.recipes;

export function RecipeFeaturedCard({
  recipe,
  withoutText,
  onPress,
  onSaveError,
}: RecipeFeaturedCardProps) {
  const meal = MEAL_TYPES.find((m) => recipe.mealTypes.includes(m.id));
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={recipe.title}
      testID="recipe-featured"
      action={<SaveRecipeButton recipe={recipe} onError={onSaveError} />}
      actionStyle={styles.action}
    >
      <View>
        <RecipeImage uri={recipe.imageUrl} style={styles.image} />
        <View style={styles.time}>
          <Chip label={strings.recipes.minutes(recipe.readyInMinutes)} variant="time" />
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.texts}>
            <Text style={typography.sectionTitle}>{recipe.title}</Text>
            {withoutText ? <Text style={typography.bodySmall}>{withoutText}</Text> : null}
          </View>
          <View style={styles.actionSpace} />
        </View>
        {meal ? <Chip label={meal.label} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  image: { height: r.featuredImageHeight },
  time: { position: 'absolute', top: spacing.md, right: spacing.md },
  body: { padding: spacing.md, gap: spacing.md },
  top: { flexDirection: 'row', gap: spacing.sm },
  texts: { flex: 1, gap: spacing.xs },
  actionSpace: { width: sizes.icon },
  action: { top: r.featuredImageHeight + spacing.md },
});
