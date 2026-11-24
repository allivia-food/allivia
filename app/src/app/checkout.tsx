import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoNotice } from '@/components/premium/DemoNotice';
import { OptionCard } from '@/components/premium/OptionCard';
import { Banner, Button, Icon, ScreenHeader } from '@/components/ui';
import type { IconName } from '@/constants/icons';
import { images } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { authErrorKind } from '@/features/auth/authErrors';
import { DEFAULT_PLAN, isPlanId, type PaymentMethod } from '@/features/premium/plans';
import { subscribeSimulated } from '@/services/subscription';
import { useProfileStore } from '@/store/profile';
import { colors, layout, opacity, radius, shadows, sizes, spacing, typography } from '@/theme';

const t = strings.payment;
const METHODS: { id: PaymentMethod; icon: IconName }[] = [
  { id: 'card', icon: 'creditCard' },
  { id: 'pix', icon: 'pix' },
  { id: 'debit', icon: 'creditCard' },
];
export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ plan?: string }>();
  const plan = isPlanId(params.plan) ? params.plan : DEFAULT_PLAN;
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const planText = strings.premium.plans[plan];
  async function confirm() {
    if (processing || !profile) return;
    setProcessing(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, layout.premium.processingMs));
    if (!mounted.current) return;
    try {
      const updated = await subscribeSimulated(profile.id, plan);

      setProfile(updated);
      router.replace('/premium-unlocked');
    } catch (e) {
      if (__DEV__) console.warn('[payment] subscription not saved', e);
      if (!mounted.current) return;
      setProcessing(false);
      setError(authErrorKind(e) === 'network' ? strings.common.networkError : t.errors.saveFailed);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Image
        source={images.splashBackground}
        style={[StyleSheet.absoluteFill, styles.pattern]}
        contentFit="cover"
        accessible={false}
      />
      <ScreenHeader title={t.title} onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <DemoNotice />

          <Text style={typography.sectionTitle}>{t.summary}</Text>
          <View style={styles.summary} testID="payment-summary">
            <Text style={typography.sectionTitle}>{t.planTitle(planText.name)}</Text>
            <Text style={typography.sectionTitleAccent}>{planText.price}</Text>
            <Text style={typography.bodySmall}>{planText.renewal}</Text>
          </View>

          <Text style={typography.sectionTitle}>{t.method}</Text>
          <View style={styles.methods}>
            {METHODS.map((m) => (
              <OptionCard
                key={m.id}
                selected={method === m.id}
                onPress={() => {
                  setMethod(m.id);
                  setError(null);
                }}
                minHeight={layout.premium.methodOptionHeight}
                accessibilityLabel={t.methods[m.id]}
                testID={`method-${m.id}`}
              >
                <Icon name={m.icon} size={sizes.iconPayment} />
                <Text style={typography.optionLabel}>{t.methods[m.id]}</Text>
              </OptionCard>
            ))}
          </View>

          <Text style={typography.bodySmall}>{t.simulatedOnly}</Text>
          {error ? <Banner variant="error" title={error} testID="payment-error" /> : null}

          <View style={styles.footer}>
            <Icon name="lock" size={sizes.iconButton} />
            <Text style={[typography.footnote, styles.flexShrink]}>{t.footer}</Text>
          </View>

          <Button
            label={t.confirm}
            variant="accent"
            rightIcon="checkWhite"
            onPress={() => void confirm()}
            loading={processing}
            testID="payment-confirm"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pattern: { opacity: opacity.backgroundPatternLight },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  summary: {
    minHeight: layout.premium.summaryMinHeight,
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.panel,
    borderWidth: sizes.border,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  methods: { gap: spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
