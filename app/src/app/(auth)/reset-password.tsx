import { router, usePreventRemove } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthLayout } from '@/components/feature/AuthLayout';
import { Banner, Button, Input } from '@/components/ui';
import { emailOtpErrorMessage } from '@/features/auth/emailOtp';
import { authErrorMessage } from '@/features/auth/authErrors';
import { fieldErrorMessage } from '@/features/auth/fieldErrors';
import { clearPasswordProof, completePasswordRecovery, hasRecoveryProof } from '@/services/auth';
import { validateConfirmation, validateNewPassword } from '@/utils/validators';
import { colors, spacing, typography } from '@/theme';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  useEffect(() => () => clearPasswordProof(), []);
  const disablePrevention = usePreventRemove(busy, () => {});
  const passwordError = validateNewPassword(password);
  const confirmationError = validateConfirmation(password, confirmation);
  async function save() {
    if (passwordError || confirmationError || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await completePasswordRecovery(password);
      setPassword('');
      setConfirmation('');
      setSuccess(true);
      disablePrevention();
    } catch (failure) {
      setError(emailOtpErrorMessage(failure) || authErrorMessage(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const back = () => {
    if (!busy) {
      clearPasswordProof();
      router.replace('/login');
    }
  };
  return (
    <AuthLayout title={success ? 'Senha atualizada' : 'Crie uma nova senha'} onBack={back}>
      <View style={styles.content}>
        {success ? (
          <>
            <Text style={styles.note}>
              Sua senha foi alterada. Entre na conta com a nova senha.
            </Text>
            <Button label="Voltar para login" onPress={back} testID="reset-success-login" />
          </>
        ) : !hasRecoveryProof() ? (
          <>
            <Text style={styles.note}>
              Verifique seu e-mail antes de definir a nova senha. Se você fechou o aplicativo,
              solicite um novo código.
            </Text>
            <Button
              label="Solicitar novo código"
              onPress={() => router.replace('/forgot-password')}
            />
          </>
        ) : (
          <>
            <Text style={styles.note}>Use pelo menos 8 caracteres, incluindo letra e número.</Text>
            <Input
              icon="lock"
              placeholder="Nova senha"
              secure
              value={password}
              onChangeText={setPassword}
              error={password.length ? fieldErrorMessage('newPassword', passwordError) : undefined}
              autoComplete="new-password"
              textContentType="newPassword"
              disabled={busy}
              testID="reset-password"
            />
            <Input
              icon="lockConfirm"
              placeholder="Confirmar nova senha"
              secure
              value={confirmation}
              onChangeText={setConfirmation}
              error={
                confirmation.length
                  ? fieldErrorMessage('confirmation', confirmationError)
                  : undefined
              }
              autoComplete="new-password"
              textContentType="newPassword"
              disabled={busy}
              onSubmitEditing={() => void save()}
              testID="reset-confirmation"
            />
            {error && <Banner variant="error" title={error} testID="reset-error" />}
            <Button
              label="Salvar nova senha"
              onPress={() => void save()}
              loading={busy}
              disabled={!!passwordError || !!confirmationError}
              testID="reset-submit"
            />
          </>
        )}
      </View>
    </AuthLayout>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  note: { ...typography.body, color: colors.textOnPrimary },
});
