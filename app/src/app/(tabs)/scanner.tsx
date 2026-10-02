import { useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PremiumPlan } from '@/components/premium/PremiumPlan';
import { Button, Icon, IconButton, Input, Modal, StateView } from '@/components/ui';
import { FEATURES } from '@/constants/features';
import { images } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { authErrorKind } from '@/features/auth/authErrors';
import { analyzeProduct } from '@/features/scanner/analyzeProduct';
import {
  isDuplicateRead,
  isValidScannedBarcode,
  normalizeManualBarcode,
  type LastRead,
} from '@/features/scanner/barcode';
import { usePremium } from '@/hooks/usePremium';
import { productKey, productQuery } from '@/hooks/useProduct';
import { InvalidProductDataError, recordScan } from '@/services/products';
import { useProfileStore } from '@/store/profile';
import { colors, layout, opacity, radius, sizes, spacing, typography } from '@/theme';

const t = strings.scanner;
const s = layout.scanner;
const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

type Phase =
  | { kind: 'scanning' }
  | { kind: 'loading'; code: string }
  | { kind: 'notFound'; code: string }
  | { kind: 'error'; code: string; message: string };

export default function ScannerScreen() {
  const { isPremium } = usePremium();
  return FEATURES.premiumGate && !isPremium ? <PremiumPlan /> : <ScannerCamera />;
}

