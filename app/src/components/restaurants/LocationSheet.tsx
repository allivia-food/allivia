import { useState } from 'react';
import {
  ActivityIndicator,
  Modal as NativeModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card, Icon, IconButton } from '@/components/ui';
import { strings } from '@/constants/strings';
import {
  findAddress,
  getDeviceLocation,
  LocationError,
  type ChosenLocation,
} from '@/features/restaurants/location';
import { colors, layout, radius, sizes, spacing, typography } from '@/theme';

import { SearchPill } from './SearchPill';

const t = strings.restaurants.location;
const r = layout.restaurants;

export interface LocationSheetProps {
  onClose: () => void;
  onChoose: (location: ChosenLocation) => void;
  initialMessage?: string | null;
  deviceLabel?: string | null;
}

type Busy = 'locating' | 'searching' | null;

export function messageFor(error: unknown): string {
  if (error instanceof LocationError) {
    if (error.kind === 'denied') return t.denied;
    if (error.kind === 'unsupported') return t.unsupported;
  }
  return t.unavailable;
}

export function LocationSheet({
  onClose,
  onChoose,
  initialMessage = null,
  deviceLabel = null,
}: LocationSheetProps) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [result, setResult] = useState<ChosenLocation | null>(null);

  async function chooseDevice() {
    setBusy('locating');
    setMessage(null);
    try {
      onChoose(await getDeviceLocation(t.currentFallback));
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(null);
    }
  }

  async function search() {
    if (!query.trim()) return;
    setBusy('searching');
    setMessage(null);
    setResult(null);
    try {
      const found = await findAddress(query);
      if (found) setResult(found);
      else setMessage(t.notFound);
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <NativeModal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t.close}
        />
        <View style={styles.sheet} accessibilityViewIsModal testID="location-sheet">
          <View style={styles.header}>
            <IconButton
              icon="chevronDown"
              iconSize={layout.restaurants.chevronSize}
              color={colors.textSecondary}
              onPress={onClose}
              accessibilityLabel={t.close}
              testID="location-close"
            />
            <Text style={[typography.sectionTitle, styles.title]} accessibilityRole="header">
              {t.title}
            </Text>
            <View style={styles.headerSpace} />
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <SearchPill
              placeholder={t.searchPlaceholder}
              value={query}
              onChangeText={(v) => {
                setQuery(v);
                setMessage(null);
              }}
              returnKeyType="search"
              onSubmitEditing={() => void search()}
              testID="location-input"
            />
            <Card
              onPress={() => void chooseDevice()}
              accessibilityLabel={t.useCurrent}
              testID="location-device"
            >
              <View style={styles.option}>
                <Icon name="mapPin" size={r.locationIcon} color={colors.secondary} />
                <View style={styles.flex}>
                  <Text style={typography.sectionTitle}>{t.useCurrent}</Text>
                  <Text style={typography.bodySmall}>{deviceLabel ?? t.currentHint}</Text>
                </View>
              </View>
            </Card>
            {result ? (
              <Card
                onPress={() => onChoose(result)}
                accessibilityLabel={result.detail}
                testID="location-result"
              >
                <View style={styles.option}>
                  <Icon name="mapPin" size={r.locationIcon} color={colors.primary} />
                  <Text style={[typography.sectionTitle, styles.flex]}>{result.detail}</Text>
                </View>
              </Card>
            ) : null}
            {busy ? (
              <View style={styles.busy}>
                <ActivityIndicator color={colors.primary} />
                <Text style={typography.bodySmall}>
                  {busy === 'locating' ? t.locating : t.searching}
                </Text>
              </View>
            ) : null}
            {message ? (
              <Text
                style={typography.fieldError}
                accessibilityLiveRegion="polite"
                testID="location-message"
              >
                {message}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </NativeModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    flex: 1,
    marginTop: r.locationSheetTop,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.panel,
    borderTopRightRadius: radius.panel,
    borderWidth: sizes.border,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: { flex: 1, textAlign: 'center' },
  headerSpace: { width: r.chevronSize },
  content: { padding: spacing.screenHorizontal, gap: spacing.xl },
  option: {
    minHeight: r.currentCardHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  flex: { flex: 1 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
