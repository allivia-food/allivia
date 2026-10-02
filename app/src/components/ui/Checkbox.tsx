import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, opacity, shadows, sizes, spacing, typography } from '@/theme';

export interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  linkText?: string;
  onLinkPress?: () => void;
  error?: boolean;
  textColor?: string;
  disabled?: boolean;
  testID?: string;
}

export function Checkbox({
  checked,
  onToggle,
  label,
  linkText,
  onLinkPress,
  error = false,
  textColor = colors.textPrimary,
  disabled = false,
  testID,
}: CheckboxProps) {
  const toggle = disabled ? undefined : onToggle;
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <Pressable
        onPress={toggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={`${label}${linkText ?? ''}`.trim()}
        hitSlop={spacing.md}
        testID={testID}
        style={[styles.box, checked && styles.boxChecked, error && styles.boxError]}
      >
        {checked ? <Text style={styles.mark}>✓</Text> : null}
      </Pressable>
      <Text style={[styles.label, { color: textColor }]} onPress={toggle}>
        {label}
        {linkText ? (
          <Text
            style={styles.link}
            onPress={onLinkPress}
            accessibilityRole="link"
            testID={testID ? `${testID}-link` : undefined}
          >
            {linkText}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  disabled: { opacity: opacity.disabled },
  box: {
    width: sizes.checkboxWidth,
    height: sizes.checkboxHeight,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: sizes.border,
    borderColor: colors.surface,
    ...shadows.card,
  },
  boxChecked: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  boxError: { borderColor: colors.error },
  mark: { ...typography.bannerTitle, color: colors.textOnPrimary },
  label: { ...typography.subtitle, flex: 1 },
  link: { fontFamily: fontFamily.extraBold, textDecorationLine: 'underline' },
});
