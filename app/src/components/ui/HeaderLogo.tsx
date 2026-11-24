import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { images } from '@/constants/icons';

export function HeaderLogo() {
  return (
    <Image
      source={images.logo}
      style={styles.logo}
      contentFit="contain"
      accessibilityLabel="Allivia"
    />
  );
}

const styles = StyleSheet.create({
  logo: { width: 56, height: 62, flexShrink: 0 },
});
