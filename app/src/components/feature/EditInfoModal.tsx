import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Banner, Button, Input, Modal } from '@/components/ui';
import { strings } from '@/constants/strings';
import { fieldErrorMessage } from '@/features/auth/fieldErrors';
import { profileErrorMessage } from '@/features/profile/profileErrors';
import { changeEmail, changePassword, reauthenticate } from '@/services/auth';
import { updateDisplayName, type Profile } from '@/services/profile';
import { useProfileStore } from '@/store/profile';
import { spacing, typography } from '@/theme';
import {
  normalizeDisplayName,
  normalizeEmail,
  validateDisplayName,
  validateEmailField,
  validateNewPassword,
} from '@/utils/validators';

export interface EditInfoModalProps {
  visible: boolean;
  profile: Profile;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const t = strings.editInfo;

export function EditInfoModal({ visible, profile, onClose, onSaved }: EditInfoModalProps) {
  const setProfile = useProfileStore((s) => s.setProfile);
  const [name, setName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const nameChanged = normalizeDisplayName(name) !== profile.displayName;
  const emailChanged = normalizeEmail(email) !== profile.email;
  const passwordChanged = newPassword.length > 0;
  const needsReauth = emailChanged || passwordChanged;

  const nameError = validateDisplayName(name);
  const emailError = validateEmailField(email);
  const passwordError = passwordChanged ? validateNewPassword(newPassword) : null;
  const reauthMissing = needsReauth && currentPassword.length === 0;
  const valid = !nameError && !emailError && !passwordError && !reauthMissing;
  const changed = nameChanged || emailChanged || passwordChanged;

  async function save() {
    if (!valid || !changed || saving) return;
    setSaving(true);
    setError(null);
    const messages: string[] = [];
    try {
      if (needsReauth) await reauthenticate(profile.email, currentPassword);
      if (nameChanged) {
        setProfile(await updateDisplayName(profile.id, normalizeDisplayName(name)));
        messages.push(t.nameSaved);
      }
      if (passwordChanged) {
        await changePassword(newPassword);
        messages.push(t.passwordSaved);
      }
      if (emailChanged) {
        await changeEmail(email);
        messages.push(t.emailSent);
      }
      onSaved(messages.join(' '));
      onClose();
    } catch (e) {
      if (__DEV__) console.warn('[edit info]', e);
      setError(profileErrorMessage(e, 'account'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} title={t.title} testID="edit-info">
      <Input
        icon="user"
        placeholder={t.name}
        value={name}
        onChangeText={setName}
        error={nameError ? strings.nameErrors[nameError] : undefined}
        autoCapitalize="words"
        maxLength={60}
        testID="edit-name"
      />
      <Input
        icon="mail"
        placeholder={t.email}
        value={email}
        onChangeText={setEmail}
        error={fieldErrorMessage('email', emailError)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        testID="edit-email"
      />
      <Input
        icon="lock"
        placeholder={t.newPassword}
        value={newPassword}
        onChangeText={setNewPassword}
        error={fieldErrorMessage('newPassword', passwordError)}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        testID="edit-new-password"
      />
      {needsReauth ? (
        <>
          <Text style={[typography.bodySmall, styles.hint]}>{t.currentPasswordHint}</Text>
          <Input
            icon="lockConfirm"
            placeholder={t.currentPassword}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secure
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            testID="edit-current-password"
          />
        </>
      ) : null}
      {error ? <Banner variant="error" title={error} testID="edit-error" /> : null}
      <Button
        label={t.save}
        onPress={save}
        disabled={!valid || !changed}
        loading={saving}
        testID="edit-save"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: spacing.xs },
});
