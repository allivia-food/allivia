import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/theme';

export interface ProgressStepsProps {
  total: number;
  current: number;
}

export function ProgressSteps({ total, current }: ProgressStepsProps) {
  const filled = Math.min(Math.max(current, 0), total);
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: filled }}
      accessibilityLabel={`Passo ${filled} de ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          testID={`progress-step-${i + 1}`}
          style={[styles.bar, { backgroundColor: i < filled ? colors.primary : colors.border }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.progressGap, alignSelf: 'stretch' },
  bar: { flex: 1, height: sizes.progressHeight, borderRadius: radius.progress },
});
