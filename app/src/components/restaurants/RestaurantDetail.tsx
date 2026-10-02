import { Linking, StyleSheet, Text, View } from 'react-native';

import { RecipeImage } from '@/components/recipes/RecipeImage';
import { Banner, Button, Chip, Icon, Modal } from '@/components/ui';
import { ALLERGENS, type AllergenId } from '@/constants/allergens';
import { strings } from '@/constants/strings';
import { formatDistance, routeUrl, type RankedRestaurant } from '@/features/restaurants/rules';
import { colors, layout, sizes, spacing, typography } from '@/theme';

import { ratingText } from './RestaurantCard';
import { SaveRestaurantButton } from './SaveRestaurantButton';

const t = strings.restaurants;
const labelOf = (id: AllergenId) => ALLERGENS.find((a) => a.id === id)?.label ?? id;

export interface RestaurantDetailProps {
  item: RankedRestaurant;
  customAllergies: readonly string[];
  onClose: () => void;
  onSaveError?: (message: string) => void;
}

export function RestaurantDetail({
  item,
  customAllergies,
  onClose,
  onSaveError,
}: RestaurantDetailProps) {
  const { restaurant, distance, covered, missing } = item;
  const cuisine = t.categories[restaurant.cuisine];
  const openRoute = () => {
    Linking.openURL(routeUrl(restaurant)).catch((error: unknown) => {
      if (__DEV__) console.warn('[restaurants] route not opened', error);
    });
  };

  return (
    <Modal
      visible
      onClose={onClose}
      title={restaurant.name}
      variant="sheet"
      testID="restaurant-detail"
    >
      <RecipeImage uri={restaurant.image} style={styles.image} />
      <View style={styles.row}>
        <Text style={[typography.bodySmall, styles.flex]}>
          {t.meta(cuisine, distance === null ? null : formatDistance(distance))}
        </Text>
        {restaurant.rating !== null ? (
          <View style={styles.rating}>
            <Text style={[typography.bodySmall, styles.ratingText]}>
              {ratingText(restaurant.rating)}
            </Text>
            <Icon name="star" size={sizes.iconSmall} />
          </View>
        ) : (
          <Text style={typography.caption}>{t.detail.noRating}</Text>
        )}
        <SaveRestaurantButton restaurant={restaurant} onError={onSaveError} />
      </View>

      <View style={styles.section}>
        <Text style={typography.sectionTitle}>{t.detail.address}</Text>
        <Text style={typography.bodySmall}>{restaurant.address}</Text>
      </View>

      <View style={styles.section} testID="detail-covered">
        <Text style={typography.sectionTitle}>{t.detail.covered}</Text>
        <AllergenChips ids={covered} />
      </View>

      {missing.length > 0 ? (
        <View style={styles.section} testID="detail-missing">
          <Text style={typography.sectionTitle}>{t.detail.notCovered}</Text>
          <AllergenChips ids={missing} />
        </View>
      ) : null}

      {customAllergies.length > 0 ? (
        <Banner
          variant="warning"
          title={t.detail.confirmCustom(customAllergies.join(', '))}
          testID="detail-custom"
        />
      ) : null}

      <Text style={[typography.caption, styles.disclaimer]} testID="restaurant-disclaimer">
        {t.detail.disclaimer}
      </Text>
      <Button label={t.detail.route} onPress={openRoute} testID="restaurant-route" />
    </Modal>
  );
}

function AllergenChips({ ids }: { ids: readonly AllergenId[] }) {
  if (ids.length === 0) return <Text style={typography.bodySmall}>{t.detail.none}</Text>;
  return (
    <View style={styles.chips}>
      {ids.map((id) => (
        <Chip key={id} label={labelOf(id)} tone="orange" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { height: layout.restaurants.detailImageHeight, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingText: { color: colors.primary },
  section: { gap: spacing.sm, alignSelf: 'stretch' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  disclaimer: { color: colors.textSecondary, textAlign: 'center' },
});
