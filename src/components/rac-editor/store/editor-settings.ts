import {
  readEditorSettingsStorage,
  writeEditorSettingsStorage,
} from '@/components/rac-editor/store/editor-settings-storage.ts';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';
import type {AppSettings} from '@/shared/types/settings.ts';

const DEFAULT_SETTINGS: AppSettings = {...APP_SETTINGS_DEFAULTS};

export function getSettings(): AppSettings {
  return readEditorSettingsStorage(DEFAULT_SETTINGS);
}

export function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  const nextSettings: AppSettings = {
    ...getSettings(),
    [key]: value,
  };
  try {
    writeEditorSettingsStorage(nextSettings);
  } catch {
    // Keep UI usable when storage writes fail (quota/private mode/etc).
  }
}
