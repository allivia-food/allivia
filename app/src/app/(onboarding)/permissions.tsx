import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { OnboardingLayout } from '@/components/feature/OnboardingLayout';
import { ProfileMissing } from '@/components/feature/ProfileMissing';
import { Banner, Button, SelectableTile } from '@/components/ui';
import { profileErrorMessage } from '@/features/profile/profileErrors';
import { completeOnboarding } from '@/services/profile';
import { useProfileStore } from '@/store/profile';
import { useSessionStore } from '@/store/session';
import { spacing, typography } from '@/theme';

export default function PermissionsScreen() {
  const profile = useProfileStore((s) => s.profile);
  const [camera, setCamera] = useState(true);
  const [location, setLocation] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  if (!profile) return <ProfileMissing />;
  const current = profile;
  async function finish(skip: boolean) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const saved = await completeOnboarding(current.id, current.preferences);
      if (!skip) {
        if (camera) {
          try {
            await Camera.requestCameraPermissionsAsync();
          } catch (e) {
            if (__DEV__) console.warn('[permissions] camera', e);
          }
        }
        if (location) {
          try {
            await Location.requestForegroundPermissionsAsync();
          } catch (e) {
            if (__DEV__) console.warn('[permissions] location', e);
          }
        }
      }
      useProfileStore.getState().setProfile(saved);
      useSessionStore.getState().setStatus('ready', saved.onboardingStep);
    } catch (e) {
      setError(profileErrorMessage(e, 'save'));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <OnboardingLayout
      step={3}
      permissions
      title="Permissões"
      subtitle="Escolha os acessos que ajudam você a usar o Allivia."
      footer={
        <>
          {error ? <Banner variant="error" title={error} /> : null}
          <Button
            label="Concluir"
            onPress={() => void finish(false)}
            loading={busy}
            testID="permissions-finish"
          />
          <Button
            label="Agora não"
            variant="secondary"
            onPress={() => void finish(true)}
            disabled={busy}
            testID="permissions-skip"
          />
        </>
      }
    >
      <View style={{ gap: spacing.md }}>
        <SelectableTile
          showCheck
          label="Câmera"
          selected={camera}
          onPress={() => setCamera(!camera)}
          disabled={busy}
          testID="permission-camera"
        />
        <Text style={typography.bodySmall}>Para ler códigos de barras no scanner.</Text>
        <SelectableTile
          showCheck
          label="Localização"
          icon="mapPin"
          selected={location}
          onPress={() => setLocation(!location)}
          disabled={busy}
          testID="permission-location"
        />
        <Text style={typography.bodySmall}>Para encontrar restaurantes próximos de você.</Text>
      </View>
    </OnboardingLayout>
  );
}
