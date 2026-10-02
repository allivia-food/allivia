import type { TextStyle } from 'react-native';

import { colors } from './colors';

export const fontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
} as const;

export const typography = {
  screenTitle: { fontFamily: fontFamily.extraBold, fontSize: 25, color: colors.primary },
  headerTitle: { fontFamily: fontFamily.extraBold, fontSize: 20, color: colors.secondary },
  subtitle: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.textPrimary },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.textPrimary },
  body: { fontFamily: fontFamily.regular, fontSize: 15, color: colors.textPrimary },
  bodySmall: { fontFamily: fontFamily.semiBold, fontSize: 13, color: colors.textPrimary },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.textPrimary },
  input: { fontFamily: fontFamily.semiBold, fontSize: 17, color: colors.textPrimary },
  buttonLarge: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.textOnPrimary },
  buttonSmall: { fontFamily: fontFamily.extraBold, fontSize: 13, color: colors.textOnPrimary },
  chip: { fontFamily: fontFamily.extraBold, fontSize: 13 },
  link: {
    fontFamily: fontFamily.extraBold,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  tabLabel: { fontFamily: fontFamily.bold, fontSize: 15 },
  formTitle: { fontFamily: fontFamily.extraBold, fontSize: 25, color: colors.secondary },
  stepLabel: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.primary },
  tileLabel: { fontFamily: fontFamily.semiBold, fontSize: 20 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 15, color: colors.textPrimary },
  bannerTitle: { fontFamily: fontFamily.extraBold, fontSize: 13 },
  textButton: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.primary },
  authTitle: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.textOnPrimary },
  fieldError: { fontFamily: fontFamily.semiBold, fontSize: 13, color: colors.error },
  sectionTitleAccent: { fontFamily: fontFamily.extraBold, fontSize: 16, color: colors.primary },
  optionLabel: { fontFamily: fontFamily.bold, fontSize: 15, color: colors.textPrimary },
  successTitle: { fontFamily: fontFamily.bold, fontSize: 25, color: colors.textPrimary },
  bodyLarge: { fontFamily: fontFamily.semiBold, fontSize: 17, color: colors.textPrimary },
  categoryLabel: { fontFamily: fontFamily.extraBold, fontSize: 12, color: colors.textPrimary },
  searchText: { fontFamily: fontFamily.semiBold, fontSize: 12, color: colors.textPrimary },
  footnote: { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.textPlaceholder },
} satisfies Record<string, TextStyle>;
