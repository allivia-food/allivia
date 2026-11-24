import { router } from 'expo-router';
import { useState } from 'react';

import { OnboardingLayout } from '@/components/feature/OnboardingLayout';
import { PreferenceSelector } from '@/components/feature/PreferenceSelector';
import { ProfileMissing } from '@/components/feature/ProfileMissing';
import { Banner, Button } from '@/components/ui';
import { strings } from '@/constants/strings';
import {
  preferencesToOptions,
  preferencesToSave,
  type PreferenceOption,
} from '@/features/onboarding/selection';
import { profileErrorMessage } from '@/features/profile/profileErrors';
import { saveOnboardingStep } from '@/services/profile';
import { useProfileStore } from '@/store/profile';

const t = strings.onboarding;

export default function OnboardingPreferencesScreen() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);

  const [selected, setSelected] = useState<PreferenceOption[]>(
    preferencesToOptions(profile?.preferences ?? []),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!profile) return <ProfileMissing />;
  const current = profile;

  async function finish() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await saveOnboardingStep(
        current.id,
        { step: 3, preferences: preferencesToSave(selected) },
        current.onboardingStep,
      );
      setProfile(saved);
      setSaving(false);
      router.push('/permissions');
    } catch (error) {
      if (__DEV__) console.warn('[onboarding step 3]', error);
      setSaveError(profileErrorMessage(error, 'save'));
      setSaving(false);
    }
  }

  return (
    <OnboardingLayout
      step={3}
      title={t.preferencesTitle}
      subtitle={t.preferencesSubtitle}
      footer={
        <>
          {saveError ? <Banner variant="error" title={saveError} testID="step3-error" /> : null}
          <Button
            label="Próximo"
            rightIcon="arrowRightWhite"
            onPress={finish}
            loading={saving}
            testID="step3-finish"
          />
        </>
      }
    >
      <PreferenceSelector selected={selected} onChange={setSelected} />
    </OnboardingLayout>
  );
}
