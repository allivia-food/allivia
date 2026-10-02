import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import type { IconName } from '@/constants/icons';
import { strings } from '@/constants/strings';
import type { CuisineFilter } from '@/features/restaurants/rules';
import { colors, layout, opacity, spacing, typography } from '@/theme';

const OPTIONS: { id: CuisineFilter; icon: IconName }[] = [
  { id: 'all', icon: 'categoryAll' },
  { id: 'healthy', icon: 'categoryHealthy' },
  { id: 'vegetarian', icon: 'categoryVegetarian' },
  { id: 'snacks', icon: 'categorySnacks' },
  { id: 'other', icon: 'categoryOther' },
];
const r = layout.restaurants;

export interface CategoryFilterProps {
  value: CuisineFilter;
  onChange: (value: CuisineFilter) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {OPTIONS.map((o) => {
        const selected = value === o.id;
        const label = strings.restaurants.categories[o.id];
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            accessibilityLabel={label}
            testID={`category-${o.id}`}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={[styles.circle, selected && styles.circleOn]}>
              <Icon
                name={o.icon}
                size={r.categoryIcon}
                color={selected ? colors.textOnPrimary : colors.textSecondary}
              />
            </View>
            <Text style={typography.categoryLabel}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { alignItems: 'center', gap: spacing.xs },
  pressed: { opacity: opacity.pressed },
  circle: {
    width: r.categoryCircle,
    height: r.categoryCircle,
    borderRadius: r.categoryCircle / 2,
    backgroundColor: colors.chipInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: { backgroundColor: colors.primary },
});
