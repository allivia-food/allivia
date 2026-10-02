import { TextScreen } from '@/components/feature/TextScreen';
import { PRIVACY_TEXT } from '@/constants/legal';
import { strings } from '@/constants/strings';

export default function PrivacyScreen() {
  return <TextScreen title={strings.profile.privacy} icon="lock" paragraphs={PRIVACY_TEXT} />;
}
