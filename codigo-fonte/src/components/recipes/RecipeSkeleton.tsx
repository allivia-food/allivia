import { StyleSheet, View } from 'react-native';

import { strings } from '@/constants/strings';
import { colors, layout, radius, spacing } from '@/theme';

export function RecipeSkeleton() {
  return (
    <View
      style={styles.list}
      accessibilityLabel={strings.common.loading}
      accessibilityRole="progressbar"
      testID="recipes-skeleton"
    >
      {Array.from({ length: layout.recipes.skeletonCount }, (_, i) => (
        <View key={i} style={styles.card} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: {
    height: layout.recipes.rowCardHeight,
    borderRadius: radius.card,
    backgroundColor: colors.chipInactive,
  },
});
