import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/ui';
import { colors, layout, radius, shadows, sizes, spacing, typography } from '@/theme';
import { sanitizeTextInput, SEARCH_MAX_LENGTH } from '@/utils/textInput';

export interface SearchPillProps extends Omit<TextInputProps, 'style'> {
  placeholder: string;
}

export function SearchPill({
  placeholder,
  onChangeText,
  maxLength = SEARCH_MAX_LENGTH,
  ...rest
}: SearchPillProps) {
  return (
    <View style={styles.pill}>
      <Icon name="search" size={sizes.icon} color={colors.textSecondary} />
      <TextInput
        maxLength={maxLength}
        maxFontSizeMultiplier={Platform.OS === 'android' ? 1.3 : undefined}
        {...rest}
        onChangeText={(value) => onChangeText?.(sanitizeTextInput(value, 'text', maxLength))}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: layout.restaurants.searchHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.chipInactive,
    ...shadows.card,
  },
  input: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    outlineWidth: 0,
  },
});
