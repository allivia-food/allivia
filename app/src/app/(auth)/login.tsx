import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthLayout } from '@/components/feature/AuthLayout';
import { Banner, Button, Input } from '@/components/ui';
import { strings } from '@/constants/strings';
import { authErrorMessage } from '@/features/auth/authErrors';
import { fieldErrorMessage } from '@/features/auth/fieldErrors';
import { login } from '@/services/auth';
import { colors, fontFamily, layout, sizes, spacing, typography } from '@/theme';
import { normalizeEmail, validateEmailField, validateLoginPassword } from '@/utils/validators';

const t = strings.login;
const a = layout.auth;

export default function LoginScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const emailError = validateEmailField(email);
  const passwordError = validateLoginPassword(password);
  const valid = !emailError && !passwordError;

  async function submit() {
    setTouched({ email: true, password: true });
    if (!valid || loading) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await login(email, password);
    } catch (error) {
      if (__DEV__) console.warn('[login]', error);
      setSubmitError(authErrorMessage(error));
      passwordRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={t.title}
      subtitle={t.subtitle}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
    >
      <View style={styles.fields}>
        <Input
          icon="mail"
          placeholder={strings.auth.emailPlaceholder}
          value={email}
          onChangeText={setEmail}
          onBlur={() => {
            setEmail((v) => normalizeEmail(v));
            setTouched((s) => ({ ...s, email: true }));
          }}
          error={touched.email ? fieldErrorMessage('email', emailError) : undefined}
          onPrimary
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
          testID="login-email"
        />
        <Input
          ref={passwordRef}
          icon="lock"
          placeholder={strings.auth.passwordPlaceholder}
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched((s) => ({ ...s, password: true }))}
          error={touched.password ? fieldErrorMessage('password', passwordError) : undefined}
          onPrimary
          secure
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={submit}
          testID="login-password"
        />
      </View>

      <Text
        style={styles.link}
        onPress={() =>
          router.push({ pathname: '/forgot-password', params: { email: normalizeEmail(email) } })
        }
        accessibilityRole="link"
        suppressHighlighting
      >
        {t.forgot}
      </Text>

      <View style={styles.actions}>
        {submitError ? <Banner variant="error" title={submitError} testID="login-error" /> : null}
        <Button
          label={t.submit}
          onPress={submit}
          disabled={!valid}
          loading={loading}
          testID="login-submit"
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: a.fieldGap, marginTop: a.titleToFields },
  link: {
    ...typography.link,
    color: colors.textOnPrimary,
    fontFamily: fontFamily.extraBold,
    textAlign: 'center',
    marginTop: a.fieldsToLink,
    minHeight: sizes.touchTarget,
    textAlignVertical: 'center',
  },
  actions: { gap: spacing.md, marginTop: a.linkToButton - spacing.md },
});
