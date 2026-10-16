import {useCallback, useState} from 'react';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {APP_SETTINGS_DEFAULTS} from '@/shared/config.ts';

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
  const [showToolMenuLabels, setShowToolMenuLabels] = useState(() => settingsPort.getSettings().showToolMenuLabels ?? APP_SETTINGS_DEFAULTS.showToolMenuLabels);

  const handleSettingsChange = useCallback(() => {
    const settings = settingsPort.getSettings();
    setShowZoomControls(settings.zoomEnabledByDefault);
    setShowToolMenuLabels(settings.showToolMenuLabels ?? APP_SETTINGS_DEFAULTS.showToolMenuLabels);
    houseWritePort.refreshAutoStairsForCurrentSettings();
    houseWritePort.refreshPilotiNameLabelsForCurrentSettings();
    houseWritePort.refreshElevationNivelLabelsForCurrentSettings();
  }, [houseWritePort, settingsPort, setShowZoomControls]);

  return {handleSettingsChange, showToolMenuLabels};
}
