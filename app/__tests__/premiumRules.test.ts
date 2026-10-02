import {
  cardErrors,
  cvvLength,
  DECLINE_TEST_CARD,
  formatCardNumber,
  formatExpiry,
  isCardValid,
  isValidCardNumber,
  isValidCvv,
  isValidExpiry,
  passesLuhn,
  simulatePayment,
} from '@/features/premium/card';
import { addPeriod, newSubscription, renewedSubscription } from '@/features/premium/plans';

const now = new Date('2026-10-01T12:00:00Z');

describe('card number (13 to 19 digits + Luhn)', () => {
  it.each([
    ['4111 1111 1111 1111', true],
    ['5555 5555 5555 4444', true],
    ['3782 822463 10005', true],
    ['4222222222222', true],
    ['6011 1111 1111 1117', true],
    ['4000 0000 0000 0002', true],
    ['4111 1111 1111 1112', false],
    ['1234 5678 9012 3456', false],
    ['4111 1111 1111', false],
    ['4111111111111111111', false],
    ['', false],
    ['abcd efgh ijkl mnop', false],
  ])('%s → %s', (number, valid) => {
    expect(isValidCardNumber(number)).toBe(valid);
  });

  it('Luhn alone', () => {
    expect(passesLuhn('79927398713')).toBe(true);
    expect(passesLuhn('79927398710')).toBe(false);
  });

  it('mask groups of 4 and keeps at most 19 digits', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
    expect(formatCardNumber('41a1-1')).toBe('4111');
    expect(formatCardNumber('1'.repeat(25)).replace(/ /g, '')).toHaveLength(19);
  });
});

describe('expiry (MM/AA, not expired)', () => {
  it.each([
    ['10/26', true],
    ['12/26', true],
    ['01/30', true],
    ['09/26', false],
    ['12/25', false],
    ['00/27', false],
    ['13/27', false],
    ['1/27', false],
    ['', false],
  ])('%s → %s', (value, valid) => {
    expect(isValidExpiry(value, now)).toBe(valid);
  });

  it('mask MM/AA', () => {
    expect(formatExpiry('1228')).toBe('12/28');
    expect(formatExpiry('12')).toBe('12');
    expect(formatExpiry('12/2899')).toBe('12/28');
  });
});

describe('CVV', () => {
  it.each([
    ['123', '4111 1111 1111 1111', true],
    ['12', '4111 1111 1111 1111', false],
    ['1234', '4111 1111 1111 1111', false],
    ['1234', '3782 822463 10005', true],
    ['123', '3782 822463 10005', false],
    ['12a', '4111 1111 1111 1111', false],
  ])('%s with %s → %s', (cvv, number, valid) => {
    expect(isValidCvv(cvv, number)).toBe(valid);
  });

  it('length follows the card number', () => {
    expect(cvvLength('34')).toBe(4);
    expect(cvvLength('37')).toBe(4);
    expect(cvvLength('36')).toBe(3);
  });
});

describe('form and simulated result', () => {
  const valid = { number: '4111 1111 1111 1111', expiry: '12/28', cvv: '123' };

  it('the confirm button needs the three fields valid', () => {
    expect(isCardValid(valid, now)).toBe(true);
    expect(cardErrors({ ...valid, cvv: '1' }, now)).toEqual({
      number: false,
      expiry: false,
      cvv: true,
    });
    expect(isCardValid({ number: '', expiry: '', cvv: '' }, now)).toBe(false);
  });

  it('the test card declines; any other valid card, Pix and boleto approve', () => {
    expect(DECLINE_TEST_CARD).toBe('4000000000000002');
    expect(simulatePayment('card', '4000 0000 0000 0002')).toBe('declined');
    expect(simulatePayment('card', valid.number)).toBe('approved');
    expect(simulatePayment('pix')).toBe('approved');
    expect(simulatePayment('boleto')).toBe('approved');
  });
});

describe('simulated subscription', () => {
  it('annual: 49,90 for 1 year; monthly: 9,90 for 1 month', () => {
    expect(newSubscription('annual', now)).toEqual({
      plan: 'annual',
      status: 'active',
      simulated: true,
      startedAt: '2026-10-01T12:00:00.000Z',
      renewsAt: '2027-10-01T12:00:00.000Z',
      priceCents: 4990,
    });
    expect(newSubscription('monthly', now)).toMatchObject({
      renewsAt: '2026-11-01T12:00:00.000Z',
      priceCents: 990,
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
