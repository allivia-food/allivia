import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';

import { AuthLayout } from '@/components/feature/AuthLayout';
import { Button } from '@/components/ui';
import { strings } from '@/constants/strings';
import { colors, layout, typography } from '@/theme';

const t = strings.requestSent;

function backToLogin() {
  router.dismissTo('/login');
}

export default function RequestSentScreen() {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        backToLogin();
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  return (
    <AuthLayout title={t.title}>
      <Text style={styles.message} accessibilityLiveRegion="polite">
        {t.message}
      </Text>
      <View style={styles.actions}>
        <Button label={t.backToLogin} onPress={backToLogin} testID="request-sent-back" />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  message: { ...typography.authTitle, color: colors.textOnPrimary },
  actions: { marginTop: layout.auth.linkToButton },
});
