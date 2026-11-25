import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@/theme';

export interface ChipGroupProps {
  children: ReactNode;
  inset?: number;
  accessibilityLabel?: string;
}

export function ChipGroup({
  children,
  inset = spacing.screenHorizontal,
  accessibilityLabel,
}: ChipGroupProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, alignItems: 'center' },
});
