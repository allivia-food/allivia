export const MANUAL_MIN_DIGITS = 8;
export const MANUAL_MAX_DIGITS = 14;
export const DUPLICATE_WINDOW_MS = 3000;

export function hasValidGtinCheckDigit(code: string): boolean {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop() as number;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export function expandUpcE(code: string): string | null {
  if (!/^[01]\d{7}$/.test(code)) return null;
  const ns = code[0];
  const d = code.slice(1, 7);
  const check = code[7];
  const last = d[5];
  let body: string;
  if (last === '0' || last === '1' || last === '2')
    body = `${d[0]}${d[1]}${last}0000${d[2]}${d[3]}${d[4]}`;
  else if (last === '3') body = `${d[0]}${d[1]}${d[2]}00000${d[3]}${d[4]}`;
  else if (last === '4') body = `${d[0]}${d[1]}${d[2]}${d[3]}00000${d[4]}`;
  else body = `${d[0]}${d[1]}${d[2]}${d[3]}${d[4]}0000${last}`;
  return `${ns}${body}${check}`;
}

export type ScannedType = 'ean13' | 'ean8' | 'upc_a' | 'upc_e' | string;

export function isValidScannedBarcode(code: string, type: ScannedType): boolean {
  if (type === 'upc_e') {
    const expanded = expandUpcE(code);
    return expanded !== null && hasValidGtinCheckDigit(expanded);
  }
  return hasValidGtinCheckDigit(code);
}

export function normalizeManualBarcode(value: string): string | null {
  const code = value.replace(/\s+/g, '');
  if (code.length < MANUAL_MIN_DIGITS || code.length > MANUAL_MAX_DIGITS) return null;
  if (hasValidGtinCheckDigit(code)) return code;
  const expanded = code.length === 8 ? expandUpcE(code) : null;
  return expanded && hasValidGtinCheckDigit(expanded) ? code : null;
}

export interface LastRead {
  code: string;
  at: number;
}

export function isDuplicateRead(code: string, now: number, last: LastRead | null): boolean {
  return last !== null && last.code === code && now - last.at < DUPLICATE_WINDOW_MS;
}
