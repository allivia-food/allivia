import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

import { icons, type IconName } from '@/constants/icons';
import { sizes } from '@/theme';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
}

export function Icon({ name, size = sizes.icon, color, style }: IconProps) {
  return (
    <Image
      source={icons[name]}
      style={[{ width: size, height: size }, style]}
      tintColor={color ?? null}
      contentFit="contain"
      accessible={false}
    />
  );
}
