import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { strings } from '@/constants/strings';
import { MAP_DOCUMENT, parseMapMessage } from '@/features/restaurants/mapDocument';
import { useRestaurantMap, type RestaurantMapProps } from '@/hooks/useRestaurantMap';
import { colors, layout, spacing, typography } from '@/theme';

export function RestaurantMap(props: RestaurantMapProps) {
  const { selectedId, onSelect, onCentered } = props;
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const state = useRestaurantMap(props);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.source !== 'allivia-map')
        return;
      const message = parseMapMessage(JSON.stringify(event.data));
      if (!message) return;
      if (message.type === 'ready') setReady(true);
      else if (message.type === 'tile-error') setFailed(true);
      else if (message.type === 'tile-loaded') setFailed(false);
      else if ('id' in message && state.points.some((point) => point.id === message.id)) {
        if (message.type === 'select') onSelect(message.id);
        else if (message.id === selectedId) onCentered?.(message.id);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [onSelect, onCentered, selectedId, state.points]);
  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ type: 'update-map', state }, '*');
  }, [state, ready]);
  useEffect(() => {
    if (ready) return;
    const timeout = setTimeout(() => setFailed(true), 12000);
    return () => clearTimeout(timeout);
  }, [ready, attempt]);
  useEffect(() => {
    if (failed && selectedId) onCentered?.(selectedId);
  }, [failed, selectedId, onCentered]);
  return (
    <View style={styles.box} testID="restaurant-map-web">
      <iframe
        key={attempt}
        ref={frame}
        srcDoc={MAP_DOCUMENT}
        title={strings.restaurants.mapLabel}
        sandbox="allow-scripts allow-same-origin allow-popups"
        style={{ border: 0, width: '100%', height: '100%' }}
      />
      {!ready && !failed && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={colors.secondary} />
        </View>
      )}
      {failed && (
        <View style={styles.notice}>
          <Text style={typography.caption}>Não foi possível carregar o mapa.</Text>
          <Button
            label="Tentar novamente"
            size="small"
            onPress={() => {
              setReady(false);
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          />
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  box: {
    ...StyleSheet.absoluteFill,
    bottom: layout.restaurants.sheetMin,
    backgroundColor: colors.surfaceGreen,
  },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  notice: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.xs,
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
});
