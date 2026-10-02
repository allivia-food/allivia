import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeleteAccountModal } from '@/components/feature/DeleteAccountModal';
import { EditInfoModal } from '@/components/feature/EditInfoModal';
import { ProfileMissing } from '@/components/feature/ProfileMissing';
import { ProfileRow } from '@/components/feature/ProfileRow';
import { Button, Card, IconBadge, LargeTitleHeader, Toast } from '@/components/ui';
import { allergenIcons, CUSTOM_ALLERGY_ICON } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { restrictionsSummary } from '@/features/onboarding/selection';
import { signOutAndClear } from '@/features/profile/signOut';
import { useProfileStore } from '@/store/profile';
import { colors, fontFamily, sizes, spacing, typography } from '@/theme';

const t = strings.profile;

export default function ProfileScreen() {
  const profile = useProfileStore((s) => s.profile);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  if (!profile) return <ProfileMissing />;
  const summary = restrictionsSummary(profile.allergies, profile.customAllergies);
  const openRestrictions = () => router.push('/profile/edit-preferences');

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <LargeTitleHeader title={t.title} />
        <View style={styles.body}>
          <Card style={styles.userCard}>
            <IconBadge icon="user" size="medium" accessibilityLabel={t.avatar} />
            <View style={styles.userTexts}>
              <Text style={typography.sectionTitle} numberOfLines={1} testID="profile-name">
                {profile.displayName}
              </Text>
              <Text style={typography.bodySmall} numberOfLines={1} testID="profile-email">
                {profile.email}
              </Text>
            </View>
            <Text
              style={styles.editLink}
              onPress={() => setEditing(true)}
              accessibilityRole="button"
              testID="profile-edit"
            >
              {t.edit}
            </Text>
          </Card>

          <Card
            variant="green"
            style={styles.restrictions}
            onPress={openRestrictions}
            accessibilityLabel={`${t.myRestrictions}: ${
              [...summary.items.map((i) => i.label)].join(', ') || t.noAllergies
            }`}
            testID="profile-restrictions"
          >
            <Text style={typography.sectionTitle}>{t.myRestrictions}</Text>
            {summary.items.length === 0 ? (
              <Text style={typography.bodySmall}>{t.noAllergies}</Text>
            ) : (
              <View style={styles.badges}>
                {summary.items.map((item) => (
                  <View key={item.key} style={styles.badge}>
                    <IconBadge
                      icon={item.allergenId ? allergenIcons[item.allergenId] : CUSTOM_ALLERGY_ICON}
                      color={colors.primary}
                    />
                    <Text style={[typography.bodySmall, styles.badgeLabel]} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                ))}
                {summary.more > 0 ? (
                  <View style={styles.badge}>
                    <View style={styles.moreCircle}>
                      <Text style={styles.moreText} testID="profile-more">
                        +{summary.more}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </Card>

          <ProfileRow
            title={t.restrictionsRow}
            subtitle={t.restrictionsRowHint}
            onPress={openRestrictions}
            testID="profile-row-restrictions"
          />

          <Text style={[typography.sectionTitle, styles.section]}>{t.others}</Text>
          <ProfileRow title={t.help} onPress={() => router.push('/profile/help')} />
          <ProfileRow title={t.terms} onPress={() => router.push('/profile/terms')} />
          <ProfileRow title={t.privacy} onPress={() => router.push('/profile/privacy')} />

          <View style={styles.logout}>
            <Button
              label={t.logout}
              variant="secondary"
              loading={signingOut}
              onPress={() => {
                setSigningOut(true);
                void signOutAndClear()
                  .catch((e) => console.warn('[logout]', e))
                  .finally(() => setSigningOut(false));
              }}
              testID="profile-logout"
            />
          </View>
          <Text
            style={styles.delete}
            onPress={() => setDeleting(true)}
            accessibilityRole="button"
            testID="profile-delete"
          >
            {t.deleteAccount}
          </Text>
        </View>
      </ScrollView>

      {editing ? (
        <EditInfoModal
          visible
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={setToast}
        />
      ) : null}
      {deleting ? (
        <DeleteAccountModal visible email={profile.email} onClose={() => setDeleting(false)} />
      ) : null}
      <Toast visible={toast !== null} message={toast ?? ''} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.xl, gap: spacing.md },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  userTexts: { flex: 1, gap: spacing.xs },
  editLink: { ...typography.link, color: colors.secondary, padding: spacing.sm },
  restrictions: { padding: spacing.md, gap: spacing.md },
  badges: { flexDirection: 'row', justifyContent: 'space-around' },
  badge: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  badgeLabel: { textAlign: 'center' },
  moreCircle: {
    width: sizes.iconBadgeMedium,
    height: sizes.iconBadgeMedium,
    borderRadius: sizes.iconBadgeMedium / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { ...typography.buttonLarge, color: colors.primary },
  section: { marginTop: spacing.md },
  logout: { marginTop: spacing.lg },
  delete: {
    ...typography.bodySmall,
    fontFamily: fontFamily.bold,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.md,
    textDecorationLine: 'underline',
  },
});
