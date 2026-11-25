import { Banner } from '@/components/ui';
import { strings } from '@/constants/strings';

export function DemoNotice() {
  return (
    <Banner variant="info" icon="lock" title={strings.premium.demoNotice} testID="demo-notice" />
  );
}
