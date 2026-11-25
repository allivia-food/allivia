import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { images } from '@/constants/icons';
import { strings } from '@/constants/strings';
import { colors, fontFamily, layout, spacing, typography } from '@/theme';

const t = strings.welcome;
const w = layout.welcome;

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const k = width / layout.frameWidth;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Image
        source={images.welcomePhoto}
        style={{
          position: 'absolute',
          left: w.photoLeft * k,
          top: w.photoTop * k,
          width: w.photoWidth * k,
          height: w.photoHeight * k,
        }}
        contentFit="cover"
        accessible={false}
      />
      <View style={[styles.bottom, { top: w.waveTop * k }]}>
        <View style={[styles.fill, { top: w.waveStraightTop * k }]} />
        <Image
          source={images.welcomeWave}
          style={[styles.wave, { height: w.waveHeight * k }]}
          contentFit="fill"
          accessible={false}
        />
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: w.contentTop * k, paddingBottom: insets.bottom + spacing.xxl },
          ]}
        >
          <Text style={[typography.headerTitle, styles.title]} accessibilityRole="header">
            {t.title}
          </Text>
          <Text style={[typography.subtitle, styles.center, { marginTop: w.titleToSubtitle }]}>
            {t.subtitle}
          </Text>
          <Text
            style={[
              typography.bodyMedium,
              styles.center,
              { marginTop: w.subtitleToText, maxWidth: w.textWidth * k },
            ]}
          >
            {t.descriptionBefore}
            <Text style={styles.brand}>{t.descriptionBrand}</Text>
            {t.descriptionAfter}
          </Text>
          <View style={[styles.actions, { marginTop: w.textToButton }]}>
            <Button label={t.login} variant="accent" onPress={() => router.push('/login')} />
          </View>
          <Text
            style={[typography.subtitle, styles.center, { marginTop: w.buttonToLink }]}
            onPress={() => router.push('/register')}
            accessibilityRole="link"
            accessibilityLabel={`${t.noAccount}${t.register}`}
            suppressHighlighting
          >
            {t.noAccount}
            <Text style={styles.link}>{t.register}</Text>
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fill: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background },
  wave: { position: 'absolute', left: 0, right: 0, top: 0 },
  content: { alignItems: 'center', paddingHorizontal: spacing.formHorizontal },
  title: { color: colors.primary, textAlign: 'center' },
  center: { textAlign: 'center' },
  brand: { fontFamily: fontFamily.extraBold, color: colors.primary },
  actions: { alignSelf: 'stretch' },
  link: {
    fontFamily: fontFamily.extraBold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
