import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/ui';
import type { IconName } from '@/constants/icons';
import { colors, radius, shadows, sizes, spacing, typography } from '@/theme';

export interface CardFieldProps extends Omit<
  TextInputProps,
  'style' | 'autoComplete' | 'importantForAutofill'
> {
  label: string;
  error?: string;
  rightIcon?: IconName;
}

export function CardField({ label, error, rightIcon, ...rest }: CardFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={typography.bodySmall}>{label}</Text>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        <TextInput
          {...rest}
          accessibilityLabel={label}
          autoComplete="off"
          importantForAutofill="no"
          textContentType="none"
          autoCorrect={false}
          placeholderTextColor={colors.textPlaceholder}
          style={styles.input}
        />
        {rightIcon ? <Icon name={rightIcon} size={sizes.iconPayment} /> : null}
      </View>
      {error ? (
        <Text style={typography.fieldError} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, gap: spacing.sm },
  field: {
    minHeight: sizes.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.cardField,
    borderWidth: sizes.border,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceOrange,
    ...shadows.card,
  },
  fieldError: { borderColor: colors.error },
  input: { ...typography.input, flex: 1, minWidth: 0, outlineWidth: 0 },
});
