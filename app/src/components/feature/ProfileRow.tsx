import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { colors, opacity, radius, shadows, sizes, spacing, typography } from '@/theme';

export interface ProfileRowProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
}

export function ProfileRow({ title, subtitle, onPress, testID }: ProfileRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      testID={testID}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.texts}>
        <Text style={typography.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={typography.caption}>{subtitle}</Text> : null}
      </View>
      <Icon name="chevronRight" size={sizes.iconSmall} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderWidth: sizes.border,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { opacity: opacity.pressed },
  texts: { flex: 1, gap: spacing.xs },
});
