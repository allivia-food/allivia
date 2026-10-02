import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthLayout } from '@/components/feature/AuthLayout';
import { LegalModal, type LegalDocument } from '@/components/feature/LegalModal';
import { Banner, Button, Checkbox, Input } from '@/components/ui';
import { strings } from '@/constants/strings';
import { authErrorKind, authErrorMessage } from '@/features/auth/authErrors';
import { fieldErrorMessage } from '@/features/auth/fieldErrors';
import { register } from '@/services/auth';
import { colors, fontFamily, layout, spacing, typography } from '@/theme';
import {
  checkPasswordRules,
  normalizeEmail,
  validateConfirmation,
  validateEmailField,
  validateNewPassword,
} from '@/utils/validators';

const t = strings.register;
const a = layout.auth;

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, confirmation: false });
  const [legal, setLegal] = useState<LegalDocument | null>(null);
  const [submitError, setSubmitError] = useState<{ message: string; emailTaken: boolean } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);

  const emailError = validateEmailField(email);
  const passwordError = validateNewPassword(password);
  const confirmationError = validateConfirmation(password, confirmation);
  const rules = checkPasswordRules(password);
  const valid =
    !emailError && !passwordError && !confirmationError && acceptedTerms && acceptedPrivacy;

  async function submit() {
    setTouched({ email: true, password: true, confirmation: true });
    if (!valid || loading) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await register(email, password);
    } catch (error) {
      if (__DEV__) console.warn('[register]', error);
      setSubmitError({
        message: authErrorMessage(error),
        emailTaken: authErrorKind(error) === 'emailTaken',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={t.title}
      subtitle={t.subtitle}
      variant="register"
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
          testID="register-email"
        />
        <View style={styles.passwordBlock}>
          <Input
            ref={passwordRef}
            icon="lock"
            placeholder={strings.auth.passwordPlaceholder}
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouched((s) => ({ ...s, password: true }))}
            error={touched.password ? fieldErrorMessage('newPassword', passwordError) : undefined}
            onPrimary
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmationRef.current?.focus()}
            submitBehavior="submit"
            testID="register-password"
          />
          <View style={styles.rules} accessibilityLiveRegion="polite">
            <Rule ok={rules.minLength} label={t.ruleLength} />
            <Rule ok={rules.letterAndNumber} label={t.ruleLetterNumber} />
          </View>
        </View>
        <Input
          ref={confirmationRef}
          icon="lockConfirm"
          placeholder={strings.auth.confirmPlaceholder}
          value={confirmation}
          onChangeText={setConfirmation}
          onBlur={() => setTouched((s) => ({ ...s, confirmation: true }))}
          error={
            touched.confirmation ? fieldErrorMessage('confirmation', confirmationError) : undefined
          }
          onPrimary
          secure
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
          testID="register-confirmation"
        />
      </View>

      <View style={styles.checks}>
        <Checkbox
          checked={acceptedTerms}
          onToggle={() => setAcceptedTerms((v) => !v)}
          label={t.termsLabel}
          linkText={t.termsLink}
          onLinkPress={() => setLegal('terms')}
          textColor={colors.textOnPrimary}
          testID="register-terms"
        />
        <Checkbox
          checked={acceptedPrivacy}
          onToggle={() => setAcceptedPrivacy((v) => !v)}
          label={t.privacyLabel}
          linkText={t.privacyLink}
          onLinkPress={() => setLegal('privacy')}
          textColor={colors.textOnPrimary}
          testID="register-privacy"
        />
      </View>

      <View style={styles.actions}>
        {submitError ? (
          <Banner variant="error" title={submitError.message} testID="register-error">
            {submitError.emailTaken ? (
              <Text
                style={styles.loginLink}
                onPress={() =>
                  router.replace({ pathname: '/login', params: { email: normalizeEmail(email) } })
                }
                accessibilityRole="link"
              >
                {t.goToLogin}
              </Text>
            ) : null}
          </Banner>
        ) : null}
        <Button
          label={t.submit}
          onPress={submit}
          disabled={!valid}
          loading={loading}
          testID="register-submit"
        />
      </View>

      <LegalModal document={legal} onClose={() => setLegal(null)} />
    </AuthLayout>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Text
      style={[styles.rule, ok && styles.ruleOk]}
      accessibilityLabel={`${label}: ${ok ? 'atendido' : 'pendente'}`}
    >
      {ok ? '✓' : '○'} {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  fields: { gap: a.fieldGap, marginTop: a.titleToFields },
  passwordBlock: { gap: spacing.xs },
  rules: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg },
  rule: { ...typography.bodySmall, color: colors.textOnPrimary },
  ruleOk: { fontFamily: fontFamily.extraBold },
  checks: { gap: a.checkGap, marginTop: a.fieldsToChecks, paddingLeft: spacing.xl },
  actions: { gap: spacing.md, marginTop: a.checksToButton },
  loginLink: { ...typography.link, color: colors.secondary },
});
