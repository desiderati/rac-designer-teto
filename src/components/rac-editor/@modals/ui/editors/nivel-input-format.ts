export function sanitizeNivelInputDigits(value: string): string {
  return value.replace(/\D/g, '').slice(-3);
}

export function nivelToInputDigits(nivel: number): string {
  if (!Number.isFinite(nivel)) return '000';
  return String(Math.round(nivel * 100)).padStart(3, '0').slice(-3);
}

export function nivelInputDigitsToValue(digits: string): number {
  const sanitized = sanitizeNivelInputDigits(digits);
  return Number(sanitized || 0) / 100;
}

export function formatNivelInputDigits(digits: string): string {
  const normalized = sanitizeNivelInputDigits(digits).padStart(3, '0');
  return `${normalized.slice(0, -2)},${normalized.slice(-2)}`;
}
