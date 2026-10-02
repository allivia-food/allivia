import { StyleSheet, View } from 'react-native';

import type { IconName } from '@/constants/icons';
import { colors, sizes } from '@/theme';

import { Icon } from './Icon';

export type IconBadgeSize = 'small' | 'benefit' | 'medium' | 'large';

export interface IconBadgeProps {
  icon: IconName;
  size?: IconBadgeSize;
  color?: string;
  tone?: 'white' | 'green';
  accessibilityLabel?: string;
}

const diameter: Record<IconBadgeSize, number> = {
  small: sizes.iconBadgeSmall,
  benefit: sizes.iconBadgeBenefit,
  medium: sizes.iconBadgeMedium,
  large: sizes.iconBadgeLarge,
};

export function IconBadge({
  icon,
  size = 'medium',
  color,
  tone = 'white',
  accessibilityLabel,
}: IconBadgeProps) {
  const d = diameter[size];
  return (
    <View
      style={[
        styles.circle,
        { width: d, height: d, borderRadius: d / 2 },
        tone === 'green' && styles.green,
      ]}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
    >
      <Icon name={icon} size={Math.round(d * sizes.iconBadgeIconRatio)} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  green: { backgroundColor: colors.surfaceGreen },
  circle: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
