import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, IconBadge, ScreenHeader, StateView } from '@/components/ui';
import { ALLERGENS, type AllergenId } from '@/constants/allergens';
import { allergenIcons, images } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { authErrorKind } from '@/features/auth/authErrors';
import {
  analyzeProduct,
  type AnalysisResult,
  type Product,
} from '@/features/scanner/analyzeProduct';
import { useProduct } from '@/hooks/useProduct';
import { useProfileStore } from '@/store/profile';
import { colors, layout, opacity, radius, sizes, spacing, typography } from '@/theme';

const t = strings.scanResult;
const s = layout.scanner;
const labelOf = (id: AllergenId) => ALLERGENS.find((a) => a.id === id)?.label ?? id;

export default function ScannerResultScreen() {
  const { barcode = '' } = useLocalSearchParams<{ barcode: string }>();
  const query = useProduct(barcode);
  const profile = useProfileStore((st) => st.profile);
  const product = query.data?.product ?? null;
  const analysis = useMemo(
    () => (product && profile ? analyzeProduct(product, profile) : null),
    [product, profile],
  );
  const back = () => (router.canGoBack() ? router.back() : router.replace('/scanner'));
  const home = () => router.navigate('/home');

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Image
        source={images.splashBackground}
        style={[StyleSheet.absoluteFill, styles.pattern]}
        contentFit="cover"
        accessible={false}
      />
      <ScreenHeader
        title={t.title}
        onBack={back}
        right={
          <Pressable
            onPress={home}
            accessibilityRole="button"
            style={({ pressed }) => [styles.done, pressed && styles.pressed]}
            testID="result-done"
          >
            <Text style={[typography.bannerTitle, styles.doneText]}>{t.done}</Text>
          </Pressable>
        }
      />
      {query.isPending ? (
        <StateView variant="loading" message={strings.scanner.analyzing} />
      ) : query.isError ? (
        <StateView
          variant={authErrorKind(query.error) === 'network' ? 'offline' : 'error'}
          onRetry={() => void query.refetch()}
        />
      ) : !product || !analysis ? (
        <StateView variant="empty" message={strings.scanner.notFound} />
      ) : (
        <Result product={product} analysis={analysis} onScanAgain={back} onHome={home} />
      )}
    </SafeAreaView>
  );
}

function Result({
  product,
  analysis,
  onScanAgain,
  onHome,
}: {
  product: Product;
  analysis: AnalysisResult;
  onScanAgain: () => void;
  onHome: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const ingredients = showAll
    ? analysis.remainingIngredients
    : analysis.remainingIngredients.slice(0, s.maxIngredients);
  const hidden = analysis.remainingIngredients.length - ingredients.length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.imageBox}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={{ width: s.productImageWidth, height: s.productImageHeight }}
            contentFit="contain"
            accessibilityLabel={t.productImage}
          />
        ) : (
          <IconBadge icon="barcodeLarge" size="large" tone="green" />
        )}
        {product.name ? (
          <Text style={[typography.sectionTitle, styles.center]}>{product.name}</Text>
        ) : null}
      </View>

      <VerdictBanner analysis={analysis} />
      {analysis.dietNotes.map((note) => (
        <Text key={note} style={[typography.caption, styles.note]}>
          {note}
        </Text>
      ))}

      <View style={styles.section}>
        <Text style={typography.sectionTitle}>{t.otherIngredients}</Text>
        {product.ingredients.length === 0 ? (
          <Text style={typography.caption}>{t.noIngredients}</Text>
        ) : (
          ingredients.map((ing, i) => (
            <View key={`${i}-${ing}`} style={styles.row}>
              <Text style={[typography.caption, styles.flex]}>{ing}</Text>
              <Icon name="check" size={sizes.iconSmall} />
            </View>
          ))
        )}
        {hidden > 0 ? (
          <Text style={styles.seeAll} onPress={() => setShowAll(true)} accessibilityRole="button">
            {t.seeAll} ({hidden})
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={typography.sectionTitle}>{t.productInfo}</Text>
        <InfoRow label={t.category} value={product.category} />
        <InfoRow label={t.manufacturer} value={product.brand} />
        <InfoRow label={t.barcode} value={product.barcode} />
      </View>

      <Text style={[typography.caption, styles.disclaimer]} testID="result-disclaimer">
        {t.disclaimer}
      </Text>

      <Button label={strings.scanner.scanAgain} onPress={onScanAgain} testID="result-again" />
      <Button label={t.backHome} variant="text" onPress={onHome} testID="result-home" />
    </ScrollView>
  );
}

