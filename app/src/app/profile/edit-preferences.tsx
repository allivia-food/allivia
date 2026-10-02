import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AllergySelector } from '@/components/feature/AllergySelector';
import { PreferenceSelector } from '@/components/feature/PreferenceSelector';
import { ProfileMissing } from '@/components/feature/ProfileMissing';
import { Banner, Button, Modal, ScreenHeader } from '@/components/ui';
import type { AllergenId } from '@/constants/allergens';
import { strings } from '@/constants/strings';
import {
  preferencesToOptions,
  preferencesToSave,
  selectedAllergyCount,
  type PreferenceOption,
} from '@/features/onboarding/selection';
import { profileErrorMessage } from '@/features/profile/profileErrors';
import { updateAllergiesAndPreferences } from '@/services/profile';
import { queryClient } from '@/services/queryClient';
import { useProfileStore } from '@/store/profile';
import { colors, spacing, typography } from '@/theme';

const t = strings.editRestrictions;

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

export default function EditPreferencesScreen() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const navigation = useNavigation();
  const [allergies, setAllergies] = useState<AllergenId[]>(profile?.allergies ?? []);
  const [custom, setCustom] = useState<string[]>(profile?.customAllergies ?? []);
  const [prefs, setPrefs] = useState<PreferenceOption[]>(
    preferencesToOptions(profile?.preferences ?? []),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const pendingLeave = useRef<(() => void) | null>(null);

  const dirty =
    !!profile &&
    (!sameSet(allergies, profile.allergies) ||
      !sameSet(custom, profile.customAllergies) ||
      !sameSet(preferencesToSave(prefs), profile.preferences));
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!dirtyRef.current) return;
        e.preventDefault();
        pendingLeave.current = () => navigation.dispatch(e.data.action);
        setConfirmLeave(true);
      }),
    [navigation],
  );

  if (!profile) return <ProfileMissing />;
  const current = profile;
  const count = selectedAllergyCount(allergies, custom);

  async function save() {
    if (count === 0 || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await updateAllergiesAndPreferences(
        current.id,
        allergies,
        custom,
        preferencesToSave(prefs),
      );
      dirtyRef.current = false;
      setProfile(saved);
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      router.back();
    } catch (error) {
      if (__DEV__) console.warn('[edit restrictions]', error);
      setSaveError(profileErrorMessage(error, 'save'));
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScreenHeader
        title={t.title}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={typography.sectionTitle}>{t.allergies}</Text>
        <AllergySelector
          allergies={allergies}
          customAllergies={custom}
          onChange={(a, c) => {
            setAllergies(a);
            setCustom(c);
          }}
        />
        <Text style={[typography.sectionTitle, styles.section]}>{t.preferences}</Text>
        <PreferenceSelector selected={prefs} onChange={setPrefs} />
      </ScrollView>
      <View style={styles.footer}>
        {saveError ? (
          <Banner variant="error" title={saveError} testID="restrictions-error" />
        ) : null}
        <Button
          label={t.save}
          onPress={save}
          disabled={count === 0 || !dirty}
          loading={saving}
          testID="restrictions-save"
        />
      </View>

      <Modal
        visible={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title={t.discardTitle}
        testID="discard"
      >
        <Text style={[typography.subtitle, styles.center]}>{t.discardMessage}</Text>
        <Button
          label={t.discard}
          variant="danger"
          onPress={() => {
            setConfirmLeave(false);
            dirtyRef.current = false;
            pendingLeave.current?.();
          }}
          testID="discard-confirm"
        />
        <Button
          label={t.keepEditing}
          variant="secondary"
          onPress={() => setConfirmLeave(false)}
          testID="discard-cancel"
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  section: { marginTop: spacing.lg },
  footer: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  center: { textAlign: 'center' },
});
