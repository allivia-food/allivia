import * as Linking from 'expo-linking';
import { StyleSheet, Text } from 'react-native';

import { TextScreen } from '@/components/feature/TextScreen';
import { HELP_EMERGENCY, HELP_HEALTH_NOTE, HELP_TEXT, HELP_TITLE } from '@/constants/legal';
import { strings } from '@/constants/strings';
import { colors, typography } from '@/theme';

const t = strings.help;

export default function HelpScreen() {
  return (
    <TextScreen title={t.title} icon="help" iconTone="green" paragraphs={[]}>
      <Text style={typography.sectionTitle}>{HELP_TITLE}</Text>
      {HELP_TEXT.map((p) => (
        <Text key={p} style={typography.subtitle}>
          {p}
        </Text>
      ))}
      <Text
        style={styles.email}
        onPress={() => void Linking.openURL(`mailto:${t.email}`)}
        accessibilityRole="link"
      >
        {t.email}
      </Text>
      <Text style={typography.subtitle}>{HELP_HEALTH_NOTE}</Text>
      <Text style={[typography.subtitle, styles.emergency]}>{HELP_EMERGENCY}</Text>
    </TextScreen>
  );
}

const styles = StyleSheet.create({
  email: { ...typography.link, color: colors.primary },
  emergency: { color: colors.error },
});
