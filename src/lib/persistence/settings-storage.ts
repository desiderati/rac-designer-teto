const SETTINGS_STORAGE_KEY = "rac-settings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readSettingsStorage<T extends object>(defaults: T): T {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {...defaults};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {...defaults};
    return {...defaults, ...parsed};
  } catch {
    return {...defaults};
  }
}

export function writeSettingsStorage<T extends object>(value: T): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
}
