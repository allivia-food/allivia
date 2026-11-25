import { IconButton } from '@/components/ui';
import { strings } from '@/constants/strings';
import { useSavedIds, useToggleSaveRecipe } from '@/hooks/useRecipes';
import type { Recipe } from '@/services/recipes';
import { sizes } from '@/theme';

export interface SaveRecipeButtonProps {
  recipe: Recipe;
  onError?: (message: string) => void;
  onRemoved?: (recipe: Recipe) => void;
  variant?: 'plain' | 'circle';
}

export function SaveRecipeButton({
  recipe,
  onError,
  onRemoved,
  variant = 'plain',
}: SaveRecipeButtonProps) {
  const saved = useSavedIds().has(recipe.id);
  const toggle = useToggleSaveRecipe();
  return (
    <IconButton
      icon={saved ? 'bookmarkSaved' : 'bookmark'}
      iconSize={sizes.icon}
      variant={variant === 'circle' ? 'whiteCircle' : 'plain'}
      accessibilityLabel={saved ? strings.recipes.unsave : strings.recipes.save}
      testID={`save-${recipe.id}`}
      onPress={() => {
        if (saved) onRemoved?.(recipe);
        toggle.mutate(
          { recipe, save: !saved },
          { onError: () => onError?.(strings.recipes.saveError) },
        );
      }}
    />
  );
}
