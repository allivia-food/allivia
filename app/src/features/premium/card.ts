export const CARD_MIN_DIGITS = 13;
export const CARD_MAX_DIGITS = 19;
export const DECLINE_TEST_CARD = '4000000000000002';

export type PaymentMethod = 'card' | 'pix' | 'boleto';
export type PaymentOutcome = 'approved' | 'declined';

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

export function formatCardNumber(value: string): string {
  return onlyDigits(value)
    .slice(0, CARD_MAX_DIGITS)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(value: string): string {
  const digits = onlyDigits(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function passesLuhn(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function isValidCardNumber(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length >= CARD_MIN_DIGITS && digits.length <= CARD_MAX_DIGITS && passesLuhn(digits);
}

export function isValidExpiry(value: string, now = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export const cvvLength = (cardNumber: string) => (/^3[47]/.test(onlyDigits(cardNumber)) ? 4 : 3);

export function isValidCvv(cvv: string, cardNumber: string): boolean {
  return new RegExp(`^\\d{${cvvLength(cardNumber)}}$`).test(cvv);
}

export interface CardFields {
  number: string;
  expiry: string;
  cvv: string;
}

export interface CardErrors {
  number: boolean;
  expiry: boolean;
  cvv: boolean;
}

export function cardErrors(card: CardFields, now = new Date()): CardErrors {
  return {
    number: !isValidCardNumber(card.number),
    expiry: !isValidExpiry(card.expiry, now),
    cvv: !isValidCvv(card.cvv, card.number),
  };
}

export const isCardValid = (card: CardFields, now = new Date()) =>
  !Object.values(cardErrors(card, now)).some(Boolean);

export function simulatePayment(method: PaymentMethod, cardNumber = ''): PaymentOutcome {
  if (method !== 'card') return 'approved';
  return onlyDigits(cardNumber) === DECLINE_TEST_CARD ? 'declined' : 'approved';
}
