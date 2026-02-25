import {STORAGE_KEYS} from '@/config.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readSettingsStorage<T extends object>(defaults: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return {...defaults};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {...defaults};
    return {...defaults, ...parsed};
  } catch {
    return {...defaults};
  }
}

export function writeSettingsStorage<T extends object>(value: T): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(value));
}
