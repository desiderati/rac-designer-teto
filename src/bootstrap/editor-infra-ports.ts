import {getSettings, updateSetting} from '@/components/rac-editor/store/editor-settings.ts';
import type {EditorSettingsPort} from '@/components/rac-editor/ports/EditorSettingsPort.ts';

export function createDefaultEditorSettingsPort(): EditorSettingsPort {
  return {
    getSettings,
    updateSetting,
  };
}
