import type { ReactNode } from 'react';
import {
  Modal as NativeModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  Image,
} from 'react-native';

import { strings } from '@/constants/strings';
import { colors, radius, sizes, spacing, typography } from '@/theme';

import { IconButton } from './IconButton';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  illustration?: ImageSourcePropType;
  children: ReactNode;
  variant?: 'center' | 'sheet';
  testID?: string;
}

export function Modal({
  visible,
  onClose,
  title,
  illustration,
  children,
  variant = 'center',
  testID,
}: ModalProps) {
  return (
    <NativeModal
      visible={visible}
      transparent
      animationType={variant === 'sheet' ? 'slide' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
      testID={testID}
    >
      <View style={[styles.overlay, variant === 'sheet' && styles.overlaySheet]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={strings.common.close}
          testID={testID ? `${testID}-backdrop` : 'modal-backdrop'}
        />
        <View
          style={[styles.card, variant === 'sheet' ? styles.sheet : styles.center]}
          accessibilityViewIsModal
        >
          <View style={styles.closeRow}>
            <IconButton
              icon="plus"
              iconSize={sizes.icon}
              color={colors.closeIcon}
              onPress={onClose}
              accessibilityLabel={strings.common.close}
              testID={testID ? `${testID}-close` : 'modal-close'}
            />
          </View>
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            {title ? (
              <Text style={[typography.formTitle, styles.title]} accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {illustration ? (
              <Image source={illustration} style={styles.illustration} resizeMode="contain" />
            ) : null}
            {children}
          </ScrollView>
        </View>
      </View>
    </NativeModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.modalHorizontal,
  },
  overlaySheet: { justifyContent: 'flex-end', paddingHorizontal: 0 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: sizes.border,
    borderColor: colors.primary,
    maxHeight: sizes.modalMaxHeight,
  },
  center: { borderRadius: radius.modal },
  sheet: { borderTopLeftRadius: radius.modal, borderTopRightRadius: radius.modal },
  closeRow: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 1,
    transform: [{ rotate: '45deg' }],
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: { textAlign: 'center', paddingHorizontal: spacing.xxl },
  illustration: { alignSelf: 'center', width: sizes.iconBadgeLarge, height: sizes.iconBadgeLarge },
});
