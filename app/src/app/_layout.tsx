import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_500Medium } from '@expo-google-fonts/nunito/500Medium';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

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
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
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
            <Stack.Screen name="scanner-camera" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="premium" />
            <Stack.Screen name="premium-unlocked" options={{ gestureEnabled: false }} />
            <Stack.Screen name="profile/edit" />
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
    </SafeAreaProvider>
  );
}
