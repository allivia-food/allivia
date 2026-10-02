import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { strings } from '@/constants/strings';
import { colors, spacing, typography } from '@/theme';

import { Button } from './Button';

export type StateViewVariant = 'loading' | 'empty' | 'error' | 'offline';

export interface StateViewProps {
  variant: StateViewVariant;
  message?: string;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const defaults: Record<StateViewVariant, string> = {
  loading: strings.common.loading,
  empty: strings.common.empty,
  error: strings.common.unknownError,
  offline: strings.common.offline,
};

export function StateView({ variant, message, onRetry, actionLabel, onAction }: StateViewProps) {
  const text = message ?? defaults[variant];
  return (
    <View style={styles.container} accessibilityLiveRegion="polite" testID={`state-${variant}`}>
      {variant === 'loading' ? <ActivityIndicator color={colors.primary} size="large" /> : null}
      <Text style={[typography.subtitle, styles.text]}>{text}</Text>
      {(variant === 'error' || variant === 'offline') && onRetry ? (
        <Button label={strings.common.retry} onPress={onRetry} variant="primary" />
      ) : null}
      {variant === 'empty' && actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.formHorizontal,
  },
  text: { textAlign: 'center' },
});
