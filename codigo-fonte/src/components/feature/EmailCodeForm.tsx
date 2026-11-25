import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Input } from '@/components/ui';
import { authErrorMessage } from '@/features/auth/authErrors';
import {
  emailOtpErrorMessage,
  isEmailOtp,
  markOtpSent,
  normalizeEmailOtp,
  otpCooldownLeft,
} from '@/features/auth/emailOtp';
import { colors, spacing, typography } from '@/theme';

export function EmailCodeForm({
  email,
  cooldownKey,
  onConfirm,
  onResend,
  onPrimary = false,
  onBusyChange,
}: {
  email: string;
  cooldownKey: string;
  onConfirm: (code: string) => Promise<void>;
  onResend: () => Promise<unknown>;
  onPrimary?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'confirm' | 'resend' | null>(null);
  const [cooldown, setCooldown] = useState(() => otpCooldownLeft(cooldownKey));
  const lock = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => setCooldown(otpCooldownLeft(cooldownKey)), 1000);
    return () => clearInterval(timer);
  }, [cooldownKey]);
  async function run(action: 'confirm' | 'resend') {
    if (
      lock.current ||
      (action === 'confirm' && !isEmailOtp(code)) ||
      (action === 'resend' && otpCooldownLeft(cooldownKey) > 0)
    )
      return;
    lock.current = true;
    setBusy(action);
    onBusyChange?.(true);
    setError(null);
    try {
      if (action === 'confirm') await onConfirm(code);
      else {
        await onResend();
        markOtpSent(cooldownKey);
        setCooldown(otpCooldownLeft(cooldownKey));
        setCode('');
      }
    } catch (failure) {
      setError(emailOtpErrorMessage(failure) || authErrorMessage(failure));
    } finally {
      lock.current = false;
      setBusy(null);
      onBusyChange?.(false);
    }
  }
  return (
    <View style={styles.content}>
      <Text style={[typography.body, onPrimary && styles.onPrimary]}>
        Digite o código de 6 dígitos enviado para {email}. Confira também a pasta de spam.
      </Text>
      <Input
        icon="lock"
        placeholder="000000"
        accessibilityLabel="Código de verificação de 6 dígitos"
        value={code}
        onChangeText={(value) => {
          setCode(normalizeEmailOtp(value));
          setError(null);
        }}
        maxLength={6}
        inputKind="digits"
        inputMode="numeric"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus
        disabled={busy !== null}
        onPrimary={onPrimary}
        returnKeyType="done"
        onSubmitEditing={() => void run('confirm')}
        testID="otp-code"
      />
      {error && <Banner variant="error" title={error} testID="otp-error" />}
      <Button
        label="Confirmar código"
        onPress={() => void run('confirm')}
        loading={busy === 'confirm'}
        disabled={busy !== null || !isEmailOtp(code)}
        testID="otp-confirm"
      />
      <Button
        label={cooldown > 0 ? `Reenviar código em ${cooldown} s` : 'Reenviar código'}
        variant="secondary"
        onPress={() => void run('resend')}
        loading={busy === 'resend'}
        disabled={busy !== null || cooldown > 0}
        testID="otp-resend"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  onPrimary: { color: colors.textOnPrimary },
});
