import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/constants/icons';
import { colors, opacity, radius, shadows, sizes, spacing, typography } from '@/theme';

import { Icon } from './Icon';
import { IconButton } from './IconButton';

export interface SelectableTileProps {
  label: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  testID?: string;
}

export function SelectableTile({
  label,
  icon,
  selected,
  onPress,
  disabled = false,
  onRemove,
  removeLabel,
  testID,
}: SelectableTileProps) {
  const color = selected ? colors.primary : colors.textPlaceholder;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.tile,
        selected ? styles.selected : styles.unselected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {icon ? <Icon name={icon} size={sizes.iconButton} color={color} /> : null}
        <Text style={[styles.label, { color }]} numberOfLines={2}>
          {label}
        </Text>
        {onRemove ? (
          <View style={styles.remove}>
            <IconButton
              icon="plus"
              iconSize={sizes.iconSmall}
              color={color}
              onPress={onRemove}
              accessibilityLabel={removeLabel ?? label}
              testID={testID ? `${testID}-remove` : undefined}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: sizes.inputHeight,
    borderRadius: radius.card,
    borderWidth: sizes.border,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  selected: { backgroundColor: colors.surfaceOrange, borderColor: colors.primary },
  unselected: { backgroundColor: colors.surface, borderColor: colors.border },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...typography.tileLabel, flexShrink: 1, flexGrow: 1 },
  remove: { transform: [{ rotate: '45deg' }] },
});
