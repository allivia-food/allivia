import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Banner, Button, IconBadge, Input, Modal } from '@/components/ui';
import { strings } from '@/constants/strings';
import { profileErrorMessage } from '@/features/profile/profileErrors';
import { signOutAndClear } from '@/features/profile/signOut';
import { reauthenticate } from '@/services/auth';
import { deleteAccount } from '@/services/profile';
import { colors, spacing, typography } from '@/theme';

export interface DeleteAccountModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
}

const t = strings.deleteAccount;

export function DeleteAccountModal({ visible, email, onClose }: DeleteAccountModalProps) {
  const [askPassword, setAskPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    if (!askPassword) {
      setAskPassword(true);
      return;
    }
    if (password.length === 0 || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await reauthenticate(email, password);
    } catch (e) {
      setError(profileErrorMessage(e, 'account'));
      setDeleting(false);
      return;
    }
    try {
      await deleteAccount();
    } catch (e) {
      if (__DEV__) console.warn('[delete account]', e);
      setError(profileErrorMessage(e, 'delete'));
      setDeleting(false);
      return;
    }
    await signOutAndClear(true).catch(() => {});
  }

  return (
    <Modal visible={visible} onClose={onClose} title={t.title} testID="delete-account">
      <View style={styles.icon}>
        <IconBadge icon="warning" size="large" />
      </View>
      <Text style={[typography.subtitle, styles.center]}>{t.question}</Text>
      <Text style={[typography.bodySmall, styles.center, styles.warning]}>{t.warning}</Text>
      {askPassword ? (
        <>
          <Text style={[typography.bodySmall, styles.center]}>{t.passwordHint}</Text>
          <Input
            icon="lock"
            placeholder={t.password}
            value={password}
            onChangeText={setPassword}
            secure
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            autoFocus
            testID="delete-password"
          />
        </>
      ) : null}
      {error ? <Banner variant="error" title={error} testID="delete-error" /> : null}
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button label={t.cancel} variant="secondary" onPress={onClose} testID="delete-cancel" />
        </View>
        <View style={styles.action}>
          <Button
            label={t.confirm}
            variant="danger"
            onPress={confirm}
            disabled={askPassword && password.length === 0}
            loading={deleting}
            testID="delete-confirm"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center' },
  center: { textAlign: 'center' },
  warning: { color: colors.error },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  action: { flex: 1 },
});
