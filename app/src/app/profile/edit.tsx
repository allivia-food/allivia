import * as ImagePicker from 'expo-image-picker';
import { ProfileAvatar } from '@/components/feature/ProfileAvatar';
import { ProfileMissing } from '@/components/feature/ProfileMissing';
import { saveAvatar } from '@/services/avatar';
import { router, usePreventRemove } from 'expo-router';
import { ProfileRow } from '@/components/feature/ProfileRow';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner, Button, Icon, Input, Modal, ScreenHeader } from '@/components/ui';
import { EmailCodeForm } from '@/components/feature/EmailCodeForm';
import { emailOtpErrorMessage, otpKey } from '@/features/auth/emailOtp';
import { strings } from '@/constants/strings';
import { fieldErrorMessage } from '@/features/auth/fieldErrors';
import { profileErrorMessage } from '@/features/profile/profileErrors';
import {
  changeEmail,
  clearPasswordProof,
  confirmPasswordChange,
  reauthenticate,
  requestPasswordChangeCode,
} from '@/services/auth';
import { updateDisplayName } from '@/services/profile';
import { useProfileStore } from '@/store/profile';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import {
  normalizeDisplayName,
  DISPLAY_NAME_MAX,
  normalizeEmail,
  validateDisplayName,
  validateEmailField,
  validateNewPassword,
} from '@/utils/validators';

const t = strings.editInfo;

export default function EditProfileScreen() {
  const profile = useProfileStore((s) => s.profile);
  return profile ? <Editor key={profile.id} profile={profile} /> : <ProfileMissing />;
}
function Editor({ profile }: { profile: import('@/services/profile').Profile }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [allowLeave, setAllowLeave] = useState(false);
  const onClose = () => router.back();
  const onSaved = (message: string) => Alert.alert('Perfil', message);
  const setProfile = useProfileStore((s) => s.setProfile);
  const [name, setName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const saveLock = useRef(false);
  useEffect(() => () => clearPasswordProof(), []);

  const nameChanged = normalizeDisplayName(name) !== profile.displayName;
  const emailChanged = normalizeEmail(email) !== profile.email;
  const passwordChanged = newPassword.length > 0;
  const needsReauth = emailChanged || passwordChanged;

  const nameError = validateDisplayName(name);
  const emailError = validateEmailField(email);
  const passwordError = passwordChanged ? validateNewPassword(newPassword) : null;
  const reauthMissing = needsReauth && currentPassword.length === 0;
  const valid = !nameError && !emailError && !passwordError && !reauthMissing;
  const changed = nameChanged || emailChanged || passwordChanged || !!photo;
  const disablePrevention = usePreventRemove(changed && !allowLeave, ({ repeat }) => {
    if (saving || verifying) return;
    Alert.alert('Descartar alterações?', 'Você tem alterações não salvas.', [
      { text: 'Continuar editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          setAllowLeave(true);
          repeat();
        },
      },
    ]);
  });
  async function pick(camera: boolean) {
    try {
      const permission = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso nas configurações do aparelho.');
        return;
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled) setPhoto(result.assets[0].uri);
    } catch {
      setError('Não foi possível abrir a foto. Tente novamente.');
    }
  }

  async function save() {
    if (!valid || !changed || saveLock.current || verificationEmail !== null) return;
    saveLock.current = true;
    setSaving(true);
    setError(null);
    try {
      if (needsReauth) await reauthenticate(profile.email, currentPassword);
      if (passwordChanged) {
        setVerificationEmail(await requestPasswordChangeCode());
        return;
      }
      await persistChanges(false);
    } catch (e) {
      const wrongPassword =
        !!e && typeof e === 'object' && 'code' in e && e.code === 'invalid_credentials';
      setError(
        wrongPassword
          ? profileErrorMessage(e, 'account')
          : emailOtpErrorMessage(e) || profileErrorMessage(e, 'account'),
      );
    } finally {
      setSaving(false);
      saveLock.current = false;
    }
  }

  async function persistChanges(passwordSaved: boolean) {
    const messages: string[] = passwordSaved ? [t.passwordSaved] : [];
    try {
      if (nameChanged) {
        setProfile(await updateDisplayName(profile.id, normalizeDisplayName(name)));
        messages.push(t.nameSaved);
      }
      if (emailChanged) {
        await changeEmail(email);
        messages.push(t.emailSent);
      }
      if (photo) {
        const saved = await saveAvatar(profile.id, photo, profile.avatarPath);
        setProfile(saved);
        setPhoto(null);
        messages.push('Foto atualizada.');
      }
      setAllowLeave(true);
      disablePrevention();
      onSaved(messages.join(' '));
      onClose();
    } catch (e) {
      setError(profileErrorMessage(e, 'account'));
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Editar perfil" onBack={onClose} />
        <View style={{ alignItems: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
            disabled={saving || verificationEmail !== null}
            onPress={() =>
              Alert.alert('Alterar foto', 'Escolha a origem da foto', [
                { text: 'Tirar foto', onPress: () => void pick(true) },
                { text: 'Escolher da galeria', onPress: () => void pick(false) },
                { text: 'Cancelar', style: 'cancel' },
              ])
            }
          >
            <ProfileAvatar path={profile.avatarPath} preview={photo} size={72 * 1.3} />
            <View style={styles.cameraBadge}>
              <Icon name="camera" size={22 * 0.8} color={colors.textPrimary} />
            </View>
          </Pressable>
        </View>
        <Input
          icon="user"
          disabled={saving || verificationEmail !== null}
          placeholder={t.name}
          value={name}
          inputKind="name"
          onChangeText={setName}
          error={nameError ? strings.nameErrors[nameError] : undefined}
          autoCapitalize="words"
          maxLength={DISPLAY_NAME_MAX}
          testID="edit-name"
        />
        <Input
          icon="mail"
          disabled={saving || verificationEmail !== null}
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
          disabled={saving || verificationEmail !== null}
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
              disabled={saving || verificationEmail !== null}
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
          disabled={!valid || !changed || verificationEmail !== null}
          loading={saving}
          testID="edit-save"
        />
        <ProfileRow
          title="Alergias e preferências"
          onPress={() => router.push('/profile/edit-preferences')}
        />
      </ScrollView>
      {verificationEmail && (
        <Modal
          visible
          title="Confirme a alteração de senha"
          testID="password-verification"
          onClose={() => {
            if (!verifying) {
              setVerificationEmail(null);
              clearPasswordProof();
            }
          }}
        >
          <Text style={typography.body}>
            Sua senha só será alterada depois de confirmar o código enviado ao e-mail atual da
            conta.
          </Text>
          <EmailCodeForm
            email={verificationEmail}
            cooldownKey={otpKey('change', verificationEmail)}
            onBusyChange={setVerifying}
            onResend={requestPasswordChangeCode}
            onConfirm={async (code) => {
              await confirmPasswordChange(code, newPassword, currentPassword);
              setNewPassword('');
              setCurrentPassword('');
              setVerificationEmail(null);
              setSaving(true);
              try {
                await persistChanges(true);
              } finally {
                setSaving(false);
              }
            }}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { marginTop: spacing.xs },
});
