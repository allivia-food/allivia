import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoNotice } from '@/components/premium/DemoNotice';
import { Button, Icon } from '@/components/ui';
import { images } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { colors, layout, opacity, spacing, typography } from '@/theme';

const t = strings.premiumUnlocked;
const p = layout.premium;
const goHome = () => router.dismissTo('/home');

export default function PremiumUnlockedScreen() {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        goHome();
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  return (
    <SafeAreaView style={styles.screen}>
      <Image
        source={images.splashBackground}
        style={[StyleSheet.absoluteFill, styles.pattern]}
        contentFit="cover"
        accessible={false}
      />
      <View style={styles.content}>
        <View style={styles.art}>
          <Image
            source={images.unlockedConfetti}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            accessible={false}
          />
          <View style={styles.circle}>
            <Icon name="checkWhite" size={p.successCheck} />
          </View>
        </View>
        <Text style={[typography.successTitle, styles.center]} accessibilityRole="header">
          {t.title}
        </Text>
        <Text style={[typography.bodyLarge, styles.center]}>{t.text}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          label={t.start}
          variant="accent"
          onPress={() => router.dismissTo('/scanner')}
          testID="unlocked-start"
        />
        <Button label={t.later} variant="textSecondary" onPress={goHome} testID="unlocked-later" />
        <DemoNotice />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pattern: { opacity: opacity.backgroundPatternLight },
  center: { textAlign: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.formHorizontal,
  },
  art: {
    width: p.confettiWidth,
    height: p.confettiHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: p.successCircle,
    height: p.successCircle,
    borderRadius: p.successCircle / 2,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    paddingHorizontal: spacing.formHorizontal,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
});
