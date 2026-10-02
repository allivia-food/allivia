import {
  newSubscription,
  renewedSubscription,
  type PlanId,
  type Subscription,
} from '@/features/premium/plans';

import { saveSubscription, type Profile } from './profile';

export function subscribeSimulated(
  userId: string,
  plan: PlanId,
  now = new Date(),
): Promise<Profile> {
  return saveSubscription(userId, true, newSubscription(plan, now));
}

export function renewIfDue(
  userId: string,
  subscription: Subscription,
  now = new Date(),
): Promise<Profile> | null {
  const renewed = renewedSubscription(subscription, now);
  return renewed ? saveSubscription(userId, true, renewed) : null;
}
