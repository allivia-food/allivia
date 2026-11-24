import { Image } from 'expo-image';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RecipeImage } from '@/components/recipes/RecipeImage';
import { getRestaurantPhotos } from '@/constants/restaurantPhotos';
import { colors, layout, radius, spacing, typography } from '@/theme';

export function RestaurantPhotoCarousel({ name, image }: { name: string; image: string | null }) {
  const photos = getRestaurantPhotos(name);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const goTo = (next: number) => {
    setIndex(next);
    scroll.current?.scrollTo({ x: next * width, animated: true });
  };

  if (!photos.length) return <RecipeImage uri={image} style={styles.image} />;

  return (
    <View style={styles.container}>
      <View
        testID="restaurant-photo-viewport"
        style={styles.viewport}
        onLayout={({ nativeEvent }) => {
          setWidth(nativeEvent.layout.width);
          scroll.current?.scrollTo({ x: index * nativeEvent.layout.width, animated: false });
        }}
      >
        {width > 0 && (
          <ScrollView
            ref={scroll}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            testID="restaurant-photo-carousel"
            onMomentumScrollEnd={({ nativeEvent }) =>
              setIndex(
                Math.max(
                  0,
                  Math.min(photos.length - 1, Math.round(nativeEvent.contentOffset.x / width)),
                ),
              )
            }
          >
            {photos.map((source, photoIndex) => (
              <Image
                key={photoIndex}
                source={source}
                style={[styles.image, { width }]}
                contentFit="cover"
                accessibilityLabel={`Foto ${photoIndex + 1} de ${photos.length} de ${name}`}
              />
            ))}
          </ScrollView>
        )}
      </View>
      {photos.length > 1 && (
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Foto anterior"
            disabled={index === 0}
            onPress={() => goTo(index - 1)}
            style={[styles.button, index === 0 && styles.disabled]}
          >
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <View style={styles.dots}>
            {photos.map((_, photoIndex) => (
              <Pressable
                key={photoIndex}
                accessibilityRole="button"
                accessibilityLabel={`Mostrar foto ${photoIndex + 1}`}
                accessibilityState={{ selected: index === photoIndex }}
                onPress={() => goTo(photoIndex)}
                style={styles.dotTarget}
              >
                <View style={[styles.dot, index === photoIndex && styles.activeDot]} />
              </Pressable>
            ))}
          </View>
          <Text style={typography.caption} accessibilityLiveRegion="polite">
            {index + 1}/{photos.length}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Próxima foto"
            disabled={index === photos.length - 1}
            onPress={() => goTo(index + 1)}
            style={[styles.button, index === photos.length - 1 && styles.disabled]}
          >
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', gap: spacing.xs },
  viewport: {
    height: layout.restaurants.detailImageHeight,
    borderRadius: radius.image,
    overflow: 'hidden',
    backgroundColor: colors.chipInactive,
  },
  image: { height: layout.restaurants.detailImageHeight, alignSelf: 'stretch' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  arrow: { ...typography.headerTitle, fontSize: 30 },
  disabled: { opacity: 0.3 },
  dots: { flexDirection: 'row' },
  dotTarget: { width: 28, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textPlaceholder },
  activeDot: { backgroundColor: colors.primary, width: 9, height: 9, borderRadius: 5 },
});
