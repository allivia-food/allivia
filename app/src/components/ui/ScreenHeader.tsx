import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/constants/strings';
import { colors, sizes, spacing, typography } from '@/theme';

import { IconButton } from './IconButton';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  tone?: 'default' | 'onImage';
}

export function ScreenHeader({ title, onBack, right, tone = 'default' }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const titleColor = tone === 'onImage' ? colors.textOnPrimary : colors.secondary;
  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.headerTop }]}>
      {onBack ? (
        <IconButton
          icon={tone === 'onImage' ? 'arrowBackWhite' : 'arrowBack'}
          iconSize={sizes.icon}
          onPress={onBack}
          accessibilityLabel={strings.common.back}
          testID="header-back"
        />
      ) : null}
      <Text
        style={[typography.headerTitle, styles.title, { color: titleColor }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: { flex: 1 },
  right: { marginLeft: 'auto' },
});
