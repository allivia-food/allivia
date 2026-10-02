import { router } from 'expo-router';
import { useState } from 'react';

import { OnboardingLayout } from '@/components/feature/OnboardingLayout';
import { ProfileMissing } from '@/components/feature/ProfileMissing';
import { Banner, Button, Input } from '@/components/ui';
import { strings } from '@/constants/strings';
import { profileErrorMessage } from '@/features/profile/profileErrors';
import { saveOnboardingStep } from '@/services/profile';
import { useProfileStore } from '@/store/profile';
import { normalizeDisplayName, validateDisplayName } from '@/utils/validators';

const t = strings.onboarding;

export default function OnboardingNameScreen() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const [name, setName] = useState(profile?.displayName ?? '');
  const [touched, setTouched] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!profile) return <ProfileMissing />;
  const current = profile;
  const nameError = validateDisplayName(name);

  async function next() {
    setTouched(true);
    if (nameError || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await saveOnboardingStep(
        current.id,
        { step: 1, displayName: normalizeDisplayName(name) },
        current.onboardingStep,
      );
      setProfile(saved);
      router.push('/step-2');
    } catch (error) {
      if (__DEV__) console.warn('[onboarding step 1]', error);
      setSaveError(profileErrorMessage(error, 'save'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingLayout
      step={1}
      title={t.nameTitle}
      subtitle={t.nameSubtitle}
      footer={
        <>
          {saveError ? <Banner variant="error" title={saveError} testID="step1-error" /> : null}
          <Button
            label={t.continue}
            rightIcon="arrowRightWhite"
            onPress={next}
            disabled={Boolean(nameError)}
            loading={saving}
            testID="step1-continue"
          />
        </>
      }
    >
      <Input
        icon="user"
        placeholder={t.namePlaceholder}
        value={name}
        onChangeText={setName}
        onBlur={() => {
          setName((v) => normalizeDisplayName(v));
          setTouched(true);
        }}
        error={touched && nameError ? strings.nameErrors[nameError] : undefined}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="nickname"
        maxLength={60}
        returnKeyType="next"
        onSubmitEditing={next}
        testID="step1-name"
      />
    </OnboardingLayout>
  );
}
