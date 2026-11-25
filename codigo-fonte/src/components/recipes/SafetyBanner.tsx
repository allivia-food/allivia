import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { ALLERGENS, type AllergenId } from '@/constants/allergens';
import { allergenIcons } from '@/constants/icons';
import { strings } from '@/constants/strings';
import type { SafetyResult } from '@/utils/recipeSafety';
import { colors, radius, sizes, spacing, typography } from '@/theme';

export interface SafetyBannerProps {
  safety: SafetyResult;
  profileAllergies: readonly AllergenId[];
}

const t = strings.recipe;

export function SafetyBanner({ safety, profileAllergies }: SafetyBannerProps) {
  const level = safety.level;
  const title =
    level === 'safe' ? t.safe : level === 'danger' ? t.danger(safety.labels) : t.warning;
  const text =
    level === 'safe' ? t.safeText : level === 'warning' ? t.warningText(safety.labels) : null;

  return (
    <View
      style={[styles.box, level === 'safe' ? styles.safe : styles.alert]}
      accessibilityRole={level === 'safe' ? 'summary' : 'alert'}
      testID={`safety-${level}`}
    >
      <View style={styles.header}>
        <Icon
          name={level === 'safe' ? 'shieldCheck' : 'warning'}
          size={sizes.iconBanner}
          color={level === 'warning' ? colors.primary : undefined}
        />
        <View style={styles.texts}>
          <Text
            style={[
              typography.bannerTitle,
              level === 'danger' && styles.danger,
              level === 'warning' && styles.warning,
            ]}
          >
            {title}
          </Text>
          {text ? <Text style={typography.bodySmall}>{text}</Text> : null}
        </View>
      </View>
      {level === 'safe' && profileAllergies.length > 0 ? (
        <View style={styles.allergies}>
          {profileAllergies.map((id) => (
            <View key={id} style={styles.allergy}>
              <Icon name={allergenIcons[id]} size={sizes.iconInput} color={colors.primary} />
              <Text style={typography.bodySmall}>
                {ALLERGENS.find((a) => a.id === id)?.label ?? id}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={[typography.caption, styles.disclaimer]}>{t.disclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: sizes.border,
    borderColor: colors.primary,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  safe: { backgroundColor: colors.surface },
  alert: { backgroundColor: colors.surfaceOrange },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  texts: { flex: 1, gap: spacing.xs },
  danger: { color: colors.error },
  warning: { color: colors.primary },
  allergies: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, paddingLeft: spacing.xxl },
  allergy: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  disclaimer: { color: colors.textSecondary },
});
