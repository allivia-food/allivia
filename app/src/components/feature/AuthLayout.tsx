import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui';
import { images } from '@/constants/icons';
import { colors, layout, opacity, spacing, typography } from '@/theme';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  variant?: 'login' | 'register';
  onBack?: () => void;
  children: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  variant = 'login',
  onBack,
  children,
}: AuthLayoutProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const k = width / layout.frameWidth;
  const v = layout.auth[variant];
  const wave = variant === 'register' ? images.registerWave : images.loginWave;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ minHeight: height }}
        >
          <Image
            source={images.splashBackground}
            style={[styles.background, { width, height: layout.auth.backgroundHeight * k }]}
            contentFit="cover"
            contentPosition="top"
            accessible={false}
          />
          <Image
            source={images.logo}
            style={[
              styles.logo,
              {
                top: v.logoTop * k,
                width: layout.auth.logoWidth * k,
                height: layout.auth.logoHeight * k,
              },
            ]}
            contentFit="contain"
            accessible={false}
          />
          <View style={[styles.waveArea, { marginTop: v.waveTop * k }]}>
            <View style={[styles.fill, { top: v.waveStraightTop * k }]} />
            <Image
              source={wave}
              style={[styles.wave, { height: v.waveHeight * k }]}
              contentFit="fill"
              accessible={false}
            />
            <View
              style={[
                styles.content,
                { paddingTop: v.contentTop * k, paddingBottom: insets.bottom + spacing.xxl },
              ]}
            >
              {subtitle ? <Text style={typography.authTitle}>{subtitle}</Text> : null}
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.header} pointerEvents="box-none">
        <ScreenHeader title={title} onBack={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  background: { position: 'absolute', top: 0, left: 0, opacity: opacity.backgroundPattern },
  logo: { position: 'absolute', alignSelf: 'center' },
  waveArea: { flexGrow: 1 },
  fill: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.primary },
  wave: { position: 'absolute', left: 0, right: 0, top: 0, transform: [{ scaleX: -1 }] },
  content: { paddingHorizontal: spacing.formHorizontal },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
});
