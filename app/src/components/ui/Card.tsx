import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, opacity, radius, shadows, sizes, spacing } from '@/theme';

export type CardVariant = 'default' | 'green' | 'orange';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  action?: ReactNode;
  actionStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Card({
  children,
  variant = 'default',
  style,
  onPress,
  action,
  actionStyle,
  accessibilityLabel,
  testID,
}: CardProps) {
  const cardStyle = [styles.base, variantStyles[variant], style];
  if (!onPress) {
    return (
      <View style={cardStyle} testID={testID}>
        {children}
      </View>
    );
  }
  const card = (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
  if (!action) return card;
  return (
    <View>
      {card}
      <View style={[styles.action, actionStyle]}>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    borderWidth: sizes.border,
    overflow: 'visible',
    ...shadows.card,
  },
  pressed: { opacity: opacity.pressed },
  action: { position: 'absolute', top: spacing.md, right: spacing.md },
});

const variantStyles = StyleSheet.create({
  default: { backgroundColor: colors.surface, borderColor: colors.primary },
  green: { backgroundColor: colors.surfaceGreen, borderColor: colors.secondary },
  orange: { backgroundColor: colors.surfaceOrange, borderColor: colors.secondary },
});
