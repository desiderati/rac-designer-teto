import {getSettings, updateSetting} from '@/components/rac-editor/store/editor-settings.ts';
import type {SettingsPort} from '@/components/rac-editor/ports/SettingsPort.ts';

export function createDefaultSettingsPort(): SettingsPort {
  return {
    getSettings,
    updateSetting,
  };
}
