import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadows, sizes, spacing, typography } from '@/theme';

export const TOAST_DURATION_MS = 3000;

export interface ToastProps {
  visible: boolean;
  message: string;
  onHide: () => void;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export function Toast({
  visible,
  message,
  onHide,
  actionLabel,
  onAction,
  duration = TOAST_DURATION_MS,
}: ToastProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onHide]);

  if (!visible) return null;
  return (
    <View
      style={[styles.toast, { bottom: insets.bottom + sizes.tabBarHeight + spacing.md }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      testID="toast"
    >
      <Text style={[typography.bodySmall, styles.text]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={spacing.md}>
          <Text style={[typography.buttonSmall, styles.action]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.screenHorizontal,
    right: spacing.screenHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.secondary,
    ...shadows.card,
  },
  text: { flex: 1, color: colors.textOnPrimary },
  action: { color: colors.surfaceGreen, textDecorationLine: 'underline' },
});
