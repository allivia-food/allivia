import { Platform, StyleSheet, Text, View } from 'react-native';

import { RecipeImage } from '@/components/recipes/RecipeImage';
import { Card, Icon } from '@/components/ui';
import { strings } from '@/constants/strings';
import { getRestaurantPhotos } from '@/constants/restaurantPhotos';
import {
  allergenFreeText,
  type RankedRestaurant,
  type Restaurant,
} from '@/features/restaurants/rules';
import { colors, layout, sizes, spacing, typography } from '@/theme';

import { SaveRestaurantButton } from './SaveRestaurantButton';

export interface RestaurantCardProps {
  item: RankedRestaurant;
  hasAllergies: boolean;
  onPress: () => void;
  selected?: boolean;
  showSave?: boolean;
  onSaveError?: (message: string) => void;
  onRemoved?: (restaurant: Restaurant) => void;
}

const r = layout.restaurants;

export const ratingText = (rating: number) => rating.toFixed(1).replace('.', ',');

export function RestaurantCard({
  item,
  hasAllergies,
  onPress,
  selected = false,
  showSave = true,
  onSaveError,
  onRemoved,
}: RestaurantCardProps) {
  const compact = Platform.OS === 'android';
  const { restaurant, covered } = item;
  const cuisine = strings.restaurants.categories[restaurant.cuisine];
  const freeText = allergenFreeText(hasAllergies ? covered : restaurant.allergenFriendly);
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={restaurant.name}
      style={[styles.card, compact && styles.compactCard, selected && styles.selected]}
      testID={`restaurant-${restaurant.id}`}
      action={
        showSave ? (
          <SaveRestaurantButton
            restaurant={restaurant}
            onError={onSaveError}
            onRemoved={onRemoved}
          />
        ) : undefined
      }
      actionStyle={[styles.action, compact && styles.compactAction]}
    >
      <RecipeImage
        uri={restaurant.image}
        localSource={getRestaurantPhotos(restaurant.name)[0]}
        style={[styles.image, compact && styles.compactImage]}
      />
      <View style={[styles.body, compact && styles.compactBody]}>
        <View style={styles.texts}>
          <Text style={typography.sectionTitle} numberOfLines={2}>
            {restaurant.name}
          </Text>
          <Text style={typography.bodySmall}>{cuisine}</Text>
          {freeText ? (
            <Text style={typography.bodySmall} numberOfLines={2}>
              {freeText}
            </Text>
          ) : null}
        </View>
        <View style={styles.side}>
          {showSave ? <View style={styles.actionSpace} /> : null}
          {restaurant.rating !== null ? (
            <View
              style={styles.rating}
              accessible
              accessibilityLabel={strings.restaurants.rating(ratingText(restaurant.rating))}
            >
              <Text style={[typography.bodySmall, styles.ratingText]}>
                {ratingText(restaurant.rating)}
              </Text>
              <Icon name="star" size={sizes.iconSmall} />
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', minHeight: r.cardHeight },
  compactCard: { minHeight: r.cardHeight * 0.8 },
  compactImage: { width: r.imageWidth * 0.8, minHeight: r.imageHeight * 0.8 },
  compactBody: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  compactAction: { top: spacing.sm, right: spacing.md },
  selected: { borderColor: colors.secondary, borderWidth: sizes.borderSelected },
  image: { width: r.imageWidth, minHeight: r.imageHeight },
  body: { flex: 1, flexDirection: 'row', padding: spacing.lg, gap: spacing.sm },
  texts: { flex: 1, gap: spacing.xs },
  side: { alignItems: 'flex-end', justifyContent: 'space-between' },
  action: { top: spacing.lg, right: spacing.lg },
  actionSpace: { width: sizes.icon, height: sizes.icon },
  rating: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  ratingText: { color: colors.primary },
});
