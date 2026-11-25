import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/constants/icons';
import { colors, radius, sizes, spacing, typography } from '@/theme';

import { Icon } from './Icon';

export type BannerVariant = 'success' | 'warning' | 'error' | 'info';

export interface BannerProps {
  variant: BannerVariant;
  title: string;
  children?: ReactNode;
  icon?: IconName;
  testID?: string;
}

const palette: Record<
  BannerVariant,
  { background: string; border: string; title: string; icon: IconName; tint?: string }
> = {
  success: {
    background: colors.surfaceGreen,
    border: colors.secondary,
    title: colors.success,
    icon: 'shieldCheck',
  },
  warning: {
    background: colors.surfaceOrange,
    border: colors.warning,
    title: colors.primary,
    icon: 'warning',
    tint: colors.primary,
  },
  error: {
    background: colors.surfaceOrange,
    border: colors.primary,
    title: colors.error,
    icon: 'warning',
  },
  info: {
    background: colors.surface,
    border: colors.primary,
    title: colors.textPrimary,
    icon: 'lightbulb',
  },
};

export function Banner({ variant, title, children, icon, testID }: BannerProps) {
  const p = palette[variant];
  return (
    <View
      style={[styles.box, { backgroundColor: p.background, borderColor: p.border }]}
      accessibilityRole={variant === 'error' || variant === 'warning' ? 'alert' : 'summary'}
      testID={testID}
    >
      <View style={styles.header}>
        <Icon name={icon ?? p.icon} size={sizes.iconBanner} color={p.tint} />
        <Text style={[typography.bannerTitle, styles.title, { color: p.title }]}>{title}</Text>
      </View>
      {typeof children === 'string' ? (
        <Text style={typography.bodySmall}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: sizes.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
});
