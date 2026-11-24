import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumPlan } from '@/components/premium/PremiumPlan';
import { Button, HeaderLogo, Icon, StateView } from '@/components/ui';
import { FEATURES } from '@/constants/features';
import { usePremium } from '@/hooks/usePremium';
import { getSupabase } from '@/services/supabase';
import { useProfileStore } from '@/store/profile';
import { colors, spacing, radius, typography } from '@/theme';
import { withTimeout } from '@/utils/withTimeout';

const labels = {
  safe: 'Sem alertas identificados',
  warning: 'Atenção',
  contains: 'Contém restrições',
  not_found: 'Produto não encontrado',
};
type Scan = {
  id: string;
  barcode: string;
  product_name: string | null;
  scanned_at: string;
  verdict: keyof typeof labels;
  image_url?: string | null;
};

function ProductPhoto({ uri, name }: { uri?: string | null; name: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={styles.photo}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          accessibilityLabel={`Foto de ${name || 'alimento'}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon name="plate" size={32} color={colors.textPlaceholder} />
      )}
    </View>
  );
}
export default function ScannerScreen() {
  const { isPremium } = usePremium();
  return FEATURES.premiumGate && !isPremium ? <PremiumPlan /> : <History />;
}
function History() {
  const profile = useProfileStore((s) => s.profile);
  const query = useInfiniteQuery({
    queryKey: ['scan-history', profile?.id],
    initialPageParam: 0,
    enabled: !!profile,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await getSupabase()
        .from('scans')
        .select('id,barcode,product_name,scanned_at,verdict')
        .eq('user_id', profile!.id)
        .order('scanned_at', { ascending: false })
        .order('id', { ascending: false })
        .range(pageParam * 20, pageParam * 20 + 19);
      if (error) throw error;
      const scans = (data ?? []) as Scan[];
      if (!scans.length) return scans;
      // Photos are optional: a cache failure must not prevent reading history.
      try {
        const { data: photos, error: photoError } = await withTimeout(
          getSupabase()
            .from('products_cache')
            .select('barcode,image_url')
            .in('barcode', [...new Set(scans.map((scan) => scan.barcode))]),
          3000,
        );
        if (photoError) return scans;
        const images = new Map<string, string | null>(
          (photos ?? []).map((photo) => [photo.barcode, photo.image_url]),
        );
        return scans.map((scan) => ({ ...scan, image_url: images.get(scan.barcode) }));
      } catch {
        return scans;
      }
    },
    getNextPageParam: (last, pages) => (last.length === 20 ? pages.length : undefined),
  });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        contentContainerStyle={styles.content}
        data={(query.data?.pages.flat() ?? []).filter(
          (scan, index, scans) =>
            scans.findIndex((item) => item.barcode === scan.barcode) === index,
        )}
        keyExtractor={(item) => item.id}
        refreshing={query.isRefetching}
        onRefresh={() => void refetch()}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching) void query.fetchNextPage();
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Text style={[typography.screenTitle, { flex: 1 }]}>Histórico de alimentos</Text>
              <HeaderLogo />
            </View>
            <Text style={typography.bodyLarge}>
              Reveja seus escaneamentos e cuide das suas escolhas.
            </Text>
            <Button
              label="Escanear alimento"
              onPress={() => router.push({ pathname: '/scanner-camera' as never })}
            />
          </View>
        }
        ListEmptyComponent={
          query.isPending ? (
            <StateView variant="loading" />
          ) : query.isError ? (
            <StateView variant="error" onRetry={() => void refetch()} />
          ) : (
            <View style={styles.card}>
              <Text style={typography.sectionTitle}>Seu histórico começa aqui</Text>
              <Text style={typography.bodySmall}>
                Escaneie um alimento para consultar seus resultados aqui.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          query.isFetchNextPageError ? (
            <Button label="Tentar novamente" onPress={() => void query.fetchNextPage()} />
          ) : query.isFetchingNextPage ? (
            <StateView variant="loading" />
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardDetails}>
                <Text style={typography.sectionTitle}>
                  {item.product_name || 'Produto não identificado'}
                </Text>
                <Text style={typography.bodySmall}>
                  {item.barcode} · {new Date(item.scanned_at).toLocaleString('pt-BR')}
                </Text>
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      color:
                        item.verdict === 'contains'
                          ? colors.error
                          : item.verdict === 'safe'
                            ? colors.secondary
                            : colors.primary,
                    },
                  ]}
                >
                  Resultado registrado: {labels[item.verdict]}
                </Text>
              </View>
              <ProductPhoto
                key={`${item.barcode}:${item.image_url}`}
                uri={item.image_url}
                name={item.product_name}
              />
            </View>
            <Button
              label="Ver alimento"
              variant="secondary"
              onPress={() =>
                router.push({ pathname: '/scanner-result', params: { barcode: item.barcode } })
              }
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardDetails: { flex: 1, minWidth: 0, gap: spacing.sm },
  photo: {
    width: 88,
    height: 104,
    flexShrink: 0,
    borderRadius: radius.image,
    overflow: 'hidden',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surfaceOrange,
    borderRadius: radius.card,
  },
});
