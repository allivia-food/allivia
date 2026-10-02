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
import { completeOnboarding } from '@/services/profile';
import { useProfileStore } from '@/store/profile';
import { useSessionStore } from '@/store/session';

const t = strings.onboarding;

export default function OnboardingPreferencesScreen() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const setStatus = useSessionStore((s) => s.setStatus);
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
      const saved = await completeOnboarding(current.id, preferencesToSave(selected));
      setProfile(saved);
      setStatus('ready', saved.onboardingStep);
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
            label={t.finish}
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
