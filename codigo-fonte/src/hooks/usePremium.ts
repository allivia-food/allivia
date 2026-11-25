import { AppState } from 'react-native';
import { hasPremium } from '@/features/premium/plans';
import { useEffect, useState } from 'react';

import type { PlanId } from '@/features/premium/plans';
import { renewIfDue } from '@/services/subscription';
import { useProfileStore } from '@/store/profile';

export function usePremium(): { isPremium: boolean; plan: PlanId | null; renewsAt: string | null } {
  const [now, setNow] = useState(() => new Date());
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const subscription = profile?.subscription ?? null;
  const userId = profile?.id;

  useEffect(() => {
    if (!userId || !subscription) return;
    const pending = renewIfDue(userId, subscription);
    if (!pending) return;
    let active = true;
    pending
      .then((saved) => {
        if (active && useProfileStore.getState().profile?.id === saved.id) setProfile(saved);
      })
      .catch((error: unknown) => {
        if (__DEV__) console.warn('[premium] simulated renewal failed', error);
      });
    return () => {
      active = false;
    };
  }, [userId, subscription, setProfile]);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const remaining =
      subscription?.status === 'canceled' ? Date.parse(subscription.renewsAt) - Date.now() : NaN;
    const timer =
      Number.isFinite(remaining) && remaining > 0
        ? setTimeout(refresh, Math.min(remaining, 2147483647))
        : undefined;
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      if (timer) clearTimeout(timer);
      listener.remove();
    };
  }, [subscription, now]);
  return {
    isPremium: hasPremium(profile, now),
    plan: subscription?.plan ?? null,
    renewsAt: subscription?.renewsAt ?? null,
  };
}
