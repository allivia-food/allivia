import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, opacity, radius, sizes, spacing, typography } from '@/theme';

export type ChipVariant = 'filter' | 'tag' | 'time';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  active?: boolean;
  tone?: 'green' | 'orange';
  onPress?: () => void;
  testID?: string;
  scale?: number;
}

export function Chip({
  label,
  variant = 'tag',
  active = false,
  tone = 'green',
  onPress,
  testID,
  scale = 1,
}: ChipProps) {
  const palette = paletteFor(variant, active, tone);
  const content = (
    <Text
      style={[typography.chip, { color: palette.text, fontSize: typography.chip.fontSize * scale }]}
    >
      {label}
    </Text>
  );

  if (variant !== 'filter') {
    return (
      <View style={[styles.base, { backgroundColor: palette.background }]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={{ top: spacing.sm, bottom: spacing.sm }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: sizes.chipHeight * scale,
          paddingHorizontal: spacing.md * scale,
          paddingVertical: spacing.xs * scale,
        },
        { backgroundColor: palette.background },
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

function paletteFor(variant: ChipVariant, active: boolean, tone: 'green' | 'orange') {
  if (variant === 'filter') {
    return active
      ? { background: colors.primary, text: colors.textOnPrimary }
      : { background: colors.chipInactive, text: colors.textSecondary };
  }
  if (variant === 'time' || tone === 'orange') {
    return { background: colors.surfaceOrange, text: colors.primary };
  }
  return { background: colors.surfaceGreen, text: colors.secondary };
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.chipHeight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: '100%',
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  pressed: { opacity: opacity.pressed },
});
