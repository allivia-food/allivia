import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/constants/icons';
import { colors, opacity, radius, sizes, typography } from '@/theme';

import { Icon } from './Icon';

export interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'plain' | 'circle' | 'whiteCircle';
  iconSize?: number;
  color?: string;
  badge?: number;
  testID?: string;
}

const hitSlopFor = (size: number) => {
  const extra = Math.max(0, (sizes.touchTarget - size) / 2);
  return { top: extra, bottom: extra, left: extra, right: extra };
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'plain',
  iconSize = sizes.icon,
  color,
  badge,
  testID,
}: IconButtonProps) {
  const boxSize =
    variant === 'circle'
      ? sizes.filterButtonWidth
      : variant === 'whiteCircle'
        ? sizes.saveCircle
        : iconSize;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${accessibilityLabel} (${badge})` : accessibilityLabel}
      hitSlop={hitSlopFor(boxSize)}
      testID={testID}
      style={({ pressed }) => [
        variant === 'circle' ? styles.circle : null,
        variant === 'whiteCircle' ? styles.whiteCircle : null,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} size={iconSize} color={color} />
      {badge ? (
        <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no">
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: sizes.filterButtonWidth,
    height: sizes.filterButtonHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteCircle: {
    width: sizes.saveCircle,
    height: sizes.saveCircle,
    borderRadius: sizes.saveCircle / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: opacity.pressed },
  badge: {
    position: 'absolute',
    top: -sizes.badgeOffset,
    right: -sizes.badgeOffset,
    minWidth: sizes.badge,
    height: sizes.badge,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...typography.caption, color: colors.textOnPrimary },
});
