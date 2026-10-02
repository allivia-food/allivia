import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, IconBadge } from '@/components/ui';
import { images } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { DEFAULT_PLAN, type PlanId } from '@/features/premium/plans';
import { colors, layout, opacity, radius, shadows, sizes, spacing, typography } from '@/theme';

import { DemoNotice } from './DemoNotice';
import { OptionCard } from './OptionCard';

const t = strings.premium;
const p = layout.premium;
const PLAN_ORDER: PlanId[] = ['annual', 'monthly'];

export function PremiumPlan() {
  const [plan, setPlan] = useState<PlanId>(DEFAULT_PLAN);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen} testID="premium-plan">
      <Image
        source={images.splashBackground}
        style={[StyleSheet.absoluteFill, styles.pattern]}
        contentFit="cover"
        accessible={false}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.header}>
          <Text style={[typography.screenTitle, styles.flex]} accessibilityRole="header">
            {t.title}
          </Text>
          <View style={styles.badge}>
            <Text style={[typography.bannerTitle, styles.badgeText]}>{t.badge}</Text>
            <Icon name="premium" size={sizes.iconPremiumBadge} />
          </View>
        </View>
        <Text style={[typography.subtitle, styles.subtitle]}>{t.subtitle}</Text>

        <Image
          source={images.premiumIllustration}
          style={styles.illustration}
          contentFit="contain"
          accessibilityLabel={t.illustration}
        />

        <View style={styles.benefits}>
          {t.benefits.map((b) => (
            <View key={b.title} style={styles.benefit}>
              <IconBadge icon={b.icon} size="benefit" tone="green" />
              <View style={styles.flex}>
                <Text style={typography.sectionTitle}>{b.title}</Text>
                <Text style={typography.bodySmall}>{b.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={typography.sectionTitle}>{t.choosePlan}</Text>
          {PLAN_ORDER.map((id) => (
            <OptionCard
              key={id}
              selected={plan === id}
              onPress={() => setPlan(id)}
              minHeight={p.planOptionHeight}
              accessibilityLabel={`${t.plans[id].name}, ${t.plans[id].price}`}
              testID={`plan-${id}`}
            >
              <View>
                <Text style={typography.sectionTitle}>{t.plans[id].name}</Text>
                <Text style={typography.bodySmall}>{t.plans[id].price}</Text>
              </View>
            </OptionCard>
          ))}
        </View>

        <Button
          label={t.continue}
          rightIcon="arrowRightWhite"
          onPress={() => router.push({ pathname: '/checkout', params: { plan } })}
          testID="plan-continue"
        />
        <DemoNotice />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pattern: { opacity: opacity.backgroundPatternLight },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.premiumBadgeHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceOrange,
  },
  badgeText: { color: colors.primary },
  subtitle: { marginTop: -spacing.lg, maxWidth: p.subtitleWidth },
  illustration: {
    alignSelf: 'center',
    width: p.illustrationWidth,
    height: p.illustrationHeight,
  },
  benefits: { gap: spacing.xl },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  panel: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.panel,
    borderWidth: sizes.border,
    borderColor: colors.textSecondary,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
});
