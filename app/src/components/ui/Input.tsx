import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import type { IconName } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { colors, opacity, radius, shadows, sizes, spacing, typography } from '@/theme';

import { Icon } from './Icon';

export interface InputProps extends Omit<TextInputProps, 'style' | 'editable'> {
  icon?: IconName;
  error?: string;
  onPrimary?: boolean;
  disabled?: boolean;
  secure?: boolean;
  ref?: Ref<TextInput>;
}

export function Input({
  icon,
  error,
  onPrimary = false,
  disabled = false,
  secure = false,
  onFocus,
  onBlur,
  ref,
  accessibilityLabel,
  placeholder,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.field,
          focused && styles.focused,
          error ? styles.errorBorder : null,
          disabled && styles.disabled,
        ]}
      >
        {icon ? (
          <View style={styles.leftIcon}>
            <Icon name={icon} size={sizes.iconInput} />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          {...rest}
          placeholder={placeholder}
          accessibilityLabel={accessibilityLabel ?? placeholder}
          accessibilityState={{ disabled }}
          editable={!disabled}
          secureTextEntry={secure && hidden}
          placeholderTextColor={colors.textPlaceholder}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, !icon && styles.inputNoIcon]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? strings.common.showPassword : strings.common.hidePassword}
            hitSlop={spacing.md}
            style={styles.rightIcon}
          >
            <Icon name="eye" size={sizes.iconInput} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          style={[styles.error, onPrimary && styles.errorOnPrimary]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'stretch', gap: spacing.xs },
  field: {
    minHeight: sizes.inputHeight,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: sizes.border,
    borderColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  focused: { borderColor: colors.secondary },
  errorBorder: { borderColor: colors.error },
  disabled: { opacity: opacity.disabled },
  leftIcon: { position: 'absolute', left: spacing.inputIconLeft },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingLeft: spacing.inputTextLeft,
    paddingRight: spacing.lg,
    ...typography.input,
    outlineWidth: 0,
  },
  inputNoIcon: { paddingLeft: spacing.xl },
  rightIcon: { paddingRight: spacing.inputIconLeft },
  error: { ...typography.fieldError, paddingHorizontal: spacing.xs },
  errorOnPrimary: { color: colors.textOnPrimary },
});
