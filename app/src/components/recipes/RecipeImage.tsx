import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui';
import { colors, radius, sizes } from '@/theme';

export interface RecipeImageProps {
  uri: string | null;
  style?: StyleProp<ViewStyle>;
}

export function RecipeImage({ uri, style }: RecipeImageProps) {
  return (
    <View style={[styles.box, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <Icon name="plate" size={sizes.iconBadgeMedium} color={colors.textPlaceholder} />
      )}
    </View>
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