function VerdictBanner({ analysis }: { analysis: AnalysisResult }) {
  const verdict = analysis.verdict;
  if (verdict === 'safe') {
    return (
      <View style={[styles.banner, styles.safe]} testID="verdict-safe">
        <Icon name="shieldCheck" size={sizes.iconBanner} />
        <Text style={[typography.bannerTitle, styles.safeText, styles.flex]}>{t.safe}</Text>
      </View>
    );
  }
  const found = [
    ...new Set(
      analysis.matches
        .filter((m) => m.kind === 'declared' || m.kind === 'ingredient')
        .flatMap((m) => (m.allergenId ? [m.allergenId] : [])),
    ),
  ];
  const reasons = [
    ...(analysis.missingData ? [t.reasonMissing] : []),
    ...analysis.matches
      .filter((m) => m.kind === 'trace' && m.allergenId)
      .map((m) => t.reasonTrace(labelOf(m.allergenId as AllergenId))),
    ...analysis.matches
      .filter((m) => m.kind === 'custom' && m.term)
      .map((m) =>
        m.found ? t.reasonCustomFound(m.term as string) : t.reasonCustomCheck(m.term as string),
      ),
  ];
  return (
    <View style={[styles.banner, styles.alert]} testID={`verdict-${verdict}`}>
      <View style={styles.bannerHeader}>
        <Icon
          name="warning"
          size={sizes.iconBanner}
          color={verdict === 'warning' ? colors.primary : undefined}
        />
        <Text
          style={[
            typography.bannerTitle,
            styles.flex,
            verdict === 'contains' ? styles.containsText : styles.warningText,
          ]}
        >
          {verdict === 'contains' ? t.contains : t.warning}
        </Text>
      </View>
      {verdict === 'contains' ? (
        <View style={styles.allergens}>
          {found.map((id) => (
            <View key={id} style={styles.allergen}>
              <Icon name={allergenIcons[id]} size={sizes.iconBanner} color={colors.primary} />
              <Text style={[typography.bodySmall, styles.containsText]}>{labelOf(id)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {reasons.length > 0 ? (
        <View style={styles.reasons}>
          {reasons.map((r) => (
            <Text key={r} style={typography.bodySmall}>
              • {r}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={[typography.caption, styles.flex]}>{label}</Text>
      <Text style={[typography.bannerTitle, styles.value]}>{value ?? t.notInformed}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  flex: { flex: 1 },
  pattern: { opacity: opacity.backgroundPatternLight },
  center: { textAlign: 'center' },
  pressed: { opacity: opacity.pressed },
  done: {
    minHeight: sizes.buttonSmallHeight,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceGreen,
    justifyContent: 'center',
  },
  doneText: { color: colors.secondary },
  imageBox: { alignItems: 'center', gap: spacing.sm },
  banner: {
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: radius.card,
    borderWidth: sizes.border,
  },
  alert: { backgroundColor: colors.surfaceOrange, borderColor: colors.primary },
  safe: {
    backgroundColor: colors.surfaceGreen,
    borderColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  safeText: { color: colors.secondary },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  containsText: { color: colors.error },
  warningText: { color: colors.primary },
  allergens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  allergen: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reasons: { gap: spacing.xs },
  note: { color: colors.textSecondary },
  section: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  seeAll: { ...typography.link, color: colors.secondary },
  value: { color: colors.textPrimary, textAlign: 'right', flexShrink: 1 },
  disclaimer: { color: colors.textSecondary, textAlign: 'center' },
});
