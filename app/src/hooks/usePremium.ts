import { useEffect } from 'react';

import type { PlanId } from '@/features/premium/plans';
import { renewIfDue } from '@/services/subscription';
import { useProfileStore } from '@/store/profile';

export function usePremium(): { isPremium: boolean; plan: PlanId | null; renewsAt: string | null } {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const subscription = profile?.subscription ?? null;
  const userId = profile?.id;

  useEffect(() => {
    if (!userId || !subscription) return;
    const pending = renewIfDue(userId, subscription);
    if (!pending) return;
    pending.then(setProfile).catch((error: unknown) => {
      if (__DEV__) console.warn('[premium] simulated renewal failed', error);
    });
  }, [userId, subscription, setProfile]);

  return {
    isPremium: profile?.isPremium ?? false,
    plan: subscription?.plan ?? null,
    renewsAt: subscription?.renewsAt ?? null,
  };
}
