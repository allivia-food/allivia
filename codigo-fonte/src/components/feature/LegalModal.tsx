import { StyleSheet, Text } from 'react-native';

import { Modal } from '@/components/ui';
import { images } from '@/constants/icons';
import { PRIVACY_TEXT, TERMS_TEXT } from '@/constants/legal';
import { strings } from '@/constants/strings';
import { spacing, typography } from '@/theme';

export type LegalDocument = 'terms' | 'privacy';

export interface LegalModalProps {
  document: LegalDocument | null;
  onClose: () => void;
}

export function LegalModal({ document, onClose }: LegalModalProps) {
  const isTerms = document === 'terms';
  const paragraphs = isTerms ? TERMS_TEXT : PRIVACY_TEXT;
  return (
    <Modal
      visible={document !== null}
      onClose={onClose}
      title={isTerms ? strings.register.termsTitle : strings.register.privacyTitle}
      illustration={isTerms ? images.terms : images.privacy}
      testID="legal-modal"
    >
      {paragraphs.map((p) => (
        <Text key={p} style={[typography.subtitle, styles.paragraph]}>
          {p}
        </Text>
      ))}
    </Modal>
  );
}

const styles = StyleSheet.create({
  paragraph: { marginBottom: spacing.sm },
});
