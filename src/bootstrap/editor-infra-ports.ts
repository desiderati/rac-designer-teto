import {getSettings, updateSetting} from '@/infra/settings.ts';
import {
  isPilotiTutorialShown,
  isTutorialCompleted,
  isTutorialTipShown,
  markPilotiTutorialShown,
  markTutorialCompleted,
  markTutorialTipShown,
  resetTutorialProgress,
} from '@/infra/storage/tutorial.storage.ts';
import type {EditorSettingsPort} from '@/components/rac-editor/ports/EditorSettingsPort.ts';
import type {TutorialProgressPort} from '@/components/rac-editor/ports/TutorialProgressPort.ts';

export function createDefaultEditorSettingsPort(): EditorSettingsPort {
  return {
    getSettings,
    updateSetting,
  };
}

export function createDefaultTutorialProgressPort(): TutorialProgressPort {
  return {
    isTutorialCompleted,
    markTutorialCompleted,
    isPilotiTutorialShown,
    markPilotiTutorialShown,
    isTutorialTipShown,
    markTutorialTipShown,
    resetTutorialProgress,
  };
}
