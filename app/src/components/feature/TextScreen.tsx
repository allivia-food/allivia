import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconBadge, ScreenHeader } from '@/components/ui';
import type { IconName } from '@/constants/icons';
import { colors, spacing, typography } from '@/theme';

export interface TextScreenProps {
  title: string;
  icon: IconName;
  paragraphs: readonly string[];
  iconTone?: 'white' | 'green';
  children?: ReactNode;
}

export function TextScreen({
  title,
  icon,
  paragraphs,
  iconTone = 'white',
  children,
}: TextScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScreenHeader
        title={title}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.icon}>
          <IconBadge icon={icon} size="large" color={colors.secondary} tone={iconTone} />
        </View>
        {paragraphs.map((p) => (
          <Text key={p} style={typography.subtitle}>
            {p}
          </Text>
        ))}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  icon: { alignItems: 'center', marginVertical: spacing.md },
});
