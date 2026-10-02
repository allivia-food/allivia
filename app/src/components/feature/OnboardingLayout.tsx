import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, type ReactNode } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressSteps } from '@/components/ui';
import { images } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { colors, layout, spacing, typography } from '@/theme';

export type OnboardingStep = 1 | 2 | 3;

export interface OnboardingLayoutProps {
  step: OnboardingStep;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const o = layout.onboarding;

export function OnboardingLayout({
  step,
  title,
  subtitle,
  children,
  footer,
}: OnboardingLayoutProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const k = width / layout.frameWidth;

  useFocusEffect(
    useCallback(() => {
      if (step === 1) return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (router.canGoBack()) return false;
        router.replace(step === 3 ? '/step-2' : '/step-1');
        return true;
      });
      return () => sub.remove();
    }, [step]),
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Image
        source={images.onboardingWave}
        style={[styles.wave, { top: o.waveTop[step] * k, height: o.waveHeight * k }]}
        contentFit="fill"
        accessible={false}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + o.progressTop, paddingBottom: insets.bottom + spacing.xxl },
          ]}
        >
          <ProgressSteps total={3} current={step} />
          <Text style={[typography.stepLabel, styles.label]}>{strings.onboarding.step(step)}</Text>
          <Text style={[typography.formTitle, styles.title]} accessibilityRole="header">
            {title}
          </Text>
          <Text style={[typography.subtitle, styles.subtitle]}>{subtitle}</Text>
          <View style={styles.body}>{children}</View>
          <View style={styles.footer}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  wave: { position: 'absolute', left: 0, right: 0 },
  content: { paddingHorizontal: o.horizontal },
  label: { marginTop: o.progressToLabel },
  title: { marginTop: o.labelToTitle },
  subtitle: { marginTop: o.titleToSubtitle },
  body: { marginTop: o.subtitleToContent },
  footer: { marginTop: o.contentToButton, gap: spacing.md },
});
