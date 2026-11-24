import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      package: process.env.ANDROID_APP_ID || config.android?.package || 'com.allivia.app',
      versionCode: config.android?.versionCode ?? 1,
      softwareKeyboardLayoutMode: 'resize',
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-image-picker',
        {
          photosPermission: 'Permita acesso às fotos para escolher sua foto de perfil.',
          cameraPermission: 'Permita usar a câmera para sua foto de perfil.',
          microphonePermission: false,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'O Allivia usa sua localização para mostrar restaurantes por perto. Você também pode informar um endereço.',
        },
      ],
    ],
  };
};
