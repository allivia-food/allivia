import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthLayout } from '@/components/feature/AuthLayout';
import { EmailCodeForm } from '@/components/feature/EmailCodeForm';
import { Button } from '@/components/ui';
import { otpKey } from '@/features/auth/emailOtp';
import {
  clearPasswordProof,
  confirmSignupCode,
  requestPasswordReset,
  resendSignupCode,
  verifyRecoveryCode,
} from '@/services/auth';
import { normalizeEmail, validateEmailField } from '@/utils/validators';
import { colors, spacing, typography } from '@/theme';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; kind?: string }>();
  const email = normalizeEmail(typeof params.email === 'string' ? params.email : '');
  const kind = params.kind === 'signup' ? 'signup' : 'recovery';
  const [busy, setBusy] = useState(false);
  const disablePrevention = usePreventRemove(busy, () => {});
  const back = () => {
    if (busy) return;
    clearPasswordProof();
    router.replace({
      pathname: kind === 'signup' ? '/register' : '/forgot-password',
      params: { email },
    });
  };
  if (validateEmailField(email))
    return (
      <AuthLayout title="Verificar e-mail" onBack={() => router.replace('/login')}>
        <Text style={styles.note}>Informe seu e-mail para receber o código.</Text>
        <Button label="Voltar para login" onPress={() => router.replace('/login')} />
      </AuthLayout>
    );
  return (
    <AuthLayout
      title={kind === 'signup' ? 'Confirme seu cadastro' : 'Verifique seu e-mail'}
      onBack={back}
    >
      <View style={styles.content}>
        {kind === 'recovery' && (
          <Text style={styles.note}>
            Se este e-mail estiver cadastrado, você receberá um código para criar uma nova senha.
          </Text>
        )}
        <EmailCodeForm
          email={email}
          cooldownKey={otpKey(kind, email)}
          onPrimary
          onBusyChange={setBusy}
          onConfirm={async (code) => {
            if (kind === 'signup') {
              await confirmSignupCode(email, code);
              setBusy(false);
              disablePrevention();
            } else {
              await verifyRecoveryCode(email, code);
              setBusy(false);
              disablePrevention();
              router.replace('/reset-password');
            }
          }}
          onResend={() =>
            kind === 'signup' ? resendSignupCode(email) : requestPasswordReset(email)
          }
        />
        <Button label="Usar outro e-mail" variant="secondary" onPress={back} disabled={busy} />
      </View>
    </AuthLayout>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  note: { ...typography.body, color: colors.textOnPrimary },
});
