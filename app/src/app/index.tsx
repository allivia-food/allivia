import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { StateView } from '@/components/ui';
import { images } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { isResolved, routeForStatus } from '@/features/auth/sessionRouting';
import { retrySession } from '@/features/auth/sessionListener';
import { useSessionStore } from '@/store/session';
import { colors, layout, opacity } from '@/theme';

export const SPLASH_MIN_MS = 1500;
export const SPLASH_MAX_MS = 8000;

let shownOnce = false;

export default function SplashRoute() {
  const status = useSessionStore((s) => s.status);
  const onboardingStep = useSessionStore((s) => s.onboardingStep);
  const [minElapsed, setMinElapsed] = useState(shownOnce);
  const [timedOut, setTimedOut] = useState(false);
  const { width } = useWindowDimensions();
  const k = width / layout.frameWidth;

  useEffect(() => {
    const min = setTimeout(() => {
      shownOnce = true;
      setMinElapsed(true);
    }, SPLASH_MIN_MS);
    const max = setTimeout(() => setTimedOut(true), SPLASH_MAX_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
    };
  }, []);

  useEffect(() => {
    if (minElapsed && isResolved(status)) {
      router.replace(routeForStatus(status, onboardingStep));
    }
  }, [minElapsed, status, onboardingStep]);

  const failed = status === 'error' || (timedOut && status === 'loading');

  return (
    <View style={styles.screen} accessibilityLabel={strings.splash.a11yLabel}>
      <StatusBar style="dark" />
      <Image
        source={images.splashBackground}
        style={[StyleSheet.absoluteFill, styles.background]}
        contentFit="cover"
      />
      {failed ? (
        <View style={styles.error}>
          <StateView
            variant="error"
            message={status === 'error' ? strings.common.networkError : strings.splash.timeout}
            onRetry={() => {
              setTimedOut(false);
              void retrySession();
            }}
          />
        </View>
      ) : (
        <Image
          source={images.splashLogo}
          style={{ width: layout.splash.logoWidth * k, height: layout.splash.logoHeight * k }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: { opacity: opacity.backgroundPattern },
  error: { ...StyleSheet.absoluteFill, backgroundColor: colors.background },
});
