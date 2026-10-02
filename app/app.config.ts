import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || undefined;
  return {
    ...(config as ExpoConfig),
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'O Allivia usa sua localização só no aparelho, para mostrar restaurantes por perto.',
        },
      ],
      [
        'react-native-maps',
        mapsKey ? { androidGoogleMapsApiKey: mapsKey, iosGoogleMapsApiKey: mapsKey } : {},
      ],
    ],
  };
};
