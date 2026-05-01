import {useCallback} from 'react';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface UseRacEditorSettingsActionsArgs {
  setShowZoomControls: (show: boolean) => void;
}

/**
 * Coordena efeitos derivados de alterações nas configurações do editor.
 */
export function useRacEditorSettingsActions({
  setShowZoomControls,
}: UseRacEditorSettingsActionsArgs) {
  const {houseWritePort, settingsPort} = useEditorPorts();

  const handleSettingsChange = useCallback(() => {
    const settings = settingsPort.getSettings();
    setShowZoomControls(settings.zoomEnabledByDefault);
    houseWritePort.refreshAutoStairsForCurrentSettings();
  }, [houseWritePort, settingsPort, setShowZoomControls]);

  return {handleSettingsChange};
}
