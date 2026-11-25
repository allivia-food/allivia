import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, opacity, radius, shadows, sizes, spacing } from '@/theme';

export interface OptionCardProps {
  selected: boolean;
  onPress: () => void;
  minHeight: number;
  accessibilityLabel: string;
  children: ReactNode;
  testID?: string;
}

export function OptionCard({
  selected,
  onPress,
  minHeight,
  accessibilityLabel,
  children,
  testID,
}: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        { minHeight },
        selected ? styles.selected : styles.idle,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioOn]} />
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
    borderWidth: sizes.border,
    ...shadows.card,
  },
  selected: { backgroundColor: colors.surfaceOrange, borderColor: colors.primary },
  idle: { backgroundColor: colors.surface, borderColor: colors.textSecondary },
  pressed: { opacity: opacity.pressed },
  radio: {
    width: sizes.radio,
    height: sizes.radio,
    borderRadius: sizes.radio / 2,
    borderWidth: sizes.radioBorder,
    borderColor: colors.textSecondary,
    backgroundColor: colors.surface,
  },
  radioOn: { backgroundColor: colors.primary },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
