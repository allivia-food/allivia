import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, typography } from '@/theme';

export interface LargeTitleHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function LargeTitleHeader({ title, subtitle, right }: LargeTitleHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.texts}>
        <Text style={typography.screenTitle} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={typography.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.screenHorizontal,
  },
  texts: { flex: 1 },
});
