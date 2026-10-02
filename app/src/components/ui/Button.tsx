import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/constants/icons';
import { colors, opacity, radius, sizes, spacing, typography } from '@/theme';

import { Icon } from './Icon';

export type ButtonVariant =
  'primary' | 'accent' | 'secondary' | 'text' | 'textSecondary' | 'danger';
export type ButtonSize = 'large' | 'small';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  rightIcon?: IconName;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  rightIcon,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const blocked = disabled || loading;
  const labelColor = variant === 'secondary' ? colors.secondary : colors.textOnPrimary;
  const textStyle =
    variant === 'text'
      ? typography.textButton
      : variant === 'textSecondary'
        ? [typography.textButton, { color: colors.secondary }]
        : [
            size === 'large' ? typography.buttonLarge : typography.buttonSmall,
            { color: labelColor },
          ];

  return (
    <Pressable
      onPress={blocked ? undefined : onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        size === 'large' ? styles.large : styles.small,
        variantStyles[variant],
        pressed && !blocked && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'secondary' || variant === 'text' || variant === 'textSecondary'
              ? colors.secondary
              : labelColor
          }
          testID={testID ? `${testID}-loading` : 'button-loading'}
        />
      ) : (
        <View style={styles.content}>
          <Text style={textStyle}>{label}</Text>
          {rightIcon ? (
            <Icon
              name={rightIcon}
              size={size === 'large' ? sizes.iconButton : sizes.iconSmall}
              color={variant === 'secondary' ? colors.secondary : undefined}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
  },
  large: { minHeight: sizes.buttonHeight },
  small: { minHeight: sizes.buttonSmallHeight, alignSelf: 'flex-start' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.secondary },
  accent: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: sizes.border,
    borderColor: colors.secondary,
  },
  text: { backgroundColor: 'transparent', minHeight: sizes.touchTarget },
  textSecondary: { backgroundColor: 'transparent', minHeight: sizes.touchTarget },
  danger: { backgroundColor: colors.error },
});
