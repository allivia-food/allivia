import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { strings } from '@/constants/strings';
import { colors, sizes, spacing, typography } from '@/theme';

import type { RestaurantMapProps } from './RestaurantMap';

export function RestaurantMap(_props: RestaurantMapProps) {
  return (
    <View style={styles.box} testID="restaurant-map-web">
      <Icon name="mapPin" size={sizes.iconBadgeSmall} color={colors.secondary} />
      <Text style={[typography.bodySmall, styles.text]}>{strings.restaurants.mapUnavailable}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceGreen,
  },
  text: { color: colors.secondary, textAlign: 'center' },
});
