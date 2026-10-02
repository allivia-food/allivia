import { router } from 'expo-router';
import { useState } from 'react';

import { AllergySelector } from '@/components/feature/AllergySelector';
import { OnboardingLayout } from '@/components/feature/OnboardingLayout';
import { ProfileMissing } from '@/components/feature/ProfileMissing';
import { Banner, Button } from '@/components/ui';
import type { AllergenId } from '@/constants/allergens';
import { strings } from '@/constants/strings';
import { selectedAllergyCount } from '@/features/onboarding/selection';
import { profileErrorMessage } from '@/features/profile/profileErrors';
import { saveOnboardingStep } from '@/services/profile';
import { useProfileStore } from '@/store/profile';

const t = strings.onboarding;

export default function OnboardingAllergiesScreen() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const [allergies, setAllergies] = useState<AllergenId[]>(profile?.allergies ?? []);
  const [custom, setCustom] = useState<string[]>(profile?.customAllergies ?? []);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!profile) return <ProfileMissing />;
  const current = profile;
  const count = selectedAllergyCount(allergies, custom);

  async function next() {
    if (count === 0 || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await saveOnboardingStep(
        current.id,
        { step: 2, allergies, customAllergies: custom },
        current.onboardingStep,
      );
      setProfile(saved);
      router.push('/step-3');
    } catch (error) {
      if (__DEV__) console.warn('[onboarding step 2]', error);
      setSaveError(profileErrorMessage(error, 'save'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingLayout
      step={2}
      title={t.allergiesTitle}
      subtitle={t.allergiesSubtitle}
      footer={
        <>
          {saveError ? <Banner variant="error" title={saveError} testID="step2-error" /> : null}
          <Button
            label={t.advance(count)}
            rightIcon="arrowRightWhite"
            onPress={next}
            disabled={count === 0}
            loading={saving}
            testID="step2-continue"
          />
        </>
      }
    >
      <AllergySelector
        allergies={allergies}
        customAllergies={custom}
        onChange={(a, c) => {
          setAllergies(a);
          setCustom(c);
        }}
      />
    </OnboardingLayout>
  );
}
