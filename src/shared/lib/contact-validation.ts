const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGIT_COUNT = 11;

export const PHONE_MASK_MAX_LENGTH = 15;

export function formatPhoneInput(value: string): string {
  const digits = getPhoneDigits(value).slice(0, PHONE_DIGIT_COUNT);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function hasValidOptionalPhone(value: string): boolean {
  const digits = getPhoneDigits(value);
  return digits.length === 0 || digits.length === PHONE_DIGIT_COUNT;
}

export function hasValidRequiredPhone(value: string): boolean {
  return getPhoneDigits(value).length === PHONE_DIGIT_COUNT;
}

export function hasValidOptionalEmail(value: string): boolean {
  return value.length === 0 || EMAIL_PATTERN.test(value);
}
