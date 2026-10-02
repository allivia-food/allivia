export const colors = {
  primary: '#F68424',
  secondary: '#4C532F',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceGreen: '#EFFFE0',
  surfaceOrange: '#FFF2E6',
  chipInactive: '#E5E5EA',
  textPrimary: '#000000',
  textSecondary: '#757575',
  textPlaceholder: '#9F9F9F',
  textOnPrimary: '#FFFFFF',
  border: '#9F9F9F',
  success: '#4C532F',
  warning: '#F68424',
  error: '#E90000',
  overlay: 'rgba(0, 0, 0, 0.3)',
  tipBackground: 'rgba(239, 255, 224, 0.85)',
  cameraBackground: '#000000',
  closeIcon: '#9F9F9F',
  mapUser: '#2F80ED',
} as const;

export type ColorToken = keyof typeof colors;
