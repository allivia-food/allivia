import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { colors, radius, sizes, spacing, typography } from '@/theme';

import { Icon } from './Icon';

export type TabKey = 'home' | 'recipes' | 'scanner' | 'restaurants' | 'profile';

export const TABS: readonly { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'home', label: strings.tabs.home, icon: 'home' },
  { key: 'recipes', label: strings.tabs.recipes, icon: 'recipes' },
  { key: 'scanner', label: strings.tabs.scanner, icon: 'barcode' },
  { key: 'restaurants', label: strings.tabs.restaurants, icon: 'mapPin' },
  { key: 'profile', label: strings.tabs.profile, icon: 'user' },
];

export interface TabBarProps {
  active: TabKey;
  onTabPress: (key: TabKey) => void;
}

export function TabBar({ active, onTabPress }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom + spacing.md,
          minHeight: sizes.tabBarHeight + insets.bottom,
          paddingLeft: insets.left + spacing.xs,
          paddingRight: insets.right + spacing.xs,
        },
      ]}
      accessibilityRole="tablist"
      testID="app-tab-bar"
    >
      {TABS.map((tab) => {
        const selected = tab.key === active;
        const color = selected ? colors.primary : colors.textSecondary;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            testID={`tab-${tab.key}`}
            style={styles.item}
          >
            <Icon name={tab.icon} size={sizes.iconTab} color={color} />
            <Text
              style={[typography.tabLabel, styles.label, { color }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1.2}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: sizes.tabBarHeight,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.tabBar,
    borderTopRightRadius: radius.tabBar,
    borderWidth: sizes.border,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.touchTarget,
  },
  label: { fontSize: 12, textAlign: 'center', alignSelf: 'stretch' },
});