function ScannerCamera() {
  const profile = useProfileStore((st) => st.profile);
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  const [torch, setTorch] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' });
  const [manualOpen, setManualOpen] = useState(false);
  const busy = useRef(false);
  const lastRead = useRef<LastRead | null>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const k = width / layout.frameWidth;

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      setPhase({ kind: 'scanning' });
      busy.current = false;
      return () => {
        setFocused(false);
        setTorch(false);
      };
    }, []),
  );

  const analyze = useCallback(
    async (code: string) => {
      busy.current = true;
      setPhase({ kind: 'loading', code });
      try {
        const { product } = await queryClient.fetchQuery(productQuery(code));
        if (!product) {
          if (profile) void recordScan(profile.id, code, null, 'not_found', []);
          setPhase({ kind: 'notFound', code });
          return;
        }
        if (profile) {
          const result = analyzeProduct(product, profile);
          const matched = [
            ...new Set(result.matches.flatMap((m) => (m.allergenId ? [m.allergenId] : []))),
          ];
          void recordScan(profile.id, code, product.name, result.verdict, matched);
        }
        router.push({ pathname: '/scanner-result', params: { barcode: code } });
      } catch (error) {
        if (__DEV__) console.warn('[scanner]', error);
        queryClient.removeQueries({ queryKey: productKey(code) });
        setPhase({
          kind: 'error',
          code,
          message:
            error instanceof InvalidProductDataError
              ? t.invalidData
              : authErrorKind(error) === 'network'
                ? strings.common.networkError
                : strings.common.unknownError,
        });
      }
    },
    [profile, queryClient],
  );

  function onScanned(result: BarcodeScanningResult) {
    if (busy.current) return;
    const now = Date.now();
    if (isDuplicateRead(result.data, now, lastRead.current)) return;
    if (!isValidScannedBarcode(result.data, result.type)) return;
    lastRead.current = { code: result.data, at: now };
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void analyze(result.data);
  }

  const scanning = phase.kind === 'scanning';
  const cameraAllowed = permission?.granted && !cameraError;

  return (
    <View style={styles.screen}>
      <View style={[styles.camera, { height: s.cameraHeight * k }]}>
        {cameraAllowed ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              active={focused}
              enableTorch={torch && focused}
              barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
              onBarcodeScanned={focused && scanning ? onScanned : undefined}
              onMountError={() => setCameraError(true)}
              accessibilityLabel={t.cameraLabel}
            />
            <Image
              source={images.scannerFrame}
              style={[
                styles.frame,
                { top: s.frameTop * k, width: s.frameWidth * k, height: s.frameHeight * k },
              ]}
              contentFit="contain"
              accessible={false}
            />
            {Platform.OS !== 'web' ? (
              <View style={[styles.torch, { top: insets.top + spacing.md }]}>
                <IconButton
                  icon="flashOff"
                  iconSize={sizes.iconTab}
                  color={torch ? colors.primary : undefined}
                  onPress={() => setTorch((v) => !v)}
                  accessibilityLabel={torch ? t.torchOff : t.torchOn}
                  testID="scanner-torch"
                />
              </View>
            ) : null}
            <View style={[styles.tip, { width: s.tipWidth * k }]}>
              <Icon name="lightbulb" size={sizes.iconButton} />
              <Text style={[typography.caption, styles.flex]}>{t.tip}</Text>
            </View>
          </>
        ) : (
          <PermissionView
            permission={permission}
            cameraError={cameraError}
            onRequest={() => void requestPermission()}
            onManual={() => setManualOpen(true)}
          />
        )}

        {phase.kind !== 'scanning' ? (
          <View style={styles.overlay} testID={`scanner-${phase.kind}`}>
            {phase.kind === 'loading' ? (
              <>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={typography.subtitle}>{t.analyzing}</Text>
              </>
            ) : phase.kind === 'notFound' ? (
              <>
                <Text style={[typography.sectionTitle, styles.center]}>{t.notFound}</Text>
                <Text style={typography.bodySmall}>{t.code(phase.code)}</Text>
                <Button label={t.scanAgain} onPress={() => resetScan()} testID="scanner-again" />
                <Button
                  label={t.typeOther}
                  variant="secondary"
                  onPress={() => {
                    resetScan();
                    setManualOpen(true);
                  }}
                />
              </>
            ) : (
              <>
                <Text style={[typography.subtitle, styles.center]}>{phase.message}</Text>
                <Button
                  label={strings.common.retry}
                  onPress={() => void analyze(phase.code)}
                  testID="scanner-retry"
                />
                <Button label={t.scanAgain} variant="secondary" onPress={() => resetScan()} />
              </>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.bottom}>
        <Image
          source={images.splashBackground}
          style={[StyleSheet.absoluteFill, styles.pattern]}
          contentFit="cover"
          accessible={false}
        />
        <Text
          style={styles.manual}
          onPress={() => setManualOpen(true)}
          accessibilityRole="button"
          testID="scanner-manual"
        >
          {t.manual}
        </Text>
      </View>

      {manualOpen ? (
        <ManualEntry
          onClose={() => setManualOpen(false)}
          onSubmit={(code) => {
            setManualOpen(false);
            lastRead.current = { code, at: Date.now() };
            void analyze(code);
          }}
        />
      ) : null}
    </View>
  );

  function resetScan() {
    busy.current = false;
    setPhase({ kind: 'scanning' });
  }
}

function PermissionView({
  permission,
  cameraError,
  onRequest,
  onManual,
}: {
  permission: ReturnType<typeof useCameraPermissions>[0];
  cameraError: boolean;
  onRequest: () => void;
  onManual: () => void;
}) {
  if (!permission) return <StateView variant="loading" />;
  const denied = !permission.granted && !permission.canAskAgain;
  return (
    <View style={styles.permission} testID="scanner-permission">
      <Icon name="barcodeLarge" size={sizes.iconBadgeLarge} />
      <Text style={[typography.sectionTitle, styles.center]}>
        {cameraError ? t.unavailable : denied ? t.permissionDenied : t.permissionTitle}
      </Text>
      {!cameraError && !denied ? (
        <Button label={t.permissionButton} onPress={onRequest} testID="scanner-allow" />
      ) : null}
      {!cameraError && denied ? (
        <Button
          label={t.openSettings}
          onPress={() => void Linking.openSettings()}
          testID="scanner-settings"
        />
      ) : null}
      <Button label={t.manual} variant="secondary" onPress={onManual} />
    </View>
  );
}

function ManualEntry({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (code: string) => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  function confirm() {
    const code = normalizeManualBarcode(value);
    if (!code) {
      setError(t.invalidCode);
      return;
    }
    onSubmit(code);
  }
  return (
    <Modal visible onClose={onClose} title={t.manualTitle} testID="scanner-manual-modal">
      <Input
        icon="barcode"
        placeholder={t.manualPlaceholder}
        value={value}
        onChangeText={(v) => {
          setValue(v.replace(/[^\d ]/g, ''));
          setError(null);
        }}
        keyboardType="number-pad"
        maxLength={18}
        error={error ?? undefined}
        returnKeyType="done"
        onSubmitEditing={confirm}
        autoFocus
        testID="scanner-manual-input"
      />
      <Button label={t.manualConfirm} onPress={confirm} testID="scanner-manual-confirm" />
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  camera: { backgroundColor: colors.cameraBackground, overflow: 'hidden' },
  frame: { position: 'absolute', alignSelf: 'center' },
  torch: { position: 'absolute', right: spacing.screenHorizontal },
  tip: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.tipBackground,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.formHorizontal,
  },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.formHorizontal,
    backgroundColor: colors.background,
  },
  bottom: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pattern: { opacity: opacity.backgroundPatternLight },
  manual: { ...typography.link, color: colors.secondary, padding: spacing.md },
});
