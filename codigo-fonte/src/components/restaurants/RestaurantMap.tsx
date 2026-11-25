import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button } from '@/components/ui';
import { strings } from '@/constants/strings';
import { MAP_DOCUMENT, mapUpdateScript, parseMapMessage } from '@/features/restaurants/mapDocument';
import { useRestaurantMap, type RestaurantMapProps } from '@/hooks/useRestaurantMap';
import { colors, layout, spacing, typography } from '@/theme';

export type { RestaurantMapProps } from '@/hooks/useRestaurantMap';
const source = { html: MAP_DOCUMENT };

export function RestaurantMap(props: RestaurantMapProps) {
  const { selectedId, onSelect, onCentered } = props;
  const map = useRef<WebView<object>>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const state = useRestaurantMap(props);
  useEffect(() => {
    if (ready) map.current?.injectJavaScript(mapUpdateScript(state));
  }, [ready, state]);
  useEffect(() => {
    if (ready || failed) return;
    const timeout = setTimeout(() => setFailed(true), 12000);
    return () => clearTimeout(timeout);
  }, [ready, failed, attempt]);
  useEffect(() => {
    if (failed && selectedId) onCentered?.(selectedId);
  }, [failed, selectedId, onCentered]);
  function retry() {
    setReady(false);
    setFailed(false);
    setTileError(false);
    setAttempt((value) => value + 1);
  }
  return (
    <View style={styles.viewport}>
      {!failed && (
        <WebView<object>
          key={attempt}
          ref={map}
          source={source}
          originWhitelist={['*']}
          applicationNameForUserAgent="Allivia/1.0"
          cacheEnabled
          cacheMode="LOAD_DEFAULT"
          mixedContentMode="never"
          allowFileAccess={false}
          javaScriptCanOpenWindowsAutomatically={false}
          setSupportMultipleWindows={false}
          style={styles.map}
          testID="restaurant-map"
          accessibilityLabel={strings.restaurants.mapLabel}
          onMessage={({ nativeEvent }) => {
            const message = parseMapMessage(nativeEvent.data);
            if (!message) return;
            if (message.type === 'ready') {
              setReady(true);
              return;
            }
            if (message.type === 'tile-error') {
              setTileError(true);
              return;
            }
            if (message.type === 'tile-loaded') {
              setTileError(false);
              return;
            }
            if ('id' in message && state.points.some((point) => point.id === message.id)) {
              if (message.type === 'select') onSelect(message.id);
              else if (message.id === selectedId) onCentered?.(message.id);
            }
          }}
          onError={() => setFailed(true)}
          onRenderProcessGone={() => setFailed(true)}
          onShouldStartLoadWithRequest={({ url }) => {
            if (url === 'about:blank') return true;
            if (url === 'https://www.openstreetmap.org/copyright')
              void Linking.openURL(url).catch(() => {});
            return false;
          }}
        />
      )}
      {!ready && !failed && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={colors.secondary} />
        </View>
      )}
      {failed ? (
        <View style={styles.error}>
          <Text style={[typography.bodySmall, styles.center]}>
            Não foi possível carregar o mapa. A lista de restaurantes continua disponível.
          </Text>
          <Button label="Tentar novamente" size="small" onPress={retry} />
        </View>
      ) : tileError ? (
        <View style={styles.notice}>
          <Text style={typography.caption}>Sem conexão com o mapa.</Text>
          <Button label="Tentar novamente" size="small" onPress={retry} />
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  viewport: {
    ...StyleSheet.absoluteFill,
    bottom: layout.restaurants.sheetMin,
    backgroundColor: colors.surfaceGreen,
  },
  map: { flex: 1, backgroundColor: colors.surfaceGreen },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  notice: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.xs,
  },
  center: { textAlign: 'center' },
});
