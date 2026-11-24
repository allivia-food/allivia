import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui';
import { getRecipePhoto } from '@/constants/recipePhotos';
import { colors, radius, sizes } from '@/theme';

export interface RecipeImageProps {
  uri: string | null;
  recipeTitle?: string;
  localSource?: number;
  style?: StyleProp<ViewStyle>;
}

export function RecipeImage({ uri, recipeTitle, localSource, style }: RecipeImageProps) {
  const localPhoto = getRecipePhoto(recipeTitle);
  const source = localSource || uri || localPhoto;
  return (
    <View style={[styles.box, style]}>
      {source ? (
        <Photo key={String(source) + localPhoto} source={source} fallback={localPhoto} />
      ) : (
        <Placeholder />
      )}
    </View>
  );
}

function Placeholder() {
  return <Icon name="plate" size={sizes.iconBadgeMedium} color={colors.textPlaceholder} />;
}

function Photo({ source, fallback }: { source: string | number; fallback?: number }) {
  const [failed, setFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  if (failed && (!fallback || fallbackFailed || source === fallback)) return <Placeholder />;
  const current = failed ? fallback! : source;
  return (
    <Image
      source={typeof current === 'string' ? { uri: current } : current}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      transition={150}
      onError={() => (failed ? setFallbackFailed(true) : setFailed(true))}
      accessibilityLabel="Foto"
    />
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    borderRadius: radius.image,
    backgroundColor: colors.chipInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
