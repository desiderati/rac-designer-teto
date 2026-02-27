import {readSettingsStorage, writeSettingsStorage} from '@/infra/storage/settings.storage.ts';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';

export interface AppSettings {
  autoNavigatePiloti: boolean;
  zoomEnabledByDefault: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {...APP_SETTINGS_DEFAULTS};

export function getSettings(): AppSettings {
  return readSettingsStorage(DEFAULT_SETTINGS);
}

export function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  const nextSettings: AppSettings = {
    ...getSettings(),
    [key]: value,
  };
  try {
    writeSettingsStorage(nextSettings);
  } catch {
    // Keep UI usable when storage writes fail (quota/private mode/etc).
  }
}
