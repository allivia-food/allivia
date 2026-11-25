import { TextScreen } from '@/components/feature/TextScreen';
import { TERMS_TEXT } from '@/constants/legal';
import { strings } from '@/constants/strings';

export default function TermsScreen() {
  return <TextScreen title={strings.profile.terms} icon="shieldCheck" paragraphs={TERMS_TEXT} />;
}
