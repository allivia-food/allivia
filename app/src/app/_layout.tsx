import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { startSessionListener } from '@/features/auth/sessionListener';
import { queryClient } from '@/services/queryClient';
import { useSessionStore } from '@/store/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const status = useSessionStore((s) => s.status);

  useEffect(() => startSessionListener(), []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />

        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        </Stack.Protected>

        <Stack.Protected guard={status === 'onboarding'}>
          <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
        </Stack.Protected>

        <Stack.Protected guard={status === 'ready'}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="recipe/[id]" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="scanner-result" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="premium-unlocked" options={{ gestureEnabled: false }} />
          <Stack.Screen name="profile/edit-preferences" />
          <Stack.Screen name="profile/terms" />
          <Stack.Screen name="profile/privacy" />
          <Stack.Screen name="profile/help" />
        </Stack.Protected>

        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="dev/componentes" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
