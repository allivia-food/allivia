import { StateView } from '@/components/ui';
import { strings } from '@/constants/strings';
import { retrySession } from '@/features/auth/sessionListener';

export function ProfileMissing() {
  return (
    <StateView
      variant="error"
      message={strings.profileErrors.saveFailed}
      onRetry={() => void retrySession()}
    />
  );
}
