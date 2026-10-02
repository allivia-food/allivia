import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthLayout } from '@/components/feature/AuthLayout';
import { Banner, Button, Input } from '@/components/ui';
import { strings } from '@/constants/strings';
import { authErrorMessage } from '@/features/auth/authErrors';
import { fieldErrorMessage } from '@/features/auth/fieldErrors';
import { markResetSent, resetCooldownLeft } from '@/features/auth/resetCooldown';
import { requestPasswordReset } from '@/services/auth';
import { colors, layout, spacing, typography } from '@/theme';
import { normalizeEmail, validateEmailField } from '@/utils/validators';

const t = strings.forgot;

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(resetCooldownLeft());

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown(resetCooldownLeft()), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const emailError = validateEmailField(email);

  async function submit() {
    setTouched(true);
    if (emailError || loading || cooldown > 0) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await requestPasswordReset(email);
      markResetSent();
      setCooldown(resetCooldownLeft());
      router.push('/request-sent');
    } catch (error) {
      if (__DEV__) console.warn('[forgot-password]', error);
      setSubmitError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={t.title}
      subtitle={t.subtitle}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
    >
      <View style={styles.fields}>
        <Input
          icon="mail"
          placeholder={strings.auth.emailPlaceholder}
          value={email}
          onChangeText={setEmail}
          onBlur={() => {
            setEmail((v) => normalizeEmail(v));
            setTouched(true);
          }}
          error={touched ? fieldErrorMessage('email', emailError) : undefined}
          onPrimary
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={submit}
          testID="forgot-email"
        />
      </View>
      <View style={styles.actions}>
        {submitError ? <Banner variant="error" title={submitError} testID="forgot-error" /> : null}
        {cooldown > 0 ? (
          <Text style={styles.cooldown} accessibilityLiveRegion="polite">
            {t.cooldown(cooldown)}
          </Text>
        ) : null}
        <Button
          label={t.submit}
          onPress={submit}
          disabled={Boolean(emailError) || cooldown > 0}
          loading={loading}
          testID="forgot-submit"
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  fields: { marginTop: layout.auth.titleToFields },
  actions: { gap: spacing.md, marginTop: layout.auth.linkToButton },
  cooldown: { ...typography.subtitle, color: colors.textOnPrimary, textAlign: 'center' },
});
