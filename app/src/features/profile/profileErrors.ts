import { isAuthError } from '@supabase/supabase-js';

import { strings } from '@/constants/strings';
import { authErrorKind } from '@/features/auth/authErrors';

export type ProfileErrorContext = 'save' | 'account' | 'delete';

const t = strings.profileErrors;

export function profileErrorMessage(error: unknown, context: ProfileErrorContext): string {
  if (isAuthError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return t.wrongPassword;
      case 'reauthentication_needed':
        return t.reauthNeeded;
      case 'email_exists':
      case 'user_already_exists':
        return t.emailInUse;
      case 'weak_password':
        return strings.authErrors.weakPassword;
    }
  }
  const kind = authErrorKind(error);
  if (kind === 'network') return strings.common.networkError;
  if (kind === 'rateLimited') return strings.authErrors.rateLimited;
  if (context === 'save') return t.saveFailed;
  if (context === 'delete') return t.deleteFailed;
  return strings.common.unknownError;
}
