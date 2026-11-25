import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type DimensionValue } from 'react-native';

import { strings } from '@/constants/strings';
import { colors, radius, shadows, sizes, spacing } from '@/theme';

export interface BottomSheetProps {
  children: ReactNode;
  minHeight: DimensionValue;
  maxHeight: DimensionValue;
  initiallyExpanded?: boolean;
  accessibilityLabel?: string;
}

export function BottomSheet({
  children,
  minHeight,
  maxHeight,
  initiallyExpanded = false,
  accessibilityLabel,
}: BottomSheetProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  return (
    <View style={[styles.sheet, { height: expanded ? maxHeight : minHeight }]}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? strings.common.toggleSheet}
        accessibilityState={{ expanded }}
        hitSlop={spacing.md}
        style={styles.handleArea}
        testID="bottom-sheet-handle"
      >
        <View style={styles.handle} />
      </Pressable>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderWidth: sizes.border,
    borderColor: colors.border,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    ...shadows.card,
  },
  handleArea: { alignItems: 'center', paddingTop: sizes.sheetHandleTop, paddingBottom: spacing.sm },
  handle: {
    width: sizes.sheetHandleWidth,
    height: sizes.sheetHandleHeight,
    borderRadius: radius.progress,
    backgroundColor: colors.border,
  },
  content: { flex: 1 },
});
