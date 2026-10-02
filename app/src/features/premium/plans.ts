export type PlanId = 'annual' | 'monthly';

export interface Subscription {
  plan: PlanId;
  status: 'active' | 'canceled';
  simulated: true;
  startedAt: string;
  renewsAt: string;
  priceCents: number;
}

export const PLAN_PRICE_CENTS: Record<PlanId, number> = { annual: 4990, monthly: 990 };
export const DEFAULT_PLAN: PlanId = 'annual';

export const isPlanId = (value: unknown): value is PlanId =>
  value === 'annual' || value === 'monthly';

export function addPeriod(date: Date, plan: PlanId): Date {
  const next = new Date(date);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  if (plan === 'annual') next.setUTCFullYear(next.getUTCFullYear() + 1);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

export function newSubscription(plan: PlanId, now = new Date()): Subscription {
  return {
    plan,
    status: 'active',
    simulated: true,
    startedAt: now.toISOString(),
    renewsAt: addPeriod(now, plan).toISOString(),
    priceCents: PLAN_PRICE_CENTS[plan],
  };
}

export function renewedSubscription(sub: Subscription, now = new Date()): Subscription | null {
  if (sub.status !== 'active') return null;
  let renewsAt = new Date(sub.renewsAt);
  if (Number.isNaN(renewsAt.getTime()) || renewsAt > now) return null;
  while (renewsAt <= now) renewsAt = addPeriod(renewsAt, sub.plan);
  return { ...sub, renewsAt: renewsAt.toISOString() };
}
