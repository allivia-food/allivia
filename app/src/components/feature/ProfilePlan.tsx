import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Card, Icon, Modal } from '@/components/ui';
import { usePremium } from '@/hooks/usePremium';
import { saveSubscription } from '@/services/profile';
import { useProfileStore } from '@/store/profile';
import { colors, fontFamily, radius, spacing, typography } from '@/theme';
export function ProfilePlan() {
  const profile = useProfileStore((s) => s.profile);
  const { isPremium } = usePremium();
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;
  const sub = profile.subscription;
  const scheduled = isPremium && sub?.status === 'canceled';
  const end =
    sub && Number.isFinite(Date.parse(sub.renewsAt))
      ? new Date(sub.renewsAt).toLocaleDateString('pt-BR')
      : null;
  async function cancel() {
    if (!profile || !sub || saving) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveSubscription(profile.id, true, { ...sub, status: 'canceled' });
      if (useProfileStore.getState().profile?.id === saved.id)
        useProfileStore.getState().setProfile(saved);
      setConfirm(false);
    } catch {
      setError('Não foi possível alterar o plano. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card
      variant={isPremium ? 'orange' : 'default'}
      style={[styles.card, isPremium && styles.premiumCard]}
      testID="profile-plan"
    >
      {isPremium ? (
        <View style={styles.premiumHeader}>
          <View style={styles.premiumIcon}>
            <Icon name="premium" size={28} color={colors.secondary} />
          </View>
          <View style={styles.premiumHeading}>
            <Text style={styles.eyebrow}>SEU PLANO</Text>
            <Text style={styles.premiumTitle} accessibilityRole="header">
              Você é Premium
            </Text>
          </View>
        </View>
      ) : null}
      <View style={styles.heading}>
        {!isPremium ? (
          <Text style={typography.sectionTitle} accessibilityRole="header">
            Plano gratuito
          </Text>
        ) : null}
        <Text style={[typography.bodySmall, isPremium && styles.premiumDescription]}>
          {isPremium
            ? 'Gerencie sua assinatura e seu acesso aos recursos Premium.'
            : 'Conheça os planos para ter acesso aos recursos Premium.'}
        </Text>
      </View>
      <View style={isPremium ? styles.premiumFooter : undefined}>
        {scheduled ? (
          <Text style={[typography.bodySmall, styles.scheduled]}>
            Premium até {end}. Mudança para o plano gratuito agendada.
          </Text>
        ) : (
          <Button
            testID="profile-change-plan"
            label={isPremium ? 'Mudar para gratuito' : 'Conhecer os planos'}
            variant={isPremium ? 'secondary' : 'primary'}
            size={isPremium ? 'small' : 'large'}
            onPress={() => {
              setError(null);
              if (!isPremium) {
                router.push('/premium');
                return;
              }
              if (!end) {
                setError('Não foi possível identificar a data de término do plano.');
                return;
              }
              setConfirm(true);
            }}
          />
        )}
      </View>
      {error ? <Banner variant="error" title={error} /> : null}
      <Modal
        visible={confirm}
        onClose={() => {
          if (!saving) setConfirm(false);
        }}
        title="Tem certeza?"
      >
        <Text style={typography.body}>
          Seu acesso Premium continua até {end}. A renovação será cancelada e depois você passará
          para o plano gratuito.
        </Text>
        <Button
          label="Confirmar mudança"
          loading={saving}
          onPress={() => void cancel()}
          testID="plan-confirm"
        />
        <Button
          label="Manter Premium"
          variant="secondary"
          disabled={saving}
          onPress={() => setConfirm(false)}
        />
        {error ? <Banner variant="error" title={error} /> : null}
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.md },
  heading: { gap: spacing.xs },
  premiumCard: {
    padding: spacing.xl,
    gap: spacing.lg,
    borderColor: colors.surfaceOrange,
    boxShadow: 'none',
  },
  premiumHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  premiumIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumHeading: { flex: 1, gap: spacing.xs },
  eyebrow: {
    ...typography.caption,
    fontFamily: fontFamily.extraBold,
    color: colors.secondary,
    letterSpacing: 1.2,
  },
  premiumTitle: { ...typography.headerTitle, fontSize: 22 },
  premiumDescription: { color: colors.secondary, lineHeight: 20 },
  premiumFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.primary,
    paddingTop: spacing.lg,
  },
  scheduled: { color: colors.secondary, lineHeight: 20 },
});
