import {useCallback} from 'react';
import {getSettings} from '@/infra/settings.ts';
import {legacyHouseWritePort} from '@/infra/house/legacy-house-write-adapter.ts';

interface UseRacEditorSettingsActionsArgs {
  setShowZoomControls: (show: boolean) => void;
}

/**
 * Coordena efeitos derivados de alterações nas configurações do editor.
 */
export function useRacEditorSettingsActions({
  setShowZoomControls,
}: UseRacEditorSettingsActionsArgs) {
  const handleSettingsChange = useCallback(() => {
    const settings = getSettings();
    setShowZoomControls(settings.zoomEnabledByDefault);
    legacyHouseWritePort.refreshAutoStairsForCurrentSettings();
  }, [setShowZoomControls]);

  return {handleSettingsChange};
}
