import {
  hasPremium,
  addPeriod,
  newSubscription,
  renewedSubscription,
} from '@/features/premium/plans';

const now = new Date('2026-10-01T12:00:00Z');

describe('simulated subscription', () => {
  it('annual: 149,90 for 1 year; monthly: 14,90 for 1 month', () => {
    expect(newSubscription('annual', now)).toEqual({
      plan: 'annual',
      status: 'active',
      simulated: true,
      startedAt: '2026-10-01T12:00:00.000Z',
      renewsAt: '2027-10-01T12:00:00.000Z',
      priceCents: 14990,
    });
    expect(newSubscription('monthly', now)).toMatchObject({
      renewsAt: '2026-11-01T12:00:00.000Z',
      priceCents: 1490,
    });
  });

  it('end of month is clamped', () => {
    expect(addPeriod(new Date('2027-01-31T10:00:00Z'), 'monthly').toISOString()).toBe(
      '2027-02-28T10:00:00.000Z',
    );
  });

  it('renews automatically when the date has passed (nothing is charged)', () => {
    const sub = newSubscription('monthly', new Date('2026-07-15T00:00:00Z'));
    expect(renewedSubscription(sub, now)?.renewsAt).toBe('2026-10-15T00:00:00.000Z');
    expect(renewedSubscription(newSubscription('annual', now), now)).toBeNull();
    expect(renewedSubscription({ ...sub, status: 'canceled' }, now)).toBeNull();
  });
});

describe('scheduled downgrade', () => {
  const subscription = { ...newSubscription('monthly', now), status: 'canceled' as const };
  it('keeps access before expiry and removes it exactly at expiry', () => {
    expect(hasPremium({ isPremium: true, subscription }, now)).toBe(true);
    expect(hasPremium({ isPremium: true, subscription }, new Date(subscription.renewsAt))).toBe(
      false,
    );
  });
  it('does not renew a canceled subscription', () => {
    expect(renewedSubscription(subscription, new Date('2030-01-01'))).toBeNull();
  });
  it('supports legacy Premium and free profiles', () => {
    expect(hasPremium({ isPremium: true }, now)).toBe(true);
    expect(hasPremium({ isPremium: false, subscription }, now)).toBe(false);
  });
});
