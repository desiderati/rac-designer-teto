const STORAGE_KEY = 'rac-settings';

export interface AppSettings {
  autoNavigatePiloti: boolean;
  zoomEnabledByDefault: boolean;
}

const defaults: AppSettings = {
  autoNavigatePiloti: true,
  zoomEnabledByDefault: false,
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

export function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  const current = getSettings();
  current[key] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}
